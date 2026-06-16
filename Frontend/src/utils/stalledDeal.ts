export interface StalledDealInput {
  stage?: string;
  daysSinceContact?: number;
  lastActivity?: string;
  nextStep?: string;
  closeDate?: string;
  createdAt?: string;
}

export interface StalledConfig {
  enabled: boolean;
  criteria: {
    noActivity:   { enabled: boolean; threshold: number };
    noNextStep:   { enabled: boolean };
    closeOverdue: { enabled: boolean };
    dealAge:      { enabled: boolean; threshold: number };
  };
}

export const DEFAULT_STALLED_CONFIG: StalledConfig = {
  enabled: true,
  criteria: {
    noActivity:   { enabled: true,  threshold: 5 },
    noNextStep:   { enabled: false },
    closeOverdue: { enabled: false },
    dealAge:      { enabled: false, threshold: 30 },
  },
};

function isClosedDeal(deal: StalledDealInput): boolean {
  return deal.stage?.toLowerCase().includes('closed') ?? false;
}

function activityDays(deal: StalledDealInput): number | null {
  if (deal.daysSinceContact !== undefined) return deal.daysSinceContact;
  if (deal.lastActivity) {
    return Math.floor((Date.now() - new Date(deal.lastActivity).getTime()) / 86_400_000);
  }
  return null;
}

export function isDealStalled(deal: StalledDealInput, config: StalledConfig): boolean {
  if (!config.enabled || isClosedDeal(deal)) return false;
  const c = config.criteria;

  if (c.noActivity.enabled) {
    const days = activityDays(deal);
    if (days !== null && days >= c.noActivity.threshold) return true;
  }

  if (c.noNextStep.enabled && !deal.nextStep?.trim()) return true;

  if (c.closeOverdue.enabled && deal.closeDate && new Date(deal.closeDate) < new Date()) return true;

  if (c.dealAge.enabled && deal.createdAt) {
    const age = Math.floor((Date.now() - new Date(deal.createdAt).getTime()) / 86_400_000);
    if (age >= c.dealAge.threshold) return true;
  }

  return false;
}

export function stalledReasons(deal: StalledDealInput, config: StalledConfig): string[] {
  if (!config.enabled || isClosedDeal(deal)) return [];
  const reasons: string[] = [];
  const c = config.criteria;

  if (c.noActivity.enabled) {
    const days = activityDays(deal);
    if (days !== null && days >= c.noActivity.threshold) {
      reasons.push(`No activity in ${days}d`);
    }
  }
  if (c.noNextStep.enabled && !deal.nextStep?.trim()) {
    reasons.push('No next step set');
  }
  if (c.closeOverdue.enabled && deal.closeDate && new Date(deal.closeDate) < new Date()) {
    reasons.push('Close date passed');
  }
  if (c.dealAge.enabled && deal.createdAt) {
    const age = Math.floor((Date.now() - new Date(deal.createdAt).getTime()) / 86_400_000);
    if (age >= c.dealAge.threshold) {
      reasons.push(`Deal age ${age}d`);
    }
  }
  return reasons;
}
