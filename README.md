# 🌱 AgroPlan AI

**Sistema Inteligente de Planejamento de Plantio com Algoritmo Genético**

AgroPlan AI é uma plataforma web que utiliza Inteligência Artificial para otimizar o planejamento agrícola, recomendando as melhores culturas para cada talhão considerando características do terreno, objetivos do produtor e restrições agronômicas.

---

## ✨ Funcionalidades

### 🏠 Landing Page
Página inicial pública e profissional:
- Apresentação clara do sistema e suas funcionalidades
- Seções: Hero, Funcionalidades, Como Funciona, Dados e Transparência, Modos de Uso
- Visual premium dark-glass consistente com a aplicação
- CTAs para Dashboard e Planejamento
- Textos honestos sobre capacidades e limitações

### 📊 Dashboard
Visão geral completa do planejamento com:
- Métricas principais (lucro total, risco médio, fitness, diversidade)
- Status de validação do algoritmo
- Gráficos comparativos de cenários
- Plano recomendado detalhado por talhão

### 📅 Planejamento de Safra
Sistema inteligente de planejamento agrícola:
- **Modo Manual**: Cadastro direto de talhões com características detalhadas
- **Modo Guiado**: Wizard passo a passo para iniciantes com recomendações
- Geração de calendário agrícola por cultura com clima integrado
- Tarefas organizadas por fase do ciclo da cultura
- **Base de conhecimento para 10 culturas**: soja, milho, feijão, café, cana, arroz, trigo, sorgo, mandioca, algodão
- Clima integrado: **Open-Meteo** (0–16 dias) + **NASA POWER** (17+ dias climatologia)
- **Replanejamento por imprevistos**: registre o que aconteceu e receba sugestões de ajuste
- Sugestões com nível de risco (🟢 baixo / 🟡 médio / 🔴 alto) e validação manual quando necessário
- Linguagem cautelosa: não substitui assistência técnica agronômica
- Recomendações de ações por prioridade
- Seleção de região climática integrada
- Aviso de cautela sobre ajustes necessários

### Configurações e Modo Avançado Modular
Controle fino dos módulos inteligentes em `/configuracoes`:
- Perfis prontos: Iniciante, Intermediário, Avançado e Manual
- Módulos agrupados por Planejamento, Clima e ZARC, Mercado e Assistente
- Clima, ZARC, preços, validação de mercado, comparação, otimização experimental, replanejamento e explicações podem ser ligados/desligados
- Dependências tratadas automaticamente: recursos de mercado dependem de preços, e a otimização experimental depende também da validação de lucro de mercado
- Páginas integradas: `/planejamento`, `/dashboard` e `/comparacao-mercado`
- Preferências persistidas no navegador via `localStorage`

### 🗺️ Talhões
Visualização e análise dos talhões da propriedade:
- Características de cada talhão (solo, clima, relevo, água)
- Filtros inteligentes
- Gráficos de distribuição
- Recomendações personalizadas de cultura

### 🧬 Algoritmo Genético
Otimização inteligente do planejamento:
- 4 objetivos: Equilibrado, Lucro, Risco, Sustentável
- Visualização da evolução do fitness
- Configuração de parâmetros (gerações, população)
- Explicação detalhada do algoritmo

### ✅ Validação
Validação rigorosa dos resultados:
- **Modos de performance**: Rápido (padrão), Normal e Completo
- Comparação AG vs Força Bruta (quando viável)
- Análise de estabilidade com múltiplas rodadas
- Métricas de convergência
- Explicação da escalabilidade (10 bilhões de combinações)
- Modo rápido recomendado para uso interativo (~3s por rodada)

### 🎯 Cenários
Comparação entre diferentes estratégias:
- 4 cenários pré-definidos + solução do AG
- Ranking por lucro e risco
- Gráficos comparativos
- Análise detalhada de cada cenário

### 📄 Relatórios
Geração de relatórios profissionais:
- Formatos: Markdown e TXT
- Configuração por objetivo
- Preview em tempo real

## 🌐 Provedores de Dados Reais

O AgroPlan AI integra múltiplos provedores de dados reais para enriquecer as recomendações:

### ☁️ Open-Meteo (Clima Real)
- Dados climáticos históricos e atuais
- Temperatura, precipitação, umidade, radiação solar
- Ajuste automático de risco baseado em condições reais
- **Gratuito** e sem necessidade de chave de API

