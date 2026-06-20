import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Input Component - Reusable form input with validation
 */
const Input = React.forwardRef(({
  label,
  hint,
  error,
  type = 'text',
  showPasswordToggle = false,
  required = false,
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPassword = type === 'password';
  const displayType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="input-group">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          type={displayType}
          disabled={disabled}
          className={`
            w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200
            bg-white text-gray-900 placeholder-gray-400
            disabled:bg-gray-100 disabled:cursor-not-allowed
            focus:outline-none
            ${error
              ? 'border-error-500 focus:border-error-600 focus:ring-2 focus:ring-error-200'
              : 'border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
            }
            ${className}
          `}
          {...props}
        />
        {isPassword && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      {error && <span className="text-error-600 text-sm">{error}</span>}
      {hint && !error && <span className="input-hint">{hint}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
