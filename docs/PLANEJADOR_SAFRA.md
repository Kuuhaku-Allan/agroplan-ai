# Planejador de Safra Inteligente - Arquitetura

## Visão Geral

O **Planejador de Safra Inteligente** é o núcleo final do AgroPlan AI. Transforma a aplicação de um otimizador de culturas em um **assistente completo de planejamento e acompanhamento agrícola**.

### Objetivo

Permitir que o usuário:
1. **Crie ou selecione** um terreno
2. **Receba recomendações** de culturas baseadas em dados reais
3. **Gere um calendário agrícola** com tarefas por fase
4. **Acompanhe o ciclo** com alertas climáticos
5. **Replaneie** quando houver imprevistos

### Diferencial

**Não apenas "qual cultura plantar?"**, mas:
- 🗺️ Onde plantar
- 📅 Quando plantar
- 💧 Quando irrigar
- 🌱 Quando adubar
- 🌾 Quando colher
- 🔄 Quando reajustar o plano

---

## Modos de Uso

### Modo Guiado (Iniciantes)

**Wizard passo a passo:**

1. **Onde fica o terreno?**
   - UF, município, coordenadas (opcional)

2. **Como é o solo?**
   - Tipo: argiloso, arenoso, misto, siltoso
   - Relevo: plano, leve, médio, íngreme

3. **Qual o tamanho?**
   - Área em hectares

4. **Disponibilidade de água?**
   - Baixa, média, alta

5. **Qual o objetivo?**
   - Equilibrado, lucro, risco, sustentável

6. **Gerar recomendação**
   - Sistema usa AG + ZARC + clima + preços
   - Cria calendário automático

7. **Acompanhar ciclo**
   - Tarefas por fase
   - Alertas climáticos
   - Replanejamento por imprevistos

### Modo Avançado (Especialistas)

**Controle modular:**

- ✅ Assistência total
- ⚙️ Assistência parcial
- 📅 Apenas calendário
- 🌦️ Apenas clima
- 🌾 Apenas ZARC
- 💰 Apenas comparação econômica
- 🔧 Modo quase manual

**Permite desligar:**
- Clima
- ZARC
- Preços
- Assistente
- Recomendações de produtos

---

## Entidades Principais

### Property (Propriedade)

```python
@dataclass
class Property:
    id: str
    name: str
    uf: str
    municipio: str
    lat: Optional[float]
    lon: Optional[float]
    created_at: datetime
    updated_at: datetime
```

### Field (Talhão)

```python
@dataclass
class Field:
    id: str
    property_id: str
    name: str
    area_ha: float
    soil_type: str  # argiloso, arenoso, misto, siltoso
    slope: str  # plano, leve, médio, íngreme
    water_availability: str  # baixa, média, alta
    geometry: Optional[dict]  # GeoJSON para mapa
    created_at: datetime
```

### CropPlan (Plano de Cultura)

```python
@dataclass
class CropPlan:
    id: str
    field_id: str
    culture: str
    planting_date: date
    estimated_harvest_date: date
    objective: str  # equilibrado, lucro, risco, sustentavel
    status: str  # planned, active, completed, cancelled
    created_at: datetime
```

### CropCycle (Ciclo da Cultura)

```python
@dataclass
class CropCycle:
    culture: str
    cycle_days: int
    phases: List[CropPhase]
    critical_water_phase: str
    optimal_temp_min: float
    optimal_temp_max: float
```

### CalendarTask (Tarefa do Calendário)

```python
@dataclass
class CalendarTask:
    id: str
    crop_plan_id: str
    date: date
    type: str  # prepare_soil, plant, irrigate, fertilize, inspect, harvest
    title: str
    description: str
    priority: str  # low, medium, high, critical
    source: str  # system, user, weather_alert
    status: str  # pending, completed, skipped, rescheduled
    weather_sensitive: bool
    completed_at: Optional[datetime]
```

### WeatherAlert (Alerta Climático)

