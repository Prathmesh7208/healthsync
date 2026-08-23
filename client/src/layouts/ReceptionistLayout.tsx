import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Activity,
  LayoutDashboard,
  CalendarCheck,
  Users,
  Stethoscope,
  Siren,
  LogOut,
  Building2,
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import Avatar from '../components/ui/Avatar';
import Logo from '../components/ui/Logo';

export const ReceptionistLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();

  const [hospitalInfo, setHospitalInfo] = useState<any>(null);
  const [activeEmergenciesCount, setActiveEmergenciesCount] = useState<number>(0);

  useEffect(() => {
    const fetchHospitalData = async () => {
      try {
        const res = await axios.get('/api/v1/receptionist/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const h = res.data.data.hospital;
        setHospitalInfo(h);

        if (h?.id) {
          const emgRes = await axios.get(`/api/v1/receptionist/hospitals/${h.id}/emergencies`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setActiveEmergenciesCount(emgRes.data.data?.length || 0);
        }
      } catch {
        // defaults
      }
    };

    if (token) fetchHospitalData();
  }, [token]);

  const navItems = [
    { to: '/receptionist/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/receptionist/appointments', label: 'Check-in', icon: <CalendarCheck size={20} /> },
    { to: '/receptionist/queue', label: 'Queue', icon: <Users size={20} /> },
    { to: '/receptionist/doctors', label: 'Doctor Board', icon: <Stethoscope size={20} /> },
    {
      to: '/receptionist/emergencies',
      label: 'SOS Desk',
      icon: <Siren size={20} />,
      badge: activeEmergenciesCount > 0 ? activeEmergenciesCount : undefined,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
      {/* Mobile Top Header */}
      <header
        className="mobile-hide"
        style={{ display: 'none' }}
      />
      
      {/* Container with Sidebar on Desktop */}
      <div style={{ display: 'flex', flex: 1, minHeight: '100vh' }}>
        {/* Desktop Sidebar */}
        <aside
          className="desktop-nav"
          style={{
            width: '250px',
            backgroundColor: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-subtle)',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          {/* Hospital Branding Header */}
          <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <Logo size="sm" onClick={() => navigate('/receptionist/dashboard')} />
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-primary-600)', marginTop: '0.375rem' }}>
              HOSPITAL RECEPTION DESK
            </div>

            {hospitalInfo && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.625rem 0.75rem',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Building2 size={16} color="var(--text-muted)" />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {hospitalInfo.name}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{hospitalInfo.city}</div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? 'var(--color-primary-50)' : 'transparent',
                  color: isActive ? 'var(--color-primary-700)' : 'var(--text-secondary)',
                  transition: 'all var(--transition-fast)',
                })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    style={{
                      backgroundColor: 'var(--color-danger-600)',
                      color: '#FFFFFF',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Footer */}
          <div
            style={{
              padding: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <Avatar name={user?.phone || 'Receptionist'} size="sm" />
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Front Desk</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{user?.phone}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* Mobile-only Header */}
          <div
            className="desktop-hide"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-primary-600)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Activity size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 800 }}>HealthSync</div>
                <div style={{ fontSize: '0.625rem', color: 'var(--color-primary-600)', fontWeight: 700 }}>RECEPTION DESK</div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
            >
              <LogOut size={18} />
            </button>
          </div>

          {activeEmergenciesCount > 0 && (
            <div
              style={{
                backgroundColor: 'var(--color-danger-600)',
                color: '#FFFFFF',
                padding: '0.625rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/receptionist/emergencies')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.8125rem' }}>
                <Siren size={16} className="animate-sos-pulse" />
                <span>🚨 EMERGENCY ALERT ({activeEmergenciesCount})</span>
              </div>
              <span style={{ fontSize: '0.75rem', textDecoration: 'underline' }}>Open Desk →</span>
            </div>
          )}

          <main style={{ flex: 1, padding: '1rem', paddingBottom: '5.5rem' }}>
            <Outlet />
          </main>

          {/* Mobile Bottom Navigation for Receptionist */}
          <nav
            className="mobile-bottom-nav"
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 30,
              backgroundColor: 'var(--bg-surface)',
              borderTop: '1px solid var(--border-subtle)',
              boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
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
                  color: isActive ? 'var(--color-primary-600)' : 'var(--text-muted)',
                  minWidth: '56px',
                  position: 'relative',
                })}
              >
                {item.icon}
                <span style={{ marginTop: '2px' }}>{item.label}</span>
                {item.badge && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '12px',
                      backgroundColor: 'var(--color-danger-600)',
                      color: '#FFFFFF',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.5625rem',
                      fontWeight: 800,
                      padding: '1px 4px',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistLayout;
