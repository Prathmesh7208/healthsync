import React from 'react';
import { Siren, Bell, Pill, Calendar, X } from 'lucide-react';
import useNotificationStore from '../../stores/notificationStore';
import useSocketEvent from '../../hooks/useSocket';

export const NotificationToastContainer: React.FC = () => {
  const { toasts, addToast, removeToast } = useNotificationStore();

  // Socket event bindings
  useSocketEvent('notification:new', (payload: any) => {
    addToast({
      title: payload.title || 'Notification',
      body: payload.body || '',
      type: payload.type || 'SYSTEM',
      data: payload.data,
    });
  });

  useSocketEvent('emergency:incoming-alert', (payload: any) => {
    addToast({
      title: '🚨 INCOMING EMERGENCY SOS',
      body: `Emergency patient: ${payload.patientName || 'Anonymous'}. Coordinates: ${Number(payload.latitude).toFixed(3)}, ${Number(payload.longitude).toFixed(3)}`,
      type: 'EMERGENCY',
      data: payload,
    });
  });

  useSocketEvent('doctor:availability-changed', (payload: any) => {
    addToast({
      title: 'Doctor Status Update',
      body: `Doctor is now ${payload.isAvailable ? 'Available for Consultations' : 'Busy / Off Duty'}`,
      type: 'SYSTEM',
    });
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'EMERGENCY':
        return <Siren size={20} color="#EF4444" className="animate-sos-pulse" />;
      case 'REMINDER':
        return <Pill size={20} color="#0D9488" />;
      case 'APPOINTMENT':
        return <Calendar size={20} color="#1A56DB" />;
      default:
        return <Bell size={20} color="#475569" />;
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '1.25rem',
        right: '1.25rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
        maxWidth: '380px',
        width: 'calc(100% - 2.5rem)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            pointerEvents: 'auto',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1rem',
            boxShadow: 'var(--shadow-xl)',
            borderLeft: `4px solid ${
              t.type === 'EMERGENCY'
                ? '#EF4444'
                : t.type === 'REMINDER'
                ? '#0D9488'
                : t.type === 'APPOINTMENT'
                ? '#1A56DB'
                : '#475569'
            }`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ flexShrink: 0, marginTop: '2px' }}>{getIcon(t.type)}</div>

          <div style={{ flex: 1 }}>
            <h4
              style={{
                margin: 0,
                fontSize: '0.875rem',
                fontWeight: 700,
                color: t.type === 'EMERGENCY' ? '#DC2626' : 'var(--text-primary)',
              }}
            >
              {t.title}
            </h4>
            <p
              style={{
                margin: '0.25rem 0 0 0',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
              }}
            >
              {t.body}
            </p>
          </div>

          <button
            type="button"
            onClick={() => removeToast(t.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToastContainer;
