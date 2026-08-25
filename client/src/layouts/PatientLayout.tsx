import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Search,
  Calendar,
  FileText,
  Pill,
  LogOut,
  Globe,
  Settings,
} from 'lucide-react';
import useAuthStore, { Language } from '../stores/authStore';
import SOSButton from '../components/emergency/SOSButton';
import Avatar from '../components/ui/Avatar';
import Logo from '../components/ui/Logo';

export const PatientLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, language, setLanguage } = useAuthStore();

  const handleLanguageToggle = () => {
    const nextLang: Language = language === 'EN' ? 'HI' : language === 'HI' ? 'MR' : 'EN';
    setLanguage(nextLang);
    i18n.changeLanguage(nextLang);
  };

  const navItems = [
    { to: '/patient/home', label: t('nav.home'), icon: <Home size={22} /> },
    { to: '/patient/doctors', label: t('nav.search'), icon: <Search size={22} /> },
    { to: '/patient/appointments', label: t('nav.appointments'), icon: <Calendar size={22} /> },
    { to: '/patient/records', label: t('nav.records'), icon: <FileText size={22} /> },
    { to: '/patient/reminders', label: t('nav.reminders'), icon: <Pill size={22} /> },
    { to: '/patient/settings', label: t('nav.settings') || 'Settings', icon: <Settings size={22} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
      {/* Top Navigation Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid var(--border-subtle)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
          }}
        >
          {/* Brand Logo with Image */}
          <Logo size="sm" onClick={() => navigate('/patient/home')} />

          {/* Desktop Nav Links */}
          <nav className="desktop-nav" style={{ gap: '0.5rem', alignItems: 'center' }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--color-primary-600)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'var(--color-primary-50)' : 'transparent',
                  transition: 'all 0.15s ease',
                })}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Trilingual Switcher */}
            <button
              type="button"
              onClick={handleLanguageToggle}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.375rem 0.625rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--bg-surface-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Change Language"
            >
              <Globe size={14} />
              <span>{language === 'EN' ? 'English' : language === 'HI' ? 'हिंदी' : 'मराठी'}</span>
            </button>

            {/* Profile Avatar & Logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                onClick={() => navigate('/patient/profile/setup')}
                style={{ cursor: 'pointer' }}
                title="Profile"
              >
                <Avatar name={user?.phone || 'Patient'} size="sm" />
              </div>
              <button
                type="button"
                onClick={logout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
                title={t('nav.logout')}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: '5.5rem' }}>
        <Outlet />
      </main>

      {/* Floating SOS Action Button (Hidden on dedicated Emergency page to prevent button overlap) */}
      {!location.pathname.startsWith('/patient/emergency') && <SOSButton />}

      {/* Mobile Bottom Navigation Bar - Clean, Icon-Centric HUD */}
      <nav
        className="mobile-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '0.375rem 0.25rem calc(0.375rem + env(safe-area-inset-bottom, 0px)) 0.25rem',
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              padding: '0.375rem 0.5rem',
              borderRadius: '10px',
              backgroundColor: isActive ? 'var(--color-primary-50)' : 'transparent',
              color: isActive ? 'var(--color-primary-600)' : '#64748B',
              minWidth: '46px',
              transition: 'all 0.15s ease',
            })}
          >
            {item.icon}
            <span style={{ fontSize: '0.625rem', fontWeight: 700, marginTop: '2px', whiteSpace: 'nowrap' }}>
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default PatientLayout;
