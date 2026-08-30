import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  User,
  Stethoscope,
  Building2,
  Truck,
  Lock,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Logo from '../../components/ui/Logo';

type RegistrationRole = 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'AMBULANCE';

export const RegisterPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = (searchParams.get('role')?.toUpperCase() as RegistrationRole) || 'PATIENT';

  const [activeRole, setActiveRole] = useState<RegistrationRole>(defaultRole);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Common fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Patient-specific fields
  const [bloodGroup, setBloodGroup] = useState('O_POSITIVE');
  const [gender, setGender] = useState('MALE');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [allergies, setAllergies] = useState('');
  const [address, setAddress] = useState('');

  // Doctor-specific fields
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [specialization, setSpecialization] = useState('Cardiology');
  const [experienceYears, setExperienceYears] = useState('5');
  const [consultationFee, setConsultationFee] = useState('500');
  const [doctorHospital, setDoctorHospital] = useState('HealthSync Multispecialty Hospital');

  // Receptionist-specific fields
  const [receptionistHospital, setReceptionistHospital] = useState('HealthSync Central Hospital');
  const [employeeId, setEmployeeId] = useState('REC-8041');
  const [shift, setShift] = useState('MORNING');

  // Ambulance-specific fields
  const [vehicleNumber, setVehicleNumber] = useState('MH-12-EM-1080');
  const [licenseNumber, setLicenseNumber] = useState('DL-MH-2018-9482');
  const [ambulanceType, setAmbulanceType] = useState('ALS');
  const [ambulanceHospital, setAmbulanceHospital] = useState('HealthSync Trauma Care');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!fullName.trim() || !phone.trim() || !password.trim()) {
      setError('Please fill in your Full Name, Mobile Number, and Password.');
      return;
    }

    setLoading(true);

    try {
      let endpoint = '';
      let payload: any = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        password,
      };

      if (activeRole === 'PATIENT') {
        endpoint = '/api/v1/auth/patient/register';
        payload = {
          ...payload,
          bloodGroup,
          gender,
          dateOfBirth: dateOfBirth || undefined,
          emergencyContactName: emergencyContactName || undefined,
          emergencyContactPhone: emergencyContactPhone || undefined,
          allergies: allergies || undefined,
          address: address || undefined,
        };
      } else if (activeRole === 'DOCTOR') {
        endpoint = '/api/v1/auth/doctor/register';
        payload = {
          ...payload,
          registrationNumber: registrationNumber.trim() || 'MMC-2022-8491',
          specializations: [specialization],
          experienceYears: Number(experienceYears) || 3,
          consultationFee: Number(consultationFee) || 500,
          bio: `Dr. ${fullName} is a registered ${specialization} specialist at ${doctorHospital}.`,
        };
      } else if (activeRole === 'RECEPTIONIST') {
        endpoint = '/api/v1/auth/receptionist/register';
        payload = {
          ...payload,
          hospitalName: receptionistHospital,
          employeeId,
          shift,
        };
      } else if (activeRole === 'AMBULANCE') {
        endpoint = '/api/v1/auth/ambulance/register';
        payload = {
          ...payload,
          vehicleNumber: vehicleNumber.toUpperCase().trim(),
          licenseNumber,
          ambulanceType,
          hospitalName: ambulanceHospital,
        };
      }

      const res = await axios.post(endpoint, payload);
      if (res.data?.data?.token) {
        const { token, user } = res.data.data;
        useAuthStore.getState().setAuth(token, user);
        setSuccessMsg('Account registered successfully! Redirecting...');

        setTimeout(() => {
          if (activeRole === 'DOCTOR') navigate('/doctor/dashboard');
          else if (activeRole === 'RECEPTIONIST') navigate('/receptionist/dashboard');
          else if (activeRole === 'AMBULANCE') navigate('/ambulance/dashboard');
          else navigate('/patient/home');
        }, 1000);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem 1rem',
        background: 'radial-gradient(ellipse at top, #1E293B 0%, #0F172A 100%)',
      }}
    >
      <div style={{ maxWidth: '640px', width: '100%' }}>
        {/* Brand Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
            <Logo size="lg" />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: 900, color: '#FFFFFF' }}>
            HealthSync Healthcare Portal Registration
          </h1>
          <p style={{ margin: '0.375rem 0 0 0', fontSize: '0.875rem', color: '#94A3B8' }}>
            Zero-Trust Encrypted Registration for Patients, Doctors, Hospital Desks & Emergency Fleets
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.5rem',
            backgroundColor: '#1E293B',
            padding: '6px',
            borderRadius: '14px',
            marginBottom: '1.5rem',
            border: '1px solid #334155',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveRole('PATIENT')}
            style={{
              padding: '0.625rem 0.5rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: activeRole === 'PATIENT' ? '#0D9488' : 'transparent',
              color: activeRole === 'PATIENT' ? '#FFFFFF' : '#94A3B8',
              fontWeight: 800,
              fontSize: '0.75rem',
              transition: 'all 0.15s ease',
            }}
          >
            <User size={18} />
            <span>Patient</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRole('DOCTOR')}
            style={{
              padding: '0.625rem 0.5rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: activeRole === 'DOCTOR' ? '#2563EB' : 'transparent',
              color: activeRole === 'DOCTOR' ? '#FFFFFF' : '#94A3B8',
              fontWeight: 800,
              fontSize: '0.75rem',
              transition: 'all 0.15s ease',
            }}
          >
            <Stethoscope size={18} />
            <span>Doctor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRole('RECEPTIONIST')}
            style={{
              padding: '0.625rem 0.5rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: activeRole === 'RECEPTIONIST' ? '#7C3AED' : 'transparent',
              color: activeRole === 'RECEPTIONIST' ? '#FFFFFF' : '#94A3B8',
              fontWeight: 800,
              fontSize: '0.75rem',
              transition: 'all 0.15s ease',
            }}
          >
            <Building2 size={18} />
            <span>Receptionist</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRole('AMBULANCE')}
            style={{
              padding: '0.625rem 0.5rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: activeRole === 'AMBULANCE' ? '#DC2626' : 'transparent',
              color: activeRole === 'AMBULANCE' ? '#FFFFFF' : '#94A3B8',
              fontWeight: 800,
              fontSize: '0.75rem',
              transition: 'all 0.15s ease',
            }}
          >
            <Truck size={18} />
            <span>Ambulance</span>
          </button>
        </div>

        {/* Main Form Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}
        >
          {error && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#065F46',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.25rem',
              }}
            >
              <CheckCircle2 size={16} color="#059669" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 1. Universal Core Credentials */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder={activeRole === 'DOCTOR' ? 'e.g. Dr. Rajesh Kulkarni' : 'e.g. Ramesh Patil'}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6875rem 0.875rem',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Mobile Number *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '0.75rem', color: '#94A3B8' }} />
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6875rem 0.875rem 0.6875rem 2.25rem',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Account Password *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '0.75rem', color: '#94A3B8' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6875rem 2.25rem 0.6875rem 2.25rem',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94A3B8',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* ROLE A: PATIENT SPECIFIC FIELDS                                           */}
            {/* ========================================================================= */}
            {activeRole === 'PATIENT' && (
              <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.8125rem', fontWeight: 900, color: '#0D9488', textTransform: 'uppercase' }}>
                  🩺 Medical Profile & Emergency SOS Data
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', marginBottom: '3px' }}>
                      Blood Group
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                    >
                      <option value="O_POSITIVE">O+ (O Positive)</option>
                      <option value="O_NEGATIVE">O- (O Negative)</option>
                      <option value="A_POSITIVE">A+ (A Positive)</option>
                      <option value="A_NEGATIVE">A- (A Negative)</option>
                      <option value="B_POSITIVE">B+ (B Positive)</option>
                      <option value="B_NEGATIVE">B- (B Negative)</option>
                      <option value="AB_POSITIVE">AB+ (AB Positive)</option>
                      <option value="AB_NEGATIVE">AB- (AB Negative)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', marginBottom: '3px' }}>
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', marginBottom: '3px' }}>
                      Emergency Contact Person
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Alok Sharma (Father)"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', marginBottom: '3px' }}>
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="+919844411001"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', marginBottom: '3px' }}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', marginBottom: '3px' }}>
                      Home Address / City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Shivaji Nagar, Pune"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', marginBottom: '3px' }}>
                    Known Allergies / Chronic Illnesses
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, Asthma, Diabetes, Hypertension"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                  />
                </div>
              </div>
            )}


            {/* ========================================================================= */}
            {/* ROLE B: DOCTOR SPECIFIC FIELDS                                            */}
            {/* ========================================================================= */}
            {activeRole === 'DOCTOR' && (
              <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.8125rem', fontWeight: 900, color: '#2563EB', textTransform: 'uppercase' }}>
                  👨‍⚕️ Medical Registration & Clinical Credentials
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', marginBottom: '3px' }}>
                      Medical Council Reg. No. *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MMC-2018-9482"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', marginBottom: '3px' }}>
                      Specialization
                    </label>
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                    >
                      <option value="Cardiology">Cardiology</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Gastroenterology">Gastroenterology</option>
                      <option value="General Physician">General Physician</option>
                      <option value="Ophthalmology">Ophthalmology</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', marginBottom: '3px' }}>
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', marginBottom: '3px' }}>
                      Consultation Fee (₹)
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="50"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', marginBottom: '3px' }}>
                    Hospital / Clinic Affiliation
                  </label>
                  <input
                    type="text"
                    value={doctorHospital}
                    onChange={(e) => setDoctorHospital(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                  />
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ROLE C: RECEPTIONIST SPECIFIC FIELDS                                      */}
            {/* ========================================================================= */}
            {activeRole === 'RECEPTIONIST' && (
              <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.8125rem', fontWeight: 900, color: '#7C3AED', textTransform: 'uppercase' }}>
                  🏨 Hospital Reception Desk & Shift Assignment
                </h4>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', marginBottom: '3px' }}>
                    Assigned Hospital / Medical Center *
                  </label>
                  <input
                    type="text"
                    required
                    value={receptionistHospital}
                    onChange={(e) => setReceptionistHospital(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', marginBottom: '3px' }}>
                      Desk / Staff Employee ID
                    </label>
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', marginBottom: '3px' }}>
                      Operational Shift
                    </label>
                    <select
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                    >
                      <option value="MORNING">Morning Shift (8 AM – 4 PM)</option>
                      <option value="EVENING">Evening Shift (4 PM – 12 AM)</option>
                      <option value="NIGHT">Night Shift (12 AM – 8 AM)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ROLE D: AMBULANCE SPECIFIC FIELDS                                         */}
            {/* ========================================================================= */}
            {activeRole === 'AMBULANCE' && (
              <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.8125rem', fontWeight: 900, color: '#DC2626', textTransform: 'uppercase' }}>
                  🚑 Emergency Fleet & Pilot Registration
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', marginBottom: '3px' }}>
                      Ambulance Plate Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MH-12-EM-1080"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', fontWeight: 800 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', marginBottom: '3px' }}>
                      Commercial Driving License
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DL-MH-2018-9482"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', marginBottom: '3px' }}>
                      Life Support Classification
                    </label>
                    <select
                      value={ambulanceType}
                      onChange={(e) => setAmbulanceType(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                    >
                      <option value="ALS">ALS (Advanced Life Support / ICU)</option>
                      <option value="BLS">BLS (Basic Life Support / Oxygen)</option>
                      <option value="PATIENT_TRANSPORT">Patient Transport Van</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', marginBottom: '3px' }}>
                      Base Trauma Station
                    </label>
                    <input
                      type="text"
                      value={ambulanceHospital}
                      onChange={(e) => setAmbulanceHospital(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.875rem',
                borderRadius: '12px',
                border: 'none',
                backgroundColor:
                  activeRole === 'PATIENT'
                    ? '#0D9488'
                    : activeRole === 'DOCTOR'
                    ? '#2563EB'
                    : activeRole === 'RECEPTIONIST'
                    ? '#7C3AED'
                    : '#DC2626',
                color: '#FFFFFF',
                fontSize: '0.9375rem',
                fontWeight: 900,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                marginBottom: '1rem',
              }}
            >
              <span>{loading ? 'Creating Secure Account...' : `Register as ${activeRole}`}</span>
              <ArrowRight size={18} />
            </button>

            {/* Link to Login */}
            <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#64748B' }}>
              Already have a HealthSync account?{' '}
              <Link to="/login" style={{ color: '#2563EB', fontWeight: 800, textDecoration: 'none' }}>
                Sign In here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPortalPage;
