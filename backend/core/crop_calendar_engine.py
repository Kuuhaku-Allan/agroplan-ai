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
    },
    "cafe": {
        "cycle_days": 730,
        "phases": [
            {
                "name": "preparo",
                "days": 30,
                "description": "Preparo do solo e coveamento",
                "critical_water": False,
                "tasks": [
                    {"type": "prepare_soil", "title": "Preparar solo e covas", "priority": "high", "weather_sensitive": False},
                    {"type": "fertilize", "title": "Aplicar calcário e adubação de base", "priority": "high", "weather_sensitive": True}
                ]
            },
            {
                "name": "plantio",
                "days": 60,
                "description": "Plantio de mudas e estabelecimento",
                "critical_water": True,
                "tasks": [
                    {"type": "plant", "title": "Plantar mudas de café", "priority": "critical", "weather_sensitive": True},
                    {"type": "irrigate", "title": "Irrigar mudas - fase crítica", "priority": "critical", "weather_sensitive": True},
                    {"type": "inspect_pests", "title": "Monitorar pegamento das mudas", "priority": "high", "weather_sensitive": False}
                ]
            },
            {
                "name": "conducao",
                "days": 365,
                "description": "Condução e formação da lavoura",
                "critical_water": False,
                "tasks": [
                    {"type": "fertilize", "title": "Aplicar adubação de crescimento", "priority": "high", "weather_sensitive": True},
                    {"type": "inspect_pests", "title": "Monitorar pragas e doenças", "priority": "high", "weather_sensitive": False},
                    {"type": "monitor_growth", "title": "Avaliar desenvolvimento vegetativo", "priority": "medium", "weather_sensitive": False},
                    {"type": "irrigate", "title": "Irrigar conforme necessidade", "priority": "medium", "weather_sensitive": True}
                ]
            },
            {
                "name": "pre_producao",
                "days": 180,
                "description": "Preparação para primeira produção",
                "critical_water": False,
                "tasks": [
                    {"type": "fertilize", "title": "Aplicar adubação de produção", "priority": "high", "weather_sensitive": True},
                    {"type": "inspect_diseases", "title": "Monitorar sanidade da lavoura", "priority": "high", "weather_sensitive": False},
                    {"type": "monitor_growth", "title": "Avaliar floração inicial", "priority": "medium", "weather_sensitive": False}
                ]
            },
            {
                "name": "colheita",
                "days": 95,
                "description": "Primeira colheita",
                "critical_water": False,
                "tasks": [
                    {"type": "monitor_growth", "title": "Monitorar maturação dos frutos", "priority": "high", "weather_sensitive": False},
                    {"type": "harvest", "title": "Preparar colheita", "priority": "high", "weather_sensitive": True}
                ]
            }
        ],
        "optimal_temp_min": 18,
        "optimal_temp_max": 28,
        "critical_water_phases": ["plantio"],
        "harvest_window_days": 60,
        "category": "perene",
        "water_need": "media",
        "risk_notes": "Sensível a geadas e déficit hídrico em fases críticas.",
        "calendar_notes": "Calendário simplificado para implantação e primeiros manejos. Cultura perene com ciclo longo."
    },
    "cana": {
        "cycle_days": 365,
        "phases": [
            {
                "name": "preparo",
                "days": 15,
                "description": "Preparo do solo",
                "critical_water": False,
                "tasks": [
                    {"type": "prepare_soil", "title": "Preparar solo para plantio", "priority": "high", "weather_sensitive": False},
                    {"type": "fertilize", "title": "Aplicar adubação de base", "priority": "high", "weather_sensitive": True}
                ]
            },
            {
                "name": "plantio",
                "days": 30,
                "description": "Plantio de mudas e brotação",
                "critical_water": True,
                "tasks": [
                    {"type": "plant", "title": "Plantar mudas de cana", "priority": "critical", "weather_sensitive": True},
                    {"type": "irrigate", "title": "Irrigar para brotação", "priority": "high", "weather_sensitive": True},
                    {"type": "inspect_pests", "title": "Monitorar brotação", "priority": "medium", "weather_sensitive": False}
                ]
            },
            {
                "name": "perfilhamento",
                "days": 60,
                "description": "Perfilhamento e estabelecimento",
                "critical_water": False,
                "tasks": [
                    {"type": "fertilize", "title": "Aplicar adubação de cobertura", "priority": "high", "weather_sensitive": True},
                    {"type": "inspect_pests", "title": "Monitorar plantas daninhas", "priority": "high", "weather_sensitive": False},
                    {"type": "irrigate", "title": "Irrigar moderadamente", "priority": "medium", "weather_sensitive": True}
                ]
            },
            {
                "name": "crescimento",
                "days": 180,
                "description": "Crescimento vegetativo intenso",
                "critical_water": False,
                "tasks": [
                    {"type": "inspect_pests", "title": "Monitorar pragas (broca, cigarrinha)", "priority": "high", "weather_sensitive": False},
                    {"type": "monitor_growth", "title": "Avaliar desenvolvimento", "priority": "medium", "weather_sensitive": False},
                    {"type": "irrigate", "title": "Irrigar conforme necessidade", "priority": "medium", "weather_sensitive": True}
                ]
            },
            {
                "name": "maturacao",
                "days": 60,
                "description": "Maturação e acúmulo de sacarose",
                "critical_water": False,
                "tasks": [
                    {"type": "monitor_growth", "title": "Monitorar maturação", "priority": "high", "weather_sensitive": False},
                    {"type": "harvest", "title": "Preparar colheita", "priority": "high", "weather_sensitive": True}
                ]
            },
            {
                "name": "colheita",
                "days": 20,
                "description": "Colheita",
                "critical_water": False,
                "tasks": [
                    {"type": "harvest", "title": "Colher cana", "priority": "critical", "weather_sensitive": True}
                ]
            }
        ],
        "optimal_temp_min": 20,
        "optimal_temp_max": 35,
        "critical_water_phases": ["plantio"],
        "harvest_window_days": 30,
        "category": "semi-perene",
        "water_need": "alta",
        "risk_notes": "Sensível a geadas. Requer manejo adequado de plantas daninhas.",
        "calendar_notes": "Calendário para cana-planta (primeiro ciclo). Soqueiras têm ciclo diferente."
    },
    "arroz": {
        "cycle_days": 120,
        "phases": [
            {
                "name": "preparo",
                "days": 10,
                "description": "Preparo do solo e sistematização",
                "critical_water": False,
                "tasks": [
                    {"type": "prepare_soil", "title": "Preparar solo para plantio", "priority": "high", "weather_sensitive": False},
                    {"type": "fertilize", "title": "Aplicar adubação de base", "priority": "high", "weather_sensitive": True}
                ]
            },
            {
                "name": "germinacao",
                "days": 15,
                "description": "Germinação e emergência",
                "critical_water": True,
                "tasks": [
                    {"type": "plant", "title": "Semear arroz", "priority": "critical", "weather_sensitive": True},
                    {"type": "irrigate", "title": "Manter lâmina d'água", "priority": "critical", "weather_sensitive": True},
                    {"type": "inspect_pests", "title": "Monitorar emergência", "priority": "medium", "weather_sensitive": False}
                ]
            },
            {
                "name": "vegetativa",
                "days": 40,
                "description": "Crescimento vegetativo e perfilhamento",
                "critical_water": True,
                "tasks": [
                    {"type": "fertilize", "title": "Aplicar adubação nitrogenada", "priority": "high", "weather_sensitive": True},
                    {"type": "irrigate", "title": "Manter manejo hídrico", "priority": "high", "weather_sensitive": True},
                    {"type": "inspect_pests", "title": "Monitorar pragas e plantas daninhas", "priority": "high", "weather_sensitive": False}
                ]
            },
            {
                "name": "reproducao",
                "days": 30,
                "description": "Floração e formação de grãos",
                "critical_water": True,
                "tasks": [
                    {"type": "irrigate", "title": "Manter lâmina d'água - fase crítica", "priority": "critical", "weather_sensitive": True},
                    {"type": "inspect_diseases", "title": "Monitorar doenças (brusone)", "priority": "high", "weather_sensitive": False},
                    {"type": "monitor_growth", "title": "Avaliar floração", "priority": "medium", "weather_sensitive": False}
                ]
            },
            {
                "name": "maturacao",
                "days": 25,
                "description": "Maturação dos grãos",
                "critical_water": False,
                "tasks": [
                    {"type": "monitor_growth", "title": "Monitorar maturação", "priority": "high", "weather_sensitive": False},
                    {"type": "harvest", "title": "Preparar colheita", "priority": "high", "weather_sensitive": True}
                ]
            }
        ],
        "optimal_temp_min": 20,
        "optimal_temp_max": 35,
        "critical_water_phases": ["germinacao", "vegetativa", "reproducao"],
        "harvest_window_days": 15,
        "category": "anual",
        "water_need": "muito_alta",
        "risk_notes": "Requer manejo hídrico intensivo. Sensível a déficit hídrico.",
        "calendar_notes": "Calendário para arroz irrigado. Arroz de sequeiro tem manejo diferente."
    },
    "trigo": {
        "cycle_days": 120,
        "phases": [
            {
                "name": "preparo",
                "days": 10,
                "description": "Preparo do solo",
                "critical_water": False,
                "tasks": [
                    {"type": "prepare_soil", "title": "Preparar solo para plantio", "priority": "high", "weather_sensitive": False},
                    {"type": "fertilize", "title": "Aplicar adubação de base", "priority": "high", "weather_sensitive": True}
                ]
            },
            {
                "name": "germinacao",
                "days": 12,
                "description": "Germinação e emergência",
                "critical_water": True,
                "tasks": [
                    {"type": "plant", "title": "Semear trigo", "priority": "critical", "weather_sensitive": True},
                    {"type": "irrigate", "title": "Irrigar se necessário", "priority": "high", "weather_sensitive": True},
                    {"type": "inspect_pests", "title": "Monitorar emergência", "priority": "medium", "weather_sensitive": False}
                ]
            },
            {
                "name": "perfilhamento",
                "days": 35,
                "description": "Perfilhamento",
                "critical_water": False,
                "tasks": [
                    {"type": "fertilize", "title": "Aplicar adubação nitrogenada", "priority": "high", "weather_sensitive": True},
                    {"type": "inspect_pests", "title": "Monitorar pragas (pulgão)", "priority": "high", "weather_sensitive": False},
                    {"type": "irrigate", "title": "Irrigar moderadamente", "priority": "medium", "weather_sensitive": True}
                ]
            },
            {
                "name": "espigamento",
                "days": 28,
                "description": "Espigamento e floração",
                "critical_water": True,
                "tasks": [
                    {"type": "irrigate", "title": "Irrigar - fase crítica", "priority": "critical", "weather_sensitive": True},
                    {"type": "inspect_diseases", "title": "Monitorar doenças foliares", "priority": "high", "weather_sensitive": False},
                    {"type": "monitor_growth", "title": "Avaliar floração", "priority": "medium", "weather_sensitive": False}
                ]
            },
            {
                "name": "enchimento_graos",
                "days": 25,
                "description": "Enchimento de grãos",
                "critical_water": True,
                "tasks": [
                    {"type": "irrigate", "title": "Irrigar - fase crítica", "priority": "critical", "weather_sensitive": True},
                    {"type": "monitor_growth", "title": "Monitorar desenvolvimento dos grãos", "priority": "high", "weather_sensitive": False}
                ]
            },
            {
                "name": "maturacao",
                "days": 10,
                "description": "Maturação",
                "critical_water": False,
                "tasks": [
                    {"type": "harvest", "title": "Preparar colheita", "priority": "high", "weather_sensitive": True},
                    {"type": "monitor_growth", "title": "Monitorar umidade dos grãos", "priority": "medium", "weather_sensitive": False}
                ]
            }
        ],
        "optimal_temp_min": 10,
        "optimal_temp_max": 24,
        "critical_water_phases": ["germinacao", "espigamento", "enchimento_graos"],
        "harvest_window_days": 12,
        "category": "anual",
        "water_need": "media",
        "risk_notes": "Sensível a chuvas excessivas na colheita. Requer clima ameno.",
        "calendar_notes": "Calendário para trigo de inverno. Adaptar conforme região e cultivar."
    },
    "sorgo": {
        "cycle_days": 110,
        "phases": [
            {
                "name": "preparo",
                "days": 8,
                "description": "Preparo do solo",
                "critical_water": False,
                "tasks": [
                    {"type": "prepare_soil", "title": "Preparar solo para plantio", "priority": "high", "weather_sensitive": False},
                    {"type": "fertilize", "title": "Aplicar adubação de base", "priority": "high", "weather_sensitive": True}
                ]
            },
            {
                "name": "germinacao",
                "days": 10,
                "description": "Germinação e emergência",
                "critical_water": True,
                "tasks": [
                    {"type": "plant", "title": "Semear sorgo", "priority": "critical", "weather_sensitive": True},
                    {"type": "irrigate", "title": "Irrigar se necessário", "priority": "high", "weather_sensitive": True},
                    {"type": "inspect_pests", "title": "Monitorar emergência", "priority": "medium", "weather_sensitive": False}
                ]
            },
            {
                "name": "vegetativa",
                "days": 40,
                "description": "Crescimento vegetativo",
                "critical_water": False,
                "tasks": [
                    {"type": "fertilize", "title": "Aplicar adubação nitrogenada", "priority": "high", "weather_sensitive": True},
                    {"type": "inspect_pests", "title": "Monitorar pragas (pulgão, lagarta)", "priority": "high", "weather_sensitive": False},
                    {"type": "irrigate", "title": "Irrigar moderadamente", "priority": "medium", "weather_sensitive": True}
                ]
            },
            {
                "name": "florescimento",
                "days": 22,
                "description": "Florescimento e polinização",
                "critical_water": True,
                "tasks": [
                    {"type": "irrigate", "title": "Irrigar - fase crítica", "priority": "critical", "weather_sensitive": True},
                    {"type": "monitor_growth", "title": "Avaliar floração", "priority": "medium", "weather_sensitive": False}
                ]
            },
            {
                "name": "enchimento_graos",
                "days": 20,
                "description": "Enchimento de grãos",
                "critical_water": True,
                "tasks": [
                    {"type": "irrigate", "title": "Irrigar - fase crítica", "priority": "critical", "weather_sensitive": True},
                    {"type": "monitor_growth", "title": "Monitorar desenvolvimento dos grãos", "priority": "high", "weather_sensitive": False}
                ]
            },
            {
                "name": "maturacao",
                "days": 10,
                "description": "Maturação",
                "critical_water": False,
                "tasks": [
                    {"type": "harvest", "title": "Preparar colheita", "priority": "high", "weather_sensitive": True},
                    {"type": "monitor_growth", "title": "Monitorar umidade dos grãos", "priority": "medium", "weather_sensitive": False}
                ]
            }
        ],
        "optimal_temp_min": 21,
        "optimal_temp_max": 35,
        "critical_water_phases": ["germinacao", "florescimento", "enchimento_graos"],
        "harvest_window_days": 15,
        "category": "anual",
        "water_need": "baixa",
        "risk_notes": "Tolerante à seca. Boa opção para regiões com déficit hídrico.",
        "calendar_notes": "Calendário para sorgo granífero. Sorgo forrageiro tem manejo diferente."
    },
    "mandioca": {
        "cycle_days": 300,
        "phases": [
            {
                "name": "preparo",
                "days": 15,
                "description": "Preparo do solo e seleção de manivas",
                "critical_water": False,
                "tasks": [
                    {"type": "prepare_soil", "title": "Preparar solo para plantio", "priority": "high", "weather_sensitive": False},
                    {"type": "fertilize", "title": "Aplicar adubação de base", "priority": "high", "weather_sensitive": True}
                ]
            },
            {
                "name": "plantio",
                "days": 30,
                "description": "Plantio de manivas e brotação",
                "critical_water": True,
                "tasks": [
                    {"type": "plant", "title": "Plantar manivas", "priority": "critical", "weather_sensitive": True},
                    {"type": "irrigate", "title": "Irrigar para brotação", "priority": "high", "weather_sensitive": True},
                    {"type": "inspect_pests", "title": "Monitorar brotação", "priority": "medium", "weather_sensitive": False}
                ]
            },
            {
                "name": "estabelecimento",
                "days": 60,
                "description": "Estabelecimento e crescimento inicial",
                "critical_water": False,
                "tasks": [
                    {"type": "inspect_pests", "title": "Controlar plantas daninhas", "priority": "high", "weather_sensitive": False},
                    {"type": "fertilize", "title": "Aplicar adubação de cobertura", "priority": "medium", "weather_sensitive": True},
                    {"type": "irrigate", "title": "Irrigar se necessário", "priority": "medium", "weather_sensitive": True}
                ]
            },
            {
                "name": "desenvolvimento",
                "days": 120,
                "description": "Desenvolvimento vegetativo e formação de raízes",
                "critical_water": False,
                "tasks": [
                    {"type": "inspect_pests", "title": "Monitorar pragas (mandarová, ácaros)", "priority": "high", "weather_sensitive": False},
                    {"type": "monitor_growth", "title": "Avaliar desenvolvimento", "priority": "medium", "weather_sensitive": False},
                    {"type": "irrigate", "title": "Irrigar conforme necessidade", "priority": "low", "weather_sensitive": True}
                ]
            },
            {
                "name": "engrossamento",
                "days": 60,
                "description": "Engrossamento das raízes",
                "critical_water": False,
                "tasks": [
                    {"type": "monitor_growth", "title": "Avaliar desenvolvimento das raízes", "priority": "high", "weather_sensitive": False},
                    {"type": "inspect_pests", "title": "Monitorar sanidade", "priority": "medium", "weather_sensitive": False}
                ]
            },
            {
                "name": "colheita",
                "days": 15,
                "description": "Colheita",
                "critical_water": False,
                "tasks": [
                    {"type": "harvest", "title": "Colher mandioca", "priority": "high", "weather_sensitive": True}
                ]
            }
        ],
        "optimal_temp_min": 20,
        "optimal_temp_max": 35,
        "critical_water_phases": ["plantio"],
        "harvest_window_days": 60,
        "category": "anual",
        "water_need": "baixa",
        "risk_notes": "Tolerante à seca após estabelecimento. Sensível a encharcamento.",
        "calendar_notes": "Calendário para mandioca de mesa. Mandioca industrial pode ter ciclo mais longo."
    },
    "algodao": {
        "cycle_days": 180,
        "phases": [
            {
                "name": "preparo",
                "days": 10,
                "description": "Preparo do solo",
                "critical_water": False,
                "tasks": [
                    {"type": "prepare_soil", "title": "Preparar solo para plantio", "priority": "high", "weather_sensitive": False},
                    {"type": "fertilize", "title": "Aplicar adubação de base", "priority": "high", "weather_sensitive": True}
                ]
            },
            {
                "name": "germinacao",
                "days": 12,
                "description": "Germinação e emergência",
                "critical_water": True,
                "tasks": [
                    {"type": "plant", "title": "Semear algodão", "priority": "critical", "weather_sensitive": True},
                    {"type": "irrigate", "title": "Irrigar para emergência", "priority": "high", "weather_sensitive": True},
                    {"type": "inspect_pests", "title": "Monitorar emergência", "priority": "medium", "weather_sensitive": False}
                ]
            },
            {
                "name": "vegetativa",
                "days": 50,
                "description": "Crescimento vegetativo",
                "critical_water": False,
                "tasks": [
                    {"type": "fertilize", "title": "Aplicar adubação nitrogenada", "priority": "high", "weather_sensitive": True},
                    {"type": "inspect_pests", "title": "Monitorar pragas (bicudo, lagarta)", "priority": "high", "weather_sensitive": False},
                    {"type": "irrigate", "title": "Irrigar moderadamente", "priority": "medium", "weather_sensitive": True}
                ]
            },
            {
                "name": "florescimento",
                "days": 40,
                "description": "Florescimento",
                "critical_water": True,
                "tasks": [
                    {"type": "irrigate", "title": "Irrigar - fase crítica", "priority": "critical", "weather_sensitive": True},
                    {"type": "inspect_diseases", "title": "Monitorar doenças (ramulária)", "priority": "high", "weather_sensitive": False},
                    {"type": "monitor_growth", "title": "Avaliar floração", "priority": "medium", "weather_sensitive": False}
                ]
            },
            {
                "name": "formacao_macas",
                "days": 48,
                "description": "Formação e abertura de maçãs",
                "critical_water": True,
                "tasks": [
                    {"type": "irrigate", "title": "Irrigar - fase crítica", "priority": "critical", "weather_sensitive": True},
                    {"type": "inspect_pests", "title": "Monitorar pragas nas maçãs", "priority": "high", "weather_sensitive": False},
                    {"type": "monitor_growth", "title": "Avaliar desenvolvimento das maçãs", "priority": "high", "weather_sensitive": False}
                ]
            },
            {
                "name": "maturacao",
                "days": 20,
                "description": "Maturação e abertura dos capulhos",
                "critical_water": False,
                "tasks": [
                    {"type": "monitor_growth", "title": "Monitorar abertura dos capulhos", "priority": "high", "weather_sensitive": False},
                    {"type": "harvest", "title": "Preparar colheita", "priority": "high", "weather_sensitive": True}
                ]
            }
        ],
        "optimal_temp_min": 20,
        "optimal_temp_max": 30,
        "critical_water_phases": ["germinacao", "florescimento", "formacao_macas"],
        "harvest_window_days": 30,
        "category": "anual",
        "water_need": "media",
        "risk_notes": "Sensível a pragas. Requer manejo fitossanitário intensivo.",
        "calendar_notes": "Calendário para algodão herbáceo. Requer monitoramento constante de pragas."
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
    
    # Detectar e ajustar tarefas no passado
    today = date.today()
    adjusted_tasks_count = 0
    calendar_warnings = []
    
    for task in tasks:
        if task.date < today:
            # Marcar tarefa como ajustada
            task.original_date = task.date
            task.date = today
            task.adjusted = True
            
            # Aumentar prioridade se não for crítica
            if task.priority != TaskPriority.CRITICAL:
                task.priority = TaskPriority.HIGH
            
            # Adicionar observação à descrição
            task.description += f" [AJUSTADA: Data original era {task.original_date.isoformat()}, mas já passou. Tarefa reagendada para hoje.]"
            
            adjusted_tasks_count += 1
    
    # Adicionar avisos se houver tarefas ajustadas
    if adjusted_tasks_count > 0:
        calendar_warnings.append(
            f"{adjusted_tasks_count} tarefa(s) foram ajustadas porque a data original já havia passado. "
            "Considere escolher uma data de plantio mais distante no futuro."
        )
    
    # Verificar se data de plantio está muito próxima
    days_until_planting = (planting_date - today).days
    if days_until_planting <= 7 and days_until_planting >= 0:
        calendar_warnings.append(
            f"Sua data de plantio está em {days_until_planting} dia(s). "
            "Tarefas preparatórias podem ter sido ajustadas. "
            "Recomendamos planejar com pelo menos 2 semanas de antecedência."
        )
    elif days_until_planting < 0:
        calendar_warnings.append(
            "A data de plantio escolhida já passou. "
            "O calendário foi ajustado, mas recomendamos escolher uma data futura."
        )
    
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
            "category": cycle_data.get("category", "anual"),
            "water_need": cycle_data.get("water_need", "media"),
            "risk_notes": cycle_data.get("risk_notes", ""),
            "calendar_notes": cycle_data.get("calendar_notes", ""),
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
        "critical_tasks": sum(1 for task in tasks if task.priority == TaskPriority.CRITICAL),
        "has_adjusted_tasks": adjusted_tasks_count > 0,
        "adjusted_tasks_count": adjusted_tasks_count,
        "calendar_warnings": calendar_warnings,
        "cautela": "Este calendário é uma base inicial de planejamento. As datas e tarefas devem ser ajustadas conforme clima, solo, cultivar, manejo e orientação técnica."
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
