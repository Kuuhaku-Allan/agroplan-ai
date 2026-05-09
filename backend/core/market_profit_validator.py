"""
Validador de Lucro de Mercado

Classifica confiabilidade dos valores de lucro de mercado comparando com lucro do sistema.
Detecta distorções e fornece diagnóstico para validação antes de ativar recálculo automático.
"""

from typing import Dict, List, Optional


def calcular_diferenca_lucro(lucro_sistema: float, lucro_mercado: float) -> Dict:
    """
    Calcula diferença entre lucro do sistema e lucro de mercado.
    
    Args:
        lucro_sistema: Lucro calculado com base interna
        lucro_mercado: Lucro calculado com preços de mercado normalizados
    
    Returns:
        Dict com diferença absoluta, percentual e direção
    """
    diferenca_absoluta = lucro_mercado - lucro_sistema
    
    # Calcular percentual baseado no valor absoluto do lucro sistema
    # para evitar divisão por zero e lidar com valores negativos
    if lucro_sistema != 0:
        diferenca_percentual = (diferenca_absoluta / abs(lucro_sistema)) * 100
    else:
        diferenca_percentual = 0 if lucro_mercado == 0 else float('inf')
    
    # Determinar direção
    if abs(diferenca_percentual) < 5:
        direcao = "igual"
    elif diferenca_absoluta > 0:
        direcao = "maior"
    else:
        direcao = "menor"
    
    return {
        "diferenca_absoluta": round(diferenca_absoluta, 2),
        "diferenca_percentual": round(diferenca_percentual, 2),
        "direcao": direcao
    }


def classificar_confiabilidade_lucro(item: Dict) -> Dict:
    """
    Classifica confiabilidade do lucro de mercado para um item do plano.
    
    Args:
        item: Item do plano com dados de lucro
    
    Returns:
        Dict com confiabilidade (alta/media/baixa) e motivos
    """
    motivos = []
    
    # Verificar se tem preço normalizado
    preco_norm = item.get("preco_normalizado", {})
    if not preco_norm.get("normalizado"):
        return {
            "confiabilidade": "baixa",
            "motivos": ["Preço não normalizado ou não disponível"]
        }
    
    # Verificar se tem produtividade e custo
    produtividade = item.get("produtividade", 0)
    custo = item.get("custo", 0)
    
    if produtividade <= 0:
        motivos.append("Produtividade não disponível ou inválida")
    
    if custo <= 0:
        motivos.append("Custo não disponível ou inválido")
    
    if motivos:
        return {
            "confiabilidade": "baixa",
            "motivos": motivos
        }
    
    # Verificar se tem lucro de mercado calculado
    lucro_mercado = item.get("lucro_mercado_estimado")
    if lucro_mercado is None:
        return {
            "confiabilidade": "baixa",
            "motivos": ["Lucro de mercado não calculado"]
        }
    
    # Calcular diferença com lucro do sistema
    lucro_sistema = item.get("lucro_estimado", 0)
    diferenca = calcular_diferenca_lucro(lucro_sistema, lucro_mercado)
    diferenca_percentual = abs(diferenca["diferenca_percentual"])
    
    # Classificar baseado na diferença percentual
    if diferenca_percentual > 100:
        confiabilidade = "baixa"
        motivos.append(f"Diferença muito alta ({diferenca_percentual:.1f}%) entre lucro sistema e mercado")
    elif diferenca_percentual > 50:
        confiabilidade = "media"
        motivos.append(f"Diferença moderada ({diferenca_percentual:.1f}%) entre lucro sistema e mercado")
    else:
        confiabilidade = "alta"
        motivos.append(f"Diferença aceitável ({diferenca_percentual:.1f}%) entre lucro sistema e mercado")
    
    # Verificar se lucro de mercado é negativo (prejuízo)
    if lucro_mercado < 0:
        if confiabilidade == "alta":
            confiabilidade = "media"
        motivos.append("Lucro de mercado indica prejuízo - requer validação de preço/produtividade")
    
    # Verificar se é fallback
    preco_real = item.get("preco_real", {})
    if preco_real.get("fallback"):
        if confiabilidade == "alta":
            confiabilidade = "media"
        motivos.append("Preço usando fallback (referência) - pode não refletir mercado local")
    
    return {
        "confiabilidade": confiabilidade,
        "motivos": motivos,
        "diferenca": diferenca
    }


