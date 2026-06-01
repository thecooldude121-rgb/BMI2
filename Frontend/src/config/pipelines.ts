// ─── Pipeline Configuration ───────────────────────────────────────────────────
// Single source of truth for all pipelines and their stages.
//
// To add a new pipeline: append one entry to PIPELINES below.
// To add a stage to a pipeline: append to that pipeline's stages array.
//
// In a multi-tenant setup, PIPELINES would be fetched from
// GET /api/v1/pipelines and merged with this file as the fallback.
// The shape of PipelineStage maps directly to the DB pipeline_stages table.

export interface PipelineStage {
  id: string;
  name: string;
  probability: number; // base win-probability % for this stage
  color: string;       // Tailwind color key used by the stage bar
  isWon: boolean;
  isLost: boolean;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  stages: PipelineStage[];
}

export const PIPELINES: Pipeline[] = [
  {
    id: 'new-business',
    name: 'New Business',
    description: 'Standard pipeline for new customer acquisition',
    isDefault: true,
    stages: [
      { id: 'prospecting',  name: 'Prospecting',  probability: 20,  color: 'gray',   isWon: false, isLost: false },
      { id: 'qualified',    name: 'Qualified',    probability: 40,  color: 'blue',   isWon: false, isLost: false },
      { id: 'proposal',     name: 'Proposal',     probability: 60,  color: 'amber',  isWon: false, isLost: false },
      { id: 'negotiation',  name: 'Negotiation',  probability: 80,  color: 'purple', isWon: false, isLost: false },
      { id: 'closed-won',   name: 'Closed Won',   probability: 100, color: 'green',  isWon: true,  isLost: false },
      { id: 'closed-lost',  name: 'Closed Lost',  probability: 0,   color: 'red',    isWon: false, isLost: true  },
    ],
  },
  {
    id: 'renewals',
    name: 'Renewals',
    description: 'Pipeline for contract renewals and re-engagement',
    stages: [
      { id: 'renewal-review',       name: 'Under Review',  probability: 60,  color: 'blue',   isWon: false, isLost: false },
      { id: 'renewal-quoted',       name: 'Quoted',        probability: 75,  color: 'amber',  isWon: false, isLost: false },
      { id: 'renewal-negotiation',  name: 'Negotiating',   probability: 85,  color: 'purple', isWon: false, isLost: false },
      { id: 'renewal-won',          name: 'Renewed',       probability: 100, color: 'green',  isWon: true,  isLost: false },
      { id: 'renewal-lost',         name: 'Churned',       probability: 0,   color: 'red',    isWon: false, isLost: true  },
    ],
  },
  {
    id: 'partnerships',
    name: 'Partnerships',
    description: 'Pipeline for channel and strategic partner deals',
    stages: [
      { id: 'partner-intro',       name: 'Introduction', probability: 25,  color: 'gray',   isWon: false, isLost: false },
      { id: 'partner-evaluation',  name: 'Evaluation',   probability: 45,  color: 'blue',   isWon: false, isLost: false },
      { id: 'partner-agreement',   name: 'Agreement',    probability: 70,  color: 'amber',  isWon: false, isLost: false },
      { id: 'partner-onboarding',  name: 'Onboarding',   probability: 90,  color: 'purple', isWon: false, isLost: false },
      { id: 'partner-active',      name: 'Active',       probability: 100, color: 'green',  isWon: true,  isLost: false },
      { id: 'partner-inactive',    name: 'Inactive',     probability: 0,   color: 'red',    isWon: false, isLost: true  },
    ],
  },
];

export const DEFAULT_PIPELINE: Pipeline =
  PIPELINES.find(p => p.isDefault) ?? PIPELINES[0];

/** Returns a pipeline by ID, falling back to the default. */
export const getPipeline = (id: string): Pipeline =>
  PIPELINES.find(p => p.id === id) ?? DEFAULT_PIPELINE;

/** Returns a specific stage within a pipeline, or undefined if not found. */
export const getPipelineStage = (pipelineId: string, stageId: string): PipelineStage | undefined =>
  getPipeline(pipelineId).stages.find(s => s.id === stageId);

/** Returns the base probability for a stage within a pipeline. */
export const getStageProbability = (pipelineId: string, stageId: string): number =>
  getPipelineStage(pipelineId, stageId)?.probability ?? 20;

/** Returns Tailwind classes for a stage button based on its color key and active state. */
export const stageButtonClasses = (stage: PipelineStage, isActive: boolean): string => {
  if (!isActive) return 'bg-white text-gray-600 hover:bg-gray-50';
  const activeMap: Record<string, string> = {
    gray:   'bg-gray-600 text-white',
    blue:   'bg-blue-600 text-white',
    amber:  'bg-amber-500 text-white',
    purple: 'bg-purple-600 text-white',
    green:  'bg-green-600 text-white',
    red:    'bg-red-500 text-white',
  };
  return activeMap[stage.color] ?? 'bg-blue-600 text-white';
};
