import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  type?: 'success' | 'warning' | 'danger' | 'info';
  title?: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const iconMap = {
    success: <CheckCircle2 size={18} color="var(--color-success-600)" />,
    warning: <AlertTriangle size={18} color="var(--color-warning-600)" />,
    danger: <AlertCircle size={18} color="var(--color-danger-600)" />,
    info: <Info size={18} color="var(--color-primary-600)" />,
  };

  return (
    <div
      className="hs-card"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        minWidth: '300px',
        maxWidth: '420px',
        boxShadow: 'var(--shadow-lg)',
        borderLeft: `4px solid var(--color-${type === 'info' ? 'primary' : type}-600)`,
        animation: 'modal-enter 180ms ease-out',
      }}
      role="alert"
    >
      <div style={{ flexShrink: 0, marginTop: '2px' }}>{iconMap[type]}</div>
      <div style={{ flex: 1 }}>
        {title && <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{title}</h4>}
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: '2px',
        }}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
