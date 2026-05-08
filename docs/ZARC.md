# ZARC - Zoneamento Agrícola de Risco Climático

## Visão Geral

O ZARC (Zoneamento Agrícola de Risco Climático) é um instrumento de política agrícola e gestão de riscos na agricultura do Brasil, coordenado pelo Ministério da Agricultura, Pecuária e Abastecimento (MAPA).

## Integração no AgroPlan AI

### Status Atual

- ✅ Provider ZARC implementado
- ✅ Download de CSV oficial (1M+ registros)
- ✅ Cache local com TTL 24h
- ✅ Fallback com dados simplificados
- ✅ Rastreabilidade honesta (oficial vs fallback)
- ✅ Parser de decêndios implementado e testado
- ✅ Extração de janelas de plantio
- ✅ Escolha da melhor janela por risco e duração
- ✅ Endpoint `/dados/zarc` testado e funcionando
- ⏳ Sincronização com CLI (próximo passo)

### Fonte de Dados

**Oficial:** Portal de Dados Abertos do Ministério da Agricultura  
**URL:** https://dados.agricultura.gov.br/dataset/zarc-2025-2026  
**Formato:** CSV com ponto-e-vírgula (`;`)  
**Registros:** 1,026,965 (safra 2025/2026)

### Estrutura do CSV Oficial

O CSV oficial contém as seguintes colunas principais:

- `Nome_cultura`: Nome da cultura (ex: SOJA, MILHO)
- `SafraIni`: Início da safra
- `SafraFin`: Fim da safra
- `Cod_Cultura`: Código da cultura
- `Cod_Ciclo`: Código do ciclo
- `Cod_Solo`: Código do tipo de solo (1, 2, 3)
- `geocodigo`: Código IBGE do município
- `UF`: Unidade Federativa
- `municipio`: Nome do município
- `Cod_Clima`: Código do clima
- `Nome_Clima`: Nome do clima
- `dec1` a `dec36`: Decêndios (períodos de 10 dias) indicando risco

### Decêndios

O ZARC usa **decêndios** (períodos de 10 dias) para representar janelas de plantio:

- `dec1`: 1-10 de janeiro
- `dec2`: 11-20 de janeiro
- `dec3`: 21-31 de janeiro
- `dec4`: 1-10 de fevereiro
- ...
- `dec36`: 21-31 de dezembro

**Valores nos decêndios (valores reais do CSV):**
- `20`: Risco de 20% (baixo)
- `30`: Risco de 30% (médio)
- `40`: Risco de 40% (alto)
- Vazio ou `0`: Não recomendado para plantio

**Processamento:**
O sistema agrupa decêndios consecutivos com valores válidos (20, 30, 40) em janelas de plantio. Para cada janela:
1. Calcula o risco predominante pela média dos valores
2. Identifica início e fim da janela
3. Escolhe a melhor janela por: menor risco, depois maior duração

**Exemplo de processamento:**
```
Entrada (CSV): dec10=20, dec11=20, dec12=20, dec13=30, dec14=30
Saída: Janela de 01/04 a 20/05, risco predominante: baixo (média 24%)
```

### Tipos de Solo (Cod_Solo)

O CSV oficial usa códigos de solo baseados em textura:

**Códigos básicos:**
- `1`: Solo arenoso
- `2`: Solo médio/misto
- `3`: Solo argiloso

**Códigos estendidos (11-19):**
- `11`, `12`, `13`: Variações de solo arenoso
- `14`, `15`, `16`: Variações de solo médio
- `17`, `18`, `19`: Variações de solo argiloso

O sistema normaliza automaticamente todos os códigos para as três categorias básicas.

## Endpoints

### GET /dados/zarc

Consulta dados ZARC para uma cultura/região específica.

**Parâmetros:**
- `cultura` (obrigatório): Nome da cultura
- `uf` (opcional): Unidade Federativa
- `municipio` (opcional): Nome do município
- `solo` (opcional): Tipo de solo
- `safra` (opcional): Safra (padrão: 2025/2026)

**Exemplo:**
```bash
GET /dados/zarc?cultura=soja&uf=SP&municipio=Ribeirao%20Preto&solo=argiloso
```

**Resposta (Fallback):**
```json
{
  "source": "zarc-fallback",
  "safra": "2025/2026",
  "cultura": "soja",
  "uf": "SP",
  "municipio": "sao paulo",
  "solo": "argiloso",
  "janela_plantio": {
    "inicio": "10/10",
    "fim": "15/12"
  },
  "risco": "baixo",
  "fallback": true,
  "observacao": "Dados simplificados locais usados porque o CSV oficial não estava disponível."
}
```

