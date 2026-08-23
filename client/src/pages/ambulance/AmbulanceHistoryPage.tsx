import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { History, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Badge from '../../components/ui/Badge';

export const AmbulanceHistoryPage: React.FC = () => {
  const { token } = useAuthStore();

  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('/api/v1/ambulance/me/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistory(res.data.data || []);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchHistory();
  }, [token]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <History size={22} color="#38BDF8" />
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Emergency Run History</h1>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>Loading past runs...</div>
      ) : history.length === 0 ? (
        <div
          style={{
            backgroundColor: '#1E293B',
            borderRadius: 'var(--radius-md)',
            padding: '3rem 1rem',
            textAlign: 'center',
            color: '#94A3B8',
          }}
        >
          <CheckCircle2 size={40} style={{ margin: '0 auto 0.75rem auto' }} />
          <p style={{ margin: 0 }}>No past emergency runs on record.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {history.map((h) => (
            <div
              key={h.id}
              style={{
                backgroundColor: '#1E293B',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                border: '1px solid #334155',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8' }}>{h.emergencyId}</span>
                <Badge variant={h.status === 'RESOLVED' ? 'success' : 'neutral'}>{h.status}</Badge>
              </div>

              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>
                {h.patient?.fullName || 'Patient'}
              </div>

              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                Hospital: {h.hospital?.name || 'Central ER'} • Triggered at {new Date(h.triggeredAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AmbulanceHistoryPage;
