# 🌱 AgroPlan AI - CLI

**CLI global para modo local acelerado do AgroPlan AI**

O AgroPlan AI é um sistema inteligente de planejamento agrícola que usa algoritmos genéticos para otimizar o plantio. Esta CLI permite executar o backend localmente para melhor performance.

## 🚀 Instalação

**Requer [Bun ≥ 1.0](https://bun.sh/) instalado**

```bash
# Instalar CLI globalmente
bun add -g agroplan-ai-cli

# Configurar API local
agroplan setup

# Iniciar servidor local
agroplan serve on

# Abrir no navegador
agroplan open
```

## 📋 Comandos

### Configuração
```bash
agroplan setup          # Configura API local em ~/.agroplan
agroplan doctor         # Verifica configuração do sistema
```

### Servidor Local
```bash
agroplan serve on       # Inicia API em http://localhost:8000
agroplan serve off      # Para o servidor local
agroplan serve status   # Mostra status Local + Render
agroplan serve logs     # Exibe logs do servidor
```

### Utilitários
```bash
agroplan open           # Abre AgroPlan AI no navegador
```

## 🎯 Vantagens do Modo Local

- **⚡ Performance**: ~0.1s vs ~0.3s+ do Render
- **🔄 Disponibilidade**: Não depende do Render acordar
- **🛠️ Desenvolvimento**: Ideal para uso diário
- **🌐 Híbrido**: Frontend detecta automaticamente Local vs Render

## 🏗️ Como Funciona

1. **Setup**: Copia backend para `~/.agroplan/backend`
2. **Ambiente**: Cria `.venv` e instala dependências Python
3. **Servidor**: Executa FastAPI em `localhost:8000`
4. **Frontend**: Detecta API local automaticamente

## 🔧 Estrutura Criada

```
~/.agroplan/
├── backend/              # Backend FastAPI local
│   ├── api.py           # API principal
│   ├── core/            # Algoritmos (genético, força bruta)
│   ├── data/            # Dados simulados (CSV)
│   ├── requirements.txt # Dependências Python
│   └── .venv/           # Ambiente virtual
├── agroplan-api.pid     # PID do processo
└── logs/
    └── api.log          # Logs do servidor
```

## 🌐 Arquitetura Híbrida

- **Online**: Frontend (Vercel) + Backend (Render) - universal
- **Local**: Frontend (Vercel) + Backend (localhost) - acelerado
- **Auto**: Tenta local primeiro, fallback para Render

## 🛠️ Requisitos

- **Bun**: ≥ 1.0 ([instalar](https://bun.sh/))
- **Python**: ≥ 3.8 (para ambiente virtual)
- **Sistema**: Windows, macOS, Linux

## 🔗 Links

- **Aplicação**: https://agroplan-ai.vercel.app
- **Repositório**: https://github.com/Kuuhaku-Allan/agroplan-ai
- **Documentação**: [docs/LOCAL_MODE.md](https://github.com/Kuuhaku-Allan/agroplan-ai/blob/main/docs/LOCAL_MODE.md)

## 📄 Licença

MIT © Kuuhaku Allan