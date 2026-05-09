"""
Adaptador de Preços Agrícolas
Integra preços reais no planejamento com normalização de unidades e validação
"""

import os
import pandas as pd
from typing import Dict, List, Optional
from providers.price_provider import buscar_preco, buscar_precos_lote
from core.price_normalizer import (
    normalizar_preco_para_tonelada,
    calcular_lucro_com_preco_normalizado,
    obter_estatisticas_normalizacao
)
from core.market_profit_validator import validar_plano_lucro_mercado

# Configuração
PRICE_APPLY_TO_PROFIT = os.getenv("PRICE_APPLY_TO_PROFIT", "false").lower() == "true"

# Cache de dados de culturas
_culturas_cache = None

def _carregar_culturas():
    """Carrega dados de culturas do CSV (com cache)"""
    global _culturas_cache
    if _culturas_cache is None:
        _culturas_cache = pd.read_csv("data/culturas.csv")
    return _culturas_cache


def aplicar_precos_no_plano(
    resultado: Dict, 
    uf: Optional[str] = None,
    aplicar_no_lucro: bool = None
) -> Dict:
    """
    Aplica informações de preços no plano com normalização de unidades
    
    Args:
        resultado: Resultado do AG ou cenário
        uf: Unidade Federativa (opcional)
        aplicar_no_lucro: Se True, recalcula lucro com preços. Se None, usa PRICE_APPLY_TO_PROFIT
    
    Returns:
        Resultado enriquecido com informações de preços e normalização
    """
    if "plano" not in resultado:
        return resultado
    
    # Determinar se deve aplicar no lucro
    if aplicar_no_lucro is None:
        aplicar_no_lucro = PRICE_APPLY_TO_PROFIT
    
    # Coletar culturas únicas
    culturas = list(set([item.get("cultura") for item in resultado["plano"]]))
    
    # Buscar preços em lote
    precos_data = buscar_precos_lote(culturas, uf)
    
    # Criar mapa de preços por cultura
    precos_map = {p["cultura"]: p for p in precos_data}
    
    # Estatísticas
    culturas_com_preco = 0
    culturas_fallback = 0
    culturas_sem_preco = 0
    culturas_normalizadas = 0
    
    # Aplicar preços no plano
    for item in resultado["plano"]:
        cultura = item.get("cultura")
        preco_info = precos_map.get(cultura, {})
        
        # Adicionar informações de preço
        item["preco_real"] = preco_info
        
        # Normalizar preço se disponível
        if preco_info.get("ativo") and preco_info.get("preco") and preco_info.get("unidade"):
            normalizacao = normalizar_preco_para_tonelada(
                preco_info["preco"],
                preco_info["unidade"]
            )
            
            item["preco_normalizado"] = normalizacao
            
            if normalizacao.get("normalizado"):
                culturas_normalizadas += 1
                
                # Buscar produtividade e custo da cultura
                culturas_df = _carregar_culturas()
                cultura_data = culturas_df[culturas_df['nome'] == cultura]
                
                if not cultura_data.empty:
                    produtividade = float(cultura_data.iloc[0]['produtividade'])  # toneladas/ha
                    custo = float(cultura_data.iloc[0]['custo'])  # R$/ha
                    area = item.get("area", 0)  # ha
                    
                    # Adicionar campos ao item se não existirem
                    if "produtividade" not in item:
                        item["produtividade"] = produtividade
                    if "custo" not in item:
                        item["custo"] = custo
                    
                    # Calcular lucro de mercado estimado (sempre, independente de aplicar_no_lucro)
                    if produtividade > 0 and area > 0:
                        calculo_mercado = calcular_lucro_com_preco_normalizado(
                            preco_por_tonelada=normalizacao["preco_por_tonelada"],
                            produtividade=produtividade,
                            custo_por_hectare=custo,
                            area=area
                        )
                        
                        item["lucro_mercado_estimado"] = calculo_mercado["lucro_mercado"]
                        item["lucro_mercado_detalhes"] = calculo_mercado
                        
                        # Se aplicar_no_lucro, substituir lucro_estimado
                        if aplicar_no_lucro:
                            item["lucro_original"] = item.get("lucro_estimado", 0)
                            item["lucro_estimado"] = calculo_mercado["lucro_mercado"]
                            item["lucro_mercado_aplicado"] = True
                        else:
                            item["lucro_mercado_aplicado"] = False
                    else:
                        item["lucro_mercado_estimado"] = None
                        item["lucro_mercado_aplicado"] = False
                else:
                    item["lucro_mercado_estimado"] = None
                    item["lucro_mercado_aplicado"] = False
            else:
                item["lucro_mercado_estimado"] = None
                item["lucro_mercado_aplicado"] = False
        else:
            item["preco_normalizado"] = {"normalizado": False}
            item["lucro_mercado_estimado"] = None
            item["lucro_mercado_aplicado"] = False
        
        # Contabilizar estatísticas
        if preco_info.get("ativo"):
            if preco_info.get("fallback"):
                culturas_fallback += 1
            else:
                culturas_com_preco += 1
        else:
            culturas_sem_preco += 1
    
    # Recalcular lucro_total se aplicar_no_lucro
    if aplicar_no_lucro:
        resultado["lucro_total_original"] = resultado.get("lucro_total", 0)
        resultado["lucro_total"] = sum(
            item.get("lucro_estimado", 0) for item in resultado["plano"]
        )
    
    # Adicionar resumo de preços ao resultado
    resultado["precos"] = {
        "ativo": True,
        "source": "price-local-index" if culturas_com_preco > 0 else "price-fallback",
        "fallback_count": culturas_fallback,
        "culturas_com_preco": culturas_com_preco,
        "culturas_sem_preco": culturas_sem_preco,
        "total_culturas": len(culturas),
        "aplicado_no_lucro": aplicar_no_lucro,
        "lucro_recalculado_disponivel": any(
            item.get("lucro_mercado_estimado") is not None 
            for item in resultado["plano"]
        ),
        "uf": uf,
        "normalizacao": {
            "ativa": True,
            "unidade_base": "tonelada",
            "culturas_normalizadas": culturas_normalizadas,
            "culturas_nao_normalizadas": len(culturas) - culturas_normalizadas
        }
    }
    
    # Validar lucro de mercado e adicionar classificação de confiabilidade
    resultado = validar_plano_lucro_mercado(resultado)
    
    return resultado


