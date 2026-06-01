/**
 * MEETING TRANSCRIPT MOCK DATA
 *
 * This file contains the complete mock data structure for meeting transcripts.
 * Ready for database integration when needed.
 */

export interface MeetingTranscriptMetadata {
  meetingId: string;
  totalWords: number;
  duration: number;
  averageWordsPerMinute: number;
  speakers: number;
  aiConfidence: number;
  language: string;
  processedAt: string;
}

export interface Speaker {
  id: string;
  name: string;
  initials: string;
  title?: string;
  company?: string;
  speakingTime: number;
  speakingPercentage: number;
  wordCount: number;
  sentimentScore: number;
  isHRMSRecruited?: boolean;
  hrmsRecruitedDate?: string;
  color?: string;
}

export interface KeyMoment {
  id: string;
  timestamp: string;
  timeSeconds: number;
  type: 'financial' | 'sentiment' | 'timeline' | 'objection' | 'decision' | 'conclusion';
  speaker: string;
  title: string;
  content: string;
  sentiment?: number;
  aiAction?: string;
  icon: string;
}

export interface ActionItem {
  id: string;
  mentionedAt: string;
  timeSeconds: number;
  speaker: string;
  task: string;
  assignee: string;
  dueDate: string;
  status: 'completed' | 'in-progress' | 'pending';
}

export interface SentimentDistribution {
  positive: {
    percentage: number;
    duration: number;
  };
  neutral: {
    percentage: number;
    duration: number;
  };
  negative: {
    percentage: number;
    duration: number;
  };
  timeline: Array<{
    timeRange: string;
    sentiment: string;
    percentage: number;
  }>;
}

export interface CRMUpdate {
  id: string;
  timestamp: string;
  field: string;
  oldValue?: string;
  newValue: string;
  entityType: 'deal' | 'contact' | 'account' | 'opportunity';
  entityId: string;
  entityName: string;
  confidence: number;
  canUndo: boolean;
}

export interface Analytics {
  questionCount: number;
  decisionPoints: number;
  averageSentenceLength: number;
  speakingPace: {
    speaker: string;
    wordsPerMinute: number;
  }[];
  topKeywords: {
    word: string;
    count: number;
  }[];
  engagementScore: number;
}

export interface TranscriptSegment {
  id: string;
  timestamp: string;
  timeSeconds: number;
  speaker: string;
  speakerInitials: string;
  text: string;
  type: 'normal' | 'key-moment' | 'action-item';
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number;
  momentType?: 'budget' | 'timeline' | 'integration' | 'decision' | 'agreement' | 'sentiment' | 'concern';
  momentTitle?: string;
  aiDetections?: string[];
  crmUpdates?: CRMUpdate[];
  actionItem?: {
    task: string;
    assignee: string;
    dueDate: string;
    status: 'completed' | 'in-progress' | 'pending';
  };
  isHRMSSpeaker?: boolean;
}

export interface MeetingTranscript {
  metadata: MeetingTranscriptMetadata;
  speakers: Speaker[];
  keyMoments: KeyMoment[];
  actionItems: ActionItem[];
  sentimentDistribution: SentimentDistribution;
  analytics: Analytics;
  segments: TranscriptSegment[];
}

