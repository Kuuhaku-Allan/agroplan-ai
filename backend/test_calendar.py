"""
Teste do Engine de Calendário Agrícola
"""

from datetime import date
from core.crop_calendar_engine import gerar_calendario_cultura, get_culturas_disponiveis, get_cultura_info
from core.planning_models import Field, SoilType, Slope, WaterAvailability
import json

print("=" * 60)
print("TESTE: Engine de Calendário Agrícola")
print("=" * 60)

# Listar culturas disponíveis
print("\n1. Culturas disponíveis:")
culturas = get_culturas_disponiveis()
print(f"   Total: {len(culturas)}")
for cultura in culturas:
    info = get_cultura_info(cultura)
    print(f"   - {cultura}: {info['cycle_days']} dias, {info['total_phases']} fases")

# Criar talhão de teste
field = Field(
    id="test-field-1",
    property_id="test-property-1",
    name="Talhão Teste 1",
    area_ha=10.5,
    soil_type=SoilType.ARGILOSO,
    slope=Slope.PLANO,
    water_availability=WaterAvailability.MEDIA
)

print(f"\n2. Talhão de teste:")
print(f"   Nome: {field.name}")
print(f"   Área: {field.area_ha} ha")
print(f"   Solo: {field.soil_type.value}")
print(f"   Relevo: {field.slope.value}")
print(f"   Água: {field.water_availability.value}")

# Testar calendário para soja
print(f"\n3. Gerar calendário para SOJA:")
planting_date = date(2026, 10, 15)
print(f"   Data de plantio: {planting_date}")

resultado = gerar_calendario_cultura(
    cultura="soja",
    planting_date=planting_date,
    field=field
)

print(f"   Data estimada de colheita: {resultado['estimated_harvest_date']}")
print(f"   Ciclo: {resultado['cycle_days']} dias")
print(f"   Total de tarefas: {resultado['total_tasks']}")
print(f"   Tarefas sensíveis ao clima: {resultado['weather_sensitive_tasks']}")
print(f"   Tarefas críticas: {resultado['critical_tasks']}")

print(f"\n   Primeiras 5 tarefas:")
for i, task in enumerate(resultado['tasks'][:5]):
    print(f"   {i+1}. {task['date']} - {task['title']} ({task['priority']})")

print(f"\n   Últimas 3 tarefas:")
for i, task in enumerate(resultado['tasks'][-3:]):
    print(f"   {len(resultado['tasks'])-2+i}. {task['date']} - {task['title']} ({task['priority']})")

# Testar calendário para milho
print(f"\n4. Gerar calendário para MILHO:")
resultado_milho = gerar_calendario_cultura(
    cultura="milho",
    planting_date=planting_date,
    field=field
)

print(f"   Data estimada de colheita: {resultado_milho['estimated_harvest_date']}")
print(f"   Ciclo: {resultado_milho['cycle_days']} dias")
print(f"   Total de tarefas: {resultado_milho['total_tasks']}")

# Testar calendário para feijão
print(f"\n5. Gerar calendário para FEIJÃO:")
resultado_feijao = gerar_calendario_cultura(
    cultura="feijao",
    planting_date=planting_date,
    field=field
)

print(f"   Data estimada de colheita: {resultado_feijao['estimated_harvest_date']}")
print(f"   Ciclo: {resultado_feijao['cycle_days']} dias")
print(f"   Total de tarefas: {resultado_feijao['total_tasks']}")

# Testar cultura não existente
print(f"\n6. Testar cultura não existente:")
resultado_erro = gerar_calendario_cultura(
    cultura="cafe",
    planting_date=planting_date,
    field=field
)

if "error" in resultado_erro:
    print(f"   ✓ Erro esperado: {resultado_erro['error']}")
    print(f"   Culturas disponíveis: {resultado_erro['culturas_disponiveis']}")

print("\n" + "=" * 60)
print("TESTE CONCLUÍDO COM SUCESSO!")
print("=" * 60)
