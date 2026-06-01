import React from 'react';
import { BarChart3, MessageCircle, CheckSquare, TrendingUp, Clock, Hash } from 'lucide-react';
import { Analytics } from '../../utils/meetingTranscriptMockData';

interface AnalyticsPanelProps {
  analytics: Analytics;
  totalWords: number;
  duration: number;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  analytics,
  totalWords,
  duration
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        Analytics
      </h3>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-900">Questions</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{analytics.questionCount}</div>
          </div>

          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckSquare className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-900">Decisions</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{analytics.decisionPoints}</div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Engagement Score</span>
            </div>
            <span className="text-2xl font-bold text-purple-600">{analytics.engagementScore}%</span>
          </div>
          <div className="w-full bg-purple-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${analytics.engagementScore}%` }}
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Speaking Pace</span>
          </div>
          <div className="space-y-2">
            {analytics.speakingPace.map((pace, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{pace.speaker}:</span>
                <span className="font-medium text-gray-900">{pace.wordsPerMinute} wpm</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Top Keywords</span>
          </div>
          <div className="space-y-2">
            {analytics.topKeywords.slice(0, 5).map((keyword, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400">#{index + 1}</span>
                  <span className="text-sm text-gray-900 capitalize">{keyword.word}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${(keyword.count / analytics.topKeywords[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-500">{keyword.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="text-sm font-medium text-gray-700 mb-3">Meeting Metrics</div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Words:</span>
              <span className="font-medium text-gray-900">{totalWords.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium text-gray-900">{duration} minutes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Avg Sentence Length:</span>
              <span className="font-medium text-gray-900">{analytics.averageSentenceLength} words</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Words/Minute:</span>
              <span className="font-medium text-gray-900">{Math.round(totalWords / duration)}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="text-xs font-medium text-gray-700 mb-2">Conversation Health</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">{Math.round((analytics.questionCount / (totalWords / 100)) * 100)}%</div>
              <div className="text-xs text-gray-600">Questions</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{analytics.decisionPoints}</div>
              <div className="text-xs text-gray-600">Decisions</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">{analytics.engagementScore}%</div>
              <div className="text-xs text-gray-600">Engaged</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
