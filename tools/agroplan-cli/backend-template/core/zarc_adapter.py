"""
Adaptador ZARC - Integra dados do ZARC no planejamento
"""
from typing import Dict, Any, Optional, List
from providers.zarc_provider import buscar_zarc

def enriquecer_plano_com_zarc(
    resultado: Dict[str, Any],
    uf: Optional[str] = None,
    municipio: Optional[str] = None,
    safra: str = "2025/2026"
) -> Dict[str, Any]:
    """
    Enriquece resultado do planejamento com dados ZARC
    
    Args:
        resultado: Resultado do planejamento (AG ou cenário)
        uf: Unidade Federativa
        municipio: Nome do município
        safra: Safra (padrão: 2025/2026)
    
    Returns:
        Resultado enriquecido com dados ZARC
    """
    # Se não tiver UF, não adiciona ZARC
    if not uf:
        resultado["zarc"] = {"ativo": False}
        return resultado
    
    # Cache local por requisição para evitar lookups repetidos
    lookup_cache = {}
    
    # Processar cada item do plano
    culturas_com_zarc = 0
    total_culturas = 0
    sources = set()
    tem_fallback = False
    
    for item in resultado.get("plano", []):
        total_culturas += 1
        cultura = item.get("cultura")
        solo = item.get("solo")
        
        # Chave de cache: cultura|uf|municipio|solo|safra
        cache_key = f"{cultura}|{uf}|{municipio}|{solo}|{safra}"
        
        # Verificar cache local
        if cache_key in lookup_cache:
            zarc_data = lookup_cache[cache_key]
        else:
            # Buscar ZARC para esta cultura/solo
            zarc_data = buscar_zarc(
                cultura=cultura,
                uf=uf,
                municipio=municipio,
                solo=solo,
                safra=safra
            )
            # Cachear resultado
            lookup_cache[cache_key] = zarc_data
        
        if zarc_data and zarc_data.get("encontrado"):
            # ZARC encontrado
            item["zarc"] = {
                "ativo": True,
                "source": zarc_data.get("source"),
                "fallback": zarc_data.get("fallback", False),
                "janela_plantio": zarc_data.get("janela_plantio"),
                "risco": zarc_data.get("risco"),
                "safra": zarc_data.get("safra"),
                "observacao": zarc_data.get("observacao"),
                "decendios_recomendados": zarc_data.get("decendios_recomendados"),
                "municipio_zarc": zarc_data.get("municipio"),
                "geocodigo": zarc_data.get("geocodigo")
            }
            culturas_com_zarc += 1
            sources.add(zarc_data.get("source"))
            if zarc_data.get("fallback"):
                tem_fallback = True
        else:
            # ZARC não encontrado
            item["zarc"] = {
                "ativo": False,
                "message": zarc_data.get("message") if zarc_data else "ZARC não consultado"
            }
    
    # Determinar source geral
    if len(sources) == 0:
        source_geral = "unavailable"
    elif len(sources) == 1:
        source_geral = list(sources)[0]
    else:
        source_geral = "mixed"
    
    # Adicionar resumo ZARC no resultado
    resultado["zarc"] = {
        "ativo": True,
        "uf": uf,
        "municipio": municipio,
        "safra": safra,
        "source": source_geral,
        "fallback": tem_fallback,
        "culturas_com_zarc": culturas_com_zarc,
        "total_culturas": total_culturas
    }
    
    return resultado

def aplicar_ajuste_zarc(
    risco_base: float,
    risco_zarc: str,
    aplicar: bool = False
) -> Dict[str, Any]:
    """
    Calcula ajuste de risco baseado no ZARC
    
    Args:
        risco_base: Risco base em pontos percentuais
        risco_zarc: Risco ZARC (baixo, medio, alto, indeterminado)
        aplicar: Se deve aplicar o ajuste (padrão: False)
    
    Returns:
        Dicionário com risco ajustado e informações do ajuste
    """
    # Mapeamento de ajustes ZARC (conservadores)
    ajustes = {
        "baixo": -2,      # Reduz 2 pontos percentuais
        "medio": +4,      # Aumenta 4 pontos percentuais
        "alto": +10,      # Aumenta 10 pontos percentuais
        "indeterminado": 0
    }
    
    ajuste = ajustes.get(risco_zarc, 0)
    
    if aplicar and ajuste != 0:
        risco_ajustado = min(95, max(5, risco_base + ajuste))
    else:
        risco_ajustado = risco_base
    
    return {
        "risco_original": risco_base,
        "risco_ajustado": risco_ajustado,
        "ajuste_zarc": ajuste,
        "ajuste_aplicado": aplicar,
        "risco_zarc": risco_zarc
    }

