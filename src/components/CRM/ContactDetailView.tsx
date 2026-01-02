import React, { useState } from 'react';
import { Mail, Phone, Building, MapPin, Calendar, Edit, Trash2, MessageSquare, Video, Plus } from 'lucide-react';
import { Contact, Activity } from '../../types/crm';
import { useData } from '../../contexts/DataContext';
import ActivityTimeline from './ActivityTimeline';

interface ContactDetailViewProps {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const ContactDetailView: React.FC<ContactDetailViewProps> = ({
  contact,
  onEdit,
  onDelete,
  onClose
}) => {
  const { activities, companies, addActivity } = useData();
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'deals'>('overview');

  const company = companies.find(c => c.id === contact.accountId);

  const getStatusColor = (status: Contact['status']) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      bounced: 'bg-red-100 text-red-800',
      unsubscribed: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status];
  };

  const handleAddActivity = (activityData: Partial<Activity>) => {
    const newActivity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'> = {
      type: activityData.type || 'note',
      subject: activityData.subject || '',
      description: activityData.description,
      direction: activityData.direction,
      status: activityData.status || 'completed',
      priority: activityData.priority || 'medium',
      outcome: activityData.outcome,
      duration: activityData.duration,
      scheduledAt: activityData.scheduledAt,
      completedAt: activityData.status === 'completed' ? new Date().toISOString() : undefined,
      location: activityData.location,
      meetingUrl: activityData.meetingUrl,
      recordingUrl: activityData.recordingUrl,
      createdBy: activityData.createdBy || '1',
      ownerId: activityData.ownerId || '1',
      relatedTo: activityData.relatedTo || [],
      attendees: activityData.attendees || [],
      attachments: activityData.attachments || [],
      tags: activityData.tags || [],
      customFields: activityData.customFields || {},
      automationTriggered: false
    };

    addActivity(newActivity);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', count: null },
    { id: 'activities', name: 'Activities', count: activities.filter(a => 
      a.relatedTo.some(r => r.entityType === 'contact' && r.entityId === contact.id)
    ).length },
    { id: 'deals', name: 'Deals', count: 0 }
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold text-blue-600">
                {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {contact.firstName} {contact.lastName}
              </h2>
              <p className="text-gray-600">{contact.position}</p>
              {company && (
                <p className="text-sm text-gray-500">{company.name}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
              {contact.status}
            </span>
            <button
              onClick={onEdit}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button
              onClick={onDelete}
              className="flex items-center px-3 py-2 border border-red-300 text-red-600 rounded-md text-sm hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-3 mb-6">
          <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </button>
          <button className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
            <Phone className="h-4 w-4 mr-2" />
            Call
          </button>
          <button className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700">
            <Video className="h-4 w-4 mr-2" />
            Schedule Meeting
          </button>
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
            <MessageSquare className="h-4 w-4 mr-2" />
            Send SMS
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
                {tab.count !== null && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{contact.email || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{contact.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  {contact.mobile && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Mobile</p>
                        <p className="font-medium">{contact.mobile}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Building className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Department</p>
                      <p className="font-medium">{contact.department || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Information */}
              {company && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Company</p>
                        <p className="font-medium">{company.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Industry</p>
                        <p className="font-medium">{company.industry}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Company Size</p>
                        <p className="font-medium">{company.size} employees</p>
                      </div>
                    </div>
                    {company.website && (
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Website</p>
                          <a 
                            href={company.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            {company.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {contact.tags.length > 0 && (
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="lg:col-span-2 bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Created</p>
                    <p className="font-medium">{new Date(contact.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Last Updated</p>
                    <p className="font-medium">{new Date(contact.updatedAt).toLocaleDateString()}</p>
                  </div>
                  {contact.lastContactedAt && (
                    <div>
                      <p className="text-gray-600">Last Contacted</p>
                      <p className="font-medium">{new Date(contact.lastContactedAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <ActivityTimeline
              entityType="contact"
              entityId={contact.id}
              activities={activities}
              onAddActivity={handleAddActivity}
            />
          )}

          {activeTab === 'deals' && (
            <div className="text-center py-8 text-gray-500">
              <Building className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No deals associated with this contact</p>
              <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm">
                Create Deal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactDetailView;