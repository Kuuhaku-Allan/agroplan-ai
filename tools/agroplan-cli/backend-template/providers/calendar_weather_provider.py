"""
Provider de Clima para Calendário Agrícola

Estratégia honesta sobre previsão climática:
- 0-16 dias: Previsão meteorológica real (Open-Meteo)
- 17+ dias: Climatologia/histórico (NASA POWER ou fallback local)

Não fingimos ter previsão exata para ciclos longos (120+ dias).
"""

from datetime import date, timedelta
from typing import Dict, List, Optional
import requests
from .cache import get_cache, set_cache


def buscar_previsao_curto_prazo(
    lat: float,
    lon: float,
    start_date: date,
    days: int = 16
) -> List[Dict]:
    """
    Busca previsão meteorológica real para os próximos 16 dias.
    
    Usa Open-Meteo Forecast API.
    
    Args:
        lat: Latitude
        lon: Longitude
        start_date: Data inicial
        days: Número de dias (máximo 16)
    
    Returns:
        Lista de dicionários com previsão por data
    """
    
    # Limitar a 16 dias (limite confiável do Open-Meteo)
    days = min(days, 16)
    
    # Cache key
    cache_key = f"calendar_forecast:{lat}:{lon}:{start_date.isoformat()}:{days}"
    cached = get_cache(cache_key)
    if cached:
        return cached
    
    try:
        # Open-Meteo Forecast API
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
            "timezone": "auto",
            "forecast_days": days
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Processar resposta
        daily = data.get("daily", {})
        dates = daily.get("time", [])
        temp_max = daily.get("temperature_2m_max", [])
        temp_min = daily.get("temperature_2m_min", [])
        precip_sum = daily.get("precipitation_sum", [])
        precip_prob = daily.get("precipitation_probability_max", [])
        
        result = []
        for i, date_str in enumerate(dates):
            result.append({
                "date": date_str,
                "source": "open-meteo",
                "forecast_type": "forecast",
                "temperature_max": temp_max[i] if i < len(temp_max) else None,
                "temperature_min": temp_min[i] if i < len(temp_min) else None,
                "precipitation_sum": precip_sum[i] if i < len(precip_sum) else None,
                "precipitation_probability": precip_prob[i] if i < len(precip_prob) else None,
                "confidence": "alta"
            })
        
        # Cache por 6 horas
        set_cache(cache_key, result, ttl_seconds=21600)
        
        return result
        
    except Exception as e:
        print(f"Erro ao buscar previsão Open-Meteo: {e}")
        return []


def buscar_climatologia_longo_prazo(
    lat: float,
    lon: float,
    start_date: date,
    end_date: date
) -> List[Dict]:
    """
    Busca climatologia/histórico para períodos longos (17+ dias).
    
    Inicialmente usa fallback local mensal.
    Futuramente pode integrar NASA POWER.
    
    Args:
        lat: Latitude
        lon: Longitude
        start_date: Data inicial
        end_date: Data final
    
    Returns:
        Lista de dicionários com climatologia por data/mês
    """
    
    # Por enquanto, usar fallback local baseado em médias mensais
    # Futuramente: integrar NASA POWER Climatology API
    
    result = []
    current = start_date
    
    while current <= end_date:
        month = current.month
        
        # Climatologia simplificada por mês (Brasil)
        climatology = _get_monthly_climatology(month, lat, lon)
        
        result.append({
            "date": current.isoformat(),
            "source": "climate-fallback",
            "forecast_type": "climatology",
            "temperature_max": climatology["temp_max"],
            "temperature_min": climatology["temp_min"],
            "precipitation_expected": climatology["precip_desc"],
            "precipitation_mm_avg": climatology["precip_mm"],
            "confidence": "media"
        })
        
        current += timedelta(days=1)
    
    return result