// MOCK DATA: ACME CORP - PROPOSAL REVIEW
export const acmeCorpTranscript: MeetingTranscript = {
  metadata: {
    meetingId: 'meeting_acme_001',
    totalWords: 3245,
    duration: 45,
    averageWordsPerMinute: 72,
    speakers: 2,
    aiConfidence: 95,
    language: 'English (US)',
    processedAt: 'Dec 7, 2024 11:30 AM'
  },

  speakers: [
    {
      id: 'speaker_js',
      name: 'John Smith',
      initials: 'JS',
      title: 'VP Sales',
      company: 'Acme Corp',
      speakingTime: 22,
      speakingPercentage: 49,
      wordCount: 1590,
      sentimentScore: 85,
      isHRMSRecruited: true,
      hrmsRecruitedDate: 'Nov 2024',
      color: '#3b82f6'
    },
    {
      id: 'speaker_ar',
      name: 'Alex Rodriguez',
      initials: 'AR',
      title: 'Senior Account Executive',
      company: 'Your Company',
      speakingTime: 23,
      speakingPercentage: 51,
      wordCount: 1655,
      sentimentScore: 88,
      isHRMSRecruited: false,
      color: '#8b5cf6'
    }
  ],

  keyMoments: [
    {
      id: 'km_1',
      timestamp: '05:30',
      timeSeconds: 330,
      type: 'financial',
      speaker: 'John Smith',
      title: 'Budget Confirmed',
      content: '$50,000 annual cost within budget',
      aiAction: 'Deal amount confirmed',
      icon: '💰'
    },
    {
      id: 'km_2',
      timestamp: '06:20',
      timeSeconds: 380,
      type: 'sentiment',
      speaker: 'Alex Rodriguez',
      title: 'Very Positive Response',
      content: 'Excellent! That\'s great to hear',
      sentiment: 95,
      icon: '😊'
    },
    {
      id: 'km_3',
      timestamp: '15:45',
      timeSeconds: 945,
      type: 'timeline',
      speaker: 'Alex Rodriguez',
      title: 'Timeline Discussed',
      content: '6 months starting Q1 2026, go-live March 15',
      aiAction: 'Close date updated',
      icon: '📅'
    },
    {
      id: 'km_4',
      timestamp: '22:10',
      timeSeconds: 1330,
      type: 'objection',
      speaker: 'John Smith',
      title: 'Integration Concerns',
      content: 'Salesforce integration critical',
      aiAction: 'Competitor noted, concern flagged',
      icon: '🔌'
    },
    {
      id: 'km_5',
      timestamp: '35:20',
      timeSeconds: 2120,
      type: 'decision',
      speaker: 'John Smith',
      title: 'CEO Approval Needed',
      content: 'Need final approval from CEO',
      aiAction: 'Decision maker identified',
      icon: '👔'
    },
    {
      id: 'km_6',
      timestamp: '42:15',
      timeSeconds: 2535,
      type: 'conclusion',
      speaker: 'Alex Rodriguez',
      title: 'Agreement on Next Steps',
      content: 'This is great progress',
      sentiment: 92,
      icon: '✅'
    }
  ],

  actionItems: [
    {
      id: 'ai_1',
      mentionedAt: '40:25',
      timeSeconds: 2425,
      speaker: 'Alex Rodriguez',
      task: 'Send updated proposal',
      assignee: 'Alex Rodriguez',
      dueDate: 'Dec 10, 2024',
      status: 'completed'
    },
    {
      id: 'ai_2',
      mentionedAt: '28:45',
      timeSeconds: 1725,
      speaker: 'Alex Rodriguez',
      task: 'Address Salesforce integration details',
      assignee: 'Alex Rodriguez',
      dueDate: 'Dec 12, 2024',
      status: 'in-progress'
    },
    {
      id: 'ai_3',
      mentionedAt: '36:50',
      timeSeconds: 2210,
      speaker: 'Alex Rodriguez',
      task: 'Request introduction to CEO',
      assignee: 'John Smith',
      dueDate: 'Dec 15, 2024',
      status: 'pending'
    },
    {
      id: 'ai_4',
      mentionedAt: '41:10',
      timeSeconds: 2470,
      speaker: 'John Smith',
      task: 'Schedule technical demo',
      assignee: 'Sarah Chen',
      dueDate: 'Dec 18, 2024',
      status: 'pending'
    }
  ],

  sentimentDistribution: {
    positive: {
      percentage: 75,
      duration: 34
    },
    neutral: {
      percentage: 20,
      duration: 9
    },
    negative: {
      percentage: 5,
      duration: 2
    },
    timeline: [
      {
        timeRange: '00:00 - 10:00',
        sentiment: 'Positive',
        percentage: 90
      },
      {
        timeRange: '10:01 - 25:00',
        sentiment: 'Positive',
        percentage: 85
      },
      {
        timeRange: '25:01 - 35:00',
        sentiment: 'Neutral',
        percentage: 60
      },
      {
        timeRange: '35:01 - 45:00',
        sentiment: 'Positive',
        percentage: 88
      }
    ]
  },

  analytics: {
    questionCount: 12,
    decisionPoints: 3,
    averageSentenceLength: 18,
    speakingPace: [
      {
        speaker: 'John Smith',
        wordsPerMinute: 72
      },
      {
        speaker: 'Alex Rodriguez',
        wordsPerMinute: 72
      }
    ],
    topKeywords: [
      { word: 'integration', count: 15 },
      { word: 'salesforce', count: 12 },
      { word: 'timeline', count: 10 },
      { word: 'implementation', count: 9 },
      { word: 'budget', count: 8 },
      { word: 'team', count: 7 },
      { word: 'features', count: 6 },
      { word: 'pricing', count: 5 }
    ],
    engagementScore: 87
  },

  segments: [
    {
      id: '1',
      timestamp: '00:00',
      timeSeconds: 0,
      speaker: 'Alex Rodriguez',
      speakerInitials: 'AR',
      text: "Good morning, John! Thanks for joining the call today. I'm excited to walk through the proposal we put together for Acme Corp.",
      type: 'normal'
    },
    {
      id: '2',
      timestamp: '00:28',
      timeSeconds: 28,
      speaker: 'John Smith',
      speakerInitials: 'JS',
      text: "Good morning, Alex! Yeah, absolutely. We're looking forward to this. The team is really interested in what you've come up with.",
      type: 'normal'
    },
    {
      id: '3',
      timestamp: '01:15',
      timeSeconds: 75,
      speaker: 'Alex Rodriguez',
      speakerInitials: 'AR',
      text: "Perfect. So let me start with a quick overview of what we're proposing. Based on our discovery sessions, we've tailored an enterprise package specifically for your 75-person team...",
      type: 'normal'
    },
    {
      id: '4',
      timestamp: '05:30',
      timeSeconds: 330,
      speaker: 'John Smith',
      speakerInitials: 'JS',
      text: "Okay, so the annual cost would be $50,000. That's actually within our budget range. We had allocated up to $55K for this, so this works perfectly.",
      sentiment: 'positive',
      sentimentScore: 95,
      type: 'key-moment',
      momentType: 'budget',
      momentTitle: 'Budget Confirmed',
      isHRMSSpeaker: true,
      aiDetections: [
        'Budget confirmed: $50,000',
        'CRM Updated: Deal amount confirmed'
      ],
      crmUpdates: [
        {
          id: 'crm_1',
          timestamp: '05:30',
          field: 'Deal Amount',
          oldValue: '$0',
          newValue: '$50,000',
          entityType: 'deal',
          entityId: 'deal_acme_001',
          entityName: 'Acme Corp - Enterprise Package',
          confidence: 98,
          canUndo: true
        },
        {
          id: 'crm_2',
          timestamp: '05:30',
          field: 'Budget Range',
          newValue: '$50,000 - $55,000',
          entityType: 'deal',
          entityId: 'deal_acme_001',
          entityName: 'Acme Corp - Enterprise Package',
          confidence: 95,
          canUndo: true
        }
      ]
    },
    {
      id: '5',
      timestamp: '06:20',
      timeSeconds: 380,
      speaker: 'Alex Rodriguez',
      speakerInitials: 'AR',
      text: "Excellent! That's great to hear. And just to confirm, this includes all the features we discussed - the custom integrations, advanced reporting, and priority support.",
      sentiment: 'positive',
      type: 'normal'
    },
    {
      id: '6',
      timestamp: '07:45',
      timeSeconds: 465,
      speaker: 'John Smith',
      speakerInitials: 'JS',
      text: "Yes, that's correct. One thing I want to dive deeper into though is the timeline. You mentioned 6 months for implementation?",
      type: 'normal'
    },
    {
      id: '7',
      timestamp: '15:45',
      timeSeconds: 945,
      speaker: 'Alex Rodriguez',
      speakerInitials: 'AR',
      text: "Right. So we're looking at a 6-month implementation starting Q1 2026. That would put us at a go-live date around March 15, 2026. This timeline includes full data migration, team training, and a 2-week stabilization period.",
      type: 'key-moment',
      momentType: 'timeline',
      momentTitle: 'Timeline Discussed',
      aiDetections: [
        'Timeline: 6 months (Q1 2026)',
        'Go-live: March 15, 2026',
        'CRM Updated: Close date set'
      ],
      crmUpdates: [
        {
          id: 'crm_3',
          timestamp: '15:45',
          field: 'Expected Close Date',
          oldValue: 'TBD',
          newValue: 'March 15, 2026',
          entityType: 'deal',
          entityId: 'deal_acme_001',
          entityName: 'Acme Corp - Enterprise Package',
          confidence: 92,
          canUndo: true
        },
        {
          id: 'crm_4',
          timestamp: '15:45',
          field: 'Implementation Timeline',
          newValue: '6 months (Q1 2026)',
          entityType: 'deal',
          entityId: 'deal_acme_001',
          entityName: 'Acme Corp - Enterprise Package',
          confidence: 96,
          canUndo: true
        }
      ]
    },
    {
      id: '8',
      timestamp: '18:20',
      timeSeconds: 1100,
      speaker: 'John Smith',
      speakerInitials: 'JS',
      text: "That aligns well with our Q2 goals. Good.",
      sentiment: 'positive',
      type: 'normal'
    },
    {
      id: '9',
      timestamp: '22:10',
      timeSeconds: 1330,
      speaker: 'John Smith',
      speakerInitials: 'JS',
      text: "Now, the big question on my end is the Salesforce integration. We're heavily invested in Salesforce, and we can't afford any disruption to that system. How does your platform handle that integration?",
      type: 'key-moment',
      momentType: 'integration',
      momentTitle: 'Integration Concerns',
      aiDetections: [
        'Concern: Salesforce integration',
        'Competitor identified: Salesforce',
        'CRM Updated: Competitor added to deal'
      ]
    },
    {
      id: '10',
      timestamp: '23:15',
      timeSeconds: 1395,
      speaker: 'Alex Rodriguez',
      speakerInitials: 'AR',
      text: "Great question. So we have a robust API integration with Salesforce. It's a two-way sync that runs in real-time. We actually have several clients running both systems side-by-side without any issues...",
      sentiment: 'neutral',
      type: 'normal'
    },
    {
      id: '11',
      timestamp: '27:30',
      timeSeconds: 1650,
      speaker: 'John Smith',
      speakerInitials: 'JS',
      text: "Hmm, okay. I'm still a bit concerned about the complexity of managing two systems. Can you send me some more detailed documentation on how that works?",
      sentiment: 'negative',
      type: 'normal'
    },
    {
      id: '12',
      timestamp: '28:45',
      timeSeconds: 1725,
      speaker: 'Alex Rodriguez',
      speakerInitials: 'AR',
      text: "Absolutely. I'll send you our integration guide and we can also schedule a technical deep-dive if you'd like.",
      type: 'action-item',
      actionItem: {
        task: 'Send Salesforce integration documentation',
        assignee: 'Alex Rodriguez',
        dueDate: 'Dec 12, 2024',
        status: 'in-progress'
      }
    },
    {
      id: '13',
      timestamp: '35:20',
      timeSeconds: 2120,
      speaker: 'John Smith',
      speakerInitials: 'JS',
      text: "This all sounds good, Alex. Just so you know, I'll need to get final approval from our CEO before we can move forward with the contract. Would it be possible to include her in our next meeting?",
      type: 'key-moment',
      momentType: 'decision',
      momentTitle: 'CEO Approval Needed',
      aiDetections: [
        'Decision maker: CEO approval needed',
        'CRM Updated: Added to deal notes'
      ]
    },
    {
      id: '14',
      timestamp: '36:50',
      timeSeconds: 2210,
      speaker: 'Alex Rodriguez',
      speakerInitials: 'AR',
      text: "Definitely! That would be great. Can you help coordinate that introduction?",
      sentiment: 'positive',
      type: 'action-item',
      actionItem: {
        task: 'Request introduction to CEO',
        assignee: 'John Smith',
        dueDate: 'Dec 15, 2024',
        status: 'pending'
      }
    },
    {
      id: '15',
      timestamp: '40:00',
      timeSeconds: 2400,
      speaker: 'John Smith',
      speakerInitials: 'JS',
      text: "Sure, I can do that. Let me check her calendar and get back to you with some times that work.",
      sentiment: 'positive',
      type: 'normal'
    },
    {
      id: '16',
      timestamp: '40:25',
      timeSeconds: 2425,
      speaker: 'Alex Rodriguez',
      speakerInitials: 'AR',
      text: "Perfect. In the meantime, I'll get that updated proposal over to you with all the details we discussed today. I'll have it to you by end of week.",
      type: 'action-item',
      actionItem: {
        task: 'Send updated proposal',
        assignee: 'Alex Rodriguez',
        dueDate: 'Dec 10, 2024',
        status: 'completed'
      }
    },
    {
      id: '17',
      timestamp: '41:10',
      timeSeconds: 2470,
      speaker: 'John Smith',
      speakerInitials: 'JS',
      text: "Great. And would you be able to do that technical demo you mentioned? I think that would really help us understand the Salesforce integration better.",
      type: 'action-item',
      actionItem: {
        task: 'Schedule technical demo',
        assignee: 'Sarah Chen',
        dueDate: 'Dec 18, 2024',
        status: 'pending'
      }
    },
    {
      id: '18',
      timestamp: '42:15',
      timeSeconds: 2535,
      speaker: 'Alex Rodriguez',
      speakerInitials: 'AR',
      text: "Absolutely. I'll have our solutions engineer, Sarah, reach out to coordinate that. This is great progress, John.",
      sentiment: 'positive',
      type: 'key-moment',
      momentType: 'agreement',
      momentTitle: 'Agreement on Next Steps'
    },
    {
      id: '19',
      timestamp: '43:30',
      timeSeconds: 2610,
      speaker: 'John Smith',
      speakerInitials: 'JS',
      text: "Yeah, I'm feeling really good about this. Thanks for putting this together, Alex. Talk to you soon.",
      sentiment: 'positive',
      type: 'normal'
    },
    {
      id: '20',
      timestamp: '44:15',
      timeSeconds: 2655,
      speaker: 'Alex Rodriguez',
      speakerInitials: 'AR',
      text: "Thanks, John! Looking forward to next steps. Have a great rest of your day.",
      sentiment: 'positive',
      type: 'normal'
    }
  ]
};

