import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Radio,
  Siren,
  ArrowRight,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Button from '../../components/ui/Button';

export const AmbulanceDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [operator, setOperator] = useState<any>(null);
  const [activeEmergency, setActiveEmergency] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await axios.get('/api/v1/ambulance/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOperator(res.data.data.operator);
      setActiveEmergency(res.data.data.activeEmergency);
    } catch {
      // defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // 5s poll for instant dispatch notifications
    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <Radio size={40} className="animate-sos-pulse" color="#38BDF8" />
        <p style={{ marginTop: '1rem', color: '#94A3B8' }}>Connecting to Emergency Fleet Dispatch...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* If Active Run Assigned */}
      {activeEmergency ? (
        <div
          style={{
            backgroundColor: '#1E293B',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid #EF4444',
            padding: '1.5rem',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Siren size={24} color="#EF4444" className="animate-sos-pulse" />
            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#EF4444', letterSpacing: '0.05em' }}>
              ACTIVE EMERGENCY DISPATCH
            </span>
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#FFFFFF' }}>
            {activeEmergency.patient?.fullName || 'Emergency Patient'}
          </h2>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              backgroundColor: '#0F172A',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94A3B8' }}>Blood Group:</span>
              <strong style={{ color: '#F8FAFC' }}>{activeEmergency.patient?.bloodGroup || 'UNKNOWN'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94A3B8' }}>Emergency Contact:</span>
              <strong style={{ color: '#38BDF8' }}>{activeEmergency.patient?.emergencyContactPhone || 'Not given'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94A3B8' }}>Current Lifecycle:</span>
              <span style={{ color: '#F59E0B', fontWeight: 700 }}>{activeEmergency.status}</span>
            </div>
          </div>

          <Button
            variant="danger"
            size="lg"
            rightIcon={<ArrowRight size={20} />}
            onClick={() => navigate(`/ambulance/active/${activeEmergency.id}`)}
            style={{ width: '100%', fontSize: '1.0625rem', padding: '1rem' }}
          >
            Open Navigation & Status Controls
          </Button>
        </div>
      ) : operator?.currentStatus === 'OFF_DUTY' ? (
        /* Off Duty State */
        <div
          style={{
            backgroundColor: '#1E293B',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #334155',
            padding: '3rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <Radio size={48} color="#64748B" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>You are currently OFF DUTY</h2>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', maxWidth: '320px', margin: '0 auto 1.5rem auto' }}>
            Turn your status ON DUTY from the top switch to receive incoming SOS dispatch calls.
          </p>
        </div>
      ) : (
        /* Standing By Active Radar */
        <div
          style={{
            backgroundColor: '#1E293B',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #334155',
            padding: '3rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '88px',
              height: '88px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              border: '2px solid #38BDF8',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}
            className="animate-sos-pulse"
          >
            <Radio size={40} color="#38BDF8" />
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#FFFFFF' }}>
            Standing By for Emergency Dispatch
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', maxWidth: '340px', margin: '0 auto' }}>
            GPS position is broadcasting to hospital control centers. Keep your device active and audio enabled.
          </p>

          <div
            style={{
              marginTop: '2rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#0F172A',
              borderRadius: 'var(--radius-md)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8125rem',
              color: '#4ADE80',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ADE80' }} />
            <span>Unit {operator?.vehicleNumber} is Ready & Operational</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmbulanceDashboardPage;
