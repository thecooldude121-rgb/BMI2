import { Meeting, MeetingStats, AIInsight } from '../types/meeting';

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

export const sampleMeetings: Meeting[] = [
  {
    id: 'meeting_innovate_live_001',
    title: 'InnovateLabs - Technical Deep Dive',
    type: 'video',
    status: 'live',
    startTime: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() + 45 * 60 * 1000).toISOString(),
    meetingUrl: 'https://zoom.us/j/123456789',
    dealId: 'deal-innovatelabs',
    dealTitle: 'InnovateLabs',
    dealValue: 38000,
    dealStage: 'Qualified',
    accountName: 'InnovateLabs',
    attendees: [
      { id: 'att-1', name: 'David Kumar', title: 'CTO', email: 'david@innovatelabs.com' },
      { id: 'att-2', name: 'Alex Rodriguez', title: 'You', isHost: true }
    ],
    aiProcessingStatus: 'processing',
    aiProcessingProgress: 45,
    hasRecording: true,
    hasTranscript: false,
    createdAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'meeting_acme_001',
    title: 'Acme Corp - Proposal Review',
    type: 'video',
    status: 'completed',
    startTime: '2024-12-07T10:00:00',
    endTime: '2024-12-07T10:45:00',
    duration: 45,
    meetingUrl: 'https://zoom.us/j/acme-proposal',
    dealId: 'deal-acme',
    dealTitle: 'Acme Corp - Enterprise Plan',
    dealValue: 50000,
    dealStage: 'Proposal',
    accountId: 'acc-acme',
    accountName: 'Acme Corp',
    attendees: [
      { id: 'contact_john_smith', name: 'John Smith', title: 'VP Sales', email: 'john@acme.com', isHost: false },
      { id: 'att-current-user', name: 'Alex Rodriguez', title: 'Sales Rep', email: 'alex@bmi-crm.com', isHost: true }
    ],
    aiProcessingStatus: 'processed',
    aiSummary: {
      summary: 'Budget confirmed at $50,000 annually. Timeline discussed: Q1 2026 implementation (6 months). Main concern: Integration with existing Salesforce system. Customer expressed interest in custom features. CEO approval required before contract signing.',
      keyPoints: [
        'Budget confirmed at $50,000 annually',
        'Implementation timeline: 6 months starting Q1 2026',
        'Salesforce integration critical',
        'CEO approval required'
      ],
      sentiment: 'positive',
      sentimentScore: 85,
      actionItems: [
        {
          id: 'ai-1',
          description: 'Send updated proposal',
          completed: true,
          assignee: 'Alex Rodriguez',
          dueDate: '2024-12-10'
        },
        {
          id: 'ai-2',
          description: 'Address Salesforce integration details',
          completed: false,
          assignee: 'Alex Rodriguez',
          dueDate: '2024-12-12'
        },
        {
          id: 'ai-3',
          description: 'Request introduction to CEO',
          completed: false,
          assignee: 'John Smith',
          dueDate: '2024-12-15'
        },
        {
          id: 'ai-4',
          description: 'Schedule technical demo',
          completed: false,
          assignee: 'Sarah Chen',
          dueDate: '2024-12-18'
        }
      ],
      nextSteps: [
        'Focus on Salesforce Integration Capabilities',
        'Prepare ROI Calculation for 75-person team',
        'Break down Implementation Timeline Details',
        'Share Customer Success Stories (SaaS sector)'
      ],
      concerns: [
        'Integration with existing Salesforce system',
        'Implementation complexity',
        'CEO approval needed'
      ]
    },
    hasRecording: true,
    recordingDuration: 45,
    recordingUrl: '/recordings/acme_meeting_recording.mp4',
    hasTranscript: true,
    transcriptUrl: '/transcripts/acme_meeting_transcript.pdf',
    notes: 'Great meeting! Budget confirmed. Make sure to address Salesforce integration thoroughly in next demo.',
    createdAt: '2024-12-07T09:00:00',
    updatedAt: '2024-12-07T11:32:00'
  },
  {
    id: 'meeting_techstart_002',
    title: 'TechStart Inc - Contract Negotiation',
    type: 'call',
    status: 'completed',
    startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    endTime: new Date(today.getTime() + 15 * 60 * 60 * 1000).toISOString(),
    duration: 30,
    dealId: 'deal-techstart',
    dealTitle: 'TechStart',
    dealValue: 42000,
    dealStage: 'Negotiation',
    accountName: 'TechStart Inc',
    attendees: [
      { id: 'att-5', name: 'Sarah Lee', title: 'CFO', email: 'sarah@techstart.com' },
      { id: 'att-6', name: 'Alex Rodriguez', title: 'You', isHost: true }
    ],
    aiProcessingStatus: 'processing',
    aiProcessingProgress: 65,
    hasRecording: true,
    recordingDuration: 30,
    hasTranscript: false,
    hrmsConnected: true,
    hrmsRecruitedDate: '2024-11-01',
    createdAt: new Date(today.getTime() + 14 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(today.getTime() + 15 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'meeting_bigco_upcoming_001',
    title: 'BigCo Enterprise - Discovery Call',
    type: 'video',
    status: 'upcoming',
    startTime: new Date(today.getTime() + 16 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(today.getTime() + 17 * 60 * 60 * 1000).toISOString(),
    meetingUrl: 'https://zoom.us/j/987654321',
    dealId: 'deal-bigco',
    dealTitle: 'BigCo',
    dealValue: 75000,
    dealStage: 'Qualified',
    accountName: 'BigCo Enterprise',
    attendees: [
      { id: 'att-7', name: 'Mike Chen', title: 'CTO', email: 'mike@bigco.com' },
      { id: 'att-8', name: 'Sarah Chen', title: 'Us', email: 'sarah.chen@ourcompany.com' }
    ],
    aiProcessingStatus: 'not-recorded',
    hasRecording: false,
    hasTranscript: false,
    prepNotes: [
      'Review technical requirements doc',
      'Address integration concerns from email',
      'Bring up Q1 2025 timeline'
    ],
    createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'meeting_dataflow_upcoming_001',
    title: 'DataFlow Inc - Executive Review',
    type: 'in-person',
    status: 'upcoming',
    startTime: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 11.5 * 60 * 60 * 1000).toISOString(),
    location: 'DataFlow HQ, 123 Market St, San Francisco, CA',
    dealId: 'deal-dataflow',
    dealTitle: 'DataFlow',
    dealValue: 95000,
    dealStage: 'Negotiation',
    accountName: 'DataFlow Inc',
    attendees: [
      { id: 'att-10', name: 'Emma Wilson', title: 'VP Marketing', email: 'emma@dataflow.com' },
      { id: 'att-11', name: 'CEO', title: 'DataFlow', email: 'ceo@dataflow.com' },
      { id: 'att-12', name: 'You', email: 'you@company.com' },
      { id: 'att-13', name: 'Alex Rodriguez', title: 'Account Executive', isHost: true }
    ],
    aiProcessingStatus: 'not-recorded',
    hasRecording: false,
    hasTranscript: false,
    hrmsConnected: true,
    createdAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'meeting_startco_001',
    title: 'StartCo - Follow-up Call',
    type: 'call',
    status: 'completed',
    startTime: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
    duration: 20,
    dealId: 'deal-startco',
    dealTitle: 'StartCo',
    dealValue: 28000,
    dealStage: 'Proposal',
    accountName: 'StartCo',
    attendees: [
      { id: 'att-14', name: 'Lisa Wong', title: 'CEO', email: 'lisa@startco.com' },
      { id: 'att-15', name: 'Alex Rodriguez', title: 'You', isHost: true }
    ],
    aiProcessingStatus: 'processed',
    aiSummary: {
      summary: 'Pricing approved. Implementation timeline discussed - 4 weeks starting Jan 2025. Waiting on legal review of contract.',
      keyPoints: [
        'Pricing approved at $28K',
        '4-week implementation timeline',
        'Start date: January 2025',
        'Contract in legal review'
      ],
      sentiment: 'positive',
      sentimentScore: 78,
      actionItems: [
        { id: 'ai-5', description: 'Send contract', completed: true, assignee: 'Alex Rodriguez' },
        { id: 'ai-6', description: 'Schedule kickoff', completed: false, assignee: 'Alex Rodriguez', dueDate: '2024-12-20' }
      ]
    },
    hasRecording: false,
    hasTranscript: true,
    notes: 'Manual notes taken during call',
    createdAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 15.5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'meeting_health_001',
    title: 'HealthPlus - Initial Discovery',
    type: 'video',
    status: 'completed',
    startTime: new Date(today.getTime() - 9 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(today.getTime() - 9 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString(),
    duration: 60,
    meetingUrl: 'https://teams.microsoft.com/l/meetup-join/xyz',
    dealId: 'deal-healthplus',
    dealTitle: 'HealthPlus',
    dealValue: 62000,
    dealStage: 'Qualified',
    accountName: 'HealthPlus Inc',
    attendees: [
      { id: 'att-16', name: 'Dr. Amanda Singh', title: 'VP', email: 'amanda@healthplus.com' },
      { id: 'att-17', name: 'Alex Rodriguez', title: 'You', isHost: true }
    ],
    aiProcessingStatus: 'processed',
    aiSummary: {
      summary: 'Discussed integration needs with existing EHR systems. Compliance requirements for HIPAA. Budget range: $60-70K. Decision in 2-3 weeks.',
      keyPoints: [
        'EHR system integration is critical',
        'HIPAA compliance requirements must be met',
        'Budget range: $60,000 - $70,000',
        'Decision timeline: 2-3 weeks'
      ],
      sentiment: 'neutral',
      sentimentScore: 65,
      actionItems: [
        { id: 'ai-7', description: 'Prepare HIPAA compliance documentation', completed: true, assignee: 'Alex Rodriguez' },
        { id: 'ai-8', description: 'Schedule technical demo with IT team', completed: true, assignee: 'Alex Rodriguez' },
        { id: 'ai-9', description: 'Send EHR integration case studies', completed: true, assignee: 'Alex Rodriguez' },
        { id: 'ai-10', description: 'Follow up on decision', completed: true, assignee: 'Alex Rodriguez' },
        { id: 'ai-11', description: 'Prepare detailed proposal', completed: true, assignee: 'Alex Rodriguez' }
      ],
      concerns: [
        'Integration complexity with legacy EHR systems',
        'Timeline for HIPAA certification'
      ]
    },
    hasRecording: true,
    recordingDuration: 60,
    hasTranscript: true,
    createdAt: new Date(today.getTime() - 9 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(today.getTime() - 9 * 24 * 60 * 60 * 1000 + 15.5 * 60 * 60 * 1000).toISOString()
  }
];

export const meetingStats: MeetingStats = {
  totalMeetings: 47,
  upcomingThisWeek: 12,
  recordedMeetings: 35,
  liveNow: 1,
  aiProcessed: 42,
  thisWeek: 28
};

export const aiInsights: AIInsight[] = [
  {
    id: 'insight-1',
    type: 'follow-up',
    title: '3 meetings this week need follow-up',
    description: 'Acme Corp ($50K), TechStart ($42K), BigCo ($75K)',
    priority: 'high',
    actionLabel: 'View Meetings',
    data: {
      meetings: [
        { name: 'Acme Corp', value: 50000 },
        { name: 'TechStart', value: 42000 },
        { name: 'BigCo', value: 75000 }
      ]
    }
  },
  {
    id: 'insight-2',
    type: 'action-items',
    title: '12 action items pending from recent meetings',
    description: '8 from this week, 4 overdue',
    priority: 'high',
    actionLabel: 'Review Tasks',
    data: {
      total: 12,
      thisWeek: 8,
      overdue: 4
    }
  },
  {
    id: 'insight-3',
    type: 'sentiment',
    title: 'Avg meeting sentiment this month: 😊 82% Positive',
    description: '+5% improvement from last month',
    priority: 'medium',
    actionLabel: 'View Analytics',
    data: {
      currentSentiment: 82,
      previousSentiment: 77,
      change: 5
    }
  }
];
