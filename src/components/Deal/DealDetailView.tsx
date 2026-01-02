import React, { useState } from 'react';
import { 
  X, Edit, Trash2, Mail, Phone, Video, Calendar, FileText, 
  DollarSign, User, Building, MapPin, Clock, Tag, Paperclip,
  CheckCircle, AlertCircle, Plus, MoreHorizontal, Star, TrendingUp,
  Globe, Briefcase, Target, Activity, Send, Save, ChevronRight
} from 'lucide-react';
import { Deal } from '../../types/dealManagement';

interface DealDetailViewProps {
  deal: Deal;
  onClose: () => void;
}

const DealDetailView: React.FC<DealDetailViewProps> = ({ deal, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'emails' | 'history' | 'custom'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [customFields, setCustomFields] = useState(deal.customFields || {});
  const [newCustomField, setNewCustomField] = useState({ name: '', value: '', type: 'text' });

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Briefcase, count: null },
    { id: 'activities', name: 'Activities', icon: Activity, count: deal.activities.length + deal.tasks.length + deal.meetings.length },
    { id: 'emails', name: 'Emails', icon: Mail, count: deal.emails.length },
    { id: 'history', name: 'Stage History', icon: Clock, count: deal.stageHistory.length },
    { id: 'custom', name: 'Custom Fields', icon: Target, count: Object.keys(deal.customFields || {}).length }
  ];

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStageColor = (stageId: string) => {
    const stageColors = {
      'lead': 'bg-gray-100 text-gray-800 border-gray-300',
      'qualified': 'bg-blue-100 text-blue-800 border-blue-300',
      'proposal': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'negotiation': 'bg-orange-100 text-orange-800 border-orange-300',
      'closed-won': 'bg-green-100 text-green-800 border-green-300',
      'closed-lost': 'bg-red-100 text-red-800 border-red-300'
    };
    return stageColors[stageId as keyof typeof stageColors] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      'call': Phone,
      'email': Mail,
      'meeting': Video,
      'task': CheckCircle,
      'note': FileText
    };
    return icons[type as keyof typeof icons] || FileText;
  };

  const getActivityColor = (type: string) => {
    const colors = {
      'call': 'text-blue-600 bg-blue-100 border-blue-200',
      'email': 'text-green-600 bg-green-100 border-green-200',
      'meeting': 'text-purple-600 bg-purple-100 border-purple-200',
      'task': 'text-orange-600 bg-orange-100 border-orange-200',
      'note': 'text-gray-600 bg-gray-100 border-gray-200'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-100 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'open':
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getPriorityBadge = () => {
    const highValue = deal.amount > 100000;
    const urgentClose = deal.closingDate && new Date(deal.closingDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    if (highValue && urgentClose) {
      return (
        <div className="flex items-center space-x-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium border border-amber-200">
          <Star className="h-4 w-4" />
          <span>High Value & Urgent</span>
        </div>
      );
    }
    if (highValue) {
      return (
        <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200">
          <TrendingUp className="h-4 w-4" />
          <span>High Value</span>
        </div>
      );
    }
    if (urgentClose) {
      return (
        <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium border border-orange-200">
          <Clock className="h-4 w-4" />
          <span>Urgent Close</span>
        </div>
      );
    }
    return null;
  };

  const addCustomField = () => {
    if (newCustomField.name && newCustomField.value) {
      setCustomFields(prev => ({
        ...prev,
        [newCustomField.name]: newCustomField.value
      }));
      setNewCustomField({ name: '', value: '', type: 'text' });
    }
  };

  const removeCustomField = (fieldName: string) => {
    setCustomFields(prev => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  };

  const renderCustomFieldEditor = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Custom Fields</h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? 'Save Changes' : 'Edit Fields'}
          </button>
        </div>

        {/* Existing Custom Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(customFields).map(([key, value]) => (
            <div key={key} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">{key}</label>
                {isEditing && (
                  <button
                    onClick={() => removeCustomField(key)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={String(value)}
                  onChange={(e) => setCustomFields(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-900 font-medium">{String(value)}</p>
              )}
            </div>
          ))}
        </div>

        {/* Add New Custom Field */}
        {isEditing && (
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Field</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Field name"
                value={newCustomField.name}
                onChange={(e) => setNewCustomField(prev => ({ ...prev, name: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Field value"
                value={newCustomField.value}
                onChange={(e) => setNewCustomField(prev => ({ ...prev, value: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addCustomField}
                disabled={!newCustomField.name || !newCustomField.value}
                className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Field
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 backdrop-blur-sm">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-7xl shadow-2xl rounded-2xl bg-white">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-3xl font-bold text-gray-900">{deal.name}</h2>
                {getPriorityBadge()}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">#{deal.dealNumber}</span>
                <div className="flex items-center space-x-1">
                  <Globe className="h-4 w-4" />
                  <span>{deal.country}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Tag className="h-4 w-4" />
                  <span>{deal.dealType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium border ${getStageColor(deal.stageId)}`}>
              {deal.stageId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Deal
            </button>
            <button className="flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-xl text-sm hover:bg-red-50 transition-colors shadow-sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="flex items-center space-x-3 mb-8">
          <button className="flex items-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm">
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </button>
          <button className="flex items-center px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl text-sm hover:from-green-600 hover:to-green-700 transition-all shadow-sm">
            <Phone className="h-4 w-4 mr-2" />
            Log Call
          </button>
          <button className="flex items-center px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl text-sm hover:from-purple-600 hover:to-purple-700 transition-all shadow-sm">
            <Video className="h-4 w-4 mr-2" />
            Schedule Meeting
          </button>
          <button className="flex items-center px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            Add Task
          </button>
        </div>

        {/* Enhanced Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-4 w-4" />
                    <span>{tab.name}</span>
                    {tab.count !== null && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Enhanced Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Ownership & Classification */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Ownership & Classification
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">Deal Owner</p>
                      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="font-semibold text-gray-900">{deal.ownerId}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">Deal Type</p>
                      <div className="p-3 bg-white rounded-lg border border-gray-200">
                        <p className="font-semibold text-gray-900">{deal.dealType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">Country</p>
                      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <p className="font-semibold text-gray-900">{deal.country}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Basic Deal Information */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-green-600" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">Account</p>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Building className="h-4 w-4 text-gray-400" />
                        <p className="font-semibold text-gray-900">{deal.accountId || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">Primary Contact</p>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-semibold text-gray-900">{deal.contactId || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">Deal Amount</p>
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <p className="text-3xl font-bold text-green-700">
                          {formatCurrency(deal.amount, deal.currency)}
                        </p>
                        <p className="text-sm text-green-600 mt-1">Primary Amount</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">Win Probability</p>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold text-gray-900">{deal.probability}%</span>
                          <Target className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${deal.probability}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">Expected Close Date</p>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <p className="font-semibold text-gray-900">{deal.closingDate ? formatDate(deal.closingDate) : 'Not set'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">Created By</p>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-semibold text-gray-900">{deal.createdBy}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Financial Details */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                    Financial Details
                  </h3>
                  
                  {/* Products */}
                  {deal.products.length > 0 && (
                    <div className="mb-8">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <ChevronRight className="h-4 w-4 mr-2" />
                        Products & Line Items
                      </h4>
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {deal.products.map((product) => (
                              <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                    {product.description && (
                                      <p className="text-sm text-gray-500">{product.description}</p>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">{product.quantity}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(product.unitPrice)}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {product.discountType === 'percentage' 
                                    ? `${product.discount}%` 
                                    : formatCurrency(product.discount)
                                  }
                                </td>
                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(product.totalPrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Fees Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-600">Platform Fee</p>
                      <p className="text-lg font-bold text-blue-700">{formatCurrency(deal.platformFee)}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm font-medium text-purple-600">Custom Fee</p>
                      <p className="text-lg font-bold text-purple-700">{formatCurrency(deal.customFee)}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm font-medium text-green-600">License Fee</p>
                      <p className="text-lg font-bold text-green-700">{formatCurrency(deal.licenseFee)}</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-sm font-medium text-orange-600">Onboarding Fee</p>
                      <p className="text-lg font-bold text-orange-700">{formatCurrency(deal.onboardingFee)}</p>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-semibold text-gray-900">Total Deal Value</span>
                      <span className="text-3xl font-bold text-green-600">
                        {formatCurrency(deal.totalAmount, deal.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Enhanced Sidebar */}
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-purple-600" />
                    Key Metrics
                  </h3>
                  <div className="space-y-6">
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                      <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-blue-600 font-medium">Days in Current Stage</p>
                      <p className="text-3xl font-bold text-blue-700">
                        {deal.stageHistory.length > 0 && !deal.stageHistory[deal.stageHistory.length - 1].exitedAt
                          ? Math.floor((new Date().getTime() - new Date(deal.stageHistory[deal.stageHistory.length - 1].enteredAt).getTime()) / (1000 * 60 * 60 * 24))
                          : 0
                        }
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                      <Activity className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <p className="text-sm text-orange-600 font-medium">Open Activities</p>
                      <p className="text-3xl font-bold text-orange-700">
                        {deal.activities.filter(a => a.status === 'open').length + deal.tasks.filter(t => t.status === 'open').length}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                      <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-green-600 font-medium">Last Activity</p>
                      <p className="text-sm font-bold text-green-700">
                        {deal.lastActivityAt ? formatDate(deal.lastActivityAt) : 'No activity'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enhanced Tags */}
                {deal.tags.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Tag className="h-5 w-5 mr-2 text-indigo-600" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {deal.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enhanced Attachments */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Paperclip className="h-5 w-5 mr-2 text-gray-600" />
                      Attachments
                    </h3>
                    <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </button>
                  </div>
                  {deal.attachments.length === 0 ? (
                    <div className="text-center py-8">
                      <Paperclip className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No attachments yet</p>
                      <p className="text-gray-400 text-xs">Drag files here or click to upload</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {deal.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
                          <FileText className="h-5 w-5 text-gray-400 mr-3" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                            <p className="text-xs text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button className="text-gray-400 hover:text-gray-600 ml-2">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'custom' && renderCustomFieldEditor()}

          {activeTab === 'activities' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Activity className="h-6 w-6 mr-3 text-blue-600" />
                  Activities & Tasks
                </h3>
                <button className="flex items-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Activity
                </button>
              </div>

              <div className="space-y-4">
                {[
                  ...deal.activities.map(a => ({ ...a, itemType: 'activity' })),
                  ...deal.tasks.map(t => ({ ...t, itemType: 'task', subject: t.title })),
                  ...deal.meetings.map(m => ({ ...m, itemType: 'meeting', subject: m.title, createdAt: m.startTime }))
                ]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((item, index) => {
                  const IconComponent = getActivityIcon(item.type || 'note');
                  const colorClasses = getActivityColor(item.type || 'note');
                  
                  return (
                    <div key={`${item.itemType}-${item.id}`} className="flex items-start space-x-4 p-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm bg-white">
                      <div className={`flex-shrink-0 p-3 rounded-xl border ${colorClasses}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{item.subject}</h4>
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(item.status)}
                            <span className="text-sm text-gray-500 font-medium">
                              {formatDateTime(item.createdAt)}
                            </span>
                          </div>
                        </div>
                        
                        {item.description && (
                          <p className="text-gray-600 mb-3 leading-relaxed">{item.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Assigned to: <span className="font-medium text-gray-700">{item.assignedTo || item.createdBy}</span></span>
                          {item.duration && (
                            <span className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{item.duration} minutes</span>
                            </span>
                          )}
                        </div>
                        
                        {item.outcome && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800">
                              <strong>Outcome:</strong> {item.outcome}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {deal.activities.length === 0 && deal.tasks.length === 0 && deal.meetings.length === 0 && (
                  <div className="text-center py-16">
                    <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No activities logged yet</p>
                    <p className="text-gray-400">Start tracking your deal activities</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'emails' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Email Communication</h3>
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                  <Mail className="h-4 w-4 mr-2" />
                  Compose Email
                </button>
              </div>

              {deal.emails.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No emails found for this deal</p>
                  <p className="text-sm">All related emails will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deal.emails.map((email) => (
                    <div key={email.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{email.subject}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          email.status === 'sent' ? 'bg-green-100 text-green-800' :
                          email.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {email.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">From:</span> {email.fromEmail}
                        <span className="mx-2">•</span>
                        <span className="font-medium">To:</span> {email.toEmails.join(', ')}
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-3">{email.body}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        {email.sentAt ? `Sent: ${formatDateTime(email.sentAt)}` : 'Not sent yet'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Stage History & Audit Trail</h3>
              
              <div className="flow-root">
                <ul className="-mb-8">
                  {deal.stageHistory.map((entry, index) => (
                    <li key={entry.id}>
                      <div className="relative pb-8">
                        {index !== deal.stageHistory.length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                              entry.exitedAt ? 'bg-green-500' : 'bg-blue-500'
                            }`}>
                              <Clock className="h-4 w-4 text-white" />
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className="text-sm text-gray-900">
                                {entry.fromStageName ? (
                                  <>Moved from <span className="font-medium">{entry.fromStageName}</span> to </>
                                ) : (
                                  'Entered '
                                )}
                                <span className="font-medium">{entry.toStageName}</span>
                              </p>
                              {entry.reason && (
                                <p className="text-sm text-gray-500 mt-1">Reason: {entry.reason}</p>
                              )}
                              {entry.notes && (
                                <p className="text-sm text-gray-500 mt-1">Notes: {entry.notes}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Changed by {entry.changedBy}
                                {entry.duration && (
                                  <span className="ml-2">• Duration: {Math.round(entry.duration)} hours</span>
                                )}
                              </p>
                            </div>
                            <div className="whitespace-nowrap text-right text-sm text-gray-500">
                              <p>{formatDateTime(entry.enteredAt)}</p>
                              {entry.exitedAt && (
                                <p className="text-xs">to {formatDateTime(entry.exitedAt)}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DealDetailView;