```python
@dataclass
class WeatherAlert:
    id: str
    crop_plan_id: str
    date: date
    alert_type: str  # rain, drought, heat, cold, frost
    severity: str  # info, warning, critical
    message: str
    action_suggested: Optional[str]
    created_at: datetime
```

### UserObservation (Observação do Usuário)

```python
@dataclass
class UserObservation:
    id: str
    crop_plan_id: str
    date: date
    note: str
    impact: str  # positive, neutral, negative
    created_at: datetime
```

### Intervention (Intervenção/Replanejamento)

```python
@dataclass
class Intervention:
    id: str
    crop_plan_id: str
    original_task_id: Optional[str]
    reason: str  # missed_task, weather_event, soil_condition, user_request
    suggested_action: str
    new_date: Optional[date]
    risk_adjustment: float
    created_at: datetime
    applied: bool
```

### PlanningSession (Sessão de Planejamento)

```python
@dataclass
class PlanningSession:
    id: str
    property_id: str
    mode: str  # guided, advanced
    objective: str
    fields_count: int
    cultures_recommended: List[str]
    created_at: datetime
```

---

## Fluxo do Usuário

### 1. Criar Terreno

**Manual (Fase 10.2):**
```
Formulário → Validação → Salvar → Conectar ZARC/Clima
```

**Mapa (Fase 10.8):**
```
Desenhar Polígono → Calcular Área → Detectar Município → Puxar Contexto
```

### 2. Receber Recomendação

```
Terreno + Objetivo → AG + ZARC + Clima + Preços → Plano Otimizado
```

### 3. Gerar Calendário

```
Cultura + Data Plantio + Terreno → Engine de Calendário → Lista de Tarefas
```

### 4. Acompanhar Ciclo

```
Tarefas Pendentes → Alertas Climáticos → Observações → Replanejamento
```

### 5. Replanejar

```
Imprevisto → Análise de Impacto → Nova Data/Ação → Ajuste de Risco
```

---

## Fontes de Dados

### Clima

| Horizonte | Fonte | Uso |
|-----------|-------|-----|
| 0-16 dias | Open-Meteo | Previsão real: chuva, temperatura, vento |
| 17+ dias | NASA POWER | Climatologia histórica, médias, radiação |

### Janelas de Plantio

| Fonte | Uso |
|-------|-----|
| ZARC/Embrapa/MAPA | Melhor período de plantio por cultura, município, solo |

### Solo

| Fonte | Uso |
|-------|-----|
| Embrapa Saúde do Solo | Contexto municipal/estadual de saúde e indicadores |
| MapBiomas | Uso e cobertura da terra, histórico |

### Localização

| Fonte | Uso |
|-------|-----|
| IBGE Localidades | Padronizar UF, município, códigos |

### Preços

| Fonte | Uso |
|-------|-----|
| Conab | Preços por cultura, UF, séries históricas |

### Insumos

| Fonte | Uso |
|-------|-----|
| Conab Insumos | Fertilizantes, sementes, defensivos, custo |
| Base própria | Categorias e recomendações gerais |

---

## Base de Conhecimento por Cultura

### Estrutura

```python
CROP_CYCLES = {
    "soja": {
        "cycle_days": 120,
        "phases": [
            {
                "name": "germinacao",
                "days": 10,
                "description": "Emergência das plântulas",
                "critical_water": True,
                "tasks": ["irrigate_if_no_rain", "inspect_germination"]
            },
            {
                "name": "vegetativa",
                "days": 40,
                "description": "Crescimento vegetativo",
                "critical_water": False,
                "tasks": ["fertilize", "inspect_pests", "irrigate_moderate"]
            },
            {
                "name": "florescimento",
                "days": 30,
                "description": "Floração e formação de vagens",
                "critical_water": True,
                "tasks": ["irrigate_critical", "inspect_diseases", "monitor_temperature"]
            },
            {
                "name": "enchimento_graos",
                "days": 30,
                "description": "Enchimento de grãos",
                "critical_water": True,
                "tasks": ["irrigate_critical", "monitor_maturation"]
            },
            {
                "name": "maturacao",
                "days": 10,
                "description": "Maturação e secagem",
                "critical_water": False,
                "tasks": ["prepare_harvest", "monitor_moisture"]
            }
        ],
        "optimal_temp_min": 20,
        "optimal_temp_max": 30,
        "critical_water_phases": ["germinacao", "florescimento", "enchimento_graos"],
        "harvest_window_days": 15
    }
}
```

