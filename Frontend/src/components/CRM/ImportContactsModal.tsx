import React from 'react';
import { Button } from '../ui/Button';
import { X, Download } from 'lucide-react';
import { NotAvailable } from '../common/NotAvailable';

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * CSV import is NOT implemented, and this modal now says so.
 *
 * It previously accepted a file, showed a green tick and its size, and called
 * onImport(file) — which alerted "Importing contacts from x.csv..." and did
 * nothing with the bytes. Nothing ever parsed the file. Accepting an upload you
 * will never read is the most convincing kind of false confirmation: the user
 * has evidence the app received their data.
 *
 * What it needs: a bulk-create endpoint. Importing 400 rows as 400 POSTs can
 * half-succeed with no way to report which half — the same reason
 * POST /contacts/bulk exists for the other bulk actions. Column mapping and
 * per-row validation errors also need somewhere to be shown.
 *
 * The template download stays: it builds the CSV locally and genuinely works.
 */
const ImportContactsModal: React.FC<ImportContactsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const downloadTemplate = () => {
    const csv = 'Name,Company,Position,Email,Phone,Source,Tags,Status\nJohn Smith,Acme Corp,VP Sales,john@acme.com,+1 555-0123,lead-gen,"VIP,Decision Maker",active';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-2xl font-bold text-gray-900">Import Contacts</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Adding contacts today</h3>
            <p className="text-sm text-blue-800">
              Contacts can be added one at a time from <strong>+ Add Contact</strong>, which
              saves to your account immediately. The template below shows the columns a
              future import will expect.
            </p>
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={downloadTemplate}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <Download className="h-4 w-4" />
              <span>Download CSV Template</span>
            </button>
          </div>

          <NotAvailable
            feature="Importing contacts from a file"
            detail="Uploading a CSV does not create contacts yet, so this modal no longer accepts a file — it would look like the import had been received. Add contacts individually in the meantime."
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportContactsModal;
