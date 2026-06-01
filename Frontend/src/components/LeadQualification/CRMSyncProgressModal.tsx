import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { crmSyncConfig, SyncAction } from '../../utils/crmSyncMockData';

interface SyncStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface CRMSyncProgressModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const CRMSyncProgressModal: React.FC<CRMSyncProgressModalProps> = ({
  isOpen,
  onComplete
}) => {
  const getInitialSteps = (): SyncStep[] => {
    return crmSyncConfig.syncActions.map((action: SyncAction) => ({
      id: action.action,
      label: action.description,
      status: 'pending' as const
    }));
  };

  const [steps, setSteps] = useState<SyncStep[]>(getInitialSteps());
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setSteps(getInitialSteps());
      setProgress(0);
      return;
    }

    const executeSyncActions = async () => {
      const totalSteps = steps.length;

      for (let i = 0; i < totalSteps; i++) {
        setSteps(prevSteps => {
          const newSteps = [...prevSteps];

          if (i > 0) {
            newSteps[i - 1].status = 'completed';
          }

          newSteps[i].status = 'in_progress';
          return newSteps;
        });

        const newProgress = ((i + 1) / totalSteps) * 100;
        setProgress(newProgress);

        await new Promise(resolve => setTimeout(resolve, 800));
      }

      setSteps(prevSteps => {
        const newSteps = [...prevSteps];
        newSteps[newSteps.length - 1].status = 'completed';
        return newSteps;
      });

      setProgress(100);

      setTimeout(() => {
        onComplete();
      }, 1000);
    };

    executeSyncActions();
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 text-center">
            SYNCING TO CRM...
          </h3>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-emerald-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-sm font-medium text-gray-900">
              {Math.round(progress)}%
            </p>
          </div>

          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-3"
              >
                {step.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                ) : step.status === 'in_progress' ? (
                  <Loader2 className="h-5 w-5 text-blue-600 flex-shrink-0 animate-spin" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    step.status === 'completed'
                      ? 'text-emerald-600 font-medium'
                      : step.status === 'in_progress'
                      ? 'text-blue-600 font-medium'
                      : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-600 italic">
            Please wait, this may take a few seconds...
          </p>
        </div>
      </div>
    </div>
  );
};

export default CRMSyncProgressModal;