/**
 * DATABASE SCHEMA REFERENCE
 *
 * When implementing in Supabase, use these table structures:
 *
 * TABLE: meeting_transcripts
 * - id (uuid, primary key)
 * - meeting_id (uuid, foreign key to meetings)
 * - total_words (integer)
 * - duration (integer, minutes)
 * - average_wpm (integer)
 * - speaker_count (integer)
 * - ai_confidence (integer, 0-100)
 * - language (text)
 * - processed_at (timestamptz)
 * - created_at (timestamptz)
 * - updated_at (timestamptz)
 *
 * TABLE: transcript_speakers
 * - id (uuid, primary key)
 * - transcript_id (uuid, foreign key)
 * - name (text)
 * - initials (text)
 * - speaking_time (integer, minutes)
 * - speaking_percentage (integer)
 * - word_count (integer)
 * - sentiment_score (integer, 0-100)
 *
 * TABLE: transcript_key_moments
 * - id (uuid, primary key)
 * - transcript_id (uuid, foreign key)
 * - timestamp (text)
 * - time_seconds (integer)
 * - type (text)
 * - speaker (text)
 * - title (text)
 * - content (text)
 * - sentiment (integer, nullable)
 * - ai_action (text, nullable)
 * - icon (text)
 *
 * TABLE: transcript_action_items
 * - id (uuid, primary key)
 * - transcript_id (uuid, foreign key)
 * - mentioned_at (text)
 * - time_seconds (integer)
 * - speaker (text)
 * - task (text)
 * - assignee (text)
 * - due_date (date)
 * - status (text)
 *
 * TABLE: transcript_segments
 * - id (uuid, primary key)
 * - transcript_id (uuid, foreign key)
 * - timestamp (text)
 * - time_seconds (integer)
 * - speaker (text)
 * - speaker_initials (text)
 * - text (text)
 * - type (text)
 * - sentiment (text, nullable)
 * - moment_type (text, nullable)
 * - moment_title (text, nullable)
 * - ai_detections (jsonb, nullable)
 * - action_item (jsonb, nullable)
 * - sequence_order (integer)
 */

