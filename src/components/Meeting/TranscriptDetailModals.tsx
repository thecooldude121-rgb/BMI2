import React from 'react';
import { X, Brain, TrendingUp, Check, ExternalLink, RotateCcw } from 'lucide-react';

interface AIDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  detection: {
    title: string;
    confidence: number;
    extractedData: Array<{ label: string; value: string }>;
    crmActions: string[];
  };
  onViewInCRM?: () => void;
  onUndoAction?: () => void;
}

export const AIDetectionModal: React.FC<AIDetectionModalProps> = ({
  isOpen,
  onClose,
  detection,
  onViewInCRM,
  onUndoAction
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">AI Analysis Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Detection</span>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                {detection.confidence}% Confidence
              </span>
            </div>
            <div className="text-lg font-semibold text-gray-900">{detection.title}</div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-3">Extracted Data</div>
            <div className="space-y-2 bg-gray-50 rounded-lg p-4">
              {detection.extractedData.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <div>
                    <span className="text-sm font-medium text-gray-900">{item.label}:</span>{' '}
                    <span className="text-sm text-gray-700">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {detection.crmActions.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">CRM Actions Taken</div>
              <div className="space-y-2">
                {detection.crmActions.map((action, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3"
                  >
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          {onUndoAction && (
            <button
              onClick={onUndoAction}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Undo Action
            </button>
          )}
          {onViewInCRM && (
            <button
              onClick={onViewInCRM}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View in CRM
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface SentimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sentiment: {
    score: number;
    label: string;
    emoji: string;
    indicators: string[];
    tone: string;
    energy: string;
  };
}

export const SentimentModal: React.FC<SentimentModalProps> = ({
  isOpen,
  onClose,
  sentiment
}) => {
  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Sentiment Analysis</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-3">{sentiment.emoji}</div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {sentiment.label}
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getScoreColor(sentiment.score)}`}>
              <span className="text-lg font-semibold">{sentiment.score}%</span>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-3">Indicators</div>
            <div className="space-y-2 bg-gray-50 rounded-lg p-4">
              {sentiment.indicators.map((indicator, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-700">{indicator}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs font-medium text-gray-500 mb-1">Tone</div>
              <div className="text-sm font-semibold text-gray-900">{sentiment.tone}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs font-medium text-gray-500 mb-1">Energy</div>
              <div className="text-sm font-semibold text-gray-900">{sentiment.energy}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface SpeakerTooltipProps {
  speaker: {
    name: string;
    title: string;
    speakingTime: number;
    speakingPercentage: number;
    sentimentScore: number;
  };
  onFilterToSpeaker?: () => void;
  onViewContact?: () => void;
}

export const SpeakerTooltip: React.FC<SpeakerTooltipProps> = ({
  speaker,
  onFilterToSpeaker,
  onViewContact
}) => {
  return (
    <div className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[250px]">
      <div className="mb-3">
        <div className="font-semibold text-gray-900">{speaker.name}</div>
        <div className="text-sm text-gray-500">{speaker.title}</div>
      </div>

      <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Speaking time:</span>
          <span className="font-medium text-gray-900">
            {speaker.speakingTime} mins ({speaker.speakingPercentage}%)
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Sentiment:</span>
          <span className="font-medium text-green-600">
            Positive ({speaker.sentimentScore}%)
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {onFilterToSpeaker && (
          <button
            onClick={onFilterToSpeaker}
            className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-left"
          >
            Filter to this speaker
          </button>
        )}
        {onViewContact && (
          <button
            onClick={onViewContact}
            className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-left"
          >
            View contact details
          </button>
        )}
      </div>
    </div>
  );
};
