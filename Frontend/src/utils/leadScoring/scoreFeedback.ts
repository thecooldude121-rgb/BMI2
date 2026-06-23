import type { Lead } from '../../types/lead';

export type FeedbackType = 'accurate' | 'wrong_persona' | 'duplicate' | 'bad_data' | 'not_relevant';

export interface FeedbackMeta {
  label:      string;
  activeCls:  string;
}

export const FEEDBACK_META: Record<FeedbackType, FeedbackMeta> = {
  accurate:      { label: 'Score is accurate', activeCls: 'bg-green-500 text-white border-green-500'  },
  wrong_persona: { label: 'Wrong persona',      activeCls: 'bg-amber-500 text-white border-amber-500' },
  duplicate:     { label: 'Duplicate',          activeCls: 'bg-amber-500 text-white border-amber-500' },
  bad_data:      { label: 'Bad data',           activeCls: 'bg-red-500 text-white border-red-500'     },
  not_relevant:  { label: 'Not relevant',       activeCls: 'bg-gray-500 text-white border-gray-500'   },
};

export const FEEDBACK_BUTTONS: { type: FeedbackType; label: string }[] = [
  { type: 'accurate',      label: 'Accurate'       },
  { type: 'wrong_persona', label: 'Wrong Persona'  },
  { type: 'duplicate',     label: 'Duplicate'      },
  { type: 'bad_data',      label: 'Bad Data'       },
  { type: 'not_relevant',  label: 'Not Relevant'   },
];

export interface ScoreFeedback {
  leadId:       string;
  leadName:     string;
  overallScore: number;
  feedbackType: FeedbackType;
  note?:        string;
  submittedAt:  string;
  sessionId:    string;
}

// ── Storage keys ──────────────────────────────────────────────────────────────

const QUEUE_KEY = 'bmi_score_feedback';
const STATE_KEY = 'bmi_score_feedback_state';

// ── Session ID ────────────────────────────────────────────────────────────────

function getSessionId(): string {
  let id = sessionStorage.getItem('bmi_session_id');
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('bmi_session_id', id);
  }
  return id;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function getStateMap(): Record<string, FeedbackType> {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY) ?? '{}') as Record<string, FeedbackType>;
  } catch { return {}; }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Persists feedback to:
 *   - `bmi_score_feedback`       — append-only queue for backend analytics
 *   - `bmi_score_feedback_state` — per-lead map so reps see prior feedback across sessions
 *
 * If feedback already exists for this lead, the queue entry is replaced (not duplicated).
 * Call again with a `note` to attach additional context to the same submission.
 */
export function submitFeedback(lead: Lead, type: FeedbackType, note?: string): void {
  const entry: ScoreFeedback = {
    leadId:       lead.id,
    leadName:     [lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.email || lead.id,
    overallScore: lead.manual_score_override ?? lead.ai_score ?? lead.score ?? 0,
    feedbackType: type,
    note:         note?.trim() || undefined,
    submittedAt:  new Date().toISOString(),
    sessionId:    getSessionId(),
  };

  // Replace any prior entry for this lead
  const queue = getFeedbackQueue().filter(q => q.leadId !== lead.id);
  queue.push(entry);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

  // Update per-lead state map
  const state = getStateMap();
  state[lead.id] = type;
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

/** Returns the full feedback queue (all leads with pending feedback). */
export function getFeedbackQueue(): ScoreFeedback[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as ScoreFeedback[];
  } catch { return []; }
}

/** Clears the queue after a successful backend flush. */
export function clearFeedbackQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

/** Returns the feedback type the current user marked for a specific lead, or null. */
export function getFeedbackState(leadId: string): FeedbackType | null {
  return getStateMap()[leadId] ?? null;
}
