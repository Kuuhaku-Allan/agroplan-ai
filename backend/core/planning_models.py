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
"""

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Optional, List, Dict
from enum import Enum


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
    LEVE = "leve"
    MEDIO = "medio"
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

    def to_dict(self) -> Dict:
        return {
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
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }


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
