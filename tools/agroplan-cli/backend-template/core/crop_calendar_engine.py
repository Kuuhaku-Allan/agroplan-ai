"""
Engine de Calendário Agrícola

Gera calendários de tarefas para culturas baseado em:
- Ciclo da cultura
- Data de plantio
- Características do talhão
- Contexto climático (opcional)
- Contexto ZARC (opcional)

Fase inicial: Base local para soja, milho e feijão
Fase futura: Integração com clima real e replanejamento
"""

from datetime import date, timedelta
from typing import Dict, List, Optional
import uuid

from .planning_models import (
    Field, CropCycle, CropPhase, CalendarTask,
    TaskType, TaskPriority, TaskStatus
)


# Base de Conhecimento Local - Fase 10.1

CROP_CYCLES: Dict[str, Dict] = {
    "soja": {
        "cycle_days": 120,
        "phases": [
            {
                "name": "germinacao",
                "days": 10,
                "description": "Emergência das plântulas",
                "critical_water": True,
                "tasks": [
                    {"type": "irrigate", "title": "Irrigar se não houver chuva", "priority": "high", "weather_sensitive": True},
                    {"type": "inspect_pests", "title": "Inspecionar germinação", "priority": "medium", "weather_sensitive": False}
                ]
            },
            {
                "name": "vegetativa",
                "days": 40,
                "description": "Crescimento vegetativo",
                "critical_water": False,
                "tasks": [
                    {"type": "fertilize", "title": "Aplicar fertilizante de cobertura", "priority": "high", "weather_sensitive": True},
                    {"type": "inspect_pests", "title": "Inspecionar pragas", "priority": "medium", "weather_sensitive": False},
                    {"type": "irrigate", "title": "Irrigar moderadamente", "priority": "medium", "weather_sensitive": True}
                ]
            },
            {
                "name": "florescimento",
                "days": 30,
                "description": "Floração e formação de vagens",
                "critical_water": True,
                "tasks": [
                    {"type": "irrigate", "title": "Irrigar - fase crítica", "priority": "critical", "weather_sensitive": True},
                    {"type": "inspect_diseases", "title": "Inspecionar doenças", "priority": "high", "weather_sensitive": False},
                    {"type": "monitor_growth", "title": "Monitorar temperatura", "priority": "medium", "weather_sensitive": False}
                ]
            },
            {
                "name": "enchimento_graos",
                "days": 30,
                "description": "Enchimento de grãos",
                "critical_water": True,
                "tasks": [
                    {"type": "irrigate", "title": "Irrigar - fase crítica", "priority": "critical", "weather_sensitive": True},
                    {"type": "monitor_growth", "title": "Monitorar maturação", "priority": "high", "weather_sensitive": False}
                ]
            },
            {
                "name": "maturacao",
                "days": 10,
                "description": "Maturação e secagem",
                "critical_water": False,
                "tasks": [
                    {"type": "harvest", "title": "Preparar colheita", "priority": "high", "weather_sensitive": True},
                    {"type": "monitor_growth", "title": "Monitorar umidade dos grãos", "priority": "medium", "weather_sensitive": False}
                ]
            }
        ],
        "optimal_temp_min": 20,
        "optimal_temp_max": 30,
        "critical_water_phases": ["germinacao", "florescimento", "enchimento_graos"],
        "harvest_window_days": 15
    },
    "milho": {
        "cycle_days": 140,
        "phases": [
            {
                "name": "germinacao",
                "days": 12,
                "description": "Emergência das plântulas",
                "critical_water": True,
                "tasks": [
                    {"type": "irrigate", "title": "Irrigar se não houver chuva", "priority": "high", "weather_sensitive": True},
                    {"type": "inspect_pests", "title": "Inspecionar germinação", "priority": "medium", "weather_sensitive": False}
                ]
            },
            {
                "name": "vegetativa",
                "days": 50,
                "description": "Crescimento vegetativo",
                "critical_water": False,
                "tasks": [
                    {"type": "fertilize", "title": "Aplicar fertilizante nitrogenado", "priority": "high", "weather_sensitive": True},
                    {"type": "inspect_pests", "title": "Inspecionar pragas (lagarta)", "priority": "high", "weather_sensitive": False},
                    {"type": "irrigate", "title": "Irrigar moderadamente", "priority": "medium", "weather_sensitive": True}
                ]
            },
            {
                "name": "florescimento",
                "days": 28,
                "description": "Floração e polinização",
                "critical_water": True,
                "tasks": [
                    {"type": "irrigate", "title": "Irrigar - fase crítica", "priority": "critical", "weather_sensitive": True},
                    {"type": "monitor_growth", "title": "Monitorar polinização", "priority": "high", "weather_sensitive": False}
                ]
            },
            {
                "name": "enchimento_graos",
                "days": 40,
                "description": "Enchimento de grãos",
                "critical_water": True,
                "tasks": [
                    {"type": "irrigate", "title": "Irrigar - fase crítica", "priority": "critical", "weather_sensitive": True},
                    {"type": "inspect_diseases", "title": "Inspecionar doenças foliares", "priority": "high", "weather_sensitive": False},
                    {"type": "monitor_growth", "title": "Monitorar desenvolvimento das espigas", "priority": "medium", "weather_sensitive": False}
                ]
            },
            {
                "name": "maturacao",
                "days": 10,
                "description": "Maturação fisiológica",
                "critical_water": False,
                "tasks": [
                    {"type": "harvest", "title": "Preparar colheita", "priority": "high", "weather_sensitive": True},
                    {"type": "monitor_growth", "title": "Monitorar umidade dos grãos", "priority": "medium", "weather_sensitive": False}
                ]
            }
        ],
        "optimal_temp_min": 18,
        "optimal_temp_max": 32,
        "critical_water_phases": ["germinacao", "florescimento", "enchimento_graos"],
        "harvest_window_days": 20
    },
    "feijao": {
        "cycle_days": 90,
        "phases": [
            {
                "name": "germinacao",
                "days": 8,
                "description": "Emergência das plântulas",
                "critical_water": True,
                "tasks": [
                    {"type": "irrigate", "title": "Irrigar se não houver chuva", "priority": "high", "weather_sensitive": True},
                    {"type": "inspect_pests", "title": "Inspecionar germinação", "priority": "medium", "weather_sensitive": False}
                ]
            },
            {
                "name": "vegetativa",
                "days": 30,
                "description": "Crescimento vegetativo",
                "critical_water": False,
                "tasks": [
                    {"type": "fertilize", "title": "Aplicar fertilizante de cobertura", "priority": "high", "weather_sensitive": True},
                    {"type": "inspect_pests", "title": "Inspecionar pragas (vaquinha, mosca-branca)", "priority": "high", "weather_sensitive": False},
                    {"type": "irrigate", "title": "Irrigar moderadamente", "priority": "medium", "weather_sensitive": True}
                ]
            },
            {
                "name": "florescimento",
                "days": 22,
                "description": "Floração e formação de vagens",
                "critical_water": True,
                "tasks": [
                    {"type": "irrigate", "title": "Irrigar - fase crítica", "priority": "critical", "weather_sensitive": True},
                    {"type": "inspect_diseases", "title": "Inspecionar doenças (antracnose, ferrugem)", "priority": "high", "weather_sensitive": False},
                    {"type": "monitor_growth", "title": "Monitorar formação de vagens", "priority": "medium", "weather_sensitive": False}
                ]
            },
            {
                "name": "enchimento_graos",
                "days": 20,
                "description": "Enchimento de grãos",
                "critical_water": True,
                "tasks": [
                    {"type": "irrigate", "title": "Irrigar - fase crítica", "priority": "critical", "weather_sensitive": True},
                    {"type": "monitor_growth", "title": "Monitorar desenvolvimento das vagens", "priority": "high", "weather_sensitive": False}
                ]
            },
            {
                "name": "maturacao",
                "days": 10,
                "description": "Maturação e secagem",
                "critical_water": False,
                "tasks": [
                    {"type": "harvest", "title": "Preparar colheita", "priority": "high", "weather_sensitive": True},
                    {"type": "monitor_growth", "title": "Monitorar umidade dos grãos", "priority": "medium", "weather_sensitive": False}
                ]
            }
        ],
        "optimal_temp_min": 18,
        "optimal_temp_max": 29,
        "critical_water_phases": ["germinacao", "florescimento", "enchimento_graos"],
        "harvest_window_days": 10
    }
}


