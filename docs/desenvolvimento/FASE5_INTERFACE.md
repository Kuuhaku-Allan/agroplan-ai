# 🎨 Fase 5 - Interface Premium com Next.js + FastAPI

## 🎯 Objetivo

Criar uma interface web moderna e profissional para o AgroPlan AI, com visual de SaaS premium, mantendo o motor Python no backend.

## 🏗️ Arquitetura

```
agroplan/
├── backend/              # FastAPI (Python)
│   ├── api.py           # API REST
│   ├── core/            # Motor do AgroPlan AI
│   ├── data/            # Dados CSV
│   └── reports/         # Relatórios gerados
│
├── frontend/            # Next.js (TypeScript)
│   ├── app/             # Pages (App Router)
│   ├── components/      # Componentes React
│   ├── lib/             # Utilitários
│   └── public/          # Assets estáticos
│
└── README.md
```

## 🔧 Stack Tecnológica

### Backend
- **FastAPI** - Framework web moderno para Python
- **Uvicorn** - Servidor ASGI de alta performance
- **Pydantic** - Validação de dados
- **CORS** - Configurado para desenvolvimento

### Frontend (A implementar)
- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utility-first
- **shadcn/ui** - Componentes UI premium
- **Motion** (Framer Motion) - Animações suaves
- **Recharts** - Gráficos interativos
- **Lucide React** - Ícones modernos

## 📡 API Backend (Implementado)

### Status: ✅ Completo e Funcionando

**URL Base:** `http://localhost:8000`
**Documentação:** `http://localhost:8000/docs`

### Endpoints Disponíveis

#### GET /
Informações da API

#### GET /health
Verifica saúde da API
```json
{
  "status": "healthy",
  "culturas": 5,
  "talhoes": 3,
  "regras": 5
}
```

#### GET /dashboard
Resumo completo do dashboard
```json
{
  "lucro_total": 238800.00,
  "risco_medio": 28.9,
  "fitness": 75.22,
  "diversidade": 3,
  "objetivo": "equilibrado",
  "culturas_escolhidas": ["soja", "feijao", "milho"],
  "validacao": {
    "otimo_global": true,
    "total_combinacoes": 125
  },
  "plano": [...]
}
```

#### GET /talhoes
Lista todos os talhões

#### GET /culturas
Lista todas as culturas com regras

#### GET /cenarios
Comparação de todos os cenários (6 estratégias)

#### POST /otimizar
Executa Algoritmo Genético
```json
{
  "objetivo": "equilibrado",
  "seed": 42,
  "geracoes": 100,
  "populacao": 50
}
```

#### POST /validar
Valida AG com força bruta

#### POST /rodadas
Executa múltiplas rodadas do AG

#### POST /relatorio
Gera relatório completo

## 🎨 Design System (A implementar)

### Paleta de Cores

**Tema Escuro Premium:**
- **Fundo:** `#020617` (slate-950)
- **Cards:** `#111827` (gray-900) / `#1e293b` (slate-800)
- **Primário:** `#10b981` (emerald-500) - Verde agrícola
- **Secundário:** `#22c55e` (green-500)
- **Lucro:** `#f59e0b` (amber-500)
- **Risco:** `#ef4444` (red-500)
- **Texto Principal:** `#f8fafc` (slate-50)
- **Texto Secundário:** `#94a3b8` (slate-400)

### Tipografia
- **Fonte:** Inter (sans-serif)
- **Títulos:** font-bold
- **Corpo:** font-normal
- **Código:** font-mono

### Componentes
- Cards com gradiente sutil
- Bordas arredondadas (rounded-lg)
- Sombras suaves (shadow-lg)
- Animações discretas
- Badges de status
- Gráficos limpos

## 📱 Páginas Planejadas

### 1. Dashboard (`/`)
**Objetivo:** Visão geral rápida

**Elementos:**
- 5 cards de métricas principais
  - Lucro Total
  - Risco Médio
  - Fitness
  - Diversidade
  - Validação
- Gráfico de lucro por cenário (barras)
- Gráfico de risco por cenário (barras)
- Tabela do plano recomendado
- Botão "Gerar Relatório"

### 2. Talhões (`/talhoes`)
**Objetivo:** Visualizar características dos talhões

**Elementos:**
- Cards por talhão com:
  - Área
  - Solo, clima, relevo, água
  - Cultura recomendada
  - Barra de compatibilidade
- Possibilidade de edição futura

### 3. Cenários (`/cenarios`)
**Objetivo:** Comparar estratégias

**Elementos:**
- 6 cards de cenários:
  - Equilibrado
  - Máximo Lucro
  - Baixo Risco
  - Sustentável
  - Conservador
  - Algoritmo Genético
- Gráfico comparativo
- Tabela detalhada
- Badge de "Recomendado"

### 4. Algoritmo Genético (`/genetico`)
**Objetivo:** Executar e visualizar otimização

