export type FieldEnrichmentStatus = 'queued' | 'enriching' | 'completed' | 'failed';

export interface EnrichedFieldData {
  fieldId: string;
  fieldName: string;
  fieldIcon: string;
  category: string;
  status: FieldEnrichmentStatus;
  progress: number;
  beforeValue?: string;
  afterValue?: string;
  source?: string;
  confidence?: number;
  timestamp?: string;
  error?: string;
  statusMessage?: string;
}

export interface FieldCategory {
  id: string;
  name: string;
  totalFields: number;
  completedFields: number;
  fields: EnrichedFieldData[];
}

export interface EnrichmentProgressState {
  totalFields: number;
  completedFields: number;
  overallProgress: number;
  status: 'idle' | 'preparing' | 'enriching' | 'completed' | 'error';
  categories: FieldCategory[];
  startTime?: number;
  endTime?: number;
}
