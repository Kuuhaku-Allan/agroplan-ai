"""
Provedor de dados climáticos usando Open-Meteo
"""
import urllib.request
import urllib.parse
import json
from datetime import datetime, timedelta
from typing import Optional
from .types import WeatherSummary
from .cache import get_cache, set_cache

def estimar_risco_climatico(temp_media: Optional[float], precipitacao_total: Optional[float]) -> str:
    """Estima risco climático baseado em temperatura e precipitação"""
    if temp_media is None or precipitacao_total is None:
        return "indeterminado"
    
    # Heurística simples inicial
    if precipitacao_total < 30:
        return "alto"
    if temp_media > 34:
        return "alto"
    if precipitacao_total < 70:
        return "medio"
    return "baixo"

def get_weather_summary(lat: float, lon: float, days: int = 30) -> WeatherSummary:
    """
    Obtém resumo climático usando Open-Meteo
    
    Args:
        lat: Latitude
        lon: Longitude  
        days: Número de dias para análise (padrão 30)
    
    Returns:
        WeatherSummary com dados climáticos ou fallback
    """
    
    # Chave do cache
    cache_key = f"weather_{lat}_{lon}_{days}"
    
    # Verificar cache primeiro
    cached = get_cache(cache_key)
    if cached:
        return WeatherSummary(**cached)
    
    try:
        # Calcular datas (últimos N dias)
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Parâmetros da API Open-Meteo Archive
        params = {
            "latitude": str(lat),
            "longitude": str(lon),
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "daily": ",".join([
                "temperature_2m_mean",
                "temperature_2m_max", 
                "temperature_2m_min",
                "precipitation_sum",
                "et0_fao_evapotranspiration",
                "relative_humidity_2m_mean",
                "shortwave_radiation_sum"
            ]),
            "timezone": "America/Sao_Paulo"
        }
        
        # Construir URL
        base_url = "https://archive-api.open-meteo.com/v1/archive"
        query_string = urllib.parse.urlencode(params)
        url = f"{base_url}?{query_string}"
        
        # Fazer requisição
        with urllib.request.urlopen(url, timeout=10) as response:
            data = json.loads(response.read().decode())
        
        daily = data.get("daily", {})
        
        # Extrair dados
        temps_mean = daily.get("temperature_2m_mean", [])
        temps_max = daily.get("temperature_2m_max", [])
        temps_min = daily.get("temperature_2m_min", [])
        precipitation = daily.get("precipitation_sum", [])
        evapotranspiration = daily.get("et0_fao_evapotranspiration", [])
        humidity = daily.get("relative_humidity_2m_mean", [])
        radiation = daily.get("shortwave_radiation_sum", [])
        
        # Calcular médias (ignorando valores None)
        def safe_mean(values):
            valid_values = [v for v in values if v is not None]
            return sum(valid_values) / len(valid_values) if valid_values else None
        
        def safe_sum(values):
            valid_values = [v for v in values if v is not None]
            return sum(valid_values) if valid_values else None
        
        temp_media = safe_mean(temps_mean)
        temp_maxima = safe_mean(temps_max)
        temp_minima = safe_mean(temps_min)
        precip_total = safe_sum(precipitation)
        evap_media = safe_mean(evapotranspiration)
        umid_media = safe_mean(humidity)
        rad_total = safe_sum(radiation)
        
        # Estimar risco climático
        risco = estimar_risco_climatico(temp_media, precip_total)
        
        # Criar resultado
        result = WeatherSummary(
            source="open-meteo",
            latitude=lat,
            longitude=lon,
            temperatura_media=round(temp_media, 1) if temp_media else None,
            temperatura_maxima=round(temp_maxima, 1) if temp_maxima else None,
            temperatura_minima=round(temp_minima, 1) if temp_minima else None,
            precipitacao_total=round(precip_total, 1) if precip_total else None,
            evapotranspiracao=round(evap_media, 2) if evap_media else None,
            umidade_media=round(umid_media, 1) if umid_media else None,
            radiacao_solar=round(rad_total, 1) if rad_total else None,
            risco_climatico_estimado=risco,
            fallback=False,
            error=None
        )
        
        # Cachear por 1 hora (dados históricos mudam pouco)
        set_cache(cache_key, result.to_dict(), ttl_seconds=3600)
        
        return result
        
    except Exception as e:
        # Fallback para dados simulados
        return _get_fallback_weather(lat, lon, str(e))

def _get_fallback_weather(lat: float, lon: float, error: str) -> WeatherSummary:
    """Retorna dados climáticos simulados como fallback"""
    
    # Dados simulados baseados na localização (heurística simples)
    # Região Sudeste do Brasil como referência
    temp_base = 22.0
    if lat < -25:  # Mais ao sul, mais frio
        temp_base = 18.0
    elif lat > -20:  # Mais ao norte, mais quente
        temp_base = 26.0
    
    return WeatherSummary(
        source="simulado",
        latitude=lat,
        longitude=lon,
        temperatura_media=temp_base,
        temperatura_maxima=temp_base + 8,
        temperatura_minima=temp_base - 6,
        precipitacao_total=120.0,  # mm/mês típico
        evapotranspiracao=4.5,     # mm/dia típico
        umidade_media=65.0,        # % típico
        radiacao_solar=180.0,      # MJ/m² típico mensal
        risco_climatico_estimado="medio",
        fallback=True,
        error=f"Open-Meteo indisponível: {error}"
    )