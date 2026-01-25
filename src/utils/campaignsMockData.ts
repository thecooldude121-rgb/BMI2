import { Campaign } from '../types/campaigns';

export const campaignsMockData: Campaign[] = [
  {
    id: 'camp-001',
    name: 'Q1 2025 Cold Outreach',
    description: 'Enterprise SaaS targets',
    status: 'active',
    type: 'email',
    template: 'Cold Outreach',
    leadsCount: 250,
    sendRate: 85,
    sentCount: 213,
    openRate: 35,
    openCount: 74,
    replyRate: 12,
    replyCount: 26,
    conversionRate: 4.0,
    conversionCount: 10,
    createdAt: '2025-01-15',
    owner: 'John Smith',
    tags: ['cold', 'enterprise', 'saas']
  },
  {
    id: 'camp-002',
    name: 'Series A Startup Outreach Campaign',
    description: 'Multi-channel approach for high-growth startups',
    status: 'active',
    type: 'multi-channel',
    template: 'Custom',
    leadsCount: 180,
    sendRate: 70,
    sentCount: 126,
    openRate: 12,
    openCount: 15,
    replyRate: 1,
    replyCount: 2,
    conversionRate: 0,
    conversionCount: 0,
    createdAt: '2025-01-10',
    owner: 'Sarah Johnson',
    tags: ['startups', 'series-a']
  },
  {
    id: 'camp-003',
    name: 'HRMS Warm Intro - Tech Hires Q4',
    description: 'Leveraging referrals for tech hiring decision makers',
    status: 'paused',
    type: 'email',
    template: 'Warm Intro',
    leadsCount: 45,
    sendRate: 95,
    sentCount: 43,
    openRate: 58,
    openCount: 25,
    replyRate: 22,
    replyCount: 9,
    conversionRate: 8.9,
    conversionCount: 4,
    createdAt: '2025-01-08',
    owner: 'Michael Chen',
    tags: ['warm', 'hrms', 'tech-hires']
  },
  {
    id: 'camp-004',
    name: 'SaaStr Conference Follow-up',
    description: 'Starts: Jan 29, 9am',
    status: 'scheduled',
    type: 'linkedin',
    template: 'Event Follow-up',
    leadsCount: 120,
    sendRate: 0,
    sentCount: 0,
    openRate: 0,
    openCount: 0,
    replyRate: 0,
    replyCount: 0,
    conversionRate: 0,
    conversionCount: 0,
    createdAt: '2025-01-20',
    scheduledFor: '2025-01-29T09:00:00',
    owner: 'Adithya Vardhan',
    tags: ['conference', 'event', 'saastr']
  },
  {
    id: 'camp-005',
    name: 'Re-engagement - Dormant Leads Q4',
    description: 'Not launched yet',
    status: 'draft',
    type: 'multi-channel',
    template: 'Re-engagement',
    leadsCount: 0,
    sendRate: 0,
    sentCount: 0,
    openRate: 0,
    openCount: 0,
    replyRate: 0,
    replyCount: 0,
    conversionRate: 0,
    conversionCount: 0,
    createdAt: '2025-01-22',
    owner: 'Adithya Vardhan',
    tags: ['re-engagement', 'dormant']
  },
  {
    id: 'camp-006',
    name: 'Product Demo Follow-up - Q4 2024',
    description: 'Completed Jan 15',
    status: 'completed',
    type: 'email',
    template: 'Trial Follow-up',
    leadsCount: 500,
    sendRate: 100,
    sentCount: 500,
    openRate: 42,
    openCount: 210,
    replyRate: 15,
    replyCount: 75,
    conversionRate: 6.0,
    conversionCount: 30,
    createdAt: '2024-12-01',
    completedAt: '2025-01-15',
    owner: 'Adithya Vardhan',
    tags: ['demo', 'trial', 'follow-up']
  },
  {
    id: 'camp-007',
    name: 'Low-Value Cold Outreach Test',
    description: 'Poor performance',
    status: 'completed',
    type: 'email',
    template: 'Cold Outreach',
    leadsCount: 300,
    sendRate: 95,
    sentCount: 285,
    openRate: 8,
    openCount: 23,
    replyRate: 0.3,
    replyCount: 1,
    conversionRate: 0,
    conversionCount: 0,
    createdAt: '2024-11-15',
    completedAt: '2024-12-20',
    owner: 'Adithya Vardhan',
    tags: ['test', 'low-value', 'cold']
  },
  {
    id: 'camp-008',
    name: '2024 Annual Retro Campaign',
    description: 'Archived Dec 31',
    status: 'archived',
    type: 'email',
    template: 'Custom',
    leadsCount: 150,
    sendRate: 88,
    sentCount: 132,
    openRate: 18,
    openCount: 24,
    replyRate: 3,
    replyCount: 4,
    conversionRate: 0.7,
    conversionCount: 1,
    createdAt: '2024-10-01',
    archivedAt: '2024-12-31',
    owner: 'Adithya Vardhan',
    tags: ['retro', 'annual', 'archived']
  },
  {
    id: 'camp-009',
    name: 'LinkedIn Thought Leader Outreach',
    description: 'Connecting with industry influencers',
    status: 'active',
    type: 'linkedin',
    template: 'Cold Outreach',
    leadsCount: 85,
    sendRate: 90,
    sentCount: 77,
    openRate: 0,
    openCount: 0,
    replyRate: 8,
    replyCount: 6,
    conversionRate: 2.4,
    conversionCount: 2,
    createdAt: '2025-01-05',
    owner: 'Jessica Martinez',
    tags: ['linkedin', 'thought-leader']
  },
  {
    id: 'camp-010',
    name: '⚠️ Urgent: Low Engagement Fix Needed',
    description: '0 opens in 7 days',
    status: 'active',
    type: 'email',
    template: 'Custom',
    leadsCount: 200,
    sendRate: 100,
    sentCount: 200,
    openRate: 5,
    openCount: 10,
    replyRate: 0,
    replyCount: 0,
    conversionRate: 0,
    conversionCount: 0,
    createdAt: '2025-01-18',
    owner: 'Kevin Brown',
    tags: ['urgent', 'low-engagement'],
    notes: 'Need immediate attention - potential deliverability issues'
  }
];

