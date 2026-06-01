import React, { useState } from 'react';
import {
  FileText, Image as ImageIcon, FileSpreadsheet, Video, File, Presentation,
  Eye, Download, ChevronUp, ChevronDown, ChevronRight, Briefcase, Building2,
  Loader2, Check, Pin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RecentDocument {
  document_id: string;
  document_name: string;
  file_type: string;
  file_size: number;
  category: string;
  last_viewed_date: string;
  last_viewed_by: string;
  view_count: number;
  deal_id?: string | null;
  deal_name?: string;
  account_id?: string | null;
  account_name?: string;
  activity_id?: string;
  thumbnail_url?: string;
  file_url: string;
}

interface RecentDocumentsSectionProps {
  recentDocuments: RecentDocument[];
  onViewAll: () => void;
  onPreview: (doc: RecentDocument) => void;
  onDownload: (doc: RecentDocument) => void;
  isRecentFilterActive?: boolean;
  onClearRecentFilter?: () => void;
  isLoading?: boolean;
}

const getFileIcon = (fileType: string) => {
  const type = fileType.toLowerCase();
  if (type === 'pdf') {
    return <FileText className="w-8 h-8 text-[#dc2626]" />;
  }
  if (type === 'docx' || type === 'doc') {
    return <FileText className="w-8 h-8 text-[#2563eb]" />;
  }
  if (type === 'pptx' || type === 'ppt') {
    return <Presentation className="w-8 h-8 text-[#ea580c]" />;
  }
  if (type === 'xlsx' || type === 'xls' || type === 'csv') {
    return <FileSpreadsheet className="w-8 h-8 text-[#16a34a]" />;
  }
  if (type === 'jpg' || type === 'jpeg' || type === 'png' || type === 'gif') {
    return <ImageIcon className="w-8 h-8 text-gray-500" />;
  }
  if (type === 'mp4' || type === 'mov' || type === 'avi') {
    return <Video className="w-8 h-8 text-gray-500" />;
  }
  return <File className="w-8 h-8 text-gray-500" />;
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Proposal': 'bg-blue-100 text-blue-700',
    'Contract': 'bg-emerald-100 text-emerald-700',
    'Presentation': 'bg-purple-100 text-purple-700',
    'Case Study': 'bg-orange-100 text-orange-700',
    'Pricing': 'bg-yellow-100 text-yellow-700',
    'Meeting Materials': 'bg-indigo-100 text-indigo-700',
    'HRMS Documents': 'bg-pink-100 text-pink-700',
    'Email Attachments': 'bg-cyan-100 text-cyan-700'
  };
  return colors[category] || 'bg-gray-100 text-gray-700';
};

