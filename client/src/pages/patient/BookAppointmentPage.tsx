import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Clock, ArrowLeft } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';

export const BookAppointmentPage: React.FC = () => {
  const { id: doctorId } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [doctor, setDoctor] = useState<any>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Generate 30 upcoming dates
  const next30Days = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateString: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

  // Fetch doctor profile
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await axios.get(`/api/v1/doctors/${doctorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDoctor(res.data.data);
        if (res.data.data.affiliations?.length > 0) {
          setSelectedHospitalId(res.data.data.affiliations[0].hospitalId);
        }
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    };
    if (doctorId && token) fetchDoctor();
  }, [doctorId, token]);

  // Fetch slots whenever date or hospital changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!doctorId || !selectedDate) return;
      try {
        const res = await axios.get(`/api/v1/doctors/${doctorId}/slots`, {
          params: { date: selectedDate, hospitalId: selectedHospitalId },
          headers: { Authorization: `Bearer ${token}` },
        });
        setSlots(res.data.data.slots || []);
        setSelectedSlot(null); // Reset selection
      } catch {
        setSlots([]);
      }
    };
    if (token) fetchSlots();
  }, [doctorId, selectedDate, selectedHospitalId, token]);

  const handleProceedToConfirm = () => {
    if (!selectedSlot || !doctor) return;
    const affiliation = doctor.affiliations?.find((a: any) => a.hospitalId === selectedHospitalId);

    navigate('/patient/appointments/confirm', {
      state: {
        doctorId,
        doctor,
        hospitalId: selectedHospitalId,
        hospital: affiliation?.hospital,
        consultationFee: affiliation ? Number(affiliation.consultationFee) : 500,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      },
    });
  };

  if (loading || !doctor) {
    return (
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div className="hs-skeleton" style={{ height: '120px', width: '100%', marginBottom: '1rem' }} />
        <div className="hs-skeleton" style={{ height: '300px', width: '100%' }} />
      </div>
    );
  }

  const morningSlots = slots.filter((s) => {
    const h = parseInt(s.startTime.split(':')[0], 10);
    return h < 12;
  });

  const afternoonSlots = slots.filter((s) => {
    const h = parseInt(s.startTime.split(':')[0], 10);
    return h >= 12 && h < 17;
  });

  const eveningSlots = slots.filter((s) => {
    const h = parseInt(s.startTime.split(':')[0], 10);
    return h >= 17;
  });

  return (
    <div className="container" style={{ maxWidth: '800px', padding: '1.5rem 1rem 6rem 1rem' }}>
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate(`/patient/doctors/${doctorId}`)}
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
        <span>Back to Profile</span>
      </button>

      {/* Doctor Summary Header */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <Card.Body style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Avatar name={doctor.fullName} src={doctor.profilePhotoUrl} size="md" />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
                Dr. {doctor.fullName}
              </h2>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-primary-600)' }}>
                {Array.isArray(doctor.specializations) ? doctor.specializations[0] : 'Specialist'}
              </span>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Hospital Location Selector (if multiple) */}
      {doctor.affiliations?.length > 1 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="hs-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
            {t('booking.selectLocation')}
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
            {doctor.affiliations.map((aff: any) => (
              <button
                key={aff.id}
                type="button"
                onClick={() => setSelectedHospitalId(aff.hospitalId)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${selectedHospitalId === aff.hospitalId ? 'var(--color-primary-600)' : 'var(--border-subtle)'}`,
                  backgroundColor: selectedHospitalId === aff.hospitalId ? 'var(--color-primary-50)' : 'var(--bg-surface)',
                  color: selectedHospitalId === aff.hospitalId ? 'var(--color-primary-800)' : 'var(--text-primary)',
                  fontWeight: selectedHospitalId === aff.hospitalId ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  minWidth: '200px',
                }}
              >
                <div style={{ fontSize: '0.875rem' }}>{aff.hospital?.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₹{Number(aff.consultationFee)}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date Picker (Horizontal Scroll) */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          {t('booking.selectDate')}
        </h3>
        <div
          style={{
            display: 'flex',
            gap: '0.625rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
          }}
        >
          {next30Days.map((d) => {
            const isSelected = selectedDate === d.dateString;
            return (
              <button
                key={d.dateString}
                type="button"
                onClick={() => setSelectedDate(d.dateString)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '0.75rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${isSelected ? 'var(--color-primary-600)' : 'var(--border-subtle)'}`,
                  backgroundColor: isSelected ? 'var(--color-primary-600)' : 'var(--bg-surface)',
                  color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                  cursor: 'pointer',
                  minWidth: '68px',
                  boxShadow: isSelected ? 'var(--shadow-md)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <span style={{ fontSize: '0.75rem', opacity: isSelected ? 0.9 : 0.6 }}>
                  {d.dayName}
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{d.dayNumber}</span>
                <span style={{ fontSize: '0.6875rem', opacity: isSelected ? 0.9 : 0.6 }}>
                  {d.monthName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Available Slots Grid */}
      <Card style={{ marginBottom: '2rem' }}>
        <Card.Header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} color="var(--color-primary-600)" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
              {t('booking.availableSlots')} — {selectedDate}
            </h3>
          </div>
        </Card.Header>

        <Card.Body>
          {slots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              No consultation slots available on this date. Please select another date.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Morning Slots */}
              {morningSlots.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                    🌅 {t('booking.morning')}
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '0.5rem' }}>
                    {morningSlots.map((slot) => renderSlotButton(slot))}
                  </div>
                </div>
              )}

              {/* Afternoon Slots */}
              {afternoonSlots.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                    ☀️ {t('booking.afternoon')}
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '0.5rem' }}>
                    {afternoonSlots.map((slot) => renderSlotButton(slot))}
                  </div>
                </div>
              )}

              {/* Evening Slots */}
              {eveningSlots.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                    🌙 {t('booking.evening')}
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '0.5rem' }}>
                    {eveningSlots.map((slot) => renderSlotButton(slot))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Sticky Bottom Action Bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)',
          padding: '0.875rem 1rem',
          boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.08)',
          zIndex: 35,
        }}
      >
        <div className="container" style={{ maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Selected Time</span>
            <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-primary-700)' }}>
              {selectedSlot ? `${selectedSlot.startTime} - ${selectedSlot.endTime}` : 'No slot chosen'}
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            disabled={!selectedSlot}
            onClick={handleProceedToConfirm}
          >
            Review Booking →
          </Button>
        </div>
      </div>
    </div>
  );

  function renderSlotButton(slot: any) {
    const isAvailable = slot.status === 'AVAILABLE';
    const isSelected = selectedSlot?.startTime === slot.startTime;

    return (
      <button
        key={slot.startTime}
        type="button"
        disabled={!isAvailable}
        onClick={() => setSelectedSlot(slot)}
        style={{
          padding: '0.625rem 0.25rem',
          textAlign: 'center',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.875rem',
          fontWeight: isSelected ? 800 : 600,
          cursor: isAvailable ? 'pointer' : 'not-allowed',
          border: `1px solid ${
            isSelected
              ? 'var(--color-primary-600)'
              : isAvailable
              ? 'var(--color-success-600)'
              : 'var(--border-subtle)'
          }`,
          backgroundColor: isSelected
            ? 'var(--color-primary-600)'
            : isAvailable
            ? 'var(--color-success-50)'
            : 'var(--color-slate-100)',
          color: isSelected
            ? '#FFFFFF'
            : isAvailable
            ? 'var(--color-success-700)'
            : 'var(--color-slate-400)',
          transition: 'all var(--transition-fast)',
        }}
      >
        {slot.startTime}
      </button>
    );
  }
};

export default BookAppointmentPage;
