# AgroPlan AI - Backend

Backend FastAPI para o Sistema Inteligente de Planejamento de Plantio.

## 🚀 Tecnologias

- **FastAPI** - Framework web moderno e rápido
- **Python 3.11+** - Linguagem de programação
- **Pandas** - Manipulação de dados
- **NumPy** - Computação numérica
- **Uvicorn** - Servidor ASGI

## 📋 Pré-requisitos

- Python 3.11 ou superior
- pip (gerenciador de pacotes Python)

## 🔧 Instalação Local

1. **Clone o repositório** (se ainda não fez):
```bash
git clone <seu-repositorio>
cd agroplan/backend
```

2. **Crie um ambiente virtual**:
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. **Instale as dependências**:
```bash
pip install -r requirements.txt
```

4. **Configure as variáveis de ambiente**:
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite .env conforme necessário
```

5. **Execute o servidor**:
```bash
python api.py
```

O servidor estará disponível em `http://localhost:8000`

## 📚 Documentação da API

Após iniciar o servidor, acesse:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔌 Endpoints Principais

### Health Check
```http
GET /health
```
Verifica o status da API e retorna informações sobre os dados carregados.

### Dashboard
```http
GET /dashboard
```
Retorna resumo completo do dashboard com plano recomendado.

### Talhões
```http
GET /talhoes
```
Lista todos os talhões disponíveis.

### Culturas
```http
GET /culturas
```
Lista todas as culturas disponíveis com suas regras.

### Cenários
```http
GET /cenarios
```
Retorna comparação entre diferentes cenários de plantio.

### Otimizar
```http
POST /otimizar
Content-Type: application/json

{
  "objetivo": "equilibrado",
  "seed": 42,
  "geracoes": 100,
  "populacao": 50
}
```
Executa o Algoritmo Genético para otimização.

**Objetivos disponíveis**: `equilibrado`, `lucro`, `risco`, `sustentavel`

### Validar
```http
POST /validar
Content-Type: application/json

{
  "objetivo": "equilibrado",
  "seed": 42
}
```
Valida o resultado do AG comparando com força bruta (quando viável).

### Rodadas
```http
POST /rodadas
Content-Type: application/json

{
  "objetivo": "equilibrado",
  "rodadas": 5
}
```
Executa múltiplas rodadas do AG para análise de estabilidade.

### Relatório
```http
POST /relatorio
Content-Type: application/json

{
  "objetivo": "equilibrado",
  "formato": "md"
}
```
Gera relatório completo em Markdown ou TXT.

**Formatos disponíveis**: `md`, `txt`

## 🐳 Docker

### Build da imagem:
```bash
docker build -t agroplan-backend .
```

### Executar container:
```bash
docker run -p 8000:8000 \
  -e CORS_ORIGINS="http://localhost:3000" \
  agroplan-backend
```

## 🌍 Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `HOST` | Host do servidor | `0.0.0.0` |
| `PORT` | Porta do servidor | `8000` |
| `CORS_ORIGINS` | Origens permitidas (separadas por vírgula) | `http://localhost:3000` |
| `DATA_MODE` | Modo de dados (`simulated` ou `real`) | `simulated` |

### Exemplo de configuração para produção:
```bash
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=https://seu-frontend.vercel.app,http://localhost:3000
DATA_MODE=simulated
```

## 📁 Estrutura de Dados

O backend utiliza arquivos CSV localizados em `data/`:

- **culturas.csv** - Informações sobre culturas (10 culturas)
- **talhoes.csv** - Informações sobre talhões (10 talhões)
- **regras_culturas.csv** - Regras de compatibilidade

## 🧬 Algoritmo Genético

O sistema utiliza um Algoritmo Genético para otimização do planejamento:

- **População**: 50 indivíduos (configurável)
- **Gerações**: 100 (configurável)
- **Seleção**: Torneio
- **Crossover**: Ponto único
- **Mutação**: Aleatória com taxa adaptativa

### Objetivos de Otimização:

1. **Equilibrado**: Balanceia lucro, risco e sustentabilidade
2. **Lucro**: Prioriza retorno financeiro
3. **Risco**: Minimiza exposição ao risco
4. **Sustentável**: Prioriza compatibilidade e diversidade

## 🔍 Validação

O sistema oferece dois métodos de validação:

1. **Força Bruta**: Para espaços de busca pequenos (≤10.000 combinações)
2. **Múltiplas Rodadas**: Para espaços grandes, executa várias rodadas e analisa estabilidade

## 📊 Relatórios

Relatórios são gerados em `reports/` com:

- Resumo executivo
- Características do plano
- Comparação com cenários
- Detalhes do Algoritmo Genético
- Validação e estabilidade
- Justificativa técnica

## 🚀 Deploy

### Render (Recomendado)

1. Conecte seu repositório GitHub ao Render
2. Crie um novo Web Service
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: (deixe vazio, usa Dockerfile)
   - **Start Command**: (deixe vazio, usa CMD do Dockerfile)
4. Adicione variáveis de ambiente:
   - `CORS_ORIGINS`: URL do seu frontend
5. Deploy!

### Outras plataformas

O backend é compatível com qualquer plataforma que suporte:
- Docker
- Python 3.11+
- Variável de ambiente `PORT`

## 🐛 Troubleshooting

### Erro de CORS
Verifique se `CORS_ORIGINS` inclui a URL do seu frontend.

### Porta já em uso
Altere a variável `PORT` ou encerre o processo usando a porta 8000.

### Módulos não encontrados
Execute `pip install -r requirements.txt` novamente.

## 📝 Limitações Atuais

- Dados simulados (CSV estáticos)
- Sem banco de dados
- Sem autenticação
- Sem APIs externas reais

## 🔮 Próximas Funcionalidades

- Integração com APIs reais (clima, preços, etc.)
- Banco de dados PostgreSQL
- Autenticação e autorização
- Cache Redis
- Webhooks para notificações
- Suporte a múltiplas propriedades

## 📄 Licença

Este projeto é parte do AgroPlan AI.
