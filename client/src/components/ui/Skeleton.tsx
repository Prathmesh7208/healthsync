import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  borderRadius,
  style,
  className = '',
  ...props
}) => {
  let defaultHeight: string | number = '1rem';
  let defaultWidth: string | number = '100%';
  let defaultRadius = 'var(--radius-sm)';

  if (variant === 'text') {
    defaultHeight = '0.875rem';
    defaultWidth = width || '80%';
    defaultRadius = '4px';
  } else if (variant === 'circular') {
    defaultHeight = height || '40px';
    defaultWidth = width || '40px';
    defaultRadius = '50%';
  } else if (variant === 'card') {
    defaultHeight = height || '140px';
    defaultRadius = 'var(--radius-md)';
  }

  return (
    <div
      className={`shimmer-loader ${className}`}
      style={{
        width: width || defaultWidth,
        height: height || defaultHeight,
        borderRadius: borderRadius || defaultRadius,
        ...style,
      }}
      {...props}
    />
  );
};

export default Skeleton;
