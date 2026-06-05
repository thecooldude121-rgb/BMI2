import React, { useState, useEffect, useRef } from 'react';
import { Edit, MoreVertical, Building2, User, Target, Calendar, Sparkles, Mail, Phone, CalendarDays, FileText, TrendingUp, TrendingDown, ChevronDown, ChevronUp, DollarSign, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MoreOptionsDropdown } from './DealModals';
import { daysFromNowLabel, closeDateUrgencyClass } from '../../utils/dateUtils';
import { formatCurrencyCompact, convertToBaseCurrency, BASE_CURRENCY_CODE } from '../../utils/currencyUtils';
import { getUsers } from '../../utils/dealsApi';
import type { DealOwnerInfo, DealValueHistoryEntry } from '../../types/dealManagement';

interface DealHeroSectionProps {
  deal: {
    id: string;
    companyName: string;
    dealName: string;
    amount: number;
    currency?: string;
    base_amount_usd?: number;
    stage: string;
    stageName: string;
    closeDate: string;
    owner: string;
    ownerId?: string;
    ownerInfo?: DealOwnerInfo;
    dealValueHistory?: DealValueHistoryEntry[];
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
  onAssignOwner?: (ownerName: string) => void;
}

export const DealHeroSection: React.FC<DealHeroSectionProps> = ({
  deal,
  onEdit,
  onMoreAction,
  onEmail,
  onCall,
  onMeeting,
  onMoveStage,
  onUpdateAmount,
  onAssignOwner,
}) => {
  const navigate = useNavigate();
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [showValueHistory, setShowValueHistory] = useState(false);
  const [ownersList, setOwnersList] = useState<any[]>([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);
  const ownerDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showOwnerDropdown) return;
    function handleClickOutside(e: MouseEvent) {
      if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(e.target as Node)) {
        setShowOwnerDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOwnerDropdown]);

