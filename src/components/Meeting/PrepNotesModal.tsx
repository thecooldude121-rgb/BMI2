import React from 'react';
import { X, Users, DollarSign, Clock, FileText, Lightbulb, CheckSquare, Download } from 'lucide-react';

interface PrepNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: {
    title: string;
    attendees: Array<{ name: string; title: string }>;
    dealValue?: number;
    dealStage?: string;
    lastActivity?: string;
    topics: string[];
    documents: string[];
    insights: string[];
    suggestedQuestions: string[];
  };
}

export default function PrepNotesModal({ isOpen, onClose, meeting }: PrepNotesModalProps) {
  if (!isOpen) return null;

  const handlePrintPrepSheet = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Meeting Prep
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{meeting.title}</h3>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">Attendees</h4>
            </div>
            <div className="space-y-2">
              {meeting.attendees.map((attendee, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{attendee.name}</p>
                    <p className="text-sm text-gray-600">{attendee.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {meeting.dealValue && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">Deal Context</h4>
              </div>
              <div className="space-y-2 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Value:</span>
                  <span className="text-sm font-semibold text-green-700">
                    ${(meeting.dealValue / 1000).toFixed(0)}K
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Stage:</span>
                  <span className="text-sm font-semibold text-gray-900">{meeting.dealStage}</span>
                </div>
                {meeting.lastActivity && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Last activity:</span>
                    <span className="text-sm text-gray-900">{meeting.lastActivity}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckSquare className="h-5 w-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Topics to Cover</h4>
            </div>
            <div className="space-y-2">
              {meeting.topics.map((topic, index) => (
                <div key={index} className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="h-5 w-5 rounded border-2 border-purple-600 flex items-center justify-center">
                    <div className="h-2 w-2 bg-purple-600 rounded-sm" />
                  </div>
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          </div>

          {meeting.documents.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Key Documents</h4>
              </div>
              <div className="space-y-2">
                {meeting.documents.map((doc, index) => (
                  <button
                    key={index}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors w-full text-left"
                  >
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span>{doc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {meeting.insights.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-orange-600" />
                <h4 className="font-semibold text-gray-900">Recent Insights</h4>
              </div>
              <div className="space-y-2 bg-orange-50 border border-orange-200 rounded-lg p-4">
                {meeting.insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-600 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {meeting.suggestedQuestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <h4 className="font-semibold text-gray-900">Suggested Questions</h4>
              </div>
              <div className="space-y-2">
                {meeting.suggestedQuestions.map((question, index) => (
                  <div
                    key={index}
                    className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-gray-700 italic"
                  >
                    "{question}"
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handlePrintPrepSheet}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Print Prep Sheet
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
