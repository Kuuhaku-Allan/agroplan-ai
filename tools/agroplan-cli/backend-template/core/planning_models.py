"""
Modelos de Domínio para Planejador de Safra Inteligente

Define as entidades principais do sistema de planejamento agrícola:
- Property: Propriedade rural
- Field: Talhão/campo
- CropPlan: Plano de cultura
- CropCycle: Ciclo da cultura
- CalendarTask: Tarefa do calendário
- WeatherAlert: Alerta climático
- UserObservation: Observação do usuário
- Intervention: Intervenção/replanejamento
- PlanningSession: Sessão de planejamento

Modelos Pydantic para API:
- ManualFieldCreate: Criação de talhão manual
- ManualFieldUpdate: Atualização de talhão manual
- ManualFieldResponse: Resposta de talhão manual
"""

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Optional, List, Dict
from enum import Enum
from pydantic import BaseModel, Field as PydanticField, field_validator


# Enums para tipos padronizados

class SoilType(str, Enum):
    """Tipos de solo"""
    ARGILOSO = "argiloso"
    ARENOSO = "arenoso"
    MISTO = "misto"
    SILTOSO = "siltoso"


class Slope(str, Enum):
    """Tipos de relevo"""
    PLANO = "plano"
    SUAVE = "suave"
    MODERADO = "moderado"
    INGREME = "ingreme"


class WaterAvailability(str, Enum):
    """Disponibilidade de água"""
    BAIXA = "baixa"
    MEDIA = "media"
    ALTA = "alta"


class Objective(str, Enum):
    """Objetivos de otimização"""
    EQUILIBRADO = "equilibrado"
    LUCRO = "lucro"
    RISCO = "risco"
    SUSTENTAVEL = "sustentavel"


class PlanStatus(str, Enum):
    """Status do plano de cultura"""
    PLANNED = "planned"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskType(str, Enum):
    """Tipos de tarefa"""
    PREPARE_SOIL = "prepare_soil"
    PLANT = "plant"
    IRRIGATE = "irrigate"
    FERTILIZE = "fertilize"
    INSPECT_PESTS = "inspect_pests"
    INSPECT_DISEASES = "inspect_diseases"
    MONITOR_GROWTH = "monitor_growth"
    HARVEST = "harvest"


class TaskPriority(str, Enum):
    """Prioridade da tarefa"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TaskStatus(str, Enum):
    """Status da tarefa"""
    PENDING = "pending"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    RESCHEDULED = "rescheduled"


class AlertType(str, Enum):
    """Tipos de alerta climático"""
    RAIN = "rain"
    DROUGHT = "drought"
    HEAT = "heat"
    COLD = "cold"
    FROST = "frost"


class AlertSeverity(str, Enum):
    """Severidade do alerta"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class InterventionReason(str, Enum):
    """Razão da intervenção"""
    MISSED_TASK = "missed_task"
    WEATHER_EVENT = "weather_event"
    SOIL_CONDITION = "soil_condition"
    USER_REQUEST = "user_request"


class PlanningMode(str, Enum):
    """Modo de planejamento"""
    GUIDED = "guided"
    ADVANCED = "advanced"


# Modelos de Domínio

@dataclass
class Property:
    """Propriedade rural"""
    id: str
    name: str
    uf: str
    municipio: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "name": self.name,
            "uf": self.uf,
            "municipio": self.municipio,
            "lat": self.lat,
            "lon": self.lon,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


@dataclass
class Field:
    """Talhão/campo"""
    id: str
    property_id: str
    name: str
    area_ha: float
    soil_type: SoilType
    slope: Slope
    water_availability: WaterAvailability
    geometry: Optional[Dict] = None  # GeoJSON para mapa
    created_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "property_id": self.property_id,
            "name": self.name,
            "area_ha": self.area_ha,
            "soil_type": self.soil_type.value,
            "slope": self.slope.value,
            "water_availability": self.water_availability.value,
            "geometry": self.geometry,
            "created_at": self.created_at.isoformat()
        }


@dataclass
class CropPlan:
    """Plano de cultura para um talhão"""
    id: str
    field_id: str
    culture: str
    planting_date: date
    estimated_harvest_date: date
    objective: Objective
    status: PlanStatus = PlanStatus.PLANNED
    created_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "field_id": self.field_id,
            "culture": self.culture,
            "planting_date": self.planting_date.isoformat(),
            "estimated_harvest_date": self.estimated_harvest_date.isoformat(),
            "objective": self.objective.value,
            "status": self.status.value,
            "created_at": self.created_at.isoformat()
        }


