import React from 'react';
import { X, Building2, TrendingUp, Calendar, ArrowRight, Lightbulb } from 'lucide-react';

interface HRMSConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  hrmsData: {
    companyName: string;
    contactName: string;
    contactTitle: string;
    recruitmentDate: string;
  };
}

export default function HRMSConnectionModal({ isOpen, onClose, hrmsData }: HRMSConnectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            HRMS Connection Details
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{hrmsData.companyName}</h3>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-emerald-900">Recruited Employee:</span>
              </div>
              <p className="text-base font-semibold text-emerald-900">{hrmsData.contactName}</p>
              <p className="text-sm text-emerald-700">{hrmsData.contactTitle}</p>
              <div className="flex items-center gap-2 mt-3 text-sm text-emerald-700">
                <Calendar className="h-4 w-4" />
                <span>
                  Recruitment Date:{' '}
                  {new Date(hrmsData.recruitmentDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">Meeting Advantage</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                <p className="text-sm text-gray-700">Warm introduction through trusted connection</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                <p className="text-sm text-gray-700">Existing relationship with recruited employee</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-emerald-600">33% higher close rate</span> with HRMS connections
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <h4 className="font-semibold text-gray-900">Conversation Starters</h4>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-gray-700 italic">
                  "How's the transition going since joining {hrmsData.companyName}?"
                </p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-gray-700 italic">
                  "We'd love to hear any feedback about your experience at the company so far"
                </p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-gray-700 italic">
                  "Is there anything we can do to support your success in the new role?"
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2">
              View HRMS Module
              <ArrowRight className="h-4 w-4" />
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
