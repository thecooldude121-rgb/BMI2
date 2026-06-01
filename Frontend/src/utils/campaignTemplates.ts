export interface CampaignTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: 'email' | 'linkedin' | 'multi_channel';
  totalTouches: number;
  duration: number;
  perfectFor: string[];
  avgPerformance: {
    openRate: number;
    replyRate: number;
    conversionRate: number;
  };
  sequences: SequenceTouch[];
  stats?: {
    campaignsUsing: number;
    avgSuccessRate: number;
    bestFor: string;
    recommendedDailyLimit: number;
  };
}

export interface SequenceTouch {
  touchNumber: number;
  touchName: string;
  channel: 'email' | 'linkedin';
  delay: number;
  delayUnit: 'hours' | 'days';
  subjectLine: string;
  emailBody: string;
  linkedInMessage?: string;
  sendConditions?: string[];
  abTestingEnabled?: boolean;
  abVariants?: {
    variantA: {
      subjectLine: string;
      emailBody?: string;
    };
    variantB: {
      subjectLine: string;
      emailBody?: string;
    };
  };
}

export const campaignTemplates: CampaignTemplate[] = [
  {
    id: 'cold_outreach',
    name: 'Cold Outreach',
    icon: '📧',
    description: '5-touch sequence for new prospects',
    type: 'email',
    totalTouches: 5,
    duration: 14,
    perfectFor: [
      'New prospects',
      'Cold outreach',
      'Enterprise targets',
      'Wide-scale campaigns'
    ],
    avgPerformance: {
      openRate: 28,
      replyRate: 8,
      conversionRate: 4
    },
    stats: {
      campaignsUsing: 1247,
      avgSuccessRate: 28,
      bestFor: 'Cold prospects',
      recommendedDailyLimit: 50
    },
    sequences: [
      {
        touchNumber: 1,
        touchName: 'Initial Outreach',
        channel: 'email',
        delay: 0,
        delayUnit: 'days',
        subjectLine: 'Quick question about {{company}}\'s growth',
        emailBody: `Hi {{firstName}},

I noticed {{company}} recently {{hrmsSource}} and wanted to reach out.

We help {{industry}} companies like yours solve {{painPoint}} and achieve measurable results in {{timeline}}.

Would you be open to a quick 15-minute call next week to discuss how we can help {{company}} achieve similar results?

Best,
{{senderName}}`,
        abTestingEnabled: true,
        abVariants: {
          variantA: {
            subjectLine: 'Quick question about {{company}}\'s growth',
          },
          variantB: {
            subjectLine: '{{firstName}}, saw your recent post about {{company}}',
          }
        }
      },
      {
        touchNumber: 2,
        touchName: 'Follow-up',
        channel: 'email',
        delay: 3,
        delayUnit: 'days',
        subjectLine: 'Following up - {{firstName}}',
        emailBody: `Hi {{firstName}},

I wanted to follow up on my email from earlier this week about helping {{company}} with {{painPoint}}.

I know you're busy, so I'll keep this brief:

We've helped {{industry}} companies like {{company}} achieve:
- 40% increase in qualified leads
- 25% reduction in acquisition costs
- 3-6 month payback period

Would you have 15 minutes this week for a quick call?

Best,
{{senderName}}`,
        sendConditions: ['Touch 1 was opened']
      },
      {
        touchNumber: 3,
        touchName: 'Value Proposition',
        channel: 'email',
        delay: 5,
        delayUnit: 'days',
        subjectLine: 'Thought this might help {{company}}',
        emailBody: `Hi {{firstName}},

I came across this case study and immediately thought of {{company}}.

[Company similar to yours] faced the same {{painPoint}} challenge. Here's what they did:

📊 Challenge: Struggling with lead quality and conversion
✅ Solution: Implemented our platform in 2 weeks
🎯 Results: 3x increase in qualified opportunities in 90 days

I'd love to show you how {{company}} could achieve similar results.

Are you free for a 15-minute call this week?

Best,
{{senderName}}

P.S. - I can send over the full case study if you're interested.`,
      },
      {
        touchNumber: 4,
        touchName: 'Case Study',
        channel: 'email',
        delay: 2,
        delayUnit: 'days',
        subjectLine: 'How companies like {{company}} achieve results',
        emailBody: `Hi {{firstName}},

I wanted to share how companies in {{industry}} are solving {{painPoint}}:

🏢 [Similar Company 1]: 45% increase in pipeline in Q1
🏢 [Similar Company 2]: Reduced sales cycle by 30 days
🏢 [Similar Company 3]: 5x ROI in first 6 months

The common thread? They all started with a simple 15-minute discovery call.

Would you be open to exploring if this could work for {{company}}?

Best,
{{senderName}}`,
      },
      {
        touchNumber: 5,
        touchName: 'Break-up Email',
        channel: 'email',
        delay: 4,
        delayUnit: 'days',
        subjectLine: 'Should I close your file?',
        emailBody: `Hi {{firstName}},

I haven't heard back from you, so I'm assuming one of three things:

1. You're not interested (totally fine!)
2. You're too busy right now (I get it)
3. My emails are getting lost in your inbox (happens to the best of us)

If it's #1, just let me know and I'll stop bothering you.

If it's #2 or #3, would you like me to check back in a few months when things calm down?

Either way, I appreciate your time.

Best,
{{senderName}}

P.S. - If you do want to chat, here's my calendar link: [calendar link]`,
      }
    ]
  },

  {
    id: 'warm_introduction',
    name: 'Warm Introduction',
    icon: '🤝',
    description: '3-touch sequence for HRMS leads',
    type: 'email',
    totalTouches: 3,
    duration: 9,
    perfectFor: [
      'HRMS leads',
      'Referrals',
      'Warm introductions',
      'High-quality prospects'
    ],
    avgPerformance: {
      openRate: 55,
      replyRate: 20,
      conversionRate: 8.9
    },
    stats: {
      campaignsUsing: 823,
      avgSuccessRate: 55,
      bestFor: 'HRMS leads',
      recommendedDailyLimit: 30
    },
    sequences: [
      {
        touchNumber: 1,
        touchName: 'Welcome Message',
        channel: 'email',
        delay: 0,
        delayUnit: 'days',
        subjectLine: 'Welcome to {{company}}, {{firstName}}!',
        emailBody: `Hi {{firstName}},

Congratulations on joining {{company}} as {{title}}! 🎉

I saw the news about your new role and wanted to reach out. As someone who works with {{industry}} companies, I know the first 90 days in a new position can be both exciting and overwhelming.

I specialize in helping new {{title}}s at companies like {{company}} quickly ramp up and deliver early wins, specifically around {{painPoint}}.

Would you be open to a brief 15-minute call to share some insights that might help you hit the ground running?

No sales pitch - just sharing what's worked for others in your position.

Best,
{{senderName}}`,
      },
      {
        touchNumber: 2,
        touchName: 'Settling In Check',
        channel: 'email',
        delay: 2,
        delayUnit: 'days',
        subjectLine: 'Settling in at {{company}}?',
        emailBody: `Hi {{firstName}},

How's your second week at {{company}} going?

I wanted to follow up on my previous email about sharing some insights for new {{title}}s.

I've put together a quick resource guide specifically for people in your position at {{industry}} companies:

📋 30-60-90 Day Success Framework
🎯 Common Pitfalls to Avoid
✅ Quick Wins Checklist

Would you like me to send it over? No strings attached - just want to help you succeed in your new role.

Best,
{{senderName}}`,
        sendConditions: ['Touch 1 was opened']
      },
      {
        touchNumber: 3,
        touchName: 'Resource Share',
        channel: 'email',
        delay: 7,
        delayUnit: 'days',
        subjectLine: 'Quick resource for your new role',
        emailBody: `Hi {{firstName}},

I hope you're settling in well at {{company}}!

I wanted to share a resource that's been helpful for other {{title}}s I've worked with:

[Link to resource/case study]

This shows how someone in your exact position tackled {{painPoint}} and delivered measurable results in their first quarter.

If you'd like to discuss how this could apply to {{company}}'s situation, I'd be happy to jump on a quick call.

Either way, wishing you great success in your new role!

Best,
{{senderName}}`,
      }
    ]
  },

  {
    id: 're_engagement',
    name: 'Re-engagement',
    icon: '🔄',
    description: '4-touch win-back sequence',
    type: 'multi_channel',
    totalTouches: 4,
    duration: 24,
    perfectFor: [
      'Dormant leads (90+ days)',
      'Past prospects',
      'Win-back campaigns',
      'Cold leads'
    ],
    avgPerformance: {
      openRate: 18,
      replyRate: 5,
      conversionRate: 2
    },
    stats: {
      campaignsUsing: 512,
      avgSuccessRate: 18,
      bestFor: 'Dormant leads',
      recommendedDailyLimit: 75
    },
    sequences: [
      {
        touchNumber: 1,
        touchName: 'Re-introduction',
        channel: 'email',
        delay: 0,
        delayUnit: 'days',
        subjectLine: 'It\'s been a while, {{firstName}}...',
        emailBody: `Hi {{firstName}},

It's been a while since we last connected about {{company}}'s {{painPoint}}.

A lot has changed since then:

🚀 We've launched new features specifically for {{industry}} companies
📊 Our customers are seeing 2x better results than before
⚡ We can now get you up and running in half the time

I'm reaching out because I genuinely think {{company}} could benefit from these improvements.

Worth a conversation?

Best,
{{senderName}}`,
      },
      {
        touchNumber: 2,
        touchName: 'LinkedIn Connection',
        channel: 'linkedin',
        delay: 3,
        delayUnit: 'days',
        subjectLine: '',
        emailBody: '',
        linkedInMessage: `Hi {{firstName}},

I sent you an email a few days ago but wanted to connect here as well.

I'd love to catch up on what's happening at {{company}} and share some updates on our side that might be relevant to your {{painPoint}} challenges.

Worth a quick call?`,
        sendConditions: ['Touch 1 was not replied']
      },
      {
        touchNumber: 3,
        touchName: 'Exclusive Offer',
        channel: 'email',
        delay: 7,
        delayUnit: 'days',
        subjectLine: 'Last chance: {{company}} exclusive offer',
        emailBody: `Hi {{firstName}},

I wanted to give you one last heads up about an exclusive offer for {{industry}} companies.

We're offering a limited-time promotion:

🎁 50% off first 3 months
🚀 Priority onboarding (2-week implementation)
📊 Free custom analysis of your current {{painPoint}} situation

This offer expires in 7 days and we're limiting it to just 10 companies.

{{company}} would be a perfect fit. Interested in learning more?

Best,
{{senderName}}`,
      },
      {
        touchNumber: 4,
        touchName: 'Final Check-in',
        channel: 'email',
        delay: 14,
        delayUnit: 'days',
        subjectLine: 'Should I remove you from our list?',
        emailBody: `Hi {{firstName}},

I don't want to keep emailing you if you're not interested, so this will be my last message.

If you'd like me to:

✅ Keep you in the loop about {{industry}}-specific updates → Just reply "Yes"
❌ Remove you from our list entirely → Reply "No thanks"
⏸️ Check back in 6 months → Reply "Later"

Thanks for your time, and I wish you and {{company}} all the best!

Best,
{{senderName}}`,
      }
    ]
  },

  {
    id: 'event_followup',
    name: 'Event Follow-up',
    icon: '🎤',
    description: '3-touch post-event sequence',
    type: 'linkedin',
    totalTouches: 3,
    duration: 10,
    perfectFor: [
      'Conference leads',
      'Webinar attendees',
      'Event networking',
      'Trade show contacts'
    ],
    avgPerformance: {
      openRate: 0,
      replyRate: 12,
      conversionRate: 5
    },
    stats: {
      campaignsUsing: 389,
      avgSuccessRate: 35,
      bestFor: 'Event contacts',
      recommendedDailyLimit: 25
    },
    sequences: [
      {
        touchNumber: 1,
        touchName: 'Event Connection',
        channel: 'linkedin',
        delay: 0,
        delayUnit: 'days',
        subjectLine: '',
        emailBody: '',
        linkedInMessage: `Hi {{firstName}},

Great meeting you at [Event Name]! I really enjoyed our conversation about {{painPoint}} at {{company}}.

I'd love to continue the discussion and share some ideas that might help with the challenges you mentioned.

Would you be open to a 15-minute call next week?

Best,
{{senderName}}`,
      },
      {
        touchNumber: 2,
        touchName: 'Value Follow-up',
        channel: 'linkedin',
        delay: 3,
        delayUnit: 'days',
        subjectLine: '',
        emailBody: '',
        linkedInMessage: `Hi {{firstName}},

Following up on our conversation at [Event Name] about {{company}}'s {{painPoint}} challenges.

I put together a quick deck showing how we've helped {{industry}} companies solve similar issues. Would you like me to send it over?

Also happy to jump on a quick call if that's easier.

Best,
{{senderName}}`,
        sendConditions: ['Touch 1 was viewed']
      },
      {
        touchNumber: 3,
        touchName: 'Meeting Request',
        channel: 'linkedin',
        delay: 7,
        delayUnit: 'days',
        subjectLine: '',
        emailBody: '',
        linkedInMessage: `Hi {{firstName}},

I know things get busy after conferences, but I didn't want to lose touch!

Based on what you shared about {{company}}'s goals around {{painPoint}}, I think we could add real value.

Would you have 15 minutes this week or next for a brief call? Here's my calendar: [link]

Looking forward to reconnecting!

Best,
{{senderName}}`,
      }
    ]
  },

  {
    id: 'trial_followup',
    name: 'Trial Follow-up',
    icon: '🎯',
    description: '5-touch nurture sequence',
    type: 'email',
    totalTouches: 5,
    duration: 14,
    perfectFor: [
      'Demo attendees',
      'Free trial users',
      'Product trials',
      'POC participants'
    ],
    avgPerformance: {
      openRate: 42,
      replyRate: 15,
      conversionRate: 6
    },
    stats: {
      campaignsUsing: 654,
      avgSuccessRate: 42,
      bestFor: 'Trial users',
      recommendedDailyLimit: 40
    },
    sequences: [
      {
        touchNumber: 1,
        touchName: 'Thank You',
        channel: 'email',
        delay: 0,
        delayUnit: 'hours',
        subjectLine: 'Thanks for attending our demo, {{firstName}}!',
        emailBody: `Hi {{firstName}},

Thank you for taking the time to attend our product demo today!

I've attached:
- Demo recording for your reference
- One-page feature overview
- Implementation timeline for {{company}}

Based on our conversation, I think the [specific feature] would be particularly valuable for addressing {{painPoint}}.

Do you have any questions I can answer?

Best,
{{senderName}}`,
      },
      {
        touchNumber: 2,
        touchName: 'Recording Share',
        channel: 'email',
        delay: 1,
        delayUnit: 'days',
        subjectLine: 'Your personalized demo recording',
        emailBody: `Hi {{firstName}},

I've prepared a personalized recording highlighting the features most relevant to {{company}}:

🎥 [Demo Recording Link]

Key timestamps:
- 2:15 - Solution for {{painPoint}}
- 5:30 - {{industry}}-specific use cases
- 8:45 - Integration with your existing tools
- 12:00 - Pricing and implementation timeline

Any questions as you review it?

Best,
{{senderName}}`,
      },
      {
        touchNumber: 3,
        touchName: 'Check-in',
        channel: 'email',
        delay: 3,
        delayUnit: 'days',
        subjectLine: 'Quick question about {{company}}\'s needs',
        emailBody: `Hi {{firstName}},

I wanted to check in and see if you had a chance to review the demo recording.

A few questions to help me better understand {{company}}'s situation:

1. What's your current timeline for addressing {{painPoint}}?
2. Who else should be involved in the evaluation process?
3. What would a successful outcome look like for {{company}}?

Would you have 15 minutes this week to discuss?

Best,
{{senderName}}`,
        sendConditions: ['Touch 2 was opened']
      },
      {
        touchNumber: 4,
        touchName: 'Case Study',
        channel: 'email',
        delay: 7,
        delayUnit: 'days',
        subjectLine: 'Case study: How {{industry}} companies use our platform',
        emailBody: `Hi {{firstName}},

I thought you'd find this case study interesting:

[Similar Company] faced the same {{painPoint}} challenge as {{company}}.

Their results after 90 days:
📈 40% increase in efficiency
💰 $250K cost savings
⚡ 2-week implementation time

They started exactly where {{company}} is now.

Would you like to discuss how {{company}} could achieve similar results?

Best,
{{senderName}}`,
      },
      {
        touchNumber: 5,
        touchName: 'Decision Point',
        channel: 'email',
        delay: 10,
        delayUnit: 'days',
        subjectLine: 'Ready to move forward, {{firstName}}?',
        emailBody: `Hi {{firstName}},

I wanted to follow up one last time about {{company}}'s evaluation.

Based on our demo and conversations, I believe we can help you:
- Solve {{painPoint}}
- Achieve results in {{timeline}}
- Stay within {{budget}} budget

Next steps if you'd like to move forward:
1. 30-min scoping call this week
2. Detailed proposal by end of week
3. Start implementation next month

Does this timeline work for {{company}}?

Best,
{{senderName}}`,
      }
    ]
  },

  {
    id: 'custom_blank',
    name: 'Start from Scratch',
    icon: '✨',
    description: 'Build your own custom sequence',
    type: 'email',
    totalTouches: 0,
    duration: 0,
    perfectFor: [
      'Unique campaigns',
      'Custom workflows',
      'A/B testing',
      'Specialized outreach'
    ],
    avgPerformance: {
      openRate: 0,
      replyRate: 0,
      conversionRate: 0
    },
    sequences: []
  }
];

