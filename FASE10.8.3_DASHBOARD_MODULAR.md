# Fase 10.8.3 - Dashboard Modular

Data: 2026-05-16

## Objetivo

Aplicar o Modo Avancado Modular ao `/dashboard`, mantendo a tela util mesmo quando os modulos avancados estao desligados.

## Escopo aplicado

- `climate_enabled`
- `zarc_enabled`
- `prices_enabled`
- `market_validation_enabled`
- `guided_explanations_enabled`
- `assistant_level`

Sem mudancas:

- Nenhuma mudanca backend.
- Nenhuma publicacao CLI.
- Nenhuma mudanca em Comparacao Mercado.

## Implementacao

### Helpers

Foram adicionados helpers em `frontend/lib/settings.ts` e expostos via `useAdvancedMode()`:

- `canUseZarc()`
- `canUsePrices()`
- `canUseMarketValidation()`

### Payload seguro

`frontend/app/dashboard/page.tsx` agora usa:

- `buildLocationForEnabledModules(location, settings)`

E `frontend/lib/api.ts` passou a aceitar localizacao parcial em:

- `getDashboard(location?: Partial<ClimateLocation>)`
- `getCenarios(location?: Partial<ClimateLocation>)`

Com isso:

- `climate_enabled=false` remove `lat/lon/days` antes das chamadas.
- `zarc_enabled=false` remove `uf/municipio/safra` antes das chamadas.
- `getDashboard()` consegue receber somente `uf/municipio/safra` quando ZARC esta ligado e clima esta desligado.
- `getCenarios()` envia apenas parametros climaticos quando `lat/lon` estao disponiveis e permitidos.

Observacao:

- O backend ainda aplica precos no Dashboard por padrao. Como nao ha parametro backend para desativar precos, a Fase 10.8.3 garante a ocultacao completa na UI quando `prices_enabled=false`.

## UI modular

Foi adicionado um card discreto no topo do Dashboard com:

- Modo atual
- Clima
- ZARC
- Precos
- Validacao mercado
- Explicacoes
- Link para `/configuracoes`

### Clima

Com `climate_enabled=true`:

- O card de clima real aparece.
- A selecao de regiao continua disponivel.
- `lat/lon/days` sao enviados quando ha regiao selecionada.

Com `climate_enabled=false`:

- O card climatico fica oculto.
- Open-Meteo/contexto climatico nao aparece.
- `lat/lon/days` nao sao enviados.
- Aparece aviso discreto de clima desativado.

### ZARC

Com `zarc_enabled=true`:

- O banner ZARC aparece quando ha UF/municipio/safra.
- A selecao de regiao continua disponivel quando ZARC esta ligado mas ainda sem regiao.

Com `zarc_enabled=false`:

- O banner ZARC fica oculto.
- Cobertura ZARC e janelas oficiais nao aparecem.
- `uf/municipio/safra` nao sao enviados para acionar ZARC.
- Aparece aviso discreto de ZARC desativado.

### Precos

Com `prices_enabled=true`:

- O banner de precos agricolas aparece quando a API retorna precos ativos.

Com `prices_enabled=false`:

- O banner de precos fica oculto.
- Lucro de mercado derivado de precos fica oculto.
- Aparece aviso discreto de precos desativados.

### Validacao de mercado

Com `market_validation_enabled=true` e `prices_enabled=true`:

- O banner de validacao de lucro de mercado aparece quando a API retorna validacao ativa.

Com `market_validation_enabled=false` ou `prices_enabled=false`:

- O banner fica oculto.
- Quando precos estao desligados, aparece a dependencia: validacao de mercado depende de precos agricolas.

### Explicacoes reduzidas

Com `guided_explanations_enabled=false`:

- O subtitulo do Topbar fica oculto.
- O texto auxiliar do card modular fica oculto.
- O texto didatico longo do `DecisionSummary` fica oculto.
- Alertas, metricas e informacoes essenciais continuam visiveis.

### Perfil Manual

Com `assistant_level=manual`:

- O Dashboard mostra os cards basicos, graficos, plano recomendado, decisao e acoes rapidas.
- Clima, ZARC, precos e validacao de mercado ficam ocultos.
- Aparece a mensagem de modo Manual com informacoes essenciais.

## Validacao manual

API local:

- `agroplan serve status` confirmou API Local online em `http://localhost:8000`.

Perfis testados no navegador:

1. Iniciante com regiao Clementina/SP:
   - clima apareceu;
   - ZARC apareceu;
   - precos apareceram;
   - validacao de mercado apareceu;
   - explicacoes completas apareceram.

2. Manual:
   - clima, ZARC, precos e validacao ficaram ocultos;
   - Dashboard manteve metricas e plano recomendado;
   - aviso de modo Manual apareceu.

3. Avancado com clima desligado:
   - card climatico sumiu;
   - Open-Meteo nao apareceu;
   - ZARC e precos continuaram visiveis.

4. Avancado com ZARC desligado:
   - ZARC Ativo e Cobertura ZARC sumiram;
   - clima e precos continuaram visiveis.

5. Avancado com precos desligados:
   - Precos Agricolas Disponiveis sumiu;
   - Lucro de Mercado Disponivel sumiu;
   - dependencia de validacao de mercado apareceu;
   - clima e ZARC continuaram visiveis.

## Comandos

```powershell
npm.cmd exec eslint -- app\dashboard\page.tsx components\dashboard\decision-summary.tsx lib\settings.ts context\AdvancedModeContext.tsx lib\api.ts
```

Resultado: OK.

```powershell
npm.cmd run build
```

Resultado:

- Primeira execucao no sandbox falhou por falta de rede ao buscar `Inter` no Google Fonts.
- Reexecucao com permissao de rede passou.

## Conclusao

Fase 10.8.3 aprovada.

O `/dashboard` agora respeita os modulos principais do Modo Avancado Modular, filtra parametros de localizacao antes das chamadas e permanece funcional no perfil Manual.
