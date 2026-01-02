import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ExternalLink, Volume2, Monitor } from 'lucide-react';

interface NotificationPreferences {
  emailNotifications: {
    leads: {
      newLeadAssigned: boolean;
      leadScoreAbove80: boolean;
      allNewLeads: boolean;
      leadConverted: boolean;
    };
    deals: {
      newDealAssigned: boolean;
      dealStageChanged: boolean;
      dealWon: boolean;
      dealLost: boolean;
      dealValueChanges: boolean;
      dealClosingThisWeek: boolean;
    };
    activities: {
      newTaskAssigned: boolean;
      taskDueToday: boolean;
      taskOverdue: boolean;
      meetingScheduled: boolean;
      activityCompletedByTeam: boolean;
    };
    contacts: {
      newContactAssigned: boolean;
      contactUpdated: boolean;
    };
    accounts: {
      newAccountAssigned: boolean;
      accountUpdated: boolean;
    };
    documents: {
      documentShared: boolean;
      commentOnDocument: boolean;
      newDocumentUploaded: boolean;
    };
    emailFrequency: 'realtime' | 'hourly' | 'daily';
  };
  inAppNotifications: {
    allEmailEvents: boolean;
    mentions: boolean;
    systemUpdates: boolean;
    notificationSound: boolean;
    desktopNotifications: boolean;
  };
  slackNotifications: {
    newLeadsAbove10K: boolean;
    dealStageChanges: boolean;
    wonDeals: boolean;
    lostDeals: boolean;
    highValueOpportunities: boolean;
  };
}