### Culturas Iniciais (Fase 10.1)

**Base completa com 10 culturas (Fase 10.4):**

1. **Soja** - 120 dias
2. **Milho** - 140 dias
3. **Feijão** - 90 dias
4. **Café** - 730 dias (cultura perene)
5. **Cana** - 365 dias (semi-perene)
6. **Arroz** - 120 dias
7. **Trigo** - 120 dias
8. **Sorgo** - 110 dias
9. **Mandioca** - 300 dias
10. **Algodão** - 180 dias

Todas as culturas incluem:
- Ciclo completo com fases detalhadas
- Tarefas por fase com prioridades
- Temperaturas ótimas
- Fases críticas hídricas
- Janela de colheita
- Metadados (categoria, necessidade hídrica, notas de risco)
- Aviso de cautela sobre ajustes necessários

---

## Engine de Calendário

### Função Principal

```python
def gerar_calendario_cultura(
    cultura: str,
    planting_date: date,
    field: Field,
    weather_context: Optional[dict] = None,
    zarc_context: Optional[dict] = None
) -> List[CalendarTask]:
    """
    Gera calendário de tarefas para uma cultura.
    
    Args:
        cultura: Nome da cultura
        planting_date: Data de plantio
        field: Dados do talhão
        weather_context: Contexto climático (opcional)
        zarc_context: Contexto ZARC (opcional)
    
    Returns:
        Lista de CalendarTask ordenadas por data
    """
```

### Tipos de Tarefas

| Tipo | Descrição | Sensível ao Clima |
|------|-----------|-------------------|
| `prepare_soil` | Preparar solo | ❌ |
| `plant` | Plantar | ✅ (evitar chuva forte) |
| `irrigate` | Irrigar | ✅ (cancelar se chuva prevista) |
| `fertilize` | Adubar | ✅ (evitar chuva forte) |
| `inspect_pests` | Inspecionar pragas | ❌ |
| `inspect_diseases` | Inspecionar doenças | ❌ |
| `monitor_growth` | Monitorar crescimento | ❌ |
| `harvest` | Colher | ✅ (evitar chuva) |

### Alertas Climáticos

| Tipo | Condição | Ação |
|------|----------|------|
| `rain` | Chuva prevista > 10mm | Cancelar irrigação |
| `drought` | Sem chuva por 7+ dias | Aumentar irrigação |
| `heat` | Temperatura > 35°C | Irrigar mais, monitorar estresse |
| `cold` | Temperatura < 10°C | Proteger cultura, adiar plantio |
| `frost` | Temperatura < 0°C | Alerta crítico, risco de perda |

---

## Replanejamento por Imprevistos

### Cenários

1. **Tarefa não realizada**
   - Usuário: "Não consegui irrigar ontem"
   - Sistema: Reagendar para hoje, aumentar prioridade

2. **Chuva excessiva**
   - Usuário: "Choveu muito, solo encharcado"
   - Sistema: Adiar tarefas de solo, monitorar drenagem

3. **Seca prolongada**
   - Usuário: "Não choveu há 10 dias"
   - Sistema: Aumentar frequência de irrigação, alerta crítico

4. **Temperatura extrema**
   - Sistema detecta: Temperatura > 38°C por 3 dias
   - Sistema: Alerta de estresse térmico, irrigar mais

