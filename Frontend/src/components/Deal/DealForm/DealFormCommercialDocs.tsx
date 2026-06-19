import React from 'react';
import { Link, Calendar, Info } from 'lucide-react';

interface DealFormCommercialDocsProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

function LinkInput({
  label, field, value, onChange, placeholder,
}: {
  label: string; field: string; value: string;
  onChange: (f: string, v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Link className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="url"
          value={value || ''}
          onChange={e => onChange(field, e.target.value)}
          placeholder={placeholder || 'https://...'}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}

export const DealFormCommercialDocs: React.FC<DealFormCommercialDocsProps> = ({ formData, onChange }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 lg:p-6 shadow-sm space-y-6">

      {/* ── Commercial Docs & Links ── */}
      <div>
        <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-100">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Link className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">Commercial Documentations &amp; Links</h2>
            <p className="text-xs text-gray-500">Paste links to shared folders, contracts, and discovery documents</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LinkInput
            label="Sales Drive Folder"
            field="salesDriveFolder"
            value={formData.salesDriveFolder}
            onChange={onChange}
            placeholder="https://drive.google.com/..."
          />
          <LinkInput
            label="Agreement"
            field="agreementUrl"
            value={formData.agreementUrl}
            onChange={onChange}
            placeholder="https://docs.google.com/..."
          />
          <LinkInput
            label="Account & Module Setup"
            field="accountModuleSetup"
            value={formData.accountModuleSetup}
            onChange={onChange}
            placeholder="https://notion.so/..."
          />
          <LinkInput
            label="Client Discovers"
            field="clientDiscovers"
            value={formData.clientDiscovers}
            onChange={onChange}
            placeholder="https://drive.google.com/..."
          />
        </div>
      </div>

      {/* ── Record Information ── */}
      <div>
        <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-100">
          <div className="p-2 bg-gray-50 rounded-lg">
            <Calendar className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">Record Information</h2>
            <p className="text-xs text-gray-500">When and how this opportunity was identified</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Discovery Date</label>
            <input
              type="date"
              value={formData.discoveryDate || ''}
              onChange={e => onChange('discoveryDate', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">Date the opportunity was first identified</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Source / Lead ID</label>
            <input
              type="text"
              value={formData.source || ''}
              onChange={e => onChange('source', e.target.value)}
              placeholder="e.g. referral, apollo-lead-123"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
            <p className="mt-1 text-xs text-gray-400">Lead source or external lead ID</p>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
          <Info className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500">
            <span className="font-medium text-gray-600">Created By</span> and <span className="font-medium text-gray-600">Modified By</span> are automatically recorded from your login session.
          </p>
        </div>
      </div>

    </div>
  );
};
