import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Target, Filter, Download } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { aiEngine } from '../../utils/aiEngine';

const Analytics: React.FC = () => {
  const { leads, deals, tasks, employees } = useData();
  const [timeRange, setTimeRange] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('pipeline');

  // Calculate metrics
  const totalPipelineValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const wonDeals = deals.filter(deal => deal.stage === 'closed-won');
  const wonValue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);
  const avgDealSize = wonDeals.length > 0 ? wonValue / wonDeals.length : 0;
  
  const highFitLeads = leads.filter(lead => aiEngine.scoreLeadFit(lead) > 80).length;
  const conversionRate = leads.length > 0 ? (wonDeals.length / leads.length) * 100 : 0;

  // Sales funnel data
  const funnelData = [
    { stage: 'Total Leads', count: leads.length, value: leads.reduce((sum, l) => sum + l.value, 0) },
    { stage: 'Contacted', count: leads.filter(l => ['contacted', 'qualified', 'proposal', 'won'].includes(l.stage)).length, value: leads.filter(l => ['contacted', 'qualified', 'proposal', 'won'].includes(l.stage)).reduce((sum, l) => sum + l.value, 0) },
    { stage: 'Qualified', count: leads.filter(l => ['qualified', 'proposal', 'won'].includes(l.stage)).length, value: leads.filter(l => ['qualified', 'proposal', 'won'].includes(l.stage)).reduce((sum, l) => sum + l.value, 0) },
    { stage: 'Proposal', count: leads.filter(l => ['proposal', 'won'].includes(l.stage)).length, value: leads.filter(l => ['proposal', 'won'].includes(l.stage)).reduce((sum, l) => sum + l.value, 0) },
    { stage: 'Won', count: leads.filter(l => l.stage === 'won').length, value: leads.filter(l => l.stage === 'won').reduce((sum, l) => sum + l.value, 0) }
  ];

  // Performance by team member
  const teamPerformance = employees.map(emp => {
    const empLeads = leads.filter(lead => lead.assignedTo === emp.id);
    const empDeals = deals.filter(deal => deal.assignedTo === emp.id);
    const empWonDeals = empDeals.filter(deal => deal.stage === 'closed-won');
    
    return {
      name: emp.name,
      role: emp.role,
      leadsCount: empLeads.length,
      dealsCount: empDeals.length,
      wonDeals: empWonDeals.length,
      revenue: empWonDeals.reduce((sum, deal) => sum + deal.value, 0),
      conversionRate: empLeads.length > 0 ? (empWonDeals.length / empLeads.length) * 100 : 0
    };
  }).filter(perf => perf.leadsCount > 0);

  // Industry breakdown
  const industryBreakdown = leads.reduce((acc, lead) => {
    const industry = lead.industry || 'Other';
    if (!acc[industry]) {
      acc[industry] = { count: 0, value: 0, won: 0 };
    }
    acc[industry].count += 1;
    acc[industry].value += lead.value;
    if (lead.stage === 'won') acc[industry].won += 1;
    return acc;
  }, {} as Record<string, { count: number; value: number; won: number }>);

  const industryData = Object.entries(industryBreakdown)
    .map(([industry, data]) => ({
      industry,
      ...data,
      conversionRate: data.count > 0 ? (data.won / data.count) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value);

  const metrics = [
    { id: 'pipeline', name: 'Pipeline Analysis', icon: TrendingUp },
    { id: 'funnel', name: 'Sales Funnel', icon: Target },
    { id: 'team', name: 'Team Performance', icon: Users },
    { id: 'industry', name: 'Industry Breakdown', icon: BarChart3 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Intelligence</h1>
          <p className="text-gray-600">Comprehensive analytics and performance insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Pipeline</p>
              <p className="text-2xl font-bold text-gray-900">${totalPipelineValue.toLocaleString()}</p>
              <p className="text-sm text-green-600">+12.5% from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Won Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${wonValue.toLocaleString()}</p>
              <p className="text-sm text-green-600">+8.3% from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{conversionRate.toFixed(1)}%</p>
              <p className="text-sm text-green-600">+2.1% from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">High-Fit Leads</p>
              <p className="text-2xl font-bold text-gray-900">{highFitLeads}</p>
              <p className="text-sm text-green-600">AI Score 80+</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {metrics.map((metric) => (
            <button
              key={metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                selectedMetric === metric.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <metric.icon className="mr-2 h-5 w-5" />
              {metric.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {selectedMetric === 'pipeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Forecast</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Expected Close (Next 30 days)</span>
                <span className="text-lg font-bold text-green-600">
                  ${deals.filter(d => {
                    const closeDate = new Date(d.expectedCloseDate);
                    const today = new Date();
                    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
                    return closeDate <= nextMonth && !d.stage.startsWith('closed');
                  }).reduce((sum, d) => sum + d.value * (d.probability / 100), 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Deal Size</span>
                <span className="text-lg font-bold text-blue-600">${avgDealSize.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Deals</span>
                <span className="text-lg font-bold text-purple-600">
                  {deals.filter(d => !d.stage.startsWith('closed')).length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Predictions</h3>
            <div className="space-y-4">
              {deals.filter(d => !d.stage.startsWith('closed')).slice(0, 3).map(deal => {
                const prediction = aiEngine.predictDealOutcome(deal, deals);
                return (
                  <div key={deal.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{deal.title}</h4>
                      <span className="text-sm font-bold text-blue-600">{prediction.probability}%</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Expected close: {Math.round(prediction.timeToClose)} days
                    </p>
                    {prediction.recommendations.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Recommendation: {prediction.recommendations[0]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedMetric === 'funnel' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales Funnel Analysis</h3>
          <div className="space-y-4">
            {funnelData.map((stage, index) => {
              const percentage = funnelData[0].count > 0 ? (stage.count / funnelData[0].count) * 100 : 0;
              const conversionFromPrevious = index > 0 && funnelData[index - 1].count > 0 
                ? (stage.count / funnelData[index - 1].count) * 100 
                : 100;
              
              return (
                <div key={stage.stage} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                      {index > 0 && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({conversionFromPrevious.toFixed(1)}% conversion)
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">{stage.count} leads</span>
                      <div className="text-xs text-gray-500">${stage.value.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ease-out ${
                        index === 0 ? 'bg-gray-400' :
                        index === 1 ? 'bg-blue-400' :
                        index === 2 ? 'bg-yellow-400' :
                        index === 3 ? 'bg-orange-400' : 'bg-green-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% of total leads</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedMetric === 'team' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Team Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deals
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Won
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamPerformance.map((member) => (
                  <tr key={member.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.role}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.leadsCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.dealsCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.wonDeals}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ${member.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900">{member.conversionRate.toFixed(1)}%</span>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(100, member.conversionRate)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedMetric === 'industry' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Industry Performance</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {industryData.slice(0, 5).map((industry, index) => (
                <div key={industry.industry} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{industry.industry}</h4>
                    <p className="text-sm text-gray-600">{industry.count} leads • ${industry.value.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{industry.conversionRate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">{industry.won} won</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Industry Insights</h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• {industryData[0]?.industry} shows the highest total value at ${industryData[0]?.value.toLocaleString()}</p>
                <p>• Best conversion rate: {industryData.sort((a, b) => b.conversionRate - a.conversionRate)[0]?.industry} at {industryData.sort((a, b) => b.conversionRate - a.conversionRate)[0]?.conversionRate.toFixed(1)}%</p>
                <p>• Focus on {industryData.filter(i => i.conversionRate > 30).length} high-performing industries for better ROI</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;