**Resposta (Oficial com Parser):**
```json
{
  "source": "zarc-oficial",
  "safra": "2025/2026",
  "cultura": "Soja",
  "uf": "SP",
  "municipio": "Clementina",
  "geocodigo": "3511102",
  "solo_codigo": "16",
  "solo": "medio",
  "janela_plantio": {
    "inicio": "11/09",
    "fim": "31/12"
  },
  "risco": "baixo",
  "decendios_recomendados": [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
  "fallback": false,
  "encontrado": true,
  "observacao": "Dados obtidos da Tábua de Risco do ZARC (Ministério da Agricultura)."
}
```

### GET /health

Verifica status do provider ZARC.

**Resposta:**
```json
{
  "status": "healthy",
  "providers": {
    "weather": "available",
    "zarc": {
      "status": "available",
      "safra": "2025/2026",
      "source": "zarc-cache",
      "fallback": false,
      "records": 1026965
    }
  }
}
```

## Dados Fallback

Quando o CSV oficial não está disponível, o sistema usa dados simplificados:

### Culturas Disponíveis

- **Soja**: SP, PR, MS
- **Milho**: SP, PR
- **Feijão**: SP
- **Café**: SP
- **Cana**: SP

### Janelas de Plantio (Fallback)

| Cultura | UF | Município | Início | Fim | Risco |
|---------|----|-----------| -------|-----|-------|
| Soja | SP | São Paulo | 10/10 | 15/12 | Baixo |
| Soja | PR | Londrina | 01/10 | 10/12 | Baixo |
| Soja | MS | Campo Grande | 15/09 | 30/11 | Baixo |
| Milho | SP | Ribeirão Preto | 15/09 | 30/11 | Baixo |
| Milho | PR | Londrina | 01/09 | 15/11 | Baixo |
| Feijão | SP | São Paulo | 15/08 | 30/10 | Médio |
| Café | SP | Ribeirão Preto | 01/10 | 31/12 | Baixo |
| Cana | SP | Ribeirão Preto | 01/09 | 31/03 | Baixo |

## Ajustes de Risco

O ZARC aplica ajustes conservadores no risco:

- **Baixo**: -2 pontos percentuais
- **Médio**: +4 pontos percentuais
- **Alto**: +10 pontos percentuais
- **Indeterminado**: 0 pontos

## Diferença: Clima vs ZARC

| Aspecto | Open-Meteo (Clima) | ZARC |
|---------|-------------------|------|
| **Fonte** | Dados meteorológicos históricos | Portarias oficiais MAPA |
| **Tipo** | Clima observado | Zoneamento agrícola |
| **Granularidade** | Lat/Lon (qualquer ponto) | Município + Solo + Ciclo |
| **Informação** | Temperatura, precipitação | Janela de plantio, risco |
| **Ajuste** | -3, +5, +15 pontos | -2, +4, +10 pontos |
| **Uso** | Ajuste climático regional | Recomendação oficial de plantio |
| **Atualização** | Diária | Por safra |
| **Registros** | Dados contínuos | 1M+ combinações |

## Configuração

### Variáveis de Ambiente

```bash
# Safra padrão
ZARC_SAFRA=2025/2026

# TTL do cache (segundos)
ZARC_CACHE_TTL=86400

# Fonte de dados
ZARC_SOURCE=official  # official ou fallback
```

### Cache

**Localização:** `backend/data/zarc/`  
**Arquivo:** `zarc_2025-2026.csv`  
**TTL:** 24 horas (padrão)  
**Tamanho:** ~150MB (CSV oficial)

## Desenvolvimento Futuro

### Fase 8.3 - Integração Completa

- [ ] Sincronizar CLI backend-template
- [ ] Publicar CLI v1.0.14
- [ ] Testar na API Local
- [ ] Atualizar `/dashboard` com ZARC
- [ ] Mostrar janela de plantio em Talhões
- [ ] Adicionar seção ZARC em Relatórios
- [ ] Criar componente `ZarcImpactBanner`
- [ ] Seletor de município/UF no frontend

### Fase 8.4 - Otimização

- [ ] Indexar CSV por cultura/UF/município
- [ ] Cache em memória para buscas frequentes
- [ ] Compressão do CSV
- [ ] API de busca otimizada

## Referências

- [Portal de Dados Abertos - MAPA](https://dados.agricultura.gov.br/)
- [ZARC - Ministério da Agricultura](https://www.gov.br/agricultura/pt-br/assuntos/riscos-seguro/risco-agropecuario/zarc)
- [Portarias ZARC](https://www.gov.br/agricultura/pt-br/assuntos/riscos-seguro/risco-agropecuario/portarias)

---

**Última Atualização:** 08/05/2026  
**Versão:** 1.0  
**Status:** Provider implementado, Parser em desenvolvimento
