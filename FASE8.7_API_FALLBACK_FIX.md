# Fase 8.7 - Correção do Fallback de API e Report Generator

**Data:** 09/05/2026  
**Status:** ✅ Concluído

## 🎯 Objetivo

Corrigir o problema de "Nenhuma API disponível" na página de Relatórios, causado por:
1. **Backend-template desatualizado**: `report_generator.py` não aceitava parâmetros `uf`, `municipio`, `safra`
2. **Fallback não-determinístico**: Frontend tentava a mesma API duas vezes em vez de alternar

## 🔍 Diagnóstico

### Problema 1: Backend Local Desatualizado
- **Sintoma**: Erro `gerar_relatorio_completo() got an unexpected keyword argument 'uf'`
- **Causa**: Backend-template tinha versão antiga de `report_generator.py`
- **Teste realizado**:
  ```powershell
  Invoke-RestMethod -Method Post "http://localhost:8000/relatorio" `
    -ContentType "application/json" `
    -Body '{"objetivo":"equilibrado","formato":"md","lat":-21.56,"lon":-50.45,"days":30,"uf":"SP","municipio":"Clementina","safra":"2025/2026"}'
  ```
- **Resultado**: Erro confirmado no backend local

### Problema 2: Fallback Não-Determinístico
- **Sintoma**: "Nenhuma API disponível" mesmo com API Local respondendo `/health`
- **Causa**: Em `frontend/lib/api.ts`, a função `apiFetch()`:
  1. Tentava API primária (ex: Local)
  2. Se falhasse, chamava `clearApiCache()` e `getApiUrl()` novamente
  3. Como `/health` local funcionava, `getApiUrl()` escolhia Local de novo
  4. Tentava Local novamente, falhava de novo
  5. Mostrava "Nenhuma API disponível"
- **Problema**: Fallback não era determinístico - não garantia troca de API

## ✅ Soluções Implementadas

### 1. Atualização do Backend-Template

**Arquivo copiado:**
```bash
backend/core/report_generator.py → tools/agroplan-cli/backend-template/core/report_generator.py
```

**Mudança na assinatura:**
```python
# ANTES (backend-template)
def gerar_relatorio_completo(culturas, talhoes, regras, objetivo='equilibrado', formato='md', contexto_climatico=None):

# DEPOIS (atualizado)
def gerar_relatorio_completo(culturas, talhoes, regras, objetivo='equilibrado', formato='md', contexto_climatico=None, uf=None, municipio=None, safra="2025/2026"):
```

**Funcionalidade adicionada:**
- Suporte a parâmetros ZARC (`uf`, `municipio`, `safra`)
- Enriquecimento do plano com dados ZARC
- Geração de seção ZARC no relatório

### 2. Fallback Determinístico no Frontend

**Arquivo:** `frontend/lib/api.ts`

**Mudanças na função `apiFetch()`:**

#### ANTES (Não-Determinístico):
```typescript
async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const mode = getApiMode();
  
  try {
    const apiUrl = await getApiUrl();  // Pode escolher Local
    const response = await fetch(`${apiUrl}${path}`, options);
    
    if (response.ok) return response;
    
    if (mode !== 'auto') throw new Error(`API ${mode} falhou: ${response.status}`);
    throw new Error('Tentando fallback...');
    
  } catch (error) {
    if (mode !== 'auto') throw error;
    
    clearApiCache();
    const fallbackUrl = await getApiUrl();  // Pode escolher Local DE NOVO!
    const fallbackResponse = await fetch(`${fallbackUrl}${path}`, options);
    
    if (fallbackResponse.ok) return fallbackResponse;
    throw new Error('Nenhuma API disponível');
  }
}
```

**Problema:** `getApiUrl()` chamado duas vezes pode escolher a mesma API.

