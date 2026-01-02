import React from 'react';
import { Upload } from 'lucide-react';

interface DragDropOverlayProps {
  isVisible: boolean;
  isDraggingOver: boolean;
  fileCount?: number;
}

const DragDropOverlay: React.FC<DragDropOverlayProps> = ({ isVisible, isDraggingOver, fileCount = 1 }) => {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        animation: 'fadeIn 0.2s ease-in-out'
      }}
    >
      <div
        className="bg-white rounded-xl p-16 border-4 border-dashed border-blue-500 shadow-2xl"
        style={{
          minWidth: '500px',
          maxWidth: '700px',
          animation: isDraggingOver ? 'breathe 1.5s ease-in-out infinite' : 'none'
        }}
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <div
            className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center"
            style={{ animation: isDraggingOver ? 'bounce 0.5s ease-in-out infinite' : 'none' }}
          >
            <Upload size={56} className="text-blue-500" />
          </div>

          <div>
            <h3 className="text-3xl font-bold mb-3 text-blue-600">
              {fileCount > 1 ? `Drop ${fileCount} files here` : 'Drop files here to upload'}
            </h3>
            <p className="text-gray-600 text-base mb-2">
              Supported: PDF, DOCX, PPTX, XLSX, JPG, PNG, MP4, MP3
            </p>
            <p className="text-gray-500 text-sm">
              Max size: 50MB
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes breathe {
          0%, 100% {
            border-color: #3b82f6;
            transform: scale(1);
          }
          50% {
            border-color: #60a5fa;
            transform: scale(1.02);
          }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};

export default DragDropOverlay;
