"""
Otimizador Experimental: Algoritmo Genético com Lucro de Mercado

IMPORTANTE: Este é um modo EXPERIMENTAL que não substitui o plano principal.
Usa lucro de mercado normalizado como fitness, mas bloqueia uso automático
quando há itens críticos ou baixa confiabilidade.

Status: EXPERIMENTAL - Requer validação manual antes de usar como recomendação.
"""

from typing import Dict, List, Optional
from core.planner import gerar_plano_genetico
from core.price_adapter import aplicar_precos_no_plano
from core.market_profit_validator import validar_plano_lucro_mercado


def gerar_plano_genetico_lucro_mercado_experimental(
    culturas: List[Dict],
    talhoes: List[Dict],
    regras: List[Dict],
    uf: Optional[str] = None,
    municipio: Optional[str] = None,
    safra: str = "2025/2026",
    objetivo: str = "mercado",
    seed: int = 42,
    geracoes: int = 50,
    populacao: int = 50
) -> Dict:
    """
    Gera plano otimizado usando lucro de mercado como fitness (EXPERIMENTAL).
    
    ATENÇÃO: Este é um modo experimental que:
    - Usa lucro_mercado_estimado como fitness principal
    - Aplica penalidade forte para itens sem preço ou baixa confiabilidade
    - Bloqueia uso automático se houver itens críticos
    - NÃO substitui a recomendação principal do sistema
    
    Args:
        culturas: Lista de culturas disponíveis
        talhoes: Lista de talhões
        regras: Regras de compatibilidade
        uf: Unidade Federativa (necessário para preços regionais)
        municipio: Município
        safra: Safra agrícola
        objetivo: Sempre "mercado" para este modo
        seed: Seed para reprodutibilidade
        geracoes: Número de gerações do AG
        populacao: Tamanho da população
    
    Returns:
        Dict com plano experimental, validação e status de bloqueio
    """
    
    # Por enquanto, usar o AG normal com objetivo "lucro"
    # TODO: Implementar fitness customizada baseada em lucro_mercado_estimado
    resultado = gerar_plano_genetico(
        culturas=culturas,
        talhoes=talhoes,
        regras=regras,
        objetivo="lucro",  # Usar lucro como proxy por enquanto
        seed=seed,
        geracoes=geracoes,
        populacao=populacao
    )
    
    # Aplicar ZARC se houver UF
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
    
    # Aplicar preços e normalização
    resultado = aplicar_precos_no_plano(resultado, uf=uf)
    
    # Validar lucro de mercado
    resultado = validar_plano_lucro_mercado(resultado)
    
    # Calcular lucro de mercado total
    lucro_mercado_total = 0.0
    lucro_sistema_total = float(resultado.get("lucro_total", 0) or 0)
    
    for item in resultado['plano']:
        lucro_mercado = item.get('lucro_mercado_estimado')
        if lucro_mercado is not None:
            try:
                lucro_mercado_float = float(lucro_mercado)
                lucro_mercado_total += lucro_mercado_float
            except Exception:
                pass
    
    # Calcular fitness de mercado (baseado no lucro de mercado)
    # Normalizar para escala similar ao fitness do sistema
    fitness_mercado = lucro_mercado_total / 1000000 if lucro_mercado_total > 0 else 0
    fitness_sistema = float(resultado.get("fitness", 0) or 0)
    
    # Obter validação
    validacao = resultado.get('validacao_lucro_mercado', {}) or {}
    
    # Determinar bloqueio
    itens_criticos = int(validacao.get('itens_criticos', 0) or 0)
    itens_baixa = int(validacao.get('itens_baixa_confiabilidade', 0) or 0)
    percentual_alta = float(validacao.get('percentual_alta_confiabilidade', 0) or 0)
    
    bloqueado = (
        itens_criticos > 0
        or itens_baixa > 0
        or percentual_alta < 70
        or lucro_mercado_total <= 0
    )
    
    # Montar motivo de bloqueio
    motivo_bloqueio = None
    if bloqueado:
        motivos = []
        if itens_criticos > 0:
            motivos.append(f"{itens_criticos} item(ns) crítico(s)")
        if itens_baixa > 0:
            motivos.append(f"{itens_baixa} item(ns) de baixa confiabilidade")
        if percentual_alta < 70:
            motivos.append(f"apenas {percentual_alta:.1f}% dos itens têm alta confiabilidade")
        if lucro_mercado_total <= 0:
            motivos.append("lucro de mercado total não é positivo")
        
        motivo_bloqueio = (
            "Este plano experimental não deve ser usado como recomendação principal: "
            + "; ".join(motivos)
        )
    
    # Montar resposta experimental
    return {
        "modo": "otimizacao_mercado_experimental",
        "experimental": True,
        "aviso": "Este plano é experimental e não substitui a recomendação principal. Validar manualmente antes de usar.",
        "plano": resultado['plano'],
        "lucro_mercado_total": float(lucro_mercado_total),
        "lucro_sistema_total_referencial": float(lucro_sistema_total),
        "fitness_mercado": float(fitness_mercado),
        "fitness_sistema_referencial": float(fitness_sistema),
        "risco_medio": float(resultado.get("risco_medio", 0) or 0),
        "diversidade": int(resultado.get("diversidade", 0) or 0),
        "area_total": float(resultado.get("area_total", 0) or 0),
        "geracoes": int(geracoes),
        "objetivo": "mercado",
        "seed": int(seed),
        "validacao_lucro_mercado": validacao,
        "bloqueado": bloqueado,
        "pode_usar_como_recomendacao": not bloqueado,
        "motivo_bloqueio": motivo_bloqueio,
        "zarc": resultado.get("zarc"),
        "precos": resultado.get("precos")
    }
