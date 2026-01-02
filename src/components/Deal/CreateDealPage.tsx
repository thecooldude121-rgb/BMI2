import React, { useState } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import CreateDealWizard from './CreateDealWizard';
import { Deal } from '../../types/deal';
import { useNavigate } from 'react-router-dom';

const CreateDealPage: React.FC = () => {
  const navigate = useNavigate();
  const [showWizard, setShowWizard] = useState(true);

  const handleSaveDeal = async (dealData: Partial<Deal>) => {
    console.log('Saving deal:', dealData);
    // Here you would typically make an API call to save the deal
    // await createDeal(dealData);
    
    // For now, just navigate back to deals page
    navigate('/crm/deals');
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    navigate('/crm/deals');
  };

  if (!showWizard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Deal Creation Cancelled</h2>
          <button
            onClick={() => navigate('/crm/deals')}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Deals</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <CreateDealWizard
      onClose={handleCloseWizard}
      onSave={handleSaveDeal}
    />
  );
};

export default CreateDealPage;