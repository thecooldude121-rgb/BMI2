export interface BattleCard {
  weWinWhen: string[];    // 3 bullets — our key advantages
  theyWinWhen: string[];  // 2 bullets — their honest strengths
  killerQuestion: string; // 1 discovery question to expose a weakness
  proofPoint: {
    company: string;
    outcome: string;
  };
}

export const BATTLE_CARDS: Record<string, BattleCard> = {
  salesforce: {
    weWinWhen: [
      'Customer wants fast deployment — we go live in 6 weeks vs. Salesforce\'s 6-month average rollout',
      'Budget is fixed — our all-in pricing is 40% lower with no hidden professional-services fees',
      'Team is sales-led, not IT-led — our UI requires zero admin configuration to be productive',
    ],
    theyWinWhen: [
      'Account already runs a deep Salesforce org with multi-cloud integrations (Service Cloud, Marketing Cloud)',
      'Enterprise IT mandate requires Salesforce\'s government-cloud compliance certifications',
    ],
    killerQuestion:
      'How much of your current Salesforce budget goes to licenses vs. the consultants you need just to keep it running?',
    proofPoint: {
      company: 'TechStart Inc',
      outcome:
        'Displaced Salesforce — deployed in 5 weeks, 3× rep adoption vs. previous tool within Month 1',
    },
  },

  hubspot: {
    weWinWhen: [
      'Multi-stakeholder B2B sales — our buying committee map and influence tracking has no HubSpot equivalent',
      'AI-native forecasting is a requirement — not a retrofitted ML layer on top of a legacy pipeline tool',
      'Revenue ops needs CRM + hiring-pipeline intelligence in one platform (our HRMS integration is unique)',
    ],
    theyWinWhen: [
      'SMB with simple one-touch sales cycles and strong inbound motion already running on HubSpot',
      'Marketing team is the primary buyer and needs HubSpot\'s native content, ads, and CMS integration',
    ],
    killerQuestion:
      'When you lose a deal to a competitor, how quickly can HubSpot tell you which competitor beat you and why — or does the answer still live in the rep\'s memory?',
    proofPoint: {
      company: 'GrowthCo',
      outcome: 'Moved from HubSpot to BMI — forecast accuracy jumped from 48% to 81% in the first quarter',
    },
  },
};
