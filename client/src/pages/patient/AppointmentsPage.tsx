import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Calendar, Clock, MapPin, AlertTriangle } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

export const AppointmentsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cancellation Modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of schedule');
  const [cancelling, setCancelling] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/v1/appointments/my?type=${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(res.data.data || []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [activeTab]);

  const handleCancelAppointment = async () => {
    if (!selectedAppointmentId) return;
    setCancelling(true);
    try {
      await axios.put(
        `/api/v1/appointments/${selectedAppointmentId}/cancel`,
        { cancellationReason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCancelModalOpen(false);
      fetchAppointments();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'BOOKED':
      case 'CONFIRMED':
        return <Badge variant="success">Confirmed</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="info">In Consultation</Badge>;
      case 'COMPLETED':
        return <Badge variant="neutral">Completed</Badge>;
      case 'CANCELLED_BY_PATIENT':
      case 'CANCELLED_BY_DOCTOR':
        return <Badge variant="danger">Cancelled</Badge>;
      case 'NO_SHOW':
        return <Badge variant="warning">No Show</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="container" style={{ maxWidth: '720px', padding: '1.5rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>
        {t('nav.appointments')}
      </h1>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          backgroundColor: 'var(--color-slate-100)',
          borderRadius: 'var(--radius-md)',
          padding: '0.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          style={{
            flex: 1,
            padding: '0.625rem',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'upcoming' ? 700 : 500,
            backgroundColor: activeTab === 'upcoming' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'upcoming' ? 'var(--color-primary-600)' : 'var(--text-secondary)',
            boxShadow: activeTab === 'upcoming' ? 'var(--shadow-sm)' : 'none',
            cursor: 'pointer',
          }}
        >
          Upcoming Appointments
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('past')}
          style={{
            flex: 1,
            padding: '0.625rem',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'past' ? 700 : 500,
            backgroundColor: activeTab === 'past' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'past' ? 'var(--color-primary-600)' : 'var(--text-secondary)',
            boxShadow: activeTab === 'past' ? 'var(--shadow-sm)' : 'none',
            cursor: 'pointer',
          }}
        >
          Past Consultations
        </button>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2].map((i) => (
            <div key={i} className="hs-skeleton" style={{ height: '140px', width: '100%' }} />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <Card>
          <Card.Body style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <Calendar size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
              {activeTab === 'upcoming' ? 'No Upcoming Appointments' : 'No Past Appointments'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.5rem auto 1.5rem auto' }}>
              Find qualified specialists and schedule your consultation online.
            </p>
            <Button variant="primary" size="sm" onClick={() => navigate('/patient/doctors')}>
              Find a Doctor
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {appointments.map((apt) => (
            <Card key={apt.id}>
              <Card.Body style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-700)', fontWeight: 700 }}>
                      {apt.appointmentId}
                    </span>
                    <h3 style={{ margin: '0.125rem 0', fontSize: '1.125rem', fontWeight: 700 }}>
                      Dr. {apt.doctor?.fullName}
                    </h3>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-primary-600)' }}>
                      {Array.isArray(apt.doctor?.specializations) ? apt.doctor.specializations[0] : 'Consultant'}
                    </span>
                  </div>
                  {getStatusBadge(apt.status)}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', padding: '0.75rem 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Calendar size={14} color="var(--color-primary-600)" />
                    <span>{apt.date?.split('T')[0]}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Clock size={14} color="var(--color-primary-600)" />
                    <span>{apt.startTime} - {apt.endTime}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <MapPin size={14} color="var(--color-primary-600)" />
                    <span>{apt.hospital?.name}</span>
                  </div>
                </div>

                {apt.reasonForVisit && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
                    <strong>Reason:</strong> {apt.reasonForVisit}
                  </p>
                )}

                {/* Card Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.875rem' }}>
                  {activeTab === 'upcoming' && (apt.status === 'BOOKED' || apt.status === 'CONFIRMED') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAppointmentId(apt.id);
                        setCancelModalOpen(true);
                      }}
                      style={{ color: 'var(--color-danger-600)' }}
                    >
                      Cancel Appointment
                    </Button>
                  )}

                  {activeTab === 'past' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/patient/doctors/${apt.doctorId}/book`)}
                    >
                      Book Again
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} size="sm">
        <div style={{ padding: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-danger-600)' }}>
            <AlertTriangle size={24} />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Cancel Consultation?</h3>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Are you sure you want to cancel this appointment? The consultation slot will be released back for other patients.
          </p>

          <div className="hs-input-group">
            <label className="hs-label">Reason for Cancellation</label>
            <select
              className="hs-input"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            >
              <option value="Change of schedule">Change of schedule</option>
              <option value="Found another doctor">Found another doctor</option>
              <option value="Feeling better">Feeling better</option>
              <option value="Travel / Emergency">Travel / Emergency</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="outline" onClick={() => setCancelModalOpen(false)} style={{ flex: 1 }}>
              Keep Booking
            </Button>
            <Button variant="danger" isLoading={cancelling} onClick={handleCancelAppointment} style={{ flex: 1 }}>
              Cancel Slot
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AppointmentsPage;
