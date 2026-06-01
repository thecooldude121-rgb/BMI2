import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

interface HRMSBadgeProps {
  recruitedDate: string;
  speakerName: string;
}

const HRMSBadge: React.FC<HRMSBadgeProps> = ({ recruitedDate, speakerName }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 border border-orange-300 rounded text-orange-700 text-xs font-medium cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Building2 className="w-3 h-3" />
        <span>HRMS</span>
      </div>

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
            <div className="font-semibold mb-1">HRMS Connection</div>
            <div className="text-gray-300">
              {speakerName} was recruited through HRMS in {recruitedDate}
            </div>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
};

export default HRMSBadge;
