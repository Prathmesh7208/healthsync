import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Star, ShieldCheck, MapPin, Award, ArrowLeft } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';

export const DoctorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await axios.get(`/api/v1/doctors/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDoctor(res.data.data);
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    };
    if (id && token) fetchDoctor();
  }, [id, token]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div className="hs-skeleton" style={{ height: '300px', width: '100%', marginBottom: '1rem' }} />
        <div className="hs-skeleton" style={{ height: '150px', width: '100%' }} />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="container" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
        <h2>Doctor not found</h2>
        <Button variant="outline" onClick={() => navigate('/patient/doctors')}>
          Back to Doctor Search
        </Button>
      </div>
    );
  }

  const specs = Array.isArray(doctor.specializations) ? doctor.specializations : [];
  const langs = Array.isArray(doctor.languages) ? doctor.languages : [];
  const primaryAffiliation = doctor.affiliations?.[0];

  return (
    <div className="container" style={{ maxWidth: '800px', padding: '1.5rem 1rem 6rem 1rem' }}>
      {/* Back navigation */}
      <button
        type="button"
        onClick={() => navigate('/patient/doctors')}
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
        <span>Back to Doctors</span>
      </button>

      {/* Hero Doctor Card */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <Card.Body style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <Avatar name={doctor.fullName} src={doctor.profilePhotoUrl} size="xl" />

            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Dr. {(doctor.fullName || '').replace(/^(dr\.?|doctor)\s+/i, '').replace(/^(dr\.?|doctor)\s+/i, '').trim()}
                </h1>
                <span title="Verified Practitioner" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <ShieldCheck size={20} color="var(--color-primary-600)" />
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', margin: '0.5rem 0' }}>
                {specs.map((s: string) => (
                  <Badge key={s} variant="info">
                    {s}
                  </Badge>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-warning-600)', fontWeight: 700 }}>
                  <Star size={16} fill="currentColor" />
                  <span>4.8</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(124 reviews)</span>
                </div>
                <span>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                  <Award size={16} />
                  <span>{doctor.experienceYears} Years Exp</span>
                </div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* About & Bio */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <Card.Header>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>{t('doctor.about')}</h3>
        </Card.Header>
        <Card.Body>
          <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {doctor.bio ||
              `Dr. ${doctor.fullName} is a dedicated healthcare specialist with ${doctor.experienceYears} years of clinical expertise. Registered with Medical Council Registration #${doctor.registrationNumber}.`}
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.25rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Registration Number</span>
              <strong style={{ color: 'var(--text-primary)' }}>{doctor.registrationNumber}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Languages Spoken</span>
              <strong style={{ color: 'var(--text-primary)' }}>{langs.join(', ') || 'English, Hindi'}</strong>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Hospital Affiliations & Consultation Fee */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <Card.Header>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>{t('doctor.affiliations')}</h3>
        </Card.Header>
        <Card.Body>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {doctor.affiliations?.map((aff: any) => (
              <div
                key={aff.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{aff.hospital?.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                    <MapPin size={14} />
                    <span>{aff.hospital?.address}, {aff.hospital?.city}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Consultation Fee</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-secondary-700)' }}>
                    ₹{Number(aff.consultationFee)}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Consultation Fee</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-secondary-700)' }}>
              ₹{primaryAffiliation ? Number(primaryAffiliation.consultationFee) : 500}
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(`/patient/doctors/${doctor.id}/book`)}
          >
            {t('doctor.bookSlot')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfilePage;
