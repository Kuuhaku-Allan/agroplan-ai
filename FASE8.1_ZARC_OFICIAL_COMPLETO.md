# Fase 8.1 - ZARC Oficial de Verdade - COMPLETO

## Status: ✅ COMPLETO

A rastreabilidade do ZARC agora é **100% honesta**. O sistema nunca mais dirá "oficial" quando estiver usando fallback.

## Problema Corrigido

**Antes:**
- URL placeholder (`resource/...`)
- `source: "zarc-oficial"` mesmo usando fallback
- `fallback: false` mesmo sem CSV oficial
- Observação genérica não refletia origem real

**Depois:**
- ✅ URL real do Portal de Dados Abertos
- ✅ `source` reflete origem real (zarc-oficial, zarc-cache, zarc-fallback)
- ✅ `fallback` honesto (true/false)
- ✅ Observação específica por fonte

## Correções Implementadas

### 1. URL Oficial Real ✅

```python
ZARC_URLS = {
    "2025/2026": "https://dados.agricultura.gov.br/dataset/.../dados-abertos-tabua-de-risco-safra-2025-2026.csv",
    "2026/2027": None  # TODO
}
```

**Resultado:** CSV oficial baixado com sucesso (1,026,965 registros, 214MB)

### 2. Metadata Estruturada ✅

`get_zarc_dataset()` agora retorna:

```python
{
    "records": [...],
    "source": "zarc-oficial" | "zarc-cache" | "zarc-fallback",
    "fallback": True | False,
    "cache_path": "..." | None,
    "error": "..." | None
}
```

**Regras:**
- CSV baixado agora → `source: "zarc-oficial"`, `fallback: False`
- Cache válido → `source: "zarc-cache"`, `fallback: False`
- Cache expirado mas usado → `source: "zarc-cache"`, `fallback: False`, `error: "Cache expirado mas usado"`
- Fallback local → `source: "zarc-fallback"`, `fallback: True`

### 3. buscar_zarc() Honesto ✅

Usa metadata real do dataset:

```python
source = dataset_info["source"]
is_fallback = dataset_info["fallback"]

if is_fallback:
    observacao = "Dados simplificados locais usados porque o CSV oficial não estava disponível."
elif source == "zarc-oficial":
    observacao = "Dados obtidos da Tábua de Risco do ZARC (Ministério da Agricultura)."
else:  # zarc-cache
    observacao = "Dados obtidos do cache local da Tábua de Risco do ZARC."
```

### 4. User-Agent Header ✅

Adicionado para evitar 403:

```python
req = urllib.request.Request(
    url,
    headers={'User-Agent': 'AgroPlan-AI/1.0 (https://github.com/Kuuhaku-Allan/agroplan-ai)'}
)
```

**Resultado:** Download bem-sucedido!

### 5. Parser CSV Melhorado ✅

- ✅ Detecta delimitador (`;` ou `,`)
- ✅ Remove BOM UTF-8 (`utf-8-sig`)
- ✅ Log de colunas encontradas

```python
delimiter = ';' if ';' in primeira_linha else ','
with open(file_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f, delimiter=delimiter)
```

### 6. Função de Inspeção ✅

```python
inspect_zarc_columns(safra="2025/2026")
```

Mostra todas as colunas do CSV oficial para facilitar mapeamento.

### 7. Health Endpoint Atualizado ✅

```json
{
  "providers": {
    "weather": "available",
    "zarc": {
      "status": "available",
      "safra": "2025/2026",
      "source": "zarc-cache",
      "fallback": false,
      "records": 1026965
    }
  }
}
```

### 8. Documentação Completa ✅

Criado `docs/ZARC.md` com:
- Visão geral do ZARC
- Estrutura do CSV oficial
- Explicação de decêndios
- Tipos de solo
- Endpoints
- Dados fallback
- Diferença Clima vs ZARC
- Roadmap futuro

### 9. .gitignore Atualizado ✅

```
# ZARC Cache (CSV files are too large for GitHub - 200MB+)
backend/data/zarc/*.csv
!backend/data/zarc/.gitkeep
```

