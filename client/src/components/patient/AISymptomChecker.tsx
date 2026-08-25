import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Search,
  Stethoscope,
  ArrowRight,
  Siren,
} from 'lucide-react';

interface TriageResult {
  isEmergency: boolean;
  recommendedSpecialty: string;
  conditionPossibilities: string[];
  urgencyLevel: 'EMERGENCY' | 'URGENT' | 'ROUTINE';
  clinicalAdvice: string;
  searchKeyword: string;
}

export const AISymptomChecker: React.FC = () => {
  const navigate = useNavigate();
  const [inputSymptoms, setInputSymptoms] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);

  const quickSymptoms = [
    'Chest Pain & Sweating',
    'High Fever with Shivering',
    'Severe Knee & Joint Pain',
    'Itchy Red Skin Rash',
    'Severe Headache & Nausea',
    'Child Cough & Wheezing',
    'Acid Reflux & Stomach Burn',
  ];

  const handleAnalyze = (symptomText?: string) => {
    const text = (symptomText || inputSymptoms).toLowerCase().trim();
    if (!text) return;

    setAnalyzing(true);
    setResult(null);

    setTimeout(() => {
      setAnalyzing(false);

      // Clinical Triage Rules
      if (
        text.includes('chest pain') ||
        text.includes('sweating') ||
        text.includes('left arm') ||
        text.includes('unconscious') ||
        text.includes('stroke') ||
        text.includes('breathless') ||
        text.includes('heavy bleeding')
      ) {
        setResult({
          isEmergency: true,
          recommendedSpecialty: 'Cardiology / Emergency Trauma',
          conditionPossibilities: ['Acute Coronary Syndrome', 'Myocardial Infarction', 'Cardiac Arrhythmia'],
          urgencyLevel: 'EMERGENCY',
          clinicalAdvice: 'Critical Red Flag: Potential cardiac emergency. Do not delay. Dispatch an Emergency SOS ambulance immediately or visit the nearest 24x7 hospital ER.',
          searchKeyword: 'Cardiology',
        });
      } else if (
        text.includes('knee') ||
        text.includes('joint') ||
        text.includes('bone') ||
        text.includes('fracture') ||
        text.includes('back pain') ||
        text.includes('sprain')
      ) {
        setResult({
          isEmergency: false,
          recommendedSpecialty: 'Orthopedics',
          conditionPossibilities: ['Osteoarthritis', 'Ligament Strain', 'Lumbar Spondylosis'],
          urgencyLevel: 'ROUTINE',
          clinicalAdvice: 'Symptoms point to musculoskeletal inflammation or joint wear. An orthopedic physical exam and digital X-Ray are advised.',
          searchKeyword: 'Orthopedics',
        });
      } else if (
        text.includes('child') ||
        text.includes('baby') ||
        text.includes('infant') ||
        text.includes('pediatric') ||
        text.includes('vaccin')
      ) {
        setResult({
          isEmergency: false,
          recommendedSpecialty: 'Pediatrics',
          conditionPossibilities: ['Pediatric Viral Infection', 'Childhood Bronchitis', 'Growth Check'],
          urgencyLevel: 'ROUTINE',
          clinicalAdvice: 'Consult a qualified pediatrician for infant vitals assessment, pediatric dosing, and immunization reviews.',
          searchKeyword: 'Pediatrics',
        });
      } else if (
        text.includes('skin') ||
        text.includes('rash') ||
        text.includes('itch') ||
        text.includes('acne') ||
        text.includes('hair') ||
        text.includes('allergy')
      ) {
        setResult({
          isEmergency: false,
          recommendedSpecialty: 'Dermatology',
          conditionPossibilities: ['Allergic Contact Dermatitis', 'Eczema Flare-up', 'Fungal Infection'],
          urgencyLevel: 'ROUTINE',
          clinicalAdvice: 'Avoid topical steroid self-medication. A dermatologist evaluation will pinpoint the exact allergic or fungal etiology.',
          searchKeyword: 'Dermatology',
        });
      } else if (
        text.includes('stomach') ||
        text.includes('acid') ||
        text.includes('reflux') ||
        text.includes('vomit') ||
        text.includes('liver') ||
        text.includes('diarrhea')
      ) {
        setResult({
          isEmergency: false,
          recommendedSpecialty: 'Gastroenterology',
          conditionPossibilities: ['GERD (Gastroesophageal Reflux)', 'Acute Gastritis', 'Irritable Bowel'],
          urgencyLevel: 'ROUTINE',
          clinicalAdvice: 'Maintain light hydration and avoid spicy meals. A gastroenterology consultation is recommended for gastrointestinal evaluation.',
          searchKeyword: 'Gastroenterology',
        });
      } else if (
        text.includes('headache') ||
        text.includes('migraine') ||
        text.includes('dizzy') ||
        text.includes('seizure') ||
        text.includes('numbness')
      ) {
        setResult({
          isEmergency: false,
          recommendedSpecialty: 'Neurology',
          conditionPossibilities: ['Migraine with Aura', 'Tension Headache', 'Cervical Radiculopathy'],
          urgencyLevel: 'URGENT',
          clinicalAdvice: 'Neurological evaluation recommended if headaches are recurrent or associated with visual auras, nausea, or localized tingling.',
          searchKeyword: 'Neurology',
        });
      } else {
        setResult({
          isEmergency: false,
          recommendedSpecialty: 'General Medicine / Internal Medicine',
          conditionPossibilities: ['Viral Febrile Illness', 'Upper Respiratory Tract Infection', 'General Malaise'],
          urgencyLevel: 'ROUTINE',
          clinicalAdvice: 'General physical examination by a physician will help assess vitals, prescribe appropriate medications, and order baseline blood work.',
          searchKeyword: 'General Medicine',
        });
      }
    }, 900);
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '1.5rem',
        marginBottom: '1.75rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        background: 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 60%, #EFF6FF 100%)',
      }}
    >
      {/* Banner Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#0D9488',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(13, 148, 136, 0.3)',
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#0F172A' }}>
                AI Clinical Symptom Triage
              </h3>
              <span
                style={{
                  backgroundColor: '#DCFCE7',
                  color: '#16A34A',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid #BBF7D0',
                }}
              >
                SMART TRIAGE
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748B' }}>
              Describe your symptoms naturally to get instant specialty recommendations and matched doctors.
            </p>
          </div>
        </div>
      </div>

      {/* Input Search Form */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="e.g. Sharp pain in lower back after lifting weights, fever with shivering..."
            value={inputSymptoms}
            onChange={(e) => setInputSymptoms(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAnalyze();
            }}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.625rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '10px',
              fontSize: '0.875rem',
              color: '#0F172A',
              outline: 'none',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => handleAnalyze()}
          disabled={analyzing || !inputSymptoms.trim()}
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: '#0D9488',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: analyzing || !inputSymptoms.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
          }}
        >
          <Sparkles size={16} />
          <span>{analyzing ? 'Analyzing...' : 'Analyze'}</span>
        </button>
      </div>

      {/* Quick Clickable Symptom Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', marginRight: '4px' }}>
          Popular Symptoms:
        </span>
        {quickSymptoms.map((qs) => (
          <button
            key={qs}
            type="button"
            onClick={() => {
              setInputSymptoms(qs);
              handleAnalyze(qs);
            }}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '9999px',
              padding: '3px 10px',
              fontSize: '0.75rem',
              color: '#475569',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.15s ease',
            }}
          >
            {qs}
          </button>
        ))}
      </div>

      {/* TRIAGE RESULTS PANEL */}
      {result && (
        <div
          style={{
            marginTop: '1.25rem',
            backgroundColor: result.isEmergency ? '#FEF2F2' : '#F8FAFC',
            border: `1px solid ${result.isEmergency ? '#FECACA' : '#BFDBFE'}`,
            borderRadius: '12px',
            padding: '1.25rem',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {result.isEmergency ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#DC2626', fontWeight: 800, fontSize: '1rem', marginBottom: '0.5rem' }}>
                <Siren size={22} className="animate-pulse" />
                <span>EMERGENCY ALERT: IMMEDIATE ACTION REQUIRED</span>
              </div>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#991B1B' }}>
                {result.clinicalAdvice}
              </p>
              <button
                type="button"
                onClick={() => {
                  const sosBtn = document.querySelector('[data-sos-button]') as HTMLElement;
                  if (sosBtn) sosBtn.click();
                  else navigate('/patient/home');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.625rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
                }}
              >
                <Siren size={16} />
                <span>ACTIVATE EMERGENCY SOS DISPATCH NOW</span>
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Stethoscope size={20} color="#1A56DB" />
                  <div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#1E40AF' }}>RECOMMENDED MEDICAL SPECIALTY</span>
                    <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#0F172A' }}>
                      {result.recommendedSpecialty}
                    </h4>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/patient/doctors?specialization=${encodeURIComponent(result.searchKeyword)}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#1A56DB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(26, 86, 219, 0.25)',
                  }}
                >
                  <span>View Matched Doctors</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              <div style={{ fontSize: '0.8125rem', color: '#475569', marginBottom: '0.625rem' }}>
                {result.clinicalAdvice}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 700 }}>Clinical Indications:</span>
                {result.conditionPossibilities.map((c, i) => (
                  <span key={i} style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AISymptomChecker;
