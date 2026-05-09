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

# URLs oficiais do Portal de Dados Abertos do Ministério da Agricultura
ZARC_URLS = {
    "2025/2026": "https://dados.agricultura.gov.br/dataset/6d3d141c-885e-41a4-ab7f-dc8ff323b96f/resource/f9d597f9-0fee-47eb-9344-8642274ca9da/download/dados-abertos-tabua-de-risco-safra-2025-2026.csv",
    "2026/2027": None  # TODO: Adicionar quando disponível
}

# Mapeamento de colunas do CSV oficial para formato interno
COLUMN_MAP = {
    "cultura": ["Nome_cultura", "cultura"],
    "uf": ["UF", "uf"],
    "municipio": ["municipio", "Municipio"],
    "solo": ["Cod_Solo", "solo", "tipo_solo"],
    # Janelas de plantio são representadas por decêndios (dec1-dec36)
    # Cada decêndio representa 10 dias do ano
    # Precisaremos processar isso de forma especial
}

# Mapeamento de códigos de solo (valores reais do CSV)
# O CSV usa códigos mais complexos, vamos mapear os principais
SOLO_MAP = {
    "1": "arenoso",
    "2": "medio",
    "3": "argiloso",
    # Códigos reais do CSV (baseado em textura)
    "11": "arenoso",
    "12": "arenoso",
    "13": "arenoso",
    "14": "medio",
    "15": "medio",
    "16": "medio",
    "17": "argiloso",
    "18": "argiloso",
    "19": "argiloso"
}

