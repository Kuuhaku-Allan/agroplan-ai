export type AssistantLevel = "iniciante" | "intermediario" | "avancado" | "manual";

export interface AdvancedModeSettings {
  climate_enabled: boolean;
  zarc_enabled: boolean;
  prices_enabled: boolean;
  normalization_enabled: boolean;
  market_validation_enabled: boolean;
  market_comparison_enabled: boolean;
  experimental_optimizer_enabled: boolean;
  replanning_enabled: boolean;
  guided_explanations_enabled: boolean;
  assistant_level: AssistantLevel;
}

export type BooleanSettingKey = Exclude<keyof AdvancedModeSettings, "assistant_level">;

export type LocationFields = Partial<{
  lat: unknown;
  lon: unknown;
  latitude: unknown;
  longitude: unknown;
  days: unknown;
  uf: unknown;
  municipio: unknown;
  safra: unknown;
}>;

export type CalendarPayloadWithClimate = {
  usar_clima?: boolean;
};

export const STORAGE_KEY = "agroplan_advanced_settings";

export const PRICE_DEPENDENT_MODULES = [
  "normalization_enabled",
  "market_validation_enabled",
  "market_comparison_enabled",
  "experimental_optimizer_enabled",
] as const satisfies readonly BooleanSettingKey[];

export const DEFAULTS: AdvancedModeSettings = {
  climate_enabled: true,
  zarc_enabled: true,
  prices_enabled: true,
  normalization_enabled: true,
  market_validation_enabled: true,
  market_comparison_enabled: true,
  experimental_optimizer_enabled: false,
  replanning_enabled: true,
  guided_explanations_enabled: true,
  assistant_level: "iniciante",
};

export const PRESETS: Record<AssistantLevel, AdvancedModeSettings> = {
  iniciante: {
    ...DEFAULTS,
    assistant_level: "iniciante",
    guided_explanations_enabled: true,
    experimental_optimizer_enabled: false,
  },
  intermediario: {
    climate_enabled: true,
    zarc_enabled: true,
    prices_enabled: true,
    normalization_enabled: true,
    market_validation_enabled: true,
    market_comparison_enabled: false,
    experimental_optimizer_enabled: false,
    replanning_enabled: true,
    guided_explanations_enabled: false,
    assistant_level: "intermediario",
  },
  avancado: {
    climate_enabled: true,
    zarc_enabled: true,
    prices_enabled: true,
    normalization_enabled: true,
    market_validation_enabled: true,
    market_comparison_enabled: true,
    experimental_optimizer_enabled: false,
    replanning_enabled: true,
    guided_explanations_enabled: false,
    assistant_level: "avancado",
  },
  manual: {
    climate_enabled: false,
    zarc_enabled: false,
    prices_enabled: false,
    normalization_enabled: false,
    market_validation_enabled: false,
    market_comparison_enabled: false,
    experimental_optimizer_enabled: false,
    replanning_enabled: false,
    guided_explanations_enabled: false,
    assistant_level: "manual",
  },
};

export const MODULE_LABELS: Record<BooleanSettingKey, string> = {
  climate_enabled: "Clima integrado",
  zarc_enabled: "ZARC",
  prices_enabled: "Preços agrícolas",
  normalization_enabled: "Normalização de preços",
  market_validation_enabled: "Validação de lucro de mercado",
  market_comparison_enabled: "Comparação de mercado",
  experimental_optimizer_enabled: "Otimização experimental",
  replanning_enabled: "Replanejamento por imprevistos",
  guided_explanations_enabled: "Explicações guiadas / assistente",
};

export const ASSISTANT_LEVEL_LABELS: Record<AssistantLevel, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
  manual: "Manual",
};

export const ASSISTANT_LEVEL_DESCRIPTIONS: Record<AssistantLevel, string> = {
  iniciante: "Mais orientação e recursos principais ligados.",
  intermediario: "Menos textos e foco em planejamento com mercado essencial.",
  avancado: "Mantém suas escolhas atuais e libera ajuste manual fino.",
  manual: "Calendário e talhões, sem assistências extras por padrão.",
};

export function isPriceDependentModule(module: BooleanSettingKey): boolean {
  return PRICE_DEPENDENT_MODULES.includes(
    module as (typeof PRICE_DEPENDENT_MODULES)[number],
  );
}

export function isModuleEnabled(
  settings: AdvancedModeSettings,
  module: BooleanSettingKey,
): boolean {
  if (!settings[module]) return false;
  if (isPriceDependentModule(module) && !settings.prices_enabled) return false;
  return true;
}

