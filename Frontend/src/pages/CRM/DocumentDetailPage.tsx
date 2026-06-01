import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Eye,
  Download,
  Share2,
  Edit,
  Trash2,
  ChevronRight,
  FileText,
  Calendar,
  User,
  Tag,
  Folder,
  Clock,
  TrendingUp,
  MoreVertical,
  Briefcase,
  Building2,
  Mail,
  Phone,
  Upload,
  RotateCcw,
  Send,
  X,
  Check,
  CheckCircle2,
  Archive,
  Paperclip,
  UserPlus,
  Plus,
  Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import ShareDocumentModal from '../../components/Documents/ShareDocumentModal';

interface Document {
  id: string;
  document_id: string;
  name: string;
  description?: string;
  file_type: string;
  file_size: number;
  file_url?: string;
  category?: string;
  folder_id?: string;
  version?: number;
  uploaded_by: string;
  uploaded_at: string;
  modified_at: string;
  owner_name?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  related_entity_name?: string;
  access_count?: number;
  last_accessed_at?: string;
  starred?: boolean;
}

interface DocumentFolder {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface RelatedDeal {
  id: string;
  deal_id: string;
  deal_name: string;
  value: number;
  stage: string;
}

interface RelatedAccount {
  id: string;
  account_id: string;
  company_name: string;
  industry?: string;
  employee_count?: number;
}

interface RelatedContact {
  id: string;
  contact_id: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
}

interface DocumentVersion {
  id: string;
  version: number;
  file_url: string;
  file_size: number;
  uploaded_by: string;
  uploaded_by_name?: string;
  uploaded_at: string;
  notes?: string;
  is_current: boolean;
}

interface Comment {
  id: string;
  comment_id: string;
  document_id: string;
  user_id: string;
  user_name: string;
  user_initials: string;
  content: string;
  created_at: string;
  parent_comment_id?: string;
  replies?: Comment[];
}

interface ActivityLogEntry {
  id: string;
  type: 'view' | 'download' | 'share' | 'upload' | 'edit';
  user_name: string;
  description: string;
  timestamp: string;
}

interface SharedUser {
  id: string;
  user_id: string;
  user_name: string;
  user_initials: string;
  shared_at: string;
}

interface AIInsight {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  key_points: string[];
}

const DocumentDetailPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [document, setDocument] = useState<Document | null>(null);
  const [folder, setFolder] = useState<DocumentFolder | null>(null);
  const [relatedDeal, setRelatedDeal] = useState<RelatedDeal | null>(null);
  const [relatedAccount, setRelatedAccount] = useState<RelatedAccount | null>(null);
  const [relatedContact, setRelatedContact] = useState<RelatedContact | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [aiInsight, setAIInsight] = useState<AIInsight | null>(null);
  const [downloadCount, setDownloadCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);

  const currentUser = {
    user_id: "user_alex",
    user_name: "Alex Rodriguez",
    user_avatar: "AR",
    user_email: "alex.rodriguez@bmi.com",
    user_role: "Sales Rep"
  };

