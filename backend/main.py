from core.loader import carregar_dados
from core.planner import gerar_plano_inteligente, gerar_cenarios, gerar_plano_genetico
from core.scenario_simulator import recomendar_melhor_cenario
from core.bruteforce_validator import comparar_ag_com_forca_bruta, executar_multiplas_rodadas
from core.report_generator import gerar_relatorio_completo

def exibir_plano_detalhado():
    """Modo 1: Exibe análise detalhada com ranking completo"""
    print("=" * 80)
    print("🌱 AgroPlan AI - Sistema Inteligente de Planejamento de Plantio")
    print("   Fase 1.5: Analisador de Terreno com Pontuação de Culturas")
    print("=" * 80)
    print()
    
    # Carrega dados
    print("📊 Carregando dados...")
    culturas, talhoes, regras = carregar_dados()
    print(f"✅ {len(culturas)} culturas carregadas")
    print(f"✅ {len(talhoes)} talhões carregados")
    print(f"✅ {len(regras)} regras de cultivo carregadas")
    print()
    
    # Gera plano de plantio inteligente
    print("🧠 Analisando terrenos e gerando recomendações...")
    plano = gerar_plano_inteligente(culturas, talhoes, regras)
    print()
    
    # Exibe resultados detalhados
    print("=" * 80)
    print("📋 ANÁLISE COMPLETA E RECOMENDAÇÕES")
    print("=" * 80)
    
    lucro_total = 0
    area_total = 0
    risco_ponderado = 0
    
    for p in plano:
        print()
        print("─" * 80)
        print(f"🌾 TALHÃO {p['talhao']} — {p['area']} ha")
        print(f"   Características: Solo {p['solo']} | Clima {p['clima']} | "
              f"Relevo {p['relevo']} | Água {p['agua']}")
        print()
        
        # Ranking de culturas
        print("   📊 RANKING DE CULTURAS:")
        for i, cultura in enumerate(p['ranking'][:5], 1):  # Top 5
            emoji = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else "  "
            print(f"   {emoji} {i}º {cultura['cultura'].upper():10} — "
                  f"Nota: {cultura['nota']:5.2f} | "
                  f"Lucro: R$ {cultura['lucro_total']:>10,.2f} | "
                  f"Risco: {cultura['risco']}%")
        
        print()
        print(f"   ✅ RECOMENDAÇÃO: Plantar {p['cultura_recomendada'].upper()}")
        print(f"      Nota final: {p['nota']:.2f}")
        print(f"      💰 Lucro estimado: R$ {p['lucro_estimado']:,.2f}")
        print(f"      ⚠️  Risco: {p['risco']}%")
        print(f"      ⏱️  Tempo de colheita: {p['tempo']} dias")
        print()
        print(f"   💡 JUSTIFICATIVA:")
        print(f"      {p['justificativa']}")
        
        lucro_total += p['lucro_estimado']
        area_total += p['area']
        risco_ponderado += p['risco'] * p['area']
    
    risco_medio = risco_ponderado / area_total if area_total > 0 else 0
    
    print()
    print("=" * 80)
    print("📈 RESUMO DO PLANO")
    print("=" * 80)
    print(f"💵 Lucro total estimado: R$ {lucro_total:,.2f}")
    print(f"⚠️  Risco médio ponderado: {risco_medio:.1f}%")
    print(f"🌾 Talhões planejados: {len(plano)}")
    print(f"📏 Área total: {area_total} ha")
    print("=" * 80)


