import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Stethoscope } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';

export const DoctorBoardPage: React.FC = () => {
  const { token } = useAuthStore();

  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDoctorBoard = async () => {
    try {
      const recRes = await axios.get('/api/v1/receptionist/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const h = recRes.data.data.hospital;

      if (h?.id) {
        const res = await axios.get(`/api/v1/receptionist/hospitals/${h.id}/doctors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDoctors(res.data.data || []);
      }
    } catch {
      // defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDoctorBoard();
  }, [token]);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Doctor Availability & Status Board</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
          Real-time visibility into consulting status, queue counts, and current patients across all OPD departments.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="hs-skeleton" style={{ height: '180px' }} />
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <Card>
          <Card.Body style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Stethoscope size={48} style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>No Doctor Affiliations Found</h3>
          </Card.Body>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {doctors.map((doc) => (
            <Card key={doc.id} style={{ borderTop: `4px solid ${doc.liveStatus === 'AVAILABLE' ? 'var(--color-success-600)' : doc.liveStatus === 'IN_CONSULTATION' ? 'var(--color-primary-600)' : 'var(--color-slate-400)'}` }}>
              <Card.Body style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <Avatar name={doc.fullName} src={doc.profilePhotoUrl} size="lg" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700 }}>Dr. {doc.fullName}</h3>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-primary-600)', fontWeight: 500 }}>
                      {Array.isArray(doc.specializations) ? doc.specializations[0] : 'Consultant'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Current Status:</span>
                  <Badge
                    variant={
                      doc.liveStatus === 'AVAILABLE'
                        ? 'success'
                        : doc.liveStatus === 'IN_CONSULTATION'
                        ? 'info'
                        : 'neutral'
                    }
                  >
                    {doc.liveStatus}
                  </Badge>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <span>Waiting in Queue:</span>
                  <strong>{doc.waitingCount} patients</strong>
                </div>

                {doc.currentPatient && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-primary-700)', backgroundColor: 'var(--color-primary-50)', padding: '4px 8px', borderRadius: '4px' }}>
                    Consulting with: <strong>{doc.currentPatient}</strong>
                  </div>
                )}
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorBoardPage;