### 🌾 ZARC (Janelas de Plantio)
- Zoneamento Agrícola de Risco Climático oficial
- Janelas de plantio recomendadas por cultura, solo e região
- Índice compacto derivado dos dados oficiais do MAPA
- Cobertura: principais culturas e regiões do Brasil

### 💰 Preços Agrícolas (Referência de Mercado)
- Preços de referência para as principais culturas
- Índice local com fallback para cobertura completa
- Fonte: dados de mercado e referências regionais
- **Normalização de unidades**: Todos os preços convertidos para R$/tonelada
- **Lucro de mercado**: Estimativa experimental para comparação

#### Normalização de Unidades

O sistema normaliza automaticamente diferentes unidades de medida para uma base comum (R$/tonelada):

| Unidade Original | Fator | Exemplo |
|-----------------|-------|---------|
| `tonelada` | ×1.0 | R$ 98/ton → R$ 98/ton |
| `saca_60kg` | ×16.67 | R$ 130/saca → R$ 2.166,67/ton |
| `saca_50kg` | ×20.0 | R$ 85/saca → R$ 1.700/ton |
| `arroba_15kg` | ×66.67 | R$ 3.200/arroba → R$ 213.333,33/ton |

**Importante**: Os preços são normalizados para R$/tonelada, mas o lucro principal ainda não é recalculado automaticamente. O **lucro de mercado** é exibido apenas como **comparação experimental** ao lado do lucro do sistema. Isso permite validar preços e produtividades antes de ativar o recálculo automático.

### Validação do Lucro de Mercado

O sistema compara o lucro interno (base do sistema) com o lucro calculado usando preços de mercado normalizados, classificando a **confiabilidade** de cada estimativa:

#### Classificação de Confiabilidade

| Confiabilidade | Critério | Significado |
|----------------|----------|-------------|
| 🟢 **Alta** | Diferença < 50% | Dados confiáveis, preço real disponível |
| 🟡 **Média** | Diferença 50-100% ou fallback | Requer atenção, pode usar fallback |
| 🔴 **Baixa** | Diferença > 100% ou dados incompletos | Requer validação antes de usar |

#### Por que validar?

Diferenças altas entre lucro do sistema e lucro de mercado podem indicar:
- **Preço desatualizado** ou não reflete mercado local
- **Produtividade** diferente da realidade
- **Custo** não condiz com a operação
- **Unidade comercial** incorreta

#### Status Atual

**O lucro de mercado é exibido apenas como comparação experimental.** O lucro principal do sistema continua usando a base interna enquanto os valores de mercado são validados.

- **`PRICE_APPLY_TO_PROFIT=false`** (padrão): Lucro de mercado não afeta otimização
- **Endpoint de diagnóstico**: `GET /debug/lucro-mercado?uf=SP` para análise detalhada
- **Interface visual**: Dashboard, Talhões e Genético mostram confiabilidade com cores

**Próxima etapa**: Após validação extensiva, o sistema poderá usar lucro de mercado na otimização com `PRICE_APPLY_TO_PROFIT=true`.

### Avaliação Comparativa com Lucro de Mercado

O sistema permite avaliar o plano principal usando lucro de mercado normalizado para comparação:

#### O que é?

- **Avalia** o plano principal gerado pelo AG usando lucro de mercado
- **NÃO gera** um novo plano otimizado por mercado
- **Compara** os dois valores de lucro (sistema vs mercado)
- **Bloqueia** uso automático se houver itens críticos

#### Endpoint

```
GET /comparar/lucro-mercado?uf=SP&municipio=Clementina&safra=2025/2026&seed=42&geracoes=50
```

**Parâmetros**:
- `objetivo`: Objetivo de otimização (padrão: "equilibrado")
- `seed`: Seed para reprodutibilidade (padrão: 42)
- `geracoes`: Número de gerações do AG (padrão: 100)
- `populacao`: Tamanho da população (padrão: 50)
- `uf`: Unidade Federativa (opcional)
- `municipio`: Município (opcional)
- `safra`: Safra ZARC (padrão: "2025/2026")

#### Regras de Bloqueio

