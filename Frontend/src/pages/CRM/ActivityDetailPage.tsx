import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Video,
  Phone,
  Mail,
  Edit,
  Trash2,
  Calendar,
  ExternalLink,
  Users,
  Building2,
  User,
  FileText,
  Download,
  Share2,
  Plus,
  Clock,
  MapPin,
  CheckCircle,
  TrendingUp,
  Sparkles,
  Send,
  ClipboardList,
  Upload,
  ChevronRight,
  AlertCircle,
  Zap,
  Play,
  ArrowUp,
  ArrowDown,
  Smile,
  BarChart3,
  RefreshCw,
  Pin,
  MessageSquare,
  Link,
  Tag,
  X,
  Eye,
  Paperclip,
  Target,
  Star,
} from 'lucide-react';

// Comprehensive mock data for all activity types
const getMockActivity = (id: string) => {
  const activityData: Record<string, any> = {
    'ACT-2025-001': {
      id: 'ACT-2025-001',
      type: 'meeting',
      title: 'TechStart Discovery Call',
      date: 'December 7, 2025',
      time: '2:00 PM - 2:30 PM',
      duration: '30 minutes',
      status: 'upcoming',
      timeUntil: 'in 3 hours',
      location: 'Zoom Meeting Link',
      zoomLink: 'https://zoom.us/j/123456789',
      owner: 'Alex Rodriguez',
      createdBy: 'Alex Rodriguez',
      createdAt: 'Dec 3, 2025 at 10:15 AM',
      lastModified: 'Dec 6, 2025 at 4:30 PM',
      lastModifiedBy: 'Alex Rodriguez',
      source: 'HRMS (Warm intro)',
      sourceJourney: 'HRMS (Warm intro) → Contact → Deal → Activity',
      attendees: [
        { name: 'Sarah Lee', company: 'TechStart Inc', role: 'CFO' },
        { name: 'Alex Rodriguez', company: 'BMI CRM', role: 'Account Executive' },
      ],
      relatedDeal: {
        id: 'deal_techstart_001',
        name: 'TechStart Inc',
        value: '$42,000',
        stage: 'Negotiation',
        probability: '92%',
        closeDate: 'Jan 15, 2026',
        health: 'Excellent',
      },
      primaryContact: {
        id: 'contact_sarah_lee',
        name: 'Sarah Lee',
        title: 'CFO at TechStart Inc',
        email: 'sarah.lee@techstart.com',
        phone: '+1 (555) 234-5678',
        lastContact: 'Dec 5 (2 days ago)',
      },
      account: {
        id: 'account_techstart',
        name: 'TechStart Inc',
        industry: 'SaaS',
        size: '45 employees',
        location: 'San Francisco, CA',
        totalActivities: 15,
      },
      hrmsConnection: {
        connected: true,
        employeeName: 'Sarah Lee',
        employeeRole: 'CFO',
        recruitedDate: 'November 14, 2024',
        daysAgo: '23 days ago',
        recruiter: 'Jennifer Kim (BMI Recruitment)',
        advantages: [
          '33% higher close rate',
          '2-hour avg response time',
          '92% success rate',
        ],
        activityCompletion: '100% (15 of 15 activities completed)',
      },
      agenda: [
        'Review enterprise plan proposal',
        'Discuss implementation timeline (onboarding, migration, training)',
        'Address Salesforce integration questions',
        'Review pricing and contract',
        'Q1 2026 launch timeline',
        'Next steps and CEO approval',
      ],
      attachments: [
        {
          name: 'TechStart_Proposal_v2.pdf',
          size: '2.4 MB',
          uploadedBy: 'Alex Rodriguez',
          uploadedAt: 'Dec 6, 4:30 PM',
          type: 'pdf',
        },
        {
          name: 'Implementation_Timeline.xlsx',
          size: '156 KB',
          uploadedBy: 'Alex Rodriguez',
          uploadedAt: 'Dec 6, 4:45 PM',
          type: 'excel',
        },
      ],
      aiFeatures: {
        noteTaker: true,
        autoRecording: true,
        autoTranscription: true,
        crmAutoUpdate: true,
      },
      relatedActivities: [
        {
          type: 'email',
          date: 'Dec 5, 3:15 PM',
          title: 'Warm intro',
          status: 'Replied in 1h 20m',
          contact: 'Sarah Lee',
        },
        {
          type: 'call',
          date: 'Dec 3, 10:00 AM',
          title: 'Initial outreach',
          status: 'Positive outcome',
          contact: 'Sarah Lee',
        },
        {
          type: 'lead',
          date: 'Nov 28',
          title: 'Lead created',
          status: 'Qualified',
          contact: 'TechStart Inc',
        },
      ],
      history: [
        {
          action: 'Added Implementation_Timeline.xlsx',
          user: 'Alex Rodriguez',
          time: 'Dec 6, 4:45 PM',
          attachment: 'Implementation_Timeline.xlsx',
          details: 'Added detailed 90-day implementation timeline showing milestones, deliverables, and resource allocation. File size: 245 KB.',
        },
        {
          action: 'Added TechStart_Proposal_v2.pdf',
          user: 'Alex Rodriguez',
          time: 'Dec 6, 4:30 PM',
          attachment: 'TechStart_Proposal_v2.pdf',
          details: 'Updated proposal with custom pricing for 45-seat license and added case studies from similar SaaS companies. File size: 4.8 MB.',
        },
        {
          action: 'Updated agenda (added CEO approval)',
          user: 'Alex Rodriguez',
          time: 'Dec 6, 4:15 PM',
          details: 'Added new agenda item: "Discuss board approval timeline and requirements" based on CFO\'s feedback that CEO sign-off is needed for deals over $40K.',
        },
        {
          action: 'Enabled AI features',
          user: 'Alex Rodriguez',
          time: 'Dec 5, 5:20 PM',
          details: 'Activated AI Note Taker, Auto Recording, Auto Transcription, and CRM Auto-Update features for this meeting. Zoom AI Companion integration configured.',
        },
        {
          action: 'Created meeting',
          user: 'Alex Rodriguez',
          time: 'Dec 3, 10:15 AM',
          details: 'Meeting scheduled following positive initial call. Set for 30-minute discovery session to discuss TechStart\'s workflow automation needs and HRMS integration opportunities.',
        },
      ],
    },
    'ACT-2025-002': {
      id: 'ACT-2025-002',
      type: 'call',
      title: 'BigCo Enterprise Follow-up Call',
      date: 'December 7, 2025',
      time: '11:30 AM',
      duration: '15 minutes',
      status: 'completed',
      owner: 'Sarah Chen',
      createdBy: 'Sarah Chen',
      createdAt: 'Dec 7, 2025 at 11:15 AM',
      lastModified: 'Dec 7, 2025 at 11:50 AM',
      lastModifiedBy: 'Sarah Chen',
      source: 'Lead Gen (Apollo.io)',
      sourceJourney: 'Lead Gen (Apollo.io) → Lead → Contact → Deal → Activity',
      phoneNumber: '+1 (555) 789-0123',
      callDirection: 'outbound',
      callOutcome: 'positive',
      callStatus: 'connected',
      aiAnalysis: {
        sentiment: 'Positive',
        sentimentScore: 82,
        engagementLevel: 'High',
        keyTopics: ['Integration', 'Pricing', 'Board meeting'],
        urgency: 'High (board meeting Dec 15)',
        buyingSignals: 'Strong',
      },
      relatedDeal: {
        id: 'deal_bigco_001',
        name: 'BigCo Enterprise',
        value: '$75,000',
        stage: 'Proposal',
        previousStage: 'Negotiation',
        probability: '85%',
        previousProbability: '78%',
        change: '+7 points',
        closeDate: 'February 28, 2026',
        health: 'Good',
        justMoved: true,
      },
      primaryContact: {
        id: 'contact_mike_chen',
        name: 'Mike Chen',
        title: 'CTO at BigCo Enterprise',
        email: 'mike.chen@bigco.com',
        phone: '+1 (555) 789-0123',
        lastContact: 'Today (30 minutes ago)',
        responseRate: '88%',
        avgResponseTime: '2 hours',
      },
      account: {
        id: 'account_bigco',
        name: 'BigCo Enterprise',
        industry: 'Enterprise Tech',
        size: '250 employees',
        location: 'New York, NY',
        hrmsConnection: 'Partial',
        hrmsCount: 2,
        hrmsNote: '2 employees recruited 2023-2024',
        totalActivities: 14,
      },
      callNotes: {
        summary: "Discussed BigCo's integration requirements and timeline. Mike confirmed they need detailed pricing breakdown by Monday for board presentation.",
        keyPoints: [
          'Integration timeline: 6-8 weeks',
          'Pricing: Need breakdown by department',
          'Board meeting: December 15',
          'Decision maker: CFO approval required',
          'Competition: Currently using Salesforce (too expensive)',
        ],
        concerns: [
          'Data migration complexity',
          'Training requirements',
          'API integration with existing systems',
        ],
        actionItems: [
          {
            text: 'Send detailed pricing by Monday',
            status: 'created',
            dueDate: 'Dec 8',
            assignee: 'Sarah Chen',
          },
          {
            text: 'Prepare integration doc',
            status: 'created',
            dueDate: 'Dec 10',
            assignee: 'Sarah Chen',
          },
          {
            text: 'Schedule board prep meeting',
            status: 'pending',
            dueDate: null,
            note: "Pending Mike's availability",
          },
        ],
        nextSteps: 'Follow up Tuesday after board meeting to discuss feedback and next steps.',
      },
      aiInsights: [
        'Positive sentiment (82%)',
        'High urgency - board meeting soon',
        'Strong buying signals detected',
        'Recommended: Fast turnaround on pricing',
      ],
      crmAutoUpdates: [
        {
          type: 'deal_stage',
          label: 'Deal stage changed',
          from: 'Negotiation',
          to: 'Proposal',
          time: '11:45 AM',
        },
        {
          type: 'deal_probability',
          label: 'Deal probability updated',
          from: '78%',
          to: '85%',
          change: '+7 points',
          time: '11:45 AM',
        },
        {
          type: 'tasks_created',
          label: 'Tasks created',
          items: [
            'Send pricing breakdown (Due: Monday, Dec 8)',
            'Prepare integration doc (Due: Tuesday, Dec 10)',
          ],
        },
        {
          type: 'next_contact',
          label: 'Next contact date set',
          date: 'Tuesday, Dec 16 (after board)',
        },
        {
          type: 'deal_notes',
          label: 'Deal notes updated with',
          items: [
            'Board meeting Dec 15',
            'CFO approval required',
            'Competing with Salesforce',
          ],
        },
      ],
      recording: {
        available: true,
        duration: '15:32 minutes',
        size: '8.4 MB',
        format: 'MP3',
        transcript: true,
        keyMoments: [
          { time: '02:15', topic: 'Pricing discussion' },
          { time: '08:30', topic: 'Board meeting mentioned' },
          { time: '12:45', topic: 'Next steps agreed' },
        ],
      },
      relatedActivities: [
        {
          type: 'meeting',
          date: 'Dec 4, 3:00 PM',
          title: 'BigCo Technical Demo',
          status: 'Completed',
          contact: 'Mike Chen',
        },
        {
          type: 'email',
          date: 'Nov 30, 9:00 AM',
          title: 'Initial proposal sent',
          status: 'Opened 5x',
          contact: 'Mike Chen',
        },
        {
          type: 'call',
          date: 'Nov 28',
          title: 'Discovery call',
          status: 'Positive',
          contact: 'Mike Chen',
        },
      ],
      history: [
        {
          action: 'Marked call as complete',
          user: 'Sarah Chen',
          time: 'Dec 7, 11:50 AM',
          details: 'Call duration: 15 minutes. Outcome: Positive - CEO expressed strong interest. Next steps: Follow up with technical demo scheduled for next week.',
        },
        {
          action: 'System auto-updated deal stage (Negotiation → Proposal)',
          user: 'System',
          time: 'Dec 7, 11:45 AM',
          details: 'Deal stage automatically moved from Negotiation to Proposal based on key phrases detected: "send me a formal proposal" and "board meeting next week". Probability updated to 85%.',
        },
        {
          action: 'Added call notes',
          user: 'Sarah Chen',
          time: 'Dec 7, 11:45 AM',
          attachment: 'BigCo_Call_Notes_Dec7.pdf',
          details: 'Comprehensive call notes covering: key discussion points, decision timeline, budget approval process, and competitive landscape. Includes action items for both parties.',
        },
        {
          action: 'Started call (Outbound to +1 (555) 789-0123)',
          user: 'Sarah Chen',
          time: 'Dec 7, 11:30 AM',
          details: 'Outbound call placed to Mike Chen (CEO) at BigCo Inc. Call connected after 2 rings. Location: Office (San Francisco, CA). Device: Desk phone.',
        },
        {
          action: 'Created this activity',
          user: 'Sarah Chen',
          time: 'Dec 7, 11:15 AM',
          details: 'Call scheduled as follow-up to technical demo from Dec 4. Purpose: Discuss pricing, implementation timeline, and board approval process.',
        },
      ],
    },
    'ACT-2025-003': {
      id: 'ACT-2025-003',
      type: 'email',
      title: 'Proposal sent to Acme Corp',
      date: 'December 7, 2025',
      time: '9:45 AM',
      status: 'sent',
      owner: 'Alex Rodriguez',
      createdBy: 'Alex Rodriguez',
      createdAt: 'Dec 7, 2025 at 9:30 AM',
      lastModified: 'Dec 7, 2025 at 9:45 AM',
      lastModifiedBy: 'Alex Rodriguez',
      source: 'Lead Gen (Apollo.io)',
      sourceJourney: 'Lead Gen (Apollo.io) → Lead → Contact → Deal → Activity',
      emailDetails: {
        from: 'alex.rodriguez@bmi.com',
        to: 'john.smith@acmecorp.com',
        cc: 'sarah.chen@bmi.com',
        bcc: null,
        subject: 'Acme Corp - Enterprise Plan Proposal',
      },
      emailTracking: {
        delivered: { status: true, time: 'Dec 7, 9:45 AM' },
        opens: [
          {
            number: 1,
            time: 'Dec 7, 10:23 AM',
            timeSince: '38 min after sent',
            duration: '4 minutes',
          },
          {
            number: 2,
            time: 'Dec 7, 2:15 PM',
            timeSince: '4h 30m after sent',
            duration: '12 minutes',
          },
          {
            number: 3,
            time: 'Dec 7, 3:45 PM',
            timeSince: '6h after sent',
            duration: '6 minutes',
          },
        ],
        totalOpens: 3,
        totalReadTime: '22 minutes',
        avgReadTime: '7 minutes per open',
        attachmentsTracking: [
          {
            name: 'Acme_Corp_Proposal_Enterprise.pdf',
            size: '3.2 MB',
            opened: true,
            openedAt: 'Dec 7, 10:25 AM',
            openDelay: '2 min after email open',
            readTime: '5 minutes',
          },
          {
            name: 'SaaS_Case_Studies.pdf',
            size: '1.8 MB',
            opened: false,
            openedAt: null,
          },
        ],
      },
      engagementScore: {
        level: 'High',
        stars: 5,
        replyProbability: 78,
        successRate: '78% reply rate for similar patterns',
      },
      relatedDeal: {
        id: 'deal_acme_001',
        name: 'Acme Corp',
        value: '$50,000',
        stage: 'Proposal',
        probability: '78%',
        closeDate: 'March 15, 2026',
        daysInStage: 1,
        health: 'Good',
      },
      primaryContact: {
        id: 'contact_john_smith',
        name: 'John Smith',
        title: 'Director of Operations at Acme Corp',
        email: 'john.smith@acmecorp.com',
        phone: '+1 (555) 345-6789',
        lastContact: 'Today (email)',
        responseRate: '85%',
        avgResponseTime: '4 hours',
      },
      account: {
        id: 'account_acme',
        name: 'Acme Corp',
        industry: 'SaaS',
        size: '75 employees',
        location: 'Austin, TX',
        hrmsConnection: 'No',
        totalActivities: 18,
      },
      emailContent: `Hi John,

Thank you for the productive demo session yesterday. As promised, I've attached our enterprise plan proposal tailored specifically for Acme Corp's needs.

Key highlights:
- Enterprise Plan: $50,000/year
- Salesforce integration included
- Implementation: 6-8 weeks
- ROI projection: 240% in first year

I've also included case studies from similar organizations in the SaaS space who achieved significant results within Q1 of deployment.

Let's schedule a call to address any questions and discuss the technical integration details your team needs.

Best regards,
Alex Rodriguez
Senior Account Executive
BMI CRM
alex.rodriguez@bmi.com
(555) 123-4567`,
      attachments: [
        {
          name: 'Acme_Corp_Proposal_Enterprise.pdf',
          size: '3.2 MB',
          type: 'pdf',
          sent: 'Dec 7, 9:45 AM',
          status: 'opened',
          openedAt: 'Dec 7, 10:25 AM',
          readTime: '5 minutes',
        },
        {
          name: 'SaaS_Case_Studies.pdf',
          size: '1.8 MB',
          type: 'pdf',
          sent: 'Dec 7, 9:45 AM',
          status: 'not_opened',
          openedAt: null,
        },
      ],
      aiInsights: [
        'High engagement - Good sign!',
        '3 opens indicates strong interest',
        '22 min total read time = thorough review',
        'Attachment opened = serious consideration',
        'Similar patterns → 78% reply rate',
      ],
      aiRecommendations: [
        'Follow up with call tomorrow (Optimal time: 10-11 AM)',
        'Reference specific proposal sections they reviewed longest',
      ],
      aiTiming: 'John typically responds within 4-6 hours. Follow up if no reply by 2 PM Monday.',
      relatedActivities: [
        {
          type: 'meeting',
          date: 'Dec 6, 2:00 PM',
          title: 'Acme Product Demo',
          status: 'Completed, AI Summary available',
          contact: 'John Smith',
        },
        {
          type: 'task',
          date: 'Dec 6, 4:30 PM',
          title: 'Prepare proposal',
          status: 'Completed on time',
          contact: 'John Smith',
        },
        {
          type: 'email',
          date: 'Dec 5, 10:00 AM',
          title: 'Follow-up email',
          status: 'Opened 2x',
          contact: 'John Smith',
        },
      ],
      history: [
        {
          action: 'Email opened (3rd time), Read duration: 6 minutes',
          user: 'John Smith (recipient)',
          time: 'Dec 7, 3:45 PM',
        },
        {
          action: 'Email opened (2nd time), Read duration: 12 minutes',
          user: 'John Smith (recipient)',
          time: 'Dec 7, 2:15 PM',
        },
        {
          action: 'Attachment opened: "Acme_Corp_Proposal_Enterprise.pdf"',
          user: 'John Smith (recipient)',
          time: 'Dec 7, 10:25 AM',
          attachment: 'Acme_Corp_Proposal_Enterprise.pdf',
          details: 'Recipient spent 5 minutes reviewing the proposal document. Strong engagement signal indicating serious consideration.',
        },
        {
          action: 'Email opened (1st time), Read duration: 4 minutes',
          user: 'John Smith (recipient)',
          time: 'Dec 7, 10:23 AM',
          details: 'First open occurred 38 minutes after delivery. IP location: Austin, TX (office). Device: Desktop.',
        },
        {
          action: 'Email delivered to john.smith@acmecorp.com',
          user: 'System',
          time: 'Dec 7, 9:45 AM',
        },
        {
          action: 'Sent this email with 2 attachments',
          user: 'Alex Rodriguez',
          time: 'Dec 7, 9:45 AM',
          details: 'Attachments: Acme_Corp_Proposal_Enterprise.pdf (3.2 MB), SaaS_Case_Studies.pdf (1.8 MB). Total email size: 5.0 MB.',
        },
        {
          action: 'Created this activity',
          user: 'Alex Rodriguez',
          time: 'Dec 7, 9:30 AM',
        },
      ],
    },
    'ACT-2025-008': {
      id: 'ACT-2025-008',
      type: 'task',
      title: 'InnovateLabs Follow-up Call',
      dueDate: 'December 5, 2025 at 11:00 AM',
      status: 'overdue',
      daysOverdue: 2,
      priority: 'high',
      owner: 'Mike Johnson',
      assignedTo: 'Mike Johnson',
      createdBy: 'Mike Johnson',
      createdAt: 'Nov 30, 2025 at 3:00 PM',
      lastModified: 'Dec 2, 2025 at 9:15 AM',
      lastModifiedBy: 'Mike Johnson',
      source: 'Lead Gen',
      sourceJourney: 'Lead Gen → Lead → Contact → Deal → Activity',
      taskType: 'Follow-up Call',
      originalDue: 'Dec 5, 2025 at 11:00 AM',
      remindersSent: 3,
      reminderDates: ['Dec 5', 'Dec 6', 'Dec 7'],
      riskAlert: {
        level: 'critical',
        title: 'DEAL AT RISK - IMMEDIATE ACTION REQUIRED',
        factors: [
          'No activity in 7 days (Last contact: Nov 30)',
          'Task 5 days overdue (Original due: Dec 5)',
          'Deal health dropped 16 points (Was 74% → Now 58%)',
        ],
        statistics: {
          similarDelays: '65% deal loss rate',
          avgRecoveryTime: '2-3 days',
          currentStage: 'Qualified',
          daysWithoutContact: 7,
        },
        recoveryActions: [
          'Contact immediately (TODAY)',
          'Send case study to re-engage',
          'Offer value (webinar/demo)',
          'Set follow-up in 2-3 days',
        ],
      },
      relatedDeal: {
        id: 'deal_innovate_001',
        name: 'InnovateLabs',
        value: '$38,000',
        stage: 'Qualified',
        probability: '58%',
        previousProbability: '74%',
        change: '-16 points',
        closeDate: 'February 1, 2026',
        daysSinceActivity: 7,
        health: 'At Risk',
        warning: 'Deal cooling off rapidly - Contact urgently!',
      },
      primaryContact: {
        id: 'contact_david_park',
        name: 'David Park',
        title: 'CEO at InnovateLabs',
        email: 'david.park@innovate.io',
        phone: '+1 (555) 456-7890',
        lastContact: 'Nov 30 (7 days ago!)',
        responseRate: '90%',
        typicalResponse: '3-4 hours',
      },
      account: {
        id: 'account_innovate',
        name: 'InnovateLabs',
        industry: 'AI/ML Technology',
        size: '35 employees',
        location: 'Seattle, WA',
        hrmsConnection: 'No',
        totalActivities: 8,
        lastActivity: 'Nov 30',
      },
      description: `Follow up with David Park at InnovateLabs regarding our discovery call on Nov 30.

Discussion points:
- Demo went very well
- David was enthusiastic about AI features
- Mentioned board approval needed
- Timeline: Q1 2026

Action Items:
✓ Send follow-up email with case study (waiting for response)
⏳ Schedule technical demo
⏳ Get pricing approval from David

Notes from last call (Nov 30):
David mentioned they're evaluating 2-3 solutions. Need to maintain momentum to stay top of mind.

⚠️ CRITICAL: Follow up ASAP or risk losing deal to competitor!`,
      checklist: [
        {
          item: 'Send post-demo thank you',
          status: 'completed',
          completedAt: 'Nov 30, 3:00 PM',
        },
        {
          item: 'Prepare case study',
          status: 'completed',
          completedAt: 'Dec 1, 10:00 AM',
        },
        {
          item: 'Call David for follow-up',
          status: 'overdue',
          note: 'OVERDUE (5 days)',
        },
        {
          item: 'Schedule technical demo',
          status: 'blocked',
          note: 'Blocked (waiting on call)',
        },
      ],
      relatedActivities: [
        {
          type: 'meeting',
          date: 'Nov 30, 2:00 PM',
          title: 'Discovery Call',
          status: 'Went well',
          contact: 'David Park',
        },
        {
          type: 'email',
          date: 'Nov 25, 10:00 AM',
          title: 'Initial outreach',
          status: 'Opened 2x',
          contact: 'David Park',
        },
        {
          type: 'lead',
          date: 'Nov 22',
          title: 'Lead created',
          status: 'Qualified',
          contact: 'InnovateLabs',
        },
      ],
      aiRecommendations: [
        {
          priority: 'urgent',
          icon: '📞',
          action: 'Call David Park immediately',
          button: 'Call Now',
        },
        {
          priority: 'urgent',
          icon: '📧',
          action: 'Send case study (already prepared)',
          button: 'Send Now',
        },
        {
          priority: 'high',
          icon: '🗓️',
          action: 'Offer demo webinar this week',
          button: 'Schedule',
        },
        {
          priority: 'medium',
          icon: '⚠️',
          action: 'If no response, escalate to manager',
          button: 'Escalate',
        },
      ],
      aiStrategy: 'Call first (highest success rate). If voicemail, send email with case study within 1 hour.',
      history: [
        {
          action: 'System sent 3rd overdue reminder to Mike Johnson',
          user: 'System',
          time: 'Dec 7, 9:00 AM',
        },
        {
          action: 'System sent 2nd overdue reminder',
          user: 'System',
          time: 'Dec 6, 9:00 AM',
        },
        {
          action: 'Task became overdue, System sent 1st reminder',
          user: 'System',
          time: 'Dec 5, 11:00 AM',
        },
        {
          action: 'Updated priority (Medium → High)',
          user: 'Mike Johnson',
          time: 'Dec 2, 9:15 AM',
          details: 'Priority increased due to deal risk factors and upcoming board meeting.',
        },
        {
          action: 'Completed checklist "Prepare case study"',
          user: 'Mike Johnson',
          time: 'Dec 1, 10:00 AM',
          attachment: 'InnovateLabs_Case_Study.pdf',
        },
        {
          action: 'Created this task (Due: Dec 5, 11:00 AM, Priority: Medium)',
          user: 'Mike Johnson',
          time: 'Nov 30, 3:00 PM',
          details: 'Task created following discovery meeting. Initial priority set to Medium based on deal stage.',
        },
      ],
    },
    'ACT-2025-006': {
      id: 'ACT-2025-006',
      type: 'note',
      title: 'StartCo Competitor Research',
      date: 'December 6, 2025 at 10:00 AM',
      status: 'internal',
      visibility: 'Internal Only',
      visibilityNote: 'not visible to contact/account',
      category: 'Competitor Research',
      tags: ['#competitors', '#pricing', '#startco', '#research'],
      pinned: false,
      sharedWith: 'Sales Team (12 people)',
      owner: 'Mike Johnson',
      createdBy: 'Mike Johnson',
      createdAt: 'Dec 6, 2025 at 10:00 AM',
      lastModified: 'Dec 6, 2025 at 2:30 PM',
      lastModifiedBy: 'Mike Johnson',
      source: 'Manual Entry',
      sourceJourney: 'Manual Research Note',
      relatedDeal: {
        id: 'deal_startco_001',
        name: 'StartCo',
        value: '$28,000',
        stage: 'Qualified',
        probability: '72%',
        closeDate: 'January 30, 2026',
        health: 'Good',
      },
      primaryContact: {
        id: 'contact_lisa_martinez',
        name: 'Lisa Martinez',
        title: 'Product Manager at StartCo',
        email: 'lisa.m@startco.io',
        phone: '+1 (555) 567-8901',
        lastContact: 'Dec 5',
      },
      account: {
        id: 'account_startco',
        name: 'StartCo',
        industry: 'Project Management',
        size: '25 employees',
        location: 'Denver, CO',
        hrmsConnection: 'No',
        totalActivities: 7,
      },
      content: `Research on StartCo's current tools and evaluation criteria:

CURRENT TOOLS:
- ClickUp (project management)
- Monday.com (workflow automation)
- Spreadsheets (reporting - manual)

PAIN POINTS IDENTIFIED:
✓ Tools not integrated (data silos)
✓ Manual reporting (time-consuming)
✓ No AI/automation capabilities
✓ Limited customization
✓ Scaling issues as team grows

BUDGET CONSIDERATIONS:
- Current spend: ~$3K/year total
- Budget concern: Growth stage
- Decision maker: CEO (Sarah Kim)
- Approval needed: Yes

OUR POSITIONING:
✓ Show growth path - Start small, scale up
✓ Emphasize automation ROI (save 10+ hours/week on reporting)
✓ Integration value - single source of truth
✓ AI features they don't have now

COMPETITORS BEING EVALUATED:
1. ClickUp Enterprise
   - Pricing: $12/user/month
   - Pros: Familiar UI
   - Cons: Limited automation

2. Monday.com Work OS
   - Pricing: $16/user/month
   - Pros: Good workflows
   - Cons: Complex setup

3. BMI CRM (Us)
   - Pricing: $28K annual (~$9.30/user/month for 25)
   - Pros: AI features, integrations
   - Cons: Higher upfront cost

VALUE PROPOSITION:
- 25% lower per-user cost when scaled
- AI automation = 10-15 hrs/week saved
- Real-time reporting (no manual work)
- Future-proof for growth

RECOMMENDED APPROACH:
1. Demo AI automation features first
2. Show integration capabilities
3. Calculate ROI (time saved)
4. Offer flexible payment terms
5. Provide case study: Similar-sized company's success

NEXT STEPS:
⏳ Share this research with team
⏳ Prepare custom demo focusing on automation
⏳ Create ROI calculator for StartCo
⏳ Schedule demo with CEO Sarah Kim`,
      aiInsights: {
        pricingStrategy: [
          'Our price: 25% lower (when scaled)',
          'Emphasize value/features ratio',
          'Highlight ROI advantage (time savings)',
        ],
        competitiveEdge: [
          'Better integrations (vs ClickUp/Monday)',
          'Faster implementation',
          'Superior AI features',
          'Better support',
        ],
        recommendedApproach: [
          'Demo AI automation first (biggest differentiator)',
          'Show integration depth (solve data silos)',
          'Emphasize growth path (scale with them)',
          'Address budget concerns with flexible pricing',
        ],
      },
      comments: [
        {
          id: 1,
          author: 'Sarah Chen',
          authorRole: 'Sales Manager',
          date: 'Dec 6, 2025 at 2:30 PM',
          content: 'Great research Mike! The AI automation angle is perfect for them. Let\'s emphasize the time-saving ROI.',
        },
        {
          id: 2,
          author: 'Alex Rodriguez',
          authorRole: 'Account Executive',
          date: 'Dec 6, 2025 at 1:15 PM',
          content: 'This is super helpful. I\'ll use this for the demo prep. The competitor pricing comparison is key.',
        },
        {
          id: 3,
          author: 'Emily Davis',
          authorRole: 'Sales Engineer',
          date: 'Dec 6, 2025 at 11:30 AM',
          content: 'Nice work! Should we create a custom ROI calculator for this deal?',
        },
      ],
      referencedMaterials: [
        {
          type: 'url',
          title: 'ClickUp Pricing Page',
          url: 'https://clickup.com/pricing',
          savedAt: 'Dec 6, 9:30 AM',
        },
        {
          type: 'document',
          title: 'Monday.com Competitor Analysis',
          filename: 'comp_analysis.pdf',
          location: 'Documents Library',
          savedAt: 'Dec 6, 9:45 AM',
        },
      ],
      relatedActivities: [
        {
          type: 'meeting',
          date: 'Dec 5, 3:00 PM',
          title: 'Discovery meeting',
          status: 'Completed',
          contact: 'Lisa Martinez',
        },
        {
          type: 'email',
          date: 'Dec 3, 9:00 AM',
          title: 'Initial proposal',
          status: 'Opened 3x',
          contact: 'Lisa Martinez',
        },
        {
          type: 'call',
          date: 'Nov 29, 2:00 PM',
          title: 'Qualification call',
          status: 'Positive',
          contact: 'Lisa Martinez',
        },
      ],
      history: [
        {
          action: 'Sarah Chen added comment',
          user: 'Sarah Chen',
          time: 'Dec 6, 2:30 PM',
          details: 'Comment: "Great research Mike! The AI automation angle is perfect for them. Let\'s emphasize the time-saving ROI."',
        },
        {
          action: 'Shared with Sales Team (12 members notified)',
          user: 'Mike Johnson',
          time: 'Dec 6, 2:15 PM',
          details: 'Email notifications sent to: Sarah Chen, Alex Rodriguez, Emily Davis, Tom Wilson, Rachel Green, David Park, Lisa Chen, John Miller, Amy Brown, Chris Lee, Mark Taylor, Jennifer White.',
        },
        {
          action: 'Alex Rodriguez added comment',
          user: 'Alex Rodriguez',
          time: 'Dec 6, 1:15 PM',
          details: 'Comment: "This is super helpful. I\'ll use this for the demo prep. The competitor pricing comparison is key."',
        },
        {
          action: 'Added reference document',
          user: 'Mike Johnson',
          time: 'Dec 6, 11:45 AM',
          attachment: 'comp_analysis.pdf',
          details: 'Added Monday.com Competitor Analysis document from Documents Library. File size: 2.4 MB.',
        },
        {
          action: 'Emily Davis added comment',
          user: 'Emily Davis',
          time: 'Dec 6, 11:30 AM',
          details: 'Comment: "Nice work! Should we create a custom ROI calculator for this deal?"',
        },
        {
          action: 'Created this note (Category: Competitor Research, Visibility: Internal Only)',
          user: 'Mike Johnson',
          time: 'Dec 6, 10:00 AM',
          details: 'Initial research compiled from ClickUp pricing page, Monday.com website, and internal competitor intelligence database. Note set to internal visibility to protect competitive research.',
        },
      ],
    },
  };

  return activityData[id] || activityData['ACT-2025-006']; // Default to note
};

const ActivityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showHRMSHistoryModal, setShowHRMSHistoryModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showCallLogForm, setShowCallLogForm] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [editingAgenda, setEditingAgenda] = useState(false);
  const [agendaItems, setAgendaItems] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showLogFollowUpModal, setShowLogFollowUpModal] = useState(false);
  const [showAudioPlayerModal, setShowAudioPlayerModal] = useState(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [showTrackingDetailsModal, setShowTrackingDetailsModal] = useState(false);
  const [editingCallNotes, setEditingCallNotes] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [isReplyMode, setIsReplyMode] = useState(false);
  const [showContactNowModal, setShowContactNowModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalationContext, setEscalationContext] = useState('');
  const [showCompleteTaskModal, setShowCompleteTaskModal] = useState(false);
  const [editingTaskDescription, setEditingTaskDescription] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [showAddCommentBox, setShowAddCommentBox] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);

  const activity = getMockActivity(id || 'ACT-2025-006');

  React.useEffect(() => {
    if (activity.agenda) {
      setAgendaItems(activity.agenda);
    }
    if (activity.callNotes) {
      setCallNotes(activity.callNotes.summary || '');
    }
    if (activity.description) {
      setTaskDescription(activity.description);
    }
    if (activity.checklist) {
      setChecklistItems(activity.checklist);
    }
    if (activity.content) {
      setNoteContent(activity.content);
    }
    if (activity.comments) {
      setComments(activity.comments);
    }
    if (activity.isPinned) {
      setIsPinned(activity.isPinned);
    }
  }, [activity.agenda, activity.callNotes, activity.description, activity.checklist, activity.content, activity.comments, activity.isPinned]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Video className="w-6 h-6" />;
      case 'call':
        return <Phone className="w-6 h-6" />;
      case 'email':
        return <Mail className="w-6 h-6" />;
      case 'task':
        return <CheckCircle className="w-6 h-6" />;
      case 'note':
        return <FileText className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'blue';
      case 'call':
        return 'green';
      case 'email':
        return 'purple';
      case 'task':
        return 'orange';
      case 'note':
        return 'slate';
      default:
        return 'gray';
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      upcoming: { label: 'Upcoming', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
      sent: { label: 'Sent & Opened', color: 'bg-purple-100 text-purple-800' },
      overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800' },
      internal: { label: 'Internal Only', color: 'bg-slate-100 text-slate-800' },
    };

    const badge = badges[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const color = getActivityColor(activity.type);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className={`bg-gradient-to-r from-${color}-600 to-${color}-700 text-white`}>
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-6 text-white/80">
            <button
              onClick={() => navigate('/')}
              className="hover:text-white transition-colors"
            >
              Dashboard
            </button>
            <ChevronRight className="w-4 h-4" />
            <button
              onClick={() => navigate('/crm')}
              className="hover:text-white transition-colors"
            >
              CRM
            </button>
            <ChevronRight className="w-4 h-4" />
            <button
              onClick={() => navigate('/crm/activities')}
              className="hover:text-white transition-colors"
            >
              Activities
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-medium">{activity.title}</span>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`p-3 bg-white/20 backdrop-blur-sm rounded-xl`}>
                {getActivityIcon(activity.type)}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{activity.title}</h1>
                  {getStatusBadge(activity.status)}
                </div>
                <div className="flex items-center gap-6 text-white/90">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{activity.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{activity.time}</span>
                  </div>
                  {activity.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{activity.duration}</span>
                    </div>
                  )}
                  {activity.timeUntil && (
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">{activity.timeUntil}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {/* Meeting Specific */}
              {activity.type === 'meeting' && activity.status === 'upcoming' && activity.zoomLink && (
                <button
                  onClick={() => window.open(activity.zoomLink, '_blank')}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium flex items-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  Join Meeting
                </button>
              )}
              {activity.type === 'meeting' && activity.status === 'upcoming' && (
                <button
                  onClick={() => setShowRescheduleModal(true)}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Reschedule
                </button>
              )}

              {/* Call Specific */}
              {activity.type === 'call' && (
                <>
                  <button
                    onClick={() => setShowLogFollowUpModal(true)}
                    className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 font-medium flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Log Follow-up
                  </button>
                  {activity.deal && (
                    <button
                      onClick={() => navigate(`/crm/deals/${activity.deal.id}`)}
                      className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 flex items-center gap-2"
                    >
                      <Building2 className="w-4 h-4" />
                      View Deal
                    </button>
                  )}
                </>
              )}

              {/* Email Specific */}
              {activity.type === 'email' && (
                <>
                  <button
                    onClick={() => {
                      setIsReplyMode(true);
                      setShowEmailComposer(true);
                    }}
                    className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 font-medium flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Send Follow-up
                  </button>
                  <button
                    onClick={() => setShowMeetingScheduler(true)}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Schedule Meeting
                  </button>
                </>
              )}

              {/* Task Specific */}
              {activity.type === 'task' && (
                <>
                  <button
                    onClick={() => setShowCompleteTaskModal(true)}
                    className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 font-medium flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Complete
                  </button>
                  <button
                    onClick={() => setShowRescheduleModal(true)}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Reschedule
                  </button>
                  <button
                    onClick={() => setShowContactNowModal(true)}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Contact Now
                  </button>
                </>
              )}

              {/* Note Specific */}
              {activity.type === 'note' && (
                <>
                  <button
                    onClick={() => setEditingNote(!editingNote)}
                    className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    {editingNote ? 'Save Note' : 'Edit'}
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share with Team
                  </button>
                  <button
                    onClick={() => {
                      setIsPinned(!isPinned);
                      alert(isPinned ? 'Note unpinned' : 'Note pinned to top!');
                    }}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 flex items-center gap-2"
                  >
                    <Star className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
                    {isPinned ? 'Unpin' : 'Pin Note'}
                  </button>
                </>
              )}

              {activity.type !== 'note' && (
                <button
                  onClick={() => navigate(`/crm/activities/${activity.id}/edit`)}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          {/* HRMS Connection Banner */}
          {activity.hrmsConnection?.connected && (
            <div className="mt-6 bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-white/30 rounded-lg">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold mb-1">HRMS CONNECTION - Warm Intro Advantage</div>
                    <div className="text-sm text-white/90 space-y-1">
                      <div>
                        Recruited: <span className="font-medium">{activity.hrmsConnection.employeeName} ({activity.hrmsConnection.employeeRole})</span> - {activity.hrmsConnection.recruitedDate} ({activity.hrmsConnection.daysAgo})
                      </div>
                      <div>Recruiter: {activity.hrmsConnection.recruiter}</div>
                      <div className="flex gap-4 mt-2">
                        {activity.hrmsConnection.advantages.map((adv: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-white/20 rounded text-xs font-medium">
                            {adv}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2">Activity Completion: {activity.hrmsConnection.activityCompletion}</div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowHRMSHistoryModal(true)}
                  className="px-3 py-1.5 bg-white/30 hover:bg-white/40 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                >
                  View Full HRMS History
                </button>
              </div>
            </div>
          )}

          {/* Risk Alert Banner */}
          {activity.riskAlert && (
            <div className="mt-6 bg-red-900/50 backdrop-blur-sm rounded-lg p-4 border border-red-400/50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-200 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-bold text-lg mb-2">{activity.riskAlert.title}</div>
                  <div className="space-y-2 mb-3">
                    {activity.riskAlert.factors.map((factor: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-red-200">•</span>
                        <span className="text-red-100">{factor}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-red-900/50 rounded p-3 mb-3">
                    <div className="font-semibold mb-2">Statistical Analysis:</div>
                    <div className="text-sm space-y-1">
                      <div>• Similar delays = {activity.riskAlert.statistics.similarDelays}</div>
                      <div>• Avg recovery time: {activity.riskAlert.statistics.avgRecoveryTime}</div>
                      <div>• Current stage: {activity.riskAlert.statistics.currentStage}</div>
                      <div>• Days without contact: {activity.riskAlert.statistics.daysWithoutContact}</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Recovery Actions:</div>
                    <div className="flex flex-wrap gap-2">
                      {activity.riskAlert.recoveryActions.map((action: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-red-800/50 rounded text-sm">
                          {idx + 1}. {action}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4 pt-4 border-t border-red-400/30">
                    <button
                      onClick={() => setShowContactNowModal(true)}
                      className="px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 font-medium flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      Contact Now
                    </button>
                    <button
                      onClick={() => setShowEscalateModal(true)}
                      className="px-4 py-2 bg-red-800/50 text-white rounded-lg hover:bg-red-800/70 font-medium flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Escalate to Manager
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Meeting Agenda */}
            {activity.agenda && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    Meeting Agenda
                  </h2>
                  <button
                    onClick={() => setEditingAgenda(!editingAgenda)}
                    className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    {editingAgenda ? 'Save' : 'Edit Agenda'}
                  </button>
                </div>
                {editingAgenda ? (
                  <div className="space-y-2">
                    {agendaItems.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const newItems = [...agendaItems];
                            newItems[idx] = e.target.value;
                            setAgendaItems(newItems);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => {
                            const newItems = agendaItems.filter((_, i) => i !== idx);
                            setAgendaItems(newItems);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setAgendaItems([...agendaItems, ''])}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Item
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {agendaItems.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Call Notes */}
            {activity.callNotes && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Call Summary</h2>
                  <button
                    onClick={() => setEditingCallNotes(!editingCallNotes)}
                    className="px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-medium flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    {editingCallNotes ? 'Save' : 'Edit Notes'}
                  </button>
                </div>
                {editingCallNotes ? (
                  <textarea
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 mb-4"
                  />
                ) : (
                  <p className="text-gray-700 mb-4">{callNotes || activity.callNotes.summary}</p>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Key Points Discussed:</h3>
                    <ul className="space-y-1">
                      {activity.callNotes.keyPoints.map((point: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Concerns Raised:</h3>
                    <ul className="space-y-1">
                      {activity.callNotes.concerns.map((concern: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Action Items:</h3>
                    <div className="space-y-2">
                      {activity.callNotes.actionItems.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          {item.status === 'created' ? (
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          ) : (
                            <Clock className="w-4 h-4 text-orange-600 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{item.text}</div>
                            {item.dueDate && (
                              <div className="text-sm text-gray-600">Due: {item.dueDate}</div>
                            )}
                            {item.note && (
                              <div className="text-sm text-gray-600">{item.note}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2">Next Steps:</h3>
                    <p className="text-gray-700">{activity.callNotes.nextSteps}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Content */}
            {activity.emailContent && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Email Content</h2>
                <div className="mb-4 space-y-2 text-sm">
                  <div><span className="font-medium">From:</span> {activity.emailDetails.from}</div>
                  <div><span className="font-medium">To:</span> {activity.emailDetails.to}</div>
                  {activity.emailDetails.cc && (
                    <div><span className="font-medium">Cc:</span> {activity.emailDetails.cc}</div>
                  )}
                  <div><span className="font-medium">Subject:</span> {activity.emailDetails.subject}</div>
                </div>
                <div className="border-t pt-4">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700">
                    {activity.emailContent}
                  </pre>
                </div>
              </div>
            )}

            {/* Email Tracking */}
            {activity.emailTracking && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Email Tracking
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Delivered: {activity.emailTracking.delivered.time}</span>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Opens ({activity.emailTracking.totalOpens}):</h3>
                    <div className="space-y-2">
                      {activity.emailTracking.opens.map((open: any, idx: number) => (
                        <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Open #{open.number}</div>
                              <div className="text-sm text-gray-600">{open.time} ({open.timeSince})</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-blue-600">
                                Read time: {open.duration}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Total read time: {activity.emailTracking.totalReadTime} | Avg: {activity.emailTracking.avgReadTime}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Attachments:</h3>
                    <div className="space-y-2">
                      {activity.emailTracking.attachmentsTracking.map((att: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border ${
                            att.opened
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{att.name}</div>
                              <div className="text-sm text-gray-600">{att.size}</div>
                            </div>
                            <div className="text-right">
                              {att.opened ? (
                                <>
                                  <div className="flex items-center gap-1 text-green-600 font-medium">
                                    <CheckCircle className="w-4 h-4" />
                                    Opened
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {att.openedAt} ({att.openDelay})
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Read: {att.readTime}
                                  </div>
                                </>
                              ) : (
                                <div className="text-gray-500">Not opened yet</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {activity.engagementScore && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">Engagement Score</div>
                        <div className="text-2xl font-bold text-green-600">
                          {activity.engagementScore.level}
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 space-y-1">
                        <div>Reply Probability: {activity.engagementScore.replyProbability}%</div>
                        <div>{activity.engagementScore.successRate}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Task Description */}
            {activity.description && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Task Description</h2>
                  <button
                    onClick={() => setEditingTaskDescription(!editingTaskDescription)}
                    className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    {editingTaskDescription ? 'Save' : 'Edit Description'}
                  </button>
                </div>
                {editingTaskDescription ? (
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-gray-700">
                    {taskDescription || activity.description}
                  </pre>
                )}
              </div>
            )}

            {/* Task Checklist */}
            {activity.checklist && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Checklist ({checklistItems.filter((i: any) => i.status === 'completed').length}/{checklistItems.length} completed)</h2>
                <div className="space-y-3">
                  {checklistItems.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        item.status === 'completed'
                          ? 'bg-green-50 border-green-200'
                          : item.status === 'overdue'
                          ? 'bg-red-50 border-red-200'
                          : item.status === 'blocked'
                          ? 'bg-gray-50 border-gray-300'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={item.status === 'completed'}
                          onChange={() => {
                            const newItems = [...checklistItems];
                            newItems[idx].status = newItems[idx].status === 'completed' ? 'pending' : 'completed';
                            if (newItems[idx].status === 'completed') {
                              newItems[idx].completedAt = 'Just now';
                            }
                            setChecklistItems(newItems);
                          }}
                          className="w-5 h-5 text-green-600 mt-0.5 rounded focus:ring-2 focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <div className={`font-medium ${item.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                            {item.item}
                          </div>
                          {item.completedAt && (
                            <div className="text-sm text-gray-600">Completed: {item.completedAt}</div>
                          )}
                          {item.note && (
                            <div className="text-sm text-gray-600">{item.note}</div>
                          )}
                        </div>
                        {item.status !== 'completed' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                const newItems = [...checklistItems];
                                newItems[idx].status = 'completed';
                                newItems[idx].completedAt = 'Just now';
                                setChecklistItems(newItems);
                                alert('Checklist item marked as complete!');
                              }}
                              className="p-1.5 text-green-600 hover:bg-green-100 rounded"
                              title="Mark Complete"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowRescheduleModal(true)}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                              title="Reschedule"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note Content */}
            {activity.content && activity.type === 'note' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Note Content</h2>
                  <div className="flex items-center gap-2">
                    {activity.tags && activity.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                    <button
                      onClick={() => setEditingNote(!editingNote)}
                      className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      {editingNote ? 'Save' : 'Edit Note'}
                    </button>
                  </div>
                </div>
                {editingNote ? (
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-gray-700">
                    {noteContent || activity.content}
                  </pre>
                )}
              </div>
            )}

            {/* Comments Section (for Notes) */}
            {activity.type === 'note' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Comments ({comments.length})</h2>
                  <button
                    onClick={() => setShowAddCommentBox(!showAddCommentBox)}
                    className="px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-medium flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Add Comment
                  </button>
                </div>
                {showAddCommentBox && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 mb-2"
                      placeholder="Write a comment..."
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setShowAddCommentBox(false);
                          setNewComment('');
                        }}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (newComment.trim()) {
                            setComments([
                              ...comments,
                              {
                                id: Date.now(),
                                user: 'You',
                                text: newComment,
                                time: 'Just now',
                                isOwn: true,
                              },
                            ]);
                            setNewComment('');
                            setShowAddCommentBox(false);
                          }
                        }}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Post Comment
                      </button>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No comments yet. Be the first to comment!
                    </div>
                  ) : (
                    comments.map((comment: any) => (
                      <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                              {comment.user.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{comment.user}</div>
                              <div className="text-xs text-gray-500">{comment.time}</div>
                            </div>
                          </div>
                          {comment.isOwn && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  const text = prompt('Edit comment:', comment.text);
                                  if (text !== null) {
                                    const newComments = comments.map((c: any) =>
                                      c.id === comment.id ? { ...c, text, edited: true } : c
                                    );
                                    setComments(newComments);
                                  }
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded text-xs"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this comment?')) {
                                    setComments(comments.filter((c: any) => c.id !== comment.id));
                                  }
                                }}
                                className="p-1 text-red-600 hover:bg-red-100 rounded text-xs"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm">{comment.text}</p>
                        {comment.edited && <div className="text-xs text-gray-500 mt-1">Edited</div>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* AI Insights */}
            {activity.aiInsights && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    AI Insights
                  </h2>
                  {activity.type === 'note' && (
                    <button
                      onClick={() => {
                        alert('AI recommendations have been applied to a new follow-up email/task draft!');
                        setShowEmailComposer(true);
                      }}
                      className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Apply Recommendations
                    </button>
                  )}
                </div>
                {typeof activity.aiInsights === 'object' && !Array.isArray(activity.aiInsights) ? (
                  <div className="space-y-4">
                    {Object.entries(activity.aiInsights).map(([key, values]: [string, any], idx: number) => (
                      <div key={idx}>
                        <h3 className="font-semibold text-purple-900 mb-2 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </h3>
                        <ul className="space-y-1">
                          {values.map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-purple-800">
                              <span>•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {activity.aiInsights.map((insight: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span className="text-purple-900">{insight}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {activity.aiRecommendations && (
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-2">Recommended Actions:</h3>
                    <ul className="space-y-1">
                      {activity.aiRecommendations.map((rec: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-purple-800">
                          {typeof rec === 'string' ? (
                            <>
                              <Target className="w-4 h-4 mt-0.5" />
                              <span>{rec}</span>
                            </>
                          ) : (
                            <>
                              <span>{rec.icon}</span>
                              <div className="flex-1">
                                <div>{rec.action}</div>
                                <button className="mt-1 px-3 py-1 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700">
                                  {rec.button}
                                </button>
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activity.aiTiming && (
                  <div className="mt-4 p-3 bg-purple-100 rounded text-sm text-purple-900">
                    <Clock className="w-4 h-4 inline mr-2" />
                    {activity.aiTiming}
                  </div>
                )}

                {activity.aiStrategy && (
                  <div className="mt-4 p-3 bg-purple-100 rounded text-sm text-purple-900">
                    <Target className="w-4 h-4 inline mr-2" />
                    <span className="font-semibold">Strategy:</span> {activity.aiStrategy}
                  </div>
                )}
              </div>
            )}

            {/* CRM Auto-Updates */}
            {activity.crmAutoUpdates && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    CRM Auto-Updates
                  </h2>
                  {activity.deal && (
                    <button
                      onClick={() => navigate(`/crm/deals/${activity.deal.id}`)}
                      className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium"
                    >
                      View Deal Changes
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {activity.crmAutoUpdates.map((update: any, idx: number) => (
                    <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-900 mb-1">{update.label}</div>
                      {update.from && update.to && (
                        <div className="text-sm text-blue-800">
                          {update.from} → {update.to}
                          {update.change && <span className="ml-2 font-medium">({update.change})</span>}
                          {update.time && <span className="ml-2 text-blue-600">at {update.time}</span>}
                        </div>
                      )}
                      {update.items && (
                        <ul className="text-sm text-blue-800 space-y-1 mt-1">
                          {update.items.map((item: string, i: number) => (
                            <li key={i}>• {item}</li>
                          ))}
                        </ul>
                      )}
                      {update.date && (
                        <div className="text-sm text-blue-800">{update.date}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Call Recording */}
            {activity.recording?.available && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Call Recording
                </h2>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600">
                      Duration: {activity.recording.duration} | Size: {activity.recording.size} | Format: {activity.recording.format}
                    </div>
                    <button
                      onClick={() => alert('Downloading recording...')}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download MP3
                    </button>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-blue-600 rounded-full h-2 w-0"></div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAudioPlayerModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Play Recording
                    </button>
                    {activity.recording.transcript && (
                      <button
                        onClick={() => setShowTranscriptModal(true)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        View AI Transcript
                      </button>
                    )}
                  </div>
                </div>

                {activity.recording.keyMoments && activity.recording.keyMoments.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Key Moments:</h3>
                    <div className="space-y-2">
                      {activity.recording.keyMoments.map((moment: any, idx: number) => (
                        <button
                          key={idx}
                          className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-blue-600">{moment.time}</div>
                              <div className="text-sm text-gray-700">{moment.topic}</div>
                            </div>
                            <Play className="w-4 h-4 text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Attachments */}
            {activity.attachments && activity.attachments.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Paperclip className="w-5 h-5" />
                    Attachments ({activity.attachments.length})
                  </h2>
                  <button
                    onClick={() => setShowFileUpload(true)}
                    className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Add Attachment
                  </button>
                </div>
                <div className="space-y-2">
                  {activity.attachments.map((file: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <div className="font-medium">{file.name}</div>
                          <div className="text-sm text-gray-600">
                            {file.size} • Uploaded {file.uploadedAt || file.sent}
                            {file.uploadedBy && <span> by {file.uploadedBy}</span>}
                          </div>
                          {file.status && (
                            <div className="text-xs mt-1">
                              {file.status === 'opened' ? (
                                <span className="text-green-600">Opened {file.openedAt}</span>
                              ) : (
                                <span className="text-gray-500">Not opened yet</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setSelectedFile(file);
                            setShowPDFPreview(true);
                          }}
                          className="p-2 hover:bg-gray-200 rounded-lg"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => alert(`Downloading ${file.name}...`)}
                          className="p-2 hover:bg-gray-200 rounded-lg"
                          title="Download"
                        >
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                        {activity.type === 'email' && file.status && (
                          <button
                            onClick={() => {
                              setSelectedFile(file);
                              setShowTrackingDetailsModal(true);
                            }}
                            className="p-2 hover:bg-gray-200 rounded-lg"
                            title="Track Status"
                          >
                            <Eye className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedFile(file);
                            setShowShareModal(true);
                          }}
                          className="p-2 hover:bg-gray-200 rounded-lg"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            {activity.comments && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Comments ({activity.comments.length})
                </h2>
                <div className="space-y-4 mb-4">
                  {activity.comments.map((comment: any) => (
                    <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                          {comment.author.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{comment.author}</span>
                            {comment.authorRole && (
                              <span className="text-sm text-gray-600">• {comment.authorRole}</span>
                            )}
                            <span className="text-sm text-gray-500">• {comment.date}</span>
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                <div className="border-t pt-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => {
                        alert('Comment added!');
                        setNewComment('');
                      }}
                      disabled={!newComment.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                    >
                      Add Comment
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Referenced Materials */}
            {activity.referencedMaterials && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Link className="w-5 h-5" />
                  Referenced Materials ({activity.referencedMaterials.length})
                </h2>
                <div className="space-y-2">
                  {activity.referencedMaterials.map((material: any, idx: number) => (
                    <div key={idx} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{material.title}</div>
                          <div className="text-sm text-gray-600">
                            {material.url ? (
                              <a
                                href={material.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {material.url}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span>{material.filename} • {material.location}</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Saved: {material.savedAt}</div>
                        </div>
                        {!material.url && (
                          <button
                            onClick={() => {
                              setSelectedFile(material);
                              setShowPDFPreview(true);
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View Document
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity History */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Activity History</h2>
              <div className="space-y-3">
                {activity.history.map((item: any, idx: number) => (
                  <div key={idx} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
                      <div className="flex-1">
                        <div className="text-gray-900">{item.action}</div>
                        <div className="text-gray-600">
                          {item.user} • {item.time}
                        </div>
                        {item.attachment && (
                          <button
                            onClick={() => {
                              setSelectedFile({ title: item.attachment, type: 'document' });
                              setShowPDFPreview(true);
                            }}
                            className="mt-2 flex items-center gap-2 text-blue-600 hover:underline"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span>{item.attachment}</span>
                          </button>
                        )}
                        {item.details && (
                          <details className="mt-2">
                            <summary className="text-gray-600 cursor-pointer hover:text-gray-900 text-xs">
                              Show more details
                            </summary>
                            <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              {item.details}
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold mb-4">Quick Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-600 mb-1">Owner</div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{activity.owner}</span>
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Created</div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{activity.createdAt}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">by {activity.createdBy}</div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Last Modified</div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                    <span>{activity.lastModified}</span>
                  </div>
                  {activity.lastModifiedBy && (
                    <div className="text-xs text-gray-500 mt-1">by {activity.lastModifiedBy}</div>
                  )}
                </div>
                {activity.source && (
                  <div>
                    <div className="text-gray-600 mb-1">Source</div>
                    <div className="text-xs bg-gray-100 px-2 py-1 rounded">{activity.source}</div>
                    {activity.sourceJourney && (
                      <div className="text-xs text-gray-500 mt-1">{activity.sourceJourney}</div>
                    )}
                  </div>
                )}
                {activity.priority && (
                  <div>
                    <div className="text-gray-600 mb-1">Priority</div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        activity.priority === 'high'
                          ? 'bg-red-100 text-red-800'
                          : activity.priority === 'medium'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {activity.priority.toUpperCase()}
                    </span>
                  </div>
                )}
                {activity.daysOverdue !== undefined && activity.daysOverdue > 0 && (
                  <div>
                    <div className="text-gray-600 mb-1">Days Overdue</div>
                    <div className="text-red-600 font-bold">{activity.daysOverdue} days</div>
                  </div>
                )}
              </div>
            </div>

            {/* Related Deal */}
            {activity.relatedDeal && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold mb-4">Related Deal</h3>
                <button
                  onClick={() => navigate(`/crm/deals/${activity.relatedDeal.id}`)}
                  className="w-full text-left hover:bg-gray-50 p-3 rounded-lg border border-gray-200 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{activity.relatedDeal.name}</span>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {activity.relatedDeal.value}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Stage:</span>
                      <span className="font-medium">{activity.relatedDeal.stage}</span>
                    </div>
                    {activity.relatedDeal.justMoved && activity.relatedDeal.previousStage && (
                      <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Just moved from {activity.relatedDeal.previousStage}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Win Probability:</span>
                      <span className="font-medium text-green-600">
                        {activity.relatedDeal.probability}
                        {activity.relatedDeal.change && (
                          <span className="text-xs ml-1">({activity.relatedDeal.change})</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Close Date:</span>
                      <span>{activity.relatedDeal.closeDate}</span>
                    </div>
                    {activity.relatedDeal.health && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Health:</span>
                        <span
                          className={`font-medium ${
                            activity.relatedDeal.health === 'Excellent' || activity.relatedDeal.health === 'Good'
                              ? 'text-green-600'
                              : activity.relatedDeal.health === 'At Risk'
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {activity.relatedDeal.health}
                        </span>
                      </div>
                    )}
                    {activity.relatedDeal.warning && (
                      <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded mt-2">
                        {activity.relatedDeal.warning}
                      </div>
                    )}
                  </div>
                </button>
              </div>
            )}

            {/* Primary Contact */}
            {activity.primaryContact && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold mb-4">Primary Contact</h3>
                <button
                  onClick={() => navigate(`/crm/contacts/${activity.primaryContact.id}`)}
                  className="w-full text-left hover:bg-gray-50 p-3 rounded-lg border border-gray-200 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{activity.primaryContact.name}</span>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-sm text-gray-600 mb-3">{activity.primaryContact.title}</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEmailComposer(true);
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        {activity.primaryContact.email}
                      </button>
                    </div>
                    {activity.primaryContact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCallLogForm(true);
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          {activity.primaryContact.phone}
                        </button>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 pt-2 border-t">
                      Last Contact: {activity.primaryContact.lastContact}
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Account */}
            {activity.account && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold mb-4">Account</h3>
                <button
                  onClick={() => navigate(`/crm/accounts/${activity.account.id}`)}
                  className="w-full text-left hover:bg-gray-50 p-3 rounded-lg border border-gray-200 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{activity.account.name}</span>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span>{activity.account.industry}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{activity.account.size}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{activity.account.location}</span>
                    </div>
                    {activity.account.hrmsConnection && (
                      <div className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                        HRMS: {activity.account.hrmsConnection}
                        {activity.account.hrmsCount && <span> ({activity.account.hrmsCount} recruited)</span>}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 pt-2 border-t">
                      {activity.account.totalActivities} total activities
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {/* Type-specific actions */}
                {activity.type === 'call' && (
                  <button
                    onClick={() => setShowCallLogForm(true)}
                    className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors"
                  >
                    <Phone className="w-5 h-5 text-green-600 mb-1" />
                    <div className="text-sm font-medium text-green-900">Call Again</div>
                  </button>
                )}
                {activity.type === 'call' && activity.riskAlert && (
                  <button
                    onClick={() => setShowEscalateModal(true)}
                    className="p-3 bg-red-50 hover:bg-red-100 rounded-lg text-left transition-colors"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 mb-1" />
                    <div className="text-sm font-medium text-red-900">Escalate to Manager</div>
                  </button>
                )}
                {activity.type === 'email' && (
                  <button
                    onClick={() => {
                      setIsReplyMode(true);
                      setShowEmailComposer(true);
                    }}
                    className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
                  >
                    <Mail className="w-5 h-5 text-blue-600 mb-1" />
                    <div className="text-sm font-medium text-blue-900">Reply to Email</div>
                  </button>
                )}
                {activity.type === 'task' && (
                  <>
                    <button
                      onClick={() => setShowContactNowModal(true)}
                      className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors"
                    >
                      <Phone className="w-5 h-5 text-green-600 mb-1" />
                      <div className="text-sm font-medium text-green-900">Call Now</div>
                    </button>
                    <button
                      onClick={() => setShowCompleteTaskModal(true)}
                      className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
                    >
                      <CheckCircle className="w-5 h-5 text-blue-600 mb-1" />
                      <div className="text-sm font-medium text-blue-900">Mark Complete</div>
                    </button>
                    <button
                      onClick={() => setShowRescheduleModal(true)}
                      className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors"
                    >
                      <Calendar className="w-5 h-5 text-purple-600 mb-1" />
                      <div className="text-sm font-medium text-purple-900">Reschedule Task</div>
                    </button>
                    {activity.riskAlert && (
                      <button
                        onClick={() => setShowEscalateModal(true)}
                        className="p-3 bg-red-50 hover:bg-red-100 rounded-lg text-left transition-colors"
                      >
                        <AlertCircle className="w-5 h-5 text-red-600 mb-1" />
                        <div className="text-sm font-medium text-red-900">Escalate to Manager</div>
                      </button>
                    )}
                  </>
                )}
                {activity.type === 'note' && (
                  <>
                    <button
                      onClick={() => setShowNewNoteModal(true)}
                      className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors"
                    >
                      <FileText className="w-5 h-5 text-purple-600 mb-1" />
                      <div className="text-sm font-medium text-purple-900">Add Follow-up Note</div>
                    </button>
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
                    >
                      <Share2 className="w-5 h-5 text-blue-600 mb-1" />
                      <div className="text-sm font-medium text-blue-900">Share Note</div>
                    </button>
                  </>
                )}
                {activity.type !== 'call' && activity.type !== 'email' && activity.type !== 'task' && activity.type !== 'note' && (
                  <>
                    <button
                      onClick={() => setShowEmailComposer(true)}
                      className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
                    >
                      <Mail className="w-5 h-5 text-blue-600 mb-1" />
                      <div className="text-sm font-medium text-blue-900">Send Email</div>
                    </button>
                    <button
                      onClick={() => setShowCallLogForm(true)}
                      className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors"
                    >
                      <Phone className="w-5 h-5 text-green-600 mb-1" />
                      <div className="text-sm font-medium text-green-900">Log Call</div>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowNoteEditor(true)}
                  className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors"
                >
                  <FileText className="w-5 h-5 text-purple-600 mb-1" />
                  <div className="text-sm font-medium text-purple-900">Add Note</div>
                </button>
                <button
                  onClick={() => setShowFileUpload(true)}
                  className="p-3 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition-colors"
                >
                  <Paperclip className="w-5 h-5 text-orange-600 mb-1" />
                  <div className="text-sm font-medium text-orange-900">Upload File</div>
                </button>
                <button
                  onClick={() => setShowMeetingScheduler(true)}
                  className="p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-left transition-colors"
                >
                  <Calendar className="w-5 h-5 text-indigo-600 mb-1" />
                  <div className="text-sm font-medium text-indigo-900">
                    {activity.type === 'email' ? 'Schedule Meeting' : 'Schedule Follow-up'}
                  </div>
                </button>
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="p-3 bg-pink-50 hover:bg-pink-100 rounded-lg text-left transition-colors"
                >
                  <CheckCircle className="w-5 h-5 text-pink-600 mb-1" />
                  <div className="text-sm font-medium text-pink-900">Create Task</div>
                </button>
              </div>
            </div>

            {/* Related Activities */}
            {activity.relatedActivities && activity.relatedActivities.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Related Activities</h3>
                  <button
                    onClick={() => {
                      const filter = activity.account ? `account=${activity.account.id}` :
                                    activity.primaryContact ? `contact=${activity.primaryContact.id}` :
                                    activity.relatedDeal ? `deal=${activity.relatedDeal.id}` : '';
                      navigate(`/crm/activities${filter ? '?' + filter : ''}`);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    View All ({activity.account?.totalActivities || activity.relatedActivities.length})
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  {activity.relatedActivities.map((relActivity: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => navigate(`/crm/activities/${relActivity.type}-${idx}`)}
                      className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-left transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {relActivity.type === 'meeting' && <Video className="w-4 h-4 text-blue-600" />}
                            {relActivity.type === 'call' && <Phone className="w-4 h-4 text-green-600" />}
                            {relActivity.type === 'email' && <Mail className="w-4 h-4 text-purple-600" />}
                            {relActivity.type === 'task' && <CheckCircle className="w-4 h-4 text-orange-600" />}
                            {relActivity.type === 'lead' && <Target className="w-4 h-4 text-gray-600" />}
                            <span className="font-medium">{relActivity.title}</span>
                          </div>
                          <div className="text-xs text-gray-600">{relActivity.date}</div>
                          <div className="text-xs text-gray-500">{relActivity.status}</div>
                          {relActivity.contact && (
                            <div className="text-xs text-gray-500">Contact: {relActivity.contact}</div>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reschedule Meeting</h3>
              <button onClick={() => setShowRescheduleModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Time</label>
                <input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Reason for rescheduling..."></textarea>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowRescheduleModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                Cancel
              </button>
              <button onClick={() => { alert('Meeting rescheduled!'); setShowRescheduleModal(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                Reschedule Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HRMS History Modal */}
      {showHRMSHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">HRMS History - Sarah Lee</h3>
              <button onClick={() => setShowHRMSHistoryModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="font-semibold text-purple-900 mb-2">Recruitment Details</div>
                <div className="space-y-1 text-sm text-purple-800">
                  <div>Recruited: November 14, 2024</div>
                  <div>Recruiter: Jennifer Kim (BMI Recruitment)</div>
                  <div>Position: CFO at TechStart Inc</div>
                  <div>Days since recruitment: 23 days</div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Activity Timeline</h4>
                {[
                  { date: 'Dec 5, 3:15 PM', action: 'Email: Warm intro', status: 'Replied in 1h 20m' },
                  { date: 'Dec 3, 10:00 AM', action: 'Call: Initial outreach', status: 'Positive outcome' },
                  { date: 'Nov 28', action: 'Lead created', status: 'Qualified' },
                  { date: 'Nov 14', action: 'Recruited to TechStart Inc', status: 'Completed' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <div className="font-medium">{item.action}</div>
                      <div className="text-sm text-gray-600">{item.date}</div>
                      <div className="text-sm text-gray-500">{item.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Share File</h3>
              <button onClick={() => setShowShareModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            {selectedFile && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">{selectedFile.name}</span>
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Share with</label>
                <input type="email" placeholder="Enter email address" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Add a message..."></textarea>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowShareModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                Cancel
              </button>
              <button onClick={() => { alert('File shared!'); setShowShareModal(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Composer Modal */}
      {showEmailComposer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{isReplyMode ? 'Reply to Email' : 'Send Email'}</h3>
              <button onClick={() => { setShowEmailComposer(false); setIsReplyMode(false); }} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input type="email" defaultValue={activity.primaryContact?.email} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  defaultValue={isReplyMode ? `Re: ${activity.subject || activity.title}` : ''}
                  placeholder="Email subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Write your message..."></textarea>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => { setShowEmailComposer(false); setIsReplyMode(false); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                Cancel
              </button>
              <button onClick={() => { alert('Email sent!'); setShowEmailComposer(false); setIsReplyMode(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                {isReplyMode ? 'Send Reply' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Log Form Modal */}
      {showCallLogForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Log Call</h3>
              <button onClick={() => setShowCallLogForm(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                <input type="text" defaultValue={activity.primaryContact?.name} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                  <input type="number" placeholder="15" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>Positive</option>
                  <option>Neutral</option>
                  <option>Negative</option>
                  <option>No Answer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Call Notes</label>
                <textarea rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Enter call notes..."></textarea>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowCallLogForm(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                Cancel
              </button>
              <button onClick={() => { alert('Call logged!'); setShowCallLogForm(false); }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                Log Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Editor Modal */}
      {showNoteEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Note</h3>
              <button onClick={() => setShowNoteEditor(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" placeholder="Note title" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea rows={10} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Write your note..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input type="text" placeholder="Add tags separated by commas" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowNoteEditor(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                Cancel
              </button>
              <button onClick={() => { alert('Note saved!'); setShowNoteEditor(false); }} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create Task</h3>
              <button onClick={() => setShowTaskForm(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input type="text" placeholder="Task title" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Task description..."></textarea>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowTaskForm(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                Cancel
              </button>
              <button onClick={() => { alert('Task created!'); setShowTaskForm(false); }} className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-medium">
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Scheduler Modal */}
      {showMeetingScheduler && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Schedule Follow-up Meeting</h3>
              <button onClick={() => setShowMeetingScheduler(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
                <input type="text" placeholder="Meeting title" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>15</option>
                  <option>30</option>
                  <option>45</option>
                  <option>60</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location/Link</label>
                <input type="text" placeholder="Zoom link or location" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowMeetingScheduler(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                Cancel
              </button>
              <button onClick={() => { alert('Meeting scheduled!'); setShowMeetingScheduler(false); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                Schedule Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {showFileUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upload File</h3>
              <button onClick={() => setShowFileUpload(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop files here</p>
                <p className="text-sm text-gray-500 mb-4">or</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  Browse Files
                </button>
              </div>
              <p className="text-xs text-gray-500">Supported formats: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (Max 10MB)</p>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowFileUpload(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                Cancel
              </button>
              <button onClick={() => { alert('File uploaded!'); setShowFileUpload(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPDFPreview && selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{selectedFile.name}</h3>
              <div className="flex gap-2">
                <button onClick={() => alert('Downloading...')} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Download className="w-5 h-5" />
                </button>
                <button onClick={() => setShowPDFPreview(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-100 rounded-lg flex items-center justify-center overflow-auto">
              <div className="text-center p-8">
                <FileText className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">PDF Preview</p>
                <p className="text-sm text-gray-500">{selectedFile.name} ({selectedFile.size})</p>
                <button onClick={() => alert('Opening in new tab...')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  Open in New Tab
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Follow-up Modal (for Calls) */}
      {showLogFollowUpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Log Follow-up Call</h3>
              <button onClick={() => setShowLogFollowUpModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                <input type="text" defaultValue={activity.primaryContact?.name} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                  <input type="number" placeholder="15" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                  <option>Positive</option>
                  <option>Neutral</option>
                  <option>Negative</option>
                  <option>No Answer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Call Notes</label>
                <textarea rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="Enter call notes..."></textarea>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowLogFollowUpModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                Cancel
              </button>
              <button onClick={() => { alert('Follow-up call logged!'); setShowLogFollowUpModal(false); }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                Log Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Player Modal (for Call Recordings) */}
      {showAudioPlayerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Call Recording</h3>
              <div className="flex gap-2">
                <button onClick={() => alert('Downloading...')} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Download className="w-5 h-5" />
                </button>
                <button onClick={() => setShowAudioPlayerModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">BigCo Follow-up Call</span>
                  <span className="text-sm text-gray-600">{activity.recording?.duration || '15:32'}</span>
                </div>
                <div className="mb-2">
                  <div className="bg-gray-300 rounded-full h-2 mb-1">
                    <div className="bg-blue-600 rounded-full h-2 w-1/4"></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>3:45</span>
                    <span>15:32</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <button className="p-3 bg-white rounded-full shadow hover:shadow-lg transition-shadow">
                    <Play className="w-6 h-6 text-blue-600" />
                  </button>
                  <button className="p-2 bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-sm">
                    1x
                  </button>
                </div>
              </div>
              {activity.recording?.keyMoments && (
                <div>
                  <h4 className="font-semibold mb-2">Key Moments</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activity.recording.keyMoments.map((moment: any, idx: number) => (
                      <button
                        key={idx}
                        className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{moment.label}</span>
                          <span className="text-xs text-blue-600">{moment.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-600">{moment.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Transcript Modal */}
      {showTranscriptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">AI Call Transcript</h3>
              <div className="flex gap-2">
                <button onClick={() => alert('Copying...')} className="p-2 hover:bg-gray-100 rounded-lg" title="Copy">
                  <FileText className="w-5 h-5" />
                </button>
                <button onClick={() => alert('Downloading...')} className="p-2 hover:bg-gray-100 rounded-lg" title="Download">
                  <Download className="w-5 h-5" />
                </button>
                <button onClick={() => setShowTranscriptModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
              {activity.recording?.transcript && typeof activity.recording.transcript === 'string' ? (
                <p className="text-gray-700 whitespace-pre-wrap">{activity.recording.transcript}</p>
              ) : (
                [
                  { time: '00:00', speaker: 'John Chen (You)', text: 'Hi Sarah, thanks for taking the time. Following up on our discovery call.' },
                  { time: '00:15', speaker: 'Sarah Lee', text: 'Of course! I discussed your proposal with our executive team.' },
                  { time: '00:32', speaker: 'John Chen (You)', text: 'Great! What were their initial thoughts?' },
                  { time: '00:45', speaker: 'Sarah Lee', text: 'They like the phased approach. But they want clearer ROI metrics for Phase 1.' },
                  { time: '01:12', speaker: 'John Chen (You)', text: 'Understood. I can send you detailed ROI projections for Phase 1 this afternoon.' },
                  { time: '01:25', speaker: 'Sarah Lee', text: 'Perfect. Also, our tech team wants to see integration documentation.' },
                ].map((line, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500 font-mono">{line.time}</span>
                      <span className="font-semibold text-sm">{line.speaker}</span>
                    </div>
                    <p className="text-gray-700">{line.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tracking Details Modal (for Email Attachments) */}
      {showTrackingDetailsModal && selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tracking Details</h3>
              <button onClick={() => setShowTrackingDetailsModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium mb-1">{selectedFile.name}</div>
                <div className="text-sm text-gray-600">{selectedFile.size}</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">{selectedFile.status === 'opened' ? 'Opened' : 'Not opened'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sent:</span>
                  <span className="font-medium">{selectedFile.sent || selectedFile.uploadedAt}</span>
                </div>
                {selectedFile.openedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Opened:</span>
                    <span className="font-medium">{selectedFile.openedAt}</span>
                  </div>
                )}
                {selectedFile.openedBy && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Opened by:</span>
                    <span className="font-medium">{selectedFile.openedBy}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowTrackingDetailsModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Now Modal (for Tasks) */}
      {showContactNowModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Contact Now</h3>
              <button onClick={() => setShowContactNowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowContactNowModal(false);
                  setShowCallLogForm(true);
                }}
                className="w-full p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors flex items-center gap-3"
              >
                <Phone className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">Call Contact</div>
                  <div className="text-sm text-green-700">Initiate a phone call</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowContactNowModal(false);
                  setShowEmailComposer(true);
                }}
                className="w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors flex items-center gap-3"
              >
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">Send Email</div>
                  <div className="text-sm text-blue-700">Compose an email message</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowContactNowModal(false);
                  setShowMeetingScheduler(true);
                }}
                className="w-full p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors flex items-center gap-3"
              >
                <Calendar className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="font-medium text-purple-900">Schedule Meeting</div>
                  <div className="text-sm text-purple-700">Book a meeting time</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalate to Manager Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Escalate to Manager
              </h3>
              <button onClick={() => { setShowEscalateModal(false); setEscalationContext(''); }} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="font-semibold text-red-900 mb-2">Escalation Reason</div>
                <div className="text-sm text-red-800">Deal is at critical risk due to prolonged inactivity and overdue follow-ups.</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Manager</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                  <option>Sarah Johnson (Sales Manager)</option>
                  <option>Mike Davis (VP of Sales)</option>
                  <option>Jennifer Lee (Director of Sales)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority Level</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                  <option>🔴 Critical - Immediate Action Required</option>
                  <option>🟠 High - Within 24 hours</option>
                  <option>🟡 Medium - Within 2-3 days</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Context</label>
                <textarea
                  rows={6}
                  value={escalationContext}
                  onChange={(e) => setEscalationContext(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 placeholder:text-gray-400"
                  placeholder="Describe why you're escalating — e.g. no response for 7 days, competitor moving ahead, multiple failed follow-up attempts…"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Suggested Actions</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Manager to personally call the contact</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Escalate to C-level executive relationship</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Offer special pricing or incentives</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Schedule emergency team review</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => { setShowEscalateModal(false); setEscalationContext(''); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                Cancel
              </button>
              <button
                onClick={() => {
                  const context = escalationContext.trim() || undefined;
                  alert('Escalated to manager!' + (context ? `\nContext: ${context}` : ''));
                  setShowEscalateModal(false);
                  setEscalationContext('');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Escalate Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Task Modal */}
      {showCompleteTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-600 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Mark Task as Complete
              </h3>
              <button onClick={() => setShowCompleteTaskModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="font-semibold text-green-900 mb-1">{activity.title}</div>
                <div className="text-sm text-green-700">You're about to mark this task as complete.</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Completion Notes</label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Add any notes about task completion (optional)..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                  <option>✅ Successful - Objective achieved</option>
                  <option>✅ Successful - Progressed to next stage</option>
                  <option>⚠️ Partial - Some progress made</option>
                  <option>❌ Unsuccessful - No progress</option>
                  <option>🔄 Needs follow-up</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Create follow-up task</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowCompleteTaskModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Task marked as complete!');
                  setShowCompleteTaskModal(false);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Note Modal */}
      {showNewNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Follow-up Note</h3>
              <button onClick={() => setShowNewNoteModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter note title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note Content</label>
                <textarea
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Write your note..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Add tags (comma-separated)"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Pin this note</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowNewNoteModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                Cancel
              </button>
              <button onClick={() => { alert('Follow-up note created!'); setShowNewNoteModal(false); }} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
                Create Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold">Delete Activity</h3>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "{activity.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Activity deleted!');
                  navigate('/crm/activities');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityDetailPage;
