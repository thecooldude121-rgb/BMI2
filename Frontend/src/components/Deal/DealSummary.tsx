import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, DollarSign, User, Building, Calendar, Target, Zap, Save, Clock, CheckCircle } from 'lucide-react';
import { DealFormData } from '../../types/deal';

interface DealSummaryProps {
  formData: DealFormData;
  onClose?: () => void;
  isDraftSaved: boolean;
}

const DealSummary: React.FC<DealSummaryProps> = ({ formData, onClose, isDraftSaved }) => {
  const navigate = useNavigate();
  
  const handleClose = onClose || (() => navigate('/crm/deals'));
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: formData.currency || 'USD'
    }).format(amount);
  };

  const getCompletionPercentage = () => {
    const requiredFields = [
      formData.ownerId,
      formData.dealType,
      formData.country,
      formData.name,
      formData.pipelineId,
      formData.amount > 0
    ];
    
    const completedFields = requiredFields.filter(Boolean).length;
    return Math.round((completedFields / requiredFields.length) * 100);
  };

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="w-96 bg-white border-l border-gray-200 shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Deal Summary</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Completion Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Completion</span>
            <span className="text-sm text-gray-600">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Auto-save Status */}
        <div className="flex items-center space-x-2 text-sm">
          {isDraftSaved ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-600">Draft saved</span>
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Auto-save enabled</span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        {/* Deal Name & Value */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
            <DollarSign className="h-4 w-4 mr-2 text-green-600" />
            Deal Overview
          </h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-600">Deal Name</p>
              <p className="font-medium text-gray-900">
                {formData.name || 'Untitled Deal'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Value</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(formData.amount)}
              </p>
            </div>
            {formData.probability > 0 && (
              <div>
                <p className="text-xs text-gray-600">Weighted Value ({formData.probability}%)</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(formData.amount * (formData.probability / 100))}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Key Details */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Key Details</h3>
          
          {/* Owner */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <User className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-600">Owner</p>
              <p className="font-medium text-gray-900">
                {formData.ownerId || 'Not assigned'}
              </p>
            </div>
          </div>

          {/* Deal Type */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Target className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-600">Type</p>
              <p className="font-medium text-gray-900">
                {formData.dealType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
            </div>
          </div>

          {/* Stage */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Zap className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-600">Stage</p>
              <p className="font-medium text-gray-900">
                {formData.stageId.charAt(0).toUpperCase() + formData.stageId.slice(1).replace('-', ' ')}
              </p>
            </div>
          </div>

          {/* Close Date */}
          {formData.closingDate && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-600">Expected Close</p>
                <p className="font-medium text-gray-900">
                  {new Date(formData.closingDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Financial Breakdown */}
        {(formData.platformFee + formData.customFee + formData.licenseFee + formData.onboardingFee) > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Financial Breakdown</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
              {formData.platformFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Platform Fee</span>
                  <span className="font-medium">{formatCurrency(formData.platformFee)}</span>
                </div>
              )}
              {formData.customFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Custom Fee</span>
                  <span className="font-medium">{formatCurrency(formData.customFee)}</span>
                </div>
              )}
              {formData.licenseFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">License Fee</span>
                  <span className="font-medium">{formatCurrency(formData.licenseFee)}</span>
                </div>
              )}
              {formData.onboardingFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Onboarding Fee</span>
                  <span className="font-medium">{formatCurrency(formData.onboardingFee)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Products */}
        {formData.products.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Products ({formData.products.length})</h3>
            <div className="space-y-2">
              {formData.products.map(product => (
                <div key={product.id} className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>Qty: {product.quantity}</span>
                    <span className="font-medium text-purple-600">
                      {formatCurrency(product.totalPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Planned Activities */}
        {formData.plannedActivities.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Planned Activities ({formData.plannedActivities.length})</h3>
            <div className="space-y-2">
              {formData.plannedActivities.slice(0, 3).map(activity => (
                <div key={activity.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="font-medium text-gray-900 text-sm">{activity.title}</p>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>{activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</span>
                    <span className="text-orange-600">{activity.priority}</span>
                  </div>
                </div>
              ))}
              {formData.plannedActivities.length > 3 && (
                <p className="text-xs text-gray-500 text-center">
                  +{formData.plannedActivities.length - 3} more activities
                </p>
              )}
            </div>
          </div>
        )}

        {/* Next Steps */}
        {formData.nextSteps && (
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Next Steps</h3>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-gray-700">{formData.nextSteps}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="space-y-3">
          <button 
            onClick={async () => {
              try {
                console.log('DealSummary: Create Deal button clicked');
                // This will trigger the parent's save function
                const event = new CustomEvent('createDeal', { detail: formData });
                window.dispatchEvent(event);
              } catch (error) {
                console.error('Failed to create deal:', error);
              }
            }}
            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Save className="h-4 w-4 mr-2" />
            Create Deal
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              <Save className="h-3 w-3 mr-1" />
              Save Template
            </button>
            <button className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              <Target className="h-3 w-3 mr-1" />
              Save & Add Another
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealSummary;