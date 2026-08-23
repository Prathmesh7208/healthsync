import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Stethoscope,
  Building2,
  Users,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import Avatar from '../components/ui/Avatar';
import Logo from '../components/ui/Logo';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/admin/doctors', label: 'Doctor Management', icon: <Stethoscope size={20} /> },
    { to: '/admin/hospitals', label: 'Hospitals', icon: <Building2 size={20} /> },
    { to: '/admin/users', label: 'User Directory', icon: <Users size={20} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0B132B' }}>
      {/* Top Admin Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          backgroundColor: '#1C2541',
          borderBottom: '1px solid #3A506B',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
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
          {/* Logo & Superadmin Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Logo size="sm" variant="dark" onClick={() => navigate('/admin/dashboard')} />
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: '#60A5FA',
                padding: '3px 10px',
                borderRadius: '9999px',
                fontSize: '0.6875rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                border: '1px solid rgba(59, 130, 246, 0.4)',
              }}
            >
              <ShieldCheck size={13} />
              <span>SUPERADMIN PORTAL</span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="desktop-nav" style={{ gap: '0.5rem', alignItems: 'center' }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  textDecoration: 'none',
                  padding: '0.5rem 0.875rem',
                  borderRadius: '8px',
                  backgroundColor: isActive ? '#3A506B' : 'transparent',
                  transition: 'all 0.15s ease',
                })}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Admin User Info & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <Avatar name={user?.phone || 'Admin'} size="sm" />
              <div className="mobile-hide">
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#FFFFFF' }}>Platform Admin</div>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{user?.phone}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#F87171',
                cursor: 'pointer',
                padding: '0.375rem 0.75rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
              title="Sign out of Admin Portal"
            >
              <LogOut size={14} />
              <span className="mobile-hide">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Dashboard Content */}
      <main style={{ flex: 1, padding: '1.5rem 1rem', paddingBottom: '5.5rem', color: '#F8FAFC' }}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation for Admin */}
      <nav
        className="mobile-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          backgroundColor: '#1C2541',
          borderTop: '1px solid #3A506B',
          boxShadow: '0 -4px 15px rgba(0, 0, 0, 0.4)',
          justifyContent: 'space-around',
          padding: '0.5rem 0.25rem',
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
              fontSize: '0.6875rem',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#60A5FA' : '#94A3B8',
              minWidth: '56px',
            })}
          >
            {item.icon}
            <span style={{ marginTop: '2px' }}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default AdminLayout;