def validar_plano_lucro_mercado(resultado: Dict) -> Dict:
    """
    Valida lucro de mercado para todo o plano e adiciona classificação de confiabilidade.
    
    Args:
        resultado: Resultado do AG ou cenário com plano
    
    Returns:
        Resultado enriquecido com validação de lucro de mercado
    """
    if "plano" not in resultado:
        return resultado
    
    # Contadores
    alta_confiabilidade = 0
    media_confiabilidade = 0
    baixa_confiabilidade = 0
    alertas = []
    
    # Validar cada item do plano
    for item in resultado["plano"]:
        # Classificar confiabilidade
        validacao = classificar_confiabilidade_lucro(item)
        item["validacao_lucro_mercado"] = validacao
        
        # Contabilizar
        conf = validacao["confiabilidade"]
        if conf == "alta":
            alta_confiabilidade += 1
        elif conf == "media":
            media_confiabilidade += 1
        else:
            baixa_confiabilidade += 1
            # Adicionar alerta para baixa confiabilidade
            cultura = item.get("cultura", "desconhecida")
            talhao = item.get("talhao", "?")
            alertas.append(f"Talhão {talhao} ({cultura}): {', '.join(validacao['motivos'])}")
    
    # Adicionar resumo de validação
    total = len(resultado["plano"])
    percentual_alta = (alta_confiabilidade / total * 100) if total > 0 else 0
    percentual_baixa = (baixa_confiabilidade / total * 100) if total > 0 else 0
    
    resultado["validacao_lucro_mercado"] = {
        "ativo": True,
        "total_itens": total,
        "itens_alta_confiabilidade": alta_confiabilidade,
        "itens_media_confiabilidade": media_confiabilidade,
        "itens_baixa_confiabilidade": baixa_confiabilidade,
        "percentual_alta_confiabilidade": round(percentual_alta, 1),
        "percentual_baixa_confiabilidade": round(percentual_baixa, 1),
        "alertas": alertas[:5],  # Limitar a 5 alertas principais
        "total_alertas": len(alertas),
        "recomendacao": _gerar_recomendacao(percentual_alta, percentual_baixa)
    }
    
    return resultado


def _gerar_recomendacao(percentual_alta: float, percentual_baixa: float) -> str:
    """
    Gera recomendação baseada nos percentuais de confiabilidade.
    
    Args:
        percentual_alta: Percentual de itens com alta confiabilidade
        percentual_baixa: Percentual de itens com baixa confiabilidade
    
    Returns:
        String com recomendação
    """
    if percentual_alta >= 70:
        return "Lucro de mercado apresenta boa confiabilidade. Considere validação detalhada antes de ativar PRICE_APPLY_TO_PROFIT."
    elif percentual_baixa >= 50:
        return "Muitos itens com baixa confiabilidade. Valide preços, produtividades e custos antes de usar lucro de mercado."
    else:
        return "Confiabilidade mista. Revise itens com baixa confiabilidade e valide dados de mercado."


def gerar_diagnostico_lucro_mercado(plano: List[Dict], uf: Optional[str] = None) -> Dict:
    """
    Gera diagnóstico detalhado do lucro de mercado para análise.
    
    Args:
        plano: Lista de itens do plano
        uf: Unidade Federativa (opcional)
    
    Returns:
        Dict com diagnóstico por cultura
    """
    diagnostico = {
        "uf": uf,
        "total_culturas": 0,
        "culturas": {}
    }
    
    # Agrupar por cultura
    culturas_map = {}
    for item in plano:
        cultura = item.get("cultura", "desconhecida")
        
        if cultura not in culturas_map:
            culturas_map[cultura] = []
        
        culturas_map[cultura].append(item)
    
    # Gerar diagnóstico por cultura
    for cultura, itens in culturas_map.items():
        # Calcular médias
        lucro_sistema_total = sum(i.get("lucro_estimado", 0) for i in itens)
        lucro_mercado_total = sum(i.get("lucro_mercado_estimado", 0) for i in itens if i.get("lucro_mercado_estimado") is not None)
        
        lucro_sistema_medio = lucro_sistema_total / len(itens) if itens else 0
        lucro_mercado_medio = lucro_mercado_total / len(itens) if itens else 0
        
        # Calcular diferença
        diferenca = calcular_diferenca_lucro(lucro_sistema_medio, lucro_mercado_medio)
        
        # Obter confiabilidade do primeiro item (representativo)
        validacao = classificar_confiabilidade_lucro(itens[0]) if itens else {"confiabilidade": "baixa", "motivos": []}
        
        # Obter preço normalizado
        preco_norm = itens[0].get("preco_normalizado", {}) if itens else {}
        preco_real = itens[0].get("preco_real", {}) if itens else {}
        
        diagnostico["culturas"][cultura] = {
            "total_talhoes": len(itens),
            "lucro_sistema_medio": round(lucro_sistema_medio, 2),
            "lucro_mercado_medio": round(lucro_mercado_medio, 2),
            "diferenca": diferenca,
            "confiabilidade": validacao["confiabilidade"],
            "motivos": validacao["motivos"],
            "preco_original": preco_real.get("preco"),
            "unidade_original": preco_real.get("unidade"),
            "preco_por_tonelada": preco_norm.get("preco_por_tonelada"),
            "normalizado": preco_norm.get("normalizado", False),
            "fallback": preco_real.get("fallback", False)
        }
    
    diagnostico["total_culturas"] = len(culturas_map)
    
    return diagnostico
