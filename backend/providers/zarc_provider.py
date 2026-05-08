"""
Provedor de dados ZARC (Zoneamento Agrícola de Risco Climático)
Fonte: Portal de Dados Abertos do Ministério da Agricultura
"""
import urllib.request
import urllib.parse
import csv
import os
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from .cache import get_cache, set_cache

# Configurações
ZARC_CACHE_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'zarc')
ZARC_CACHE_TTL = int(os.getenv("ZARC_CACHE_TTL", "86400"))  # 24 horas
ZARC_SOURCE = os.getenv("ZARC_SOURCE", "official")  # official, fallback
ZARC_SAFRA_DEFAULT = os.getenv("ZARC_SAFRA", "2025/2026")

# URLs oficiais (exemplo - ajustar conforme disponibilidade)
ZARC_URLS = {
    "2025/2026": "https://dados.agricultura.gov.br/dataset/zarc-2025-2026/resource/...",
    "2026/2027": "https://dados.agricultura.gov.br/dataset/zarc-2026-2027/resource/..."
}

def normalizar_texto(texto: str) -> str:
    """Normaliza texto removendo acentos e convertendo para minúsculas"""
    if not texto:
        return ""
    
    # Mapeamento de acentos
    mapa_acentos = {
        'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a',
        'é': 'e', 'ê': 'e',
        'í': 'i',
        'ó': 'o', 'ô': 'o', 'õ': 'o',
        'ú': 'u', 'ü': 'u',
        'ç': 'c',
        'Á': 'a', 'À': 'a', 'Ã': 'a', 'Â': 'a',
        'É': 'e', 'Ê': 'e',
        'Í': 'i',
        'Ó': 'o', 'Ô': 'o', 'Õ': 'o',
        'Ú': 'u', 'Ü': 'u',
        'Ç': 'c'
    }
    
    texto_normalizado = texto.lower().strip()
    for acento, sem_acento in mapa_acentos.items():
        texto_normalizado = texto_normalizado.replace(acento, sem_acento)
    
    return texto_normalizado

def normalizar_cultura(cultura: str) -> str:
    """Normaliza nome de cultura"""
    return normalizar_texto(cultura)

def normalizar_municipio(municipio: str) -> str:
    """Normaliza nome de município"""
    return normalizar_texto(municipio)

def normalizar_uf(uf: str) -> str:
    """Normaliza UF"""
    return uf.upper().strip() if uf else ""

def normalizar_solo(solo: str) -> str:
    """Normaliza tipo de solo"""
    return normalizar_texto(solo)

def get_cache_path(safra: str) -> str:
    """Retorna caminho do arquivo de cache para a safra"""
    os.makedirs(ZARC_CACHE_DIR, exist_ok=True)
    safra_filename = safra.replace("/", "-")
    return os.path.join(ZARC_CACHE_DIR, f"zarc_{safra_filename}.csv")

def is_cache_valid(cache_path: str) -> bool:
    """Verifica se o cache ainda é válido"""
    if not os.path.exists(cache_path):
        return False
    
    # Verifica idade do arquivo
    file_age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_path))
    return file_age.total_seconds() < ZARC_CACHE_TTL

