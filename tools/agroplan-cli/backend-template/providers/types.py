"""
Tipos de dados para provedores externos
"""
from typing import Optional
from dataclasses import dataclass

@dataclass
class WeatherSummary:
    """Resumo de dados climáticos"""
    source: str
    latitude: float
    longitude: float
    temperatura_media: Optional[float] = None
    temperatura_maxima: Optional[float] = None
    temperatura_minima: Optional[float] = None
    precipitacao_total: Optional[float] = None
    evapotranspiracao: Optional[float] = None
    umidade_media: Optional[float] = None
    radiacao_solar: Optional[float] = None
    risco_climatico_estimado: str = "indeterminado"
    fallback: bool = False
    error: Optional[str] = None
    
    def to_dict(self) -> dict:
        """Converte para dicionário para JSON"""
        return {
            "source": self.source,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "temperatura_media": self.temperatura_media,
            "temperatura_maxima": self.temperatura_maxima,
            "temperatura_minima": self.temperatura_minima,
            "precipitacao_total": self.precipitacao_total,
            "evapotranspiracao": self.evapotranspiracao,
            "umidade_media": self.umidade_media,
            "radiacao_solar": self.radiacao_solar,
            "risco_climatico_estimado": self.risco_climatico_estimado,
            "fallback": self.fallback,
            "error": self.error
        }