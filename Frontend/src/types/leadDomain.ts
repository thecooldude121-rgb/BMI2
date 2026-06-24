// ─────────────────────────────────────────────────────────────────────────────
// leadDomain.ts — Presentation-layer domain model for Leads.
//
// This is the camelCase, UI-facing type. It coexists with the data-layer
// Lead type in types/lead.ts (snake_case, DB-aligned). Components that need
// rich scoring, lifecycle, or consent fields use LeadDomain. Components that
// talk to the API layer continue to use Lead unchanged.
//
// Adapter: src/utils/leadAdapters.ts → toLeadDomain(lead: Lead): LeadDomain
// ─────────────────────────────────────────────────────────────────────────────

import type { LeadLifecycleStage } from './lead';

// ── Typed string unions ───────────────────────────────────────────────────────

// Domain model status mirrors the full 12-state lifecycle.
// Previously a collapsed 4-state model — now a direct alias.
/** @deprecated Use LeadLifecycleStage from types/lead */
export type LeadStatus = LeadLifecycleStage;
export type { LeadLifecycleStage };

export type LeadSource = 'Lead Gen' | 'HRMS' | 'Manual' | 'Website';

export type LeadPriority = 'low' | 'medium' | 'high' | 'critical';

export type EnrichmentStatus = 'pending' | 'enriched' | 'failed' | 'not_required';

export type ConsentStatus = 'full' | 'email_only' | 'call_only' | 'none';

// Higher-order CRM lifecycle that sits above operational status.
// Derived from status in the adapter — no DB column yet.
export type LifecycleStage =
  | 'subscriber'
  | 'lead'
  | 'mql'
  | 'sql'
  | 'opportunity'
  | 'customer';

export type NextActionType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'follow_up'
  | 'demo'
  | 'proposal'
  | 'none';

export interface QualificationChecklistItem {
  criterion: string;
  passed: boolean;
  note?: string;
}

// ── LeadDomain ────────────────────────────────────────────────────────────────

export interface LeadDomain {
  // ── Identity ────────────────────────────────────────────────────────────────
  id: string;
  fullName: string;               // first_name + ' ' + last_name
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;                  // maps from Lead.position
  company: string;
  website: string;
  linkedinUrl: string;
  avatarInitials: string;         // first letter of firstName + first letter of lastName, uppercased

  // ── Pipeline ─────────────────────────────────────────────────────────────────
  status: LeadStatus;
  lifecycleStage: LifecycleStage; // derived from status (subscriber→lead→mql→sql→opportunity→customer)
  source: LeadSource;
  sourceType: string;             // human-readable label for source
  priority: LeadPriority;         // derived from overallScore
  ownerId: string;
  ownerName: string;              // 'Unassigned' until owner resolution is implemented
  territory: string;              // '' until territory assignment is implemented

  // ── AI Scoring (all derived from the single `score` integer in the DB) ──────
  overallScore: number;           // passthrough of Lead.score
  fitScore: number;               // Math.round(score * 0.35)
  intentScore: number;            // Math.round(score * 0.30)
  engagementScore: number;        // Math.round(score * 0.20)
  confidenceScore: number;        // Math.round(score * 0.15)
  scoreReason: string;            // generated summary string
  scoreDriversPositive: string[]; // derived from score band
  scoreDriversNegative: string[]; // derived from score band
  conversionReadiness: 'low' | 'medium' | 'high';
  duplicateRisk: 'low' | 'medium' | 'high'; // 'low' default until detection engine runs

  // ── Qualification ─────────────────────────────────────────────────────────────
  qualificationChecklist: QualificationChecklistItem[];

  // ── AI Enrichment ─────────────────────────────────────────────────────────────
  aiSummary: string;              // generated from available lead fields
  enrichmentStatus: EnrichmentStatus;

  // ── Consent ───────────────────────────────────────────────────────────────────
  consentStatus: ConsentStatus;   // derived from email_opt_in + call_opt_in
  emailOptIn: boolean;
  callOptIn: boolean;

  // ── Timestamps ────────────────────────────────────────────────────────────────
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt: Date | null;
  nextActionType: NextActionType; // derived from status
  nextActionDue: Date | null;     // null until scheduling engine is implemented
}
