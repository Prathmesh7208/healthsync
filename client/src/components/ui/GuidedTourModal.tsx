import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Siren,
  Stethoscope,
  Users,
  Truck,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle,
  Play,
} from 'lucide-react';

import useAuthStore from '../../stores/authStore';

interface GuidedTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidedTourModal: React.FC<GuidedTourModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  if (!isOpen) return null;

  const tourSteps = [
    {
      title: 'Welcome to HealthSync Ecosystem',
      subtitle: 'Next-Generation Healthcare Access, Hospital Coordination & Emergency Response',
      icon: <Sparkles size={28} color="#0D9488" />,
      color: '#0D9488',
      bg: '#F0FDFA',
      description:
        'HealthSync unifies patients, hospitals, doctors, and ambulance fleets into a synchronized real-time network with zero-latency dispatch and end-to-end clinical workflow.',
      highlights: [
        '⚡ 0-second instant emergency SOS with live Google Maps radar',
        '🩺 Doctor clinical notes with AI ICD-10 diagnostic assistant',
        '📋 Smart OPD token dispenser with voice announcements',
        '🔒 ABHA / Ayushman Bharat digital health records standard',
      ],
      roleTarget: null,
    },
    {
      title: 'Role 1: Emergency Patient & SOS',
      subtitle: 'Life-saving telemetry & instant doctor booking',
      icon: <Siren size={28} color="#DC2626" />,
      color: '#DC2626',
      bg: '#FEF2F2',
      description:
        'Patients can trigger 1-tap emergency dispatch, track approaching ambulances with live turn-by-turn road geometry, consult with specialists, and manage health records.',
      highlights: [
        'Live Google Maps ambulance tracking with vehicle license number',
        'Paramedic HUD with blood group and allergy sync',
        'Instant multi-contact failover broadcast via WhatsApp & SMS',
      ],
      roleTarget: {
        role: 'PATIENT',
        email: 'patient.demo@healthsync.com',
        name: 'Rahul Sharma',
        path: '/patient/home',
      },
    },
    {
      title: 'Role 2: Doctor Clinical Console',
      subtitle: 'Telemedicine, smart prescriptions & AI triage',
      icon: <Stethoscope size={28} color="#1D4ED8" />,
      color: '#1D4ED8',
      bg: '#EFF6FF',
      description:
        'Doctors manage live OPD queues, conduct encrypted WebRTC video consultations, write digital prescriptions with auto-ICD-10 codes, and review patient medical histories.',
      highlights: [
        '1-Click WebRTC live video consultation room',
        'Auto-generated printable prescription PDFs with MCI registration',
        'AI-assisted clinical differential diagnosis',
      ],
      roleTarget: {
        role: 'DOCTOR',
        email: 'doctor.demo@healthsync.com',
        name: 'Dr. Priya Sharma',
        path: '/doctor/dashboard',
      },
    },
    {
      title: 'Role 3: Receptionist & OPD Queue Desk',
      subtitle: 'Smart hospital triage & token management',
      icon: <Users size={28} color="#D97706" />,
      color: '#D97706',
      bg: '#FFFBEB',
      description:
        'Reception staff allocate hospital beds, issue smart OPD queue tokens, make automated voice announcements for waiting patients, and coordinate admissions.',
      highlights: [
        'Automated SpeechSynthesis audio token calling',
        'Emergency walk-in triage & ER bed assignment',
        'Doctor OPD schedule management',
      ],
      roleTarget: {
        role: 'RECEPTIONIST',
        email: 'receptionist.demo@healthsync.com',
        name: 'Sunita Patel',
        path: '/receptionist/queue',
      },
    },
    {
      title: 'Role 4: Ambulance Emergency Cockpit',
      subtitle: 'Turn-by-turn navigation & ER pre-alert',
      icon: <Truck size={28} color="#16A34A" />,
      color: '#16A34A',
      bg: '#F0FDF4',
      description:
        'Paramedic pilots receive instant dispatch alerts, stream live GPS telemetry back to patients, and notify ER trauma rooms with arrival countdowns.',
      highlights: [
        'Real-time GPS dispatch with road-following routing',
        'Live patient vital signs & allergy pre-alert',
        'Direct hospital ER trauma bay handoff',
      ],
      roleTarget: {
        role: 'AMBULANCE',
        email: 'ambulance.demo@healthsync.com',
        name: 'Rajesh Gawande (ALS-1080)',
        path: '/ambulance/dashboard',
      },
    },
  ];

  const step = tourSteps[currentStep];

  const handleLaunchRole = (target: any) => {
    if (target) {
      setAuth(
        `demo-jwt-token-${target.role.toLowerCase()}`,
        {
          id: `demo-${target.role.toLowerCase()}-1`,
          phone: '+919844400000',
          role: target.role,
          languagePreference: 'en',
          profile: { id: `prof-${target.role.toLowerCase()}-1`, fullName: target.name },
        } as any
      );
      onClose();
      navigate(target.path);
    }
  };


  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E2E8F0',
          width: '100%',
          maxWidth: '560px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        {/* Header Strip with Progress Bar */}
        <div style={{ backgroundColor: step.bg, padding: '1.25rem 1.5rem', borderBottom: `2px solid ${step.color}22` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: `1.5px solid ${step.color}44`,
                }}
              >
                {step.icon}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 900, color: '#0F172A' }}>{step.title}</h3>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{step.subtitle}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Stepper Dots */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {tourSteps.map((_, i) => (
              <div
                key={i}
                onClick={() => setCurrentStep(i)}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '999px',
                  backgroundColor: i === currentStep ? step.color : '#CBD5E1',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem' }}>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
            {step.description}
          </p>

          <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '0.875rem 1rem', border: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Key Capabilities
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {step.highlights.map((h, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#0F172A', fontWeight: 600 }}>
                  <CheckCircle size={15} color={step.color} />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Launch Action Button for Current Role */}
          {step.roleTarget && (
            <div style={{ marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => handleLaunchRole(step.roleTarget)}
                style={{
                  width: '100%',
                  backgroundColor: step.color,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: `0 4px 12px ${step.color}44`,
                }}
              >
                <Play size={16} />
                <span>Launch & Test as {step.roleTarget.name}</span>
              </button>
            </div>
          )}

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                backgroundColor: '#F1F5F9',
                color: currentStep === 0 ? '#CBD5E1' : '#475569',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 0.875rem',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <ArrowLeft size={15} />
              <span>Previous</span>
            </button>

            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>
              {currentStep + 1} of {tourSteps.length}
            </span>

            {currentStep < tourSteps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => Math.min(tourSteps.length - 1, s + 1))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                <span>Next</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  backgroundColor: '#0D9488',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                <span>Finish Tour</span>
                <CheckCircle size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidedTourModal;
