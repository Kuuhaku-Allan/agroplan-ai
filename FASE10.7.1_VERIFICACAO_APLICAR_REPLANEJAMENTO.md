# Fase 10.7.1 — Verificação Real da Aplicação de Sugestões

**Data:** 2026-05-16  
**Versão backend:** 1.0.40  
**Feature:** `calendar_replanning_apply_suggestions`

---

## Objetivo

Validar de ponta a ponta todo o fluxo de replanejamento aplicado:

```
gerar calendário → registrar imprevisto → gerar sugestão → aplicar sugestão → ver calendário ajustado
```

A Fase 10.7 implementou o endpoint `POST /planejamento/replanejar/aplicar` e o frontend, mas o teste anterior só confirmou que o endpoint existia e que Pydantic validava o payload — não testava o fluxo real.

---

## Script de Teste

`backend/test_replanning_apply_flow.py`

Fluxo:

1. **Health check** — confirma API saudável e versão 1.0.40 com a feature presente
2. **Gerar calendário** — `POST /planejamento/calendario` com cultura milho, plantio 2026-05-10, talhão Clementina-SP
3. **Registrar imprevisto — missed_irrigation** — `POST /planejamento/replanejar`
4. **Registrar imprevisto — pest_observation** — `POST /planejamento/replanejar`
5. **Aplicar sugestão (missed_irrigation)** — `POST /planejamento/replanejar/aplicar`
6. **Aplicar sugestão (pest_observation)** — validação manual warning
7. **Checklist completo**

---

## Resultados

### API Local — 19/19 critérios ✅

| Item | Status |
|---|---|
| API saudável | ✅ |
| Versão 1.0.40 | ✅ |
| Feature `calendar_replanning_apply_suggestions` | ✅ |
| Calendário gerado (milho, 15 tarefas) | ✅ |
| Replanejamento `missed_irrigation` | ✅ |
| `pest_observation` → `requires_manual_validation=True` | ✅ |
| `pest_observation` → texto sugere inspeção técnica | ✅ |
| `POST /aplicar` → Status 200 | ✅ |
| `updated_calendar` existe | ✅ |
| `original_calendar` existe | ✅ |
| `applied_suggestion` existe | ✅ |
| `change_log` existe | ✅ |
| `change_log` com entradas | ✅ |
| `summary` existe | ✅ |
| `warnings` presente na resposta | ✅ |
| ≥1 tarefa com `replanned=true` | ✅ |
| `original_date` preservada | ✅ |
| `replanning_reason` existe | ✅ |
| `original_calendar` sem tarefas `replanned` | ✅ |
| `pest_observation` → warning de validação manual ao aplicar | ✅ |

### API Render — 19/19 critérios ✅

Mesmos critérios acima, todos passando em produção.

---

## Detalhes dos Fluxos

### missed_irrigation

```
POST /planejamento/replanejar
{
  "calendar": <calendario>,
  "event": {
    "event_type": "missed_irrigation",
    "date": "2026-05-15",
    "description": "Nao consegui irrigar nesse dia"
  }
}
```

- **Sugestão gerada:** 1
- **Ação:** "Sugestão de ajuste: reagendar irrigação perdida para o próximo dia viável."
- **Risco:** `RiskLevel.ALTO` → normalizado para `alto`
- **Validação manual:** True
- **Original:** 2026-05-15 → **Sugerida:** 2026-05-16

```
POST /planejamento/replanejar/aplicar
{
  "calendar": <calendario>,
  "suggestion": { ... normalizado ... },
  "event": { ... }
}
```

- **Status:** 200
- **Tarefa replanejada:** `replanned=true`, `original_date="2026-05-15"`, `replanning_reason="..."`

### pest_observation

```
POST /planejamento/replanejar
{
  "calendar": <calendario>,
  "event": {
    "event_type": "pest_observation",
    "date": "2026-05-15",
    "description": "Observei lagartas nas folhas"
  }
}
```

- **Sugestão gerada:** 1
- **Ação:** "realizar inspeção técnica do talhão para identificação e quantificação da praga."
- **Não recomenda defensivo específico** — texto finaliza: "Consulte um engenheiro agrônomo ou técnico habilitado."
- **Validação manual:** True

Ao aplicar:
- **Status:** 200
- **Warnings:** `["Esta sugestão exige validação manual antes de ser seguida em campo.", ...]`

---

## Calendário Original Preservado

O campo `original_calendar` na resposta de `/aplicar` contém o calendário **antes** da aplicação da sugestão, sem marcação de `replanned`. O calendário ajustado está em `updated_calendar`.

---

## Histórico / Change Log

O campo `change_log` na resposta contém o histórico de mudanças:

```json
[
  {
    "field": "date",
    "old_value": "2026-05-15",
    "new_value": "2026-05-16",
    "task_id": "...",
    "reason": "..."
  }
]
```

---

## Frontend

Aplicado em `frontend/app/planejamento/page.tsx`:

- `handleReplan` (linha ~287) — gera sugestões
- `handleApplySuggestion` (linha ~312) — aplica sugestão selecionada
- UI exibe `originalCalendar` vs `adjustedCalendar`
- Badge `REPLANEJADO` em tarefas `replanned=true`
- `original_date` exibida ao lado da data ajustada
- Alternância entre visualização original e ajustada
- Reversão do ajuste disponível (restaura original_calendar)

---

## Problemas Encontrados e Corrigidos

### 1. `/health` e `/debug/version` usam GET, não POST

O teste inicial usou POST incorretamente (copiado de exemplo anterior).  
**Correção:** `get_json()` usa `GET` para essas rotas.

### 2. Enum serializado como string Python (`RiskLevel.ALTO`) ao invés de valor (`"alto"`)

O backend retorna o valor completo do enum Python. Pydantic espera o valor do enum.  
**Correção:** `normalize_suggestion()` extrai o valor do enum antes de enviar ao `/aplicar`.

### 3. Unicode/acentos no `.lower()` corrompe strings no Windows

`"validação".lower()` no Windows com codepage CP1252 gera caracteres corrompidos.  
**Correção:** `unicodedata.normalize("NFKD", s).encode("ASCII", "ignore").decode("ASCII")` antes de comparar.

---

## Versão da CLI gerada

Versão **1.0.40** confirmada em ambos os ambientes.  
VERSION.json inclui `"calendar_replanning_apply_suggestions"` nas features.

---

## Próximos Passos

Após Fase 10.7.1 fechada, recomenda-se:

- **Fase 10.8 — Modo Avançado Modular:** ao usuário escolher quais módulos da IA deseja usar (clima, ZARC, preços, replanejamento, etc.)
- Fase 10.9 (Mapa) fica para depois, quando o fluxo de planejamento estiver mais maduro.

Código do teste: `backend/test_replanning_apply_flow.py`
