# Fase Final - Bugfix Replanejamento e Validacao

Data: 2026-05-21
Versao alvo: 1.0.45

## Causas

### RiskLevel.ALTO no replanejamento

O backend usava `RiskLevel.ALTO`, `RiskLevel.MEDIO` e `RiskLevel.BAIXO` internamente, mas algumas respostas eram montadas com `model_dump()` sem `mode="json"`. Com isso, uma sugestao podia chegar ao frontend ou ao estado local como `"RiskLevel.ALTO"` em vez de `"alto"`.

Quando a sugestao era reenviada para `POST /planejamento/replanejar/aplicar`, o Pydantic validava `ReplanningSuggestion.risk_level` contra o enum real (`baixo`, `medio`, `alto`) e rejeitava o payload legado.

Correcoes aplicadas:

- `ReplanningSuggestion` normaliza `risk_level` antes da validacao.
- `replanning_engine.py` usa `model_dump(mode="json")` nas respostas.
- `converter_tipos_python()` agora converte `Enum` para `.value` e `BaseModel` via `model_dump(mode="json")`.
- `frontend/lib/api.ts` normaliza defensivamente `RiskLevel.ALTO/MEDIO/BAIXO` antes do POST.

### float64/int64 no endpoint /rodadas

`executar_multiplas_rodadas()` misturava escalares numpy/pygad (`np.float64`, `np.int64`) com `float`/`int` nativos nas listas usadas por `statistics.mean()` e `statistics.stdev()`. A falha acontecia dentro da estatistica, antes do endpoint poder chamar `converter_tipos_python()`.

Correcoes aplicadas:

- `fitness`, `lucro_total` e `risco_medio` sao convertidos para `float()` imediatamente em cada rodada.
- Os agregados de retorno sao emitidos como `float` nativo.
- `melhor_plano`, `pior_plano` e `todos_resultados` passam por limpeza local de escalares numpy, sem importar helpers de `api.py`.
- `/rodadas` agora faz `copy.deepcopy()` do resultado cacheado antes de anexar `modo`, `config` e avisos.

## Versao e CLI

- `backend/VERSION.json`: 1.0.45
- `tools/agroplan-cli/backend-template/VERSION.json`: 1.0.45
- `tools/agroplan-cli/package.json`: 1.0.45
- Feature adicionada: `final_bugfix_replanning_validation`
- Backend template sincronizado com o backend principal.

## Testes executados

- `python -m py_compile backend/api.py backend/core/planning_models.py backend/core/replanning_engine.py backend/core/bruteforce_validator.py backend/test_final_bugfix_replanning_validation.py` - passou.
- `python backend/test_final_bugfix_replanning_validation.py` com `.venv` local - passou:
  - `/planejamento/replanejar` retorna `risk_level` como `alto|medio|baixo`.
  - `/planejamento/replanejar/aplicar` aceita `alto`.
  - `/planejamento/replanejar/aplicar` aceita legado `RiskLevel.ALTO`.
  - `/rodadas` modo `rapido` passa.
  - `/rodadas` modo `normal` passa.
- `npm.cmd run lint -- lib/api.ts` - passou.
- `bun run build` em `tools/agroplan-cli` - passou.
- `npm.cmd pack --dry-run` em `tools/agroplan-cli` - passou, com tarball limpo sem `__pycache__`.
- `npm.cmd run build` em `frontend` - passou apos liberar rede para o Next baixar a fonte Inter.

## Publicacao npm

Tentativa de `npm.cmd publish --access public` para `agroplan-ai-cli@1.0.45`:

- O pacote foi empacotado corretamente.
- `__pycache__` foi removido do template antes da segunda tentativa.
- A publicacao falhou com `E404 Not Found - PUT https://registry.npmjs.org/agroplan-ai-cli`, indicando falta de permissao/ownership para publicar este pacote no npm com a credencial atual.

## Status local e Render

- Local: corrigido e validado.
- Render: pendente de push/deploy e validacao da API publicada.
