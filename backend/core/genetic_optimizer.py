"""
Otimizador de plantio usando Algoritmo Genético (PyGAD)
"""

import pygad
import numpy as np
from core.terrain_analyzer import analisar_todos_talhoes
from core.scorer import calcular_lucro_por_hectare


# Configurações de pesos por objetivo
PESOS_OBJETIVOS = {
    'equilibrado': {
        'lucro': 0.40,
        'compatibilidade': 0.30,
        'seguranca': 0.20,
        'diversidade': 0.10
    },
    'lucro': {
        'lucro': 0.60,
        'compatibilidade': 0.20,
        'seguranca': 0.10,
        'diversidade': 0.10
    },
    'risco': {
        'lucro': 0.20,
        'compatibilidade': 0.30,
        'seguranca': 0.40,
        'diversidade': 0.10
    },
    'sustentavel': {
        'lucro': 0.20,
        'compatibilidade': 0.40,
        'seguranca': 0.20,
        'diversidade': 0.20
    }
}


def criar_funcao_fitness(analises, culturas, objetivo='equilibrado'):
    """
    Cria a função fitness para o Algoritmo Genético
    
    A função avalia cada solução (combinação de culturas) considerando:
    - Lucro total
    - Compatibilidade com terreno
    - Risco
    - Diversidade de culturas
    - Penalidades agronômicas
    """
    pesos = PESOS_OBJETIVOS.get(objetivo, PESOS_OBJETIVOS['equilibrado'])
    
    # Calcula valores máximos para normalização
    todos_lucros = []
    todas_notas = []
    
    for analise in analises:
        for cultura in analise['ranking']:
            todos_lucros.append(cultura['lucro_total'])
            todas_notas.append(cultura['nota'])
    
    lucro_max = max(todos_lucros) if todos_lucros else 1
    lucro_min = min(todos_lucros) if todos_lucros else 0
    nota_max = max(todas_notas) if todas_notas else 1
    
    def fitness_func(ga_instance, solution, solution_idx):
        """
        Calcula fitness de uma solução
        
        solution: array de índices de culturas, ex: [0, 1, 1]
        """
        lucro_total = 0
        notas_total = 0
        area_total = 0
        risco_ponderado = 0
        culturas_usadas = set()
        penalidades = 0
        
        # Avalia cada talhão
        for i, gene in enumerate(solution):
            analise = analises[i]
            talhao = analise['talhao']
            ranking = analise['ranking']
            
            # Gene representa índice da cultura no ranking
            cultura_idx = int(gene) % len(ranking)
            cultura = ranking[cultura_idx]
            
            # Acumula métricas
            lucro_total += cultura['lucro_total']
            notas_total += cultura['nota']
            area_total += talhao['area']
            risco_ponderado += cultura['risco'] * talhao['area']
            culturas_usadas.add(cultura['cultura'])
            
            # PENALIDADES
            
            # 1. Compatibilidade geral baixa (nota < 60)
            if cultura['nota'] < 60:
                penalidades += 15
            
            # 2. Água insuficiente (alta necessidade + baixa disponibilidade)
            if cultura['compatibilidade_agua'] == 0:
                penalidades += 20
            
            # 3. Solo incompatível
            if cultura['compatibilidade_solo'] == 0:
                penalidades += 10
            
            # 4. Clima incompatível
            if cultura['compatibilidade_clima'] == 0:
                penalidades += 10
        
        # Calcula métricas agregadas
        risco_medio = risco_ponderado / area_total if area_total > 0 else 0
        nota_media = notas_total / len(solution) if len(solution) > 0 else 0
        
        # PENALIDADES GLOBAIS
        
        # 5. Monocultura (mesma cultura em todos os talhões)
        if len(culturas_usadas) == 1:
            penalidades += 25
        
        # 6. Risco muito alto (> 45%)
        if risco_medio > 45:
            penalidades += 20
        
        # 7. Nota média muito baixa (< 70)
        if nota_media < 70:
            penalidades += 10
        
        # NORMALIZAÇÃO DOS COMPONENTES (todos entre 0-100)
        
        # Lucro normalizado (0-100)
        if lucro_max > lucro_min:
            lucro_normalizado = min(100 * (lucro_total - lucro_min) / (lucro_max - lucro_min), 100)
        else:
            lucro_normalizado = 50
        
        # Compatibilidade normalizada (0-100)
        compatibilidade_normalizada = min((nota_media / nota_max) * 100 if nota_max > 0 else 50, 100)
        
        # Segurança (inverso do risco, 0-100)
        seguranca = min(max(0, 100 - risco_medio), 100)
        
        # Diversidade (0-100)
        max_diversidade = len(solution)
        diversidade = min((len(culturas_usadas) / max_diversidade) * 100 if max_diversidade > 0 else 0, 100)
        
        # CÁLCULO DO FITNESS
        fitness = (
            lucro_normalizado * pesos['lucro'] +
            compatibilidade_normalizada * pesos['compatibilidade'] +
            seguranca * pesos['seguranca'] +
            diversidade * pesos['diversidade']
        ) - penalidades
        
        return max(0, fitness)  # Garante que fitness não seja negativo
    
    return fitness_func


