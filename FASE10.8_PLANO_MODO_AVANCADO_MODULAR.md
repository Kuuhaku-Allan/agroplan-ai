# Fase 10.8 — Plano Técnico: Modo Avançado Modular

**Status:** 📋 Em planejamento  
**Data:** 2026-05-16  
**Branch:** main  
**Última verificação:** Fase 10.8.2.1 validada com API local online em 2026-05-16. Detalhes em `FASE10.8.2.1_VERIFICACAO_PLANEJAMENTO_MODULAR.md`.  
**Última fase implementada:** Fase 10.8.3 - Dashboard Modular. Detalhes em `FASE10.8.3_DASHBOARD_MODULAR.md`.
**Artifact:** Este arquivo (não implementar sem aprovação)

---

## 1. Problema a Resolver

O AgroPlan hoje funciona em modo "tudo ligado". O usuário **não pode desligar nenhum módulo** — clima, ZARC, preços, replanejamento, recomendações — todos são carregados e exibidos ao mesmo tempo.

Isso causa dois problemas:
1. **Para iniciantes**: muito informação de uma vez, sem possibilidade de reduzir.
2. **Para avançados**: nenhum controle sobre o que a IA analisa.

O Modo Avançado Modular resolve isso com **uma única fonte de verdade** (`advancedSettings`), e todo o resto do sistema consulta essa fonte.

---

## 2. Objetivo

Permitir que o usuário **ligue ou desligue módulos da inteligência** individualmente, ou escolha um perfil pronto:

```
[ ] Clima integrado
[ ] ZARC
[ ] Preços agrícolas
[ ] Validação de lucro de mercado
[ ] Comparação mercado
[ ] Otimização experimental
[ ] Replanejamento por imprevistos
[ ] Recomendações guiadas (assistente)
[ ] Alertas didáticos / explicações
```

---

## 3. Arquitetura Proposta

### 3.1 Princípio: Single Source of Truth

```
┌──────────────────────────────────────────────────────────┐
│                   advancedSettings                        │
│  { climate, zarc, prices, replanning, ... }              │
│  + assistant_level: "iniciante"|"intermediario"|...       │
└────────────┬───────────────────────┬──────────────────────┘
             │                       │
   localStorage           /api/settings (futuro)
  (fonte atual)            (persistência por usuário)
             │
     ┌───────┴──────────────────────────────────────┐
     │  Frontend — context + hook                    │
     │  AdvancedModeProvider (Context)               │
     │  useAdvancedMode() → retorna settings + utils  │
     └───────┬──────────────────────────────────────┘
             │
  ┌──────────┼──────────────────────────────────────────┐
  │          │  TODOS OS COMPONENTES CONSULTAM ESTE     │
  │          │  HOOK — NÃO DECISÕES ESPALHADAS          │
  │          │                                          │
  ▼          ▼                                          ▼
planejamento  dashboard    comparacao    genetico      settings
page          page         mercado       page          panel
```

**Nunca:** `if (this.props.something) { show climate }` espalhado por cada componente.  
**Sempre:** `const { climate } = useAdvancedMode()` — Uma fonte, todo mundo consulta.

---

### 3.2 Backend

**Não precisa de mudanças** no backend para a Fase 10.8.

#### Justificativa

| Endpoint | Precisaria mudar? | Motivo |
|---|---|---|
| `/planejamento/calendario` | ❌ Não | Já retorna `weather_context`, `zarc_info` etc. Quando o módulo estiver desligado, o frontend simplesmente ignora esses campos. |
| `/planejamento/replanejar` | ❌ Não | Mesma lógica — o frontend não chama o endpoint se replanejamento estiver desligado. |
| `/comparar/lucro-mercado` | ❌ Não | Frontend esconde a página. |
| `/otimizar/lucro-mercado-experimental` | ❌ Não | Frontend esconde a ação. |
| `/dashboard` | ❌ Não | Dashboard consome os dados, mas a filtragem acontece no frontend. |

#### Futuro (não na Fase 10.8)

Se/Quando houver login e persistência por usuário, adicionar:
- `GET /settings` — retorna `AdvancedModeSettings` do usuário
- `POST /settings` — salva preferências do usuário
- Isso permite que as preferências sejam acessadas de qualquer dispositivo.

**Na Fase 10.8:** apenas localStorage. Não tocar no backend.

