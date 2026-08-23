import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Calendar, Clock, MapPin, Copy, ArrowRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export const BookingSuccessPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const appointment = (location.state as any)?.appointment;

  if (!appointment) {
    return (
      <div className="container" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <h2>Appointment Completed</h2>
        <Button variant="primary" onClick={() => navigate('/patient/appointments')}>
          View Appointments
        </Button>
      </div>
    );
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(appointment.appointmentId);
    alert('Appointment ID copied to clipboard!');
  };

  return (
    <div className="container" style={{ maxWidth: '540px', padding: '2rem 1rem', textAlign: 'center' }}>
      {/* Success Icon */}
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-success-50)',
          color: 'var(--color-success-600)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}
      >
        <CheckCircle2 size={48} />
      </div>

      <h1 style={{ fontSize: '1.625rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
        {t('booking.successTitle')}
      </h1>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem 0' }}>
        A confirmation SMS has been dispatched to your registered phone number.
      </p>

      {/* Appointment ID Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'var(--color-primary-50)',
          border: '1px dashed var(--color-primary-300)',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
        }}
      >
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-primary-700)' }}>ID:</span>
        <strong style={{ fontSize: '1rem', color: 'var(--color-primary-900)', letterSpacing: '0.05em' }}>
          {appointment.appointmentId}
        </strong>
        <button
          type="button"
          onClick={handleCopyId}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-600)', padding: 0 }}
          title="Copy ID"
        >
          <Copy size={16} />
        </button>
      </div>

      {/* Booking Summary */}
      <Card style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
        <Card.Body>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700 }}>
            Dr. {appointment.doctor?.fullName}
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <Calendar size={16} color="var(--color-primary-600)" />
              <span>{appointment.date?.split('T')[0]}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <Clock size={16} color="var(--color-primary-600)" />
              <span>{appointment.startTime} - {appointment.endTime}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <MapPin size={16} color="var(--color-primary-600)" />
              <span>{appointment.hospital?.name}</span>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <Button
          variant="primary"
          size="lg"
          rightIcon={<ArrowRight size={18} />}
          onClick={() => navigate('/patient/appointments')}
        >
          {t('booking.viewMyBookings')}
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/patient/home')}
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default BookingSuccessPage;
