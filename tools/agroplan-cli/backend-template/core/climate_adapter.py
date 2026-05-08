"""
Adaptador para integrar dados climáticos reais no planejamento agrícola
"""
from typing import Optional, Dict, Any
from providers.weather_provider import get_weather_summary
from providers.types import WeatherSummary

def classificar_clima_por_temperatura(temp_media: Optional[float]) -> Optional[str]:
    """Classifica clima baseado na temperatura média"""
    if temp_media is None:
        return None
    
    if temp_media >= 28:
        return "quente"
    if temp_media < 18:
        return "frio"
    return "ameno"

def classificar_agua_por_precipitacao(precipitacao_total: Optional[float]) -> Optional[str]:
    """Classifica disponibilidade de água baseada na precipitação"""
    if precipitacao_total is None:
        return None
    
    if precipitacao_total < 50:
        return "baixa"
    if precipitacao_total > 120:
        return "alta"
    return "media"

def calcular_ajuste_risco_climatico(risco_climatico: str) -> float:
    """Calcula ajuste de risco baseado no risco climático estimado"""
    ajustes = {
        "alto": 0.15,      # +15% risco
        "medio": 0.05,     # +5% risco  
        "baixo": -0.03,    # -3% risco (leve benefício)
        "indeterminado": 0
    }
    return ajustes.get(risco_climatico, 0)

def criar_contexto_climatico(weather_summary: WeatherSummary) -> Dict[str, Any]:
    """Cria contexto climático para uso no planejamento"""
    
    clima_observado = classificar_clima_por_temperatura(weather_summary.temperatura_media)
    agua_observada = classificar_agua_por_precipitacao(weather_summary.precipitacao_total)
    ajuste_risco = calcular_ajuste_risco_climatico(weather_summary.risco_climatico_estimado)
    
    return {
        "clima_observado": clima_observado,
        "agua_observada": agua_observada,
        "ajuste_risco": ajuste_risco,
        "fonte": weather_summary.source,
        "fallback": weather_summary.fallback,
        "temperatura_media": weather_summary.temperatura_media,
        "temperatura_maxima": weather_summary.temperatura_maxima,
        "temperatura_minima": weather_summary.temperatura_minima,
        "precipitacao_total": weather_summary.precipitacao_total,
        "evapotranspiracao": weather_summary.evapotranspiracao,
        "umidade_media": weather_summary.umidade_media,
        "radiacao_solar": weather_summary.radiacao_solar,
        "risco_climatico_estimado": weather_summary.risco_climatico_estimado,
        "error": weather_summary.error
    }

def aplicar_contexto_climatico_no_plano(resultado_ag: Dict[str, Any], contexto_climatico: Dict[str, Any]) -> Dict[str, Any]:
    """Aplica ajustes climáticos no resultado do algoritmo genético"""
    
    if not contexto_climatico or contexto_climatico.get("ajuste_risco", 0) == 0:
        # Sem ajuste necessário
        resultado_ag["ajuste_climatico_aplicado"] = False
        resultado_ag["contexto_climatico"] = contexto_climatico
        return resultado_ag
    
    ajuste_risco = contexto_climatico["ajuste_risco"]
    
    # Aplicar ajuste no plano otimizado
    if "plano_otimizado" in resultado_ag:
        for item in resultado_ag["plano_otimizado"]:
            if "risco" in item:
                risco_original = item["risco"]
                # Aplicar ajuste mantendo risco entre 0.05 e 0.95
                novo_risco = min(0.95, max(0.05, risco_original + ajuste_risco))
                item["risco"] = round(novo_risco, 3)
                item["risco_original"] = risco_original
                item["ajuste_aplicado"] = ajuste_risco
    
    # Recalcular métricas gerais se existirem
    if "metricas" in resultado_ag and "risco_medio" in resultado_ag["metricas"]:
        risco_original = resultado_ag["metricas"]["risco_medio"]
        novo_risco = min(0.95, max(0.05, risco_original + ajuste_risco))
        resultado_ag["metricas"]["risco_medio"] = round(novo_risco, 3)
        resultado_ag["metricas"]["risco_medio_original"] = risco_original
    
    # Marcar que ajuste foi aplicado
    resultado_ag["ajuste_climatico_aplicado"] = True
    resultado_ag["contexto_climatico"] = contexto_climatico
    
    return resultado_ag

def obter_contexto_climatico_por_coordenadas(lat: float, lon: float, days: int = 30) -> Optional[Dict[str, Any]]:
    """Obtém contexto climático para coordenadas específicas"""
    try:
        weather_summary = get_weather_summary(lat, lon, days)
        return criar_contexto_climatico(weather_summary)
    except Exception as e:
        # Em caso de erro, retornar contexto vazio
        return {
            "clima_observado": None,
            "agua_observada": None,
            "ajuste_risco": 0,
            "fonte": "erro",
            "fallback": True,
            "error": str(e),
            "temperatura_media": None,
            "precipitacao_total": None,
            "risco_climatico_estimado": "indeterminado"
        }

def gerar_plano_com_clima(culturas, talhoes, regras, objetivo="equilibrado", seed=42, 
                         geracoes=100, populacao=50, lat=None, lon=None, days=30):
    """
    Wrapper para gerar plano genético com contexto climático opcional
    """
    from .planner import gerar_plano_genetico
    
    # Gerar plano normalmente
    resultado = gerar_plano_genetico(
        culturas, talhoes, regras, 
        objetivo=objetivo, seed=seed, 
        geracoes=geracoes, populacao=populacao
    )
    
    # Se coordenadas foram fornecidas, aplicar contexto climático
    if lat is not None and lon is not None:
        contexto_climatico = obter_contexto_climatico_por_coordenadas(lat, lon, days)
        if contexto_climatico:
            resultado = aplicar_contexto_climatico_no_plano(resultado, contexto_climatico)
    else:
        # Marcar que não há clima real aplicado
        resultado["ajuste_climatico_aplicado"] = False
        resultado["contexto_climatico"] = None
    
    return resultado