def exibir_simulacao_cenarios():
    """Modo 2: Exibe comparação entre diferentes cenários"""
    print("=" * 80)
    print("🌱 AgroPlan AI - Sistema Inteligente de Planejamento de Plantio")
    print("   Fase 2: Simulador de Cenários")
    print("=" * 80)
    print()
    
    # Carrega dados
    print("📊 Carregando dados...")
    culturas, talhoes, regras = carregar_dados()
    print(f"✅ {len(culturas)} culturas carregadas")
    print(f"✅ {len(talhoes)} talhões carregados")
    print(f"✅ {len(regras)} regras de cultivo carregadas")
    print()
    
    # Gera cenários
    print("🧠 Simulando diferentes cenários de planejamento...")
    cenarios = gerar_cenarios(culturas, talhoes, regras)
    print()
    
    # Exibe comparação de cenários
    print("=" * 80)
    print("📊 SIMULAÇÃO DE CENÁRIOS")
    print("=" * 80)
    print()
    
    ordem_cenarios = ['equilibrado', 'maximo_lucro', 'baixo_risco', 'sustentavel', 'conservador']
    
    for key in ordem_cenarios:
        cenario = cenarios[key]
        
        print("─" * 80)
        print(f"🎯 CENÁRIO: {cenario['nome'].upper()}")
        print(f"   {cenario['descricao']}")
        print()
        print(f"   💰 Lucro total: R$ {cenario['lucro_total']:,.2f}")
        print(f"   ⚠️  Risco médio ponderado: {cenario['risco_medio']:.1f}%")
        print(f"   📏 Área total: {cenario['area_total']} ha")
        print()
        print("   🌾 Plano de plantio:")
        
        for p in cenario['plano']:
            print(f"      Talhão {p['talhao']} ({p['area']} ha) → {p['cultura'].upper()} "
                  f"(Lucro: R$ {p['lucro_estimado']:,.2f} | Risco: {p['risco']}%)")
        
        print()
    
    # Recomendação do sistema
    print("=" * 80)
    print("✨ MELHOR CENÁRIO RECOMENDADO")
    print("=" * 80)
    print()
    
    recomendacao = recomendar_melhor_cenario(cenarios)
    cenario_recomendado = cenarios[recomendacao['cenario']]
    
    print(f"🏆 Cenário: {cenario_recomendado['nome'].upper()}")
    print()
    print(f"💡 Justificativa:")
    print(f"   {recomendacao['justificativa']}")
    print()
    print("=" * 80)
    
    # Tabela comparativa
    print()
    print("📊 TABELA COMPARATIVA")
    print("=" * 80)
    print(f"{'Cenário':<20} {'Lucro Total':>20} {'Risco Médio':>15}")
    print("─" * 80)
    
    for key in ordem_cenarios:
        cenario = cenarios[key]
        emoji = "🏆 " if key == recomendacao['cenario'] else "   "
        print(f"{emoji}{cenario['nome']:<17} R$ {cenario['lucro_total']:>15,.2f} {cenario['risco_medio']:>13.1f}%")
    
    print("=" * 80)


