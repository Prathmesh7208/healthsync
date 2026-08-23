import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'var(--color-primary-600)',
  className = '',
}) => {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 36,
  };

  const px = sizeMap[size];

  return (
    <span
      className={`animate-spin ${className}`}
      style={{
        display: 'inline-block',
        width: `${px}px`,
        height: `${px}px`,
        border: `${size === 'sm' ? 2 : 3}px solid ${color}`,
        borderTopColor: 'transparent',
        borderRadius: '50%',
      }}
      role="status"
      aria-label="loading"
    />
  );
};

export default Spinner;
