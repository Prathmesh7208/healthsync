import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Stethoscope, Filter } from 'lucide-react';
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

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ minWidth: '220px', flex: '1 1 auto' }}>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Consultation Schedule</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Manage appointments, conduct consultations, and issue digital prescriptions.
          </p>
        </div>

        {/* Filters Group */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', alignItems: 'center', width: '100%', maxWidth: '540px' }}>
          {/* Quick Date Chips */}
          <div style={{ display: 'flex', gap: '0.375rem', width: '100%', overflowX: 'auto', paddingBottom: '2px' }}>
            <button
              type="button"
              className={`hs-filter-pill ${date === todayStr ? 'active' : ''}`}
              onClick={() => setDate(todayStr)}
            >
              Today
            </button>
            <button
              type="button"
              className={`hs-filter-pill ${date === tomorrowStr ? 'active' : ''}`}
              onClick={() => setDate(tomorrowStr)}
            >
              Tomorrow
            </button>
          </div>

          {/* Styled Date Picker */}
          <div style={{ position: 'relative', flex: '1 1 180px', minWidth: '150px' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-primary-600)' }}>
              <Calendar size={16} />
            </div>
            <input
              type="date"
              className="hs-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                paddingLeft: '36px',
                height: '42px',
                borderRadius: '12px',
                border: '1.5px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                width: '100%',
              }}
            />
          </div>

          {/* Styled Status Dropdown */}
          <div style={{ position: 'relative', flex: '1 1 160px', minWidth: '140px' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }}>
              <Filter size={15} />
            </div>
            <select
              className="hs-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                paddingLeft: '34px',
                height: '42px',
                borderRadius: '12px',
                border: '1.5px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                width: '100%',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="BOOKED">Booked</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">In Consultation</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED_BY_PATIENT">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>
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
        <Card style={{ borderRadius: '16px', border: '1.5px dashed var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)' }}>
          <Card.Body style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-50)',
                border: '1px solid var(--color-primary-200)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                color: 'var(--color-primary-600)',
              }}
            >
              <Calendar size={28} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>No Appointments Found</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '360px', margin: '0.5rem auto 1.5rem auto' }}>
              No consultations scheduled for <strong>{date}</strong> with filter "<strong>{status}</strong>".
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDate(todayStr);
                setStatus('ALL');
              }}
            >
              Reset to Today's Schedule
            </Button>
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
