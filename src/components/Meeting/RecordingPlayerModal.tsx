import React, { useState } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Volume2, Settings, Maximize2, Download, Share2 } from 'lucide-react';

interface RecordingPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: {
    title: string;
    date: string;
    duration: number;
    keyMoments: Array<{
      timestamp: string;
      label: string;
      isKey?: boolean;
    }>;
  };
}

export default function RecordingPlayerModal({ isOpen, onClose, meeting }: RecordingPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const handleTimelineClick = (timestamp: string) => {
    setCurrentTime(timestamp);
    const [minutes, seconds] = timestamp.split(':').map(Number);
    const totalSeconds = minutes * 60 + seconds;
    const progressPercentage = (totalSeconds / (meeting.duration * 60)) * 100;
    setProgress(progressPercentage);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Play className="h-5 w-5" />
              {meeting.title}
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              {meeting.date} • {meeting.duration} minutes
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 mx-auto">
                {isPlaying ? (
                  <Pause className="h-10 w-10 text-white" />
                ) : (
                  <Play className="h-10 w-10 text-white ml-1" />
                )}
              </div>
              <p className="text-white text-lg font-medium">
                {isPlaying ? 'Playing...' : 'Ready to play'}
              </p>
              <p className="text-blue-200 text-sm mt-2">{currentTime} / {meeting.duration}:00</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative h-2 bg-gray-200 rounded-full cursor-pointer">
              <div
                className="absolute inset-y-0 left-0 bg-blue-600 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-600 rounded-full shadow-lg transition-all"
                style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <SkipBack className="h-5 w-5 text-gray-700" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-0.5" />
                  )}
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <SkipForward className="h-5 w-5 text-gray-700" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Volume2 className="h-5 w-5 text-gray-700" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings className="h-5 w-5 text-gray-700" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Maximize2 className="h-5 w-5 text-gray-700" />
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Moments</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {meeting.keyMoments.map((moment, index) => (
                <button
                  key={index}
                  onClick={() => handleTimelineClick(moment.timestamp)}
                  className={`w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                    moment.isKey ? 'bg-blue-50 border border-blue-200' : 'border border-gray-200'
                  }`}
                >
                  <span className={`text-sm font-mono ${moment.isKey ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
                    {moment.timestamp}
                  </span>
                  <span className="flex-1 text-sm text-gray-700">{moment.label}</span>
                  {moment.isKey && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                      Key
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2">
              <Download className="h-4 w-4" />
              Download Recording
            </button>
            <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2">
              <Share2 className="h-4 w-4" />
              Share
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