const NotificationsSettings: React.FC = () => {
  const navigate = useNavigate();

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: {
      leads: {
        newLeadAssigned: true,
        leadScoreAbove80: true,
        allNewLeads: false,
        leadConverted: true
      },
      deals: {
        newDealAssigned: true,
        dealStageChanged: true,
        dealWon: true,
        dealLost: true,
        dealValueChanges: false,
        dealClosingThisWeek: true
      },
      activities: {
        newTaskAssigned: true,
        taskDueToday: true,
        taskOverdue: true,
        meetingScheduled: true,
        activityCompletedByTeam: false
      },
      contacts: {
        newContactAssigned: true,
        contactUpdated: false
      },
      accounts: {
        newAccountAssigned: true,
        accountUpdated: false
      },
      documents: {
        documentShared: true,
        commentOnDocument: true,
        newDocumentUploaded: false
      },
      emailFrequency: 'realtime'
    },
    inAppNotifications: {
      allEmailEvents: true,
      mentions: true,
      systemUpdates: true,
      notificationSound: true,
      desktopNotifications: true
    },
    slackNotifications: {
      newLeadsAbove10K: true,
      dealStageChanges: true,
      wonDeals: true,
      lostDeals: false,
      highValueOpportunities: true
    }
  });

  const handleEmailCheckboxChange = (
    category: keyof typeof preferences.emailNotifications,
    key: string,
    value: boolean
  ) => {
    if (category === 'emailFrequency') return;

    setPreferences(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [category]: {
          ...(prev.emailNotifications[category] as any),
          [key]: value
        }
      }
    }));
  };

  const handleEmailFrequencyChange = (frequency: 'realtime' | 'hourly' | 'daily') => {
    setPreferences(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        emailFrequency: frequency
      }
    }));
  };

  const handleInAppCheckboxChange = (key: keyof typeof preferences.inAppNotifications, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      inAppNotifications: {
        ...prev.inAppNotifications,
        [key]: value
      }
    }));
  };

  const handleSlackCheckboxChange = (key: keyof typeof preferences.slackNotifications, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      slackNotifications: {
        ...prev.slackNotifications,
        [key]: value
      }
    }));
  };

  const handleSaveChanges = () => {
    console.log('Saving notification preferences:', preferences);
    alert('Notification preferences saved successfully!');
  };

  const handleConfigureSlack = () => {
    navigate('/crm/integrations');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your notification preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">EMAIL NOTIFICATIONS</h3>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <p className="text-sm text-gray-700 mb-4">Send me email notifications for:</p>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Leads (Module 2):</h4>
                  <div className="space-y-2 ml-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.leads.newLeadAssigned}
                        onChange={(e) => handleEmailCheckboxChange('leads', 'newLeadAssigned', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">New lead assigned to me</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.leads.leadScoreAbove80}
                        onChange={(e) => handleEmailCheckboxChange('leads', 'leadScoreAbove80', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">Lead score above 80 (hot leads)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.leads.allNewLeads}
                        onChange={(e) => handleEmailCheckboxChange('leads', 'allNewLeads', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">All new leads</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.leads.leadConverted}
                        onChange={(e) => handleEmailCheckboxChange('leads', 'leadConverted', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">Lead converted to contact</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Deals (Module 5):</h4>
                  <div className="space-y-2 ml-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.deals.newDealAssigned}
                        onChange={(e) => handleEmailCheckboxChange('deals', 'newDealAssigned', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">New deal assigned to me</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.deals.dealStageChanged}
                        onChange={(e) => handleEmailCheckboxChange('deals', 'dealStageChanged', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">Deal stage changed</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.deals.dealWon}
                        onChange={(e) => handleEmailCheckboxChange('deals', 'dealWon', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">Deal won</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.deals.dealLost}
                        onChange={(e) => handleEmailCheckboxChange('deals', 'dealLost', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">Deal lost</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.deals.dealValueChanges}
                        onChange={(e) => handleEmailCheckboxChange('deals', 'dealValueChanges', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">Deal value changes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.deals.dealClosingThisWeek}
                        onChange={(e) => handleEmailCheckboxChange('deals', 'dealClosingThisWeek', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">Deal closing this week (reminders)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Activities (Module 6):</h4>
                  <div className="space-y-2 ml-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.activities.newTaskAssigned}
                        onChange={(e) => handleEmailCheckboxChange('activities', 'newTaskAssigned', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">New task assigned to me</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.activities.taskDueToday}
                        onChange={(e) => handleEmailCheckboxChange('activities', 'taskDueToday', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">Task due today</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.activities.taskOverdue}
                        onChange={(e) => handleEmailCheckboxChange('activities', 'taskOverdue', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">Task overdue</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.activities.meetingScheduled}
                        onChange={(e) => handleEmailCheckboxChange('activities', 'meetingScheduled', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">Meeting scheduled</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.activities.activityCompletedByTeam}
                        onChange={(e) => handleEmailCheckboxChange('activities', 'activityCompletedByTeam', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">Activity completed by team member</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Contacts (Module 3):</h4>
                  <div className="space-y-2 ml-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.contacts.newContactAssigned}
                        onChange={(e) => handleEmailCheckboxChange('contacts', 'newContactAssigned', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">New contact assigned to me</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.contacts.contactUpdated}
                        onChange={(e) => handleEmailCheckboxChange('contacts', 'contactUpdated', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">Contact updated</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Accounts (Module 4):</h4>
                  <div className="space-y-2 ml-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.accounts.newAccountAssigned}
                        onChange={(e) => handleEmailCheckboxChange('accounts', 'newAccountAssigned', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">New account assigned to me</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.accounts.accountUpdated}
                        onChange={(e) => handleEmailCheckboxChange('accounts', 'accountUpdated', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">Account updated</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Documents (Module 8):</h4>
                  <div className="space-y-2 ml-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.documents.documentShared}
                        onChange={(e) => handleEmailCheckboxChange('documents', 'documentShared', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">Document shared with me</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.documents.commentOnDocument}
                        onChange={(e) => handleEmailCheckboxChange('documents', 'commentOnDocument', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">Comment on my document</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications.documents.newDocumentUploaded}
                        onChange={(e) => handleEmailCheckboxChange('documents', 'newDocumentUploaded', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">New document uploaded</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Email Frequency:</h4>
                  <select
                    value={preferences.emailNotifications.emailFrequency}
                    onChange={(e) => handleEmailFrequencyChange(e.target.value as 'realtime' | 'hourly' | 'daily')}
                    className="ml-4 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="realtime">Real-time (as they happen)</option>
                    <option value="hourly">Hourly digest</option>
                    <option value="daily">Daily digest</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={handleSaveChanges}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">IN-APP NOTIFICATIONS</h3>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-700 mb-4">Show in-app notifications for:</p>
              <div className="space-y-3 ml-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.inAppNotifications.allEmailEvents}
                    onChange={(e) => handleInAppCheckboxChange('allEmailEvents', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">All email notification events</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.inAppNotifications.mentions}
                    onChange={(e) => handleInAppCheckboxChange('mentions', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">Team member mentions (@mentions)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.inAppNotifications.systemUpdates}
                    onChange={(e) => handleInAppCheckboxChange('systemUpdates', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">System updates</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Notification Sound:</h4>
              <label className="flex items-center ml-4">
                <input
                  type="checkbox"
                  checked={preferences.inAppNotifications.notificationSound}
                  onChange={(e) => handleInAppCheckboxChange('notificationSound', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Volume2 className="ml-3 h-4 w-4 text-gray-600" />
                <span className="ml-2 text-sm text-gray-700">Play sound for notifications</span>
              </label>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Desktop Notifications:</h4>
              <label className="flex items-center ml-4">
                <input
                  type="checkbox"
                  checked={preferences.inAppNotifications.desktopNotifications}
                  onChange={(e) => handleInAppCheckboxChange('desktopNotifications', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Monitor className="ml-3 h-4 w-4 text-gray-600" />
                <span className="ml-2 text-sm text-gray-700">Show browser notifications</span>
              </label>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={handleSaveChanges}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">SLACK NOTIFICATIONS (via Integration)</h3>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Status: Connected to BMI Sales Team</span>
            </div>

            <div>
              <p className="text-sm text-gray-700 mb-4">Send Slack notifications for:</p>
              <div className="space-y-3 ml-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.slackNotifications.newLeadsAbove10K}
                    onChange={(e) => handleSlackCheckboxChange('newLeadsAbove10K', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">New leads (value &gt; $10K)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.slackNotifications.dealStageChanges}
                    onChange={(e) => handleSlackCheckboxChange('dealStageChanges', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">Deal stage changes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.slackNotifications.wonDeals}
                    onChange={(e) => handleSlackCheckboxChange('wonDeals', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">Won deals</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.slackNotifications.lostDeals}
                    onChange={(e) => handleSlackCheckboxChange('lostDeals', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">Lost deals</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.slackNotifications.highValueOpportunities}
                    onChange={(e) => handleSlackCheckboxChange('highValueOpportunities', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">High-value opportunities (&gt;$50K)</span>
                </label>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Channels:</h4>
              <div className="ml-4 space-y-1">
                <div className="text-sm text-gray-700">• #sales-alerts</div>
                <div className="text-sm text-gray-700">• #deal-updates</div>
                <div className="text-sm text-gray-700">• #lead-notifications</div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleConfigureSlack}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center gap-2"
              >
                Configure Slack Integration
                <ExternalLink className="h-4 w-4" />
              </button>
              <p className="text-xs text-gray-500 mt-1">(Navigate to Screen 10.1 &gt; Slack connector)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsSettings;
