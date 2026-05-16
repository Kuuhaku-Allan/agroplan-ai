# Fase 10.8.2.1 - Verificacao Real do Planejamento Modular

Data: 2026-05-16

## Objetivo

Validar com API local online que a pagina `/planejamento` respeita as configuracoes modulares da Fase 10.8.2 em execucao real, nao apenas na camada visual.

## Ambiente

- API local: `http://localhost:8000`
- Frontend local: `http://127.0.0.1:3000`
- Nenhuma mudanca backend.
- Nenhuma publicacao CLI.

Observacao operacional:

- A API local iniciou corretamente com `agroplan serve on`.
- `agroplan doctor` ficou OK, com aviso conhecido de Python 3.13.
- O arquivo local do CLI `C:\Users\Defal\.agroplan\backend\data\user_fields\fields.json` estava em UTF-16 LE e foi normalizado para UTF-8 para permitir a leitura dos talhoes pela API local. Isso foi ajuste de dado local fora do repositorio, nao mudanca de backend.

## Dados de teste

Talhao criado na API local:

- Nome: `Talhao Verificacao Modular`
- Area: `10 ha`
- Solo: `argiloso`
- Relevo: `plano`
- Agua: `media`
- UF/municipio: `SP / Clementina`
- Coordenadas: `-21.56, -50.45`

Limpeza:

- O talhao temporario foi removido ao final da verificacao.
- `GET /planejamento/talhoes` voltou a retornar `total=0` para os talhoes manuais locais.

Calendario usado nos testes:

- Cultura: `soja`
- Data de plantio: `2026-10-01`

## Resultado da API

Teste direto com clima ligado:

- Endpoint: `POST /planejamento/talhoes/{id}/calendario`
- Payload: `usar_clima=true`
- Resultado: `weather_enabled=true`
- Resultado: `total_tasks=15`
- Resultado: `weather_summary` presente, com 8 tarefas por climatologia e fonte `nasa-power`

Teste direto com clima desligado:

- Endpoint: `POST /planejamento/talhoes/{id}/calendario`
- Payload: `usar_clima=false`
- Resultado: `weather_enabled=false`
- Resultado: `weather_summary=null`
- Resultado: `weather_warnings=null`

## Resultado da UI

### Perfil Iniciante

Status: OK.

- Card modular mostrou `Modo atual: Iniciante`.
- Badges: clima ligado, replanejamento ligado, explicacoes completas.
- Toggle `Usar clima integrado` apareceu para talhao com lat/lon.
- Calendario gerou com `Clima Integrado Ativo`.
- Bloco de climatologia NASA POWER apareceu.
- Secao `Registrar Imprevisto` apareceu.

### Clima desligado

Status: OK.

- Perfil Avancado com `climate_enabled=false`.
- Card modular mostrou `Clima: desligado`.
- Toggle `Usar clima integrado` nao apareceu.
- Aviso discreto apareceu: clima integrado desativado nas Configuracoes.
- Calendario gerou normalmente.
- UI nao mostrou `Clima Integrado Ativo`.
- UI nao mostrou NASA POWER.
- UI nao mostrou resumo/informacoes climaticas.

### Replanejamento desligado

Status: OK.

- `replanning_enabled=false`.
- Card modular mostrou `Replanejamento: desligado`.
- Depois da geracao do calendario, a secao `Registrar Imprevisto` nao apareceu.
- Card informativo de replanejamento desativado apareceu.
- Nenhuma acao de replanejamento ficou disponivel na UI.

### Explicacoes reduzidas

Status: OK.

- `guided_explanations_enabled=false`.
- Card modular mostrou `Explicacoes: reduzidas`.
- Textos didaticos longos do modo e do wizard ficaram ocultos.
- Texto didatico geral do calendario (`calendar.cautela`) foi ajustado para aparecer apenas com explicacoes completas.
- Alertas e marcadores importantes continuaram visiveis, incluindo tarefas criticas.

### Perfil Manual

Status: OK.

- Card modular mostrou `Modo atual: Manual`.
- Clima desligado.
- Replanejamento desligado.
- Explicacoes reduzidas.
- Cadastro manual e geracao de calendario continuaram funcionando.
- Modo guiado continuou disponivel, mas sem destaque textual longo.

### Modo guiado com clima desligado

Status: OK.

- Wizard mostrou `Clima integrado desativado`.
- Wizard nao mostrou `Clima Integrado Ativo`.
- Wizard gerou calendario sem NASA POWER.
- Ao concluir, a pagina exibiu o calendario sem contexto climatico.
- O modo guiado nao forcou clima quando o modulo estava desligado.

## Ajuste aplicado nesta verificacao

Arquivo:

- `frontend/app/planejamento/page.tsx`

Mudanca:

- `calendar.cautela` agora respeita `guided_explanations_enabled`.
- Com explicacoes reduzidas, o texto didatico geral do calendario fica oculto.
- Alertas criticos e tarefas do calendario continuam visiveis.

## Comandos executados

```powershell
agroplan serve status
agroplan serve on
agroplan doctor
```

```powershell
npm.cmd exec eslint -- app\planejamento\page.tsx components\planning\guided-planning-wizard.tsx lib\settings.ts context\AdvancedModeContext.tsx hooks\useAdvancedMode.ts components\settings\advanced-mode-panel.tsx app\configuracoes\page.tsx app\layout.tsx components\layout\sidebar.tsx
```

Resultado: OK.

```powershell
npm.cmd run build
```

Resultado:

- Primeira execucao no sandbox falhou por falta de rede ao buscar `Inter` no Google Fonts.
- Reexecucao com permissao de rede passou.

## Conclusao

Fase 10.8.2.1 aprovada.

O `/planejamento` respeita `climate_enabled`, `replanning_enabled`, `guided_explanations_enabled` e `assistant_level` com API local online. A verificacao confirmou que clima desligado nao fica apenas escondido: o calendario gerado pela tela nao apresenta sinais de ativacao climatica quando o modulo esta desligado.
