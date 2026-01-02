import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, Globe, MapPin, TrendingUp, Users, DollarSign, FileText, MessageSquare, Activity, CreditCard as Edit, MoreVertical, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAccounts } from '../../contexts/AccountsContext';

const AccountDetailView: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const {
    getAccountById,
    getAccountActivities,
    getAccountNotes,
    getAccountDocuments,
    getAccountContacts,
    getAccountDeals,
    getChildAccounts
  } = useAccounts();

  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'contacts' | 'deals' | 'documents' | 'notes'>('overview');

  const account = accountId ? getAccountById(accountId) : undefined;
  const activities = accountId ? getAccountActivities(accountId) : [];
  const notes = accountId ? getAccountNotes(accountId) : [];
  const documents = accountId ? getAccountDocuments(accountId) : [];
  const contacts = accountId ? getAccountContacts(accountId) : [];
  const deals = accountId ? getAccountDeals(accountId) : [];
  const childAccounts = account ? getChildAccounts(account.id) : [];

  if (!account) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Account not found</p>
          <button
            onClick={() => navigate('/crm/accounts')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to Accounts
          </button>
        </div>
      </div>
    );
  }

  const getHealthScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreBg = (score?: number) => {
    if (!score) return 'bg-gray-100';
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'activities', label: 'Activities', icon: Activity, count: activities.length },
    { id: 'contacts', label: 'Contacts', icon: Users, count: contacts.length },
    { id: 'deals', label: 'Deals', icon: DollarSign, count: deals.length },
    { id: 'documents', label: 'Documents', icon: FileText, count: documents.length },
    { id: 'notes', label: 'Notes', icon: MessageSquare, count: notes.length }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/crm/accounts')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{account.name}</h1>
            <p className="text-gray-600 mt-1">
              {account.industry} • {account.accountSize} employees
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <MoreVertical className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`
                        flex items-center py-4 px-1 border-b-2 font-medium text-sm
                        ${isActive
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5 mr-2" />
                      {tab.label}
                      {tab.count !== undefined && (
                        <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                          isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Contact Information</h3>
                      <div className="space-y-3">
                        {account.email && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-gray-400 mr-3" />
                            <a href={`mailto:${account.email}`} className="text-sm text-blue-600 hover:text-blue-700">
                              {account.email}
                            </a>
                          </div>
                        )}
                        {account.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-400 mr-3" />
                            <a href={`tel:${account.phone}`} className="text-sm text-gray-900">
                              {account.phone}
                            </a>
                          </div>
                        )}
                        {account.website && (
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 text-gray-400 mr-3" />
                            <a href={account.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
                              {account.website}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </div>
                        )}
                        {(account.billingAddress.city || account.billingAddress.state) && (
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
                            <div className="text-sm text-gray-900">
                              {account.billingAddress.street && <div>{account.billingAddress.street}</div>}
                              <div>
                                {account.billingAddress.city}, {account.billingAddress.state} {account.billingAddress.postalCode}
                              </div>
                              {account.billingAddress.country && <div>{account.billingAddress.country}</div>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Business Details</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs text-gray-500">Type</span>
                          <p className="text-sm text-gray-900 mt-1 capitalize">{account.type}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Industry</span>
                          <p className="text-sm text-gray-900 mt-1">{account.industry}</p>
                        </div>
                        {account.annualRevenue && (
                          <div>
                            <span className="text-xs text-gray-500">Annual Revenue</span>
                            <p className="text-sm text-gray-900 mt-1">
                              ${(account.annualRevenue / 1000000).toFixed(1)}M {account.revenueCurrency}
                            </p>
                          </div>
                        )}
                        {account.foundingYear && (
                          <div>
                            <span className="text-xs text-gray-500">Founded</span>
                            <p className="text-sm text-gray-900 mt-1">{account.foundingYear}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {account.description && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                      <p className="text-sm text-gray-700">{account.description}</p>
                    </div>
                  )}

                  {account.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {account.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {childAccounts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Child Accounts</h3>
                      <div className="space-y-2">
                        {childAccounts.map((child) => (
                          <div
                            key={child.id}
                            onClick={() => navigate(`/crm/accounts/${child.id}`)}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="flex items-center">
                              <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{child.name}</p>
                                <p className="text-xs text-gray-500">{child.industry}</p>
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'activities' && (
                <div className="space-y-4">
                  {activities.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No activities yet</p>
                    </div>
                  ) : (
                    activities.map((activity) => (
                      <div key={activity.id} className="border-l-4 border-blue-500 pl-4 py-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{activity.subject}</h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {activity.activityType} • {new Date(activity.createdAt).toLocaleDateString()}
                            </p>
                            {activity.description && (
                              <p className="text-sm text-gray-700 mt-2">{activity.description}</p>
                            )}
                            {activity.outcome && (
                              <div className="mt-2">
                                <span className="text-xs font-medium text-gray-500">Outcome: </span>
                                <span className="text-xs text-gray-700">{activity.outcome}</span>
                              </div>
                            )}
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                            activity.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'contacts' && (
                <div className="space-y-4">
                  {contacts.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No contacts linked</p>
                    </div>
                  ) : (
                    contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {contact.title || 'Contact'}
                              {contact.isPrimary && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Primary
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">{contact.relationshipType} • {contact.influenceLevel}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'deals' && (
                <div className="space-y-4">
                  {deals.length === 0 ? (
                    <div className="text-center py-12">
                      <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No deals linked</p>
                    </div>
                  ) : (
                    deals.map((deal) => (
                      <div key={deal.id} className="p-4 border border-gray-200 rounded-lg">
                        <p className="text-sm font-medium text-gray-900">Deal #{deal.dealId}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {deal.isPrimaryAccount ? 'Primary Account' : 'Related Account'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-4">
                  {documents.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No documents uploaded</p>
                    </div>
                  ) : (
                    documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center">
                          <FileText className="h-8 w-8 text-blue-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {doc.documentType} • {(doc.fileSize / 1024).toFixed(0)} KB • {new Date(doc.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 text-sm">
                          Download
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  {notes.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No notes yet</p>
                    </div>
                  ) : (
                    notes.map((note) => (
                      <div key={note.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            note.noteType === 'opportunity' ? 'bg-green-100 text-green-800' :
                            note.noteType === 'risk' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {note.noteType}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{note.content}</p>
                        {Object.keys(note.reactions).length > 0 && (
                          <div className="mt-2 flex items-center space-x-2">
                            {Object.entries(note.reactions).map(([emoji, users]) => (
                              <span key={emoji} className="text-xs text-gray-500">
                                {emoji} {users.length}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Health Score</h3>
            <div className="flex items-center justify-center">
              <div className={`relative h-32 w-32 rounded-full ${getHealthScoreBg(account.healthScore)} flex items-center justify-center`}>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getHealthScoreColor(account.healthScore)}`}>
                    {account.healthScore || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Health Score</div>
                </div>
              </div>
            </div>
            {account.healthScore && (
              <div className="mt-4 text-center">
                {account.healthScore >= 80 ? (
                  <div className="flex items-center justify-center text-green-600 text-sm">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Healthy
                  </div>
                ) : account.healthScore >= 60 ? (
                  <div className="flex items-center justify-center text-yellow-600 text-sm">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Needs Attention
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-red-600 text-sm">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    At Risk
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Activities</span>
                <span className="text-sm font-medium text-gray-900">{activities.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Contacts</span>
                <span className="text-sm font-medium text-gray-900">{contacts.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Deals</span>
                <span className="text-sm font-medium text-gray-900">{deals.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Documents</span>
                <span className="text-sm font-medium text-gray-900">{documents.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Notes</span>
                <span className="text-sm font-medium text-gray-900">{notes.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Important Dates</h3>
            <div className="space-y-3">
              {account.lastActivityDate && (
                <div>
                  <span className="text-xs text-gray-500">Last Activity</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(account.lastActivityDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {account.nextFollowUpDate && (
                <div>
                  <span className="text-xs text-gray-500">Next Follow-up</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(account.nextFollowUpDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <span className="text-xs text-gray-500">Created</span>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(account.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDetailView;
