# Integração de Dados Climáticos Reais

## Visão Geral

A partir da **Fase 7.3**, o AgroPlan AI integra dados climáticos reais no fluxo principal de planejamento, proporcionando maior precisão nas recomendações agrícolas.

## Funcionalidades

### 🌤️ Dados Climáticos Reais
- **Fonte**: Open-Meteo (gratuito, sem API key)
- **Cobertura**: Dados históricos dos últimos 30 dias (configurável)
- **Métricas**: Temperatura, precipitação, evapotranspiração, umidade, radiação solar
- **Fallback**: Dados simulados quando API indisponível

### 🧬 Integração no Algoritmo Genético
- **Ajuste de Risco**: Modificação automática baseada em condições climáticas
- **Classificação Climática**: Quente/Ameno/Frio baseado na temperatura
- **Disponibilidade Hídrica**: Alta/Média/Baixa baseada na precipitação
- **Contexto Preservado**: Dados climáticos incluídos em todas as respostas

## Endpoints Atualizados

### Dashboard
```bash
GET /dashboard?lat=-23.55&lon=-46.63&days=30
```

### Cenários
```bash
GET /cenarios?lat=-23.55&lon=-46.63&days=30
```

### Otimização
```bash
POST /otimizar
{
  "objetivo": "equilibrado",
  "lat": -23.55,
  "lon": -46.63,
  "days": 30
}
```

### Relatórios
```bash
POST /relatorio
{
  "objetivo": "equilibrado",
  "formato": "md",
  "lat": -23.55,
  "lon": -46.63,
  "days": 30
}
```

## Resposta com Clima Real

Todos os endpoints retornam o campo `clima_real`:

```json
{
  "clima_real": {
    "ativo": true,
    "source": "open-meteo",
    "temperatura_media": 21.2,
    "precipitacao_total": 79.5,
    "risco_climatico_estimado": "baixo",
    "clima_observado": "ameno",
    "agua_observada": "media",
    "ajuste_risco": -0.03,
    "fallback": false,
    "error": null
  }
}
```

## Ajustes de Risco Climático

| Risco Estimado | Ajuste Aplicado | Descrição |
|----------------|-----------------|-----------|
| **Alto** | +15% | Condições adversas (seca ou calor extremo) |
| **Médio** | +5% | Condições moderadamente desfavoráveis |
| **Baixo** | -3% | Condições favoráveis (leve benefício) |
| **Indeterminado** | 0% | Dados insuficientes |

## Classificação Climática

### Por Temperatura
- **Quente**: ≥ 28°C
- **Ameno**: 18°C - 27°C  
- **Frio**: < 18°C

### Por Precipitação
- **Alta**: > 120mm
- **Média**: 50-120mm
- **Baixa**: < 50mm

## Regiões de Teste

| Região | Latitude | Longitude | Características |
|--------|----------|-----------|-----------------|
| **São Paulo** | -23.55 | -46.63 | Clima subtropical |
| **Brasília** | -15.78 | -47.93 | Cerrado, estações definidas |
| **Ribeirão Preto** | -21.18 | -47.81 | Região canavieira |
| **Campo Grande** | -20.44 | -54.65 | Pantanal, agropecuária |
| **Londrina** | -23.31 | -51.16 | Norte do Paraná, soja |

## Cache e Performance

- **TTL**: 1 hora para dados climáticos
- **Cache Local**: Resultados armazenados em memória
- **Timeout**: 10 segundos para requisições Open-Meteo
- **Fallback Automático**: Dados simulados em caso de falha

## Modo Híbrido

O sistema opera em **DATA_MODE=hybrid** por padrão:

1. **Tenta API Real**: Open-Meteo primeiro
2. **Fallback Simulado**: Se API falhar
3. **Transparência**: Campo `fallback` indica origem dos dados
4. **Continuidade**: Sistema nunca para por falta de dados

## CLI Atualizada

A versão **1.0.9** da CLI inclui todas as funcionalidades climáticas:

```bash
# Instalar/atualizar
bun add -g agroplan-ai-cli@latest

# Verificar versão
agroplan --version
```

## Próximos Passos

### Fase 7.4 - NASA POWER
- Dados solares e agroclimáticos complementares
- Séries temporais históricas mais longas

### Fase 7.5 - ZARC (Zoneamento Agrícola)
- Dados oficiais de risco climático
- Períodos de plantio recomendados
- Portarias do MAPA

### Fase 7.6 - Frontend Climático
- Seletor visual de região
- Cards de dados climáticos
- Geolocalização automática
- Mapas interativos

## Exemplo de Uso

```bash
# Testar dados climáticos
curl "http://localhost:8000/dados/clima?lat=-23.55&lon=-46.63&days=30"

# Dashboard com clima de São Paulo
curl "http://localhost:8000/dashboard?lat=-23.55&lon=-46.63&days=30"

# Otimização com dados reais de Brasília
curl -X POST "http://localhost:8000/otimizar" \
  -H "Content-Type: application/json" \
  -d '{"objetivo":"equilibrado","lat":-15.78,"lon":-47.93,"days":30}'
```

## Monitoramento

Verificar status dos provedores:

```bash
curl "http://localhost:8000/health"
```

Resposta inclui:
- `data_mode`: "hybrid"
- `providers.weather`: "available"
- `provider_cache`: estatísticas do cache

---

**Status**: ✅ **Implementado e Funcionando**  
**Versão**: CLI 1.0.9 | Backend 5.0.0  
**Última Atualização**: 07/05/2026