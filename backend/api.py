"""
FastAPI Backend para AgroPlan AI
"""

from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sys
import os
import uuid

# Adiciona o diretório backend ao path para imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.loader import carregar_dados
from core.planner import gerar_cenarios, gerar_plano_genetico
from core.bruteforce_validator import comparar_ag_com_forca_bruta, executar_multiplas_rodadas
from core.report_generator import gerar_relatorio_completo

# Importar provedores de dados reais
from providers.weather_provider import get_weather_summary
from providers.cache import clear_provider_cache, get_cache_stats

# Configurações de ambiente
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
DATA_MODE = os.getenv("DATA_MODE", "hybrid")  # simulated, real, hybrid
WEATHER_PROVIDER = os.getenv("WEATHER_PROVIDER", "open-meteo")
PROVIDER_CACHE_TTL = int(os.getenv("PROVIDER_CACHE_TTL", "3600"))
DEBUG_ERRORS = os.getenv("DEBUG_ERRORS", "false").lower() == "true"

# Cache em memória para resultados pesados
_resultados_cache = {}

def get_cache_key(nome, **params):
    """Gera chave única para cache baseada no nome e parâmetros"""
    return f"{nome}:" + ":".join(f"{k}={v}" for k, v in sorted(params.items()))

def get_or_compute_cache(key, compute_fn):
    """Retorna valor do cache ou computa e armazena se não existir"""
    if key not in _resultados_cache:
        _resultados_cache[key] = compute_fn()
    return _resultados_cache[key]

def get_ag_cacheado(objetivo="equilibrado", seed=42, geracoes=100, populacao=50):
    """Retorna resultado do AG cacheado"""
    culturas, talhoes, regras = get_dados()
    key = get_cache_key("ag", objetivo=objetivo, seed=seed, geracoes=geracoes, populacao=populacao)
    return get_or_compute_cache(key, lambda: gerar_plano_genetico(culturas, talhoes, regras, objetivo=objetivo, seed=seed, geracoes=geracoes, populacao=populacao))

# Inicializa FastAPI
app = FastAPI(
    title="AgroPlan AI API",
    description="API para Sistema Inteligente de Planejamento de Plantio",
    version="5.0.0"
)

# Configura CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos Pydantic
class OtimizarRequest(BaseModel):
    objetivo: str = "equilibrado"
    seed: Optional[int] = 42
    geracoes: Optional[int] = 100
    populacao: Optional[int] = 50
    lat: Optional[float] = None
    lon: Optional[float] = None
    days: Optional[int] = 30
    uf: Optional[str] = None
    municipio: Optional[str] = None
    safra: Optional[str] = "2025/2026"

class ValidarRequest(BaseModel):
    objetivo: str = "equilibrado"
    seed: Optional[int] = 42

class RelatorioRequest(BaseModel):
    objetivo: str = "equilibrado"
    formato: str = "md"
    lat: Optional[float] = None
    lon: Optional[float] = None
    days: Optional[int] = 30
    uf: Optional[str] = None
    municipio: Optional[str] = None
    safra: Optional[str] = "2025/2026"

class RodadasRequest(BaseModel):
    objetivo: str = "equilibrado"
    rodadas: int = 5

# Cache de dados (carrega uma vez)
_dados_cache = None

def get_dados():
    """Carrega dados com cache"""
    global _dados_cache
    if _dados_cache is None:
        culturas, talhoes, regras = carregar_dados()
        _dados_cache = {
            'culturas': culturas,
            'talhoes': talhoes,
            'regras': regras
        }
    return _dados_cache['culturas'], _dados_cache['talhoes'], _dados_cache['regras']

