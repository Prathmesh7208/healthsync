import React, { useRef, useState, useEffect } from 'react';

export interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  hasError?: boolean;
  disabled?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  hasError = false,
  disabled = false,
}) => {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const valArr = value.split('').slice(0, length);
    while (valArr.length < length) valArr.push('');
    setDigits(valArr);
  }, [value, length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1); // Only digits, last char
    const newDigits = [...digits];
    newDigits[idx] = char;
    setDigits(newDigits);

    const fullOtp = newDigits.join('');
    onChange(fullOtp);

    if (char && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }

    if (fullOtp.length === length && !newDigits.includes('')) {
      onComplete?.(fullOtp);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      if (!digits[idx] && idx > 0) {
        inputsRef.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasteData) return;

    const newDigits = pasteData.split('');
    while (newDigits.length < length) newDigits.push('');
    setDigits(newDigits);

    const fullOtp = newDigits.join('');
    onChange(fullOtp);

    // Focus last filled box
    const nextFocusIdx = Math.min(pasteData.length, length - 1);
    inputsRef.current[nextFocusIdx]?.focus();

    if (pasteData.length === length) {
      onComplete?.(pasteData);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        justifyContent: 'center',
        margin: '1.25rem 0',
      }}
    >
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[idx] || ''}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          disabled={disabled}
          autoFocus={idx === 0}
          style={{
            width: '46px',
            height: '52px',
            textAlign: 'center',
            fontSize: '1.5rem',
            fontWeight: 700,
            borderRadius: 'var(--radius-sm)',
            border: `2px solid ${
              hasError
                ? 'var(--color-danger-600)'
                : digits[idx]
                ? 'var(--color-primary-600)'
                : 'var(--border-strong)'
            }`,
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
            boxShadow: digits[idx] ? '0 0 0 3px rgba(26, 86, 219, 0.1)' : 'none',
          }}
          aria-label={`Digit ${idx + 1}`}
        />
      ))}
    </div>
  );
};

export default OTPInput;
