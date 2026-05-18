"""
Gerador de relatórios explicáveis para o AgroPlan AI
"""

import os
from datetime import datetime
from core.planner import gerar_cenarios, gerar_plano_genetico
from core.bruteforce_validator import comparar_ag_com_forca_bruta, executar_multiplas_rodadas


def safe_print(message):
    """
    Print seguro que funciona no Windows mesmo com emojis
    
    Tenta print normal, se falhar por encoding, remove caracteres não-ASCII
    """
    try:
        print(message)
    except UnicodeEncodeError:
        # Fallback: remove caracteres não-ASCII
        print(message.encode("ascii", errors="ignore").decode("ascii"))


def format_currency_brl(value):
    """Formata valor monetário em padrão brasileiro"""
    return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def display_name(value):
    """Retorna nome com acentuação correta"""
    mapping = {
        "cafe": "café",
        "CAFE": "CAFÉ",
        "Cafe": "Café",
        "feijao": "feijão",
        "FEIJAO": "FEIJÃO",
        "Feijao": "Feijão",
        "algodao": "algodão",
        "ALGODAO": "ALGODÃO",
        "Algodao": "Algodão",
        "sustentavel": "sustentável",
        "SUSTENTAVEL": "SUSTENTÁVEL",
        "Sustentavel": "Sustentável",
        "media": "média",
        "Media": "Média",
        "MEDIA": "MÉDIA",
        "ingreme": "íngreme",
        "Ingreme": "Íngreme",
        "INGREME": "ÍNGREME",
        "cana": "cana",
        "CANA": "CANA",
        "Cana": "Cana",
        "soja": "soja",
        "SOJA": "SOJA",
        "Soja": "Soja",
        "milho": "milho",
        "MILHO": "MILHO",
        "Milho": "Milho",
        "trigo": "trigo",
        "TRIGO": "TRIGO",
        "Trigo": "Trigo",
        "sorgo": "sorgo",
        "SORGO": "SORGO",
        "Sorgo": "Sorgo",
        "mandioca": "mandioca",
        "MANDIOCA": "MANDIOCA",
        "Mandioca": "Mandioca",
        "arroz": "arroz",
        "ARROZ": "ARROZ",
        "Arroz": "Arroz",
    }
    return mapping.get(str(value), str(value))


def format_duration(seconds):
    """Formata duração em formato legível"""
    if seconds < 60:
        return f"aproximadamente {seconds:.0f} segundos"
    elif seconds < 3600:
        minutes = seconds / 60
        return f"aproximadamente {minutes:.1f} minutos"
    elif seconds < 86400:
        hours = seconds / 3600
        return f"aproximadamente {hours:.1f} horas"
    else:
        days = seconds / 86400
        return f"aproximadamente {days:.1f} dias"


def get_objetivo_description(objetivo):
    """Retorna descrição adequada do objetivo"""
    descriptions = {
        "equilibrado": "buscou equilíbrio entre retorno financeiro, controle de risco e compatibilidade agronômica",
        "lucro": "priorizou retorno financeiro dentro das restrições do modelo",
        "risco": "reduziu a exposição média ao risco dentro das restrições do modelo",
        "sustentavel": "priorizou compatibilidade com o terreno, diversidade de culturas e uso adequado dos recursos disponíveis"
    }
    return descriptions.get(objetivo, "otimizou múltiplos critérios")


