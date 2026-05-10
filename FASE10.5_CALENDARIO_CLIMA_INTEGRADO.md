# Fase 10.5 - Calendário com Clima Integrado

**Status**: ✅ Concluída  
**Data**: 10/05/2026  
**Versão**: 1.0.34

## Objetivo

Integrar dados climáticos ao calendário agrícola, enriquecendo tarefas sensíveis ao clima com:
- Previsão meteorológica real (0-16 dias)
- Climatologia/histórico (17+ dias)
- Recomendações situacionais contextualizadas

## Estratégia Honesta sobre Previsão Climática

**Não fingimos ter previsão exata para ciclos longos (120+ dias).**

### Fontes de Dados

1. **0-16 dias**: Previsão meteorológica real
   - Fonte: Open-Meteo Forecast API
   - Confiança: Alta
   - Dados: temperatura, precipitação, probabilidade de chuva

2. **17+ dias**: Climatologia/histórico
   - Fonte: Fallback local baseado em médias mensais
   - Confiança: Média
   - Dados: médias históricas por região e mês
   - Futuro: Integração com NASA POWER Climatology API

## Implementação

### Backend

#### 1. Provider de Clima para Calendário (`backend/providers/calendar_weather_provider.py`)

**Funções principais:**

- `buscar_previsao_curto_prazo(lat, lon, start_date, days=16)`
  - Busca previsão real via Open-Meteo
  - Cache de 6 horas
  - Retorna: temperatura, precipitação, probabilidade

- `buscar_climatologia_longo_prazo(lat, lon, start_date, end_date)`
  - Usa fallback local mensal
  - Baseado em médias históricas do Brasil
  - Regiões: Sul, Sudeste, Norte

- `gerar_recomendacao_climatica(task_type, task_title, weather_data)`
  - Gera recomendações contextuais
  - Exemplos:
    - Irrigação + chuva ≥8mm: "Chuva prevista suficiente. Verifique o solo antes de irrigar."
    - Plantio + chuva >50mm: "Chuva elevada prevista. Avalie adiar o plantio."
    - Temperatura >35°C: "Calor elevado. Monitorar estresse hídrico."

#### 2. Adaptador de Clima (`backend/core/calendar_weather_adapter.py`)

**Função principal:**

- `enriquecer_calendario_com_clima(calendar, lat, lon)`
  - Enriquece tarefas sensíveis ao clima
  - Adiciona `weather_context` em cada tarefa
  - Gera resumo e avisos

**Estrutura do `weather_context`:**

```python
{
  "active": True,
  "source": "open-meteo",
  "forecast_type": "forecast",  # ou "climatology"
  "summary": "Previsão: 12.4mm de chuva, 18°C a 28°C",
  "precipitation_mm": 12.4,
  "precipitation_probability": 80,
  "temperature_min": 18.0,
  "temperature_max": 28.0,
  "recommendation": "Chuva prevista suficiente. Verifique o solo antes de irrigar.",
  "confidence": "alta"  # ou "media", "baixa"
}
```

#### 3. Endpoints Atualizados

**POST `/planejamento/calendario`**
- Aceita parâmetro `usar_clima: bool`
- Enriquece calendário se `usar_clima=true` e `lat/lon` fornecidos

**POST `/planejamento/talhoes/{field_id}/calendario`**
- Aceita parâmetro `usar_clima: bool`
- Usa lat/lon do talhão cadastrado

### Frontend

#### 1. Types (`frontend/lib/types.ts`)

**Novos tipos:**

```typescript
interface CalendarWeatherContext {
  active: boolean;
  source?: string;
  forecast_type?: "forecast" | "climatology";
  summary?: string;
  precipitation_mm?: number;
  precipitation_probability?: number;
  temperature_min?: number;
  temperature_max?: number;
  recommendation?: string;
  confidence?: "alta" | "media" | "baixa";
  reason?: string;
}

interface CropCalendarResponse {
  // ... campos existentes
  weather_enabled?: boolean;
  weather_summary?: {
    forecast_tasks: number;
    climatology_tasks: number;
    no_weather_tasks: number;
    sources: string[];
  };
  weather_warnings?: string[];
}

interface GenerateFieldCalendarPayload {
  cultura: string;
  planting_date: string;
  usar_clima?: boolean;
}
```

#### 2. Página de Planejamento (`frontend/app/planejamento/page.tsx`)

**Melhorias:**

- Toggle "Usar clima integrado" (visível apenas se talhão tem lat/lon)
- Validação: se `usar_clima=true` mas sem lat/lon, mostra erro
- Exibe resumo climático quando ativo
- Exibe avisos sobre previsão vs climatologia

**Exibição de tarefas:**

- Badge diferenciado por tipo:
  - Previsão real: azul/ciano
  - Climatologia: âmbar