def _get_monthly_climatology(month: int, lat: float, lon: float) -> Dict:
    """
    Retorna climatologia simplificada por mês.
    
    Baseado em médias históricas do Brasil.
    Futuramente: usar NASA POWER ou dados regionais.
    """
    
    # Determinar região aproximada (simplificado)
    if lat < -23:  # Sul
        region = "sul"
    elif lat < -15:  # Sudeste/Centro-Oeste
        region = "sudeste"
    else:  # Norte/Nordeste
        region = "norte"
    
    # Climatologia simplificada (valores aproximados)
    climatology_data = {
        "sul": {
            1: {"temp_max": 28, "temp_min": 18, "precip_mm": 150, "precip_desc": "Chuvas frequentes"},
            2: {"temp_max": 28, "temp_min": 18, "precip_mm": 140, "precip_desc": "Chuvas frequentes"},
            3: {"temp_max": 26, "temp_min": 16, "precip_mm": 120, "precip_desc": "Chuvas moderadas"},
            4: {"temp_max": 23, "temp_min": 13, "precip_mm": 100, "precip_desc": "Chuvas moderadas"},
            5: {"temp_max": 20, "temp_min": 10, "precip_mm": 90, "precip_desc": "Chuvas ocasionais"},
            6: {"temp_max": 18, "temp_min": 8, "precip_mm": 80, "precip_desc": "Chuvas ocasionais"},
            7: {"temp_max": 18, "temp_min": 8, "precip_mm": 70, "precip_desc": "Período seco"},
            8: {"temp_max": 20, "temp_min": 10, "precip_mm": 80, "precip_desc": "Período seco"},
            9: {"temp_max": 22, "temp_min": 12, "precip_mm": 110, "precip_desc": "Chuvas aumentando"},
            10: {"temp_max": 24, "temp_min": 14, "precip_mm": 130, "precip_desc": "Chuvas frequentes"},
            11: {"temp_max": 26, "temp_min": 16, "precip_mm": 120, "precip_desc": "Chuvas frequentes"},
            12: {"temp_max": 28, "temp_min": 18, "precip_mm": 140, "precip_desc": "Chuvas frequentes"},
        },
        "sudeste": {
            1: {"temp_max": 30, "temp_min": 20, "precip_mm": 220, "precip_desc": "Estação chuvosa"},
            2: {"temp_max": 30, "temp_min": 20, "precip_mm": 200, "precip_desc": "Estação chuvosa"},
            3: {"temp_max": 29, "temp_min": 19, "precip_mm": 160, "precip_desc": "Chuvas frequentes"},
            4: {"temp_max": 27, "temp_min": 17, "precip_mm": 80, "precip_desc": "Chuvas diminuindo"},
            5: {"temp_max": 25, "temp_min": 15, "precip_mm": 50, "precip_desc": "Período seco"},
            6: {"temp_max": 24, "temp_min": 13, "precip_mm": 40, "precip_desc": "Período seco"},
            7: {"temp_max": 24, "temp_min": 13, "precip_mm": 30, "precip_desc": "Período seco"},
            8: {"temp_max": 26, "temp_min": 15, "precip_mm": 40, "precip_desc": "Período seco"},
            9: {"temp_max": 27, "temp_min": 16, "precip_mm": 70, "precip_desc": "Chuvas aumentando"},
            10: {"temp_max": 28, "temp_min": 18, "precip_mm": 130, "precip_desc": "Chuvas frequentes"},
            11: {"temp_max": 29, "temp_min": 19, "precip_mm": 170, "precip_desc": "Chuvas frequentes"},
            12: {"temp_max": 29, "temp_min": 20, "precip_mm": 200, "precip_desc": "Estação chuvosa"},
        },
        "norte": {
            1: {"temp_max": 31, "temp_min": 23, "precip_mm": 280, "precip_desc": "Estação chuvosa"},
            2: {"temp_max": 31, "temp_min": 23, "precip_mm": 300, "precip_desc": "Estação chuvosa"},
            3: {"temp_max": 31, "temp_min": 23, "precip_mm": 320, "precip_desc": "Estação chuvosa"},
            4: {"temp_max": 31, "temp_min": 23, "precip_mm": 280, "precip_desc": "Chuvas frequentes"},
            5: {"temp_max": 31, "temp_min": 23, "precip_mm": 200, "precip_desc": "Chuvas moderadas"},
            6: {"temp_max": 32, "temp_min": 23, "precip_mm": 100, "precip_desc": "Chuvas ocasionais"},
            7: {"temp_max": 33, "temp_min": 23, "precip_mm": 60, "precip_desc": "Período seco"},
            8: {"temp_max": 34, "temp_min": 24, "precip_mm": 50, "precip_desc": "Período seco"},
            9: {"temp_max": 34, "temp_min": 24, "precip_mm": 80, "precip_desc": "Chuvas aumentando"},
            10: {"temp_max": 33, "temp_min": 24, "precip_mm": 130, "precip_desc": "Chuvas aumentando"},
            11: {"temp_max": 32, "temp_min": 23, "precip_mm": 180, "precip_desc": "Chuvas frequentes"},
            12: {"temp_max": 31, "temp_min": 23, "precip_mm": 250, "precip_desc": "Estação chuvosa"},
        }
    }
    
    return climatology_data.get(region, climatology_data["sudeste"]).get(month, {
        "temp_max": 28,
        "temp_min": 18,
        "precip_mm": 100,
        "precip_desc": "Chuvas moderadas"
    })


