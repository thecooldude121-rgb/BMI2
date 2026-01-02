import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ForbiddenAccessProps {
  message?: string;
  title?: string;
  returnPath?: string;
  returnLabel?: string;
}

const ForbiddenAccess: React.FC<ForbiddenAccessProps> = ({
  message = "Team Management settings are only accessible to Admin users. Contact your system administrator for access.",
  title = "403 - Access Forbidden",
  returnPath = "/settings",
  returnLabel = "Return to Settings"
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white border-2 border-red-200 rounded-lg p-8 text-center shadow-lg">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <ShieldAlert className="h-10 w-10 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {title}
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            {message}
          </p>

          {/* Action Button */}
          <button
            onClick={() => navigate(returnPath)}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            {returnLabel}
          </button>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              If you believe you should have access to this page, please contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenAccess;
