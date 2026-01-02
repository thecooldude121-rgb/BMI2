// Sample Deals for Testing Deal Creation and Dashboard
export const sampleDeals = [
  {
    // Deal 1: Enterprise Software
    name: "TechCorp Enterprise CRM Implementation",
    title: "TechCorp Enterprise CRM Implementation", 
    value: 85000,
    leadId: "lead-techcorp-001",
    stage: "proposal" as const,
    probability: 75,
    expectedCloseDate: "2024-03-15",
    assignedTo: "user1",
    notes: "Enterprise CRM solution for 500+ employees. Includes custom integrations with existing ERP system and 6-month implementation timeline. Client is evaluating against Salesforce but prefers our customization capabilities.",
    description: "Comprehensive CRM implementation with custom integrations and training for large enterprise client.",
    client: "TechCorp Solutions Inc.",
    industry: "Technology",
    dealType: "new-business"
  },
  {
    // Deal 2: Healthcare Services
    name: "MedCenter Digital Transformation Consulting",
    title: "MedCenter Digital Transformation Consulting",
    value: 45000,
    leadId: "lead-medcenter-002", 
    stage: "negotiation" as const,
    probability: 85,
    expectedCloseDate: "2024-02-28",
    assignedTo: "user2",
    notes: "Healthcare digital transformation project focusing on patient management systems and HIPAA compliance. 3-month consulting engagement with potential for ongoing support contract. Decision maker is very engaged and budget is approved.",
    description: "Digital transformation consulting for healthcare provider focusing on patient management and compliance systems.",
    client: "MedCenter Regional Hospital",
    industry: "Healthcare", 
    dealType: "consulting"
  },
  {
    // Deal 3: Manufacturing Software
    name: "GlobalMfg Inventory Management System",
    title: "GlobalMfg Inventory Management System",
    value: 32000,
    leadId: "lead-globalmfg-003",
    stage: "qualification" as const, 
    probability: 40,
    expectedCloseDate: "2024-04-20",
    assignedTo: "user1",
    notes: "Cloud-based inventory management solution for mid-size manufacturing company. Replacing legacy system that's causing operational inefficiencies. Need to demonstrate ROI and integration capabilities with their existing MRP system.",
    description: "Modern inventory management system to replace legacy infrastructure and improve operational efficiency.",
    client: "Global Manufacturing Corp",
    industry: "Manufacturing",
    dealType: "software"
  },
  {
    // Deal 4: Small Business Services
    name: "StartupX Marketing Automation Package",
    title: "StartupX Marketing Automation Package", 
    value: 12500,
    leadId: "lead-startupx-004",
    stage: "closed-won" as const,
    probability: 100,
    expectedCloseDate: "2024-01-30",
    assignedTo: "user3",
    notes: "Marketing automation platform for fast-growing startup. Includes email marketing, lead scoring, and CRM integration. Client signed after successful pilot program. Implementation starts next week with 12-month contract.",
    description: "Complete marketing automation solution with CRM integration for growing startup company.",
    client: "StartupX Innovation Labs",
    industry: "Technology",
    dealType: "services"
  },
  {
    // Deal 5: Financial Services
    name: "FinanceFirst Compliance Management Solution", 
    title: "FinanceFirst Compliance Management Solution",
    value: 67500,
    leadId: "lead-financefirst-005",
    stage: "proposal" as const,
    probability: 60,
    expectedCloseDate: "2024-05-10",
    assignedTo: "user2", 
    notes: "Regulatory compliance management system for financial services firm. Must meet SOX and SEC requirements. Competing against two other vendors but our industry expertise gives us an advantage. Proposal submitted, awaiting technical review.",
    description: "Specialized compliance management system designed for financial services with SOX and SEC regulatory requirements.",
    client: "FinanceFirst Advisory Group",
    industry: "Financial Services",
    dealType: "software"
  }
];

// Dashboard Analytics Helper
export const calculateDashboardMetrics = (deals: any[]) => {
  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const avgDealSize = deals.length > 0 ? totalValue / deals.length : 0;
  
  const stageBreakdown = deals.reduce((acc, deal) => {
    acc[deal.stage] = (acc[deal.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const weightedValue = deals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);
  
  return {
    totalValue,
    avgDealSize,
    stageBreakdown,
    weightedValue,
    dealCount: deals.length
  };
};