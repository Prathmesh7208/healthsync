import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="hs-input-group">
        {label && (
          <label htmlFor={inputId} className="hs-label">
            {label}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leftIcon && (
            <div style={{ position: 'absolute', left: '0.75rem', pointerEvents: 'none', color: 'var(--text-muted)' }}>
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`hs-input ${error ? 'has-error' : ''} ${className}`}
            style={{
              paddingLeft: leftIcon ? '2.5rem' : undefined,
              paddingRight: rightIcon ? '2.5rem' : undefined,
            }}
            {...props}
          />
          {rightIcon && (
            <div style={{ position: 'absolute', right: '0.75rem', color: 'var(--text-muted)' }}>
              {rightIcon}
            </div>
          )}
        </div>
        {error && <span className="hs-input-error">{error}</span>}
        {!error && helperText && <span className="hs-input-helper">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
