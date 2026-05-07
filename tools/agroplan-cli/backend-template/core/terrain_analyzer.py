"""
Analisador de terreno que avalia e recomenda culturas para cada talhão
"""

from core.scorer import calcular_lucro_por_hectare, normalizar_lucro, avaliar_cultura_para_talhao


def analisar_talhao(talhao, culturas, regras):
    """
    Analisa um talhão e retorna ranking de culturas recomendadas
    
    Retorna:
    - ranking: lista de culturas ordenadas por nota
    - melhor_cultura: cultura com maior nota
    - justificativa: texto explicando a recomendação
    """
    avaliacoes = []
    
    # Calcula lucro de todas as culturas para normalização
    lucros = []
    for _, cultura in culturas.iterrows():
        lucro = calcular_lucro_por_hectare(cultura)
        lucros.append(lucro)
    
    lucro_min = min(lucros)
    lucro_max = max(lucros)
    
    # Avalia cada cultura para este talhão
    for _, cultura in culturas.iterrows():
        # Busca regras da cultura
        regra = regras[regras['cultura'] == cultura['nome']]
        
        if regra.empty:
            continue
        
        regra = regra.iloc[0]
        
        # Calcula lucro normalizado
        lucro = calcular_lucro_por_hectare(cultura)
        lucro_normalizado = normalizar_lucro(lucro, lucro_min, lucro_max)
        
        # Avalia cultura
        avaliacao = avaliar_cultura_para_talhao(talhao, cultura, regra, lucro_normalizado)
        avaliacoes.append(avaliacao)
    
    # Ordena por nota (decrescente)
    ranking = sorted(avaliacoes, key=lambda x: x['nota'], reverse=True)
    
    # Melhor cultura
    melhor = ranking[0] if ranking else None
    
    # Gera justificativa
    justificativa = gerar_justificativa(talhao, melhor)
    
    return {
        'ranking': ranking,
        'melhor_cultura': melhor,
        'justificativa': justificativa
    }


def gerar_justificativa(talhao, avaliacao):
    """Gera texto explicando por que a cultura foi recomendada"""
    if not avaliacao:
        return "Nenhuma cultura compatível encontrada."
    
    cultura = avaliacao['cultura']
    pontos_fortes = []
    pontos_fracos = []
    
    # Analisa compatibilidades
    if avaliacao['compatibilidade_solo'] == 25:
        pontos_fortes.append(f"solo {talhao['solo']}")
    elif avaliacao['compatibilidade_solo'] == 0:
        pontos_fracos.append(f"solo {talhao['solo']} não é ideal")
    
    if avaliacao['compatibilidade_clima'] == 25:
        pontos_fortes.append(f"clima {talhao['clima']}")
    elif avaliacao['compatibilidade_clima'] == 0:
        pontos_fracos.append(f"clima {talhao['clima']} não é ideal")
    
    if avaliacao['compatibilidade_relevo'] == 15:
        pontos_fortes.append(f"relevo {talhao['relevo']}")
    elif avaliacao['compatibilidade_relevo'] == 0:
        pontos_fracos.append(f"relevo {talhao['relevo']} não é ideal")
    
    if avaliacao['compatibilidade_agua'] == 15:
        pontos_fortes.append(f"disponibilidade {talhao['agua']} de água")
    elif avaliacao['compatibilidade_agua'] < 15:
        if avaliacao['compatibilidade_agua'] == 0:
            pontos_fracos.append("disponibilidade de água insuficiente")
        else:
            pontos_fracos.append("disponibilidade de água abaixo do ideal")
    
    # Monta justificativa
    texto = f"A cultura {cultura} foi recomendada porque "
    
    if pontos_fortes:
        texto += f"apresenta alta compatibilidade com {', '.join(pontos_fortes)}"
    
    if pontos_fracos:
        if pontos_fortes:
            texto += f", apesar de {', '.join(pontos_fracos)}"
        else:
            texto += f"é a melhor opção disponível, embora {', '.join(pontos_fracos)}"
    
    # Adiciona informação sobre lucro e risco
    texto += f". Oferece lucro estimado de R$ {avaliacao['lucro_total']:,.2f} "
    texto += f"com risco de {avaliacao['risco']}% e ciclo de {avaliacao['tempo']} dias."
    
    return texto


def analisar_todos_talhoes(talhoes, culturas, regras):
    """Analisa todos os talhões e retorna recomendações completas"""
    analises = []
    
    for _, talhao in talhoes.iterrows():
        analise = analisar_talhao(talhao, culturas, regras)
        analise['talhao'] = talhao
        analises.append(analise)
    
    return analises
