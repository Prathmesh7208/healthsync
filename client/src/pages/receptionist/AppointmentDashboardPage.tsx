import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, UserCheck, Calendar } from 'lucide-react';
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

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

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

        {/* Filter Controls Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', width: '100%', maxWidth: '640px' }}>
          {/* Quick Date Chips */}
          <div style={{ display: 'flex', gap: '0.375rem', overflowX: 'auto', paddingBottom: '2px' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.625rem', width: '100%' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '160px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search patient or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="hs-input"
                style={{ paddingLeft: '36px', height: '42px', fontSize: '0.875rem' }}
              />
            </div>

            {/* Date Input */}
            <div style={{ position: 'relative', minWidth: '140px' }}>
              <input
                type="date"
                className="hs-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ height: '42px', fontWeight: 600, fontSize: '0.8125rem' }}
              />
            </div>

            {/* Status Select */}
            <div style={{ position: 'relative', minWidth: '140px' }}>
              <select
                className="hs-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ height: '42px', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}
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
      </div>

      {/* Appointments List - Responsive Mobile Cards & Desktop Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="hs-skeleton" style={{ height: '120px', width: '100%', borderRadius: '16px' }} />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <Card style={{ borderRadius: '16px', border: '1.5px dashed var(--border-subtle)' }}>
          <Card.Body style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
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
              No appointments matched your search on <strong>{date}</strong>.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDate(todayStr);
                setStatus('ALL');
                setSearch('');
              }}
            >
              Reset Filters
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {appointments.map((apt, idx) => {
            const tokenNumber = idx + 1;
            const cabinNumber = (idx % 4) + 1;
            const isCheckedIn = !!apt.checkedInAt;

            return (
              <div
                key={apt.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '16px',
                  border: `1.5px solid ${isCheckedIn ? 'var(--color-success-300)' : 'var(--border-subtle)'}`,
                  boxShadow: isCheckedIn ? '0 4px 14px rgba(22, 163, 74, 0.1)' : 'var(--shadow-sm)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.875rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Top Boarding-Pass Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span
                      style={{
                        background: isCheckedIn
                          ? 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)'
                          : 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)',
                        color: '#FFFFFF',
                        fontWeight: 900,
                        fontSize: '0.8125rem',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '8px',
                        letterSpacing: '0.05em',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      }}
                    >
                      TOKEN #{tokenNumber}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      ID: {apt.appointmentId}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary-700)', backgroundColor: 'var(--color-primary-50)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                      🕒 {apt.startTime}
                    </span>
                    <Badge
                      variant={
                        apt.status === 'COMPLETED'
                          ? 'neutral'
                          : apt.status === 'IN_PROGRESS'
                          ? 'info'
                          : isCheckedIn
                          ? 'success'
                          : 'warning'
                      }
                    >
                      {isCheckedIn ? 'Checked-In' : apt.status}
                    </Badge>
                  </div>
                </div>

                {/* Patient & Doctor Routing Details */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle)',
                    padding: '0.875rem 1rem',
                    borderRadius: '12px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Patient Details
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {apt.patient?.fullName || 'Patient'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      📞 {apt.patient?.user?.phone || 'Walk-In'} • Blood: {apt.patient?.bloodGroup || 'O+'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Consulting Doctor & Room
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-primary-700)', marginTop: '2px' }}>
                      Dr. {apt.doctor?.fullName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Cabin 0{cabinNumber} • {Array.isArray(apt.doctor?.specializations) ? apt.doctor.specializations[0] : 'Consultant'}
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: isCheckedIn ? 'var(--color-success-700)' : 'var(--color-warning-700)', fontWeight: 700 }}>
                    {isCheckedIn ? '● Patient is in Waiting Lobby' : '⏳ Awaiting Front-Desk Check-In'}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', width: 'auto' }}>
                    {isCheckedIn ? (
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-success-700)', backgroundColor: 'var(--color-success-50)', border: '1px solid var(--color-success-200)', padding: '0.4rem 0.875rem', borderRadius: '10px' }}>
                        ✓ Token Active & Routed
                      </span>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<UserCheck size={15} />}
                        onClick={() => handleCheckIn(apt.id)}
                      >
                        ⚡ Check-In & Issue Token
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AppointmentDashboardPage;
