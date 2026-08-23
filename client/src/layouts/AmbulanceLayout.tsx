import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Siren,
  Navigation,
  History,
  LogOut,
  Radio,
} from 'lucide-react';
import useAuthStore from '../stores/authStore';

export const AmbulanceLayout: React.FC = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuthStore();

  const [operator, setOperator] = useState<any>(null);
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const fetchOperatorData = async () => {
      try {
        const res = await axios.get('/api/v1/ambulance/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const op = res.data.data.operator;
        setOperator(op);
        setIsOnDuty(op.currentStatus !== 'OFF_DUTY');
      } catch {
        // defaults
      }
    };
    if (token) fetchOperatorData();
  }, [token]);

  const handleToggleDuty = async () => {
    setToggling(true);
    try {
      const nextStatus = isOnDuty ? 'OFF_DUTY' : 'AVAILABLE';
      await axios.put(
        '/api/v1/ambulance/me/status',
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsOnDuty(!isOnDuty);
    } catch {
      // ignore
    } finally {
      setToggling(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
      }}
    >
      {/* High-Contrast Mobile-First Top Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          backgroundColor: '#1E293B',
          borderBottom: '1px solid #334155',
          padding: '0.75rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          onClick={() => navigate('/ambulance/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-danger-600)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Siren size={22} className="animate-sos-pulse" />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>Ambulance Unit</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-warning-400)' }}>
              {operator?.vehicleNumber || 'MH-12-AM-9999'}
            </div>
          </div>
        </div>

        {/* Duty Toggle & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handleToggleDuty}
            disabled={toggling}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${isOnDuty ? '#22C55E' : '#EF4444'}`,
              backgroundColor: isOnDuty ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: isOnDuty ? '#4ADE80' : '#FCA5A5',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <Radio size={14} className={isOnDuty ? 'animate-sos-pulse' : ''} />
            <span>{isOnDuty ? 'ON DUTY' : 'OFF DUTY'}</span>
          </button>

          <button
            type="button"
            onClick={logout}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.25rem' }}
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main style={{ flex: 1, padding: '1rem', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>

      {/* Bottom Bar Navigation */}
      <nav
        style={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: '#1E293B',
          borderTop: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '0.5rem 0',
          zIndex: 30,
        }}
      >
        <NavLink
          to="/ambulance/dashboard"
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            fontSize: '0.75rem',
            color: isActive ? '#38BDF8' : '#94A3B8',
            textDecoration: 'none',
            fontWeight: isActive ? 700 : 500,
          })}
        >
          <Navigation size={20} />
          <span>Active View</span>
        </NavLink>

        <NavLink
          to="/ambulance/history"
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            fontSize: '0.75rem',
            color: isActive ? '#38BDF8' : '#94A3B8',
            textDecoration: 'none',
            fontWeight: isActive ? 700 : 500,
          })}
        >
          <History size={20} />
          <span>Run History</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default AmbulanceLayout;
