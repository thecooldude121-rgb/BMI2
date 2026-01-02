import React, { useState } from 'react';
import {
  Eye, Plus, Sparkles, Mail, Star, MoreVertical, CheckSquare,
  Building, MapPin, TrendingUp, Briefcase, Globe, Linkedin,
  Copy, Tag, MessageSquare, Zap, FileText, Trash2
} from 'lucide-react';

interface Prospect {
  id: string;
  fullName: string;
  title: string;
  company: string;
  industry: string;
  companySize: string;
  location: string;
  email: string;
  linkedinUrl?: string;
  leadScore: number;
  aiScore: number;
  dataQuality: number;
  tags: string[];
}

interface EnhancedResultCardProps {
  prospect: Prospect;
  isSelected: boolean;
  isFavorited: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onViewProfile: (prospect: Prospect) => void;
  onAddToList: (prospect: Prospect) => void;
  onFindSimilar: (prospect: Prospect) => void;
  onSendEmail: (prospect: Prospect) => void;
}

const EnhancedResultCard: React.FC<EnhancedResultCardProps> = ({
  prospect,
  isSelected,
  isFavorited,
  onSelect,
  onToggleFavorite,
  onViewProfile,
  onAddToList,
  onFindSimilar,
  onSendEmail
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const menuOptions = [
    { icon: Eye, label: 'View full profile', action: () => onViewProfile(prospect) },
    { icon: Zap, label: 'Add to sequence', action: () => {} },
    { icon: FileText, label: 'Export contact', action: () => {} },
    { icon: Tag, label: 'Add tags', action: () => {} },
    { icon: CheckSquare, label: 'Mark as contacted', action: () => {} },
    { icon: MessageSquare, label: 'Add note', action: () => {} },
    { icon: Copy, label: 'Copy email', action: () => navigator.clipboard.writeText(prospect.email) },
    { icon: Copy, label: 'Copy LinkedIn URL', action: () => prospect.linkedinUrl && navigator.clipboard.writeText(prospect.linkedinUrl) },
    { icon: Trash2, label: 'Remove from results', action: () => {}, danger: true }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div
      className="relative bg-white border border-gray-200 rounded-xl p-5 hover:shadow-xl transition-all duration-200 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Right Corner Actions */}
      <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(prospect.id)}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer"
        />
        <button
          onClick={() => onToggleFavorite(prospect.id)}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Star
            className={`h-4 w-4 ${
              isFavorited ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
            }`}
          />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="h-4 w-4 text-gray-600" />
          </button>

          {/* Three-Dot Menu */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowMenu(false)}
              ></div>
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] z-30">
                {menuOptions.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      option.action();
                      setShowMenu(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left ${
                      option.danger ? 'text-red-600' : 'text-gray-700'
                    }`}
                  >
                    <option.icon className="h-4 w-4" />
                    <span className="text-sm">{option.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hover Overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-black bg-opacity-60 rounded-xl flex items-center justify-center z-5 animate-fade-in">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onViewProfile(prospect)}
              className="flex flex-col items-center px-6 py-4 bg-white rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <Eye className="h-6 w-6 text-gray-700 mb-2" />
              <span className="text-sm font-medium text-gray-900">View Profile</span>
            </button>
            <button
              onClick={() => onAddToList(prospect)}
              className="flex flex-col items-center px-6 py-4 bg-white rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <Plus className="h-6 w-6 text-gray-700 mb-2" />
              <span className="text-sm font-medium text-gray-900">Add to List</span>
            </button>
            <button
              onClick={() => onFindSimilar(prospect)}
              className="flex flex-col items-center px-6 py-4 bg-white rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <Sparkles className="h-6 w-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Find Similar</span>
            </button>
            <button
              onClick={() => onSendEmail(prospect)}
              className="flex flex-col items-center px-6 py-4 bg-white rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <Mail className="h-6 w-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Send Email</span>
            </button>
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className={`transition-opacity ${isHovered ? 'opacity-20' : 'opacity-100'}`}>
        {/* Header */}
        <div className="mb-4 pr-24">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{prospect.fullName}</h3>
          <p className="text-gray-600 text-sm">{prospect.title}</p>
          <p className="text-gray-500 text-sm">{prospect.company}</p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Building className="h-4 w-4 text-gray-400" />
            <span>{prospect.industry}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Briefcase className="h-4 w-4 text-gray-400" />
            <span>{prospect.companySize}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{prospect.location.split(',')[0]}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="truncate">{prospect.email.split('@')[0]}@...</span>
          </div>
        </div>

        {/* Scores */}
        <div className="flex items-center space-x-4 mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Lead:</span>
            <span className={`text-sm font-bold ${getScoreColor(prospect.leadScore)}`}>
              {prospect.leadScore}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">AI:</span>
            <span className={`text-sm font-bold ${getScoreColor(prospect.aiScore)}`}>
              {prospect.aiScore}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Quality:</span>
            <span className={`text-sm font-bold ${getScoreColor(prospect.dataQuality)}`}>
              {prospect.dataQuality}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {prospect.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"
            >
              {tag}
            </span>
          ))}
          {prospect.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
              +{prospect.tags.length - 3}
            </span>
          )}
        </div>

        {/* Find Similar Button */}
        <button
          onClick={() => onFindSimilar(prospect)}
          className="w-full flex items-center justify-center px-4 py-2 border-2 border-dashed border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-medium text-sm"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Find Similar
        </button>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default EnhancedResultCard;
