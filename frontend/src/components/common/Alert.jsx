import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

/**
 * Alert Component - Reusable alert message with different types
 */
const Alert = ({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
  closeable = true,
}) => {
  const alertConfig = {
    success: {
      bg: 'bg-success-50',
      border: 'border-success-200',
      text: 'text-success-800',
      icon: <CheckCircle className="w-5 h-5" />,
    },
    error: {
      bg: 'bg-error-50',
      border: 'border-error-200',
      text: 'text-error-800',
      icon: <AlertCircle className="w-5 h-5" />,
    },
    warning: {
      bg: 'bg-warning-50',
      border: 'border-warning-200',
      text: 'text-warning-800',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    info: {
      bg: 'bg-primary-50',
      border: 'border-primary-200',
      text: 'text-primary-800',
      icon: <Info className="w-5 h-5" />,
    },
  };

  const config = alertConfig[type];

  return (
    <div className={`alert-${type} ${className} animate-fade-in`} role="alert">
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
        <div className="flex-1">
          {title && <h3 className="font-semibold mb-1">{title}</h3>}
          <p>{message}</p>
        </div>
        {closeable && onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close alert"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