export interface DetailedCampaign {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'scheduled' | 'draft' | 'completed' | 'archived';
  type: 'email' | 'linkedin' | 'multi-channel';
  template: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  start_date: string;
  end_date: string | null;
  paused_at?: string;
  paused_reason?: string;

  leads: {
    total_enrolled: number;
    active: number;
    paused: number;
    completed: number;
    unsubscribed: number;
  };

  lead_source?: {
    hrms_leads: number;
    hrms_percentage: number;
    avg_score_bonus: number;
  };

  sequences: {
    total_touches: number;
    current_touch: string;
    touches_config: Array<{
      touch: number;
      channel: string;
      delay: number | string;
      subject?: string;
      message?: string;
    }>;
  };

  performance: {
    email: {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      replied: number;
      bounced: number;
      unsubscribed: number;
      spam_complaints: number;
    } | null;
    linkedin?: {
      sent: number;
      viewed: number;
      replied: number;
      connected: number;
      ignored: number;
    };
    rates: {
      send_rate: number | null;
      delivery_rate: number | null;
      open_rate: number | null;
      click_rate: number | null;
      reply_rate: number | null;
      bounce_rate: number | null;
      unsubscribe_rate: number | null;
    };
    conversion: {
      meetings_booked: number;
      opportunities_created: number;
      deals_closed: number;
      revenue_generated: number;
      conversion_rate: number;
    };
    engagement_score: 'hot' | 'warm' | 'cold' | 'frozen' | 'not_started';
    performance_grade: 'excellent' | 'good' | 'average' | 'poor' | 'not_started' | 'draft';
  };

  settings: {
    send_time_optimization: boolean;
    timezone_aware: boolean;
    business_hours_only: boolean;
    daily_send_limit: number;
    ab_testing_enabled: boolean;
    ab_variants: number;
    stop_on_reply: boolean;
    stop_on_unsubscribe: boolean;
  };
}