O sistema bloqueia o uso automático de lucro de mercado (`pode_usar_mercado = false`) se:
- `itens_criticos > 0` (diferença >150%, lucro invertido, ou fallback com diferença >100%)
- `itens_baixa_confiabilidade > 0` (diferença >150%)
- `percentual_alta_confiabilidade < 70%`

#### Interface

- **Página dedicada**: `/comparacao-mercado` com resumo e tabela detalhada
- **Badges de confiabilidade**: Verde (alta), Amarelo (média), Vermelho (baixa), Vermelho crítico
- **Avisos claros**: "Esta avaliação é experimental e não substitui o plano principal"

#### Importante

**`PRICE_APPLY_TO_PROFIT=false` permanece padrão.** Esta é apenas uma avaliação comparativa para análise de sensibilidade, não uma otimização por lucro de mercado.

### Otimização Experimental com Lucro de Mercado

**A otimização experimental com lucro de mercado é uma simulação avançada. Ela não substitui a recomendação principal e pode ser bloqueada automaticamente quando a confiabilidade dos dados for insuficiente.**

#### O que é?

- **Gera** um plano otimizado usando lucro de mercado normalizado como fitness
- **NÃO substitui** a recomendação principal do sistema
- **Bloqueia** uso automático se houver itens críticos ou baixa confiabilidade
- **Experimental**: Requer validação manual antes de usar

#### Diferença entre Avaliação e Otimização

| Modo | O que faz | Quando usar |
|------|-----------|-------------|
| **Avaliação Comparativa** | Avalia o plano atual com lucro de mercado | Análise de sensibilidade |
| **Otimização Experimental** | Gera novo plano usando lucro de mercado | Simulação avançada |

#### Endpoint

```
GET /otimizar/lucro-mercado-experimental?uf=SP&municipio=Clementina&safra=2025/2026&seed=42&geracoes=50
```

**Parâmetros**:
- `objetivo`: Sempre "mercado" (forçado)
- `seed`: Seed para reprodutibilidade (padrão: 42)
- `geracoes`: Número de gerações do AG (padrão: 50)
- `populacao`: Tamanho da população (padrão: 50)
- `uf`: Unidade Federativa (opcional)
- `municipio`: Município (opcional)
- `safra`: Safra ZARC (padrão: "2025/2026")

#### Regras de Bloqueio Automático

O plano experimental é **bloqueado** (`bloqueado = true`) se:
- `itens_criticos > 0` (diferença extrema >100% entre lucro sistema e mercado)
- `itens_baixa_confiabilidade > 0`
- `percentual_alta_confiabilidade < 70%`
- `lucro_mercado_total <= 0`

#### Interface

- **Página dedicada**: `/comparacao-mercado` com seção experimental
- **Aparece após avaliação**: Seção experimental só aparece após executar avaliação
- **Status de bloqueio**: Card vermelho (bloqueado) ou verde (liberado)
- **Confiabilidade**: Mini cards com Alta/Média/Críticos
- **Avisos claros**: "Este plano é experimental e não substitui a recomendação principal"

#### Importante

- **O plano principal continua sendo o plano seguro do sistema**
- **`PRICE_APPLY_TO_PROFIT=false` permanece padrão**
- **Mesmo liberado, requer validação manual antes de usar**
- **Itens críticos bloqueiam uso automático**

📖 **Documentação completa**: [docs/API_PROVIDERS.md](docs/API_PROVIDERS.md)

---

## 🚀 Modo Local Opcional

O AgroPlan AI oferece um **modo local acelerado** para desenvolvimento e uso diário:

### 🌐 Arquitetura Híbrida
- **Online**: Frontend (Vercel) + Backend (Render) - funciona em qualquer PC
- **Local**: Frontend (Vercel) + Backend (localhost:8000) - mais rápido, não dorme

### ⚡ Vantagens do Modo Local
- **Performance**: Resposta instantânea (~0.1s vs ~0.3s)
- **Disponibilidade**: Não depende do Render acordar
- **Desenvolvimento**: Ideal para uso diário e modificações

