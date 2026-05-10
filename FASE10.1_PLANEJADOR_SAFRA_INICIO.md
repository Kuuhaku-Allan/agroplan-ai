# Fase 10.1 - Planejador de Safra Inteligente: Modelo e Engine Inicial

**Status**: ✅ Concluída  
**Data**: 2026-05-10  
**Commit**: `9712306` - feat: add smart crop planning roadmap and calendar models

---

## Objetivo

Iniciar a transformação do AgroPlan AI de um **otimizador de culturas** para um **assistente completo de planejamento e acompanhamento agrícola**.

### Visão

Não apenas "qual cultura plantar?", mas:
- 🗺️ Onde plantar
- 📅 Quando plantar
- 💧 Quando irrigar
- 🌱 Quando adubar
- 🌾 Quando colher
- 🔄 Quando reajustar o plano

---

## Entregas

### 1. Roadmap Atualizado ✅

**Arquivo**: `README.md`

- ❌ Removido roadmap antigo/desatualizado (Fases 7-12 genéricas)
- ✅ Adicionado macro-roadmap do Planejador de Safra Inteligente
- ✅ Explicada estratégia de dados climáticos:
  - **0-16 dias**: Previsão real (Open-Meteo)
  - **17+ dias**: Climatologia histórica (NASA POWER)
- ✅ Definidos 3 níveis de seleção de terreno:
  - Nível 1: Manual (Fase 10.2)
  - Nível 2: Mapa com desenho (Fase 10.8)
  - Nível 3: Busca automática (futuro distante)

### 2. Documentação de Arquitetura ✅

**Arquivo**: `docs/PLANEJADOR_SAFRA.md`

Conteúdo completo:
- ✅ Visão geral e diferencial
- ✅ Modos de uso (Guiado vs Avançado)
- ✅ Entidades principais (9 modelos)
- ✅ Fluxo do usuário (5 etapas)
- ✅ Fontes de dados (clima, ZARC, solo, preços, insumos)
- ✅ Base de conhecimento por cultura
- ✅ Engine de calendário
- ✅ Replanejamento por imprevistos
- ✅ Limitações e cautelas
- ✅ Fases de implementação

### 3. Modelos de Domínio ✅

**Arquivo**: `backend/core/planning_models.py`

**9 modelos criados**:

1. **Property** - Propriedade rural
   - id, name, uf, municipio, lat, lon

2. **Field** - Talhão/campo
   - id, property_id, name, area_ha, soil_type, slope, water_availability, geometry

3. **CropPlan** - Plano de cultura
   - id, field_id, culture, planting_date, estimated_harvest_date, objective, status

4. **CropCycle** - Ciclo da cultura
   - culture, cycle_days, phases, critical_water_phases, optimal_temp_min/max

5. **CalendarTask** - Tarefa do calendário
   - id, crop_plan_id, date, type, title, description, priority, source, status, weather_sensitive

6. **WeatherAlert** - Alerta climático
   - id, crop_plan_id, date, alert_type, severity, message, action_suggested

7. **UserObservation** - Observação do usuário
   - id, crop_plan_id, date, note, impact

8. **Intervention** - Intervenção/replanejamento
   - id, crop_plan_id, reason, suggested_action, new_date, risk_adjustment, applied

9. **PlanningSession** - Sessão de planejamento
   - id, property_id, mode, objective, fields_count, cultures_recommended

**Enums criados**:
- SoilType, Slope, WaterAvailability
- Objective, PlanStatus
- TaskType, TaskPriority, TaskStatus
- AlertType, AlertSeverity
- InterventionReason, PlanningMode

### 4. Engine de Calendário ✅

**Arquivo**: `backend/core/crop_calendar_engine.py`

**Base de conhecimento local**:

| Cultura | Ciclo | Fases | Temp Ótima | Fases Críticas Água |
|---------|-------|-------|------------|---------------------|
| **Soja** | 120 dias | 5 | 20-30°C | germinação, florescimento, enchimento |
| **Milho** | 140 dias | 5 | 18-32°C | germinação, florescimento, enchimento |
| **Feijão** | 90 dias | 5 | 18-29°C | germinação, florescimento, enchimento |

**Fases por cultura**:
1. Germinação (8-12 dias)
2. Vegetativa (30-50 dias)
3. Florescimento (22-30 dias)
4. Enchimento de grãos (20-40 dias)
5. Maturação (10 dias)

