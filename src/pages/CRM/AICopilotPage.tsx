import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ExternalLink, Calendar, Mail, FileText, CheckSquare, Download, TrendingUp, AlertTriangle, Target, Shield, DollarSign } from 'lucide-react';
import ConversationSidebar from '../../components/AI/ConversationSidebar';
import EnhancedChatInterface from '../../components/AI/EnhancedChatInterface';

interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  isActive: boolean;
  timeGroup: 'TODAY' | 'YESTERDAY' | 'THIS WEEK' | 'THIS MONTH' | 'OLDER';
}

interface DealRecommendation {
  name: string;
  value: string;
  stage: string;
  badge: {
    icon: string;
    text: string;
    type: 'warning' | 'success' | 'info';
  };
  whyFocus: string[];
  nextAction: {
    title: string;
    details: string[];
  };
  actions: Array<{
    label: string;
    icon?: JSX.Element;
    onClick: () => void;
  }>;
}

interface EnhancedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  deals?: DealRecommendation[];
  summary?: {
    text: string;
    stats: { label: string; value: string }[];
  };
  primaryActions?: Array<{
    label: string;
    icon: JSX.Element;
    onClick: () => void;
  }>;
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    title: 'Which deals should I focus on this week?',
    timestamp: '2 hours ago',
    isActive: true,
    timeGroup: 'TODAY'
  },
  {
    id: '2',
    title: 'Draft email to Sarah at TechStart',
    timestamp: 'Yesterday, 3:45 PM',
    isActive: false,
    timeGroup: 'YESTERDAY'
  },
  {
    id: '3',
    title: "What's my sales forecast for this month?",
    timestamp: 'Yesterday, 10:20 AM',
    isActive: false,
    timeGroup: 'YESTERDAY'
  },
  {
    id: '4',
    title: 'Help me write follow-up for Acme Corp',
    timestamp: '2 days ago',
    isActive: false,
    timeGroup: 'THIS WEEK'
  },
  {
    id: '5',
    title: 'Help me position against Salesforce for Acme',
    timestamp: '3 days ago',
    isActive: false,
    timeGroup: 'THIS WEEK'
  },
  {
    id: '6',
    title: 'Which leads should I contact today?',
    timestamp: '5 days ago',
    isActive: false,
    timeGroup: 'THIS WEEK'
  },
  {
    id: '7',
    title: 'Preparing for DataFlow CFO call tomorrow',
    timestamp: '1 week ago',
    isActive: false,
    timeGroup: 'THIS WEEK'
  },
  {
    id: '8',
    title: 'Competitive analysis: Us vs Salesforce',
    timestamp: '3 weeks ago',
    isActive: false,
    timeGroup: 'THIS MONTH'
  }
];

