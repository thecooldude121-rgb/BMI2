export interface JohnSmithDataSource {
  id: string;
  name: string;
  icon: string;
  status: 'fetching' | 'waiting' | 'success' | 'error';
  progress: number;
  estimatedTime: string;
}

export interface JohnSmithEnrichmentData {
  leadId: string;
  leadName: string;
  leadTitle: string;
  leadCompany: string;
  score: number;
  source: string;
  status: 'enriching' | 'not_started';
  startedAt: string;
  dataSources: JohnSmithDataSource[];
  totalFields: number;
  enrichedFields: number;
  estimatedCompletion: string;
}

export const johnSmithEnrichmentData: JohnSmithEnrichmentData = {
  leadId: 'lead_002',
  leadName: 'John Smith',
  leadTitle: 'VP Sales',
  leadCompany: 'Acme Corp',
  score: 78,
  source: 'Apollo',
  status: 'enriching',
  startedAt: 'Just now',
  dataSources: [
    {
      id: 'apollo',
      name: 'Apollo.io',
      icon: '🎯',
      status: 'fetching',
      progress: 45,
      estimatedTime: '2s'
    },
    {
      id: 'zoominfo',
      name: 'ZoomInfo',
      icon: '🎯',
      status: 'waiting',
      progress: 0,
      estimatedTime: '3s'
    }
  ],
  totalFields: 20,
  enrichedFields: 0,
  estimatedCompletion: '3 seconds'
};
