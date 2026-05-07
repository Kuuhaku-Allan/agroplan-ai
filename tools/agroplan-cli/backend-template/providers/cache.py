"""
Cache simples em memória para chamadas de APIs externas
"""
import time
from typing import Any, Optional

# Cache global em memória
_cache = {}

def get_cache(key: str) -> Optional[Any]:
    """Recupera valor do cache se ainda válido"""
    if key not in _cache:
        return None
    
    value, expiry = _cache[key]
    if time.time() > expiry:
        # Cache expirado, remove
        del _cache[key]
        return None
    
    return value

def set_cache(key: str, value: Any, ttl_seconds: int = 3600) -> None:
    """Armazena valor no cache com TTL"""
    expiry = time.time() + ttl_seconds
    _cache[key] = (value, expiry)

def clear_provider_cache() -> None:
    """Limpa todo o cache de provedores"""
    global _cache
    _cache = {}

def get_cache_stats() -> dict:
    """Retorna estatísticas do cache"""
    current_time = time.time()
    valid_items = 0
    expired_items = 0
    
    for key, (value, expiry) in _cache.items():
        if current_time <= expiry:
            valid_items += 1
        else:
            expired_items += 1
    
    return {
        "total_items": len(_cache),
        "valid_items": valid_items,
        "expired_items": expired_items
    }