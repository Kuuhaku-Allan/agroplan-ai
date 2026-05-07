"""
Simulador de cenários para comparar diferentes estratégias de planejamento agrícola
"""

from core.terrain_analyzer import analisar_todos_talhoes


def calcular_metricas_plano(plano):
    """Calcula métricas agregadas de um plano"""
    lucro_total = sum(p['lucro_estimado'] for p in plano)
    area_total = sum(p['area'] for p in plano)
    risco_ponderado = sum(p['risco'] * p['area'] for p in plano)
    risco_medio = risco_ponderado / area_total if area_total > 0 else 0
    
    return {
        'lucro_total': lucro_total,
        'area_total': area_total,
        'risco_medio': risco_medio
    }


def gerar_cenario_equilibrado(analises):
    """
    Cenário Equilibrado: Escolhe a cultura com maior nota_final
    Melhor equilíbrio entre lucro, compatibilidade e risco
    """
    plano = []
    
    for analise in analises:
        talhao = analise['talhao']
        melhor = analise['melhor_cultura']  # Já é a de maior nota
        
        if melhor:
            plano.append({
                'talhao': talhao['id'],
                'area': talhao['area'],
                'cultura': melhor['cultura'],
                'lucro_estimado': melhor['lucro_total'],
                'risco': melhor['risco'],
                'nota': melhor['nota']
            })
    
    metricas = calcular_metricas_plano(plano)
    
    return {
        'nome': 'Equilibrado',
        'descricao': 'Melhor equilíbrio entre lucro, compatibilidade e risco.',
        'plano': plano,
        **metricas
    }


def gerar_cenario_maximo_lucro(analises):
    """
    Cenário Máximo Lucro: Prioriza lucro_estimado
    O risco pode ser maior, mas ainda aparece no relatório
    """
    plano = []
    
    for analise in analises:
        talhao = analise['talhao']
        ranking = analise['ranking']
        
        # Escolhe a cultura com maior lucro
        melhor_lucro = max(ranking, key=lambda x: x['lucro_total'])
        
        plano.append({
            'talhao': talhao['id'],
            'area': talhao['area'],
            'cultura': melhor_lucro['cultura'],
            'lucro_estimado': melhor_lucro['lucro_total'],
            'risco': melhor_lucro['risco'],
            'nota': melhor_lucro['nota']
        })
    
    metricas = calcular_metricas_plano(plano)
    
    return {
        'nome': 'Máximo Lucro',
        'descricao': 'Prioriza o maior retorno financeiro estimado.',
        'plano': plano,
        **metricas
    }


def gerar_cenario_baixo_risco(analises):
    """
    Cenário Baixo Risco: Prioriza culturas com menor risco
    Em caso de empate, escolhe maior nota_final
    """
    plano = []
    
    for analise in analises:
        talhao = analise['talhao']
        ranking = analise['ranking']
        
        # Ordena por risco (crescente) e depois por nota (decrescente)
        ranking_ordenado = sorted(ranking, key=lambda x: (x['risco'], -x['nota']))
        melhor_baixo_risco = ranking_ordenado[0]
        
        plano.append({
            'talhao': talhao['id'],
            'area': talhao['area'],
            'cultura': melhor_baixo_risco['cultura'],
            'lucro_estimado': melhor_baixo_risco['lucro_total'],
            'risco': melhor_baixo_risco['risco'],
            'nota': melhor_baixo_risco['nota']
        })
    
    metricas = calcular_metricas_plano(plano)
    
    return {
        'nome': 'Baixo Risco',
        'descricao': 'Prioriza segurança e menor exposição a perdas.',
        'plano': plano,
        **metricas
    }


def gerar_cenario_sustentavel(analises):
    """
    Cenário Sustentável: Prioriza boa compatibilidade com solo, água e risco menor
    Não escolhe apenas pelo lucro
    """
    plano = []
    
    for analise in analises:
        talhao = analise['talhao']
        ranking = analise['ranking']
        
        # Calcula score de sustentabilidade
        # Prioriza compatibilidades altas e risco baixo
        def score_sustentavel(cultura):
            compatibilidade = (
                cultura['compatibilidade_solo'] +
                cultura['compatibilidade_clima'] +
                cultura['compatibilidade_agua']
            )
            # Penaliza risco mais fortemente
            return compatibilidade - (cultura['risco'] / 5)
        
        melhor_sustentavel = max(ranking, key=score_sustentavel)
        
        plano.append({
            'talhao': talhao['id'],
            'area': talhao['area'],
            'cultura': melhor_sustentavel['cultura'],
            'lucro_estimado': melhor_sustentavel['lucro_total'],
            'risco': melhor_sustentavel['risco'],
            'nota': melhor_sustentavel['nota']
        })
    
    metricas = calcular_metricas_plano(plano)
    
    return {
        'nome': 'Sustentável',
        'descricao': 'Prioriza compatibilidade ambiental e uso eficiente de recursos.',
        'plano': plano,
        **metricas
    }