def otimizar_plano_genetico(culturas, talhoes, regras, objetivo='equilibrado', geracoes=100, populacao=50, seed=None):
    """
    Otimiza o plano de plantio usando Algoritmo Genético
    
    Args:
        culturas: DataFrame com culturas disponíveis
        talhoes: DataFrame com talhões
        regras: DataFrame com regras de cultivo
        objetivo: 'equilibrado', 'lucro', 'risco' ou 'sustentavel'
        geracoes: número de gerações do AG
        populacao: tamanho da população
        seed: seed para reprodutibilidade (opcional)
    
    Returns:
        Dicionário com plano otimizado e métricas
    """
    # Analisa todos os talhões
    analises = analisar_todos_talhoes(talhoes, culturas, regras)
    
    # Número de genes = número de talhões
    num_genes = len(analises)
    
    # Cada gene pode ter valor de 0 até (número de culturas - 1)
    # Usamos o tamanho do ranking como limite
    gene_space = []
    for analise in analises:
        num_culturas = len(analise['ranking'])
        gene_space.append(range(num_culturas))
    
    # Cria função fitness
    fitness_function = criar_funcao_fitness(analises, culturas, objetivo)
    
    # Define seed se fornecida
    random_seed = seed if seed is not None else None
    
    # Lista para armazenar histórico de fitness
    historico_fitness = []
    
    def on_generation(ga_instance):
        """Callback chamado a cada geração para salvar histórico"""
        geracao = ga_instance.generations_completed
        melhor_fitness = ga_instance.best_solution()[1]
        fitness_medio = np.mean(ga_instance.last_generation_fitness)
        historico_fitness.append({
            'geracao': geracao,
            'melhor_fitness': melhor_fitness,
            'fitness_medio': fitness_medio
        })
    
    # Configura o Algoritmo Genético
    ga_instance = pygad.GA(
        num_generations=geracoes,
        num_parents_mating=max(2, populacao // 4),
        fitness_func=fitness_function,
        sol_per_pop=populacao,
        num_genes=num_genes,
        gene_space=gene_space,
        gene_type=int,
        parent_selection_type="sss",  # Steady-state selection
        keep_parents=2,
        crossover_type="single_point",
        mutation_type="random",
        mutation_percent_genes=20,
        random_seed=random_seed,
        on_generation=on_generation
    )
    
    # Executa o AG
    ga_instance.run()
    
    # Obtém a melhor solução
    solution, solution_fitness, solution_idx = ga_instance.best_solution()
    
    # Constrói o plano a partir da solução
    plano = []
    lucro_total = 0
    area_total = 0
    risco_ponderado = 0
    culturas_usadas = set()
    
    for i, gene in enumerate(solution):
        analise = analises[i]
        talhao = analise['talhao']
        ranking = analise['ranking']
        
        cultura_idx = int(gene) % len(ranking)
        cultura = ranking[cultura_idx]
        
        plano.append({
            'talhao': talhao['id'],
            'area': talhao['area'],
            'solo': talhao['solo'],
            'clima': talhao['clima'],
            'relevo': talhao['relevo'],
            'agua': talhao['agua'],
            'cultura': cultura['cultura'],
            'lucro_estimado': cultura['lucro_total'],
            'risco': cultura['risco'],
            'nota': cultura['nota'],
            'tempo': cultura['tempo']
        })
        
        lucro_total += cultura['lucro_total']
        area_total += talhao['area']
        risco_ponderado += cultura['risco'] * talhao['area']
        culturas_usadas.add(cultura['cultura'])
    
    risco_medio = risco_ponderado / area_total if area_total > 0 else 0
    
    # Gera justificativa
    justificativa = gerar_justificativa_ag(objetivo, lucro_total, risco_medio, len(culturas_usadas), solution_fitness)
    
    return {
        'plano': plano,
        'lucro_total': lucro_total,
        'risco_medio': risco_medio,
        'area_total': area_total,
        'fitness': solution_fitness,
        'geracoes': geracoes,
        'objetivo': objetivo,
        'diversidade': len(culturas_usadas),
        'justificativa': justificativa,
        'historico_fitness': historico_fitness,
        'seed': seed
    }


def gerar_justificativa_ag(objetivo, lucro, risco, diversidade, fitness):
    """Gera justificativa para o plano otimizado pelo AG"""
    
    justificativas_base = {
        'equilibrado': (
            f"O algoritmo genético encontrou um plano equilibrado entre lucro, risco e "
            f"compatibilidade do terreno. A solução mantém alto retorno financeiro "
            f"(R$ {lucro:,.2f}) sem ultrapassar níveis críticos de risco ({risco:.1f}%). "
        ),
        'lucro': (
            f"O algoritmo genético priorizou maximização de lucro, encontrando uma solução "
            f"com retorno de R$ {lucro:,.2f}. O risco médio de {risco:.1f}% foi considerado "
            f"aceitável para este objetivo. "
        ),
        'risco': (
            f"O algoritmo genético priorizou segurança, mantendo o risco médio em apenas "
            f"{risco:.1f}%. O lucro de R$ {lucro:,.2f} foi otimizado dentro das restrições "
            f"de baixo risco. "
        ),
        'sustentavel': (
            f"O algoritmo genético priorizou compatibilidade ambiental e uso eficiente de "
            f"recursos. A solução alcançou lucro de R$ {lucro:,.2f} com risco de {risco:.1f}%, "
            f"mantendo alta compatibilidade com as características dos talhões. "
        )
    }
    
    justificativa = justificativas_base.get(objetivo, justificativas_base['equilibrado'])
    
    # Adiciona informação sobre diversidade
    if diversidade == 1:
        justificativa += "Nota: O plano utiliza apenas uma cultura (monocultura)."
    elif diversidade == 2:
        justificativa += f"O plano utiliza {diversidade} culturas diferentes, oferecendo alguma diversificação."
    else:
        justificativa += f"O plano utiliza {diversidade} culturas diferentes, oferecendo boa diversificação."
    
    justificativa += f" Fitness final: {fitness:.2f}."
    
    return justificativa
