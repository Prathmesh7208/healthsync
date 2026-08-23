import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Activity,
  LayoutDashboard,
  Calendar,
  Clock,
  User,
  LogOut,
  Power,
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import Avatar from '../components/ui/Avatar';

export const DoctorLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();
  const [isAvailable, setIsAvailable] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/v1/doctors/me/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAvailable(res.data.data.isAvailable);
      } catch {
        // default true
      }
    };
    if (token) fetchProfile();
  }, [token]);

  const handleToggleAvailability = async () => {
    setToggling(true);
    try {
      const nextState = !isAvailable;
      await axios.put(
        '/api/v1/doctors/me/availability',
        { isAvailable: nextState },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsAvailable(nextState);
    } catch {
      // ignore
    } finally {
      setToggling(false);
    }
  };

  const navItems = [
    { to: '/doctor/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/doctor/appointments', label: 'Appointments', icon: <Calendar size={20} /> },
    { to: '/doctor/schedule', label: 'Schedule & Breaks', icon: <Clock size={20} /> },
    { to: '/doctor/profile', label: 'My Profile', icon: <User size={20} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
      {/* Doctor Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
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
          {/* Logo & Portal Badge */}
          <div
            onClick={() => navigate('/doctor/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-primary-600)',
                color: '#FFFFFF',
              }}
            >
              <Activity size={22} />
            </div>
            <div>
              <span style={{ fontSize: '1.125rem', fontWeight: 800 }}>HealthSync</span>
              <span
                style={{
                  marginLeft: '0.5rem',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--color-primary-50)',
                  color: 'var(--color-primary-700)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                DOCTOR PORTAL
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
                })}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Availability Toggle & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Real-time Status Toggle */}
            <button
              type="button"
              onClick={handleToggleAvailability}
              disabled={toggling}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.375rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${isAvailable ? 'var(--color-success-600)' : 'var(--color-danger-600)'}`,
                backgroundColor: isAvailable ? 'var(--color-success-50)' : 'var(--color-danger-50)',
                color: isAvailable ? 'var(--color-success-700)' : 'var(--color-danger-700)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Toggle instant patient availability"
            >
              <Power size={14} />
              <span>{isAvailable ? 'Available for Patients' : 'Off Duty / Busy'}</span>
            </button>

            {/* Profile & Logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Avatar name={user?.phone || 'Doctor'} size="sm" />
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
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '1.5rem 1rem' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default DoctorLayout;