export default function AICopilotPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>('1');
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasProcessedQuery, setHasProcessedQuery] = useState(false);

  useEffect(() => {
    if (activeConversationId === '1') {
      const dealFocusMessages: EnhancedMessage[] = [
        {
          id: 'msg1',
          role: 'user',
          content: 'Which deals should I focus on this week?',
          timestamp: 'Just now'
        },
        {
          id: 'msg2',
          role: 'assistant',
          content: 'Based on your pipeline, I recommend focusing on these 3 high-priority deals this week:',
          timestamp: 'Just now',
          deals: [
            {
              name: 'Acme Corp',
              value: '$50K',
              stage: 'Prospecting',
              badge: {
                icon: '⚠️',
                text: 'No activity in 5 days - HIGH PRIORITY',
                type: 'warning'
              },
              whyFocus: [
                'Deal is stalled - competitor may be advancing',
                'Budget confirmed ($50K available)',
                'Decision maker (John Chen) engaged'
              ],
              nextAction: {
                title: 'Schedule discovery call this week',
                details: [
                  'Best time: Tuesday 2-4 PM (based on their calendar patterns)'
                ]
              },
              actions: [
                { label: 'View Deal', icon: <ExternalLink className="w-3 h-3" />, onClick: () => navigate('/crm/deals/1') },
                { label: 'Schedule Call', icon: <Calendar className="w-3 h-3" />, onClick: () => {} },
                { label: 'Send Email', icon: <Mail className="w-3 h-3" />, onClick: () => {} }
              ]
            },
            {
              name: 'TechStart Inc',
              value: '$42K',
              stage: 'Qualified',
              badge: {
                icon: '🏢',
                text: 'HRMS Connection (92% AI Score) - WARM LEAD',
                type: 'success'
              },
              whyFocus: [
                'Built-in relationship advantage',
                'Sarah Lee (recruited from TechStart)',
                'High close probability (85%)',
                'Engaged decision maker'
              ],
              nextAction: {
                title: 'Send proposal by Friday',
                details: [
                  'Leverage: Mention Sarah Lee in outreach'
                ]
              },
              actions: [
                { label: 'View Deal', icon: <ExternalLink className="w-3 h-3" />, onClick: () => navigate('/crm/deals/2') },
                { label: 'Send Proposal', icon: <FileText className="w-3 h-3" />, onClick: () => {} },
                { label: 'Use Template', icon: <Mail className="w-3 h-3" />, onClick: () => {} }
              ]
            },
            {
              name: 'DataFlow Inc',
              value: '$95K',
              stage: 'Negotiation',
              badge: {
                icon: '💰',
                text: 'Highest value, 75% close probability',
                type: 'info'
              },
              whyFocus: [
                'In final negotiation stage',
                'Needs gentle push to close',
                'Highest revenue opportunity'
              ],
              nextAction: {
                title: 'Address pricing concerns in proposal',
                details: [
                  'Timeline: Decision expected by Dec 20'
                ]
              },
              actions: [
                { label: 'View Deal', icon: <ExternalLink className="w-3 h-3" />, onClick: () => navigate('/crm/deals/3') },
                { label: 'Draft Proposal', icon: <FileText className="w-3 h-3" />, onClick: () => {} },
                { label: 'Schedule Call', icon: <Calendar className="w-3 h-3" />, onClick: () => {} }
              ]
            }
          ],
          summary: {
            text: 'These 3 deals represent $187K in pipeline value with 84% average close probability. Focusing here could close $157K this month.',
            stats: []
          },
          primaryActions: [
            {
              label: 'View Full Strategy',
              icon: <FileText className="w-4 h-4" />,
              onClick: () => {}
            },
            {
              label: 'Create Tasks',
              icon: <CheckSquare className="w-4 h-4" />,
              onClick: () => {}
            },
            {
              label: 'Export Plan',
              icon: <Download className="w-4 h-4" />,
              onClick: () => {}
            }
          ]
        }
      ];
      setMessages(dealFocusMessages);
    } else if (activeConversationId === '3') {
      const salesForecastMessages: EnhancedMessage[] = [
        {
          id: 'msg7',
          role: 'user',
          content: "What's my sales forecast for this month? How likely am I to hit my $250K target?",
          timestamp: 'Yesterday, 10:20 AM'
        },
        {
          id: 'msg8',
          role: 'assistant',
          content: `Let me analyze your December pipeline to forecast your likelihood of hitting your $250K target...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **DECEMBER SALES FORECAST**

**Current Status:** December 17, 2025 (14 days remaining)
**Target:** $250,000
**Progress:** $127,500 closed (51% of target)
**Gap:** $122,500 needed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 **FORECAST ANALYSIS**

**Scenario 1: Conservative (70% confidence)**
- Current closed: $127,500
- Likely to close: $95,000 (DataFlow $95K × 100%)
- **Total: $222,500** ❌ Miss target by $27,500

**Scenario 2: Moderate (55% confidence)**
- Current closed: $127,500
- Likely to close: $137,000
  - DataFlow: $95K (100% probability)
  - TechStart: $42K (85% → likely closes)
- **Total: $264,500** ✅ **Hit target with $14,500 buffer**

**Scenario 3: Optimistic (30% confidence)**
- Current closed: $127,500
- Likely to close: $187,000
  - DataFlow: $95K (100%)
  - TechStart: $42K (85%)
  - Acme Corp: $50K (65% → stretch goal)
- **Total: $314,500** ✅ **Exceed target by $64,500**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 **MY RECOMMENDATION:**

You have a **55% probability** of hitting your $250K target this month. Here's what needs to happen:

**MUST CLOSE (Critical):**
✅ **DataFlow Inc - $95K** (Due: Dec 20)
   Status: Negotiation stage, 75% → 100% if you address CFO pricing concerns TODAY

✅ **TechStart Inc - $42K** (Due: Dec 27)
   Status: Qualified stage, 85% probability, on track

**If these 2 close:** $127.5K + $137K = **$264.5K ✅**

**STRETCH GOAL:**
🎯 **Acme Corp - $50K** (Due: Jan 15, but could accelerate)
   Status: Prospecting, currently 55% probability
   If you take urgent action this week, could close by Dec 31

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **RISK FACTORS:**

**HIGH RISK:**
- DataFlow CFO concerns - if not resolved, deal slips to Jan
- Acme Corp stalled - needs immediate re-engagement

**MEDIUM RISK:**
- Holiday season (Dec 23-26) - decision-making slows
- Budget freezes for some companies end-of-year

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ **ACTION PLAN TO HIT TARGET:**

**THIS WEEK (Critical):**

1. **Tuesday (Dec 17):**
   - Schedule CFO call for DataFlow
   - Prepare flexible payment options

2. **Wednesday (Dec 18):**
   - Send proposal to TechStart (keep momentum)
   - Present pricing options to DataFlow CFO

3. **Thursday (Dec 19):**
   - Re-engage Acme Corp (try to accelerate to Dec)
   - Follow up with TechStart on proposal

4. **Friday (Dec 20):**
   - Close DataFlow (if CFO happy)
   - Confirm TechStart timeline

**NEXT WEEK (Dec 23-27):**
- Close TechStart
- Push Acme if possible (bonus)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **PROBABILITY BREAKDOWN:**

Miss target ($222K):        30% ⬜⬜⬜
Hit target ($250-270K):     55% ⬜⬜⬜⬜⬜⬜
Exceed target ($300K+):     15% ⬜⬜

**Bottom line:** You're in a good position, but DataFlow is the make-or-break deal. Focus there first.`,
          timestamp: 'Yesterday, 10:21 AM',
          primaryActions: [
            {
              label: 'View Pipeline',
              icon: <TrendingUp className="w-4 h-4" />,
              onClick: () => navigate('/crm/deals')
            },
            {
              label: 'Create Tasks',
              icon: <CheckSquare className="w-4 h-4" />,
              onClick: () => {}
            },
            {
              label: 'Export Forecast',
              icon: <Download className="w-4 h-4" />,
              onClick: () => {}
            }
          ]
        }
      ];
      setMessages(salesForecastMessages);
    } else if (activeConversationId === '4') {
      const emailMessages: EnhancedMessage[] = [
        {
          id: 'msg3',
          role: 'user',
          content: 'Help me write a follow-up email to John at Acme Corp. We had a discovery call last week but he hasn\'t responded to my proposal.',
          timestamp: '2 days ago'
        },
        {
          id: 'msg4',
          role: 'assistant',
          content: `I'll help you craft a compelling follow-up email to John Chen at Acme Corp.

**Based on your CRM data, I can see:**
• Last contact: 5 days ago (Proposal sent via email)
• Email open rate: Opened 2x but no response
• Deal stage: Prospecting → Needs momentum
• Key pain point discussed: Manual data entry inefficiencies

Here's a personalized follow-up email:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Subject:** Quick follow-up - Acme Corp sales process optimization

Hi John,

I wanted to follow up on the proposal I sent last week regarding Acme Corp's sales process automation.

I noticed **Acme recently raised $8M in Series B funding** and expanded to 3 new markets (congrats on the momentum!). This makes our conversation even more timely - as your team scales, manual processes will become an even bigger bottleneck.

Based on what you shared in our call about your current challenges:
• Manual data entry consuming 8+ hours/week per rep
• Lack of real-time pipeline visibility for management
• Difficulty tracking deal progression across teams

Our solution can help you:
✅ **Reduce data entry by 70%** (automated activity logging)
✅ **Improve forecast accuracy by 40%** (AI-powered predictions)
✅ **Cut deal cycles by 25%** (streamlined workflows)

**I've prepared a custom ROI calculator** showing how you could save $84K annually and recover your investment in 4.2 months.

Would you have **15 minutes this week** for a quick call to walk through the numbers? I'm free:
• Tuesday 2-4 PM
• Thursday 10 AM - 12 PM

Looking forward to hearing from you!

Best,
Alex Rodriguez
Sales Representative, BMI CRM
alex@bmicrm.com | +1 (555) 123-4567

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Why this email works:**
✅ References recent company news (Series B funding)
✅ Connects funding to their pain points (scaling challenges)
✅ Recaps value proposition with specific metrics
✅ Adds new value (ROI calculator) to re-engage
✅ Clear call-to-action with specific time options
✅ Professional but conversational tone`,
          timestamp: '2 days ago',
          primaryActions: [
            {
              label: 'Send Now',
              icon: <Mail className="w-4 h-4" />,
              onClick: () => {}
            },
            {
              label: 'Edit Email',
              icon: <FileText className="w-4 h-4" />,
              onClick: () => {}
            },
            {
              label: 'Schedule Send',
              icon: <Calendar className="w-4 h-4" />,
              onClick: () => {}
            },
            {
              label: 'Save as Draft',
              icon: <Download className="w-4 h-4" />,
              onClick: () => {}
            }
          ]
        }
      ];
      setMessages(emailMessages);
    } else if (activeConversationId === '5') {
      const competitiveIntelMessages: EnhancedMessage[] = [
        {
          id: 'msg9',
          role: 'user',
          content: 'Help me position against Salesforce. Acme Corp is evaluating both of us.',
          timestamp: '3 days ago'
        },
        {
          id: 'msg10',
          role: 'assistant',
          content: `I'll help you build a strong positioning strategy against Salesforce for the Acme Corp deal.

Based on your CRM notes, here's what I know about Acme's situation:
- Current pain: Manual data entry, lack of automation
- Team size: 15 sales reps
- Budget: $50K approved
- Decision criteria: Ease of use, ROI, implementation time

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 **YOUR POSITIONING STRATEGY**

**Core Message:**
"While Salesforce is built for enterprise complexity, BMI CRM is purpose-built for fast-growing teams like yours who need results fast, not bureaucracy."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ **YOUR ADVANTAGES (Lead with these):**

**1. HRMS INTEGRATION (🏆 UNIQUE DIFFERENTIATOR)**
   **Your pitch:**
   "We're the only CRM with native HRMS integration. This means:
   • Recruiting employees from target companies = automatic warm B2B leads
   • 33% higher close rates on HRMS-sourced leads
   • Built-in relationship intelligence Salesforce can't match"

   **Impact for Acme:**
   "If you hire 5 people from target companies this year, that's 5 warm enterprise leads worth ~$250K in potential pipeline."

**2. TIME TO VALUE**
   **Your pitch:**
   "We're live in 2 weeks vs Salesforce's 3-6 months implementation."

   **Proof points:**
   • Setup: 3 days (vs 4-6 weeks for Salesforce)
   • Training: 1 week (vs 4-8 weeks for Salesforce)
   • Full adoption: 2 weeks (vs 3-6 months)

   **Impact for Acme:**
   "You could be seeing ROI by January, not Q2 or Q3."

**3. EASE OF USE**
   **Your pitch:**
   "Our adoption rate is 94% vs industry average of 40% for Salesforce."

   **Why it matters:**
   • Less training needed
   • Higher rep satisfaction
   • Faster productivity gains

   **Impact for Acme:**
   "Your reps will actually use it. Half of Salesforce seats go unused because it's too complex."

**4. PRICING & ROI**
   **Your pitch:**
   "We're 60% less expensive with faster ROI."

   **Comparison:**
   • BMI: $50K annually for 15 users = $3,333/user
   • Salesforce: $125K+ annually = $8,333/user
   • Savings: $75K per year

   **Impact for Acme:**
   "That $75K savings could fund another sales rep or marketing campaigns."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **SALESFORCE'S ADVANTAGES (Acknowledge & Counter):**

**"Salesforce has more features"**
   **Your counter:**
   "True, but Acme doesn't need 80% of those features. You need core CRM that works, not feature bloat. Studies show 60% of Salesforce features go unused."

**"Salesforce is the market leader"**
   **Your counter:**
   "Salesforce is great for enterprises with dedicated admins and complex processes. But for a 15-person team, it's like buying a semi-truck when you need a sports car. We're optimized for your size."

**"Salesforce has more integrations"**
   **Your counter:**
   "We have 500+ integrations including all the ones you use (email, calendar, Slack). The difference is ours work out of the box, not requiring custom development."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 **BATTLECARD FOR YOUR CALL**

| **Criteria**          | **BMI CRM** | **Salesforce** |
|-----------------------|-------------|----------------|
| Implementation time   | 2 weeks ✅  | 3-6 months ❌  |
| Ease of use           | 94% adoption✅| 40% adoption ❌|
| HRMS integration      | Native ✅   | None ❌        |
| Annual cost (15 users)| $50K ✅     | $125K+ ❌      |
| Time to ROI           | 4 months ✅ | 12+ months ❌  |
| Support               | Dedicated ✅| Ticketing ❌   |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 **OBJECTION HANDLING SCRIPTS**

**Objection 1:** "But everyone uses Salesforce..."
**Your response:**
"That's exactly why fast-growing companies are switching away. They need agility, not enterprise bureaucracy. Ask yourself: do you want to match what everyone else does, or do you want an advantage?"

**Objection 2:** "What if we outgrow BMI?"
**Your response:**
"Great question. We scale from 10 to 500+ users. But more importantly, let's focus on today's problem: you need a CRM that works NOW, not potentially in 3 years. You can always migrate later if needed, but you can't afford to waste 6 months on Salesforce implementation today."

**Objection 3:** "Our board wants Salesforce..."
**Your response:**
"I understand. But boards care about ROI, not brand names. Show them: $75K savings annually + 4 months faster ROI + 94% adoption vs 40%. That's the business case."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 **NEXT STEPS**

1. **Prepare comparison deck** (I can generate this)
2. **Schedule call with John** to present positioning
3. **Send battlecard email** after the call
4. **Offer head-to-head demo** (show HRMS advantage live)`,
          timestamp: '3 days ago',
          primaryActions: [
            {
              label: 'Generate Comparison Deck',
              icon: <Shield className="w-4 h-4" />,
              onClick: () => {}
            },
            {
              label: 'Draft Battlecard Email',
              icon: <Mail className="w-4 h-4" />,
              onClick: () => {}
            },
            {
              label: 'Create Call Agenda',
              icon: <CheckSquare className="w-4 h-4" />,
              onClick: () => {}
            }
          ]
        }
      ];
      setMessages(competitiveIntelMessages);
    } else if (activeConversationId === '6') {
      const leadPrioritizationMessages: EnhancedMessage[] = [
        {
          id: 'msg5',
          role: 'user',
          content: 'Which leads should I contact today? I have 12 new leads this week.',
          timestamp: '5 days ago'
        },
        {
          id: 'msg6',
          role: 'assistant',
          content: `Based on your 12 new leads from this week, I recommend contacting these **3 high-priority leads TODAY**:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**1. Sarah Miller - VP of Sales, InnovateLabs** 🏢
   **AI Score: 92/100** ⭐⭐⭐⭐⭐

   **Why contact TODAY:**
   • 🏢 HRMS Source (Warm intro available)
   • Recent job change (30 days ago) - buying window open
   • Company size: 150 employees (ICP match)
   • Budget authority: Yes (VP-level)
   • Engagement signal: Downloaded 2 case studies yesterday

   **Best approach:**
   📧 Email introduction mentioning HRMS connection
   ⏰ Best time to send: 2-3 PM (highest open rates for VPs)

   **Suggested subject line:**
   "Sarah - Quick intro from [mutual connection] at BMI"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**2. Michael Torres - Director of Sales Ops, CloudNine**
   **AI Score: 87/100** ⭐⭐⭐⭐

   **Why contact TODAY:**
   • High engagement: Visited pricing page 3x
   • Company recently announced expansion (LinkedIn)
   • Pain point match: Looking for "sales automation"
   • Budget cycle: Q1 budget still available

   **Best approach:**
   📞 Phone call (he prefers calls based on activity)
   ⏰ Best time to call: 10-11 AM PST

   **Talk track:**
   "Hi Michael, I saw CloudNine just announced your East Coast expansion. I help companies scale their sales ops during growth phases..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**3. Jennifer Park - Head of Revenue, GrowthTech**
   **AI Score: 81/100** ⭐⭐⭐⭐

   **Why contact TODAY:**
   • Attended your webinar yesterday (high intent)
   • Company: Fast-growing SaaS (300% YoY)
   • Budget: $50-75K range (matches your sweet spot)
   • Timing: Mentioned "looking for CRM" in webinar chat

   **Best approach:**
   📧 Follow-up email referencing webinar attendance
   ⏰ Best time: Within 24 hours of webinar (strike while hot)

   **Suggested opening:**
   "Hi Jennifer, Great to have you at yesterday's webinar! I noticed you asked about CRM integration with marketing automation..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Summary:**
These 3 leads have the highest combination of:
- Intent signals (engagement, webinar attendance, downloads)
- Timing (recent activities, budget cycles)
- Fit score (ICP match, budget authority)

**Expected outcome:**
If you contact all 3 today, you have a **78% probability** of booking at least 1 discovery call this week.

**Time investment:** ~45 minutes total
- Sarah: 15 min (email + personalization)
- Michael: 20 min (call + follow-up)
- Jennifer: 10 min (quick email)`,
          timestamp: '5 days ago',
          primaryActions: [
            {
              label: 'Create All Tasks',
              icon: <CheckSquare className="w-4 h-4" />,
              onClick: () => {}
            },
            {
              label: 'Send Emails',
              icon: <Mail className="w-4 h-4" />,
              onClick: () => {}
            },
            {
              label: 'View Full Lead List',
              icon: <ExternalLink className="w-4 h-4" />,
              onClick: () => navigate('/crm/leads')
            }
          ]
        }
      ];
      setMessages(leadPrioritizationMessages);
    } else if (activeConversationId === '7') {
      const cfoMeetingPrepMessages: EnhancedMessage[] = [
        {
          id: 'msg11',
          role: 'user',
          content: 'I have a call with the DataFlow CFO tomorrow to discuss pricing. How should I prepare?',
          timestamp: '1 week ago'
        },
        {
          id: 'msg12',
          role: 'assistant',
          content: `Let me help you prepare for tomorrow's CFO call with DataFlow.

Based on your CRM data:
- Deal: DataFlow Inc - $95K (Negotiation stage)
- CFO: Robert Martinez
- Issue: Pricing concerns ($95K vs preferred $80K)
- Champion: Emily Chen (VP Operations) - supports you
- Timeline: Decision expected Dec 20 (3 days away)
- Current probability: 75%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 **MEETING OBJECTIVES**

**Primary Goal:**
Address CFO's pricing concerns and secure verbal commitment

**Secondary Goals:**
- Understand true budget constraints
- Offer flexible payment options
- Leverage Emily's support
- Set clear next steps (contract signature timeline)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **CFO-FOCUSED VALUE PROPOSITION**

CFOs care about 3 things:
1. **ROI** (Return on Investment)
2. **Risk** (Implementation risk, vendor risk)
3. **TCO** (Total Cost of Ownership)

**Your pitch (CFO language):**

"Robert, let me show you the financial case:

**ROI Analysis:**
- Annual cost: $95,000
- Expected savings: $187,000/year
  - Time savings: $84K (reduced data entry)
  - Productivity gains: $63K (faster deal cycles)
  - Win rate improvement: $40K (better forecasting)
- Net benefit: $92,000 annually
- **ROI: 97%** (recover investment in 6.1 months)

**5-Year TCO:**
- BMI CRM: $475K total (5 years)
- Current manual process: $935K (5 years)
- **Savings: $460,000** over 5 years

**Risk Mitigation:**
- Implementation risk: LOW (2-week deployment)
- Vendor risk: MEDIUM (established 8 years, 2,000+ customers)
- Adoption risk: LOW (94% user adoption rate)

Does this address your financial concerns?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 **PRICING FLEXIBILITY OPTIONS**

**If he pushes back on $95K, offer these in order:**

**Option 1: Annual Prepayment Discount**
- Pay full year upfront: $95K → $88K (7% discount)
- Justification: "We pass cash flow savings to you"
- **Meets his $80K target? No, but gets closer**

**Option 2: Phased Implementation**
- Phase 1 (3 months): $24K - Core CRM only
- Phase 2 (3 months): $24K - Add automation
- Phase 3 (6 months): $47K - Full platform
- Total: $95K but spread over 12 months
- **Fits budget better? Yes, easier to approve**

**Option 3: Performance-Based Pricing** ⭐ BEST OPTION
- Base fee: $75K (fixed)
- Performance bonus: $20K (if ROI targets hit)
- Total potential: $95K
- **Risk:** You take on performance risk
- **Benefit:** Gets him to $75K base (close to $80K target)
- **Win-win:** If you deliver, you get full $95K

**Option 4: Multi-Year Contract**
- Year 1: $85K (11% discount)
- Year 2: $90K
- Year 3: $95K
- 3-year total: $270K (saves $15K vs annual)
- **Benefit:** Lock in customer, he gets discount

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗣️ **CALL STRUCTURE (30-minute call)**

**Minutes 1-5: Rapport & Agenda**
"Robert, thanks for taking this call. I know you're evaluating our proposal, and I want to make sure we address your financial concerns. I've prepared an ROI analysis and some flexible payment options. Does that work?"

**Minutes 6-15: Present ROI Analysis**
[Use CFO-focused value prop above]
Ask: "Does this financial case make sense to you?"
Listen for objections.

**Minutes 16-25: Address Pricing Concerns**
Ask: "What specifically concerns you about the $95K price?"
Listen carefully. Then present Option 3 (Performance-Based) first.

**Minutes 26-30: Close & Next Steps**
"Robert, if we can agree on [chosen option] today, we can have you live by January 5th. Can I send the revised contract this afternoon?"

Get verbal yes or clear objection.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❓ **ANTICIPATED OBJECTIONS & RESPONSES**

**Objection 1:** "Your competitors are cheaper"
**Response:**
"I understand cost is important. However, cheaper CRMs have 40% adoption rates, meaning you waste money on licenses nobody uses. Our 94% adoption means your full investment actually gets used. That's true value."

**Objection 2:** "We don't have budget for $95K"
**Response:**
"Let me ask - is it a budget issue or a value issue? If I can show you $187K in savings annually, does the $95K investment make sense? [Wait for answer] If yes, let's talk about payment flexibility [present Option 3]."

**Objection 3:** "Can we do a pilot first?"
**Response:**
"I appreciate wanting to test, but pilots actually delay ROI. What if we do this: Performance-based pricing. You pay $75K base, and only pay the remaining $20K if we hit ROI targets in 6 months. You're protected, and we're motivated to deliver. Fair?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 **PRE-CALL CHECKLIST**

☐ Review Emily's notes (your champion's insights)
☐ Prepare ROI calculator (editable spreadsheet)
☐ Print pricing flexibility options (1-pager)
☐ Have contract ready to send (if he says yes)
☐ Prepare 3 customer references (similar size companies)
☐ Calendar holds for follow-up call (if needed)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 **SUCCESS CRITERIA**

**Best outcome:**
Verbal yes on revised pricing, contract sent same day

**Good outcome:**
Agreement on Option 3 (performance-based), needs board approval

**Acceptable outcome:**
Understands value, needs 2-3 days to discuss internally

**Bad outcome:**
Still concerned about price, wants to look at other vendors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 **LEVERAGE EMILY (YOUR CHAMPION)**

Before the call, email Emily:
"Emily, I have a call with Robert tomorrow about pricing. What's the best way to position the value to him? Any insights on his priorities or concerns?"

After the call (if positive):
"Emily, Robert seemed receptive to [option]. Can you help push this across the finish line internally?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 **FINAL TIPS**

1. **Listen more than talk** (60/40 rule)
2. **Let him voice concerns** before presenting solutions
3. **Use his language** (ROI, TCO, risk mitigation)
4. **Be confident but flexible** on pricing
5. **Close with clear next steps** (contract timeline)

**Probability forecast:**
If call goes well: 75% → 90% close probability
If you get verbal yes: 90% → 95%+ close probability`,
          timestamp: '1 week ago',
          primaryActions: [
            {
              label: 'Create Call Script',
              icon: <FileText className="w-4 h-4" />,
              onClick: () => {}
            },
            {
              label: 'Generate ROI Deck',
              icon: <DollarSign className="w-4 h-4" />,
              onClick: () => {}
            },
            {
              label: 'Set Reminders',
              icon: <Calendar className="w-4 h-4" />,
              onClick: () => {}
            }
          ]
        }
      ];
      setMessages(cfoMeetingPrepMessages);
    } else if (activeConversationId === null) {
      setMessages([]);
    }
  }, [activeConversationId, navigate]);

  useEffect(() => {
    const query = searchParams.get('query');
    if (query && !hasProcessedQuery) {
      handleNewChat();
      setTimeout(() => {
        handleSendMessage(query);
        setHasProcessedQuery(true);
        setSearchParams({});
      }, 100);
    }
  }, [searchParams, hasProcessedQuery]);

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setConversations(prevConvs =>
      prevConvs.map(conv => ({ ...conv, isActive: false }))
    );
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setConversations(prevConvs =>
      prevConvs.map(conv => ({
        ...conv,
        isActive: conv.id === id
      }))
    );
  };

  const generateMockResponse = (userQuery: string): EnhancedMessage => {
    const query = userQuery.toLowerCase();

    if (query.includes('deal') && (query.includes('focus') || query.includes('priorit') || query.includes('pipeline'))) {
      return {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: 'Based on your pipeline, I recommend focusing on these 3 high-priority deals this week:',
        timestamp: 'Just now',
        deals: [
          {
            name: 'Acme Corp',
            value: '$50K',
            stage: 'Prospecting',
            badge: {
              icon: '⚠️',
              text: 'No activity in 5 days - HIGH PRIORITY',
              type: 'warning'
            },
            whyFocus: [
              'Deal is stalled - competitor may be advancing',
              'Budget confirmed ($50K available)',
              'Decision maker (John Chen) engaged'
            ],
            nextAction: {
              title: 'Schedule discovery call this week',
              details: ['Call John Chen', 'Discuss pain points', 'Present solution overview']
            },
            actions: [
              { label: 'Schedule Call', icon: <Calendar className="w-4 h-4" />, onClick: () => navigate('/calendar') },
              { label: 'Send Email', icon: <Mail className="w-4 h-4" />, onClick: () => console.log('Email') },
              { label: 'View Deal', icon: <ExternalLink className="w-4 h-4" />, onClick: () => navigate('/crm/deals/1') }
            ]
          },
          {
            name: 'TechStart Inc',
            value: '$42K',
            stage: 'Qualified',
            badge: {
              icon: '✅',
              text: 'Strong engagement - Ready to close',
              type: 'success'
            },
            whyFocus: [
              'Decision maker highly engaged',
              'Timeline confirmed (needs solution by end of month)',
              'Budget approved and allocated'
            ],
            nextAction: {
              title: 'Send proposal and schedule demo',
              details: ['Prepare custom proposal', 'Schedule product demo', 'Invite key stakeholders']
            },
            actions: [
              { label: 'Create Proposal', icon: <FileText className="w-4 h-4" />, onClick: () => console.log('Proposal') },
              { label: 'Schedule Demo', icon: <Calendar className="w-4 h-4" />, onClick: () => navigate('/calendar') },
              { label: 'View Deal', icon: <ExternalLink className="w-4 h-4" />, onClick: () => navigate('/crm/deals/2') }
            ]
          },
          {
            name: 'DataFlow Inc',
            value: '$95K',
            stage: 'Negotiation',
            badge: {
              icon: '💰',
              text: 'High value - Close this month',
              type: 'info'
            },
            whyFocus: [
              'Largest deal in pipeline',
              'CFO meeting scheduled for next week',
              'Contract in legal review'
            ],
            nextAction: {
              title: 'Prepare for CFO presentation',
              details: ['Build ROI calculator', 'Prepare financial justification', 'Coordinate with legal team']
            },
            actions: [
              { label: 'Prep CFO Deck', icon: <FileText className="w-4 h-4" />, onClick: () => console.log('Deck') },
              { label: 'ROI Calculator', icon: <DollarSign className="w-4 h-4" />, onClick: () => console.log('ROI') },
              { label: 'View Deal', icon: <ExternalLink className="w-4 h-4" />, onClick: () => navigate('/crm/deals/3') }
            ]
          }
        ]
      };
    }

    if (query.includes('lead') && (query.includes('contact') || query.includes('reach out') || query.includes('today'))) {
      return {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: 'Based on lead scores and engagement signals, here are the top 5 leads to contact today:',
        timestamp: 'Just now',
        summary: {
          text: 'These leads have shown recent buying signals (website visits, content downloads) and high engagement scores. Prioritize reaching out before end of day.',
          stats: [
            { label: 'Total High-Priority Leads', value: '5' },
            { label: 'Avg Lead Score', value: '87/100' },
            { label: 'Expected Response Rate', value: '68%' }
          ]
        },
        primaryActions: [
          { label: 'Create Outreach Sequence', icon: <Mail className="w-4 h-4" />, onClick: () => navigate('/sequences') },
          { label: 'Schedule Calls', icon: <Calendar className="w-4 h-4" />, onClick: () => navigate('/calendar') },
          { label: 'View All Leads', icon: <Target className="w-4 h-4" />, onClick: () => navigate('/crm/leads') }
        ]
      };
    }

    if (query.includes('email') && (query.includes('write') || query.includes('draft') || query.includes('help'))) {
      return {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: 'I can help you write an email! What type of email would you like to write?\n\n📧 Follow-up email after a meeting\n📧 Cold outreach to a new prospect\n📧 Proposal introduction\n📧 Contract negotiation\n📧 Re-engagement with dormant lead\n\nPlease specify the recipient and purpose, and I\'ll draft a personalized email for you.',
        timestamp: 'Just now',
        primaryActions: [
          { label: 'Follow-up Email Template', icon: <Mail className="w-4 h-4" />, onClick: () => console.log('Template: Follow-up') },
          { label: 'Cold Outreach Template', icon: <Mail className="w-4 h-4" />, onClick: () => console.log('Template: Cold') },
          { label: 'View All Templates', icon: <FileText className="w-4 h-4" />, onClick: () => navigate('/sequences/email-templates') }
        ]
      };
    }

    if (query.includes('forecast') || query.includes('quota') || query.includes('target') || query.includes('month')) {
      return {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: 'Here\'s your sales forecast for this month based on current pipeline:',
        timestamp: 'Just now',
        summary: {
          text: 'You have $187K in qualified pipeline across 8 deals. Based on historical close rates and deal stages, you have an 82% probability of hitting your $250K target if you close Acme Corp and DataFlow Inc.',
          stats: [
            { label: 'Monthly Target', value: '$250K' },
            { label: 'Current Pipeline', value: '$187K' },
            { label: 'Forecasted Close', value: '$205K' },
            { label: 'Gap to Target', value: '$45K' },
            { label: 'Probability to Hit Target', value: '82%' }
          ]
        },
        primaryActions: [
          { label: 'View Pipeline Report', icon: <TrendingUp className="w-4 h-4" />, onClick: () => navigate('/analytics') },
          { label: 'Focus on Gap Deals', icon: <Target className="w-4 h-4" />, onClick: () => console.log('Gap deals') },
          { label: 'Export Forecast', icon: <Download className="w-4 h-4" />, onClick: () => console.log('Export') }
        ]
      };
    }

    if (query.includes('strateg') || query.includes('recommend') || query.includes('advice')) {
      return {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: 'Based on your current pipeline and performance trends, here are my strategic recommendations:',
        timestamp: 'Just now',
        summary: {
          text: '1. **Focus on closing DataFlow Inc** - This $95K deal is in negotiation and has the highest potential.\n2. **Re-engage Acme Corp immediately** - 5 days of silence puts this deal at risk.\n3. **Fast-track TechStart Inc proposal** - They have an urgent timeline and high buying intent.\n4. **Block 2 hours daily for high-priority activities** - Reduce admin time and focus on revenue-generating activities.',
          stats: [
            { label: 'High-Priority Deals', value: '3' },
            { label: 'At-Risk Deals', value: '1' },
            { label: 'Expected Revenue Impact', value: '+$157K' }
          ]
        },
        primaryActions: [
          { label: 'Create Weekly Plan', icon: <CheckSquare className="w-4 h-4" />, onClick: () => console.log('Weekly plan') },
          { label: 'View Full Strategy', icon: <ExternalLink className="w-4 h-4" />, onClick: () => navigate('/crm/ai-response-detail') },
          { label: 'Schedule Focus Time', icon: <Calendar className="w-4 h-4" />, onClick: () => navigate('/calendar') }
        ]
      };
    }

    return {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: `I understand you're asking about: "${userQuery}"\n\nI can help you with:\n\n📊 **Pipeline & Deal Analysis** - "Which deals should I focus on?"\n🎯 **Lead Prioritization** - "Which leads should I contact today?"\n✉️ **Email Writing** - "Help me write an email to..."\n📈 **Sales Forecasting** - "What's my forecast for this month?"\n💡 **Strategy & Recommendations** - "How can I improve my close rate?"\n\nWhat would you like help with?`,
      timestamp: 'Just now',
      primaryActions: [
        { label: 'Analyze Pipeline', icon: <TrendingUp className="w-4 h-4" />, onClick: () => console.log('Pipeline') },
        { label: 'Prioritize Leads', icon: <Target className="w-4 h-4" />, onClick: () => console.log('Leads') },
        { label: 'Get Strategy', icon: <Lightbulb className="w-4 h-4" />, onClick: () => console.log('Strategy') }
      ]
    };
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: EnhancedMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    setTimeout(() => {
      const aiMessage = generateMockResponse(content);
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);

      if (!activeConversationId) {
        const newConv: Conversation = {
          id: `conv-${Date.now()}`,
          title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
          timestamp: 'Just now',
          isActive: true,
          timeGroup: 'TODAY'
        };
        setConversations(prev => [
          newConv,
          ...prev.map(c => ({ ...c, isActive: false }))
        ]);
        setActiveConversationId(newConv.id);
      }
    }, 1500);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations(prev => prev.map(conv =>
      conv.id === id ? { ...conv, title: newTitle } : conv
    ));
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
      />
      <EnhancedChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
