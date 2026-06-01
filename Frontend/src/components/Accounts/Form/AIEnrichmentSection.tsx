import React, { useState } from 'react';
import { Search, CheckCircle, X, Linkedin, Globe, Database } from 'lucide-react';

interface AIEnrichmentSectionProps {
  onDataFound: (data: any) => void;
  onApplyData: (data: any) => void;
}

const AIEnrichmentSection: React.FC<AIEnrichmentSectionProps> = ({
  onDataFound,
  onApplyData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundData, setFoundData] = useState<any>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setTimeout(() => {
      const mockData = {
        companyName: 'TechStart Inc',
        industry: 'FinTech',
        city: 'New York',
        state: 'NY',
        employeeCount: 45,
        annualRevenue: 8000000,
        website: 'https://www.techstart.com',
        linkedin: '/company/techstart-inc',
        dataSources: ['LinkedIn', 'Crunchbase', 'Clearbit'],
      };
      setFoundData(mockData);
      onDataFound(mockData);
      setIsSearching(false);
    }, 1500);
  };

  const handleApplyAll = () => {
    if (foundData) {
      onApplyData(foundData);
      setFoundData(null);
      setSearchQuery('');
    }
  };

  const handleClear = () => {
    setFoundData(null);
    setSearchQuery('');
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm p-6">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-2xl">🤖</span>
        <h2 className="text-lg font-semibold text-gray-900">AI Enrichment</h2>
      </div>

      {!foundData ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Start typing company name or website...
          </p>

          <div className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search Company..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              <span>{isSearching ? 'Searching...' : 'Find & Enrich'}</span>
            </button>
          </div>

          <div className="pt-4 border-t border-blue-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Quick Actions:</p>
            <div className="grid grid-cols-2 gap-2">
              <button className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                <Linkedin className="h-4 w-4" />
                <span>Import from LinkedIn</span>
              </button>
              <button className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>Scrape Website</span>
              </button>
              <button className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Fetch from Crunchbase</span>
              </button>
              <button className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Search Google</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-green-200 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-gray-900">Found: {foundData.companyName}</span>
            </div>
            <button onClick={handleClear} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Industry:</span> {foundData.industry}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Location:</span> {foundData.city}, {foundData.state}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Employees:</span> {foundData.employeeCount}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Revenue:</span> ${(foundData.annualRevenue / 1000000).toFixed(1)}M/year
            </p>
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Data sources:</p>
            <div className="flex flex-wrap gap-2">
              {foundData.dataSources.map((source: string) => (
                <span key={source} className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  <CheckCircle className="h-3 w-3" />
                  <span>{source}</span>
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={handleApplyAll}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Apply All Data
          </button>
        </div>
      )}
    </div>
  );
};

export default AIEnrichmentSection;