def decendio_para_periodo(dec: int) -> Dict[str, str]:
    """
    Converte número do decêndio para período do ano
    
    Args:
        dec: Número do decêndio (1-36)
    
    Returns:
        Dicionário com inicio e fim do período (formato DD/MM)
    """
    if dec < 1 or dec > 36:
        return {"inicio": "??/??", "fim": "??/??"}
    
    # Cada mês tem 3 decêndios
    mes = ((dec - 1) // 3) + 1
    decendio_no_mes = ((dec - 1) % 3) + 1
    
    # Dias de início e fim por decêndio no mês
    if decendio_no_mes == 1:
        dia_inicio = 1
        dia_fim = 10
    elif decendio_no_mes == 2:
        dia_inicio = 11
        dia_fim = 20
    else:  # decendio_no_mes == 3
        dia_inicio = 21
        # Último decêndio vai até o fim do mês
        dias_no_mes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        dia_fim = dias_no_mes[mes - 1]
    
    return {
        "inicio": f"{dia_inicio:02d}/{mes:02d}",
        "fim": f"{dia_fim:02d}/{mes:02d}"
    }

def mapear_codigo_solo(cod_solo: str) -> str:
    """
    Mapeia código de solo para nome
    
    Args:
        cod_solo: Código do solo (1-3 ou 11-19)
    
    Returns:
        Nome do solo (arenoso, medio, argiloso)
    """
    return SOLO_MAP.get(str(cod_solo), "desconhecido")

def extrair_janelas_plantio(registro: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Extrai janelas de plantio dos decêndios
    
    O CSV ZARC usa valores de risco em percentual:
    - 20: Risco de 20% (baixo)
    - 30: Risco de 30% (médio)
    - 40: Risco de 40% (alto)
    - 0 ou vazio: Não recomendado
    
    Args:
        registro: Registro do CSV com colunas dec1-dec36
    
    Returns:
        Lista de janelas de plantio
    """
    janelas = []
    janela_atual = None
    
    for dec in range(1, 37):
        col_name = f"dec{dec}"
        valor = registro.get(col_name, "")
        
        # Converter para string e limpar
        valor_str = str(valor).strip()
        
        # Valores válidos: 20 (baixo), 30 (médio), 40 (alto)
        # 0 ou vazio = não recomendado
        if valor_str and valor_str != "0":
            try:
                risco_percent = int(valor_str)
                
                # Classificar risco baseado nos valores reais do CSV
                if risco_percent == 20:
                    risco = "baixo"
                    risco_num = 20
                elif risco_percent == 30:
                    risco = "medio"
                    risco_num = 30
                elif risco_percent == 40:
                    risco = "alto"
                    risco_num = 40
                else:
                    # Valor inesperado, pular
                    continue
                
                if janela_atual is None:
                    # Iniciar nova janela
                    periodo = decendio_para_periodo(dec)
                    janela_atual = {
                        "inicio": periodo["inicio"],
                        "fim": periodo["fim"],
                        "decendios": [dec],
                        "riscos": [risco_num]
                    }
                else:
                    # Continuar janela atual
                    periodo = decendio_para_periodo(dec)
                    janela_atual["fim"] = periodo["fim"]
                    janela_atual["decendios"].append(dec)
                    janela_atual["riscos"].append(risco_num)
            except ValueError:
                # Valor inválido, tratar como fim de janela
                if janela_atual is not None:
                    # Calcular risco predominante
                    risco_medio = sum(janela_atual["riscos"]) / len(janela_atual["riscos"])
                    if risco_medio <= 25:  # Média até 25 = predominantemente baixo
                        janela_atual["risco_predominante"] = "baixo"
                    elif risco_medio <= 35:  # Média até 35 = predominantemente médio
                        janela_atual["risco_predominante"] = "medio"
                    else:
                        janela_atual["risco_predominante"] = "alto"
                    
                    del janela_atual["riscos"]
                    janelas.append(janela_atual)
                    janela_atual = None
        else:
            # Fim da janela atual (se houver)
            if janela_atual is not None:
                # Calcular risco predominante
                risco_medio = sum(janela_atual["riscos"]) / len(janela_atual["riscos"])
                if risco_medio <= 25:  # Média até 25 = predominantemente baixo
                    janela_atual["risco_predominante"] = "baixo"
                elif risco_medio <= 35:  # Média até 35 = predominantemente médio
                    janela_atual["risco_predominante"] = "medio"
                else:
                    janela_atual["risco_predominante"] = "alto"
                
                del janela_atual["riscos"]
                janelas.append(janela_atual)
                janela_atual = None
    
    # Adicionar última janela se houver
    if janela_atual is not None:
        risco_medio = sum(janela_atual["riscos"]) / len(janela_atual["riscos"])
        if risco_medio <= 25:  # Média até 25 = predominantemente baixo
            janela_atual["risco_predominante"] = "baixo"
        elif risco_medio <= 35:  # Média até 35 = predominantemente médio
            janela_atual["risco_predominante"] = "medio"
        else:
            janela_atual["risco_predominante"] = "alto"
        
        del janela_atual["riscos"]
        janelas.append(janela_atual)
    
    return janelas

def escolher_melhor_janela(janelas: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Escolhe a melhor janela de plantio
    
    Critérios:
    1. Menor risco predominante
    2. Maior duração
    3. Primeira janela (em caso de empate)
    
    Args:
        janelas: Lista de janelas de plantio
    
    Returns:
        Melhor janela ou None
    """
    if not janelas:
        return None
    
    # Ordenar por risco (baixo > medio > alto) e depois por duração (maior > menor)
    risco_ordem = {"baixo": 1, "medio": 2, "alto": 3}
    
    janelas_ordenadas = sorted(
        janelas,
        key=lambda j: (risco_ordem.get(j["risco_predominante"], 999), -len(j["decendios"]))
    )
    
    return janelas_ordenadas[0]

def normalizar_registro_oficial(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normaliza registro do CSV oficial para formato padrão
    
    Args:
        row: Linha do CSV oficial
    
    Returns:
        Registro normalizado
    """
    return {
        "cultura": row.get("Nome_cultura", ""),
        "uf": row.get("UF", ""),
        "municipio": row.get("municipio", ""),
        "solo_codigo": row.get("Cod_Solo", ""),
        "solo": mapear_codigo_solo(row.get("Cod_Solo", "")),
        "safra_ini": row.get("SafraIni", ""),
        "safra_fin": row.get("SafraFin", ""),
        "geocodigo": row.get("geocodigo", ""),
        "decendios": {f"dec{i}": row.get(f"dec{i}", "") for i in range(1, 37)}
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

def get_zarc_status(safra: str = ZARC_SAFRA_DEFAULT) -> Dict[str, Any]:
    """
    Retorna status do ZARC sem carregar dados
    
    MEMORY SAFE: Não carrega CSV, apenas verifica arquivos
    
    Returns:
        Status do ZARC (configuração, cache, etc)
    """
    cache_path = get_cache_path(safra)
    
    status = {
        "status": "configured",
        "safra": safra,
        "source": ZARC_SOURCE,
        "cache_exists": os.path.exists(cache_path),
        "cache_valid": False,
        "cache_size_mb": 0
    }
    
    if os.path.exists(cache_path):
        try:
            # Tamanho do arquivo em MB
            size_bytes = os.path.getsize(cache_path)
            status["cache_size_mb"] = round(size_bytes / (1024 * 1024), 2)
            
            # Verificar se cache é válido
            status["cache_valid"] = is_cache_valid(cache_path)
        except Exception:
            pass
    
    return status

def iter_zarc_records(file_path: str):
    """
    Itera sobre registros ZARC em streaming
    
    MEMORY SAFE: Usa yield para processar linha por linha
    
    Args:
        file_path: Caminho do arquivo CSV
    
    Yields:
        Dicionário com dados de cada linha
    """
    with open(file_path, 'r', encoding='utf-8-sig', newline='') as f:
        # Detectar delimitador
        primeira_linha = f.readline()
        f.seek(0)
        
        delimiter = ';' if ';' in primeira_linha else ','
        
        reader = csv.DictReader(f, delimiter=delimiter)
        
        for row in reader:
            yield row

def ensure_zarc_file(safra: str = ZARC_SAFRA_DEFAULT) -> Optional[Dict[str, Any]]:
    """
    Garante que arquivo ZARC existe, baixando se necessário
    
    MEMORY SAFE: Não carrega registros, apenas gerencia arquivo
    
    Returns:
        Metadata do arquivo ou None se não disponível
    """
    cache_path = get_cache_path(safra)
    
    # Verificar cache válido
    if is_cache_valid(cache_path):
        return {
            "file_path": cache_path,
            "source": "zarc-cache",
            "fallback": False,
            "error": None
        }
    
    # Tentar download se source for official
    if ZARC_SOURCE == "official":
        url = ZARC_URLS.get(safra)
        if url:
            try:
                # Criar request com User-Agent
                req = urllib.request.Request(
                    url,
                    headers={
                        'User-Agent': 'AgroPlan-AI/1.0 (https://github.com/Kuuhaku-Allan/agroplan-ai)'
                    }
                )
                
                # Download
                with urllib.request.urlopen(req, timeout=30) as response:
                    content = response.read().decode('utf-8')
                
                # Salvar
                with open(cache_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                return {
                    "file_path": cache_path,
                    "source": "zarc-oficial",
                    "fallback": False,
                    "error": None
                }
            except Exception as e:
                # Se download falhar, tentar usar cache antigo
                if os.path.exists(cache_path):
                    return {
                        "file_path": cache_path,
                        "source": "zarc-cache",
                        "fallback": False,
                        "error": f"Download falhou, usando cache antigo: {str(e)}"
                    }
    
    # Usar cache antigo se existir (mesmo expirado)
    if os.path.exists(cache_path):
        return {
            "file_path": cache_path,
            "source": "zarc-cache",
            "fallback": False,
            "error": "Cache expirado mas usado"
        }
    
    # Nenhum arquivo disponível
    return None

# OBSOLETO: Funções antigas que carregavam CSV inteiro em memória
# Mantidas apenas para referência, não devem ser usadas
# Use: ensure_zarc_file() + iter_zarc_records() + buscar_zarc()

# def download_zarc_dataset(safra: str) -> Optional[str]:
#     """OBSOLETO - Não usar, causa problemas de memória"""
#     pass

# def get_zarc_dataset(safra: str = ZARC_SAFRA_DEFAULT) -> Dict[str, Any]:
#     """OBSOLETO - Não usar, carrega 1M+ registros em memória"""
#     pass

# def load_zarc_from_file(file_path: str) -> List[Dict[str, Any]]:
#     """OBSOLETO - Não usar, carrega CSV inteiro em lista"""
#     pass
    """
    Baixa dataset ZARC oficial
    
    Returns:
        Caminho do arquivo baixado ou None se falhar
    """
    try:
        url = ZARC_URLS.get(safra)
        if not url:
            print(f"URL não disponível para safra {safra}")
            return None
        
        cache_path = get_cache_path(safra)
        
        print(f"Baixando ZARC oficial de {url}...")
        
        # Criar request com User-Agent
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': 'AgroPlan-AI/1.0 (https://github.com/Kuuhaku-Allan/agroplan-ai)'
            }
        )
        
        # Download
        with urllib.request.urlopen(req, timeout=30) as response:
            content = response.read().decode('utf-8')
        
        # Salvar
        with open(cache_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"ZARC oficial baixado e salvo em {cache_path}")
        return cache_path
        
    except Exception as e:
        print(f"Erro ao baixar ZARC oficial: {e}")
        return None

def get_zarc_dataset(safra: str = ZARC_SAFRA_DEFAULT) -> Dict[str, Any]:
    """
    Obtém dataset ZARC (cache ou download)
    
    Returns:
        Dicionário com:
        - records: Lista de registros ZARC
        - source: "zarc-oficial" | "zarc-cache" | "zarc-fallback"
        - fallback: bool
        - cache_path: str ou None
        - error: str ou None
    """
    cache_path = get_cache_path(safra)
    
    # Verificar cache válido
    if is_cache_valid(cache_path):
        try:
            records = load_zarc_from_file(cache_path)
            return {
                "records": records,
                "source": "zarc-cache",
                "fallback": False,
                "cache_path": cache_path,
                "error": None
            }
        except Exception as e:
            print(f"Erro ao carregar cache ZARC: {e}")
    
    # Tentar download se source for official
    if ZARC_SOURCE == "official":
        downloaded_path = download_zarc_dataset(safra)
        if downloaded_path:
            try:
                records = load_zarc_from_file(downloaded_path)
                return {
                    "records": records,
                    "source": "zarc-oficial",
                    "fallback": False,
                    "cache_path": downloaded_path,
                    "error": None
                }
            except Exception as e:
                print(f"Erro ao carregar ZARC baixado: {e}")
    
    # Usar cache antigo se existir (mesmo expirado)
    if os.path.exists(cache_path):
        try:
            records = load_zarc_from_file(cache_path)
            return {
                "records": records,
                "source": "zarc-cache",
                "fallback": False,
                "cache_path": cache_path,
                "error": "Cache expirado mas usado"
            }
        except Exception as e:
            print(f"Erro ao carregar cache antigo: {e}")
    
    # Fallback para dados simplificados
    print("Usando fallback ZARC simplificado")
    return {
        "records": get_zarc_fallback(),
        "source": "zarc-fallback",
        "fallback": True,
        "cache_path": None,
        "error": "CSV oficial não disponível, usando dados simplificados"
    }

def load_zarc_from_file(file_path: str) -> List[Dict[str, Any]]:
    """Carrega dados ZARC de arquivo CSV"""
    registros = []
    
    with open(file_path, 'r', encoding='utf-8-sig') as f:  # utf-8-sig remove BOM
        # Detectar delimitador (CSV oficial usa ponto-e-vírgula)
        primeira_linha = f.readline()
        f.seek(0)
        
        delimiter = ';' if ';' in primeira_linha else ','
        
        reader = csv.DictReader(f, delimiter=delimiter)
        
        # Log das colunas encontradas (primeira vez)
        if reader.fieldnames:
            print(f"Colunas ZARC encontradas ({len(reader.fieldnames)} colunas, delimiter='{delimiter}')")
        
        for row in reader:
            registros.append(row)
    
    return registros

def inspect_zarc_columns(safra: str = ZARC_SAFRA_DEFAULT) -> Optional[List[str]]:
    """
    Inspeciona colunas do CSV ZARC oficial
    
    Returns:
        Lista de nomes de colunas ou None se falhar
    """
    try:
        dataset = get_zarc_dataset(safra)
        
        if not dataset or not dataset.get("records"):
            print("Nenhum registro ZARC disponível")
            return None
        
        # Pegar colunas do primeiro registro
        if dataset["records"]:
            colunas = list(dataset["records"][0].keys())
            print(f"\nColunas do CSV ZARC ({dataset['source']}):")
            for i, col in enumerate(colunas, 1):
                print(f"  {i}. {col}")
            return colunas
        
        return None
        
    except Exception as e:
        print(f"Erro ao inspecionar colunas ZARC: {e}")
        return None

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
    
    MEMORY SAFE: Usa streaming para processar CSV linha por linha
    
    Args:
        cultura: Nome da cultura
        uf: Unidade Federativa (opcional)
        municipio: Nome do município (opcional)
        solo: Tipo de solo (opcional)
        safra: Safra (padrão: 2025/2026)
    
    Returns:
        Dicionário com dados ZARC ou None se não encontrar
    """
    # Normalizar parâmetros de busca
    cultura_norm = normalizar_cultura(cultura)
    uf_norm = normalizar_uf(uf) if uf else None
    municipio_norm = normalizar_municipio(municipio) if municipio else None
    solo_norm = normalizar_solo(solo) if solo else None
    
    # Tentar obter arquivo ZARC
    file_info = ensure_zarc_file(safra)
    
    if file_info:
        # Usar arquivo oficial/cache com streaming
        source = file_info["source"]
        melhor_match = None
        melhor_score = 0
        
        # Processar CSV em streaming (linha por linha)
        for registro in iter_zarc_records(file_info["file_path"]):
            score = 0
            
            # Cultura deve bater
            if normalizar_cultura(registro.get("Nome_cultura", "")) != cultura_norm:
                continue
            score += 10
            
            # UF (se fornecida)
            if uf_norm and normalizar_uf(registro.get("UF", "")) == uf_norm:
                score += 5
            
            # Município (se fornecido)
            if municipio_norm and normalizar_municipio(registro.get("municipio", "")) == municipio_norm:
                score += 3
            
            # Solo (se fornecido)
            if solo_norm:
                solo_registro = mapear_codigo_solo(registro.get("Cod_Solo", ""))
                if normalizar_solo(solo_registro) == solo_norm:
                    score += 2
            
            # Manter apenas o melhor match (não acumula lista)
            if score > melhor_score:
                melhor_score = score
                melhor_match = registro.copy()  # Copia apenas este registro
        
        if melhor_match:
            # Extrair janelas de plantio dos decêndios
            janelas = extrair_janelas_plantio(melhor_match)
            melhor_janela = escolher_melhor_janela(janelas)
            
            if melhor_janela:
                # Determinar observação baseada na fonte
                if source == "zarc-oficial":
                    observacao = "Dados obtidos da Tábua de Risco do ZARC (Ministério da Agricultura)."
                else:  # zarc-cache
                    observacao = "Dados obtidos do cache local da Tábua de Risco do ZARC."
                
                return {
                    "source": source,
                    "safra": safra,
                    "cultura": melhor_match.get("Nome_cultura"),
                    "uf": melhor_match.get("UF"),
                    "municipio": melhor_match.get("municipio"),
                    "geocodigo": melhor_match.get("geocodigo"),
                    "solo_codigo": melhor_match.get("Cod_Solo"),
                    "solo": mapear_codigo_solo(melhor_match.get("Cod_Solo", "")),
                    "janela_plantio": {
                        "inicio": melhor_janela["inicio"],
                        "fim": melhor_janela["fim"]
                    },
                    "risco": melhor_janela["risco_predominante"],
                    "decendios_recomendados": melhor_janela["decendios"],
                    "fallback": False,
                    "encontrado": True,
                    "observacao": observacao
                }
            else:
                # Registro encontrado mas sem janelas válidas
                return {
                    "source": source,
                    "safra": safra,
                    "cultura": melhor_match.get("Nome_cultura"),
                    "uf": melhor_match.get("UF"),
                    "municipio": melhor_match.get("municipio"),
                    "fallback": False,
                    "encontrado": False,
                    "message": "Registro ZARC encontrado mas sem janelas de plantio recomendadas."
                }
        else:
            # Nenhum registro encontrado no CSV oficial
            return {
                "source": source,
                "fallback": False,
                "encontrado": False,
                "message": "Nenhuma recomendação ZARC encontrada para os parâmetros informados."
            }
    
    # Fallback: usar dados simplificados (lista pequena em memória)
    fallback_data = get_zarc_fallback()
    melhor_match = None
    melhor_score = 0
    
    for registro in fallback_data:
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
            "source": "zarc-fallback",
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
            "fallback": True,
            "encontrado": True,
            "observacao": "Dados simplificados locais usados porque o CSV oficial não estava disponível."
        }
    
    return None
