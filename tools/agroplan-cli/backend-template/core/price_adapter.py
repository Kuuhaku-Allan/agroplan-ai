"""
Adaptador de Preços Agrícolas
Integra preços reais no planejamento
"""

import os
from typing import Dict, List, Optional
from providers.price_provider import buscar_preco, buscar_precos_lote

# Configuração
PRICE_APPLY_TO_PROFIT = os.getenv("PRICE_APPLY_TO_PROFIT", "false").lower() == "true"


def aplicar_precos_no_plano(resultado: Dict, uf: Optional[str] = None) -> Dict:
    """
    Aplica informações de preços no plano
    
    Args:
        resultado: Resultado do AG ou cenário
        uf: Unidade Federativa (opcional)
    
    Returns:
        Resultado enriquecido com informações de preços
    """
    if "plano" not in resultado:
        return resultado
    
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
    
    # Aplicar preços no plano
    for item in resultado["plano"]:
        cultura = item.get("cultura")
        preco_info = precos_map.get(cultura, {})
        
        # Adicionar informações de preço
        item["preco_real"] = preco_info
        
        # Contabilizar estatísticas
        if preco_info.get("ativo"):
            if preco_info.get("fallback"):
                culturas_fallback += 1
            else:
                culturas_com_preco += 1
        else:
            culturas_sem_preco += 1
        
        # Se PRICE_APPLY_TO_PROFIT estiver ativo, recalcular lucro
        # NOTA: Por enquanto, apenas adiciona informação sem recalcular
        # Recálculo será implementado após validação de unidades
    
    # Adicionar resumo de preços ao resultado
    resultado["precos"] = {
        "ativo": True,
        "source": "price-local-index",
        "fallback_count": culturas_fallback,
        "culturas_com_preco": culturas_com_preco,
        "culturas_sem_preco": culturas_sem_preco,
        "total_culturas": len(culturas),
        "aplicado_no_lucro": PRICE_APPLY_TO_PROFIT,
        "uf": uf
    }
    
    return resultado


def gerar_secao_precos_relatorio(plano: List[Dict], uf: Optional[str], formato: str = "md") -> str:
    """
    Gera seção de preços para o relatório
    
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
        secao += "| Cultura | Preço | Unidade | Fonte | Observação |\n"
        secao += "|---------|-------|---------|-------|------------|\n"
        
        # Coletar culturas únicas
        culturas_vistas = set()
        
        for item in plano:
            cultura = item.get("cultura", "").upper()
            
            if cultura in culturas_vistas:
                continue
            
            culturas_vistas.add(cultura)
            
            preco_info = item.get("preco_real", {})
            
            if preco_info.get("ativo"):
                preco = preco_info.get("preco")
                unidade = preco_info.get("unidade", "N/A")
                fonte = preco_info.get("source", "N/A")
                fallback_icon = "⚠️ " if preco_info.get("fallback") else ""
                observacao = preco_info.get("observacao", "")
                
                preco_fmt = f"R$ {preco:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") if preco else "N/A"
                
                secao += f"| {cultura} | {preco_fmt} | {unidade} | {fallback_icon}{fonte} | {observacao} |\n"
            else:
                secao += f"| {cultura} | N/A | N/A | price-unavailable | Preço não disponível |\n"
        
        secao += "\n"
        secao += "### Observações\n\n"
        
        if PRICE_APPLY_TO_PROFIT:
            secao += "✅ **Os preços foram aplicados ao cálculo de lucro estimado.**\n\n"
        else:
            secao += "ℹ️ **Os preços são exibidos como referência, mas o cálculo de lucro ainda utiliza a base interna simulada.**\n\n"
        
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
            
            if preco_info.get("ativo"):
                preco = preco_info.get("preco")
                unidade = preco_info.get("unidade", "N/A")
                fonte = preco_info.get("source", "N/A")
                fallback_text = " (fallback)" if preco_info.get("fallback") else ""
                observacao = preco_info.get("observacao", "")
                
                preco_fmt = f"R$ {preco:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") if preco else "N/A"
                
                secao += f"  {cultura}:\n"
                secao += f"    Preço: {preco_fmt}\n"
                secao += f"    Unidade: {unidade}\n"
                secao += f"    Fonte: {fonte}{fallback_text}\n"
                secao += f"    Observação: {observacao}\n\n"
            else:
                secao += f"  {cultura}:\n"
                secao += f"    Preço: N/A\n"
                secao += f"    Observação: Preço não disponível\n\n"
        
        secao += "Observações:\n\n"
        
        if PRICE_APPLY_TO_PROFIT:
            secao += "Os preços foram aplicados ao cálculo de lucro estimado.\n\n"
        else:
            secao += "Os preços são exibidos como referência, mas o cálculo de lucro ainda utiliza a base interna simulada.\n\n"
        
        secao += "Fontes:\n"
        secao += "- price-local-index: Índice local de preços\n"
        secao += "- price-fallback: Preço de referência (fallback)\n"
        secao += "- price-unavailable: Preço não disponível\n"
    
    return secao
