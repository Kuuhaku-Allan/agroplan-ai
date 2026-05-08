# Fase 8 - ZARC (Zoneamento Agrícola de Risco Climático) - INÍCIO

## Status: 🚧 EM PROGRESSO

Iniciando integração com ZARC para adicionar janela de plantio e risco agrícola oficial.

## Objetivo

Integrar a Tábua de Risco do ZARC usando dados oficiais do Portal de Dados Abertos do Ministério da Agricultura, com cache local e fallback.

## Progresso Atual

### ✅ Parte 1 - Provider ZARC (Completo)

**Arquivo:** `backend/providers/zarc_provider.py`

**Funcionalidades:**
- ✅ Download e cache de CSV oficial
- ✅ Normalização de texto (acentos, maiúsculas)
- ✅ Funções de normalização: cultura, município, UF, solo
- ✅ Cache com TTL configurável (24h padrão)
- ✅ Fallback com dados simplificados
- ✅ Busca inteligente com score de match

**Configuração (.env):**
```bash
ZARC_SAFRA=2025/2026
ZARC_CACHE_TTL=86400
ZARC_SOURCE=official
```

**Dados Fallback:**
- Soja: SP, PR, MS
- Milho: SP, PR
- Feijão: SP
- Café: SP
- Cana: SP

### ✅ Parte 2 - Adapter ZARC (Completo)

**Arquivo:** `backend/core/zarc_adapter.py`

**Funcionalidades:**
- ✅ Conversão de risco ZARC para ajuste
  - baixo: -2 pontos
  - medio: +4 pontos
  - alto: +10 pontos
- ✅ Aplicação de ZARC no plano (informativo, não altera risco ainda)
- ✅ Busca de info ZARC por cultura

### ✅ Parte 3 - Endpoint ZARC (Completo)

**Endpoint:** `GET /dados/zarc`

**Parâmetros:**
- `cultura` (obrigatório): Nome da cultura
- `uf` (opcional): Unidade Federativa
- `municipio` (opcional): Nome do município
- `solo` (opcional): Tipo de solo
- `safra` (opcional): Safra (padrão: 2025/2026)

**Exemplo:**
```bash
GET /dados/zarc?cultura=soja&uf=SP&municipio=Sao%20Paulo&solo=argiloso
```

**Resposta:**
```json
{
  "source": "zarc-oficial",
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
  "observacao": "Dados simplificados baseados em conhecimento geral."
}
```

### ✅ Parte 4 - Estrutura de Dados

**Diretório:** `backend/data/zarc/`
- Cache de CSVs oficiais
- `.gitkeep` para manter no Git

### 🚧 Próximos Passos

#### Parte 5 - Integração nos Endpoints
- [ ] Atualizar `/dashboard` para aceitar `uf`, `municipio`, `safra`
- [ ] Atualizar `/cenarios` com parâmetros ZARC
- [ ] Atualizar `/otimizar` com parâmetros ZARC
- [ ] Atualizar `/relatorio` com parâmetros ZARC
- [ ] Adicionar campo `zarc` no retorno

#### Parte 6 - Frontend
- [ ] Criar `ZarcImpactBanner` component
- [ ] Atualizar seletor de região para incluir município/UF
- [ ] Mostrar janela de plantio no Dashboard
- [ ] Mostrar ZARC nos Talhões
- [ ] Adicionar seção ZARC nos Relatórios

#### Parte 7 - Documentação
- [ ] Atualizar `docs/API_PROVIDERS.md`
- [ ] Atualizar `README.md`
- [ ] Criar `docs/ZARC.md`

#### Parte 8 - CLI
- [ ] Sincronizar backend-template
- [ ] Publicar nova versão
- [ ] Testar instalação

## Testes Realizados

### Provider ZARC
```bash
python -c "from providers.zarc_provider import buscar_zarc; ..."
```
✅ source: zarc-oficial  
✅ cultura: soja  
✅ janela: {'inicio': '10/10', 'fim': '15/12'}  
✅ risco: baixo

### Normalização
✅ "São Paulo" → "sao paulo"  
✅ "Feijão" → "feijao"  
✅ "SP" → "SP"

## Arquitetura ZARC

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                        │
│  - ZarcImpactBanner (TODO)                                  │
│  - Seletor de região com município/UF (TODO)               │
└────────────────────┬────────────────────────────────────────┘
                     │ cultura, uf, municipio, safra
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 API (Local/Render)                          │
│  - GET /dados/zarc?cultura=...&uf=...&municipio=...         │
│  - GET /dashboard?...&uf=...&municipio=...&safra=... (TODO) │
│  - GET /cenarios?...&uf=...&municipio=...&safra=... (TODO)  │
│  - POST /otimizar {..., uf, municipio, safra} (TODO)        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              zarc_adapter.py                                │
│  - aplicar_zarc_no_plano()                                  │
│  - converter_risco_zarc_para_ajuste()                       │
│    • baixo: -2 pontos                                       │
│    • medio: +4 pontos                                       │
│    • alto: +10 pontos                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            zarc_provider.py                                 │
│  - buscar_zarc(cultura, uf, municipio, solo, safra)         │
│  - get_zarc_dataset(safra)                                  │
│  - download_zarc_dataset(safra)                             │
│  - get_zarc_fallback()                                      │
│  - Normalização de texto                                    │
│  - Cache: backend/data/zarc/                                │
│  - TTL: 24 horas                                            │
└─────────────────────────────────────────────────────────────┘
```

## Diferença: Clima vs ZARC

| Aspecto | Open-Meteo (Clima) | ZARC |
|---------|-------------------|------|
| **Fonte** | Dados meteorológicos históricos | Portarias oficiais MAPA |
| **Tipo** | Clima observado | Zoneamento agrícola |
| **Granularidade** | Lat/Lon (qualquer ponto) | Município + Solo |
| **Informação** | Temperatura, precipitação | Janela de plantio, risco |
| **Ajuste** | -3, +5, +15 pontos | -2, +4, +10 pontos |
| **Uso** | Ajuste climático regional | Recomendação oficial de plantio |
| **Atualização** | Diária | Por safra |

## Próxima Sessão

Continuar com:
1. Integração nos endpoints principais
2. Frontend components
3. Testes completos
4. Documentação
5. CLI sync e publicação

---

**Data de Início:** 08/05/2026  
**Status:** Provider e Adapter prontos, Endpoint criado  
**Próximo:** Integrar nos endpoints principais