- Mostra resumo climático
- Mostra recomendação contextual
- Badge de confiança (alta/média/baixa)

#### 3. Modo Guiado (`frontend/components/planning/guided-planning-wizard.tsx`)

**Melhorias:**

- Ativa clima integrado por padrão se talhão tem lat/lon
- Mostra aviso didático na etapa de calendário:
  - "Para os próximos 16 dias usamos previsão meteorológica real."
  - "Depois disso usamos climatologia/histórico, não previsão exata."
- Exibe coordenadas do talhão

## Exemplos de Recomendações

### Irrigação

- **Chuva ≥8mm**: "Chuva prevista suficiente. Verifique o solo antes de irrigar."
- **Chuva 3-8mm**: "Chuva moderada prevista. Irrigação pode ser parcial."
- **Chuva <3mm**: "Pouca chuva prevista. Irrigação provavelmente necessária."

### Plantio

- **Chuva >50mm**: "Chuva elevada prevista. Avalie adiar o plantio para evitar solo encharcado."
- **Chuva <5mm e prob <30%**: "Tempo seco previsto. Bom para plantio, mas prepare irrigação."
- **Chuva moderada**: "Condições adequadas para plantio. Chuva moderada prevista."

### Temperatura

- **Máxima >35°C**: "Calor elevado previsto. Monitorar estresse hídrico da cultura."
- **Mínima <5°C**: "Frio intenso previsto. Avaliar risco para a cultura."
- **Mínima <10°C**: "Temperatura baixa prevista. Monitorar desenvolvimento da cultura."

## Avisos ao Usuário

### Quando clima está ativo:

1. **Resumo climático:**
   - X tarefa(s) com previsão real
   - Y tarefa(s) com climatologia
   - Fontes: open-meteo, climate-fallback

2. **Avisos informativos:**
   - "X tarefa(s) usam climatologia/histórico (17+ dias). Não é previsão exata, apenas condições típicas do período."
   - "X tarefa(s) usam previsão meteorológica real (0-16 dias)."

### Quando clima não está disponível:

- "Para usar clima integrado, informe latitude e longitude do talhão."

## Versão e Features

**VERSION.json:**
```json
{
  "cli_version": "1.0.34",
  "backend_template_version": "1.0.34",
  "features": [
    ...
    "calendar_weather_integration"
  ]
}
```

## CLI

**Sincronização:**
- `backend/api.py` → `tools/agroplan-cli/backend-template/api.py`
- `backend/VERSION.json` → `tools/agroplan-cli/backend-template/VERSION.json`
- `backend/providers/calendar_weather_provider.py` → CLI
- `backend/core/calendar_weather_adapter.py` → CLI

**Publicação:**
```bash
cd tools/agroplan-cli
bun run build
npm publish --access public
```

## Testes

### Backend

✅ Imports de módulos weather OK
✅ API endpoints aceitam `usar_clima` parameter
✅ Enriquecimento de calendário funcional

### Frontend

✅ Build passa sem erros
✅ Types TypeScript corretos
✅ Toggle de clima integrado funcional
✅ Exibição de contexto climático em tarefas

## Critérios de Aceitação

- [x] Calendário aceita `usar_clima=true` parameter
- [x] Tarefas sensíveis ao clima recebem contexto
- [x] Open-Meteo usado para curto prazo (0-16 dias)
- [x] Longo prazo marcado como climatologia/fallback
- [x] UI diferencia previsão real de climatologia
- [x] Não há promessa falsa de previsão para ciclo inteiro
- [x] Build passa
- [x] CLI 1.0.34 pronta para publicação

## Próximos Passos

### Melhorias Futuras

1. **Integração NASA POWER**
   - Substituir fallback local por NASA POWER Climatology API
   - Dados históricos mais precisos por região

2. **Alertas Proativos**
   - Notificar usuário sobre eventos climáticos críticos
   - Sugerir ajustes no calendário

3. **Histórico de Acurácia**
   - Comparar previsões com clima real
   - Melhorar confiança das recomendações

4. **Integração com ZARC**
   - Cruzar dados climáticos com janelas ZARC
   - Alertar sobre riscos climáticos

## Conclusão

A Fase 10.5 foi concluída com sucesso. O calendário agrícola agora é um **assistente ativo** que:

- Fornece recomendações situacionais baseadas em clima
- É honesto sobre limitações de previsão
- Diferencia claramente previsão real de climatologia
- Ajuda o produtor a tomar decisões informadas

O sistema não finge ter previsão exata para 120+ dias, mas oferece contexto climático útil para planejamento de curto prazo e referência histórica para longo prazo.

---

**Commits:**
- `feat: add weather-aware crop calendar`
- Backend: weather provider, adapter, API endpoints
- Frontend: types, UI, guided mode
- CLI: sync backend-template, version 1.0.34
