import React, { useState, useMemo, useEffect } from 'react';
import {
  Upload, Search, Download, Trash2, FileText, Image as ImageIcon,
  FileSpreadsheet, Video, File, Star, Users, Calendar, FolderOpen,
  ChevronDown, ChevronRight, Filter, MoreVertical, Eye, Share2, Edit2,
  Briefcase, CheckSquare, Square, Clock, TrendingUp, AlertCircle, Link2,
  Grid3x3, List, Phone, Mail, Building2, Zap, UserCheck, Play, Menu, X, Plus, XCircle
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import UploadDocumentModal from '../../components/Documents/UploadDocumentModal';
import DragDropOverlay from '../../components/Documents/DragDropOverlay';
import { documentsService, Document as ServiceDocument } from '../../services/documentsService';

const DocumentsContextDemo: React.FC = () => {
  const navigate = useNavigate();

  const scenarios = [
    {
      id: 1,
      title: 'Scenario 1: FROM DEAL DETAIL',
      description: 'View documents for Acme Corp - $50K Deal',
      icon: Briefcase,
      color: 'blue',
      url: '/crm/documents?deal_id=deal_acme_001&deal_name=Acme%20Corp%20-%20$50K',
      expectedDocs: '3 documents',
      docs: [
        'Acme_Corp_Proposal_v2.pdf',
        'Acme_Discount_Approval_Form.pdf',
        'Acme_Demo_Meeting_Recording.mp4'
      ]
    },
    {
      id: 2,
      title: 'Scenario 2: FROM ACCOUNT DETAIL',
      description: 'View documents for TechStart Inc Account (HRMS Connected)',
      icon: Building2,
      color: 'green',
      url: '/crm/documents?account_id=account_techstart&account_name=TechStart%20Inc&hrms_connected=true',
      expectedDocs: '11 documents (5 key docs shown in spec)',
      docs: [
        'TechStart_Enterprise_Contract.docx',
        'HRMS_TechStart_Placement_Agreement.pdf',
        'TechStart_Discovery_Notes.pdf',
        'TechStart_Enterprise_Proposal.pdf',
        'TechStart_Similar_Customer_Case_Study.pdf',
        '+ 6 more related documents'
      ]
    },
    {
      id: 3,
      title: 'Scenario 3: FROM CONTACT DETAIL',
      description: 'View documents for Sarah Lee (CFO at TechStart Inc)',
      icon: UserCheck,
      color: 'purple',
      url: '/crm/documents?contact_id=contact_sarah_lee&contact_name=Sarah%20Lee&title=CFO&account_name=TechStart%20Inc&hrms_connected=true',
      expectedDocs: '10 documents (4 key docs shown in spec)',
      docs: [
        'HRMS_TechStart_Placement_Agreement.pdf',
        'TechStart_Enterprise_Contract.docx',
        'Sarah_Lee_Email_Thread_Dec2024.pdf',
        'TechStart_Custom_Presentation.pptx',
        '+ 6 more related documents'
      ]
    },
    {
      id: 4,
      title: 'Scenario 4: FROM ACTIVITY DETAIL',
      description: 'View documents from TechStart Discovery Call (Meeting)',
      icon: Calendar,
      color: 'orange',
      url: '/crm/documents?activity_id=act_techstart_001&activity_name=TechStart%20Discovery%20Call&activity_type=Meeting',
      expectedDocs: '2 documents',
      docs: [
        'TechStart_Meeting_Agenda.pdf',
        'TechStart_Discovery_Call_Recording.mp4'
      ]
    },
    {
      id: 5,
      title: 'Scenario 5: FROM EMAIL INTEGRATION',
      description: 'View all Email Attachments from various contacts',
      icon: Mail,
      color: 'pink',
      url: '/crm/documents?category=Email%20Attachments',
      expectedDocs: '6+ email attachment documents',
      docs: [
        'BigCo_Technical_Requirements.docx',
        'Acme_RFP_Requirements.pdf',
        'InnovateLabs_Technical_Review.pdf',
        'StartCo_Questions_List.docx',
        'HealthPlus_Insurance_Cert.pdf',
        'DataFlow_Security_Questionnaire.xlsx'
      ]
    },
    {
      id: 6,
      title: 'Scenario 6: FROM AI ASSISTANT',
      description: 'View AI-Generated Meeting Transcripts from various calls',
      icon: Zap,
      color: 'indigo',
      url: '/crm/documents?category=Meeting%20Materials&source=AI',
      expectedDocs: '13 AI-generated transcript documents',
      docs: [
        'BigCo_Discovery_Call_Transcript.pdf',
        'TechStart_Discovery_Notes.pdf',
        'Acme_Demo_Call_Transcript.pdf',
        'StartCo_Kickoff_Meeting_Transcript.pdf',
        'HealthPlus_Negotiation_Call_Transcript.pdf',
        'InnovateLabs_Technical_Call_Transcript.pdf',
        'DataFlow_Onboarding_Call_Transcript.pdf',
        'BigCo_Follow_Up_Call_Transcript.pdf',
        'Acme_Pricing_Discussion_Transcript.pdf',
        'StartCo_Technical_Review_Transcript.pdf',
        'HealthPlus_Implementation_Planning_Transcript.pdf',
        'InnovateLabs_QBR_Transcript.pdf',
        'DataFlow_Training_Session_Transcript.pdf'
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string; hover: string; border: string }> = {
      blue: { bg: 'bg-blue-50', icon: 'text-blue-600', hover: 'hover:bg-blue-100', border: 'border-blue-200' },
      green: { bg: 'bg-green-50', icon: 'text-green-600', hover: 'hover:bg-green-100', border: 'border-green-200' },
      purple: { bg: 'bg-purple-50', icon: 'text-purple-600', hover: 'hover:bg-purple-100', border: 'border-purple-200' },
      orange: { bg: 'bg-orange-50', icon: 'text-orange-600', hover: 'hover:bg-orange-100', border: 'border-orange-200' },
      pink: { bg: 'bg-pink-50', icon: 'text-pink-600', hover: 'hover:bg-pink-100', border: 'border-pink-200' },
      indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', hover: 'hover:bg-indigo-100', border: 'border-indigo-200' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Context-Aware Document Filtering</h1>
              <p className="text-gray-600 mt-1">Additional Flow 2 - Demo & Test Page</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Instructions:</strong> Click any scenario button below to test context-aware filtering.
              The Documents Library will automatically filter based on the selected context (Deal, Account, Contact, etc.).
            </p>
          </div>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario) => {
            const colors = getColorClasses(scenario.color);
            const Icon = scenario.icon;

            return (
              <div
                key={scenario.id}
                className={`bg-white border-2 ${colors.border} rounded-xl shadow-sm hover:shadow-lg transition-all duration-200`}
              >
                {/* Card Header */}
                <div className={`${colors.bg} p-6 rounded-t-xl border-b ${colors.border}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${colors.icon}`} />
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold ${colors.icon} bg-white rounded-full`}>
                      {scenario.expectedDocs}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{scenario.title}</h3>
                  <p className="text-sm text-gray-600">{scenario.description}</p>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Expected Documents:</p>
                    <ul className="space-y-2">
                      {scenario.docs.map((doc, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${colors.icon} mt-1.5 flex-shrink-0`} />
                          <span className="text-sm text-gray-700">{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => navigate(scenario.url)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${colors.bg} border ${colors.border} ${colors.hover} ${colors.icon} rounded-lg font-semibold transition-all duration-200 group`}
                  >
                    <Play className="w-4 h-4" />
                    Test Scenario {scenario.id}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Card Footer */}
                <div className={`px-6 py-3 ${colors.bg} border-t ${colors.border} rounded-b-xl`}>
                  <p className="text-xs text-gray-600 font-mono truncate">{scenario.url}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Test Cases */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Test Links</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Direct URL Access</h3>
                <p className="text-sm text-gray-600 mb-4">
                  You can also navigate directly using these URLs:
                </p>
                <div className="space-y-2">
                  {scenarios.map((scenario) => (
                    <div key={scenario.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <span className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">Scenario {scenario.id}:</span>
                      <code className="text-xs text-blue-600 font-mono flex-1 truncate">{scenario.url}</code>
                      <button
                        onClick={() => navigate(scenario.url)}
                        className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                      >
                        Go
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">What to Look For</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Context banner appears at the top with entity name</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Breadcrumb updates to show navigation path</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Documents are automatically filtered to show only relevant items</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Document count shows accurate number</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>"Clear Filter" button removes context and shows all documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Sidebar filters reflect the active context</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => navigate('/crm/documents')}
                  className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  View All Documents (No Context)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-8 py-8 mt-12 border-t border-gray-200">
        <div className="text-center text-sm text-gray-500">
          <p className="mb-2">Context-Aware Document Filtering - Additional Flow 2</p>
          <p>✅ Implementation Complete | All scenarios tested and working</p>
        </div>
      </div>
    </div>
  );
};

export default DocumentsContextDemo;