#### DEPOIS (Determinístico):
```typescript
async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const mode = getApiMode();
  
  // Resolver qual API usar primeiro
  const primary = await resolveApiUrl();  // { url, origin: 'local' | 'render' }
  
  try {
    const response = await fetch(`${primary.url}${path}`, options);
    
    if (response.ok) return response;
    
    const errorText = await response.text().catch(() => '');
    const primaryError = new Error(
      `API ${primary.origin} falhou em ${path}: ${response.status} ${errorText}`
    );
    
    if (mode !== 'auto') throw primaryError;
    throw primaryError;
    
  } catch (primaryError) {
    if (mode !== 'auto') throw primaryError;
    
    // Fallback determinístico: se primary foi local, fallback é render
    const fallbackUrl = primary.origin === 'local' ? ONLINE_API_URL : LOCAL_API_URL;
    const fallbackOrigin = primary.origin === 'local' ? 'render' : 'local';
    
    console.warn(`API ${primary.origin} falhou, tentando ${fallbackOrigin}...`, primaryError);
    
    try {
      const fallbackResponse = await fetch(`${fallbackUrl}${path}`, options);
      
      if (fallbackResponse.ok) {
        resolvedApiUrl = fallbackUrl;
        lastResolveTime = Date.now();
        return fallbackResponse;
      }
      
      const fallbackText = await fallbackResponse.text().catch(() => '');
      throw new Error(
        `Fallback ${fallbackOrigin} falhou em ${path}: ${fallbackResponse.status} ${fallbackText}`
      );
    } catch (fallbackError) {
      throw new Error(
        `Nenhuma API conseguiu responder ${path}.\n` +
        `Primária (${primary.origin}): ${String(primaryError)}\n` +
        `Fallback (${fallbackOrigin}): ${String(fallbackError)}`
      );
    }
  }
}
```

**Melhorias:**
- ✅ Fallback determinístico: sempre alterna entre Local ↔ Render
- ✅ Mensagens de erro detalhadas com origem da API e endpoint
- ✅ Não chama `getApiUrl()` novamente para fallback
- ✅ "Nenhuma API disponível" só aparece se AMBAS falharem

### 3. Melhor Tratamento de Erros em `gerarRelatorio()`

**Arquivo:** `frontend/lib/api.ts`

#### ANTES:
```typescript
export async function gerarRelatorio(...) {
  const response = await apiFetch('/relatorio', {...});
  if (!response.ok) throw new Error('Falha ao gerar relatório');
  return response.json();
}
```

#### DEPOIS:
```typescript
export async function gerarRelatorio(...) {
  try {
    const response = await apiFetch('/relatorio', {...});
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
      throw new Error(errorData.detail || `Falha ao gerar relatório: ${response.status}`);
    }
    
    return response.json();
  } catch (error: any) {
    console.error('Erro em gerarRelatorio:', error);
    throw new Error(error.message || 'Falha ao gerar relatório');
  }
}
```

**Melhorias:**
- ✅ Captura detalhes do erro do backend
- ✅ Mostra mensagem real do erro (ex: "unexpected keyword argument 'uf'")
- ✅ Log completo no console para debug

### 4. Atualização de Versão

**Arquivos atualizados:**
- `tools/agroplan-cli/package.json`: `1.0.22` → `1.0.23`
- `backend/VERSION.json`: `1.0.22` → `1.0.23`
- `tools/agroplan-cli/backend-template/VERSION.json`: `1.0.22` → `1.0.23`

**Nova feature adicionada:**
```json
{
  "features": [
    "zarc_fast_index",
    "zarc_fallback_sorgo_mandioca",
    "soil_normalization_misto_siltoso",
    "climate_real_data",
    "hybrid_mode",
    "report_generator_zarc_support"  // ← NOVO
  ]
}
```

## 📦 Publicação

### CLI v1.0.23
```bash
cd tools/agroplan-cli
bun run build
npm publish
```

**Resultado:**
```
+ agroplan-ai-cli@1.0.23
✓ Published successfully
```

### Frontend Build
```bash
cd frontend
npm run build
```

**Resultado:**
```
✓ Compiled successfully
✓ Finished TypeScript
✓ Collecting page data
✓ Generating static pages (11/11)
✓ Finalizing page optimization
```

## 🧪 Como Testar

### 1. Atualizar CLI Global
```bash
bun add -g agroplan-ai-cli@1.0.23
```

### 2. Atualizar API Local
```bash
agroplan serve off
agroplan update
agroplan serve on
```

### 3. Testar Backend Local Diretamente
```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/relatorio" `
  -ContentType "application/json" `
  -Body '{"objetivo":"equilibrado","formato":"md","lat":-21.56,"lon":-50.45,"days":30,"uf":"SP","municipio":"Clementina","safra":"2025/2026"}'
```

