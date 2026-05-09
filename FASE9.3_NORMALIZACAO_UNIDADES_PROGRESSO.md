# 🔄 Fase 9.3 - Normalização de Unidades - EM PROGRESSO

**Status**: 🔄 **EM PROGRESSO** (Partes 1-4 concluídas)  
**Data**: 09/05/2026  
**Versão**: 1.0.25 (em desenvolvimento)

---

## 📋 Resumo

A Fase 9.3 implementa a normalização de unidades de preços agrícolas, convertendo todas as unidades para R$/tonelada e calculando lucro de mercado estimado para comparação com o lucro interno do sistema.

---

## ✅ Partes Concluídas

### Parte 1 - Normalizador de Unidades ✅

**Arquivo**: `backend/core/price_normalizer.py`

**Funções Implementadas**:
1. `normalizar_preco_para_tonelada(preco, unidade)` - Converte preço para R$/tonelada
2. `normalizar_precos_lote(precos)` - Normaliza múltiplas culturas
3. `calcular_lucro_com_preco_normalizado()` - Calcula lucro com preço de mercado
4. `obter_estatisticas_normalizacao()` - Estatísticas de normalização

**Fatores de Conversão**:
- `tonelada`: 1.0 (sem conversão)
- `saca_60kg`: 16.6667 (1000kg / 60kg)
- `saca_50kg`: 20.0 (1000kg / 50kg)
- `arroba_15kg`: 66.6667 (1000kg / 15kg)

**Teste**:
```bash
✅ GET /dados/precos/comparar?uf=SP
✅ Todas as 10 culturas normalizadas com sucesso
✅ Estatísticas: 10 normalizadas, 0 não normalizadas
```

### Parte 2 - Integração no Price Adapter ✅

**Arquivo**: `backend/core/price_adapter.py`

**Modificações**:
1. Importa funções do `price_normalizer`
2. Carrega dados de culturas (produtividade e custo) do CSV
3. Adiciona `preco_normalizado` em cada item do plano
4. Calcula `lucro_mercado_estimado` para todos os itens
5. Adiciona `produtividade` e `custo` aos itens do plano
6. Suporta parâmetro `aplicar_no_lucro` (padrão: False)
7. Preserva `lucro_original` quando `aplicar_no_lucro=True`
8. Adiciona seção `normalizacao` no resumo de preços

**Campos Adicionados aos Itens do Plano**:
- `preco_normalizado`: Dict com informações de normalização
- `produtividade`: Toneladas por hectare
- `custo`: Custo por hectare (R$/ha)
- `lucro_mercado_estimado`: Lucro calculado com preço de mercado
- `lucro_mercado_detalhes`: Detalhes do cálculo (receita, custo, etc.)
- `lucro_mercado_aplicado`: Boolean indicando se foi aplicado
- `lucro_original`: Lucro original (quando aplicado)

**Teste**:
```bash
✅ Dashboard retorna preco_normalizado
✅ Dashboard retorna lucro_mercado_estimado
✅ Dashboard retorna produtividade e custo
✅ lucro_estimado permanece inalterado (PRICE_APPLY_TO_PROFIT=false)
```

### Parte 3 - Relatórios com Normalização ✅

**Arquivo**: `backend/core/price_adapter.py` (função `gerar_secao_precos_relatorio`)

**Modificações**:
1. Tabela de preços inclui coluna "Preço/Tonelada"
2. Tabela de preços inclui coluna "Normalizado" (✅/❌)
3. Nova seção "Comparação de Lucro" (se disponível)
4. Mostra lucro sistema vs lucro mercado por talhão
5. Indica diferença com ícones (📈/📉/➡️)
6. Explica normalização de unidades
7. Lista fatores de conversão

**Teste**:
```bash
✅ Relatório inclui preços normalizados
✅ Relatório inclui comparação de lucros
✅ Aviso claro sobre preços serem referência
```

### Parte 4 - Endpoint Comparativo ✅

**Arquivo**: `backend/api.py`

**Novo Endpoint**: `GET /dados/precos/comparar?uf=SP`

**Resposta**:
```json
{
  "uf": "SP",
  "precos_normalizados": {
    "soja": {
      "preco_original": 130.0,
      "unidade_original": "saca_60kg",
      "preco_por_tonelada": 2166.67,
      "normalizado": true,
      ...
    },
    ...
  },
  "estatisticas": {
    "ativa": true,
    "unidade_base": "tonelada",
    "total_culturas": 10,
    "culturas_normalizadas": 10,
    "culturas_nao_normalizadas": 0,
    "unidades_originais": {
      "saca_60kg": 6,
      "arroba_15kg": 1,
      "tonelada": 2,
      "saca_50kg": 1
    }
  }
}
```

**Teste**:
```bash
✅ GET /dados/precos/comparar?uf=SP funcionando
✅ Retorna preços normalizados para todas as culturas
✅ Retorna estatísticas de normalização
```

---

## 📊 Exemplo de Comparação de Lucros

### Cana (Talhão 1, 10 ha)

**Dados**:
- Preço mercado: R$ 98/tonelada
- Produtividade: 5.5 t/ha
- Custo: R$ 1.400/ha
- Área: 10 ha

**Cálculo Mercado**:
- Produção total: 5.5 × 10 = 55 toneladas
- Receita: 55 × 98 = R$ 5.390
- Custo total: 1.400 × 10 = R$ 14.000
- **Lucro mercado: R$ -8.610** (prejuízo)

