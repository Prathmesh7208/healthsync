import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  User,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  AlertTriangle,
  Pill,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

interface PrescriptionRow {
  medicineName: string;
  dosage: string;
  form: 'TABLET' | 'CAPSULE' | 'SYRUP' | 'INJECTION' | 'DROPS' | 'CREAM';
  frequency: string;
  timing: 'BEFORE_FOOD' | 'AFTER_FOOD' | 'WITH_FOOD' | 'ANY_TIME';
  duration: string;
  specialInstructions: string;
}

export const ConsultationPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [appointment, setAppointment] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Consultation state
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [observations, setObservations] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpRecommended, setFollowUpRecommended] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');

  // Prescription builder state
  const [medicines, setMedicines] = useState<PrescriptionRow[]>([
    {
      medicineName: '',
      dosage: '500mg',
      form: 'TABLET',
      frequency: 'Twice daily',
      timing: 'AFTER_FOOD',
      duration: '5 days',
      specialInstructions: '',
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const commonSymptoms = [
    'Fever',
    'Cough & Cold',
    'Headache',
    'Chest Pain',
    'Abdominal Pain',
    'Fatigue',
    'Breathlessness',
    'Joint Pain',
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aptRes, patientRes] = await Promise.all([
          axios.get(`/api/v1/appointments/${appointmentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`/api/v1/doctors/me/appointments/${appointmentId}/patient`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const apt = aptRes.data.data;
        setAppointment(apt);
        setPatientData(patientRes.data.data);

        // Pre-populate if existing consultation
        if (apt.consultation) {
          const c = apt.consultation;
          setSymptoms(Array.isArray(c.symptoms) ? c.symptoms : []);
          setDiagnosis(c.diagnosis || '');
          setObservations(c.observations || '');
          setAdvice(c.advice || '');
          setFollowUpRecommended(c.followUpRecommended || false);
          setFollowUpDate(c.followUpDate ? c.followUpDate.split('T')[0] : '');

          if (c.prescriptions?.length > 0 && c.prescriptions[0].items?.length > 0) {
            setMedicines(
              c.prescriptions[0].items.map((i: any) => ({
                medicineName: i.medicineName,
                dosage: i.dosage,
                form: i.form,
                frequency: i.frequency,
                timing: i.timing,
                duration: i.duration,
                specialInstructions: i.specialInstructions || '',
              }))
            );
          }
        }
      } catch {
        // defaults
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId && token) fetchData();
  }, [appointmentId, token]);

  const handleAddSymptom = (sym: string) => {
    if (!sym || symptoms.includes(sym)) return;
    setSymptoms([...symptoms, sym]);
    setSymptomInput('');
  };

  const handleRemoveSymptom = (sym: string) => {
    setSymptoms(symptoms.filter((s) => s !== sym));
  };

  const handleAddMedicineRow = () => {
    setMedicines([
      ...medicines,
      {
        medicineName: '',
        dosage: '500mg',
        form: 'TABLET',
        frequency: 'Twice daily',
        timing: 'AFTER_FOOD',
        duration: '5 days',
        specialInstructions: '',
      },
    ]);
  };

  const handleRemoveMedicineRow = (idx: number) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleMedicineChange = (idx: number, field: keyof PrescriptionRow, val: string) => {
    const updated = [...medicines];
    updated[idx] = { ...updated[idx], [field]: val };
    setMedicines(updated);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await axios.post(
        '/api/v1/consultations',
        {
          appointmentId,
          symptoms,
          diagnosis,
          observations,
          advice,
          followUpRecommended,
          followUpDate: followUpDate || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Consultation draft saved');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!diagnosis.trim()) {
      alert('Please enter a clinical diagnosis before finalizing');
      return;
    }

    if (!confirm('Are you sure you want to finalize this consultation and issue the prescription?')) {
      return;
    }

    setFinalizing(true);
    try {
      // 1. Save consultation
      const consultRes = await axios.post(
        '/api/v1/consultations',
        {
          appointmentId,
          symptoms,
          diagnosis,
          observations,
          advice,
          followUpRecommended,
          followUpDate: followUpDate || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const consultationId = consultRes.data.data.id;

      // 2. Save prescription if medicines entered
      const validMeds = medicines.filter((m) => m.medicineName.trim() !== '');
      if (validMeds.length > 0) {
        await axios.post(
          '/api/v1/prescriptions',
          {
            consultationId,
            items: validMeds,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // 3. Finalize consultation
      await axios.put(
        `/api/v1/consultations/${consultationId}/finalize`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Consultation completed and prescription generated!');
      navigate('/doctor/appointments');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to complete consultation');
    } finally {
      setFinalizing(false);
    }
  };

  if (loading || !appointment) {
    return (
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div className="hs-skeleton" style={{ height: '400px', width: '100%' }} />
      </div>
    );
  }

  const patient = patientData?.patient || appointment.patient;
  const pastVisits = patientData?.pastVisits || [];

  return (
    <div className="container" style={{ maxWidth: '1200px', paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => navigate('/doctor/appointments')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            background: 'none',
            border: 'none',
            color: 'var(--color-primary-600)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Schedule</span>
        </button>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" size="sm" isLoading={saving} onClick={handleSaveDraft}>
            Save Draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<CheckCircle2 size={16} />}
            isLoading={finalizing}
            onClick={handleFinalize}
          >
            Finalize & Complete Consultation
          </Button>
        </div>
      </div>

      {/* Main Grid: Patient Info (Left) + Clinical Form (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 340px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Patient Profile & Visit History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card>
            <Card.Header>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} color="var(--color-primary-600)" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Patient Summary</h3>
              </div>
            </Card.Header>
            <Card.Body style={{ padding: '1rem' }}>
              <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontWeight: 800 }}>
                {patient?.fullName || 'Patient'}
              </h2>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Gender: <strong>{patient?.gender || 'N/A'}</strong> • Blood Group: <strong>{patient?.bloodGroup || 'UNKNOWN'}</strong>
              </div>

              {/* Known Allergies */}
              {patient?.knownAllergies && (
                <div
                  style={{
                    backgroundColor: 'var(--color-danger-50)',
                    border: '1px solid var(--color-danger-100)',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-danger-700)', fontWeight: 700, fontSize: '0.75rem' }}>
                    <AlertTriangle size={14} />
                    <span>KNOWN ALLERGIES</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-danger-800)', marginTop: '2px' }}>
                    {patient.knownAllergies}
                  </div>
                </div>
              )}

              {/* Existing Conditions */}
              {patient?.existingConditions && Array.isArray(patient.existingConditions) && patient.existingConditions.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>PRE-EXISTING CONDITIONS:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                    {patient.existingConditions.map((c: string) => (
                      <Badge key={c} variant="neutral">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {appointment.reasonForVisit && (
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>REASON FOR VISIT:</span>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                    {appointment.reasonForVisit}
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Past Visits with this doctor */}
          <Card>
            <Card.Header>
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>Previous Visits ({pastVisits.length})</h3>
            </Card.Header>
            <Card.Body style={{ padding: '0.75rem' }}>
              {pastVisits.length === 0 ? (
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>First visit with Dr. {appointment.doctor?.fullName}.</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {pastVisits.map((v: any) => (
                    <div key={v.id} style={{ padding: '0.5rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                      <div style={{ fontWeight: 700 }}>{v.date?.split('T')[0]}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        Diagnosis: {v.consultation?.diagnosis || 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        {/* Right Column: Clinical Notes & Prescription */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Symptoms Card */}
          <Card>
            <Card.Header>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Symptoms & Chief Complaints</h3>
            </Card.Header>
            <Card.Body>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
                {symptoms.map((s) => (
                  <span
                    key={s}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.25rem 0.625rem',
                      backgroundColor: 'var(--color-primary-50)',
                      color: 'var(--color-primary-700)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                    }}
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => handleRemoveSymptom(s)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-700)', padding: 0 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Quick suggestions */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Quick add:</span>
                {commonSymptoms.map((cs) => (
                  <button
                    key={cs}
                    type="button"
                    onClick={() => handleAddSymptom(cs)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'transparent',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    + {cs}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Type symptom and press add..."
                  className="hs-input"
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSymptom(symptomInput);
                    }
                  }}
                />
                <Button variant="outline" size="sm" type="button" onClick={() => handleAddSymptom(symptomInput)}>
                  Add
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Diagnosis & Clinical Observations */}
          <Card>
            <Card.Header>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Clinical Assessment & Diagnosis</h3>
            </Card.Header>
            <Card.Body>
              <div className="hs-input-group">
                <label className="hs-label">Primary Diagnosis *</label>
                <input
                  type="text"
                  placeholder="e.g. Acute Upper Respiratory Tract Infection"
                  className="hs-input"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  required
                />
              </div>

              <div className="hs-input-group">
                <label className="hs-label">Clinical Observations & Examination Findings</label>
                <textarea
                  rows={3}
                  className="hs-input"
                  placeholder="e.g. Throat congested, BP 120/80, chest clear, temperature 100.4 F..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                />
              </div>

              <div className="hs-input-group">
                <label className="hs-label">Dietary & Lifestyle Advice</label>
                <textarea
                  rows={2}
                  className="hs-input"
                  placeholder="e.g. Steam inhalation twice daily, drink warm water, avoid cold beverages..."
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input
                    type="checkbox"
                    checked={followUpRecommended}
                    onChange={(e) => setFollowUpRecommended(e.target.checked)}
                  />
                  <span>Follow-up consultation recommended</span>
                </label>

                {followUpRecommended && (
                  <input
                    type="date"
                    className="hs-input"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    style={{ width: 'auto' }}
                  />
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Prescription Medication Builder */}
          <Card>
            <Card.Header>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Pill size={18} color="var(--color-secondary-600)" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Digital Rx Prescription</h3>
                </div>
                <Button variant="outline" size="sm" leftIcon={<Plus size={14} />} onClick={handleAddMedicineRow}>
                  Add Medicine
                </Button>
              </div>
            </Card.Header>

            <Card.Body>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {medicines.map((med, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.875rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Medicine name (e.g. Paracetamol)"
                        className="hs-input"
                        value={med.medicineName}
                        onChange={(e) => handleMedicineChange(idx, 'medicineName', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Dosage (500mg)"
                        className="hs-input"
                        value={med.dosage}
                        onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                      />
                      <select
                        className="hs-input"
                        value={med.form}
                        onChange={(e) => handleMedicineChange(idx, 'form', e.target.value)}
                      >
                        <option value="TABLET">Tablet</option>
                        <option value="CAPSULE">Capsule</option>
                        <option value="SYRUP">Syrup</option>
                        <option value="INJECTION">Injection</option>
                        <option value="DROPS">Drops</option>
                        <option value="CREAM">Cream</option>
                      </select>

                      {medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicineRow(idx)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-danger-600)', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                      <select
                        className="hs-input"
                        value={med.frequency}
                        onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                      >
                        <option value="Once daily">Once daily (1-0-0)</option>
                        <option value="Twice daily">Twice daily (1-0-1)</option>
                        <option value="Three times daily">Three times (1-1-1)</option>
                        <option value="As needed (SOS)">As needed (SOS)</option>
                      </select>

                      <select
                        className="hs-input"
                        value={med.timing}
                        onChange={(e) => handleMedicineChange(idx, 'timing', e.target.value)}
                      >
                        <option value="AFTER_FOOD">After Food</option>
                        <option value="BEFORE_FOOD">Before Food</option>
                        <option value="WITH_FOOD">With Food</option>
                        <option value="ANY_TIME">Any Time</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Duration (5 days)"
                        className="hs-input"
                        value={med.duration}
                        onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConsultationPage;
