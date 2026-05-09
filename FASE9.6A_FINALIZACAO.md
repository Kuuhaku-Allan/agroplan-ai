# Fase 9.6A - Finalização - Avaliação Comparativa com Lucro de Mercado

**Data**: 09/05/2026  
**Status**: 🔄 **EM FINALIZAÇÃO**

---

## ✅ Concluído

### 1. Backend - Endpoint Estável ✅

**Endpoint**: `GET /comparar/lucro-mercado`

**Teste validado**:
```bash
GET /comparar/lucro-mercado?uf=SP&municipio=Clementina&safra=2025/2026&seed=42&geracoes=50
```

**Resultado**:
- ✅ modo: "avaliacao_comparativa"
- ✅ lucro_sistema_total: R$ 866.770,00
- ✅ lucro_mercado_total: R$ 836.058,68
- ✅ diferenca_percentual: -3.54%
- ✅ itens_criticos: 2
- ✅ pode_usar_mercado: false
- ✅ motivo_bloqueio: "2 item(ns) crítico(s); 2 item(ns) de baixa confiabilidade; apenas 20.0% dos itens têm alta confiabilidade"

### 2. Segurança do Endpoint ✅

**Implementado**:
- ✅ Variável `DEBUG_ERRORS` em `backend/api.py`
- ✅ Traceback detalhado apenas quando `DEBUG_ERRORS=true`
- ✅ Mensagem genérica em produção
- ✅ Adicionado `DEBUG_ERRORS=false` em `.env.example`

**Código**:
```python
DEBUG_ERRORS = os.getenv("DEBUG_ERRORS", "false").lower() == "true"

# No except:
if DEBUG_ERRORS:
    raise HTTPException(status_code=500, detail={"error": str(e), "traceback": traceback.format_exc()})
else:
    raise HTTPException(status_code=500, detail="Erro ao gerar avaliação comparativa de lucro de mercado.")
```

### 3. Commit Realizado ✅

**Commit**: `feat: add market profit comparative evaluation endpoint (Fase 9.6A)`  
**Push**: Realizado para `origin/main`

---

## 🔄 Em Andamento

### 4. Frontend - Tipos TypeScript

**Arquivo**: `frontend/lib/types.ts`

**Tipos necessários**:
```typescript
export interface MarketComparisonItem {
  talhao?: number;
  cultura?: string;
  lucro_sistema?: number;
  lucro_mercado_estimado?: number;
  preco_real?: PriceData;
  preco_normalizado?: PriceNormalization;
  validacao_lucro_mercado?: MarketProfitValidation;
}

export interface MarketComparisonSummary {
  lucro_sistema_total: number;
  lucro_mercado_total: number;
  diferenca_absoluta: number;
  diferenca_percentual: number;
  itens_alta_confiabilidade: number;
  itens_media_confiabilidade: number;
  itens_baixa_confiabilidade: number;
  itens_criticos: number;
  percentual_alta_confiabilidade: number;
  pode_usar_mercado: boolean;
  motivo_bloqueio?: string;
}

export interface MarketComparisonResponse {
  modo: "avaliacao_comparativa";
  descricao: string;
  plano_sistema: any;
  avaliacao_mercado: {
    lucro_mercado_total: number;
    itens: MarketComparisonItem[];
  };
  comparacao: MarketComparisonSummary;
}
```

---

## ❌ Pendente

### 5. Frontend - API Client

**Arquivo**: `frontend/lib/api.ts`

**Função necessária**:
```typescript
export async function compararLucroMercado(location?: ClimateLocation, options?: {
  objetivo?: string;
  seed?: number;
  geracoes?: number;
  populacao?: number;
}) {
  const params = new URLSearchParams();
  
  params.set("objetivo", options?.objetivo ?? "equilibrado");
  params.set("seed", String(options?.seed ?? 42));
  params.set("geracoes", String(options?.geracoes ?? 50));
  params.set("populacao", String(options?.populacao ?? 50));
  
  if (location?.lat) params.set("lat", String(location.lat));
  if (location?.lon) params.set("lon", String(location.lon));
  if (location?.days) params.set("days", String(location.days));
  if (location?.uf) params.set("uf", location.uf);
  if (location?.municipio) params.set("municipio", location.municipio);
  if (location?.safra) params.set("safra", location.safra);
  
  const response = await apiFetch(`/comparar/lucro-mercado?${params.toString()}`, {
    cache: "no-store"
  });
  
  return response.json();
}
```

### 6. Frontend - Componentes

**Pasta**: `frontend/components/market-comparison/`

**Componentes necessários**:

1. **market-comparison-summary.tsx**:
   - Mostra lucro sistema vs lucro mercado
   - Diferença absoluta e percentual
   - Status: pode_usar_mercado (Sim/Não)
   - Motivo de bloqueio (se houver)
   - Visual: vermelho se críticos, âmbar se bloqueado
   - Texto obrigatório: "Esta avaliação é experimental e não substitui o plano principal."

2. **market-comparison-table.tsx**:
   - Tabela por talhão
   - Colunas: talhão, cultura, lucro sistema, lucro mercado, confiabilidade, crítico
   - Destaque visual para itens críticos

### 7. Frontend - Página

**Arquivo**: `frontend/app/comparacao-mercado/page.tsx`

**Estrutura**:
- Título: "Avaliação com Lucro de Mercado"
- Descrição: "Compara o plano principal atual com uma estimativa baseada em preços de mercado normalizados."
- Usar `getClimateLocation()` para obter região
- Botão "Executar Avaliação"
- Loading state
- Mostrar `MarketComparisonSummary`
- Mostrar tabela por talhão
- Aviso se não tiver UF: "Selecione uma região com UF para usar preços regionais."

