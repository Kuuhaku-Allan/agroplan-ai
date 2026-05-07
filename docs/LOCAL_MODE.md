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

### Para Usuários Finais

**Requer [Bun ≥ 1.0](https://bun.sh/) instalado**

```bash
# 1. Instalar Bun (se ainda não tiver)
# Windows PowerShell:
powershell -c "irm bun.sh/install.ps1|iex"
# macOS/Linux:
curl -fsSL https://bun.com/install | bash

# 2. Instalar AgroPlan CLI globalmente
bun add -g agroplan-ai-cli

# 3. Configurar API local
agroplan setup

# 4. Iniciar API local
agroplan serve on

# 5. Abrir no navegador
agroplan open
```

### Para Desenvolvedores

Se você clonou o repositório:
```bash
cd tools/agroplan-cli
bun install
bun run agroplan doctor
bun run agroplan serve on
```

## 📋 Comandos Disponíveis

### Configuração Inicial
```bash
agroplan setup
```
Configura a API local no diretório `~/.agroplan` do usuário.

### Diagnóstico
```bash
agroplan doctor
```
Verifica se tudo está configurado corretamente.

### Gerenciar Servidor
```bash
agroplan serve on     # Iniciar API local
agroplan serve off    # Parar API local
agroplan serve status # Status das APIs
agroplan serve logs   # Ver logs
```

### Utilitários
```bash
agroplan open         # Abrir no navegador
```

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

### Usuário Final
```bash
# 1. Instalar CLI global
bun add -g agroplan-ai-cli

# 2. Configurar
agroplan setup

# 3. Iniciar
agroplan serve on

# 4. Usar
agroplan open

# 5. Parar quando terminar
agroplan serve off
```

### Desenvolvedor
```bash
# 1. Clonar repositório
git clone https://github.com/Kuuhaku-Allan/agroplan-ai
cd agroplan-ai

# 2. Entrar na CLI
cd tools/agroplan-cli
bun install

# 3. Testar
bun run agroplan doctor
bun run agroplan serve on
```

## 🔧 Estrutura de Arquivos

### Instalação Global
```
~/.agroplan/                  # Diretório do usuário
├── backend/                  # Backend local
│   ├── api.py               # API FastAPI
│   ├── core/                # Módulos principais
│   ├── data/                # Dados simulados
│   ├── requirements.txt     # Dependências Python
│   └── .venv/               # Ambiente virtual
├── agroplan-api.pid         # PID do processo
└── logs/
    └── api.log              # Logs do servidor

# CLI instalada globalmente via:
# bun add -g @kuuhaku-allan/agroplan-cli
```

### Desenvolvimento
```
tools/agroplan-cli/
├── package.json          # Configuração Bun
├── tsconfig.json         # TypeScript config
├── backend-template/     # Template do backend
└── src/
    ├── index.ts          # CLI principal
    ├── commands/
    │   ├── setup.ts      # Configuração inicial
    │   ├── doctor.ts     # Diagnóstico
    │   ├── serve.ts      # Gerenciar servidor
    │   └── open.ts       # Abrir navegador
    └── utils/
        ├── paths.ts      # Caminhos do projeto
        ├── python.ts     # Gerenciar Python/venv
        └── process.ts    # Gerenciar processos
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