---

### 3.3 Frontend — Novos Arquivos

```
frontend/
├── lib/
│   ├── settings.ts          ← NOVO — tipo AdvancedModeSettings + defaults
│   └── types.ts             ← ADICIONAR tipo ao arquivo existente
│
├── context/
│   └── AdvancedModeContext.tsx  ← NOVO — Context + Provider
│
├── hooks/
│   └── useAdvancedMode.ts    ← NOVO — hook de acesso
│
├── components/
│   └── settings/
│       └── advanced-mode-panel.tsx  ← NOVO — painel de toggles
│
└── app/
    └── settings/
        └── page.tsx          ← NOVO — página de Configurações Avançadas
```

---

### 3.4 O Tipo — AdvancedModeSettings

```typescript
// frontend/types.ts (adicionar ao arquivo existente)

export type AssistantLevel =
  | "iniciante"
  | "intermediario"
  | "avancado"
  | "manual";

export interface AdvancedModeSettings {
  // Módulos
  climate_enabled:         boolean;  // Clima integrado (Open-Meteo + NASA POWER)
  zarc_enabled:            boolean;  // ZARC / janelas de plantio Embrapa
  prices_enabled:          boolean;  // Preços agrícolas (CEPEA/ESALQ)
  normalization_enabled:   boolean;  // Normalização de preços por unidade
  market_validation_enabled: boolean; // Validação de lucro vs mercado
  market_comparison_enabled: boolean; // Comparação de cenários de mercado
  experimental_optimizer_enabled: boolean; // Otimização experimental
  replanning_enabled:      boolean;  // Replanejamento por imprevistos
  guided_explanations_enabled: boolean; // Explicações didáticas / assistente

  // Nível de assistência (preset)
  assistant_level: AssistantLevel;
}
```

---

### 3.5 Defaults e Presets

```typescript
// frontend/lib/settings.ts

const DEFAULTS: AdvancedModeSettings = {
  climate_enabled:          true,
  zarc_enabled:             true,
  prices_enabled:           true,
  normalization_enabled:    true,
  market_validation_enabled: true,
  market_comparison_enabled: true,
  experimental_optimizer_enabled: false,
  replanning_enabled:       true,
  guided_explanations_enabled: true,
  assistant_level:          "iniciante",
};

const PRESETS: Record<AssistantLevel, AdvancedModeSettings> = {
  iniciante: {
    ...DEFAULTS,
    assistant_level: "iniciante",
    guided_explanations_enabled: true,
    experimental_optimizer_enabled: false,
  },
  intermediario: {
    climate_enabled:          true,
    zarc_enabled:             true,
    prices_enabled:           true,
    normalization_enabled:    true,
    market_validation_enabled: true,
    market_comparison_enabled: false, // menos complexo
    experimental_optimizer_enabled: false,
    replanning_enabled:       true,
    guided_explanations_enabled: false, // menos texto
    assistant_level:          "intermediario",
  },
  avancado: {
    ...DEFAULTS, // todos ligados, mas usuário pode desligar individualmente
    assistant_level: "avancado",
  },
  manual: {
    climate_enabled:          false,
    zarc_enabled:             false,
    prices_enabled:           false,
    normalization_enabled:    false,
    market_validation_enabled: false,
    market_comparison_enabled: false,
    experimental_optimizer_enabled: false,
    replanning_enabled:       false,
    guided_explanations_enabled: false,
    assistant_level:          "manual",
  },
};
```

---

### 3.6 Persistência

```typescript
// localStorage — Fase 10.8 (única mudança de persistência)
const STORAGE_KEY = "agroplan_advanced_settings";

// Salvar
localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

// Ler
const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");

// merge com DEFAULTS na inicialização para garantir campos novos
```

**Por que localStorage e não backend?**
- Não há sistema de login na Fase 10.8.
- localStorage é suficiente para preferências de interface.
- Quando houver login, basta migrar para `GET/POST /settings`.
- O tipo é compartilhado — migração é adicionar um `fetch_user_settings()` no provider.

---

### 3.7 Dependências entre Módulos

```
prices_enabled ─────────────────────────────────────────────┐
  ├─► normalization_enabled        (normalização depende de preços)
  ├─► market_validation_enabled    (validação depende de preços)
  └─► market_comparison_enabled    (comparação depende de preços)

experimental_optimizer_enabled
  └─► prices_enabled               (otimizador depende de preços)

replanning_enabled
  └─► calendar (sempre disponível — núcleo)
```

