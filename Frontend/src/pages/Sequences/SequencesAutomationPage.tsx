import React from 'react';
import { NotAvailable } from '../../components/common/NotAvailable';

/**
 * Sequences — NOT BUILT HERE, and probably never should be.
 *
 * Rewritten 2026-10-03. This page rendered invented stats ("12" sequences,
 * "1,247" enrolled, "12.4%" reply rate), a dead "Create Sequence" button, a
 * feature brochure, and a developer note claiming "Database schema created •
 * Service layer implemented". None of it was true.
 *
 * CLAUDE.md places outbound sequences in the separate Lead Generation product,
 * which does not belong in this repo. Whether to delete this route outright is
 * an open decision; until then it says what is true.
 */
const SequencesAutomationPage: React.FC = () => (
  <div className="min-h-screen bg-gray-50 px-8 py-8">
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-900">Sequences</h1>
    </div>
    <NotAvailable
      feature="Outreach sequencing"
      detail="Nothing is enrolled and no email is sent from this CRM. Outbound sequences belong to the separate BMI Lead Generation product."
    />
  </div>
);

export default SequencesAutomationPage;
