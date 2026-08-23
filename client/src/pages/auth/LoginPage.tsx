import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, HeartPulse, Stethoscope, Phone, Lock, ArrowRight, RefreshCw } from 'lucide-react';
import useAuthStore, { Language } from '../../stores/authStore';
import CountryCodeSelector from '../../components/auth/CountryCodeSelector';
import OTPInput from '../../components/auth/OTPInput';
import Button from '../../components/ui/Button';

import Logo from '../../components/ui/Logo';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    sendOTP,
    verifyOTP,
    loginWithCredentials,
    language,
    setLanguage,
    selectedCountryCode,
    setCountryCode,
    isAuthenticated,
    user,
  } = useAuthStore();

  const [authMode, setAuthMode] = useState<'otp' | 'credentials'>('otp');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  // Form states
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = getDashboardPath(user.role);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Cooldown timer ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const getDashboardPath = (role: string) => {
    switch (role) {
      case 'DOCTOR':
        return '/doctor/dashboard';
      case 'RECEPTIONIST':
        return '/receptionist/dashboard';
      case 'AMBULANCE_OPERATOR':
        return '/ambulance/dashboard';
      case 'ADMIN':
        return '/admin/dashboard';
      case 'PATIENT':
      default:
        return '/patient/home';
    }
  };

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone || phone.length < 8) {
      setError('Please enter a valid mobile number');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await sendOTP(phone, selectedCountryCode);
      setStep('otp');
      setCooldown(30);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otpToVerify?: string) => {
    const code = otpToVerify || otp;
    if (code.length !== 6) {
      setError('Please enter all 6 digits of the OTP');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const { isNewUser } = await verifyOTP(phone, code, selectedCountryCode);
      if (isNewUser) {
        navigate('/patient/profile/setup', { replace: true });
      } else {
        const from = (location.state as any)?.from?.pathname || '/patient/home';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please provide phone number/username and password');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await loginWithCredentials(identifier, password);
      // store will update user and trigger navigation via useEffect
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Translations dictionary for login screen
  const t = {
    EN: {
      tagline: 'Healthcare Access, Hospital Coordination & Emergency Response',
      selectLanguage: 'Choose Language / भाषा निवडा / भाषा चुनें',
      patientLogin: 'Patient Access (OTP)',
      staffLogin: 'Doctor & Hospital Staff',
      enterPhone: 'Enter your mobile number to get started',
      phonePlaceholder: '98765 43210',
      getOtp: 'Get Verification Code',
      verifyOtp: 'Enter 6-Digit Code',
      otpSentTo: 'We sent a verification code to',
      changeNumber: 'Change Number',
      resendOtp: 'Resend Code',
      resendIn: 'Resend in',
      verifyBtn: 'Verify & Continue',
      staffIdentifier: 'Phone Number / Username',
      password: 'Password',
      loginBtn: 'Sign In to Dashboard',
      secureAccess: '256-bit Encrypted Healthcare Network',
    },
    HI: {
      tagline: 'स्वास्थ्य सेवा पहुंच, अस्पताल समन्वय और आपातकालीन प्रतिक्रिया',
      selectLanguage: 'भाषा चुनें',
      patientLogin: 'मरीज़ लॉगिन (OTP)',
      staffLogin: 'डॉक्टर एवं अस्पताल स्टाफ',
      enterPhone: 'आरंभ करने के लिए अपना मोबाइल नंबर दर्ज करें',
      phonePlaceholder: '98765 43210',
      getOtp: 'सत्यापन कोड प्राप्त करें',
      verifyOtp: '6-अंकों का कोड दर्ज करें',
      otpSentTo: 'हमने इस नंबर पर कोड भेजा है:',
      changeNumber: 'नंबर बदलें',
      resendOtp: 'पुनः कोड भेजें',
      resendIn: 'पुनः भेजें',
      verifyBtn: 'सत्यापित करें और आगे बढ़ें',
      staffIdentifier: 'फोन नंबर / यूज़रनेम',
      password: 'पासवर्ड',
      loginBtn: 'डैशबोर्ड में साइन इन करें',
      secureAccess: 'सुरक्षित 256-बिट एन्क्रिप्टेड स्वास्थ्य नेटवर्क',
    },
    MR: {
      tagline: 'आरोग्य सेवा, रुग्णालय समन्वय आणि आपत्कालीन प्रतिसाद मंच',
      selectLanguage: 'भाषा निवडा',
      patientLogin: 'रुग्ण प्रवेश (OTP)',
      staffLogin: 'डॉक्टर आणि रुग्णालय कर्मचारी',
      enterPhone: 'सुरू करण्यासाठी आपला मोबाईल नंबर प्रविष्ट करा',
      phonePlaceholder: '98765 43210',
      getOtp: 'पडताळणी कोड मिळवा',
      verifyOtp: '६-अंकी कोड प्रविष्ट करा',
      otpSentTo: 'आम्ही या नंबरवर कोड पाठवला आहे:',
      changeNumber: 'नंबर बदला',
      resendOtp: 'पुन्हा कोड पाठवा',
      resendIn: 'पुन्हा पाठवा',
      verifyBtn: 'पडताळणी करा आणि पुढे जा',
      staffIdentifier: 'फोन नंबर / युझरनेम',
      password: 'पासवर्ड',
      loginBtn: 'डॅशबोर्डमध्ये साइन इन करा',
      secureAccess: 'सुरक्षित २५६-बिट एन्क्रिप्टेड आरोग्य नेटवर्क',
    },
  }[language];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1.5rem 1rem',
        background: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 50%, #F0FDFA 100%)',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '1.75rem',
          textAlign: 'center',
        }}
      >
        <Logo size="lg" showText={true} />
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-slate-600)',
            maxWidth: '380px',
            marginTop: '0.625rem',
            lineHeight: 1.4,
          }}
        >
          {t.tagline}
        </p>
      </div>

      {/* Main Login Card */}
      <div
        className="hs-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2rem 1.75rem',
          backdropFilter: 'blur(10px)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          overflow: 'visible',
          position: 'relative',
        }}
      >
        {/* Language Selection Buttons */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              backgroundColor: 'var(--color-slate-100)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {(['EN', 'HI', 'MR'] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                style={{
                  padding: '0.5rem 0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: language === lang ? 700 : 500,
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  backgroundColor: language === lang ? '#FFFFFF' : 'transparent',
                  color: language === lang ? 'var(--color-primary-600)' : 'var(--color-slate-600)',
                  boxShadow: language === lang ? 'var(--shadow-sm)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {lang === 'EN' ? 'English' : lang === 'HI' ? 'हिंदी' : 'मराठी'}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Toggle: Patient OTP vs Staff Login */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '1.5rem',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setAuthMode('otp');
              setError(null);
            }}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: authMode === 'otp' ? 600 : 500,
              color: authMode === 'otp' ? 'var(--color-primary-600)' : 'var(--text-muted)',
              border: 'none',
              borderBottom: `2px solid ${authMode === 'otp' ? 'var(--color-primary-600)' : 'transparent'}`,
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
            }}
          >
            <HeartPulse size={16} />
            <span>{t.patientLogin}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('credentials');
              setError(null);
            }}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: authMode === 'credentials' ? 600 : 500,
              color: authMode === 'credentials' ? 'var(--color-primary-600)' : 'var(--text-muted)',
              border: 'none',
              borderBottom: `2px solid ${authMode === 'credentials' ? 'var(--color-primary-600)' : 'transparent'}`,
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
            }}
          >
            <Stethoscope size={16} />
            <span>{t.staffLogin}</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--color-danger-50)',
              color: 'var(--color-danger-700)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              border: '1px solid var(--color-danger-100)',
            }}
          >
            {error}
          </div>
        )}

        {/* Mode 1: Patient OTP Authentication */}
        {authMode === 'otp' && (
          <>
            {step === 'phone' ? (
              <form onSubmit={handleSendOTP}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {t.enterPhone}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem', width: '100%' }}>
                  <CountryCodeSelector
                    selectedDialCode={selectedCountryCode}
                    onSelect={setCountryCode}
                  />
                  <input
                    type="tel"
                    placeholder={t.phonePlaceholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    maxLength={10}
                    autoFocus
                    required
                    style={{
                      flex: 1,
                      height: '48px',
                      padding: '0 1rem',
                      fontSize: '1.0625rem',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      border: '1px solid #CBD5E1',
                      borderLeft: 'none',
                      borderRadius: '0 8px 8px 0',
                      backgroundColor: '#FFFFFF',
                      color: '#0F172A',
                      outline: 'none',
                    }}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={loading}
                  rightIcon={<ArrowRight size={18} />}
                  style={{ width: '100%' }}
                >
                  {t.getOtp}
                </Button>
              </form>
            ) : (
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
                  {t.verifyOtp}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {t.otpSentTo} <strong>{selectedCountryCode} {phone}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setError(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary-600)',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: 0,
                    margin: '0.25rem 0 1rem 0',
                  }}
                >
                  ← {t.changeNumber}
                </button>

                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  onComplete={handleVerifyOTP}
                  disabled={loading}
                  hasError={!!error}
                />

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  isLoading={loading}
                  onClick={() => handleVerifyOTP()}
                  style={{ width: '100%', marginBottom: '1rem' }}
                >
                  {t.verifyBtn}
                </Button>

                <div style={{ textAlign: 'center' }}>
                  {cooldown > 0 ? (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {t.resendIn} {cooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOTP()}
                      disabled={loading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary-600)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <RefreshCw size={14} />
                      <span>{t.resendOtp}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Mode 2: Staff / Credential Authentication */}
        {authMode === 'credentials' && (
          <form onSubmit={handleCredentialLogin}>
            <div className="hs-input-group">
              <label className="hs-label">{t.staffIdentifier}</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Phone
                  size={18}
                  style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  placeholder="+919876543210"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="hs-input"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div className="hs-input-group">
              <label className="hs-label">{t.password}</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock
                  size={18}
                  style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)' }}
                />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="hs-input"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {t.loginBtn}
            </Button>
          </form>
        )}
      </div>

      {/* Security footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          marginTop: '1.5rem',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
        }}
      >
        <ShieldCheck size={16} color="var(--color-success-600)" />
        <span>{t.secureAccess}</span>
      </div>
    </div>
  );
};

export default LoginPage;
