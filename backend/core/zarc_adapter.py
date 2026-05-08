"""
Adaptador para integrar dados ZARC no planejamento agrícola
"""
from typing import Optional, Dict, Any
from providers.zarc_provider import buscar_zarc

def converter_risco_zarc_para_ajuste(risco: str) -> float:
    """
    Converte risco ZARC para ajuste de risco
    
    Ajustes mais conservadores que clima, pois ZARC é oficial
    
    Returns:
        Ajuste em pontos percentuais
    """
    ajustes = {
        "baixo": -2,      # -2 pontos percentuais (janela favorável)
        "medio": 4,       # +4 pontos percentuais (janela neutra)
        "alto": 10,       # +10 pontos percentuais (janela desfavorável)
        "indeterminado": 0
    }
    return ajustes.get(risco.lower(), 0)

def aplicar_zarc_no_plano(resultado: Dict[str, Any], uf: Optional[str] = None, 
                         municipio: Optional[str] = None, safra: str = "2025/2026") -> Dict[str, Any]:
    """
    Aplica informações ZARC no resultado do planejamento
    
    Adiciona informações de janela de plantio e risco ZARC para cada cultura
    Não altera o risco calculado, apenas adiciona informações explicativas
    
    Args:
        resultado: Resultado do planejamento (AG ou cenário)
        uf: Unidade Federativa
        municipio: Município
        safra: Safra
    
    Returns:
        Resultado com informações ZARC adicionadas
    """
    
    if not uf or not municipio:
        # Sem localização, não aplicar ZARC
        resultado["zarc_aplicado"] = False
        resultado["zarc_info"] = None
        return resultado
    
    # Processar cada item do plano
    if "plano" in resultado:
        for item in resultado["plano"]:
            cultura = item.get("cultura")
            solo = item.get("solo")
            
            if cultura:
                # Buscar dados ZARC
                zarc_data = buscar_zarc(
                    cultura=cultura,
                    uf=uf,
                    municipio=municipio,
                    solo=solo,
                    safra=safra
                )
                
                if zarc_data:
                    # Adicionar informações ZARC ao item
                    item["zarc"] = {
                        "janela_plantio": zarc_data.get("janela_plantio"),
                        "risco": zarc_data.get("risco"),
                        "source": zarc_data.get("source"),
                        "observacao": zarc_data.get("observacao"),
                        "fallback": zarc_data.get("fallback", False)
                    }
                    
                    # Calcular ajuste (mas não aplicar por enquanto)
                    ajuste_zarc = converter_risco_zarc_para_ajuste(zarc_data.get("risco", "indeterminado"))
                    item["zarc"]["ajuste_sugerido"] = ajuste_zarc
                else:
                    item["zarc"] = {
                        "janela_plantio": None,
                        "risco": "indeterminado",
                        "source": "nao-encontrado",
                        "observacao": "Dados ZARC não encontrados para esta cultura/região.",
                        "fallback": True
                    }
    
    # Marcar que ZARC foi aplicado
    resultado["zarc_aplicado"] = True
    resultado["zarc_info"] = {
        "uf": uf,
        "municipio": municipio,
        "safra": safra
    }
    
    return resultado

def obter_info_zarc_por_cultura(cultura: str, uf: Optional[str] = None, 
                                municipio: Optional[str] = None, 
                                solo: Optional[str] = None,
                                safra: str = "2025/2026") -> Optional[Dict[str, Any]]:
    """
    Obtém informações ZARC para uma cultura específica
    
    Args:
        cultura: Nome da cultura
        uf: Unidade Federativa (opcional)
        municipio: Município (opcional)
        solo: Tipo de solo (opcional)
        safra: Safra
    
    Returns:
        Dicionário com informações ZARC ou None
    """
    return buscar_zarc(
        cultura=cultura,
        uf=uf,
        municipio=municipio,
        solo=solo,
        safra=safra
    )