5. **Atraso no plantio**
   - Usuário: "Não consegui plantar na data prevista"
   - Sistema: Recalcular janela ZARC, ajustar risco

### Fluxo de Replanejamento

```
Imprevisto → Análise de Impacto → Sugestão de Ação → Validação Manual → Aplicar
```

---

## Limitações e Cautelas

### Previsão Climática

- ✅ **0-16 dias**: Previsão confiável
- ⚠️ **17+ dias**: Climatologia, não previsão exata
- ❌ **Não fingimos** ter previsão de 120 dias

### Recomendações de Produtos

- ✅ **Categorias gerais**: Tipo de fertilizante, ferramenta
- ⚠️ **Produtos específicos**: Com fonte e cautela
- ❌ **Defensivos/agrotóxicos**: Requer orientação técnica, legislação, dosagem

### Análise de Solo

- ✅ **Contexto regional**: Embrapa, MapBiomas
- ⚠️ **Estimativas**: Baseadas em dados públicos
- ❌ **Não substitui**: Análise laboratorial específica

### Consultoria Agronômica

- ✅ **Ferramenta de apoio**: Dados e recomendações gerais
- ⚠️ **Validação necessária**: Sempre consultar especialista
- ❌ **Não substitui**: Agrônomo profissional

---

## Fases de Implementação

### Fase 10.1 - Modelo e Engine Inicial ✅

- [x] Atualizar roadmap
- [x] Criar `docs/PLANEJADOR_SAFRA.md`
- [x] Definir modelos em `backend/core/planning_models.py`
- [x] Criar engine em `backend/core/crop_calendar_engine.py`
- [x] Endpoint `POST /planejamento/calendario`
- [x] Base local para soja, milho, feijão
- [x] CLI 1.0.30 publicada

### Fase 10.2 - Cadastro Manual ✅ COMPLETA

**Backend**:
- [x] Storage em JSON (`backend/core/field_storage.py`)
- [x] CRUD completo de talhões
- [x] Modelos Pydantic com validações
- [x] Endpoints:
  - `GET /planejamento/talhoes` - Listar talhões ✅
  - `POST /planejamento/talhoes` - Criar talhão ✅
  - `GET /planejamento/talhoes/{id}` - Obter talhão ✅
  - `PUT /planejamento/talhoes/{id}` - Atualizar talhão ✅
  - `DELETE /planejamento/talhoes/{id}` - Remover talhão ✅
  - `POST /planejamento/talhoes/{id}/calendario` - Gerar calendário ✅

**Frontend**:
- [x] Página `/planejamento` criada ✅
- [x] Formulário de criação de talhão ✅
- [x] Lista de talhões com ações ✅
- [x] Geração de calendário por talhão ✅
- [x] Visualização de tarefas com prioridades ✅
- [x] Sidebar com item "Planejamento" ✅

**Persistência**:
- [x] JSON local em `backend/data/user_fields/fields.json` ✅
- [x] API Local: dados persistem no PC do usuário ✅
- [x] API Render: dados temporários/voláteis (limitação atual) ✅
- [ ] Banco de dados PostgreSQL (fase futura)

**CLI**:
- [x] CLI 1.0.31 publicada ✅
- [x] Features: `manual_field_registration`, `crop_calendar_from_manual_field` ✅
- [x] Testado: endpoints funcionando corretamente ✅

**Testes Realizados**:
- ✅ GET /planejamento/talhoes - Lista vazia retornada
- ✅ POST /planejamento/talhoes - Talhão criado com sucesso
- ✅ POST /planejamento/talhoes/{id}/calendario - Calendário gerado com 15 tarefas
- ✅ GET /planejamento/culturas - 3 culturas disponíveis (soja, milho, feijão)
- ✅ CLI 1.0.31 instalada e atualizada
- ✅ API Local rodando em http://localhost:8000

**Commits**:
- Backend: `5465119`
- Frontend: `90bf939`
- Documentação e CLI: pendente commit final

