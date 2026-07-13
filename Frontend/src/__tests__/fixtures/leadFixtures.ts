import type { Lead } from '../../types/lead';

const BASE: Lead = {
  id: 'lead-1',
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane.doe@acme.com',
  owner_id: 'user-1',
  status: 'new',
  temperature: 'warm',
  score: 50,
  estimated_value: 5000,
  probability: 0.5,
  currency: 'USD',
  source: 'website',
  custom_fields: {},
  enrichment_data: {},
  email_opt_in: true,
  sms_opt_in: false,
  call_opt_in: true,
  do_not_contact: false,
  gdpr_consent: false,
  is_qualified: false,
  email_opens_count: 0,
  email_clicks_count: 0,
  page_views_count: 0,
  meeting_count: 0,
  call_count: 0,
  email_sent_count: 0,
  ai_recommendations: [],
  automation_paused: false,
  tags: [],
  is_deleted: false,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  created_by: 'user-1',
};

export function makeLead(overrides: Partial<Lead> = {}): Lead {
  return { ...BASE, ...overrides };
}