**Tipos de tarefas**:
- `prepare_soil` - Preparar solo
- `plant` - Plantar
- `irrigate` - Irrigar (sensível ao clima)
- `fertilize` - Adubar (sensível ao clima)
- `inspect_pests` - Inspecionar pragas
- `inspect_diseases` - Inspecionar doenças
- `monitor_growth` - Monitorar crescimento
- `harvest` - Colher (sensível ao clima)

**Funções principais**:
- `get_crop_cycle(cultura)` - Retorna ciclo da cultura
- `gerar_calendario_cultura(...)` - Gera calendário de tarefas
- `get_culturas_disponiveis()` - Lista culturas disponíveis
- `get_cultura_info(cultura)` - Informações resumidas

### 5. Endpoints da API ✅

**Arquivo**: `backend/api.py`

#### POST /planejamento/calendario

Gera calendário agrícola para uma cultura.

**Request**:
```json
{
  "cultura": "soja",
  "planting_date": "2026-10-15",
  "field": {
    "name": "Talhão 1",
    "area_ha": 10.5,
    "soil_type": "argiloso",
    "slope": "plano",
    "water_availability": "media"
  }
}
```

**Response**:
```json
{
  "cultura": "soja",
  "planting_date": "2026-10-15",
  "estimated_harvest_date": "2027-02-12",
  "cycle_days": 120,
  "field": {...},
  "crop_plan_id": "uuid",
  "cycle_info": {
    "optimal_temp_min": 20,
    "optimal_temp_max": 30,
    "critical_water_phases": ["germinacao", "florescimento", "enchimento_graos"],
    "harvest_window_days": 15,
    "phases": [...]
  },
  "tasks": [...],
  "total_tasks": 15,
  "weather_sensitive_tasks": 8,
  "critical_tasks": 4
}
```

#### GET /planejamento/culturas

Lista culturas disponíveis.

**Response**:
```json
{
  "total": 3,
  "culturas": ["soja", "milho", "feijao"],
  "detalhes": {
    "soja": {
      "cultura": "soja",
      "cycle_days": 120,
      "optimal_temp_min": 20,
      "optimal_temp_max": 30,
      "critical_water_phases": ["germinacao", "florescimento", "enchimento_graos"],
      "harvest_window_days": 15,
      "total_phases": 5,
      "phases_names": ["germinacao", "vegetativa", "florescimento", "enchimento_graos", "maturacao"]
    }
  }
}
```

#### GET /planejamento/culturas/{cultura}

Obtém informações detalhadas de uma cultura.

**Response**:
```json
{
  "cultura": "soja",
  "cycle_days": 120,
  "optimal_temp_min": 20,
  "optimal_temp_max": 30,
  "critical_water_phases": ["germinacao", "florescimento", "enchimento_graos"],
  "harvest_window_days": 15,
  "total_phases": 5,
  "phases_names": ["germinacao", "vegetativa", "florescimento", "enchimento_graos", "maturacao"]
}
```

### 6. Testes ✅

**Arquivo**: `backend/test_calendar.py`

**Resultados**:
```
✓ 3 culturas disponíveis: soja, milho, feijão
✓ Soja: 120 dias, 15 tarefas, 8 sensíveis ao clima, 4 críticas
✓ Milho: 140 dias, 15 tarefas
✓ Feijão: 90 dias, 15 tarefas
✓ Erro esperado para cultura não existente
```

**Exemplo de calendário gerado (Soja)**:
```
1. 2026-10-08 - Preparar solo para plantio (high)
2. 2026-10-15 - Plantar soja (critical)
3. 2026-10-18 - Irrigar se não houver chuva (high)
4. 2026-10-21 - Inspecionar germinação (medium)
5. 2026-11-04 - Aplicar fertilizante de cobertura (high)
...
13. 2027-02-05 - Preparar colheita (high)
14. 2027-02-08 - Monitorar umidade dos grãos (medium)
15. 2027-02-12 - Colher soja (critical)
```

---

## Tecnologias

- **Python 3.11+**
- **FastAPI** - Endpoints REST
- **Dataclasses** - Modelos de domínio
- **Enums** - Tipos padronizados
- **UUID** - Identificadores únicos

---

## Arquitetura

### Camadas