const getRelativeTime = (dateString: string): string => {
  if (!dateString) return 'Unknown';

  if (dateString.includes('ago') || dateString.includes('Yesterday') || dateString.includes('Just now')) {
    return dateString;
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const RecentDocumentsSection: React.FC<RecentDocumentsSectionProps> = ({
  recentDocuments,
  onViewAll,
  onPreview,
  onDownload,
  isRecentFilterActive = false,
  onClearRecentFilter,
  isLoading = false
}) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [downloadingDocs, setDownloadingDocs] = useState<Set<string>>(new Set());
  const [downloadedDocs, setDownloadedDocs] = useState<Set<string>>(new Set());
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const handleDownload = (doc: RecentDocument, e: React.MouseEvent) => {
    e.stopPropagation();

    setDownloadingDocs(prev => new Set(prev).add(doc.document_id));

    onDownload(doc);

    setTimeout(() => {
      setDownloadingDocs(prev => {
        const newSet = new Set(prev);
        newSet.delete(doc.document_id);
        return newSet;
      });
      setDownloadedDocs(prev => new Set(prev).add(doc.document_id));

      setTimeout(() => {
        setDownloadedDocs(prev => {
          const newSet = new Set(prev);
          newSet.delete(doc.document_id);
          return newSet;
        });
      }, 2000);
    }, 800);
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const cardWidth = scrollContainerRef.current.offsetWidth;
      const newSlide = Math.round(scrollLeft / cardWidth);
      setCurrentSlide(newSlide);
    }
  };

  if (isCollapsed) {
    return (
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pin className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Recent Documents</span>
            <span className="text-xs text-gray-500">({recentDocuments.length})</span>
          </div>
          <button
            onClick={() => setIsCollapsed(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-300"
            title="Expand section"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Pin className="w-5 h-5 text-gray-500" />
              <h2 className="text-base font-semibold text-[#1f2937]">RECENT DOCUMENTS</h2>
              <span className="text-xs text-gray-500">(Loading...)</span>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4">
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-56 animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="h-32 bg-gray-200"></div>
                    <div className="p-3 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (recentDocuments.length === 0) {
    return (
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Pin className="w-5 h-5 text-gray-500" />
              <h2 className="text-base font-semibold text-[#1f2937]">RECENT DOCUMENTS</h2>
              <span className="text-xs text-gray-500">(0)</span>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-300"
              title="Collapse section"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>
          <div className="border-t border-gray-200 pt-10 pb-8">
            <div className="text-center max-w-md mx-auto">
              <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-base font-semibold text-gray-900 mb-2">No recent documents yet</p>
              <p className="text-sm text-gray-600 mb-6">
                Documents you view will appear here for quick access.
                Start by browsing the document library below.
              </p>
              <button
                onClick={onViewAll}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Documents
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Pin className="w-5 h-5 text-gray-500" />
            <h2 className="text-base font-semibold text-[#1f2937]">RECENT DOCUMENTS</h2>
            <span className="text-xs text-gray-500">(Last {recentDocuments.length} you viewed)</span>
          </div>
          <div className="flex items-center gap-4">
            {isRecentFilterActive ? (
              <button
                onClick={onClearRecentFilter}
                className="flex items-center gap-1 text-[13px] font-medium text-[#3b82f6] hover:text-blue-700 transition-colors"
              >
                Showing All
                <ChevronUp className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onViewAll}
                className="flex items-center gap-1 text-[13px] font-medium text-[#3b82f6] hover:text-blue-700 transition-colors"
              >
                View All (15)
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-300"
              title="Collapse section"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 snap-x snap-mandatory md:snap-none"
          >
            {recentDocuments.map((doc, index) => (
              <div
                key={doc.document_id}
                className="flex-shrink-0 w-[calc(100%-2rem)] sm:w-[240px] md:w-[220px] lg:w-[200px] xl:w-[180px] snap-center"
                onMouseEnter={() => setHoveredCard(doc.document_id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  className={`
                    bg-white border border-[#e5e7eb] rounded-lg p-3 h-[180px]
                    cursor-pointer transition-all ease-in-out
                    ${hoveredCard === doc.document_id ? 'shadow-[0_4px_12px_rgba(0,0,0,0.1)] -translate-y-0.5 border-blue-300' : 'hover:border-gray-300 duration-200'}
                  `}
                  onClick={() => navigate(`/crm/documents/${doc.document_id}`)}
                  title={doc.document_name}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex justify-center mb-2">
                      {getFileIcon(doc.file_type)}
                    </div>

                    <div className="flex-1 min-h-0">
                      <p className="text-[14px] font-semibold text-gray-900 line-clamp-2 mb-1 leading-tight">
                        {doc.document_name}
                      </p>

                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${getCategoryColor(doc.category)}`}>
                          {doc.category}
                        </span>
                      </div>

                      {(doc.deal_name || doc.account_name) && (
                        <div className="mb-1">
                          <p className="text-xs text-gray-500 mb-0.5">Related:</p>
                          <div className="flex flex-col gap-1">
                            {doc.deal_name && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/crm/deals/${doc.deal_id}`);
                                }}
                                className="flex items-center gap-1 text-[12px] font-medium text-[#3b82f6] hover:text-blue-700 hover:underline text-left"
                                title={`Go to ${doc.deal_name}`}
                              >
                                <Briefcase className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate min-w-0">{doc.deal_name}</span>
                                <ChevronRight className="w-3 h-3 flex-shrink-0 ml-auto" />
                              </button>
                            )}
                            {doc.account_name && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/crm/accounts/${doc.account_id}`);
                                }}
                                className="flex items-center gap-1 text-[12px] font-medium text-[#3b82f6] hover:text-blue-700 hover:underline text-left"
                                title={`Go to ${doc.account_name}`}
                              >
                                <Building2 className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate min-w-0">{doc.account_name}</span>
                                <ChevronRight className="w-3 h-3 flex-shrink-0 ml-auto" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>{doc.view_count} views</span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[12px] text-[#6b7280]">
                          {getRelativeTime(doc.last_viewed_date)}
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPreview(doc);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f3f4f6] transition-colors group"
                          title="Quick preview"
                        >
                          <Eye className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                        </button>
                        <button
                          onClick={(e) => handleDownload(doc, e)}
                          className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors group ${
                            downloadedDocs.has(doc.document_id)
                              ? 'bg-green-50'
                              : 'hover:bg-[#f3f4f6]'
                          }`}
                          title={
                            downloadingDocs.has(doc.document_id)
                              ? 'Downloading...'
                              : downloadedDocs.has(doc.document_id)
                              ? 'Downloaded'
                              : 'Download'
                          }
                          disabled={downloadingDocs.has(doc.document_id)}
                        >
                          {downloadingDocs.has(doc.document_id) ? (
                            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                          ) : downloadedDocs.has(doc.document_id) ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Download className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Pagination Dots */}
          {recentDocuments.length > 1 && (
            <div className="flex justify-center gap-2 mt-3 md:hidden">
              {recentDocuments.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (scrollContainerRef.current) {
                      const cardWidth = scrollContainerRef.current.offsetWidth;
                      scrollContainerRef.current.scrollTo({
                        left: cardWidth * index,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    currentSlide === index
                      ? 'bg-blue-600 w-6'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to document ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentDocumentsSection;