**Regra de auto-desligamento:**

Quando `prices_enabled` muda para `false`:
```typescript
if (!settings.prices_enabled) {
  settings.normalization_enabled = false;
  settings.market_validation_enabled = false;
  settings.market_comparison_enabled = false;
  settings.experimental_optimizer_enabled = false;
}
```

Quando `prices_enabled` muda para `true`:
```typescript
if (settings.prices_enabled) {
  // Restaura apenas se o usuário tivesse ativado antes
  // Para simplificar Fase 10.8: liga tudo que depende de preços
  settings.normalization_enabled = true;
  settings.market_validation_enabled = true;
  settings.market_comparison_enabled = true;
}
```

A UI mostra os módulos dependentes em estado "desligado por dependência" — não permite edição direta enquanto a dependência estiver desligada.

---

## 4. Impacto por Componente / Página

### 4.1 Dashboard (`app/dashboard/page.tsx`)

| Módulo desligado | O que some / muda |
|---|---|
| `climate_enabled = false` | Esconde `ClimateRegionCard`, badges de clima, `weather_context` nas recomendações |
| `zarc_enabled = false` | Esconde `ZarcImpactBanner`, badges ZARC |
| `prices_enabled = false` | Esconde `PriceImpactBanner` |
| `market_validation_enabled = false` | Esconde `MarketProfitValidationBanner` |
| `guided_explanations_enabled = false` | Reduz textos explicativos longos |

### 4.2 Planejamento (`app/planejamento/page.tsx`)

| Módulo desligado | O que some / muda |
|---|---|
| `climate_enabled = false` | Esconde seletor de região climática, botão "Clima Real" |
| `replanning_enabled = false` | Esconde painel "Registrar Imprevisto" + botão "Replanejar" |
| `guided_explanations_enabled = false` | Esconde notas explicativas no wizard |

### 4.3 Comparação de Mercado (`app/comparacao-mercado/page.tsx`)

| Módulo desligado | O que some / muda |
|---|---|
| `market_comparison_enabled = false` | Esconde página inteira do menu; se acessar diretamente, exibe "módulo desativado" |
| `prices_enabled = false` | Mesmo — desativa automaticamente |

### 4.4 Otimização Experimental (`dashboard` ou página separada)

| Módulo desligado | O que some / muda |
|---|---|
| `experimental_optimizer_enabled = false` | Esconde ação/botão de otimização experimental |

### 4.5 Wizard Guiado (`components/planning/guided-planning-wizard.tsx`)

| Módulo desligado | O que some / muda |
|---|---|
| `climate_enabled = false` | Pula passo de seleção de clima, usa valores padrão |
| `zarc_enabled = false` | Pula validação ZARC no wizard |
| `guided_explanations_enabled = false` | Remove tooltips e textos longos |

### 4.6 Topbar / Menu

Adicionar link "Configurações Avançadas" no dropdown ou na página do usuário.

---

## 5. Fluxo de Dados

### 5.1 Inicialização

```
App mount
  │
  ▼
AdvancedModeProvider
  │
  ├── 1. Ler localStorage ("agroplan_advanced_settings")
  │       └── null ou inexistente → usar DEFAULTS
  │
  ├── 2. Se houver salvo, parse + merge com DEFAULTS
  │       (garante campos novos existem)
  │
  ├── 3. Aplicar presets se assistant_level for preset
  │       (iniciante / intermediario / manual)
  │
  └── 4. Disponibilizar via Context + useAdvancedMode()
```

### 5.2 Usuário togglia um módulo

```
Switch onChange
  │
  ▼
updateSettings({ ...settings, [key]: newValue })
  │
  ├── Aplicar regras de dependência (auto-desligar filhas)
  │
  ├── Salvar no localStorage
  │
  └── Notificar todos os componentes (Context re-render)
```

### 5.3 Componente consome configuração

```typescript
// Padrão para TODOS os componentes
import { useAdvancedMode } from '@/hooks/useAdvancedMode';

export function ClimateRegionCard() {
  const { climate } = useAdvancedMode();

  if (!climate.enabled) return null; // escondido

  return (/* ... */);
}
```

---

## 6. Ordem de Implementação

