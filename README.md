# 🌱 AgroPlan AI

**Sistema Inteligente de Planejamento de Plantio com Algoritmo Genético**

AgroPlan AI é uma plataforma web que utiliza Inteligência Artificial para otimizar o planejamento agrícola, recomendando as melhores culturas para cada talhão considerando características do terreno, objetivos do produtor e restrições agronômicas.

---

## ✨ Funcionalidades

### 📊 Dashboard
Visão geral completa do planejamento com:
- Métricas principais (lucro total, risco médio, fitness, diversidade)
- Status de validação do algoritmo
- Gráficos comparativos de cenários
- Plano recomendado detalhado por talhão

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
- Comparação AG vs Força Bruta (quando viável)
- Análise de estabilidade com múltiplas rodadas
- Métricas de convergência
- Explicação da escalabilidade (10 bilhões de combinações)

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

## 🔮 Próximas Funcionalidades

### Fase 7 - APIs Reais
- [ ] Integração com API de clima real
- [ ] Integração com API de preços de commodities
- [ ] Integração com API de dados de solo

### Fase 8 - Banco de Dados
- [ ] PostgreSQL para persistência
- [ ] Suporte a múltiplas propriedades
- [ ] Histórico de planejamentos

### Fase 9 - Autenticação
- [ ] Login de usuários
- [ ] Perfis de produtor
- [ ] Permissões e roles

### Fase 10 - Edição
- [ ] CRUD de talhões
- [ ] CRUD de culturas
- [ ] Importação de dados via CSV

### Fase 11 - Mapa
- [ ] Visualização geográfica dos talhões
- [ ] Desenho de polígonos
- [ ] Integração com Google Maps/Mapbox

### Fase 12 - Landing Page
- [ ] Página inicial institucional
- [ ] Apresentação do produto
- [ ] Call-to-action

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
