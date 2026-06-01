import React from 'react';
import { Users, Building2, ChevronDown, ChevronRight, Mail, Phone } from 'lucide-react';

export interface OrgNode {
  id: string;
  name: string;
  title: string;
  department?: string;
  email?: string;
  phone?: string;
  isContact?: boolean;
  role?: 'decision-maker' | 'influencer' | 'champion' | 'user' | 'other';
  reports?: OrgNode[];
}

interface OrganizationChartProps {
  data: OrgNode;
  onContactClick?: (contactId: string) => void;
  showExpanded?: boolean;
}

const OrganizationChart: React.FC<OrganizationChartProps> = ({
  data,
  onContactClick,
  showExpanded = true
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-6">
          <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Building2 className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">ORGANIZATION CHART</h3>
            <p className="text-xs text-gray-500">Reporting structure and relationships</p>
          </div>
        </div>

        {/* Organization Tree */}
        <div className="overflow-x-auto">
          <OrgNode node={data} onContactClick={onContactClick} showExpanded={showExpanded} />
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Legend</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
              <span className="text-gray-600">Decision Maker</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300"></div>
              <span className="text-gray-600">Champion</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>
              <span className="text-gray-600">Influencer</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
              <span className="text-gray-600">User</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface OrgNodeProps {
  node: OrgNode;
  level?: number;
  onContactClick?: (contactId: string) => void;
  showExpanded?: boolean;
}

const OrgNode: React.FC<OrgNodeProps> = ({
  node,
  level = 0,
  onContactClick,
  showExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = React.useState(showExpanded);

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'decision-maker':
        return 'bg-red-100 border-red-300';
      case 'champion':
        return 'bg-purple-100 border-purple-300';
      case 'influencer':
        return 'bg-blue-100 border-blue-300';
      case 'user':
        return 'bg-green-100 border-green-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getRoleTextColor = (role?: string) => {
    switch (role) {
      case 'decision-maker':
        return 'text-red-900';
      case 'champion':
        return 'text-purple-900';
      case 'influencer':
        return 'text-blue-900';
      case 'user':
        return 'text-green-900';
      default:
        return 'text-gray-900';
    }
  };

  const hasReports = node.reports && node.reports.length > 0;

  return (
    <div className="relative">
      {/* Node Card */}
      <div
        className={`
          border-2 rounded-lg p-3 mb-3 transition-all
          ${node.isContact ? getRoleColor(node.role) : 'bg-white border-gray-200'}
          ${node.isContact ? 'cursor-pointer hover:shadow-md' : ''}
        `}
        style={{ marginLeft: `${level * 40}px` }}
        onClick={() => node.isContact && onContactClick?.(node.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className={`text-sm font-bold ${getRoleTextColor(node.role)}`}>
                {node.name}
              </h4>
              {node.isContact && (
                <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-bold">
                  Contact
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 mb-1">{node.title}</p>
            {node.department && (
              <p className="text-xs text-gray-500 mb-2">{node.department}</p>
            )}

            {/* Contact Info */}
            {node.isContact && (
              <div className="space-y-1 mt-2">
                {node.email && (
                  <div className="flex items-center space-x-1 text-xs text-gray-600">
                    <Mail className="h-3 w-3" />
                    <a
                      href={`mailto:${node.email}`}
                      className="hover:text-blue-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {node.email}
                    </a>
                  </div>
                )}
                {node.phone && (
                  <div className="flex items-center space-x-1 text-xs text-gray-600">
                    <Phone className="h-3 w-3" />
                    <a
                      href={`tel:${node.phone}`}
                      className="hover:text-blue-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {node.phone}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Expand/Collapse Button */}
          {hasReports && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="ml-2 p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
            </button>
          )}
        </div>

        {/* Reports Count */}
        {hasReports && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              {node.reports!.length} {node.reports!.length === 1 ? 'direct report' : 'direct reports'}
            </p>
          </div>
        )}
      </div>

      {/* Reports (Children) */}
      {hasReports && isExpanded && (
        <div className="relative before:absolute before:left-5 before:top-0 before:bottom-3 before:w-px before:bg-gray-300">
          {node.reports!.map((report, index) => (
            <div key={report.id} className="relative">
              {/* Connection Line */}
              <div
                className="absolute left-5 top-6 w-10 h-px bg-gray-300"
                style={{ marginLeft: `${level * 40}px` }}
              />
              <OrgNode
                node={report}
                level={level + 1}
                onContactClick={onContactClick}
                showExpanded={showExpanded}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganizationChart;
