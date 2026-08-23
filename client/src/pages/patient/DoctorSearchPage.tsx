import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Search, Star, MapPin, SlidersHorizontal, Stethoscope } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';

export const DoctorSearchPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuthStore();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [specialization, setSpecialization] = useState(searchParams.get('specialization') || '');
  const [availability, setAvailability] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const specializationsList = [
    'All',
    'General Physician',
    'Cardiologist',
    'Pediatrician',
    'Orthopedist',
    'Dermatologist',
    'Gynecologist',
    'Ophthalmologist',
    'Neurologist',
  ];

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params: any = { sortBy };
      if (query) params.q = query;
      if (specialization && specialization !== 'All') params.specialization = specialization;
      if (availability) params.availability = availability;

      const res = await axios.get('/api/v1/doctors', {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setDoctors(res.data.data.doctors || []);
    } catch {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [query, specialization, availability, sortBy]);

  return (
    <div className="container" style={{ padding: '1.5rem 1rem' }}>
      {/* Header & Search Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.875rem 0', color: 'var(--text-primary)' }}>
          {t('doctor.searchTitle')}
        </h1>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.875rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by doctor name or condition..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="hs-input"
              style={{ paddingLeft: '2.5rem', minHeight: '44px' }}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0 1rem',
              backgroundColor: showFilterDrawer ? 'var(--color-primary-50)' : 'var(--bg-surface)',
              border: `1px solid ${showFilterDrawer ? 'var(--color-primary-600)' : 'var(--border-strong)'}`,
              borderRadius: 'var(--radius-sm)',
              color: showFilterDrawer ? 'var(--color-primary-600)' : 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            <SlidersHorizontal size={16} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Specialization Filter Chips */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        {specializationsList.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSpecialization(s === 'All' ? '' : s)}
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${
                (s === 'All' && !specialization) || specialization === s
                  ? 'var(--color-primary-600)'
                  : 'var(--border-subtle)'
              }`,
              backgroundColor:
                (s === 'All' && !specialization) || specialization === s
                  ? 'var(--color-primary-50)'
                  : 'var(--bg-surface)',
              color:
                (s === 'All' && !specialization) || specialization === s
                  ? 'var(--color-primary-700)'
                  : 'var(--text-secondary)',
              fontWeight: (s === 'All' && !specialization) || specialization === s ? 700 : 500,
              fontSize: '0.8125rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Filter Drawer / Controls */}
      {showFilterDrawer && (
        <Card style={{ marginBottom: '1.5rem', backgroundColor: 'var(--bg-surface-subtle)' }}>
          <Card.Body style={{ padding: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="hs-label" style={{ marginBottom: '0.25rem', display: 'block' }}>
                  Sort By
                </label>
                <select
                  className="hs-input"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ minHeight: '38px', padding: '0.375rem 0.625rem' }}
                >
                  <option value="rating">Highest Rated</option>
                  <option value="experience">Most Experienced</option>
                  <option value="fee_asc">Consultation Fee: Low to High</option>
                </select>
              </div>

              <div>
                <label className="hs-label" style={{ marginBottom: '0.25rem', display: 'block' }}>
                  Availability
                </label>
                <button
                  type="button"
                  onClick={() => setAvailability(availability === 'today' ? '' : 'today')}
                  style={{
                    width: '100%',
                    padding: '0.375rem 0.75rem',
                    minHeight: '38px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${availability === 'today' ? 'var(--color-success-600)' : 'var(--border-strong)'}`,
                    backgroundColor: availability === 'today' ? 'var(--color-success-50)' : 'var(--bg-surface)',
                    color: availability === 'today' ? 'var(--color-success-700)' : 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                  }}
                >
                  {availability === 'today' ? '✓ Showing Available Today' : 'Show Doctors Available Today'}
                </button>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Results Section */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="hs-skeleton" style={{ height: '140px', width: '100%' }} />
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <Card>
          <Card.Body style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <Stethoscope size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>No Doctors Found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '300px', margin: '0.5rem auto 1.5rem auto' }}>
              Try searching with another specialization or resetting your filters.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery('');
                setSpecialization('');
                setAvailability('');
              }}
            >
              Reset Filters
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {doctors.map((doctor) => {
            const primaryAffiliation = doctor.affiliations?.[0];
            const specs = Array.isArray(doctor.specializations)
              ? doctor.specializations.join(', ')
              : 'Specialist';

            return (
              <Card
                key={doctor.id}
                onClick={() => navigate(`/patient/doctors/${doctor.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <Card.Body style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <Avatar
                      name={doctor.fullName}
                      src={doctor.profilePhotoUrl}
                      size="lg"
                    />

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Dr. {doctor.fullName}
                          </h3>
                          <p style={{ margin: '0.125rem 0 0.5rem 0', fontSize: '0.8125rem', color: 'var(--color-primary-600)', fontWeight: 600 }}>
                            {specs}
                          </p>
                        </div>
                        <Badge variant="success">
                          <Star size={12} fill="currentColor" />
                          <span>4.8</span>
                        </Badge>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        <span>🎓 {doctor.experienceYears} {t('doctor.experience')}</span>
                        <span>•</span>
                        <span>🗣️ {Array.isArray(doctor.languages) ? doctor.languages.join(', ') : 'English'}</span>
                        {primaryAffiliation && (
                          <>
                            <span>•</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              <MapPin size={12} />
                              {primaryAffiliation.hospital?.name}
                            </span>
                          </>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('doctor.consultationFee')}</span>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary-700)' }}>
                            ₹{primaryAffiliation ? Number(primaryAffiliation.consultationFee) : 500}
                          </div>
                        </div>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/patient/doctors/${doctor.id}/book`);
                          }}
                        >
                          {t('doctor.bookSlot')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DoctorSearchPage;