### Fase 10.4 - Expandir Calendário para 10 Culturas ✅ COMPLETA

**Objetivo**: Expandir a base local do calendário agrícola para todas as 10 culturas do AgroPlan.

**Culturas Adicionadas**:
- [x] Café - 730 dias (cultura perene)
- [x] Cana - 365 dias (semi-perene)
- [x] Arroz - 120 dias
- [x] Trigo - 120 dias
- [x] Sorgo - 110 dias
- [x] Mandioca - 300 dias
- [x] Algodão - 180 dias

**Backend**:
- [x] Expandir `CROP_CYCLES` em `crop_calendar_engine.py` ✅
- [x] Adicionar metadados (category, water_need, risk_notes, calendar_notes) ✅
- [x] Adicionar aviso de cautela no calendário ✅
- [x] Endpoint `GET /planejamento/culturas` retorna 10 culturas ✅
- [x] Endpoint `GET /planejamento/culturas/{cultura}` funciona para todas ✅
- [x] Endpoint `POST /planejamento/calendario` funciona para todas ✅

**Características de Cada Cultura**:
- ✅ Ciclo completo com fases detalhadas
- ✅ Tarefas por fase com prioridades (low, medium, high, critical)
- ✅ Temperaturas ótimas (min/max)
- ✅ Fases críticas hídricas
- ✅ Janela de colheita
- ✅ Categoria (anual, perene, semi-perene)
- ✅ Necessidade hídrica (baixa, media, alta, muito_alta)
- ✅ Notas de risco específicas
- ✅ Notas sobre o calendário

**Aviso de Cautela**:
- ✅ Texto adicionado: "Este calendário é uma base inicial de planejamento. As datas e tarefas devem ser ajustadas conforme clima, solo, cultivar, manejo e orientação técnica."

**Documentação**:
- [x] Atualizar `docs/PLANEJADOR_SAFRA.md` ✅
- [ ] Atualizar `README.md`

**CLI**:
- [ ] Sincronizar backend-template
- [ ] Atualizar VERSION.json para 1.0.32
- [ ] Publicar CLI 1.0.32

**Testes**:
- [ ] Testar GET `/planejamento/culturas` (deve retornar 10)
- [ ] Testar POST `/planejamento/calendario` para cada cultura nova
- [ ] Frontend build test

**Commits**:
- [ ] Commit e push das alterações

**Status**: Backend completo, aguardando restart e testes ✅

### Fase 10.5 - Calendário com Clima

- [ ] Integrar Open-Meteo (0-16 dias)
- [ ] Integrar NASA POWER (17+ dias)
- [ ] Alertas de irrigação
- [ ] Ajuste de tarefas por clima

### Fase 10.6 - Replanejamento

- [ ] Capturar imprevistos
- [ ] Análise de impacto
- [ ] Sugestão de ação
- [ ] Histórico de intervenções

### Fase 10.7 - Modo Avançado

- [ ] Módulos ligáveis/desligáveis
- [ ] Controle fino de assistência

### Fase 10.8 - Mapa

- [ ] Desenhar polígono
- [ ] Calcular área
- [ ] Detectar contexto

---

## Cadastro Manual de Talhões (Fase 10.2)

### Visão Geral

O usuário pode cadastrar manualmente seus talhões através da página `/planejamento`. Os dados são armazenados em JSON local no backend.

### Persistência

**API Local** (`~/.agroplan/backend/data/user_fields/fields.json`):
- ✅ Dados persistem no PC do usuário
- ✅ Sobrevivem a reinicializações
- ✅ Backup manual possível

**API Render** (ambiente temporário):
- ⚠️ Dados podem ser perdidos ao reiniciar
- ⚠️ Ambiente efêmero (cold start)
- ⚠️ Não recomendado para produção

**Futuro** (Fase 11):
- 🔄 Migração para PostgreSQL
- 🔄 Persistência definitiva
- 🔄 Multiusuário com autenticação

