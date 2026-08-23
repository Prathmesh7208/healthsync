import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Stethoscope } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export const DoctorAppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('ALL');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/doctors/me/appointments', {
        params: { date, status },
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
  }, [date, status]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await axios.put(
        `/api/v1/doctors/me/appointments/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAppointments();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Status update failed');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      {/* Header & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Consultation Schedule</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Manage appointments, conduct consultations, and issue digital prescriptions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="date"
            className="hs-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: 'auto' }}
          />

          <select
            className="hs-input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="BOOKED">Booked</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Consultation</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED_BY_PATIENT">Cancelled by Patient</option>
            <option value="NO_SHOW">No Show</option>
          </select>
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="hs-skeleton" style={{ height: '100px', width: '100%' }} />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <Card>
          <Card.Body style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Calendar size={48} style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>No Appointments Found</h3>
            <p style={{ fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
              No consultations scheduled for {date} with filter "{status}".
            </p>
          </Card.Body>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {appointments.map((apt) => (
            <Card key={apt.id}>
              <Card.Body style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-600)' }}>
                        {apt.appointmentId}
                      </span>
                      <Badge
                        variant={
                          apt.status === 'COMPLETED'
                            ? 'neutral'
                            : apt.status === 'IN_PROGRESS'
                            ? 'info'
                            : apt.status.includes('CANCELLED')
                            ? 'danger'
                            : 'success'
                        }
                      >
                        {apt.status}
                      </Badge>
                    </div>

                    <h3 style={{ margin: '0.25rem 0', fontSize: '1.125rem', fontWeight: 700 }}>
                      {apt.patient?.fullName || 'Patient Name Not Set'}
                    </h3>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                      <span>🕒 {apt.startTime} - {apt.endTime}</span>
                      <span>•</span>
                      <span>📍 {apt.hospital?.name}</span>
                      <span>•</span>
                      <span>🩸 Blood: {apt.patient?.bloodGroup || 'UNKNOWN'}</span>
                    </div>

                    {apt.reasonForVisit && (
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <strong>Reason:</strong> {apt.reasonForVisit}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {apt.status !== 'COMPLETED' && (
                      <Button
                        variant="primary"
                        size="md"
                        leftIcon={<Stethoscope size={16} />}
                        onClick={() => navigate(`/doctor/consultation/${apt.id}`)}
                      >
                        {apt.status === 'IN_PROGRESS' ? 'Resume Consultation' : 'Start Consultation'}
                      </Button>
                    )}

                    {apt.status === 'COMPLETED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/doctor/consultation/${apt.id}`)}
                      >
                        View Summary
                      </Button>
                    )}

                    {apt.status === 'CONFIRMED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        style={{ color: 'var(--color-warning-600)' }}
                        onClick={() => handleUpdateStatus(apt.id, 'NO_SHOW')}
                      >
                        No Show
                      </Button>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorAppointmentsPage;
