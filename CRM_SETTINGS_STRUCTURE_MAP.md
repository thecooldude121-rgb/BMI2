# CRM Settings - Complete Structure Map

**Total Sections**: 11
**Total Subsections**: 34
**Total Components**: 35

---

## Visual Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                         CRM SETTINGS                             │
│                   Settings Navigation Sidebar                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 1️⃣  ACCOUNT                                         👤 User      │
├─────────────────────────────────────────────────────────────────┤
│     1.1  Profile                         (ProfileSettings.tsx)  │
│     1.2  Password                       (PasswordSettings.tsx)  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 2️⃣  PREFERENCES                                  🎨 Palette      │
├─────────────────────────────────────────────────────────────────┤
│     2.1  Preferences                       (Preferences.tsx)    │
│     2.2  General (Legacy)           (GeneralPreferences.tsx)    │
│     2.3  Display (Legacy)           (DisplayPreferences.tsx)    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 3️⃣  INTEGRATIONS                                  🔌 Plug        │
├─────────────────────────────────────────────────────────────────┤
│     3.1  Overview                  (IntegrationsOverview.tsx)   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 4️⃣  NOTIFICATIONS                                 🔔 Bell        │
├─────────────────────────────────────────────────────────────────┤
│     4.1  All Notifications       (NotificationsSettings.tsx)    │
│     4.2  Email Alerts                    (EmailAlerts.tsx)      │
│     4.3  In-App                    (InAppNotifications.tsx)     │
│     4.4  Slack                     (SlackNotifications.tsx)     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 5️⃣  SECURITY                                      🔒 Lock        │
├─────────────────────────────────────────────────────────────────┤
│     5.1  All Security                 (SecuritySettings.tsx)    │
│     5.2  2FA                           (TwoFactorAuth.tsx)      │
│     5.3  API Keys                          (APIKeys.tsx)        │
│     5.4  Sessions                         (Sessions.tsx)        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 6️⃣  BILLING                                  💳 CreditCard      │
├─────────────────────────────────────────────────────────────────┤
│     6.1  All Billing                   (BillingSettings.tsx)    │
│     6.2  Plan                             (BillingPlan.tsx)     │
│     6.3  Payment                       (PaymentMethods.tsx)     │
│     6.4  Invoices                          (Invoices.tsx)       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 7️⃣  DATA & PRIVACY                            💾 Database       │
├─────────────────────────────────────────────────────────────────┤
│     7.1  All Data & Privacy        (DataPrivacySettings.tsx)    │
│     7.2  Export                           (DataExport.tsx)      │
│     7.3  Delete                          (DataDeletion.tsx)     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 8️⃣  EMAIL TEMPLATES                              ✉️  Mail        │
├─────────────────────────────────────────────────────────────────┤
│     8.1  All Email Templates     (EmailTemplatesManager.tsx)    │
│     8.2  Outreach                    (OutreachTemplates.tsx)    │
│     8.3  Follow-up                   (FollowUpTemplates.tsx)    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 9️⃣  PIPELINE SETTINGS                            🎯 Target       │
├─────────────────────────────────────────────────────────────────┤
│     9.1  All Pipeline Settings      (PipelineSettings.tsx)      │
│     9.2  Deal Stages                      (DealStages.tsx)      │
│     9.3  Probabilities              (StageProbabilities.tsx)    │
│     9.4  Win Reasons                       (WinReasons.tsx)     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🔟 CUSTOM FIELDS                                🔧 Wrench        │
├─────────────────────────────────────────────────────────────────┤
│     10.1  All Custom Fields           (CustomFieldsAll.tsx)     │
│     10.2  Leads                      (LeadsCustomFields.tsx)    │
│     10.3  Contacts                 (ContactsCustomFields.tsx)   │
│     10.4  Accounts                 (AccountsCustomFields.tsx)   │
│     10.5  Deals                      (DealsCustomFields.tsx)    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 1️⃣1️⃣ TEAM MANAGEMENT  🆕                         👥 Users        │
├─────────────────────────────────────────────────────────────────┤
│     11.1  Team Overview                 (TeamManagement.tsx)    │
│                                                                 │
│     Status: Placeholder for Module 9                           │
│     Features: Coming soon preview, current team display        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Section Details

### 1. ACCOUNT (2 subsections)
**Purpose**: User account management
- Personal profile information
- Password and security credentials

### 2. PREFERENCES (3 subsections)
**Purpose**: Customize user experience
- Modern unified preferences
- Legacy general settings
- Legacy display settings

