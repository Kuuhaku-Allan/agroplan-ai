# Fase 10.8 - Conclusao do Modo Avancado Modular

Data: 2026-05-17  
Status: concluida

## Arquitetura final

O Modo Avancado Modular ficou concentrado em uma fonte de verdade no frontend:

- `frontend/lib/settings.ts`: tipos, presets, dependencias e helpers.
- `frontend/context/AdvancedModeContext.tsx`: provider global com reducer e persistencia.
- `frontend/hooks/useAdvancedMode.ts`: hook unico para telas e componentes.
- `frontend/components/settings/advanced-mode-panel.tsx`: painel visual em `/configuracoes`.

As preferencias sao persistidas em `localStorage`. Nao houve mudanca backend para esta fase.

## Presets finais

| Perfil | Proposta |
|---|---|
| Iniciante | Recursos principais ligados, explicacoes completas e otimizacao experimental desligada por seguranca. |
| Intermediario | Clima, ZARC, precos, validacao, comparacao e replanejamento ligados, com explicacoes reduzidas. |
| Avancado | Preserva as escolhas atuais e permite controle fino dos modulos. |
| Manual | Mantem calendario e talhoes como nucleo, com modulos avancados desligados por padrao. |

## Modulos

| Modulo | Campo |
|---|---|
| Clima integrado | `climate_enabled` |
| ZARC | `zarc_enabled` |
| Precos agricolas | `prices_enabled` |
| Normalizacao de precos | `normalization_enabled` |
| Validacao de lucro de mercado | `market_validation_enabled` |
| Comparacao de mercado | `market_comparison_enabled` |
| Otimizacao experimental | `experimental_optimizer_enabled` |
| Replanejamento por imprevistos | `replanning_enabled` |
| Explicacoes guiadas | `guided_explanations_enabled` |

## Dependencias

As dependencias ficam centralizadas em `MODULE_DEPENDENCIES`:

- Normalizacao depende de Precos.
- Validacao de lucro de mercado depende de Precos.
- Comparacao de mercado depende de Precos.
- Otimizacao experimental depende de Precos e Validacao de lucro de mercado.
- Clima integrado depende de `climate_enabled`.
- Replanejamento depende de `replanning_enabled`.

Quando uma dependencia fica desligada, o modulo dependente fica indisponivel e a UI explica o motivo.

## Paginas integradas

### `/configuracoes`

- Presets prontos.
- Resumo "Seu modo atual".
- Modulos agrupados por Planejamento, Clima e ZARC, Mercado e Assistente.
- Dependencias visuais claras.
- Botao para restaurar o padrao Iniciante.

### `/planejamento`

- Respeita clima, replanejamento, explicacoes e nivel do assistente.
- Com clima desligado, nao envia `usar_clima=true`.
- Com replanejamento desligado, nao permite chamar endpoints de replanejamento.
- Modo guiado respeita as preferencias modulares.

### `/dashboard`

- Respeita clima, ZARC, precos, validacao de mercado e explicacoes.
- Remove parametros climaticos ou ZARC quando os modulos estao desligados.
- Mantem uma visao essencial no perfil Manual.

### `/comparacao-mercado`

- Bloqueia a pagina quando Precos estao desligados.
- Bloqueia avaliacao quando Comparacao de mercado esta desligada.
- Oculta confiabilidade quando Validacao de mercado esta desligada.
- Bloqueia otimizacao experimental quando suas dependencias nao estao ativas.

## API Local, Render e NPM

Esta fase foi 100% frontend. A API Local e a API Render continuam no backend `1.0.40`, com o mesmo `backend-template` usado pelo CLI `agroplan-ai-cli@1.0.40`.

Verificacao em 2026-05-17:

- API Local: `cli_version=1.0.40`, `backend_template_version=1.0.40`.
- API Render: `cli_version=1.0.40`, `backend_template_version=1.0.40`.
- NPM: `agroplan-ai-cli@1.0.40` e a versao publicada atual.

Nao foi necessaria nova publicacao NPM nesta fase porque nenhum arquivo de backend, template de API ou comando CLI foi alterado. A regra para as proximas correcoes fica:

- Mudou backend/template/CLI: subir versao e publicar NPM.
- Mudou apenas frontend/documentacao: nao publicar NPM.

## Limitacoes conhecidas

- As configuracoes ainda sao locais por navegador. Quando houver login, podem migrar para `GET/POST /settings`.
- Alguns endpoints de backend ainda retornam dados completos por padrao. O frontend ja bloqueia exibicao e chamadas principais quando os modulos estao desligados.
- A otimizacao experimental segue desligada por padrao em todos os presets por ser uma simulacao sensivel.

## Validacao

- ESLint dos arquivos tocados passou.
- Build do frontend passou.
- Verificacao visual cobriu `/configuracoes`, `/planejamento`, `/dashboard` e `/comparacao-mercado`.
- API Local foi validada com `agroplan serve status`.

## Proximos focos do produto

Depois desta fase, o foco passa a ser fechamento do MVP de hoje:

- Corrigir o fluxo quebrado identificado nos testes com a dupla.
- Otimizar pontos de UX e performance.
- Implementar melhorias finais de produto.
- Construir a landing page.

Mapa e desenho de terreno ficam fora do escopo imediato.