@dataclass
class CropPhase:
    """Fase do ciclo da cultura"""
    name: str
    days: int
    description: str
    critical_water: bool
    tasks: List[str]


@dataclass
class CropCycle:
    """Ciclo completo de uma cultura"""
    culture: str
    cycle_days: int
    phases: List[CropPhase]
    critical_water_phases: List[str]
    optimal_temp_min: float
    optimal_temp_max: float
    harvest_window_days: int

    def to_dict(self) -> Dict:
        return {
            "culture": self.culture,
            "cycle_days": self.cycle_days,
            "phases": [
                {
                    "name": phase.name,
                    "days": phase.days,
                    "description": phase.description,
                    "critical_water": phase.critical_water,
                    "tasks": phase.tasks
                }
                for phase in self.phases
            ],
            "critical_water_phases": self.critical_water_phases,
            "optimal_temp_min": self.optimal_temp_min,
            "optimal_temp_max": self.optimal_temp_max,
            "harvest_window_days": self.harvest_window_days
        }


@dataclass
class CalendarTask:
    """Tarefa do calendário agrícola"""
    id: str
    crop_plan_id: str
    date: date
    type: TaskType
    title: str
    description: str
    priority: TaskPriority
    source: str  # system, user, weather_alert
    status: TaskStatus = TaskStatus.PENDING
    weather_sensitive: bool = False
    completed_at: Optional[datetime] = None
    adjusted: bool = False  # Se a tarefa foi ajustada por estar no passado
    original_date: Optional[date] = None  # Data original antes do ajuste

    def to_dict(self) -> Dict:
        result = {
            "id": self.id,
            "crop_plan_id": self.crop_plan_id,
            "date": self.date.isoformat(),
            "type": self.type.value,
            "title": self.title,
            "description": self.description,
            "priority": self.priority.value,
            "source": self.source,
            "status": self.status.value,
            "weather_sensitive": self.weather_sensitive,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "adjusted": self.adjusted
        }
        
        if self.original_date:
            result["original_date"] = self.original_date.isoformat()
        
        return result


@dataclass
class WeatherAlert:
    """Alerta climático"""
    id: str
    crop_plan_id: str
    date: date
    alert_type: AlertType
    severity: AlertSeverity
    message: str
    action_suggested: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "crop_plan_id": self.crop_plan_id,
            "date": self.date.isoformat(),
            "alert_type": self.alert_type.value,
            "severity": self.severity.value,
            "message": self.message,
            "action_suggested": self.action_suggested,
            "created_at": self.created_at.isoformat()
        }


@dataclass
class UserObservation:
    """Observação do usuário sobre o cultivo"""
    id: str
    crop_plan_id: str
    date: date
    note: str
    impact: str  # positive, neutral, negative
    created_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "crop_plan_id": self.crop_plan_id,
            "date": self.date.isoformat(),
            "note": self.note,
            "impact": self.impact,
            "created_at": self.created_at.isoformat()
        }


@dataclass
class Intervention:
    """Intervenção/replanejamento"""
    id: str
    crop_plan_id: str
    reason: InterventionReason
    suggested_action: str
    original_task_id: Optional[str] = None
    new_date: Optional[date] = None
    risk_adjustment: float = 0.0
    created_at: datetime = field(default_factory=datetime.now)
    applied: bool = False

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "crop_plan_id": self.crop_plan_id,
            "original_task_id": self.original_task_id,
            "reason": self.reason.value,
            "suggested_action": self.suggested_action,
            "new_date": self.new_date.isoformat() if self.new_date else None,
            "risk_adjustment": self.risk_adjustment,
            "created_at": self.created_at.isoformat(),
            "applied": self.applied
        }


@dataclass
class PlanningSession:
    """Sessão de planejamento"""
    id: str
    property_id: str
    mode: PlanningMode
    objective: Objective
    fields_count: int
    cultures_recommended: List[str]
    created_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "property_id": self.property_id,
            "mode": self.mode.value,
            "objective": self.objective.value,
            "fields_count": self.fields_count,
            "cultures_recommended": self.cultures_recommended,
            "created_at": self.created_at.isoformat()
        }


# Modelos Pydantic para API

