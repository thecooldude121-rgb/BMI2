import React from 'react';
import { Building2, Globe, MapPin, DollarSign, Users, TrendingUp, Calendar, Award, ExternalLink } from 'lucide-react';

interface CompanyInformationPanelProps {
  legalName: string;
  industry: string;
  subIndustry?: string;
  employeeCount?: number;
  annualRevenue?: number;
  growthRate?: string;
  foundedYear?: string;
  headquarters?: string;
  website?: string;
  stockSymbol?: string;
  fundingRound?: string;
  totalFunding?: string;
  keyTechnologies?: string[];
}

const CompanyInformationPanel: React.FC<CompanyInformationPanelProps> = ({
  legalName,
  industry,
  subIndustry,
  employeeCount,
  annualRevenue,
  growthRate,
  foundedYear,
  headquarters,
  website,
  stockSymbol,
  fundingRound,
  totalFunding,
  keyTechnologies = []
}) => {
  const formatRevenue = (revenue?: number) => {
    if (!revenue) return 'Not specified';
    if (revenue >= 1000000000) return `$${(revenue / 1000000000).toFixed(1)}B`;
    if (revenue >= 1000000) return `$${(revenue / 1000000).toFixed(1)}M`;
    if (revenue >= 1000) return `$${(revenue / 1000).toFixed(0)}K`;
    return `$${revenue}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">COMPANY INFORMATION</h3>
          <span className="text-xs text-gray-500">(🤖 AI-Enriched)</span>
        </div>

        {/* Basic Info */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
            Basic Info
          </h4>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-1">Legal Name</p>
              <p className="text-sm font-medium text-gray-900">{legalName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Industry</p>
              <p className="text-sm font-medium text-gray-900">{industry}</p>
            </div>
            {subIndustry && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Sub-Industry</p>
                <p className="text-sm font-medium text-gray-900">{subIndustry}</p>
              </div>
            )}
            {website && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Website</p>
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <Globe className="h-3 w-3" />
                  <span>{website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Size & Revenue */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
            Size & Revenue
          </h4>
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Users className="h-4 w-4 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-600">Employees</p>
                <p className="text-sm font-medium text-gray-900">{employeeCount?.toLocaleString() || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <DollarSign className="h-4 w-4 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-600">Annual Revenue</p>
                <p className="text-sm font-medium text-gray-900">{formatRevenue(annualRevenue)}</p>
              </div>
            </div>
            {growthRate && (
              <div className="flex items-start space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Revenue Growth</p>
                  <p className="text-sm font-medium text-green-600">{growthRate}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Funding & Status */}
        {(fundingRound || totalFunding || stockSymbol) && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Funding & Status
            </h4>
            <div className="space-y-3">
              {fundingRound && (
                <div className="flex items-start space-x-2">
                  <Award className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-600">Funding Stage</p>
                    <p className="text-sm font-medium text-gray-900">{fundingRound}</p>
                  </div>
                </div>
              )}
              {totalFunding && (
                <div className="flex items-start space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-600">Total Funding</p>
                    <p className="text-sm font-medium text-gray-900">{totalFunding}</p>
                  </div>
                </div>
              )}
              {stockSymbol && (
                <div className="flex items-start space-x-2">
                  <TrendingUp className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-600">Stock Symbol</p>
                    <p className="text-sm font-medium text-gray-900">{stockSymbol}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Location & History */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
            Location & History
          </h4>
          <div className="space-y-3">
            {headquarters && (
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Headquarters</p>
                  <p className="text-sm font-medium text-gray-900">{headquarters}</p>
                </div>
              </div>
            )}
            {foundedYear && (
              <div className="flex items-start space-x-2">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Founded</p>
                  <p className="text-sm font-medium text-gray-900">{foundedYear}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tech Stack */}
        {keyTechnologies.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Tech Stack (AI-Detected)
            </h4>
            <div className="flex flex-wrap gap-2">
              {keyTechnologies.map((tech, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Enrichment Note */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600">
            <span className="font-semibold">AI Note:</span> This data is automatically enriched from multiple sources including company website, LinkedIn, Crunchbase, and public databases. Last updated: Today
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanyInformationPanel;
