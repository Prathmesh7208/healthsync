import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, UserCheck } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export const AppointmentDashboardPage: React.FC = () => {
  const { token } = useAuthStore();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const recRes = await axios.get('/api/v1/receptionist/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const hId = recRes.data.data.hospital?.id;

      if (hId) {
        const res = await axios.get(`/api/v1/receptionist/hospitals/${hId}/appointments`, {
          params: { date, status, search },
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppointments(res.data.data || []);
      }
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token, date, status, search]);

  const handleCheckIn = async (id: string) => {
    try {
      await axios.put(`/api/v1/receptionist/appointments/${id}/check-in`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Check-in failed');
    }
  };

  return (
    <div>
      {/* Header & Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ minWidth: '220px', flex: '1 1 auto' }}>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Hospital Appointments & Check-In Desk</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Verify patient arrivals and dispatch notifications to consulting doctors.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '620px' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '170px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search patient, phone, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="hs-input"
              style={{ paddingLeft: '36px', height: '40px', fontSize: '0.875rem', borderRadius: '12px' }}
            />
          </div>

          <div style={{ position: 'relative', flex: '1 1 150px', minWidth: '140px' }}>
            <input
              type="date"
              className="hs-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ height: '40px', borderRadius: '12px', fontWeight: 600, fontSize: '0.8125rem' }}
            />
          </div>

          <div style={{ position: 'relative', flex: '1 1 150px', minWidth: '140px' }}>
            <select
              className="hs-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ height: '40px', borderRadius: '12px', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="BOOKED">Booked</option>
              <option value="CONFIRMED">Confirmed / Checked-In</option>
              <option value="IN_PROGRESS">In Consultation</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED_BY_PATIENT">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <Card.Body style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div className="hs-skeleton" style={{ height: '200px', width: '100%' }} />
            </div>
          ) : appointments.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No appointments found matching your query criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-surface-subtle)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Appointment ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Time</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Patient Name & Phone</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Doctor</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Check-In Action</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr key={apt.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--color-primary-700)' }}>
                        {apt.appointmentId}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{apt.startTime}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 700 }}>{apt.patient?.fullName || 'Patient'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {apt.patient?.user?.phone || 'No phone'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>Dr. {apt.doctor?.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {Array.isArray(apt.doctor?.specializations) ? apt.doctor.specializations[0] : ''}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <Badge
                          variant={
                            apt.status === 'COMPLETED'
                              ? 'neutral'
                              : apt.status === 'IN_PROGRESS'
                              ? 'info'
                              : apt.checkedInAt
                              ? 'success'
                              : 'warning'
                          }
                        >
                          {apt.checkedInAt ? 'Checked In' : apt.status}
                        </Badge>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {apt.checkedInAt ? (
                          <span style={{ fontSize: '0.8125rem', color: 'var(--color-success-700)', fontWeight: 600 }}>
                            ✓ In Lobby
                          </span>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<UserCheck size={14} />}
                            onClick={() => handleCheckIn(apt.id)}
                          >
                            Check In
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default AppointmentDashboardPage;
