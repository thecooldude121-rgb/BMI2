import React, { useState } from 'react';
import { Search, X, Building2, User, Briefcase } from 'lucide-react';

interface SmartSearchPanelProps {
  onAccountSelect: (account: any) => void;
  onContactSelect: (contact: any) => void;
  onSkip: () => void;
}

export const SmartSearchPanel: React.FC<SmartSearchPanelProps> = ({
  onAccountSelect,
  onContactSelect,
  onSkip
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const mockAccounts = [
    {
      id: 'acc-1',
      type: 'account',
      name: 'Acme Corp',
      employees: '75 employees',
      industry: 'SaaS',
      revenue: '$12M revenue',
      primaryContact: 'John Smith (VP Sales)',
      avgDealSize: 50000,
      winRate: 68,
      isHRMS: false
    },
    {
      id: 'acc-3',
      type: 'account',
      name: 'TechStart Inc',
      employees: '60 employees',
      industry: 'Technology',
      revenue: '$8M revenue',
      primaryContact: 'Sarah Lee (CFO)',
      avgDealSize: 42000,
      winRate: 68,
      isHRMS: true,
      recruitedPerson: 'Sarah Lee'
    },
    {
      id: 'acc-2',
      type: 'account',
      name: 'BigCo Enterprise',
      employees: '200 employees',
      industry: 'Manufacturing',
      contacts: 'Mike Chen +3 more',
      avgDealSize: 75000,
      winRate: 72,
      isHRMS: false
    }
  ];

  const mockContacts = [
    {
      id: 'con-1',
      type: 'contact',
      name: 'Sarah Lee',
      title: 'CFO',
      company: 'TechStart Inc',
      source: 'HRMS Connection',
      isHRMS: true
    },
    {
      id: 'con-2',
      type: 'contact',
      name: 'John Smith',
      title: 'VP Sales',
      company: 'Acme Corp',
      email: 'john@acme.com'
    }
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const queryLower = query.toLowerCase();
      const results = [
        ...mockAccounts.filter(a => a.name.toLowerCase().includes(queryLower)),
        ...mockContacts.filter(c =>
          c.name.toLowerCase().includes(queryLower) ||
          c.company.toLowerCase().includes(queryLower)
        )
      ];
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelect = (item: any) => {
    if (item.type === 'account') {
      onAccountSelect(item);
    } else {
      onContactSelect(item);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-2xl">🤖</span>
        <h2 className="text-xl font-bold text-gray-900">SMART DEAL CREATION</h2>
        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">UNIQUE - AI-Powered Quick Setup</span>
      </div>

      <p className="text-sm text-gray-700 mb-4">Start with an existing account or contact?</p>

      <div className="border-2 border-gray-300 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Search className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Search Account or Contact</span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by company, name, email..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="mt-3 border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                className="w-full p-4 hover:bg-gray-50 border-b border-gray-200 last:border-b-0 text-left transition-colors"
              >
                {result.type === 'account' ? (
                  <div className="flex items-start space-x-3">
                    <Building2 className={`h-5 w-5 ${result.isHRMS ? 'text-orange-600' : 'text-blue-600'} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{result.name} (Account)</span>
                        {result.isHRMS && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded">🏢 HRMS</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {result.employees} | {result.industry} | {result.revenue}
                      </div>
                      <div className="text-sm text-gray-600">
                        Contact: {result.primaryContact || result.contacts}
                      </div>
                      {result.isHRMS && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Briefcase className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-600">🏢 HRMS Connection</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{result.name} (Contact)</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {result.title} at {result.company}
                      </div>
                      {result.isHRMS && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Briefcase className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-600">HRMS Connection</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-3 mt-4">
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              ✕ Clear
            </button>
          )}
          <button
            onClick={onSkip}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
          >
            Skip - Create from Scratch
          </button>
        </div>
      </div>
    </div>
  );
};
