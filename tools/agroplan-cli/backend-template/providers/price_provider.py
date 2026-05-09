"""
Provider de Preços Agrícolas
Fornece preços reais ou de referência para culturas
"""

import os
import json
from typing import Optional, Dict, List

# Configurações
PRICE_PROVIDER = os.getenv("PRICE_PROVIDER", "local")  # local, conab, disabled
PRICE_INDEX_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "precos", "precos_index.json")
PRICE_FALLBACK_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "precos", "precos_fallback.json")

# Cache em memória para índice de preços
_price_index_cache = None
_price_fallback_cache = None


def normalizar_cultura_preco(cultura: str) -> str:
    """Normaliza nome da cultura para busca de preços"""
    mapping = {
        "café": "cafe",
        "feijão": "feijao",
        "algodão": "algodao",
        "CAFÉ": "cafe",
        "FEIJÃO": "feijao",
        "ALGODÃO": "algodao",
        "Café": "cafe",
        "Feijão": "feijao",
        "Algodão": "algodao"
    }
    cultura_normalizada = mapping.get(cultura, cultura)
    return cultura_normalizada.lower().strip()


def load_price_index() -> Optional[Dict]:
    """Carrega índice de preços do arquivo JSON"""
    global _price_index_cache
    
    if _price_index_cache is not None:
        return _price_index_cache
    
    if not os.path.exists(PRICE_INDEX_PATH):
        return None
    
    try:
        with open(PRICE_INDEX_PATH, 'r', encoding='utf-8') as f:
            _price_index_cache = json.load(f)
        return _price_index_cache
    except Exception as e:
        print(f"Erro ao carregar índice de preços: {e}")
        return None


def load_price_fallback() -> List[Dict]:
    """Carrega preços de fallback do arquivo JSON"""
    global _price_fallback_cache
    
    if _price_fallback_cache is not None:
        return _price_fallback_cache
    
    if not os.path.exists(PRICE_FALLBACK_PATH):
        return []
    
    try:
        with open(PRICE_FALLBACK_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            _price_fallback_cache = data.get("precos", [])
        return _price_fallback_cache
    except Exception as e:
        print(f"Erro ao carregar preços de fallback: {e}")
        return []


def buscar_preco_no_indice(cultura: str, uf: Optional[str] = None) -> Optional[Dict]:
    """Busca preço no índice local"""
    price_index = load_price_index()
    
    if not price_index:
        return None
    
    records = price_index.get("records", {})
    
    # Tentar buscar com UF específica
    if uf:
        key = f"{cultura}_{uf.upper()}"
        if key in records:
            return records[key]
    
    # Tentar buscar sem UF (genérico)
    for key, record in records.items():
        if record.get("cultura") == cultura and not uf:
            return record
    
    return None


def buscar_preco_no_fallback(cultura: str) -> Optional[Dict]:
    """Busca preço no fallback"""
    fallback_data = load_price_fallback()
    
    for item in fallback_data:
        if item.get("cultura") == cultura:
            return item
    
    return None


def buscar_preco(cultura: str, uf: Optional[str] = None) -> Dict:
    """
    Busca preço de uma cultura
    
    Args:
        cultura: Nome da cultura
        uf: Unidade Federativa (opcional)
    
    Returns:
        Dicionário com informações de preço (sempre retorna, nunca None)
    """
    # Normalizar cultura
    cultura_normalizada = normalizar_cultura_preco(cultura)
    
    # Se provider desabilitado, retornar inativo
    if PRICE_PROVIDER == "disabled":
        return {
            "ativo": False,
            "source": "price-disabled",
            "fallback": False,
            "cultura": cultura,
            "uf": uf,
            "preco": None,
            "unidade": None,
            "data_referencia": None,
            "observacao": "Provider de preços desabilitado"
        }
    
    # Tentar buscar no índice local
    preco_data = buscar_preco_no_indice(cultura_normalizada, uf)
    
    if preco_data:
        return {
            "ativo": True,
            "source": preco_data.get("fonte", "price-local-index"),
            "fallback": preco_data.get("fallback", False),
            "cultura": cultura,
            "uf": uf or preco_data.get("uf"),
            "preco": preco_data.get("preco"),
            "unidade": preco_data.get("unidade"),
            "data_referencia": preco_data.get("data_referencia"),
            "observacao": preco_data.get("observacao", "Preço obtido do índice local")
        }
    
    # Tentar fallback
    preco_data = buscar_preco_no_fallback(cultura_normalizada)
    
    if preco_data:
        return {
            "ativo": True,
            "source": "price-fallback",
            "fallback": True,
            "cultura": cultura,
            "uf": uf,
            "preco": preco_data.get("preco"),
            "unidade": preco_data.get("unidade"),
            "data_referencia": None,
            "observacao": preco_data.get("observacao", "Preço de referência (fallback)")
        }
    
    # Nenhum preço encontrado
    return {
        "ativo": False,
        "source": "price-unavailable",
        "fallback": False,
        "cultura": cultura,
        "uf": uf,
        "preco": None,
        "unidade": None,
        "data_referencia": None,
        "observacao": "Preço não disponível para esta cultura"
    }


def buscar_precos_lote(culturas: List[str], uf: Optional[str] = None) -> List[Dict]:
    """
    Busca preços para múltiplas culturas
    
    Args:
        culturas: Lista de nomes de culturas
        uf: Unidade Federativa (opcional)
    
    Returns:
        Lista de dicionários com informações de preço
    """
    return [buscar_preco(cultura, uf) for cultura in culturas]


def get_price_status() -> Dict:
    """Retorna status do provider de preços"""
    price_index = load_price_index()
    fallback_data = load_price_fallback()
    
    index_count = len(price_index.get("records", {})) if price_index else 0
    fallback_count = len(fallback_data)
    
    return {
        "provider": PRICE_PROVIDER,
        "index_available": price_index is not None,
        "index_records": index_count,
        "fallback_records": fallback_count,
        "total_culturas_cobertas": index_count + fallback_count
    }


def clear_price_cache():
    """Limpa cache de preços em memória"""
    global _price_index_cache, _price_fallback_cache
    _price_index_cache = None
    _price_fallback_cache = None
