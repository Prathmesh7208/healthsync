import React from 'react';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'light' | 'dark';
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  variant = 'light',
  className = '',
  onClick,
}) => {
  const iconSizes = {
    sm: { box: 34, font: '1.125rem', sub: '0.625rem' },
    md: { box: 42, font: '1.375rem', sub: '0.6875rem' },
    lg: { box: 56, font: '1.75rem', sub: '0.8125rem' },
    xl: { box: 72, font: '2.25rem', sub: '0.9375rem' },
  }[size];

  const textColor = variant === 'dark' ? '#FFFFFF' : '#0F172A';

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'sm' ? '0.5rem' : '0.75rem',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {/* AI-Generated HealthSync Badge */}
      <img
        src="/logo.jpg"
        alt="HealthSync Logo"
        style={{
          width: `${iconSizes.box}px`,
          height: `${iconSizes.box}px`,
          borderRadius: size === 'xl' ? '18px' : size === 'lg' ? '14px' : '10px',
          objectFit: 'cover',
          boxShadow: '0 4px 14px rgba(26, 86, 219, 0.35)',
          flexShrink: 0,
        }}
      />

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <div
            style={{
              fontSize: iconSizes.font,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: textColor,
            }}
          >
            Health<span style={{ color: '#0D9488' }}>Sync</span>
          </div>
          {size !== 'sm' && (
            <span
              style={{
                fontSize: iconSizes.sub,
                fontWeight: 700,
                color: '#64748B',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginTop: '3px',
              }}
            >
              Healthcare Network
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
