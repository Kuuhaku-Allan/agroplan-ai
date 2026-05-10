# Fase 10.1.1 - Sincronização CLI com Planejador de Safra

**Status**: ✅ Concluída  
**Data**: 2026-05-10  
**Commit**: `30a2978` - chore: sync crop planning engine to CLI v1.0.30

---

## Objetivo

Sincronizar a API Local (CLI) com os novos endpoints do Planejador de Safra criados na Fase 10.1, evitando que a API Local fique desatualizada em relação à API Render.

---

## Problema Identificado

A Fase 10.1 adicionou novos endpoints:
- `POST /planejamento/calendario`
- `GET /planejamento/culturas`
- `GET /planejamento/culturas/{cultura}`

Se não sincronizássemos o `backend-template` da CLI, a API Local ficaria para trás enquanto a API Render teria as novas features.

---

## Entregas

### 1. Arquivos Sincronizados ✅

Copiados para `tools/agroplan-cli/backend-template/`:
- ✅ `api.py` - Com endpoints de planejamento
- ✅ `core/planning_models.py` - Modelos de domínio
- ✅ `core/crop_calendar_engine.py` - Engine de calendário
- ✅ `VERSION.json` - Versão 1.0.30

### 2. Versão Atualizada ✅

**backend/VERSION.json**:
```json
{
  "cli_version": "1.0.30",
  "backend_template_version": "1.0.30",
  "features": [
    ...
    "smart_crop_calendar_engine"  // ← Nova feature
  ]
}
```

**tools/agroplan-cli/package.json**:
```json
{
  "version": "1.0.30"
}
```

### 3. CLI Publicada ✅

```bash
npm publish --access public
# + agroplan-ai-cli@1.0.30
```

**Conteúdo do pacote**:
- 45 arquivos
- 426.5 KB descompactado
- 87.3 KB compactado
- Inclui `planning_models.py` e `crop_calendar_engine.py`

### 4. Testes Locais ✅

#### Atualização Local

```bash
agroplan serve off
agroplan setup --force
agroplan serve on
```

#### Verificação de Versão

```bash
curl http://localhost:8000/debug/version
```

**Resultado**:
```json
{
  "backend_template_version": "1.0.30",
  "features": [
    "zarc_fast_index",
    "climate_real_data",
    "market_profit_experimental_optimizer",
    "smart_crop_calendar_engine"  // ✓ Nova feature presente
  ]
}
```

#### Teste de Endpoints

**1. Listar Culturas**:
```bash
GET /planejamento/culturas
```

**Resposta**:
```json
{
  "total": 3,
  "culturas": ["soja", "milho", "feijao"],
  "detalhes": {
    "soja": {
      "cycle_days": 120,
      "optimal_temp_min": 20,
      "optimal_temp_max": 30,
      "total_phases": 5
    }
  }
}
```

**2. Gerar Calendário**:
```bash
POST /planejamento/calendario
{
  "cultura": "soja",
  "planting_date": "2026-10-15",
  "field": {
    "name": "Talhão Teste API",
    "area_ha": 10.5,
    "soil_type": "argiloso",
    "slope": "plano",
    "water_availability": "media"
  }
}
```

**Resposta**:
```json
{
  "cultura": "soja",
  "planting_date": "2026-10-15",
  "estimated_harvest_date": "2027-02-12",
  "cycle_days": 120,
  "total_tasks": 15,
  "weather_sensitive_tasks": 8,
  "critical_tasks": 4
}
```

✅ **Todos os endpoints funcionando perfeitamente!**

---

## Arquitetura de Sincronização

```
┌─────────────────────────────────────┐
│     Desenvolvimento Local           │
│  backend/api.py                     │
│  backend/core/planning_models.py    │
│  backend/core/crop_calendar_engine.py│
└─────────────────────────────────────┘
              ↓ Copiar
┌─────────────────────────────────────┐
│   CLI Backend Template              │
│  tools/agroplan-cli/backend-template│
│  - api.py                           │
│  - core/planning_models.py          │
│  - core/crop_calendar_engine.py     │
│  - VERSION.json                     │
└─────────────────────────────────────┘
              ↓ Build & Publish
┌─────────────────────────────────────┐
│         npm Registry                │
│  agroplan-ai-cli@1.0.30             │
└─────────────────────────────────────┘
              ↓ Install/Update
┌─────────────────────────────────────┐
│      API Local do Usuário           │
│  ~/.agroplan/backend/               │
│  - Endpoints de planejamento ✓      │
│  - Engine de calendário ✓           │
│  - Modelos de domínio ✓             │
└─────────────────────────────────────┘
```

