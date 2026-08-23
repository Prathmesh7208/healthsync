import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Heart, Shield, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';

export const ProfileSetup: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile Form State
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'MALE',
    bloodGroup: 'UNKNOWN',
    emergencyContactName: '',
    emergencyContactPhone: '',
    addressLine1: '',
    city: '',
    state: '',
    pinCode: '',
    knownAllergies: '',
    existingConditions: [] as string[],
  });

  const commonConditions = [
    'Diabetes (Type 1/2)',
    'Hypertension (High BP)',
    'Asthma / Respiratory',
    'Cardiac / Heart Disease',
    'Thyroid Disorder',
    'Kidney Disease',
    'None',
  ];

  // Fetch existing profile if available
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/v1/patients/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.data) {
          const p = res.data.data;
          setFormData((prev) => ({
            ...prev,
            fullName: p.fullName || '',
            dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
            gender: p.gender || 'MALE',
            bloodGroup: p.bloodGroup || 'UNKNOWN',
            emergencyContactName: p.emergencyContactName || '',
            emergencyContactPhone: p.emergencyContactPhone || '',
            addressLine1: p.addressLine1 || '',
            city: p.city || '',
            state: p.state || '',
            pinCode: p.pinCode || '',
            knownAllergies: p.knownAllergies || '',
            existingConditions: p.existingConditions || [],
          }));
        }
      } catch {
        // ignore if empty
      }
    };
    if (token) fetchProfile();
  }, [token]);

  const handleConditionToggle = (condition: string) => {
    if (condition === 'None') {
      setFormData((prev) => ({ ...prev, existingConditions: ['None'] }));
      return;
    }
    setFormData((prev) => {
      const filtered = prev.existingConditions.filter((c) => c !== 'None');
      if (filtered.includes(condition)) {
        return { ...prev, existingConditions: filtered.filter((c) => c !== condition) };
      } else {
        return { ...prev, existingConditions: [...filtered, condition] };
      }
    });
  };

  const calculateAge = (dobString: string) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleSubmit = async () => {
    if (!formData.fullName.trim()) {
      setError('Please provide your full legal name');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await axios.put('/api/v1/patients/me', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate('/patient/home', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '640px', padding: '2rem 1rem' }}>
      {/* Progress Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Patient Profile Setup
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Step {step} of 3 — Complete your medical record profile
        </p>

        {/* Stepper Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                width: s === step ? '32px' : '10px',
                height: '10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: s <= step ? 'var(--color-primary-600)' : 'var(--color-slate-200)',
                transition: 'all var(--transition-normal)',
              }}
            />
          ))}
        </div>
      </div>

      <Card>
        <Card.Body>
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

          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <User size={20} color="var(--color-primary-600)" />
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Personal Details</h3>
              </div>

              <Input
                label="Full Name *"
                placeholder="e.g. Meera Rajesh Patil"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="hs-input-group">
                  <label className="hs-label">Date of Birth</label>
                  <input
                    type="date"
                    className="hs-input"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                  {formData.dateOfBirth && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-600)', marginTop: '2px' }}>
                      Age: {calculateAge(formData.dateOfBirth)} years
                    </span>
                  )}
                </div>

                <div className="hs-input-group">
                  <label className="hs-label">Blood Group</label>
                  <select
                    className="hs-input"
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  >
                    <option value="UNKNOWN">Don't Know</option>
                    <option value="A_POSITIVE">A +ve</option>
                    <option value="A_NEGATIVE">A -ve</option>
                    <option value="B_POSITIVE">B +ve</option>
                    <option value="B_NEGATIVE">B -ve</option>
                    <option value="AB_POSITIVE">AB +ve</option>
                    <option value="AB_NEGATIVE">AB -ve</option>
                    <option value="O_POSITIVE">O +ve</option>
                    <option value="O_NEGATIVE">O -ve</option>
                  </select>
                </div>
              </div>

              <div className="hs-input-group">
                <label className="hs-label">Gender</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {['MALE', 'FEMALE', 'OTHER'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: g })}
                      style={{
                        flex: 1,
                        padding: '0.625rem',
                        border: `1px solid ${formData.gender === g ? 'var(--color-primary-600)' : 'var(--border-strong)'}`,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: formData.gender === g ? 'var(--color-primary-50)' : 'transparent',
                        color: formData.gender === g ? 'var(--color-primary-700)' : 'var(--text-secondary)',
                        fontWeight: formData.gender === g ? 600 : 400,
                        cursor: 'pointer',
                      }}
                    >
                      {g === 'MALE' ? 'Male' : g === 'FEMALE' ? 'Female' : 'Other'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Emergency Contact & Address */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Shield size={20} color="var(--color-danger-600)" />
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Emergency Contact & Address</h3>
              </div>

              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                This contact will be notified automatically whenever you trigger an Emergency SOS.
              </p>

              <Input
                label="Emergency Contact Name"
                placeholder="Family member / Guardian name"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
              />

              <Input
                label="Emergency Contact Phone"
                placeholder="+91 98765 43210"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
              />

              <Input
                label="Home Address / Area"
                placeholder="Apartment, Street, Landmark"
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                  label="City"
                  placeholder="Pune"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <Input
                  label="Pin Code"
                  placeholder="411001"
                  value={formData.pinCode}
                  onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Medical Background & Allergies */}
          {step === 3 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Heart size={20} color="var(--color-secondary-600)" />
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Medical History & Conditions</h3>
              </div>

              <div className="hs-input-group">
                <label className="hs-label">Known Allergies (Drugs, Food, Dust)</label>
                <input
                  type="text"
                  className="hs-input"
                  placeholder="e.g. Penicillin, Sulfa drugs, Peanuts"
                  value={formData.knownAllergies}
                  onChange={(e) => setFormData({ ...formData, knownAllergies: e.target.value })}
                />
              </div>

              <div className="hs-input-group">
                <label className="hs-label">Existing Health Conditions</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {commonConditions.map((cond) => {
                    const isSelected = formData.existingConditions.includes(cond);
                    return (
                      <div
                        key={cond}
                        onClick={() => handleConditionToggle(cond)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.625rem 0.875rem',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${isSelected ? 'var(--color-secondary-600)' : 'var(--border-subtle)'}`,
                          backgroundColor: isSelected ? 'var(--color-secondary-50)' : 'var(--bg-surface)',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            border: `2px solid ${isSelected ? 'var(--color-secondary-600)' : 'var(--border-strong)'}`,
                            backgroundColor: isSelected ? 'var(--color-secondary-600)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                          }}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                        <span style={{ fontSize: '0.875rem', color: isSelected ? 'var(--color-secondary-900)' : 'var(--text-primary)' }}>
                          {cond}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </Card.Body>

        <Card.Footer>
          {step > 1 && (
            <Button
              variant="outline"
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => setStep((prev) => prev - 1)}
            >
              Back
            </Button>
          )}

          {step < 3 ? (
            <Button
              variant="primary"
              rightIcon={<ArrowRight size={16} />}
              onClick={() => {
                if (step === 1 && !formData.fullName.trim()) {
                  setError('Please provide your full legal name');
                  return;
                }
                setError(null);
                setStep((prev) => prev + 1);
              }}
            >
              Next Step
            </Button>
          ) : (
            <Button
              variant="primary"
              isLoading={loading}
              onClick={handleSubmit}
            >
              Save & Enter HealthSync
            </Button>
          )}
        </Card.Footer>
      </Card>
    </div>
  );
};

export default ProfileSetup;
