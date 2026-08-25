import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  Phone,
  HeartPulse,
  Save,
  Check,
} from 'lucide-react';
import axios from 'axios';
import useAuthStore, { Language } from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, token, setLanguage, logout } = useAuthStore();

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Multi-Tier Emergency Contacts State (Primary, Secondary, Tertiary)
  const [contacts, setContacts] = useState([
    { name: 'Dr. Alok Sharma (Father)', phone: '+91 98444 11001', relation: 'Father' },
    { name: 'Pooja Sharma (Spouse)', phone: '+91 98444 11002', relation: 'Spouse' },
    { name: 'Vikram Mehta (Friend)', phone: '+91 98444 11003', relation: 'Friend' },
  ]);

  // Critical Medical ID State
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('Penicillin, Sulfa drugs');
  const [conditions, setConditions] = useState('Hypertension, Type-2 Diabetes');
  const [isOrganDonor, setIsOrganDonor] = useState(true);

  // Load existing profile if available
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const savedMedicalId = localStorage.getItem('hs_patient_medical_id');
        if (savedMedicalId) {
          const parsed = JSON.parse(savedMedicalId);
          if (parsed.contacts) setContacts(parsed.contacts);
          if (parsed.bloodGroup) setBloodGroup(parsed.bloodGroup);
          if (parsed.allergies) setAllergies(parsed.allergies);
          if (parsed.conditions) setConditions(parsed.conditions);
          if (parsed.isOrganDonor !== undefined) setIsOrganDonor(parsed.isOrganDonor);
        }

        if (token) {
          const res = await axios.get('/api/v1/patients/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.data?.data) {
            const p = res.data.data;
            if (p.bloodGroup && p.bloodGroup !== 'UNKNOWN') setBloodGroup(p.bloodGroup);
            if (p.knownAllergies) setAllergies(p.knownAllergies);
            if (p.emergencyContactName && p.emergencyContactPhone) {
              setContacts((prev) => [
                { name: p.emergencyContactName, phone: p.emergencyContactPhone, relation: 'Primary' },
                prev[1] || { name: 'Pooja Sharma', phone: '+91 98444 11002', relation: 'Spouse' },
                prev[2] || { name: 'Vikram Mehta', phone: '+91 98444 11003', relation: 'Friend' },
              ]);
            }
          }
        }
      } catch {
        // use defaults
      }
    };
    loadProfile();
  }, [token]);

  const handleSaveMedicalSettings = async () => {
    setSaving(true);
    setSavedSuccess(false);

    const medicalIdData = {
      contacts,
      bloodGroup,
      allergies,
      conditions,
      isOrganDonor,
    };

    localStorage.setItem('hs_patient_medical_id', JSON.stringify(medicalIdData));

    try {
      if (token) {
        await axios.put(
          '/api/v1/patients/me',
          {
            fullName: user?.profile?.fullName || 'Patient',
            bloodGroup,
            knownAllergies: allergies,
            emergencyContactName: contacts[0]?.name || '',
            emergencyContactPhone: contacts[0]?.phone || '',
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch {
      // LocalStorage backup saves instantly
    } finally {
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const languages: { code: Language; label: string; native: string }[] = [
    { code: 'EN', label: 'English', native: 'English' },
    { code: 'HI', label: 'Hindi', native: 'हिंदी' },
    { code: 'MR', label: 'Marathi', native: 'मराठी' },
  ];

  return (
    <div className="container" style={{ maxWidth: '768px', padding: '1.5rem 1rem 5rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.25rem 0', color: 'var(--text-primary)' }}>
        {t('nav.settings')} & Emergency Medical ID
      </h1>

      {/* Success Notification Banner */}
      {savedSuccess && (
        <div
          style={{
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '12px',
            padding: '0.875rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            color: '#065F46',
            fontWeight: 700,
            fontSize: '0.875rem',
          }}
        >
          <Check size={18} color="#059669" />
          <span>Emergency Medical ID & Waterfall Contacts saved successfully!</span>
        </div>
      )}

      {/* 1. Multi-Tier Emergency Contacts Suite (Primary, Secondary, Tertiary) */}
      <Card style={{ marginBottom: '1.5rem', borderLeft: '4px solid #DC2626' }}>
        <Card.Header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Phone size={18} color="#DC2626" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
              Multi-Tier Emergency Contacts (Failover Cascade)
            </h3>
          </div>
        </Card.Header>

        <Card.Body style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0 0 1.25rem 0' }}>
            If the primary contact does not answer during an SOS, HealthSync will automatically cascade calls and GPS WhatsApp broadcasts to secondary and tertiary contacts.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {contacts.map((c, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: idx === 0 ? '#DC2626' : idx === 1 ? '#0284C7' : '#16A34A',
                      backgroundColor: idx === 0 ? '#FEE2E2' : idx === 1 ? '#E0F2FE' : '#DCFCE7',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {idx === 0 ? 'PRIMARY CONTACT (DIALED FIRST)' : idx === 1 ? 'SECONDARY FAILOVER (DIALED 2ND)' : 'TERTIARY BACKUP (DIALED 3RD)'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.625rem' }}>
                  <div>
                    <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '2px' }}>
                      Contact Name & Relation
                    </label>
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => {
                        const updated = [...contacts];
                        updated[idx].name = e.target.value;
                        setContacts(updated);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                      }}
                      placeholder="e.g. Ramesh Sharma (Brother)"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '2px' }}>
                      Emergency Phone Number
                    </label>
                    <input
                      type="tel"
                      value={c.phone}
                      onChange={(e) => {
                        const updated = [...contacts];
                        updated[idx].phone = e.target.value;
                        setContacts(updated);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                      }}
                      placeholder="+91 98000 00000"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* 2. Critical Emergency Medical ID Card for Paramedics */}
      <Card style={{ marginBottom: '1.5rem', borderLeft: '4px solid #1A56DB' }}>
        <Card.Header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HeartPulse size={18} color="#1A56DB" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
              Emergency Medical ID (Visible to Paramedics)
            </h3>
          </div>
        </Card.Header>

        <Card.Body style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0 0 1.25rem 0' }}>
            Instantly accessible to ambulance EMTs and trauma doctors even if you are unconscious or unable to speak.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {/* Blood Group */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '4px' }}>
                Blood Group (रक्तगट)
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#DC2626',
                  backgroundColor: '#FFFFFF',
                }}
              >
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'UNKNOWN'].map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            {/* Organ Donor */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '4px' }}>
                Organ Donor Status
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setIsOrganDonor(true)}
                  style={{
                    flex: 1,
                    padding: '0.45rem',
                    borderRadius: '8px',
                    border: `1px solid ${isOrganDonor ? '#16A34A' : '#CBD5E1'}`,
                    backgroundColor: isOrganDonor ? '#DCFCE7' : '#FFFFFF',
                    color: isOrganDonor ? '#166534' : '#64748B',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                  }}
                >
                  ✓ Registered Donor
                </button>
                <button
                  type="button"
                  onClick={() => setIsOrganDonor(false)}
                  style={{
                    flex: 1,
                    padding: '0.45rem',
                    borderRadius: '8px',
                    border: `1px solid ${!isOrganDonor ? '#64748B' : '#CBD5E1'}`,
                    backgroundColor: !isOrganDonor ? '#F1F5F9' : '#FFFFFF',
                    color: !isOrganDonor ? '#0F172A' : '#64748B',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                  }}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.25rem' }}>
            {/* Known Allergies */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '4px' }}>
                Critical Drug & Food Allergies (अ‍ॅलर्जी)
              </label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Penicillin, Sulfa drugs, Peanuts, Latex"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.8125rem',
                  color: '#0F172A',
                }}
              />
            </div>

            {/* Chronic Conditions */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '4px' }}>
                Chronic Medical Conditions (जुनाट आजार)
              </label>
              <input
                type="text"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="e.g. Hypertension, Type-2 Diabetes, Asthma, Cardiac Stent"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.8125rem',
                  color: '#0F172A',
                }}
              />
            </div>
          </div>

          {/* Save Action Button */}
          <Button
            variant="primary"
            size="md"
            isLoading={saving}
            onClick={handleSaveMedicalSettings}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Save size={16} />
            <span>Save Emergency Medical ID & Contacts</span>
          </Button>
        </Card.Body>
      </Card>

      {/* 3. Language Preference Card */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <Card.Header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={18} color="var(--color-primary-600)" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
              {t('settings.language') || 'App Language (भाषा)'}
            </h3>
          </div>
        </Card.Header>

        <Card.Body style={{ padding: '1.25rem' }}>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Instant zero-reload language switching across patient and emergency interfaces.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => changeLanguage(lang.code)}
                style={{
                  padding: '0.875rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${
                    i18n.language.toUpperCase() === lang.code ? 'var(--color-primary-600)' : 'var(--border-subtle)'
                  }`,
                  backgroundColor:
                    i18n.language.toUpperCase() === lang.code ? 'var(--color-primary-50)' : 'var(--bg-surface)',
                  color:
                    i18n.language.toUpperCase() === lang.code ? 'var(--color-primary-800)' : 'var(--text-primary)',
                  fontWeight: i18n.language.toUpperCase() === lang.code ? 800 : 500,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>{lang.native}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang.label}</div>
              </button>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Account & Sign Out */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <Card.Body style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '0.875rem' }}>Registered Account</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.phone || '+91 9876543210'}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} style={{ color: 'var(--color-danger-600)' }}>
              {t('nav.logout')}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default SettingsPage;
