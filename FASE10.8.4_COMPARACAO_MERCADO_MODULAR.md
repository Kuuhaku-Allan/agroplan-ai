# Fase 10.8.4 - Comparacao Mercado Modular

Status: implementada e validada no frontend.

## Objetivo

Aplicar o Modo Avancado Modular em `/comparacao-mercado`, respeitando:

- `prices_enabled`
- `normalization_enabled`
- `market_validation_enabled`
- `market_comparison_enabled`
- `experimental_optimizer_enabled`
- `guided_explanations_enabled`
- `assistant_level`

## Implementacao

- A pagina passou a consumir `useAdvancedMode()`.
- Foi adicionado um card de status modular com modo atual, precos, normalizacao, validacao, comparacao, otimizacao experimental e explicacoes.
- Quando `prices_enabled=false`, a pagina mostra `Comparacao de Mercado desativada` e nao renderiza acao de avaliacao.
- Quando `market_comparison_enabled=false`, o botao `Executar Avaliacao` fica desabilitado e a chamada de comparacao fica bloqueada por guarda local.
- Quando `market_validation_enabled=false`, valores basicos seguem visiveis, mas confiabilidade, status e bloqueios automaticos de validacao ficam ocultos.
- Quando `experimental_optimizer_enabled=false`, a secao experimental fica bloqueada por card informativo.
- Quando `market_validation_enabled=false`, a otimizacao experimental mostra dependencia de validacao.
- Textos didaticos passam a respeitar `guided_explanations_enabled`.
- Perfil Manual continua acessivel e explica que analises de mercado dependem dos modulos ativos.

## Helpers e dependencias

Foram adicionados/ajustados helpers em `frontend/lib/settings.ts` e no contexto:

- `canUsePriceNormalization(settings)`
- `canUseMarketComparison(settings)`
- `canUseExperimentalOptimizer(settings)` agora depende tambem de validacao de mercado.
- `buildMarketLocationForEnabledModules(location, settings)` permite payload parcial seguro para chamadas de mercado.

Regras aplicadas:

- `normalization_enabled` depende de `prices_enabled`.
- `market_validation_enabled` depende de `prices_enabled`.
- `market_comparison_enabled` depende de `prices_enabled`.
- `experimental_optimizer_enabled` depende de `prices_enabled` e `market_validation_enabled`.

## Payload seguro

- `prices_enabled=false`: nenhum endpoint de mercado e chamado.
- `market_comparison_enabled=false`: `/comparar/lucro-mercado` nao e chamado.
- `experimental_optimizer_enabled=false`: `/otimizar/lucro-mercado-experimental` nao e chamado.
- `market_validation_enabled=false`: otimizacao experimental nao e chamada.
- As funcoes de API de mercado aceitam `Partial<ClimateLocation>`, permitindo enviar apenas os campos liberados pelos modulos ativos.

## Validacao

Comandos executados:

```bash
npm.cmd exec eslint -- app\comparacao-mercado\page.tsx components\market-comparison\market-comparison-summary.tsx components\market-comparison\market-comparison-table.tsx lib\settings.ts context\AdvancedModeContext.tsx lib\api.ts
npm.cmd run build
agroplan serve status
```

Resultado:

- ESLint dos arquivos tocados passou.
- Build passou apos reexecucao com rede para baixar a fonte Inter usada pelo Next.
- API local estava online.
- Navegador validou:
  - Iniciante com comparacao ativa e botao habilitado.
  - Manual com precos desligados, pagina bloqueada e sem botao de avaliacao.
  - Avancado com precos ligados e comparacao desligada, botao desabilitado.
  - Avancado com validacao desligada, valores basicos visiveis e confiabilidade oculta.
  - Comparacao real executada com API local online.

## Sem mudancas

- Nenhuma mudanca backend.
- Nenhuma publicacao CLI.
- Dashboard e Planejamento nao foram alterados nesta fase.
