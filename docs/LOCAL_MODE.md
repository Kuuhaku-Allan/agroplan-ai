# Modo Local - AgroPlan AI

O **Modo Local** permite executar o backend FastAPI diretamente no seu computador, evitando a latência e possível inatividade do Render gratuito.

## 🎯 Quando Usar

### ✅ Use Modo Local quando:
- Trabalhando no projeto diariamente
- Precisar de resposta rápida (sem esperar Render acordar)
- Tiver controle total do ambiente (PC pessoal, desenvolvimento)
- Quiser evitar dependência de internet para funcionalidades básicas

### 🌐 Use Modo Online (Render) quando:
- Em computadores bloqueados (faculdade, empresa)
- Não puder instalar Python/dependências
- Compartilhando com outras pessoas
- Fazendo apresentações sem setup local

## 🚀 Instalação

### 1. Instalar Bun
```bash
# Windows (PowerShell)
irm bun.sh/install.ps1 | iex

# macOS/Linux
curl -fsSL https://bun.sh/install | bash
```

### 2. Verificar Python
```bash
python --version  # Deve ser 3.8+
pip --version     # Deve estar disponível
```

Se não tiver Python: https://python.org/downloads

## 📋 Comandos Disponíveis

### Diagnóstico
```bash
cd tools/agroplan-cli
bun run agroplan doctor
```
Verifica se tudo está configurado corretamente.

### Iniciar API Local
```bash
bun run agroplan serve on
```
- Cria ambiente virtual se necessário
- Instala dependências automaticamente
- Inicia servidor em http://localhost:8000
- Roda em background

### Parar API Local
```bash
bun run agroplan serve off
```
Encerra o servidor local com segurança.

### Status
```bash
bun run agroplan serve status
```
Mostra status da API local e Render.

### Logs
```bash
bun run agroplan serve logs
```
Exibe logs da API local.

### Abrir no Navegador
```bash
bun run agroplan open
```
Abre https://agroplan-ai.vercel.app/dashboard

## 🔄 Detecção Automática

O frontend detecta automaticamente qual API usar:

### Modo Automático (padrão)
1. Tenta http://localhost:8000/health (800ms timeout)
2. Se funcionar → usa API Local
3. Se falhar → usa API Render

### Seletor Visual na Topbar
- **🖥️ API Local**: Badge verde clicável com ícone Monitor
- **☁️ API Render**: Badge azul clicável com ícone Cloud  
- **❌ API Offline**: Badge vermelho quando nenhuma responder

### Menu de Seleção
Clique no badge da API para abrir o menu:
- **Automático**: Usa Local se disponível, senão Render
- **API Local**: Força uso local (abre assistente se não disponível)
- **API Render**: Força uso do Render

### Assistente de Instalação
Quando seleciona "API Local" mas não está disponível:
- Mostra comandos passo a passo para Windows e macOS/Linux
- Botões "Copiar" para cada comando
- Opções: "Testar Novamente", "Usar Render por Enquanto"

### Modos Manuais (avançado)
```javascript
// No console do navegador
localStorage.setItem('agroplan_api_mode', 'local');   // Forçar local
localStorage.setItem('agroplan_api_mode', 'online');  // Forçar Render
localStorage.removeItem('agroplan_api_mode');         // Voltar automático
```

## 🎨 Interface Visual

### Badges na Topbar
- **🖥️ API Local**: Verde, ícone Monitor
- **☁️ API Render**: Azul, ícone Cloud  
- **❌ API Offline**: Vermelho, quando nenhuma responder

### Performance
- **API Local**: ~0.1s (instantâneo)
- **API Render**: ~0.3s (acordado) ou ~10s (dormindo)

## 🛠️ Fluxo Recomendado

### Desenvolvimento Diário
```bash
# 1. Verificar sistema
bun run agroplan doctor

# 2. Iniciar API local
bun run agroplan serve on

# 3. Abrir no navegador
bun run agroplan open

# 4. Trabalhar normalmente
# Frontend usa API local automaticamente

# 5. Parar quando terminar
bun run agroplan serve off
```

### Apresentação/Demo
```bash
# Opção 1: Usar local (mais rápido)
bun run agroplan serve on
bun run agroplan open

# Opção 2: Usar apenas Render (sem setup)
# Abrir direto: https://agroplan-ai.vercel.app
```

## 🔧 Estrutura de Arquivos

```
tools/agroplan-cli/
├── package.json          # Configuração Bun
├── tsconfig.json         # TypeScript config
└── src/
    ├── index.ts          # CLI principal
    ├── commands/
    │   ├── doctor.ts     # Diagnóstico
    │   ├── serve.ts      # Gerenciar servidor
    │   └── open.ts       # Abrir navegador
    └── utils/
        ├── paths.ts      # Caminhos do projeto
        ├── python.ts     # Gerenciar Python/venv
        └── process.ts    # Gerenciar processos

.agroplan/                # Criado automaticamente
├── agroplan-api.pid      # PID do processo
└── logs/
    └── api.log           # Logs do servidor
```

## ❓ Troubleshooting

### "Python não encontrado"
```bash
# Instalar Python 3.8+
# Windows: https://python.org/downloads
# macOS: brew install python
# Ubuntu: sudo apt install python3 python3-pip
```

### "Porta 8000 ocupada"
```bash
# Verificar o que está usando
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # macOS/Linux

# Parar processo anterior
bun run agroplan serve off
```

### "Falha ao instalar dependências"
```bash
# Limpar ambiente virtual
rm -rf backend/.venv
bun run agroplan serve on
```

### "API local não responde"
```bash
# Verificar logs
bun run agroplan serve logs

# Verificar status
bun run agroplan serve status

# Reiniciar
bun run agroplan serve off
bun run agroplan serve on
```

## 🔄 Arquitetura Híbrida

```
┌─────────────────┐    ┌──────────────────┐
│   Frontend      │    │    Backend       │
│   (Vercel)      │    │                  │
│                 │    │  ┌─────────────┐ │
│  Detecção ──────┼────┼─►│ API Local   │ │
│  Automática     │    │  │ :8000       │ │
│                 │    │  └─────────────┘ │
│            ─────┼────┼─►┌─────────────┐ │
│                 │    │  │ API Render  │ │
│                 │    │  │ (Fallback)  │ │
└─────────────────┘    │  └─────────────┘ │
                       └──────────────────┘
```

### Vantagens
- **Flexibilidade**: Funciona online e offline
- **Performance**: Local é mais rápido
- **Confiabilidade**: Render como backup
- **Simplicidade**: Detecção automática transparente

## 🎯 Próximos Passos

Após configurar o modo local:
1. **Fase 7**: Integração com APIs reais (Open-Meteo, NASA POWER)
2. **Otimizações**: Cache persistente, configurações avançadas
3. **Monitoramento**: Métricas de performance, logs estruturados