### Etapa 1 — Fundação (tipos + defaults + Context)

1. Adicionar `AdvancedModeSettings` a `frontend/lib/types.ts`
2. Criar `frontend/lib/settings.ts` (defaults, presets, merge)
3. Criar `frontend/context/AdvancedModeContext.tsx` (provider + reducer)
4. Criar `frontend/hooks/useAdvancedMode.ts`

**Critério:** `AdvancedModeProvider` aparece na raiz da app, `useAdvancedMode()` retorna settings, toggles aparecem no console.

---

### Etapa 2 — Persistência

5. localStorage leitura/escrita integrada ao Context

**Critério:** Recarregar a página mantém os toggles.

---

### Etapa 3 — Dashboard

6. Esconder `ClimateRegionCard` se `climate_enabled = false`
7. Esconder `ZarcImpactBanner` se `zarc_enabled = false`
8. Esconder `PriceImpactBanner` se `prices_enabled = false`
9. Esconder `MarketProfitValidationBanner` se `market_validation_enabled = false`

**Critério:** Dashboard renderiza corretamente com cada toggle desligado.

---

### Etapa 4 — Planejamento

10. Esconder painel de clima em `planejamento/page.tsx` se `climate_enabled = false`
11. Esconder replanejamento se `replanning_enabled = false`
12. Wizard: pular passo de clima se `climate_enabled = false`

**Critério:** Calendário ainda funciona com todos os módulos desligados.

---

### Etapa 5 — Pages adicionais

13. Esconder `app/comparacao-mercado/page.tsx` se `market_comparison_enabled = false`
14. Esconder botão de otimização experimental se `experimental_optimizer_enabled = false`

**Critério:** Páginas acessadas diretamente por URL mostram "módulo desativado".

---

### Etapa 6 — Painel de Configurações (UI)

15. Criar `frontend/components/settings/advanced-mode-panel.tsx`
16. Criar `frontend/app/settings/page.tsx`
17. Adicionar link no menu / topbar

**Critério:** Usuário consegue acessar `/settings`, ligar/desligar módulos, e refletir no resto da app.

---

### Etapa 7 — Regras de Dependência + Presets

18. Auto-desligamento de filhas quando pai desliga
19. Botões de preset (Iniciante / Intermediário / Avançado / Manual) no painel
20. `guided_explanations_enabled` — reduzir textos longos

**Critério:** Desligar `prices` desliga normalização, validação e comparação automaticamente.

---

### Etapa 8 — Polimento + Build

21. Build completo
22. Teste de cada perfil (Iniciante → Manual)
23. Teste de persistência (reload)
24. Documentação interna

---

## 7. Riscos e Mitigações

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| `if` espalhado pelo código causa bagunça | Alta | Alto | **Regra:** todos os componentes usam `useAdvancedMode()` — essa regra é não-negociável |
| Desligar clima quebra calendário | Média | Alto | Calendário **nunca** depende de clima — `weather_context` é um campo opcional que o engine ignora se vazio |
| Desligar preços quebra dashboard | Média | Alto | Preços são campos opcionais — dashboard já lida com `ativo: false` |
| localStorage corrompido quebra a app | Baixa | Alto | Merge com DEFAULTS na leitura — sempre ter valores válidos |
| Usuário desliga tudo e fica app vazia | Baixa | Médio | Núcleo (calendário, talhões) nunca é desligável; sempre há algo funcional |
| Regras de dependência quebram sync entre painel e estado | Média | Médio | Lógica centralizada no Context reducer, não nos componentes |

---

## 8. Módulos — Pode Desligar?

| Módulo | Pode desligar | Por quê |
|---|---|---|
| Clima integrado | ✅ Sim | `weather_context` é opcional no calendário |
| ZARC | ✅ Sim | `zarc_info` é informativo, não obrigatório |
| Preços agrícolas | ✅ Sim | `precos` é campos opcionais |
| Normalização de preços | ⚠️ Só se preços também | Depende de `prices_enabled` |
| Validação de lucro | ⚠️ Só se preços também | Depende de `prices_enabled` |
| Comparação mercado | ⚠️ Só se preços também | Depende de `prices_enabled` |
| Otimização experimental | ⚠️ Só se preços também | Depende de `prices_enabled` |
| Replanejamento | ✅ Sim | Endpoint existe independentemente |
| Assistente / explicações | ✅ Sim | Apenas texto, sem efeito colateral |
| **AG / Calendário / Talhões** | ❌ **NÃO** | Núcleo do sistema, sempre ligado |

