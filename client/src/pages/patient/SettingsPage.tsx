import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Bell, Shield } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('healthsync_lang', lang);
  };

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी' },
    { code: 'mr', label: 'Marathi', native: 'मराठी' },
  ];

  return (
    <div className="container" style={{ maxWidth: '680px', padding: '1.5rem 1rem 4rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.25rem 0', color: 'var(--text-primary)' }}>
        {t('settings.title') || 'Settings & Preferences'}
      </h1>

      {/* Language Preference Card */}
      <Card style={{ marginBottom: '1.25rem' }}>
        <Card.Header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={18} color="var(--color-primary-600)" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
              {t('settings.language') || 'App Language (भाषा)'}
            </h3>
          </div>
        </Card.Header>

        <Card.Body style={{ padding: '1rem' }}>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Choose your preferred language for navigating HealthSync, viewing doctor profiles, and booking appointments.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => changeLanguage(lang.code)}
                style={{
                  padding: '0.875rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${
                    i18n.language === lang.code ? 'var(--color-primary-600)' : 'var(--border-subtle)'
                  }`,
                  backgroundColor:
                    i18n.language === lang.code ? 'var(--color-primary-50)' : 'var(--bg-surface)',
                  color:
                    i18n.language === lang.code ? 'var(--color-primary-800)' : 'var(--text-primary)',
                  fontWeight: i18n.language === lang.code ? 800 : 500,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>{lang.native}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang.label}</div>
              </button>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Notifications Preference */}
      <Card style={{ marginBottom: '1.25rem' }}>
        <Card.Header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={18} color="var(--color-primary-600)" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Notifications & Alerts</h3>
          </div>
        </Card.Header>

        <Card.Body style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.875rem' }}>Medication Reminders</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Receive prompt alerts for scheduled prescription doses
                </div>
              </div>
              <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              <div>
                <strong style={{ fontSize: '0.875rem' }}>Appointment Reminders</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Get notified 1 hour prior to doctor consultations
                </div>
              </div>
              <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              <div>
                <strong style={{ fontSize: '0.875rem' }}>Emergency SOS Broadcasts</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  High-priority audio alerts and live GPS tracking
                </div>
              </div>
              <input type="checkbox" defaultChecked disabled style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Account & Security */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <Card.Header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={18} color="var(--color-primary-600)" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Account & Privacy</h3>
          </div>
        </Card.Header>

        <Card.Body style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <strong style={{ fontSize: '0.875rem' }}>Registered Phone Number</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.phone || '+91 9876543210'}</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              HealthSync Platform v1.0.0 (Production Ready)
            </span>
            <Button variant="ghost" size="sm" onClick={logout} style={{ color: 'var(--color-danger-600)' }}>
              Sign Out
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default SettingsPage;