```
┌─────────────────────────────────────┐
│         API Endpoints               │
│  /planejamento/calendario           │
│  /planejamento/culturas             │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    Crop Calendar Engine             │
│  - gerar_calendario_cultura()       │
│  - get_crop_cycle()                 │
│  - get_culturas_disponiveis()       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    Base de Conhecimento Local       │
│  CROP_CYCLES = {                    │
│    "soja": {...},                   │
│    "milho": {...},                  │
│    "feijao": {...}                  │
│  }                                  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│       Domain Models                 │
│  - Field, CropPlan, CalendarTask    │
│  - CropCycle, CropPhase             │
└─────────────────────────────────────┘
```

### Fluxo de Geração de Calendário

```
1. Receber: cultura, planting_date, field
2. Buscar: CROP_CYCLES[cultura]
3. Calcular: estimated_harvest_date
4. Gerar tarefas:
   - Preparar solo (7 dias antes)
   - Plantar (data informada)
   - Tarefas por fase (distribuídas)
   - Colher (data estimada)
5. Ordenar por data
6. Retornar calendário completo
```

---

## Próximos Passos

### Fase 10.2 - Cadastro Manual de Terrenos

- [ ] Formulário para criar talhão manualmente
- [ ] Campos: nome, área, solo, relevo, água, UF, município, coordenadas
- [ ] CRUD básico de propriedades e talhões
- [ ] Conectar com ZARC, clima e preços existentes
- [ ] Persistência em memória (sem banco ainda)

### Fase 10.3 - Modo Guiado

- [ ] Wizard passo a passo
- [ ] Perguntas simples sobre terreno e objetivo
- [ ] Recomendação automática de culturas
- [ ] Geração de calendário simplificado

### Fase 10.4 - Calendário Agrícola Completo

- [ ] Expandir base para 10 culturas
- [ ] Tarefas mais detalhadas por fase
- [ ] Alertas básicos por cultura

### Fase 10.5 - Calendário com Clima

- [ ] Integrar Open-Meteo (0-16 dias)
- [ ] Integrar NASA POWER (17+ dias)
- [ ] Alertas de irrigação baseados em chuva
- [ ] Ajuste de tarefas por condições climáticas

---

## Limitações Atuais

### Fase 10.1

- ✅ Base local (sem APIs externas ainda)
- ✅ 3 culturas apenas (soja, milho, feijão)
- ✅ Tarefas genéricas (não personalizadas por região)
- ✅ Sem integração com clima real
- ✅ Sem replanejamento por imprevistos
- ✅ Sem persistência (sem banco de dados)
- ✅ Sem frontend (apenas API)

### Será Resolvido em Fases Futuras

- ⏳ Fase 10.2: Cadastro manual de terrenos
- ⏳ Fase 10.4: 10 culturas completas
- ⏳ Fase 10.5: Integração com clima real
- ⏳ Fase 10.6: Replanejamento por imprevistos
- ⏳ Fase 11: Persistência em PostgreSQL
- ⏳ Fase 12: Fontes de dados avançadas

---

## Honestidade sobre Clima

### O que NÃO fazemos

❌ Fingir que temos previsão exata de 120 dias  
❌ Prometer dados que não existem  
❌ Substituir agrônomo profissional

### O que fazemos

✅ Usar previsão real para 0-16 dias (Open-Meteo)  
✅ Usar climatologia histórica para 17+ dias (NASA POWER)  
✅ Explicar limitações claramente  
✅ Recomendar validação com especialista

---

## Diferencial do AgroPlan AI

### Antes (Fases 1-9)

**Otimizador de Culturas**:
- Qual cultura plantar?
- Quanto lucro esperar?
- Qual o risco?

### Agora (Fase 10+)

**Assistente de Ciclo Completo**:
- Onde plantar? → Cadastro de terrenos
- Quando plantar? → ZARC + clima
- Como cuidar? → Calendário de tarefas
- Quando irrigar? → Alertas climáticos
- Quando adubar? → Fases da cultura
- Quando colher? → Janela de colheita
- E se houver imprevisto? → Replanejamento

---

## Conclusão

A Fase 10.1 estabelece a **fundação arquitetural** do Planejador de Safra Inteligente:

✅ **Roadmap claro** para as próximas 8 subfases  
✅ **Documentação completa** da arquitetura  
✅ **Modelos de domínio** bem definidos  
✅ **Engine funcional** com 3 culturas  
✅ **Endpoints testados** e funcionando  
✅ **Base sólida** para expansão

**Próximo passo**: Fase 10.2 - Cadastro Manual de Terrenos

---

**Commit**: `9712306`  
**Branch**: `main`  
**Status**: ✅ Pushed to origin