---

## 9. Backend — Mudanças?

**Nenhuma na Fase 10.8.**

A configuração é 100% frontend via `localStorage`. Quando a fase de autenticação/usuários chegar, adicionar:
```
GET  /settings       → { AdvancedModeSettings }
POST /settings       ← { AdvancedModeSettings }
```

---

## 10. CLI — Publicar Nova Versão?

**Não na Fase 10.8.** A CLI não tem interface web. Se houver mudança de versão, é só incrementar `VERSION.json` após implementação.

---

## 11. Critérios de Aceitação

| Critério | Verificado por |
|---|---|
| Usuário consegue escolher perfil (preset) | Painel `/settings` com 4 botões de preset |
| Usuário consegue ligar/desligar cada módulo | Toggles individuais no painel |
| Preferências persistem no navegador | Recarregar página mantém configuração |
| UI respeita módulos desligados | Dashboard + Planejamento + todas as páginas |
| Dependências entre módulos são tratadas | Desligar preços desliga todas as filhas |
| Modo manual não quebra | Calendário + talhões funcionam sem nenhum módulo |
| Modo guiado continua funcionando | Wizard funciona em todos os perfis |
| Build passa | `npm run build` sem erros |
| Nenhum `if (module)` espalhado sem `useAdvancedMode()` | Code review |

---

## 12. Estrutura de Arquivos — Resumo

### Novos arquivos

```
frontend/lib/settings.ts                    # Tipos + defaults + presets
frontend/context/AdvancedModeContext.tsx     # Context + Provider + reducer
frontend/hooks/useAdvancedMode.ts            # Hook de acesso
frontend/components/settings/advanced-mode-panel.tsx  # Painel de toggles
frontend/app/settings/page.tsx              # Página /settings
```

### Arquivos modificados

```
frontend/lib/types.ts                       # Adicionar AdvancedModeSettings + AssistantLevel
frontend/app/layout.tsx                     # Adicionar AdvancedModeProvider
frontend/app/dashboard/page.tsx             # Esconder/mostrar módulos
frontend/app/planejamento/page.tsx          # Esconder/mostrar módulos + wizard
frontend/components/planning/guided-planning-wizard.tsx  # Aplicar toggles
frontend/app/comparacao-mercado/page.tsx    # Bloquear se desligado
```

### Arquivos NÃO modificados (backend)

```
backend/api.py              # Nenhuma mudança
backend/core/planning_models.py  # Nenhuma mudança
backend/core/replanning_engine.py  # Nenhuma mudança
backend/VERSION.json        # Só incrementar se publicar CLI
```

---

## 13. Padrão de Código — REGRA DE OURO

```
// ❌ ERRADO — decisão espalhada
if (props.precos && props.precos.ativo) {
  return <PriceBanner {...props.precos} />;
}

// ✅ CORRETO — consulta a fonte única
import { useAdvancedMode } from '@/hooks/useAdvancedMode';

export function PriceBanner() {
  const { prices } = useAdvancedMode();
  if (!prices.enabled) return null;
  // ...
}
```

Essa regra vale para **cada módulo, cada componente, cada página**.

---

## Fase 10.8.2 — Aplicação no Planejamento

Status: implementada no frontend.

Escopo aplicado:

- `/planejamento` agora lê o Modo Avançado Modular via `useAdvancedMode()`.
- Card de status modular adicionado no topo da página, com modo atual, Clima, Replanejamento, Explicações e link para `/configuracoes`.
- `climate_enabled` aplicado na geração manual de calendário.
- `buildCalendarPayloadWithSettings()` garante `usar_clima=false` quando clima está desligado.
- Toggle "Usar clima integrado" só aparece quando o módulo de clima está ligado e o talhão tem coordenadas.
- Quando clima está desligado, a página mostra aviso discreto e não envia clima no payload.
- `replanning_enabled` aplicado na seção "Registrar Imprevisto".
- Com replanejamento desligado, a seção de registro é substituída por card informativo e as funções `handleReplan()` / `handleApplySuggestion()` têm guarda local.
- `guided_explanations_enabled` reduz textos didáticos na seleção de modo e no wizard guiado.
- `assistant_level` ajusta o destaque visual: Iniciante/Intermediário favorecem modo guiado; Manual favorece cadastro manual.
- `GuidedPlanningWizard` agora recebe `assistantLevel`, `canUseClimate` e `showGuidedExplanations`.
- O modo guiado não ativa clima automaticamente quando o módulo está desligado.

