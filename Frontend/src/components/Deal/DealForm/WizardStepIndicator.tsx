import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  { label: 'Core Info' },
  { label: 'Stakeholders' },
  { label: 'Product & Close' },
];

interface Props {
  currentStep: 1 | 2 | 3;
}

export const WizardStepIndicator: React.FC<Props> = ({ currentStep }) => (
  <div className="flex items-center max-w-lg mx-auto px-8 py-4 select-none">
    {STEPS.map((step, index) => {
      const num = (index + 1) as 1 | 2 | 3;
      const done = num < currentStep;
      const active = num === currentStep;

      return (
        <React.Fragment key={num}>
          <div className="flex flex-col items-center flex-shrink-0">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                done
                  ? 'bg-blue-600 text-white'
                  : active
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : num}
            </div>
            <span
              className={`mt-1.5 text-xs font-semibold whitespace-nowrap transition-colors duration-200 ${
                active ? 'text-blue-600' : done ? 'text-gray-600' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>

          {index < STEPS.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-4 mb-5 transition-colors duration-300 ${
                num < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);
