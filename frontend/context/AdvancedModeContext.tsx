'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import type {
  AdvancedModeSettings,
  AssistantLevel,
  BooleanSettingKey,
} from '@/lib/settings';
import {
  DEFAULTS,
  applyDependencyRules,
  applyAssistantLevel,
  saveSettings,
  loadSettings,
  isModuleEnabled,
  isClimateEnabled as getClimateEnabled,
  isZarcEnabled as getZarcEnabled,
  isPricesEnabled as getPricesEnabled,
  isMarketEnabled as getMarketEnabled,
  canUseExperimentalOptimizer as getCanUseExperimentalOptimizer,
  canUseClimate as getCanUseClimate,
  canUseZarc as getCanUseZarc,
  canUsePrices as getCanUsePrices,
  canUsePriceNormalization as getCanUsePriceNormalization,
  canUseMarketValidation as getCanUseMarketValidation,
  canUseMarketComparison as getCanUseMarketComparison,
  canUseReplanning as getCanUseReplanning,
  canShowGuidedExplanations as getCanShowGuidedExplanations,
  canUseGuidedMode as getCanUseGuidedMode,
} from '@/lib/settings';

// ---------------------------------------------------------------------------
// Tipo do contexto
// ---------------------------------------------------------------------------

interface AdvancedModeContextValue {
  settings: AdvancedModeSettings;
  applyPreset: (level: AssistantLevel) => void;
  updateSetting: (key: BooleanSettingKey, value: boolean) => void;
  isModuleEnabled: (module: BooleanSettingKey) => boolean;
  isEnabled: (module: BooleanSettingKey) => boolean;
  isClimateEnabled: () => boolean;
  isZarcEnabled: () => boolean;
  isPricesEnabled: () => boolean;
  isMarketEnabled: () => boolean;
  canUseExperimentalOptimizer: () => boolean;
  canUseClimate: () => boolean;
  canUseZarc: () => boolean;
  canUsePrices: () => boolean;
  canUsePriceNormalization: () => boolean;
  canUseMarketValidation: () => boolean;
  canUseMarketComparison: () => boolean;
  canUseReplanning: () => boolean;
  canShowGuidedExplanations: () => boolean;
  canUseGuidedMode: () => boolean;
}

const AdvancedModeContext = createContext<AdvancedModeContextValue | null>(null);

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type Action =
  | { type: 'LOAD'; settings: AdvancedModeSettings }
  | { type: 'SET_PRESET'; level: AssistantLevel }
  | { type: 'UPDATE'; key: BooleanSettingKey; value: boolean }
  | { type: 'RESET' };

function reducer(
  state: AdvancedModeSettings,
  action: Action,
): AdvancedModeSettings {
  switch (action.type) {
    case 'LOAD':
      return action.settings;
    case 'SET_PRESET':
      return applyAssistantLevel(state, action.level);
    case 'UPDATE':
      return applyDependencyRules(state, action.key, action.value);
    case 'RESET':
      return DEFAULTS;
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AdvancedModeProviderProps {
  children: ReactNode;
}

export function AdvancedModeProvider({ children }: AdvancedModeProviderProps) {
  const [settings, dispatch] = useReducer(reducer, DEFAULTS);
  const hasLoadedRef = useRef(false);
  const skipInitialSaveRef = useRef(true);

  // Carrega do localStorage na montagem
  useEffect(() => {
    const saved = loadSettings();
    hasLoadedRef.current = true;
    dispatch({ type: 'LOAD', settings: saved });
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    if (skipInitialSaveRef.current) {
      skipInitialSaveRef.current = false;
      return;
    }

    saveSettings(settings);
  }, [settings]);

  const applyPreset = (level: AssistantLevel) => {
    dispatch({ type: 'SET_PRESET', level });
  };

  const updateSetting = (key: BooleanSettingKey, value: boolean) => {
    dispatch({ type: 'UPDATE', key, value });
  };

  const isEnabled = (module: BooleanSettingKey) => isModuleEnabled(settings, module);

  const isClimateEnabled = () => getClimateEnabled(settings);
  const isZarcEnabled = () => getZarcEnabled(settings);
  const isPricesEnabled = () => getPricesEnabled(settings);
  const isMarketEnabled = () => getMarketEnabled(settings);
  const canUseExperimentalOptimizer = () => getCanUseExperimentalOptimizer(settings);
  const canUseClimate = () => getCanUseClimate(settings);
  const canUseZarc = () => getCanUseZarc(settings);
  const canUsePrices = () => getCanUsePrices(settings);
  const canUsePriceNormalization = () => getCanUsePriceNormalization(settings);
  const canUseMarketValidation = () => getCanUseMarketValidation(settings);
  const canUseMarketComparison = () => getCanUseMarketComparison(settings);
  const canUseReplanning = () => getCanUseReplanning(settings);
  const canShowGuidedExplanations = () => getCanShowGuidedExplanations(settings);
  const canUseGuidedMode = () => getCanUseGuidedMode();

  const value: AdvancedModeContextValue = {
    settings,
    applyPreset,
    updateSetting,
    isModuleEnabled: isEnabled,
    isEnabled,
    isClimateEnabled,
    isZarcEnabled,
    isPricesEnabled,
    isMarketEnabled,
    canUseExperimentalOptimizer,
    canUseClimate,
    canUseZarc,
    canUsePrices,
    canUsePriceNormalization,
    canUseMarketValidation,
    canUseMarketComparison,
    canUseReplanning,
    canShowGuidedExplanations,
    canUseGuidedMode,
  };

  return (
    <AdvancedModeContext.Provider value={value}>
      {children}
    </AdvancedModeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAdvancedMode(): AdvancedModeContextValue {
  const ctx = useContext(AdvancedModeContext);
  if (!ctx) {
    throw new Error('useAdvancedMode must be used within AdvancedModeProvider');
  }
  return ctx;
}
