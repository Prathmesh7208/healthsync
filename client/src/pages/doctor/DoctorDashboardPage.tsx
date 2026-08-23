import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Stethoscope,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export const DoctorDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, aptRes] = await Promise.all([
          axios.get('/api/v1/doctors/me/profile', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`/api/v1/doctors/me/appointments?date=${todayStr}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setProfile(profileRes.data.data);
        setAppointments(aptRes.data.data || []);
      } catch {
        // default empty
      }
    };
    if (token) fetchData();
  }, [token, todayStr]);

  const totalToday = appointments.length;
  const completedToday = appointments.filter((a) => a.status === 'COMPLETED').length;
  const inProgressToday = appointments.filter((a) => a.status === 'IN_PROGRESS').length;
  const waitingToday = appointments.filter((a) => a.status === 'BOOKED' || a.status === 'CONFIRMED').length;

  const nextAppointment = appointments.find(
    (a) => a.status === 'BOOKED' || a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS'
  );

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Welcome, Dr. {profile?.fullName || 'Doctor'}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Clock size={16} />}
          onClick={() => navigate('/doctor/schedule')}
        >
          Manage Schedules
        </Button>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <Card>
          <Card.Body style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Total Appointments</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalToday}</div>
              </div>
              <div style={{ padding: '0.625rem', borderRadius: '12px', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-600)' }}>
                <Calendar size={24} />
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Waiting Patients</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-warning-600)' }}>{waitingToday}</div>
              </div>
              <div style={{ padding: '0.625rem', borderRadius: '12px', backgroundColor: 'var(--color-warning-50)', color: 'var(--color-warning-600)' }}>
                <Clock size={24} />
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>In Consultation</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-secondary-600)' }}>{inProgressToday}</div>
              </div>
              <div style={{ padding: '0.625rem', borderRadius: '12px', backgroundColor: 'var(--color-secondary-50)', color: 'var(--color-secondary-600)' }}>
                <Stethoscope size={24} />
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Completed</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success-600)' }}>{completedToday}</div>
              </div>
              <div style={{ padding: '0.625rem', borderRadius: '12px', backgroundColor: 'var(--color-success-50)', color: 'var(--color-success-600)' }}>
                <CheckCircle2 size={24} />
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Next Up Consultation Card */}
      {nextAppointment && (
        <Card style={{ marginBottom: '1.75rem', borderLeft: '4px solid var(--color-primary-600)' }}>
          <Card.Body style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-600)', textTransform: 'uppercase' }}>
                  Next Patient in Queue
                </span>
                <h3 style={{ margin: '0.125rem 0', fontSize: '1.25rem', fontWeight: 800 }}>
                  {nextAppointment.patient?.fullName || 'Patient'}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  <span>🕒 {nextAppointment.startTime} - {nextAppointment.endTime}</span>
                  <span>•</span>
                  <span>📍 {nextAppointment.hospital?.name}</span>
                  <span>•</span>
                  <span>🩸 Blood: {nextAppointment.patient?.bloodGroup || 'N/A'}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight size={18} />}
                onClick={() => navigate(`/doctor/consultation/${nextAppointment.id}`)}
              >
                {nextAppointment.status === 'IN_PROGRESS' ? 'Resume Consultation' : 'Start Consultation'}
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Today's Full Schedule Table */}
      <Card>
        <Card.Header>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Today's Consultations ({totalToday})</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/doctor/appointments')}>
              View All
            </Button>
          </div>
        </Card.Header>

        <Card.Body style={{ padding: 0 }}>
          {appointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Users size={40} style={{ margin: '0 auto 0.75rem auto' }} />
              <p style={{ margin: 0, fontSize: '0.875rem' }}>No patient appointments scheduled for today.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-surface-subtle)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Time</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Patient Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr key={apt.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>{apt.startTime}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{apt.patient?.fullName || 'Patient'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{apt.reasonForVisit || 'Regular consultation'}</div>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{apt.hospital?.name}</td>
                      <td style={{ padding: '1rem' }}>
                        <Badge
                          variant={
                            apt.status === 'COMPLETED'
                              ? 'neutral'
                              : apt.status === 'IN_PROGRESS'
                              ? 'info'
                              : 'success'
                          }
                        >
                          {apt.status}
                        </Badge>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/doctor/consultation/${apt.id}`)}
                        >
                          Consult
                        </Button>
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

export default DoctorDashboardPage;
