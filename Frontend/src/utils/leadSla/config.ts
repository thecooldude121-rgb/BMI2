const STORAGE_KEY = 'bmi_sla_config';

export interface SLAConfig {
  firstResponse: {
    thresholds: Record<string, number>; // source → hours
    defaultHours: number;
    atRiskPct: number; // 0–1 — fraction of limit at which at_risk kicks in
  };
  followUp: {
    graceHours: number; // breach only after this many hours past due date
  };
  stale: {
    atRiskDays: number;
    breachDays: number;
    activeStatuses: string[];
  };
  escalation: {
    multiplier: number; // breach × multiplier → escalate flag
  };
}

export const DEFAULT_SLA_CONFIG: SLAConfig = {
  firstResponse: {
    thresholds: { Website: 4 },
    defaultHours: 24,
    atRiskPct: 0.75,
  },
  followUp: {
    graceHours: 2,
  },
  stale: {
    atRiskDays: 21,
    breachDays: 30,
    activeStatuses: ['new', 'assigned', 'enriching', 'attempting_contact', 'engaged', 'nurture'],
  },
  escalation: {
    multiplier: 2.0,
  },
};

export function getSLAConfig(): SLAConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SLAConfig>;
      return {
        firstResponse: { ...DEFAULT_SLA_CONFIG.firstResponse, ...parsed.firstResponse },
        followUp:      { ...DEFAULT_SLA_CONFIG.followUp,      ...parsed.followUp },
        stale:         { ...DEFAULT_SLA_CONFIG.stale,         ...parsed.stale },
        escalation:    { ...DEFAULT_SLA_CONFIG.escalation,    ...parsed.escalation },
      };
    }
  } catch { /* ignore */ }
  return DEFAULT_SLA_CONFIG;
}

export function saveSLAConfig(c: SLAConfig): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch { /* ignore */ }
}

export function resetSLAConfig(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