def exibir_otimizacao_genetica(objetivo='equilibrado'):
    """Modo 3: Exibe otimização com Algoritmo Genético"""
    print("=" * 80)
    print("🌱 AgroPlan AI - Sistema Inteligente de Planejamento de Plantio")
    print("   Fase 3: Otimizador com Algoritmo Genético")
    print("=" * 80)
    print()
    
    # Carrega dados
    print("📊 Carregando dados...")
    culturas, talhoes, regras = carregar_dados()
    print(f"✅ {len(culturas)} culturas carregadas")
    print(f"✅ {len(talhoes)} talhões carregados")
    print(f"✅ {len(regras)} regras de cultivo carregadas")
    print()
    
    # Executa otimização genética
    print(f"🧬 Executando Algoritmo Genético (objetivo: {objetivo})...")
    print("   Gerando população inicial...")
    print("   Evoluindo soluções...")
    resultado = gerar_plano_genetico(culturas, talhoes, regras, objetivo=objetivo, geracoes=100, populacao=50)
    print("   ✅ Otimização concluída!")
    print()
    
    # Exibe resultado
    print("=" * 80)
    print("🧬 OTIMIZAÇÃO COM ALGORITMO GENÉTICO")
    print("=" * 80)
    print()
    print(f"🎯 Objetivo: {resultado['objetivo'].upper()}")
    print(f"🔄 Gerações: {resultado['geracoes']}")
    print(f"📊 Fitness final: {resultado['fitness']:.2f}")
    print(f"🌾 Diversidade: {resultado['diversidade']} cultura(s) diferente(s)")
    print()
    
    print("─" * 80)
    print("📋 PLANO OTIMIZADO ENCONTRADO")
    print("─" * 80)
    print()
    
    for p in resultado['plano']:
        print(f"🌾 Talhão {p['talhao']} — {p['area']} ha")
        print(f"   Características: Solo {p['solo']} | Clima {p['clima']} | "
              f"Relevo {p['relevo']} | Água {p['agua']}")
        print(f"   🌱 Cultura: {p['cultura'].upper()}")
        print(f"   💰 Lucro estimado: R$ {p['lucro_estimado']:,.2f}")
        print(f"   ⚠️  Risco: {p['risco']}%")
        print(f"   📊 Nota de compatibilidade: {p['nota']:.2f}")
        print(f"   ⏱️  Tempo de colheita: {p['tempo']} dias")
        print()
    
    print("=" * 80)
    print("📈 RESUMO DO PLANO OTIMIZADO")
    print("=" * 80)
    print(f"💵 Lucro total: R$ {resultado['lucro_total']:,.2f}")
    print(f"⚠️  Risco médio ponderado: {resultado['risco_medio']:.1f}%")
    print(f"📏 Área total: {resultado['area_total']} ha")
    print(f"🌾 Culturas utilizadas: {resultado['diversidade']}")
    print(f"🎯 Fitness alcançado: {resultado['fitness']:.2f}")
    print()
    print("💡 JUSTIFICATIVA:")
    print(f"   {resultado['justificativa']}")
    print("=" * 80)
    
    # Comparação com cenários manuais
    print()
    print("=" * 80)
    print("📊 COMPARAÇÃO: AG vs CENÁRIOS MANUAIS")
    print("=" * 80)
    print()
    
    cenarios = gerar_cenarios(culturas, talhoes, regras)
    
    print(f"{'Estratégia':<25} {'Lucro Total':>20} {'Risco Médio':>15} {'Método':>15}")
    print("─" * 80)
    print(f"{'🧬 AG ' + resultado['objetivo'].title():<25} "
          f"R$ {resultado['lucro_total']:>15,.2f} "
          f"{resultado['risco_medio']:>13.1f}% "
          f"{'Otimizado':>15}")
    
    ordem_cenarios = ['equilibrado', 'maximo_lucro', 'baixo_risco', 'sustentavel', 'conservador']
    nomes_cenarios = {
        'equilibrado': 'Equilibrado',
        'maximo_lucro': 'Máximo Lucro',
        'baixo_risco': 'Baixo Risco',
        'sustentavel': 'Sustentável',
        'conservador': 'Conservador'
    }
    
    for key in ordem_cenarios:
        cenario = cenarios[key]
        print(f"   {nomes_cenarios[key]:<22} "
              f"R$ {cenario['lucro_total']:>15,.2f} "
              f"{cenario['risco_medio']:>13.1f}% "
              f"{'Manual':>15}")
    
    print("=" * 80)


def exibir_validacao_ag(objetivo='equilibrado'):
    """Modo 4: Valida AG comparando com força bruta"""
    print("=" * 80)
    print("🌱 AgroPlan AI - Sistema Inteligente de Planejamento de Plantio")
    print("   Fase 3.5: Validação do Algoritmo Genético")
    print("=" * 80)
    print()
    
    # Carrega dados
    print("📊 Carregando dados...")
    culturas, talhoes, regras = carregar_dados()
    print(f"✅ {len(culturas)} culturas carregadas")
    print(f"✅ {len(talhoes)} talhões carregados")
    print(f"✅ {len(regras)} regras de cultivo carregadas")
    print()
    
    print(f"🔬 Validando Algoritmo Genético (objetivo: {objetivo})...")
    resultado = comparar_ag_com_forca_bruta(culturas, talhoes, regras, objetivo)
    
    if resultado.get('erro'):
        print(f"\n⚠️  {resultado['mensagem']}")
        return
    
    print()
    print("=" * 80)
    print("🔬 VALIDAÇÃO DO ALGORITMO GENÉTICO")
    print("=" * 80)
    print()
    print(f"🎯 Objetivo: {objetivo.upper()}")
    print(f"🔢 Total de combinações testadas por força bruta: {resultado['forca_bruta']['total_combinacoes']}")
    print()
    
    # Força Bruta
    fb = resultado['forca_bruta']
    print("─" * 80)
    print("📊 MELHOR SOLUÇÃO POR FORÇA BRUTA")
    print("─" * 80)
    for p in fb['plano']:
        print(f"   Talhão {p['talhao']} → {p['cultura'].upper()}")
    print()
    print(f"   📊 Fitness: {fb['melhor_fitness']:.2f}")
    print(f"   💰 Lucro total: R$ {fb['lucro_total']:,.2f}")
    print(f"   ⚠️  Risco médio: {fb['risco_medio']:.1f}%")
    print(f"   🌾 Diversidade: {fb['diversidade']} cultura(s)")
    print()
    
    # AG
    ag = resultado['ag']
    print("─" * 80)
    print("🧬 MELHOR SOLUÇÃO PELO ALGORITMO GENÉTICO")
    print("─" * 80)
    for p in ag['plano']:
        print(f"   Talhão {p['talhao']} → {p['cultura'].upper()}")
    print()
    print(f"   📊 Fitness: {ag['fitness']:.2f}")
    print(f"   💰 Lucro total: R$ {ag['lucro_total']:,.2f}")
    print(f"   ⚠️  Risco médio: {ag['risco_medio']:.1f}%")
    print(f"   🌾 Diversidade: {ag['diversidade']} cultura(s)")
    print()
    
    # Comparação
    print("=" * 80)
    print("📈 RESULTADO DA VALIDAÇÃO")
    print("=" * 80)
    print()
    if resultado['ag_encontrou_otimo_global']:
        print("✅ STATUS: O AG ENCONTROU O ÓTIMO GLOBAL")
    else:
        print("⚠️  STATUS: O AG NÃO ENCONTROU O ÓTIMO GLOBAL")
    print()
    print(f"   Diferença de fitness: {resultado['diferenca_fitness']:.2f}")
    print(f"   Diferença de lucro: R$ {resultado['diferenca_lucro']:,.2f}")
    print()
    print("💡 ANÁLISE:")
    print(f"   {resultado['analise']}")
    print()
    print("=" * 80)