export const getTemplateById = (id: string): CampaignTemplate | undefined => {
  return campaignTemplates.find(template => template.id === id);
};

export const getTemplateNames = (): string[] => {
  return campaignTemplates.map(template => template.name);
};

export const personalizationVariables = [
  { variable: '{{firstName}}', description: 'Lead first name', example: 'John' },
  { variable: '{{lastName}}', description: 'Lead last name', example: 'Smith' },
  { variable: '{{company}}', description: 'Company name', example: 'Acme Corp' },
  { variable: '{{title}}', description: 'Job title', example: 'VP of Sales' },
  { variable: '{{industry}}', description: 'Company industry', example: 'SaaS' },
  { variable: '{{companySize}}', description: 'Number of employees', example: '250' },
  { variable: '{{painPoint}}', description: 'From BANT Need assessment', example: 'lead generation' },
  { variable: '{{budget}}', description: 'From BANT Budget', example: '$50K-$100K' },
  { variable: '{{timeline}}', description: 'From BANT Timeline', example: 'Q2 2025' },
  { variable: '{{hrmsSource}}', description: 'HRMS placement details', example: 'hired a new VP of Sales' },
  { variable: '{{senderName}}', description: 'Campaign sender name', example: 'Adithya' },
  { variable: '{{senderTitle}}', description: 'Campaign sender title', example: 'Product Manager' },
  { variable: '{{senderEmail}}', description: 'Campaign sender email', example: 'adithya@movingwalls.com' },
  { variable: '{{senderPhone}}', description: 'Campaign sender phone', example: '+1 (555) 123-4567' }
];
