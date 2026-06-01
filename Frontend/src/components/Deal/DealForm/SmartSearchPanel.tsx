import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Building2, User, Briefcase, Loader2 } from 'lucide-react';
import { searchCompanies, searchContacts } from '../../../utils/dealsApi';

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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [companies, contacts] = await Promise.all([
          searchCompanies(query),
          searchContacts(query),
        ]);
        const companyResults = companies.map((c: any) => ({ ...c, _type: 'company' }));
        const contactResults = contacts.map((c: any) => ({ ...c, _type: 'contact' }));
        setResults([...companyResults, ...contactResults]);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  const handleSelect = (item: any) => {
    if (item._type === 'company') {
      onAccountSelect({
        id: item.id,
        type: 'account',
        name: item.name,
        industry: item.industry,
        employees: item.size,
        revenue: item.revenue ? `$${(item.revenue / 1_000_000).toFixed(1)}M revenue` : null,
        avgDealSize: 50000,
        winRate: 65,
        isHRMS: false,
      });
    } else {
      onContactSelect({
        id: item.id,
        type: 'contact',
        name: `${item.first_name} ${item.last_name}`,
        title: item.position,
        company: item.company_name,
        email: item.email,
        phone: item.phone,
        isHRMS: false,
      });
    }
    setQuery('');
    setResults([]);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Search className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Smart Deal Creation</h2>
            <p className="text-sm text-gray-500">Link to an existing company or contact to auto-fill the form</p>
          </div>
        </div>
        <button
          onClick={onSkip}
          className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
        >
          Skip — create from scratch
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search company name, contact name, or email…"
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          autoFocus
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center space-x-2 mt-4 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Searching…</span>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
          {results.map((item) => (
            <button
              key={`${item._type}-${item.id}`}
              onClick={() => handleSelect(item)}
              className="w-full p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-left transition-colors"
            >
              {item._type === 'company' ? (
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 text-sm">{item.name}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Company</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {[item.industry, item.size].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 bg-green-100 rounded-lg flex-shrink-0">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 text-sm">
                        {item.first_name} {item.last_name}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Contact</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {[item.position, item.company_name].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <div className="mt-4 text-center py-6 text-sm text-gray-500">
          <p>No matches found for "<span className="font-medium text-gray-700">{query}</span>"</p>
          <button
            onClick={onSkip}
            className="mt-2 text-purple-600 hover:text-purple-700 font-medium"
          >
            Create deal from scratch instead
          </button>
        </div>
      )}
    </div>
  );
};
