# 🔧 Fix: API Local Desatualizada

## Problema Identificado

O frontend estava mostrando "Clima Real Desativado" mesmo com região selecionada porque:

1. **API Local desatualizada**: Backend em `C:\Users\Defal\.agroplan` estava rodando versão antiga
2. **Setup idempotente**: `agroplan setup` não sobrescreve instalação existente sem `--force`
3. **Backend-template desatualizado**: CLI v1.0.9 tinha backend sem suporte completo a clima

## Solução Implementada

### 1. Sincronização do Backend-Template ✅
```bash
# Copiado backend/api.py atualizado para backend-template
cp backend/api.py tools/agroplan-cli/backend-template/api.py
```

### 2. Atualização do Comando Doctor ✅
Adicionada detecção de backend desatualizado:
```typescript
// Verifica se tem suporte a clima real
if (data.data_mode) {
  console.log(`Data mode: ${data.data_mode}`);
  if (data.providers && data.providers.weather) {
    console.log(`Weather provider: ${data.providers.weather}`);
  }
} else {
  console.log("⚠️  Backend local desatualizado (sem suporte a clima real)");
  console.log("   Rode: agroplan setup --force");
}
```

### 3. Publicação da CLI v1.0.10 ✅
```bash
# Build e publicação
cd tools/agroplan-cli
bun run build
npm publish

# Resultado: agroplan-ai-cli@1.0.10 publicado no npm
```

### 4. Atualização Local ✅
```bash
# Atualizar CLI
bun add -g agroplan-ai-cli@latest

# Parar API antiga
agroplan serve off

# Reinstalar backend com --force
agroplan setup --force --python="C:\Users\Defal\AppData\Local\Programs\Python\Python311\python.exe"

# Iniciar API atualizada
agroplan serve on
```

## Testes Realizados

### ✅ Health Check
```bash
curl http://localhost:8000/health
```
**Resultado**:
```json
{
  "status": "healthy",
  "culturas": 10,
  "talhoes": 10,
  "data_mode": "hybrid",
  "providers": {
    "weather": "available"
  }
}
```

### ✅ Dados Climáticos
```bash
curl "http://localhost:8000/dados/clima?lat=-23.55&lon=-46.63&days=30"
```
**Resultado**:
```json
{
  "source": "open-meteo",
  "temperatura_media": 21.2,
  "precipitacao_total": 70.3,
  "risco_climatico_estimado": "baixo",
  "fallback": false
}
```

### ✅ Dashboard com Clima
```bash
curl "http://localhost:8000/dashboard?lat=-23.55&lon=-46.63&days=30"
```
**Resultado**:
```json
{
  "clima_real": {
    "ativo": true,
    "source": "open-meteo",
    "temperatura_media": 21.2,
    "precipitacao_total": 70.3,
    "risco_climatico_estimado": "baixo",
    "clima_observado": "ameno",
    "agua_observada": "media",
    "ajuste_risco": -0.03,
    "fallback": false
  }
}
```

### ✅ Doctor Command
```bash
agroplan doctor
```
**Resultado**:
```
🌐 Conectividade:
   ✅ API local rodando em http://localhost:8000
      Status: healthy
      Culturas: 10
      Talhões: 10
      Cache items: 1
      Data mode: hybrid
      Weather provider: available
   ✅ API Render online
```

## Resultado Final

### ✅ Problema Resolvido
- API Local agora retorna `clima_real.ativo: true`
- Frontend detecta clima real corretamente
- Card climático aparece no Dashboard
- Dados reais influenciam o planejamento

### ✅ Melhorias Implementadas
- Doctor detecta backend desatualizado
- Mensagem clara de como corrigir
- Versão do setup salva em `setup.json`
- CLI v1.0.10 com backend sincronizado

## Instruções para Usuários

### Se o clima real não aparecer:

1. **Atualizar CLI**:
```bash
bun add -g agroplan-ai-cli@latest
```

2. **Parar API Local**:
```bash
agroplan serve off
```

3. **Reinstalar Backend**:
```bash
# Windows
agroplan setup --force --python="C:\Users\SEU_USUARIO\AppData\Local\Programs\Python\Python311\python.exe"

# macOS/Linux
agroplan setup --force
```

4. **Iniciar API**:
```bash
agroplan serve on
```

5. **Verificar**:
```bash
agroplan doctor
```

### Verificar se está funcionando:

1. Abra http://localhost:8000/health
2. Verifique se tem `"data_mode": "hybrid"`
3. Verifique se tem `"providers": { "weather": "available" }`
4. Teste http://localhost:8000/dashboard?lat=-23.55&lon=-46.63&days=30
5. Verifique se `clima_real.ativo` é `true`

## Prevenção Futura

### Comando Doctor Melhorado
Agora detecta automaticamente se o backend local está desatualizado e mostra:
```
⚠️  Backend local desatualizado (sem suporte a clima real)
   Rode: agroplan setup --force
```

### Versionamento
- CLI: v1.0.10
- Backend Template: Sincronizado com main
- Setup State: Salva versão em `~/.agroplan/setup.json`

### Próximas Melhorias Sugeridas

1. **Comando `agroplan update`**:
   - Atualiza backend automaticamente
   - Preserva configurações
   - Reinicia API

2. **Verificação Automática**:
   - Doctor compara versão local vs disponível
   - Avisa se há atualização disponível

3. **Migração Suave**:
   - Backup de configurações
   - Atualização incremental
   - Rollback em caso de erro

---

## Resumo

**Problema**: API Local desatualizada não retornava clima real  
**Causa**: Setup idempotente não atualizava backend existente  
**Solução**: CLI v1.0.10 com backend sincronizado + doctor melhorado  
**Status**: ✅ **RESOLVIDO E TESTADO**

**Versões**:
- CLI: 1.0.10 (publicada no npm)
- Backend: Sincronizado com main
- API Local: Funcionando com clima real
- API Render: Funcionando com clima real

**Data**: 08/05/2026  
**Commit**: c7a61fb