---

## Fluxo de Atualização

### Para Desenvolvedores

1. Desenvolver feature no `backend/`
2. Copiar para `tools/agroplan-cli/backend-template/`
3. Atualizar `VERSION.json` (ambos)
4. Atualizar `package.json` da CLI
5. Build: `bun run build`
6. Publish: `npm publish --access public`
7. Commit e push

### Para Usuários

1. Aguardar propagação npm (~5-10 minutos)
2. Atualizar CLI: `bun add -g agroplan-ai-cli@latest`
3. Atualizar backend: `agroplan update`
4. Ou forçar: `agroplan setup --force`
5. Reiniciar: `agroplan serve off && agroplan serve on`

---

## Diferenças entre APIs

### API Render (Produção)

- ✅ Atualizada via deploy automático do GitHub
- ✅ Sempre tem a versão mais recente após push
- ✅ Não requer ação do usuário

### API Local (CLI)

- ⚠️ Requer sincronização manual do backend-template
- ⚠️ Requer publicação da CLI no npm
- ⚠️ Requer atualização pelo usuário (`agroplan update`)
- ✅ Mais rápida (sem cold start)
- ✅ Funciona offline

---

## Lições Aprendidas

### 1. Sempre Sincronizar CLI

Quando adicionar novos endpoints ou features:
1. ✅ Desenvolver no `backend/`
2. ✅ Testar localmente
3. ✅ **Sincronizar `backend-template`** ← Não esquecer!
4. ✅ Atualizar versão
5. ✅ Publicar CLI
6. ✅ Commit e push

### 2. Versionamento Consistente

- `backend/VERSION.json` e `tools/agroplan-cli/package.json` devem ter a mesma versão
- Feature flags em `VERSION.json` ajudam a diagnosticar

### 3. Teste Local Antes de Publicar

```bash
# Copiar manualmente para testar
cp backend/api.py ~/.agroplan/backend/api.py
agroplan serve off && agroplan serve on
curl http://localhost:8000/planejamento/culturas
```

---

## Próximos Passos

### Fase 10.2 - Cadastro Manual de Terrenos

Agora que a CLI está sincronizada, podemos avançar para:

- [ ] Storage simples em JSON local
- [ ] CRUD de talhões
- [ ] Endpoints de gerenciamento
- [ ] Integração com calendário
- [ ] Interface frontend

**Importante**: Cada nova feature no backend deve ser sincronizada com a CLI!

---

## Checklist de Sincronização

Para futuras features, seguir este checklist:

- [ ] Desenvolver feature no `backend/`
- [ ] Testar localmente
- [ ] Copiar arquivos para `backend-template/`
- [ ] Atualizar `backend/VERSION.json`
- [ ] Copiar `VERSION.json` para `backend-template/`
- [ ] Atualizar `tools/agroplan-cli/package.json`
- [ ] Build CLI: `bun run build`
- [ ] Publish CLI: `npm publish --access public`
- [ ] Testar instalação: `bun add -g agroplan-ai-cli@latest`
- [ ] Testar update: `agroplan update`
- [ ] Testar endpoints locais
- [ ] Commit e push

---

## Conclusão

A Fase 10.1.1 garantiu que a **API Local está sincronizada** com os novos endpoints do Planejador de Safra. Agora tanto a API Render quanto a API Local têm:

✅ Engine de calendário agrícola  
✅ 3 culturas (soja, milho, feijão)  
✅ Endpoints de planejamento  
✅ Modelos de domínio  

**Próximo passo**: Fase 10.2 - Cadastro Manual de Terrenos/Talhões

---

**Commit**: `30a2978`  
**CLI Version**: `1.0.30`  
**Feature**: `smart_crop_calendar_engine`  
**Status**: ✅ Sincronizado e testado
