"""
Provider NASA POWER para Climatologia

Usa NASA POWER Climatology API para obter dados históricos/climatológicos
para períodos além da janela de previsão meteorológica (17+ dias).

NASA POWER não é previsão exata, é climatologia/histórico.
"""

from typing import Dict, Optional
import requests
from .cache import get_cache, set_cache


# Mapeamento de mês numérico para chave NASA POWER
MONTH_KEYS = {
    1: "JAN",
    2: "FEB",
    3: "MAR",
    4: "APR",
    5: "MAY",
    6: "JUN",
    7: "JUL",
    8: "AUG",
    9: "SEP",
    10: "OCT",
    11: "NOV",
    12: "DEC",
}


def get_month_value(parameter_data: Dict, month: int) -> Optional[float]:
    """
    Extrai valor mensal de parâmetro NASA POWER.
    
    Tenta múltiplos formatos de chave:
    1. Chave alfabética (MAY, JUN, etc.) - formato padrão NASA POWER
    2. Chave numérica string ("5", "6", etc.)
    3. Chave numérica com zero ("05", "06", etc.)
    
    Args:
        parameter_data: Dicionário com dados do parâmetro
        month: Mês numérico (1-12)
    
    Returns:
        Valor do parâmetro ou None se não encontrado
    """
    if not parameter_data:
        return None
    
    # Tentativa 1: Chave alfabética (formato padrão NASA POWER)
    month_key = MONTH_KEYS.get(month)
    if month_key and month_key in parameter_data:
        return parameter_data.get(month_key)
    
    # Tentativa 2: Chave numérica string
    if str(month) in parameter_data:
        return parameter_data.get(str(month))
    
    # Tentativa 3: Chave numérica com zero
    if f"{month:02d}" in parameter_data:
        return parameter_data.get(f"{month:02d}")
    
    return None


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
            "T2M",              # Temperatura média a 2m
            "T2M_MAX",          # Temperatura máxima a 2m
            "T2M_MIN",          # Temperatura mínima a 2m
            "PRECTOTCORR",      # Precipitação diária média corrigida
            "PRECTOTCORR_SUM",  # Precipitação total mensal corrigida
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
        
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        # Extrair dados do mês específico
        properties = data.get("properties", {}).get("parameter", {})
        
        # Usar helper para extrair valores com fallback robusto
        month_key = MONTH_KEYS.get(month)
        
        temp_avg = get_month_value(properties.get("T2M"), month)
        temp_max = get_month_value(properties.get("T2M_MAX"), month)
        temp_min = get_month_value(properties.get("T2M_MIN"), month)
        
        # Precipitação: priorizar PRECTOTCORR_SUM (total mensal), fallback para PRECTOTCORR (média diária)
        precip_sum = get_month_value(properties.get("PRECTOTCORR_SUM"), month)
        precip_daily = get_month_value(properties.get("PRECTOTCORR"), month)
        
        # Validar dados essenciais
        if temp_avg is None:
            return None
        
        # Calcular precipitação mensal
        if precip_sum is not None:
            precip_monthly = precip_sum
            precip_daily_avg = precip_sum / 30  # Estimativa
        elif precip_daily is not None:
            precip_daily_avg = precip_daily
            precip_monthly = precip_daily * 30  # Estimativa
        else:
            return None
        
        # Classificar precipitação
        if precip_monthly < 50:
            precip_desc = "Período seco"
        elif precip_monthly < 100:
            precip_desc = "Chuvas ocasionais"
        elif precip_monthly < 150:
            precip_desc = "Chuvas moderadas"
        elif precip_monthly < 200:
            precip_desc = "Chuvas frequentes"
        else:
            precip_desc = "Estação chuvosa"
        
        result = {
            "source": "nasa-power",
            "forecast_type": "climatology",
            "month": month,
            "month_key": month_key,
            "temperature_avg": round(temp_avg, 1),
            "temperature_max": round(temp_max, 1) if temp_max else None,
            "temperature_min": round(temp_min, 1) if temp_min else None,
            "precipitation_expected": precip_desc,
            "precipitation_daily_avg": round(precip_daily_avg, 1),
            "precipitation_monthly_total": round(precip_monthly, 1),
            "confidence": "media",
            "note": "Dados climatológicos/históricos NASA POWER, não previsão exata."
        }
        
        # Cache por 7 dias (climatologia muda pouco)
        set_cache(cache_key, result, ttl_seconds=604800)
        
        return result
        
    except requests.exceptions.Timeout:
        print(f"[NASA POWER] Timeout ao buscar dados para lat={lat}, lon={lon}, month={month}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"[NASA POWER] Erro de requisição: {e}")
        return None
    except KeyError as e:
        print(f"[NASA POWER] Erro ao parsear resposta - chave ausente: {e}")
        return None
    except Exception as e:
        print(f"[NASA POWER] Erro inesperado: {e}")
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
        "parameters": ["T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR", "PRECTOTCORR_SUM"],
        "community": "AG (Agricultural)",
        "cache_ttl": "7 days",
        "note": "Climatologia/histórico, não previsão exata"
    }


def buscar_climatologia_nasa_power_debug(
    lat: float,
    lon: float,
    month: int
) -> Dict:
    """
    Versão debug que retorna resposta bruta da NASA POWER para diagnóstico.
    
    Args:
        lat: Latitude
        lon: Longitude
        month: Mês (1-12)
    
    Returns:
        Dicionário com resposta bruta e diagnóstico
    """
    try:
        # Parâmetros climatológicos
        parameters = [
            "T2M",
            "T2M_MAX",
            "T2M_MIN",
            "PRECTOTCORR",
            "PRECTOTCORR_SUM",
        ]
        
        # Endpoint NASA POWER Climatology
        url = "https://power.larc.nasa.gov/api/temporal/climatology/point"
        
        params = {
            "parameters": ",".join(parameters),
            "community": "AG",
            "longitude": lon,
            "latitude": lat,
            "format": "JSON"
        }
        
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        # Extrair informações para diagnóstico
        properties = data.get("properties", {}).get("parameter", {})
        
        # Coletar chaves de cada parâmetro
        parameter_keys = {}
        for param in parameters:
            param_data = properties.get(param, {})
            if isinstance(param_data, dict):
                parameter_keys[param] = list(param_data.keys())
            else:
                parameter_keys[param] = f"Not a dict: {type(param_data)}"
        
        # Tentar extrair valores para o mês solicitado
        month_key = MONTH_KEYS.get(month)
        extracted_values = {}
        for param in parameters:
            extracted_values[param] = get_month_value(properties.get(param), month)
        
        return {
            "status": "success",
            "url": url,
            "params": params,
            "status_code": response.status_code,
            "month_requested": month,
            "month_key": month_key,
            "parameter_keys": parameter_keys,
            "extracted_values": extracted_values,
            "raw_response_keys": list(data.keys()),
            "properties_keys": list(data.get("properties", {}).keys()),
            "note": "Debug endpoint - mostra estrutura bruta da resposta NASA POWER"
        }
        
    except requests.exceptions.Timeout:
        return {
            "status": "error",
            "error_type": "timeout",
            "message": "Timeout ao buscar NASA POWER"
        }
    except requests.exceptions.RequestException as e:
        return {
            "status": "error",
            "error_type": "request_error",
            "message": str(e)
        }
    except Exception as e:
        return {
            "status": "error",
            "error_type": "unexpected_error",
            "message": str(e)
        }
