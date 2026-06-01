import React, { useState, useEffect } from 'react';
import { X, Download, Share2, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

interface RecentDocument {
  document_id: string;
  document_name: string;
  file_type: string;
  file_size: number;
  category: string;
  view_count: number;
  deal_name?: string;
  account_name?: string;
  last_viewed_date: string;
  thumbnail_url?: string;
  file_url: string;
}

interface DocumentPreviewModalProps {
  document: RecentDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (doc: RecentDocument) => void;
  onViewDetails: (doc: RecentDocument) => void;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document: doc,
  isOpen,
  onClose,
  onDownload,
  onViewDetails,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(15);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          setCurrentPage((prev) => Math.max(1, prev - 1));
          break;
        case 'ArrowRight':
          setCurrentPage((prev) => Math.min(totalPages, prev + 1));
          break;
        case 'Enter':
          if (doc) {
            onViewDetails(doc);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, doc, onClose, onViewDetails, totalPages]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    setCurrentPage(1);
  }, [doc]);

  if (!isOpen || !doc) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleShare = () => {
    alert('Share functionality would open a share modal');
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Document Preview</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900 mb-2">{doc.document_name}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {doc.category}
              </span>
              <span>{formatFileSize(doc.file_size)}</span>
              <span>•</span>
              <span>{totalPages} pages</span>
            </div>
          </div>

          <div className="border-t border-b border-gray-200 py-6 my-6">
            <div className="bg-gray-50 rounded-lg min-h-[500px] flex items-center justify-center">
              {doc.thumbnail_url ? (
                <img
                  src={doc.thumbnail_url}
                  alt={`Preview of ${doc.document_name}`}
                  className="max-w-full max-h-[500px] object-contain"
                />
              ) : (
                <div className="text-center">
                  <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Preview not available</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Click "View Full Details" to see the complete document
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 inline mr-1" />
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => onDownload(doc)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={() => onViewDetails(doc)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Full Details
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Esc</kbd> Close
              </span>
              <span>
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">←</kbd>
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs ml-1">→</kbd> Navigate
              </span>
              <span>
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Enter</kbd> View Details
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
