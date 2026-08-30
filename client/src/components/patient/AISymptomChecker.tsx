import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Search,
  Stethoscope,
  ArrowRight,
  Siren,
  HeartPulse,
  Phone,
  ShieldAlert,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface TriageResult {
  isEmergency: boolean;
  recommendedSpecialty: string;
  conditionPossibilities: string[];
  urgencyLevel: 'EMERGENCY' | 'URGENT' | 'ROUTINE';
  clinicalAdvice: string;
  searchKeyword: string;
  emergencyFirstAid?: {
    immediateActions: string[];
    doNotDo: string[];
    patientPosition: string;
    warningSigns: string[];
  };
}

export const AISymptomChecker: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [inputSymptoms, setInputSymptoms] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);

  const quickSymptoms = [
    { key: 'chestPain', label: t('triage.symptoms.chestPain'), query: 'chest pain sweating' },
    { key: 'fever', label: t('triage.symptoms.fever'), query: 'high fever shivering' },
    { key: 'jointPain', label: t('triage.symptoms.jointPain'), query: 'knee joint pain swelling' },
    { key: 'skinRash', label: t('triage.symptoms.skinRash'), query: 'itchy skin rash allergy' },
    { key: 'headache', label: t('triage.symptoms.headache'), query: 'severe headache dizziness' },
    { key: 'cough', label: t('triage.symptoms.cough'), query: 'child cough wheezing breathing' },
    { key: 'acidReflux', label: t('triage.symptoms.acidReflux'), query: 'acid reflux stomach burning' },
  ];

  const handleAnalyze = (symptomText?: string) => {
    const text = (symptomText || inputSymptoms).toLowerCase().trim();
    if (!text) return;

    setAnalyzing(true);
    setResult(null);

    setTimeout(() => {
      setAnalyzing(false);

      // =========================================================================
      // 1. CARDIAC & CHEST EMERGENCIES
      // =========================================================================
      if (
        text.includes('chest') ||
        text.includes('छाती') ||
        text.includes('sweat') ||
        text.includes('घाम') ||
        text.includes('पसीना') ||
        text.includes('heart') ||
        text.includes('हार्ट') ||
        text.includes('ह्रदय') ||
        text.includes('jaw pain') ||
        text.includes('left arm')
      ) {
        setResult({
          isEmergency: true,
          recommendedSpecialty: 'Cardiology / Emergency ICU',
          conditionPossibilities: ['Acute Coronary Syndrome (Heart Attack)', 'Angina Pectoris', 'Aortic Dissection', 'Severe Arrhythmia'],
          urgencyLevel: 'EMERGENCY',
          clinicalAdvice: 'CRITICAL CARDIAC EMERGENCY: Requires immediate emergency medical dispatch and hospital trauma evaluation. Do not delay.',
          searchKeyword: 'Cardiology',
          emergencyFirstAid: {
            patientPosition: 'Comfortable seated 45° "W" position with back and knees supported. Do NOT allow patient to walk.',
            immediateActions: [
              'Loosen all tight clothing, collars, belts, and neckties immediately.',
              'Ensure the room is calm, quiet, and well-ventilated with fresh airflow.',
              'If the patient has prescribed Sorbitrate (5mg) or Aspirin (300mg chewable) without bleeding disorders/allergies, administer under doctor’s prior guidance.',
              'Monitor breathing continuously. If patient collapses and becomes unresponsive with no pulse, begin CPR (100–120 chest compressions/min) immediately.',
            ],
            doNotDo: [
              'Do NOT allow the patient to walk, exert themselves, or drive.',
              'Do NOT give heavy food, hot tea, or cold water.',
              'Do NOT ignore symptoms assuming it is just gas or acidity.',
            ],
            warningSigns: ['Crushing chest pressure radiating to jaw, neck, or left arm', 'Cold clammy sweats with sudden shortness of breath', 'Dizziness, nausea, or loss of consciousness'],
          },
        });
      }

      // =========================================================================
      // 2. STROKE & NEUROLOGICAL EMERGENCIES (F.A.S.T.)
      // =========================================================================
      else if (
        text.includes('stroke') ||
        text.includes('paralysis') ||
        text.includes('slurred') ||
        text.includes('speech') ||
        text.includes('face droop') ||
        text.includes('लकवा') ||
        text.includes('पक्षाघात') ||
        text.includes('बोलता येत नाही') ||
        text.includes('faint') ||
        text.includes('unconscious') ||
        text.includes('seizure') ||
        text.includes('fit') ||
        text.includes('झटके') ||
        text.includes('आंचके')
      ) {
        setResult({
          isEmergency: true,
          recommendedSpecialty: 'Neurology / Stroke Care',
          conditionPossibilities: ['Acute Ischemic Stroke', 'Hemorrhagic Stroke', 'Transient Ischemic Attack (TIA)', 'Epileptic Seizure'],
          urgencyLevel: 'EMERGENCY',
          clinicalAdvice: 'CRITICAL STROKE / NEUROLOGICAL ALERT: Golden hour treatment within 3–4.5 hours is vital for complete brain recovery.',
          searchKeyword: 'Neurology',
          emergencyFirstAid: {
            patientPosition: 'Recovery Position on their side with head slightly elevated to keep airway open and prevent choking.',
            immediateActions: [
              'Note down the EXACT time when symptoms first started (critical for clot-busting medications).',
              'Check F.A.S.T: Face drooping, Arm weakness, Speech difficulty, Time to call SOS.',
              'If patient has a seizure: Move sharp objects away, cushion their head with a folded cloth, and gently turn them onto their side once jerking stops.',
              'Keep the patient calm and reassure them with quiet voice.',
            ],
            doNotDo: [
              'Do NOT put anything (spoons, fingers, keys) into the patient’s mouth during a seizure.',
              'Do NOT give water, food, or blood pressure medicines orally while swallowing is impaired.',
              'Do NOT hold down or forcefully restrain a convulsing patient.',
            ],
            warningSigns: ['Sudden numbness/weakness in face, arm, or leg (especially one side of body)', 'Sudden confusion, trouble speaking or understanding', 'Sudden loss of vision or severe explosive headache'],
          },
        });
      }

      // =========================================================================
      // 3. SEVERE RESPIRATORY / BREATHLESSNESS / CHOKING
      // =========================================================================
      else if (
        text.includes('breathless') ||
        text.includes('choking') ||
        text.includes('asthma') ||
        text.includes('suffocat') ||
        text.includes('wheezing') ||
        text.includes('दम') ||
        text.includes('श्वास') ||
        text.includes('सांस फूलना') ||
        text.includes('घशात अडकले')
      ) {
        setResult({
          isEmergency: true,
          recommendedSpecialty: 'Pulmonology / Critical Care',
          conditionPossibilities: ['Acute Bronchospasm (Severe Asthma)', 'Anaphylaxis / Allergic Airway Constriction', 'Foreign Body Airway Obstruction (Choking)', 'Pulmonary Edema'],
          urgencyLevel: 'EMERGENCY',
          clinicalAdvice: 'ACUTE RESPIRATORY DISTRESS: Airway compromise requires urgent oxygenation and clinical stabilization.',
          searchKeyword: 'Pulmonology',
          emergencyFirstAid: {
            patientPosition: 'Upright sitting position leaning slightly forward with arms resting on knees or table (Tripod position).',
            immediateActions: [
              'If choking and conscious: Give 5 sharp back blows between shoulder blades, followed by 5 abdominal thrusts (Heimlich Maneuver).',
              'If known asthmatic: Immediately administer rescue inhaler (Salbutamol 2–4 puffs via spacer every 2–5 minutes up to 10 puffs).',
              'Open windows to maximize fresh cross-ventilation and keep crowd away.',
              'Encourage slow, pursed-lip breathing (breathe in through nose for 2 counts, out through pursed lips for 4 counts).',
            ],
            doNotDo: [
              'Do NOT make the patient lie flat on their back (worsens breathing effort).',
              'Do NOT force patient to drink water if breathing is labored.',
              'Do NOT spray strong perfumes, air fresheners, or create smoke near patient.',
            ],
            warningSigns: ['Bluish or pale lips, fingernails, or tongue (Cyanosis)', 'Inability to speak full sentences without gasping for breath', 'Stridor or high-pitched squeaking sound during inhalation'],
          },
        });
      }

      // =========================================================================
      // 4. ACTIVE BLEEDING / SEVERE TRAUMA / BURNS
      // =========================================================================
      else if (
        text.includes('bleeding') ||
        text.includes('blood') ||
        text.includes('cut') ||
        text.includes('burn') ||
        text.includes('wound') ||
        text.includes('रक्तस्त्राव') ||
        text.includes('खून') ||
        text.includes('जळणे') ||
        text.includes('जलना') ||
        text.includes('घाव')
      ) {
        setResult({
          isEmergency: true,
          recommendedSpecialty: 'Trauma & General Surgery',
          conditionPossibilities: ['Arterial / Venous Hemorrhage', 'Deep Laceration', 'Thermal / Chemical Burn Injury', 'Hypovolemic Shock Risk'],
          urgencyLevel: 'EMERGENCY',
          clinicalAdvice: 'TRAUMA & HEMORRHAGE PROTOCOL: Immediate pressure hemostasis and wound protection needed.',
          searchKeyword: 'General Physician',
          emergencyFirstAid: {
            patientPosition: 'Patient lying down with bleeding limb elevated above heart level (unless fractured). For burns: keep burned area elevated.',
            immediateActions: [
              'For Bleeding: Apply firm, continuous direct pressure with a clean, sterile cloth or pad for 10–15 full minutes without lifting to check.',
              'For Burns: Immediately cool burn under gentle running tap water for 20 minutes. Cover loosely with sterile plastic cling film or clean dry cloth.',
              'Keep the patient warm with a blanket to prevent hypothermia and trauma shock.',
              'If bleeding soaks through cloth, do NOT remove it—place another cloth directly on top and press harder.',
            ],
            doNotDo: [
              'Do NOT apply ice, butter, oil, toothpaste, or turmeric powder on burn wounds.',
              'Do NOT remove deeply embedded objects (knives, glass) from wounds—bandage around them.',
              'Do NOT burst burn blisters (protects against severe infection).',
            ],
            warningSigns: ['Pulsing or spurting bright red blood', 'Rapid shallow breathing, pale cold skin, confusion (Shock)', 'Burns larger than the patient’s palm or involving face, joints, or groin'],
          },
        });
      }

      // =========================================================================
      // 5. ORTHOPEDIC / BONE & JOINT
      // =========================================================================
      else if (
        text.includes('knee') ||
        text.includes('joint') ||
        text.includes('bone') ||
        text.includes('fracture') ||
        text.includes('sprain') ||
        text.includes('back') ||
        text.includes('गुडघे') ||
        text.includes('सांधे') ||
        text.includes('घुटने') ||
        text.includes('हाड') ||
        text.includes('कमर')
      ) {
        setResult({
          isEmergency: false,
          recommendedSpecialty: 'Orthopedics',
          conditionPossibilities: ['Ligament Sprain / Meniscal Tear', 'Osteoarthritis Flare', 'Bone Fracture / Hairline Crack', 'Lumbar Radiculopathy'],
          urgencyLevel: 'URGENT',
          clinicalAdvice: 'ORTHOPEDIC EVALUATION RECOMMENDED: Follow R.I.C.E. protocol and obtain X-Ray / clinical assessment.',
          searchKeyword: 'Orthopedics',
          emergencyFirstAid: {
            patientPosition: 'Immobilize injured limb in the most comfortable supported position.',
            immediateActions: [
              'R.I.C.E Protocol: Rest injured limb completely; Ice wrapped in towel for 15 mins every 2 hours; Compress with crepe bandage; Elevate above heart.',
              'Immobilize possible fracture using a rolled newspaper or cardboard splint padded with soft cloth.',
              'Apply cold compress to reduce acute swelling and localized inflammation.',
            ],
            doNotDo: [
              'Do NOT try to push back or straighten a visibly crooked bone or joint.',
              'Do NOT bear weight or walk on suspected ankle/knee fracture.',
              'Do NOT apply direct hot water fermentation in the first 48 hours of acute injury.',
            ],
            warningSigns: ['Visible deformity or bone piercing skin', 'Numbness, tingling, or cold pale toes/fingers below the injury', 'Inability to bear any weight with severe excruciating pain'],
          },
        });
      }

      // =========================================================================
      // 6. PEDIATRIC / CHILD HEALTH
      // =========================================================================
      else if (
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
          conditionPossibilities: ['Pediatric Viral Infection', 'Childhood Bronchitis', 'Dehydration / Gastroenteritis', 'Allergic Cough'],
          urgencyLevel: 'ROUTINE',
          clinicalAdvice: 'PEDIATRIC CLINICAL ASSESSMENT: Consult verified pediatrician for age-adjusted pediatric dosages.',
          searchKeyword: 'Pediatrics',
          emergencyFirstAid: {
            patientPosition: 'Hold infant/child upright or on their side to prevent choking and encourage relaxed breathing.',
            immediateActions: [
              'For high fever (>101°F): Strip down to light cotton clothes and sponge body with lukewarm (not cold) water for 15 minutes.',
              'Offer frequent sips of Oral Rehydration Solution (ORS), coconut water, or breastmilk to prevent rapid pediatric dehydration.',
              'Monitor wet diapers (minimum 4-6 wet diapers per 24 hours).',
            ],
            doNotDo: [
              'Do NOT give adult medications or Aspirin to children (risk of Reye’s syndrome).',
              'Do NOT wrap a feverish child in heavy blankets or woolen sweaters.',
              'Do NOT use ice cold water or alcohol rubs for sponging.',
            ],
            warningSigns: ['Inconsolable high-pitched crying or extreme lethargy (difficult to wake up)', 'Sunken soft spot (fontanelle) on baby’s head or no tears when crying', 'Rapid belly breathing with chest sucking inwards (Retractions)'],
          },
        });
      }

      // =========================================================================
      // 7. GASTROENTEROLOGY & STOMACH / ABDOMEN
      // =========================================================================
      else if (
        text.includes('stomach') ||
        text.includes('abdomen') ||
        text.includes('acid') ||
        text.includes('reflux') ||
        text.includes('vomit') ||
        text.includes('diarrhea') ||
        text.includes('loose motion') ||
        text.includes('पोट') ||
        text.includes('जळजळ') ||
        text.includes('उलटी') ||
        text.includes('जुलाब') ||
        text.includes('पेट')
      ) {
        setResult({
          isEmergency: false,
          recommendedSpecialty: 'Gastroenterology',
          conditionPossibilities: ['GERD (Acid Reflux)', 'Acute Gastroenteritis (Food Poisoning)', 'Peptic Ulcer Disease', 'Acute Appendicitis (if lower right pain)'],
          urgencyLevel: 'URGENT',
          clinicalAdvice: 'GASTROINTESTINAL EVALUATION: Maintain hydration with ORS and seek specialist review.',
          searchKeyword: 'Gastroenterology',
          emergencyFirstAid: {
            patientPosition: 'Reclining with knees bent towards chest to relieve abdominal muscle tension.',
            immediateActions: [
              'Sip 200ml Oral Rehydration Solution (ORS) slowly after every loose stool or vomiting episode.',
              'Stick to bland BRAT diet (Bananas, Rice, Applesauce, Toast) once vomiting subsides.',
              'For acid reflux: Stand or sit upright for at least 2 hours after meals; sip cold milk or water.',
            ],
            doNotDo: [
              'Do NOT consume spicy, oily, acidic citrus fruits, or caffeinated beverages.',
              'Do NOT take NSAID painkillers (like Ibuprofen/Brufen) which worsen stomach ulcer bleeding.',
              'Do NOT apply strong heat pads if appendicitis is suspected.',
            ],
            warningSigns: ['Severe localized pain in right lower abdomen with fever (Appendicitis risk)', 'Vomiting blood or coffee-ground substance', 'Black tarry stools or extreme dehydration with dark urine'],
          },
        });
      }

      // =========================================================================
      // 8. DERMATOLOGY / SKIN & ALLERGY
      // =========================================================================
      else if (
        text.includes('skin') ||
        text.includes('rash') ||
        text.includes('itch') ||
        text.includes('acne') ||
        text.includes('hives') ||
        text.includes('त्वचा') ||
        text.includes('पुरळ') ||
        text.includes('खाज') ||
        text.includes('खुजली')
      ) {
        setResult({
          isEmergency: false,
          recommendedSpecialty: 'Dermatology',
          conditionPossibilities: ['Allergic Urticaria (Hives)', 'Atopic Contact Dermatitis', 'Fungal Tinea Infection', 'Eczema Flare'],
          urgencyLevel: 'ROUTINE',
          clinicalAdvice: 'DERMATOLOGY CONSULTATION: Identify allergen trigger and apply gentle skin soothing care.',
          searchKeyword: 'Dermatology',
          emergencyFirstAid: {
            patientPosition: 'Comfortable seated position in a cool, shaded environment.',
            immediateActions: [
              'Apply cool, damp cloth compresses to soothe burning and itching skin.',
              'Apply mild calamine lotion over unbroken, itchy skin areas.',
              'Wear loose, soft, breathable cotton clothing to minimize friction.',
            ],
            doNotDo: [
              'Do NOT vigorously scratch or rub itchy skin (prevents secondary bacterial infection).',
              'Do NOT bathe with harsh perfumed soaps or extremely hot water.',
              'Do NOT apply unknown steroid creams without a dermatologist’s prescription.',
            ],
            warningSigns: ['Sudden swelling of lips, tongue, face, or throat (Anaphylaxis - Call SOS)', 'Blistering peeling skin over large areas with fever', 'Spreading red streaks with hot tenderness (Cellulitis)'],
          },
        });
      }

      // =========================================================================
      // 9. GENERAL CLINICAL DEFAULT
      // =========================================================================
      else {
        setResult({
          isEmergency: false,
          recommendedSpecialty: 'General Physician / Internal Medicine',
          conditionPossibilities: ['Viral Upper Respiratory Infection', 'General Fatigue & Dehydration', 'Seasonal Flu Syndrome', 'Clinical Evaluation Recommended'],
          urgencyLevel: 'ROUTINE',
          clinicalAdvice: 'GENERAL PHYSICIAN CONSULTATION: Book a routine consultation with a verified medical officer for diagnosis and targeted treatment.',
          searchKeyword: 'General Physician',
          emergencyFirstAid: {
            patientPosition: 'Comfortable restful position in a well-ventilated, quiet room.',
            immediateActions: [
              'Get adequate bed rest (7–9 hours) and avoid physical or mental exertion.',
              'Drink 2.5–3 liters of clean boiled water, herbal tea, or warm soups daily.',
              'Record body temperature and blood pressure twice daily in a symptom diary.',
            ],
            doNotDo: [
              'Do NOT take over-the-counter antibiotics without prescription.',
              'Do NOT consume alcohol, smoking, or processed junk foods while recovering.',
            ],
            warningSigns: ['High fever persisting beyond 3 consecutive days', 'Severe sudden worsening of symptoms', 'Inability to retain liquids due to continuous vomiting'],
          },
        });
      }
    }, 450);
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1.5px solid #99F6E4',
        borderRadius: '18px',
        padding: '1.5rem',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, #F0FDFA 0%, #FFFFFF 50%, #F8FAFC 100%)',
        boxShadow: '0 8px 24px rgba(13, 148, 136, 0.09)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: '#0D9488',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.35)',
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1875rem', fontWeight: 800, color: '#0F172A' }}>
                AI Clinical Symptom Triage & First-Aid Guide
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
                INTERIM EMERGENCY READY
              </span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.78125rem', color: '#64748B' }}>
              Describe your symptoms in English, Hindi, or Marathi for instant clinical specialty matching and immediate life-saving first-aid steps until help arrives.
            </p>
          </div>
        </div>
      </div>

      {/* Input Search Form */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem' }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder={t('triage.placeholder') || "e.g. Sharp chest pain sweating, high fever, child breathing difficulty, knee swelling..."}
            value={inputSymptoms}
            onChange={(e) => setInputSymptoms(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAnalyze();
            }}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.625rem',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              borderRadius: '12px',
              fontSize: '0.875rem',
              color: '#0F172A',
              outline: 'none',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => handleAnalyze()}
          disabled={analyzing || !inputSymptoms.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#0D9488',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '0.875rem',
            cursor: analyzing || !inputSymptoms.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
          }}
        >
          <Sparkles size={16} />
          <span>{analyzing ? 'Analyzing Symptoms...' : 'Analyze Triage'}</span>
        </button>
      </div>

      {/* Quick Clickable Symptom Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', marginRight: '4px' }}>
          Popular Symptoms:
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
              padding: '4px 12px',
              fontSize: '0.75rem',
              color: '#334155',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease',
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
            border: `2px solid ${result.isEmergency ? '#FECACA' : '#99F6E4'}`,
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
            animation: 'fadeIn 0.25s ease-in-out',
          }}
        >
          {/* Result Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: result.isEmergency ? '#DC2626' : '#0D9488',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: result.isEmergency ? '0 0 14px rgba(220, 38, 38, 0.4)' : 'none',
                }}
              >
                {result.isEmergency ? <Siren size={22} className="animate-pulse" /> : <Stethoscope size={22} />}
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 900, color: result.isEmergency ? '#DC2626' : '#0D9488', textTransform: 'uppercase' }}>
                  Matched Clinical Specialty
                </span>
                <h4 style={{ margin: '1px 0', fontSize: '1.125rem', fontWeight: 900, color: '#0F172A' }}>
                  {result.recommendedSpecialty}
                </h4>
              </div>
            </div>

            <span
              style={{
                backgroundColor: result.isEmergency ? '#FEE2E2' : result.urgencyLevel === 'URGENT' ? '#FEF3C7' : '#DCFCE7',
                color: result.isEmergency ? '#991B1B' : result.urgencyLevel === 'URGENT' ? '#92400E' : '#166534',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 900,
                border: `1.5px solid ${result.isEmergency ? '#FECACA' : result.urgencyLevel === 'URGENT' ? '#FDE68A' : '#BBF7D0'}`,
              }}
            >
              {result.urgencyLevel}
            </span>
          </div>

          <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#334155', lineHeight: 1.5, fontWeight: 500 }}>
            {result.clinicalAdvice}
          </p>

          {/* Condition Possibilities */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.375rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>
              Condition Possibilities:
            </span>
            {result.conditionPossibilities.map((cp) => (
              <span
                key={cp}
                style={{
                  backgroundColor: '#F1F5F9',
                  color: '#334155',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: '1px solid #E2E8F0',
                }}
              >
                {cp}
              </span>
            ))}
          </div>

          {/* ========================================================================= */}
          {/* FIRST-AID & EMERGENCY PROTOCOL CARD ("UNTIL HELP ARRIVES")                */}
          {/* ========================================================================= */}
          {result.emergencyFirstAid && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: result.isEmergency ? '1.5px solid #FECACA' : '1.5px solid #CCFBF1',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.25rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                <HeartPulse size={18} color={result.isEmergency ? '#DC2626' : '#0D9488'} />
                <h5 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 900, color: '#0F172A' }}>
                  Immediate Solution & First-Aid Protocol (Until Medical Help Arrives)
                </h5>
              </div>

              {/* Recommended Positioning */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '8px',
                  marginBottom: '0.875rem',
                  fontSize: '0.8125rem',
                  color: '#334155',
                  borderLeft: '4px solid #0284C7',
                }}
              >
                <strong>🛌 Patient Positioning:</strong> {result.emergencyFirstAid.patientPosition}
              </div>

              {/* Immediate Step-by-Step Actions */}
              <div style={{ marginBottom: '0.875rem' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#16A34A', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                  <CheckCircle2 size={15} color="#16A34A" />
                  <span>DO THESE STEPS IMMEDIATELY:</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#334155', lineHeight: 1.5 }}>
                  {result.emergencyFirstAid.immediateActions.map((action, idx) => (
                    <li key={idx} style={{ marginBottom: '0.25rem' }}>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Harm Prevention / DO NOT DO */}
              {result.emergencyFirstAid.doNotDo.length > 0 && (
                <div style={{ marginBottom: '0.875rem' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                    <XCircle size={15} color="#DC2626" />
                    <span>CRITICAL HARM PREVENTION (NEVER DO THESE):</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#991B1B', lineHeight: 1.5 }}>
                    {result.emergencyFirstAid.doNotDo.map((dont, idx) => (
                      <li key={idx} style={{ marginBottom: '0.25rem' }}>
                        {dont}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Red Flag Warning Signs */}
              {result.emergencyFirstAid.warningSigns.length > 0 && (
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: '#991B1B',
                    border: '1px solid #FECACA',
                  }}
                >
                  <strong>🚨 Immediate Emergency Red Flags:</strong> {result.emergencyFirstAid.warningSigns.join(' • ')}
                </div>
              )}
            </div>
          )}

          {/* Action Callouts */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {result.isEmergency ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/patient/emergency')}
                  style={{
                    flex: 1,
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
                    minWidth: '200px',
                  }}
                >
                  <Siren size={18} />
                  <span>DISPATCH EMERGENCY SOS (AMBULANCE + ER)</span>
                </button>

                <a
                  href="tel:108"
                  style={{
                    backgroundColor: '#16A34A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.75rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <Phone size={16} />
                  <span>Dial 108</span>
                </a>
              </>
            ) : (
              <button
                type="button"
                onClick={() => navigate(`/patient/doctors?specialization=${encodeURIComponent(result.searchKeyword)}`)}
                style={{
                  flex: 1,
                  backgroundColor: '#0D9488',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
                }}
              >
                <Stethoscope size={18} />
                <span>Book Consultation with {result.searchKeyword} Specialist</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>

          {/* ========================================================================= */}
          {/* PROMINENT STATUTORY AI MEDICAL DISCLAIMER                                */}
          {/* ========================================================================= */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.625rem',
            }}
          >
            <ShieldAlert size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.6875rem', color: '#64748B', lineHeight: 1.45 }}>
              <strong style={{ color: '#0F172A' }}>⚖️ STATUTORY MEDICAL & LEGAL DISCLAIMER:</strong> This AI Clinical Symptom Triage tool is powered by algorithmic medical protocols intended strictly for educational triage routing and emergency interim first-aid guidance until professional medical personnel arrive. It does <strong>NOT</strong> constitute a formal doctor’s clinical diagnosis, certified prescription, or medical treatment plan. If you are experiencing a severe or life-threatening condition, immediately trigger <strong>Emergency SOS</strong> or dial <strong>108 / 112</strong>.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISymptomChecker;
