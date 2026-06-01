import React, { useState } from 'react';
import { X, Download, FileText, FileType, File, Code } from 'lucide-react';

interface DownloadTranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (options: DownloadOptions) => void;
  meetingTitle: string;
}

export interface DownloadOptions {
  format: 'pdf' | 'word' | 'txt' | 'srt' | 'json';
  includeSpeakers: boolean;
  includeTimestamps: boolean;
  includeAIHighlights: boolean;
  includeActionItems: boolean;
  includeKeyMoments: boolean;
}

const DownloadTranscriptModal: React.FC<DownloadTranscriptModalProps> = ({
  isOpen,
  onClose,
  onDownload,
  meetingTitle
}) => {
  const [selectedFormat, setSelectedFormat] = useState<DownloadOptions['format']>('pdf');
  const [options, setOptions] = useState({
    includeSpeakers: true,
    includeTimestamps: true,
    includeAIHighlights: true,
    includeActionItems: true,
    includeKeyMoments: true
  });

  if (!isOpen) return null;

  const formats = [
    { id: 'pdf', label: 'PDF (with highlights)', icon: FileText, description: 'Professional formatted document' },
    { id: 'word', label: 'Word (DOCX)', icon: FileType, description: 'Editable Microsoft Word document' },
    { id: 'txt', label: 'Plain Text (TXT)', icon: File, description: 'Simple text file' },
    { id: 'srt', label: 'SRT (Subtitles)', icon: FileText, description: 'Subtitle format for videos' },
    { id: 'json', label: 'JSON (with timestamps)', icon: Code, description: 'Structured data format' }
  ];

  const handleDownload = () => {
    onDownload({
      format: selectedFormat,
      ...options
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Download Transcript</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Format
            </label>
            <div className="space-y-2">
              {formats.map((format) => {
                const Icon = format.icon;
                return (
                  <label
                    key={format.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="format"
                      value={format.id}
                      checked={selectedFormat === format.id}
                      onChange={(e) => setSelectedFormat(e.target.value as DownloadOptions['format'])}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{format.label}</span>
                      </div>
                      <span className="text-xs text-gray-500">{format.description}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Include
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={options.includeSpeakers}
                  onChange={(e) => setOptions({ ...options, includeSpeakers: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Speaker labels</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={options.includeTimestamps}
                  onChange={(e) => setOptions({ ...options, includeTimestamps: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Timestamps</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={options.includeAIHighlights}
                  onChange={(e) => setOptions({ ...options, includeAIHighlights: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">AI highlights</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={options.includeActionItems}
                  onChange={(e) => setOptions({ ...options, includeActionItems: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Action items</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={options.includeKeyMoments}
                  onChange={(e) => setOptions({ ...options, includeKeyMoments: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Key moments</span>
              </label>
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <strong className="text-gray-700">File name:</strong> {meetingTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_transcript.{selectedFormat}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadTranscriptModal;