  const ownerName = deal.owner || deal.ownerInfo?.name || '';
  const isUnassigned = !ownerName;
  const isOOO = deal.ownerInfo?.outOfOffice === true;
  const lastActiveAt = deal.ownerInfo?.lastActiveAt;
  const lastActiveDays = lastActiveAt
    ? Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 86_400_000)
    : null;
  const lastActiveColor = lastActiveDays !== null
    ? (lastActiveDays > 7 ? 'text-red-600' : lastActiveDays > 3 ? 'text-amber-600' : 'text-gray-500')
    : '';
  const lastActiveText = lastActiveDays !== null
    ? (lastActiveDays === 0 ? 'Active today'
      : lastActiveDays === 1 ? 'Active yesterday'
      : `Last active ${lastActiveDays}d ago`)
    : '';

  const dealValueHistory = deal.dealValueHistory;
  const hasValueHistory = (dealValueHistory?.length ?? 0) > 0;
  const originalValue = hasValueHistory
    ? dealValueHistory![dealValueHistory!.length - 1].previousValue
    : deal.amount;
  const valueDelta = deal.amount - originalValue;
  const valuePctChange = originalValue !== 0
    ? Math.round((valueDelta / originalValue) * 100)
    : 0;
  const valueDeltaTooltip = hasValueHistory
    ? `Original: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: deal.currency || 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(originalValue)} · Current: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: deal.currency || 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(deal.amount)} · ${valuePctChange >= 0 ? '+' : ''}${valuePctChange}% from original`
    : '';

  function formatValueCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: deal.currency || 'USD',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  }

  function openOwnerDropdown() {
    if (ownersList.length === 0) {
      setIsLoadingOwners(true);
      getUsers()
        .then(users => setOwnersList(users))
        .catch(() => {})
        .finally(() => setIsLoadingOwners(false));
    }
    setShowOwnerDropdown(true);
  }

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
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium text-blue-700">Value</div>
              {valueDelta !== 0 && (
                <div title={valueDeltaTooltip} className="cursor-help">
                  {valueDelta > 0
                    ? <TrendingUp className="h-4 w-4 text-green-500" />
                    : <TrendingDown className="h-4 w-4 text-red-500" />
                  }
                </div>
              )}
            </div>
            <div className="text-3xl font-bold text-blue-900">
              {formatCurrencyCompact(deal.amount, deal.currency || BASE_CURRENCY_CODE)}
            </div>
            {deal.currency && deal.currency !== BASE_CURRENCY_CODE && deal.amount > 0 && (
              <div className="text-xs text-blue-600 mt-0.5 opacity-80">
                ≈ {formatCurrencyCompact(
                    deal.base_amount_usd || convertToBaseCurrency(deal.amount, deal.currency),
                    BASE_CURRENCY_CODE
                  )} USD
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowValueHistory(v => !v)}
              className="mt-2 flex items-center gap-0.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              {showValueHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Value History
            </button>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
            <div className="text-sm font-medium text-orange-700 mb-1">Stage</div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getStageEmoji(deal.stage)}</span>
              <span className="text-lg font-bold text-orange-900">{deal.stageName}</span>
            </div>
            <div className="text-xs text-orange-700 mt-1">Stage {deal.stageNumber} of {deal.totalStages}</div>
          </div>
          <div className={`rounded-xl p-5 border ${closeDateUrgencyClass(deal.closeDate)}`}>
            <div className="text-sm font-medium mb-1 opacity-70">Close Date</div>
            <div className="text-lg font-bold">{deal.closeDate}</div>
            <div className="text-xs mt-1 opacity-80">{daysFromNowLabel(deal.closeDate)}</div>
          </div>
          {/* Owner tile */}
          <div className="relative bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-purple-700">Owner</div>
              {isOOO && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 leading-tight">
                  OOO
                </span>
              )}
            </div>

            {isUnassigned ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-base font-semibold text-red-600">Unassigned</span>
                </div>
                {onAssignOwner && (
                  <button
                    type="button"
                    onClick={openOwnerDropdown}
                    className="text-xs font-medium text-purple-700 hover:text-purple-900 underline underline-offset-2 transition-colors"
                  >
                    + Assign Owner
                  </button>
                )}
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => deal.ownerId && navigate(`/team/${deal.ownerId}`)}
                  className="text-lg font-bold text-purple-900 hover:underline text-left leading-tight"
                >
                  {ownerName}
                </button>
                {lastActiveDays !== null && (
                  <div className={`flex items-center gap-1 text-xs mt-1.5 ${lastActiveColor}`}>
                    {lastActiveDays > 7 && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
                    <span>{lastActiveText}</span>
                  </div>
                )}
              </div>
            )}

            {/* Owner assignment dropdown */}
            {showOwnerDropdown && (
              <div
                ref={ownerDropdownRef}
                className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
              >
                {isLoadingOwners ? (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center">Loading team members…</div>
                ) : ownersList.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center">No team members found</div>
                ) : (
                  <ul className="max-h-52 overflow-y-auto py-1">
                    {ownersList.map((u: any) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 transition-colors"
                          onClick={() => {
                            const name = `${u.first_name} ${u.last_name}`;
                            setShowOwnerDropdown(false);
                            onAssignOwner?.(name);
                          }}
                        >
                          <span className="font-medium">{u.first_name} {u.last_name}</span>
                          {u.role && (
                            <span className="text-gray-400 text-xs ml-1.5">({u.role})</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Value History accordion */}
        {showValueHistory && (
          <div className="mb-3 bg-white border border-blue-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-900">Value Change History</span>
              <button
                type="button"
                onClick={() => setShowValueHistory(false)}
                className="text-blue-400 hover:text-blue-600 text-xs"
              >
                Close
              </button>
            </div>
            <div className="px-4 py-3 space-y-2 max-h-64 overflow-y-auto">
              {!hasValueHistory ? (
                <p className="text-sm text-gray-500 py-2">No changes — original value</p>
              ) : (
                dealValueHistory!.map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-900 font-medium">
                        {new Date(entry.changedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-sm text-gray-700 mx-1">:</span>
                      <span className="text-sm text-red-600 line-through">{formatValueCurrency(entry.previousValue)}</span>
                      <span className="text-sm text-gray-500 mx-1">→</span>
                      <span className="text-sm text-green-600 font-medium">{formatValueCurrency(entry.newValue)}</span>
                      <span className="text-sm text-gray-500 ml-2">· Changed by {entry.changedBy}</span>
                      {entry.reason && (
                        <span className="text-sm text-gray-500 ml-2">· Reason: {entry.reason}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

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