def converter_tipos_python(obj):
    """Converte tipos numpy para tipos Python nativos recursivamente"""
    import numpy as np
    
    if isinstance(obj, dict):
        return {k: converter_tipos_python(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [converter_tipos_python(item) for item in obj]
    elif isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, str):
        return str(obj)
    else:
        return obj

# Endpoints

@app.get("/")
def root():
    """Endpoint raiz"""
    return {
        "message": "AgroPlan AI API",
        "version": "5.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health():
    """Verifica saúde da API"""
    try:
        culturas, talhoes, regras = get_dados()
        provider_cache_stats = get_cache_stats()
        
        # Verificar status ZARC (memory safe - não carrega CSV)
        from providers.zarc_provider import get_zarc_status
        zarc_status = get_zarc_status()
        
        # Verificar status de preços
        from providers.price_provider import get_price_status
        price_status = get_price_status()
        
        # Carregar VERSION.json se existir
        version_info = {}
        version_path = os.path.join(os.path.dirname(__file__), "VERSION.json")
        if os.path.exists(version_path):
            import json
            with open(version_path, 'r') as f:
                version_info = json.load(f)
        
        response = {
            "status": "healthy",
            "culturas": len(culturas),
            "talhoes": len(talhoes),
            "regras": len(regras),
            "cache_items": len(_resultados_cache),
            "data_mode": DATA_MODE,
            "providers": {
                "weather": "available" if WEATHER_PROVIDER else "disabled",
                "zarc": zarc_status,
                "prices": price_status
            },
            "provider_cache": provider_cache_stats
        }
        
        # Adicionar info de versão se disponível
        if version_info:
            response["backend_template_version"] = version_info.get("backend_template_version")
            response["zarc_index_version"] = version_info.get("zarc_index_version")
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/debug/version")
def debug_version():
    """Retorna informações detalhadas de versão e configuração do backend"""
    try:
        import json
        from providers.zarc_provider import (
            ZARC_FAST_INDEX_ENABLED,
            ZARC_ALLOW_FULL_SCAN,
            load_zarc_index,
            get_zarc_fallback
        )
        
        # Carregar VERSION.json
        version_info = {}
        version_path = os.path.join(os.path.dirname(__file__), "VERSION.json")
        if os.path.exists(version_path):
            with open(version_path, 'r') as f:
                version_info = json.load(f)
        
        # Verificar índice ZARC
        zarc_index = load_zarc_index()
        zarc_index_info = {}
        zarc_index_keys_sample = []
        
        if zarc_index:
            records = zarc_index.get("records", {})
            zarc_index_info = {
                "exists": True,
                "total_records": len(records),
                "generated_at": zarc_index.get("generated_at"),
                "source": zarc_index.get("source")
            }
            # Sample de 10 primeiras chaves
            zarc_index_keys_sample = list(records.keys())[:10]
        else:
            zarc_index_info = {"exists": False}
        
        # Verificar fallbacks
        fallback_data = get_zarc_fallback()
        culturas_fallback = set(item.get("cultura") for item in fallback_data)
        
        return {
            "api_version": "5.0.0",
            "backend_file": __file__,
            "backend_template_version": version_info.get("backend_template_version", "unknown"),
            "cli_version": version_info.get("cli_version", "unknown"),
            "zarc_index_version": version_info.get("zarc_index_version", "unknown"),
            "features": version_info.get("features", []),
            "generated_at": version_info.get("generated_at"),
            "zarc_config": {
                "fast_index_enabled": ZARC_FAST_INDEX_ENABLED,
                "allow_full_scan": ZARC_ALLOW_FULL_SCAN,
                "index": zarc_index_info,
                "index_keys_sample": zarc_index_keys_sample
            },
            "zarc_fallback": {
                "total_records": len(fallback_data),
                "culturas": sorted(list(culturas_fallback)),
                "has_sorgo": "sorgo" in culturas_fallback,
                "has_mandioca": "mandioca" in culturas_fallback
            },
            "data_mode": DATA_MODE,
            "weather_provider": WEATHER_PROVIDER
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/debug/zarc-coverage")
def debug_zarc_coverage(
    uf: Optional[str] = Query(None, description="UF"),
    municipio: Optional[str] = Query(None, description="Município"),
    safra: str = Query("2025/2026", description="Safra")
):
    """Retorna diagnóstico detalhado de cobertura ZARC"""
    try:
        import json
        from core.zarc_adapter import enriquecer_plano_com_zarc
        
        # Usar o mesmo plano do dashboard
        resultado_ag = get_ag_cacheado(objetivo="equilibrado")
        
        # Enriquecer com ZARC
        resultado_enriquecido = enriquecer_plano_com_zarc(
            resultado_ag,
            uf=uf,
            municipio=municipio,
            safra=safra
        )
        
        # Analisar cobertura
        detalhes = []
        culturas_com_zarc = 0
        culturas_fallback = 0
        culturas_unavailable = 0
        
        for item in resultado_enriquecido["plano"]:
            zarc = item.get("zarc", {})
            
            detalhes.append({
                "talhao": item.get("talhao"),
                "cultura": item.get("cultura"),
                "solo_original": item.get("solo"),
                "zarc_ativo": zarc.get("ativo", False),
                "zarc_source": zarc.get("source"),
                "zarc_fallback": zarc.get("fallback", False),
                "zarc_message": zarc.get("message"),
                "zarc_janela": zarc.get("janela_plantio")
            })
            
            if zarc.get("ativo"):
                culturas_com_zarc += 1
                if zarc.get("fallback"):
                    culturas_fallback += 1
            else:
                culturas_unavailable += 1
        
        total_culturas = len(resultado_enriquecido["plano"])
        coverage_percent = (culturas_com_zarc / total_culturas * 100) if total_culturas > 0 else 0
        
        # Carregar VERSION.json
        version_info = {}
        version_path = os.path.join(os.path.dirname(__file__), "VERSION.json")
        if os.path.exists(version_path):
            with open(version_path, 'r') as f:
                version_info = json.load(f)
        
        # Verificar índice ZARC
        from providers.zarc_provider import load_zarc_index
        zarc_index = load_zarc_index()
        zarc_index_total = len(zarc_index.get("records", {})) if zarc_index else 0
        
        return {
            "uf": uf,
            "municipio": municipio,
            "safra": safra,
            "summary": {
                "culturas_com_zarc": culturas_com_zarc,
                "culturas_fallback": culturas_fallback,
                "culturas_unavailable": culturas_unavailable,
                "total_culturas": total_culturas,
                "coverage_percent": round(coverage_percent, 1)
            },
            "backend_info": {
                "backend_template_version": version_info.get("backend_template_version", "unknown"),
                "zarc_index_version": version_info.get("zarc_index_version", "unknown"),
                "zarc_index_total_records": zarc_index_total
            },
            "details": detalhes
        }
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=f"{str(e)}\n{traceback.format_exc()}")

@app.get("/dados/clima")
def get_clima(
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"), 
    days: int = Query(30, description="Número de dias para análise")
):
    """Obtém dados climáticos reais ou simulados"""
    try:
        # Se lat ou lon não foram fornecidos, retornar mensagem amigável
        if lat is None or lon is None:
            return {
                "message": "Informe latitude e longitude para consultar dados climáticos reais.",
                "exemplo_sao_paulo": "/dados/clima?lat=-23.55&lon=-46.63&days=30",
                "exemplo_brasilia": "/dados/clima?lat=-15.78&lon=-47.93&days=30",
                "parametros": {
                    "lat": "Latitude da localização",
                    "lon": "Longitude da localização", 
                    "days": "Número de dias analisados, padrão 30"
                }
            }
        
        if days < 1 or days > 365:
            raise HTTPException(status_code=400, detail="Days deve estar entre 1 e 365")
        
        weather_data = get_weather_summary(lat, lon, days)
        return weather_data.to_dict()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dados/clima/nasa-power")
def get_clima_nasa_power(
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    month: int = Query(None, description="Mês (1-12)")
):
    """Obtém climatologia NASA POWER para um mês específico"""
    try:
        from providers.nasa_power_provider import buscar_climatologia_nasa_power, get_nasa_power_status
        
        # Se lat ou lon não foram fornecidos, retornar informações
        if lat is None or lon is None or month is None:
            return {
                "message": "Informe latitude, longitude e mês para consultar climatologia NASA POWER.",
                "exemplo": "/dados/clima/nasa-power?lat=-21.56&lon=-50.45&month=5",
                "parametros": {
                    "lat": "Latitude da localização",
                    "lon": "Longitude da localização",
                    "month": "Mês (1-12)"
                },
                "provider_info": get_nasa_power_status()
            }
        
        if month < 1 or month > 12:
            raise HTTPException(status_code=400, detail="Month deve estar entre 1 e 12")
        
        # Buscar climatologia
        climatology = buscar_climatologia_nasa_power(lat, lon, month)
        
        if climatology:
            return climatology
        else:
            return {
                "message": "Não foi possível obter dados NASA POWER para esta localização.",
                "lat": lat,
                "lon": lon,
                "month": month,
                "note": "NASA POWER pode estar temporariamente indisponível ou a localização pode estar fora da cobertura."
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dados/clima/nasa-power/debug")
def get_clima_nasa_power_debug(
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    month: int = Query(None, description="Mês (1-12)")
):
    """Debug endpoint - mostra resposta bruta da NASA POWER para diagnóstico"""
    try:
        from providers.nasa_power_provider import buscar_climatologia_nasa_power_debug
        
        # Se lat ou lon não foram fornecidos, retornar informações
        if lat is None or lon is None or month is None:
            return {
                "message": "Informe latitude, longitude e mês para debug NASA POWER.",
                "exemplo": "/dados/clima/nasa-power/debug?lat=-21.56&lon=-50.45&month=5",
                "parametros": {
                    "lat": "Latitude da localização",
                    "lon": "Longitude da localização",
                    "month": "Mês (1-12)"
                }
            }
        
        if month < 1 or month > 12:
            raise HTTPException(status_code=400, detail="Month deve estar entre 1 e 12")
        
        # Buscar debug info
        debug_info = buscar_climatologia_nasa_power_debug(lat, lon, month)
        
        return debug_info
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dados/zarc")
def get_zarc(
    cultura: Optional[str] = Query(None, description="Nome da cultura"),
    uf: Optional[str] = Query(None, description="Unidade Federativa (ex: SP, PR)"),
    municipio: Optional[str] = Query(None, description="Nome do município"),
    solo: Optional[str] = Query(None, description="Tipo de solo"),
    safra: str = Query("2025/2026", description="Safra (ex: 2025/2026)")
):
    """Obtém dados ZARC (Zoneamento Agrícola de Risco Climático)"""
    try:
        # Importar provider ZARC
        from providers.zarc_provider import buscar_zarc
        
        # Se cultura não foi fornecida, retornar mensagem amigável
        if not cultura:
            return {
                "message": "Informe a cultura para consultar dados ZARC.",
                "exemplo_soja_sp": "/dados/zarc?cultura=soja&uf=SP&municipio=Sao%20Paulo&solo=argiloso",
                "exemplo_milho_pr": "/dados/zarc?cultura=milho&uf=PR&municipio=Londrina&solo=argiloso",
                "parametros": {
                    "cultura": "Nome da cultura (obrigatório)",
                    "uf": "Unidade Federativa (opcional)",
                    "municipio": "Nome do município (opcional)",
                    "solo": "Tipo de solo (opcional)",
                    "safra": "Safra, padrão 2025/2026"
                },
                "culturas_disponiveis": ["soja", "milho", "feijao", "cafe", "cana", "trigo", "algodao"],
                "safras_disponiveis": ["2025/2026", "2026/2027"]
            }
        
        # Buscar dados ZARC
        zarc_data = buscar_zarc(
            cultura=cultura,
            uf=uf,
            municipio=municipio,
            solo=solo,
            safra=safra
        )
        
        if zarc_data:
            return zarc_data
        else:
            return {
                "message": "Dados ZARC não encontrados para os parâmetros fornecidos.",
                "cultura": cultura,
                "uf": uf,
                "municipio": municipio,
                "solo": solo,
                "safra": safra,
                "sugestao": "Tente com parâmetros mais genéricos (apenas cultura e UF)"
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dados/precos")
def get_precos(
    cultura: Optional[str] = Query(None, description="Nome da cultura"),
    uf: Optional[str] = Query(None, description="Unidade Federativa (ex: SP, PR)")
):
    """Obtém preços agrícolas"""
    try:
        # Importar provider de preços
        from providers.price_provider import buscar_preco
        
        # Se cultura não foi fornecida, retornar mensagem amigável
        if not cultura:
            return {
                "message": "Informe a cultura para consultar preços agrícolas.",
                "exemplo_soja_sp": "/dados/precos?cultura=soja&uf=SP",
                "exemplo_milho_pr": "/dados/precos?cultura=milho&uf=PR",
                "parametros": {
                    "cultura": "Nome da cultura (obrigatório)",
                    "uf": "Unidade Federativa (opcional)"
                },
                "culturas_disponiveis": [
                    "soja", "milho", "feijao", "trigo", "algodao", 
                    "cafe", "cana", "arroz", "sorgo", "mandioca"
                ]
            }
        
        # Buscar preço
        preco_data = buscar_preco(cultura=cultura, uf=uf)
        
        return preco_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dados/precos/lote")
def get_precos_lote(
    uf: Optional[str] = Query(None, description="Unidade Federativa (ex: SP, PR)")
):
    """Obtém preços agrícolas para todas as culturas do AgroPlan"""
    try:
        # Importar provider de preços
        from providers.price_provider import buscar_precos_lote
        
        # Culturas do AgroPlan
        culturas = ["soja", "milho", "feijao", "trigo", "algodao", "cafe", "cana", "arroz", "sorgo", "mandioca"]
        
        # Buscar preços em lote
        precos_data = buscar_precos_lote(culturas=culturas, uf=uf)
        
        # Estatísticas
        total = len(precos_data)
        com_preco = sum(1 for p in precos_data if p.get("ativo"))
        fallback = sum(1 for p in precos_data if p.get("fallback"))
        
        return {
            "uf": uf,
            "total_culturas": total,
            "culturas_com_preco": com_preco,
            "culturas_fallback": fallback,
            "precos": precos_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dados/precos/comparar")
def get_precos_comparar(
    uf: Optional[str] = Query(None, description="Unidade Federativa (ex: SP, PR)")
):
    """Compara preços originais com preços normalizados para tonelada"""
    try:
        from providers.price_provider import buscar_precos_lote
        from core.price_normalizer import normalizar_precos_lote, obter_estatisticas_normalizacao
        
        # Culturas do AgroPlan
        culturas = ["soja", "milho", "feijao", "trigo", "algodao", "cafe", "cana", "arroz", "sorgo", "mandioca"]
        
        # Buscar preços em lote
        precos_data = buscar_precos_lote(culturas=culturas, uf=uf)
        
        # Converter para dict por cultura
        precos_dict = {p["cultura"]: p for p in precos_data}
        
        # Normalizar preços
        precos_normalizados = normalizar_precos_lote(precos_dict)
        
        # Obter estatísticas
        stats = obter_estatisticas_normalizacao(precos_normalizados)
        
        return {
            "uf": uf,
            "precos_normalizados": precos_normalizados,
            "estatisticas": stats
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/debug/lucro-mercado")
def get_debug_lucro_mercado(
    uf: Optional[str] = Query(None, description="Unidade Federativa (ex: SP, PR)"),
    municipio: Optional[str] = Query(None, description="Município"),
    safra: str = Query("2025/2026", description="Safra ZARC")
):
    """Diagnóstico detalhado do lucro de mercado para validação"""
    try:
        from core.loader import carregar_dados
        from core.planner import gerar_plano_inteligente
        from core.price_adapter import aplicar_precos_no_plano
        from core.market_profit_validator import gerar_diagnostico_lucro_mercado
        
        # Carregar dados
        culturas, talhoes, regras = carregar_dados()
        
        # Gerar plano inteligente
        plano_inteligente = gerar_plano_inteligente(culturas, talhoes, regras)
        
        # Mapear para formato esperado pelo price_adapter
        plano = []
        for item in plano_inteligente:
            plano.append({
                'talhao': item['talhao'],
                'area': item['area'],
                'solo': item['solo'],
                'clima': item['clima'],
                'relevo': item['relevo'],
                'agua': item['agua'],
                'cultura': item['cultura_recomendada'],  # Mapear cultura_recomendada -> cultura
                'lucro_estimado': item['lucro_estimado'],
                'risco': item['risco'],
                'nota': item['nota'],
                'tempo': item['tempo']
            })
        
        resultado = {"plano": plano}
        
        # Aplicar preços e normalização
        resultado = aplicar_precos_no_plano(resultado, uf=uf)
        
        # Gerar diagnóstico
        diagnostico = gerar_diagnostico_lucro_mercado(resultado["plano"], uf=uf)
        
        # Adicionar resumo de validação
        validacao = resultado.get("validacao_lucro_mercado", {})
        
        return {
            "diagnostico": diagnostico,
            "validacao_resumo": validacao,
            "municipio": municipio,
            "safra": safra
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/comparar/lucro-mercado")
def comparar_lucro_mercado(
    objetivo: str = Query("equilibrado", description="Objetivo de otimização"),
    seed: int = Query(42, description="Seed para reprodutibilidade"),
    geracoes: int = Query(100, description="Número de gerações do AG"),
    populacao: int = Query(50, description="Tamanho da população"),
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    days: int = Query(30, description="Dias para análise climática"),
    uf: Optional[str] = Query(None, description="Unidade Federativa (ex: SP, PR)"),
    municipio: Optional[str] = Query(None, description="Município"),
    safra: str = Query("2025/2026", description="Safra ZARC")
):
    """
    Avalia o plano do sistema usando lucro de mercado para comparação.
    
    NÃO gera um plano otimizado por mercado. Apenas:
    1. Gera plano normal com AG usando lucro do sistema
    2. Avalia esse mesmo plano com lucro de mercado normalizado
    3. Compara os dois valores de lucro
    
    Retorna:
    - modo: "avaliacao_comparativa"
    - plano_sistema: Plano otimizado pelo AG normal
    - avaliacao_mercado: Avaliação do mesmo plano com lucro de mercado
    - comparacao: Diferenças e validação
    """
    try:
        from core.market_profit_comparator import comparar_plano_sistema_com_avaliacao_mercado
        
        culturas, talhoes, regras = get_dados()
        
        resultado = comparar_plano_sistema_com_avaliacao_mercado(
            culturas=culturas,
            talhoes=talhoes,
            regras=regras,
            uf=uf,
            municipio=municipio,
            safra=safra,
            objetivo=objetivo,
            seed=seed,
            geracoes=geracoes,
            populacao=populacao
        )
        
        return converter_tipos_python(resultado)
        
    except Exception as e:
        import traceback
        if DEBUG_ERRORS:
            raise HTTPException(
                status_code=500,
                detail={
                    "error": str(e),
                    "traceback": traceback.format_exc()
                }
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Erro ao gerar avaliação comparativa de lucro de mercado."
            )

@app.get("/dashboard")
def get_dashboard(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    days: int = Query(30, description="Número de dias para análise climática"),
    uf: Optional[str] = None,
    municipio: Optional[str] = None,
    safra: str = Query("2025/2026", description="Safra ZARC")
):
    """Retorna resumo do dashboard com contexto climático e ZARC opcional"""
    try:
        culturas, talhoes, regras = get_dados()
        
        # Obter contexto climático se coordenadas foram fornecidas
        contexto_climatico = None
        if lat is not None and lon is not None:
            from core.climate_adapter import obter_contexto_climatico_por_coordenadas
            contexto_climatico = obter_contexto_climatico_por_coordenadas(lat, lon, days)
        
        # Gerar chave de cache considerando clima e ZARC
        cache_params = {"objetivo": "equilibrado", "seed": 42}
        if lat is not None and lon is not None:
            cache_params.update({"lat": lat, "lon": lon, "days": days})
        if uf:
            cache_params.update({"uf": uf, "municipio": municipio or "", "safra": safra})
        
        cache_key = get_cache_key("dashboard", **cache_params)
        
        def compute_dashboard():
            # Usar AG com clima se disponível
            if contexto_climatico:
                from core.climate_adapter import gerar_plano_com_clima
                resultado_ag = gerar_plano_com_clima(
                    culturas, talhoes, regras, 
                    objetivo='equilibrado', seed=42,
                    lat=lat, lon=lon, days=days
                )
            else:
                resultado_ag = get_ag_cacheado(objetivo='equilibrado', seed=42)
            
            # Tenta validar
            validacao = comparar_ag_com_forca_bruta(culturas, talhoes, regras, objetivo='equilibrado', seed=42)
            
            # Preparar resultado base
            if validacao.get('erro'):
                resultado_base = {
                    "lucro_total": float(resultado_ag['lucro_total']),
                    "risco_medio": float(resultado_ag['risco_medio']),
                    "fitness": float(resultado_ag['fitness']),
                    "diversidade": int(resultado_ag['diversidade']),
                    "objetivo": str(resultado_ag['objetivo']),
                    "culturas_escolhidas": [str(p['cultura']) for p in resultado_ag['plano']],
                    "validacao": {
                        "otimo_global": False,
                        "total_combinacoes": int(validacao.get('total_combinacoes', 0))
                    },
                    "plano": [
                        {
                            "talhao": int(p['talhao']),
                            "area": float(p['area']),
                            "solo": str(p['solo']),
                            "clima": str(p['clima']),
                            "relevo": str(p['relevo']),
                            "agua": str(p['agua']),
                            "cultura": str(p['cultura']),
                            "lucro_estimado": float(p['lucro_estimado']),
                            "risco": float(p['risco']),
                            "nota": float(p['nota']),
                            "tempo": int(p['tempo'])
                        }
                        for p in resultado_ag['plano']
                    ]
                }
            else:
                resultado_base = {
                    "lucro_total": float(resultado_ag['lucro_total']),
                    "risco_medio": float(resultado_ag['risco_medio']),
                    "fitness": float(resultado_ag['fitness']),
                    "diversidade": int(resultado_ag['diversidade']),
                    "objetivo": str(resultado_ag['objetivo']),
                    "culturas_escolhidas": [str(p['cultura']) for p in resultado_ag['plano']],
                    "validacao": {
                        "otimo_global": bool(validacao.get('ag_encontrou_otimo_global', False)),
                        "total_combinacoes": int(validacao.get('forca_bruta', {}).get('total_combinacoes', 0))
                    },
                    "plano": [
                        {
                            "talhao": int(p['talhao']),
                            "area": float(p['area']),
                            "solo": str(p['solo']),
                            "clima": str(p['clima']),
                            "relevo": str(p['relevo']),
                            "agua": str(p['agua']),
                            "cultura": str(p['cultura']),
                            "lucro_estimado": float(p['lucro_estimado']),
                            "risco": float(p['risco']),
                            "nota": float(p['nota']),
                            "tempo": int(p['tempo'])
                        }
                        for p in resultado_ag['plano']
                    ]
                }
            
            # Adicionar informações de clima real
            if contexto_climatico:
                resultado_base["clima_real"] = {
                    "ativo": True,
                    "source": contexto_climatico.get("fonte", "unknown"),
                    "temperatura_media": contexto_climatico.get("temperatura_media"),
                    "precipitacao_total": contexto_climatico.get("precipitacao_total"),
                    "risco_climatico_estimado": contexto_climatico.get("risco_climatico_estimado"),
                    "clima_observado": contexto_climatico.get("clima_observado"),
                    "agua_observada": contexto_climatico.get("agua_observada"),
                    "ajuste_risco": contexto_climatico.get("ajuste_risco", 0),
                    "fallback": contexto_climatico.get("fallback", False),
                    "error": contexto_climatico.get("error")
                }
            else:
                resultado_base["clima_real"] = {"ativo": False}
            
            # Enriquecer com ZARC se UF foi fornecida
            if uf:
                from core.zarc_adapter import enriquecer_plano_com_zarc
                resultado_base = enriquecer_plano_com_zarc(
                    resultado_base,
                    uf=uf,
                    municipio=municipio,
                    safra=safra
                )
            else:
                resultado_base["zarc"] = {"ativo": False}
            
            # Enriquecer com preços agrícolas
            from core.price_adapter import aplicar_precos_no_plano
            resultado_base = aplicar_precos_no_plano(resultado_base, uf=uf)
            
            return resultado_base
        
        # Usa cache para dashboard com contexto climático
        resultado = get_or_compute_cache(cache_key, compute_dashboard)
        
        # Converte tipos Python (por segurança)
        return converter_tipos_python(resultado)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/talhoes")
def get_talhoes():
    """Retorna dados dos talhões"""
    try:
        culturas, talhoes, regras = get_dados()
        return {
            "talhoes": talhoes.to_dict('records')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recomendacoes")
def get_recomendacoes(
    uf: Optional[str] = None,
    municipio: Optional[str] = None,
    safra: str = Query("2025/2026", description="Safra ZARC")
):
    """Retorna recomendações de culturas por talhão com ZARC opcional"""
    try:
        culturas, talhoes, regras = get_dados()
        
        # Usa AG cacheado para obter recomendações
        resultado_ag = get_ag_cacheado(objetivo='equilibrado', seed=42)
        
        # Formata recomendações
        recomendacoes = []
        for p in resultado_ag['plano']:
            recomendacoes.append({
                "talhao": int(p['talhao']),
                "cultura": str(p['cultura']),
                "lucro_estimado": float(p['lucro_estimado']),
                "risco": float(p['risco']),
                "nota": float(p['nota']),
                "area": float(p['area']),
                "solo": str(p['solo']),
                "clima": str(p['clima']),
                "relevo": str(p['relevo']),
                "agua": str(p['agua'])
            })
        
        resultado = {"recomendacoes": recomendacoes}
        
        # Enriquecer com ZARC se UF foi fornecida
        if uf:
            from core.zarc_adapter import enriquecer_plano_com_zarc
            resultado_temp = {"plano": recomendacoes}
            resultado_temp = enriquecer_plano_com_zarc(
                resultado_temp,
                uf=uf,
                municipio=municipio,
                safra=safra
            )
            resultado["recomendacoes"] = resultado_temp["plano"]
            resultado["zarc"] = resultado_temp.get("zarc", {"ativo": False})
        else:
            resultado["zarc"] = {"ativo": False}
        
        # Enriquecer com preços agrícolas
        from core.price_adapter import aplicar_precos_no_plano
        resultado_temp = {"plano": resultado["recomendacoes"]}
        resultado_temp = aplicar_precos_no_plano(resultado_temp, uf=uf)
        resultado["recomendacoes"] = resultado_temp["plano"]
        resultado["precos"] = resultado_temp.get("precos", {"ativo": False})
        
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/culturas")
def get_culturas():
    """Retorna dados das culturas"""
    try:
        culturas, talhoes, regras = get_dados()
        
        # Combina culturas com regras
        culturas_dict = culturas.to_dict('records')
        regras_dict = regras.to_dict('records')
        
        # Cria dicionário de regras por cultura
        regras_map = {r['cultura']: r for r in regras_dict}
        
        # Adiciona regras às culturas
        for cultura in culturas_dict:
            nome = cultura['nome']
            if nome in regras_map:
                cultura['regras'] = regras_map[nome]
        
        return {
            "culturas": culturas_dict
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cenarios")
def get_cenarios(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    days: int = Query(30, description="Número de dias para análise climática")
):
    """Retorna comparação de cenários com contexto climático opcional"""
    try:
        # Obter contexto climático se coordenadas foram fornecidas
        contexto_climatico = None
        if lat is not None and lon is not None:
            from core.climate_adapter import obter_contexto_climatico_por_coordenadas
            contexto_climatico = obter_contexto_climatico_por_coordenadas(lat, lon, days)
        
        # Gerar chave de cache considerando clima
        cache_params = {"cenarios": True}
        if lat is not None and lon is not None:
            cache_params.update({"lat": lat, "lon": lon, "days": days})
        
        cache_key = get_cache_key("cenarios", **cache_params)
        
        def montar_cenarios():
            culturas, talhoes, regras = get_dados()
            
            # Gera todos os cenários
            cenarios = gerar_cenarios(culturas, talhoes, regras)
            
            # Usar AG com clima se disponível
            if contexto_climatico:
                from core.climate_adapter import gerar_plano_com_clima
                resultado_ag = gerar_plano_com_clima(
                    culturas, talhoes, regras, 
                    objetivo='equilibrado', seed=42,
                    lat=lat, lon=lon, days=days
                )
            else:
                resultado_ag = get_ag_cacheado(objetivo='equilibrado', seed=42)
            
            # Cria um mapa de talhões para facilitar o acesso
            talhoes_dict = {int(row['id']): row for _, row in talhoes.iterrows()}
            
            # Formata resposta
            cenarios_formatados = {}
            
            # Aplicar ajuste climático em todos os cenários se disponível
            ajuste_risco = contexto_climatico.get("ajuste_risco", 0) if contexto_climatico else 0
            
            for key, cenario in cenarios.items():
                # Aplicar ajuste climático no risco de cada item do plano
                plano_ajustado = []
                soma_risco_area = 0
                soma_area = 0
                
                for p in cenario['plano']:
                    risco_original = float(p['risco'])  # Em pontos percentuais (30, 35, etc.)
                    area = float(p['area'])
                    
                    # Aplicar ajuste se houver (ajuste também em pontos percentuais: -3, +5, +15)
                    if ajuste_risco != 0:
                        novo_risco = min(95, max(5, risco_original + ajuste_risco))
                    else:
                        novo_risco = risco_original
                    
                    item_plano = {
                        "talhao": int(p['talhao']),
                        "area": area,
                        "solo": str(talhoes_dict[int(p['talhao'])]['solo']),
                        "clima": str(talhoes_dict[int(p['talhao'])]['clima']),
                        "relevo": str(talhoes_dict[int(p['talhao'])]['relevo']),
                        "agua": str(talhoes_dict[int(p['talhao'])]['agua']),
                        "cultura": str(p['cultura']),
                        "lucro_estimado": float(p['lucro_estimado']),
                        "risco": round(novo_risco, 1),  # Em pontos percentuais
                        "nota": float(p['nota']),
                        "tempo": 0
                    }
                    
                    # Adicionar campos de ajuste se aplicado
                    if ajuste_risco != 0:
                        item_plano["risco_original"] = round(risco_original, 1)
                        item_plano["ajuste_aplicado"] = round(ajuste_risco, 1)
                    
                    plano_ajustado.append(item_plano)
                    
                    # Acumular para recalcular risco médio
                    soma_risco_area += novo_risco * area
                    soma_area += area
                
                # Recalcular risco médio ponderado
                risco_medio_ajustado = soma_risco_area / soma_area if soma_area > 0 else cenario['risco_medio']
                
                cenarios_formatados[key] = {
                    'nome': str(cenario['nome']),
                    'descricao': str(cenario['descricao']),
                    'lucro_total': float(cenario['lucro_total']),
                    'risco_medio': round(risco_medio_ajustado, 1),  # Em pontos percentuais
                    'area_total': float(cenario['area_total']),
                    'plano': plano_ajustado
                }
                
                # Adicionar risco médio original se ajuste foi aplicado
                if ajuste_risco != 0:
                    cenarios_formatados[key]['risco_medio_original'] = round(float(cenario['risco_medio']), 1)
            
            # Adiciona AG com contexto climático
            cenarios_formatados['genetico'] = {
                'nome': 'Algoritmo Genético',
                'descricao': 'Solução otimizada automaticamente',
                'lucro_total': float(resultado_ag['lucro_total']),
                'risco_medio': float(resultado_ag['risco_medio']),
                'area_total': float(resultado_ag['area_total']),
                'plano': [
                    {
                        "talhao": int(p['talhao']),
                        "area": float(p['area']),
                        "solo": str(p['solo']),
                        "clima": str(p['clima']),
                        "relevo": str(p['relevo']),
                        "agua": str(p['agua']),
                        "cultura": str(p['cultura']),
                        "lucro_estimado": float(p['lucro_estimado']),
                        "risco": float(p['risco']),
                        "nota": float(p['nota']),
                        "tempo": int(p['tempo'])
                    }
                    for p in resultado_ag['plano']
                ]
            }
            
            # Adicionar informações de clima real se disponível
            resultado_final = {"cenarios": cenarios_formatados}
            if contexto_climatico:
                resultado_final["clima_real"] = {
                    "ativo": True,
                    "source": contexto_climatico.get("fonte", "unknown"),
                    "temperatura_media": contexto_climatico.get("temperatura_media"),
                    "precipitacao_total": contexto_climatico.get("precipitacao_total"),
                    "risco_climatico_estimado": contexto_climatico.get("risco_climatico_estimado"),
                    "clima_observado": contexto_climatico.get("clima_observado"),
                    "agua_observada": contexto_climatico.get("agua_observada"),
                    "ajuste_risco": contexto_climatico.get("ajuste_risco", 0),
                    "fallback": contexto_climatico.get("fallback", False),
                    "error": contexto_climatico.get("error")
                }
            else:
                resultado_final["clima_real"] = {"ativo": False}
            
            return resultado_final
        
        # Usa cache para cenários com contexto climático
        resultado = get_or_compute_cache(cache_key, montar_cenarios)
        
        return converter_tipos_python(resultado)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/otimizar")
def otimizar(request: OtimizarRequest):
    """Executa otimização com Algoritmo Genético e contexto climático opcional"""
    try:
        # Valida objetivo
        objetivos_validos = ['equilibrado', 'lucro', 'risco', 'sustentavel']
        if request.objetivo not in objetivos_validos:
            raise HTTPException(status_code=400, detail=f"Objetivo inválido. Use: {objetivos_validos}")
        
        # Obter contexto climático se coordenadas foram fornecidas
        contexto_climatico = None
        if request.lat is not None and request.lon is not None:
            from core.climate_adapter import obter_contexto_climatico_por_coordenadas
            contexto_climatico = obter_contexto_climatico_por_coordenadas(request.lat, request.lon, request.days)
        
        # Usar AG com clima se disponível
        if contexto_climatico:
            from core.climate_adapter import gerar_plano_com_clima
            resultado = gerar_plano_com_clima(
                *get_dados(),
                objetivo=request.objetivo,
                seed=request.seed,
                geracoes=request.geracoes,
                populacao=request.populacao,
                lat=request.lat,
                lon=request.lon,
                days=request.days
            )
        else:
            # Usa AG cacheado se parâmetros forem padrão e sem clima
            if (request.objetivo == "equilibrado" and 
                request.seed == 42 and 
                request.geracoes == 100 and 
                request.populacao == 50):
                resultado = get_ag_cacheado(
                    objetivo=request.objetivo,
                    seed=request.seed,
                    geracoes=request.geracoes,
                    populacao=request.populacao
                )
            else:
                # Executa AG sem cache para parâmetros customizados
                culturas, talhoes, regras = get_dados()
                resultado = gerar_plano_genetico(
                    culturas, talhoes, regras,
                    objetivo=request.objetivo,
                    geracoes=request.geracoes,
                    populacao=request.populacao,
                    seed=request.seed
                )
        
        # Converte tipos numpy para Python nativos
        resultado_convertido = converter_tipos_python(resultado)
        
        # Enriquecer com ZARC se UF foi fornecida
        if request.uf:
            from core.zarc_adapter import enriquecer_plano_com_zarc
            resultado_convertido = enriquecer_plano_com_zarc(
                resultado_convertido,
                uf=request.uf,
                municipio=request.municipio,
                safra=request.safra
            )
        else:
            resultado_convertido["zarc"] = {"ativo": False}
        
        # Enriquecer com preços agrícolas
        from core.price_adapter import aplicar_precos_no_plano
        resultado_convertido = aplicar_precos_no_plano(resultado_convertido, uf=request.uf)
        
        return resultado_convertido
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/validar")
def validar(request: ValidarRequest):
    """Valida AG com força bruta"""
    try:
        culturas, talhoes, regras = get_dados()
        
        # Valida objetivo
        objetivos_validos = ['equilibrado', 'lucro', 'risco', 'sustentavel']
        if request.objetivo not in objetivos_validos:
            raise HTTPException(status_code=400, detail=f"Objetivo inválido. Use: {objetivos_validos}")
        
        # Executa validação
        resultado = comparar_ag_com_forca_bruta(
            culturas, talhoes, regras,
            objetivo=request.objetivo,
            seed=request.seed
        )
        
        if resultado.get('erro'):
            raise HTTPException(status_code=400, detail=resultado.get('mensagem'))
        
        # Converte tipos numpy para Python nativos
        resultado_convertido = converter_tipos_python(resultado)
        
        return resultado_convertido
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rodadas")
def rodadas(request: RodadasRequest):
    """Executa múltiplas rodadas do AG"""
    try:
        culturas, talhoes, regras = get_dados()
        
        # Valida objetivo
        objetivos_validos = ['equilibrado', 'lucro', 'risco', 'sustentavel']
        if request.objetivo not in objetivos_validos:
            raise HTTPException(status_code=400, detail=f"Objetivo inválido. Use: {objetivos_validos}")
        
        # Executa rodadas
        resultado = executar_multiplas_rodadas(
            culturas, talhoes, regras,
            objetivo=request.objetivo,
            rodadas=request.rodadas
        )
        
        # Converte tipos numpy para Python nativos
        resultado_convertido = converter_tipos_python(resultado)
        
        return resultado_convertido
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/relatorio")
def relatorio(request: RelatorioRequest):
    """Gera relatório com contexto climático opcional"""
    try:
        culturas, talhoes, regras = get_dados()
        
        # Valida objetivo
        objetivos_validos = ['equilibrado', 'lucro', 'risco', 'sustentavel']
        if request.objetivo not in objetivos_validos:
            raise HTTPException(status_code=400, detail=f"Objetivo inválido. Use: {objetivos_validos}")
        
        # Valida formato
        formatos_validos = ['md', 'txt']
        if request.formato not in formatos_validos:
            raise HTTPException(status_code=400, detail=f"Formato inválido. Use: {formatos_validos}")
        
        # Obter contexto climático se coordenadas foram fornecidas
        contexto_climatico = None
        if request.lat is not None and request.lon is not None:
            from core.climate_adapter import obter_contexto_climatico_por_coordenadas
            contexto_climatico = obter_contexto_climatico_por_coordenadas(request.lat, request.lon, request.days)
        
        # Gera relatório com contexto climático e ZARC integrado
        caminho = gerar_relatorio_completo(
            culturas, talhoes, regras,
            objetivo=request.objetivo,
            formato=request.formato,
            contexto_climatico=contexto_climatico,
            uf=request.uf,
            municipio=request.municipio,
            safra=request.safra
        )
        
        # Lê conteúdo
        with open(caminho, 'r', encoding='utf-8') as f:
            conteudo = f.read()
        
        resultado = {
            "caminho": caminho,
            "conteudo": conteudo,
            "formato": request.formato
        }
        
        # Adicionar informações de clima real
        if contexto_climatico:
            resultado["clima_real"] = {
                "ativo": True,
                "source": contexto_climatico.get("fonte", "unknown"),
                "temperatura_media": contexto_climatico.get("temperatura_media"),
                "precipitacao_total": contexto_climatico.get("precipitacao_total"),
                "risco_climatico_estimado": contexto_climatico.get("risco_climatico_estimado"),
                "clima_observado": contexto_climatico.get("clima_observado"),
                "agua_observada": contexto_climatico.get("agua_observada"),
                "ajuste_risco": contexto_climatico.get("ajuste_risco", 0),
                "fallback": contexto_climatico.get("fallback", False),
                "error": contexto_climatico.get("error")
            }
        else:
            resultado["clima_real"] = {"ativo": False}
        
        return resultado
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/otimizar/lucro-mercado-experimental")
def otimizar_lucro_mercado_experimental(
    objetivo: str = Query("mercado", description="Objetivo (sempre 'mercado' para este modo)"),
    seed: int = Query(42, description="Seed para reprodutibilidade"),
    geracoes: int = Query(50, description="Número de gerações do AG"),
    populacao: int = Query(50, description="Tamanho da população"),
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    days: int = Query(30, description="Dias para análise climática"),
    uf: Optional[str] = Query(None, description="Unidade Federativa (ex: SP, PR)"),
    municipio: Optional[str] = Query(None, description="Município"),
    safra: str = Query("2025/2026", description="Safra ZARC")
):
    """
    Otimização EXPERIMENTAL usando lucro de mercado como fitness.
    
    ATENÇÃO: Este é um modo experimental que:
    - Usa lucro_mercado_estimado como fitness principal
    - Bloqueia uso automático se houver itens críticos
    - NÃO substitui a recomendação principal do sistema
    - Requer validação manual antes de usar
    
    Retorna:
    - modo: "otimizacao_mercado_experimental"
    - experimental: true
    - plano: Plano otimizado por lucro de mercado
    - bloqueado: true/false
    - motivo_bloqueio: Razão do bloqueio (se aplicável)
    - aviso: Texto de aviso sobre natureza experimental
    """
    try:
        from core.market_profit_optimizer import gerar_plano_genetico_lucro_mercado_experimental
        
        culturas, talhoes, regras = get_dados()
        
        resultado = gerar_plano_genetico_lucro_mercado_experimental(
            culturas=culturas,
            talhoes=talhoes,
            regras=regras,
            uf=uf,
            municipio=municipio,
            safra=safra,
            objetivo="mercado",  # Força objetivo mercado
            seed=seed,
            geracoes=geracoes,
            populacao=populacao
        )
        
        return converter_tipos_python(resultado)
        
    except Exception as e:
        import traceback
        if DEBUG_ERRORS:
            raise HTTPException(
                status_code=500,
                detail={
                    "error": str(e),
                    "traceback": traceback.format_exc()
                }
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Erro ao gerar otimização experimental de lucro de mercado."
            )

@app.post("/planejamento/calendario")
def gerar_calendario(request: dict):
    """
    Gera calendário agrícola para uma cultura.
    
    Fase 10.1: Base local para soja, milho e feijão
    Fase futura: Integração com clima real e replanejamento
    """
    try:
        from core.crop_calendar_engine import gerar_calendario_cultura
        from core.planning_models import Field, SoilType, Slope, WaterAvailability
        from datetime import datetime
        
        # Validar campos obrigatórios
        if "cultura" not in request:
            raise HTTPException(status_code=400, detail="Campo 'cultura' é obrigatório")
        if "planting_date" not in request:
            raise HTTPException(status_code=400, detail="Campo 'planting_date' é obrigatório")
        if "field" not in request:
            raise HTTPException(status_code=400, detail="Campo 'field' é obrigatório")
        
        # Parsear data de plantio
        try:
            planting_date = datetime.fromisoformat(request["planting_date"]).date()
        except Exception:
            raise HTTPException(status_code=400, detail="Formato de data inválido. Use ISO 8601 (YYYY-MM-DD)")
        
        # Criar objeto Field
        field_data = request["field"]
        field = Field(
            id=field_data.get("id", str(uuid.uuid4())),
            property_id=field_data.get("property_id", "temp"),
            name=field_data.get("name", "Talhão Temporário"),
            area_ha=float(field_data.get("area_ha", 10)),
            soil_type=SoilType(field_data.get("soil_type", "argiloso")),
            slope=Slope(field_data.get("slope", "plano")),
            water_availability=WaterAvailability(field_data.get("water_availability", "media"))
        )
        
        # Gerar calendário
        resultado = gerar_calendario_cultura(
            cultura=request["cultura"],
            planting_date=planting_date,
            field=field,
            crop_plan_id=request.get("crop_plan_id"),
            weather_context=request.get("weather_context"),
            zarc_context=request.get("zarc_context")
        )
        
        # Enriquecer com clima se solicitado
        usar_clima = request.get("usar_clima", False)
        if usar_clima:
            from core.calendar_weather_adapter import enriquecer_calendario_com_clima
            lat = field_data.get("lat")
            lon = field_data.get("lon")
            resultado = enriquecer_calendario_com_clima(resultado, lat=lat, lon=lon)
        else:
            resultado["weather_enabled"] = False
        
        return converter_tipos_python(resultado)
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        if DEBUG_ERRORS:
            raise HTTPException(
                status_code=500,
                detail={
                    "error": str(e),
                    "traceback": traceback.format_exc()
                }
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Erro ao gerar calendário agrícola."
            )

@app.get("/planejamento/culturas")
def listar_culturas():
    """Lista culturas disponíveis no sistema de planejamento"""
    try:
        from core.crop_calendar_engine import get_culturas_disponiveis, get_cultura_info
        
        culturas = get_culturas_disponiveis()
        
        return {
            "total": len(culturas),
            "culturas": culturas,
            "detalhes": {
                cultura: get_cultura_info(cultura)
                for cultura in culturas
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/planejamento/culturas/{cultura}")
def obter_cultura_info(cultura: str):
    """Obtém informações detalhadas de uma cultura"""
    try:
        from core.crop_calendar_engine import get_cultura_info
        
        info = get_cultura_info(cultura)
        
        if not info:
            raise HTTPException(
                status_code=404,
                detail=f"Cultura '{cultura}' não encontrada"
            )
        
        return info
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoints de Talhões Manuais

@app.get("/planejamento/talhoes")
def listar_talhoes():
    """Lista todos os talhões cadastrados pelo usuário"""
    try:
        from core.field_storage import listar_talhoes_usuario
        
        fields = listar_talhoes_usuario()
        
        return {
            "total": len(fields),
            "talhoes": fields
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/planejamento/talhoes")
def criar_talhao(field_data: dict):
    """Cria um novo talhão"""
    try:
        from core.field_storage import criar_talhao_usuario
        from core.planning_models import ManualFieldCreate
        
        # Validar dados
        validated = ManualFieldCreate(**field_data)
        
        # Criar talhão
        new_field = criar_talhao_usuario(validated.model_dump())
        
        return new_field
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/planejamento/talhoes/{field_id}")
def obter_talhao(field_id: str):
    """Obtém um talhão pelo ID"""
    try:
        from core.field_storage import obter_talhao_usuario
        
        field = obter_talhao_usuario(field_id)
        
        if not field:
            raise HTTPException(
                status_code=404,
                detail=f"Talhão '{field_id}' não encontrado"
            )
        
        return field
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/planejamento/talhoes/{field_id}")
def atualizar_talhao(field_id: str, field_data: dict):
    """Atualiza um talhão existente"""
    try:
        from core.field_storage import atualizar_talhao_usuario
        from core.planning_models import ManualFieldUpdate
        
        # Validar dados
        validated = ManualFieldUpdate(**field_data)
        
        # Atualizar apenas campos fornecidos
        update_data = {k: v for k, v in validated.model_dump().items() if v is not None}
        
        # Atualizar talhão
        updated_field = atualizar_talhao_usuario(field_id, update_data)
        
        if not updated_field:
            raise HTTPException(
                status_code=404,
                detail=f"Talhão '{field_id}' não encontrado"
            )
        
        return updated_field
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/planejamento/talhoes/{field_id}")
def remover_talhao(field_id: str):
    """Remove um talhão"""
    try:
        from core.field_storage import remover_talhao_usuario
        
        removed = remover_talhao_usuario(field_id)
        
        if not removed:
            raise HTTPException(
                status_code=404,
                detail=f"Talhão '{field_id}' não encontrado"
            )
        
        return {
            "message": "Talhão removido com sucesso",
            "id": field_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/planejamento/talhoes/{field_id}/calendario")
def gerar_calendario_talhao(field_id: str, request: dict):
    """Gera calendário agrícola para um talhão cadastrado"""
    try:
        from core.field_storage import obter_talhao_usuario
        from core.crop_calendar_engine import gerar_calendario_cultura
        from core.calendar_weather_adapter import enriquecer_calendario_com_clima
        from core.planning_models import Field, SoilType, Slope, WaterAvailability, GenerateCalendarRequest
        from datetime import datetime
        
        # Validar request
        validated = GenerateCalendarRequest(**request)
        
        # Buscar talhão
        field_data = obter_talhao_usuario(field_id)
        
        if not field_data:
            raise HTTPException(
                status_code=404,
                detail=f"Talhão '{field_id}' não encontrado"
            )
        
        # Parsear data de plantio
        try:
            planting_date = datetime.fromisoformat(validated.planting_date).date()
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="Formato de data inválido. Use ISO 8601 (YYYY-MM-DD)"
            )
        
        # Criar objeto Field
        field = Field(
            id=field_data["id"],
            property_id="user",
            name=field_data["name"],
            area_ha=field_data["area_ha"],
            soil_type=SoilType(field_data["soil_type"]),
            slope=Slope(field_data["slope"]),
            water_availability=WaterAvailability(field_data["water_availability"])
        )
        
        # Gerar calendário
        resultado = gerar_calendario_cultura(
            cultura=validated.cultura,
            planting_date=planting_date,
            field=field,
            crop_plan_id=None
        )
        
        # Enriquecer com clima se solicitado
        usar_clima = request.get("usar_clima", False)
        if usar_clima:
            lat = field_data.get("lat")
            lon = field_data.get("lon")
            resultado = enriquecer_calendario_com_clima(resultado, lat=lat, lon=lon)
        else:
            resultado["weather_enabled"] = False
        
        # Adicionar dados do talhão na resposta
        resultado["field_data"] = field_data
        
        return converter_tipos_python(resultado)
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        if DEBUG_ERRORS:
            raise HTTPException(
                status_code=500,
                detail={
                    "error": str(e),
                    "traceback": traceback.format_exc()
                }
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Erro ao gerar calendário para o talhão."
            )

@app.post("/planejamento/replanejar")
async def replanejar_calendario_endpoint(body: dict):
    """
    Recebe um imprevisto e retorna sugestões de ajuste no calendário.
    
    Payload:
    {
        "calendar": {...},  // Calendário agrícola atual
        "event": {
            "event_type": "missed_irrigation",
            "date": "2026-05-15",
            "description": "Não consegui irrigar nesse dia"
        }
    }
    
    Retorna sugestões de ajuste com motivo, nível de risco e se exige validação manual.
    Nenhuma sugestão é aplicada automaticamente.
    """
    try:
        from core.planning_models import ReplanningEvent, ReplanningRequest
        from core.replanning_engine import replanejar_calendario

        # Validar payload
        calendar = body.get("calendar")
        event_data = body.get("event")

        if not calendar:
            raise HTTPException(status_code=400, detail="Campo 'calendar' é obrigatório.")
        if not event_data:
            raise HTTPException(status_code=400, detail="Campo 'event' é obrigatório.")

        # Construir e validar o evento
        try:
            event = ReplanningEvent(**event_data)
        except Exception as ve:
            raise HTTPException(status_code=422, detail=f"Dados do evento inválidos: {str(ve)}")

        # Executar motor de replanejamento
        resultado = replanejar_calendario(calendar=calendar, event=event)

        return converter_tipos_python(resultado)

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        if DEBUG_ERRORS:
            raise HTTPException(
                status_code=500,
                detail={
                    "error": str(e),
                    "traceback": traceback.format_exc()
                }
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Erro ao processar replanejamento."
            )


@app.post("/planejamento/replanejar/aplicar")
async def aplicar_replanejamento_endpoint(body: dict):
    """
    Aplica uma sugestão de replanejamento em modo de simulação,
    retornando o calendário atualizado e mantendo o original.
    """
    try:
        from core.planning_models import ApplyReplanningRequest
        from core.replanning_engine import aplicar_sugestao_replanejamento

        # Pydantic cuidará da validação
        req = ApplyReplanningRequest(**body)

        resultado = aplicar_sugestao_replanejamento(
            calendar=req.calendar,
            suggestion=req.suggestion,
            event=req.event
        )

        return converter_tipos_python(resultado)

    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Payload inválido: {str(e)}")
    except Exception as e:
        import traceback
        if DEBUG_ERRORS:
            raise HTTPException(
                status_code=500,
                detail={
                    "error": str(e),
                    "traceback": traceback.format_exc()
                }
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Erro ao aplicar sugestão de replanejamento."
            )


@app.post("/cache/limpar")
def limpar_cache(request: Request):
    """Limpa o cache de resultados pesados (protegido por token)"""
    # Verifica token de administração
    cache_admin_token = os.getenv("CACHE_ADMIN_TOKEN")
    
    if cache_admin_token:
        # Se token está configurado, verifica header
        provided_token = request.headers.get("X-Cache-Token")
        if not provided_token or provided_token != cache_admin_token:
            raise HTTPException(
                status_code=403, 
                detail="Token de administração inválido ou ausente. Use header X-Cache-Token."
            )
    
    # Limpa cache de resultados
    global _resultados_cache
    items_removidos = len(_resultados_cache)
    _resultados_cache.clear()
    
    # Limpa cache de provedores (weather, etc)
    provider_items_removidos = 0
    try:
        from providers.cache import clear_provider_cache
        provider_items_removidos = clear_provider_cache()
    except Exception:
        pass
    
    # Limpa cache do índice ZARC em memória
    zarc_cache_cleared = False
    try:
        from providers import zarc_provider
        if hasattr(zarc_provider, '_zarc_index_cache'):
            zarc_provider._zarc_index_cache.clear()
            zarc_cache_cleared = True
    except Exception:
        pass
    
    # Limpa cache de preços em memória
    price_cache_cleared = False
    try:
        from providers.price_provider import clear_price_cache
        clear_price_cache()
        price_cache_cleared = True
    except Exception:
        pass
    
    return {
        "status": "ok",
        "message": f"Cache limpo completamente.",
        "details": {
            "resultados_cache": items_removidos,
            "provider_cache": provider_items_removidos,
            "zarc_index_cache": "cleared" if zarc_cache_cleared else "not_found",
            "price_cache": "cleared" if price_cache_cleared else "not_found"
        },
        "protected": bool(cache_admin_token)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
