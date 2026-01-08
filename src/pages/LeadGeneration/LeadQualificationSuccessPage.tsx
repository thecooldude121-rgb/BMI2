import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  Mail,
  Calendar,
  FileText,
  Sparkles,
  TrendingUp,
  DollarSign,
  Target,
  Clock,
  User,
  Building2,
  Lightbulb,
  Download
} from 'lucide-react';
import {
  getQualificationSuccessData,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDateWithTime
} from '../../utils/qualificationSuccessMockData';
import { useToast } from '../../contexts/ToastContext';

const LeadQualificationSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const successData = getQualificationSuccessData(id || 'lead_001');
  const [countdown, setCountdown] = useState(successData.redirectSettings.delay);
  const [autoRedirect, setAutoRedirect] = useState(successData.redirectSettings.enabled);

  useEffect(() => {
    if (autoRedirect && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (autoRedirect && countdown === 0) {
      navigate(successData.redirectSettings.destination, {
        state: { qualifiedLeadId: successData.lead.id }
      });
    }
  }, [countdown, autoRedirect, navigate, successData.redirectSettings.destination, successData.lead.id]);

  const handleCancelAutoRedirect = () => {
    setAutoRedirect(false);
    showToast('info', 'Auto-redirect cancelled');
  };

  const generateCalendarEvent = (step: typeof successData.nextSteps[0]) => {
    const startDate = new Date(step.date);
    if (step.time) {
      const [time, period] = step.time.split(' ');
      const [hours, minutes] = time.split(':');
      let hour = parseInt(hours);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      startDate.setHours(hour, parseInt(minutes || '0'));
    }

    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Lead Generation System//EN',
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${step.title} - ${successData.lead.name} (${successData.lead.company})`,
      `DESCRIPTION:${step.description}\\n\\nLead: ${successData.lead.name}\\nCompany: ${successData.lead.company}\\nEmail: ${successData.lead.email}\\nPhone: ${successData.lead.phone}`,
      `LOCATION:Zoom Meeting`,
      `ATTENDEE:mailto:${successData.lead.email}`,
      `ORGANIZER:mailto:${successData.crmOpportunity.owner.split(' ')[0].toLowerCase()}@company.com`,
      `STATUS:CONFIRMED`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${step.title.replace(/\s+/g, '_')}_${successData.lead.name.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', `Calendar event "${step.title}" downloaded`);
  };

  const handleContactLead = () => {
    const subject = encodeURIComponent('Following up on our recent conversation');
    const body = encodeURIComponent(
      `Hi ${successData.lead.name.split(' ')[0]},\n\n` +
      `Thank you for your time today. I'm excited about the opportunity to work with ${successData.lead.company}.\n\n` +
      `Based on our conversation, I believe our solution can help address your needs, particularly around:\n` +
      `• ${successData.nextSteps[0]?.description || 'Your business objectives'}\n\n` +
      `I've scheduled our demo for ${formatDateWithTime(successData.nextSteps[0]?.date, successData.nextSteps[0]?.time)}. ` +
      `Please let me know if you need to adjust the timing.\n\n` +
      `Looking forward to speaking with you!\n\n` +
      `Best regards,\n${successData.crmOpportunity.owner}`
    );

    window.location.href = `mailto:${successData.lead.email}?subject=${subject}&body=${body}`;
    showToast('success', 'Email client opened');
  };

  const handleViewInCRM = () => {
    window.open(successData.crmOpportunity.crmUrl, '_blank');
    showToast('info', 'Opening CRM opportunity in new tab');
  };

  const handleBackToLeadList = () => {
    showToast('success', 'Lead qualified successfully');
    navigate(successData.redirectSettings.destination, {
      state: {
        qualifiedLeadId: successData.lead.id,
        highlightLead: true
      }
    });
  };

  const handleStartProposal = () => {
    navigate(`/proposals/new`, {
      state: {
        leadId: successData.lead.id,
        clientName: successData.lead.company,
        contactName: successData.lead.name,
        contactEmail: successData.lead.email,
        amount: successData.crmOpportunity.amount,
        closeDate: successData.crmOpportunity.closeDate,
        opportunityId: successData.crmOpportunity.id
      }
    });
    showToast('info', 'Opening proposal builder...');
  };

  const handleViewTemplate = () => {
    navigate('/templates/proposals');
    showToast('info', 'Opening proposal templates...');
  };

  const handleSendInvite = (step: typeof successData.nextSteps[0]) => {
    const subject = encodeURIComponent(`Invitation: ${step.title} - ${successData.lead.company}`);
    const body = encodeURIComponent(
      `Hi ${successData.lead.name.split(' ')[0]},\n\n` +
      `You're invited to: ${step.title}\n` +
      `When: ${formatDateWithTime(step.date, step.time)}\n` +
      `Description: ${step.description}\n\n` +
      `Meeting details:\n` +
      `• Zoom link will be provided\n` +
      `• Duration: 1 hour\n` +
      `• Please confirm your attendance\n\n` +
      `Looking forward to meeting with you!\n\n` +
      `Best regards,\n${successData.crmOpportunity.owner}`
    );

    window.location.href = `mailto:${successData.lead.email}?subject=${subject}&body=${body}`;
    showToast('success', 'Invitation email opened');
  };

  const handleScheduleMeeting = (step: typeof successData.nextSteps[0]) => {
    navigate('/calendar/schedule', {
      state: {
        title: step.title,
        description: step.description,
        leadId: successData.lead.id,
        leadName: successData.lead.name,
        leadEmail: successData.lead.email,
        company: successData.lead.company,
        suggestedDate: step.date
      }
    });
    showToast('info', 'Opening meeting scheduler...');
  };

  const handleActionClick = (actionType: string, step?: typeof successData.nextSteps[0]) => {
    switch (actionType) {
      case 'add_to_calendar':
        if (step) generateCalendarEvent(step);
        break;
      case 'send_invite':
        if (step) handleSendInvite(step);
        break;
      case 'start_proposal':
        handleStartProposal();
        break;
      case 'view_template':
        handleViewTemplate();
        break;
      case 'schedule_meeting':
        if (step) handleScheduleMeeting(step);
        break;
      default:
        showToast('info', `Action "${actionType}" triggered`);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-gray-600';
  };

  const getScoreBarFill = (score: number) => {
    return Math.round((score / 100) * 10);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SUCCESS!</h1>
          <p className="text-xl text-gray-600">Lead Qualified & Synced to CRM</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {successData.lead.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{successData.lead.name}</h2>
              <p className="text-gray-600">{successData.lead.title} @ {successData.lead.company}</p>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-gray-700">Status: {successData.lead.newStatus.charAt(0).toUpperCase() + successData.lead.newStatus.slice(1)}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    AI Score: <span className={`${getScoreColor(successData.scores.aiScore)} font-bold`}>{successData.scores.aiScore}/100</span>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-6 rounded-sm ${
                          i < getScoreBarFill(successData.scores.aiScore) ? 'bg-emerald-600' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    BANT Score: <span className="text-emerald-600 font-bold">{successData.scores.bantScore}/20</span> (Perfect)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">CRM OPPORTUNITY CREATED</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Opportunity ID</p>
              <p className="font-semibold text-gray-900">{successData.crmOpportunity.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Opportunity Name</p>
              <p className="font-semibold text-gray-900">{successData.crmOpportunity.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount</p>
              <p className="font-semibold text-gray-900">{formatCurrency(successData.crmOpportunity.amount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Close Date</p>
              <p className="font-semibold text-gray-900">{formatDate(successData.crmOpportunity.closeDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Stage</p>
              <p className="font-semibold text-gray-900">{successData.crmOpportunity.stage}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Probability</p>
              <p className="font-semibold text-gray-900">{successData.crmOpportunity.probability}%</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Owner</p>
              <p className="font-semibold text-gray-900">{successData.crmOpportunity.owner}</p>
            </div>
          </div>
          <button
            onClick={handleViewInCRM}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <ExternalLink className="h-4 w-4" />
            View in CRM
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-900">WHAT HAPPENED</h3>
          </div>
          <div className="space-y-2">
            {successData.syncSummary.actions.map((action, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{action.action}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-900">NEXT STEPS</h3>
          </div>
          <div className="space-y-4">
            {successData.nextSteps.map((step, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{step.step}. {step.title}</h4>
                    <p className="text-sm text-blue-600 font-medium">{formatDateWithTime(step.date, step.time)}</p>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
                {step.actions.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {step.actions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        onClick={() => handleActionClick(action.action, step)}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                          actionIndex === 0
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-900">NOTIFICATION SENT</h3>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex gap-2">
              <span className="text-sm font-medium text-gray-600 w-20">To:</span>
              <span className="text-sm text-gray-900">{successData.notification.to}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-sm font-medium text-gray-600 w-20">Subject:</span>
              <span className="text-sm text-gray-900">{successData.notification.subject}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-sm font-medium text-gray-600 w-20">Sent:</span>
              <span className="text-sm text-gray-900">{formatDateTime(successData.notification.sentAt)}</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 font-medium mb-2">Preview:</p>
            <p className="text-sm text-gray-700">{successData.notification.preview}</p>
          </div>
          <button
            onClick={() => navigate(successData.notification.fullEmailUrl)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View Full Email →
          </button>
        </div>

        {successData.proTip && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 p-6 mb-6">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">PRO TIP</h3>
                <p className="text-sm text-gray-700">
                  {successData.proTip.message}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={handleBackToLeadList}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lead List
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleViewInCRM}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              View in CRM
            </button>
            <button
              onClick={handleContactLead}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <Mail className="h-4 w-4" />
              Contact Lead
            </button>
          </div>
        </div>

        {autoRedirect && successData.redirectSettings.allowCancel && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Redirecting to Lead List in {countdown} seconds...{' '}
              <button
                onClick={handleCancelAutoRedirect}
                className="text-blue-600 hover:text-blue-700 font-medium underline"
              >
                Cancel Auto-redirect
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadQualificationSuccessPage;
