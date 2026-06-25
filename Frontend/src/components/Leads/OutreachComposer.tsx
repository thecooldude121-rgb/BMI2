import React, { useState, useEffect, useCallback } from 'react';
import { X, Mail, Phone, MessageSquare, Calendar, FileText, CheckCircle } from 'lucide-react';
import type { Lead, LeadActivity, ActivityType } from '../../types/lead';

// ── Static mock templates (TODO: replace with API call to templates service) ──
const TEMPLATES = [
  {
    id: 'cold_outreach',
    label: 'First Outreach',
    subject: 'Quick intro from [Your Company]',
    body: 'Hi {firstName},\n\nI came across {company} and wanted to reach out — we help teams like yours do [X] faster.\n\nWould it make sense to connect for 15 minutes?\n\nBest,\n[Your Name]',
  },
  {
    id: 'follow_up',
    label: 'Following Up',
    subject: 'Following up — {company}',
    body: 'Hi {firstName},\n\nJust following up on my previous message. I know things get busy — still happy to connect when the timing is right.\n\nBest,\n[Your Name]',
  },
  {
    id: 'meeting_request',
    label: 'Meeting Request',
    subject: 'Quick call — {company}?',
    body: 'Hi {firstName},\n\nWould you be open to a 20-minute call to explore if we can help {company} with [problem area]?\n\nBest,\n[Your Name]',
  },
  {
    id: 're_engagement',
    label: 'Checking In',
    subject: 'Checking in — {company}',
    body: 'Hi {firstName},\n\nWanted to check in and see if now might be a better time to connect. A lot has changed on our end since we last spoke.\n\nBest,\n[Your Name]',
  },
];

const CALL_OUTCOMES = ['Connected', 'Voicemail', 'No Answer', 'Scheduled Meeting', 'Left Message', 'Not Interested'];
const WHATSAPP_OUTCOMES = ['Replied', 'Seen', 'Delivered', 'No Response', 'Scheduled Meeting'];
const MEETING_STATUSES = ['Scheduled', 'Completed', 'No Show', 'Cancelled'];

interface ComposerFormData {
  subject:        string;
  body:           string;
  templateId:     string;
  direction:      'outbound' | 'inbound';
  duration:       string;
  notes:          string;
  outcome:        string;
  title:          string;
  dateTime:       string;
  durationSelect: string;
  meetingUrl:     string;
  meetingStatus:  string;
  content:        string;
  isPinned:       boolean;
  taskTitle:      string;
  taskDueDate:    string;
  taskPriority:   'low' | 'medium' | 'high';
  taskType:       'call' | 'email' | 'meeting' | 'other';
}

type Channel = 'email' | 'call' | 'whatsapp' | 'meeting' | 'note' | 'task';

const CHANNELS: { id: Channel; label: string }[] = [
  { id: 'email',    label: 'Email' },
  { id: 'call',     label: 'Call' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'meeting',  label: 'Meeting' },
  { id: 'note',     label: 'Note' },
  { id: 'task',     label: 'Task' },
];

const CHANNEL_ICONS: Record<Channel, React.ReactNode> = {
  email:    <Mail className="h-3.5 w-3.5" />,
  call:     <Phone className="h-3.5 w-3.5" />,
  whatsapp: <MessageSquare className="h-3.5 w-3.5" />,
  meeting:  <Calendar className="h-3.5 w-3.5" />,
  note:     <FileText className="h-3.5 w-3.5" />,
  task:     <CheckCircle className="h-3.5 w-3.5" />,
};

const CHANNEL_ACCENT: Record<Channel, string> = {
  email:    'bg-blue-600 hover:bg-blue-700',
  call:     'bg-green-600 hover:bg-green-700',
  whatsapp: 'bg-emerald-600 hover:bg-emerald-700',
  meeting:  'bg-purple-600 hover:bg-purple-700',
  note:     'bg-gray-700 hover:bg-gray-800',
  task:     'bg-orange-600 hover:bg-orange-700',
};

