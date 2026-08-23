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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC' }}>
      {/* Top Admin Header - Light Mode */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
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
          {/* Logo & Superadmin Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <Logo size="sm" onClick={() => navigate('/admin/dashboard')} />
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                backgroundColor: '#EFF6FF',
                color: '#1D4ED8',
                padding: '3px 10px',
                borderRadius: '9999px',
                fontSize: '0.6875rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                border: '1px solid #BFDBFE',
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
                  color: isActive ? '#1A56DB' : '#475569',
                  textDecoration: 'none',
                  padding: '0.5rem 0.875rem',
                  borderRadius: '8px',
                  backgroundColor: isActive ? '#EFF6FF' : 'transparent',
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
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>Platform Admin</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>{user?.phone}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              style={{
                background: '#FEF2F2',
                border: '1px solid #FEE2E2',
                color: '#DC2626',
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
      <main style={{ flex: 1, padding: '1.5rem 1rem', paddingBottom: '5.5rem', color: '#0F172A' }}>
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
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          boxShadow: '0 -4px 15px rgba(0, 0, 0, 0.05)',
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
              color: isActive ? '#1A56DB' : '#64748B',
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