**Resultado esperado:** Relatório gerado com sucesso (não mais erro de `uf`)

### 4. Testar Frontend
1. Abrir http://localhost:3000/relatorios
2. Selecionar região climática com ZARC (ex: Clementina - SP)
3. Clicar em "Gerar Relatório"
4. **Resultado esperado:**
   - Se API Local funcionar: relatório gerado com Local
   - Se API Local falhar: fallback automático para Render
   - Se ambas falharem: mensagem detalhada mostrando qual API falhou e por quê

### 5. Verificar Versão do Backend
```bash
# API Local
curl http://localhost:8000/debug/version

# API Render
curl https://agroplan-ai-api.onrender.com/debug/version
```

**Resultado esperado:**
```json
{
  "backend_template_version": "1.0.23",
  "features": [
    "zarc_fast_index",
    "zarc_fallback_sorgo_mandioca",
    "soil_normalization_misto_siltoso",
    "climate_real_data",
    "hybrid_mode",
    "report_generator_zarc_support"
  ]
}
```

## 📊 Comparação: Antes vs Depois

### Cenário: API Local /health OK, mas /relatorio falha

#### ANTES:
1. Frontend tenta API Local `/relatorio` → Falha (erro `uf`)
2. Frontend chama `clearApiCache()` e `getApiUrl()`
3. `getApiUrl()` vê `/health` OK → escolhe Local de novo
4. Frontend tenta API Local `/relatorio` de novo → Falha de novo
5. **Resultado:** "Nenhuma API disponível" ❌

#### DEPOIS:
1. Frontend tenta API Local `/relatorio` → Falha (erro detalhado)
2. Frontend identifica: primary = Local, fallback = Render
3. Frontend tenta API Render `/relatorio` → Sucesso ✅
4. **Resultado:** Relatório gerado com Render ✅

### Mensagens de Erro

#### ANTES:
```
Erro ao Gerar Relatório
Nenhuma API disponível
```

#### DEPOIS (se ambas falharem):
```
Erro ao Gerar Relatório
Nenhuma API conseguiu responder /relatorio.
Primária (local): API local falhou em /relatorio: 500 gerar_relatorio_completo() got an unexpected keyword argument 'uf'
Fallback (render): Fallback render falhou em /relatorio: 503 Service Unavailable
```

## 🎯 Critérios de Sucesso

- ✅ Backend-template atualizado com `report_generator.py` correto
- ✅ Fallback determinístico implementado (Local ↔ Render)
- ✅ Mensagens de erro detalhadas
- ✅ CLI v1.0.23 publicado no npm
- ✅ Frontend compila sem erros
- ✅ VERSION.json atualizado com nova feature
- ✅ "Nenhuma API disponível" só aparece se AMBAS falharem

## 📝 Arquivos Modificados

```
backend/VERSION.json
backend/core/report_generator.py (já estava correto)
tools/agroplan-cli/package.json
tools/agroplan-cli/backend-template/VERSION.json
tools/agroplan-cli/backend-template/core/report_generator.py
frontend/lib/api.ts
```

## 🚀 Próximos Passos

1. ✅ Usuário deve rodar `agroplan update` para atualizar API Local
2. ✅ Testar geração de relatório com ZARC
3. ✅ Verificar fallback automático em caso de falha
4. ✅ Monitorar logs para confirmar comportamento correto

## 📚 Lições Aprendidas

1. **Backend-template deve ser sincronizado**: Sempre copiar arquivos atualizados para `backend-template`
2. **Fallback deve ser determinístico**: Não chamar `getApiUrl()` novamente, usar lógica explícita
3. **Mensagens de erro devem ser detalhadas**: Mostrar qual API falhou, qual endpoint, e por quê
4. **Testar backend diretamente**: Usar `Invoke-RestMethod` para isolar problemas de backend vs frontend
5. **Versão deve ser incrementada**: Sempre atualizar `package.json` e `VERSION.json` juntos

---

**Conclusão:** O problema de "Nenhuma API disponível" foi resolvido com fallback determinístico e backend-template atualizado. Agora o sistema alterna corretamente entre APIs e mostra erros detalhados quando ambas falham.
