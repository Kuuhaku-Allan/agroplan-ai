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
    """Calcula ajuste de risco baseado no risco climático estimado
    
    Retorna ajuste em pontos percentuais (não decimal)
    Exemplo: retorna 15 para +15 pontos percentuais, não 0.15
    """
    ajustes = {
        "alto": 15,      # +15 pontos percentuais
        "medio": 5,      # +5 pontos percentuais
        "baixo": -3,     # -3 pontos percentuais (leve benefício)
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
    """Aplica ajustes climáticos no resultado do algoritmo genético
    
    O risco no sistema está em formato de pontos percentuais (30 = 30%, não 0.30)
    """
    
    if not contexto_climatico or contexto_climatico.get("ajuste_risco", 0) == 0:
        # Sem ajuste necessário, mas ainda adiciona contexto
        resultado_ag["ajuste_climatico_aplicado"] = False
        resultado_ag["contexto_climatico"] = contexto_climatico
        return resultado_ag
    
    ajuste_risco = contexto_climatico["ajuste_risco"]  # Em pontos percentuais (ex: -3, +5, +15)
    
    # Salvar risco médio original antes de aplicar ajustes
    risco_medio_original = resultado_ag.get("risco_medio", 0)
    
    # Aplicar ajuste no plano (formato padrão do gerar_plano_genetico)
    if "plano" in resultado_ag:
        soma_risco_area = 0
        soma_area = 0
        
        for item in resultado_ag["plano"]:
            if "risco" in item and "area" in item:
                risco_original = item["risco"]  # Em pontos percentuais (ex: 30, 35, 40)
                area = item["area"]
                
                # Aplicar ajuste mantendo risco entre 5 e 95 pontos percentuais
                novo_risco = min(95, max(5, risco_original + ajuste_risco))
                
                # Salvar valores
                item["risco_original"] = round(risco_original, 1)
                item["risco"] = round(novo_risco, 1)
                item["ajuste_aplicado"] = round(ajuste_risco, 1)
                
                # Acumular para recalcular risco médio
                soma_risco_area += novo_risco * area
                soma_area += area
        
        # Recalcular risco médio ponderado por área
        if soma_area > 0:
            novo_risco_medio = soma_risco_area / soma_area
            resultado_ag["risco_medio_original"] = round(risco_medio_original, 1)
            resultado_ag["risco_medio"] = round(novo_risco_medio, 1)
    
    # Também suportar formato alternativo (plano_otimizado)
    elif "plano_otimizado" in resultado_ag:
        for item in resultado_ag["plano_otimizado"]:
            if "risco" in item:
                risco_original = item["risco"]
                novo_risco = min(95, max(5, risco_original + ajuste_risco))
                item["risco_original"] = round(risco_original, 1)
                item["risco"] = round(novo_risco, 1)
                item["ajuste_aplicado"] = round(ajuste_risco, 1)
        
        # Recalcular métricas se existirem
        if "metricas" in resultado_ag and "risco_medio" in resultado_ag["metricas"]:
            risco_original = resultado_ag["metricas"]["risco_medio"]
            novo_risco = min(95, max(5, risco_original + ajuste_risco))
            resultado_ag["metricas"]["risco_medio_original"] = round(risco_original, 1)
            resultado_ag["metricas"]["risco_medio"] = round(novo_risco, 1)
    
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