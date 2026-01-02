import React from 'react';
import { Download, FileText } from 'lucide-react';

const Invoices: React.FC = () => {
  const invoices = [
    { id: 'INV-001', date: '2024-02-15', amount: '$99.00', status: 'Paid' },
    { id: 'INV-002', date: '2024-01-15', amount: '$99.00', status: 'Paid' },
    { id: 'INV-003', date: '2023-12-15', amount: '$99.00', status: 'Paid' }
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
        <p className="text-sm text-gray-600 mt-1">View and download your invoices</p>
      </div>

      <div className="space-y-3">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">{invoice.id}</div>
                <div className="text-sm text-gray-600">{invoice.date}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-medium text-gray-900">{invoice.amount}</div>
                <div className="text-xs text-green-600">{invoice.status}</div>
              </div>
              <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Invoices;