  const teamMembers = [
    {
      user_id: "user_emily",
      user_name: "Emily Davis",
      user_avatar: "ED",
      user_email: "emily.davis@bmi.com"
    },
    {
      user_id: "user_david",
      user_name: "David Wilson",
      user_avatar: "DW",
      user_email: "david.wilson@bmi.com"
    },
    {
      user_id: "user_lisa",
      user_name: "Lisa Brown",
      user_avatar: "LB",
      user_email: "lisa.brown@bmi.com"
    }
  ];

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  const getMockDocuments = () => {
    const documents: Record<string, any> = {
      'doc_acme_proposal_v2': {
        id: 'doc_acme_proposal_v2',
        document_id: 'doc_acme_proposal_v2',
        name: 'Acme_Corp_Proposal_v2.pdf',
        file_type: 'pdf',
        file_size: 2457600,
        file_url: '/storage/documents/acme_corp_proposal_v2.pdf',
        category: 'Proposal',
        subcategory: 'Enterprise',
        tags: ['proposal', 'enterprise', 'q4-2024'],
        description: 'Enterprise plan proposal for Acme Corp. Includes custom integrations, implementation timeline, and pricing breakdown.',
        uploaded_by: 'user_alex',
        owner_name: 'Alex Rodriguez',
        uploaded_at: '2024-12-04T14:30:00Z',
        updated_at: '2024-12-04T14:30:00Z',
        version: '2',
        access_count: 12,
        download_count: 3,
        visibility: 'Team',
        status: 'Active',
        related_entity_type: 'deal',
        related_entity_id: 'deal_acme_001',
        folder_id: 'folder_proposals',
        hrms_connected: false
      },
      'doc_techstart_contract': {
        id: 'doc_techstart_contract',
        document_id: 'doc_techstart_contract',
        name: 'TechStart_Enterprise_Contract.docx',
        file_type: 'docx',
        file_size: 876544,
        file_url: '/storage/documents/techstart_enterprise_contract.docx',
        category: 'Contract',
        subcategory: 'Enterprise',
        tags: ['contract', 'techstart', 'hrms', 'enterprise'],
        description: 'Final enterprise contract for TechStart Inc. HRMS-connected deal.',
        uploaded_by: 'user_alex',
        owner_name: 'Alex Rodriguez',
        uploaded_at: '2024-12-07T16:45:00Z',
        updated_at: '2024-12-07T16:45:00Z',
        version: '1',
        access_count: 5,
        download_count: 1,
        visibility: 'Private',
        status: 'Active',
        related_entity_type: 'deal',
        related_entity_id: 'deal_techstart_001',
        folder_id: 'folder_contracts',
        hrms_connected: true,
        source: 'Email',
        source_detail: 'Gmail attachment from legal@techstart.com'
      },
      'doc_bigco_transcript': {
        id: 'doc_bigco_transcript',
        document_id: 'doc_bigco_transcript',
        name: 'BigCo_Discovery_Call_Transcript.pdf',
        file_type: 'pdf',
        file_size: 251904,
        file_url: '/storage/documents/bigco_discovery_call_transcript.pdf',
        category: 'Meeting Materials',
        subcategory: 'Transcript',
        tags: ['transcript', 'discovery', 'ai-generated', 'bigco'],
        description: 'AI-generated transcript from BigCo Enterprise discovery call on Dec 7.',
        uploaded_by: 'system_ai',
        owner_name: 'AI System',
        uploaded_at: '2024-12-07T12:00:00Z',
        updated_at: '2024-12-07T12:00:00Z',
        version: '1',
        access_count: 8,
        download_count: 2,
        visibility: 'Team',
        status: 'Active',
        related_entity_type: 'activity',
        related_entity_id: 'act_bigco_001',
        folder_id: 'folder_transcripts',
        ai_generated: true,
        source: 'AI',
        source_detail: 'Auto-generated from meeting recording'
      }
    };

    return documents[documentId || 'doc_acme_proposal_v2'] || documents['doc_acme_proposal_v2'];
  };

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError(null);

      const mockDoc = getMockDocuments();
      setDocument(mockDoc);
      setDescriptionValue(mockDoc.description || '');

      const isTechStart = documentId === 'doc_techstart_contract';
      const isBigCo = documentId === 'doc_bigco_transcript';

      if (isBigCo) {
        setRelatedDeal({
          id: 'deal_bigco_001',
          deal_id: 'deal_bigco_001',
          deal_name: 'BigCo Enterprise - Advanced Plan',
          value: 75000,
          stage: 'Discovery'
        });

        setRelatedAccount({
          id: 'account_bigco',
          account_id: 'account_bigco',
          company_name: 'BigCo Enterprise',
          industry: 'Enterprise Software',
          employee_count: 500
        });

        setRelatedContact({
          id: 'contact_mike_chen',
          contact_id: 'contact_mike_chen',
          name: 'Mike Chen',
          title: 'CTO',
          email: 'mike.chen@bigco.com',
          phone: '+1 (555) 456-7890'
        });

        setFolder({
          id: 'folder_transcripts',
          name: 'Transcripts',
          parent_id: null,
          created_at: '2024-01-01T00:00:00Z'
        });
      } else if (isTechStart) {
        setRelatedDeal({
          id: 'deal_techstart_001',
          deal_id: 'deal_techstart_001',
          deal_name: 'TechStart Inc - Enterprise Plan',
          value: 42000,
          stage: 'Negotiation'
        });

        setRelatedAccount({
          id: 'account_techstart',
          account_id: 'account_techstart',
          company_name: 'TechStart Inc',
          industry: 'Technology',
          employee_count: 120
        });

        setRelatedContact({
          id: 'contact_sarah_lee',
          contact_id: 'contact_sarah_lee',
          name: 'Sarah Lee',
          title: 'CFO',
          email: 'sarah.lee@techstart.com',
          phone: '+1 (555) 987-6543'
        });

        setFolder({
          id: 'folder_contracts',
          name: 'Contracts',
          parent_id: null,
          created_at: '2024-01-01T00:00:00Z'
        });
      } else {
        setRelatedDeal({
          id: 'deal_acme_001',
          deal_id: 'deal_acme_001',
          deal_name: 'Acme Corp - Enterprise Plan',
          value: 50000,
          stage: 'Proposal'
        });

        setRelatedAccount({
          id: 'account_acme',
          account_id: 'account_acme',
          company_name: 'Acme Corp',
          industry: 'SaaS',
          employee_count: 75
        });

        setRelatedContact({
          id: 'contact_john_smith',
          contact_id: 'contact_john_smith',
          name: 'John Smith',
          title: 'VP Sales',
          email: 'john.smith@acmecorp.com',
          phone: '+1 (555) 123-4567'
        });

        setFolder({
          id: 'folder_proposals',
          name: 'Proposals',
          parent_id: null,
          created_at: '2024-01-01T00:00:00Z'
        });
      }

