import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="hs-modal-backdrop" onClick={onClose}>
      <div
        className={`hs-modal hs-modal-${size}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="hs-modal-handle" />
        {title && (
          <div className="hs-card-header">
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{title}</h3>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.25rem',
                borderRadius: 'var(--radius-sm)',
              }}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div className="hs-card-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
