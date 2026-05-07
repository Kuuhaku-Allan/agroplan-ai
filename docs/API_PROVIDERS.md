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

### 1. Open-Meteo (Clima)

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

Retorna informações sobre provedores:

```json
{
  "status": "healthy",
  "data_mode": "hybrid",
  "providers": {
    "weather": "available"
  },
  "provider_cache": {
    "total_items": 5,
    "valid_items": 3,
    "expired_items": 2
  }
}
```

### Estatísticas de Cache

O endpoint `/health` inclui estatísticas detalhadas do cache de provedores para monitoramento de performance.

## Próximos Provedores

### Planejados para Fase 7.3+

1. **NASA POWER**: Dados solares e agroclimáticos complementares
2. **ZARC**: Zoneamento Agrícola de Risco Climático (dados oficiais)
3. **Preços Agrícolas**: CONAB/CEPEA para cotações reais

## Desenvolvimento Local

Para testar localmente:

```bash
# Iniciar API local
agroplan serve on

# Testar endpoint
curl "http://localhost:8000/dados/clima?lat=-23.55&lon=-46.63&days=30"

# Verificar health
curl "http://localhost:8000/health"
```

## Produção

O sistema funciona identicamente em:
- **API Local**: `http://localhost:8000`
- **API Render**: `https://agroplan-ai-api.onrender.com`

Ambas suportam os mesmos provedores e configurações.