**Elementos:**
- Seletor de objetivo
- Configurações (gerações, população, seed)
- Botão "Executar Otimização"
- Loading com animação
- Gráfico de evolução do fitness
- Plano encontrado
- Penalidades aplicadas
- Comparação AG vs Força Bruta
- Selo "Ótimo Global Encontrado"

### 5. Validação (`/validacao`)
**Objetivo:** Validar cientificamente

**Elementos:**
- Botão "Validar com Força Bruta"
- Total de combinações
- Comparação lado a lado
- Status: Ótimo global?
- Diferenças de fitness e lucro
- Explicação de escalabilidade
- Gráfico de estabilidade

### 6. Relatórios (`/relatorios`)
**Objetivo:** Gerar e visualizar relatórios

**Elementos:**
- Seletor de objetivo
- Seletor de formato (MD/TXT)
- Botão "Gerar Relatório"
- Prévia do relatório
- Botão "Copiar"
- Botão "Download"
- Histórico de relatórios

### 7. Sobre (`/sobre`)
**Objetivo:** Explicar o sistema

**Elementos:**
- Objetivo do AgroPlan AI
- Fases implementadas
- Por que usa AG
- Como foi validado
- Limitações
- Próximas evoluções
- Créditos

## 🚀 Como Executar

### Backend (Já funcionando)

```bash
cd backend
pip install -r requirements.txt
python api.py
```

Servidor em: `http://localhost:8000`
Docs em: `http://localhost:8000/docs`

### Frontend (A implementar)

```bash
cd frontend
npm install
npm run dev
```

Aplicação em: `http://localhost:3000`

## 📊 Fluxo de Dados

```
Frontend (Next.js)
    ↓ HTTP Request
Backend (FastAPI)
    ↓ Processa
Motor Python (core/)
    ↓ Retorna
Backend (FastAPI)
    ↓ JSON Response
Frontend (Next.js)
    ↓ Renderiza
Usuário
```

## 🎯 Próximos Passos

### Fase 5.0 - Backend ✅
- [x] Reorganizar projeto
- [x] Criar API FastAPI
- [x] Implementar endpoints
- [x] Configurar CORS
- [x] Testar endpoints
- [x] Documentar API

### Fase 5.1 - Frontend (A fazer)
- [ ] Criar projeto Next.js
- [ ] Configurar Tailwind CSS
- [ ] Instalar shadcn/ui
- [ ] Criar layout principal
- [ ] Implementar Dashboard
- [ ] Implementar Talhões
- [ ] Implementar Cenários
- [ ] Implementar Algoritmo Genético
- [ ] Implementar Validação
- [ ] Implementar Relatórios
- [ ] Implementar Sobre

### Fase 5.2 - Integração (A fazer)
- [ ] Conectar frontend com backend
- [ ] Implementar loading states
- [ ] Implementar error handling
- [ ] Adicionar animações
- [ ] Otimizar performance
- [ ] Testar responsividade

### Fase 5.3 - Deploy (A fazer)
- [ ] Deploy backend no Render
- [ ] Deploy frontend na Vercel
- [ ] Configurar variáveis de ambiente
- [ ] Testar em produção

## 💡 Decisões de Design

### Por que Next.js?
- Framework React moderno e completo
- App Router para rotas
- Server Components para performance
- TypeScript nativo
- Fácil deploy na Vercel

### Por que FastAPI?
- Motor Python já existe
- API moderna e rápida
- Documentação automática
- Validação com Pydantic
- Async nativo

### Por que shadcn/ui?
- Componentes bonitos e customizáveis
- Open source
- Baseado em Radix UI
- Integração perfeita com Tailwind
- Visual profissional

### Por que não Streamlit?
- Streamlit é limitado visualmente
- Difícil customizar design
- Não parece SaaS profissional
- Next.js oferece controle total

## 🎨 Referências Visuais

**Inspirações:**
- Vercel Dashboard
- Linear App
- Notion
- Stripe Dashboard
- Tailwind UI

**Estilo:**
- Minimalista
- Espaçamento generoso
- Animações sutis
- Gradientes discretos
- Tipografia clara
- Ícones consistentes

## 📝 Status Atual

**Backend:** ✅ Completo e funcionando
**Frontend:** 🔜 A implementar
**Integração:** 🔜 A fazer
**Deploy:** 🔜 A fazer

## 🏆 Resultado Esperado

Uma aplicação web moderna que:
- ✅ Parece um produto SaaS profissional
- ✅ É rápida e responsiva
- ✅ Explica decisões claramente
- ✅ Visualiza dados de forma bonita
- ✅ É fácil de usar
- ✅ Impressiona em apresentações

---

**Fase atual:** 5.0/8 - Backend FastAPI ✅
**Próxima etapa:** 5.1 - Frontend Next.js
**Status:** Backend pronto, frontend a implementar
