import React, { useState, useRef } from 'react';
import { Mail, ChevronDown, ChevronUp, Sparkles, X, Loader2 } from 'lucide-react';
import { emailParser, ParsedEmailExtraction } from '../../../utils/emailParser';
import { EmailExtractionReview } from './EmailExtractionReview';

interface EmailToDealPanelProps {
  formData: Record<string, any>;
  onApplyField: (field: string, value: any) => void;
}

const SAMPLE_EMAIL = `From: Sarah Chen <sarah.chen@acmecorp.com>
To: sales@yourcompany.com
Subject: Interested in HRMS Platform

Hi there,

I'm the Head of HR at Acme Corp and we're evaluating HRMS solutions for our team of 200+ employees.

We have a budget of around $48,000 and need to make a decision by end of Q3 2026.

We're particularly interested in your payroll and automation modules. Can we schedule a demo?

Next steps: Please send over a proposal and book a 30-minute call this week.

Best regards,
Sarah Chen
Acme Corp
sarah.chen@acmecorp.com`;

export const EmailToDealPanel: React.FC<EmailToDealPanelProps> = ({
  formData,
  onApplyField,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [emailText, setEmailText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [extraction, setExtraction] = useState<ParsedEmailExtraction | null>(null);
  const [showSample, setShowSample] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleExpand = () => {
    setExpanded(true);
    setTimeout(() => textareaRef.current?.focus(), 80);
  };

  const handleCollapse = () => {
    setExpanded(false);
    setExtraction(null);
    setEmailText('');
    setShowSample(false);
  };

  const handlePasteSample = () => {
    setEmailText(SAMPLE_EMAIL);
    setShowSample(false);
    textareaRef.current?.focus();
  };

  const handleExtract = () => {
    if (!emailText.trim()) return;
    setParsing(true);
    // Simulate async parser (ready for real async LLM call)
    setTimeout(() => {
      const result = emailParser.parse(emailText);
      setExtraction(Object.keys(result).length > 0 ? result : null);
      setParsing(false);
    }, 400);
  };

  const handleDismissExtraction = () => {
    setExtraction(null);
  };

  // Collapsed: just a button
  if (!expanded) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-4 shadow-sm">
        <button
          onClick={handleExpand}
          className="w-full flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Mail className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                Create from Email
                <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-medium">
                  AI Assist
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Paste an email thread or meeting notes to auto-fill deal fields
              </div>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
        </button>
      </div>
    );
  }

  // Expanded: paste area + review
  return (
    <div className="bg-white rounded-xl border border-blue-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Mail className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              Create from Email
              <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-medium">
                AI Assist
              </span>
            </h3>
            <p className="text-xs text-gray-500">
              Paste email, thread, or meeting notes below
            </p>
          </div>
        </div>
        <button
          onClick={handleCollapse}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Collapse"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      <div className="px-5 py-4">
        {/* Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={emailText}
            onChange={e => setEmailText(e.target.value)}
            placeholder="Paste email thread, forwarded email, or meeting notes here…"
            rows={6}
            className="w-full text-sm text-gray-800 placeholder-gray-400 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {emailText && (
            <button
              onClick={() => { setEmailText(''); setExtraction(null); }}
              className="absolute top-2.5 right-2.5 text-gray-300 hover:text-gray-500 transition-colors"
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sample email helper */}
        <div className="mt-2 flex items-center justify-between">
          <button
            onClick={() => setShowSample(v => !v)}
            className="text-xs text-gray-400 hover:text-blue-600 transition-colors underline-offset-2 hover:underline"
          >
            {showSample ? 'Hide example' : 'See example email'}
          </button>
          <span className="text-xs text-gray-400">{emailText.length} chars</span>
        </div>

        {showSample && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">
            {SAMPLE_EMAIL}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <button
                onClick={handlePasteSample}
                className="text-blue-600 font-medium hover:underline"
              >
                Use this example →
              </button>
            </div>
          </div>
        )}

        {/* Extract button */}
        <button
          onClick={handleExtract}
          disabled={!emailText.trim() || parsing}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {parsing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Extracting fields…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Extract Fields
            </>
          )}
        </button>

        {/* No results notice */}
        {extraction !== null && Object.keys(extraction).length === 0 && (
          <p className="mt-3 text-sm text-center text-gray-500">
            No recognisable fields found. Try including company name, amounts, or dates.
          </p>
        )}

        {/* Extraction review */}
        {extraction && Object.keys(extraction).length > 0 && (
          <EmailExtractionReview
            extraction={extraction}
            formData={formData}
            onApply={onApplyField}
            onDismiss={handleDismissExtraction}
          />
        )}
      </div>
    </div>
  );
};
