import { useState, useEffect, useCallback } from 'react';
import {
  StalledConfig,
  DEFAULT_STALLED_CONFIG,
  StalledDealInput,
  isDealStalled,
  stalledReasons,
} from '../utils/stalledDeal';

const STORAGE_KEY = 'bmi_crm:stalledConfig';

function loadConfig(): StalledConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STALLED_CONFIG;
    const parsed = JSON.parse(raw) as Partial<StalledConfig>;
    return {
      ...DEFAULT_STALLED_CONFIG,
      ...parsed,
      criteria: {
        ...DEFAULT_STALLED_CONFIG.criteria,
        ...(parsed.criteria ?? {}),
      },
    };
  } catch {
    return DEFAULT_STALLED_CONFIG;
  }
}

export function useStalledConfig() {
  const [config, setConfigState] = useState<StalledConfig>(loadConfig);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const setConfig = useCallback(
    (updater: StalledConfig | ((prev: StalledConfig) => StalledConfig)) => {
      setConfigState(updater);
    },
    [],
  );

  const resetConfig = useCallback(() => {
    setConfigState(DEFAULT_STALLED_CONFIG);
  }, []);

  const isStalled = useCallback(
    (deal: StalledDealInput) => isDealStalled(deal, config),
    [config],
  );

  const getReasons = useCallback(
    (deal: StalledDealInput) => stalledReasons(deal, config),
    [config],
  );

  return { config, setConfig, resetConfig, isStalled, getReasons };
}