Validação:

- `npm.cmd exec eslint -- app\planejamento\page.tsx components\planning\guided-planning-wizard.tsx lib\settings.ts context\AdvancedModeContext.tsx hooks\useAdvancedMode.ts components\settings\advanced-mode-panel.tsx app\configuracoes\page.tsx app\layout.tsx components\layout\sidebar.tsx`
- `npm.cmd run build`
- Verificação visual em `/configuracoes` + `/planejamento` para perfis Iniciante e Manual.

Sem mudanças:

- Nenhuma mudança backend.
- Nenhuma publicação CLI.
- Dashboard e Comparação Mercado continuam fora do escopo desta fase.

---

*Plano para aprovação. Não implementar sem sinal verde.*

---

## Fase 10.8.2.1 - Verificacao Real do Planejamento Modular

Status: validada com API local online.

Resumo:

- API local ficou online via `agroplan serve on`.
- `agroplan doctor` passou, com aviso conhecido de Python 3.13.
- Talhao de verificacao criado com lat/lon em Clementina/SP.
- Calendario com `usar_clima=true` retornou `weather_enabled=true` e resumo climatico.
- Calendario com `usar_clima=false` retornou `weather_enabled=false` e sem resumo climatico.
- `/planejamento` com clima desligado removeu o toggle de clima, mostrou aviso discreto e gerou calendario sem contexto climatico.
- `/planejamento` com replanejamento desligado removeu a secao `Registrar Imprevisto` e mostrou card informativo.
- Explicacoes reduzidas ocultaram textos didaticos longos sem esconder tarefas criticas.
- Perfil Manual continuou funcionando com calendario e talhoes.
- Modo guiado respeitou clima desligado e nao forcou payload climatico.

Ajuste feito durante a verificacao:

- `frontend/app/planejamento/page.tsx`: `calendar.cautela` agora aparece apenas quando `guided_explanations_enabled=true`.

Documento detalhado:

- `FASE10.8.2.1_VERIFICACAO_PLANEJAMENTO_MODULAR.md`

Sem mudancas:

- Nenhuma mudanca backend.
- Nenhuma publicacao CLI.

---

## Fase 10.8.3 - Dashboard Modular

Status: implementada e validada no frontend.

Resumo:

- `/dashboard` agora usa `useAdvancedMode()`.
- Card de status modular adicionado ao topo do Dashboard.
- `climate_enabled` controla exibicao climatica e remove `lat/lon/days` das chamadas quando desligado.
- `zarc_enabled` controla exibicao ZARC e remove `uf/municipio/safra` das chamadas quando desligado.
- `prices_enabled` controla banners de precos e lucro de mercado derivado de precos.
- `market_validation_enabled` controla o banner de validacao de lucro de mercado.
- `guided_explanations_enabled` reduz textos didaticos sem esconder alertas e metricas essenciais.
- Perfil Manual mantem o Dashboard util com metricas, graficos, plano recomendado, decisao e acoes rapidas.

Arquivos principais:

- `frontend/app/dashboard/page.tsx`
- `frontend/components/dashboard/decision-summary.tsx`
- `frontend/lib/settings.ts`
- `frontend/context/AdvancedModeContext.tsx`
- `frontend/lib/api.ts`

Payload seguro:

- `getDashboard()` passou a aceitar localizacao parcial.
- `getCenarios()` passou a enviar apenas parametros climaticos quando `lat/lon` estao disponiveis.
- O Dashboard usa `buildLocationForEnabledModules()` antes das chamadas.

Validacao:

- `eslint` dos arquivos tocados passou.
- `npm.cmd run build` passou apos reexecucao com rede para buscar a fonte Inter.
- Verificacao visual no navegador cobriu Iniciante, Manual, Avancado com clima off, Avancado com ZARC off e Avancado com precos off.

Sem mudancas:

- Nenhuma mudanca backend.
- Nenhuma publicacao CLI.
- Comparacao Mercado segue fora do escopo desta fase.
