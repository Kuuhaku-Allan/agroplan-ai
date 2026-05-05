# 🌱 AgroPlan AI - Resumo do Projeto

## 📋 Visão Geral

**Nome:** AgroPlan AI - Sistema Inteligente de Planejamento de Plantio

**Objetivo:** Otimizar o planejamento agrícola usando Algoritmo Genético, considerando múltiplos objetivos (lucro, risco, compatibilidade, diversidade) e respeitando restrições agronômicas.

**Status Atual:** Fase 4/8 - Relatórios e Explicabilidade ✅

**Tecnologias:** Python, Pandas, Scikit-learn, PyGAD

## 🗺️ Evolução do Projeto

### ✅ Fase 1 - Base de Dados
- Sistema básico com dados CSV
- Cálculo de lucro simples
- Escolha aleatória de culturas

### ✅ Fase 1.5 - Analisador de Terreno
- Sistema de pontuação (solo, clima, relevo, água)
- Ranking de culturas por talhão
- Justificativas textuais
- Risco ponderado por área

### ✅ Fase 2 - Simulador de Cenários
- 5 cenários: Equilibrado, Máximo Lucro, Baixo Risco, Sustentável, Conservador
- Comparação de estratégias
- Recomendação automática

### ✅ Fase 3 - Algoritmo Genético
- Otimização multi-objetivo
- 4 objetivos configuráveis
- 7 tipos de penalidades agronômicas
- Evita monocultura

### ✅ Fase 3.5 - Validação e Auditoria
- Validação por força bruta (125 combinações)
- Análise de estabilidade (múltiplas rodadas)
- Fitness normalizado (0-100)
- Seed para reprodutibilidade
- **Resultado:** AG encontrou ótimo global ✅

### ✅ Fase 4 - Relatórios e Explicabilidade (ATUAL)
- Relatórios completos (MD + TXT)
- 9 seções explicativas
- Comparação de todos os cenários
- Validação documentada
- Limitações reconhecidas

### 🔜 Fase 5 - Interface Web
- Dashboard interativo
- Visualização de mapas
- Gráficos de evolução

### 🔜 Fase 6 - APIs Reais
- Dados climáticos
- Preços de mercado
- Análise de solo

### 🔜 Fase 7 - Machine Learning
- Previsão de produtividade
- Previsão de preços

### 🔜 Fase 8 - Sistema Completo
- Cadastro de usuários
- Histórico de safras
- App mobile

## 📊 Dados Atuais

**Culturas:** 5 (soja, milho, feijão, trigo, algodão)
**Talhões:** 3 (33 ha total)
**Combinações possíveis:** 125 (5³)

## 🧬 Algoritmo Genético

### Configuração
- **Gerações:** 100
- **População:** 50 indivíduos
- **Seleção:** Steady-state
- **Crossover:** Single-point
- **Mutação:** 20%

### Função Fitness
```
fitness = lucro * 0.40 +
          compatibilidade * 0.30 +
          segurança * 0.20 +
          diversidade * 0.10 -
          penalidades
```

### Penalidades
- Monocultura: -25
- Água insuficiente: -20
- Nota baixa: -15
- Solo incompatível: -10
- Clima incompatível: -10
- Risco alto: -20
- Nota média baixa: -10

## 📈 Resultados de Validação

### Validação por Força Bruta
- **Total de combinações:** 125
- **Força Bruta:** Fitness 75.22
- **AG:** Fitness 75.22
- **Status:** ✅ AG encontrou o ótimo global

### Estabilidade (10 rodadas)
- **Fitness médio:** 75.22
- **Desvio padrão:** 0.00
- **CV:** 0.00%
- **Estabilidade:** 🟢 ALTA

### Plano Recomendado (Objetivo Equilibrado)
- **Talhão 1:** Soja - R$ 81.000 | Risco 30%
- **Talhão 2:** Feijão - R$ 77.400 | Risco 25%
- **Talhão 3:** Milho - R$ 80.400 | Risco 35%
- **Total:** R$ 238.800 | Risco 28.9% | 3 culturas

## 🎯 Diferenciais do Projeto

### 1. Não é um "Maximizador Burro"
- ✅ Considera múltiplos objetivos
- ✅ Aplica penalidades agronômicas
- ✅ Evita monocultura
- ✅ Respeita compatibilidades

### 2. Validado Cientificamente
- ✅ Comparado com força bruta
- ✅ Estabilidade comprovada
- ✅ Reprodutível (seed)
- ✅ Fitness normalizado