**Importante**: Nunca escrever "Plano otimizado por mercado". Sempre usar "Avaliação de mercado do plano atual".

### 8. Frontend - Navegação

**Arquivo**: Sidebar/Navigation

**Adicionar**:
- Item: "Comparação Mercado"
- Ícone: `Scale`, `BarChart3`, `TrendingUp` ou `DollarSign`
- Link: `/comparacao-mercado`

### 9. Relatórios

**Arquivo**: `backend/core/report_generator.py`

**Seção opcional**:
```markdown
## 🔄 Avaliação Comparativa com Lucro de Mercado

### Resumo
- **Lucro do Sistema**: R$ 866.770,00
- **Lucro de Mercado**: R$ 836.058,68
- **Diferença**: -R$ 30.711,32 (-3.54%)

### Validação
- **Itens críticos**: 2
- **Pode usar mercado**: Não
- **Motivo**: 2 item(ns) crítico(s); 2 item(ns) de baixa confiabilidade; apenas 20.0% dos itens têm alta confiabilidade

### ⚠️ Aviso Importante
Esta avaliação não substitui a recomendação principal. O lucro de mercado é usado apenas como simulação comparativa.
```

### 10. Documentação

**Arquivos**: `README.md` e `docs/API_PROVIDERS.md`

**Seção necessária**:
```markdown
### Avaliação Comparativa com Lucro de Mercado

O sistema permite avaliar o plano principal usando lucro de mercado normalizado:

**O que é**:
- Usa o plano principal gerado pelo AG
- Recalcula/avalia esse mesmo plano com lucro de mercado
- **NÃO** gera novo plano otimizado
- Bloqueia uso automático se houver itens críticos

**Endpoint**: `GET /comparar/lucro-mercado`

**Parâmetros**:
- `objetivo`: Objetivo de otimização (padrão: "equilibrado")
- `seed`: Seed para reprodutibilidade (padrão: 42)
- `geracoes`: Número de gerações do AG (padrão: 100)
- `populacao`: Tamanho da população (padrão: 50)
- `uf`: Unidade Federativa (opcional)
- `municipio`: Município (opcional)
- `safra`: Safra ZARC (padrão: "2025/2026")

**Regras de Bloqueio**:
- `pode_usar_mercado = false` se:
  - `itens_criticos > 0`
  - `itens_baixa_confiabilidade > 0`
  - `percentual_alta_confiabilidade < 70%`

**Importante**: `PRICE_APPLY_TO_PROFIT=false` permanece padrão. Esta é apenas uma avaliação comparativa.
```

### 11. CLI v1.0.28

**Arquivos para sincronizar**:
- `tools/agroplan-cli/backend-template/api.py`
- `tools/agroplan-cli/backend-template/core/market_profit_comparator.py`
- `tools/agroplan-cli/backend-template/core/market_profit_validator.py`
- `tools/agroplan-cli/backend-template/.env.example`
- `tools/agroplan-cli/backend-template/VERSION.json`
- `backend/VERSION.json`

**Versão**: 1.0.28

**Feature**: `market_profit_comparative_evaluation`

**Comandos**:
```bash
cd tools/agroplan-cli
bun run build
npm publish --access public
```

### 12. Testes Finais

**Backend**:
```bash
GET /comparar/lucro-mercado?uf=SP&municipio=Clementina&safra=2025/2026&seed=42&geracoes=50
```

**Frontend**:
```bash
cd frontend
npm run build
```

**CLI**:
```bash
bun add -g agroplan-ai-cli@1.0.28
agroplan update
agroplan doctor
```

**Local**:
```bash
http://localhost:8000/comparar/lucro-mercado?uf=SP&municipio=Clementina&safra=2025/2026
```

### 13. Commit Final

```bash
git add .
git commit -m "feat: add market profit comparative evaluation UI and docs"
git push origin main
```

---

## ✅ Critérios de Aceitação

### Backend
- [x] Endpoint `/comparar/lucro-mercado` funciona
- [x] Retorna `modo: "avaliacao_comparativa"`
- [x] Bloqueia quando há itens críticos
- [x] Traceback apenas em DEBUG
- [x] `.env.example` atualizado

### Frontend
- [ ] Tipos TypeScript criados
- [ ] Função API client criada
- [ ] Componente de resumo criado
- [ ] Componente de tabela criado
- [ ] Página `/comparacao-mercado` criada
- [ ] Item na navegação adicionado
- [ ] Build passa sem erros
- [ ] UI deixa claro que é avaliação, não otimização

### Relatórios
- [ ] Seção de avaliação comparativa
- [ ] Texto de aviso incluído

### Documentação
- [ ] README.md atualizado
- [ ] docs/API_PROVIDERS.md atualizado
- [ ] Conceito explicado claramente

### CLI
- [ ] Versão 1.0.28
- [ ] Feature `market_profit_comparative_evaluation`
- [ ] Backend template sincronizado
- [ ] Publicada no npm
- [ ] `agroplan update` funciona

---

## 🎯 Próxima Fase

**Fase 9.6B - AG Experimental com Fitness de Mercado**

**Quando fazer**:
- Após Fase 9.6A 100% completa
- Após validação extensiva dos preços
- Quando `percentual_alta_confiabilidade >= 80%` consistentemente

**O que fazer**:
- Criar AG experimental com fitness baseada em `lucro_mercado_estimado`
- Endpoint `/otimizar/experimental-mercado`
- Comparação lado a lado: AG sistema vs AG mercado
- Bloqueio automático se itens críticos
- Toggle no frontend: "Usar AG experimental de mercado"
- **Nunca como padrão** - sempre requer confirmação explícita

---

**Status Atual**: Backend estável, segurança implementada, aguardando frontend e documentação  
**Próximo Passo**: Implementar tipos TypeScript e componentes frontend
