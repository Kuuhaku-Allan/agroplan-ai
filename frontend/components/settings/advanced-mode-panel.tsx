'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  BadgeDollarSign,
  CheckCircle2,
  CloudSun,
  LayoutGrid,
  RotateCcw,
  Settings2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAdvancedMode } from '@/hooks/useAdvancedMode';
import {
  ASSISTANT_LEVEL_DESCRIPTIONS,
  ASSISTANT_LEVEL_LABELS,
  MODULE_LABELS,
  PRESETS,
  countEnabledModules,
  getModuleDependencyMessage,
} from '@/lib/settings';
import type { AssistantLevel, BooleanSettingKey } from '@/lib/settings';

type ModuleDefinition = {
  key: BooleanSettingKey;
  description: string;
};

type ModuleGroup = {
  title: string;
  description: string;
  icon: LucideIcon;
  modules: ModuleDefinition[];
};

const MODULE_GROUPS: ModuleGroup[] = [
  {
    title: 'Planejamento',
    description: 'Calendário e talhões ficam sempre ativos; aqui você controla assistências de ajuste.',
    icon: LayoutGrid,
    modules: [
      {
        key: 'replanning_enabled',
        description:
          'Permite registrar imprevistos e receber sugestões de ajuste no planejamento.',
      },
    ],
  },
  {
    title: 'Clima e ZARC',
    description: 'Dados ambientais e janelas oficiais usadas nas análises.',
    icon: CloudSun,
    modules: [
      {
        key: 'climate_enabled',
        description:
          'Incorpora dados reais de temperatura e precipitação ao calendário e às previsões.',
      },
      {
        key: 'zarc_enabled',
        description:
          'Consulta janelas oficiais de plantio e ajusta recomendações por UF, município e safra.',
      },
    ],
  },
  {
    title: 'Mercado',
    description: 'Preços, normalização, validação e análises experimentais de lucro.',
    icon: BadgeDollarSign,
    modules: [
      {
        key: 'prices_enabled',
        description:
          'Adiciona preços de mercado ao planejamento e habilita os recursos econômicos.',
      },
      {
        key: 'normalization_enabled',
        description:
          'Converte preços por saca, quilo ou tonelada para comparar culturas com a mesma base.',
      },
      {
        key: 'market_validation_enabled',
        description:
          'Compara o lucro otimizado com preços de mercado e classifica a confiabilidade.',
      },
      {
        key: 'market_comparison_enabled',
        description:
          'Permite comparar lucro do sistema e lucro de mercado nos comparativos.',
      },
      {
        key: 'experimental_optimizer_enabled',
        description:
          'Libera o otimizador experimental com objetivo de lucro de mercado para explorar cenários.',
      },
    ],
  },
  {
    title: 'Assistente',
    description: 'Nível de orientação textual exibido nas telas integradas.',
    icon: Sparkles,
    modules: [
      {
        key: 'guided_explanations_enabled',
        description:
          'Mostra explicações mais detalhadas nas telas para orientar a tomada de decisão.',
      },
    ],
  },
];

function statusBadgeClass(enabled: boolean) {
  return enabled
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    : 'border-slate-600/50 bg-slate-800/50 text-slate-400';
}

