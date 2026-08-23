import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';

export const DoctorProfileEditPage: React.FC = () => {
  const { token } = useAuthStore();

  const [doctor, setDoctor] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/v1/doctors/me/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data.data;
        setDoctor(d);
        setFullName(d.fullName || '');
        setBio(d.bio || '');
        setExperienceYears(d.experienceYears || 0);
        setSpecializations(Array.isArray(d.specializations) ? d.specializations : []);
        setLanguages(Array.isArray(d.languages) ? d.languages : []);
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchProfile();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await axios.put(
        '/api/v1/doctors/me/profile',
        {
          fullName,
          bio,
          experienceYears: Number(experienceYears),
          specializations,
          languages,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(true);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !doctor) {
    return (
      <div className="container" style={{ maxWidth: '700px', padding: '2rem 1rem' }}>
        <div className="hs-skeleton" style={{ height: '300px', width: '100%' }} />
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '700px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.25rem 0' }}>Doctor Profile Settings</h1>

      {success && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-success-50)',
            color: 'var(--color-success-700)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
          }}
        >
          ✓ Doctor profile updated successfully.
        </div>
      )}

      <form onSubmit={handleSave}>
        <Card style={{ marginBottom: '1.5rem' }}>
          <Card.Body>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <Avatar name={fullName} size="xl" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Dr. {fullName}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                  <ShieldCheck size={14} color="var(--color-primary-600)" />
                  <span>Registration #{doctor.registrationNumber}</span>
                </div>
              </div>
            </div>

            <Input
              label="Doctor Legal Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <div className="hs-input-group">
              <label className="hs-label">Years of Clinical Experience</label>
              <input
                type="number"
                min={0}
                className="hs-input"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
              />
            </div>

            <div className="hs-input-group">
              <label className="hs-label">Professional Bio</label>
              <textarea
                rows={4}
                className="hs-input"
                placeholder="Share your qualifications, clinical interests, and medical background..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="hs-input-group">
              <label className="hs-label">Specializations (comma separated)</label>
              <input
                type="text"
                className="hs-input"
                value={specializations.join(', ')}
                onChange={(e) =>
                  setSpecializations(
                    e.target.value.split(',').map((s) => s.trim()).filter((s) => s !== '')
                  )
                }
              />
            </div>

            <div className="hs-input-group">
              <label className="hs-label">Languages Spoken (comma separated)</label>
              <input
                type="text"
                className="hs-input"
                value={languages.join(', ')}
                onChange={(e) =>
                  setLanguages(
                    e.target.value.split(',').map((l) => l.trim()).filter((l) => l !== '')
                  )
                }
              />
            </div>
          </Card.Body>
        </Card>

        {/* Affiliations list */}
        <Card style={{ marginBottom: '1.5rem' }}>
          <Card.Header>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Hospital Affiliations & Fees</h3>
          </Card.Header>
          <Card.Body>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {doctor.affiliations?.map((aff: any) => (
                <div
                  key={aff.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.9375rem' }}>{aff.hospital?.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{aff.hospital?.city}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--color-secondary-700)' }}>
                    ₹{Number(aff.consultationFee)}
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>

        <Button variant="primary" size="lg" type="submit" isLoading={saving} style={{ width: '100%' }}>
          Save Doctor Profile
        </Button>
      </form>
    </div>
  );
};

export default DoctorProfileEditPage;
