import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Download, RefreshCw, AlertTriangle, Clock,
  ChevronRight, ArrowLeft, FileText, Target, TrendingDown,
  CheckCircle, XCircle, Activity, DollarSign, Calendar
} from 'lucide-react';
import CRMNavigation from '../../components/CRM/CRMNavigation';

const PipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const [lastUpdated, setLastUpdated] = useState('2 hours ago');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated('just now');
      setIsRefreshing(false);
    }, 1000);
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    alert(`Exporting pipeline report as ${format.toUpperCase()}...`);
  };

  const handleExportPDF = () => {
    alert('Exporting full pipeline analysis as PDF...');
  };

  const handleStageClick = (stage: string) => {
    navigate(`/crm/deals?stage=${stage.toLowerCase()}`);
  };

  const handleViewDeal = (dealName: string) => {
    navigate(`/crm/deals/1`);
  };

  const handleViewAllRisk = (riskLevel: string) => {
    navigate(`/crm/deals?risk=${riskLevel.toLowerCase()}`);
  };

  const quickStats = [
    { label: 'Total Pipeline', value: '$2.4M', icon: DollarSign, trend: '+15%', color: '#667eea' },
    { label: 'Weighted Pipeline', value: '$1.2M', icon: Target, trend: '+8%', color: '#28a745' },
    { label: 'Avg Cycle Length', value: '45 days', icon: Clock, trend: '-3 days', color: '#ffc107' },
    { label: 'Win Rate', value: '35%', icon: TrendingUp, trend: '+5%', color: '#667eea' }
  ];

  const pipelineStages = [
    {
      stage: 'Prospecting',
      leads: 45,
      value: '$890,000',
      percentage: 100,
      conversion: 100,
      avgAge: 8,
      health: 'healthy'
    },
    {
      stage: 'Qualified',
      leads: 23,
      value: '$650,000',
      percentage: 73,
      conversion: 51,
      avgAge: 15,
      health: 'healthy'
    },
    {
      stage: 'Proposal',
      leads: 15,
      value: '$480,000',
      percentage: 54,
      conversion: 65,
      avgAge: 22,
      health: 'attention'
    },
    {
      stage: 'Negotiation',
      leads: 8,
      value: '$320,000',
      percentage: 36,
      conversion: 53,
      avgAge: 31,
      health: 'slowing'
    },
    {
      stage: 'Closed-Won',
      leads: 4,
      value: '$180,000',
      percentage: 20,
      conversion: 50,
      avgAge: 45,
      health: 'healthy'
    }
  ];

  const riskDeals = [
    {
      level: 'HIGH',
      deals: [
        { name: 'BigCo', risk: 'No activity in 7 days', value: '$75K' },
        { name: 'StartCo', risk: 'Budget not confirmed', value: '$42K' },
        { name: 'TechOne', risk: 'Competitor in play', value: '$65K' }
      ]
    },
    { level: 'MEDIUM', count: 5 },
    { level: 'LOW', count: 15 }
  ];

  const ageDistribution = [
    { range: '0-15 days', count: 28, width: 60 },
    { range: '16-30 days', count: 12, width: 40 },
    { range: '31-45 days', count: 8, width: 30 },
    { range: '46-60 days', count: 3, width: 15 },
    { range: '60+ days', count: 2, width: 10, warning: true }
  ];

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <span className="text-lg">✅</span>;
      case 'attention':
        return <span className="text-lg">⚠️</span>;
      case 'slowing':
        return <span className="text-lg">⚠️</span>;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: '"Segoe UI", "Inter", -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <CRMNavigation />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-8 py-3">
        <div className="flex items-center text-sm text-gray-600">
          <button onClick={() => navigate('/crm')} className="hover:text-blue-600">Dashboard</button>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-900 font-medium">Pipeline Analysis</span>
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#333333' }}>
              📊 Pipeline Analysis
            </h1>
            <p className="text-gray-600" style={{ fontSize: '14px' }}>
              Last updated: {lastUpdated}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <div className="relative group">
              <button className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:shadow-lg transition-all flex items-center space-x-2" style={{ backgroundColor: '#667eea' }}>
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 hidden group-hover:block z-10">
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Export as PDF
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Export as CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: `${stat.color}15` }}>
                    <Icon className="h-6 w-6" style={{ color: stat.color }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: stat.trend.startsWith('+') ? '#28a745' : '#667eea' }}>
                    {stat.trend}
                  </span>
                </div>
                <div className="text-3xl font-bold mb-1" style={{ color: '#333333' }}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Funnel Visualization */}
        <div className="bg-white rounded-xl p-8 border border-gray-200 mb-8" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 className="text-xl font-bold mb-8" style={{ color: '#333333' }}>Sales Funnel</h2>

          <div className="flex flex-col items-center space-y-4 mb-8">
            {pipelineStages.map((stage, index) => {
              const blueShades = [
                'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                'linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%)'
              ];
              return (
                <div key={index} className="w-full flex flex-col items-center">
                  <div
                    onClick={() => handleStageClick(stage.stage)}
                    className="rounded-lg p-6 transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
                    style={{
                      width: `${stage.percentage}%`,
                      minWidth: '200px',
                      background: blueShades[index],
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                    }}
                    title={`Click to view ${stage.stage} deals`}
                  >
                    <div className="text-center text-white">
                      <div className="text-lg font-bold mb-1">{stage.stage}</div>
                      <div className="text-sm mb-1">
                        {stage.leads} {stage.stage === 'Closed-Won' ? 'deals' : 'leads'} | {stage.value}
                      </div>
                    </div>
                  </div>
                  {index < pipelineStages.length - 1 && (
                    <div className="flex flex-col items-center my-3">
                      <div className="text-2xl text-gray-400">▼</div>
                      <div className="text-sm font-semibold text-blue-600 mt-1">
                        {pipelineStages[index + 1].conversion}% conversion
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Conversion Rates Summary */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Overall Conversion Performance</h3>
            <div className="grid grid-cols-5 gap-4">
              {pipelineStages.map((stage, index) => (
                <div key={index} className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold mb-1" style={{ color: '#2563eb' }}>
                    {stage.conversion}%
                  </div>
                  <div className="text-xs text-gray-600 text-center">{stage.stage}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${stage.conversion}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Predictions Section */}
        <div className="rounded-xl p-8 mb-8 text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)' }}>
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <span className="mr-2">🤖</span> AI-Powered Forecast
          </h2>

          <p className="mb-6 text-white opacity-95">Based on historical data and current pipeline:</p>

          <div className="space-y-6 mb-6">
            <div className="bg-white/10 rounded-lg p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">This Quarter</h3>
                <span className="text-3xl font-bold">$1.2M</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-90">Confidence Level</span>
                  <span className="text-sm font-semibold">67%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-white h-3 rounded-full transition-all duration-500 shadow-lg"
                    style={{ width: '67%' }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Next Quarter</h3>
                <span className="text-3xl font-bold">$890K</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-90">Confidence Level</span>
                  <span className="text-sm font-semibold">52%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-white h-3 rounded-full transition-all duration-500 shadow-lg"
                    style={{ width: '52%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <span className="mr-2">💡</span> Recommendations:
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Focus on 8 deals in Negotiation stage</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Accelerate 5 Proposal-stage deals by Nov 30</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Import 30+ new leads to maintain pipeline health</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Detailed Breakdown - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Left Column - Stage Performance */}
          <div className="bg-white rounded-xl p-6 border border-gray-200" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 className="text-xl font-bold mb-6 flex items-center" style={{ color: '#333333' }}>
              <TrendingUp className="h-5 w-5 mr-2" style={{ color: '#667eea' }} />
              Stage Performance
            </h2>

            <div className="space-y-6">
              {pipelineStages.map((stage, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{stage.stage}</h3>
                    {getHealthIcon(stage.health)}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">• {stage.leads} {stage.stage === 'Closed-Won' ? 'deals this month' : 'leads'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">• Avg age: {stage.avgAge} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">• Health:</span>
                      <span className={`font-medium ${
                        stage.health === 'healthy' ? 'text-green-600' :
                        stage.health === 'attention' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {stage.health === 'healthy' ? '✅ Healthy' :
                         stage.health === 'attention' ? '⚠️ Attention needed' :
                         '⚠️ Slowing'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Risk Analysis */}
          <div className="bg-white rounded-xl p-6 border border-gray-200" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 className="text-xl font-bold mb-6 flex items-center" style={{ color: '#333333' }}>
              <AlertTriangle className="h-5 w-5 mr-2" style={{ color: '#dc3545' }} />
              Risk Analysis
            </h2>

            <div className="space-y-6">
              {/* HIGH RISK */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-red-600">HIGH RISK ({riskDeals[0].deals.length})</h3>
                </div>
                <div className="space-y-3">
                  {riskDeals[0].deals.map((deal, index) => (
                    <div key={index} className="border border-red-200 rounded-lg p-3 bg-red-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-gray-900">Deal: {deal.name}</div>
                          <div className="text-sm text-red-600">Risk: {deal.risk}</div>
                        </div>
                        <div className="text-sm font-semibold" style={{ color: '#667eea' }}>{deal.value}</div>
                      </div>
                      <button
                        onClick={() => handleViewDeal(deal.name)}
                        className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium"
                      >
                        [View Deal]
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* MEDIUM RISK */}
              <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-yellow-700">MEDIUM RISK ({riskDeals[1].count})</h3>
                  <button
                    onClick={() => handleViewAllRisk('medium')}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                  >
                    [View All]
                  </button>
                </div>
              </div>

              {/* LOW RISK */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-green-700">LOW RISK ({riskDeals[2].count})</h3>
                  <button
                    onClick={() => handleViewAllRisk('low')}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                  >
                    [View All]
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deal Age Distribution Timeline */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 className="text-xl font-bold mb-6 flex items-center" style={{ color: '#333333' }}>
            <Calendar className="h-5 w-5 mr-2" style={{ color: '#667eea' }} />
            Deal Age Distribution
          </h2>

          <div className="space-y-4">
            {ageDistribution.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{item.range}</span>
                  <span className="text-sm text-gray-600">
                    {item.count} deals
                    {item.warning && <span className="ml-2 text-red-600">⚠️ needs attention</span>}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="h-4 rounded-full transition-all"
                    style={{
                      width: `${item.width}%`,
                      background: item.warning ? 'linear-gradient(90deg, #dc3545 0%, #ff6b6b 100%)' : 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/crm')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/crm/deals')}
              className="px-6 py-3 rounded-lg text-sm font-medium text-white hover:shadow-lg transition-all"
              style={{ backgroundColor: '#667eea' }}
            >
              View Deals Pipeline
            </button>
            <button
              onClick={handleExportPDF}
              className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelinePage;
