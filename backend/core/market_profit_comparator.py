"""
Avaliação Comparativa: Plano Sistema vs Avaliação com Lucro de Mercado

Avalia o plano otimizado pelo sistema usando lucro de mercado normalizado.
NÃO gera um novo plano otimizado por mercado - apenas avalia o plano atual.

Bloqueia uso automático se houver itens críticos ou baixa confiabilidade.
"""

from typing import Dict, List, Optional
from core.planner import gerar_plano_genetico
from core.price_adapter import aplicar_precos_no_plano
from core.market_profit_validator import validar_plano_lucro_mercado


def comparar_plano_sistema_com_avaliacao_mercado(
    culturas: List[Dict],
    talhoes: List[Dict],
    regras: List[Dict],
    uf: Optional[str] = None,
    municipio: Optional[str] = None,
    safra: str = "2025/2026",
    objetivo: str = "equilibrado",
    seed: int = 42,
    geracoes: int = 100,
    populacao: int = 50
) -> Dict:
    """
    Avalia o plano do sistema usando lucro de mercado para comparação.
    
    NÃO gera um plano otimizado por mercado. Apenas:
    1. Gera plano normal com AG usando lucro do sistema
    2. Avalia esse mesmo plano com lucro de mercado normalizado
    3. Compara os dois valores de lucro
    
    Args:
        culturas: Lista de culturas disponíveis
        talhoes: Lista de talhões
        regras: Regras de compatibilidade
        uf: Unidade Federativa
        municipio: Município
        safra: Safra agrícola
        objetivo: Objetivo de otimização
        seed: Seed para reprodutibilidade
        geracoes: Número de gerações do AG
        populacao: Tamanho da população
    
    Returns:
        Dict com modo, plano_sistema, avaliacao_mercado e comparacao
    """
    
    # 1. Gerar plano principal normalmente
    resultado = gerar_plano_genetico(
        culturas=culturas,
        talhoes=talhoes,
        regras=regras,
        objetivo=objetivo,
        seed=seed,
        geracoes=geracoes,
        populacao=populacao
    )
    
    # 2. Aplicar ZARC, se houver UF
    if uf:
        try:
            from core.zarc_adapter import enriquecer_plano_com_zarc
            resultado = enriquecer_plano_com_zarc(
                resultado,
                uf=uf,
                municipio=municipio,
                safra=safra
            )
        except Exception as zarc_error:
            resultado["zarc_error"] = str(zarc_error)
    
    # 3. Aplicar preços
    # IMPORTANTE: aplicar_precos_no_plano só aceita uf por enquanto
    resultado = aplicar_precos_no_plano(resultado, uf=uf)
    
    # 4. Validar lucro de mercado
    resultado = validar_plano_lucro_mercado(resultado)
    
    plano = resultado.get("plano", [])
    
    lucro_sistema_total = float(resultado.get("lucro_total", 0) or 0)
    
    lucro_mercado_total = 0.0
    itens_mercado = []
    
    for item in plano:
        lucro_mercado = item.get("lucro_mercado_estimado")
        
        if lucro_mercado is not None:
            try:
                lucro_mercado_float = float(lucro_mercado)
                lucro_mercado_total += lucro_mercado_float
            except Exception:
                lucro_mercado_float = None
        else:
            lucro_mercado_float = None
        
        itens_mercado.append({
            "talhao": item.get("talhao"),
            "cultura": item.get("cultura"),
            "lucro_sistema": item.get("lucro_estimado"),
            "lucro_mercado_estimado": lucro_mercado_float,
            "preco_real": item.get("preco_real"),
            "preco_normalizado": item.get("preco_normalizado"),
            "validacao_lucro_mercado": item.get("validacao_lucro_mercado")
        })
    
    diferenca_absoluta = lucro_mercado_total - lucro_sistema_total
    
    if lucro_sistema_total != 0:
        diferenca_percentual = (diferenca_absoluta / abs(lucro_sistema_total)) * 100
    else:
        diferenca_percentual = 0
    
    validacao = resultado.get("validacao_lucro_mercado", {}) or {}
    
    total = len(plano)
    alta = int(validacao.get("itens_alta_confiabilidade", 0) or 0)
    media = int(validacao.get("itens_media_confiabilidade", 0) or 0)
    baixa = int(validacao.get("itens_baixa_confiabilidade", 0) or 0)
    criticos = int(validacao.get("itens_criticos", 0) or 0)
    
    percentual_alta = (alta / total * 100) if total else 0
    
    pode_usar_mercado = (
        criticos == 0
        and baixa == 0
        and percentual_alta >= 70
    )
    
    motivo_bloqueio = None
    if not pode_usar_mercado:
        motivos = []
        if criticos > 0:
            motivos.append(f"{criticos} item(ns) crítico(s)")
        if baixa > 0:
            motivos.append(f"{baixa} item(ns) de baixa confiabilidade")
        if percentual_alta < 70:
            motivos.append(f"apenas {percentual_alta:.1f}% dos itens têm alta confiabilidade")
        
        motivo_bloqueio = (
            "O lucro de mercado não deve ser usado como recomendação principal: "
            + "; ".join(motivos)
        )
    
    return {
        "modo": "avaliacao_comparativa",
        "descricao": "Avalia o plano principal usando lucro de mercado normalizado, sem substituir a recomendação oficial.",
        "plano_sistema": resultado,
        "avaliacao_mercado": {
            "lucro_mercado_total": lucro_mercado_total,
            "itens": itens_mercado
        },
        "comparacao": {
            "lucro_sistema_total": lucro_sistema_total,
            "lucro_mercado_total": lucro_mercado_total,
            "diferenca_absoluta": diferenca_absoluta,
            "diferenca_percentual": diferenca_percentual,
            "itens_alta_confiabilidade": alta,
            "itens_media_confiabilidade": media,
            "itens_baixa_confiabilidade": baixa,
            "itens_criticos": criticos,
            "percentual_alta_confiabilidade": percentual_alta,
            "pode_usar_mercado": pode_usar_mercado,
            "motivo_bloqueio": motivo_bloqueio
        }
    }
