# Fase 8.3 - Integração ZARC no Produto - EM PROGRESSO

**Data:** 08/05/2026  
**Status:** Backend completo ✅ | Frontend em progresso ⏳

## Objetivo

Integrar o ZARC na experiência principal do AgroPlan AI:
- Talhões mostram janela de plantio oficial
- Relatórios incluem seção ZARC
- Dashboard mostra status ZARC
- Usuário entende que usa clima real + zoneamento agrícola

## Parte 1 - Backend ✅ COMPLETO

### 1.1 Criado `zarc_adapter.py` ✅

**Funções implementadas:**
- `enriquecer_plano_com_zarc()` - Adiciona dados ZARC a cada item do plano
- `aplicar_ajuste_zarc()` - Calcula ajuste de risco (não aplicado por padrão)
- `gerar_secao_zarc_relatorio()` - Gera seção ZARC para relatórios (MD e TXT)

**Lógica:**
- Para cada cultura/solo do plano, busca ZARC
- Adiciona `item["zarc"]` com janela_plantio, risco, source, etc.
- Gera resumo geral: culturas_com_zarc, source (oficial/cache/fallback/mixed)

### 1.2 Endpoints Atualizados ✅

**`/dashboard`**
- Aceita: `uf`, `municipio`, `safra`
- Retorna: `zarc.ativo`, `zarc.source`, `zarc.culturas_com_zarc`
- Cada item do plano tem `zarc` com janela_plantio

**`/recomendacoes`**
- Aceita: `uf`, `municipio`, `safra`
- Enriquece recomendações com ZARC

**`/otimizar`**
- Request atualizado com `uf`, `municipio`, `safra`
- Resultado enriquecido com ZARC

**`/relatorio`**
- Request atualizado com `uf`, `municipio`, `safra`
- Gera seção ZARC no relatório (tabela por talhão)

### 1.3 Testes Backend ✅

**Teste 1: Dashboard com ZARC**
```bash
GET /dashboard?lat=-21.56&lon=-50.45&uf=SP&municipio=Clementina&safra=2025/2026
```

**Resultado:**
```json
{
  "zarc": {
    "ativo": true,
    "uf": "SP",
    "municipio": "Clementina",
    "safra": "2025/2026",
    "source": "zarc-cache",
    "fallback": false,
    "culturas_com_zarc": 4,
    "total_culturas": 10
  }
}
```

**Teste 2: Item do plano com ZARC**
```json
{
  "talhao": 3,
  "cultura": "soja",
  "solo": "misto",
  "zarc": {
    "ativo": true,
    "source": "zarc-cache",
    "fallback": false,
    "janela_plantio": {
      "inicio": "11/09",
      "fim": "31/12"
    },
    "risco": "baixo",
    "safra": "2025/2026",
    "observacao": "Dados obtidos do cache local da Tábua de Risco do ZARC.",
    "decendios_recomendados": [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
    "municipio_zarc": "Clementina",
    "geocodigo": "3511904"
  }
}
```

**Teste 3: Recomendações com ZARC**
```bash
GET /recomendacoes?uf=SP&municipio=Clementina&safra=2025/2026
```
✅ Funcionando, retorna zarc.ativo=true, culturas_com_zarc=4

### 1.4 Commit Backend ✅

**Commit:** 079951b  
**Mensagem:** "feat(backend): integrate ZARC into planning endpoints"

---

## Parte 2 - Frontend ⏳ PRÓXIMO

### 2.1 Tipos e API (Próximo)

- [ ] Atualizar `ClimateLocation` para incluir `uf`, `municipio`, `safra`
- [ ] Atualizar presets com dados completos:
  - Clementina - SP (exemplo ZARC oficial)
  - São Paulo - SP
  - Brasília - DF
  - Ribeirão Preto - SP
  - Campo Grande - MS
  - Londrina - PR
- [ ] Atualizar `api.ts` para enviar uf/municipio/safra

### 2.2 Componentes ZARC (Próximo)

- [ ] Criar `zarc-impact-banner.tsx` - Banner de status ZARC
- [ ] Criar `zarc-window-card.tsx` - Card de janela de plantio
- [ ] Atualizar Talhões para mostrar ZARC
- [ ] Atualizar Dashboard para mostrar banner ZARC
- [ ] Atualizar Relatórios com aviso ZARC

### 2.3 Testes Frontend (Próximo)

- [ ] Testar seleção de região com ZARC
- [ ] Testar Talhões com janela de plantio
- [ ] Testar Dashboard com banner ZARC
- [ ] Testar geração de relatório com ZARC
- [ ] Build frontend

### 2.4 CLI e Deploy (Próximo)

- [ ] Sincronizar backend-template
- [ ] Publicar CLI v1.0.16
- [ ] Testar API Local
- [ ] Commit e push

---

## Arquivos Modificados (Backend)

1. ✅ `backend/core/zarc_adapter.py` - Criado
2. ✅ `backend/api.py` - Endpoints atualizados
3. ✅ `backend/core/report_generator.py` - Seção ZARC adicionada

## Próximos Passos

1. Atualizar tipos TypeScript no frontend
2. Criar componentes ZARC
3. Integrar em Talhões, Dashboard, Relatórios
4. Testar e fazer build
5. Sincronizar CLI
6. Commit final

---

**Status Atual:** Backend 100% completo e testado. Frontend aguardando implementação.