export function isClimateEnabled(settings: AdvancedModeSettings): boolean {
  return isModuleEnabled(settings, "climate_enabled");
}

export function isZarcEnabled(settings: AdvancedModeSettings): boolean {
  return isModuleEnabled(settings, "zarc_enabled");
}

export function isPricesEnabled(settings: AdvancedModeSettings): boolean {
  return isModuleEnabled(settings, "prices_enabled");
}

export function isMarketEnabled(settings: AdvancedModeSettings): boolean {
  return (
    isPricesEnabled(settings) &&
    (isModuleEnabled(settings, "market_validation_enabled") ||
      isModuleEnabled(settings, "market_comparison_enabled"))
  );
}

export function canUseExperimentalOptimizer(settings: AdvancedModeSettings): boolean {
  return isModuleEnabled(settings, "experimental_optimizer_enabled");
}

export function canUseClimate(settings: AdvancedModeSettings): boolean {
  return isModuleEnabled(settings, "climate_enabled");
}

export function canUseZarc(settings: AdvancedModeSettings): boolean {
  return isModuleEnabled(settings, "zarc_enabled");
}

export function canUsePrices(settings: AdvancedModeSettings): boolean {
  return isModuleEnabled(settings, "prices_enabled");
}

export function canUseMarketValidation(settings: AdvancedModeSettings): boolean {
  return isModuleEnabled(settings, "market_validation_enabled");
}

export function canUseReplanning(settings: AdvancedModeSettings): boolean {
  return isModuleEnabled(settings, "replanning_enabled");
}

export function canShowGuidedExplanations(settings: AdvancedModeSettings): boolean {
  return isModuleEnabled(settings, "guided_explanations_enabled");
}

export function canUseGuidedMode(): boolean {
  return true;
}

export function countEnabledModules(settings: AdvancedModeSettings): number {
  return (Object.keys(MODULE_LABELS) as BooleanSettingKey[]).filter((module) =>
    isModuleEnabled(settings, module),
  ).length;
}

export function applyAssistantLevel(
  settings: AdvancedModeSettings,
  level: AssistantLevel,
): AdvancedModeSettings {
  if (level === "avancado") {
    return sanitizeSettings({
      ...settings,
      assistant_level: "avancado",
      guided_explanations_enabled: false,
    });
  }

  return sanitizeSettings(PRESETS[level]);
}

export function applyDependencyRules(
  settings: AdvancedModeSettings,
  key: BooleanSettingKey,
  value: boolean,
): AdvancedModeSettings {
  if (isPriceDependentModule(key) && value && !settings.prices_enabled) {
    return settings;
  }

  const next = {
    ...settings,
    [key]: value,
    assistant_level: "avancado" as const,
  };

  return sanitizeSettings(next);
}

export function sanitizeSettings(settings: AdvancedModeSettings): AdvancedModeSettings {
  if (settings.prices_enabled) return settings;

  return {
    ...settings,
    normalization_enabled: false,
    market_validation_enabled: false,
    market_comparison_enabled: false,
    experimental_optimizer_enabled: false,
  };
}

export function buildLocationForEnabledModules<T extends LocationFields>(
  location: T,
  settings: AdvancedModeSettings,
): Partial<T> {
  const next: Partial<T> & LocationFields = { ...location };

  if (!isClimateEnabled(settings)) {
    delete next.lat;
    delete next.lon;
    delete next.latitude;
    delete next.longitude;
    delete next.days;
  }

  if (!isZarcEnabled(settings)) {
    delete next.uf;
    delete next.municipio;
    delete next.safra;
  }

  return next;
}

export function buildMarketLocationForEnabledModules<T extends LocationFields>(
  location: T,
  settings: AdvancedModeSettings,
): Partial<T> {
  const next: Partial<T> & LocationFields = buildLocationForEnabledModules(location, settings);

  if (!isPricesEnabled(settings)) {
    delete next.uf;
  }

  return next;
}

export function buildCalendarPayloadWithSettings<T extends CalendarPayloadWithClimate>(
  payload: T,
  settings: AdvancedModeSettings,
): T {
  return {
    ...payload,
    usar_clima: canUseClimate(settings) ? Boolean(payload.usar_clima) : false,
  };
}

export function loadSettings(): AdvancedModeSettings {
  if (typeof window === "undefined") return DEFAULTS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;

    const parsed = JSON.parse(raw) as Partial<AdvancedModeSettings>;
    return sanitizeSettings({ ...DEFAULTS, ...parsed });
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(settings: AdvancedModeSettings): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeSettings(settings)));
  } catch {
    // Preferimos degradar silenciosamente quando localStorage está indisponível.
  }
}
