import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Siren, Truck, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

export const EmergencyDashboardPage: React.FC = () => {
  const { token } = useAuthStore();

  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Assign ambulance modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedEmergencyId, setSelectedEmergencyId] = useState<string | null>(null);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchData = async () => {
    try {
      const recRes = await axios.get('/api/v1/receptionist/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const hId = recRes.data.data.hospital?.id;

      if (hId) {
        const [emgRes, ambRes] = await Promise.all([
          axios.get(`/api/v1/receptionist/hospitals/${hId}/emergencies`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`/api/v1/receptionist/hospitals/${hId}/ambulances`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setEmergencies(emgRes.data.data || []);
        const ambs = ambRes.data.data || [];
        setAmbulances(ambs);
        if (ambs.length > 0) setSelectedAmbulanceId(ambs[0].id);
      }
    } catch {
      // defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
    const interval = setInterval(fetchData, 10000); // 10s live poll for emergency desk
    return () => clearInterval(interval);
  }, [token]);

  const handleAcknowledge = async (id: string) => {
    try {
      await axios.put(`/api/v1/receptionist/emergencies/${id}/acknowledge`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Acknowledge failed');
    }
  };

  const handleAssignAmbulance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmergencyId || !selectedAmbulanceId) return;

    setAssigning(true);
    try {
      await axios.put(
        `/api/v1/receptionist/emergencies/${selectedEmergencyId}/assign-ambulance`,
        { ambulanceOperatorId: selectedAmbulanceId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Ambulance assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Siren size={24} color="var(--color-danger-600)" className="animate-sos-pulse" />
            <h1 style={{ fontSize: '1.625rem', fontWeight: 800, margin: 0, color: 'var(--color-danger-700)' }}>
              Emergency SOS Response Desk
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Real-time emergency triage, ambulance unit dispatch, and patient GPS coordination.
          </p>
        </div>
      </div>

      {/* Emergency List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2].map((i) => (
            <div key={i} className="hs-skeleton" style={{ height: '180px', width: '100%' }} />
          ))}
        </div>
      ) : emergencies.length === 0 ? (
        <Card style={{ borderLeft: '4px solid var(--color-success-600)' }}>
          <Card.Body style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <CheckCircle2 size={48} color="var(--color-success-600)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>All Clear — No Active Emergencies</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
              The emergency channel is actively monitoring incoming SOS broadcasts.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {emergencies.map((emg) => (
            <Card key={emg.id} style={{ borderLeft: '5px solid var(--color-danger-600)', boxShadow: 'var(--shadow-md)' }}>
              <Card.Body style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-danger-700)' }}>
                        {emg.emergencyId}
                      </span>
                      <Badge variant="danger">{emg.status}</Badge>
                    </div>

                    <h3 style={{ margin: '0.375rem 0', fontSize: '1.25rem', fontWeight: 800 }}>
                      Patient: {emg.patient?.fullName || 'Emergency Patient'}
                    </h3>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      <span>🩸 Blood Group: <strong>{emg.patient?.bloodGroup || 'UNKNOWN'}</strong></span>
                      <span>•</span>
                      <span>📞 Contact: <strong>{emg.patient?.emergencyContactPhone || 'Not provided'}</strong></span>
                      <span>•</span>
                      <span>📍 GPS: {Number(emg.initialLatitude).toFixed(4)}, {Number(emg.initialLongitude).toFixed(4)}</span>
                      <span>•</span>
                      <span>🕒 Triggered: {new Date(emg.triggeredAt).toLocaleTimeString()}</span>
                    </div>

                    {emg.ambulanceOperator && (
                      <div
                        style={{
                          marginTop: '0.875rem',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'var(--color-primary-50)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8125rem',
                          color: 'var(--color-primary-900)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <Truck size={16} color="var(--color-primary-600)" />
                        <span>Assigned Ambulance: <strong>{emg.ambulanceOperator.vehicleNumber}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Operational Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '180px' }}>
                    {emg.status === 'INITIATED' && (
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => handleAcknowledge(emg.id)}
                      >
                        Acknowledge SOS
                      </Button>
                    )}

                    {(!emg.ambulanceOperatorId || emg.status === 'ACKNOWLEDGED') && (
                      <Button
                        variant="danger"
                        size="md"
                        leftIcon={<Truck size={16} />}
                        onClick={() => {
                          setSelectedEmergencyId(emg.id);
                          setAssignModalOpen(true);
                        }}
                      >
                        Dispatch Ambulance
                      </Button>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Ambulance Modal */}
      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Dispatch Ambulance Unit">
        <form onSubmit={handleAssignAmbulance}>
          <div className="hs-input-group">
            <label className="hs-label">Select Available Ambulance Unit</label>
            <select
              className="hs-input"
              value={selectedAmbulanceId}
              onChange={(e) => setSelectedAmbulanceId(e.target.value)}
              required
            >
              {ambulances.map((amb) => (
                <option key={amb.id} value={amb.id}>
                  Vehicle #{amb.vehicleNumber} ({amb.currentStatus})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="outline" type="button" onClick={() => setAssignModalOpen(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" isLoading={assigning} style={{ flex: 1 }}>
              Confirm Dispatch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmergencyDashboardPage;
