/**
 * THE QUALIFICATION GATE, server-side. Step 5 slice A, ratified 2026-10-03.
 *
 * Until now this lived only in Frontend/src/components/Leads/KanbanQualifyModal,
 * and the "override" sent exactly the same PUT as a normal move — so the rule
 * that only a manager or admin may qualify a lead that fails it was a hidden
 * button, not a control. The criteria are the three the modal already used
 * (Venkat: "keep today's three"); the score >= 40 check stays advisory there and
 * is deliberately NOT enforced here.
 *
 * Pure on purpose: every criterion is a claim about a lead, so each one is
 * unit-tested and each failure names itself, which is what lets a 409 say
 * exactly what is missing rather than "lead not qualified".
 */

/** The stages that make up the "qualifying" lane. Entering this set is gated. */
export const QUALIFIED_STAGES: readonly string[] = ['qualified', 'sales_accepted'];

/** An override may only land on 'qualified' — see migration 058's CHECK. */
export const OVERRIDE_TARGET = 'qualified';

export type CriterionId = 'contact_method' | 'company' | 'last_contact';

export interface Criterion {
  id: CriterionId;
  label: string;
  met: boolean;
}

export interface QualifiableLead {
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  last_contact?: string | Date | null;
}

const present = (v: unknown): boolean =>
  v !== null && v !== undefined && String(v).trim() !== '';

export function evaluateQualification(lead: QualifiableLead): Criterion[] {
  return [
    { id: 'contact_method', label: 'Has an email or phone number', met: present(lead.email) || present(lead.phone) },
    { id: 'company',        label: 'Has a company',                met: present(lead.company) },
    { id: 'last_contact',   label: 'Has a recorded last contact',  met: present(lead.last_contact) },
  ];
}

export const unmetCriteria = (lead: QualifiableLead): Criterion[] =>
  evaluateQualification(lead).filter(c => !c.met);

/**
 * Is this move gated? Only ENTERING the qualifying lane from outside it.
 * Moving qualified -> sales_accepted is already past the gate.
 */
export const isGatedMove = (fromStage: string | null, toStage: string): boolean =>
  QUALIFIED_STAGES.includes(toStage) && !QUALIFIED_STAGES.includes(fromStage ?? '');
