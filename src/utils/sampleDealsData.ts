// Sample Deals Data for Enterprise CRM
import { Deal, DealActivity, DealEmail, DealAttachment, StageHistoryEntry } from '../types/deals';

export const generateSampleDeals = (): Deal[] => {
  const baseDate = new Date('2024-01-01');
  
  return [
    {
      id: 'deal-001',
      dealNumber: 'DEAL-2024-001',
      name: 'TechCorp Enterprise CRM Implementation',
      accountId: 'acc-techcorp',
      contactId: 'contact-john-smith',
      ownerId: 'user-alice',
      pipelineId: 'enterprise-pipeline',
      stageId: 'proposal',
      amount: 285000,
      currency: 'USD',
      probability: 75,
      expectedCloseDate: '2024-03-15',
      dealType: 'new-business',
      leadSource: 'Website',
      campaignId: 'campaign-enterprise',
      description: 'Comprehensive CRM implementation for 500+ user enterprise client. Includes custom integrations, data migration, and 6-month support.',
      nextSteps: 'Schedule technical review meeting with IT team. Finalize integration requirements and timeline.',
      notes: 'Client is very engaged. Main concern is data migration timeline. Competing against Salesforce but our customization capabilities are a strong differentiator.',
      tags: ['enterprise', 'high-value', 'technology', 'custom-integration'],
      customFields: {
        'implementation_timeline': '6 months',
        'user_count': 500,
        'integration_complexity': 'high',
        'decision_timeline': 'Q1 2024'
      },
      priority: 'high',
      health: 'healthy',
      activities: [
        {
          id: 'act-001',
          type: 'call',
          subject: 'Discovery Call - Requirements Gathering',
          description: 'Discussed current pain points, user requirements, and integration needs. Client confirmed budget and timeline.',
          status: 'completed',
          completedAt: '2024-01-20T14:00:00Z',
          duration: 60,
          outcome: 'Positive - confirmed budget and timeline',
          createdBy: 'user-alice',
          createdAt: '2024-01-20T14:00:00Z'
        },
        {
          id: 'act-002',
          type: 'email',
          subject: 'Follow-up: Technical Requirements Document',
          description: 'Sent detailed technical requirements document and integration specifications.',
          status: 'completed',
          completedAt: '2024-01-22T10:30:00Z',
          createdBy: 'user-alice',
          createdAt: '2024-01-22T10:30:00Z'
        },
        {
          id: 'act-003',
          type: 'meeting',
          subject: 'Technical Review Meeting',
          description: 'Review technical requirements with IT team and discuss implementation approach.',
          status: 'planned',
          scheduledAt: '2024-01-25T15:00:00Z',
          createdBy: 'user-alice',
          createdAt: '2024-01-23T09:00:00Z'
        }
      ],
      emails: [
        {
          id: 'email-001',
          subject: 'TechCorp CRM Implementation Proposal',
          body: 'Thank you for your interest in our enterprise CRM solution...',
          direction: 'outbound',
          status: 'opened',
          sentAt: '2024-01-22T10:30:00Z',
          openedAt: '2024-01-22T11:15:00Z',
          fromEmail: 'alice@company.com',
          toEmails: ['john.smith@techcorp.com'],
          createdAt: '2024-01-22T10:30:00Z'
        }
      ],
      attachments: [
        {
          id: 'att-001',
          name: 'TechCorp_Proposal_v2.pdf',
          type: 'application/pdf',
          size: 2048576,
          url: '/attachments/techcorp-proposal.pdf',
          uploadedBy: 'user-alice',
          uploadedAt: '2024-01-22T10:00:00Z'
        },
        {
          id: 'att-002',
          name: 'Technical_Requirements.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 1024768,
          url: '/attachments/tech-requirements.docx',
          uploadedBy: 'user-alice',
          uploadedAt: '2024-01-22T10:00:00Z'
        }
      ],
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-23T09:00:00Z',
      createdBy: 'user-alice',
      lastActivityAt: '2024-01-23T09:00:00Z',
      stageHistory: [
        {
          id: 'hist-001',
          toStageId: 'discovery',
          enteredAt: '2024-01-15T09:00:00Z',
          exitedAt: '2024-01-18T16:00:00Z',
          duration: 79,
          changedBy: 'user-alice'
        },
        {
          id: 'hist-002',
          fromStageId: 'discovery',
          toStageId: 'qualification',
          enteredAt: '2024-01-18T16:00:00Z',
          exitedAt: '2024-01-21T14:00:00Z',
          duration: 70,
          changedBy: 'user-alice'
        },
        {
          id: 'hist-003',
          fromStageId: 'qualification',
          toStageId: 'proposal',
          enteredAt: '2024-01-21T14:00:00Z',
          changedBy: 'user-alice'
        }
      ]
    },
    {
      id: 'deal-002',
      dealNumber: 'DEAL-2024-002',
      name: 'HealthPlus Digital Transformation',
      accountId: 'acc-healthplus',
      contactId: 'contact-sarah-johnson',
      ownerId: 'user-bob',
      pipelineId: 'sales-pipeline',
      stageId: 'negotiation',
      amount: 125000,
      currency: 'USD',
      probability: 85,
      expectedCloseDate: '2024-02-28',
      dealType: 'new-business',
      leadSource: 'Referral',
      description: 'Digital transformation project for healthcare provider. Includes patient management system and compliance tools.',
      nextSteps: 'Finalize contract terms and pricing. Schedule implementation kickoff meeting.',
      notes: 'Client is very motivated to close before end of Q1. Budget approved. Main stakeholder is VP of Operations.',
      tags: ['healthcare', 'digital-transformation', 'compliance', 'urgent'],
      customFields: {
        'patient_volume': '10000+',
        'compliance_requirements': 'HIPAA, SOX',
        'implementation_urgency': 'high'
      },
      priority: 'urgent',
      health: 'healthy',
      activities: [
        {
          id: 'act-004',
          type: 'call',
          subject: 'Stakeholder Alignment Call',
          description: 'Aligned with all key stakeholders on requirements and timeline.',
          status: 'completed',
          completedAt: '2024-01-19T11:00:00Z',
          duration: 45,
          outcome: 'All stakeholders aligned, moving to contract phase',
          createdBy: 'user-bob',
          createdAt: '2024-01-19T11:00:00Z'
        }
      ],
      emails: [],
      attachments: [
        {
          id: 'att-003',
          name: 'HealthPlus_SOW_v1.pdf',
          type: 'application/pdf',
          size: 1536000,
          url: '/attachments/healthplus-sow.pdf',
          uploadedBy: 'user-bob',
          uploadedAt: '2024-01-19T15:00:00Z'
        }
      ],
      createdAt: '2024-01-12T10:00:00Z',
      updatedAt: '2024-01-23T11:00:00Z',
      createdBy: 'user-bob',
      lastActivityAt: '2024-01-19T11:00:00Z',
      stageHistory: [
        {
          id: 'hist-004',
          toStageId: 'lead',
          enteredAt: '2024-01-12T10:00:00Z',
          exitedAt: '2024-01-14T09:00:00Z',
          duration: 47,
          changedBy: 'user-bob'
        },
        {
          id: 'hist-005',
          fromStageId: 'lead',
          toStageId: 'qualified',
          enteredAt: '2024-01-14T09:00:00Z',
          exitedAt: '2024-01-17T16:00:00Z',
          duration: 79,
          changedBy: 'user-bob'
        },
        {
          id: 'hist-006',
          fromStageId: 'qualified',
          toStageId: 'proposal',
          enteredAt: '2024-01-17T16:00:00Z',
          exitedAt: '2024-01-20T14:00:00Z',
          duration: 70,
          changedBy: 'user-bob'
        },
        {
          id: 'hist-007',
          fromStageId: 'proposal',
          toStageId: 'negotiation',
          enteredAt: '2024-01-20T14:00:00Z',
          changedBy: 'user-bob'
        }
      ]
    },
    {
      id: 'deal-003',
      dealNumber: 'DEAL-2024-003',
      name: 'StartupX Growth Platform',
      accountId: 'acc-startupx',
      contactId: 'contact-mike-chen',
      ownerId: 'user-alice',
      pipelineId: 'sales-pipeline',
      stageId: 'closed-won',
      amount: 45000,
      currency: 'USD',
      probability: 100,
      expectedCloseDate: '2024-01-30',
      actualCloseDate: '2024-01-28',
      dealType: 'new-business',
      leadSource: 'LinkedIn',
      description: 'Growth platform for scaling startup. Includes CRM, marketing automation, and analytics.',
      nextSteps: 'Implementation kickoff scheduled for next week.',
      notes: 'Closed successfully! Client was impressed with our startup-friendly pricing and quick implementation timeline.',
      tags: ['startup', 'growth', 'marketing-automation', 'closed-won'],
      customFields: {
        'startup_stage': 'Series A',
        'employee_count': 25,
        'growth_target': '300% in 12 months'
      },
      priority: 'medium',
      health: 'healthy',
      activities: [
        {
          id: 'act-005',
          type: 'meeting',
          subject: 'Contract Signing Meeting',
          description: 'Final contract review and signing ceremony.',
          status: 'completed',
          completedAt: '2024-01-28T16:00:00Z',
          duration: 30,
          outcome: 'Contract signed, deal closed won',
          createdBy: 'user-alice',
          createdAt: '2024-01-28T16:00:00Z'
        }
      ],
      emails: [],
      attachments: [],
      createdAt: '2024-01-08T14:00:00Z',
      updatedAt: '2024-01-28T16:30:00Z',
      createdBy: 'user-alice',
      lastActivityAt: '2024-01-28T16:00:00Z',
      stageHistory: [
        {
          id: 'hist-008',
          toStageId: 'lead',
          enteredAt: '2024-01-08T14:00:00Z',
          exitedAt: '2024-01-10T11:00:00Z',
          duration: 45,
          changedBy: 'user-alice'
        },
        {
          id: 'hist-009',
          fromStageId: 'lead',
          toStageId: 'qualified',
          enteredAt: '2024-01-10T11:00:00Z',
          exitedAt: '2024-01-15T09:00:00Z',
          duration: 118,
          changedBy: 'user-alice'
        },
        {
          id: 'hist-010',
          fromStageId: 'qualified',
          toStageId: 'proposal',
          enteredAt: '2024-01-15T09:00:00Z',
          exitedAt: '2024-01-22T14:00:00Z',
          duration: 173,
          changedBy: 'user-alice'
        },
        {
          id: 'hist-011',
          fromStageId: 'proposal',
          toStageId: 'negotiation',
          enteredAt: '2024-01-22T14:00:00Z',
          exitedAt: '2024-01-26T10:00:00Z',
          duration: 92,
          changedBy: 'user-alice'
        },
        {
          id: 'hist-012',
          fromStageId: 'negotiation',
          toStageId: 'closed-won',
          enteredAt: '2024-01-26T10:00:00Z',
          changedBy: 'user-alice'
        }
      ]
    },
    {
      id: 'deal-004',
      dealNumber: 'DEAL-2024-004',
      name: 'ManufacturingCorp Process Automation',
      accountId: 'acc-manufacturing',
      contactId: 'contact-lisa-wang',
      ownerId: 'user-charlie',
      pipelineId: 'sales-pipeline',
      stageId: 'qualified',
      amount: 95000,
      currency: 'USD',
      probability: 45,
      expectedCloseDate: '2024-04-15',
      dealType: 'new-business',
      leadSource: 'Trade Show',
      description: 'Manufacturing process automation and quality control system. Includes IoT integration and real-time monitoring.',
      nextSteps: 'Schedule facility tour and technical demonstration. Prepare ROI analysis.',
      notes: 'Met at Manufacturing Expo. Strong interest in automation capabilities. Need to demonstrate ROI and integration with existing systems.',
      tags: ['manufacturing', 'automation', 'iot', 'quality-control'],
      customFields: {
        'facility_count': 3,
        'current_system': 'Legacy ERP',
        'automation_level': 'partial'
      },
      priority: 'medium',
      health: 'at-risk',
      activities: [
        {
          id: 'act-006',
          type: 'meeting',
          subject: 'Trade Show Initial Meeting',
          description: 'Initial conversation at Manufacturing Expo booth. Discussed automation needs.',
          status: 'completed',
          completedAt: '2024-01-16T13:00:00Z',
          duration: 20,
          outcome: 'Interested, scheduled follow-up call',
          createdBy: 'user-charlie',
          createdAt: '2024-01-16T13:00:00Z'
        }
      ],
      emails: [],
      attachments: [],
      createdAt: '2024-01-16T15:00:00Z',
      updatedAt: '2024-01-23T12:00:00Z',
      createdBy: 'user-charlie',
      lastActivityAt: '2024-01-16T13:00:00Z',
      stageHistory: [
        {
          id: 'hist-013',
          toStageId: 'lead',
          enteredAt: '2024-01-16T15:00:00Z',
          exitedAt: '2024-01-19T10:00:00Z',
          duration: 67,
          changedBy: 'user-charlie'
        },
        {
          id: 'hist-014',
          fromStageId: 'lead',
          toStageId: 'qualified',
          enteredAt: '2024-01-19T10:00:00Z',
          changedBy: 'user-charlie'
        }
      ]
    },
    {
      id: 'deal-005',
      dealNumber: 'DEAL-2024-005',
      name: 'RetailChain Customer Analytics Platform',
      accountId: 'acc-retailchain',
      contactId: 'contact-david-brown',
      ownerId: 'user-diana',
      pipelineId: 'sales-pipeline',
      stageId: 'proposal',
      amount: 67500,
      currency: 'USD',
      probability: 65,
      expectedCloseDate: '2024-03-30',
      dealType: 'new-business',
      leadSource: 'Cold Email',
      description: 'Customer analytics and business intelligence platform for retail chain with 50+ locations.',
      nextSteps: 'Present analytics dashboard demo to executive team. Address data privacy concerns.',
      notes: 'Retail chain looking to better understand customer behavior across locations. Interested in predictive analytics features.',
      tags: ['retail', 'analytics', 'multi-location', 'customer-insights'],
      customFields: {
        'store_count': 52,
        'customer_records': '500000+',
        'current_analytics': 'basic reporting'
      },
      priority: 'medium',
      health: 'healthy',
      activities: [],
      emails: [],
      attachments: [],
      createdAt: '2024-01-14T11:00:00Z',
      updatedAt: '2024-01-23T13:00:00Z',
      createdBy: 'user-diana',
      lastActivityAt: '2024-01-21T15:00:00Z',
      stageHistory: [
        {
          id: 'hist-015',
          toStageId: 'lead',
          enteredAt: '2024-01-14T11:00:00Z',
          exitedAt: '2024-01-17T14:00:00Z',
          duration: 75,
          changedBy: 'user-diana'
        },
        {
          id: 'hist-016',
          fromStageId: 'lead',
          toStageId: 'qualified',
          enteredAt: '2024-01-17T14:00:00Z',
          exitedAt: '2024-01-21T15:00:00Z',
          duration: 97,
          changedBy: 'user-diana'
        },
        {
          id: 'hist-017',
          fromStageId: 'qualified',
          toStageId: 'proposal',
          enteredAt: '2024-01-21T15:00:00Z',
          changedBy: 'user-diana'
        }
      ]
    },
    {
      id: 'deal-006',
      dealNumber: 'DEAL-2024-006',
      name: 'FinanceGroup Risk Management Suite',
      accountId: 'acc-financegroup',
      contactId: 'contact-jennifer-kim',
      ownerId: 'user-alice',
      pipelineId: 'enterprise-pipeline',
      stageId: 'technical-eval',
      amount: 150000,
      currency: 'USD',
      probability: 55,
      expectedCloseDate: '2024-05-15',
      dealType: 'new-business',
      leadSource: 'Website',
      description: 'Comprehensive risk management and compliance suite for financial services firm.',
      nextSteps: 'Complete technical evaluation phase. Schedule security review with CISO.',
      notes: 'Financial services firm with strict compliance requirements. Technical team is evaluating security and integration capabilities.',
      tags: ['finance', 'risk-management', 'compliance', 'security'],
      customFields: {
        'aum': '$2.5B',
        'regulatory_requirements': 'SEC, FINRA',
        'security_level': 'enterprise'
      },
      priority: 'high',
      health: 'healthy',
      activities: [],
      emails: [],
      attachments: [],
      createdAt: '2024-01-10T08:00:00Z',
      updatedAt: '2024-01-23T14:00:00Z',
      createdBy: 'user-alice',
      lastActivityAt: '2024-01-22T10:00:00Z',
      stageHistory: [
        {
          id: 'hist-018',
          toStageId: 'discovery',
          enteredAt: '2024-01-10T08:00:00Z',
          exitedAt: '2024-01-13T16:00:00Z',
          duration: 80,
          changedBy: 'user-alice'
        },
        {
          id: 'hist-019',
          fromStageId: 'discovery',
          toStageId: 'qualification',
          enteredAt: '2024-01-13T16:00:00Z',
          exitedAt: '2024-01-18T11:00:00Z',
          duration: 115,
          changedBy: 'user-alice'
        },
        {
          id: 'hist-020',
          fromStageId: 'qualification',
          toStageId: 'technical-eval',
          enteredAt: '2024-01-18T11:00:00Z',
          changedBy: 'user-alice'
        }
      ]
    },
    {
      id: 'deal-007',
      dealNumber: 'DEAL-2024-007',
      name: 'EduTech Student Management System',
      accountId: 'acc-edutech',
      contactId: 'contact-robert-chang',
      ownerId: 'user-bob',
      pipelineId: 'sales-pipeline',
      stageId: 'closed-won',
      amount: 38000,
      currency: 'USD',
      probability: 100,
      expectedCloseDate: '2024-01-25',
      actualCloseDate: '2024-01-24',
      dealType: 'new-business',
      leadSource: 'Referral',
      description: 'Student information system for educational institution. Includes enrollment, grading, and parent portal.',
      nextSteps: 'Implementation planning and data migration.',
      notes: 'Successful close! Client was impressed with education-specific features and competitive pricing.',
      tags: ['education', 'student-management', 'closed-won', 'referral'],
      customFields: {
        'student_count': 2500,
        'grade_levels': 'K-12',
        'parent_portal': true
      },
      priority: 'medium',
      health: 'healthy',
      activities: [],
      emails: [],
      attachments: [],
      createdAt: '2024-01-05T09:00:00Z',
      updatedAt: '2024-01-24T17:00:00Z',
      createdBy: 'user-bob',
      lastActivityAt: '2024-01-24T16:00:00Z',
      stageHistory: [
        {
          id: 'hist-021',
          toStageId: 'lead',
          enteredAt: '2024-01-05T09:00:00Z',
          exitedAt: '2024-01-08T14:00:00Z',
          duration: 77,
          changedBy: 'user-bob'
        },
        {
          id: 'hist-022',
          fromStageId: 'lead',
          toStageId: 'qualified',
          enteredAt: '2024-01-08T14:00:00Z',
          exitedAt: '2024-01-12T10:00:00Z',
          duration: 92,
          changedBy: 'user-bob'
        },
        {
          id: 'hist-023',
          fromStageId: 'qualified',
          toStageId: 'proposal',
          enteredAt: '2024-01-12T10:00:00Z',
          exitedAt: '2024-01-18T15:00:00Z',
          duration: 149,
          changedBy: 'user-bob'
        },
        {
          id: 'hist-024',
          fromStageId: 'proposal',
          toStageId: 'negotiation',
          enteredAt: '2024-01-18T15:00:00Z',
          exitedAt: '2024-01-23T11:00:00Z',
          duration: 116,
          changedBy: 'user-bob'
        },
        {
          id: 'hist-025',
          fromStageId: 'negotiation',
          toStageId: 'closed-won',
          enteredAt: '2024-01-23T11:00:00Z',
          changedBy: 'user-bob'
        }
      ]
    },
    {
      id: 'deal-008',
      dealNumber: 'DEAL-2024-008',
      name: 'ConsultingFirm Project Management Tool',
      accountId: 'acc-consulting',
      contactId: 'contact-emily-davis',
      ownerId: 'user-charlie',
      pipelineId: 'sales-pipeline',
      stageId: 'lead',
      amount: 22000,
      currency: 'USD',
      probability: 20,
      expectedCloseDate: '2024-06-30',
      dealType: 'new-business',
      leadSource: 'Website',
      description: 'Project management and client collaboration platform for consulting firm.',
      nextSteps: 'Schedule discovery call to understand current workflow and pain points.',
      notes: 'Small consulting firm looking for project management solution. Budget is limited but growth potential is good.',
      tags: ['consulting', 'project-management', 'small-business'],
      customFields: {
        'consultant_count': 12,
        'project_volume': '20-30 per month',
        'current_tools': 'Excel, Email'
      },
      priority: 'low',
      health: 'stalled',
      activities: [],
      emails: [],
      attachments: [],
      createdAt: '2024-01-20T16:00:00Z',
      updatedAt: '2024-01-23T15:00:00Z',
      createdBy: 'user-charlie',
      stageHistory: [
        {
          id: 'hist-026',
          toStageId: 'lead',
          enteredAt: '2024-01-20T16:00:00Z',
          changedBy: 'user-charlie'
        }
      ]
    },
    {
      id: 'deal-009',
      dealNumber: 'DEAL-2024-009',
      name: 'RealEstate CRM & Lead Management',
      accountId: 'acc-realestate',
      contactId: 'contact-mark-taylor',
      ownerId: 'user-diana',
      pipelineId: 'sales-pipeline',
      stageId: 'negotiation',
      amount: 34500,
      currency: 'USD',
      probability: 70,
      expectedCloseDate: '2024-02-15',
      dealType: 'new-business',
      leadSource: 'Referral',
      description: 'CRM and lead management system for real estate brokerage with 25 agents.',
      nextSteps: 'Finalize agent licensing model and integration with MLS system.',
      notes: 'Real estate brokerage needs better lead distribution and agent performance tracking. Price-sensitive but sees value.',
      tags: ['real-estate', 'lead-management', 'agent-performance'],
      customFields: {
        'agent_count': 25,
        'mls_integration': 'required',
        'lead_volume': '200+ per month'
      },
      priority: 'medium',
      health: 'healthy',
      activities: [],
      emails: [],
      attachments: [],
      createdAt: '2024-01-11T13:00:00Z',
      updatedAt: '2024-01-23T16:00:00Z',
      createdBy: 'user-diana',
      stageHistory: [
        {
          id: 'hist-027',
          toStageId: 'lead',
          enteredAt: '2024-01-11T13:00:00Z',
          exitedAt: '2024-01-14T16:00:00Z',
          duration: 75,
          changedBy: 'user-diana'
        },
        {
          id: 'hist-028',
          fromStageId: 'lead',
          toStageId: 'qualified',
          enteredAt: '2024-01-14T16:00:00Z',
          exitedAt: '2024-01-19T11:00:00Z',
          duration: 115,
          changedBy: 'user-diana'
        },
        {
          id: 'hist-029',
          fromStageId: 'qualified',
          toStageId: 'proposal',
          enteredAt: '2024-01-19T11:00:00Z',
          exitedAt: '2024-01-22T14:00:00Z',
          duration: 75,
          changedBy: 'user-diana'
        },
        {
          id: 'hist-030',
          fromStageId: 'proposal',
          toStageId: 'negotiation',
          enteredAt: '2024-01-22T14:00:00Z',
          changedBy: 'user-diana'
        }
      ]
    },
    {
      id: 'deal-010',
      dealNumber: 'DEAL-2024-010',
      name: 'LogisticsCorp Fleet Management System',
      accountId: 'acc-logistics',
      contactId: 'contact-anna-wilson',
      ownerId: 'user-alice',
      pipelineId: 'enterprise-pipeline',
      stageId: 'discovery',
      amount: 180000,
      currency: 'USD',
      probability: 25,
      expectedCloseDate: '2024-07-30',
      dealType: 'new-business',
      leadSource: 'LinkedIn',
      description: 'Comprehensive fleet management and logistics optimization platform for transportation company.',
      nextSteps: 'Complete discovery phase. Map current logistics workflow and identify optimization opportunities.',
      notes: 'Large logistics company with complex requirements. Long sales cycle expected but high value opportunity.',
      tags: ['logistics', 'fleet-management', 'enterprise', 'optimization'],
      customFields: {
        'fleet_size': 500,
        'routes': 'nationwide',
        'current_system': 'custom built'
      },
      priority: 'high',
      health: 'healthy',
      activities: [],
      emails: [],
      attachments: [],
      createdAt: '2024-01-22T10:00:00Z',
      updatedAt: '2024-01-23T17:00:00Z',
      createdBy: 'user-alice',
      stageHistory: [
        {
          id: 'hist-031',
          toStageId: 'discovery',
          enteredAt: '2024-01-22T10:00:00Z',
          changedBy: 'user-alice'
        }
      ]
    },
    {
      id: 'deal-011',
      dealNumber: 'DEAL-2024-011',
      name: 'NonProfitOrg Donor Management Platform',
      accountId: 'acc-nonprofit',
      contactId: 'contact-susan-lee',
      ownerId: 'user-bob',
      pipelineId: 'sales-pipeline',
      stageId: 'qualified',
      amount: 15000,
      currency: 'USD',
      probability: 60,
      expectedCloseDate: '2024-04-01',
      dealType: 'new-business',
      leadSource: 'Referral',
      description: 'Donor management and fundraising platform for non-profit organization.',
      nextSteps: 'Demonstrate donor segmentation and campaign management features.',
      notes: 'Non-profit with growing donor base. Limited budget but strong mission alignment. Potential for multi-year contract.',
      tags: ['non-profit', 'donor-management', 'fundraising', 'mission-driven'],
      customFields: {
        'donor_count': 5000,
        'annual_fundraising': '$500K',
        'volunteer_count': 200
      },
      priority: 'low',
      health: 'healthy',
      activities: [],
      emails: [],
      attachments: [],
      createdAt: '2024-01-18T14:00:00Z',
      updatedAt: '2024-01-23T18:00:00Z',
      createdBy: 'user-bob',
      stageHistory: [
        {
          id: 'hist-032',
          toStageId: 'lead',
          enteredAt: '2024-01-18T14:00:00Z',
          exitedAt: '2024-01-21T10:00:00Z',
          duration: 68,
          changedBy: 'user-bob'
        },
        {
          id: 'hist-033',
          fromStageId: 'lead',
          toStageId: 'qualified',
          enteredAt: '2024-01-21T10:00:00Z',
          changedBy: 'user-bob'
        }
      ]
    },
    {
      id: 'deal-012',
      dealNumber: 'DEAL-2024-012',
      name: 'TechStartup Growth Analytics Package',
      accountId: 'acc-techstartup',
      contactId: 'contact-alex-rodriguez',
      ownerId: 'user-charlie',
      pipelineId: 'sales-pipeline',
      stageId: 'proposal',
      amount: 28000,
      currency: 'USD',
      probability: 80,
      expectedCloseDate: '2024-02-20',
      dealType: 'new-business',
      leadSource: 'Social Media',
      description: 'Growth analytics and user behavior tracking platform for fast-growing tech startup.',
      nextSteps: 'Review proposal feedback and adjust pricing for startup budget.',
      notes: 'Fast-growing startup with strong product-market fit. Very interested in growth analytics. Price is main concern.',
      tags: ['startup', 'growth-analytics', 'user-behavior', 'price-sensitive'],
      customFields: {
        'funding_stage': 'Series A',
        'user_base': '50K MAU',
        'growth_rate': '20% MoM'
      },
      priority: 'medium',
      health: 'healthy',
      activities: [],
      emails: [],
      attachments: [],
      createdAt: '2024-01-13T12:00:00Z',
      updatedAt: '2024-01-23T19:00:00Z',
      createdBy: 'user-charlie',
      stageHistory: [
        {
          id: 'hist-034',
          toStageId: 'lead',
          enteredAt: '2024-01-13T12:00:00Z',
          exitedAt: '2024-01-16T15:00:00Z',
          duration: 75,
          changedBy: 'user-charlie'
        },
        {
          id: 'hist-035',
          fromStageId: 'lead',
          toStageId: 'qualified',
          enteredAt: '2024-01-16T15:00:00Z',
          exitedAt: '2024-01-20T09:00:00Z',
          duration: 90,
          changedBy: 'user-charlie'
        },
        {
          id: 'hist-036',
          fromStageId: 'qualified',
          toStageId: 'proposal',
          enteredAt: '2024-01-20T09:00:00Z',
          changedBy: 'user-charlie'
        }
      ]
    },
    {
      id: 'deal-013',
      dealNumber: 'DEAL-2024-013',
      name: 'InsuranceCorp Claims Processing Automation',
      accountId: 'acc-insurance',
      contactId: 'contact-rachel-green',
      ownerId: 'user-diana',
      pipelineId: 'enterprise-pipeline',
      stageId: 'qualification',
      amount: 220000,
      currency: 'USD',
      probability: 35,
      expectedCloseDate: '2024-08-15',
      dealType: 'new-business',
      leadSource: 'Trade Show',
      description: 'AI-powered claims processing automation for large insurance company. Includes fraud detection and workflow automation.',
      nextSteps: 'Complete stakeholder interviews and current state analysis.',
      notes: 'Large insurance company with complex legacy systems. Long evaluation process expected. Strong ROI potential.',
      tags: ['insurance', 'automation', 'ai', 'fraud-detection', 'enterprise'],
      customFields: {
        'claims_volume': '100K+ annually',
        'fraud_rate': '3.2%',
        'processing_time': '14 days average'
      },
      priority: 'high',
      health: 'at-risk',
      activities: [],
      emails: [],
      attachments: [],
      createdAt: '2024-01-19T11:00:00Z',
      updatedAt: '2024-01-23T20:00:00Z',
      createdBy: 'user-diana',
      stageHistory: [
        {
          id: 'hist-037',
          toStageId: 'discovery',
          enteredAt: '2024-01-19T11:00:00Z',
          exitedAt: '2024-01-23T16:00:00Z',
          duration: 101,
          changedBy: 'user-diana'
        },
        {
          id: 'hist-038',
          fromStageId: 'discovery',
          toStageId: 'qualification',
          enteredAt: '2024-01-23T16:00:00Z',
          changedBy: 'user-diana'
        }
      ]
    },
    {
      id: 'deal-014',
      dealNumber: 'DEAL-2024-014',
      name: 'FoodChain Inventory & POS Integration',
      accountId: 'acc-foodchain',
      contactId: 'contact-tom-martinez',
      ownerId: 'user-alice',
      pipelineId: 'sales-pipeline',
      stageId: 'closed-lost',
      amount: 55000,
      currency: 'USD',
      probability: 0,
      expectedCloseDate: '2024-01-31',
      actualCloseDate: '2024-01-29',
      dealType: 'new-business',
      leadSource: 'Cold Email',
      description: 'Integrated inventory management and POS system for restaurant chain.',
      nextSteps: 'Deal closed lost - competitor chosen.',
      notes: 'Lost to competitor due to lower pricing and existing POS integration. Client chose cost over features.',
      tags: ['restaurant', 'pos-integration', 'inventory', 'closed-lost', 'price-sensitive'],
      customFields: {
        'restaurant_count': 8,
        'current_pos': 'Square',
        'lost_reason': 'price'
      },
      priority: 'medium',
      health: 'stalled',
      activities: [],
      emails: [],
      attachments: [],
      createdAt: '2024-01-07T10:00:00Z',
      updatedAt: '2024-01-29T18:00:00Z',
      createdBy: 'user-alice',
      stageHistory: [
        {
          id: 'hist-039',
          toStageId: 'lead',
          enteredAt: '2024-01-07T10:00:00Z',
          exitedAt: '2024-01-10T14:00:00Z',
          duration: 76,
          changedBy: 'user-alice'
        },
        {
          id: 'hist-040',
          fromStageId: 'lead',
          toStageId: 'qualified',
          enteredAt: '2024-01-10T14:00:00Z',
          exitedAt: '2024-01-15T11:00:00Z',
          duration: 117,
          changedBy: 'user-alice'
        },
        {
          id: 'hist-041',
          fromStageId: 'qualified',
          toStageId: 'proposal',
          enteredAt: '2024-01-15T11:00:00Z',
          exitedAt: '2024-01-25T16:00:00Z',
          duration: 245,
          changedBy: 'user-alice'
        },
        {
          id: 'hist-042',
          fromStageId: 'proposal',
          toStageId: 'closed-lost',
          enteredAt: '2024-01-25T16:00:00Z',
          changedBy: 'user-alice',
          reason: 'Lost to competitor - pricing'
        }
      ]
    },
    {
      id: 'deal-015',
      dealNumber: 'DEAL-2024-015',
      name: 'LawFirm Case Management System',
      accountId: 'acc-lawfirm',
      contactId: 'contact-patricia-jones',
      ownerId: 'user-bob',
      pipelineId: 'sales-pipeline',
      stageId: 'proposal',
      amount: 42000,
      currency: 'USD',
      probability: 55,
      expectedCloseDate: '2024-03-31',
      dealType: 'new-business',
      leadSource: 'Website',
      description: 'Legal case management and document automation system for mid-size law firm.',
      nextSteps: 'Address security and compliance questions. Provide references from other law firms.',
      notes: 'Law firm with 15 attorneys. Strong interest in document automation and time tracking features. Security is top concern.',
      tags: ['legal', 'case-management', 'document-automation', 'compliance'],
      customFields: {
        'attorney_count': 15,
        'practice_areas': 'Corporate, Litigation',
        'case_volume': '200+ active'
      },
      priority: 'medium',
      health: 'healthy',
      activities: [],
      emails: [],
      attachments: [],
      createdAt: '2024-01-09T15:00:00Z',
      updatedAt: '2024-01-23T21:00:00Z',
      createdBy: 'user-bob',
      stageHistory: [
        {
          id: 'hist-043',
          toStageId: 'lead',
          enteredAt: '2024-01-09T15:00:00Z',
          exitedAt: '2024-01-12T11:00:00Z',
          duration: 68,
          changedBy: 'user-bob'
        },
        {
          id: 'hist-044',
          fromStageId: 'lead',
          toStageId: 'qualified',
          enteredAt: '2024-01-12T11:00:00Z',
          exitedAt: '2024-01-17T13:00:00Z',
          duration: 122,
          changedBy: 'user-bob'
        },
        {
          id: 'hist-045',
          fromStageId: 'qualified',
          toStageId: 'proposal',
          enteredAt: '2024-01-17T13:00:00Z',
          changedBy: 'user-bob'
        }
      ]
    }
  ];
};

