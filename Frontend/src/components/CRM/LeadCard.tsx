import React from 'react';
import { Building, Mail, Phone, Star, TrendingUp, Calendar, Tag, User } from 'lucide-react';
import { Lead } from '../../contexts/DataContext';
import { aiEngine } from '../../utils/aiEngine';

interface LeadCardProps {
  lead: Lead;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead }) => {
  const aiScore = aiEngine.scoreLeadFit(lead);
  
  const getStageColor = (stage: Lead['stage']) => {
    const colors = {
      new: 'bg-gray-100 text-gray-800',
      contacted: 'bg-blue-100 text-blue-800',
      qualified: 'bg-yellow-100 text-yellow-800',
      proposal: 'bg-orange-100 text-orange-800',
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800'
    };
    return colors[stage];
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      nurturing: 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{lead.name}</h3>
          <p className="text-sm text-gray-600">{lead.position}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <User className={`h-4 w-4 mr-1 ${getScoreColor(aiScore)}`} />
            <span className={`text-sm font-medium ${getScoreColor(aiScore)}`}>
              {aiScore}
            </span>
          </div>
          <div className="flex items-center">
            <Star className={`h-4 w-4 mr-1 ${getScoreColor(lead.score)}`} />
            <span className={`text-sm font-medium ${getScoreColor(lead.score)}`}>
              {lead.score}
            </span>
          </div>
        </div>
      </div>

      {/* Status and Stage */}
      <div className="flex items-center space-x-2 mb-3">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStageColor(lead.stage)}`}>
          {lead.stage}
        </span>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
          {lead.status}
        </span>
      </div>

      {/* Company */}
      <div className="flex items-center mb-3">
        <Building className="h-4 w-4 text-gray-400 mr-2" />
        <span className="text-sm text-gray-700">{lead.company}</span>
        <span className="text-xs text-gray-500 ml-2">• {lead.industry}</span>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center">
          <Mail className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-700 truncate">{lead.email}</span>
        </div>
        <div className="flex items-center">
          <Phone className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-700">{lead.phone}</span>
        </div>
      </div>

      {/* Value, Probability and Source */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="flex items-center">
          <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
          <span className="text-sm font-medium text-gray-900">
            ${lead.value.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-gray-600">
            {lead.probability}% prob
          </span>
        </div>
      </div>

      {/* Source */}
      <div className="mb-4">
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {lead.source}
        </span>
      </div>

      {/* Tags */}
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {lead.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700">
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </span>
          ))}
          {lead.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{lead.tags.length - 3} more</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center text-xs text-gray-500">
          <Calendar className="h-3 w-3 mr-1" />
          Created {new Date(lead.createdAt).toLocaleDateString()}
        </div>
        {lead.lastContact && (
          <span className="text-xs text-gray-500">
            Last contact: {new Date(lead.lastContact).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Notes */}
      {lead.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600 line-clamp-2">{lead.notes}</p>
        </div>
      )}

      {/* AI Insights */}
      {aiScore > 85 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center p-2 bg-green-50 border border-green-200 rounded-md">
            <Star className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-sm text-green-800 font-medium">High-fit lead</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadCard;