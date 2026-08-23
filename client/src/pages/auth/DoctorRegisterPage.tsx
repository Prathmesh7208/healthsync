import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Stethoscope, ArrowRight, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Logo from '../../components/ui/Logo';
import useAuthStore from '../../stores/authStore';

export const DoctorRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    registrationNumber: '',
    specializations: 'General Medicine',
    experienceYears: 5,
    consultationFee: 600,
    languages: 'English, Hindi',
    bio: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post('/api/v1/auth/doctor/register', {
        ...formData,
        specializations: formData.specializations.split(',').map((s) => s.trim()),
        languages: formData.languages.split(',').map((l) => l.trim()),
      });

      const { token, user } = res.data.data;
      setAuth(token, user);
      setRegistered(true);
      setTimeout(() => {
        navigate('/doctor/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register doctor account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem 1rem',
        background: 'linear-gradient(135deg, #0B132B 0%, #1C2541 100%)',
        color: '#F8FAFC',
      }}
    >
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <Logo size="lg" variant="dark" />
        <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Doctor Practitioner Onboarding & Medical Registry
        </p>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: '#1C2541',
          border: '1px solid #3A506B',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Stethoscope size={22} color="#60A5FA" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Doctor Self-Registration
            </h2>
          </div>
          <Link to="/login" style={{ color: '#94A3B8', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}>
            <ArrowLeft size={14} />
            <span>Back to Login</span>
          </Link>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#F87171',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {registered ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <CheckCircle2 size={48} color="#34D399" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.5rem 0' }}>
              Registration Successful!
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
              Redirecting you to your Doctor Portal Dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '4px' }}>
                Full Name (with title) *
              </label>
              <input
                type="text"
                placeholder="Dr. Siddharth Verma"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  backgroundColor: '#0B132B',
                  border: '1px solid #3A506B',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '4px' }}>
                  Mobile Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="9822100000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    backgroundColor: '#0B132B',
                    border: '1px solid #3A506B',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '4px' }}>
                  Create Password *
                </label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    backgroundColor: '#0B132B',
                    border: '1px solid #3A506B',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '4px' }}>
                  Medical Council Reg. Number *
                </label>
                <input
                  type="text"
                  placeholder="MCI-2016-1234"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    backgroundColor: '#0B132B',
                    border: '1px solid #3A506B',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '4px' }}>
                  Years of Experience
                </label>
                <input
                  type="number"
                  value={formData.experienceYears}
                  onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    backgroundColor: '#0B132B',
                    border: '1px solid #3A506B',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '4px' }}>
                  Specializations (comma-sep)
                </label>
                <input
                  type="text"
                  placeholder="Cardiology, Internal Medicine"
                  value={formData.specializations}
                  onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    backgroundColor: '#0B132B',
                    border: '1px solid #3A506B',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '4px' }}>
                  Consultation Fee (INR)
                </label>
                <input
                  type="number"
                  value={formData.consultationFee}
                  onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    backgroundColor: '#0B132B',
                    border: '1px solid #3A506B',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '4px' }}>
                Professional Bio / Clinical Summary
              </label>
              <textarea
                rows={2}
                placeholder="Brief summary of your clinical background and areas of interest..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  backgroundColor: '#0B132B',
                  border: '1px solid #3A506B',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#1A56DB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9375rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(26, 86, 219, 0.4)',
              }}
            >
              <span>{loading ? 'Submitting Registration...' : 'Complete Doctor Registration'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default DoctorRegisterPage;