**Lucro Sistema**: R$ 140.000

**Diferença**: R$ -148.610 (mercado muito abaixo do sistema)

**Análise**: O preço de mercado da cana (R$ 98/ton) está muito abaixo do preço interno usado no sistema, resultando em prejuízo. Isso indica que:
1. O preço interno pode estar superestimado
2. O preço de mercado pode estar desatualizado
3. Pode haver diferença entre preço de cana para indústria vs. outros usos

---

## 🔒 Decisões de Design

### 1. Dois Lucros Coexistindo
**Decisão**: Manter `lucro_estimado` (sistema) e adicionar `lucro_mercado_estimado` (mercado)

**Motivo**:
- Permite comparação lado a lado
- Não quebra cálculos existentes
- Usuário pode avaliar diferenças antes de ativar

### 2. PRICE_APPLY_TO_PROFIT=false por Padrão
**Decisão**: Não recalcular lucro automaticamente

**Motivo**:
- Preços de mercado podem estar desatualizados
- Unidades comerciais podem diferir de unidades técnicas
- Necessário validação antes de ativar em produção

### 3. Carregar Produtividade e Custo do CSV
**Decisão**: Buscar dados de `culturas.csv` quando necessário

**Motivo**:
- Evita modificar múltiplos arquivos (planner, genetic_optimizer, scenario_simulator)
- Mantém compatibilidade com código existente
- Dados sempre atualizados do CSV

---

## 🚧 Partes Pendentes

### Parte 5 - Frontend (Tipos TypeScript)
- [ ] Atualizar `PriceData` com campos de normalização
- [ ] Atualizar `PlanoItem` com lucro de mercado
- [ ] Atualizar `PriceSummary` com normalização

### Parte 6 - Frontend (Componentes)
- [ ] Atualizar `PriceInfoCard` para mostrar preço normalizado
- [ ] Atualizar `PriceImpactBanner` para mostrar normalização
- [ ] Adicionar indicador de lucro de mercado nos cards

### Parte 7 - Frontend (Dashboard)
- [ ] Mostrar aviso sobre dois lucros
- [ ] Adicionar toggle para comparar lucros (opcional)

### Parte 8 - Documentação
- [ ] Atualizar README.md
- [ ] Atualizar docs/API_PROVIDERS.md
- [ ] Documentar normalização de unidades

### Parte 9 - CLI v1.0.25
- [ ] Atualizar VERSION.json
- [ ] Atualizar package.json
- [ ] Copiar arquivos atualizados para backend-template
- [ ] Build e publicar

### Parte 10 - Testes
- [ ] Testar todos os endpoints
- [ ] Testar frontend build
- [ ] Testar CLI update
- [ ] Validar cálculos de lucro

---

## 🧪 Testes Realizados

### Backend ✅
```bash
✅ GET /dados/precos/comparar?uf=SP
✅ GET /dashboard (com preco_normalizado e lucro_mercado_estimado)
✅ Normalização de 10 culturas
✅ Cálculo de lucro de mercado
✅ Preservação de lucro original
```

### Conversões Testadas ✅
```
✅ saca_60kg → tonelada (×16.6667)
   Soja: R$ 130/saca → R$ 2.166,67/ton
   
✅ saca_50kg → tonelada (×20)
   Arroz: R$ 85/saca → R$ 1.700/ton
   
✅ arroba_15kg → tonelada (×66.6667)
   Algodão: R$ 3.200/arroba → R$ 213.333,33/ton
   
✅ tonelada → tonelada (×1)
   Cana: R$ 98/ton → R$ 98/ton
```

---

## 📁 Arquivos Modificados/Criados

### Backend
```
backend/core/price_normalizer.py                [CRIADO]
backend/core/price_adapter.py                   [MODIFICADO]
backend/api.py                                  [MODIFICADO]
```

### CLI Backend-Template
```
tools/agroplan-cli/backend-template/core/price_normalizer.py    [COPIADO]
tools/agroplan-cli/backend-template/core/price_adapter.py       [ATUALIZADO]
tools/agroplan-cli/backend-template/api.py                      [ATUALIZADO]
```

---

## 🎯 Próximos Passos

1. **Frontend**: Atualizar tipos e componentes para mostrar normalização
2. **Documentação**: Explicar normalização e comparação de lucros
3. **CLI**: Publicar v1.0.25 com normalização
4. **Validação**: Comparar lucros em múltiplos cenários
5. **Decisão**: Avaliar se ativar `PRICE_APPLY_TO_PROFIT=true` em produção

---

## ⚠️ Observações Importantes

### Diferenças Significativas nos Lucros

Os testes iniciais mostram diferenças grandes entre lucro sistema e lucro mercado:
- **Cana**: Sistema R$ 140k vs Mercado R$ -8,6k (diferença de R$ 148k)

**Possíveis Causas**:
1. Preços internos do sistema podem estar superestimados
2. Preços de mercado podem estar desatualizados ou incompletos
3. Unidades comerciais podem diferir de unidades técnicas
4. Produtividade real pode diferir da produtividade do CSV

**Recomendação**: Validar preços de mercado e produtividades antes de ativar recálculo automático.

---

**Desenvolvido com ❤️ para AgroPlan AI**
