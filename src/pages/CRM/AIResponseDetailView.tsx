import { useState } from 'react';
import { ArrowLeft, Share2, Download, Printer, CheckSquare, Mail, RefreshCw, ThumbsUp, ThumbsDown, MessageCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DealPriority {
  rank: number;
  name: string;
  value: number;
  priority: string;
  priorityColor: string;
  stage: string;
  week: string;
  lastActivity: string;
  healthScore: number;
  healthTrend: 'up' | 'down' | 'stable';
  closeProbability: number;
  potentialProbability?: number;
  decisionMakers: Array<{
    name: string;
    title: string;
    isPrimary?: boolean;
  }>;
  whyItMatters: string[];
  risks?: Array<{
    level: 'high' | 'medium' | 'low';
    description: string;
  }>;
  opportunities?: string[];
  actions: Array<{
    day: string;
    date: string;
    icon: string;
    action: string;
    details: string;
  }>;
  successMetrics: string[];
}

export default function AIResponseDetailView() {
  const navigate = useNavigate();
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const handleTaskToggle = (taskKey: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskKey)) {
        newSet.delete(taskKey);
      } else {
        newSet.add(taskKey);
      }
      return newSet;
    });
  };

  const handleScheduleCall = (contact: string, company: string, dealValue: number) => {
    console.log(`Opening Meeting Scheduler for ${contact} at ${company} ($${dealValue})`);
    alert(`Meeting Scheduler Modal\n\nPre-filled:\n- Contact: ${contact}\n- Company: ${company}\n- Deal Value: $${dealValue.toLocaleString()}\n\nThis would open the meeting scheduler modal in the full implementation.`);
  };

  const handleSendEmail = (to: string, subject: string, body: string) => {
    console.log(`Opening Email Composer: To ${to}`);
    alert(`Email Composer Modal\n\nTo: ${to}\nSubject: ${subject}\n\nBody:\n${body}\n\nThis would open the email composer modal in the full implementation.`);
  };

  const handleGenerateProposal = (company: string, dealValue: number, contact: string) => {
    console.log(`Opening Proposal Builder for ${company}`);
    alert(`Proposal Builder Modal\n\nPre-filled:\n- Company: ${company}\n- Deal Value: $${dealValue.toLocaleString()}\n- Contact: ${contact}\n\nThis would open the proposal builder modal in the full implementation.`);
  };

  const handleOpenROICalculator = (company: string, dealValue: number) => {
    console.log(`Opening ROI Calculator for ${company}`);
    alert(`ROI Calculator Modal\n\nPre-filled:\n- Company: ${company}\n- Deal Value: $${dealValue.toLocaleString()}\n\nFeatures:\n- Annual cost calculator\n- Expected savings projection\n- ROI % and payback period\n- 3-year forecast\n\nThis would open the ROI calculator modal in the full implementation.`);
  };

  const handleExportPDF = () => {
    console.log('Exporting AI Strategy to PDF');
    alert('Generating PDF...\n\nFilename: AI_Strategy_Weekly_Focus_Dec17_2025.pdf\n\nIncludes:\n- Executive Summary\n- Priority Deals Analysis\n- Action Checklist\n- Impact Forecast\n- AI Recommendations\n\nDownloading to your device...');
  };

  const handlePrint = () => {
    console.log('Opening print dialog');
    window.print();
  };

  const handleCreateAllTasks = () => {
    const taskCount = Object.values(weeklyChecklist).flat().length;
    const incompleteTasks = taskCount - completedTasks.size;

    if (incompleteTasks === 0) {
      alert('All tasks are already created!');
      return;
    }

    const confirmed = window.confirm(`Create ${incompleteTasks} tasks in CRM?\n\nThis will add all unchecked tasks to your Activities module.`);

    if (confirmed) {
      console.log(`Creating ${incompleteTasks} tasks in CRM`);
      alert(`Success!\n\n${incompleteTasks} tasks have been created in your Activities module.\n\nYou can view them in Module 6: Activities & Tasks.`);
    }
  };

  const handleRefreshAnalysis = () => {
    console.log('Refreshing AI analysis with latest CRM data');
    alert('Refreshing Analysis...\n\nFetching latest data from:\n- Deals pipeline\n- Contact activities\n- Email engagement\n- Calendar events\n\nThis may take a few seconds...');

    setTimeout(() => {
      alert('Analysis Updated!\n\nAll sections have been refreshed with the latest CRM data.');
    }, 1500);
  };

  const handleSaveStrategy = () => {
    const strategyName = window.prompt('Save this strategy as a template?\n\nEnter a name for this strategy:', 'Weekly Focus Strategy - Dec 2025');

    if (strategyName) {
      console.log(`Saving strategy: ${strategyName}`);
      alert(`Strategy Saved!\n\n"${strategyName}" has been saved to your AI Strategy Library.\n\nYou can reuse this template for similar scenarios in the future.`);
    }
  };

  const handleFeedback = (helpful: boolean) => {
    if (helpful) {
      alert('Thanks for your feedback!\n\nWe\'re glad this AI strategy was helpful.');
    } else {
      const feedback = window.prompt('What could be improved?\n\nYour feedback helps us make the AI Copilot better:', '');
      if (feedback) {
        console.log(`Negative feedback: ${feedback}`);
        alert('Thank you for your feedback!\n\nWe\'ll use this to improve the AI Copilot.');
      }
    }
  };

  const responseMetadata = {
    generated: 'December 17, 2025 at 10:23 AM',
    user: 'Alex Rodriguez (Sales Representative)',
    question: 'Which deals should I focus on this week?'
  };

  const executiveSummary = {
    dealsCount: 3,
    totalValue: 187000,
    avgProbability: 84,
    expectedRevenue: 157080,
    timeNeeded: '~8 hours this week',
    outcome: 'If you execute the recommended actions, you have an 87% probability of closing at least 2 of these 3 deals before month-end.'
  };

  const priorityDeals: DealPriority[] = [
    {
      rank: 1,
      name: 'ACME CORP',
      value: 50000,
      priority: 'URGENT (Deal at risk of stalling)',
      priorityColor: 'red',
      stage: 'Prospecting',
      week: 'Week 2 of 8',
      lastActivity: '5 days ago (Email sent, no response)',
      healthScore: 68,
      healthTrend: 'down',
      closeProbability: 55,
      potentialProbability: 65,
      decisionMakers: [
        { name: 'John Chen', title: 'VP of Sales', isPrimary: true },
        { name: 'Michael Wong', title: 'Director of Operations' }
      ],
      whyItMatters: [
        'Budget confirmed ($50K allocated in Q1)',
        'Pain point identified (manual data entry inefficiencies)',
        'Competitor activity detected (LinkedIn mentions of Salesforce eval)',
        'No engagement in 5 days - momentum is dropping'
      ],
      risks: [
        { level: 'high', description: 'Competitor may be advancing while we\'re silent' },
        { level: 'medium', description: 'Decision timeline slipping (expected Q1 → Q2?)' }
      ],
      actions: [
        {
          day: 'TUESDAY',
          date: 'Dec 17',
          icon: '📞',
          action: 'Schedule discovery call',
          details: 'Best time: 2-4 PM PST (based on John\'s calendar patterns)\nDuration: 30 minutes'
        },
        {
          day: 'WEDNESDAY',
          date: 'Dec 18',
          icon: '📧',
          action: 'Send personalized follow-up email',
          details: 'Subject: "Quick update on Acme\'s sales process optimization"'
        },
        {
          day: 'THURSDAY',
          date: 'Dec 19',
          icon: '🔍',
          action: 'Research competitor positioning',
          details: 'Prepare Salesforce comparison document'
        }
      ],
      successMetrics: [
        'Call scheduled → +10% close probability',
        'Proposal sent by Friday → +15% close probability',
        'Total potential: 55% → 80% close probability'
      ]
    },
    {
      rank: 2,
      name: 'TECHSTART INC',
      value: 42000,
      priority: 'HIGH (HRMS Connection - Warm Lead)',
      priorityColor: 'blue',
      stage: 'Qualified',
      week: 'Week 3 of 8',
      lastActivity: 'Yesterday (Demo completed successfully)',
      healthScore: 92,
      healthTrend: 'up',
      closeProbability: 85,
      decisionMakers: [
        { name: 'David Park', title: 'Head of Sales', isPrimary: true },
        { name: 'Jennifer Liu', title: 'CFO (Budget approval)' }
      ],
      whyItMatters: [
        'HRMS connection: Sarah Lee recruited from TechStart (warm intro)',
        'High AI score (92/100) - strongest lead in pipeline',
        'Decision maker highly engaged (attended demo, asked 12 questions)',
        'Budget cycle aligns (Q1 spending approved)'
      ],
      opportunities: [
        'UNIQUE ADVANTAGE: Built-in relationship through Sarah Lee',
        'STRONG FIT: Their pain points match our strengths perfectly'
      ],
      actions: [
        {
          day: 'WEDNESDAY',
          date: 'Dec 18',
          icon: '📄',
          action: 'Send personalized proposal',
          details: 'Include: ROI calculator, implementation timeline, Sarah Lee reference'
        },
        {
          day: 'THURSDAY',
          date: 'Dec 19',
          icon: '📞',
          action: 'Follow-up call with David Park',
          details: 'Agenda: Address questions, discuss next steps'
        },
        {
          day: 'FRIDAY',
          date: 'Dec 20',
          icon: '💡',
          action: 'Leverage Sarah Lee connection',
          details: 'Ask Sarah to make warm intro to David Park'
        }
      ],
      successMetrics: [
        'Proposal sent → +5% close probability (85% → 90%)',
        'Sarah Lee intro → +10% close probability (90% → 95%+)'
      ]
    },
    {
      rank: 3,
      name: 'DATAFLOW INC',
      value: 95000,
      priority: 'HIGH (Highest Value, Final Stage)',
      priorityColor: 'green',
      stage: 'Negotiation',
      week: 'Week 6 of 8',
      lastActivity: '2 days ago (Pricing discussion)',
      healthScore: 78,
      healthTrend: 'stable',
      closeProbability: 75,
      decisionMakers: [
        { name: 'Emily Chen', title: 'VP of Operations (Champion)', isPrimary: true },
        { name: 'Robert Martinez', title: 'CFO (Final approver)' }
      ],
      whyItMatters: [
        'Highest value deal in pipeline ($95K)',
        'In final negotiation stage - close to finish line',
        'Champion (Emily) strongly advocates for solution',
        'Pricing concerns from CFO - needs addressed'
      ],
      risks: [
        { level: 'medium', description: 'CFO hesitant on pricing ($95K vs preferred $80K)' },
        { level: 'medium', description: 'Decision timeline: Expected by Dec 20 (3 days away)' }
      ],
      actions: [
        {
          day: 'TUESDAY',
          date: 'Dec 17',
          icon: '📄',
          action: 'Prepare revised proposal with flexible payment terms',
          details: 'Options: Annual vs quarterly billing, phased implementation'
        },
        {
          day: 'WEDNESDAY',
          date: 'Dec 18',
          icon: '📞',
          action: 'Call with Emily (Champion) - align on CFO objection handling',
          details: 'Get her insights on Robert\'s concerns'
        },
        {
          day: 'THURSDAY',
          date: 'Dec 19',
          icon: '🤝',
          action: 'Joint call with Emily + Robert (CFO)',
          details: 'Present: ROI analysis, flexible payment terms, case studies'
        }
      ],
      successMetrics: [
        'Flexible payment options → +10% close probability (75% → 85%)',
        'CFO meeting successful → +15% close probability (85% → 90%+)'
      ]
    }
  ];

  const weeklyChecklist = {
    tuesday: [
      'Schedule discovery call with Acme Corp (John Chen)',
      'Prepare revised proposal for DataFlow Inc'
    ],
    wednesday: [
      'Send follow-up email to Acme Corp',
      'Send personalized proposal to TechStart Inc',
      'Call Emily Chen (DataFlow champion) - CFO strategy'
    ],
    thursday: [
      'Research Salesforce comparison for Acme Corp',
      'Follow-up call with TechStart (David Park)',
      'Joint call with DataFlow (Emily + Robert)'
    ],
    friday: [
      'Request Sarah Lee intro to TechStart decision maker',
      'Send proposal to Acme Corp (if call went well)',
      'Follow-up with DataFlow CFO on decision'
    ]
  };

  const impactForecast = [
    { deal: 'Acme Corp', value: 50000, probability: 65, expected: 32500 },
    { deal: 'TechStart Inc', value: 42000, probability: 90, expected: 37800 },
    { deal: 'DataFlow Inc', value: 95000, probability: 85, expected: 80750 }
  ];

  const aiRecommendations = [
    {
      title: 'Time Allocation',
      description: 'Spend 40% of your time this week on DataFlow (highest value, closest to close), 35% on Acme (highest risk), 25% on TechStart (already on track).'
    },
    {
      title: 'Quick Win',
      description: 'TechStart is your "sure thing" - close this first to build momentum, then focus on DataFlow and Acme.'
    },
    {
      title: 'Risk Mitigation',
      description: 'Acme Corp needs immediate attention. If you don\'t engage by Tuesday, probability drops to 40% (-15 points).'
    },
    {
      title: 'Leverage HRMS',
      description: 'The TechStart-Sarah Lee connection is your secret weapon. Use it strategically this week.'
    },
    {
      title: 'Competitive Intel',
      description: 'Acme is evaluating Salesforce. Prepare comparison battlecard before Thursday\'s call.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/crm/ai-copilot')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Chat</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShareModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">Share</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span className="text-sm font-medium">Print</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">AI STRATEGY DOCUMENT</h1>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Generated:</span> {responseMetadata.generated}</p>
                <p><span className="font-medium">For:</span> {responseMetadata.user}</p>
                <p><span className="font-medium">Question:</span> "{responseMetadata.question}"</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl">📊</span>
            <h2 className="text-xl font-bold text-gray-900">EXECUTIVE SUMMARY</h2>
          </div>

          <p className="text-gray-700 leading-relaxed mb-4">
            Based on comprehensive pipeline analysis, you should prioritize <strong>{executiveSummary.dealsCount} high-impact deals</strong> this week representing <strong>${(executiveSummary.totalValue / 1000).toFixed(0)}K in total value</strong>.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Pipeline Value</p>
              <p className="text-2xl font-bold text-gray-900">${(executiveSummary.totalValue / 1000).toFixed(0)}K</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Avg Close Probability</p>
              <p className="text-2xl font-bold text-gray-900">{executiveSummary.avgProbability}%</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Expected Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${(executiveSummary.expectedRevenue / 1000).toFixed(0)}K</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Time Investment</p>
              <p className="text-lg font-bold text-gray-900">{executiveSummary.timeNeeded}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-900 mb-2">Expected Outcome:</p>
            <p className="text-gray-700">{executiveSummary.outcome}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🎯</span>
            <h2 className="text-xl font-bold text-gray-900">PRIORITY DEALS (Ranked by Urgency × Impact)</h2>
          </div>

          <div className="space-y-6">
            {priorityDeals.map((deal) => (
              <div key={deal.rank} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{deal.rank}️⃣</span>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{deal.name} - ${(deal.value / 1000).toFixed(0)}K</h3>
                      <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                        deal.priorityColor === 'red' ? 'bg-red-100 text-red-800' :
                        deal.priorityColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        ⚠️ PRIORITY: {deal.priority}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/crm/deals/${deal.rank}`)}
                    className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    <span className="text-sm font-medium">View Deal</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Current Status:</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Stage: {deal.stage} ({deal.week})</li>
                      <li>• Last Activity: {deal.lastActivity}</li>
                      <li>• Health Score: {deal.healthScore}/100 ({deal.healthTrend === 'up' ? '🟢 Excellent' : deal.healthTrend === 'down' ? '⚠️ Declining' : '🟢 Good'})</li>
                      <li>• Close Probability: {deal.closeProbability}%{deal.potentialProbability && ` → ${deal.potentialProbability}% (if action taken this week)`}</li>
                    </ul>

                    <h4 className="font-semibold text-gray-900 mt-4 mb-3">Decision Makers:</h4>
                    <ul className="space-y-2 text-sm">
                      {deal.decisionMakers.map((dm, idx) => {
                        const contactId = dm.name.toLowerCase().replace(' ', '-');
                        return (
                          <li key={idx} className="flex items-center justify-between">
                            <button
                              onClick={() => navigate(`/crm/contacts/${contactId}`)}
                              className="text-gray-700 hover:text-purple-600 text-left"
                            >
                              • {dm.name} - {dm.title}
                            </button>
                            <button
                              onClick={() => navigate(`/crm/contacts/${contactId}`)}
                              className="text-purple-600 hover:text-purple-700 text-xs"
                            >
                              View Contact ➤
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Why This Matters:</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {deal.whyItMatters.map((item, idx) => (
                        <li key={idx}>
                          {item.startsWith('Competitor') || item.startsWith('No engagement') || item.startsWith('Pricing') ? '⚠️' : '✅'} {item}
                        </li>
                      ))}
                    </ul>

                    {deal.risks && (
                      <>
                        <h4 className="font-semibold text-gray-900 mt-4 mb-3">Risk Analysis:</h4>
                        <ul className="space-y-2 text-sm">
                          {deal.risks.map((risk, idx) => (
                            <li key={idx} className={
                              risk.level === 'high' ? 'text-red-700' :
                              risk.level === 'medium' ? 'text-yellow-700' :
                              'text-gray-700'
                            }>
                              {risk.level === 'high' ? '🔴' : '🟡'} {risk.level.toUpperCase()} RISK: {risk.description}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {deal.opportunities && (
                      <>
                        <h4 className="font-semibold text-gray-900 mt-4 mb-3">Opportunity:</h4>
                        <ul className="space-y-2 text-sm text-green-700">
                          {deal.opportunities.map((opp, idx) => (
                            <li key={idx}>🟢 {opp}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Recommended Actions (This Week):</h4>
                  <div className="space-y-4">
                    {deal.actions.map((action, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-2">
                          <span className="text-xl">{action.icon}</span>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{action.day} ({action.date}):</p>
                            <p className="text-gray-700 font-medium mt-1">{action.action}</p>
                            <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{action.details}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <button className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 transition-colors">
                            Schedule Call
                          </button>
                          <button className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors">
                            Send Invite
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Success Metrics:</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {deal.successMetrics.map((metric, idx) => (
                      <li key={idx}>• {metric}</li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Quick Actions:</h4>
                  <div className="flex flex-wrap gap-2">
                    {deal.rank === 1 && (
                      <>
                        <button
                          onClick={() => handleScheduleCall('John Chen', 'Acme Corp', 50000)}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 transition-colors"
                        >
                          Schedule Call
                        </button>
                        <button
                          onClick={() => handleSendEmail('john@acme.com', 'Follow-up: Sales Optimization Discussion', 'Hi John,\n\nI wanted to follow up on our conversation about optimizing your sales process...')}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                          Send Email
                        </button>
                        <button
                          onClick={() => setTemplateModalOpen(true)}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                        >
                          Use AI Template
                        </button>
                        <button
                          onClick={() => navigate('/documents?filter=battlecards')}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                        >
                          View Battlecard
                        </button>
                        <button
                          onClick={() => navigate('/crm/ai-copilot', { state: { query: 'Analyze Salesforce competition for Acme Corp' } })}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                        >
                          Get AI Analysis
                        </button>
                      </>
                    )}

                    {deal.rank === 2 && (
                      <>
                        <button
                          onClick={() => handleGenerateProposal('TechStart Inc', 42000, 'David Park')}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 transition-colors"
                        >
                          Generate Proposal
                        </button>
                        <button
                          onClick={() => setTemplateModalOpen(true)}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                        >
                          Use Template
                        </button>
                        <button
                          onClick={() => handleScheduleCall('David Park', 'TechStart Inc', 42000)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                          Schedule Call
                        </button>
                        <button
                          onClick={() => handleSendEmail('sarah@bmi.com', 'Introduction Request: TechStart Inc', 'Hi Sarah,\n\nCan you introduce me to David Park at TechStart? I think there\'s a great opportunity...')}
                          className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
                        >
                          Request Intro (Sarah)
                        </button>
                      </>
                    )}

                    {deal.rank === 3 && (
                      <>
                        <button
                          onClick={() => handleGenerateProposal('DataFlow Inc', 95000, 'Emily Chen')}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 transition-colors"
                        >
                          Create Proposal Options
                        </button>
                        <button
                          onClick={() => handleOpenROICalculator('DataFlow Inc', 95000)}
                          className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
                        >
                          Use Calculator
                        </button>
                        <button
                          onClick={() => handleScheduleCall('Emily Chen & Robert Martinez', 'DataFlow Inc', 95000)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                          Schedule Call
                        </button>
                        <button
                          onClick={() => handleSendEmail('emily@dataflow.com', 'Meeting Agenda: DataFlow Implementation', 'Hi Emily,\n\nHere\'s the agenda for our upcoming discussion:\n\n1. Solution overview\n2. ROI analysis\n3. Implementation timeline...')}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                        >
                          Send Agenda
                        </button>
                        <button
                          onClick={() => navigate('/documents?filter=presentations')}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                        >
                          Prepare Deck
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📋</span>
            <h2 className="text-xl font-bold text-gray-900">WEEKLY ACTION CHECKLIST</h2>
          </div>

          <div className="space-y-4">
            {Object.entries(weeklyChecklist).map(([day, tasks]) => (
              <div key={day}>
                <h3 className="font-semibold text-gray-900 mb-2 capitalize">{day}, Dec {
                  day === 'tuesday' ? '17' : day === 'wednesday' ? '18' : day === 'thursday' ? '19' : '20'
                }:</h3>
                <div className="space-y-2">
                  {tasks.map((task, idx) => {
                    const taskKey = `${day}-${idx}`;
                    return (
                      <label key={idx} className="flex items-start gap-3 text-sm text-gray-700 hover:bg-gray-50 p-2 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={completedTasks.has(taskKey)}
                          onChange={() => handleTaskToggle(taskKey)}
                          className="mt-0.5 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className={completedTasks.has(taskKey) ? 'line-through text-gray-500' : ''}>{task}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <CheckSquare className="w-4 h-4" />
              <span className="text-sm font-medium">Create All Tasks in CRM</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
              <Mail className="w-4 h-4" />
              <span className="text-sm font-medium">Email Checklist to Myself</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📊</span>
            <h2 className="text-xl font-bold text-gray-900">IMPACT FORECAST</h2>
          </div>

          <p className="text-gray-700 mb-4 font-medium">If you execute this plan:</p>

          <div className="space-y-2 mb-4 font-mono text-sm">
            {impactForecast.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-gray-700">
                  {item.deal}: ${(item.value / 1000).toFixed(0)}K × {item.probability}% probability
                </span>
                <span className="font-semibold text-gray-900">
                  = ${(item.expected / 1000).toFixed(1)}K expected revenue
                </span>
              </div>
            ))}
            <div className="border-t border-gray-300 pt-2 mt-2">
              <div className="flex items-center justify-between text-lg">
                <span className="font-bold text-gray-900">TOTAL EXPECTED REVENUE:</span>
                <span className="font-bold text-green-600">
                  ${(impactForecast.reduce((sum, item) => sum + item.expected, 0) / 1000).toFixed(1)}K
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Timeline to Close:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• TechStart Inc: 85% likely by Dec 27 (within 10 days)</li>
              <li>• DataFlow Inc: 80% likely by Dec 20 (within 3 days)</li>
              <li>• Acme Corp: 65% likely by Jan 15 (within 4 weeks)</li>
            </ul>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">💡</span>
            <h2 className="text-xl font-bold text-gray-900">AI RECOMMENDATIONS</h2>
          </div>

          <div className="space-y-4">
            {aiRecommendations.map((rec, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">{idx + 1}. {rec.title}:</p>
                <p className="text-sm text-gray-700">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🔗</span>
            <h2 className="text-xl font-bold text-gray-900">RELATED CRM RECORDS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Deals (3):</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center justify-between hover:bg-gray-50 p-2 rounded">
                  <button
                    onClick={() => navigate('/crm/deals/1')}
                    className="text-gray-700 hover:text-purple-600 text-left"
                  >
                    • Acme Corp - $50K (Prospecting)
                  </button>
                  <button
                    onClick={() => navigate('/crm/deals/1')}
                    className="text-purple-600 hover:text-purple-700 text-xs"
                  >
                    View ➤
                  </button>
                </li>
                <li className="flex items-center justify-between hover:bg-gray-50 p-2 rounded">
                  <button
                    onClick={() => navigate('/crm/deals/2')}
                    className="text-gray-700 hover:text-purple-600 text-left"
                  >
                    • TechStart Inc - $42K (Qualified)
                  </button>
                  <button
                    onClick={() => navigate('/crm/deals/2')}
                    className="text-purple-600 hover:text-purple-700 text-xs"
                  >
                    View ➤
                  </button>
                </li>
                <li className="flex items-center justify-between hover:bg-gray-50 p-2 rounded">
                  <button
                    onClick={() => navigate('/crm/deals/3')}
                    className="text-gray-700 hover:text-purple-600 text-left"
                  >
                    • DataFlow Inc - $95K (Negotiation)
                  </button>
                  <button
                    onClick={() => navigate('/crm/deals/3')}
                    className="text-purple-600 hover:text-purple-700 text-xs"
                  >
                    View ➤
                  </button>
                </li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-6 mb-3">Activities (14 upcoming):</h3>
              <button
                onClick={() => navigate('/activities?filter=this-week')}
                className="text-purple-600 hover:text-purple-700 text-sm"
              >
                View all scheduled activities for this week ➤
              </button>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Contacts (6):</h3>
              <ul className="space-y-2 text-sm">
                {[
                  { name: 'John Chen - VP of Sales, Acme Corp', id: 'john-chen' },
                  { name: 'David Park - Head of Sales, TechStart', id: 'david-park' },
                  { name: 'Emily Chen - VP of Operations, DataFlow', id: 'emily-chen' },
                  { name: 'Sarah Lee - Sales Rep, BMI (HRMS connection)', id: 'sarah-lee' },
                  { name: 'Michael Wong - Director, Acme Corp', id: 'michael-wong' },
                  { name: 'Robert Martinez - CFO, DataFlow', id: 'robert-martinez' }
                ].map((contact, idx) => (
                  <li key={idx} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded">
                    <button
                      onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                      className="text-gray-700 hover:text-purple-600 text-left"
                    >
                      • {contact.name}
                    </button>
                    <button
                      onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                      className="text-purple-600 hover:text-purple-700 text-xs"
                    >
                      View ➤
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📤</span>
            <h2 className="text-xl font-bold text-gray-900">ACTIONS</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCreateAllTasks}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              <span className="text-sm font-medium">Create All Tasks</span>
            </button>
            <button
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm font-medium">Share via Email</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span className="text-sm font-medium">Print</span>
            </button>
            <button
              onClick={handleRefreshAnalysis}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Refresh Analysis</span>
            </button>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => handleFeedback(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <ThumbsUp className="w-4 h-4" />
              <span className="text-sm font-medium">This was helpful</span>
            </button>
            <button
              onClick={() => handleFeedback(false)}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <ThumbsDown className="w-4 h-4" />
              <span className="text-sm font-medium">Not helpful</span>
            </button>
            <button
              onClick={() => navigate('/crm/ai-copilot')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Ask Follow-up Question</span>
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/crm/ai-copilot')}
            className="flex items-center gap-2 mx-auto text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
}