// Mock accounts data
export const SAMPLE_ACCOUNTS = [
  { id: 'acc-techcorp', name: 'TechCorp Solutions Inc.', industry: 'Technology', size: 'Large' },
  { id: 'acc-healthplus', name: 'HealthPlus Medical Center', industry: 'Healthcare', size: 'Medium' },
  { id: 'acc-startupx', name: 'StartupX Innovation Labs', industry: 'Technology', size: 'Small' },
  { id: 'acc-manufacturing', name: 'ManufacturingCorp', industry: 'Manufacturing', size: 'Large' },
  { id: 'acc-retailchain', name: 'RetailChain Plus', industry: 'Retail', size: 'Medium' },
  { id: 'acc-financegroup', name: 'FinanceGroup LLC', industry: 'Financial Services', size: 'Large' },
  { id: 'acc-edutech', name: 'EduTech Innovations', industry: 'Education', size: 'Small' },
  { id: 'acc-consulting', name: 'Strategic Consulting Partners', industry: 'Consulting', size: 'Small' },
  { id: 'acc-realestate', name: 'Premier Real Estate', industry: 'Real Estate', size: 'Medium' },
  { id: 'acc-logistics', name: 'LogisticsCorp International', industry: 'Logistics', size: 'Large' },
  { id: 'acc-nonprofit', name: 'Community Impact Foundation', industry: 'Non-Profit', size: 'Small' },
  { id: 'acc-foodchain', name: 'FoodChain Restaurants', industry: 'Food & Beverage', size: 'Medium' },
  { id: 'acc-lawfirm', name: 'Martinez & Associates Law', industry: 'Legal', size: 'Small' },
  { id: 'acc-insurance', name: 'InsuranceCorp America', industry: 'Insurance', size: 'Large' },
  { id: 'acc-techstartup', name: 'TechStartup Innovations', industry: 'Technology', size: 'Small' }
];

