# Fase 9.1 - Provider de Preços Agrícolas - Em Progresso

**Data:** 09/05/2026  
**Status:** 🚧 Em Progresso (Parte 1 e 2 concluídas)

## 🎯 Objetivo

Integrar preços agrícolas reais para melhorar o cálculo de lucro, começando com índice local e fallback, preparando para integração futura com Conab.

## ✅ Parte 1 - Provider de Preços (CONCLUÍDO)

### Arquivos Criados

1. **`backend/data/precos/precos_fallback.json`**
   - 10 culturas com preços de referência
   - Unidades: saca_60kg, saca_50kg, arroba_15kg, tonelada
   - Fonte: fallback (média histórica)

2. **`backend/data/precos/precos_index.json`**
   - Índice local com 5 culturas para SP
   - Estrutura: `{cultura}_{UF}` como chave
   - Preparado para expansão futura

3. **`backend/providers/price_provider.py`**
   - `normalizar_cultura_preco()`: Normaliza nomes (café → cafe)
   - `load_price_index()`: Carrega índice com cache em memória
   - `load_price_fallback()`: Carrega fallback com cache
   - `buscar_preco(cultura, uf)`: Busca preço (índice → fallback → unavailable)
   - `buscar_precos_lote(culturas, uf)`: Busca múltiplos preços
   - `get_price_status()`: Status do provider
   - `clear_price_cache()`: Limpa cache

**Fluxo de busca:**
```
buscar_preco(cultura, uf)
  ↓
1. Normalizar cultura
2. Tentar índice local (com UF)
3. Tentar fallback (sem UF)
4. Retornar unavailable
```

**Retorno sempre dict, nunca None:**
```json
{
  "ativo": true,
  "source": "price-local-index",
  "fallback": false,
  "cultura": "soja",
  "uf": "SP",
  "preco": 130.00,
  "unidade": "saca_60kg",
  "data_referencia": "2026-05-01",
  "observacao": "Preço de referência para SP"
}
```

4. **`backend/core/price_adapter.py`**
   - `aplicar_precos_no_plano(resultado, uf)`: Enriquece plano com preços
   - `gerar_secao_precos_relatorio(plano, uf, formato)`: Gera seção para relatório
   - Variável `PRICE_APPLY_TO_PROFIT`: Controla se recalcula lucro (padrão: false)

**Estatísticas adicionadas ao resultado:**
```json
{
  "precos": {
    "ativo": true,
    "source": "price-local-index",
    "fallback_count": 5,
    "culturas_com_preco": 5,
    "culturas_sem_preco": 0,
    "total_culturas": 10,
    "aplicado_no_lucro": false,
    "uf": "SP"
  }
}
```

## ✅ Parte 2 - Endpoints (CONCLUÍDO)

### Endpoints Criados

1. **`GET /dados/precos?cultura=soja&uf=SP`**
   - Retorna preço de uma cultura
   - Sem cultura: mensagem amigável com exemplos
   - Testado: ✅ Funcionando

2. **`GET /dados/precos/lote?uf=SP`**
   - Retorna preços de todas as 10 culturas do AgroPlan
   - Inclui estatísticas (total, com_preco, fallback)
   - Testado: ✅ Funcionando

3. **`GET /health`** (atualizado)
   - Adicionado `providers.prices` com status do provider
   - Mostra: provider, index_available, index_records, fallback_records
   - Testado: ✅ Funcionando

4. **`POST /cache/limpar`** (atualizado)
   - Adicionado limpeza de `price_cache`
   - Limpa: resultados, providers, zarc, prices

### Testes Realizados

```powershell
# Teste 1: Preço individual
Invoke-RestMethod -Uri "http://localhost:8000/dados/precos?cultura=soja&uf=SP"
# ✅ Retornou: price-local-index, R$ 130,00, saca_60kg

# Teste 2: Preços em lote
Invoke-RestMethod -Uri "http://localhost:8000/dados/precos/lote?uf=SP"
# ✅ Retornou: 10 culturas, 5 com índice, 5 com fallback

# Teste 3: Health
(Invoke-RestMethod -Uri "http://localhost:8000/health").providers.prices
# ✅ Retornou: provider=local, index_records=5, fallback_records=10
```