### 3. INTEGRATIONS (1 subsection)
**Purpose**: Third-party service connections
- Integration overview and management

### 4. NOTIFICATIONS (4 subsections)
**Purpose**: Configure alerts and notifications
- Unified notification management
- Email-based alerts
- In-application notifications
- Slack workspace notifications

### 5. SECURITY (4 subsections)
**Purpose**: Account security and access control
- Comprehensive security overview
- Two-factor authentication
- API key management
- Active session monitoring

### 6. BILLING (4 subsections)
**Purpose**: Subscription and payment management
- Billing overview
- Plan selection and upgrades
- Payment method management
- Invoice history and downloads

### 7. DATA & PRIVACY (3 subsections)
**Purpose**: Data protection and privacy compliance
- Privacy settings overview
- Data export functionality
- Account deletion options

### 8. EMAIL TEMPLATES (3 subsections)
**Purpose**: Manage email communication templates
- Template library and management
- Outreach campaign templates
- Follow-up sequence templates

### 9. PIPELINE SETTINGS (4 subsections)
**Purpose**: Configure sales pipeline
- Pipeline configuration overview
- Deal stage management
- Win probability settings
- Win/loss reason tracking

### 10. CUSTOM FIELDS (5 subsections)
**Purpose**: Extend data schema with custom fields
- Global custom fields overview
- Lead-specific fields
- Contact-specific fields
- Account-specific fields
- Deal-specific fields

### 11. TEAM MANAGEMENT (1 subsection) 🆕
**Purpose**: Team collaboration and management
- Team overview page
- Coming soon: Full team management (Module 9)
- Current team display (3 members)
- Future features preview

---

## Component File Structure

```
src/pages/CRM/CRMSettings/
│
├── ProfileSettings.tsx              (Section 1.1)
├── PasswordSettings.tsx             (Section 1.2)
│
├── Preferences.tsx                  (Section 2.1)
├── GeneralPreferences.tsx           (Section 2.2)
├── DisplayPreferences.tsx           (Section 2.3)
│
├── IntegrationsOverview.tsx         (Section 3.1)
│
├── NotificationsSettings.tsx        (Section 4.1)
├── EmailAlerts.tsx                  (Section 4.2)
├── InAppNotifications.tsx           (Section 4.3)
├── SlackNotifications.tsx           (Section 4.4)
│
├── SecuritySettings.tsx             (Section 5.1)
├── TwoFactorAuth.tsx                (Section 5.2)
├── APIKeys.tsx                      (Section 5.3)
├── Sessions.tsx                     (Section 5.4)
│
├── BillingSettings.tsx              (Section 6.1)
├── BillingPlan.tsx                  (Section 6.2)
├── PaymentMethods.tsx               (Section 6.3)
├── Invoices.tsx                     (Section 6.4)
│
├── DataPrivacySettings.tsx          (Section 7.1)
├── DataExport.tsx                   (Section 7.2)
├── DataDeletion.tsx                 (Section 7.3)
│
├── EmailTemplatesManager.tsx        (Section 8.1)
├── OutreachTemplates.tsx            (Section 8.2)
├── FollowUpTemplates.tsx            (Section 8.3)
│
├── PipelineSettings.tsx             (Section 9.1)
├── DealStages.tsx                   (Section 9.2)
├── StageProbabilities.tsx           (Section 9.3)
├── WinReasons.tsx                   (Section 9.4)
│
├── CustomFieldsAll.tsx              (Section 10.1)
├── LeadsCustomFields.tsx            (Section 10.2)
├── ContactsCustomFields.tsx         (Section 10.3)
├── AccountsCustomFields.tsx         (Section 10.4)
├── DealsCustomFields.tsx            (Section 10.5)
│
└── TeamManagement.tsx               (Section 11.1) 🆕
```

---

## Route Mapping Table

