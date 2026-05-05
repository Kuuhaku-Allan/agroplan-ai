"""
Sistema de pontuação para avaliar compatibilidade entre culturas e talhões
"""

def calcular_compatibilidade_solo(solo_talhao, solos_ideais):
    """Calcula compatibilidade do solo (0-25 pontos)"""
    solos = [s.strip() for s in solos_ideais.split(';')]
    return 25 if solo_talhao in solos else 0


def calcular_compatibilidade_clima(clima_talhao, climas_ideais):
    """Calcula compatibilidade do clima (0-25 pontos)"""
    climas = [c.strip() for c in climas_ideais.split(';')]
    return 25 if clima_talhao in climas else 0


def calcular_compatibilidade_relevo(relevo_talhao, relevos_ideais):
    """Calcula compatibilidade do relevo (0-15 pontos)"""
    relevos = [r.strip() for r in relevos_ideais.split(';')]
    return 15 if relevo_talhao in relevos else 0


def calcular_compatibilidade_agua(agua_talhao, agua_necessaria):
    """Calcula compatibilidade da disponibilidade de água (0-15 pontos)"""
    # Mapeamento de níveis
    niveis = {'baixa': 1, 'media': 2, 'alta': 3}
    
    nivel_talhao = niveis.get(agua_talhao, 0)
    nivel_necessario = niveis.get(agua_necessaria, 0)
    
    # Pontuação máxima se atende ou excede a necessidade
    if nivel_talhao >= nivel_necessario:
        return 15
    # Penalidade se não atende
    elif nivel_talhao == nivel_necessario - 1:
        return 8
    else:
        return 0


def calcular_lucro_por_hectare(cultura):
    """Calcula lucro estimado por hectare"""
    return (cultura['preco'] * cultura['produtividade']) - cultura['custo']


def normalizar_lucro(lucro, lucro_min, lucro_max):
    """Normaliza lucro para escala 0-10"""
    if lucro_max == lucro_min:
        return 5
    return 10 * (lucro - lucro_min) / (lucro_max - lucro_min)


def calcular_nota_final(talhao, cultura, regra, lucro_normalizado):
    """
    Calcula nota final da cultura para o talhão
    
    Componentes:
    - Solo: 0-25 pontos
    - Clima: 0-25 pontos
    - Relevo: 0-15 pontos
    - Água: 0-15 pontos
    - Lucro: 0-10 pontos
    - Risco: -risco_base pontos
    
    Total máximo: 90 pontos (antes do risco)
    """
    nota = 0
    
    # Compatibilidades
    nota += calcular_compatibilidade_solo(talhao['solo'], regra['solos_ideais'])
    nota += calcular_compatibilidade_clima(talhao['clima'], regra['climas_ideais'])
    nota += calcular_compatibilidade_relevo(talhao['relevo'], regra['relevo_ideal'])
    nota += calcular_compatibilidade_agua(talhao['agua'], regra['agua_necessaria'])
    
    # Lucro normalizado
    nota += lucro_normalizado
    
    # Penalidade por risco
    nota -= (regra['risco_base'] / 10)
    
    return round(nota, 2)


def avaliar_cultura_para_talhao(talhao, cultura, regra, lucro_normalizado):
    """Avalia uma cultura específica para um talhão e retorna detalhes completos"""
    lucro_por_ha = calcular_lucro_por_hectare(cultura)
    lucro_total = lucro_por_ha * talhao['area']
    nota = calcular_nota_final(talhao, cultura, regra, lucro_normalizado)
    
    return {
        'cultura': cultura['nome'],
        'nota': nota,
        'lucro_por_ha': lucro_por_ha,
        'lucro_total': lucro_total,
        'risco': regra['risco_base'],
        'tempo': cultura['tempo'],
        'compatibilidade_solo': calcular_compatibilidade_solo(talhao['solo'], regra['solos_ideais']),
        'compatibilidade_clima': calcular_compatibilidade_clima(talhao['clima'], regra['climas_ideais']),
        'compatibilidade_relevo': calcular_compatibilidade_relevo(talhao['relevo'], regra['relevo_ideal']),
        'compatibilidade_agua': calcular_compatibilidade_agua(talhao['agua'], regra['agua_necessaria'])
    }
