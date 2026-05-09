"""
Normalizador de Unidades de Preços Agrícolas

Converte preços de diferentes unidades para uma base comum (R$/tonelada)
para permitir comparação e cálculo consistente de lucro.
"""

from typing import Dict, Optional


# Fatores de conversão para tonelada
CONVERSAO_UNIDADES = {
    "tonelada": 1.0,
    "saca_60kg": 1000.0 / 60.0,  # 16.6667 sacas por tonelada
    "saca_50kg": 1000.0 / 50.0,  # 20 sacas por tonelada
    "arroba_15kg": 1000.0 / 15.0,  # 66.6667 arrobas por tonelada
}


def normalizar_preco_para_tonelada(preco: float, unidade: str) -> Dict:
    """
    Converte preço de qualquer unidade para R$/tonelada.
    
    Args:
        preco: Preço na unidade original
        unidade: Unidade do preço (tonelada, saca_60kg, saca_50kg, arroba_15kg)
    
    Returns:
        Dict com informações de normalização:
        - preco_original: Preço original
        - unidade_original: Unidade original
        - preco_por_tonelada: Preço convertido para R$/tonelada
        - unidade_normalizada: "tonelada"
        - fator_conversao: Fator usado na conversão
        - normalizado: True se conversão foi bem-sucedida
        - error: Mensagem de erro se conversão falhou
    """
    
    # Normalizar nome da unidade (remover espaços, lowercase)
    unidade_normalizada = unidade.lower().strip().replace(" ", "_")
    
    # Verificar se unidade é suportada
    if unidade_normalizada not in CONVERSAO_UNIDADES:
        return {
            "preco_original": preco,
            "unidade_original": unidade,
            "normalizado": False,
            "error": f"Unidade '{unidade}' não suportada. Unidades válidas: {', '.join(CONVERSAO_UNIDADES.keys())}"
        }
    
    # Obter fator de conversão
    fator = CONVERSAO_UNIDADES[unidade_normalizada]
    
    # Calcular preço por tonelada
    preco_por_tonelada = preco * fator
    
    return {
        "preco_original": preco,
        "unidade_original": unidade,
        "preco_por_tonelada": round(preco_por_tonelada, 2),
        "unidade_normalizada": "tonelada",
        "fator_conversao": round(fator, 4),
        "normalizado": True
    }


def normalizar_precos_lote(precos: Dict[str, Dict]) -> Dict[str, Dict]:
    """
    Normaliza preços de múltiplas culturas em lote.
    
    Args:
        precos: Dict com culturas como chave e dados de preço como valor
    
    Returns:
        Dict com culturas como chave e dados normalizados como valor
    """
    resultado = {}
    
    for cultura, dados_preco in precos.items():
        if not dados_preco.get("ativo", False):
            resultado[cultura] = {
                **dados_preco,
                "normalizado": False,
                "error": "Preço não disponível"
            }
            continue
        
        preco = dados_preco.get("preco")
        unidade = dados_preco.get("unidade")
        
        if preco is None or unidade is None:
            resultado[cultura] = {
                **dados_preco,
                "normalizado": False,
                "error": "Dados de preço incompletos"
            }
            continue
        
        # Normalizar preço
        normalizacao = normalizar_preco_para_tonelada(preco, unidade)
        
        # Combinar dados originais com normalização
        resultado[cultura] = {
            **dados_preco,
            **normalizacao
        }
    
    return resultado


def calcular_lucro_com_preco_normalizado(
    preco_por_tonelada: float,
    produtividade: float,  # toneladas por hectare
    custo_por_hectare: float,
    area: float
) -> Dict:
    """
    Calcula lucro usando preço normalizado de mercado.
    
    Args:
        preco_por_tonelada: Preço normalizado em R$/tonelada
        produtividade: Produtividade em toneladas por hectare
        custo_por_hectare: Custo de produção por hectare
        area: Área em hectares
    
    Returns:
        Dict com cálculos detalhados:
        - receita_total: Receita bruta
        - custo_total: Custo total de produção
        - lucro_mercado: Lucro líquido com preço de mercado
        - lucro_por_hectare: Lucro por hectare
    """
    
    # Calcular receita
    producao_total = produtividade * area  # toneladas
    receita_total = preco_por_tonelada * producao_total
    
    # Calcular custo
    custo_total = custo_por_hectare * area
    
    # Calcular lucro
    lucro_mercado = receita_total - custo_total
    lucro_por_hectare = lucro_mercado / area if area > 0 else 0
    
    return {
        "receita_total": round(receita_total, 2),
        "custo_total": round(custo_total, 2),
        "lucro_mercado": round(lucro_mercado, 2),
        "lucro_por_hectare": round(lucro_por_hectare, 2),
        "producao_total_toneladas": round(producao_total, 2)
    }


def obter_estatisticas_normalizacao(precos_normalizados: Dict[str, Dict]) -> Dict:
    """
    Gera estatísticas sobre normalização de preços.
    
    Args:
        precos_normalizados: Dict com preços normalizados
    
    Returns:
        Dict com estatísticas de normalização
    """
    total = len(precos_normalizados)
    normalizados = sum(1 for p in precos_normalizados.values() if p.get("normalizado", False))
    nao_normalizados = total - normalizados
    
    # Agrupar por unidade original
    unidades = {}
    for cultura, dados in precos_normalizados.items():
        if dados.get("normalizado", False):
            unidade = dados.get("unidade_original", "desconhecida")
            unidades[unidade] = unidades.get(unidade, 0) + 1
    
    return {
        "ativa": True,
        "unidade_base": "tonelada",
        "total_culturas": total,
        "culturas_normalizadas": normalizados,
        "culturas_nao_normalizadas": nao_normalizados,
        "unidades_originais": unidades
    }