| Section | Subsection | Route ID | Component |
|---------|-----------|----------|-----------|
| 1 | Profile | `profile` | ProfileSettings |
| 1 | Password | `password` | PasswordSettings |
| 2 | Preferences | `preferences` | Preferences |
| 2 | General | `general` | GeneralPreferences |
| 2 | Display | `display` | DisplayPreferences |
| 3 | Overview | `integrations-overview` | IntegrationsOverview |
| 4 | All Notifications | `notifications-all` | NotificationsSettings |
| 4 | Email Alerts | `email-alerts` | EmailAlerts |
| 4 | In-App | `in-app` | InAppNotifications |
| 4 | Slack | `slack` | SlackNotifications |
| 5 | All Security | `security-all` | SecuritySettings |
| 5 | 2FA | `2fa` | TwoFactorAuth |
| 5 | API Keys | `api-keys` | APIKeys |
| 5 | Sessions | `sessions` | Sessions |
| 6 | All Billing | `billing-all` | BillingSettings |
| 6 | Plan | `plan` | BillingPlan |
| 6 | Payment | `payment` | PaymentMethods |
| 6 | Invoices | `invoices` | Invoices |
| 7 | All Data & Privacy | `data-privacy-all` | DataPrivacySettings |
| 7 | Export | `export` | DataExport |
| 7 | Delete | `delete` | DataDeletion |
| 8 | All Email Templates | `email-templates-all` | EmailTemplatesManager |
| 8 | Outreach | `outreach` | OutreachTemplates |
| 8 | Follow-up | `follow-up` | FollowUpTemplates |
| 9 | All Pipeline Settings | `pipeline-all` | PipelineSettings |
| 9 | Deal Stages | `deal-stages` | DealStages |
| 9 | Probabilities | `probabilities` | StageProbabilities |
| 9 | Win Reasons | `win-reasons` | WinReasons |
| 10 | All Custom Fields | `custom-fields-all` | CustomFieldsAll |
| 10 | Leads | `leads-fields` | LeadsCustomFields |
| 10 | Contacts | `contacts-fields` | ContactsCustomFields |
| 10 | Accounts | `accounts-fields` | AccountsCustomFields |
| 10 | Deals | `deals-fields` | DealsCustomFields |
| 11 🆕 | Team Overview | `team` | TeamManagement |

---

## Statistics Summary

### By Section Type

**Configuration Sections**: 8
- Account, Preferences, Integrations, Notifications, Security, Billing, Data & Privacy, Pipeline

**Template Management**: 1
- Email Templates

**Customization**: 1
- Custom Fields

**Team Features**: 1 🆕
- Team Management

### By Implementation Status

**Fully Implemented**: 10 sections
**Placeholder (Coming Soon)**: 1 section (Team Management)

### By Subsection Count

| Sections with 1 subsection | 2 sections | (Integrations, Team Management) |
| Sections with 2 subsections | 1 section  | (Account) |
| Sections with 3 subsections | 3 sections | (Preferences, Data & Privacy, Email Templates) |
| Sections with 4 subsections | 4 sections | (Notifications, Security, Billing, Pipeline) |
| Sections with 5 subsections | 1 section  | (Custom Fields) |

---

## Icon Reference

| Icon | Lucide Component | Used In |
|------|------------------|---------|
| 👤 | `User` | Account |
| 🎨 | `Palette` | Preferences |
| 🔌 | `Plug` | Integrations |
| 🔔 | `Bell` | Notifications |
| 🔒 | `Lock` | Security |
| 💳 | `CreditCard` | Billing |
| 💾 | `Database` | Data & Privacy |
| ✉️ | `Mail` | Email Templates |
| 🎯 | `Target` | Pipeline Settings |
| 🔧 | `Wrench` | Custom Fields |
| 👥 | `Users` | Team Management 🆕 |

---

## Navigation Breadcrumb Examples

```
CRM → Settings → Account → Profile
CRM → Settings → Notifications → Email Alerts
CRM → Settings → Pipeline Settings → Deal Stages
CRM → Settings → Custom Fields → Accounts
CRM → Settings → Team Management → Team Overview 🆕
```

---

## Implementation Timeline

**Original 10 Sections**: Implemented in previous phases
**Section 11 (Team Management)**: Added December 13, 2025

---

## Future Enhancements (Planned for Module 9)

Team Management will expand to include:
- ✨ Add/remove team members
- ✨ Assign roles and permissions
- ✨ View team activity and performance
- ✨ Manage HRMS sync for team
- ✨ Team analytics and reporting
- ✨ Collaboration tools

---

## Quick Reference Card

```
┌──────────────────────────────────────────────────┐
│  CRM SETTINGS - QUICK REFERENCE                  │
├──────────────────────────────────────────────────┤
│  Total Sections:     11                          │
│  Total Subsections:  34                          │
│  Total Components:   35                          │
│                                                  │
│  Newest Addition:    Team Management 🆕          │
│  Status:             All sections operational    │
│  Build:              ✅ Successful               │
├──────────────────────────────────────────────────┤
│  Access:  CRM → Settings                         │
│  Path:    /crm/settings                          │
└──────────────────────────────────────────────────┘
```

---

**Last Updated**: December 13, 2025
**Version**: 1.1 (includes Team Management)
**Status**: Production Ready ✅