def get_crop_cycle(cultura: str) -> Optional[CropCycle]:
    """
    Retorna o ciclo de uma cultura.
    
    Args:
        cultura: Nome da cultura
    
    Returns:
        CropCycle ou None se cultura não encontrada
    """
    if cultura not in CROP_CYCLES:
        return None
    
    cycle_data = CROP_CYCLES[cultura]
    
    phases = [
        CropPhase(
            name=phase["name"],
            days=phase["days"],
            description=phase["description"],
            critical_water=phase["critical_water"],
            tasks=[task["type"] for task in phase["tasks"]]
        )
        for phase in cycle_data["phases"]
    ]
    
    return CropCycle(
        culture=cultura,
        cycle_days=cycle_data["cycle_days"],
        phases=phases,
        critical_water_phases=cycle_data["critical_water_phases"],
        optimal_temp_min=cycle_data["optimal_temp_min"],
        optimal_temp_max=cycle_data["optimal_temp_max"],
        harvest_window_days=cycle_data["harvest_window_days"]
    )


def gerar_calendario_cultura(
    cultura: str,
    planting_date: date,
    field: Field,
    crop_plan_id: Optional[str] = None,
    weather_context: Optional[Dict] = None,
    zarc_context: Optional[Dict] = None
) -> Dict:
    """
    Gera calendário de tarefas para uma cultura.
    
    Args:
        cultura: Nome da cultura
        planting_date: Data de plantio
        field: Dados do talhão
        crop_plan_id: ID do plano de cultura (opcional)
        weather_context: Contexto climático (opcional, fase futura)
        zarc_context: Contexto ZARC (opcional, fase futura)
    
    Returns:
        Dict com calendário e informações do ciclo
    """
    
    # Verificar se cultura existe
    if cultura not in CROP_CYCLES:
        return {
            "error": f"Cultura '{cultura}' não encontrada",
            "culturas_disponiveis": list(CROP_CYCLES.keys())
        }
    
    cycle_data = CROP_CYCLES[cultura]
    crop_plan_id = crop_plan_id or str(uuid.uuid4())
    
    # Calcular data estimada de colheita
    estimated_harvest_date = planting_date + timedelta(days=cycle_data["cycle_days"])
    
    # Gerar tarefas
    tasks = []
    current_date = planting_date
    
    # Tarefa de preparação do solo (7 dias antes do plantio)
    prepare_date = planting_date - timedelta(days=7)
    tasks.append(
        CalendarTask(
            id=str(uuid.uuid4()),
            crop_plan_id=crop_plan_id,
            date=prepare_date,
            type=TaskType.PREPARE_SOIL,
            title="Preparar solo para plantio",
            description=f"Preparar solo {field.soil_type.value} para plantio de {cultura}",
            priority=TaskPriority.HIGH,
            source="system",
            weather_sensitive=False
        )
    )
    
    # Tarefa de plantio
    tasks.append(
        CalendarTask(
            id=str(uuid.uuid4()),
            crop_plan_id=crop_plan_id,
            date=planting_date,
            type=TaskType.PLANT,
            title=f"Plantar {cultura}",
            description=f"Plantio de {cultura} em {field.area_ha} ha",
            priority=TaskPriority.CRITICAL,
            source="system",
            weather_sensitive=True
        )
    )
    
    # Tarefas por fase
    for phase in cycle_data["phases"]:
        phase_start = current_date
        phase_end = current_date + timedelta(days=phase["days"])
        
        # Distribuir tarefas ao longo da fase
        for i, task_data in enumerate(phase["tasks"]):
            # Espaçar tarefas uniformemente na fase
            task_offset = (phase["days"] // (len(phase["tasks"]) + 1)) * (i + 1)
            task_date = phase_start + timedelta(days=task_offset)
            
            tasks.append(
                CalendarTask(
                    id=str(uuid.uuid4()),
                    crop_plan_id=crop_plan_id,
                    date=task_date,
                    type=TaskType[task_data["type"].upper()],
                    title=task_data["title"],
                    description=f"{task_data['title']} - Fase: {phase['description']}",
                    priority=TaskPriority[task_data["priority"].upper()],
                    source="system",
                    weather_sensitive=task_data["weather_sensitive"]
                )
            )
        
        current_date = phase_end
    
    # Tarefa de colheita
    tasks.append(
        CalendarTask(
            id=str(uuid.uuid4()),
            crop_plan_id=crop_plan_id,
            date=estimated_harvest_date,
            type=TaskType.HARVEST,
            title=f"Colher {cultura}",
            description=f"Colheita de {cultura} - Janela de {cycle_data['harvest_window_days']} dias",
            priority=TaskPriority.CRITICAL,
            source="system",
            weather_sensitive=True
        )
    )
    
    # Ordenar tarefas por data
    tasks.sort(key=lambda t: t.date)
    
    # Montar resposta
    return {
        "cultura": cultura,
        "planting_date": planting_date.isoformat(),
        "estimated_harvest_date": estimated_harvest_date.isoformat(),
        "cycle_days": cycle_data["cycle_days"],
        "field": field.to_dict(),
        "crop_plan_id": crop_plan_id,
        "cycle_info": {
            "optimal_temp_min": cycle_data["optimal_temp_min"],
            "optimal_temp_max": cycle_data["optimal_temp_max"],
            "critical_water_phases": cycle_data["critical_water_phases"],
            "harvest_window_days": cycle_data["harvest_window_days"],
            "phases": [
                {
                    "name": phase["name"],
                    "days": phase["days"],
                    "description": phase["description"],
                    "critical_water": phase["critical_water"]
                }
                for phase in cycle_data["phases"]
            ]
        },
        "tasks": [task.to_dict() for task in tasks],
        "total_tasks": len(tasks),
        "weather_sensitive_tasks": sum(1 for task in tasks if task.weather_sensitive),
        "critical_tasks": sum(1 for task in tasks if task.priority == TaskPriority.CRITICAL)
    }


def get_culturas_disponiveis() -> List[str]:
    """Retorna lista de culturas disponíveis no sistema"""
    return list(CROP_CYCLES.keys())


def get_cultura_info(cultura: str) -> Optional[Dict]:
    """
    Retorna informações resumidas de uma cultura.
    
    Args:
        cultura: Nome da cultura
    
    Returns:
        Dict com informações ou None se não encontrada
    """
    if cultura not in CROP_CYCLES:
        return None
    
    cycle_data = CROP_CYCLES[cultura]
    
    return {
        "cultura": cultura,
        "cycle_days": cycle_data["cycle_days"],
        "optimal_temp_min": cycle_data["optimal_temp_min"],
        "optimal_temp_max": cycle_data["optimal_temp_max"],
        "critical_water_phases": cycle_data["critical_water_phases"],
        "harvest_window_days": cycle_data["harvest_window_days"],
        "total_phases": len(cycle_data["phases"]),
        "phases_names": [phase["name"] for phase in cycle_data["phases"]]
    }
