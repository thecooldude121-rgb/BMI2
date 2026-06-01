import React from 'react';
import { Database, CheckCircle2, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';

interface DataSource {
  name: string;
  status: 'active' | 'warning' | 'error';
  lastUpdated: string;
  url?: string;
}

interface DataSourcesPanelProps {
  sources: DataSource[];
  dataQuality: number;
  lastEnrichment: string;
  onReEnrich: () => void;
  onVerifyData: () => void;
  onReportIssue: () => void;
}

const DataSourcesPanel: React.FC<DataSourcesPanelProps> = ({
  sources,
  dataQuality,
  lastEnrichment,
  onReEnrich,
  onVerifyData,
  onReportIssue
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 90) return 'text-green-700';
    if (quality >= 70) return 'text-blue-600';
    if (quality >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityLabel = (quality: number) => {
    if (quality >= 90) return 'Excellent';
    if (quality >= 70) return 'Good';
    if (quality >= 50) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Database className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">Data Sources</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Last updated: {lastEnrichment}
      </p>

      <div className="space-y-2 mb-6">
        {sources.map((source, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              {getStatusIcon(source.status)}
              <div>
                <p className="text-sm font-medium text-gray-900">{source.name}</p>
                {source.name === 'HRMS Module' && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                    UNIQUE
                  </span>
                )}
              </div>
            </div>
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Data Quality:</span>
          <span className={`text-xl font-bold ${getQualityColor(dataQuality)}`}>
            {dataQuality}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full ${
              dataQuality >= 90
                ? 'bg-green-600'
                : dataQuality >= 70
                ? 'bg-blue-600'
                : dataQuality >= 50
                ? 'bg-yellow-600'
                : 'bg-red-600'
            }`}
            style={{ width: `${dataQuality}%` }}
          />
        </div>
        <p className="text-sm font-medium text-gray-700">
          {getQualityLabel(dataQuality)}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onReEnrich}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Re-enrich Now
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onVerifyData}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
          >
            Verify Data
          </button>
          <button
            onClick={onReportIssue}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
          >
            Report Issue
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataSourcesPanel;