def gerar_recomendacao_climatica(
    task_type: str,
    task_title: str,
    weather_data: Dict
) -> str:
    """
    Gera recomendação baseada no contexto climático.
    
    Args:
        task_type: Tipo da tarefa (irrigate, plant, etc)
        task_title: Título da tarefa
        weather_data: Dados climáticos
    
    Returns:
        Recomendação textual
    """
    
    forecast_type = weather_data.get("forecast_type", "climatology")
    precip = weather_data.get("precipitation_sum") or weather_data.get("precipitation_mm_avg", 0)
    precip_prob = weather_data.get("precipitation_probability", 0)
    temp_max = weather_data.get("temperature_max", 25)
    temp_min = weather_data.get("temperature_min", 15)
    
    # Recomendações para irrigação
    if "irrigar" in task_title.lower() or task_type == "irrigate":
        if forecast_type == "forecast":
            if precip >= 8:
                return f"Chuva prevista suficiente ({precip:.1f}mm). Verifique o solo antes de irrigar."
            elif precip >= 3:
                return f"Chuva moderada prevista ({precip:.1f}mm). Irrigação pode ser parcial."
            else:
                return f"Pouca chuva prevista ({precip:.1f}mm). Irrigação provavelmente necessária."
        else:
            return f"Climatologia: {weather_data.get('precipitation_expected', 'Chuvas moderadas')}. Monitore o solo."
    
    # Recomendações para plantio
    if "plantar" in task_title.lower() or task_type == "plant":
        if forecast_type == "forecast":
            if precip > 50:
                return f"Chuva elevada prevista ({precip:.1f}mm). Avalie adiar o plantio para evitar solo encharcado."
            elif precip < 5 and precip_prob < 30:
                return f"Tempo seco previsto. Bom para plantio, mas prepare irrigação."
            else:
                return f"Condições adequadas para plantio. Chuva moderada prevista ({precip:.1f}mm)."
        else:
            return f"Climatologia: {weather_data.get('precipitation_expected', 'Chuvas moderadas')}. Planeje conforme histórico."
    
    # Recomendações para temperatura
    if temp_max > 35:
        return f"Calor elevado previsto ({temp_max:.1f}°C). Monitorar estresse hídrico da cultura."
    elif temp_min < 5:
        return f"Frio intenso previsto ({temp_min:.1f}°C). Avaliar risco para a cultura."
    elif temp_min < 10:
        return f"Temperatura baixa prevista ({temp_min:.1f}°C). Monitorar desenvolvimento da cultura."
    
    # Recomendação genérica
    if forecast_type == "forecast":
        return f"Temperatura: {temp_min:.1f}°C a {temp_max:.1f}°C. Chuva: {precip:.1f}mm."
    else:
        return f"Climatologia: {weather_data.get('precipitation_expected', 'Condições típicas do período')}."
