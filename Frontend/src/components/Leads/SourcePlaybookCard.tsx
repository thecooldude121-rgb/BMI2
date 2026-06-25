import React from 'react';
import {
  CheckCircle2, Circle, Lightbulb, TrendingUp, Sliders, Globe,
  Users, Zap, UserCheck, Linkedin, Mail,
} from 'lucide-react';
import type { Lead } from '../../types/lead';
import { getPlaybook, hasNonTrivialBias } from '../../utils/leadSourcePlaybook';

// ── Source icon mapping ────────────────────────────────────────────────────────

function SourceIcon({ source }: { source: string }) {
  const s = (source ?? '').toLowerCase();
  if (s === 'website')                        return <Globe      className="h-4 w-4" />;
  if (s === 'hrms' || s === 'recruitment')    return <Users      className="h-4 w-4" />;
  if (s === 'lead gen' || s === 'apollo')     return <Zap        className="h-4 w-4" />;
  if (s === 'referral' || s === 'manual')     return <UserCheck  className="h-4 w-4" />;
  if (s === 'linkedin')                       return <Linkedin   className="h-4 w-4" />;
  if (s === 'cold email')                     return <Mail       className="h-4 w-4" />;
  return <TrendingUp className="h-4 w-4" />;
}

// ── Required field labels ──────────────────────────────────────────────────────

const FIELD_LABELS: Partial<Record<keyof Lead, string>> = {
  email:        'Email address',
  phone:        'Phone number',
  company:      'Company name',
  position:     'Job title / position',
  department:   'Department',
  industry:     'Industry',
  company_size: 'Company size',
  linkedin_url: 'LinkedIn profile URL',
  source_detail:'Referrer / source detail',
  website:      'Company website',
};

function fieldMet(lead: Lead, key: keyof Lead): boolean {
  const v = lead[key];
  if (v == null) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (typeof v === 'number') return v > 0;
  return true;
}

// ── Weight bias display ────────────────────────────────────────────────────────

function biasLabel(dim: string, mult: number): string {
  const pct = Math.round(Math.abs(mult - 1.0) * 100);
  const dir  = mult > 1 ? '↑' : '↓';
  const name = dim === 'fit' ? 'Fit' : dim === 'intent' ? 'Intent' : dim === 'engagement' ? 'Engagement' : 'Confidence';
  return `${name} ${dir}${pct}%`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  lead: Lead;
}

export default function SourcePlaybookCard({ lead }: Props) {
  const playbook = getPlaybook(lead.source);
  const hasBias  = hasNonTrivialBias(playbook);

  const metCount  = playbook.requiredFields.filter(f => fieldMet(lead, f)).length;
  const totalReq  = playbook.requiredFields.length;
  const allMet    = metCount === totalReq;

  const biasChips = Object.entries(playbook.scoreWeightBias)
    .filter(([, v]) => v !== undefined && Math.abs((v as number) - 1.0) > 0.05)
    .map(([dim, v]) => biasLabel(dim, v as number));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
            <SourceIcon source={lead.source ?? ''} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900 leading-tight">{playbook.displayName} Playbook</p>
            <p className="text-[10px] text-gray-400 leading-tight">Source-specific workflow guidance</p>
          </div>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
          allMet ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {metCount}/{totalReq} fields
        </span>
      </div>

      {/* Required fields checklist */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Required Fields</p>
        <div className="space-y-1.5">
          {playbook.requiredFields.map(f => {
            const met = fieldMet(lead, f);
            return (
              <div key={String(f)} className="flex items-center gap-2">
                {met
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                  : <Circle       className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                }
                <span className={`text-xs ${met ? 'text-gray-600' : 'text-gray-400'}`}>
                  {FIELD_LABELS[f] ?? String(f)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Qualification hints */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Qualification Hints</p>
        <ul className="space-y-1.5">
          {playbook.qualificationHints.map((hint, i) => (
            <li key={i} className="flex items-start gap-2">
              <Lightbulb className="h-3 w-3 text-amber-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-gray-600 leading-relaxed">{hint}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Conversion expectation */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 flex items-start gap-2">
        <TrendingUp className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800 leading-relaxed">{playbook.conversionExpectation}</p>
      </div>

      {/* Score weight adjustment indicator */}
      {hasBias && (
        <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <Sliders className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] text-gray-500 font-medium mb-1">Source-adjusted score weights</p>
            <div className="flex flex-wrap gap-1">
              {biasChips.map((chip, i) => (
                <span key={i} className="text-[10px] bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