def gerar_secao_zarc_relatorio(
    plano: List[Dict[str, Any]],
    uf: Optional[str] = None,
    municipio: Optional[str] = None,
    safra: str = "2025/2026",
    formato: str = "md"
) -> str:
    """
    Gera seção ZARC para relatório
    
    Args:
        plano: Lista de itens do plano
        uf: Unidade Federativa
        municipio: Nome do município
        safra: Safra
        formato: Formato do relatório (md ou txt)
    
    Returns:
        Texto da seção ZARC
    """
    if not uf:
        return ""
    
    if formato == "md":
        secao = "\n## 🌾 Zoneamento Agrícola de Risco Climático (ZARC)\n\n"
        secao += f"**Região:** {municipio or 'Não especificado'}/{uf}\n"
        secao += f"**Safra:** {safra}\n\n"
        
        # Contar culturas com ZARC
        com_zarc = sum(1 for item in plano if item.get("zarc", {}).get("ativo"))
        total = len(plano)
        
        secao += f"**Cobertura:** {com_zarc}/{total} culturas com recomendação ZARC\n\n"
        
        # Tabela por talhão
        secao += "| Talhão | Cultura | Solo | Janela de Plantio | Risco ZARC | Fonte |\n"
        secao += "|--------|---------|------|-------------------|------------|-------|\n"
        
        for item in plano:
            talhao = item.get("talhao")
            cultura = item.get("cultura")
            solo = item.get("solo")
            zarc = item.get("zarc", {})
            
            if zarc.get("ativo"):
                janela = zarc.get("janela_plantio", {})
                inicio = janela.get("inicio", "N/A")
                fim = janela.get("fim", "N/A")
                risco = zarc.get("risco", "N/A")
                source = zarc.get("source", "N/A")
                
                # Emoji por fonte
                if source == "zarc-oficial":
                    fonte_emoji = "✅ Oficial"
                elif source == "zarc-cache":
                    fonte_emoji = "💾 Cache"
                elif source == "zarc-fallback":
                    fonte_emoji = "⚠️ Fallback"
                else:
                    fonte_emoji = source
                
                secao += f"| {talhao} | {cultura} | {solo} | {inicio} a {fim} | {risco} | {fonte_emoji} |\n"
            else:
                message = zarc.get("message", "Não encontrado")
                secao += f"| {talhao} | {cultura} | {solo} | - | - | ⚠️ {message} |\n"
        
        secao += "\n"
        
        # Observações
        secao += "### Observações ZARC\n\n"
        
        observacoes_unicas = set()
        for item in plano:
            zarc = item.get("zarc", {})
            if zarc.get("ativo") and zarc.get("observacao"):
                observacoes_unicas.add(zarc.get("observacao"))
        
        if observacoes_unicas:
            for obs in observacoes_unicas:
                secao += f"- {obs}\n"
        else:
            secao += "- Nenhuma recomendação ZARC encontrada para os parâmetros informados.\n"
        
        secao += "\n"
        
    else:  # txt
        secao = "\n" + "="*80 + "\n"
        secao += "ZONEAMENTO AGRÍCOLA DE RISCO CLIMÁTICO (ZARC)\n"
        secao += "="*80 + "\n\n"
        secao += f"Região: {municipio or 'Não especificado'}/{uf}\n"
        secao += f"Safra: {safra}\n\n"
        
        # Contar culturas com ZARC
        com_zarc = sum(1 for item in plano if item.get("zarc", {}).get("ativo"))
        total = len(plano)
        
        secao += f"Cobertura: {com_zarc}/{total} culturas com recomendação ZARC\n\n"
        
        # Lista por talhão
        for item in plano:
            talhao = item.get("talhao")
            cultura = item.get("cultura")
            solo = item.get("solo")
            zarc = item.get("zarc", {})
            
            secao += f"Talhão {talhao} - {cultura} ({solo})\n"
            
            if zarc.get("ativo"):
                janela = zarc.get("janela_plantio", {})
                inicio = janela.get("inicio", "N/A")
                fim = janela.get("fim", "N/A")
                risco = zarc.get("risco", "N/A")
                source = zarc.get("source", "N/A")
                
                secao += f"  Janela de Plantio: {inicio} a {fim}\n"
                secao += f"  Risco ZARC: {risco}\n"
                secao += f"  Fonte: {source}\n"
            else:
                message = zarc.get("message", "Não encontrado")
                secao += f"  Status: {message}\n"
            
            secao += "\n"
        
        # Observações
        secao += "-"*80 + "\n"
        secao += "OBSERVAÇÕES ZARC\n"
        secao += "-"*80 + "\n\n"
        
        observacoes_unicas = set()
        for item in plano:
            zarc = item.get("zarc", {})
            if zarc.get("ativo") and zarc.get("observacao"):
                observacoes_unicas.add(zarc.get("observacao"))
        
        if observacoes_unicas:
            for obs in observacoes_unicas:
                secao += f"- {obs}\n"
        else:
            secao += "- Nenhuma recomendação ZARC encontrada para os parâmetros informados.\n"
        
        secao += "\n"
    
    return secao
