import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Calendar, Clock, MapPin, ArrowLeft } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';

export const BookingConfirmPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const state = location.state as {
    doctorId: string;
    doctor: any;
    hospitalId: string;
    hospital: any;
    consultationFee: number;
    date: string;
    startTime: string;
    endTime: string;
  };

  const [reasonForVisit, setReasonForVisit] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state || !state.doctorId) {
    return (
      <div className="container" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
        <h2>Invalid Booking Session</h2>
        <Button variant="outline" onClick={() => navigate('/patient/doctors')}>
          Back to Doctors
        </Button>
      </div>
    );
  }

  const { doctor, hospital, date, startTime, endTime, consultationFee } = state;

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post(
        '/api/v1/appointments',
        {
          doctorId: state.doctorId,
          hospitalId: state.hospitalId,
          date: state.date,
          startTime: state.startTime,
          endTime: state.endTime,
          reasonForVisit,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate('/patient/appointments/success', {
        state: { appointment: res.data.data },
        replace: true,
      });
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('This slot was just taken by another patient. Please choose another time.');
      } else {
        setError(err.response?.data?.error?.message || 'Failed to confirm appointment');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '640px', padding: '1.5rem 1rem' }}>
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          background: 'none',
          border: 'none',
          color: 'var(--color-primary-600)',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '1rem',
        }}
      >
        <ArrowLeft size={16} />
        <span>Change Slot</span>
      </button>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.25rem 0', color: 'var(--text-primary)' }}>
        {t('booking.reviewTitle')}
      </h1>

      {error && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-danger-50)',
            color: 'var(--color-danger-700)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Appointment Summary Card */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <Card.Body>
          {/* Doctor Header */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <Avatar name={doctor.fullName} src={doctor.profilePhotoUrl} size="lg" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
                Dr. {doctor.fullName}
              </h3>
              <p style={{ margin: '0.125rem 0 0 0', fontSize: '0.8125rem', color: 'var(--color-primary-600)', fontWeight: 600 }}>
                {Array.isArray(doctor.specializations) ? doctor.specializations[0] : 'Consultant'}
              </p>
            </div>
          </div>

          {/* Consultation Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem' }}>
              <Calendar size={18} color="var(--color-primary-600)" />
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Date</span>
                <strong>{date}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem' }}>
              <Clock size={18} color="var(--color-primary-600)" />
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Time Slot</span>
                <strong>{startTime} - {endTime}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem' }}>
              <MapPin size={18} color="var(--color-primary-600)" />
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Hospital / Clinic</span>
                <strong>{hospital?.name || 'Main Medical Center'}</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hospital?.address}</div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Reason for visit Input */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <Card.Body>
          <div className="hs-input-group" style={{ margin: 0 }}>
            <label className="hs-label">{t('booking.reasonForVisit')}</label>
            <textarea
              className="hs-input"
              rows={3}
              placeholder={t('booking.reasonPlaceholder')}
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </Card.Body>
      </Card>

      {/* Fee Breakdown Card */}
      <Card style={{ marginBottom: '1.5rem', backgroundColor: 'var(--bg-surface-subtle)' }}>
        <Card.Body style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Consultation Fee</span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Payable at clinic / hospital desk</div>
            </div>
            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-secondary-700)' }}>
              ₹{consultationFee}
            </div>
          </div>
        </Card.Body>
      </Card>

      <Button
        variant="primary"
        size="lg"
        isLoading={loading}
        onClick={handleConfirm}
        style={{ width: '100%' }}
      >
        {t('booking.confirmButton')}
      </Button>
    </div>
  );
};

export default BookingConfirmPage;
