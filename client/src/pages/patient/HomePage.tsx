import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  Search,
  Calendar,
  FileText,
  Pill,
  Siren,
  Clock,
  MapPin,
  ChevronRight,
  Stethoscope,
  Heart,
  Baby,
  Bone,
  Eye,
  Brain,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);

  const specializations = [
    { name: 'General Physician', icon: <Stethoscope size={22} />, color: '#1A56DB' },
    { name: 'Cardiologist', icon: <Heart size={22} />, color: '#DC2626' },
    { name: 'Pediatrician', icon: <Baby size={22} />, color: '#0D9488' },
    { name: 'Orthopedist', icon: <Bone size={22} />, color: '#F59E0B' },
    { name: 'Ophthalmologist', icon: <Eye size={22} />, color: '#6366F1' },
    { name: 'Neurologist', icon: <Brain size={22} />, color: '#8B5CF6' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, aptRes] = await Promise.all([
          axios.get('/api/v1/patients/me', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/v1/appointments/my?type=upcoming', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setPatientProfile(profileRes.data.data);
        setUpcomingAppointments(aptRes.data.data.slice(0, 3));
      } catch {
        // use defaults
      }
    };

    if (token) fetchData();
  }, [token]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/patient/doctors?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/patient/doctors');
    }
  };

  return (
    <div className="container" style={{ padding: '1.5rem 1rem' }}>
      {/* Welcome & Search Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-700) 0%, var(--color-primary-900) 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem 1.25rem',
          color: '#FFFFFF',
          marginBottom: '1.75rem',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.875rem', opacity: 0.85 }}>{t('home.welcome')},</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.125rem 0 0 0' }}>
            {patientProfile?.fullName || user?.phone || 'HealthSync User'}
          </h2>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={t('home.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem 0.875rem 3rem',
                fontSize: '0.9375rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: '#FFFFFF',
                color: 'var(--text-primary)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                outline: 'none',
              }}
            />
          </div>
        </form>
      </div>

      {/* Emergency Banner */}
      <div
        style={{
          backgroundColor: 'var(--color-danger-50)',
          border: '1px solid var(--color-danger-100)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.75rem',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              padding: '0.5rem',
              backgroundColor: 'var(--color-danger-600)',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <Siren size={20} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-danger-700)' }}>
              Emergency Assistance Needed?
            </h4>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-danger-600)' }}>
              {t('home.emergencyBanner')}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          {t('home.quickActions')}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.875rem' }}>
          <div
            onClick={() => navigate('/patient/doctors')}
            className="hs-card"
            style={{
              padding: '1rem',
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'var(--color-primary-50)',
                color: 'var(--color-primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Stethoscope size={24} />
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{t('home.bookDoctor')}</span>
          </div>

          <div
            onClick={() => navigate('/patient/appointments')}
            className="hs-card"
            style={{
              padding: '1rem',
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'var(--color-secondary-50)',
                color: 'var(--color-secondary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={24} />
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{t('home.myAppointments')}</span>
          </div>

          <div
            onClick={() => navigate('/patient/records')}
            className="hs-card"
            style={{
              padding: '1rem',
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'var(--color-warning-50)',
                color: 'var(--color-warning-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={24} />
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{t('home.healthRecords')}</span>
          </div>

          <div
            onClick={() => navigate('/patient/reminders')}
            className="hs-card"
            style={{
              padding: '1rem',
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#F3E8FF',
                color: '#7E22CE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Pill size={24} />
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{t('home.reminders')}</span>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {t('home.upcomingAppointments')}
          </h3>
          <button
            type="button"
            onClick={() => navigate('/patient/appointments')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary-600)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span>View All</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {upcomingAppointments.length === 0 ? (
          <Card>
            <Card.Body style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <Calendar size={40} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
                {t('home.noUpcoming')}
              </p>
              <Button variant="primary" size="sm" onClick={() => navigate('/patient/doctors')}>
                {t('home.bookNow')}
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {upcomingAppointments.map((apt) => (
              <Card key={apt.id} onClick={() => navigate('/patient/appointments')} style={{ cursor: 'pointer' }}>
                <Card.Body style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                        Dr. {apt.doctor?.fullName || 'Specialist'}
                      </h4>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-primary-600)', fontWeight: 500 }}>
                        {Array.isArray(apt.doctor?.specializations) ? apt.doctor.specializations[0] : 'Consultant'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Clock size={14} />
                        <span>{apt.date?.split('T')[0]} at {apt.startTime}</span>
                        <span>•</span>
                        <MapPin size={14} />
                        <span>{apt.hospital?.name || 'Clinic'}</span>
                      </div>
                    </div>
                    <Badge variant="success">Confirmed</Badge>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Specializations Explorer */}
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Explore Specializations
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
          {specializations.map((s) => (
            <div
              key={s.name}
              onClick={() => navigate(`/patient/doctors?specialization=${encodeURIComponent(s.name)}`)}
              className="hs-card"
              style={{
                padding: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: `${s.color}15`,
                  color: s.color,
                }}
              >
                {s.icon}
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