## 🚧 Parte 3 - Integração no Cálculo (PENDENTE)

**Próximos passos:**
1. Atualizar `/dashboard` para aceitar `usar_precos_reais` ou usar env `PRICE_APPLY_TO_PROFIT`
2. Aplicar `aplicar_precos_no_plano()` no resultado
3. Retornar resumo de preços no response
4. Testar com e sem preços aplicados

**Nota importante:** Por enquanto, `PRICE_APPLY_TO_PROFIT=false` (padrão). Os preços são apenas exibidos, não recalculam o lucro. Isso será ativado após validação de unidades.

## 🚧 Parte 4 - Integração nos Endpoints (PENDENTE)

Endpoints a atualizar:
- `/dashboard` ✅ (próximo)
- `/recomendacoes`
- `/otimizar`
- `/relatorio`

## 🚧 Parte 5 - Relatórios (PENDENTE)

Atualizar `report_generator.py`:
- Adicionar seção "Preços Agrícolas Utilizados"
- Mostrar tabela com preços por cultura
- Indicar se preços foram aplicados ao lucro

## 🚧 Parte 6 - Frontend (PENDENTE)

Componentes a criar:
- `frontend/components/prices/price-impact-banner.tsx`
- `frontend/components/prices/price-table-card.tsx`

Páginas a atualizar:
- Dashboard: Banner de preços
- Talhões: Preço da cultura no detalhe
- Relatórios: Aviso de inclusão de preços

## 🚧 Parte 7 - Documentação (PENDENTE)

- Atualizar `docs/API_PROVIDERS.md`
- Atualizar `README.md`

## 🚧 Parte 8 - CLI (PENDENTE)

- Atualizar backend-template (✅ arquivos copiados)
- Atualizar VERSION.json
- Publicar CLI v1.0.24

## 📊 Cobertura de Preços

### Índice Local (SP)
- soja: R$ 130,00/saca_60kg
- milho: R$ 67,00/saca_60kg
- feijao: R$ 185,00/saca_60kg
- cafe: R$ 1.280,00/saca_60kg
- cana: R$ 98,00/tonelada

### Fallback (Todas UFs)
- soja: R$ 128,50/saca_60kg
- milho: R$ 65,00/saca_60kg
- feijao: R$ 180,00/saca_60kg
- trigo: R$ 75,00/saca_60kg
- algodao: R$ 3.200,00/arroba_15kg
- cafe: R$ 1.250,00/saca_60kg
- cana: R$ 95,00/tonelada
- arroz: R$ 85,00/saca_50kg
- sorgo: R$ 55,00/saca_60kg
- mandioca: R$ 450,00/tonelada

**Total:** 10/10 culturas com preço (100% cobertura)

## 🎯 Próxima Ação

Continuar com Parte 3: Integração no cálculo
- Atualizar `/dashboard` para aplicar preços
- Testar com `PRICE_APPLY_TO_PROFIT=false` (apenas exibir)
- Validar que nada quebra

## 📝 Observações

1. **Unidades variadas**: saca_60kg, saca_50kg, arroba_15kg, tonelada
   - Normalização será necessária antes de recalcular lucro
   - Por isso começamos com `PRICE_APPLY_TO_PROFIT=false`

2. **Fallback sempre disponível**: Todas as 10 culturas têm fallback
   - Sistema nunca fica sem preço
   - Fonte é claramente indicada

3. **Preparado para expansão**: Estrutura permite adicionar:
   - Mais UFs no índice
   - Integração com Conab futuramente
   - Preços por município

4. **Cache em memória**: Índice e fallback são carregados uma vez
   - Performance otimizada
   - Pode ser limpo via `/cache/limpar`

---

**Status atual:** Provider e endpoints funcionando. Próximo: integrar no cálculo e relatórios.
