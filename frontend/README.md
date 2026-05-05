# AgroPlan AI - Frontend

Interface web moderna para o Sistema Inteligente de Planejamento de Plantio.

## 🚀 Tecnologias

- **Next.js 16** - Framework React com SSR e SSG
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes UI premium (preset Nova - Lucide/Geist)
- **Recharts** - Biblioteca de gráficos
- **Lucide React** - Ícones modernos

## 📋 Pré-requisitos

- Node.js 18+ ou 20+
- npm ou yarn

## 🔧 Instalação Local

1. **Clone o repositório** (se ainda não fez):
```bash
git clone <seu-repositorio>
cd agroplan/frontend
```

2. **Instale as dependências**:
```bash
npm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente**:
```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Edite .env.local
```

4. **Execute o servidor de desenvolvimento**:
```bash
npm run dev
# ou
yarn dev
```

O aplicativo estará disponível em `http://localhost:3000`

## 🏗️ Build para Produção

```bash
# Build
npm run build

# Executar build localmente
npm run start
```

## 🌍 Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NEXT_PUBLIC_API_URL` | URL da API backend | `http://localhost:8000` |

### Desenvolvimento:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Produção:
```bash
NEXT_PUBLIC_API_URL=https://seu-backend.onrender.com
```

## 📱 Páginas

### Dashboard (`/dashboard`)
Visão geral do planejamento agrícola com:
- Métricas principais (lucro, risco, fitness, diversidade)
- Status de validação
- Gráficos de comparação de cenários
- Plano recomendado detalhado

### Talhões (`/talhoes`)
Visualização dos talhões da propriedade:
- Cards com características de cada talhão
- Filtros por solo, clima, água
- Gráficos de distribuição
- Recomendações de cultura por talhão

### Algoritmo Genético (`/genetico`)
Interface para otimização com AG:
- Seletor de objetivo (equilibrado, lucro, risco, sustentável)
- Visualização da evolução do fitness
- Resultado detalhado do plano otimizado
- Explicação do algoritmo

### Validação (`/validacao`)
Validação do Algoritmo Genético:
- Comparação AG vs Força Bruta (quando viável)
- Análise de estabilidade com múltiplas rodadas
- Métricas de convergência
- Explicação da escalabilidade

### Cenários (`/cenarios`)
Comparação entre diferentes cenários:
- 4 cenários pré-definidos + AG
- Ranking por lucro e risco
- Gráficos comparativos
- Detalhes de cada cenário

### Relatórios (`/relatorios`)
Geração de relatórios completos:
- Configuração (objetivo, formato)
- Preview do relatório
- Download em Markdown ou TXT
- Copiar para área de transferência

### Sobre (`/sobre`)
Informações sobre o projeto (a implementar)

## 🎨 Design System

### Tema Dark Premium
- **Fundo**: `#020617` (slate-950)
- **Cards**: `#111827` (slate-900)
- **Cor principal**: `#10b981` (emerald-500)
- **Bordas**: Translúcidas com efeito glassmorphism

### Componentes UI
Todos os componentes seguem o preset **Nova - Lucide/Geist** do shadcn/ui:
- Button
- Card
- Badge
- Input
- Select
- Table
- Tabs
- Tooltip
- Skeleton

### Badges Coloridos

**Solo**:
- Argiloso: âmbar
- Arenoso: amarelo
- Misto: verde
- Siltoso: cinza

**Clima**:
- Quente: vermelho
- Ameno: verde
- Frio: azul

**Água**:
- Baixa: vermelho
- Média: âmbar
- Alta: azul

**Risco**:
- <25%: verde
- 25-39%: âmbar
- ≥40%: vermelho

**Compatibilidade**:
- ≥75%: verde
- 60-74%: âmbar
- <60%: vermelho

## 📊 Formatação

### Moeda
Padrão brasileiro: `R$ 140.000,00`

### Percentuais
Com uma casa decimal: `31,7%`

### Fitness
Pontuação normalizada de 0 a 100

### Compatibilidade
Limitada a 100% máximo

## 🔌 Integração com Backend

O frontend consome a API através de `lib/api.ts`:

```typescript
import { getDashboard, getTalhoes, otimizar } from '@/lib/api';

// Exemplo de uso
const dashboard = await getDashboard();
const talhoes = await getTalhoes();
const resultado = await otimizar({ objetivo: 'lucro' });
```

## 🚀 Deploy

### Vercel (Recomendado)

1. **Conecte seu repositório GitHub à Vercel**
2. **Configure o projeto**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js
3. **Adicione variável de ambiente**:
   - `NEXT_PUBLIC_API_URL`: URL do seu backend
4. **Deploy!**

A Vercel detectará automaticamente Next.js e configurará tudo.

### Outras plataformas

O frontend pode ser deployado em qualquer plataforma que suporte Next.js:
- Netlify
- Railway
- AWS Amplify
- Azure Static Web Apps

## 📁 Estrutura de Pastas

```
frontend/
├── app/                    # Páginas (App Router)
│   ├── dashboard/
│   ├── talhoes/
│   ├── genetico/
│   ├── validacao/
│   ├── cenarios/
│   ├── relatorios/
│   └── sobre/
├── components/             # Componentes React
│   ├── dashboard/
│   ├── talhoes/
│   ├── genetico/
│   ├── validacao/
│   ├── cenarios/
│   ├── relatorios/
│   ├── layout/            # AppShell, Sidebar, Topbar
│   ├── shared/            # Componentes compartilhados
│   └── ui/                # Componentes shadcn/ui
├── lib/                   # Utilitários
│   ├── api.ts            # Cliente da API
│   ├── formatters.ts     # Formatação de dados
│   └── types.ts          # Tipos TypeScript
└── public/               # Arquivos estáticos
```

## 🎯 Funcionalidades

### Estados de Loading
Todos os componentes têm estados de loading com skeletons.

### Tratamento de Erros
Componente `ErrorState` com botão de retry.

### Responsividade
Design responsivo para desktop, tablet e mobile.

### Acessibilidade
- Semântica HTML correta
- ARIA labels
- Navegação por teclado
- Contraste adequado

## 🐛 Troubleshooting

### Erro de conexão com API
Verifique se:
1. Backend está rodando
2. `NEXT_PUBLIC_API_URL` está correto
3. CORS está configurado no backend

### Build falha
```bash
# Limpe o cache
rm -rf .next node_modules
npm install
npm run build
```

### Variáveis de ambiente não funcionam
- Variáveis devem começar com `NEXT_PUBLIC_`
- Reinicie o servidor após alterar `.env.local`
- No build, use `.env.production`

## 📝 Limitações Atuais

- Sem autenticação
- Sem persistência de dados
- Sem edição de talhões/culturas
- Sem mapa interativo
- Sem modo offline

## 🔮 Próximas Funcionalidades

- Landing page (`/`)
- Página sobre (`/sobre`)
- Autenticação de usuários
- Edição de talhões
- Visualização em mapa
- Exportação de dados
- Modo escuro/claro (toggle)
- Internacionalização (i18n)

## 📄 Licença

Este projeto é parte do AgroPlan AI.