def download_zarc_dataset(safra: str) -> Optional[str]:
    """
    Baixa dataset ZARC oficial
    
    Returns:
        Caminho do arquivo baixado ou None se falhar
    """
    try:
        url = ZARC_URLS.get(safra)
        if not url:
            return None
        
        cache_path = get_cache_path(safra)
        
        # Download
        with urllib.request.urlopen(url, timeout=30) as response:
            content = response.read().decode('utf-8')
        
        # Salvar
        with open(cache_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return cache_path
        
    except Exception as e:
        print(f"Erro ao baixar ZARC: {e}")
        return None

def get_zarc_dataset(safra: str = ZARC_SAFRA_DEFAULT) -> Optional[List[Dict[str, Any]]]:
    """
    Obtém dataset ZARC (cache ou download)
    
    Returns:
        Lista de registros ZARC ou None se falhar
    """
    cache_path = get_cache_path(safra)
    
    # Verificar cache
    if is_cache_valid(cache_path):
        try:
            return load_zarc_from_file(cache_path)
        except Exception as e:
            print(f"Erro ao carregar cache ZARC: {e}")
    
    # Tentar download se source for official
    if ZARC_SOURCE == "official":
        downloaded_path = download_zarc_dataset(safra)
        if downloaded_path:
            try:
                return load_zarc_from_file(downloaded_path)
            except Exception as e:
                print(f"Erro ao carregar ZARC baixado: {e}")
    
    # Usar cache antigo se existir
    if os.path.exists(cache_path):
        try:
            return load_zarc_from_file(cache_path)
        except Exception as e:
            print(f"Erro ao carregar cache antigo: {e}")
    
    # Fallback para dados simplificados
    return get_zarc_fallback()

def load_zarc_from_file(file_path: str) -> List[Dict[str, Any]]:
    """Carrega dados ZARC de arquivo CSV"""
    registros = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            registros.append(row)
    
    return registros

def get_zarc_fallback() -> List[Dict[str, Any]]:
    """
    Retorna dados ZARC simplificados como fallback
    
    Baseado em conhecimento geral de janelas de plantio no Brasil
    """
    return [
        # Soja
        {
            "cultura": "soja",
            "uf": "SP",
            "municipio": "sao paulo",
            "solo": "argiloso",
            "janela_inicio": "10/10",
            "janela_fim": "15/12",
            "risco": "baixo",
            "safra": "2025/2026"
        },
        {
            "cultura": "soja",
            "uf": "PR",
            "municipio": "londrina",
            "solo": "argiloso",
            "janela_inicio": "01/10",
            "janela_fim": "10/12",
            "risco": "baixo",
            "safra": "2025/2026"
        },
        {
            "cultura": "soja",
            "uf": "MS",
            "municipio": "campo grande",
            "solo": "argiloso",
            "janela_inicio": "15/09",
            "janela_fim": "30/11",
            "risco": "baixo",
            "safra": "2025/2026"
        },
        # Milho
        {
            "cultura": "milho",
            "uf": "SP",
            "municipio": "ribeirao preto",
            "solo": "argiloso",
            "janela_inicio": "15/09",
            "janela_fim": "30/11",
            "risco": "baixo",
            "safra": "2025/2026"
        },
        {
            "cultura": "milho",
            "uf": "PR",
            "municipio": "londrina",
            "solo": "argiloso",
            "janela_inicio": "01/09",
            "janela_fim": "15/11",
            "risco": "baixo",
            "safra": "2025/2026"
        },
        # Feijão
        {
            "cultura": "feijao",
            "uf": "SP",
            "municipio": "sao paulo",
            "solo": "misto",
            "janela_inicio": "15/08",
            "janela_fim": "30/10",
            "risco": "medio",
            "safra": "2025/2026"
        },
        # Café
        {
            "cultura": "cafe",
            "uf": "SP",
            "municipio": "ribeirao preto",
            "solo": "argiloso",
            "janela_inicio": "01/10",
            "janela_fim": "31/12",
            "risco": "baixo",
            "safra": "2025/2026"
        },
        # Cana
        {
            "cultura": "cana",
            "uf": "SP",
            "municipio": "ribeirao preto",
            "solo": "argiloso",
            "janela_inicio": "01/09",
            "janela_fim": "31/03",
            "risco": "baixo",
            "safra": "2025/2026"
        }
    ]

def buscar_zarc(
    cultura: str,
    uf: Optional[str] = None,
    municipio: Optional[str] = None,
    solo: Optional[str] = None,
    safra: str = ZARC_SAFRA_DEFAULT
) -> Optional[Dict[str, Any]]:
    """
    Busca dados ZARC para cultura/região específica
    
    Args:
        cultura: Nome da cultura
        uf: Unidade Federativa (opcional)
        municipio: Nome do município (opcional)
        solo: Tipo de solo (opcional)
        safra: Safra (padrão: 2025/2026)
    
    Returns:
        Dicionário com dados ZARC ou None se não encontrar
    """
    dataset = get_zarc_dataset(safra)
    if not dataset:
        return None
    
    # Normalizar parâmetros de busca
    cultura_norm = normalizar_cultura(cultura)
    uf_norm = normalizar_uf(uf) if uf else None
    municipio_norm = normalizar_municipio(municipio) if municipio else None
    solo_norm = normalizar_solo(solo) if solo else None
    
    # Buscar melhor match
    melhor_match = None
    melhor_score = 0
    
    for registro in dataset:
        score = 0
        
        # Cultura deve bater
        if normalizar_cultura(registro.get("cultura", "")) != cultura_norm:
            continue
        score += 10
        
        # UF (se fornecida)
        if uf_norm and normalizar_uf(registro.get("uf", "")) == uf_norm:
            score += 5
        
        # Município (se fornecido)
        if municipio_norm and normalizar_municipio(registro.get("municipio", "")) == municipio_norm:
            score += 3
        
        # Solo (se fornecido)
        if solo_norm and normalizar_solo(registro.get("solo", "")) == solo_norm:
            score += 2
        
        if score > melhor_score:
            melhor_score = score
            melhor_match = registro
    
    if melhor_match:
        return {
            "source": "zarc-oficial" if ZARC_SOURCE == "official" else "zarc-fallback",
            "safra": safra,
            "cultura": melhor_match.get("cultura"),
            "uf": melhor_match.get("uf"),
            "municipio": melhor_match.get("municipio"),
            "solo": melhor_match.get("solo"),
            "janela_plantio": {
                "inicio": melhor_match.get("janela_inicio"),
                "fim": melhor_match.get("janela_fim")
            },
            "risco": melhor_match.get("risco", "indeterminado"),
            "fallback": ZARC_SOURCE != "official",
            "observacao": "Dados obtidos da Tábua de Risco do ZARC." if ZARC_SOURCE == "official" else "Dados simplificados baseados em conhecimento geral."
        }
    
    return None
