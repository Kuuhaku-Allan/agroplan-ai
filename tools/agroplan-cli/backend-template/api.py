"""
FastAPI Backend para AgroPlan AI
"""

from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sys
import os

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

class ValidarRequest(BaseModel):
    objetivo: str = "equilibrado"
    seed: Optional[int] = 42

class RelatorioRequest(BaseModel):
    objetivo: str = "equilibrado"
    formato: str = "md"
    lat: Optional[float] = None
    lon: Optional[float] = None
    days: Optional[int] = 30

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
        
        return {
            "status": "healthy",
            "culturas": len(culturas),
            "talhoes": len(talhoes),
            "regras": len(regras),
            "cache_items": len(_resultados_cache),
            "data_mode": DATA_MODE,
            "providers": {
                "weather": "available" if WEATHER_PROVIDER else "disabled"
            },
            "provider_cache": provider_cache_stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

@app.get("/dashboard")
def get_dashboard(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    days: int = Query(30, description="Número de dias para análise climática")
):
    """Retorna resumo do dashboard com contexto climático opcional"""
    try:
        culturas, talhoes, regras = get_dados()
        
        # Obter contexto climático se coordenadas foram fornecidas
        contexto_climatico = None
        if lat is not None and lon is not None:
            from core.climate_adapter import obter_contexto_climatico_por_coordenadas
            contexto_climatico = obter_contexto_climatico_por_coordenadas(lat, lon, days)
        
        # Gerar chave de cache considerando clima
        cache_params = {"objetivo": "equilibrado", "seed": 42}
        if lat is not None and lon is not None:
            cache_params.update({"lat": lat, "lon": lon, "days": days})
        
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
def get_recomendacoes():
    """Retorna recomendações de culturas por talhão"""
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
        
        return {
            "recomendacoes": recomendacoes
        }
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
            
            for key, cenario in cenarios.items():
                cenarios_formatados[key] = {
                    'nome': str(cenario['nome']),
                    'descricao': str(cenario['descricao']),
                    'lucro_total': float(cenario['lucro_total']),
                    'risco_medio': float(cenario['risco_medio']),
                    'area_total': float(cenario['area_total']),
                    'plano': [
                        {
                            "talhao": int(p['talhao']),
                            "area": float(p['area']),
                            "solo": str(talhoes_dict[int(p['talhao'])]['solo']),
                            "clima": str(talhoes_dict[int(p['talhao'])]['clima']),
                            "relevo": str(talhoes_dict[int(p['talhao'])]['relevo']),
                            "agua": str(talhoes_dict[int(p['talhao'])]['agua']),
                            "cultura": str(p['cultura']),
                            "lucro_estimado": float(p['lucro_estimado']),
                            "risco": float(p['risco']),
                            "nota": float(p['nota']),
                            "tempo": 0  # Não disponível nos cenários simples
                        }
                        for p in cenario['plano']
                    ]
                }
            
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
        
        # Gera relatório (por enquanto sem integração climática no gerador)
        # TODO: Atualizar report_generator para aceitar contexto climático
        caminho = gerar_relatorio_completo(
            culturas, talhoes, regras,
            objetivo=request.objetivo,
            formato=request.formato
        )
        
        # Lê conteúdo
        with open(caminho, 'r', encoding='utf-8') as f:
            conteudo = f.read()
        
        # Adiciona informações climáticas ao final se disponível
        if contexto_climatico and not contexto_climatico.get("fallback", True):
            clima_info = f"""

## Dados Climáticos Reais

**Fonte:** {contexto_climatico.get('fonte', 'N/A')}
**Temperatura Média:** {contexto_climatico.get('temperatura_media', 'N/A')}°C
**Precipitação Total:** {contexto_climatico.get('precipitacao_total', 'N/A')}mm
**Risco Climático:** {contexto_climatico.get('risco_climatico_estimado', 'N/A')}
**Clima Observado:** {contexto_climatico.get('clima_observado', 'N/A')}
**Água Observada:** {contexto_climatico.get('agua_observada', 'N/A')}
**Ajuste de Risco:** {contexto_climatico.get('ajuste_risco', 0):+.1%}

*Dados climáticos integrados ao planejamento para maior precisão.*
"""
            conteudo += clima_info
        
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
    
    # Limpa cache
    global _resultados_cache
    items_removidos = len(_resultados_cache)
    _resultados_cache.clear()
    
    return {
        "status": "ok",
        "message": f"Cache limpo. {items_removidos} itens removidos.",
        "protected": bool(cache_admin_token)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