def gerar_cenario_conservador(analises):
    """
    Cenário Conservador: Evita culturas com risco alto
    Escolhe opções com boa nota e risco controlado
    """
    plano = []
    
    for analise in analises:
        talhao = analise['talhao']
        ranking = analise['ranking']
        
        # Filtra culturas com risco <= 30%, se possível
        ranking_baixo_risco = [c for c in ranking if c['risco'] <= 30]
        
        # Se não houver opções de baixo risco, usa todas
        if not ranking_baixo_risco:
            ranking_baixo_risco = ranking
        
        # Entre as de baixo risco, escolhe a de maior nota
        melhor_conservador = max(ranking_baixo_risco, key=lambda x: x['nota'])
        
        plano.append({
            'talhao': talhao['id'],
            'area': talhao['area'],
            'cultura': melhor_conservador['cultura'],
            'lucro_estimado': melhor_conservador['lucro_total'],
            'risco': melhor_conservador['risco'],
            'nota': melhor_conservador['nota']
        })
    
    metricas = calcular_metricas_plano(plano)
    
    return {
        'nome': 'Conservador',
        'descricao': 'Evita riscos altos, priorizando segurança e estabilidade.',
        'plano': plano,
        **metricas
    }


def simular_cenarios(culturas, talhoes, regras):
    """
    Simula diferentes cenários de planejamento agrícola
    
    Retorna um dicionário com todos os cenários e suas métricas
    """
    # Analisa todos os talhões uma única vez
    analises = analisar_todos_talhoes(talhoes, culturas, regras)
    
    # Gera todos os cenários
    cenarios = {
        'equilibrado': gerar_cenario_equilibrado(analises),
        'maximo_lucro': gerar_cenario_maximo_lucro(analises),
        'baixo_risco': gerar_cenario_baixo_risco(analises),
        'sustentavel': gerar_cenario_sustentavel(analises),
        'conservador': gerar_cenario_conservador(analises)
    }
    
    return cenarios


def recomendar_melhor_cenario(cenarios):
    """
    Recomenda o melhor cenário baseado em critérios balanceados
    
    Considera:
    - Lucro razoável (não necessariamente o máximo)
    - Risco controlado
    - Equilíbrio geral
    """
    # Por padrão, recomenda o equilibrado
    melhor = 'equilibrado'
    
    # Mas verifica se há cenários melhores
    equilibrado = cenarios['equilibrado']
    baixo_risco = cenarios['baixo_risco']
    
    # Se o baixo risco tem lucro muito próximo (>90%) e risco menor, prefere ele
    if baixo_risco['lucro_total'] >= equilibrado['lucro_total'] * 0.9:
        if baixo_risco['risco_medio'] < equilibrado['risco_medio']:
            melhor = 'baixo_risco'
    
    justificativa = gerar_justificativa_recomendacao(cenarios, melhor)
    
    return {
        'cenario': melhor,
        'justificativa': justificativa
    }


def gerar_justificativa_recomendacao(cenarios, cenario_escolhido):
    """Gera justificativa para a recomendação do cenário"""
    cenario = cenarios[cenario_escolhido]
    
    justificativas = {
        'equilibrado': (
            f"O cenário {cenario['nome']} foi recomendado porque apresenta "
            f"bom lucro estimado (R$ {cenario['lucro_total']:,.2f}), "
            f"risco controlado ({cenario['risco_medio']:.1f}%) e "
            f"alta compatibilidade entre culturas e características dos talhões."
        ),
        'baixo_risco': (
            f"O cenário {cenario['nome']} foi recomendado porque oferece "
            f"excelente segurança com risco médio de apenas {cenario['risco_medio']:.1f}%, "
            f"mantendo lucro razoável de R$ {cenario['lucro_total']:,.2f}."
        ),
        'maximo_lucro': (
            f"O cenário {cenario['nome']} foi recomendado porque maximiza "
            f"o retorno financeiro (R$ {cenario['lucro_total']:,.2f}), "
            f"com risco aceitável de {cenario['risco_medio']:.1f}%."
        ),
        'sustentavel': (
            f"O cenário {cenario['nome']} foi recomendado porque prioriza "
            f"compatibilidade ambiental e uso eficiente de recursos, "
            f"com lucro de R$ {cenario['lucro_total']:,.2f} e risco de {cenario['risco_medio']:.1f}%."
        ),
        'conservador': (
            f"O cenário {cenario['nome']} foi recomendado porque evita "
            f"riscos altos, mantendo risco médio de {cenario['risco_medio']:.1f}% "
            f"e lucro de R$ {cenario['lucro_total']:,.2f}."
        )
    }
    
    return justificativas.get(cenario_escolhido, "Cenário recomendado pelo sistema.")
