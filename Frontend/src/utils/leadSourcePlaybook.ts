// Central source-playbook config. Zero React imports.
// Each entry drives: SLA thresholds, NBA first actions, MFS weight bias,
// conversion wizard path, required fields, and qualification guidance.

import type { Lead } from '../types/lead';
import type { ActionId } from './leadActions';
import type { WizardPath } from '../components/Leads/LeadConversionWizard';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MFSWeights {
  fit:        number;
  intent:     number;
  engagement: number;
  confidence: number;
}

export interface SourcePlaybook {
  /** Display name shown in the UI */
  displayName:          string;
  /** Raw source string values that map to this playbook */
  sourceKeys:           string[];
  /** Fields that should be filled before the first outreach attempt */
  requiredFields:       (keyof Lead)[];
  /** Ordered preferred CTAs for new, un-contacted leads (NBA step 7) */
  firstActions:         [ActionId, ...ActionId[]];
  /** First-response SLA window in hours; fed into SLA config */
  slaFirstResponseHours: number;
  /** Bullet-point guidance shown in the detail page */
  qualificationHints:   string[];
  /** Multipliers applied on top of base MFS weights (1.0 = no change) */
  scoreWeightBias:      Partial<MFSWeights>;
  /** Default wizard conversion path for this source */
  conversionPath:       WizardPath;
  /** One-sentence expectation shown in the playbook card */
  conversionExpectation: string;
  /** When true, deal-related wizard paths are hidden entirely */
  noDealPath?:          boolean;
}

// ── Playbook definitions ──────────────────────────────────────────────────────

const WEBSITE: SourcePlaybook = {
  displayName:           'Website',
  sourceKeys:            ['Website'],
  requiredFields:        ['email', 'company', 'position'],
  firstActions:          ['send_first_outreach'],
  slaFirstResponseHours: 4,
  qualificationHints: [
    'Verify intent signals — check which pages they visited',
    'Confirm role matches ICP persona before investing further',
    'Ask about timeline and budget on the first call',
  ],
  scoreWeightBias:       { engagement: 1.2 },
  conversionPath:        'contact_account',
  conversionExpectation: 'Website leads typically convert to contact + account within 2 touchpoints. Speed of first response is the biggest conversion driver.',
};

const HRMS: SourcePlaybook = {
  displayName:           'HRMS / Recruitment',
  sourceKeys:            ['HRMS', 'Recruitment'],
  requiredFields:        ['email', 'phone', 'position', 'department'],
  firstActions:          ['book_discovery'],
  slaFirstResponseHours: 8,
  qualificationHints: [
    'Confirm current employment status before any outreach',
    'Identify the department and reporting line',
    'Check if the lead came in via an active job posting',
  ],
  scoreWeightBias:       { fit: 1.2, intent: 0.8 },
  conversionPath:        'contact',
  noDealPath:            true,
  conversionExpectation: 'HRMS leads convert to contacts only. Deal creation is handled separately through the HR pipeline.',
};

const LEAD_GEN: SourcePlaybook = {
  displayName:           'Lead Gen / Apollo',
  sourceKeys:            ['Lead Gen', 'Apollo', 'Lead Generation'],
  requiredFields:        ['email', 'company', 'industry', 'company_size'],
  firstActions:          ['send_first_outreach'],
  slaFirstResponseHours: 12,
  qualificationHints: [
    'Verify contact accuracy — Apollo data can be outdated',
    'Enrich with company news before outreach to personalise',
    'Check for prior engagement via other channels first',
  ],
  scoreWeightBias:       { intent: 1.2, confidence: 0.9 },
  conversionPath:        'contact_account',
  conversionExpectation: 'Lead Gen leads have moderate close rates. Validate intent early before committing significant outreach effort.',
};