### Endpoints

#### GET /planejamento/talhoes

Lista todos os talhões cadastrados.

**Resposta**:
```json
{
  "total": 2,
  "talhoes": [
    {
      "id": "uuid",
      "name": "Talhão Norte",
      "area_ha": 10.5,
      "soil_type": "argiloso",
      "slope": "plano",
      "water_availability": "media",
      "uf": "SP",
      "municipio": "Clementina",
      "lat": -21.56,
      "lon": -50.45,
      "created_at": "2026-05-10T12:00:00",
      "updated_at": "2026-05-10T12:00:00"
    }
  ]
}
```

#### POST /planejamento/talhoes

Cria um novo talhão.

**Request**:
```json
{
  "name": "Talhão Norte",
  "area_ha": 10.5,
  "soil_type": "argiloso",
  "slope": "plano",
  "water_availability": "media",
  "uf": "SP",
  "municipio": "Clementina",
  "lat": -21.56,
  "lon": -50.45
}
```

**Validações**:
- `area_ha` > 0
- `soil_type`: argiloso, arenoso, misto, siltoso
- `slope`: plano, suave, moderado, ingreme
- `water_availability`: baixa, media, alta

#### GET /planejamento/talhoes/{id}

Obtém um talhão pelo ID.

#### PUT /planejamento/talhoes/{id}

Atualiza um talhão existente.

#### DELETE /planejamento/talhoes/{id}

Remove um talhão.

#### POST /planejamento/talhoes/{id}/calendario

Gera calendário agrícola para um talhão cadastrado.

**Request**:
```json
{
  "cultura": "soja",
  "planting_date": "2026-10-15"
}
```

**Resposta**:
```json
{
  "cultura": "soja",
  "planting_date": "2026-10-15",
  "estimated_harvest_date": "2027-02-12",
  "cycle_days": 120,
  "field_data": { ... },
  "tasks": [
    {
      "date": "2026-10-08",
      "title": "Preparar solo para plantio",
      "description": "...",
      "priority": "high",
      "weather_sensitive": false
    }
  ],
  "total_tasks": 15,
  "weather_sensitive_tasks": 8,
  "critical_tasks": 4
}
```

### Página /planejamento

**Funcionalidades**:

1. **Resumo Superior**:
   - Talhões cadastrados
   - Área total
   - Culturas disponíveis
   - Calendário gerado

2. **Formulário de Criação**:
   - Nome do talhão
   - Área em hectares
   - Solo (select)
   - Relevo (select)
   - Água (select)
   - UF e município (opcional)
   - Coordenadas (opcional)

3. **Lista de Talhões**:
   - Cards com informações do talhão
   - Botão "Remover"
   - Seletor de cultura
   - Seletor de data de plantio
   - Botão "Gerar Calendário"

4. **Visualização de Calendário**:
   - Tarefas ordenadas por data
   - Badges de prioridade (crítica, alta, média, baixa)
   - Badge "Sensível ao clima"
   - Descrição de cada tarefa

**Estados**:
- Loading ao carregar dados
- Loading ao criar talhão
- Loading ao gerar calendário
- Estado vazio: "Nenhum talhão cadastrado ainda"
- Alertas de sucesso/erro

---

## Próximos Passos

1. ✅ Atualizar README roadmap
2. ✅ Criar este documento
3. ✅ Criar `planning_models.py`
4. ✅ Criar `crop_calendar_engine.py`
5. ✅ Criar endpoint `/planejamento/calendario`
6. ✅ Testar com soja, milho, feijão
7. ✅ Criar storage de talhões
8. ✅ Criar endpoints CRUD
9. ✅ Criar página `/planejamento`
10. ✅ CLI 1.0.31 publicada
11. ⏳ Próxima: Fase 10.3 - Modo Guiado

---

**Status**: Fase 10.1 em desenvolvimento  
**Última atualização**: 2026-05-10
