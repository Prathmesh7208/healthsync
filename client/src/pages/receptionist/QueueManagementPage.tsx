import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Clock, Stethoscope, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export const QueueManagementPage: React.FC = () => {
  const { token } = useAuthStore();

  const [hospitalId, setHospitalId] = useState<string>('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [queueData, setQueueData] = useState<any>({
    waiting: [],
    inConsultation: [],
    completed: [],
  });

  // Walk-in modal state
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [registering, setRegistering] = useState(false);

  const fetchDoctorsAndHospital = async () => {
    try {
      const recRes = await axios.get('/api/v1/receptionist/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const hId = recRes.data.data.hospital?.id;
      setHospitalId(hId);

      if (hId) {
        const docRes = await axios.get(`/api/v1/receptionist/hospitals/${hId}/doctors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const docs = docRes.data.data || [];
        setDoctors(docs);
        if (docs.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(docs[0].id);
        }
      }
    } catch {
      // defaults
    }
  };

  const fetchQueue = async (docId: string) => {
    if (!hospitalId || !docId) return;
    try {
      const res = await axios.get(`/api/v1/receptionist/hospitals/${hospitalId}/queue/${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQueueData(res.data.data);
    } catch {
      setQueueData({ waiting: [], inConsultation: [], completed: [] });
    }
  };

  useEffect(() => {
    if (token) fetchDoctorsAndHospital();
  }, [token]);

  useEffect(() => {
    if (selectedDoctorId && hospitalId) {
      fetchQueue(selectedDoctorId);
    }
  }, [selectedDoctorId, hospitalId]);

  const handleRegisterWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalId || !fullName || !phone || !selectedDoctorId) return;

    setRegistering(true);
    try {
      await axios.post(
        `/api/v1/receptionist/hospitals/${hospitalId}/walk-in`,
        { fullName, phone, doctorId: selectedDoctorId, reasonForVisit },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWalkInOpen(false);
      setFullName('');
      setPhone('');
      setReasonForVisit('');
      fetchQueue(selectedDoctorId);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Walk-in registration failed');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div>
      {/* Header with Walk-In trigger */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Live Patient Queue Kanban</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Real-time consultation flow tracker: Waiting Lobby → Consulting Room → Completed.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<UserPlus size={16} />}
          onClick={() => setWalkInOpen(true)}
        >
          Check In Walk-In
        </Button>
      </div>

      {/* Doctor Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
        {doctors.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setSelectedDoctorId(d.id)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: `2px solid ${selectedDoctorId === d.id ? 'var(--color-primary-600)' : 'var(--border-subtle)'}`,
              backgroundColor: selectedDoctorId === d.id ? 'var(--color-primary-50)' : 'var(--bg-surface)',
              color: selectedDoctorId === d.id ? 'var(--color-primary-800)' : 'var(--text-primary)',
              fontWeight: selectedDoctorId === d.id ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>Dr. {d.fullName}</span>
            <span
              style={{
                backgroundColor: selectedDoctorId === d.id ? 'var(--color-primary-600)' : 'var(--color-slate-200)',
                color: selectedDoctorId === d.id ? '#FFFFFF' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-full)',
                padding: '1px 6px',
                fontSize: '0.6875rem',
                fontWeight: 700,
              }}
            >
              {d.waitingCount}
            </span>
          </button>
        ))}
      </div>

      {/* 3-Column Kanban Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', alignItems: 'start' }}>
        {/* COLUMN 1: Waiting Lobby */}
        <div style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', minHeight: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 700, color: 'var(--color-warning-700)' }}>
              <Clock size={16} />
              <span>WAITING IN LOBBY</span>
            </div>
            <Badge variant="warning">{queueData.waiting?.length || 0}</Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {queueData.waiting?.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                No patients currently waiting.
              </div>
            ) : (
              queueData.waiting.map((apt: any, idx: number) => (
                <Card key={apt.id}>
                  <Card.Body style={{ padding: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary-600)' }}>
                        #{idx + 1}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{apt.startTime}</span>
                    </div>
                    <h4 style={{ margin: '0.25rem 0', fontSize: '0.9375rem', fontWeight: 700 }}>
                      {apt.patient?.fullName || 'Patient'}
                    </h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {apt.reasonForVisit || 'Regular consultation'}
                    </div>
                  </Card.Body>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: In Consultation */}
        <div style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', minHeight: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 700, color: 'var(--color-primary-700)' }}>
              <Stethoscope size={16} />
              <span>IN CONSULTATION</span>
            </div>
            <Badge variant="info">{queueData.inConsultation?.length || 0}</Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {queueData.inConsultation?.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                Doctor is ready for the next patient.
              </div>
            ) : (
              queueData.inConsultation.map((apt: any) => (
                <Card key={apt.id} style={{ borderLeft: '4px solid var(--color-primary-600)' }}>
                  <Card.Body style={{ padding: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Badge variant="info">Active Now</Badge>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{apt.startTime}</span>
                    </div>
                    <h4 style={{ margin: '0.375rem 0', fontSize: '1rem', fontWeight: 700 }}>
                      {apt.patient?.fullName || 'Patient'}
                    </h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {apt.reasonForVisit || 'Consultation in progress'}
                    </div>
                  </Card.Body>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 3: Completed */}
        <div style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', minHeight: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 700, color: 'var(--color-success-700)' }}>
              <CheckCircle2 size={16} />
              <span>COMPLETED TODAY</span>
            </div>
            <Badge variant="success">{queueData.completed?.length || 0}</Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {queueData.completed?.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                No consultations completed yet today.
              </div>
            ) : (
              queueData.completed.map((apt: any) => (
                <Card key={apt.id}>
                  <Card.Body style={{ padding: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>
                        {apt.patient?.fullName || 'Patient'}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-success-600)', fontWeight: 600 }}>✓ Done</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{apt.startTime}</span>
                  </Card.Body>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Walk-in Modal */}
      <Modal isOpen={walkInOpen} onClose={() => setWalkInOpen(false)} title="Register Walk-In Patient">
        <form onSubmit={handleRegisterWalkIn}>
          <Input
            label="Patient Name *"
            placeholder="Full legal name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            label="Mobile Phone *"
            placeholder="9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            required
          />

          <div className="hs-input-group">
            <label className="hs-label">Reason for Visit / Complaint</label>
            <textarea
              className="hs-input"
              rows={2}
              placeholder="e.g. Fever and throat pain"
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="outline" type="button" onClick={() => setWalkInOpen(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={registering} style={{ flex: 1 }}>
              Add to Queue
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QueueManagementPage;
