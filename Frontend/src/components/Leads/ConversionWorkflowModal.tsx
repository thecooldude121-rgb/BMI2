// Thin wrapper preserved for backward-compatible import paths.
// All conversion logic lives in LeadConversionWizard.
import React from 'react';
import type { Lead } from '../../types/lead';
import type { ConversionReadinessResult } from '../../utils/conversionReadiness';
import { useLeads } from '../../contexts/LeadContext';
import LeadConversionWizard from './LeadConversionWizard';

export interface ConversionWorkflowModalProps {
  lead:                    Lead;
  readiness:               ConversionReadinessResult;
  isOpen:                  boolean;
  onClose:                 () => void;
  onCreateContact?:        () => void;
  onCreateAccountContact?: () => void;
  onCreateDeal?:           () => void;
}

export default function ConversionWorkflowModal({
  lead, readiness, isOpen, onClose,
}: ConversionWorkflowModalProps) {
  const { updateLead } = useLeads();
  return (
    <LeadConversionWizard
      lead={lead}
      readiness={readiness}
      isOpen={isOpen}
      onClose={onClose}
      onUpdateLead={updateLead}
    />
  );
}