class ManualFieldCreate(BaseModel):
    """Modelo para criação de talhão manual"""
    name: str = PydanticField(..., min_length=1, max_length=100, description="Nome do talhão")
    area_ha: float = PydanticField(..., gt=0, description="Área em hectares")
    soil_type: str = PydanticField(..., description="Tipo de solo")
    slope: str = PydanticField(..., description="Tipo de relevo")
    water_availability: str = PydanticField(..., description="Disponibilidade de água")
    uf: Optional[str] = PydanticField(None, min_length=2, max_length=2, description="UF")
    municipio: Optional[str] = PydanticField(None, max_length=100, description="Município")
    lat: Optional[float] = PydanticField(None, ge=-90, le=90, description="Latitude")
    lon: Optional[float] = PydanticField(None, ge=-180, le=180, description="Longitude")
    
    @field_validator('soil_type')
    @classmethod
    def validate_soil_type(cls, v: str) -> str:
        allowed = ['argiloso', 'arenoso', 'misto', 'siltoso']
        if v not in allowed:
            raise ValueError(f'soil_type deve ser um de: {", ".join(allowed)}')
        return v
    
    @field_validator('slope')
    @classmethod
    def validate_slope(cls, v: str) -> str:
        allowed = ['plano', 'suave', 'moderado', 'ingreme']
        if v not in allowed:
            raise ValueError(f'slope deve ser um de: {", ".join(allowed)}')
        return v
    
    @field_validator('water_availability')
    @classmethod
    def validate_water_availability(cls, v: str) -> str:
        allowed = ['baixa', 'media', 'alta']
        if v not in allowed:
            raise ValueError(f'water_availability deve ser um de: {", ".join(allowed)}')
        return v


