import React from 'react';
import { X } from 'lucide-react';
import CsvImportPanel from './CsvImportPanel';
import { CONTACT_FIELDS, applyFullNameFallback } from '../../utils/csvImportSpec';
import { importContactsViaAPI } from '../../utils/importApi';

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Refetch the contact list after rows are committed. */
  onImported?: () => void;
}

/**
 * Contact CSV import.
 *
 * WHAT THIS USED TO BE, because the history is the reason for the shape:
 * first a modal that accepted a file, showed a green tick and its size, and
 * called onImport(file) — which alerted "Importing contacts from x.csv..." and
 * did nothing with the bytes. Nothing ever parsed the file. Then, correctly, a
 * <NotAvailable> saying so, because accepting an upload you will never read is
 * the most convincing kind of false confirmation: the user has evidence the app
 * received their data.
 *
 * It is now real. The parse, the validation, the duplicate check and the insert
 * all happen, and every row that does not make it is named with a reason.
 *
 * The flow lives in CsvImportPanel, shared with the accounts importer so the
 * two cannot drift apart. This file is the modal chrome and the contact-shaped
 * arguments: which columns to recognise, and where to POST.
 */
const ImportContactsModal: React.FC<ImportContactsModalProps> = ({ isOpen, onClose, onImported }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between rounded-t-lg border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Import Contacts</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              From a Salesforce, HubSpot or spreadsheet export.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <CsvImportPanel
            entityPlural="contacts"
            fields={CONTACT_FIELDS}
            templateFilename="contacts_template.csv"
            transformRows={applyFullNameFallback}
            dedupeKey="email"
            dedupeLabel="email"
            onImport={importContactsViaAPI}
            onImported={onImported}
          />
        </div>
      </div>
    </div>
  );
};

export default ImportContactsModal;