def gerar_secao_precos_relatorio(plano: List[Dict], uf: Optional[str], formato: str = "md") -> str:
    """
    Gera seção de preços para o relatório com informações de normalização
    
    Args:
        plano: Lista de itens do plano com informações de preços
        uf: Unidade Federativa
        formato: 'md' ou 'txt'
    
    Returns:
        String com seção formatada
    """
    if formato == "md":
        secao = "## 💰 Preços Agrícolas Utilizados\n\n"
        
        if uf:
            secao += f"**Região:** {uf}\n\n"
        
        secao += "### Preços por Cultura\n\n"
        secao += "| Cultura | Preço Original | Unidade | Preço/Tonelada | Normalizado | Fonte |\n"
        secao += "|---------|----------------|---------|----------------|-------------|-------|\n"
        
        # Coletar culturas únicas
        culturas_vistas = set()
        
        for item in plano:
            cultura = item.get("cultura", "").upper()
            
            if cultura in culturas_vistas:
                continue
            
            culturas_vistas.add(cultura)
            
            preco_info = item.get("preco_real", {})
            preco_norm = item.get("preco_normalizado", {})
            
            if preco_info.get("ativo"):
                preco = preco_info.get("preco")
                unidade = preco_info.get("unidade", "N/A")
                fonte = preco_info.get("source", "N/A")
                fallback_icon = "⚠️ " if preco_info.get("fallback") else ""
                
                preco_fmt = f"R$ {preco:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") if preco else "N/A"
                
                # Informações de normalização
                if preco_norm.get("normalizado"):
                    preco_ton = preco_norm.get("preco_por_tonelada", 0)
                    preco_ton_fmt = f"R$ {preco_ton:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                    norm_status = "✅ Sim"
                else:
                    preco_ton_fmt = "N/A"
                    norm_status = "❌ Não"
                
                secao += f"| {cultura} | {preco_fmt} | {unidade} | {preco_ton_fmt} | {norm_status} | {fallback_icon}{fonte} |\n"
            else:
                secao += f"| {cultura} | N/A | N/A | N/A | ❌ Não | price-unavailable |\n"
        
        secao += "\n"
        
        # Adicionar informações de lucro de mercado se disponível
        tem_lucro_mercado = any(item.get("lucro_mercado_estimado") is not None for item in plano)
        
        if tem_lucro_mercado:
            secao += "### Comparação de Lucro\n\n"
            secao += "| Talhão | Cultura | Lucro Sistema | Lucro Mercado | Diferença |\n"
            secao += "|--------|---------|---------------|---------------|----------|\n"
            
            for item in plano:
                if item.get("lucro_mercado_estimado") is not None:
                    talhao = item.get("talhao", "N/A")
                    cultura = item.get("cultura", "").upper()
                    lucro_sistema = item.get("lucro_original", item.get("lucro_estimado", 0))
                    lucro_mercado = item.get("lucro_mercado_estimado", 0)
                    diferenca = lucro_mercado - lucro_sistema
                    
                    lucro_sistema_fmt = f"R$ {lucro_sistema:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                    lucro_mercado_fmt = f"R$ {lucro_mercado:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                    diferenca_fmt = f"R$ {diferenca:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                    diferenca_icon = "📈" if diferenca > 0 else "📉" if diferenca < 0 else "➡️"
                    
                    secao += f"| {talhao} | {cultura} | {lucro_sistema_fmt} | {lucro_mercado_fmt} | {diferenca_icon} {diferenca_fmt} |\n"
            
            secao += "\n"
        
        secao += "### Observações\n\n"
        
        if PRICE_APPLY_TO_PROFIT:
            secao += "✅ **Os preços de mercado normalizados foram aplicados ao cálculo de lucro.**\n\n"
        else:
            secao += "ℹ️ **Os preços foram normalizados para R$/tonelada. Nesta versão, o lucro principal ainda usa a base interna do sistema, mas o lucro de mercado estimado é exibido para comparação.**\n\n"
        
        secao += "**Normalização de Unidades:**\n"
        secao += "- Todos os preços foram convertidos para R$/tonelada para permitir comparação consistente\n"
        secao += "- Fatores de conversão: saca_60kg (×16.67), saca_50kg (×20), arroba_15kg (×66.67)\n\n"
        
        secao += "**Fontes:**\n"
        secao += "- `price-local-index`: Índice local de preços\n"
        secao += "- `price-fallback`: Preço de referência (fallback)\n"
        secao += "- `price-unavailable`: Preço não disponível\n"
        
    else:  # txt
        secao = "PREÇOS AGRÍCOLAS UTILIZADOS\n\n"
        
        if uf:
            secao += f"Região: {uf}\n\n"
        
        secao += "Preços por Cultura:\n\n"
        
        # Coletar culturas únicas
        culturas_vistas = set()
        
        for item in plano:
            cultura = item.get("cultura", "").upper()
            
            if cultura in culturas_vistas:
                continue
            
            culturas_vistas.add(cultura)
            
            preco_info = item.get("preco_real", {})
            preco_norm = item.get("preco_normalizado", {})
            
            if preco_info.get("ativo"):
                preco = preco_info.get("preco")
                unidade = preco_info.get("unidade", "N/A")
                fonte = preco_info.get("source", "N/A")
                fallback_text = " (fallback)" if preco_info.get("fallback") else ""
                
                preco_fmt = f"R$ {preco:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") if preco else "N/A"
                
                secao += f"  {cultura}:\n"
                secao += f"    Preço Original: {preco_fmt}\n"
                secao += f"    Unidade: {unidade}\n"
                
                if preco_norm.get("normalizado"):
                    preco_ton = preco_norm.get("preco_por_tonelada", 0)
                    preco_ton_fmt = f"R$ {preco_ton:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                    secao += f"    Preço/Tonelada: {preco_ton_fmt}\n"
                    secao += f"    Normalizado: Sim\n"
                else:
                    secao += f"    Normalizado: Não\n"
                
                secao += f"    Fonte: {fonte}{fallback_text}\n\n"
            else:
                secao += f"  {cultura}:\n"
                secao += f"    Preço: N/A\n"
                secao += f"    Normalizado: Não\n"
                secao += f"    Observação: Preço não disponível\n\n"
        
        # Adicionar comparação de lucro se disponível
        tem_lucro_mercado = any(item.get("lucro_mercado_estimado") is not None for item in plano)
        
        if tem_lucro_mercado:
            secao += "Comparação de Lucro:\n\n"
            
            for item in plano:
                if item.get("lucro_mercado_estimado") is not None:
                    talhao = item.get("talhao", "N/A")
                    cultura = item.get("cultura", "").upper()
                    lucro_sistema = item.get("lucro_original", item.get("lucro_estimado", 0))
                    lucro_mercado = item.get("lucro_mercado_estimado", 0)
                    diferenca = lucro_mercado - lucro_sistema
                    
                    lucro_sistema_fmt = f"R$ {lucro_sistema:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                    lucro_mercado_fmt = f"R$ {lucro_mercado:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                    diferenca_fmt = f"R$ {diferenca:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                    
                    secao += f"  Talhão {talhao} ({cultura}):\n"
                    secao += f"    Lucro Sistema: {lucro_sistema_fmt}\n"
                    secao += f"    Lucro Mercado: {lucro_mercado_fmt}\n"
                    secao += f"    Diferença: {diferenca_fmt}\n\n"
        
        secao += "Observações:\n\n"
        
        if PRICE_APPLY_TO_PROFIT:
            secao += "Os preços de mercado normalizados foram aplicados ao cálculo de lucro.\n\n"
        else:
            secao += "Os preços foram normalizados para R$/tonelada. Nesta versão, o lucro principal ainda usa a base interna do sistema, mas o lucro de mercado estimado é exibido para comparação.\n\n"
        
        secao += "Normalização de Unidades:\n"
        secao += "- Todos os preços foram convertidos para R$/tonelada\n"
        secao += "- Fatores: saca_60kg (x16.67), saca_50kg (x20), arroba_15kg (x66.67)\n\n"
        
        secao += "Fontes:\n"
        secao += "- price-local-index: Índice local de preços\n"
        secao += "- price-fallback: Preço de referência (fallback)\n"
        secao += "- price-unavailable: Preço não disponível\n"
    
    return secao