def exibir_multiplas_rodadas(objetivo='equilibrado', rodadas=10):
    """Modo 5: Executa AG múltiplas vezes para avaliar estabilidade"""
    print("=" * 80)
    print("🌱 AgroPlan AI - Sistema Inteligente de Planejamento de Plantio")
    print("   Fase 3.5: Análise de Estabilidade do AG")
    print("=" * 80)
    print()
    
    # Carrega dados
    print("📊 Carregando dados...")
    culturas, talhoes, regras = carregar_dados()
    print(f"✅ {len(culturas)} culturas carregadas")
    print(f"✅ {len(talhoes)} talhões carregados")
    print(f"✅ {len(regras)} regras de cultivo carregadas")
    print()
    
    print(f"🔄 Executando {rodadas} rodadas do AG (objetivo: {objetivo})...")
    print()
    resultado = executar_multiplas_rodadas(culturas, talhoes, regras, objetivo, rodadas)
    print()
    
    print("=" * 80)
    print("📊 ANÁLISE DE ESTABILIDADE DO ALGORITMO GENÉTICO")
    print("=" * 80)
    print()
    print(f"🎯 Objetivo: {objetivo.upper()}")
    print(f"🔄 Rodadas executadas: {resultado['rodadas']}")
    print()
    print("─" * 80)
    print("📈 ESTATÍSTICAS DE FITNESS")
    print("─" * 80)
    print(f"   🏆 Melhor fitness: {resultado['melhor_fitness']:.2f}")
    print(f"   📊 Fitness médio: {resultado['fitness_medio']:.2f}")
    print(f"   📉 Pior fitness: {resultado['pior_fitness']:.2f}")
    print(f"   📏 Desvio padrão: {resultado['desvio_padrao']:.2f}")
    print(f"   📐 Coeficiente de variação: {resultado['coeficiente_variacao']:.2f}%")
    print()
    print(f"   💰 Lucro médio: R$ {resultado['lucro_medio']:,.2f}")
    print(f"   ⚠️  Risco médio: {resultado['risco_medio']:.1f}%")
    print()
    
    # Estabilidade
    emoji_estabilidade = "🟢" if resultado['estabilidade'] == 'alta' else "🟡" if resultado['estabilidade'] == 'média' else "🔴"
    print("─" * 80)
    print(f"{emoji_estabilidade} ESTABILIDADE: {resultado['estabilidade'].upper()}")
    print("─" * 80)
    print(f"   {resultado['estabilidade_descricao']}")
    print()
    
    # Melhor plano
    melhor = resultado['melhor_plano']
    print("=" * 80)
    print("🏆 MELHOR PLANO ENCONTRADO")
    print("=" * 80)
    print()
    for p in melhor['plano']:
        print(f"   Talhão {p['talhao']} ({p['area']} ha) → {p['cultura'].upper()}")
        print(f"      Lucro: R$ {p['lucro_estimado']:,.2f} | Risco: {p['risco']}% | Nota: {p['nota']:.2f}")
    print()
    print(f"   📊 Fitness: {melhor['fitness']:.2f}")
    print(f"   💰 Lucro total: R$ {melhor['lucro_total']:,.2f}")
    print(f"   ⚠️  Risco médio: {melhor['risco_medio']:.1f}%")
    print(f"   🌾 Diversidade: {melhor['diversidade']} cultura(s)")
    print()
    print("=" * 80)