### 3. Explicável e Transparente
- ✅ Relatórios completos
- ✅ Justificativas detalhadas
- ✅ Limitações documentadas
- ✅ Comparação de cenários

### 4. Escalável
- ✅ Funciona com 3 talhões (125 combinações)
- ✅ Viável com 10 talhões (1 bilhão de combinações)
- ✅ Essencial com 20 talhões (10²⁰ combinações)

## 🚀 Como Usar

### Instalação
```bash
pip install -r requirements.txt
```

### Comandos Principais

**Simulação de cenários:**
```bash
python main.py
```

**Análise detalhada:**
```bash
python main.py detalhado
```

**Otimização genética:**
```bash
python main.py genetico equilibrado
python main.py genetico lucro
python main.py genetico risco
python main.py genetico sustentavel
```

**Validação:**
```bash
python main.py validar equilibrado
```

**Estabilidade:**
```bash
python main.py rodadas equilibrado 10
```

**Relatório completo:**
```bash
python main.py relatorio equilibrado
```

## 📁 Estrutura do Projeto

```
agroplan/
├── data/
│   ├── culturas.csv
│   ├── talhoes.csv
│   └── regras_culturas.csv
├── core/
│   ├── loader.py
│   ├── planner.py
│   ├── terrain_analyzer.py
│   ├── scorer.py
│   ├── scenario_simulator.py
│   ├── genetic_optimizer.py
│   ├── bruteforce_validator.py
│   └── report_generator.py
├── reports/
│   ├── *.md
│   └── *.txt
├── main.py
├── requirements.txt
└── README.md
```

## 🎓 Argumentação Acadêmica

### Tese
"O Algoritmo Genético implementado no AgroPlan AI é capaz de encontrar soluções ótimas para o problema de planejamento de plantio, respeitando restrições agronômicas e apresentando comportamento estável e reproduzível."

### Evidências
1. ✅ **Validação:** AG encontrou ótimo global (força bruta)
2. ✅ **Estabilidade:** CV = 0% em 10 rodadas
3. ✅ **Reprodutibilidade:** Seed fixa permite replicação
4. ✅ **Penalidades:** Evita soluções agronomicamente ruins
5. ✅ **Multi-objetivo:** Não maximiza apenas lucro
6. ✅ **Escalabilidade:** Viável para problemas grandes

### Limitações Reconhecidas
1. Dados simulados (não reais de campo)
2. Modelo simplificado
3. Sem análise laboratorial de solo
4. Sem dados climáticos reais
5. Sem preços de mercado atualizados
6. Não substitui agrônomo profissional

## 📊 Métricas do Projeto

**Linhas de código:** ~2.500
**Arquivos Python:** 9
**Arquivos de dados:** 3
**Documentação:** 7 arquivos MD
**Fases concluídas:** 4/8
**Tempo de desenvolvimento:** ~6 horas
**Cobertura de testes:** Validação manual completa

## 🏆 Conquistas

1. ✅ Sistema funcional end-to-end
2. ✅ AG validado cientificamente
3. ✅ Relatórios profissionais
4. ✅ Código bem estruturado
5. ✅ Documentação completa
6. ✅ Pronto para apresentação
7. ✅ Pronto para evolução

## 🔜 Próximos Passos

### Curto Prazo (Fase 5)
- Interface Web com React
- Dashboard interativo
- Visualização de mapas
- Gráficos de evolução

### Médio Prazo (Fases 6-7)
- Integração com APIs reais
- Machine Learning para previsões
- Análise de imagens de satélite

### Longo Prazo (Fase 8)
- Sistema completo multi-usuário
- App mobile
- Histórico de safras
- Marketplace de insumos

## 💡 Lições Aprendidas

1. **Validação é essencial** - Força bruta comprovou que o AG funciona
2. **Explicabilidade importa** - Relatórios tornam o sistema apresentável
3. **Penalidades são necessárias** - Evitam soluções ruins
4. **Normalização facilita** - Fitness 0-100 é mais claro
5. **Documentação é investimento** - Facilita apresentação e evolução

## 📝 Conclusão

O AgroPlan AI é um **sistema completo, validado e apresentável** de planejamento agrícola usando Algoritmo Genético.

**Pronto para:**
- ✅ Apresentação acadêmica
- ✅ Demonstração prática
- ✅ Defesa de TCC
- ✅ Publicação de artigo
- ✅ Evolução para produto

**Próxima fase recomendada:** Interface Web (Fase 5)

---

**Versão:** 4.0
**Data:** 05/05/2026
**Status:** ✅ Pronto para apresentação
