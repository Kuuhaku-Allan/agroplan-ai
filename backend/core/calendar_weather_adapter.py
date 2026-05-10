"""
Adaptador de Clima para Calendário Agrícola

Enriquece tarefas do calendário com contexto climático:
- Previsão real (0-16 dias)
- Climatologia (17+ dias)
- Recomendações situacionais
"""

from datetime import date, timedelta
from typing import Dict, List, Optional
from providers.calendar_weather_provider import (
    buscar_previsao_curto_prazo,
    buscar_climatologia_longo_prazo,
    gerar_recomendacao_climatica
)


def enriquecer_calendario_com_clima(
    calendar: Dict,
    lat: Optional[float] = None,
    lon: Optional[float] = None
) -> Dict:
    """
    Enriquece calendário com contexto climático.
    
    Args:
        calendar: Calendário gerado
        lat: Latitude do talhão
        lon: Longitude do talhão
    
    Returns:
        Calendário enriquecido com weather_context em cada tarefa
    """
    
    # Verificar se coordenadas foram fornecidas
    if lat is None or lon is None:
        calendar["weather_enabled"] = False
        calendar["weather_warnings"] = [
            "Para usar clima integrado, informe latitude e longitude do talhão."
        ]
        return calendar
    
    try:
        today = date.today()
        planting_date = date.fromisoformat(calendar["planting_date"])
        estimated_harvest = date.fromisoformat(calendar["estimated_harvest_date"])
        
        # Buscar previsão de curto prazo (0-16 dias)
        forecast_end = today + timedelta(days=16)
        forecast_data = buscar_previsao_curto_prazo(lat, lon, today, days=16)
        
        # Criar mapa de previsão por data
        forecast_map = {item["date"]: item for item in forecast_data}
        
        # Buscar climatologia de longo prazo (17+ dias até colheita)
        climatology_data = []
        if estimated_harvest > forecast_end:
            climatology_start = forecast_end + timedelta(days=1)
            climatology_data = buscar_climatologia_longo_prazo(
                lat, lon, climatology_start, estimated_harvest
            )
        
        # Criar mapa de climatologia por data
        climatology_map = {item["date"]: item for item in climatology_data}
        
        # Contadores
        forecast_tasks = 0
        climatology_tasks = 0
        no_weather_tasks = 0
        sources_used = set()
        
        # Enriquecer cada tarefa
        for task in calendar.get("tasks", []):
            task_date_str = task["date"]
            task_date = date.fromisoformat(task_date_str)
            
            # Apenas enriquecer tarefas sensíveis ao clima
            if not task.get("weather_sensitive", False):
                task["weather_context"] = {
                    "active": False,
                    "reason": "Tarefa não sensível ao clima"
                }
                no_weather_tasks += 1
                continue
            
            # Verificar se está no passado
            if task_date < today:
                task["weather_context"] = {
                    "active": False,
                    "reason": "Tarefa no passado"
                }
                no_weather_tasks += 1
                continue
            
            # Tentar usar previsão real (0-16 dias)
            if task_date_str in forecast_map:
                weather_data = forecast_map[task_date_str]
                forecast_tasks += 1
                sources_used.add("open-meteo")
            # Usar climatologia (17+ dias)
            elif task_date_str in climatology_map:
                weather_data = climatology_map[task_date_str]
                climatology_tasks += 1
                sources_used.add(weather_data["source"])
            else:
                # Sem dados disponíveis
                task["weather_context"] = {
                    "active": False,
                    "reason": "Dados climáticos não disponíveis para esta data"
                }
                no_weather_tasks += 1
                continue
            
            # Gerar recomendação
            recommendation = gerar_recomendacao_climatica(
                task.get("type", ""),
                task.get("title", ""),
                weather_data
            )
            
            # Gerar resumo
            forecast_type = weather_data.get("forecast_type", "climatology")
            source = weather_data.get("source", "unknown")
            
            if forecast_type == "forecast":
                summary = f"Previsão: {weather_data.get('precipitation_sum', 0):.1f}mm de chuva, {weather_data.get('temperature_min', 0):.0f}°C a {weather_data.get('temperature_max', 0):.0f}°C"
            elif source == "nasa-power":
                summary = f"Climatologia NASA POWER: temperatura média {weather_data.get('temperature_avg', 0):.0f}°C, {weather_data.get('precipitation_expected', 'condições típicas')}"
            else:
                summary = f"Climatologia: {weather_data.get('precipitation_expected', 'Condições típicas')}"
            
            # Adicionar contexto climático à tarefa
            task["weather_context"] = {
                "active": True,
                "source": weather_data.get("source", "unknown"),
                "forecast_type": forecast_type,
                "summary": summary,
                "precipitation_mm": weather_data.get("precipitation_sum") or weather_data.get("precipitation_monthly_total") or weather_data.get("precipitation_daily_avg"),
                "precipitation_probability": weather_data.get("precipitation_probability"),
                "temperature_min": weather_data.get("temperature_min"),
                "temperature_max": weather_data.get("temperature_max"),
                "recommendation": recommendation,
                "confidence": weather_data.get("confidence", "media")
            }
        
        # Adicionar resumo geral
        calendar["weather_enabled"] = True
        calendar["weather_summary"] = {
            "forecast_tasks": forecast_tasks,
            "climatology_tasks": climatology_tasks,
            "no_weather_tasks": no_weather_tasks,
            "sources": list(sources_used)
        }
        
        # Adicionar avisos
        weather_warnings = []
        
        if climatology_tasks > 0:
            weather_warnings.append(
                f"{climatology_tasks} tarefa(s) usam climatologia/histórico (17+ dias). "
                "Não é previsão exata, apenas condições típicas do período."
            )
        
        if forecast_tasks > 0:
            weather_warnings.append(
                f"{forecast_tasks} tarefa(s) usam previsão meteorológica real (0-16 dias)."
            )
        
        calendar["weather_warnings"] = weather_warnings
        
        return calendar
        
    except Exception as e:
        print(f"Erro ao enriquecer calendário com clima: {e}")
        calendar["weather_enabled"] = False
        calendar["weather_warnings"] = [
            f"Erro ao buscar dados climáticos: {str(e)}"
        ]
        return calendar
