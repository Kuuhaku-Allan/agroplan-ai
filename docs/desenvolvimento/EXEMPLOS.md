# 📖 Exemplos de Uso do AgroPlan AI

Este documento mostra exemplos práticos de como usar o sistema em seus diferentes modos.

## 🎯 Modo 1: Simulação de Cenários (Padrão)

Compara 5 estratégias diferentes de planejamento.

```bash
python main.py
```

**Saída:**
- Cenário Equilibrado
- Cenário Máximo Lucro
- Cenário Baixo Risco
- Cenário Sustentável
- Cenário Conservador
- Tabela comparativa
- Recomendação do melhor cenário

**Quando usar:** Quando você quer ver diferentes opções e comparar estratégias manualmente.

---

## 🔍 Modo 2: Análise Detalhada

Mostra análise completa de cada talhão com ranking de culturas.

```bash
python main.py detalhado
```

**Saída:**
- Características de cada talhão
- Ranking top 5 de culturas por talhão
- Nota de compatibilidade de cada cultura
- Justificativa detalhada da recomendação
- Resumo com métricas agregadas

**Quando usar:** Quando você quer entender profundamente por que cada cultura foi recomendada para cada talhão.

---

## 🧬 Modo 3: Otimização Genética

Usa Algoritmo Genético para encontrar o melhor plano automaticamente.

### 3.1 Objetivo Equilibrado (padrão)

```bash
python main.py genetico
```

**Foco:** Equilíbrio entre lucro, risco e compatibilidade
**Pesos:** Lucro 40% | Compatibilidade 30% | Segurança 20% | Diversidade 10%

### 3.2 Objetivo Máximo Lucro

```bash
python main.py genetico lucro
```

**Foco:** Maximizar retorno financeiro
**Pesos:** Lucro 60% | Compatibilidade 20% | Segurança 10% | Diversidade 10%

### 3.3 Objetivo Baixo Risco

```bash
python main.py genetico risco
```

**Foco:** Minimizar exposição a perdas
**Pesos:** Lucro 20% | Compatibilidade 30% | Segurança 40% | Diversidade 10%

### 3.4 Objetivo Sustentável

```bash
python main.py genetico sustentavel
```

**Foco:** Compatibilidade ambiental e uso eficiente de recursos
**Pesos:** Lucro 20% | Compatibilidade 40% | Segurança 20% | Diversidade 20%

**Saída do AG:**
- Plano otimizado encontrado
- Fitness alcançado
- Diversidade de culturas
- Comparação com cenários manuais
- Justificativa da solução

**Quando usar:** Quando você quer a melhor solução possível automaticamente, considerando múltiplos objetivos.

---

## 📊 Comparação de Resultados

### Exemplo Real (3 talhões, 33 ha total):

| Estratégia | Lucro Total | Risco Médio | Método |
|------------|-------------|-------------|---------|
| **AG Equilibrado** | R$ 316.050 | 33.8% | Otimizado |
| Equilibrado Manual | R$ 312.150 | 33.5% | Manual |
| Máximo Lucro | R$ 331.650 | 35.0% | Manual |
| Baixo Risco | R$ 170.280 | 25.0% | Manual |
| Sustentável | R$ 199.680 | 26.5% | Manual |
| Conservador | R$ 223.200 | 27.7% | Manual |

### Insights:

1. **AG encontrou solução melhor que o cenário equilibrado manual** (+R$ 3.900)
2. **AG evitou monocultura** (2 culturas diferentes)
3. **AG balanceou lucro e risco** (não foi para o máximo lucro puro)
4. **Diferença de R$ 161.370** entre máximo lucro e baixo risco

---

## 🎓 Casos de Uso por Perfil

### Produtor Iniciante
```bash
python main.py genetico risco
```
Prioriza segurança e aprendizado.

### Produtor Experiente
```bash
python main.py genetico lucro
```
Busca maximizar retorno com risco calculado.

### Produtor Sustentável
```bash
python main.py genetico sustentavel
```
Foca em compatibilidade ambiental.

### Consultor Agrícola
```bash
python main.py
```
Mostra múltiplas opções para o cliente escolher.

### Pesquisador/Estudante
```bash
python main.py detalhado
```
Entende a fundo o sistema de pontuação e decisão.

---

## 🔬 Entendendo as Penalidades do AG

O Algoritmo Genético aplica penalidades para evitar soluções ruins:

| Penalidade | Pontos | Motivo |
|------------|--------|---------|
| Nota baixa (< 60) | -15 | Cultura incompatível com talhão |
| Água insuficiente | -20 | Alta necessidade + baixa disponibilidade |
| Solo incompatível | -10 | Cultura não se adapta ao solo |
| Clima incompatível | -10 | Cultura não se adapta ao clima |
| **Monocultura** | **-25** | Mesma cultura em todos os talhões |
| Risco alto (> 45%) | -20 | Risco médio muito elevado |
| Nota média baixa (< 70) | -10 | Compatibilidade geral ruim |

Essas penalidades garantem que o AG não seja apenas um "maximizador burro de lucro".

---

## 💡 Dicas de Uso

1. **Comece com o modo padrão** para ver as opções
2. **Use o modo detalhado** para entender as decisões
3. **Use o AG** quando quiser a melhor solução automaticamente
4. **Compare os resultados** do AG com os cenários manuais
5. **Experimente diferentes objetivos** do AG para ver como mudam as soluções

---

## 🚀 Próximas Funcionalidades

- **Fase 4:** Relatórios comparativos e explicabilidade
- **Fase 5:** Modelo de IA para previsão de produtividade
- **Fase 6:** Integração com APIs reais (clima, preços)
- **Fase 7:** Interface web com visualização de mapas
- **Fase 8:** Automação de dados em tempo real
