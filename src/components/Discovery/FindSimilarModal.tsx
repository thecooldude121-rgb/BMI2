import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Eye, TrendingUp, Building, MapPin, Briefcase, CheckCircle } from 'lucide-react';

interface Prospect {
  id: string;
  fullName: string;
  title: string;
  company: string;
  industry: string;
  companySize: string;
  location: string;
  email: string;
  leadScore: number;
  tags: string[];
}

interface SimilarProspect extends Prospect {
  similarityScore: number;
  matchReasons: string[];
}

interface FindSimilarModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceProspect: Prospect | null;
  allProspects: Prospect[];
  onAddToList: (prospects: Prospect[]) => void;
}

const FindSimilarModal: React.FC<FindSimilarModalProps> = ({
  isOpen,
  onClose,
  sourceProspect,
  allProspects,
  onAddToList
}) => {
  const [similarProspects, setSimilarProspects] = useState<SimilarProspect[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [weights, setWeights] = useState({
    industry: 30,
    title: 25,
    companySize: 20,
    location: 15,
    techStack: 10
  });

  useEffect(() => {
    if (isOpen && sourceProspect) {
      findSimilarProspects();
    }
  }, [isOpen, sourceProspect, weights]);

  const calculateSimilarity = (prospect: Prospect): { score: number; reasons: string[] } => {
    if (!sourceProspect) return { score: 0, reasons: [] };

    let score = 0;
    const reasons: string[] = [];

    // Industry match (30 points)
    if (prospect.industry === sourceProspect.industry) {
      score += weights.industry;
      reasons.push('Same Industry');
    }

    // Title similarity (25 points)
    const sourceTitleWords = sourceProspect.title.toLowerCase().split(' ');
    const prospectTitleWords = prospect.title.toLowerCase().split(' ');
    const titleOverlap = sourceTitleWords.filter(word =>
      prospectTitleWords.includes(word)
    ).length;

    if (titleOverlap > 0) {
      const titleScore = (titleOverlap / sourceTitleWords.length) * weights.title;
      score += titleScore;
      if (titleScore > 15) {
        reasons.push('Similar Role');
      }
    }

    // Company size (20 points)
    if (prospect.companySize === sourceProspect.companySize) {
      score += weights.companySize;
      reasons.push('Same Company Size');
    }

    // Location proximity (15 points)
    const sourceLocation = sourceProspect.location.split(',')[0].trim();
    const prospectLocation = prospect.location.split(',')[0].trim();
    if (sourceLocation === prospectLocation) {
      score += weights.location;
      reasons.push('Same Location');
    } else if (sourceProspect.location.includes(prospect.location.split(',')[1]?.trim() || '')) {
      score += weights.location * 0.5;
      reasons.push('Similar Region');
    }

    // Tag overlap (10 points)
    const tagOverlap = prospect.tags.filter(tag =>
      sourceProspect.tags.includes(tag)
    ).length;

    if (tagOverlap > 0) {
      score += (tagOverlap / Math.max(sourceProspect.tags.length, 1)) * weights.techStack;
      reasons.push('Matching Tags');
    }

    return { score: Math.round(score), reasons };
  };

  const findSimilarProspects = () => {
    if (!sourceProspect) return;

    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const similar = allProspects
        .filter(p => p.id !== sourceProspect.id)
        .map(prospect => {
          const { score, reasons } = calculateSimilarity(prospect);
          return {
            ...prospect,
            similarityScore: score,
            matchReasons: reasons
          };
        })
        .filter(p => p.similarityScore > 30)
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 10);

      setSimilarProspects(similar);
      setIsLoading(false);
    }, 1000);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleAddAll = () => {
    onAddToList(similarProspects);
    onClose();
  };

  const handleAddSelected = () => {
    const selected = similarProspects.filter(p => selectedIds.has(p.id));
    onAddToList(selected);
    onClose();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-300';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-orange-100 text-orange-700 border-orange-300';
  };

  if (!isOpen || !sourceProspect) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Prospects Similar to {sourceProspect.fullName}
              </h2>
              <p className="text-gray-600 mt-1">
                Found {similarProspects.length} matching prospects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-gray-600">Finding similar prospects...</p>
            </div>
          ) : similarProspects.length === 0 ? (
            <div className="text-center py-20">
              <Sparkles className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No similar prospects found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting the similarity criteria to find more matches
              </p>
              <button
                onClick={() => setShowCriteriaModal(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Adjust Criteria
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {similarProspects.map((prospect) => (
                <div
                  key={prospect.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(prospect.id)}
                        onChange={() => toggleSelection(prospect.id)}
                        className="mt-1 w-4 h-4 text-purple-600 rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{prospect.fullName}</h3>
                        <p className="text-sm text-gray-600">{prospect.title}</p>
                        <p className="text-sm text-gray-500">{prospect.company}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getScoreColor(prospect.similarityScore)}`}>
                      {prospect.similarityScore}%
                    </span>
                  </div>

                  {/* Match Reasons */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {prospect.matchReasons.map((reason, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium flex items-center"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {reason}
                      </span>
                    ))}
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <Building className="h-3 w-3" />
                      <span>{prospect.industry}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{prospect.location.split(',')[0]}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Briefcase className="h-3 w-3" />
                      <span>{prospect.companySize}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>Score: {prospect.leadScore}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button className="flex-1 flex items-center justify-center px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </button>
                    <button className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      <Plus className="h-3 w-3 mr-1" />
                      Add to List
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && similarProspects.length > 0 && (
          <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCriteriaModal(true)}
                className="px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Refine Criteria
              </button>
              {selectedIds.size > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedIds.size} selected
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {selectedIds.size > 0 ? (
                <button
                  onClick={handleAddSelected}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Add {selectedIds.size} to List
                </button>
              ) : (
                <button
                  onClick={handleAddAll}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Add All to List
                </button>
              )}
            </div>
          </div>
        )}

        {/* Criteria Adjustment Modal */}
        {showCriteriaModal && (
          <div className="absolute inset-0 bg-white rounded-xl p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Adjust Similarity Criteria</h3>
              <button
                onClick={() => setShowCriteriaModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {Object.entries(weights).map(([key, value]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-900 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <span className="text-sm font-bold text-purple-600">{value}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={value}
                    onChange={(e) => setWeights({ ...weights, [key]: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => {
                  setShowCriteriaModal(false);
                  findSimilarProspects();
                }}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Apply & Find Similar
              </button>
              <button
                onClick={() => {
                  setWeights({
                    industry: 30,
                    title: 25,
                    companySize: 20,
                    location: 15,
                    techStack: 10
                  });
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindSimilarModal;
