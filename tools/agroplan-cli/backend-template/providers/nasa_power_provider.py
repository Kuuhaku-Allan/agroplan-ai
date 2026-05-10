"""
Provider NASA POWER para Climatologia

Usa NASA POWER Climatology API para obter dados históricos/climatológicos
para períodos além da janela de previsão meteorológica (17+ dias).

NASA POWER não é previsão exata, é climatologia/histórico.
"""

from typing import Dict, Optional
import requests
from .cache import get_cache, set_cache


def buscar_climatologia_nasa_power(
    lat: float,
    lon: float,
    month: int
) -> Optional[Dict]:
    """
    Busca climatologia NASA POWER para um mês específico.
    
    Args:
        lat: Latitude
        lon: Longitude
        month: Mês (1-12)
    
    Returns:
        Dicionário com dados climatológicos ou None se falhar
    """
    
    # Cache key
    cache_key = f"nasa_power:{lat}:{lon}:{month}"
    cached = get_cache(cache_key)
    if cached:
        return cached
    
    try:
        # NASA POWER Climatology API
        # Documentação: https://power.larc.nasa.gov/docs/services/api/
        
        # Parâmetros climatológicos
        parameters = [
            "T2M",           # Temperatura média a 2m
            "T2M_MAX",       # Temperatura máxima a 2m
            "T2M_MIN",       # Temperatura mínima a 2m
            "PRECTOTCORR",   # Precipitação total corrigida
        ]
        
        # Endpoint NASA POWER Climatology
        url = "https://power.larc.nasa.gov/api/temporal/climatology/point"
        
        params = {
            "parameters": ",".join(parameters),
            "community": "AG",  # Agricultural community
            "longitude": lon,
            "latitude": lat,
            "format": "JSON"
        }
        
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        # Extrair dados do mês específico
        properties = data.get("properties", {}).get("parameter", {})
        
        # NASA POWER retorna dados mensais (1-12)
        month_str = str(month)
        
        temp_avg = properties.get("T2M", {}).get(month_str)
        temp_max = properties.get("T2M_MAX", {}).get(month_str)
        temp_min = properties.get("T2M_MIN", {}).get(month_str)
        precip = properties.get("PRECTOTCORR", {}).get(month_str)
        
        # Validar dados
        if temp_avg is None or precip is None:
            return None
        
        # Classificar precipitação
        if precip < 50:
            precip_desc = "Período seco"
        elif precip < 100:
            precip_desc = "Chuvas ocasionais"
        elif precip < 150:
            precip_desc = "Chuvas moderadas"
        elif precip < 200:
            precip_desc = "Chuvas frequentes"
        else:
            precip_desc = "Estação chuvosa"
        
        result = {
            "source": "nasa-power",
            "forecast_type": "climatology",
            "month": month,
            "temperature_avg": round(temp_avg, 1),
            "temperature_max": round(temp_max, 1) if temp_max else None,
            "temperature_min": round(temp_min, 1) if temp_min else None,
            "precipitation_expected": precip_desc,
            "precipitation_mm_avg": round(precip, 1),
            "confidence": "media",
            "note": "Dados climatológicos/históricos NASA POWER, não previsão exata."
        }
        
        # Cache por 7 dias (climatologia muda pouco)
        set_cache(cache_key, result, ttl_seconds=604800)
        
        return result
        
    except requests.exceptions.Timeout:
        print(f"Timeout ao buscar NASA POWER para lat={lat}, lon={lon}, month={month}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar NASA POWER: {e}")
        return None
    except Exception as e:
        print(f"Erro inesperado ao processar NASA POWER: {e}")
        return None


def get_nasa_power_status() -> Dict:
    """
    Retorna status do provider NASA POWER.
    
    Returns:
        Dicionário com informações de status
    """
    return {
        "provider": "NASA POWER",
        "type": "climatology",
        "source": "https://power.larc.nasa.gov/",
        "parameters": ["T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR"],
        "community": "AG (Agricultural)",
        "cache_ttl": "7 days",
        "note": "Climatologia/histórico, não previsão exata"
    }
