import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [inputSymptoms, setInputSymptoms] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);

  const quickSymptoms = [
    { key: 'chestPain', label: t('triage.symptoms.chestPain'), query: 'chest pain' },
    { key: 'fever', label: t('triage.symptoms.fever'), query: 'high fever shivering' },
    { key: 'jointPain', label: t('triage.symptoms.jointPain'), query: 'knee joint pain' },
    { key: 'skinRash', label: t('triage.symptoms.skinRash'), query: 'itchy skin rash' },
    { key: 'headache', label: t('triage.symptoms.headache'), query: 'severe headache nausea' },
    { key: 'cough', label: t('triage.symptoms.cough'), query: 'child cough wheezing' },
    { key: 'acidReflux', label: t('triage.symptoms.acidReflux'), query: 'acid reflux stomach' },
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
        text.includes('chest') ||
        text.includes('छाती') ||
        text.includes('sweat') ||
        text.includes('घाम') ||
        text.includes('पसीना') ||
        text.includes('unconscious') ||
        text.includes('stroke') ||
        text.includes('breathless') ||
        text.includes('bleeding')
      ) {
        setResult({
          isEmergency: true,
          recommendedSpecialty: 'Cardiology / Emergency Trauma',
          conditionPossibilities: ['Acute Coronary Syndrome', 'Myocardial Infarction', 'Cardiac Arrhythmia'],
          urgencyLevel: 'EMERGENCY',
          clinicalAdvice: t('triage.result.emergencyAlert'),
          searchKeyword: 'Cardiology',
        });
      } else if (
        text.includes('knee') ||
        text.includes('joint') ||
        text.includes('bone') ||
        text.includes('fracture') ||
        text.includes('back') ||
        text.includes('गुडघे') ||
        text.includes('सांधे') ||
        text.includes('घुटने')
      ) {
        setResult({
          isEmergency: false,
          recommendedSpecialty: 'Orthopedics',
          conditionPossibilities: ['Osteoarthritis', 'Ligament Strain', 'Lumbar Spondylosis'],
          urgencyLevel: 'ROUTINE',
          clinicalAdvice: t('triage.result.routineAlert'),
          searchKeyword: 'Orthopedics',
        });
      } else if (
        text.includes('child') ||
        text.includes('baby') ||
        text.includes('infant') ||
        text.includes('pediatric') ||
        text.includes('लहान') ||
        text.includes('बाळ') ||
        text.includes('बच्चे')
      ) {
        setResult({
          isEmergency: false,
          recommendedSpecialty: 'Pediatrics',
          conditionPossibilities: ['Pediatric Viral Infection', 'Childhood Bronchitis', 'Growth Check'],
          urgencyLevel: 'ROUTINE',
          clinicalAdvice: t('triage.result.routineAlert'),
          searchKeyword: 'Pediatrics',
        });
      } else if (
        text.includes('skin') ||
        text.includes('rash') ||
        text.includes('itch') ||
        text.includes('acne') ||
        text.includes('त्वचा') ||
        text.includes('पुरळ') ||
        text.includes('खाज') ||
        text.includes('खुजली')
      ) {
        setResult({
          isEmergency: false,
          recommendedSpecialty: 'Dermatology',
          conditionPossibilities: ['Allergic Contact Dermatitis', 'Eczema Flare-up', 'Fungal Infection'],
          urgencyLevel: 'ROUTINE',
          clinicalAdvice: t('triage.result.routineAlert'),
          searchKeyword: 'Dermatology',
        });
      } else if (
        text.includes('stomach') ||
        text.includes('acid') ||
        text.includes('reflux') ||
        text.includes('vomit') ||
        text.includes('पोट') ||
        text.includes('जळजळ') ||
        text.includes('एसिडिटी') ||
        text.includes('पेट')
      ) {
        setResult({
          isEmergency: false,
          recommendedSpecialty: 'Gastroenterology',
          conditionPossibilities: ['GERD (Acid Reflux)', 'Acute Gastritis', 'Dyspepsia'],
          urgencyLevel: 'ROUTINE',
          clinicalAdvice: t('triage.result.routineAlert'),
          searchKeyword: 'Gastroenterology',
        });
      } else if (
        text.includes('eye') ||
        text.includes('vision') ||
        text.includes('blind') ||
        text.includes('डोळे') ||
        text.includes('आँख')
      ) {
        setResult({
          isEmergency: false,
          recommendedSpecialty: 'Ophthalmology',
          conditionPossibilities: ['Conjunctivitis', 'Refractive Error', 'Dry Eye Syndrome'],
          urgencyLevel: 'ROUTINE',
          clinicalAdvice: t('triage.result.routineAlert'),
          searchKeyword: 'Ophthalmology',
        });
      } else if (
        text.includes('headache') ||
        text.includes('migraine') ||
        text.includes('dizzy') ||
        text.includes('डोकेदुखी') ||
        text.includes('सिरदर्द')
      ) {
        setResult({
          isEmergency: false,
          recommendedSpecialty: 'Neurology',
          conditionPossibilities: ['Tension Headache', 'Migraine with Aura', 'Cervicogenic Headache'],
          urgencyLevel: 'URGENT',
          clinicalAdvice: t('triage.result.urgentAlert'),
          searchKeyword: 'Neurology',
        });
      } else {
        setResult({
          isEmergency: false,
          recommendedSpecialty: 'General Physician',
          conditionPossibilities: ['Viral Syndrome', 'General Fatigue', 'Routine Checkup Required'],
          urgencyLevel: 'ROUTINE',
          clinicalAdvice: t('triage.result.routineAlert'),
          searchKeyword: 'General Physician',
        });
      }
    }, 600);
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #CCFBF1',
        borderRadius: '16px',
        padding: '1.25rem',
        marginBottom: '1.75rem',
        background: 'linear-gradient(135deg, #F0FDFA 0%, #FFFFFF 50%, #EFF6FF 100%)',
        boxShadow: '0 4px 14px rgba(13, 148, 136, 0.08)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                {t('triage.title')}
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
                {t('triage.badge')}
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748B' }}>
              {t('triage.subtitle')}
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
            placeholder={t('triage.placeholder')}
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
          <span>{analyzing ? t('triage.analyzing') : t('triage.analyze')}</span>
        </button>
      </div>

      {/* Quick Clickable Symptom Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', marginRight: '4px' }}>
          {t('triage.popularSymptoms')}
        </span>
        {quickSymptoms.map((qs) => (
          <button
            key={qs.key}
            type="button"
            onClick={() => {
              setInputSymptoms(qs.label);
              handleAnalyze(qs.query);
            }}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '9999px',
              padding: '3px 10px',
              fontSize: '0.75rem',
              color: '#475569',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            {qs.label}
          </button>
        ))}
      </div>

      {/* AI Triage Analysis Result Card */}
      {result && (
        <div
          style={{
            marginTop: '1.25rem',
            backgroundColor: result.isEmergency ? '#FEF2F2' : '#FFFFFF',
            border: `1.5px solid ${result.isEmergency ? '#FECACA' : '#99F6E4'}`,
            borderRadius: '14px',
            padding: '1.25rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            animation: 'fadeIn 0.25s ease-in-out',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: result.isEmergency ? '#DC2626' : '#0D9488',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {result.isEmergency ? <Siren size={18} /> : <Stethoscope size={18} />}
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: result.isEmergency ? '#DC2626' : '#0D9488' }}>
                  {t('triage.result.recommendedSpecialty').toUpperCase()}
                </span>
                <h4 style={{ margin: '1px 0', fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                  {result.recommendedSpecialty}
                </h4>
              </div>
            </div>

            <span
              style={{
                backgroundColor: result.isEmergency ? '#FEE2E2' : result.urgencyLevel === 'URGENT' ? '#FEF3C7' : '#DCFCE7',
                color: result.isEmergency ? '#991B1B' : result.urgencyLevel === 'URGENT' ? '#92400E' : '#166534',
                padding: '3px 10px',
                borderRadius: '9999px',
                fontSize: '0.6875rem',
                fontWeight: 800,
                border: `1px solid ${result.isEmergency ? '#FECACA' : result.urgencyLevel === 'URGENT' ? '#FDE68A' : '#BBF7D0'}`,
              }}
            >
              {result.urgencyLevel}
            </span>
          </div>

          <p style={{ margin: '0 0 0.875rem 0', fontSize: '0.8125rem', color: '#334155', lineHeight: 1.45 }}>
            {result.clinicalAdvice}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B' }}>
              {t('triage.result.differentialDiagnosis')}:
            </span>
            {result.conditionPossibilities.map((cp) => (
              <span
                key={cp}
                style={{
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                }}
              >
                {cp}
              </span>
            ))}
          </div>

          {/* Action Callouts */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {result.isEmergency ? (
              <button
                type="button"
                onClick={() => navigate('/patient/emergency')}
                style={{
                  flex: 1,
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.625rem 1rem',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                }}
              >
                <Siren size={16} />
                <span>{t('triage.result.callAmbulanceBtn')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(`/patient/doctors?specialization=${encodeURIComponent(result.searchKeyword)}`)}
                style={{
                  flex: 1,
                  backgroundColor: '#0D9488',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.625rem 1rem',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem',
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
                }}
              >
                <Stethoscope size={16} />
                <span>{t('triage.result.bookDoctorBtn')}</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AISymptomChecker;
