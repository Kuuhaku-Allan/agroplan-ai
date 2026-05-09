# Provedores de Dados Reais - AgroPlan AI

## Visão Geral

O AgroPlan AI suporta múltiplos modos de dados para flexibilidade entre desenvolvimento e produção:

- **`simulated`**: Usa apenas dados CSV simulados
- **`real`**: Usa apenas APIs reais externas  
- **`hybrid`**: Usa APIs reais com fallback para dados simulados (recomendado)

## Configuração

Configure no arquivo `.env`:

```env
DATA_MODE=hybrid
WEATHER_PROVIDER=open-meteo
PROVIDER_CACHE_TTL=3600
```

## Provedores Disponíveis

### 1. Open-Meteo (Clima Real)

**Fonte**: [Open-Meteo Archive API](https://open-meteo.com/en/docs/historical-weather-api)

**Características**:
- ✅ Gratuito para uso não comercial
- ✅ Sem necessidade de chave de API
- ✅ Dados históricos confiáveis
- ✅ Cobertura global

**Dados fornecidos**:
- Temperatura média, máxima e mínima
- Precipitação total
- Evapotranspiração de referência (FAO)
- Umidade relativa média
- Radiação solar

**Endpoint**: `GET /dados/clima`

**Parâmetros**:
- `lat`: Latitude (obrigatório)
- `lon`: Longitude (obrigatório)  
- `days`: Número de dias para análise (1-365, padrão: 30)

**Exemplo**:
```bash
GET /dados/clima?lat=-23.55&lon=-46.63&days=30
```

**Resposta**:
```json
{
  "source": "open-meteo",
  "latitude": -23.55,
  "longitude": -46.63,
  "temperatura_media": 21.2,
  "temperatura_maxima": 26.9,
  "temperatura_minima": 17.1,
  "precipitacao_total": 79.5,
  "evapotranspiracao": 3.46,
  "umidade_media": 73.8,
  "radiacao_solar": 531.9,
  "risco_climatico_estimado": "baixo",
  "fallback": false,
  "error": null
}
```

### 2. ZARC (Janelas de Plantio)

**Fonte**: Índice compacto derivado do [ZARC oficial do MAPA](https://www.gov.br/agricultura/pt-br/assuntos/riscos-seguro/risco-agropecuario/zarc)

**Características**:
- ✅ Dados oficiais do Ministério da Agricultura
- ✅ Índice compacto para consulta rápida
- ✅ Cobertura das principais culturas e regiões
- ✅ Janelas de plantio por cultura, solo e município

**Dados fornecidos**:
- Janela de plantio (início e fim)
- Nível de risco (20%, 30%)
- Tipo de solo compatível
- Ciclo da cultura

**Endpoint**: `GET /dados/zarc`

**Parâmetros**:
- `cultura`: Nome da cultura (obrigatório)
- `uf`: Unidade Federativa (obrigatório)
- `municipio`: Nome do município (obrigatório)
- `solo`: Tipo de solo (1, 2, 3) (obrigatório)
- `safra`: Safra agrícola (ex: 2025/2026) (opcional)

**Exemplo**:
```bash
GET /dados/zarc?cultura=soja&uf=SP&municipio=Clementina&solo=2&safra=2025/2026
```

**Resposta**:
```json
{
  "ativo": true,
  "source": "zarc-oficial-derived",
  "cultura": "soja",
  "uf": "SP",
  "municipio": "Clementina",
  "solo": "2",
  "safra": "2025/2026",
  "janela_plantio": {
    "inicio": "01/10",
    "fim": "31/12"
  },
  "risco": "20%",
  "ciclo": "médio",
  "fallback": false
}
```

**Endpoint em Lote**: `GET /dados/zarc/lote`

Permite consultar ZARC para múltiplas culturas de uma vez:

**Parâmetros**:
- `uf`: Unidade Federativa (obrigatório)
- `municipio`: Nome do município (obrigatório)
- `safra`: Safra agrícola (opcional)

**Exemplo**:
```bash
GET /dados/zarc/lote?uf=SP&municipio=Clementina&safra=2025/2026
```

**Resposta**:
```json
{
  "uf": "SP",
  "municipio": "Clementina",
  "safra": "2025/2026",
  "culturas": {
    "soja": {
      "ativo": true,
      "source": "zarc-oficial-derived",
      "janela_plantio": {"inicio": "01/10", "fim": "31/12"},
      "risco": "20%",
      "solo": "2",
      "ciclo": "médio"
    },
    "milho": {
      "ativo": true,
      "source": "zarc-oficial-derived",
      "janela_plantio": {"inicio": "15/09", "fim": "31/01"},
      "risco": "20%",
      "solo": "2",
      "ciclo": "normal"
    }
  }
}
```

### 3. Preços Agrícolas (Referência de Mercado)

**Fonte**: Índice local de preços + fallback de referência

**Características**:
- ✅ Preços de referência para as principais culturas
- ✅ Índice local com dados regionais (quando disponível)
- ✅ Fallback automático para cobertura completa
- ✅ 100% de cobertura garantida (todas as culturas têm preço)

**Dados fornecidos**:
- Preço por unidade (R$/saca, R$/arroba, etc.)
- Unidade de medida
- Região (UF quando disponível)
- Data de referência
- Fonte (índice local ou fallback)

**Endpoint**: `GET /dados/precos`

**Parâmetros**:
- `cultura`: Nome da cultura (obrigatório)
- `uf`: Unidade Federativa (opcional, melhora precisão)

**Exemplo**:
```bash
GET /dados/precos?cultura=soja&uf=SP
```

**Resposta**:
```json
{
  "ativo": true,
  "source": "price-local-index",
  "fallback": false,
  "cultura": "soja",
  "uf": "SP",
  "preco": 145.50,
  "unidade": "saca_60kg",
  "data_referencia": "2025-05-01",
  "observacao": "Preço médio regional"
}
```

**Endpoint em Lote**: `GET /dados/precos/lote`

Permite consultar preços para múltiplas culturas de uma vez:

**Parâmetros**:
- `uf`: Unidade Federativa (opcional)

**Exemplo**:
```bash
GET /dados/precos/lote?uf=SP
```

**Resposta**:
```json
{
  "uf": "SP",
  "culturas": {
    "soja": {
      "ativo": true,
      "source": "price-local-index",
      "preco": 145.50,
      "unidade": "saca_60kg",
      "data_referencia": "2025-05-01"
    },
    "milho": {
      "ativo": true,
      "source": "price-fallback",
      "fallback": true,
      "preco": 85.00,
      "unidade": "saca_60kg",
      "data_referencia": "2025-05-01"
    }
  }
}
```

**⚠️ Importante**: Os preços agrícolas são normalizados para R$/tonelada. O cálculo de lucro principal ainda utiliza a base interna do sistema, mas o **lucro de mercado estimado** é exibido como comparação experimental. Isso garante consistência nos cálculos enquanto os preços e produtividades são validados.

### Normalização de Unidades

Todos os preços são automaticamente convertidos para R$/tonelada usando os seguintes fatores:

| Unidade Original | Fator de Conversão | Cálculo | Exemplo |
|-----------------|-------------------|---------|---------|
| `tonelada` | 1.0 | preço × 1 | R$ 98/ton → R$ 98/ton |
| `saca_60kg` | 16.6667 | preço × (1000/60) | R$ 130/saca → R$ 2.166,67/ton |
| `saca_50kg` | 20.0 | preço × (1000/50) | R$ 85/saca → R$ 1.700/ton |
| `arroba_15kg` | 66.6667 | preço × (1000/15) | R$ 3.200/arroba → R$ 213.333,33/ton |

### Lucro de Mercado vs Lucro do Sistema

O sistema agora exibe **dois lucros** para comparação:

1. **Lucro do Sistema** (principal):
   - Usa preços internos do CSV
   - Base para decisões do algoritmo genético
   - Mantém consistência histórica

2. **Lucro de Mercado** (experimental):
   - Usa preços normalizados de mercado
   - Calcula: `(preço/ton × produtividade × área) - (custo × área)`
   - Exibido apenas para comparação
   - Não afeta o lucro principal

**Variável de controle**: `PRICE_APPLY_TO_PROFIT=false` (padrão)

Quando `true`, o lucro de mercado substitui o lucro do sistema. Recomenda-se validação extensiva antes de ativar.

## Risco Climático

O sistema calcula automaticamente o risco climático baseado em:

- **Alto**: Precipitação < 30mm ou Temperatura > 34°C
- **Médio**: Precipitação < 70mm  
- **Baixo**: Condições normais
- **Indeterminado**: Dados insuficientes

## Fallback e Cache

### Sistema de Fallback

Se a API externa falhar, o sistema automaticamente:

1. Retorna dados simulados baseados na localização
2. Define `fallback: true` na resposta
3. Inclui mensagem de erro em `error`

### Cache Inteligente

- **TTL padrão**: 1 hora para dados climáticos
- **Cache por localização**: Evita chamadas desnecessárias
- **Limpeza automática**: Remove itens expirados automaticamente

## Monitoramento

### Health Check

```bash
GET /health
```

Retorna informações sobre todos os provedores:

```json
{
  "status": "healthy",
  "data_mode": "hybrid",
  "providers": {
    "weather": "available",
    "zarc": "available",
    "prices": "available"
  },
  "provider_cache": {
    "total_items": 12,
    "valid_items": 10,
    "expired_items": 2
  },
  "zarc_index": {
    "loaded": true,
    "total_records": 15420,
    "culturas": 10,
    "estados": 27
  },
  "price_index": {
    "loaded": true,
    "total_records": 5,
    "culturas_com_preco": 5
  }
}
```

### Estatísticas de Cache

O endpoint `/health` inclui estatísticas detalhadas do cache de provedores para monitoramento de performance.

### Limpeza de Cache

```bash
POST /cache/limpar
```

Limpa o cache de todos os provedores (clima, ZARC e preços):

```json
{
  "message": "Cache limpo com sucesso",
  "items_removed": 12
}
```

## Integração nos Endpoints

Os três provedores são integrados automaticamente nos principais endpoints:

### Dashboard
```bash
GET /dashboard?lat=-21.56&lon=-50.45&uf=SP&municipio=Clementina&safra=2025/2026
```

Retorna dados climáticos, ZARC e preços integrados no plano recomendado.

### Recomendações
```bash
GET /recomendacoes?uf=SP&municipio=Clementina&safra=2025/2026
```

Inclui janelas ZARC e preços de referência para cada recomendação.

### Otimização Genética
```bash
POST /otimizar
{
  "objetivo": "equilibrado",
  "seed": 42,
  "location": {
    "lat": -21.56,
    "lon": -50.45,
    "uf": "SP",
    "municipio": "Clementina",
    "safra": "2025/2026"
  }
}
```

Aplica dados climáticos, ZARC e preços na otimização.

### Relatórios
```bash
POST /relatorio
{
  "objetivo": "equilibrado",
  "formato": "md",
  "location": {
    "lat": -21.56,
    "lon": -50.45,
    "uf": "SP",
    "municipio": "Clementina",
    "safra": "2025/2026"
  }
}
```

Inclui seções detalhadas sobre clima, ZARC e preços no relatório gerado.

## Próximos Provedores

### Planejados para Fases Futuras

1. **NASA POWER**: Dados solares e agroclimáticos complementares
2. **CONAB/CEPEA**: Cotações oficiais de preços agrícolas em tempo real
3. **Embrapa**: Dados de solo e recomendações técnicas

## Desenvolvimento Local

Para testar localmente:

```bash
# Iniciar API local
agroplan serve on

# Testar endpoint de clima
curl "http://localhost:8000/dados/clima?lat=-23.55&lon=-46.63&days=30"

# Testar endpoint de ZARC
curl "http://localhost:8000/dados/zarc?cultura=soja&uf=SP&municipio=Clementina&solo=2"

# Testar endpoint de preços
curl "http://localhost:8000/dados/precos?cultura=soja&uf=SP"

# Verificar health
curl "http://localhost:8000/health"
```

## Produção

O sistema funciona identicamente em:
- **API Local**: `http://localhost:8000`
- **API Render**: `https://agroplan-ai-api.onrender.com`

Ambas suportam os mesmos provedores e configurações.

## Validação do Lucro de Mercado

### Endpoint de Diagnóstico

**Endpoint**: `GET /debug/lucro-mercado`

**Parâmetros**:
- `uf`: Unidade Federativa (opcional)
- `municipio`: Município (opcional)
- `safra`: Safra ZARC (opcional, padrão: 2025/2026)

**Exemplo**:
```bash
GET /debug/lucro-mercado?uf=SP
```

**Resposta**:
```json
{
  "diagnostico": {
    "uf": "SP",
    "total_culturas": 6,
    "culturas": {
      "soja": {
        "total_talhoes": 2,
        "lucro_sistema_medio": 97200.0,
        "lucro_mercado_medio": 65200.13,
        "diferenca": {
          "diferenca_absoluta": -31999.87,
          "diferenca_percentual": -32.92,
          "direcao": "menor"
        },
        "confiabilidade": "alta",
        "motivos": ["Diferença aceitável (32.9%)"],
        "preco_original": 130.0,
        "unidade_original": "saca_60kg",
        "preco_por_tonelada": 2166.67,
        "normalizado": true,
        "fallback": false
      }
    }
  },
  "validacao_resumo": {
    "ativo": true,
    "total_itens": 10,
    "itens_alta_confiabilidade": 2,
    "itens_media_confiabilidade": 8,
    "itens_baixa_confiabilidade": 0,
    "percentual_alta_confiabilidade": 20.0,
    "percentual_baixa_confiabilidade": 0.0,
    "alertas": [],
    "total_alertas": 0,
    "recomendacao": "Confiabilidade mista. Revise itens com baixa confiabilidade e valide dados de mercado."
  }
}
```

### Classificação de Confiabilidade

O sistema classifica automaticamente a confiabilidade do lucro de mercado:

| Confiabilidade | Critério | Ação Recomendada |
|----------------|----------|------------------|
| 🟢 **Alta** | Diferença < 50% entre lucro sistema e mercado | Dados confiáveis para uso |
| 🟡 **Média** | Diferença 50-100%, uso de fallback, ou lucro negativo | Usar com cautela, validar |
| 🔴 **Baixa** | Diferença > 100%, dados incompletos, ou preço não disponível | Validar antes de usar |

### Motivos de Classificação

O sistema fornece motivos específicos para cada classificação:

**Alta Confiabilidade**:
- Diferença aceitável entre lucro sistema e mercado
- Preço real disponível (não fallback)
- Dados completos de produtividade e custo

**Média Confiabilidade**:
- Diferença moderada (50-100%)
- Preço usando fallback (referência)
- Lucro de mercado indica prejuízo

**Baixa Confiabilidade**:
- Diferença muito alta (>100%)
- Preço não normalizado ou não disponível
- Produtividade ou custo não disponível

### Integração Automática

A validação é aplicada automaticamente em todos os endpoints principais:

- **`/dashboard`**: Inclui `validacao_lucro_mercado` no resultado
- **`/recomendacoes`**: Cada item tem `validacao_lucro_mercado`
- **`/otimizar`**: Plano otimizado inclui validação
- **`/relatorio`**: Relatório inclui seção de validação

### Interface Visual

O frontend mostra a validação de forma clara:

**Dashboard**:
- Banner com resumo de confiabilidade
- Estatísticas: alta/média/baixa
- Alertas principais

**Talhões**:
- Badge de confiabilidade no painel de detalhes
- Motivos da classificação
- Aviso para baixa confiabilidade

**Genético**:
- Badge compacto ao lado do lucro de mercado
- Cores: verde (alta), âmbar (média), vermelho (baixa)

**Relatórios**:
- Seção completa de validação
- Tabela detalhada por talhão
- Explicação sobre classificação

### Status Atual

**O lucro principal do sistema NÃO é substituído automaticamente.**

- `PRICE_APPLY_TO_PROFIT=false` (padrão)
- Lucro de mercado é apenas comparação experimental
- Validação identifica valores que precisam revisão
- Próxima etapa: Ativar após validação extensiva

### Por que Validar?

Diferenças altas entre lucro sistema e mercado podem indicar:

1. **Preço desatualizado**: Preço de referência não reflete mercado local
2. **Produtividade incorreta**: Estimativa não condiz com realidade
3. **Custo impreciso**: Custo operacional diferente do cadastrado
4. **Unidade comercial**: Unidade de medida incorreta ou mal convertida

### Recomendações

**Alta Confiabilidade (≥70%)**:
> "Lucro de mercado apresenta boa confiabilidade. Considere validação detalhada antes de ativar PRICE_APPLY_TO_PROFIT."

**Confiabilidade Mista**:
> "Confiabilidade mista. Revise itens com baixa confiabilidade e valide dados de mercado."

**Baixa Confiabilidade (≥30%)**:
> "Muitos itens com baixa confiabilidade. Valide preços, produtividades e custos antes de usar lucro de mercado."

## Normalização de Unidades (Próxima Fase)

Atualmente, os preços agrícolas são exibidos como referência e não afetam o cálculo de lucro. A próxima fase incluirá:

1. **Normalização de unidades**: Conversão de todas as unidades para uma base comum (tonelada)
2. **Padronização de produtividade**: Conversão para t/ha
3. **Recálculo de lucro**: Ativação de `PRICE_APPLY_TO_PROFIT=true` após normalização
4. **Validação**: Testes extensivos para garantir consistência nos cálculos

Isso garantirá que os preços de mercado sejam aplicados corretamente no cálculo de lucro, mantendo a precisão e confiabilidade do sistema.