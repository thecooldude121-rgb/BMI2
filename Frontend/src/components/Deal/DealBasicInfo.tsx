import React, { useState, useEffect } from 'react';
import { Building, User, DollarSign, Calendar, Target, Search, Plus, Globe, Briefcase } from 'lucide-react';
import { DealFormData, ValidationErrors } from '../../types/deal';

interface DealBasicInfoProps {
  formData: DealFormData;
  setFormData: React.Dispatch<React.SetStateAction<DealFormData>>;
  errors: ValidationErrors;
}

const DealBasicInfo: React.FC<DealBasicInfoProps> = ({ formData, setFormData, errors }) => {
  const [accountSearch, setAccountSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [showAccountCreate, setShowAccountCreate] = useState(false);
  const [showContactCreate, setShowContactCreate] = useState(false);

  // Mock data - in real app, these would come from API
  const mockAccounts = [
    { id: '1', name: 'TechCorp Solutions', industry: 'Technology' },
    { id: '2', name: 'Global Manufacturing Inc', industry: 'Manufacturing' },
    { id: '3', name: 'StartupX', industry: 'Technology' }
  ];

  const mockContacts = [
    { id: '1', name: 'John Smith', email: 'john@techcorp.com', accountId: '1' },
    { id: '2', name: 'Sarah Johnson', email: 'sarah@globalmfg.com', accountId: '2' },
    { id: '3', name: 'Mike Davis', email: 'mike@startupx.io', accountId: '3' }
  ];

  const pipelines = [
    { id: 'sales', name: 'Sales Pipeline', stages: ['qualification', 'proposal', 'negotiation', 'closed-won'] },
    { id: 'enterprise', name: 'Enterprise Pipeline', stages: ['discovery', 'proof-of-concept', 'proposal', 'negotiation', 'closed-won'] }
  ];

  const selectedPipeline = pipelines.find(p => p.id === formData.pipelineId) || pipelines[0];

  const filteredAccounts = mockAccounts.filter(account =>
    account.name.toLowerCase().includes(accountSearch.toLowerCase())
  );

  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    contact.email.toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-green-100 rounded-lg">
          <Briefcase className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
          <p className="text-gray-600">Core details about your deal opportunity</p>
        </div>
      </div>

      {/* Deal Name - Prominent */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Deal Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className={`w-full px-4 py-4 text-xl border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
            errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
          }`}
          placeholder="Enter a descriptive deal name..."
        />
        {errors.name && <p className="text-sm text-red-600 mt-2">{errors.name}</p>}
        <p className="text-sm text-gray-600 mt-2">💡 Tip: Use a descriptive name like "TechCorp - Enterprise License Q1 2024"</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Pipeline Selection */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Pipeline & Stage *
            </label>
            <div className="space-y-4">
              <select
                value={formData.pipelineId}
                onChange={(e) => {
                  const pipeline = pipelines.find(p => p.id === e.target.value);
                  setFormData(prev => ({ 
                    ...prev, 
                    pipelineId: e.target.value,
                    stageId: pipeline?.stages[0] || 'qualification'
                  }));
                }}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {pipelines.map(pipeline => (
                  <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>
                ))}
              </select>
              
              <select
                value={formData.stageId}
                onChange={(e) => setFormData(prev => ({ ...prev, stageId: e.target.value }))}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {selectedPipeline.stages.map(stage => (
                  <option key={stage} value={stage}>
                    {stage.charAt(0).toUpperCase() + stage.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Account Selection */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Account (Company) *
            </label>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search existing accounts..."
                />
              </div>
              
              {accountSearch && (
                <div className="border border-gray-200 rounded-xl max-h-40 overflow-y-auto">
                  {filteredAccounts.map(account => (
                    <button
                      key={account.id}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, accountId: account.id }));
                        setAccountSearch(account.name);
                      }}
                      className="w-full text-left p-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <Building className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{account.name}</p>
                          <p className="text-sm text-gray-600">{account.industry}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => setShowAccountCreate(true)}
                    className="w-full text-left p-3 hover:bg-green-50 transition-colors border-t border-gray-200 text-green-600"
                  >
                    <div className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Create new account: "{accountSearch}"</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Contact Selection */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Primary Contact
            </label>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search existing contacts..."
                />
              </div>
              
              {contactSearch && (
                <div className="border border-gray-200 rounded-xl max-h-40 overflow-y-auto">
                  {filteredContacts.map(contact => (
                    <button
                      key={contact.id}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, contactId: contact.id }));
                        setContactSearch(contact.name);
                      }}
                      className="w-full text-left p-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{contact.name}</p>
                          <p className="text-sm text-gray-600">{contact.email}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => setShowContactCreate(true)}
                    className="w-full text-left p-3 hover:bg-green-50 transition-colors border-t border-gray-200 text-green-600"
                  >
                    <div className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Create new contact: "{contactSearch}"</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Financial Overview */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Deal Value
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="0"
                  min="0"
                />
                {errors.amount && <p className="text-sm text-red-600 mt-1">{errors.amount}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                </select>
              </div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg border border-green-200">
              <p className="text-3xl font-bold text-green-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: formData.currency
                }).format(formData.amount)}
              </p>
              <p className="text-sm text-gray-600">Total Deal Value</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Timeline & Probability
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Close Date
                </label>
                <input
                  type="date"
                  value={formData.closingDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, closingDate: e.target.value }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Win Probability: {formData.probability}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.probability}
                  onChange={(e) => setFormData(prev => ({ ...prev, probability: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Deal Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Describe the opportunity, customer needs, and solution..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealBasicInfo;