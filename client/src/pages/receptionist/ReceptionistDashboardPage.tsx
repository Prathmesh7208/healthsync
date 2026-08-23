import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CalendarCheck, Stethoscope, UserPlus } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export const ReceptionistDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [hospital, setHospital] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  // Walk-in modal
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [registering, setRegistering] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    try {
      const recRes = await axios.get('/api/v1/receptionist/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const h = recRes.data.data.hospital;
      setHospital(h);

      if (h?.id) {
        const [aptRes, docRes] = await Promise.all([
          axios.get(`/api/v1/receptionist/hospitals/${h.id}/appointments?date=${todayStr}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`/api/v1/receptionist/hospitals/${h.id}/doctors`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setAppointments(aptRes.data.data || []);
        const docs = docRes.data.data || [];
        setDoctors(docs);
        if (docs.length > 0) setSelectedDoctorId(docs[0].id);
      }
    } catch {
      // defaults
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token, todayStr]);

  const handleRegisterWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospital?.id || !fullName || !phone || !selectedDoctorId) return;

    setRegistering(true);
    try {
      await axios.post(
        `/api/v1/receptionist/hospitals/${hospital.id}/walk-in`,
        { fullName, phone, doctorId: selectedDoctorId, reasonForVisit },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWalkInModalOpen(false);
      setFullName('');
      setPhone('');
      setReasonForVisit('');
      alert('Walk-in patient registered and checked in!');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Walk-in registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const totalApts = appointments.length;
  const checkedInCount = appointments.filter((a) => a.checkedInAt).length;
  const waitingCount = appointments.filter((a) => a.checkedInAt && a.status === 'CONFIRMED').length;
  const inConsultationCount = appointments.filter((a) => a.status === 'IN_PROGRESS').length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div>
      {/* Header with Quick Walk-in CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Hospital Front-Desk Control
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {hospital?.name} • Operations on {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="primary"
            leftIcon={<UserPlus size={16} />}
            onClick={() => setWalkInModalOpen(true)}
          >
            Register Walk-In Patient
          </Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <Card>
          <Card.Body style={{ padding: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Today's Bookings</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{totalApts}</div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body style={{ padding: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-600)' }}>Checked In</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-700)' }}>{checkedInCount}</div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body style={{ padding: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-warning-600)' }}>Waiting in Lobby</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-warning-600)' }}>{waitingCount}</div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body style={{ padding: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary-600)' }}>In Consultation</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-secondary-600)' }}>{inConsultationCount}</div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body style={{ padding: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-success-600)' }}>Completed</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success-600)' }}>{completedCount}</div>
          </Card.Body>
        </Card>
      </div>

      {/* Grid: Live Doctor Board (Left) & Recent Appointments (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Doctor Availability Board */}
        <Card>
          <Card.Header>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Stethoscope size={18} color="var(--color-primary-600)" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Doctor Board Snapshot</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/receptionist/doctors')}>
                View All
              </Button>
            </div>
          </Card.Header>

          <Card.Body style={{ padding: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {doctors.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700 }}>Dr. {doc.fullName}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {Array.isArray(doc.specializations) ? doc.specializations[0] : 'Consultant'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'right', fontSize: '0.75rem' }}>
                      <span style={{ fontWeight: 700 }}>{doc.waitingCount}</span> waiting
                    </div>
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
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>

        {/* Quick Check-in Queue */}
        <Card>
          <Card.Header>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarCheck size={18} color="var(--color-primary-600)" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Today's Arrival Desk</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/receptionist/appointments')}>
                Full Schedule
              </Button>
            </div>
          </Card.Header>

          <Card.Body style={{ padding: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {appointments.slice(0, 5).map((apt) => (
                <div
                  key={apt.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: apt.checkedInAt ? 'var(--color-success-50)' : 'var(--bg-surface-subtle)',
                    border: `1px solid ${apt.checkedInAt ? 'var(--color-success-200)' : 'var(--border-subtle)'}`,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{apt.patient?.fullName || 'Patient'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {apt.startTime} • Dr. {apt.doctor?.fullName}
                    </div>
                  </div>

                  <div>
                    {apt.checkedInAt ? (
                      <Badge variant="success">Checked In</Badge>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={async () => {
                          await axios.put(`/api/v1/receptionist/appointments/${apt.id}/check-in`, {}, {
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          fetchData();
                        }}
                      >
                        Check In
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Register Walk-In Modal */}
      <Modal isOpen={walkInModalOpen} onClose={() => setWalkInModalOpen(false)} title="Register Walk-In Patient">
        <form onSubmit={handleRegisterWalkIn}>
          <Input
            label="Patient Full Name *"
            placeholder="e.g. Ramesh Kumar"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            label="Mobile Phone Number *"
            placeholder="9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            required
          />

          <div className="hs-input-group">
            <label className="hs-label">Assign to Doctor *</label>
            <select
              className="hs-input"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              required
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.fullName} ({Array.isArray(d.specializations) ? d.specializations[0] : 'Consultant'})
                </option>
              ))}
            </select>
          </div>

          <div className="hs-input-group">
            <label className="hs-label">Reason for Visit / Chief Complaint</label>
            <textarea
              className="hs-input"
              rows={2}
              placeholder="e.g. Acute fever, headache since yesterday"
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="outline" type="button" onClick={() => setWalkInModalOpen(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={registering} style={{ flex: 1 }}>
              Register & Check In
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ReceptionistDashboardPage;
