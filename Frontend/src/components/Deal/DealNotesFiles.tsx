import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Upload, Edit, Trash2, Plus, Download, Eye, X,
  Search, Sparkles, ChevronDown, ChevronUp, Copy,
  Link2, Check, Layers,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

// ── Tag config (Notes) ────────────────────────────────────────────────────────

const TOPIC_TAGS = ['Pricing', 'Stakeholder', 'Competitor', 'Risk', 'Technical', 'Follow-up'] as const;
const TOPIC_GROUP_ORDER = ['Competitor', 'Follow-up', 'Pricing', 'Risk', 'Stakeholder', 'Technical', 'Untagged'];

interface TagCfg { bg: string; text: string; border: string; header: string }
const TAG_CONFIG: Record<string, TagCfg> = {
  Pricing:     { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200',   header: 'text-blue-700 bg-blue-50 border-blue-100'     },
  Stakeholder: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', header: 'text-purple-700 bg-purple-50 border-purple-100' },
  Competitor:  { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200',    header: 'text-red-600 bg-red-50 border-red-100'          },
  Risk:        { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-200',  header: 'text-amber-700 bg-amber-50 border-amber-100'   },
  Technical:   { bg: 'bg-gray-100',   text: 'text-gray-600',   border: 'border-gray-200',   header: 'text-gray-600 bg-gray-50 border-gray-100'      },
  'Follow-up': { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200',  header: 'text-green-700 bg-green-50 border-green-100'   },
  Untagged:    { bg: 'bg-gray-100',   text: 'text-gray-500',   border: 'border-gray-200',   header: 'text-gray-500 bg-gray-50 border-gray-100'      },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface NoteData {
  id: string;
  date: string;
  author: string;
  content: string;
  tags: string[];
}

export interface FileData {
  id: string;
  name: string;
  size: string;
  date: string;
  uploadedBy: string;
  version: number;
  isLatest: boolean;
  isSuperseded: boolean;
  baseId: string;
  isSharedWithBuyer: boolean;
  shareLink?: string;
  buyerOpenedAt?: string;
}

interface DealNotesFilesProps {
  notes: Array<{ id: string; date: string; author: string; content: string; tags?: string[] }>;
  files: FileData[];
}

// ── Author avatar helpers ─────────────────────────────────────────────────────

const AUTHOR_COLORS: Record<string, string> = {
  'Alex Rodriguez': 'from-blue-500 to-blue-600',
  'Sarah Lee':      'from-purple-500 to-purple-600',
  'John Smith':     'from-green-500 to-green-600',
  'Mike Chen':      'from-orange-500 to-orange-600',
  'Emma Wilson':    'from-pink-500 to-pink-600',
};
const authorGradient = (name: string) => AUTHOR_COLORS[name] ?? 'from-gray-500 to-gray-600';
const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

// ── @mention team ─────────────────────────────────────────────────────────────

const TEAM = ['Alex Rodriguez', 'Sarah Lee', 'John Smith', 'Mike Chen', 'Emma Wilson'];

// ── File type icon ────────────────────────────────────────────────────────────

function FileTypeIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const cfgMap: Record<string, { bg: string; text: string; label: string }> = {
    pdf:  { bg: 'bg-red-100',    text: 'text-red-700',    label: 'PDF'  },
    xlsx: { bg: 'bg-green-100',  text: 'text-green-700',  label: 'XLS'  },
    xls:  { bg: 'bg-green-100',  text: 'text-green-700',  label: 'XLS'  },
    pptx: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'PPT'  },
    ppt:  { bg: 'bg-orange-100', text: 'text-orange-700', label: 'PPT'  },
    docx: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'DOC'  },
    doc:  { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'DOC'  },
  };
  const cfg = cfgMap[ext] ?? { bg: 'bg-gray-100', text: 'text-gray-600', label: ext.toUpperCase().slice(0, 4) || 'FILE' };
  return (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
      <span className={`text-[10px] font-bold tracking-wide ${cfg.text}`}>{cfg.label}</span>
    </div>
  );
}

// ── Base name extraction for version matching ─────────────────────────────────

function extractBaseName(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  const nameNoExt = lastDot >= 0 ? filename.slice(0, lastDot) : filename;
  return nameNoExt.replace(/[_ ]v\d+$/i, '').toLowerCase().trim();
}

// ── Lightweight markdown renderer (Notes) ─────────────────────────────────────

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(@\w+)/g;
  let lastIndex = 0;
  let idx = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[1]) {
      parts.push(<strong key={`${keyPrefix}-b${idx++}`} className="font-semibold text-gray-900">{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={`${keyPrefix}-i${idx++}`} className="italic text-gray-800">{match[4]}</em>);
    } else {
      const handle = match[0].slice(1);
      const fullName = TEAM.find(m => m.toLowerCase().startsWith(handle.toLowerCase())) ?? handle;
      parts.push(
        <span key={`${keyPrefix}-m${idx++}`} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 rounded px-1.5 py-0.5 text-[11px] font-medium mx-0.5 align-middle">
          <span className={`w-4 h-4 bg-gradient-to-br ${authorGradient(fullName)} text-white rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0`}>
            {initials(fullName)}
          </span>
          @{fullName.split(' ')[0]}
        </span>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function renderMarkdown(content: string): React.ReactNode {
  const lines = content.split('\n');
  const nodes: React.ReactNode[] = [];
  let bulletItems: React.ReactNode[] = [];
  let lineKey = 0;
  const flushBullets = () => {
    if (!bulletItems.length) return;
    nodes.push(<ul key={`ul-${lineKey++}`} className="space-y-1 my-1.5 ml-1">{bulletItems}</ul>);
    bulletItems = [];
  };
  for (const line of lines) {
    if (line.startsWith('- ')) {
      bulletItems.push(
        <li key={`li-${lineKey++}`} className="flex items-start gap-2 text-sm text-gray-700">
          <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
          <span className="leading-relaxed">{renderInline(line.slice(2), `li${lineKey}`)}</span>
        </li>
      );
    } else {
      flushBullets();
      if (line.trim()) {
        nodes.push(<p key={`p-${lineKey++}`} className="text-sm text-gray-700 leading-relaxed">{renderInline(line, `p${lineKey}`)}</p>);
      } else if (nodes.length > 0) {
        nodes.push(<div key={`sp-${lineKey++}`} className="h-1.5" />);
      }
    }
  }
  flushBullets();
  return <div className="space-y-0.5">{nodes}</div>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function TagPill({ tag, small = false }: { tag: string; small?: boolean }) {
  const cfg = TAG_CONFIG[tag] ?? TAG_CONFIG['Untagged'];
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${cfg.bg} ${cfg.text} ${cfg.border} ${small ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5 text-xs'}`}>
      {tag}
    </span>
  );
}

const charCountCx = (len: number) =>
  len > 1900 ? 'text-red-600 font-semibold' : len > 1600 ? 'text-amber-600' : 'text-gray-400';

const AI_SUMMARY =
  'John Smith (VP Sales, Champion) is actively engaged with a 92% response rate ' +
  'and has confirmed a $50K budget for Q1 2026 implementation. ' +
  'The primary risk is competitive pressure from Salesforce — the deal needs a strong integration story ' +
  'and ROI demonstration to differentiate effectively. ' +
  'Immediate next priority is securing a CEO introduction for final sign-off, ' +
  'alongside a technical stakeholder demo due by December 10.';

// ── Component ─────────────────────────────────────────────────────────────────

export const DealNotesFiles: React.FC<DealNotesFilesProps> = ({ notes, files }) => {
  const { showToast } = useToast();

  // ── Notes state ──────────────────────────────────────────────────────────────
  const [localNotes, setLocalNotes] = useState<NoteData[]>(() =>
    notes.map(n => ({ ...n, tags: n.tags ?? [] }))
  );
  const [searchQuery, setSearchQuery]         = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState('All');
  const [sortOrder, setSortOrder]             = useState<'newest' | 'oldest' | 'topic'>('newest');
  const [showAddNote, setShowAddNote]         = useState(false);
  const [noteText, setNoteText]               = useState('');
  const [newNoteTags, setNewNoteTags]         = useState<string[]>([]);
  const [editingNoteId, setEditingNoteId]     = useState<string | null>(null);
  const [editText, setEditText]               = useState('');
  const [aiState, setAiState]                 = useState<'idle' | 'loading' | 'streaming' | 'done'>('idle');
  const [aiText, setAiText]                   = useState('');
  const [aiCollapsed, setAiCollapsed]         = useState(false);

  // ── Files state ───────────────────────────────────────────────────────────────
  const [localFiles, setLocalFiles]           = useState<FileData[]>(() => [...files]);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [pendingUpload, setPendingUpload]     = useState<{ rawName: string; matchedFile: FileData } | null>(null);
  const fileInputRef                          = useRef<HTMLInputElement>(null);

  // ── Shared delete confirm ─────────────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget]           = useState<{ type: 'note' | 'file'; id: string } | null>(null);

  // ── AI streaming ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (aiState !== 'streaming') return;
    const words = AI_SUMMARY.split(' ');
    let idx = 0;
    const iv = setInterval(() => {
      idx++;
      setAiText(words.slice(0, idx).join(' '));
      if (idx >= words.length) { clearInterval(iv); setAiState('done'); }
    }, 50);
    return () => clearInterval(iv);
  }, [aiState]);

  // ── Notes derived ─────────────────────────────────────────────────────────────
  const filteredNotes = localNotes.filter(note => {
    const matchesSearch = !searchQuery || note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag    = activeTagFilter === 'All' || note.tags.includes(activeTagFilter);
    return matchesSearch && matchesTag;
  });
  const sortedNotes: NoteData[] =
    sortOrder === 'newest' ? [...filteredNotes].reverse() :
    sortOrder === 'oldest' ? [...filteredNotes] :
    [...filteredNotes];
  const topicGroups: { tag: string; notes: NoteData[] }[] = (() => {
    if (sortOrder !== 'topic') return [];
    const map = new Map<string, NoteData[]>();
    for (const note of filteredNotes) {
      const tag = note.tags[0] ?? 'Untagged';
      if (!map.has(tag)) map.set(tag, []);
      map.get(tag)!.push(note);
    }
    return TOPIC_GROUP_ORDER.filter(t => map.has(t)).map(t => ({ tag: t, notes: map.get(t)! }));
  })();

  // ── Files derived ─────────────────────────────────────────────────────────────
  const fileGroups: { latest: FileData; previous: FileData[] }[] = (() => {
    const map = new Map<string, FileData[]>();
    for (const f of localFiles) {
      if (!map.has(f.baseId)) map.set(f.baseId, []);
      map.get(f.baseId)!.push(f);
    }
    return Array.from(map.values()).map(versions => {
      const sorted = [...versions].sort((a, b) => b.version - a.version);
      return {
        latest: sorted.find(f => f.isLatest) ?? sorted[0],
        previous: sorted.filter(f => f.isSuperseded),
      };
    });
  })();

  const activeFiles    = localFiles.filter(f => f.isLatest);
  const sharedCount    = activeFiles.filter(f => f.isSharedWithBuyer).length;
  const notOpenedCount = activeFiles.filter(f => f.isSharedWithBuyer && !f.buyerOpenedAt).length;

  // ── Notes handlers ────────────────────────────────────────────────────────────
  const handleSaveNote = () => {
    if (!noteText.trim()) { showToast('warning', 'Please enter note content'); return; }
    setLocalNotes(prev => [{
      id: String(Date.now()),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      author: 'Alex Rodriguez',
      content: noteText.trim(),
      tags: newNoteTags,
    }, ...prev]);
    setNoteText(''); setNewNoteTags([]); setShowAddNote(false);
    showToast('success', 'Note saved successfully!');
  };
  const handleSaveEdit = (noteId: string) => {
    setLocalNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: editText } : n));
    setEditingNoteId(null); setEditText('');
    showToast('success', 'Note updated successfully!');
  };
  const toggleNewNoteTag = (tag: string) =>
    setNewNoteTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  // ── File handlers ─────────────────────────────────────────────────────────────
  const handleSendToBuyer = (fileId: string) => {
    const token = Math.random().toString(36).substring(2, 10);
    const link = `https://bmi.app/share/${token}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setLocalFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, shareLink: link, isSharedWithBuyer: true } : f
    ));
    showToast('success', 'Share link generated and copied to clipboard!');
  };

  const handleToggleShared = (fileId: string) => {
    setLocalFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, isSharedWithBuyer: !f.isSharedWithBuyer } : f
    ));
  };

  const toggleVersionExpand = (baseId: string) => {
    setExpandedVersions(prev => {
      const next = new Set(prev);
      next.has(baseId) ? next.delete(baseId) : next.add(baseId);
      return next;
    });
  };

  const addFileAsNew = (name: string, version: number, baseId: string | null) => {
    const newId = String(Date.now());
    setLocalFiles(prev => [...prev, {
      id: newId,
      name,
      size: 'Just uploaded',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      uploadedBy: 'Alex Rodriguez',
      version,
      isLatest: true,
      isSuperseded: false,
      baseId: baseId ?? newId,
      isSharedWithBuyer: false,
    }]);
    showToast('success', `${name} uploaded successfully!`);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const newBase = extractBaseName(file.name);
    const match = localFiles.find(f => f.isLatest && extractBaseName(f.name) === newBase);
    if (match) {
      setPendingUpload({ rawName: file.name, matchedFile: match });
    } else {
      addFileAsNew(file.name, 1, null);
    }
  };

  const handleConfirmVersion = () => {
    if (!pendingUpload) return;
    const { rawName, matchedFile } = pendingUpload;
    setLocalFiles(prev => prev.map(f =>
      f.id === matchedFile.id ? { ...f, isLatest: false, isSuperseded: true } : f
    ));
    addFileAsNew(rawName, matchedFile.version + 1, matchedFile.baseId);
    setPendingUpload(null);
  };

  const handleRejectVersion = () => {
    if (!pendingUpload) return;
    addFileAsNew(pendingUpload.rawName, 1, null);
    setPendingUpload(null);
  };

  // ── Shared delete handler ─────────────────────────────────────────────────────
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'note') {
      setLocalNotes(prev => prev.filter(n => n.id !== deleteTarget.id));
    } else {
      setLocalFiles(prev => prev.filter(f => f.id !== deleteTarget.id));
    }
    showToast('success', `${deleteTarget.type === 'note' ? 'Note' : 'File'} deleted successfully!`);
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  // ── Note card render ──────────────────────────────────────────────────────────
  const renderNoteCard = (note: NoteData) => (
    <div key={note.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-200 transition-colors shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 bg-gradient-to-br ${authorGradient(note.author)} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}>
            {initials(note.author)}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{note.author}</div>
            <div className="text-xs text-gray-500">{note.date}</div>
          </div>
        </div>
        {editingNoteId !== note.id && (
          <div className="flex items-center gap-1">
            <button onClick={() => { setEditingNoteId(note.id); setEditText(note.content); }} className="p-1.5 hover:bg-gray-100 rounded transition-colors">
              <Edit className="h-3.5 w-3.5 text-gray-500" />
            </button>
            <button onClick={() => { setDeleteTarget({ type: 'note', id: note.id }); setShowDeleteConfirm(true); }} className="p-1.5 hover:bg-gray-100 rounded transition-colors">
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </button>
          </div>
        )}
      </div>
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {note.tags.map(tag => <TagPill key={tag} tag={tag} small />)}
        </div>
      )}
      {editingNoteId === note.id ? (
        <>
          <div className="relative">
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value.slice(0, 2000))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none pb-6"
              rows={4}
            />
            <span className={`absolute bottom-2 right-2 text-xs pointer-events-none ${charCountCx(editText.length)}`}>
              {editText.length}/2000
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button onClick={() => handleSaveEdit(note.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Save</button>
            <button onClick={() => { setEditingNoteId(null); setEditText(''); }} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">Cancel</button>
          </div>
        </>
      ) : (
        <div className="mt-0.5">{renderMarkdown(note.content)}</div>
      )}
    </div>
  );

  // ── File card render ──────────────────────────────────────────────────────────
  const renderFileCard = (file: FileData, previousVersions: FileData[]) => (
    <div key={file.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Main row */}
      <div className="p-4 bg-white">
        <div className="flex items-start gap-3">
          <FileTypeIcon name={file.name} />
          <div className="flex-1 min-w-0">
            {/* Row 1: name + version badge + actions */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                <span className="text-sm font-semibold text-gray-900 truncate">{file.name}</span>
                <span className="flex-shrink-0 flex items-center gap-1">
                  <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                    v{file.version}
                  </span>
                  {file.version > 1 && file.isLatest && (
                    <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">
                      Latest
                    </span>
                  )}
                </span>
              </div>
              {/* Action buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleSendToBuyer(file.id)}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-md text-[11px] font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  <Link2 className="h-3 w-3" />
                  {file.shareLink ? 'Resend' : 'Send to Buyer'}
                </button>
                <button onClick={() => showToast('info', `Previewing ${file.name}...`)} className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                  <Eye className="h-3.5 w-3.5 text-gray-500" />
                </button>
                <button onClick={() => showToast('success', `Downloading ${file.name}...`)} className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                  <Download className="h-3.5 w-3.5 text-gray-500" />
                </button>
                <button onClick={() => { setDeleteTarget({ type: 'file', id: file.id }); setShowDeleteConfirm(true); }} className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </button>
              </div>
            </div>

            {/* Row 2: meta */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
              <span>{file.size}</span>
              <span>·</span>
              <span>{file.date}</span>
              <span>·</span>
              <div className="flex items-center gap-1">
                <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${authorGradient(file.uploadedBy)} flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0`}>
                  {initials(file.uploadedBy)}
                </div>
                <span>{file.uploadedBy}</span>
              </div>
            </div>

            {/* Row 3: share link (if any) */}
            {file.shareLink && (
              <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-400">
                <Link2 className="h-3 w-3 flex-shrink-0" />
                <span className="truncate font-mono text-[11px]">{file.shareLink}</span>
              </div>
            )}

            {/* Row 4: shared toggle + viewed indicator */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => handleToggleShared(file.id)}
                className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border transition-all ${
                  file.isSharedWithBuyer
                    ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                    : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                }`}
              >
                {file.isSharedWithBuyer && <Check className="h-3 w-3" />}
                {file.isSharedWithBuyer ? 'Shared with buyer' : 'Mark as shared'}
              </button>

              {file.isSharedWithBuyer && (
                <span className={`flex items-center gap-1 text-xs ${file.buyerOpenedAt ? 'text-green-600' : 'text-gray-400'}`}>
                  <Eye className="h-3 w-3" />
                  {file.buyerOpenedAt ? `Opened ${file.buyerOpenedAt}` : 'Not yet opened'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Version history toggle */}
      {previousVersions.length > 0 && (
        <>
          <div className="border-t border-gray-100">
            <button
              onClick={() => toggleVersionExpand(file.baseId)}
              className="w-full flex items-center gap-1.5 px-4 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
            >
              {expandedVersions.has(file.baseId)
                ? <ChevronUp className="h-3.5 w-3.5" />
                : <ChevronDown className="h-3.5 w-3.5" />
              }
              <span>
                {expandedVersions.has(file.baseId) ? 'Hide' : 'Show'} previous version{previousVersions.length > 1 ? 's' : ''}
                {' '}({previousVersions.map(v => `v${v.version}`).join(', ')})
              </span>
            </button>
          </div>

          {expandedVersions.has(file.baseId) && (
            <div className="border-t border-gray-100 bg-gray-50">
              {previousVersions.map(prev => (
                <div key={prev.id} className="px-4 py-3 flex items-center gap-3 border-b border-gray-100 last:border-0 opacity-60">
                  <FileTypeIcon name={prev.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm text-gray-600 truncate">{prev.name}</span>
                      <span className="text-[10px] font-medium bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded flex-shrink-0">v{prev.version}</span>
                      <span className="text-[10px] italic text-gray-400 flex-shrink-0">Superseded</span>
                    </div>
                    <div className="text-xs text-gray-400">{prev.size} · {prev.date} · {prev.uploadedBy}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  // ── Return ────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-6">
        <FileText className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Notes & Files</h2>
      </div>

      {/* ═══════════════════════════════ NOTES ═══════════════════════════════ */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Internal Notes ({localNotes.length})</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setAiState('loading'); setAiText(''); setAiCollapsed(false); setTimeout(() => setAiState('streaming'), 1200); }}
              disabled={aiState === 'loading' || aiState === 'streaming' || localNotes.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {aiState === 'loading'
                ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Sparkles className="h-3.5 w-3.5" />
              }
              AI Summarise
            </button>
            <button onClick={() => setShowAddNote(v => !v)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4" />
              Add Note
            </button>
          </div>
        </div>

        {/* AI summary card */}
        {aiState !== 'idle' && (
          <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-900">AI Notes Summary</span>
              </div>
              <div className="flex items-center gap-1">
                {aiState === 'done' && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(AI_SUMMARY).catch(() => {}); showToast('success', 'Summary copied to clipboard'); }}
                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 px-2 py-1 rounded hover:bg-purple-100 transition-colors"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                )}
                <button onClick={() => setAiCollapsed(v => !v)} className="p-1 text-purple-400 hover:text-purple-600 hover:bg-purple-100 rounded transition-colors">
                  {aiCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {!aiCollapsed && (
              <div className="px-4 py-3 min-h-[48px]">
                {aiState === 'loading'
                  ? <div className="flex items-center gap-2 text-sm text-purple-600">
                      <span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      Analysing notes…
                    </div>
                  : <p className="text-sm text-gray-800 leading-relaxed">
                      {aiText}
                      {aiState === 'streaming' && <span className="inline-block w-0.5 h-[14px] bg-purple-600 ml-0.5 align-middle animate-pulse" />}
                    </p>
                }
              </div>
            )}
          </div>
        )}

        {/* Add note form */}
        {showAddNote && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-600 mb-1.5">Tag this note:</p>
              <div className="flex flex-wrap gap-1.5">
                {TOPIC_TAGS.map(tag => {
                  const cfg = TAG_CONFIG[tag];
                  const selected = newNoteTags.includes(tag);
                  return (
                    <button key={tag} type="button" onClick={() => toggleNewNoteTag(tag)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${selected ? `${cfg.bg} ${cfg.text} ${cfg.border}` : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'}`}
                    >
                      {selected && <span className="text-[10px] leading-none">✓</span>}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="relative">
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value.slice(0, 2000))}
                placeholder="Add your note here… Supports **bold**, *italic*, - bullet lists, @mentions"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none pb-6"
                rows={4}
              />
              <span className={`absolute bottom-2 right-2 text-xs pointer-events-none ${charCountCx(noteText.length)}`}>{noteText.length}/2000</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button onClick={handleSaveNote} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Save Note</button>
              <button onClick={() => { setShowAddNote(false); setNoteText(''); setNewNoteTags([]); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* Search + filter + sort */}
        <div className="space-y-2.5 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text" placeholder="Search notes..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
              {['All', ...TOPIC_TAGS].map(tag => {
                const active = activeTagFilter === tag;
                const cfg = TAG_CONFIG[tag];
                return (
                  <button key={tag} onClick={() => setActiveTagFilter(tag)}
                    className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? cfg ? `${cfg.bg} ${cfg.text} ${cfg.border}` : 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as typeof sortOrder)}
              className="flex-shrink-0 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="topic">By topic</option>
            </select>
          </div>
        </div>

        {/* Notes list */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            {searchQuery || activeTagFilter !== 'All' ? 'No notes match your current filters.' : 'No notes yet — add one above.'}
          </div>
        ) : sortOrder === 'topic' ? (
          <div className="space-y-5">
            {topicGroups.map(({ tag, notes: groupNotes }) => {
              const cfg = TAG_CONFIG[tag];
              return (
                <div key={tag}>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-2.5 ${cfg.header}`}>
                    <span className={`text-xs font-semibold uppercase tracking-wider ${cfg.text}`}>{tag}</span>
                    <span className={`text-xs opacity-60 ${cfg.text}`}>· {groupNotes.length} note{groupNotes.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-3 pl-2 border-l-2 border-gray-100">
                    {groupNotes.map(renderNoteCard)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">{sortedNotes.map(renderNoteCard)}</div>
        )}
      </div>

      {/* ═══════════════════════════════ FILES ═══════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Files</h3>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload File
          </button>
          <input ref={fileInputRef} type="file" className="hidden"
            accept=".pdf,.xlsx,.xls,.pptx,.ppt,.docx,.doc"
            onChange={handleFileInputChange}
          />
        </div>

        {/* Summary line */}
        {activeFiles.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs mb-4 text-gray-500">
            <span className="font-medium text-gray-700">{activeFiles.length} file{activeFiles.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span className={sharedCount > 0 ? 'text-green-600 font-medium' : ''}>
              {sharedCount} shared with buyer
            </span>
            {notOpenedCount > 0 && (
              <>
                <span>·</span>
                <span className="text-amber-600 font-medium">{notOpenedCount} not yet opened</span>
              </>
            )}
          </div>
        )}

        {/* File cards */}
        <div className="space-y-3">
          {fileGroups.map(({ latest, previous }) => renderFileCard(latest, previous))}
          {fileGroups.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-400">No files attached yet.</div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════ DELETE CONFIRM ═══════════════════════════ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete this {deleteTarget?.type}? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">Cancel</button>
              <button onClick={handleConfirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ VERSION CONFLICT MODAL ═══════════════════════ */}
      {pendingUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setPendingUpload(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Layers className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">New version detected</h3>
                <p className="text-sm text-gray-600 mt-1">
                  This looks like an update to <strong>{pendingUpload.matchedFile.name}</strong>. Add as a new version?
                </p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 mb-5 text-sm">
              <p className="font-medium text-blue-900 mb-1">If you confirm:</p>
              <ul className="space-y-0.5 text-blue-700 text-xs">
                <li>· <strong>{pendingUpload.rawName}</strong> → saved as <strong>v{pendingUpload.matchedFile.version + 1} (Latest)</strong></li>
                <li>· <strong>{pendingUpload.matchedFile.name}</strong> → archived as <strong>v{pendingUpload.matchedFile.version} (Superseded)</strong></li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button onClick={handleConfirmVersion} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Yes, add as v{pendingUpload.matchedFile.version + 1}
              </button>
              <button onClick={handleRejectVersion} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                Upload as new file
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
