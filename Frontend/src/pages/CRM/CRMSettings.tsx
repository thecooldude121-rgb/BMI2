import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Palette, Plug, Bell, Lock, CreditCard, Database, Mail, Target, Wrench, Users, TrendingUp, Link2 } from 'lucide-react';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import ProfileSettings from './CRMSettings/ProfileSettings';
import PasswordSettings from './CRMSettings/PasswordSettings';
import Preferences from './CRMSettings/Preferences';
import GeneralPreferences from './CRMSettings/GeneralPreferences';
import DisplayPreferences from './CRMSettings/DisplayPreferences';
import IntegrationsOverview from './CRMSettings/IntegrationsOverview';
import EmailAlerts from './CRMSettings/EmailAlerts';
import InAppNotifications from './CRMSettings/InAppNotifications';
import SlackNotifications from './CRMSettings/SlackNotifications';
import NotificationsSettings from './CRMSettings/NotificationsSettings';
import SecuritySettings from './CRMSettings/SecuritySettings';
import TwoFactorAuth from './CRMSettings/TwoFactorAuth';
import APIKeys from './CRMSettings/APIKeys';
import Sessions from './CRMSettings/Sessions';
import BillingSettings from './CRMSettings/BillingSettings';
import BillingPlan from './CRMSettings/BillingPlan';
import PaymentMethods from './CRMSettings/PaymentMethods';
import Invoices from './CRMSettings/Invoices';
import DataPrivacySettings from './CRMSettings/DataPrivacySettings';
import DataExport from './CRMSettings/DataExport';
import DataDeletion from './CRMSettings/DataDeletion';
import EmailTemplatesManager from './CRMSettings/EmailTemplatesManager';
import OutreachTemplates from './CRMSettings/OutreachTemplates';
import FollowUpTemplates from './CRMSettings/FollowUpTemplates';
import PipelineSettings from './CRMSettings/PipelineSettings';
import DealStages from './CRMSettings/DealStages';
import StageProbabilities from './CRMSettings/StageProbabilities';
import WinReasons from './CRMSettings/WinReasons';
import StalledDealRules from './CRMSettings/StalledDealRules';
import CustomFieldsAll from './CRMSettings/CustomFieldsAll';
import LeadsCustomFields from './CRMSettings/LeadsCustomFields';
import ContactsCustomFields from './CRMSettings/ContactsCustomFields';
import AccountsCustomFields from './CRMSettings/AccountsCustomFields';
import DealsCustomFields from './CRMSettings/DealsCustomFields';
import TeamManagement from './CRMSettings/TeamManagement';
import TargetsSettings from './CRMSettings/TargetsSettings';
import ConnectedModules from './CRMSettings/ConnectedModules';
import { useAuth } from '../../contexts/AuthContext';

type SettingsSection = {
  id: string;
  label: string;
  icon: React.ReactNode;
  subsections?: { id: string; label: string }[];
  adminOnly?: boolean;
  /**
   * Admin OR Manager, mirroring the server's DESTRUCTIVE_ACTION_ROLES.
   * `adminOnly` above is narrower (Admin alone); a section the API lets a
   * manager use must not be hidden from managers, or the screen is
   * unreachable for someone the server would have allowed.
   */
  administrativeOnly?: boolean;
};