def gerar_relatorio_completo(culturas, talhoes, regras, objetivo='equilibrado', formato='md', perfil='rapido', contexto_climatico=None, uf=None, municipio=None, safra="2025/2026"):
    """
    Gera relatório completo do sistema
    
    Args:
        culturas: DataFrame com culturas
        talhoes: DataFrame com talhões
        regras: DataFrame com regras
        objetivo: objetivo do AG
        formato: 'md' ou 'txt'
        perfil: 'rapido' ou 'completo' (padrão: 'rapido')
        contexto_climatico: Dicionário com dados climáticos reais (opcional)
        uf: Unidade Federativa para ZARC (opcional)
        municipio: Município para ZARC (opcional)
        safra: Safra ZARC (padrão: 2025/2026)
    
    Returns:
        Caminho do arquivo gerado
    """
    # Executa todas as análises
    safe_print("   📊 Gerando cenários...")
    cenarios = gerar_cenarios(culturas, talhoes, regras)
    
    safe_print("   🧬 Executando Algoritmo Genético...")
    # Aplicar contexto climático se disponível
    if contexto_climatico:
        from core.climate_adapter import aplicar_contexto_climatico_no_plano
        resultado_ag = gerar_plano_genetico(culturas, talhoes, regras, objetivo, seed=42)
        resultado_ag = aplicar_contexto_climatico_no_plano(resultado_ag, contexto_climatico)
    else:
        resultado_ag = gerar_plano_genetico(culturas, talhoes, regras, objetivo, seed=42)
    
    # Validação e estabilidade dependem do perfil
    validacao = None
    estabilidade = None
    aviso_perfil = None
    
    if perfil == "completo":
        safe_print("   🔬 Validando com força bruta...")
        validacao = comparar_ag_com_forca_bruta(culturas, talhoes, regras, objetivo, seed=42)
        
        safe_print("   🔄 Analisando estabilidade (5 rodadas)...")
        estabilidade = executar_multiplas_rodadas(culturas, talhoes, regras, objetivo, rodadas=5)
    else:
        # Modo rápido: pula validações pesadas
        safe_print("   ⚡ Modo rápido: pulando validações pesadas...")
        aviso_perfil = "Relatório gerado em modo rápido. A validação completa pode ser executada separadamente na seção Validação."
    
    # Gera conteúdo do relatório
    if formato == 'md':
        conteudo = gerar_relatorio_markdown(
            culturas, talhoes, regras, objetivo,
            cenarios, resultado_ag, validacao, estabilidade,
            aviso_perfil=aviso_perfil
        )
        extensao = 'md'
    else:
        conteudo = gerar_relatorio_txt(
            culturas, talhoes, regras, objetivo,
            cenarios, resultado_ag, validacao, estabilidade,
            aviso_perfil=aviso_perfil
        )
        extensao = 'txt'
    
    # Adicionar seção climática se disponível
    if contexto_climatico:
        secao_clima = gerar_secao_climatica(contexto_climatico, formato)
        conteudo += "\n\n" + secao_clima
    
    # Adicionar seção ZARC se disponível
    if uf:
        from core.zarc_adapter import enriquecer_plano_com_zarc, gerar_secao_zarc_relatorio
        resultado_temp = {"plano": resultado_ag["plano"]}
        resultado_temp = enriquecer_plano_com_zarc(resultado_temp, uf, municipio, safra)
        secao_zarc = gerar_secao_zarc_relatorio(resultado_temp["plano"], uf, municipio, safra, formato)
        conteudo += "\n\n" + secao_zarc
    
    # Adicionar seção de preços agrícolas
    from core.price_adapter import aplicar_precos_no_plano, gerar_secao_precos_relatorio
    resultado_temp = {"plano": resultado_ag["plano"]}
    resultado_temp = aplicar_precos_no_plano(resultado_temp, uf=uf)
    secao_precos = gerar_secao_precos_relatorio(resultado_temp["plano"], uf, formato)
    conteudo += "\n\n" + secao_precos
    
    # Adicionar seção de validação de lucro de mercado
    if resultado_temp.get("validacao_lucro_mercado", {}).get("ativo"):
        secao_validacao = gerar_secao_validacao_lucro_mercado(resultado_temp, formato)
        conteudo += "\n\n" + secao_validacao
    
    # Salva arquivo
    os.makedirs('reports', exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    nome_arquivo = f'relatorio_agroplan_{objetivo}_{timestamp}.{extensao}'
    caminho = os.path.join('reports', nome_arquivo)
    
    with open(caminho, 'w', encoding='utf-8') as f:
        f.write(conteudo)
    
    return caminho


def gerar_secao_climatica(contexto_climatico, formato='md'):
    """Gera seção de dados climáticos para o relatório"""
    if not contexto_climatico or contexto_climatico.get("fallback", True):
        if formato == 'md':
            return "## Dados Climáticos\n\nEste relatório foi gerado com base nos dados internos simulados."
        else:
            return "DADOS CLIMÁTICOS\n\nEste relatório foi gerado com base nos dados internos simulados."
    
    if formato == 'md':
        secao = "## Dados Climáticos Reais Utilizados\n\n"
        secao += f"**Fonte:** {contexto_climatico.get('fonte', 'N/A')}\n\n"
        
        if contexto_climatico.get('temperatura_media'):
            secao += f"**Temperatura Média:** {contexto_climatico['temperatura_media']:.1f}°C\n\n"
        if contexto_climatico.get('temperatura_maxima'):
            secao += f"**Temperatura Máxima:** {contexto_climatico['temperatura_maxima']:.1f}°C\n\n"
        if contexto_climatico.get('temperatura_minima'):
            secao += f"**Temperatura Mínima:** {contexto_climatico['temperatura_minima']:.1f}°C\n\n"
        if contexto_climatico.get('precipitacao_total'):
            secao += f"**Precipitação Total (30 dias):** {contexto_climatico['precipitacao_total']:.1f}mm\n\n"
        if contexto_climatico.get('risco_climatico_estimado'):
            secao += f"**Risco Climático Estimado:** {contexto_climatico['risco_climatico_estimado']}\n\n"
        if contexto_climatico.get('clima_observado'):
            secao += f"**Clima Observado:** {contexto_climatico['clima_observado']}\n\n"
        if contexto_climatico.get('agua_observada'):
            secao += f"**Disponibilidade Hídrica:** {contexto_climatico['agua_observada']}\n\n"
        if contexto_climatico.get('ajuste_risco') is not None:
            ajuste = contexto_climatico['ajuste_risco']
            sinal = '+' if ajuste > 0 else ''
            secao += f"**Ajuste de Risco Aplicado:** {sinal}{ajuste} pontos percentuais\n\n"
        
        secao += "**Impacto no Planejamento:**\n\n"
        secao += "Os dados climáticos reais foram integrados ao algoritmo de otimização, "
        secao += "ajustando automaticamente os níveis de risco de cada cultura com base nas "
        secao += "condições meteorológicas observadas. Este ajuste proporciona maior precisão "
        secao += "nas recomendações de plantio.\n"
    else:
        secao = "DADOS CLIMÁTICOS REAIS UTILIZADOS\n\n"
        secao += f"Fonte: {contexto_climatico.get('fonte', 'N/A')}\n\n"
        
        if contexto_climatico.get('temperatura_media'):
            secao += f"Temperatura Média: {contexto_climatico['temperatura_media']:.1f}°C\n"
        if contexto_climatico.get('temperatura_maxima'):
            secao += f"Temperatura Máxima: {contexto_climatico['temperatura_maxima']:.1f}°C\n"
        if contexto_climatico.get('temperatura_minima'):
            secao += f"Temperatura Mínima: {contexto_climatico['temperatura_minima']:.1f}°C\n"
        if contexto_climatico.get('precipitacao_total'):
            secao += f"Precipitação Total (30 dias): {contexto_climatico['precipitacao_total']:.1f}mm\n"
        if contexto_climatico.get('risco_climatico_estimado'):
            secao += f"Risco Climático Estimado: {contexto_climatico['risco_climatico_estimado']}\n"
        if contexto_climatico.get('clima_observado'):
            secao += f"Clima Observado: {contexto_climatico['clima_observado']}\n"
        if contexto_climatico.get('agua_observada'):
            secao += f"Disponibilidade Hídrica: {contexto_climatico['agua_observada']}\n"
        if contexto_climatico.get('ajuste_risco') is not None:
            ajuste = contexto_climatico['ajuste_risco']
            sinal = '+' if ajuste > 0 else ''
            secao += f"Ajuste de Risco Aplicado: {sinal}{ajuste} pontos percentuais\n"
        
        secao += "\nImpacto no Planejamento:\n\n"
        secao += "Os dados climáticos reais foram integrados ao algoritmo de otimização, "
        secao += "ajustando automaticamente os níveis de risco de cada cultura com base nas "
        secao += "condições meteorológicas observadas. Este ajuste proporciona maior precisão "
        secao += "nas recomendações de plantio.\n"
    
    return secao


def gerar_secao_validacao_lucro_mercado(resultado, formato='md'):
    """
    Gera seção de validação de lucro de mercado para o relatório
    
    Args:
        resultado: Resultado com validacao_lucro_mercado
        formato: 'md' ou 'txt'
    
    Returns:
        String com seção formatada
    """
    validacao = resultado.get("validacao_lucro_mercado", {})
    
    if not validacao.get("ativo"):
        return ""
    
    if formato == "md":
        secao = "## 🔍 Validação do Lucro de Mercado\n\n"
        
        secao += "### Resumo de Confiabilidade\n\n"
        
        total = validacao.get("total_itens", 0)
        alta = validacao.get("itens_alta_confiabilidade", 0)
        media = validacao.get("itens_media_confiabilidade", 0)
        baixa = validacao.get("itens_baixa_confiabilidade", 0)
        criticos = validacao.get("itens_criticos", 0)
        
        perc_alta = validacao.get("percentual_alta_confiabilidade", 0)
        perc_baixa = validacao.get("percentual_baixa_confiabilidade", 0)
        perc_critico = validacao.get("percentual_critico", 0)
        
        secao += f"- **Total de itens analisados**: {total}\n"
        secao += f"- **Alta confiabilidade**: {alta} ({perc_alta:.1f}%) 🟢\n"
        secao += f"- **Média confiabilidade**: {media} ({100 - perc_alta - perc_baixa:.1f}%) 🟡\n"
        secao += f"- **Baixa confiabilidade**: {baixa} ({perc_baixa:.1f}%) 🔴\n"
        
        if criticos > 0:
            secao += f"- **⚠️ Itens críticos**: {criticos} ({perc_critico:.1f}%)\n"
        
        secao += "\n"
        
        # Aviso de itens críticos
        if criticos > 0:
            secao += "### ⚠️ ATENÇÃO: Valores Críticos Detectados\n\n"
            secao += f"**{criticos} item(ns) apresenta(m) valores críticos** que indicam possível desalinhamento entre:\n"
            secao += "- Preço de mercado vs preço interno\n"
            secao += "- Produtividade estimada vs real\n"
            secao += "- Custos operacionais\n"
            secao += "- Unidade comercial\n\n"
            secao += "**Estes valores não devem ser usados para otimização sem validação manual.**\n\n"
        
        # Recomendação
        recomendacao = validacao.get("recomendacao", "")
        if recomendacao:
            secao += f"**Recomendação**: {recomendacao}\n\n"
        
        # Alertas
        alertas = validacao.get("alertas", [])
        if alertas:
            secao += "### ⚠️ Alertas\n\n"
            for alerta in alertas:
                secao += f"- {alerta}\n"
            secao += "\n"
            
            total_alertas = validacao.get("total_alertas", 0)
            if total_alertas > len(alertas):
                secao += f"*Mostrando {len(alertas)} de {total_alertas} alertas*\n\n"
        
        # Detalhes por item
        secao += "### Detalhes por Talhão\n\n"
        secao += "| Talhão | Cultura | Lucro Sistema | Lucro Mercado | Diferença % | Confiabilidade |\n"
        secao += "|--------|---------|---------------|---------------|-------------|----------------|\n"
        
        for item in resultado["plano"]:
            validacao_item = item.get("validacao_lucro_mercado", {})
            if not validacao_item:
                continue
            
            talhao = item.get("talhao", "N/A")
            cultura = item.get("cultura", "").upper()
            lucro_sistema = item.get("lucro_estimado", 0)
            lucro_mercado = item.get("lucro_mercado_estimado", 0)
            
            lucro_sistema_fmt = f"R$ {lucro_sistema:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
            
            if lucro_mercado is not None:
                lucro_mercado_fmt = f"R$ {lucro_mercado:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                diferenca = validacao_item.get("diferenca", {})
                diferenca_perc = diferenca.get("diferenca_percentual", 0)
                diferenca_fmt = f"{diferenca_perc:.1f}%"
            else:
                lucro_mercado_fmt = "N/A"
                diferenca_fmt = "N/A"
            
            confiabilidade = validacao_item.get("confiabilidade", "baixa")
            critico = validacao_item.get("critico", False)
            
            if critico:
                conf_emoji = "⚠️🔴"
                conf_label = "**CRÍTICO**"
            else:
                conf_emoji = "🟢" if confiabilidade == "alta" else "🟡" if confiabilidade == "media" else "🔴"
                conf_label = confiabilidade.title()
            
            secao += f"| {talhao} | {cultura} | {lucro_sistema_fmt} | {lucro_mercado_fmt} | {diferenca_fmt} | {conf_emoji} {conf_label} |\n"
        
        secao += "\n"
        
        # Explicação
        secao += "### 📊 Sobre a Classificação de Confiabilidade\n\n"
        secao += "A confiabilidade do lucro de mercado é classificada com base em:\n\n"
        secao += "- **Alta (🟢)**: Diferença < 50% entre lucro sistema e mercado, preço normalizado disponível\n"
        secao += "- **Média (🟡)**: Diferença 50-150%, uso de fallback, ou lucro negativo\n"
        secao += "- **Baixa (🔴)**: Diferença > 150%, dados incompletos, ou preço não disponível\n"
        secao += "- **⚠️ CRÍTICO**: Diferença extrema (>150%), lucro invertido, ou fallback com diferença >100%\n\n"
        
        secao += "### ⚠️ Aviso Importante\n\n"
        secao += "**O lucro de mercado ainda é experimental e não substitui o lucro principal do sistema.**\n\n"
        secao += "Os valores são exibidos apenas como comparação para validação. Diferenças altas indicam "
        secao += "necessidade de validação de produtividade, custos ou unidade comercial.\n\n"
        secao += "**Status atual**: `PRICE_APPLY_TO_PROFIT=false` (lucro de mercado não afeta otimização)\n"
        
    else:  # txt
        secao = "VALIDAÇÃO DO LUCRO DE MERCADO\n\n"
        
        secao += "Resumo de Confiabilidade:\n\n"
        
        total = validacao.get("total_itens", 0)
        alta = validacao.get("itens_alta_confiabilidade", 0)
        media = validacao.get("itens_media_confiabilidade", 0)
        baixa = validacao.get("itens_baixa_confiabilidade", 0)
        
        perc_alta = validacao.get("percentual_alta_confiabilidade", 0)
        perc_baixa = validacao.get("percentual_baixa_confiabilidade", 0)
        
        secao += f"  Total de itens analisados: {total}\n"
        secao += f"  Alta confiabilidade: {alta} ({perc_alta:.1f}%)\n"
        secao += f"  Média confiabilidade: {media} ({100 - perc_alta - perc_baixa:.1f}%)\n"
        secao += f"  Baixa confiabilidade: {baixa} ({perc_baixa:.1f}%)\n\n"
        
        # Recomendação
        recomendacao = validacao.get("recomendacao", "")
        if recomendacao:
            secao += f"Recomendação: {recomendacao}\n\n"
        
        # Alertas
        alertas = validacao.get("alertas", [])
        if alertas:
            secao += "Alertas:\n\n"
            for alerta in alertas:
                secao += f"  - {alerta}\n"
            secao += "\n"
            
            total_alertas = validacao.get("total_alertas", 0)
            if total_alertas > len(alertas):
                secao += f"  (Mostrando {len(alertas)} de {total_alertas} alertas)\n\n"
        
        # Detalhes por item
        secao += "Detalhes por Talhão:\n\n"
        
        for item in resultado["plano"]:
            validacao_item = item.get("validacao_lucro_mercado", {})
            if not validacao_item:
                continue
            
            talhao = item.get("talhao", "N/A")
            cultura = item.get("cultura", "").upper()
            lucro_sistema = item.get("lucro_estimado", 0)
            lucro_mercado = item.get("lucro_mercado_estimado", 0)
            
            lucro_sistema_fmt = f"R$ {lucro_sistema:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
            
            secao += f"  Talhão {talhao} ({cultura}):\n"
            secao += f"    Lucro Sistema: {lucro_sistema_fmt}\n"
            
            if lucro_mercado is not None:
                lucro_mercado_fmt = f"R$ {lucro_mercado:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                diferenca = validacao_item.get("diferenca", {})
                diferenca_perc = diferenca.get("diferenca_percentual", 0)
                secao += f"    Lucro Mercado: {lucro_mercado_fmt}\n"
                secao += f"    Diferença: {diferenca_perc:.1f}%\n"
            else:
                secao += f"    Lucro Mercado: N/A\n"
            
            confiabilidade = validacao_item.get("confiabilidade", "baixa")
            secao += f"    Confiabilidade: {confiabilidade.title()}\n"
            
            motivos = validacao_item.get("motivos", [])
            if motivos:
                secao += f"    Motivos: {', '.join(motivos)}\n"
            
            secao += "\n"
        
        # Explicação
        secao += "Sobre a Classificação de Confiabilidade:\n\n"
        secao += "A confiabilidade do lucro de mercado é classificada com base em:\n\n"
        secao += "  - Alta: Diferença < 50% entre lucro sistema e mercado\n"
        secao += "  - Média: Diferença 50-100%, uso de fallback, ou lucro negativo\n"
        secao += "  - Baixa: Diferença > 100%, dados incompletos, ou preço não disponível\n\n"
        
        secao += "Aviso Importante:\n\n"
        secao += "O lucro de mercado ainda é experimental e não substitui o lucro principal\n"
        secao += "do sistema. Os valores são exibidos apenas como comparação para validação.\n"
        secao += "Diferenças altas indicam necessidade de validação de produtividade, custos\n"
        secao += "ou unidade comercial.\n\n"
        secao += "Status atual: PRICE_APPLY_TO_PROFIT=false (lucro de mercado não afeta\n"
        secao += "otimização)\n"
    
    return secao


def gerar_relatorio_markdown(culturas, talhoes, regras, objetivo, cenarios, resultado_ag, validacao, estabilidade, aviso_perfil=None):
    """Gera relatório em formato Markdown"""
    
    md = []
    md.append("# 📊 Relatório AgroPlan AI - Sistema de Planejamento de Plantio")
    md.append("")
    md.append(f"**Data:** {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    md.append(f"**Objetivo:** {display_name(objetivo).title()}")
    md.append("")
    
    # Adicionar aviso de perfil se fornecido
    if aviso_perfil:
        md.append("> ⚡ **Modo Rápido:** " + aviso_perfil)
        md.append("")
    
    md.append("---")
    md.append("")
    
    # 1. Resumo Executivo
    md.append("## 1. 📋 Resumo Executivo")
    md.append("")
    md.append("### Plano Recomendado")
    md.append("")
    
    for p in resultado_ag['plano']:
        cultura_display = display_name(p['cultura']).upper()
        md.append(f"- **Talhão {p['talhao']}** ({p['area']} ha): **{cultura_display}**")
        md.append(f"  - Lucro estimado: {format_currency_brl(p['lucro_estimado'])}")
        md.append(f"  - Risco: {p['risco']}%")
        md.append(f"  - Tempo de colheita: {p['tempo']} dias")
    
    md.append("")
    md.append("### Métricas Gerais")
    md.append("")
    md.append(f"- **Lucro Total:** {format_currency_brl(resultado_ag['lucro_total'])}")
    md.append(f"- **Risco Médio Ponderado:** {resultado_ag['risco_medio']:.1f}%")
    md.append(f"- **Diversidade:** {resultado_ag['diversidade']} cultura(s) diferente(s)")
    md.append(f"- **Fitness:** {resultado_ag['fitness']:.2f}")
    md.append(f"- **Área Total:** {resultado_ag['area_total']} ha")
    md.append("")
    md.append("### Justificativa")
    md.append("")
    
    # Usa descrição adequada do objetivo
    objetivo_desc = get_objetivo_description(objetivo)
    md.append(f"O plano recomendado {objetivo_desc}.")
    
    if objetivo == "sustentavel":
        md.append("")
        md.append("**Sobre Sustentabilidade:** Neste sistema, sustentabilidade considera compatibilidade com o terreno, diversidade de culturas e uso adequado dos recursos disponíveis.")
    
    md.append("")
    md.append("---")
    md.append("")
    
    # 2. Características dos Talhões
    md.append("## 2. 🌾 Características dos Talhões")
    md.append("")
    
    for _, talhao in talhoes.iterrows():
        md.append(f"### Talhão {talhao['id']}")
        md.append("")
        md.append(f"- **Área:** {talhao['area']} hectares")
        md.append(f"- **Solo:** {display_name(talhao['solo']).title()}")
        md.append(f"- **Clima:** {display_name(talhao['clima']).title()}")
        md.append(f"- **Relevo:** {display_name(talhao['relevo']).title()}")
        md.append(f"- **Disponibilidade de Água:** {display_name(talhao['agua']).title()}")
        md.append("")
    
    md.append("---")
    md.append("")
    
    # 3. Comparação de Cenários
    md.append("## 3. 📊 Comparação de Cenários")
    md.append("")
    md.append("| Cenário | Lucro Total | Risco Médio | Culturas Escolhidas |")
    md.append("|---------|-------------|-------------|---------------------|")
    
    # AG
    culturas_ag = " + ".join([display_name(p['cultura']).title() for p in resultado_ag['plano']])
    objetivo_label = display_name(objetivo).title()
    md.append(f"| **🧬 AG {objetivo_label}** | **{format_currency_brl(resultado_ag['lucro_total'])}** | **{resultado_ag['risco_medio']:.1f}%** | **{culturas_ag}** |")
    
    # Cenários manuais
    ordem = ['equilibrado', 'maximo_lucro', 'baixo_risco', 'sustentavel', 'conservador']
    nomes = {
        'equilibrado': 'Equilibrado',
        'maximo_lucro': 'Máximo Lucro',
        'baixo_risco': 'Baixo Risco',
        'sustentavel': 'Sustentável',
        'conservador': 'Conservador'
    }
    
    for key in ordem:
        cenario = cenarios[key]
        culturas_cenario = " + ".join(set([display_name(p['cultura']).title() for p in cenario['plano']]))
        md.append(f"| {nomes[key]} | {format_currency_brl(cenario['lucro_total'])} | {cenario['risco_medio']:.1f}% | {culturas_cenario} |")
    
    md.append("")
    md.append("### Observações")
    md.append("")
    md.append("- O **Algoritmo Genético** encontrou uma solução otimizada considerando múltiplos objetivos")
    md.append("- Cenários manuais seguem estratégias pré-definidas")
    md.append("- A escolha final depende do perfil de risco do produtor")
    md.append("")
    md.append("---")
    md.append("")
    
    # 4. Resultado do Algoritmo Genético
    md.append("## 4. 🧬 Resultado do Algoritmo Genético")
    md.append("")
    md.append("### Configuração")
    md.append("")
    md.append(f"- **Objetivo:** {display_name(objetivo).title()}")
    md.append(f"- **Gerações:** {resultado_ag['geracoes']}")
    md.append("- **População:** 50 indivíduos")
    md.append(f"- **Seed:** {resultado_ag.get('seed', 'Não especificada')}")
    md.append("")
    md.append("### Resultado")
    md.append("")
    md.append(f"- **Fitness Final:** {resultado_ag['fitness']:.2f}")
    md.append(f"- **Lucro Total:** {format_currency_brl(resultado_ag['lucro_total'])}")
    md.append(f"- **Risco Médio:** {resultado_ag['risco_medio']:.1f}%")
    md.append(f"- **Diversidade:** {resultado_ag['diversidade']} cultura(s)")
    md.append("")
    md.append("### Plano Detalhado")
    md.append("")
    
    for p in resultado_ag['plano']:
        cultura_display = display_name(p['cultura']).upper()
        solo_display = display_name(p['solo']).title()
        clima_display = display_name(p['clima']).title()
        md.append(f"**Talhão {p['talhao']}** ({p['area']} ha) - Solo {solo_display}, Clima {clima_display}")
        md.append(f"- Cultura: **{cultura_display}**")
        md.append(f"- Lucro: {format_currency_brl(p['lucro_estimado'])}")
        md.append(f"- Risco: {p['risco']}%")
        md.append(f"- Nota de compatibilidade: {p['nota']:.2f}")
        md.append("")
    
    md.append("---")
    md.append("")
    
    # 5. Validação
    md.append("## 5. 🔬 Validação do Algoritmo")
    md.append("")
    
    if validacao.get('erro'):
        # Força bruta inviável
        total_comb = validacao.get('total_combinacoes', 0)
        md.append(f"**Total de combinações possíveis:** {total_comb:,}".replace(",", "."))
        md.append("")
        md.append("### ⚠️ Força Bruta Inviável")
        md.append("")
        md.append(f"A busca exaustiva por força bruta foi considerada **inviável** neste conjunto, ")
        md.append(f"pois existem aproximadamente **{total_comb:,} combinações possíveis**.".replace(",", "."))
        md.append("")
        md.append("Por isso, a validação foi realizada por meio de:")
        md.append("")
        md.append("- ✅ Múltiplas rodadas do Algoritmo Genético")
        md.append("- ✅ Análise de estabilidade estatística")
        md.append("- ✅ Comparação com cenários manuais")
        md.append("")
        md.append("### Por que a força bruta é inviável?")
        md.append("")
        md.append(f"Com {len(talhoes)} talhões e {len(culturas)} culturas, o número de combinações cresce exponencialmente.")
        md.append("")
        
        if total_comb >= 1_000_000_000:
            # Calcula tempo em segundos
            tempo_1m = total_comb / 1_000_000  # segundos
            tempo_1b = total_comb / 1_000_000_000  # segundos
            
            md.append(f"Testar **{total_comb:,} combinações** levaria:".replace(",", "."))
            md.append(f"- 1 milhão/s: {format_duration(tempo_1m)}")
            md.append(f"- 1 bilhão/s: {format_duration(tempo_1b)}")
        else:
            md.append(f"Testar **{total_comb:,} combinações** seria computacionalmente custoso e desnecessário.".replace(",", "."))
        
        md.append("")
        md.append("O **Algoritmo Genético** é a solução ideal para este cenário, pois:")
        md.append("")
        md.append("- 🚀 Encontra soluções de alta qualidade em tempo viável")
        md.append("- 🎯 Explora o espaço de busca de forma inteligente")
        md.append("- 📊 Apresenta resultados consistentes (veja seção de Estabilidade)")
        md.append("- ⚡ Escala para problemas ainda maiores")
        md.append("")
    else:
        # Força bruta viável
        md.append(f"**Total de combinações testadas:** {validacao['forca_bruta']['total_combinacoes']}")
        md.append("")
        
        md.append("### Melhor Solução por Força Bruta")
        md.append("")
        for p in validacao['forca_bruta']['plano']:
            md.append(f"- Talhão {p['talhao']}: {display_name(p['cultura']).title()}")
        md.append(f"- **Fitness:** {validacao['forca_bruta']['melhor_fitness']:.2f}")
        md.append(f"- **Lucro:** {format_currency_brl(validacao['forca_bruta']['lucro_total'])}")
        md.append("")
        
        md.append("### Melhor Solução pelo AG")
        md.append("")
        for p in validacao['ag']['plano']:
            md.append(f"- Talhão {p['talhao']}: {display_name(p['cultura']).title()}")
        md.append(f"- **Fitness:** {validacao['ag']['fitness']:.2f}")
        md.append(f"- **Lucro:** {format_currency_brl(validacao['ag']['lucro_total'])}")
        md.append("")
        
        if validacao['ag_encontrou_otimo_global']:
            md.append("✅ **Status:** O Algoritmo Genético encontrou o ótimo global!")
        else:
            md.append("⚠️ **Status:** O AG encontrou uma solução próxima, mas não o ótimo global.")
            md.append(f"- Diferença de fitness: {validacao['diferenca_fitness']:.2f}")
        
        md.append("")
        md.append("### Escalabilidade")
        md.append("")
        md.append("Em conjuntos pequenos (3 talhões, 5 culturas = 125 combinações), a força bruta ainda é viável.")
        md.append("Porém, em cenários maiores:")
        md.append("")
        md.append("- **10 talhões, 10 culturas:** ~10 bilhões de combinações (inviável)")
        md.append("- **20 talhões, 10 culturas:** 10²⁰ combinações (impossível)")
        md.append("")
        md.append("O Algoritmo Genético torna-se **essencial** em problemas de grande escala.")
        md.append("")
    
    md.append("---")
    md.append("")
    
    # 6. Estabilidade do Algoritmo
    md.append("## 6. 📈 Estabilidade do Algoritmo")
    md.append("")
    md.append(f"**Rodadas executadas:** {estabilidade['rodadas']}")
    md.append("")
    md.append("### Estatísticas")
    md.append("")
    md.append(f"- **Melhor Fitness:** {estabilidade['melhor_fitness']:.2f}")
    md.append(f"- **Fitness Médio:** {estabilidade['fitness_medio']:.2f}")
    md.append(f"- **Pior Fitness:** {estabilidade['pior_fitness']:.2f}")
    md.append(f"- **Desvio Padrão:** {estabilidade['desvio_padrao']:.2f}")
    md.append(f"- **Coeficiente de Variação:** {estabilidade['coeficiente_variacao']:.2f}%")
    md.append("")
    
    emoji = "🟢" if estabilidade['estabilidade'] == 'alta' else "🟡" if estabilidade['estabilidade'] == 'média' else "🔴"
    md.append(f"{emoji} **Estabilidade:** {estabilidade['estabilidade'].upper()}")
    md.append("")
    md.append(estabilidade['estabilidade_descricao'])
    md.append("")
    md.append("---")
    md.append("")
    
    # 7. Justificativa Agronômica
    md.append("## 7. 🌱 Justificativa Agronômica")
    md.append("")
    
    for p in resultado_ag['plano']:
        cultura_display = display_name(p['cultura']).upper()
        solo_display = display_name(p['solo'])
        clima_display = display_name(p['clima'])
        relevo_display = display_name(p['relevo'])
        agua_display = display_name(p['agua'])
        
        md.append(f"### Talhão {p['talhao']}: {cultura_display}")
        md.append("")
        md.append(f"**Por que {display_name(p['cultura'])} foi escolhida para este talhão?**")
        md.append("")
        md.append(f"- **Solo {solo_display}:** Compatível com as necessidades da cultura")
        md.append(f"- **Clima {clima_display}:** Adequado para o desenvolvimento")
        md.append(f"- **Relevo {relevo_display}:** Favorável ao cultivo")
        md.append(f"- **Água {agua_display}:** Atende às necessidades hídricas")
        md.append(f"- **Nota de compatibilidade:** {p['nota']:.2f}/100")
        md.append(f"- **Lucro estimado:** {format_currency_brl(p['lucro_estimado'])}")
        md.append(f"- **Risco:** {p['risco']}%")
        md.append("")
    
    md.append("---")
    md.append("")
    
    # 8. Limitações do Sistema
    md.append("## 8. ⚠️ Limitações do Sistema")
    md.append("")
    md.append("Este sistema fornece **recomendações baseadas em dados e algoritmos**, mas possui limitações:")
    md.append("")
    md.append("1. **Dados Simulados:** Os dados atuais são estimativas, não medições reais de campo")
    md.append("2. **Modelo Simplificado:** Não considera todos os fatores agronômicos (pragas, doenças, mercado local)")
    md.append("3. **Sem Análise Laboratorial:** Não utiliza análise química e física do solo")
    md.append("4. **Dados Climáticos Regionais:** O sistema já utiliza dados climáticos reais via Open-Meteo, mas ainda trabalha em escala regional, sem análise individualizada por polígono/talhão real")
    md.append("5. **Sem Preços de Mercado Reais:** Ainda utiliza preços simulados, sem integração com cotações oficiais como Conab/CEPEA")
    md.append("6. **Não Substitui Agrônomo:** As recomendações devem ser validadas por profissional qualificado")
    md.append("")
    md.append("**Recomendação:** Use este sistema como ferramenta de apoio à decisão, não como decisão final.")
    md.append("")
    md.append("---")
    md.append("")
    
    # 9. Próximas Evoluções
    md.append("## 9. 🚀 Próximas Evoluções")
    md.append("")
    md.append("### Próximas Integrações de Dados Reais")
    md.append("- **ZARC:** Zoneamento Agrícola de Risco Climático (dados oficiais MAPA)")
    md.append("- **Preços Agrícolas:** Integração com Conab/CEPEA para cotações oficiais")
    md.append("- **Dados Agroclimáticos:** NASA POWER para radiação solar e evapotranspiração")
    md.append("- **Análise Geográfica:** Análise individualizada por propriedade/talhão em fase futura")
    md.append("")
    md.append("### Machine Learning")
    md.append("- Previsão de produtividade")
    md.append("- Previsão de preços")
    md.append("- Detecção de anomalias")
    md.append("- Recomendação personalizada")
    md.append("")
    md.append("### Sistema Completo")
    md.append("- Cadastro de propriedades")
    md.append("- Gestão de usuários")
    md.append("- Histórico de safras")
    md.append("- Relatórios em PDF")
    md.append("- Aplicativo mobile")
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 📝 Conclusão")
    md.append("")
    md.append(f"O sistema AgroPlan AI recomenda o plano apresentado neste relatório com base no objetivo **{display_name(objetivo)}**.")
    md.append("")
    
    # Conclusão adaptada ao tipo de validação
    if validacao.get('erro'):
        estabilidade_label = display_name(estabilidade['estabilidade'])
        md.append(f"A solução foi validada por meio de **múltiplas rodadas** e apresenta estabilidade **{estabilidade_label}**.")
        md.append("")
        total_comb_fmt = f"{validacao.get('total_combinacoes', 0):,}".replace(",", ".")
        md.append(f"Com **{total_comb_fmt} combinações possíveis**, o Algoritmo Genético ")
        md.append("demonstra sua **essencialidade** para resolver problemas de planejamento agrícola em escala real.")
    else:
        estabilidade_label = display_name(estabilidade['estabilidade'])
        md.append(f"A solução foi validada por **força bruta** e apresenta estabilidade **{estabilidade_label}**.")
    
    md.append("")
    md.append("**Próximos passos sugeridos:**")
    md.append("1. Validar recomendações com agrônomo")
    md.append("2. Considerar fatores locais não modelados")
    md.append("3. Ajustar conforme disponibilidade de recursos")
    md.append("4. Monitorar resultados para melhorias futuras")
    md.append("")
    md.append("---")
    md.append("")
    md.append("*Relatório gerado automaticamente pelo AgroPlan AI*")
    
    return "\n".join(md)


def gerar_relatorio_txt(culturas, talhoes, regras, objetivo, cenarios, resultado_ag, validacao, estabilidade, aviso_perfil=None):
    """Gera relatório em formato TXT"""
    
    txt = []
    txt.append("=" * 80)
    txt.append("RELATÓRIO AGROPLAN AI - SISTEMA DE PLANEJAMENTO DE PLANTIO")
    txt.append("=" * 80)
    txt.append("")
    txt.append(f"Data: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    txt.append(f"Objetivo: {display_name(objetivo).upper()}")
    txt.append("")
    
    # Adicionar aviso de perfil se fornecido
    if aviso_perfil:
        txt.append("MODO RÁPIDO: " + aviso_perfil)
        txt.append("")
    
    txt.append("=" * 80)
    txt.append("")
    
    # 1. Resumo Executivo
    txt.append("1. RESUMO EXECUTIVO")
    txt.append("-" * 80)
    txt.append("")
    txt.append("PLANO RECOMENDADO:")
    txt.append("")
    
    for p in resultado_ag['plano']:
        cultura_display = display_name(p['cultura']).upper()
        txt.append(f"  Talhão {p['talhao']} ({p['area']} ha): {cultura_display}")
        txt.append(f"    Lucro estimado: {format_currency_brl(p['lucro_estimado'])}")
        txt.append(f"    Risco: {p['risco']}%")
        txt.append(f"    Tempo: {p['tempo']} dias")
        txt.append("")
    
    txt.append("MÉTRICAS GERAIS:")
    txt.append(f"  Lucro Total: {format_currency_brl(resultado_ag['lucro_total'])}")
    txt.append(f"  Risco Médio: {resultado_ag['risco_medio']:.1f}%")
    txt.append(f"  Diversidade: {resultado_ag['diversidade']} cultura(s)")
    txt.append(f"  Fitness: {resultado_ag['fitness']:.2f}")
    txt.append("")
    txt.append("JUSTIFICATIVA:")
    objetivo_desc = get_objetivo_description(objetivo)
    txt.append(f"  O plano recomendado {objetivo_desc}.")
    txt.append("")
    
    if objetivo == "sustentavel":
        txt.append("  Sobre Sustentabilidade: Neste sistema, sustentabilidade considera")
        txt.append("  compatibilidade com o terreno, diversidade de culturas e uso adequado")
        txt.append("  dos recursos disponíveis.")
        txt.append("")
    
    txt.append("=" * 80)
    txt.append("")
    
    # 2. Características dos Talhões
    txt.append("2. CARACTERÍSTICAS DOS TALHÕES")
    txt.append("-" * 80)
    txt.append("")
    
    for _, talhao in talhoes.iterrows():
        txt.append(f"Talhão {talhao['id']}:")
        txt.append(f"  Área: {talhao['area']} hectares")
        txt.append(f"  Solo: {display_name(talhao['solo']).title()}")
        txt.append(f"  Clima: {display_name(talhao['clima']).title()}")
        txt.append(f"  Relevo: {display_name(talhao['relevo']).title()}")
        txt.append(f"  Disponibilidade de Água: {display_name(talhao['agua']).title()}")
        txt.append("")
    
    txt.append("=" * 80)
    txt.append("")
    
    # 3. Comparação de Cenários
    txt.append("3. COMPARAÇÃO DE CENÁRIOS")
    txt.append("-" * 80)
    txt.append("")
    
    objetivo_label = display_name(objetivo).title()
    txt.append(f"AG {objetivo_label}:")
    txt.append(f"  Lucro: {format_currency_brl(resultado_ag['lucro_total'])}")
    txt.append(f"  Risco: {resultado_ag['risco_medio']:.1f}%")
    txt.append("")
    
    ordem = ['equilibrado', 'maximo_lucro', 'baixo_risco', 'sustentavel', 'conservador']
    nomes = {
        'equilibrado': 'Equilibrado',
        'maximo_lucro': 'Máximo Lucro',
        'baixo_risco': 'Baixo Risco',
        'sustentavel': 'Sustentável',
        'conservador': 'Conservador'
    }
    
    for key in ordem:
        cenario = cenarios[key]
        txt.append(f"{nomes[key]}:")
        txt.append(f"  Lucro: {format_currency_brl(cenario['lucro_total'])}")
        txt.append(f"  Risco: {cenario['risco_medio']:.1f}%")
        txt.append("")
    
    txt.append("=" * 80)
    txt.append("")
    
    # 4. Resultado do Algoritmo Genético
    txt.append("4. RESULTADO DO ALGORITMO GENÉTICO")
    txt.append("-" * 80)
    txt.append("")
    txt.append("CONFIGURAÇÃO:")
    txt.append(f"  Objetivo: {display_name(objetivo).title()}")
    txt.append(f"  Gerações: {resultado_ag['geracoes']}")
    txt.append("  População: 50 indivíduos")
    txt.append(f"  Seed: {resultado_ag.get('seed', 'Não especificada')}")
    txt.append("")
    txt.append("RESULTADO:")
    txt.append(f"  Fitness Final: {resultado_ag['fitness']:.2f}")
    txt.append(f"  Lucro Total: {format_currency_brl(resultado_ag['lucro_total'])}")
    txt.append(f"  Risco Médio: {resultado_ag['risco_medio']:.1f}%")
    txt.append(f"  Diversidade: {resultado_ag['diversidade']} cultura(s)")
    txt.append("")
    txt.append("PLANO DETALHADO:")
    txt.append("")
    
    for p in resultado_ag['plano']:
        cultura_display = display_name(p['cultura']).upper()
        solo_display = display_name(p['solo']).title()
        clima_display = display_name(p['clima']).title()
        txt.append(f"Talhão {p['talhao']} ({p['area']} ha) - Solo {solo_display}, Clima {clima_display}")
        txt.append(f"  Cultura: {cultura_display}")
        txt.append(f"  Lucro: {format_currency_brl(p['lucro_estimado'])}")
        txt.append(f"  Risco: {p['risco']}%")
        txt.append(f"  Nota de compatibilidade: {p['nota']:.2f}")
        txt.append("")
    
    txt.append("=" * 80)
    txt.append("")
    
    # 5. Validação
    txt.append("5. VALIDAÇÃO DO ALGORITMO")
    txt.append("-" * 80)
    txt.append("")
    
    if validacao.get('erro'):
        # Força bruta inviável
        total_comb = validacao.get('total_combinacoes', 0)
        txt.append(f"Total de combinações possíveis: {total_comb:,}".replace(",", "."))
        txt.append("")
        txt.append("FORÇA BRUTA INVIÁVEL")
        txt.append("")
        txt.append(f"A busca exaustiva por força bruta foi considerada inviável neste conjunto,")
        txt.append(f"pois existem aproximadamente {total_comb:,} combinações possíveis.".replace(",", "."))
        txt.append("")
        txt.append("Por isso, a validação foi realizada por meio de:")
        txt.append("  - Múltiplas rodadas do Algoritmo Genético")
        txt.append("  - Análise de estabilidade estatística")
        txt.append("  - Comparação com cenários manuais")
        txt.append("")
        txt.append("Por que a força bruta é inviável?")
        txt.append("")
        txt.append(f"Com {len(talhoes)} talhões e {len(culturas)} culturas, o número de")
        txt.append("combinações cresce exponencialmente.")
        txt.append("")
        
        if total_comb >= 1_000_000_000:
            tempo_1m = total_comb / 1_000_000
            tempo_1b = total_comb / 1_000_000_000
            txt.append(f"Testar {total_comb:,} combinações levaria:".replace(",", "."))
            txt.append(f"  - 1 milhão/s: {format_duration(tempo_1m)}")
            txt.append(f"  - 1 bilhão/s: {format_duration(tempo_1b)}")
        else:
            txt.append(f"Testar {total_comb:,} combinações seria computacionalmente custoso.".replace(",", "."))
        
        txt.append("")
        txt.append("O Algoritmo Genético é a solução ideal para este cenário.")
        txt.append("")
    else:
        # Força bruta viável
        txt.append(f"Total de combinações testadas: {validacao['forca_bruta']['total_combinacoes']}")
        txt.append("")
        txt.append("MELHOR SOLUÇÃO POR FORÇA BRUTA:")
        for p in validacao['forca_bruta']['plano']:
            txt.append(f"  Talhão {p['talhao']}: {display_name(p['cultura']).title()}")
        txt.append(f"  Fitness: {validacao['forca_bruta']['melhor_fitness']:.2f}")
        txt.append(f"  Lucro: {format_currency_brl(validacao['forca_bruta']['lucro_total'])}")
        txt.append("")
        txt.append("MELHOR SOLUÇÃO PELO AG:")
        for p in validacao['ag']['plano']:
            txt.append(f"  Talhão {p['talhao']}: {display_name(p['cultura']).title()}")
        txt.append(f"  Fitness: {validacao['ag']['fitness']:.2f}")
        txt.append(f"  Lucro: {format_currency_brl(validacao['ag']['lucro_total'])}")
        txt.append("")
        
        if validacao['ag_encontrou_otimo_global']:
            txt.append("STATUS: O Algoritmo Genético encontrou o ótimo global!")
        else:
            txt.append("STATUS: O AG encontrou uma solução próxima, mas não o ótimo global.")
            txt.append(f"  Diferença de fitness: {validacao['diferenca_fitness']:.2f}")
        txt.append("")
    
    txt.append("=" * 80)
    txt.append("")
    
    # 6. Estabilidade
    txt.append("6. ESTABILIDADE DO ALGORITMO")
    txt.append("-" * 80)
    txt.append("")
    txt.append(f"Rodadas executadas: {estabilidade['rodadas']}")
    txt.append("")
    txt.append("ESTATÍSTICAS:")
    txt.append(f"  Melhor Fitness: {estabilidade['melhor_fitness']:.2f}")
    txt.append(f"  Fitness Médio: {estabilidade['fitness_medio']:.2f}")
    txt.append(f"  Pior Fitness: {estabilidade['pior_fitness']:.2f}")
    txt.append(f"  Desvio Padrão: {estabilidade['desvio_padrao']:.2f}")
    txt.append(f"  Coeficiente de Variação: {estabilidade['coeficiente_variacao']:.2f}%")
    txt.append("")
    estabilidade_label = display_name(estabilidade['estabilidade']).upper()
    txt.append(f"ESTABILIDADE: {estabilidade_label}")
    txt.append("")
    txt.append(estabilidade['estabilidade_descricao'])
    txt.append("")
    txt.append("=" * 80)
    txt.append("")
    
    # 7. Justificativa Agronômica
    txt.append("7. JUSTIFICATIVA AGRONÔMICA")
    txt.append("-" * 80)
    txt.append("")
    
    for p in resultado_ag['plano']:
        cultura_display = display_name(p['cultura']).upper()
        solo_display = display_name(p['solo'])
        clima_display = display_name(p['clima'])
        relevo_display = display_name(p['relevo'])
        agua_display = display_name(p['agua'])
        
        txt.append(f"Talhão {p['talhao']}: {cultura_display}")
        txt.append("")
        txt.append(f"Por que {display_name(p['cultura'])} foi escolhida para este talhão?")
        txt.append(f"  - Solo {solo_display}: Compatível com as necessidades da cultura")
        txt.append(f"  - Clima {clima_display}: Adequado para o desenvolvimento")
        txt.append(f"  - Relevo {relevo_display}: Favorável ao cultivo")
        txt.append(f"  - Água {agua_display}: Atende às necessidades hídricas")
        txt.append(f"  - Nota de compatibilidade: {p['nota']:.2f}/100")
        txt.append(f"  - Lucro estimado: {format_currency_brl(p['lucro_estimado'])}")
        txt.append(f"  - Risco: {p['risco']}%")
        txt.append("")
    
    txt.append("=" * 80)
    txt.append("")
    
    # 8. Limitações
    txt.append("8. LIMITAÇÕES DO SISTEMA")
    txt.append("-" * 80)
    txt.append("")
    txt.append("Este sistema fornece recomendações baseadas em dados e algoritmos,")
    txt.append("mas possui limitações:")
    txt.append("")
    txt.append("1. Dados Simulados: Os dados atuais são estimativas, não medições reais")
    txt.append("2. Modelo Simplificado: Não considera todos os fatores agronômicos")
    txt.append("3. Sem Análise Laboratorial: Não utiliza análise química e física do solo")
    txt.append("4. Dados Climáticos Regionais: O sistema já utiliza dados climáticos reais")
    txt.append("   via Open-Meteo, mas ainda trabalha em escala regional, sem análise")
    txt.append("   individualizada por polígono/talhão real")
    txt.append("5. Sem Preços de Mercado Reais: Ainda utiliza preços simulados, sem")
    txt.append("   integração com cotações oficiais como Conab/CEPEA")
    txt.append("6. Não Substitui Agrônomo: As recomendações devem ser validadas")
    txt.append("")
    txt.append("RECOMENDAÇÃO: Use este sistema como ferramenta de apoio à decisão,")
    txt.append("não como decisão final.")
    txt.append("")
    txt.append("=" * 80)
    txt.append("")
    
    # 9. Conclusão
    txt.append("9. CONCLUSÃO")
    txt.append("-" * 80)
    txt.append("")
    txt.append(f"O sistema AgroPlan AI recomenda o plano apresentado neste relatório")
    txt.append(f"com base no objetivo {display_name(objetivo)}.")
    txt.append("")
    
    if validacao.get('erro'):
        estabilidade_label = display_name(estabilidade['estabilidade'])
        txt.append(f"A solução foi validada por meio de múltiplas rodadas e apresenta")
        txt.append(f"estabilidade {estabilidade_label}.")
        txt.append("")
        total_comb_fmt = f"{validacao.get('total_combinacoes', 0):,}".replace(",", ".")
        txt.append(f"Com {total_comb_fmt} combinações possíveis, o Algoritmo Genético")
        txt.append("demonstra sua essencialidade para resolver problemas de planejamento")
        txt.append("agrícola em escala real.")
    else:
        estabilidade_label = display_name(estabilidade['estabilidade'])
        txt.append(f"A solução foi validada por força bruta e apresenta estabilidade")
        txt.append(f"{estabilidade_label}.")
    
    txt.append("")
    txt.append("PRÓXIMOS PASSOS SUGERIDOS:")
    txt.append("1. Validar recomendações com agrônomo")
    txt.append("2. Considerar fatores locais não modelados")
    txt.append("3. Ajustar conforme disponibilidade de recursos")
    txt.append("4. Monitorar resultados para melhorias futuras")
    txt.append("")
    txt.append("=" * 80)
    txt.append("")
    txt.append("*Relatório gerado automaticamente pelo AgroPlan AI*")
    
    return "\n".join(txt)