// Helper function to get transcript by meeting ID
export function getTranscriptByMeetingId(meetingId: string): MeetingTranscript | null {
  if (meetingId === 'meeting_acme_001' || meetingId === 'meeting-acme-corp') {
    return acmeCorpTranscript;
  }
  return null;
}

// Helper function to search transcript
export function searchTranscript(transcript: MeetingTranscript, query: string): TranscriptSegment[] {
  if (!query) return [];

  const lowerQuery = query.toLowerCase();
  return transcript.segments.filter(segment =>
    segment.text.toLowerCase().includes(lowerQuery)
  );
}

// Helper function to filter by speaker
export function filterBySpeaker(transcript: MeetingTranscript, speakerName: string): TranscriptSegment[] {
  if (speakerName === 'all') return transcript.segments;

  return transcript.segments.filter(segment =>
    segment.speaker === speakerName
  );
}

// Helper function to filter by type
export function filterByType(transcript: MeetingTranscript, type: string): TranscriptSegment[] {
  if (type === 'all') return transcript.segments;

  if (type === 'action-items') {
    return transcript.segments.filter(s => s.type === 'action-item');
  }

  if (type === 'key-moments') {
    return transcript.segments.filter(s => s.type === 'key-moment');
  }

  return transcript.segments;
}

export default acmeCorpTranscript;