class ManualFieldUpdate(BaseModel):
    """Modelo para atualização de talhão manual"""
    name: Optional[str] = PydanticField(None, min_length=1, max_length=100)
    area_ha: Optional[float] = PydanticField(None, gt=0)
    soil_type: Optional[str] = None
    slope: Optional[str] = None
    water_availability: Optional[str] = None
    uf: Optional[str] = PydanticField(None, min_length=2, max_length=2)
    municipio: Optional[str] = PydanticField(None, max_length=100)
    lat: Optional[float] = PydanticField(None, ge=-90, le=90)
    lon: Optional[float] = PydanticField(None, ge=-180, le=180)
    
    @field_validator('soil_type')
    @classmethod
    def validate_soil_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = ['argiloso', 'arenoso', 'misto', 'siltoso']
            if v not in allowed:
                raise ValueError(f'soil_type deve ser um de: {", ".join(allowed)}')
        return v
    
    @field_validator('slope')
    @classmethod
    def validate_slope(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = ['plano', 'suave', 'moderado', 'ingreme']
            if v not in allowed:
                raise ValueError(f'slope deve ser um de: {", ".join(allowed)}')
        return v
    
    @field_validator('water_availability')
    @classmethod
    def validate_water_availability(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = ['baixa', 'media', 'alta']
            if v not in allowed:
                raise ValueError(f'water_availability deve ser um de: {", ".join(allowed)}')
        return v


class ManualFieldResponse(BaseModel):
    """Modelo de resposta de talhão manual"""
    id: str
    name: str
    area_ha: float
    soil_type: str
    slope: str
    water_availability: str
    uf: Optional[str] = None
    municipio: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True


class GenerateCalendarRequest(BaseModel):
    """Modelo para geração de calendário"""
    cultura: str = PydanticField(..., description="Nome da cultura")
    planting_date: str = PydanticField(..., description="Data de plantio (YYYY-MM-DD)")
    
    @field_validator('cultura')
    @classmethod
    def validate_cultura(cls, v: str) -> str:
        allowed = ['soja', 'milho', 'feijao', 'cafe', 'cana', 'arroz', 'trigo', 'sorgo', 'mandioca', 'algodao']
        if v not in allowed:
            raise ValueError(f'cultura deve ser uma de: {", ".join(allowed)}')
        return v


# ===== Funções de Normalização =====

def normalize_slope(value: str) -> str:
    """
    Normaliza valores antigos de slope para os novos padrões.
    
    Mapeamento:
    - leve → suave
    - medio/médio → moderado
    - moderada → moderado
    
    Args:
        value: Valor de slope a normalizar
    
    Returns:
        Valor normalizado
    """
    mapping = {
        "leve": "suave",
        "medio": "moderado",
        "médio": "moderado",
        "moderada": "moderado"
    }
    return mapping.get(value.lower() if value else "", value)


def normalize_soil_type(value: str) -> str:
    """
    Normaliza valores de tipo de solo.
    
    Args:
        value: Valor de soil_type a normalizar
    
    Returns:
        Valor normalizado (lowercase, sem acentos)
    """
    if not value:
        return value
    
    # Remover acentos e normalizar
    normalized = value.lower().strip()
    
    # Mapeamentos específicos se necessário
    mapping = {
        "argiloso": "argiloso",
        "arenoso": "arenoso",
        "misto": "misto",
        "siltoso": "siltoso"
    }
    
    return mapping.get(normalized, normalized)


def normalize_water_availability(value: str) -> str:
    """
    Normaliza valores de disponibilidade de água.
    
    Args:
        value: Valor de water_availability a normalizar
    
    Returns:
        Valor normalizado (lowercase, sem acentos)
    """
    if not value:
        return value
    
    # Remover acentos e normalizar
    normalized = value.lower().strip()
    
    # Mapeamentos específicos
    mapping = {
        "baixa": "baixa",
        "media": "media",
        "média": "media",
        "alta": "alta"
    }
    
    return mapping.get(normalized, normalized)


# ===== Modelos de Replanejamento por Imprevistos (Fase 10.6) =====

class EventType(str, Enum):
    """Tipos de imprevistos agrícolas"""
    MISSED_IRRIGATION = "missed_irrigation"
    HEAVY_RAIN = "heavy_rain"
    NO_RAIN = "no_rain"
    MISSED_FERTILIZATION = "missed_fertilization"
    UNAVAILABLE_DAY = "unavailable_day"
    SOIL_TOO_WET = "soil_too_wet"
    SOIL_TOO_DRY = "soil_too_dry"
    PEST_OBSERVATION = "pest_observation"
    DISEASE_OBSERVATION = "disease_observation"
    OTHER = "other"


class RiskLevel(str, Enum):
    """Nível de risco da sugestão"""
    BAIXO = "baixo"
    MEDIO = "medio"
    ALTO = "alto"


class ReplanningEvent(BaseModel):
    """Imprevisto registrado pelo usuário"""
    event_type: EventType = PydanticField(..., description="Tipo do imprevisto")
    date: str = PydanticField(..., description="Data do imprevisto (YYYY-MM-DD)")
    description: str = PydanticField(..., description="Descrição do imprevisto")
    affected_task_id: Optional[str] = PydanticField(None, description="ID da tarefa afetada (opcional)")
    severity: Optional[str] = PydanticField(None, description="Severidade (leve, moderada, grave)")
    notes: Optional[str] = PydanticField(None, description="Notas adicionais")


class ReplanningSuggestion(BaseModel):
    """Sugestão de ajuste no calendário"""
    id: Optional[str] = PydanticField(None, description="Identificador único da sugestão")
    action: str = PydanticField(..., description="Ação sugerida")
    original_date: Optional[str] = PydanticField(None, description="Data original da tarefa")
    suggested_date: Optional[str] = PydanticField(None, description="Data sugerida para reagendamento")
    reason: str = PydanticField(..., description="Motivo da sugestão")
    risk_level: RiskLevel = PydanticField(..., description="Nível de risco")
    requires_manual_validation: bool = PydanticField(..., description="Se exige validação manual")
    affected_task_id: Optional[str] = PydanticField(None, description="ID da tarefa afetada")


class ReplanningRequest(BaseModel):
    """Requisição de replanejamento"""
    calendar: dict = PydanticField(..., description="Calendário agrícola atual")
    event: ReplanningEvent = PydanticField(..., description="Imprevisto registrado")


class ReplanningResponse(BaseModel):
    """Resposta do motor de replanejamento"""
    event: ReplanningEvent
    suggestions: List[ReplanningSuggestion]
    updated_tasks: List[dict]
    warnings: List[str]
    summary: str


class ApplyReplanningRequest(BaseModel):
    """Requisição para aplicar uma sugestão de replanejamento"""
    calendar: dict = PydanticField(..., description="Calendário agrícola atual")
    suggestion: ReplanningSuggestion = PydanticField(..., description="A sugestão a ser aplicada")
    event: Optional[ReplanningEvent] = PydanticField(None, description="O imprevisto que gerou a sugestão")


class ApplyReplanningResponse(BaseModel):
    """Resposta da aplicação de replanejamento"""
    summary: str = PydanticField(..., description="Resumo da aplicação")
    original_calendar: dict = PydanticField(..., description="O calendário original intacto")
    updated_calendar: dict = PydanticField(..., description="O calendário com a sugestão aplicada")
    applied_suggestion: ReplanningSuggestion = PydanticField(..., description="A sugestão que foi aplicada")
    change_log: List[dict] = PydanticField(..., description="Log de alterações feitas")
    warnings: List[str] = PydanticField(..., description="Avisos importantes sobre a aplicação")