      if (isBigCo) {
        setVersions([
          {
            id: 'doc_bigco_transcript',
            document_id: 'doc_bigco_transcript',
            version: '1',
            is_current: true,
            created_at: '2024-12-07T12:00:00Z',
            created_by_name: 'AI System',
            file_size: 251904,
            change_notes: 'Auto-generated transcript'
          }
        ]);

        setComments([]);
        setSharedUsers([]);
        setTags(['transcript', 'discovery', 'ai-generated', 'bigco']);

        setActivityLog([
          {
            id: 'a1',
            type: 'upload',
            user_name: 'AI System',
            description: 'auto-generated transcript',
            timestamp: '2024-12-07T12:00:00Z'
          }
        ]);

        setAIInsight({
          summary: 'Discovery call discussing enterprise requirements, integration needs, and timeline expectations for BigCo.',
          key_points: [
            'Need integration with Salesforce and SAP',
            'Timeline: Start Q1 2025',
            'Budget range: $75K-$90K',
            'Decision maker: Mike Chen (CTO)'
          ],
          sentiment: 'Neutral',
          sentiment_score: 65
        });
      } else if (isTechStart) {
        setVersions([
          {
            id: 'doc_techstart_contract',
            document_id: 'doc_techstart_contract',
            version: '1',
            is_current: true,
            created_at: '2024-12-07T16:45:00Z',
            created_by_name: 'Alex Rodriguez',
            file_size: 876544,
            change_notes: 'Initial contract'
          }
        ]);

        setComments([]);
        setSharedUsers([]);
        setTags(['contract', 'techstart', 'hrms', 'enterprise']);

        setActivityLog([
          {
            id: 'a1',
            type: 'upload',
            user_name: 'Alex Rodriguez',
            description: 'uploaded from email',
            timestamp: '2024-12-07T16:45:00Z'
          }
        ]);

        setAIInsight(null);
      } else {
        setVersions([
          {
            id: 'doc_acme_proposal_v2',
            document_id: 'doc_acme_proposal_v2',
            version: '2',
            is_current: true,
            created_at: '2024-12-04T14:30:00Z',
            created_by_name: 'Alex Rodriguez',
            file_size: 2457600,
            change_notes: 'Updated pricing and timeline'
          },
          {
            id: 'doc_acme_proposal_v1',
            document_id: 'doc_acme_proposal_v1',
            version: '1',
            is_current: false,
            created_at: '2024-12-01T10:00:00Z',
            created_by_name: 'Alex Rodriguez',
            file_size: 2200000,
            change_notes: 'Initial draft'
          }
        ]);

        setComments([
          {
            id: 'comment_001',
            user_name: 'Sarah Chen',
            user_initials: 'SC',
            content: 'Pricing looks good, let\'s send this!',
            created_at: '2024-12-07T09:20:00Z',
            replies: []
          },
          {
            id: 'comment_002',
            user_name: 'Alex Rodriguez',
            user_initials: 'AR',
            content: 'Updated the timeline to 6 months based on John\'s feedback.',
            created_at: '2024-12-04T15:30:00Z',
            replies: [
              {
                id: 'comment_003',
                user_name: 'Mike Johnson',
                user_initials: 'MJ',
                content: 'Perfect, that aligns with their Q2 goals.',
                created_at: '2024-12-05T10:00:00Z'
              }
            ]
          }
        ]);

        setSharedUsers([
          {
            id: 's1',
            user_id: 'user_sarah_chen',
            user_name: 'Sarah Chen',
            user_initials: 'SC',
            shared_at: '2024-12-04T15:00:00Z'
          },
          {
            id: 's2',
            user_id: 'user_mike',
            user_name: 'Mike Johnson',
            user_initials: 'MJ',
            shared_at: '2024-12-04T15:00:00Z'
          }
        ]);

        setTags(['proposal', 'enterprise', 'q4-2024']);

        setActivityLog([
          {
            id: 'a1',
            type: 'view',
            user_name: 'Sarah Chen',
            description: 'viewed document',
            timestamp: '2024-12-07T09:15:00Z'
          },
          {
            id: 'a2',
            type: 'download',
            user_name: 'Mike Johnson',
            description: 'downloaded document',
            timestamp: '2024-12-06T14:30:00Z'
          },
          {
            id: 'a3',
            type: 'share',
            user_name: 'Alex Rodriguez',
            description: 'shared with Sarah Chen and Mike Johnson',
            timestamp: '2024-12-04T15:00:00Z'
          },
          {
            id: 'a4',
            type: 'upload',
            user_name: 'Alex Rodriguez',
            description: 'uploaded version 2',
            timestamp: '2024-12-04T14:30:00Z'
          }
        ]);

        setAIInsight({
          summary: 'This proposal includes enterprise features, custom integrations, 6-month timeline, and $50K annual contract.',
          key_points: [
            'Budget confirmed: $50K annually',
            'Implementation timeline: 6 months',
            'Custom integrations required',
            'CEO approval needed before signing'
          ],
          sentiment: 'Positive',
          sentiment_score: 85
        });
      }

