'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, RotateCcw, Settings2 } from 'lucide-react';
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
  isPriceDependentModule,
} from '@/lib/settings';
import type { AssistantLevel, BooleanSettingKey } from '@/lib/settings';

type ModuleDefinition = {
  key: BooleanSettingKey;
  description: string;
};

const MODULES: ModuleDefinition[] = [
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
      'Permite alternar entre lucro do sistema e lucro de mercado nos comparativos.',
  },
  {
    key: 'experimental_optimizer_enabled',
    description:
      'Usa o otimizador experimental com objetivo de lucro de mercado para explorar cenários.',
  },
  {
    key: 'replanning_enabled',
    description:
      'Permite registrar imprevistos e receber sugestões de ajuste no planejamento.',
  },
  {
    key: 'guided_explanations_enabled',
    description:
      'Mostra explicações mais detalhadas nas telas para orientar a tomada de decisão.',
  },
];

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
        enabled ? 'border-slate-700 bg-slate-900' : 'border-slate-800 bg-slate-950'
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
    <Card className="border-slate-700 bg-slate-900">
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
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
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

function ModulesSection() {
  const { updateSetting, isEnabled, isPricesEnabled } = useAdvancedMode();
  const pricesOn = isPricesEnabled();

  return (
    <Card className="border-slate-700 bg-slate-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-100">
          <Settings2 className="h-5 w-5 text-blue-500" />
          Módulos individuais
        </CardTitle>
        <CardDescription className="text-slate-400">
          Ajuste quais funcionalidades estão ativas. Recursos de mercado dependem de preços.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {MODULES.map(({ key, description }) => {
          const priceDependent = isPriceDependentModule(key);
          const disabled = priceDependent && !pricesOn;

          return (
            <ModuleSwitch
              key={key}
              label={MODULE_LABELS[key]}
              description={
                disabled
                  ? `${description} Ative "Preços agrícolas" para usar este módulo.`
                  : description
              }
              enabled={isEnabled(key)}
              disabled={disabled}
              onChange={(value) => updateSetting(key, value)}
            />
          );
        })}
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
        className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Resetar
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
  const { settings } = useAdvancedMode();
  const enabledCount = countEnabledModules(settings);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
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
      <ModulesSection />

      <div className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
        <div className="text-sm leading-relaxed text-slate-400">
          <p className="mb-1 font-medium text-slate-300">Desligado significa desligado</p>
          <p>
            Nas próximas etapas, módulos desativados também deixarão de enviar parâmetros que
            acionam clima, ZARC ou mercado quando isso for possível. Calendário e talhões seguem
            sempre ativos.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Perfil atual:{' '}
          <span className="font-medium text-slate-300">
            {ASSISTANT_LEVEL_LABELS[settings.assistant_level]}
          </span>{' '}
          - {enabledCount}/{Object.keys(MODULE_LABELS).length} módulos ativos
        </span>
        <ResetButton />
      </div>
    </div>
  );
}
