import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Download,
  Share2,
  Highlighter,
  Copy,
  ChevronDown,
  DollarSign,
  Calendar,
  Plug,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Sparkles,
  FileText,
  X,
  BarChart3
} from 'lucide-react';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import { useToast } from '../../contexts/ToastContext';
import DownloadTranscriptModal, { DownloadOptions } from '../../components/Meeting/DownloadTranscriptModal';
import ShareTranscriptModal, { ShareOptions } from '../../components/Meeting/ShareTranscriptModal';
import { AIDetectionModal, SentimentModal, SpeakerTooltip } from '../../components/Meeting/TranscriptDetailModals';
import TextSelectionMenu from '../../components/Meeting/TextSelectionMenu';
import { acmeCorpTranscript, TranscriptSegment } from '../../utils/meetingTranscriptMockData';

export default function MeetingTranscriptViewer() {
  const navigate = useNavigate();
  const { meetingId } = useParams();
  const { showToast } = useToast();
  const transcriptRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'action-items' | 'key-moments' | 'questions' | 'decisions'>('all');
  const [filterSpeaker, setFilterSpeaker] = useState<'all' | 'John Smith' | 'Alex Rodriguez'>('all');
  const [highlightedSegmentId, setHighlightedSegmentId] = useState<string | null>(null);

  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAIDetectionModal, setShowAIDetectionModal] = useState(false);
  const [showSentimentModal, setShowSentimentModal] = useState(false);
  const [showSpeakerTooltip, setShowSpeakerTooltip] = useState<string | null>(null);

  const [selectedAIDetection, setSelectedAIDetection] = useState<any>(null);
  const [selectedSentiment, setSelectedSentiment] = useState<any>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const [textSelection, setTextSelection] = useState<{
    text: string;
    position: { x: number; y: number };
  } | null>(null);

  const [highlightMode, setHighlightMode] = useState(false);
  const [highlightedTexts, setHighlightedTexts] = useState<string[]>([]);

  const transcriptData = acmeCorpTranscript.segments;
  const keyMoments = acmeCorpTranscript.keyMoments;

  const filteredTranscript = transcriptData.filter(segment => {
    if (filterType === 'action-items' && segment.type !== 'action-item') return false;
    if (filterType === 'key-moments' && segment.type !== 'key-moment') return false;
    if (filterType === 'questions' && !segment.text.includes('?')) return false;
    if (filterType === 'decisions' && segment.type !== 'key-moment') return false;

    if (filterSpeaker !== 'all' && segment.speaker !== filterSpeaker) return false;

    if (searchQuery && !segment.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    return true;
  });

  const searchResults = searchQuery
    ? transcriptData
        .filter(segment => segment.text.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 5)
    : [];

  const actionItems = transcriptData.filter(s => s.type === 'action-item' && s.actionItem);

  const handleJumpToTimestamp = (timeSeconds: number, segmentId: string) => {
    setHighlightedSegmentId(segmentId);
    const element = document.getElementById(`segment-${segmentId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlightedSegmentId(null), 3000);
    }
    showToast('Jumped to timestamp', 'info');
  };

  const handleDownload = (options: DownloadOptions) => {
    showToast(`Downloading transcript as ${options.format.toUpperCase()}...`, 'info');
    console.log('Download options:', options);
  };

  const handleShare = (options: ShareOptions) => {
    showToast(`Sharing transcript with ${options.teamMembers.length} team members`, 'success');
    console.log('Share options:', options);
  };

  const handleCopyTranscript = () => {
    const text = transcriptData.map(s => `${s.timestamp} ${s.speaker}: ${s.text}`).join('\n\n');
    navigator.clipboard.writeText(text);
    showToast('Transcript copied to clipboard', 'success');
  };

  const handleToggleHighlightMode = () => {
    setHighlightMode(!highlightMode);
    showToast(
      highlightMode ? 'Highlight mode disabled' : 'Highlight mode enabled - select text to highlight',
      'info'
    );
  };

  const handleTimestampClick = (segment: TranscriptSegment) => {
    handleJumpToTimestamp(segment.timeSeconds, segment.id);
  };

  const handleSpeakerClick = (speaker: string, event: React.MouseEvent) => {
    setShowSpeakerTooltip(showSpeakerTooltip === speaker ? null : speaker);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleAIDetectionClick = (segment: TranscriptSegment) => {
    if (!segment.aiDetections || segment.aiDetections.length === 0) return;

    const detectionData = {
      title: segment.momentTitle || 'AI Detection',
      confidence: 98,
      extractedData: [
        { label: 'Amount', value: '$50,000' },
        { label: 'Frequency', value: 'Annually' },
        { label: 'Budget range', value: '$55,000' }
      ],
      crmActions: segment.aiDetections
    };

    setSelectedAIDetection(detectionData);
    setShowAIDetectionModal(true);
  };

  const handleSentimentClick = (segment: TranscriptSegment) => {
    if (!segment.sentiment) return;

    const sentimentData = {
      score: segment.sentiment === 'positive' ? 95 : segment.sentiment === 'neutral' ? 60 : 35,
      label: segment.sentiment === 'positive' ? 'Very Positive' :
             segment.sentiment === 'neutral' ? 'Neutral' : 'Negative',
      emoji: segment.sentiment === 'positive' ? '😊' :
             segment.sentiment === 'neutral' ? '😐' : '☹️',
      indicators: [
        'Positive words: "Excellent", "great", "perfect"',
        'Tone: Enthusiastic',
        'Energy: High'
      ],
      tone: 'Enthusiastic',
      energy: 'High'
    };

    setSelectedSentiment(sentimentData);
    setShowSentimentModal(true);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0 && (highlightMode || true)) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();

      if (rect) {
        setTextSelection({
          text,
          position: { x: rect.left + rect.width / 2, y: rect.top }
        });
      }
    } else {
      setTextSelection(null);
    }
  };

  const handleHighlightText = () => {
    if (textSelection) {
      setHighlightedTexts([...highlightedTexts, textSelection.text]);
      showToast('Text highlighted', 'success');
      setTextSelection(null);
    }
  };

  const handleCopyText = () => {
    if (textSelection) {
      navigator.clipboard.writeText(textSelection.text);
      showToast('Text copied to clipboard', 'success');
      setTextSelection(null);
    }
  };

  const handleSearchText = () => {
    if (textSelection) {
      setSearchQuery(textSelection.text);
      showToast(`Searching for "${textSelection.text}"`, 'info');
      setTextSelection(null);
    }
  };

  const handleAddComment = () => {
    if (textSelection) {
      showToast('Comment feature coming soon', 'info');
      setTextSelection(null);
    }
  };

  const handleCreateBookmark = () => {
    if (textSelection) {
      showToast('Bookmark created', 'success');
      setTextSelection(null);
    }
  };

  const getMomentIcon = (type?: string) => {
    switch (type) {
      case 'budget': return <DollarSign className="w-5 h-5" />;
      case 'timeline': return <Calendar className="w-5 h-5" />;
      case 'integration': return <Plug className="w-5 h-5" />;
      case 'decision': return <Users className="w-5 h-5" />;
      case 'agreement': return <CheckCircle className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const getSentimentEmoji = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'neutral': return '😐';
      case 'negative': return '☹️';
      default: return null;
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-50 border-green-200';
      case 'neutral': return 'bg-yellow-50 border-yellow-200';
      case 'negative': return 'bg-red-50 border-red-200';
      default: return 'bg-white border-gray-200';
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        handleToggleHighlightMode();
      }
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        showToast('Play/Pause (video player integration)', 'info');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mouseup', handleTextSelection);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mouseup', handleTextSelection);
    };
  }, [highlightMode, textSelection]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowSpeakerTooltip(null);
      setTextSelection(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const transcriptUrl = `https://bmi.com/transcripts/${meetingId}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMNavigation />

      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <button
            onClick={() => navigate('/crm/meetings')}
            className="hover:text-blue-600 transition-colors"
          >
            Meetings
          </button>
          <span>›</span>
          <button
            onClick={() => navigate(`/crm/meetings/${meetingId}`)}
            className="hover:text-blue-600 transition-colors"
          >
            Acme Corp - Proposal Review
          </button>
          <span>›</span>
          <span className="text-gray-900 font-medium">Transcript</span>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Meeting Transcript</h1>
              </div>
              <h2 className="text-xl text-gray-700 mb-2">Acme Corp - Proposal Review</h2>
              <p className="text-sm text-gray-600">
                Dec 7, 2024 • 10:00 AM - 10:45 AM • 45 minutes
              </p>
            </div>
            <button
              onClick={() => navigate(`/crm/meetings/${meetingId}`)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Meeting
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="search-input"
                type="text"
                placeholder="Search in transcript..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => setShowDownloadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>

            <button
              onClick={handleToggleHighlightMode}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                highlightMode
                  ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                  : 'bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Highlighter className="w-4 h-4" />
              Highlight
            </button>

            <button
              onClick={handleCopyTranscript}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Show:</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterType === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('action-items')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterType === 'action-items'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Action Items
                </button>
                <button
                  onClick={() => setFilterType('key-moments')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterType === 'key-moments'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Key Moments
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Speaker:</label>
              <select
                value={filterSpeaker}
                onChange={(e) => setFilterSpeaker(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Speakers</option>
                <option value="John Smith">John Smith</option>
                <option value="Alex Rodriguez">Alex Rodriguez</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jump to:</label>
              <select
                onChange={(e) => {
                  const moment = keyMoments.find(m => m.id === e.target.value);
                  if (moment) {
                    const segment = transcriptData.find(s => s.timeSeconds === moment.timeSeconds);
                    if (segment) handleJumpToTimestamp(moment.timeSeconds, segment.id);
                  }
                }}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select moment...</option>
                {keyMoments.map(moment => (
                  <option key={moment.id} value={moment.id}>
                    {moment.icon} {moment.timestamp} - {moment.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 pt-4 border-t border-gray-200">
            <span>{acmeCorpTranscript.metadata.totalWords.toLocaleString()} words</span>
            <span>•</span>
            <span>{acmeCorpTranscript.metadata.duration} minutes</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-purple-600" />
              AI Confidence: {acmeCorpTranscript.metadata.aiConfidence}%
            </span>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex-1" ref={transcriptRef}>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Transcript
              </h3>

              <div className="space-y-4">
                {filteredTranscript.map((segment) => (
                  <div
                    key={segment.id}
                    id={`segment-${segment.id}`}
                    className={`border rounded-lg p-4 transition-all cursor-pointer ${
                      highlightedSegmentId === segment.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : getSentimentColor(segment.sentiment)
                    }`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).tagName !== 'BUTTON') {
                        e.stopPropagation();
                      }
                    }}
                  >
                    {segment.type === 'key-moment' && (
                      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-purple-700 bg-purple-100 px-3 py-1.5 rounded-lg w-fit">
                        {getMomentIcon(segment.momentType)}
                        <span>{segment.momentTitle?.toUpperCase()}</span>
                      </div>
                    )}

                    {segment.type === 'action-item' && (
                      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-lg w-fit">
                        <CheckCircle className="w-4 h-4" />
                        <span>ACTION ITEM</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTimestampClick(segment);
                        }}
                        className="text-sm font-mono text-blue-600 hover:underline"
                      >
                        {segment.timestamp}
                      </button>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {segment.speakerInitials}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSpeakerClick(segment.speaker, e);
                          }}
                          className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {segment.speaker}
                        </button>
                      </div>
                      {segment.sentiment && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSentimentClick(segment);
                          }}
                          className="text-lg hover:scale-110 transition-transform"
                        >
                          {getSentimentEmoji(segment.sentiment)}
                        </button>
                      )}
                    </div>

                    <div className="h-px bg-gray-200 mb-3"></div>

                    <p className="text-gray-700 leading-relaxed select-text">
                      {searchQuery ? (
                        segment.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) =>
                          part.toLowerCase() === searchQuery.toLowerCase() ? (
                            <mark key={i} className="bg-yellow-200">{part}</mark>
                          ) : (
                            <span key={i}>{part}</span>
                          )
                        )
                      ) : (
                        segment.text
                      )}
                    </p>

                    {segment.aiDetections && segment.aiDetections.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAIDetectionClick(segment);
                        }}
                        className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3 w-full text-left hover:bg-purple-100 transition-colors"
                      >
                        <div className="flex items-start gap-2 text-sm">
                          <Sparkles className="w-4 h-4 text-purple-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-purple-900 mb-1">🤖 AI Detected (Click for details):</p>
                            <ul className="space-y-1 text-purple-700">
                              {segment.aiDetections.map((detection, idx) => (
                                <li key={idx}>• {detection}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </button>
                    )}

                    {segment.actionItem && (
                      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-start gap-2 text-sm">
                          <Sparkles className="w-4 h-4 text-green-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-green-900 mb-2">AI Created Task:</p>
                            <div className="space-y-1 text-green-700">
                              <p>• {segment.actionItem.task}</p>
                              <p>• Assigned: {segment.actionItem.assignee}</p>
                              <p>• Due: {segment.actionItem.dueDate}</p>
                              <p>• Status: {segment.actionItem.status}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <p className="text-center font-medium text-gray-900 mb-4">
                    45:00 [END OF TRANSCRIPT]
                  </p>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div className="text-sm text-purple-900">
                        <p className="font-medium mb-2">🤖 AI Processing Complete</p>
                        <ul className="space-y-1">
                          <li>• {acmeCorpTranscript.metadata.totalWords.toLocaleString()} words transcribed</li>
                          <li>• {acmeCorpTranscript.metadata.aiConfidence}% accuracy confidence</li>
                          <li>• {acmeCorpTranscript.actionItems.length} action items created</li>
                          <li>• {acmeCorpTranscript.keyMoments.length} key moments identified</li>
                          <li>• CRM updated with 5 data points</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-[400px] space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-5 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Quick Navigation
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Key Moments ({keyMoments.length}):</p>
                  <div className="space-y-3">
                    {keyMoments.map((moment) => {
                      const segment = transcriptData.find(s => s.timeSeconds === moment.timeSeconds);
                      return (
                        <div key={moment.id} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors">
                          <div className="flex items-start gap-2 mb-2">
                            <span className="text-lg">{moment.icon}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{moment.timestamp} - {moment.title}</p>
                              <p className="text-xs text-gray-600 mt-1">{moment.content}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => segment && handleJumpToTimestamp(moment.timeSeconds, segment.id)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Jump to
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Action Items ({actionItems.length})
              </h3>

              <div className="space-y-3">
                {actionItems.map((segment) => (
                  <div key={segment.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        segment.actionItem?.status === 'completed' ? 'bg-green-100 text-green-600' :
                        segment.actionItem?.status === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {segment.actionItem?.status === 'completed' ? '✓' : '⏳'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {segment.actionItem?.task}
                        </p>
                        <p className="text-xs text-gray-600">
                          {segment.actionItem?.status === 'completed' ? '✅ Completed' :
                           segment.actionItem?.status === 'in-progress' ? '⏳ In Progress' :
                           '⏳ Pending'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Timestamp: {segment.timestamp}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleJumpToTimestamp(segment.timeSeconds, segment.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Jump to
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {searchQuery && searchResults.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-5 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Search Results
                  </h3>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Clear
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  {searchResults.length} results found for "<span className="font-medium">{searchQuery}</span>"
                </p>

                <div className="space-y-3">
                  {searchResults.map((segment, idx) => (
                    <div key={segment.id} className="border border-gray-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {idx + 1}. {segment.timestamp} - {segment.speaker}
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        "{segment.text.substring(0, 80)}..."
                      </p>
                      <button
                        onClick={() => handleJumpToTimestamp(segment.timeSeconds, segment.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Jump to
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {textSelection && (
        <TextSelectionMenu
          position={textSelection.position}
          selectedText={textSelection.text}
          onHighlight={handleHighlightText}
          onCopy={handleCopyText}
          onSearch={handleSearchText}
          onAddComment={handleAddComment}
          onCreateBookmark={handleCreateBookmark}
        />
      )}

      <DownloadTranscriptModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
        meetingTitle="Acme Corp - Proposal Review"
      />

      <ShareTranscriptModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShare={handleShare}
        transcriptUrl={transcriptUrl}
        meetingTitle="Acme Corp - Proposal Review"
      />

      {selectedAIDetection && (
        <AIDetectionModal
          isOpen={showAIDetectionModal}
          onClose={() => {
            setShowAIDetectionModal(false);
            setSelectedAIDetection(null);
          }}
          detection={selectedAIDetection}
          onViewInCRM={() => {
            showToast('Opening CRM...', 'info');
            navigate(`/crm/deals/${meetingId}`);
          }}
          onUndoAction={() => {
            showToast('CRM action undone', 'success');
            setShowAIDetectionModal(false);
          }}
        />
      )}

      {selectedSentiment && (
        <SentimentModal
          isOpen={showSentimentModal}
          onClose={() => {
            setShowSentimentModal(false);
            setSelectedSentiment(null);
          }}
          sentiment={selectedSentiment}
        />
      )}

      <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4 text-xs text-gray-600">
        <p className="font-semibold mb-2">Keyboard Shortcuts:</p>
        <div className="space-y-1">
          <p>⌘/Ctrl + F: Search</p>
          <p>⌘/Ctrl + H: Toggle highlights</p>
          <p>Space: Play/Pause video</p>
        </div>
      </div>
    </div>
  );
}