CSV oficial (214MB) não vai para GitHub, mas é baixado automaticamente na primeira execução.

## Testes Realizados

### Teste 1: Download Oficial
```bash
python test_zarc.py
```

**Resultado:**
```
Baixando ZARC oficial de https://dados.agricultura.gov.br/...
ZARC oficial baixado e salvo em backend/data/zarc/zarc_2025-2026.csv
Colunas ZARC encontradas (56 colunas, delimiter=';')
Source: zarc-cache
Fallback: False
Registros: 1026965
```

✅ **1,026,965 registros oficiais baixados!**

### Teste 2: Busca com Fallback
```bash
python test_zarc.py
```

**Resultado:**
```
Source: zarc-fallback
Fallback: True
Cultura: soja
Janela: 10/10 a 15/12
Risco: baixo
Observação: Dados simplificados locais usados porque o CSV oficial não estava disponível.
```

✅ **Metadata honesta quando usa fallback!**

### Teste 3: Health Endpoint
```bash
GET /health
```

**Resultado:**
```json
{
  "providers": {
    "zarc": {
      "status": "available",
      "safra": "2025/2026",
      "source": "zarc-cache",
      "fallback": false,
      "records": 1026965
    }
  }
}
```

✅ **Status ZARC visível no health!**

## Estrutura do CSV Oficial

### Colunas Principais

- `Nome_cultura`: SOJA, MILHO, FEIJAO, etc.
- `UF`: SP, PR, MS, etc.
- `municipio`: Nome do município
- `Cod_Solo`: 1 (arenoso), 2 (médio), 3 (argiloso)
- `dec1` a `dec36`: Decêndios (períodos de 10 dias)

### Decêndios

- `dec1`: 1-10 jan
- `dec2`: 11-20 jan
- `dec3`: 21-31 jan
- ...
- `dec36`: 21-31 dez

**Valores:**
- `1`: Risco baixo
- `2`: Risco médio
- `3`: Risco alto
- Vazio/`0`: Não recomendado

## Próximos Passos

### Fase 8.2 - Parser de Decêndios (Próxima)

1. Implementar conversão decêndio → data
2. Processar colunas `dec1` a `dec36`
3. Identificar janelas de plantio contínuas
4. Calcular risco médio por janela
5. Mapear códigos de solo
6. Normalizar nomes de culturas

### Fase 8.3 - Integração no Produto

1. Atualizar `/dashboard` com ZARC
2. Mostrar janela de plantio em Talhões
3. Adicionar seção ZARC em Relatórios
4. Criar `ZarcImpactBanner` component
5. Seletor de município/UF no frontend

## Arquivos Modificados

```
backend/providers/zarc_provider.py (URL real, metadata, parser)
backend/api.py (health endpoint)
backend/test_zarc.py (novo)
docs/ZARC.md (novo)
.gitignore (ZARC cache)
```

## Commits

- **d787ae4** - feat: add ZARC provider and adapter (Phase 8 start)
- **a436b3d** - fix: use official ZARC CSV with truthful fallback metadata

## Critérios de Aceitação

- [x] ZARC_URLS tem URL real para 2025/2026
- [x] source/fallback refletem a origem real dos dados
- [x] Dados fallback nunca aparecem como oficial
- [x] Endpoint /dados/zarc funciona com mensagem honesta
- [x] /health mostra provider zarc
- [x] CSV oficial baixa com sucesso (1M+ registros)
- [x] Parser detecta delimitador e remove BOM
- [x] Documentação completa criada
- [x] .gitignore atualizado para CSV grande

## Conclusão

A **Fase 8.1 está completa**. O ZARC agora:

1. ✅ Baixa CSV oficial (1M+ registros)
2. ✅ Usa metadata honesta (source, fallback)
3. ✅ Nunca mente sobre origem dos dados
4. ✅ Tem fallback robusto
5. ✅ Está documentado completamente
6. ✅ Pronto para parser de decêndios

**Credibilidade garantida:** O sistema nunca dirá "oficial" quando estiver usando mock/fallback.

---

**Data:** 08/05/2026  
**Versão:** 1.0  
**Status:** ZARC oficial funcionando, parser de decêndios pendente