def gerar_relatorio(objetivo='equilibrado'):
    """Modo 6: Gera relatório completo"""
    print("=" * 80)
    print("🌱 AgroPlan AI - Sistema Inteligente de Planejamento de Plantio")
    print("   Fase 4: Geração de Relatórios")
    print("=" * 80)
    print()
    
    # Carrega dados
    print("📊 Carregando dados...")
    culturas, talhoes, regras = carregar_dados()
    print(f"✅ {len(culturas)} culturas carregadas")
    print(f"✅ {len(talhoes)} talhões carregados")
    print(f"✅ {len(regras)} regras de cultivo carregadas")
    print()
    
    print(f"📝 Gerando relatório completo (objetivo: {objetivo})...")
    print()
    
    # Gera relatórios em ambos os formatos
    caminho_md = gerar_relatorio_completo(culturas, talhoes, regras, objetivo, formato='md')
    caminho_txt = gerar_relatorio_completo(culturas, talhoes, regras, objetivo, formato='txt')
    
    print()
    print("=" * 80)
    print("✅ RELATÓRIOS GERADOS COM SUCESSO")
    print("=" * 80)
    print()
    print("📄 Arquivos criados:")
    print(f"   - {caminho_md}")
    print(f"   - {caminho_txt}")
    print()
    print("💡 Dica: Abra o arquivo .md em um visualizador Markdown para melhor formatação")
    print("=" * 80)


def main():
    """Menu principal"""
    import sys
    
    # Verifica argumentos
    if len(sys.argv) > 1:
        modo = sys.argv[1].lower()
        
        if modo == 'detalhado':
            exibir_plano_detalhado()
        elif modo == 'genetico':
            # Verifica se há objetivo específico
            objetivo = sys.argv[2].lower() if len(sys.argv) > 2 else 'equilibrado'
            if objetivo not in ['equilibrado', 'lucro', 'risco', 'sustentavel']:
                print(f"⚠️  Objetivo '{objetivo}' inválido. Usando 'equilibrado'.")
                objetivo = 'equilibrado'
            exibir_otimizacao_genetica(objetivo)
        elif modo == 'validar':
            # Validação com força bruta
            objetivo = sys.argv[2].lower() if len(sys.argv) > 2 else 'equilibrado'
            if objetivo not in ['equilibrado', 'lucro', 'risco', 'sustentavel']:
                print(f"⚠️  Objetivo '{objetivo}' inválido. Usando 'equilibrado'.")
                objetivo = 'equilibrado'
            exibir_validacao_ag(objetivo)
        elif modo == 'rodadas':
            # Múltiplas rodadas
            objetivo = sys.argv[2].lower() if len(sys.argv) > 2 else 'equilibrado'
            if objetivo not in ['equilibrado', 'lucro', 'risco', 'sustentavel']:
                print(f"⚠️  Objetivo '{objetivo}' inválido. Usando 'equilibrado'.")
                objetivo = 'equilibrado'
            rodadas = int(sys.argv[3]) if len(sys.argv) > 3 else 10
            exibir_multiplas_rodadas(objetivo, rodadas)
        elif modo == 'relatorio':
            # Geração de relatório
            objetivo = sys.argv[2].lower() if len(sys.argv) > 2 else 'equilibrado'
            if objetivo not in ['equilibrado', 'lucro', 'risco', 'sustentavel']:
                print(f"⚠️  Objetivo '{objetivo}' inválido. Usando 'equilibrado'.")
                objetivo = 'equilibrado'
            gerar_relatorio(objetivo)
        else:
            exibir_simulacao_cenarios()
    else:
        exibir_simulacao_cenarios()


if __name__ == "__main__":
    main()
