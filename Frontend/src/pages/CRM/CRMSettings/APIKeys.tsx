import React, { useState } from 'react';
import { Plus, Copy, Eye, EyeOff, Trash2 } from 'lucide-react';

type APIKey = {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
};

const APIKeys: React.FC = () => {
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [keys] = useState<APIKey[]>([
    { id: '1', name: 'Production API', key: 'sk_live_abc123...', created: '2024-01-15', lastUsed: '2 hours ago' },
    { id: '2', name: 'Development API', key: 'sk_test_xyz789...', created: '2024-02-01', lastUsed: '1 day ago' }
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your API keys for integrations</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Key
        </button>
      </div>

      <div className="space-y-3">
        {keys.map((apiKey) => (
          <div key={apiKey.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-medium text-gray-900">{apiKey.name}</div>
                <div className="text-xs text-gray-500">Created: {apiKey.created}</div>
              </div>
              <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <code className="flex-1 px-3 py-2 bg-gray-50 text-sm font-mono rounded border border-gray-200">
                {showKeys[apiKey.id] ? apiKey.key : '••••••••••••••••'}
              </code>
              <button
                onClick={() => setShowKeys({ ...showKeys, [apiKey.id]: !showKeys[apiKey.id] })}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                {showKeys[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="text-xs text-gray-500">Last used: {apiKey.lastUsed}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-yellow-900 mb-2">Security Warning:</h4>
        <p className="text-sm text-yellow-800">
          Keep your API keys secure. Never share them publicly or commit them to version control.
        </p>
      </div>
    </div>
  );
};

export default APIKeys;
