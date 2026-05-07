from core.terrain_analyzer import analisar_todos_talhoes
from core.scenario_simulator import simular_cenarios
from core.genetic_optimizer import otimizar_plano_genetico

def gerar_plano_inteligente(culturas, talhoes, regras):
    """
    Gera um plano de plantio inteligente usando análise de terreno
    
    Em vez de escolher culturas aleatoriamente, analisa as características
    de cada talhão e recomenda a cultura mais adequada com base em:
    - Compatibilidade de solo
    - Compatibilidade de clima
    - Compatibilidade de relevo
    - Disponibilidade de água
    - Lucro estimado
    - Risco
    """
    # Analisa todos os talhões
    analises = analisar_todos_talhoes(talhoes, culturas, regras)
    
    plano = []
    
    for analise in analises:
        talhao = analise['talhao']
        melhor = analise['melhor_cultura']
        ranking = analise['ranking']
        justificativa = analise['justificativa']
        
        if melhor:
            plano.append({
                'talhao': talhao['id'],
                'area': talhao['area'],
                'solo': talhao['solo'],
                'clima': talhao['clima'],
                'relevo': talhao['relevo'],
                'agua': talhao['agua'],
                'cultura_recomendada': melhor['cultura'],
                'nota': melhor['nota'],
                'lucro_estimado': melhor['lucro_total'],
                'risco': melhor['risco'],
                'tempo': melhor['tempo'],
                'ranking': ranking,
                'justificativa': justificativa
            })
    
    return plano


def gerar_cenarios(culturas, talhoes, regras):
    """
    Gera múltiplos cenários de planejamento para comparação
    
    Retorna diferentes estratégias:
    - Equilibrado
    - Máximo Lucro
    - Baixo Risco
    - Sustentável
    - Conservador
    """
    return simular_cenarios(culturas, talhoes, regras)


def gerar_plano_genetico(culturas, talhoes, regras, objetivo='equilibrado', geracoes=100, populacao=50, seed=None):
    """
    Gera plano otimizado usando Algoritmo Genético
    
    Args:
        culturas: DataFrame com culturas
        talhoes: DataFrame com talhões
        regras: DataFrame com regras
        objetivo: 'equilibrado', 'lucro', 'risco' ou 'sustentavel'
        geracoes: número de gerações do AG
        populacao: tamanho da população
        seed: seed para reprodutibilidade
    
    Returns:
        Dicionário com plano otimizado
    """
    return otimizar_plano_genetico(culturas, talhoes, regras, objetivo, geracoes, populacao, seed)