const CHANNEL_ACTIVE: Record<Channel, string> = {
  email:    'bg-blue-600 text-white',
  call:     'bg-green-600 text-white',
  whatsapp: 'bg-emerald-600 text-white',
  meeting:  'bg-purple-600 text-white',
  note:     'bg-gray-700 text-white',
  task:     'bg-orange-600 text-white',
};

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const INITIAL_FORM: ComposerFormData = {
  subject:        '',
  body:           '',
  templateId:     '',
  direction:      'outbound',
  duration:       '',
  notes:          '',
  outcome:        '',
  title:          '',
  dateTime:       '',
  durationSelect: '30',
  meetingUrl:     '',
  meetingStatus:  'Scheduled',
  content:        '',
  isPinned:       false,
  taskTitle:      '',
  taskDueDate:    tomorrow(),
  taskPriority:   'medium',
  taskType:       'call',
};

export interface OutreachFollowUp {
  date: string;
  type: 'call' | 'email' | 'meeting';
}

interface Props {
  lead:            Lead;
  initialChannel?: ActivityType;
  onSubmit:        (activity: LeadActivity, followUp?: OutreachFollowUp) => void;
  onClose:         () => void;
}

const leadName = (lead: Lead) =>
  lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—';

const OutreachComposer: React.FC<Props> = ({ lead, initialChannel = 'email', onSubmit, onClose }) => {
  const [activeChannel, setActiveChannel] = useState<Channel>(initialChannel as Channel);
  const [form, setForm] = useState<ComposerFormData>(INITIAL_FORM);
  const [followUpEnabled,   setFollowUpEnabled]   = useState(false);
  const [followUpDate,      setFollowUpDate]       = useState(tomorrow());
  const [followUpType,      setFollowUpType]       = useState<'call' | 'email' | 'meeting'>('call');
  const [followUpHighlight, setFollowUpHighlight]  = useState(false);

  const set = useCallback(
    (field: keyof ComposerFormData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value })),
    [],
  );

  const setField = useCallback(
    <K extends keyof ComposerFormData>(field: K, value: ComposerFormData[K]) =>
      setForm(prev => ({ ...prev, [field]: value })),
    [],
  );

  // Auto-highlight follow-up strip when call outcome = "Scheduled Meeting"
  useEffect(() => {
    if ((activeChannel === 'call' || activeChannel === 'whatsapp') && form.outcome === 'Scheduled Meeting') {
      setFollowUpEnabled(true);
      setFollowUpType('meeting');
      setFollowUpHighlight(true);
      const t = setTimeout(() => setFollowUpHighlight(false), 2500);
      return () => clearTimeout(t);
    }
  }, [form.outcome, activeChannel]);

  const applyTemplate = (tplId: string) => {
    const tpl = TEMPLATES.find(t => t.id === tplId);
    if (!tpl) return;
    const first = leadName(lead).split(' ')[0] || 'there';
    const company = lead.company || '';
    setForm(prev => ({
      ...prev,
      templateId: tplId,
      subject: tpl.subject.replace('{firstName}', first).replace('{company}', company),
      body:    tpl.body   .replace('{firstName}', first).replace('{company}', company),
    }));
  };

  const isValid = () => {
    switch (activeChannel) {
      case 'email':    return form.subject.trim().length > 0 && form.body.trim().length > 0;
      case 'call':     return true;
      case 'whatsapp': return form.notes.trim().length > 0 || form.content.trim().length > 0;
      case 'meeting':  return form.title.trim().length > 0;
      case 'note':     return form.content.trim().length > 0;
      case 'task':     return form.taskTitle.trim().length > 0;
      default:         return true;
    }
  };

  const handleSubmit = () => {
    const now = new Date().toISOString();
    const name = leadName(lead);
    const base = {
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      lead_id: lead.id,
      participants: [],
      attendees: [],
      attachments: [],
      related_entities: [],
      custom_fields: {},
      automation_triggered: false,
      created_at: now,
      updated_at: now,
      created_by: 'current_user', // TODO: replace with auth context user id
      owner_id: lead.owner_id,
    };

    let activity: LeadActivity;

    switch (activeChannel) {
      case 'email':
        activity = { ...base, type: 'email', direction: 'outbound', status: 'completed',
          subject: form.subject || `Email to ${name}`, description: form.body, completed_at: now };
        break;
      case 'call':
        activity = { ...base, type: 'call', direction: form.direction, status: 'completed',
          subject: `${form.direction === 'outbound' ? 'Outbound' : 'Inbound'} call with ${name}`,
          description: form.notes || undefined,
          outcome: form.outcome || undefined,
          duration_minutes: form.duration ? parseInt(form.duration, 10) : undefined,
          completed_at: now };
        break;
      case 'whatsapp':
        activity = { ...base, type: 'whatsapp', direction: form.direction, status: 'completed',
          subject: `WhatsApp ${form.direction === 'outbound' ? 'to' : 'from'} ${name}`,
          description: form.notes || form.content || undefined,
          outcome: form.outcome || undefined,
          completed_at: now };
        break;
      case 'meeting': {
        const isScheduled = form.meetingStatus === 'Scheduled';
        const mappedStatus: LeadActivity['status'] =
          isScheduled           ? 'planned'   :
          form.meetingStatus === 'No Show'    ? 'no_show'   :
          form.meetingStatus === 'Cancelled'  ? 'cancelled' : 'completed';
        activity = { ...base, type: 'meeting', status: mappedStatus,
          subject: form.title || `Meeting with ${name}`,
          description: form.notes || undefined,
          meeting_url: form.meetingUrl || undefined,
          scheduled_at: form.dateTime || undefined,
          duration_minutes: form.durationSelect ? parseInt(form.durationSelect, 10) : undefined,
          completed_at: isScheduled ? undefined : now };
        break;
      }
      case 'note':
        activity = { ...base, type: 'note', status: 'completed',
          subject: 'Note', description: form.content, completed_at: now };
        break;
      case 'task':
        activity = { ...base, type: 'task', status: 'planned',
          subject: form.taskTitle, description: form.notes || undefined,
          scheduled_at: form.taskDueDate ? new Date(form.taskDueDate).toISOString() : undefined };
        break;
      default:
        return;
    }

    const followUp: OutreachFollowUp | undefined = followUpEnabled
      ? { date: followUpDate, type: followUpType }
      : undefined;

    onSubmit(activity, followUp);
  };

  // ── Channel-specific form sections ────────────────────────────────────────

  const renderEmailForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">To</label>
        <input type="email" value={lead.email || '—'} readOnly
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-default" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Template</label>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map(tpl => (
            <button key={tpl.id} onClick={() => applyTemplate(tpl.id)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                form.templateId === tpl.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
              }`}>
              {tpl.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Subject</label>
        <input type="text" value={form.subject} onChange={set('subject')} placeholder="Enter subject…"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Message</label>
        <textarea rows={6} value={form.body} onChange={set('body')} placeholder="Enter your message…"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
    </div>
  );

  const renderCallForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Direction</label>
        <div className="flex gap-2">
          {(['outbound', 'inbound'] as const).map(dir => (
            <button key={dir} onClick={() => setField('direction', dir)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors capitalize ${
                form.direction === dir
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
              }`}>
              {dir}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Duration (minutes)</label>
        <input type="number" min="1" value={form.duration} onChange={set('duration')} placeholder="e.g. 15"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</label>
        <textarea rows={3} value={form.notes} onChange={set('notes')} placeholder="Call notes…"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Outcome</label>
        <div className="flex flex-wrap gap-2">
          {CALL_OUTCOMES.map(o => (
            <button key={o} onClick={() => setField('outcome', form.outcome === o ? '' : o)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                form.outcome === o
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-400 hover:text-green-700'
              }`}>
              {o}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWhatsAppForm = () => (
    <div className="space-y-4">
      <div className="px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
        Messages sent manually — connect WhatsApp Business API in Settings to enable sending from here.
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Direction</label>
        <div className="flex gap-2">
          {(['outbound', 'inbound'] as const).map(dir => (
            <button key={dir} onClick={() => setField('direction', dir)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors capitalize ${
                form.direction === dir
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'
              }`}>
              {dir}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Message</label>
        <textarea rows={4} value={form.notes} onChange={set('notes')} placeholder="Message content…"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Outcome</label>
        <div className="flex flex-wrap gap-2">
          {WHATSAPP_OUTCOMES.map(o => (
            <button key={o} onClick={() => setField('outcome', form.outcome === o ? '' : o)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                form.outcome === o
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400 hover:text-emerald-700'
              }`}>
              {o}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMeetingForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Title</label>
        <input type="text" value={form.title} onChange={set('title')} placeholder="e.g. Discovery Call"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date & Time</label>
          <input type="datetime-local" value={form.dateTime} onChange={set('dateTime')}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Duration</label>
          <select value={form.durationSelect} onChange={set('durationSelect')}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Meeting URL</label>
        <input type="url" value={form.meetingUrl} onChange={set('meetingUrl')} placeholder="https://meet.google.com/…"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</label>
        <textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="Agenda, talking points…"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</label>
        <div className="flex flex-wrap gap-2">
          {MEETING_STATUSES.map(s => (
            <button key={s} onClick={() => setField('meetingStatus', s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                form.meetingStatus === s
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400 hover:text-purple-700'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNoteForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Note</label>
        <textarea rows={8} value={form.content} onChange={set('content')} placeholder="Enter your note…"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="oc-pin-note" checked={form.isPinned}
          onChange={e => setField('isPinned', e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600" />
        <label htmlFor="oc-pin-note" className="text-sm text-gray-700">Pin this note</label>
      </div>
    </div>
  );

  const renderTaskForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Title</label>
        <input type="text" value={form.taskTitle} onChange={set('taskTitle')} placeholder="Task title…"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Due Date</label>
        <input type="date" value={form.taskDueDate} onChange={set('taskDueDate')}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Priority</label>
        <div className="flex gap-2">
          {(['low', 'medium', 'high'] as const).map(p => (
            <button key={p} onClick={() => setField('taskPriority', p)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg border capitalize transition-colors ${
                form.taskPriority === p
                  ? p === 'high'   ? 'bg-red-600    text-white border-red-600'
                  : p === 'medium' ? 'bg-amber-500  text-white border-amber-500'
                                   : 'bg-blue-500   text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type</label>
        <div className="flex flex-wrap gap-2">
          {(['call', 'email', 'meeting', 'other'] as const).map(t => (
            <button key={t} onClick={() => setField('taskType', t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border capitalize transition-colors ${
                form.taskType === t
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400 hover:text-orange-700'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</label>
        <textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="Additional details…"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
      </div>
    </div>
  );

  const renderForm = () => {
    switch (activeChannel) {
      case 'email':    return renderEmailForm();
      case 'call':     return renderCallForm();
      case 'whatsapp': return renderWhatsAppForm();
      case 'meeting':  return renderMeetingForm();
      case 'note':     return renderNoteForm();
      case 'task':     return renderTaskForm();
      default:         return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-900">Log Outreach</h3>
            <p className="text-xs text-gray-500 mt-0.5">{leadName(lead)} · {lead.company || '—'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Channel bar */}
        <div className="flex gap-1 px-5 pt-4 pb-3 flex-shrink-0 border-b border-gray-100">
          {CHANNELS.map(ch => (
            <button key={ch.id} onClick={() => setActiveChannel(ch.id)} title={ch.label}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex-1 justify-center ${
                activeChannel === ch.id ? CHANNEL_ACTIVE[ch.id] : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {CHANNEL_ICONS[ch.id]}
              <span className="hidden sm:inline">{ch.label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable form area */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {renderForm()}

          {/* ── Follow-up strip ──────────────────────────────────────────── */}
          <div className={`mt-5 p-3 rounded-xl border-2 transition-all duration-300 ${
            followUpHighlight
              ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200'
              : followUpEnabled
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" id="oc-followup" checked={followUpEnabled}
                onChange={e => setFollowUpEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer" />
              <label htmlFor="oc-followup" className="text-xs font-semibold text-gray-700 uppercase tracking-wide cursor-pointer select-none">
                Set follow-up
                {followUpHighlight && (
                  <span className="ml-2 normal-case font-normal text-amber-700">— meeting detected, pre-selected</span>
                )}
              </label>
            </div>
            {followUpEnabled && (
              <div className="flex gap-2 items-center mt-2">
                <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex gap-1">
                  {(['call', 'email', 'meeting'] as const).map(t => (
                    <button key={t} onClick={() => setFollowUpType(t)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border capitalize transition-colors ${
                        followUpType === t
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!isValid()}
            className={`flex-1 px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${CHANNEL_ACCENT[activeChannel]}`}>
            Log & Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutreachComposer;
export type { Channel as OutreachChannel };