const CRMSettings: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');

  const allSections: SettingsSection[] = [
    {
      id: 'account',
      label: 'ACCOUNT',
      icon: <User className="h-4 w-4" />,
      subsections: [
        { id: 'profile', label: 'Profile' },
        { id: 'password', label: 'Password' }
      ]
    },
    {
      id: 'preferences',
      label: 'PREFERENCES',
      icon: <Palette className="h-4 w-4" />,
      subsections: [
        { id: 'preferences', label: 'Preferences' },
        { id: 'general', label: 'General (Legacy)' },
        { id: 'display', label: 'Display (Legacy)' }
      ]
    },
    {
      id: 'integrations',
      label: 'INTEGRATIONS',
      icon: <Plug className="h-4 w-4" />,
      subsections: [
        { id: 'integrations-overview', label: 'Overview' }
      ]
    },
    {
      id: 'notifications',
      label: 'NOTIFICATIONS',
      icon: <Bell className="h-4 w-4" />,
      subsections: [
        { id: 'notifications-all', label: 'All Notifications' },
        { id: 'email-alerts', label: 'Email Alerts' },
        { id: 'in-app', label: 'In-App' },
        { id: 'slack', label: 'Slack' }
      ]
    },
    {
      id: 'security',
      label: 'SECURITY',
      icon: <Lock className="h-4 w-4" />,
      subsections: [
        { id: 'security-all', label: 'All Security' },
        { id: '2fa', label: '2FA' },
        { id: 'api-keys', label: 'API Keys' },
        { id: 'sessions', label: 'Sessions' }
      ]
    },
    {
      id: 'billing',
      label: 'BILLING',
      icon: <CreditCard className="h-4 w-4" />,
      subsections: [
        { id: 'billing-all', label: 'All Billing' },
        { id: 'plan', label: 'Plan' },
        { id: 'payment', label: 'Payment' },
        { id: 'invoices', label: 'Invoices' }
      ]
    },
    {
      id: 'data-privacy',
      label: 'DATA & PRIVACY',
      icon: <Database className="h-4 w-4" />,
      subsections: [
        { id: 'data-privacy-all', label: 'All Data & Privacy' },
        { id: 'export', label: 'Export' },
        { id: 'delete', label: 'Delete' }
      ]
    },
    {
      id: 'email-templates',
      label: 'EMAIL TEMPLATES',
      icon: <Mail className="h-4 w-4" />,
      subsections: [
        { id: 'email-templates-all', label: 'All Email Templates' },
        { id: 'outreach', label: 'Outreach' },
        { id: 'follow-up', label: 'Follow-up' }
      ]
    },
    {
      // Not adminOnly: every role can see targets, and whether a given person
      // can EDIT one is decided per row by the server (`can_edit`).
      id: 'sales-targets',
      label: 'SALES TARGETS',
      icon: <TrendingUp className="h-4 w-4" />,
      subsections: [
        { id: 'targets', label: 'Targets' }
      ]
    },
    {
      id: 'pipeline',
      label: 'PIPELINE SETTINGS',
      icon: <Target className="h-4 w-4" />,
      subsections: [
        { id: 'pipeline-all', label: 'All Pipeline Settings' },
        { id: 'deal-stages', label: 'Deal Stages' },
        { id: 'probabilities', label: 'Probabilities' },
        { id: 'win-reasons', label: 'Win Reasons' },
        { id: 'stalled-rules', label: 'Stalled Rules' }
      ]
    },
    {
      id: 'custom-fields',
      label: 'CUSTOM FIELDS',
      icon: <Wrench className="h-4 w-4" />,
      subsections: [
        { id: 'custom-fields-all', label: 'All Custom Fields' },
        { id: 'leads-fields', label: 'Leads' },
        { id: 'contacts-fields', label: 'Contacts' },
        { id: 'accounts-fields', label: 'Accounts' },
        { id: 'deals-fields', label: 'Deals' }
      ]
    },
    {
      id: 'team',
      label: 'TEAM MANAGEMENT',
      icon: <Users className="h-4 w-4" />,
      subsections: [],
      adminOnly: true
    },
    {
      // Administrative, not admin-only: minting a setup code and disconnecting
      // are both gated on DESTRUCTIVE_ACTION_ROLES ('admin','manager') by the
      // API, so the nav matches that rather than being stricter than the
      // server and hiding a working screen from managers.
      id: 'connected-modules',
      label: 'CONNECTED MODULES',
      icon: <Link2 className="h-4 w-4" />,
      /*
       * A SECTION WITH NO SUBSECTIONS RENDERS ITS HEADER AND NOTHING ELSE.
       *
       * This was `subsections: []`, so the screen was unreachable from the nav
       * for everyone — the header appeared with no clickable item under it.
       * `renderContent` has had `case 'connected-modules'` all along; nothing
       * ever called `setActiveSection('connected-modules')`.
       *
       * TEAM MANAGEMENT gets away with an empty array only because the nav
       * renderer carries a hardcoded `section.id === 'team'` fallback that
       * synthesises a "Team Overview" button. That special case is why the two
       * sections looked identical in the data but behaved differently on
       * screen. See the note beside it in the renderer.
       */
      subsections: [
        { id: 'connected-modules', label: 'Manage Connections' }
      ],
      administrativeOnly: true
    }
  ];

  // Filter sections based on user role - only show admin-only sections to Admin users
  const sections = allSections.filter(section => {
    if (section.administrativeOnly) {
      return user?.role === 'Admin' || user?.role === 'Manager';
    }
    if (section.adminOnly) {
      return user?.role === 'Admin';
    }
    return true;
  });

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSettings />;
      case 'password':
        return <PasswordSettings />;
      case 'preferences':
        return <Preferences />;
      case 'general':
        return <GeneralPreferences />;
      case 'display':
        return <DisplayPreferences />;
      case 'integrations-overview':
        return <IntegrationsOverview />;
      case 'notifications-all':
        return <NotificationsSettings />;
      case 'email-alerts':
        return <EmailAlerts />;
      case 'in-app':
        return <InAppNotifications />;
      case 'slack':
        return <SlackNotifications />;
      case 'security-all':
        return <SecuritySettings />;
      case '2fa':
        return <TwoFactorAuth />;
      case 'api-keys':
        return <APIKeys />;
      case 'sessions':
        return <Sessions />;
      case 'billing-all':
        return <BillingSettings />;
      case 'plan':
        return <BillingPlan />;
      case 'payment':
        return <PaymentMethods />;
      case 'invoices':
        return <Invoices />;
      case 'data-privacy-all':
        return <DataPrivacySettings />;
      case 'export':
        return <DataExport />;
      case 'delete':
        return <DataDeletion />;
      case 'email-templates-all':
        return <EmailTemplatesManager />;
      case 'outreach':
        return <OutreachTemplates />;
      case 'follow-up':
        return <FollowUpTemplates />;
      case 'pipeline-all':
        return <PipelineSettings />;
      case 'deal-stages':
        return <DealStages />;
      case 'probabilities':
        return <StageProbabilities />;
      case 'win-reasons':
        return <WinReasons />;
      case 'stalled-rules':
        return <StalledDealRules />;
      case 'custom-fields-all':
        return <CustomFieldsAll />;
      case 'leads-fields':
        return <LeadsCustomFields />;
      case 'contacts-fields':
        return <ContactsCustomFields />;
      case 'accounts-fields':
        return <AccountsCustomFields />;
      case 'deals-fields':
        return <DealsCustomFields />;
      case 'team':
        return <TeamManagement />;
      case 'targets':
        return <TargetsSettings />;
      case 'connected-modules':
        return <ConnectedModules />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMNavigation />

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-gray-700" />
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-600">Manage your account, preferences, and CRM configuration</p>
        </div>

        <div className="flex gap-6">
          <div className="w-1/5 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-6">
              <nav className="space-y-6">
                {sections.map((section) => (
                  <div key={section.id}>
                    <div className="flex items-center gap-2 mb-2">
                      {section.icon}
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {section.label}
                      </h3>
                    </div>
                    <div className="ml-6 space-y-1">
                      {section.subsections?.map((subsection) => (
                        <button
                          key={subsection.id}
                          onClick={() => setActiveSection(subsection.id)}
                          className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                            activeSection === subsection.id
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {subsection.label}
                        </button>
                      ))}
                      {/*
                        * A HARDCODED FALLBACK FOR ONE SECTION. Every other
                        * section is reachable because it LISTS its entries in
                        * `subsections`; `team` alone relies on this branch.
                        *
                        * That asymmetry cost a working screen: Connected
                        * Modules shipped with `subsections: []`, matched no
                        * branch, and rendered a header with nothing under it.
                        * The general property — every section offers at least
                        * one clickable item — is now pinned by
                        * CRMSettings.navigation.test.tsx, so the next section
                        * added with an empty array fails a test instead of
                        * silently disappearing.
                        */}
                      {section.id === 'team' && section.subsections?.length === 0 && (
                        <button
                          onClick={() => setActiveSection('team')}
                          className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                            activeSection === 'team'
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Team Overview
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </div>

          <div className="w-4/5">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRMSettings;
