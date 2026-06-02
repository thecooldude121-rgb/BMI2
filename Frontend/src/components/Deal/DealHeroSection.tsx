import React, { useState } from 'react';
import { Edit, MoreVertical, Building2, User, Target, Calendar, Sparkles, Mail, Phone, CalendarDays, FileText, TrendingUp, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MoreOptionsDropdown } from './DealModals';
import { daysFromNowLabel } from '../../utils/dateUtils';

interface DealHeroSectionProps {
  deal: {
    id: string;
    companyName: string;
    dealName: string;
    amount: number;
    stage: string;
    stageName: string;
    closeDate: string;
    owner: string;
    ownerId?: string;
    createdDate: string;
    accountName: string;
    accountSize: string;
    accountIndustry: string;
    contactName: string;
    contactTitle: string;
    source: string;
    aiScore: number;
    aiHealth: string;
    daysAway: number;
    stageNumber: number;
    totalStages: number;
  };
  onEdit: () => void;
  onMoreAction: (action: string) => void;
  onEmail?: () => void;
  onCall?: () => void;
  onMeeting?: () => void;
  onMoveStage?: () => void;
  onUpdateAmount?: () => void;
}

export const DealHeroSection: React.FC<DealHeroSectionProps> = ({
  deal,
  onEdit,
  onMoreAction,
  onEmail,
  onCall,
  onMeeting,
  onMoveStage,
  onUpdateAmount
}) => {
  const navigate = useNavigate();
  const [showMoreActions, setShowMoreActions] = useState(false);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStageEmoji = (stage: string) => {
    const emojiMap: { [key: string]: string } = {
      'prospecting': '🔍',
      'qualified': '✅',
      'proposal': '🟠',
      'negotiation': '🤝',
      'closed-won': '🎉',
      'closed-lost': '❌'
    };
    return emojiMap[stage.toLowerCase()] || '📊';
  };

  return (
    <div className="bg-white border-b border-gray-200 px-8 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {deal.companyName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{deal.dealName}</h1>
                <button
                  onClick={onEdit}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit className="h-5 w-5 text-gray-600" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowMoreActions(!showMoreActions)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="h-5 w-5 text-gray-600" />
                  </button>
                  <MoreOptionsDropdown
                    isOpen={showMoreActions}
                    onClose={() => setShowMoreActions(false)}
                    onAction={(action) => {
                      onMoreAction(action);
                      setShowMoreActions(false);
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Building2 className="h-4 w-4" />
                <span>{deal.companyName}</span>
                <span className="text-gray-400">•</span>
                <span>Created {deal.createdDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
            <div className="text-sm font-medium text-blue-700 mb-1">Value</div>
            <div className="text-3xl font-bold text-blue-900">${(deal.amount / 1000).toFixed(0)}K</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
            <div className="text-sm font-medium text-orange-700 mb-1">Stage</div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getStageEmoji(deal.stage)}</span>
              <span className="text-lg font-bold text-orange-900">{deal.stageName}</span>
            </div>
            <div className="text-xs text-orange-700 mt-1">Stage {deal.stageNumber} of {deal.totalStages}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
            <div className="text-sm font-medium text-green-700 mb-1">Close Date</div>
            <div className="text-lg font-bold text-green-900">{deal.closeDate}</div>
            <div className="text-xs text-green-700 mt-1">{daysFromNowLabel(deal.closeDate)}</div>
          </div>
          <div
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200 hover:from-purple-100 hover:to-purple-200 transition-all cursor-pointer"
            onClick={() => deal.ownerId && navigate(`/team/${deal.ownerId}`)}
            title="View team member profile"
          >
            <div className="text-sm font-medium text-purple-700 mb-1">Owner</div>
            <div className="text-lg font-bold text-purple-900 hover:underline">{deal.owner}</div>
          </div>
        </div>

        {/* Account & Contact Info */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div
            className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => navigate(`/accounts/${deal.id}`)}
          >
            <Building2 className="h-5 w-5 text-gray-600" />
            <div>
              <div className="text-xs font-medium text-gray-600">Account</div>
              <div className="text-sm font-bold text-gray-900">{deal.accountName}</div>
              <div className="text-xs text-gray-600">{deal.accountSize}, {deal.accountIndustry}</div>
            </div>
          </div>
          <div
            className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => navigate(`/crm/contacts/${deal.id}`)}
          >
            <User className="h-5 w-5 text-gray-600" />
            <div>
              <div className="text-xs font-medium text-gray-600">Contact</div>
              <div className="text-sm font-bold text-gray-900">{deal.contactName}</div>
              <div className="text-xs text-gray-600">{deal.contactTitle}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <Target className="h-5 w-5 text-gray-600" />
            <div>
              <div className="text-xs font-medium text-gray-600">Source</div>
              <div className="text-sm font-bold text-gray-900">{deal.source}</div>
              <div className="text-xs text-gray-600">Lead Gen → Lead → Deal</div>
            </div>
          </div>
        </div>

        {/* AI Health Score */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-200 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-900">AI Health Score</span>
            </div>
            <div className={`text-3xl font-bold ${getHealthColor(deal.aiScore)}`}>
              {deal.aiScore}/100
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getHealthBarColor(deal.aiScore)}`}
              style={{ width: `${deal.aiScore}%` }}
            ></div>
          </div>
          <div className="text-sm font-medium text-gray-700">
            {deal.aiHealth}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onEmail}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </button>
          <button
            onClick={onCall}
            className="flex items-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Phone className="h-4 w-4" />
            <span>Call</span>
          </button>
          <button
            onClick={onMeeting}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            <CalendarDays className="h-4 w-4" />
            <span>Meeting</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">
            <FileText className="h-4 w-4" />
            <span>Proposal</span>
          </button>
          <div className="flex-1"></div>
          <button
            onClick={onMoveStage}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Move to Next Stage</span>
          </button>
          <button
            onClick={onUpdateAmount}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            <DollarSign className="h-4 w-4" />
            <span>Update Amount</span>
          </button>
        </div>
      </div>
    </div>
  );
};
