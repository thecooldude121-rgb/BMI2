import React from 'react';
import { Package } from 'lucide-react';

interface DealFormProductDetailsProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const DealFormProductDetails: React.FC<DealFormProductDetailsProps> = ({ formData, onChange }) => {
  const products = ['Basic Plan', 'Growth Plan', 'Enterprise Plan', 'Custom Solution', 'Add-on Module'];
  const contractTerms = ['Monthly', 'Quarterly', 'Annual', 'Multi-year'];
  const paymentTerms = ['Due on Receipt', 'Net 15', 'Net 30', 'Net 60', 'Custom'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-6 pb-3 border-b border-gray-100">
        <div className="p-2 bg-amber-50 rounded-lg">
          <Package className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Product & Contract</h2>
          <p className="text-xs text-gray-500">What you're selling and on what terms</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Product/Package:</label>
          <select
            value={formData.product}
            onChange={(e) => onChange('product', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select product...</option>
            {products.map((product) => (
              <option key={product} value={product}>{product}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contract Term:</label>
          <select
            value={formData.contractTerm}
            onChange={(e) => onChange('contractTerm', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select term...</option>
            {contractTerms.map((term) => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms:</label>
          <select
            value={formData.paymentTerms}
            onChange={(e) => onChange('paymentTerms', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select payment terms...</option>
            {paymentTerms.map((term) => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