### 🛠️ Setup Rápido
**Requer [Bun ≥ 1.0](https://bun.sh/) instalado**

```bash
# 1. Instalar CLI global
bun add -g agroplan-ai-cli

# 2. Configurar API local
agroplan setup

# 3. Iniciar API local
agroplan serve on

# 4. Abrir no navegador
agroplan open
```

**Para desenvolvedores:**
```bash
git clone https://github.com/Kuuhaku-Allan/agroplan-ai
cd agroplan-ai/tools/agroplan-cli
bun install && bun run agroplan doctor
```

### 🎯 Detecção Automática
O frontend detecta automaticamente qual API usar:
- **🖥️ API Local**: Badge verde quando localhost:8000 disponível
- **☁️ API Render**: Badge azul quando usa fallback online
- **Menu clicável**: Seletor visual na Topbar permite alternar entre Automático/Local/Render
- **Assistente integrado**: Guia passo a passo quando API Local não disponível

### 🌐 Modo Render e API Local

A aplicação suporta dois modos de API com detecção automática:

#### API Render (Padrão)
- **URL**: `https://agroplan-ai-api.onrender.com`
- **Vantagens**: Funciona em qualquer lugar, sem instalação
- **Limitações**: Plano Free dorme após ~15 minutos sem uso
- **Wake-up**: Pode levar ~1 minuto para acordar

#### API Local (Opcional)
- **URL**: `http://localhost:8000`
- **Vantagens**: Mais rápida, não dorme, ideal para desenvolvimento
- **Requisitos**: Requer instalação local (ver Setup Rápido acima)

#### Assistente de Conexão

Quando a API Render está dormindo, o sistema:

1. **Detecta automaticamente** a latência alta (> 5 segundos)
2. **Mostra aviso visual** no seletor de API
3. **Oferece opções:**
   - Acordar API Render automaticamente
   - Abrir API Render em nova aba
   - Tentar novamente
   - Usar API Local (se disponível)

#### Keep-Alive para Apresentações

Para manter a API Render acordada durante apresentações:

1. Clicar no badge da API (canto superior direito)
2. Marcar "Manter API Render acordada"
3. Sistema faz ping a cada 10 minutos
4. API permanece acordada enquanto aba estiver aberta

**Nota**: Keep-alive consome horas grátis do Render Free. Use apenas quando necessário.

📖 **Documentação completa**: [docs/LOCAL_MODE.md](docs/LOCAL_MODE.md)
- Download e cópia para área de transferência

---

## 🚀 Tecnologias

### Frontend
- **Next.js 16** - Framework React com SSR
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **shadcn/ui** - Componentes UI premium (Nova - Lucide/Geist)
- **Recharts** - Visualização de dados
- **Lucide React** - Ícones modernos

### Backend
- **FastAPI** - Framework web Python moderno
- **Python 3.11+** - Linguagem de programação
- **Pandas** - Manipulação de dados
- **NumPy** - Computação numérica
- **Uvicorn** - Servidor ASGI

### Algoritmo
- **Algoritmo Genético** customizado
- **Força Bruta** para validação (quando viável)
- **Análise de Estabilidade** com múltiplas rodadas

---

## 📋 Pré-requisitos

- **Node.js** 18+ ou 20+
- **Python** 3.11+
- **npm** ou **yarn**
- **pip** (gerenciador de pacotes Python)

---

## 🔧 Instalação Local

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/agroplan-ai.git
cd agroplan-ai
```

### 2. Configure o Backend

```bash
cd backend

# Crie um ambiente virtual
python -m venv venv

# Ative o ambiente virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env se necessário

# Execute o servidor
python api.py
```

O backend estará disponível em `http://localhost:8000`

### 3. Configure o Frontend

```bash
cd ../frontend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local se necessário

# Execute o servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em `http://localhost:3000`

### 4. Acesse a aplicação

Abra seu navegador em `http://localhost:3000`

---

## 📚 Documentação da API

Após iniciar o backend, acesse:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🎨 Design

### Tema Dark Premium
- Fundo: `#020617` (slate-950)
- Cards: `#111827` (slate-900)
- Cor principal: `#10b981` (emerald-500)
- Bordas translúcidas com efeito glassmorphism

### Formatação
- **Moeda**: Padrão brasileiro (R$ 140.000,00)
- **Percentuais**: Uma casa decimal (31,7%)
- **Fitness**: Pontuação normalizada de 0 a 100
- **Compatibilidade**: Limitada a 100%

---

## 🧬 Como Funciona o Algoritmo Genético

O AgroPlan AI utiliza um Algoritmo Genético para encontrar a melhor combinação de culturas para cada talhão:

### 1. População Inicial
Gera 50 soluções aleatórias (indivíduos), cada uma representando uma alocação de culturas aos talhões.

### 2. Avaliação (Fitness)
Cada solução é avaliada considerando:
- **Lucro**: Retorno financeiro estimado
- **Risco**: Exposição a fatores de risco
- **Compatibilidade**: Adequação da cultura ao terreno
- **Diversidade**: Variedade de culturas plantadas

### 3. Seleção
As melhores soluções são selecionadas para reprodução (seleção por torneio).

### 4. Crossover
Soluções selecionadas são combinadas para gerar novas soluções (filhos).

### 5. Mutação
Pequenas alterações aleatórias são aplicadas para explorar novas possibilidades.

### 6. Evolução
O processo se repete por 100 gerações, melhorando progressivamente a solução.

### Objetivos Disponíveis

- **Equilibrado**: Balanceia lucro, risco e sustentabilidade
- **Lucro**: Prioriza retorno financeiro
- **Risco**: Minimiza exposição ao risco
- **Sustentável**: Prioriza compatibilidade e diversidade

---

## ✅ Validação

O sistema oferece dois métodos de validação:

### Força Bruta
Para espaços de busca pequenos (≤10.000 combinações):
- Testa todas as combinações possíveis
- Garante encontrar o ótimo global
- Compara com o resultado do AG

### Múltiplas Rodadas
Para espaços grandes (>10.000 combinações):
- Executa várias rodadas do AG com seeds diferentes
- Analisa estabilidade e convergência
- Calcula desvio padrão das métricas

**Nota**: Com 10 culturas e 10 talhões, temos **10 bilhões** de combinações possíveis, tornando a força bruta inviável.

---

## 🚀 Deploy

### Backend (Render - Python Runtime Recomendado)

1. Crie uma conta no [Render](https://render.com)
2. Conecte seu repositório GitHub
3. Crie um novo **Web Service**
4. Configure:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn api:app --host 0.0.0.0 --port $PORT`
5. Adicione variáveis de ambiente:
   ```
   CORS_ORIGINS=http://localhost:3000
   DATA_MODE=simulated
   ```
6. Deploy!
7. Teste: `https://seu-backend.onrender.com/health`

**Nota**: O Dockerfile está disponível como alternativa, mas o Python Runtime é a opção recomendada inicialmente por ser mais simples e evitar problemas com Docker.

### Frontend (Vercel)

1. Crie uma conta na [Vercel](https://vercel.com)
2. Importe seu repositório GitHub
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js
4. Adicione variável de ambiente:
   ```
   NEXT_PUBLIC_API_URL=https://seu-backend.onrender.com
   ```
5. Deploy!

Para instruções detalhadas, consulte [docs/DEPLOY.md](docs/DEPLOY.md)

---

## 📊 Dados Atuais

### Culturas (10)
Café, Milho, Soja, Cana, Feijão, Algodão, Trigo, Arroz, Sorgo, Mandioca

### Talhões (10)
10 talhões com diferentes características:
- Solos: Argiloso, Arenoso, Misto, Siltoso
- Climas: Quente, Ameno, Frio
- Relevos: Plano, Leve, Médio, Íngreme
- Água: Baixa, Média, Alta

### Combinações Possíveis
**10.000.000.000** (10 bilhões) de combinações possíveis

---

## ⚠️ Limitações Atuais

- **Dados simulados**: Utiliza CSV estáticos, não APIs reais
- **Sem banco de dados**: Dados não são persistidos
- **Sem autenticação**: Acesso público
- **Sem edição**: Talhões e culturas não são editáveis
- **Sem mapa**: Visualização geográfica não implementada
- **Não substitui agrônomo**: Ferramenta de apoio à decisão, não substitui consultoria profissional

---

## 🔮 Roadmap: Planejador de Safra Inteligente

O objetivo final do AgroPlan AI é evoluir de um **otimizador de culturas** para um **assistente completo de planejamento e acompanhamento agrícola**. Não apenas "qual cultura plantar?", mas **onde, quando, como cuidar, quando irrigar, adubar e colher**.

### Visão do Produto Final

**Planejador de Safra Inteligente** - Um assistente que acompanha o ciclo agrícola completo:

- 🗺️ **Criar/selecionar terrenos** (manual, mapa ou busca)
- 🌱 **Recomendar culturas** baseado em solo, clima, ZARC e preços
- 📅 **Gerar calendário agrícola** com tarefas por fase da cultura
- 🌦️ **Alertas climáticos** para irrigação, chuva, temperatura
- 🔄 **Replanejamento inteligente** quando houver imprevistos
- 📊 **Acompanhamento do ciclo** com observações e intervenções
- 🎓 **Modo guiado** para iniciantes e **modo avançado** para especialistas

### Estratégia de Dados Climáticos

**Honestidade sobre limitações de previsão:**

- **0-16 dias**: Previsão meteorológica real (Open-Meteo)
- **17+ dias**: Climatologia histórica + ZARC (NASA POWER)

Não fingimos ter "previsão exata de 120 dias". Usamos dados históricos, médias climatológicas e janelas de risco para o restante do ciclo.

### Fases de Desenvolvimento

#### ✅ Fase 1-9: Base Técnica (Concluída)
- [x] Dashboard com métricas e visualizações
- [x] Algoritmo Genético com 4 objetivos
- [x] Validação (Força Bruta + Múltiplas Rodadas)
- [x] Dados climáticos reais (Open-Meteo)
- [x] ZARC oficial com índice rápido
- [x] Preços agrícolas com normalização de unidades
- [x] Lucro de mercado experimental
- [x] Relatórios profissionais (MD/TXT)
- [x] API Local acelerada (CLI)

#### 🚧 Fase 10: Planejador de Safra Inteligente (Em Desenvolvimento)

**10.1 - Modelo de Domínio e Arquitetura** ⏳
- [ ] Atualizar roadmap (este documento)
- [ ] Criar `docs/PLANEJADOR_SAFRA.md` com arquitetura
- [ ] Definir modelos: Property, Field, CropPlan, CropCycle, CalendarTask
- [ ] Engine inicial de calendário agrícola
- [ ] Endpoint `POST /planejamento/calendario`
- [ ] Base local para 3 culturas (soja, milho, feijão)

**10.2 - Cadastro Manual de Terrenos**
- [ ] Formulário para criar talhão manualmente
- [ ] Campos: nome, área, solo, relevo, água, UF, município, coordenadas
- [ ] Conectar com ZARC, clima e preços existentes
- [ ] CRUD básico de propriedades e talhões

**10.3 - Modo Guiado para Iniciantes**
- [ ] Wizard passo a passo
- [ ] Perguntas simples sobre terreno e objetivo
- [ ] Recomendação automática de culturas
- [ ] Geração de calendário simplificado

**10.4 - Calendário Agrícola Local**
- [ ] Base de conhecimento por cultura (10 culturas)
- [ ] Fases: germinação, vegetativa, crítica hídrica, colheita
- [ ] Tarefas básicas: preparar solo, plantar, irrigar, adubar, colher
- [ ] Alertas básicos por fase

**10.5 - Calendário com Clima Integrado**
- [ ] Curto prazo (0-16 dias): Open-Meteo
- [ ] Longo prazo (17+ dias): NASA POWER climatologia
- [ ] Alertas de irrigação baseados em chuva prevista
- [ ] Alertas de temperatura crítica
- [ ] Ajuste de tarefas por condições climáticas

**10.6 - Replanejamento por Imprevistos** ✅ CONCLUÍDA
- [x] Usuário informa: "não consegui irrigar", "choveu demais", "solo seco", "observei praga", etc.
- [x] Motor de replanejamento gera sugestões com nível de risco (baixo/médio/alto)
- [x] Validação manual obrigatória para pragas, doenças e tarefas críticas
- [x] Endpoint `POST /planejamento/replanejar`
- [x] UI dark-glass com cards de sugestão e botão desabilitado "Aplicar — em breve"
- [x] 10 tipos de imprevistos suportados
- [x] CLI 1.0.38 publicada com feature `calendar_replanning_engine`

**10.7 - Aplicação de Sugestões de Replanejamento** ✅ CONCLUÍDA
- [x] Endpoint `POST /planejamento/replanejar/aplicar` para gerar simulação de calendário
- [x] Histórico de alterações e badges nas tarefas replanejadas
- [x] Interface que preserva original e permite comparar (Ver Original vs Ver Ajustado)
- [x] Validação segura para sugestões com alto risco
- [x] CLI 1.0.40 publicada com feature `calendar_replanning_apply_suggestions`

**10.8 - Modo Avançado Modular** ✅ CONCLUÍDA
- [x] Página `/configuracoes` com presets e módulos agrupados
- [x] Clima: ligado/desligado com payload seguro
- [x] ZARC: ligado/desligado com payload seguro
- [x] Preços agrícolas e módulos dependentes
- [x] Comparação de mercado e validação modular
- [x] Otimização experimental bloqueada por dependências
- [x] Replanejamento por imprevistos modular
- [x] Explicações guiadas completas/reduzidas
- [x] Integração em `/planejamento`, `/dashboard` e `/comparacao-mercado`

**Backlog pós-MVP - Mapa e Desenho de Terreno**
- [ ] Selecionar terreno no mapa
- [ ] Desenhar polígono
- [ ] Calcular área automaticamente
- [ ] Detectar município e coordenadas
- [ ] Puxar contexto de solo/clima/ZARC

#### 📦 Fase 11: Persistência e Multiusuário
- [ ] PostgreSQL para dados persistentes
- [ ] Suporte a múltiplas propriedades por usuário
- [ ] Histórico de planejamentos e safras
- [ ] Autenticação e perfis de usuário

#### 🌍 Fase 12: Fontes de Dados Avançadas
- [ ] NASA POWER para climatologia de longo prazo
- [ ] Embrapa Saúde do Solo (contexto municipal)
- [ ] MapBiomas (uso e cobertura da terra)
- [ ] IBGE Localidades (padronização de municípios)
- [ ] Conab (séries históricas de preços)

#### 🎓 Fase 13: Base de Conhecimento Agronômico
- [ ] Recomendações de insumos por cultura
- [ ] Categorias de ferramentas necessárias
- [ ] Manejo fitossanitário (com cautela e fontes)
- [ ] Boas práticas por região
- [ ] Integração com Embrapa e fontes técnicas

### Níveis de Seleção de Terreno

**Nível 1 - Manual** (Fase 10.2) ✅ Viável agora
- Usuário informa: nome, área, solo, relevo, água, UF, município, coordenadas

**Nível 2 - Mapa com Desenho** (backlog pós-MVP)
- Usuário desenha polígono no mapa
- Sistema calcula: área, coordenadas, município, clima, ZARC

**Nível 3 - Busca Automática** (Futuro distante)
- Integração com cadastros oficiais (SNCR/INCRA)
- Complexidade alta, não prioritário para projeto acadêmico

---

## 📁 Estrutura do Projeto

```
agroplan-ai/
├── backend/                # Backend FastAPI
│   ├── api.py             # Servidor principal
│   ├── core/              # Lógica de negócio
│   │   ├── loader.py      # Carregamento de dados
│   │   ├── planner.py     # Algoritmo Genético
│   │   ├── bruteforce_validator.py
│   │   ├── report_generator.py
│   │   └── ...
│   ├── data/              # Dados CSV
│   ├── reports/           # Relatórios gerados
│   ├── requirements.txt   # Dependências Python
│   ├── Dockerfile         # Container Docker
│   └── README.md
│
├── frontend/              # Frontend Next.js
│   ├── app/              # Páginas (App Router)
│   ├── components/       # Componentes React
│   ├── lib/              # Utilitários
│   ├── public/           # Arquivos estáticos
│   ├── package.json      # Dependências Node
│   └── README.md
│
├── docs/                 # Documentação
│   └── DEPLOY.md        # Guia de deploy
│
├── .gitignore
└── README.md            # Este arquivo
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto é um protótipo educacional e de demonstração.

---

## 👥 Autores

Desenvolvido como projeto de Sistema Inteligente de Planejamento Agrícola.

---

## 📧 Contato

Para dúvidas ou sugestões, abra uma issue no GitHub.

---

## 🙏 Agradecimentos

- Comunidade Next.js
- Comunidade FastAPI
- shadcn/ui pelo design system
- Recharts pela biblioteca de gráficos

---

**⚠️ Aviso Legal**: Este sistema é uma ferramenta de apoio à decisão e não substitui a consultoria de um agrônomo profissional. Sempre consulte especialistas antes de tomar decisões de plantio.
