# Provedores de Dados Reais - AgroPlan AI

## Visão Geral

O AgroPlan AI suporta múltiplos modos de dados para flexibilidade entre desenvolvimento e produção:

- **`simulated`**: Usa apenas dados CSV simulados
- **`real`**: Usa apenas APIs reais externas  
- **`hybrid`**: Usa APIs reais com fallback para dados simulados (recomendado)

## Configuração

Configure no arquivo `.env`:

```env
DATA_MODE=hybrid
WEATHER_PROVIDER=open-meteo
PROVIDER_CACHE_TTL=3600
```

## Provedores Disponíveis

### 1. Open-Meteo (Clima Real)

**Fonte**: [Open-Meteo Archive API](https://open-meteo.com/en/docs/historical-weather-api)

**Características**:
- ✅ Gratuito para uso não comercial
- ✅ Sem necessidade de chave de API
- ✅ Dados históricos confiáveis
- ✅ Cobertura global

**Dados fornecidos**:
- Temperatura média, máxima e mínima
- Precipitação total
- Evapotranspiração de referência (FAO)
- Umidade relativa média
- Radiação solar

**Endpoint**: `GET /dados/clima`

**Parâmetros**:
- `lat`: Latitude (obrigatório)
- `lon`: Longitude (obrigatório)  
- `days`: Número de dias para análise (1-365, padrão: 30)

**Exemplo**:
```bash
GET /dados/clima?lat=-23.55&lon=-46.63&days=30
```

**Resposta**:
```json
{
  "source": "open-meteo",
  "latitude": -23.55,
  "longitude": -46.63,
  "temperatura_media": 21.2,
  "temperatura_maxima": 26.9,
  "temperatura_minima": 17.1,
  "precipitacao_total": 79.5,
  "evapotranspiracao": 3.46,
  "umidade_media": 73.8,
  "radiacao_solar": 531.9,
  "risco_climatico_estimado": "baixo",
  "fallback": false,
  "error": null
}
```

### 2. ZARC (Janelas de Plantio)

**Fonte**: Índice compacto derivado do [ZARC oficial do MAPA](https://www.gov.br/agricultura/pt-br/assuntos/riscos-seguro/risco-agropecuario/zarc)

**Características**:
- ✅ Dados oficiais do Ministério da Agricultura
- ✅ Índice compacto para consulta rápida
- ✅ Cobertura das principais culturas e regiões
- ✅ Janelas de plantio por cultura, solo e município

**Dados fornecidos**:
- Janela de plantio (início e fim)
- Nível de risco (20%, 30%)
- Tipo de solo compatível
- Ciclo da cultura

**Endpoint**: `GET /dados/zarc`

**Parâmetros**:
- `cultura`: Nome da cultura (obrigatório)
- `uf`: Unidade Federativa (obrigatório)
- `municipio`: Nome do município (obrigatório)
- `solo`: Tipo de solo (1, 2, 3) (obrigatório)
- `safra`: Safra agrícola (ex: 2025/2026) (opcional)

**Exemplo**:
```bash
GET /dados/zarc?cultura=soja&uf=SP&municipio=Clementina&solo=2&safra=2025/2026
```

**Resposta**:
```json
{
  "ativo": true,
  "source": "zarc-oficial-derived",
  "cultura": "soja",
  "uf": "SP",
  "municipio": "Clementina",
  "solo": "2",
  "safra": "2025/2026",
  "janela_plantio": {
    "inicio": "01/10",
    "fim": "31/12"
  },
  "risco": "20%",
  "ciclo": "médio",
  "fallback": false
}
```

**Endpoint em Lote**: `GET /dados/zarc/lote`

Permite consultar ZARC para múltiplas culturas de uma vez:

**Parâmetros**:
- `uf`: Unidade Federativa (obrigatório)
- `municipio`: Nome do município (obrigatório)
- `safra`: Safra agrícola (opcional)

**Exemplo**:
```bash
GET /dados/zarc/lote?uf=SP&municipio=Clementina&safra=2025/2026
```

**Resposta**:
```json
{
  "uf": "SP",
  "municipio": "Clementina",
  "safra": "2025/2026",
  "culturas": {
    "soja": {
      "ativo": true,
      "source": "zarc-oficial-derived",
      "janela_plantio": {"inicio": "01/10", "fim": "31/12"},
      "risco": "20%",
      "solo": "2",
      "ciclo": "médio"
    },
    "milho": {
      "ativo": true,
      "source": "zarc-oficial-derived",
      "janela_plantio": {"inicio": "15/09", "fim": "31/01"},
      "risco": "20%",
      "solo": "2",
      "ciclo": "normal"
    }
  }
}
```

### 3. Preços Agrícolas (Referência de Mercado)

**Fonte**: Índice local de preços + fallback de referência

**Características**:
- ✅ Preços de referência para as principais culturas
- ✅ Índice local com dados regionais (quando disponível)
- ✅ Fallback automático para cobertura completa
- ✅ 100% de cobertura garantida (todas as culturas têm preço)

**Dados fornecidos**:
- Preço por unidade (R$/saca, R$/arroba, etc.)
- Unidade de medida
- Região (UF quando disponível)
- Data de referência
- Fonte (índice local ou fallback)

**Endpoint**: `GET /dados/precos`

**Parâmetros**:
- `cultura`: Nome da cultura (obrigatório)
- `uf`: Unidade Federativa (opcional, melhora precisão)

**Exemplo**:
```bash
GET /dados/precos?cultura=soja&uf=SP
```

**Resposta**:
```json
{
  "ativo": true,
  "source": "price-local-index",
  "fallback": false,
  "cultura": "soja",
  "uf": "SP",
  "preco": 145.50,
  "unidade": "saca_60kg",
  "data_referencia": "2025-05-01",
  "observacao": "Preço médio regional"
}
```

**Endpoint em Lote**: `GET /dados/precos/lote`

Permite consultar preços para múltiplas culturas de uma vez:

**Parâmetros**:
- `uf`: Unidade Federativa (opcional)

**Exemplo**:
```bash
GET /dados/precos/lote?uf=SP
```

**Resposta**:
```json
{
  "uf": "SP",
  "culturas": {
    "soja": {
      "ativo": true,
      "source": "price-local-index",
      "preco": 145.50,
      "unidade": "saca_60kg",
      "data_referencia": "2025-05-01"
    },
    "milho": {
      "ativo": true,
      "source": "price-fallback",
      "fallback": true,
      "preco": 85.00,
      "unidade": "saca_60kg",
      "data_referencia": "2025-05-01"
    }
  }
}
```

**⚠️ Importante**: Os preços agrícolas são exibidos como referência. O cálculo de lucro ainda utiliza a base interna do sistema até a normalização de unidades. Isso garante consistência nos cálculos enquanto as unidades de medida são padronizadas.

## Risco Climático

O sistema calcula automaticamente o risco climático baseado em:

- **Alto**: Precipitação < 30mm ou Temperatura > 34°C
- **Médio**: Precipitação < 70mm  
- **Baixo**: Condições normais
- **Indeterminado**: Dados insuficientes

## Fallback e Cache

### Sistema de Fallback

Se a API externa falhar, o sistema automaticamente:

1. Retorna dados simulados baseados na localização
2. Define `fallback: true` na resposta
3. Inclui mensagem de erro em `error`

### Cache Inteligente

- **TTL padrão**: 1 hora para dados climáticos
- **Cache por localização**: Evita chamadas desnecessárias
- **Limpeza automática**: Remove itens expirados automaticamente

## Monitoramento

### Health Check

```bash
GET /health
```

Retorna informações sobre todos os provedores:

```json
{
  "status": "healthy",
  "data_mode": "hybrid",
  "providers": {
    "weather": "available",
    "zarc": "available",
    "prices": "available"
  },
  "provider_cache": {
    "total_items": 12,
    "valid_items": 10,
    "expired_items": 2
  },
  "zarc_index": {
    "loaded": true,
    "total_records": 15420,
    "culturas": 10,
    "estados": 27
  },
  "price_index": {
    "loaded": true,
    "total_records": 5,
    "culturas_com_preco": 5
  }
}
```

### Estatísticas de Cache

O endpoint `/health` inclui estatísticas detalhadas do cache de provedores para monitoramento de performance.

### Limpeza de Cache

```bash
POST /cache/limpar
```

Limpa o cache de todos os provedores (clima, ZARC e preços):

```json
{
  "message": "Cache limpo com sucesso",
  "items_removed": 12
}
```

## Integração nos Endpoints

Os três provedores são integrados automaticamente nos principais endpoints:

### Dashboard
```bash
GET /dashboard?lat=-21.56&lon=-50.45&uf=SP&municipio=Clementina&safra=2025/2026
```

Retorna dados climáticos, ZARC e preços integrados no plano recomendado.

### Recomendações
```bash
GET /recomendacoes?uf=SP&municipio=Clementina&safra=2025/2026
```

Inclui janelas ZARC e preços de referência para cada recomendação.

### Otimização Genética
```bash
POST /otimizar
{
  "objetivo": "equilibrado",
  "seed": 42,
  "location": {
    "lat": -21.56,
    "lon": -50.45,
    "uf": "SP",
    "municipio": "Clementina",
    "safra": "2025/2026"
  }
}
```

Aplica dados climáticos, ZARC e preços na otimização.

### Relatórios
```bash
POST /relatorio
{
  "objetivo": "equilibrado",
  "formato": "md",
  "location": {
    "lat": -21.56,
    "lon": -50.45,
    "uf": "SP",
    "municipio": "Clementina",
    "safra": "2025/2026"
  }
}
```

Inclui seções detalhadas sobre clima, ZARC e preços no relatório gerado.

## Próximos Provedores

### Planejados para Fases Futuras

1. **NASA POWER**: Dados solares e agroclimáticos complementares
2. **CONAB/CEPEA**: Cotações oficiais de preços agrícolas em tempo real
3. **Embrapa**: Dados de solo e recomendações técnicas

## Desenvolvimento Local

Para testar localmente:

```bash
# Iniciar API local
agroplan serve on

# Testar endpoint de clima
curl "http://localhost:8000/dados/clima?lat=-23.55&lon=-46.63&days=30"

# Testar endpoint de ZARC
curl "http://localhost:8000/dados/zarc?cultura=soja&uf=SP&municipio=Clementina&solo=2"

# Testar endpoint de preços
curl "http://localhost:8000/dados/precos?cultura=soja&uf=SP"

# Verificar health
curl "http://localhost:8000/health"
```

## Produção

O sistema funciona identicamente em:
- **API Local**: `http://localhost:8000`
- **API Render**: `https://agroplan-ai-api.onrender.com`

Ambas suportam os mesmos provedores e configurações.

## Normalização de Unidades (Próxima Fase)

Atualmente, os preços agrícolas são exibidos como referência e não afetam o cálculo de lucro. A próxima fase incluirá:

1. **Normalização de unidades**: Conversão de todas as unidades para uma base comum (tonelada)
2. **Padronização de produtividade**: Conversão para t/ha
3. **Recálculo de lucro**: Ativação de `PRICE_APPLY_TO_PROFIT=true` após normalização
4. **Validação**: Testes extensivos para garantir consistência nos cálculos

Isso garantirá que os preços de mercado sejam aplicados corretamente no cálculo de lucro, mantendo a precisão e confiabilidade do sistema.