export const detailedCampaignsMockData: DetailedCampaign[] = [
  {
    id: "camp_001",
    name: "Q1 2025 Cold Outreach",
    description: "Enterprise SaaS targets",
    status: "active",
    type: "email",
    template: "cold_outreach",
    created_at: "2025-01-15T09:00:00Z",
    created_by: "user_adithya",
    updated_at: "2025-01-25T14:30:00Z",
    start_date: "2025-01-16T09:00:00Z",
    end_date: null,

    leads: {
      total_enrolled: 250,
      active: 213,
      paused: 0,
      completed: 37,
      unsubscribed: 2
    },

    sequences: {
      total_touches: 5,
      current_touch: "mixed",
      touches_config: [
        {touch: 1, channel: "email", delay: 0, subject: "Quick question about {{company}}'s growth"},
        {touch: 2, channel: "email", delay: "3d", subject: "Following up - {{firstName}}"},
        {touch: 3, channel: "email", delay: "5d", subject: "Thought this might help {{company}}"},
        {touch: 4, channel: "email", delay: "7d", subject: "One last thing, {{firstName}}"},
        {touch: 5, channel: "email", delay: "10d", subject: "Breaking up?"}
      ]
    },

    performance: {
      email: {
        sent: 213,
        delivered: 211,
        opened: 74,
        clicked: 34,
        replied: 26,
        bounced: 2,
        unsubscribed: 2,
        spam_complaints: 0
      },
      rates: {
        send_rate: 0.85,
        delivery_rate: 0.991,
        open_rate: 0.35,
        click_rate: 0.16,
        reply_rate: 0.12,
        bounce_rate: 0.009,
        unsubscribe_rate: 0.009
      },
      conversion: {
        meetings_booked: 12,
        opportunities_created: 10,
        deals_closed: 2,
        revenue_generated: 150000,
        conversion_rate: 0.04
      },
      engagement_score: "hot",
      performance_grade: "excellent"
    },

    settings: {
      send_time_optimization: true,
      timezone_aware: true,
      business_hours_only: true,
      daily_send_limit: 50,
      ab_testing_enabled: true,
      ab_variants: 2,
      stop_on_reply: true,
      stop_on_unsubscribe: true
    }
  },
  {
    id: "camp_002",
    name: "Series A Startup Outreach Campaign",
    description: "Targeting series A funded startups",
    status: "active",
    type: "multi-channel",
    template: "custom",
    created_at: "2025-01-10T10:00:00Z",
    created_by: "user_adithya",
    updated_at: "2025-01-25T11:20:00Z",
    start_date: "2025-01-12T09:00:00Z",
    end_date: null,

    leads: {
      total_enrolled: 180,
      active: 126,
      paused: 0,
      completed: 54,
      unsubscribed: 5
    },

    sequences: {
      total_touches: 6,
      current_touch: "mixed",
      touches_config: [
        {touch: 1, channel: "email", delay: 0, subject: "Congrats on your Series A, {{firstName}}!"},
        {touch: 2, channel: "linkedin", delay: "2d", message: "Saw your recent funding round..."},
        {touch: 3, channel: "email", delay: "5d", subject: "How {{company}} can 10x growth"},
        {touch: 4, channel: "linkedin", delay: "7d", message: "Following up on my email..."},
        {touch: 5, channel: "email", delay: "10d", subject: "Quick case study for {{company}}"},
        {touch: 6, channel: "email", delay: "14d", subject: "Should I close your file?"}
      ]
    },

    performance: {
      email: {
        sent: 126,
        delivered: 124,
        opened: 15,
        clicked: 3,
        replied: 2,
        bounced: 2,
        unsubscribed: 5,
        spam_complaints: 1
      },
      linkedin: {
        sent: 90,
        viewed: 25,
        replied: 1,
        connected: 8,
        ignored: 65
      },
      rates: {
        send_rate: 0.70,
        delivery_rate: 0.984,
        open_rate: 0.12,
        click_rate: 0.024,
        reply_rate: 0.01,
        bounce_rate: 0.016,
        unsubscribe_rate: 0.04
      },
      conversion: {
        meetings_booked: 1,
        opportunities_created: 0,
        deals_closed: 0,
        revenue_generated: 0,
        conversion_rate: 0.00
      },
      engagement_score: "cold",
      performance_grade: "poor"
    },

    settings: {
      send_time_optimization: false,
      timezone_aware: true,
      business_hours_only: true,
      daily_send_limit: 30,
      ab_testing_enabled: false,
      ab_variants: 1,
      stop_on_reply: true,
      stop_on_unsubscribe: true
    }
  },
  {
    id: "camp_003",
    name: "HRMS Warm Intro - Tech Hires Q4",
    description: "Following up on new hires from target companies (HRMS integration)",
    status: "paused",
    type: "email",
    template: "warm_introduction",
    created_at: "2025-01-08T08:00:00Z",
    created_by: "user_adithya",
    updated_at: "2025-01-20T16:45:00Z",
    start_date: "2025-01-09T09:00:00Z",
    end_date: null,
    paused_at: "2025-01-20T16:45:00Z",
    paused_reason: "Manual pause by user - reviewing messaging",

    leads: {
      total_enrolled: 45,
      active: 43,
      paused: 0,
      completed: 2,
      unsubscribed: 0
    },

    lead_source: {
      hrms_leads: 45,
      hrms_percentage: 100,
      avg_score_bonus: 0.33
    },

    sequences: {
      total_touches: 3,
      current_touch: "mixed",
      touches_config: [
        {touch: 1, channel: "email", delay: 0, subject: "Welcome to {{company}}, {{firstName}}!"},
        {touch: 2, channel: "email", delay: "2d", subject: "Settling in at {{company}}?"},
        {touch: 3, channel: "email", delay: "7d", subject: "Quick resource for your new role"}
      ]
    },

    performance: {
      email: {
        sent: 43,
        delivered: 43,
        opened: 25,
        clicked: 15,
        replied: 9,
        bounced: 0,
        unsubscribed: 0,
        spam_complaints: 0
      },
      rates: {
        send_rate: 0.95,
        delivery_rate: 1.00,
        open_rate: 0.58,
        click_rate: 0.35,
        reply_rate: 0.22,
        bounce_rate: 0.00,
        unsubscribe_rate: 0.00
      },
      conversion: {
        meetings_booked: 6,
        opportunities_created: 4,
        deals_closed: 1,
        revenue_generated: 85000,
        conversion_rate: 0.089
      },
      engagement_score: "hot",
      performance_grade: "excellent"
    },

    settings: {
      send_time_optimization: true,
      timezone_aware: true,
      business_hours_only: true,
      daily_send_limit: 20,
      ab_testing_enabled: true,
      ab_variants: 2,
      stop_on_reply: true,
      stop_on_unsubscribe: true
    }
  },
  {
    id: "camp_004",
    name: "SaaStr Conference Follow-up",
    description: "Following up with leads from SaaStr Annual 2025",
    status: "scheduled",
    type: "linkedin",
    template: "event_followup",
    created_at: "2025-01-20T14:00:00Z",
    created_by: "user_adithya",
    updated_at: "2025-01-24T10:30:00Z",
    start_date: "2025-01-29T09:00:00Z",
    end_date: null,

    leads: {
      total_enrolled: 120,
      active: 0,
      paused: 0,
      completed: 0,
      unsubscribed: 0
    },

    sequences: {
      total_touches: 3,
      current_touch: "not_started",
      touches_config: [
        {touch: 1, channel: "linkedin", delay: 0, subject: "Great meeting you at SaaStr, {{firstName}}!"},
        {touch: 2, channel: "linkedin", delay: "3d", subject: "Following up on our conversation about {{painPoint}}"},
        {touch: 3, channel: "linkedin", delay: "7d", subject: "Quick question about {{company}}'s goals"}
      ]
    },

    performance: {
      email: null,
      linkedin: {
        sent: 0,
        viewed: 0,
        replied: 0,
        connected: 0,
        ignored: 0
      },
      rates: {
        send_rate: 0.00,
        delivery_rate: 0.00,
        open_rate: null,
        click_rate: null,
        reply_rate: 0.00,
        bounce_rate: 0.00,
        unsubscribe_rate: 0.00
      },
      conversion: {
        meetings_booked: 0,
        opportunities_created: 0,
        deals_closed: 0,
        revenue_generated: 0,
        conversion_rate: 0.00
      },
      engagement_score: "not_started",
      performance_grade: "not_started"
    },

    settings: {
      send_time_optimization: true,
      timezone_aware: true,
      business_hours_only: true,
      daily_send_limit: 40,
      ab_testing_enabled: false,
      ab_variants: 1,
      stop_on_reply: true,
      stop_on_unsubscribe: true
    }
  },
  {
    id: "camp_005",
    name: "Re-engagement - Dormant Leads Q4",
    description: "Win-back campaign for leads with no activity in 90+ days",
    status: "draft",
    type: "multi-channel",
    template: "reengagement",
    created_at: "2025-01-22T11:00:00Z",
    created_by: "user_adithya",
    updated_at: "2025-01-25T09:15:00Z",
    start_date: null,
    end_date: null,

    leads: {
      total_enrolled: 0,
      active: 0,
      paused: 0,
      completed: 0,
      unsubscribed: 0
    },

    sequences: {
      total_touches: 4,
      current_touch: "not_started",
      touches_config: [
        {touch: 1, channel: "email", delay: 0, subject: "It's been a while, {{firstName}}..."},
        {touch: 2, channel: "linkedin", delay: "3d", subject: "Hey {{firstName}}, checking in..."},
        {touch: 3, channel: "email", delay: "7d", subject: "Last chance: {{company}} exclusive offer"},
        {touch: 4, channel: "email", delay: "14d", subject: "Should I remove you from our list?"}
      ]
    },

    performance: {
      email: null,
      linkedin: null,
      rates: {
        send_rate: null,
        delivery_rate: null,
        open_rate: null,
        click_rate: null,
        reply_rate: null,
        bounce_rate: null,
        unsubscribe_rate: null
      },
      conversion: {
        meetings_booked: 0,
        opportunities_created: 0,
        deals_closed: 0,
        revenue_generated: 0,
        conversion_rate: 0.00
      },
      engagement_score: "not_started",
      performance_grade: "draft"
    },

    settings: {
      send_time_optimization: true,
      timezone_aware: true,
      business_hours_only: true,
      daily_send_limit: 50,
      ab_testing_enabled: true,
      ab_variants: 3,
      stop_on_reply: true,
      stop_on_unsubscribe: true
    }
  },
  {
    id: "camp_006",
    name: "Product Demo Follow-up - Q4 2024",
    description: "Nurture sequence for leads who attended product demos",
    status: "completed",
    type: "email",
    template: "trial_followup",
    created_at: "2024-12-01T09:00:00Z",
    created_by: "user_adithya",
    updated_at: "2025-01-15T17:00:00Z",
    start_date: "2024-12-02T09:00:00Z",
    end_date: "2025-01-15T17:00:00Z",

    leads: {
      total_enrolled: 500,
      active: 0,
      paused: 0,
      completed: 500,
      unsubscribed: 8
    },

    sequences: {
      total_touches: 5,
      current_touch: "completed",
      touches_config: [
        {touch: 1, channel: "email", delay: 0, subject: "Thanks for attending our demo, {{firstName}}!"},
        {touch: 2, channel: "email", delay: "1d", subject: "Your personalized demo recording"},
        {touch: 3, channel: "email", delay: "3d", subject: "Quick question about {{company}}'s needs"},
        {touch: 4, channel: "email", delay: "7d", subject: "Case study: How {{industry}} companies use our platform"},
        {touch: 5, channel: "email", delay: "10d", subject: "Ready to move forward, {{firstName}}?"}
      ]
    },

    performance: {
      email: {
        sent: 500,
        delivered: 495,
        opened: 210,
        clicked: 98,
        replied: 75,
        bounced: 5,
        unsubscribed: 8,
        spam_complaints: 2
      },
      rates: {
        send_rate: 1.0,
        delivery_rate: 0.99,
        open_rate: 0.42,
        click_rate: 0.20,
        reply_rate: 0.15,
        bounce_rate: 0.01,
        unsubscribe_rate: 0.016
      },
      conversion: {
        meetings_booked: 45,
        opportunities_created: 30,
        deals_closed: 8,
        revenue_generated: 480000,
        conversion_rate: 0.06
      },
      engagement_score: "hot",
      performance_grade: "excellent"
    },

    settings: {
      send_time_optimization: true,
      timezone_aware: true,
      business_hours_only: true,
      daily_send_limit: 100,
      ab_testing_enabled: true,
      ab_variants: 2,
      stop_on_reply: true,
      stop_on_unsubscribe: true
    }
  },
  {
    id: "camp_007",
    name: "Low-Value Cold Outreach Test",
    description: "Testing messaging for lower-tier market segment",
    status: "completed",
    type: "email",
    template: "cold_outreach",
    created_at: "2024-11-15T10:00:00Z",
    created_by: "user_adithya",
    updated_at: "2024-12-20T15:30:00Z",
    start_date: "2024-11-16T09:00:00Z",
    end_date: "2024-12-20T15:30:00Z",
    completed_at: "2024-12-20T15:30:00Z",

    leads: {
      total_enrolled: 300,
      active: 0,
      paused: 0,
      completed: 300,
      unsubscribed: 12
    },

    sequences: {
      total_touches: 5,
      current_touch: "completed",
      touches_config: [
        {touch: 1, channel: "email", delay: 0, subject: "Affordable solution for {{company}}"},
        {touch: 2, channel: "email", delay: "3d", subject: "Still interested, {{firstName}}?"},
        {touch: 3, channel: "email", delay: "5d", subject: "Limited time offer for {{company}}"},
        {touch: 4, channel: "email", delay: "7d", subject: "Last call: Special pricing"},
        {touch: 5, channel: "email", delay: "10d", subject: "Closing your file"}
      ]
    },

    performance: {
      email: {
        sent: 285,
        delivered: 280,
        opened: 23,
        clicked: 5,
        replied: 1,
        bounced: 5,
        unsubscribed: 12,
        spam_complaints: 3
      },
      rates: {
        send_rate: 0.95,
        delivery_rate: 0.982,
        open_rate: 0.08,
        click_rate: 0.018,
        reply_rate: 0.003,
        bounce_rate: 0.018,
        unsubscribe_rate: 0.042
      },
      conversion: {
        meetings_booked: 1,
        opportunities_created: 0,
        deals_closed: 0,
        revenue_generated: 0,
        conversion_rate: 0.0
      },
      engagement_score: "cold",
      performance_grade: "very_poor"
    },

    settings: {
      send_time_optimization: false,
      timezone_aware: true,
      business_hours_only: true,
      daily_send_limit: 50,
      ab_testing_enabled: false,
      ab_variants: 1,
      stop_on_reply: true,
      stop_on_unsubscribe: true
    }
  },
  {
    id: "camp_008",
    name: "2024 Annual Retro Campaign",
    description: "Year-end retrospective outreach to past prospects",
    status: "archived",
    type: "email",
    template: "custom",
    created_at: "2024-10-01T09:00:00Z",
    created_by: "user_adithya",
    updated_at: "2024-12-31T23:59:00Z",
    start_date: "2024-10-05T09:00:00Z",
    end_date: "2024-12-15T17:00:00Z",
    completed_at: "2024-12-15T17:00:00Z",
    archived_at: "2024-12-31T23:59:00Z",

    leads: {
      total_enrolled: 150,
      active: 0,
      paused: 0,
      completed: 150,
      unsubscribed: 3
    },

    sequences: {
      total_touches: 3,
      current_touch: "completed",
      touches_config: [
        {touch: 1, channel: "email", delay: 0, subject: "2024 wrap-up: How was your year, {{firstName}}?"},
        {touch: 2, channel: "email", delay: "7d", subject: "Planning for 2025 at {{company}}?"},
        {touch: 3, channel: "email", delay: "14d", subject: "One last thing before the new year"}
      ]
    },

    performance: {
      email: {
        sent: 132,
        delivered: 130,
        opened: 24,
        clicked: 8,
        replied: 4,
        bounced: 2,
        unsubscribed: 3,
        spam_complaints: 0
      },
      rates: {
        send_rate: 0.88,
        delivery_rate: 0.985,
        open_rate: 0.18,
        click_rate: 0.061,
        reply_rate: 0.03,
        bounce_rate: 0.015,
        unsubscribe_rate: 0.023
      },
      conversion: {
        meetings_booked: 2,
        opportunities_created: 1,
        deals_closed: 0,
        revenue_generated: 0,
        conversion_rate: 0.007
      },
      engagement_score: "cold",
      performance_grade: "fair"
    },

    settings: {
      send_time_optimization: true,
      timezone_aware: true,
      business_hours_only: true,
      daily_send_limit: 30,
      ab_testing_enabled: false,
      ab_variants: 1,
      stop_on_reply: true,
      stop_on_unsubscribe: true
    }
  },
  {
    id: "camp_009",
    name: "LinkedIn Thought Leader Outreach",
    description: "Connecting with industry influencers and thought leaders",
    status: "active",
    type: "linkedin",
    template: "cold_outreach",
    created_at: "2025-01-05T10:00:00Z",
    created_by: "user_jessica",
    updated_at: "2025-01-25T12:00:00Z",
    start_date: "2025-01-06T10:00:00Z",
    end_date: null,

    leads: {
      total_enrolled: 85,
      active: 77,
      paused: 2,
      completed: 6,
      unsubscribed: 0
    },

    sequences: {
      total_touches: 3,
      current_touch: "mixed",
      touches_config: [
        {touch: 1, channel: "linkedin", delay: 0, subject: "Connection request + personalized note"},
        {touch: 2, channel: "linkedin", delay: "5d", subject: "Thanks for connecting!"},
        {touch: 3, channel: "linkedin", delay: "10d", subject: "Collaboration opportunity"}
      ]
    },

    performance: {
      email: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        replied: 0,
        bounced: 0,
        unsubscribed: 0,
        spam_complaints: 0
      },
      rates: {
        send_rate: 0.90,
        delivery_rate: 1.0,
        open_rate: 0.0,
        click_rate: 0.0,
        reply_rate: 0.078,
        bounce_rate: 0.0,
        unsubscribe_rate: 0.0
      },
      conversion: {
        meetings_booked: 4,
        opportunities_created: 2,
        deals_closed: 0,
        revenue_generated: 0,
        conversion_rate: 0.024
      },
      engagement_score: "warm",
      performance_grade: "good"
    },

    settings: {
      send_time_optimization: true,
      timezone_aware: true,
      business_hours_only: true,
      daily_send_limit: 20,
      ab_testing_enabled: false,
      ab_variants: 0,
      stop_on_reply: true,
      stop_on_unsubscribe: true
    }
  },
  {
    id: "camp_010",
    name: "⚠️ Urgent: Low Engagement Fix Needed",
    description: "Campaign with severe engagement issues - needs immediate attention",
    status: "active",
    type: "email",
    template: "custom",
    created_at: "2025-01-18T09:00:00Z",
    created_by: "user_kevin",
    updated_at: "2025-01-25T15:00:00Z",
    start_date: "2025-01-18T10:00:00Z",
    end_date: null,

    leads: {
      total_enrolled: 200,
      active: 200,
      paused: 0,
      completed: 0,
      unsubscribed: 8
    },

    sequences: {
      total_touches: 5,
      current_touch: "touch_2",
      touches_config: [
        {touch: 1, channel: "email", delay: 0, subject: "Important update for {{company}}"},
        {touch: 2, channel: "email", delay: "3d", subject: "Did you see my email?"},
        {touch: 3, channel: "email", delay: "6d", subject: "Following up"},
        {touch: 4, channel: "email", delay: "9d", subject: "Quick question"},
        {touch: 5, channel: "email", delay: "12d", subject: "Final attempt"}
      ]
    },

    performance: {
      email: {
        sent: 200,
        delivered: 195,
        opened: 10,
        clicked: 2,
        replied: 0,
        bounced: 5,
        unsubscribed: 8,
        spam_complaints: 12
      },
      rates: {
        send_rate: 1.0,
        delivery_rate: 0.975,
        open_rate: 0.05,
        click_rate: 0.01,
        reply_rate: 0.0,
        bounce_rate: 0.025,
        unsubscribe_rate: 0.04
      },
      conversion: {
        meetings_booked: 0,
        opportunities_created: 0,
        deals_closed: 0,
        revenue_generated: 0,
        conversion_rate: 0.0
      },
      engagement_score: "frozen",
      performance_grade: "poor"
    },

    settings: {
      send_time_optimization: false,
      timezone_aware: false,
      business_hours_only: false,
      daily_send_limit: 200,
      ab_testing_enabled: false,
      ab_variants: 0,
      stop_on_reply: false,
      stop_on_unsubscribe: false
    }
  }
];

export const campaignTemplates = [
  'Cold Outreach',
  'Warm Intro',
  'Event Follow-up',
  'Trial Follow-up',
  'Re-engagement',
  'Custom'
];
