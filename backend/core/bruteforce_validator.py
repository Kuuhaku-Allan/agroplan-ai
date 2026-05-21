"""
Validador por força bruta para comparar com o Algoritmo Genético
"""

import itertools
from core.terrain_analyzer import analisar_todos_talhoes
from core.genetic_optimizer import criar_funcao_fitness


def _to_float(value, default=0.0):
    try:
        return float(value)
    except Exception:
        return default


def _limpar_tipos_python(value):
    if isinstance(value, dict):
        return {k: _limpar_tipos_python(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_limpar_tipos_python(item) for item in value]
    if isinstance(value, tuple):
        return tuple(_limpar_tipos_python(item) for item in value)
    if hasattr(value, "item"):
        try:
            return value.item()
        except Exception:
            return value
    return value


def validar_por_forca_bruta(culturas, talhoes, regras, objetivo='equilibrado'):
    """
    Testa todas as combinações possíveis de culturas por talhão
    
    Útil para validar o AG em conjuntos pequenos de dados.
    
    Args:
        culturas: DataFrame com culturas
        talhoes: DataFrame com talhões
        regras: DataFrame com regras
        objetivo: 'equilibrado', 'lucro', 'risco' ou 'sustentavel'
    
    Returns:
        Dicionário com melhor solução encontrada
    """
    # Analisa todos os talhões
    analises = analisar_todos_talhoes(talhoes, culturas, regras)
    
    # Cria função fitness
    fitness_function = criar_funcao_fitness(analises, culturas, objetivo)
    
    # Gera todas as combinações possíveis
    # Cada talhão pode ter qualquer cultura do seu ranking
    espacos_genes = []
    for analise in analises:
        num_culturas = len(analise['ranking'])
        espacos_genes.append(range(num_culturas))
    
    # Calcula total de combinações
    total_combinacoes = 1
    for espaco in espacos_genes:
        total_combinacoes *= len(espaco)
    
    # Se for muito grande, retorna aviso
    if total_combinacoes > 10000:
        return {
            'erro': True,
            'mensagem': f'Número de combinações muito grande ({total_combinacoes}). Força bruta não é viável.',
            'total_combinacoes': total_combinacoes
        }
    
    # Testa todas as combinações
    melhor_solucao = None
    melhor_fitness = -float('inf')
    melhor_plano = None
    
    for combinacao in itertools.product(*espacos_genes):
        # Calcula fitness desta combinação
        fitness = fitness_function(None, list(combinacao), 0)
        
        if fitness > melhor_fitness:
            melhor_fitness = fitness
            melhor_solucao = list(combinacao)
    
    # Constrói o plano da melhor solução
    plano = []
    lucro_total = 0
    area_total = 0
    risco_ponderado = 0
    culturas_usadas = set()
    
    for i, gene in enumerate(melhor_solucao):
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
    
    return {
        'erro': False,
        'plano': plano,
        'melhor_fitness': melhor_fitness,
        'total_combinacoes': total_combinacoes,
        'lucro_total': lucro_total,
        'risco_medio': risco_medio,
        'area_total': area_total,
        'diversidade': len(culturas_usadas),
        'objetivo': objetivo,
        'solucao': melhor_solucao
    }


def comparar_ag_com_forca_bruta(culturas, talhoes, regras, objetivo='equilibrado', seed=42):
    """
    Compara resultado do AG com força bruta
    
    Args:
        culturas: DataFrame com culturas
        talhoes: DataFrame com talhões
        regras: DataFrame com regras
        objetivo: objetivo do AG
        seed: seed para reprodutibilidade do AG
    
    Returns:
        Dicionário com comparação
    """
    from core.genetic_optimizer import otimizar_plano_genetico
    
    # Executa força bruta
    print("   Testando todas as combinações possíveis...")
    resultado_fb = validar_por_forca_bruta(culturas, talhoes, regras, objetivo)
    
    if resultado_fb.get('erro'):
        return resultado_fb
    
    # Executa AG
    print("   Executando Algoritmo Genético...")
    resultado_ag = otimizar_plano_genetico(culturas, talhoes, regras, objetivo, seed=seed)
    
    # Compara resultados
    ag_encontrou_otimo = abs(resultado_ag['fitness'] - resultado_fb['melhor_fitness']) < 0.01
    diferenca_fitness = resultado_ag['fitness'] - resultado_fb['melhor_fitness']
    diferenca_lucro = resultado_ag['lucro_total'] - resultado_fb['lucro_total']
    
    # Gera análise
    if ag_encontrou_otimo:
        analise = (
            "✅ O Algoritmo Genético encontrou o ótimo global neste conjunto de dados. "
            f"Como o conjunto atual possui apenas {resultado_fb['total_combinacoes']} combinações, "
            "a força bruta ainda é viável. Porém, em cenários maiores, como 10 talhões e 8 culturas, "
            "seriam mais de 1 bilhão de combinações, tornando o Algoritmo Genético essencial."
        )
    else:
        percentual = (diferenca_fitness / resultado_fb['melhor_fitness']) * 100 if resultado_fb['melhor_fitness'] > 0 else 0
        analise = (
            f"⚠️ O Algoritmo Genético encontrou uma solução {abs(percentual):.1f}% "
            f"{'melhor' if diferenca_fitness > 0 else 'pior'} que o ótimo global. "
            f"Diferença de fitness: {diferenca_fitness:.2f}. "
            "Isso pode ocorrer devido à aleatoriedade do AG. "
            "Execute múltiplas rodadas para avaliar a estabilidade."
        )
    
    return {
        'erro': False,
        'ag': resultado_ag,
        'forca_bruta': resultado_fb,
        'ag_encontrou_otimo_global': ag_encontrou_otimo,
        'diferenca_fitness': diferenca_fitness,
        'diferenca_lucro': diferenca_lucro,
        'analise': analise
    }


def executar_multiplas_rodadas(culturas, talhoes, regras, objetivo='equilibrado', rodadas=10, geracoes=100, populacao=50):
    """
    Executa o AG múltiplas vezes para avaliar estabilidade
    
    Args:
        culturas: DataFrame com culturas
        talhoes: DataFrame com talhões
        regras: DataFrame com regras
        objetivo: objetivo do AG
        rodadas: número de execuções
        geracoes: número de gerações do AG
        populacao: tamanho da população do AG
    
    Returns:
        Dicionário com estatísticas
    """
    from core.genetic_optimizer import otimizar_plano_genetico
    import statistics
    
    resultados = []
    fitness_list = []
    lucros_list = []
    riscos_list = []
    
    print(f"   Executando {rodadas} rodadas do Algoritmo Genético (gerações={geracoes}, população={populacao})...")
    
    for i in range(rodadas):
        # Usa seed diferente para cada rodada
        resultado = otimizar_plano_genetico(
            culturas, talhoes, regras, objetivo, 
            seed=i, 
            geracoes=geracoes, 
            populacao=populacao
        )
        fitness = _to_float(resultado.get("fitness", 0))
        lucro = _to_float(resultado.get("lucro_total", 0))
        risco = _to_float(resultado.get("risco_medio", 0))

        resultado_limpo = _limpar_tipos_python(resultado)
        resultado_limpo["fitness"] = fitness
        resultado_limpo["lucro_total"] = lucro
        resultado_limpo["risco_medio"] = risco

        resultados.append(resultado_limpo)
        fitness_list.append(fitness)
        lucros_list.append(lucro)
        riscos_list.append(risco)
        print(f"      Rodada {i+1}/{rodadas}: Fitness = {fitness:.2f}")
    
    # Encontra melhor e pior
    melhor_idx = fitness_list.index(max(fitness_list))
    pior_idx = fitness_list.index(min(fitness_list))
    
    melhor_resultado = resultados[melhor_idx]
    pior_resultado = resultados[pior_idx]
    
    # Calcula estatísticas
    fitness_medio = statistics.mean(fitness_list)
    fitness_desvio = statistics.stdev(fitness_list) if len(fitness_list) > 1 else 0
    lucro_medio = statistics.mean(lucros_list)
    risco_medio = statistics.mean(riscos_list)
    
    # Avalia estabilidade
    coef_variacao = (fitness_desvio / fitness_medio * 100) if fitness_medio > 0 else 0
    
    if coef_variacao < 2:
        estabilidade = 'alta'
        estabilidade_desc = 'O algoritmo apresentou alta estabilidade, encontrando soluções muito semelhantes em todas as execuções.'
    elif coef_variacao < 5:
        estabilidade = 'média'
        estabilidade_desc = 'O algoritmo apresentou estabilidade média, com alguma variação entre as execuções.'
    else:
        estabilidade = 'baixa'
        estabilidade_desc = 'O algoritmo apresentou variação significativa entre as execuções. Considere aumentar o número de gerações ou população.'
    
    return {
        'rodadas': int(rodadas),
        'melhor_fitness': float(max(fitness_list)),
        'fitness_medio': float(fitness_medio),
        'pior_fitness': float(min(fitness_list)),
        'desvio_padrao': float(fitness_desvio),
        'coeficiente_variacao': float(coef_variacao),
        'lucro_medio': float(lucro_medio),
        'risco_medio': float(risco_medio),
        'melhor_plano': _limpar_tipos_python(melhor_resultado),
        'pior_plano': _limpar_tipos_python(pior_resultado),
        'estabilidade': estabilidade,
        'estabilidade_descricao': estabilidade_desc,
        'todos_resultados': _limpar_tipos_python(resultados)
    }
