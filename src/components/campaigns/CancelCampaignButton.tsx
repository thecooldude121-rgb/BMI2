import React from 'react';
import { X } from 'lucide-react';

interface CancelCampaignButtonProps {
  onClick: () => void;
}

export default function CancelCampaignButton({ onClick }: CancelCampaignButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        inline-flex items-center justify-center
        w-10 h-10 rounded-lg
        border-2 border-gray-300
        text-gray-600 bg-white
        hover:bg-gray-50 hover:border-gray-400 hover:text-gray-800
        transition-all duration-200
        group
      "
      type="button"
      title="Cancel and close"
      aria-label="Cancel and close campaign wizard"
    >
      <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
    </button>
  );
}