// Mock contacts data
export const SAMPLE_CONTACTS = [
  { id: 'contact-john-smith', name: 'John Smith', email: 'john.smith@techcorp.com', position: 'CTO' },
  { id: 'contact-sarah-johnson', name: 'Sarah Johnson', email: 'sarah.johnson@healthplus.com', position: 'VP Operations' },
  { id: 'contact-mike-chen', name: 'Mike Chen', email: 'mike.chen@startupx.com', position: 'CEO' },
  { id: 'contact-lisa-wang', name: 'Lisa Wang', email: 'lisa.wang@manufacturing.com', position: 'Operations Director' },
  { id: 'contact-david-brown', name: 'David Brown', email: 'david.brown@retailchain.com', position: 'VP Sales' },
  { id: 'contact-jennifer-kim', name: 'Jennifer Kim', email: 'jennifer.kim@financegroup.com', position: 'CFO' },
  { id: 'contact-robert-chang', name: 'Robert Chang', email: 'robert.chang@edutech.com', position: 'Founder' },
  { id: 'contact-emily-davis', name: 'Emily Davis', email: 'emily.davis@consulting.com', position: 'Managing Partner' },
  { id: 'contact-mark-taylor', name: 'Mark Taylor', email: 'mark.taylor@realestate.com', position: 'Broker Owner' },
  { id: 'contact-anna-wilson', name: 'Anna Wilson', email: 'anna.wilson@logistics.com', position: 'VP Logistics' },
  { id: 'contact-susan-lee', name: 'Susan Lee', email: 'susan.lee@nonprofit.org', position: 'Executive Director' },
  { id: 'contact-tom-martinez', name: 'Tom Martinez', email: 'tom.martinez@foodchain.com', position: 'Operations Manager' },
  { id: 'contact-patricia-jones', name: 'Patricia Jones', email: 'patricia.jones@lawfirm.com', position: 'Managing Partner' },
  { id: 'contact-rachel-green', name: 'Rachel Green', email: 'rachel.green@insurance.com', position: 'VP Claims' },
  { id: 'contact-alex-rodriguez', name: 'Alex Rodriguez', email: 'alex.rodriguez@techstartup.com', position: 'Head of Growth' }
];

// Mock users data
export const SAMPLE_USERS = [
  { id: 'user-alice', name: 'Alice Johnson', email: 'alice@company.com', role: 'Senior Sales Rep' },
  { id: 'user-bob', name: 'Bob Wilson', email: 'bob@company.com', role: 'Sales Manager' },
  { id: 'user-charlie', name: 'Charlie Davis', email: 'charlie@company.com', role: 'Account Executive' },
  { id: 'user-diana', name: 'Diana Martinez', email: 'diana@company.com', role: 'Enterprise Sales' }
];