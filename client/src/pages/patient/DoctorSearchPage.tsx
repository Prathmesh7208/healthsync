import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Search, Star, MapPin, SlidersHorizontal, Stethoscope, Tag } from 'lucide-react';
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
  const [priceRange, setPriceRange] = useState<string>('ALL');
  const [customMaxFee, setCustomMaxFee] = useState<number>(2000);

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

  const priceRanges = [
    { key: 'ALL', label: 'All Fees' },
    { key: 'UNDER_300', label: 'Under ₹300', max: 300 },
    { key: '300_500', label: '₹300 - ₹500', min: 300, max: 500 },
    { key: '500_1000', label: '₹500 - ₹1000', min: 500, max: 1000 },
    { key: '1000_PLUS', label: '₹1000+', min: 1000 },
  ];

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params: any = {};
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
  }, [query, specialization, availability]);

  // Client-side filtering by consultation fee
  const filteredDoctors = doctors.filter((doc) => {
    const fee = doc.affiliations?.[0]?.consultationFee ? Number(doc.affiliations[0].consultationFee) : 500;
    
    if (priceRange === 'UNDER_300') return fee <= 300;
    if (priceRange === '300_500') return fee >= 300 && fee <= 500;
    if (priceRange === '500_1000') return fee >= 500 && fee <= 1000;
    if (priceRange === '1000_PLUS') return fee >= 1000;
    if (priceRange === 'CUSTOM') return fee <= customMaxFee;
    return true;
  });

  return (
    <div className="container" style={{ padding: '1.5rem 1rem' }}>
      {/* Header & Search Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, margin: '0 0 0.875rem 0', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {t('doctor.searchTitle')}
        </h1>

        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.875rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search doctor, hospital, condition..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="hs-input"
              style={{ paddingLeft: '2.5rem', minHeight: '44px', borderRadius: '12px' }}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className="hs-btn hs-btn-outline"
            style={{
              padding: '0 1rem',
              minHeight: '44px',
              borderRadius: '12px',
              backgroundColor: showFilterDrawer ? 'var(--color-primary-50)' : undefined,
              borderColor: showFilterDrawer ? 'var(--color-primary-600)' : undefined,
              color: showFilterDrawer ? 'var(--color-primary-700)' : undefined,
            }}
          >
            <SlidersHorizontal size={16} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Specialization Filter Chips */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        {specializationsList.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSpecialization(s === 'All' ? '' : s)}
            className={`hs-filter-pill ${(s === 'All' && !specialization) || specialization === s ? 'active' : ''}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Consultation Fee Budget Filter Chips */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.625rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-secondary-700)', paddingRight: '0.25rem', flexShrink: 0 }}>
          <Tag size={13} />
          <span>FEE BUDGET:</span>
        </div>
        {priceRanges.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPriceRange(p.key)}
            className={`hs-filter-pill ${priceRange === p.key ? 'active' : ''}`}
            style={{
              fontSize: '0.75rem',
              padding: '0.3rem 0.75rem',
              borderColor: priceRange === p.key ? 'var(--color-secondary-600)' : undefined,
              backgroundColor: priceRange === p.key ? 'var(--color-secondary-50)' : undefined,
              color: priceRange === p.key ? 'var(--color-secondary-800)' : undefined,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Filter Drawer: Consultation Fee Customizer & Availability */}
      {showFilterDrawer && (
        <Card style={{ marginBottom: '1.5rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
          <Card.Body style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', alignItems: 'center' }}>
              <div>
                <label className="hs-label" style={{ marginBottom: '0.375rem' }}>
                  Custom Consultation Fee Budget: <strong style={{ color: 'var(--color-secondary-700)', fontSize: '0.9375rem' }}>Up to ₹{customMaxFee}</strong>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="range"
                    min="100"
                    max="3000"
                    step="50"
                    value={customMaxFee}
                    onChange={(e) => {
                      setCustomMaxFee(Number(e.target.value));
                      setPriceRange('CUSTOM');
                    }}
                    style={{ flex: 1, accentColor: 'var(--color-secondary-600)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-secondary-700)', minWidth: '54px' }}>
                    ₹{customMaxFee}
                  </span>
                </div>
              </div>

              <div>
                <label className="hs-label" style={{ marginBottom: '0.375rem' }}>
                  Doctor Availability
                </label>
                <button
                  type="button"
                  onClick={() => setAvailability(availability === 'today' ? '' : 'today')}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.875rem',
                    minHeight: '42px',
                    borderRadius: '12px',
                    border: `1.5px solid ${availability === 'today' ? 'var(--color-success-600)' : 'var(--border-subtle)'}`,
                    backgroundColor: availability === 'today' ? 'var(--color-success-50)' : 'var(--bg-surface)',
                    color: availability === 'today' ? 'var(--color-success-700)' : 'var(--text-primary)',
                    fontWeight: 700,
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
      ) : filteredDoctors.length === 0 ? (
        <Card style={{ borderRadius: '16px', border: '1.5px dashed var(--border-subtle)' }}>
          <Card.Body style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <Stethoscope size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>No Doctors Found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '340px', margin: '0.5rem auto 1.5rem auto' }}>
              No doctors matched your fee budget or search criteria. Try expanding your price range.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery('');
                setSpecialization('');
                setAvailability('');
                setPriceRange('ALL');
                setCustomMaxFee(2000);
              }}
            >
              Reset All Filters
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredDoctors.map((doctor) => {
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
                            Dr. {(doctor.fullName || '').replace(/^(dr\.?|doctor)\s+/i, '').replace(/^(dr\.?|doctor)\s+/i, '').trim()}
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