function ModuleSwitch({
  label,
  description,
  enabled,
  disabled = false,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors ${
        enabled ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-white/10 bg-slate-950/50'
      } ${disabled ? 'opacity-55' : ''}`}
    >
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${enabled ? 'text-slate-100' : 'text-slate-400'}`}>
          {label}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed ${
          enabled ? 'bg-emerald-500' : 'bg-slate-700'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

function PresetSection() {
  const { settings, applyPreset } = useAdvancedMode();
  const moduleTotal = Object.keys(MODULE_LABELS).length;

  return (
    <Card className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.20)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-100">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          Perfis prontos
        </CardTitle>
        <CardDescription className="text-slate-400">
          Escolha um ponto de partida. O perfil Avançado preserva suas escolhas atuais.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(PRESETS) as AssistantLevel[]).map((level) => {
            const active = settings.assistant_level === level;
            const enabledCount = countEnabledModules(PRESETS[level]);

            return (
              <button
                key={level}
                type="button"
                onClick={() => applyPreset(level)}
                className={`flex min-h-32 flex-col items-start justify-between rounded-lg border p-3 text-left transition-colors ${
                  active
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                    : 'border-white/10 bg-slate-950/50 text-slate-300 hover:border-slate-500 hover:bg-slate-800/70'
                }`}
              >
                <span>
                  <span className="block text-base font-semibold leading-tight">
                    {ASSISTANT_LEVEL_LABELS[level]}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                    {ASSISTANT_LEVEL_DESCRIPTIONS[level]}
                  </span>
                </span>
                <span className="mt-3 text-xs text-slate-500">
                  {level === 'avancado' ? 'Escolha livre' : `${enabledCount}/${moduleTotal} módulos`}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function CurrentModeSummary() {
  const {
    settings,
    canShowGuidedExplanations,
    canUseExperimentalOptimizer,
  } = useAdvancedMode();
  const enabledCount = countEnabledModules(settings);
  const moduleTotal = Object.keys(MODULE_LABELS).length;
  const guidedExplanationsEnabled = canShowGuidedExplanations();
  const experimentalEnabled = canUseExperimentalOptimizer();

  return (
    <Card className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.20)]">
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-300">Seu modo atual</span>
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
            {ASSISTANT_LEVEL_LABELS[settings.assistant_level]}
          </Badge>
          <Badge variant="outline" className={statusBadgeClass(enabledCount > 0)}>
            Módulos ativos: {enabledCount}/{moduleTotal}
          </Badge>
          <Badge variant="outline" className={statusBadgeClass(guidedExplanationsEnabled)}>
            Assistência: {guidedExplanationsEnabled ? 'completa' : 'reduzida'}
          </Badge>
          <Badge variant="outline" className={statusBadgeClass(experimentalEnabled)}>
            Mercado experimental: {experimentalEnabled ? 'ativo' : 'desativado'}
          </Badge>
        </div>
        <p className="text-xs text-slate-500">
          As páginas integradas consultam estas preferências antes de mostrar seções avançadas ou acionar chamadas de clima, ZARC e mercado.
        </p>
      </CardContent>
    </Card>
  );
}

function ModulesSection() {
  const { settings, updateSetting, isEnabled } = useAdvancedMode();

  return (
    <Card className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.20)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-100">
          <Settings2 className="h-5 w-5 text-blue-500" />
          Módulos individuais
        </CardTitle>
        <CardDescription className="text-slate-400">
          Ajuste quais funcionalidades estão ativas. Recursos dependentes ficam bloqueados até o módulo base ser ligado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {MODULE_GROUPS.map(({ title, description, icon: Icon, modules }) => (
          <section key={title} className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="rounded-lg border border-white/10 bg-slate-950/60 p-2">
                <Icon className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
                <p className="mt-0.5 text-xs text-slate-500">{description}</p>
              </div>
            </div>
            <div className="grid gap-3">
              {modules.map(({ key, description: moduleDescription }) => {
                const dependencyMessage = getModuleDependencyMessage(settings, key);
                const disabled = Boolean(dependencyMessage);

                return (
                  <ModuleSwitch
                    key={key}
                    label={MODULE_LABELS[key]}
                    description={
                      dependencyMessage
                        ? `${moduleDescription} ${dependencyMessage}`
                        : moduleDescription
                    }
                    enabled={isEnabled(key)}
                    disabled={disabled}
                    onChange={(value) => updateSetting(key, value)}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}

function ResetButton() {
  const { applyPreset } = useAdvancedMode();
  const [showConfirm, setShowConfirm] = useState(false);

  if (!showConfirm) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(true)}
        className="border-white/10 bg-slate-950/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Restaurar padrão
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="destructive"
        size="sm"
        onClick={() => {
          applyPreset('iniciante');
          setShowConfirm(false);
        }}
      >
        Confirmar
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowConfirm(false)}
        className="text-slate-400"
      >
        Cancelar
      </Button>
    </div>
  );
}

export function AdvancedModePanel() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-emerald-500/10 p-2.5">
          <Settings2 className="h-7 w-7 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Configurações Avançadas</h1>
          <p className="text-sm text-slate-400">
            Controle quais módulos inteligentes do AgroPlan ficam ativos.
          </p>
        </div>
      </div>

      <PresetSection />
      <CurrentModeSummary />
      <ModulesSection />

      <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
        <div className="text-sm leading-relaxed text-amber-100/80">
          <p className="mb-1 font-medium text-amber-200">Desligado significa desligado</p>
          <p>
            Módulos desativados deixam de exibir suas seções e, quando possível, deixam de enviar parâmetros que acionam clima, ZARC, preços ou mercado. Calendário e talhões seguem sempre ativos.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <ResetButton />
      </div>
    </div>
  );
}