const REFERRAL: SourcePlaybook = {
  displayName:           'Referral / Manual',
  sourceKeys:            ['Referral', 'Manual'],
  requiredFields:        ['phone', 'company', 'source_detail'],
  firstActions:          ['book_discovery'],
  slaFirstResponseHours: 24,
  qualificationHints: [
    'Acknowledge the referrer by name on first contact',
    'Understand whether it was a warm intro or a casual mention',
    'Prioritise quickly — referred leads expect a fast, personal response',
  ],
  scoreWeightBias:       { fit: 1.3, engagement: 0.9 },
  conversionPath:        'contact_account',
  conversionExpectation: 'Referral leads have the highest close rate. Expect shorter cycles — the relationship is already warm.',
};

const LINKEDIN: SourcePlaybook = {
  displayName:           'LinkedIn',
  sourceKeys:            ['LinkedIn'],
  requiredFields:        ['linkedin_url', 'company', 'position'],
  firstActions:          ['send_first_outreach'],
  slaFirstResponseHours: 8,
  qualificationHints: [
    'Review shared connections before sending a connection request',
    'Reference their recent LinkedIn activity in the opening message',
    'Confirm current role — LinkedIn profiles often lag reality',
  ],
  scoreWeightBias:       { fit: 1.1 },
  conversionPath:        'contact_account',
  conversionExpectation: 'LinkedIn leads are professionally positioned. Engagement tends to be methodical — plan 3–5 touchpoints.',
};

const COLD_EMAIL: SourcePlaybook = {
  displayName:           'Cold Email',
  sourceKeys:            ['Cold Email'],
  requiredFields:        ['email', 'company'],
  firstActions:          ['follow_up'],
  slaFirstResponseHours: 24,
  qualificationHints: [
    'This lead did not opt in — lead with value, not a pitch',
    'Personalise heavily to reduce spam classification risk',
    'Qualify interest before pushing for discovery calls',
  ],
  scoreWeightBias:       { intent: 0.8 },
  conversionPath:        'contact',
  conversionExpectation: 'Cold Email leads require multiple touchpoints and strong personalisation. Qualify intent early.',
};

// ── Default fallback ──────────────────────────────────────────────────────────

const DEFAULT_PLAYBOOK: SourcePlaybook = {
  displayName:           'Other',
  sourceKeys:            [],
  requiredFields:        ['email', 'company'],
  firstActions:          ['send_first_outreach'],
  slaFirstResponseHours: 24,
  qualificationHints: [
    'Verify contact information is complete',
    'Identify company size and industry before outreach',
    'Confirm the lead fits the ICP before investing heavily',
  ],
  scoreWeightBias:       {},
  conversionPath:        'contact',
  conversionExpectation: 'Follow the standard qualification process before converting.',
};

// ── Public exports ────────────────────────────────────────────────────────────

export const PLAYBOOKS: SourcePlaybook[] = [
  WEBSITE,
  HRMS,
  LEAD_GEN,
  REFERRAL,
  LINKEDIN,
  COLD_EMAIL,
];

/** Returns the playbook for a source string, falling back to DEFAULT_PLAYBOOK. */
export function getPlaybook(source: string | undefined): SourcePlaybook {
  if (!source) return DEFAULT_PLAYBOOK;
  const normalised = source.trim();
  return (
    PLAYBOOKS.find(p =>
      p.sourceKeys.some(k => k.toLowerCase() === normalised.toLowerCase()),
    ) ?? DEFAULT_PLAYBOOK
  );
}

/**
 * Returns a Record<sourceName, hours> for all defined playbooks.
 * Used to seed DEFAULT_SLA_CONFIG.firstResponse.thresholds dynamically.
 */
export function buildSLAThresholds(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of PLAYBOOKS) {
    for (const key of p.sourceKeys) {
      out[key] = p.slaFirstResponseHours;
    }
  }
  return out;
}

/**
 * Returns true when the playbook has meaningful (non-trivial) weight bias.
 * Used to decide whether to show the "source-adjusted weights" indicator.
 */
export function hasNonTrivialBias(playbook: SourcePlaybook): boolean {
  return Object.values(playbook.scoreWeightBias).some(v => v !== undefined && Math.abs(v - 1.0) > 0.05);
}