      setDownloadCount(isBigCo ? 2 : isTechStart ? 1 : 3);

    } catch (err: any) {
      console.error('Error fetching document:', err);
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (document) {
      setDownloadCount(3);
    }
  }, [document]);

  const handleView = () => {
    if (!document) return;

    console.log('Opening PDF viewer...');
    showToast('Opening PDF viewer...', 'success');

    // Open in new tab
    window.open(document.file_url, '_blank');

    // Track view - update state
    if (document.access_count !== undefined) {
      setDocument({ ...document, access_count: document.access_count + 1, last_accessed: new Date().toISOString() });
    }

    // Add to activity log
    const newActivity: ActivityLogEntry = {
      id: `a${Date.now()}`,
      type: 'view',
      user_name: currentUser.user_name,
      description: 'viewed document',
      timestamp: new Date().toISOString()
    };
    setActivityLog([newActivity, ...activityLog]);
  };

  const handleDownload = async () => {
    if (!document?.file_url) return;

    console.log('Downloading document...');
    showToast(`Downloading ${document.name}...`, 'success');

    // Trigger download
    const link = window.document.createElement('a');
    link.href = document.file_url;
    link.download = document.name;
    link.click();

    // Track download - update state
    const newDownloadCount = downloadCount + 1;
    setDownloadCount(newDownloadCount);

    // Add to activity log
    const newActivity: ActivityLogEntry = {
      id: `a${Date.now()}`,
      type: 'download',
      user_name: currentUser.user_name,
      description: 'downloaded document',
      timestamp: new Date().toISOString()
    };
    setActivityLog([newActivity, ...activityLog]);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleEdit = () => {
    if (!document) return;

    if (document.file_type === 'pdf' || document.format === 'PDF') {
      showToast('Edit mode not available for PDF files', 'error');
    } else {
      showToast('Opening editor...', 'success');
      console.log('Opening document editor...');
    }
  };

  const handleDelete = async () => {
    if (!document) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this document? This action cannot be undone.'
    );

    if (!confirmed) return;

    console.log('Deleting document...');
    showToast('Document deleted successfully', 'success');

    // Update status in state
    setDocument({ ...document, status: 'Deleted' });

    // Redirect after 1.5 seconds
    setTimeout(() => {
      navigate('/crm/documents');
    }, 1500);
  };

  const handleSaveDescription = async () => {
    if (!document) return;

    setDocument({ ...document, description: descriptionValue });
    setEditingDescription(false);
    showToast('success', 'Description updated successfully');
  };

  const handleCancelDescription = () => {
    setDescriptionValue(document?.description || '');
    setEditingDescription(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      showToast('error', 'Please enter a comment');
      return;
    }

    if (!document) return;

    const comment: Comment = {
      id: `c${Date.now()}`,
      comment_id: `c${Date.now()}`,
      document_id: document.id,
      user_id: currentUser.user_id,
      user_name: currentUser.user_name,
      user_initials: currentUser.user_avatar,
      content: newComment,
      created_at: new Date().toISOString(),
      replies: []
    };

    setComments([comment, ...comments]);
    setNewComment('');
    showToast('success', 'Comment posted successfully');

    // Add to activity log
    const newActivity: ActivityLogEntry = {
      id: `a${Date.now()}`,
      type: 'edit',
      user_name: currentUser.user_name,
      description: 'commented on document',
      timestamp: new Date().toISOString()
    };
    setActivityLog([newActivity, ...activityLog]);
  };

  const handleReply = async (commentId: string) => {
    if (!replyContent.trim() || !document) return;

    const reply: Comment = {
      id: `r${Date.now()}`,
      comment_id: `r${Date.now()}`,
      document_id: document.id,
      user_id: currentUser.user_id,
      user_name: currentUser.user_name,
      user_initials: currentUser.user_avatar,
      content: replyContent,
      created_at: new Date().toISOString(),
      parent_comment_id: commentId
    };

    setComments(comments.map(c => {
      if (c.id === commentId) {
        return { ...c, replies: [...(c.replies || []), reply] };
      }
      return c;
    }));

    setReplyContent('');
    setReplyingTo(null);
    showToast('success', 'Reply posted successfully');
  };

  const handleUploadNewVersion = () => {
    showToast('success', 'File upload feature coming soon');
    console.log('File picker would open to upload new version');
  };

  const handleRestoreVersion = (version: DocumentVersion) => {
    const confirmed = window.confirm(
      `Restore to version ${version.version}? This will create a new version as a copy of this version.`
    );

    if (!confirmed) return;

    showToast('success', `Restored to version ${version.version} as version ${versions.length + 1}`);

    // Add to activity log
    const newActivity: ActivityLogEntry = {
      id: `a${Date.now()}`,
      type: 'edit',
      user_name: currentUser.user_name,
      description: `restored version ${version.version}`,
      timestamp: new Date().toISOString()
    };
    setActivityLog([newActivity, ...activityLog]);

    console.log('Version restored:', version.version);
  };

  const handleAddTag = () => {
    if (!newTag.trim()) {
      showToast('error', 'Please enter a tag name');
      return;
    }
    if (tags.includes(newTag.trim())) {
      showToast('error', 'Tag already exists');
      return;
    }
    setTags([...tags, newTag.trim()]);
    setNewTag('');
    showToast('success', `Tag '${newTag.trim()}' added`);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
    showToast('success', `Tag '${tagToRemove}' removed`);
  };

  const handleRemoveSharedUser = (userId: string) => {
    const user = sharedUsers.find(u => u.user_id === userId);
    if (!user) return;

    const confirmed = window.confirm(`Remove sharing access for ${user.user_name}?`);
    if (!confirmed) return;

    setSharedUsers(sharedUsers.filter(u => u.user_id !== userId));
    showToast('success', 'Sharing access removed');

    // Add to activity log
    const newActivity: ActivityLogEntry = {
      id: `a${Date.now()}`,
      type: 'share',
      user_name: currentUser.user_name,
      description: `unshared with ${user.user_name}`,
      timestamp: new Date().toISOString()
    };
    setActivityLog([newActivity, ...activityLog]);
  };

  const handleAddSharedUser = () => {
    setShowShareModal(true);
  };

  const handleShareDocument = (userId: string, visibility: string, message: string) => {
    const selectedMember = teamMembers.find(member => member.user_id === userId);

    if (!selectedMember) {
      showToast('error', 'Please select a user');
      return;
    }

    const newSharedUser: SharedUser = {
      id: `s${Date.now()}`,
      user_id: userId,
      user_name: selectedMember.user_name,
      user_initials: selectedMember.user_avatar,
      shared_at: new Date().toISOString()
    };

    setSharedUsers([...sharedUsers, newSharedUser]);

    const newActivity: ActivityLogEntry = {
      id: `a${Date.now()}`,
      type: 'share',
      user_name: currentUser.user_name,
      description: `shared with ${selectedMember.user_name}`,
      timestamp: new Date().toISOString()
    };
    setActivityLog([newActivity, ...activityLog]);

    showToast('success', 'Document shared successfully');
  };

  const handleSendEmail = () => {
    showToast('success', 'Email composer feature coming soon');
    console.log('Send via email modal would open here');
  };

  const handleAttachToActivity = () => {
    showToast('success', 'Activity selector feature coming soon');
    console.log('Attach to activity modal would open here');
  };

  const handleCreateNewVersion = () => {
    showToast('success', 'File upload feature coming soon');
    console.log('File picker would open here');
  };

  const handleMoveToArchive = () => {
    if (!document) return;

    const confirmed = window.confirm('Move this document to archive?');
    if (!confirmed) return;

    showToast('success', 'Document archived successfully');
    setDocument({ ...document, status: 'Archived' });

    // Add to activity log
    const newActivity: ActivityLogEntry = {
      id: `a${Date.now()}`,
      type: 'edit',
      user_name: currentUser.user_name,
      description: 'archived document',
      timestamp: new Date().toISOString()
    };
    setActivityLog([newActivity, ...activityLog]);

    // Redirect after 1.5 seconds
    setTimeout(() => {
      navigate('/crm/documents');
    }, 1500);
  };

  const handleBreadcrumbDashboard = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast('success', 'Navigating to Dashboard');
    setTimeout(() => navigate('/dashboard'), 1000);
  };

  const handleBreadcrumbDocuments = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast('success', 'Returning to Documents Library');
    setTimeout(() => navigate('/crm/documents'), 1000);
  };

  const handleNavigateToDeal = () => {
    if (!relatedDeal) return;
    showToast('success', `Navigating to Deal: ${relatedDeal.deal_name}`);
    setTimeout(() => navigate(`/crm/deals/${relatedDeal.deal_id}`), 1000);
  };

  const handleNavigateToAccount = () => {
    if (!relatedAccount) return;
    showToast('success', `Navigating to Account: ${relatedAccount.company_name}`);
    setTimeout(() => navigate(`/crm/accounts/${relatedAccount.account_id}`), 1000);
  };

  const handleNavigateToContact = () => {
    if (!relatedContact) return;
    showToast('success', `Navigating to Contact: ${relatedContact.name}`);
    setTimeout(() => navigate(`/crm/contacts/${relatedContact.contact_id}`), 1000);
  };

  const handleNavigateToUserProfile = () => {
    if (!document) return;
    const userName = document.owner_name || 'Alex Rodriguez';
    showToast('success', `Navigating to User Profile: ${userName}`);
    setTimeout(() => navigate(`/settings/users/${document.uploaded_by}`), 1000);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'view': return <Eye className="w-5 h-5 text-blue-600" />;
      case 'download': return <Download className="w-5 h-5 text-green-600" />;
      case 'share': return <Share2 className="w-5 h-5 text-purple-600" />;
      case 'upload': return <Upload className="w-5 h-5 text-orange-600" />;
      case 'edit': return <Edit className="w-5 h-5 text-yellow-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileType: string, size: 'sm' | 'lg' = 'sm') => {
    const sizeClass = size === 'lg' ? 'w-24 h-24' : 'w-5 h-5';
    const type = fileType.toLowerCase();

    if (type === 'pdf') {
      return <FileText className={`${sizeClass} text-red-600`} />;
    }
    if (type === 'docx' || type === 'doc') {
      return <FileText className={`${sizeClass} text-blue-600`} />;
    }
    if (type === 'xlsx' || type === 'xls') {
      return <FileText className={`${sizeClass} text-green-600`} />;
    }
    return <FileText className={`${sizeClass} text-gray-600`} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Document Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The document you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/crm/documents')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="mb-5">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <a href="/dashboard" onClick={handleBreadcrumbDashboard} className="hover:text-blue-600 cursor-pointer">Dashboard</a>
            <ChevronRight className="w-4 h-4" />
            <a href="/crm/documents" onClick={handleBreadcrumbDocuments} className="hover:text-blue-600 cursor-pointer">Documents</a>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{document.name}</span>
          </nav>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  {getFileIcon(document.file_type)}
                </div>
                <div>
                  <h1 className="text-[28px] font-bold text-gray-900">{document.name}</h1>
                  <div className="flex items-center space-x-3 mt-1">
                    {document.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {document.category}
                      </span>
                    )}
                    {document.version && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Version {document.version}
                      </span>
                    )}
                    {document.hrms_connected && (
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-help"
                        title="This deal originated from an HRMS recruitment. Higher close probability."
                      >
                        <span className="mr-1">🔗</span> HRMS Connected
                      </span>
                    )}
                    {document.ai_generated && (
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200 cursor-help"
                        title="Auto-generated from meeting recording or AI-powered content creation."
                      >
                        <span className="mr-1">🤖</span> AI Generated
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{document.owner_name || 'Unknown'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(document.uploaded_at)}</span>
                </div>
                {document.access_count !== undefined && (
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>{document.access_count} views</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleView}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
              <button
                onClick={handleShare}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="w-[65%] space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Preview</h2>
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <div className="flex justify-center mb-4">
                  {getFileIcon(document.file_type, 'lg')}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{document.name}</h3>
                <p className="text-gray-600 mb-6">{formatFileSize(document.file_size)} • {document.file_type.toUpperCase()} Document</p>
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={handleView}
                    className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Open PDF Viewer
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                </div>
              </div>
            </div>

            {(relatedDeal || relatedAccount || relatedContact) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Records</h2>
                <div className="grid grid-cols-2 gap-4">
                  {relatedDeal && (
                    <button
                      onClick={handleNavigateToDeal}
                      className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-medium text-gray-500 uppercase">Deal</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{relatedDeal.deal_name}</h3>
                      <div className="text-sm text-gray-600">
                        ${relatedDeal.value.toLocaleString()} • {relatedDeal.stage}
                      </div>
                    </button>
                  )}

                  {relatedAccount && (
                    <button
                      onClick={handleNavigateToAccount}
                      className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-medium text-gray-500 uppercase">Account</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{relatedAccount.company_name}</h3>
                      <div className="text-sm text-gray-600">
                        {relatedAccount.industry && `${relatedAccount.industry} • `}
                        {relatedAccount.employee_count && `${relatedAccount.employee_count} employees`}
                      </div>
                    </button>
                  )}

                  {relatedContact && (
                    <button
                      onClick={handleNavigateToContact}
                      className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all col-span-2 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-medium text-gray-500 uppercase">Contact</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{relatedContact.name}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        {relatedContact.title && <div>{relatedContact.title}</div>}
                        <div className="flex items-center space-x-4">
                          {relatedContact.email && (
                            <span className="flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {relatedContact.email}
                            </span>
                          )}
                          {relatedContact.phone && (
                            <span className="flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {relatedContact.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Description</h2>
                {!editingDescription && (
                  <button
                    onClick={() => setEditingDescription(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>
              {editingDescription ? (
                <div>
                  <textarea
                    value={descriptionValue}
                    onChange={(e) => setDescriptionValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Add a description..."
                  />
                  <div className="mt-3 flex items-center justify-end space-x-2">
                    <button
                      onClick={handleCancelDescription}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDescription}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700">{document.description || 'No description provided.'}</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Version History</h2>
                <button
                  onClick={handleUploadNewVersion}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New Version
                </button>
              </div>
              <div className="space-y-4">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`border rounded-lg p-4 ${
                      version.is_current ? 'border-purple-300 bg-purple-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            Version {version.version}
                          </h3>
                          {version.is_current && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {formatDate(version.uploaded_at)} by {version.uploaded_by_name}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          {formatFileSize(version.file_size)} • {version.notes}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-3">
                      <button
                        onClick={handleView}
                        className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={handleDownload}
                        className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </button>
                      {!version.is_current && (
                        <button
                          onClick={() => handleRestoreVersion(version)}
                          className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments</h2>

              <div className="space-y-4 mb-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-700">{comment.user_initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-gray-900">{comment.user_name}</h4>
                          <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
                        <button
                          onClick={() => setReplyingTo(comment.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Reply
                        </button>

                        {replyingTo === comment.id && (
                          <div className="mt-3 pl-4 border-l-2 border-gray-200">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={2}
                              placeholder="Write a reply..."
                            />
                            <div className="mt-2 flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyContent('');
                                }}
                                className="px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-lg"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleReply(comment.id)}
                                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        )}

                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-semibold text-gray-700">{reply.user_initials}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm font-semibold text-gray-900">{reply.user_name}</h4>
                                    <span className="text-xs text-gray-500">{formatDate(reply.created_at)}</span>
                                  </div>
                                  <p className="text-sm text-gray-700">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-700">
                      {(user?.email?.split('@')[0] || 'CU').substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Add a comment..."
                    />
                    <div className="mt-3 flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setNewComment('')}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Post Comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-[35%] space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-[120px]">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1 uppercase">File Type</div>
                    <div className="flex items-center space-x-2">
                      {getFileIcon(document.file_type)}
                      <span className="text-sm font-medium text-gray-900">{document.file_type.toUpperCase()}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1 uppercase">File Size</div>
                    <div className="text-sm font-medium text-gray-900">{formatFileSize(document.file_size)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div>
                    <div className="text-xs text-gray-500 mb-1 uppercase">Version</div>
                    <div className="text-sm font-medium text-gray-900">Version {document.version || 2}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1 uppercase">Status</div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Active
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-1 uppercase">Uploaded By</div>
                  <button
                    onClick={handleNavigateToUserProfile}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    {document.owner_name || 'Alex Rodriguez'}
                  </button>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-1 uppercase">Upload Date</div>
                  <div className="text-sm font-medium text-gray-900">{formatDate(document.uploaded_at)}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div>
                    <div className="text-xs text-gray-500 mb-1 uppercase">Views</div>
                    <div className="text-sm font-medium text-gray-900">{document.access_count || 12} views</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1 uppercase">Downloads</div>
                    <div className="text-sm font-medium text-gray-900">{downloadCount} downloads</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-1 uppercase">Last Viewed</div>
                  <div className="text-sm font-medium text-gray-900">
                    {document.last_accessed_at ? formatDate(document.last_accessed_at) : 'Never'}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-1 uppercase">Visibility</div>
                  <div className="text-sm font-medium text-gray-900">{document.visibility || 'Team'}</div>
                </div>

                {document.source && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500 mb-1 uppercase">Source</div>
                    <div className="text-sm font-medium text-gray-900">{document.source}</div>
                    {document.source_detail && (
                      <div className="text-xs text-gray-500 mt-1">{document.source_detail}</div>
                    )}
                  </div>
                )}

                {document.hrms_connected && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-sm">🔗</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-emerald-800">HRMS Connected</div>
                        <div className="text-xs text-gray-500">Synced with employee records</div>
                      </div>
                    </div>
                  </div>
                )}

                {document.ai_generated && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-sm">🤖</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-purple-800">AI Generated</div>
                        <div className="text-xs text-gray-500">Auto-created from meeting recording</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>

              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Add tag..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Log</h3>

              <div className="space-y-4">
                {activityLog.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user_name}</span> {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Shared With</h3>
                <button
                  onClick={handleAddSharedUser}
                  className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </button>
              </div>

              <div className="space-y-3">
                {sharedUsers.map((sharedUser) => (
                  <div key={sharedUser.id} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-700">{sharedUser.user_initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900">{sharedUser.user_name}</h4>
                        <p className="text-xs text-gray-500">Shared {formatDate(sharedUser.shared_at)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSharedUser(sharedUser.user_id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {aiInsight && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-900 mb-3">{aiInsight.summary}</p>
                  <div className="flex items-center space-x-2">
                    {aiInsight.sentiment === 'positive' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Positive ({aiInsight.confidence}% confidence)
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Key Points:</h4>
                  <ul className="space-y-2">
                    {aiInsight.key_points.map((point, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>

              <div className="space-y-2">
                <button
                  onClick={handleSendEmail}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Mail className="w-5 h-5 text-gray-600" />
                  <span>Send via Email</span>
                </button>

                <button
                  onClick={handleAttachToActivity}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Paperclip className="w-5 h-5 text-gray-600" />
                  <span>Attach to Activity</span>
                </button>

                <button
                  onClick={handleCreateNewVersion}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span>Create New Version</span>
                </button>

                <button
                  onClick={handleMoveToArchive}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Archive className="w-5 h-5 text-gray-600" />
                  <span>Move to Archive</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ShareDocumentModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShare={handleShareDocument}
        documentName={document?.name || ''}
        teamMembers={teamMembers}
      />
    </div>
  );
};

export default DocumentDetailPage;
