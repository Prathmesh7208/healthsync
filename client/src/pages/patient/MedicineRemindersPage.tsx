import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Pill, Plus, Clock, Check, Trash2, ShieldCheck } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export const MedicineRemindersPage: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuthStore();

  const [reminders, setReminders] = useState<any[]>([]);

  // Add reminder modal
  const [modalOpen, setModalOpen] = useState(false);
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('500mg');
  const [frequency, setFrequency] = useState('Daily');
  const [times, setTimes] = useState<string[]>(['09:00']);
  const [startDate] = useState(new Date().toISOString().split('T')[0]);
  const [instructions, setInstructions] = useState('AFTER_FOOD');
  const [saving, setSaving] = useState(false);

  // Local state for today's completed doses
  const [completedDoses, setCompletedDoses] = useState<Record<string, boolean>>({});

  const fetchReminders = async () => {
    try {
      const res = await axios.get('/api/v1/patients/me/reminders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReminders(res.data.data || []);
    } catch {
      setReminders([]);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName) return;

    setSaving(true);
    try {
      await axios.post(
        '/api/v1/patients/me/reminders',
        {
          medicineName,
          dosage,
          frequency,
          times,
          startDate,
          instructions,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModalOpen(false);
      setMedicineName('');
      fetchReminders();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to add reminder');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (!confirm('Remove this reminder?')) return;
    try {
      await axios.delete(`/api/v1/patients/me/reminders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchReminders();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Delete failed');
    }
  };

  const toggleDose = (key: string) => {
    setCompletedDoses((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="container" style={{ maxWidth: '720px', padding: '1.5rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          {t('reminders.title')}
        </h1>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={16} />}
          onClick={() => setModalOpen(true)}
        >
          {t('reminders.addReminder')}
        </Button>
      </div>

      {/* Adherence Card */}
      <Card style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)', border: '1px solid #99F6E4' }}>
        <Card.Body style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-secondary-800)' }}>
                {t('reminders.adherence')}
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-secondary-900)' }}>
                {reminders.length > 0 ? '92%' : '100%'}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary-700)' }}>
                Keep up the great adherence to stay on schedule!
              </span>
            </div>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-secondary-600)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={28} />
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Today's Schedule Timeline */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.875rem', color: 'var(--text-primary)' }}>
          {t('reminders.todaysDoses')}
        </h3>

        {reminders.length === 0 ? (
          <Card>
            <Card.Body style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <Pill size={40} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 1rem 0' }}>
                {t('reminders.noReminders')}
              </p>
              <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
                Add First Medicine
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reminders.map((r) => {
              const timesList = Array.isArray(r.times) ? r.times : ['09:00'];
              return timesList.map((timeStr: string) => {
                const doseKey = `${r.id}-${timeStr}`;
                const isTaken = !!completedDoses[doseKey];

                return (
                  <Card key={doseKey}>
                    <Card.Body style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                          <div
                            style={{
                              padding: '0.5rem',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: isTaken ? 'var(--color-success-50)' : 'var(--color-primary-50)',
                              color: isTaken ? 'var(--color-success-600)' : 'var(--color-primary-600)',
                            }}
                          >
                            <Pill size={20} />
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, textDecoration: isTaken ? 'line-through' : 'none' }}>
                              {r.medicineName} ({r.dosage})
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              <Clock size={12} />
                              <span>{timeStr}</span>
                              <span>•</span>
                              <span>{r.instructions === 'AFTER_FOOD' ? t('reminders.afterFood') : t('reminders.beforeFood')}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => toggleDose(doseKey)}
                            style={{
                              padding: '0.375rem 0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              border: `1px solid ${isTaken ? 'var(--color-success-600)' : 'var(--border-strong)'}`,
                              backgroundColor: isTaken ? 'var(--color-success-50)' : 'transparent',
                              color: isTaken ? 'var(--color-success-700)' : 'var(--text-secondary)',
                              fontWeight: 600,
                              fontSize: '0.8125rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <Check size={14} />
                            <span>{isTaken ? 'Taken' : t('reminders.takeDose')}</span>
                          </button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                );
              });
            })}
          </div>
        )}
      </div>

      {/* Active Prescription Overview */}
      {reminders.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.875rem', color: 'var(--text-primary)' }}>
            {t('reminders.activeReminders')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reminders.map((r) => (
              <Card key={r.id}>
                <Card.Body style={{ padding: '0.875rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>
                        {r.medicineName} — {r.dosage}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {r.frequency} at {Array.isArray(r.times) ? r.times.join(', ') : '09:00'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteReminder(r.id)}
                      className="hs-btn hs-btn-ghost hs-btn-sm"
                      style={{ color: 'var(--color-danger-600)' }}
                      title="Delete Reminder"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Reminder Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Medicine Reminder">
        <form onSubmit={handleAddReminder}>
          <Input
            label="Medicine Name *"
            placeholder="e.g. Paracetamol / Metformin"
            value={medicineName}
            onChange={(e) => setMedicineName(e.target.value)}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input
              label="Dosage"
              placeholder="e.g. 500mg / 1 tablet"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
            />

            <div className="hs-input-group">
              <label className="hs-label">Timing</label>
              <select className="hs-input" value={instructions} onChange={(e) => setInstructions(e.target.value)}>
                <option value="AFTER_FOOD">After Food</option>
                <option value="BEFORE_FOOD">Before Food</option>
                <option value="WITH_FOOD">With Food</option>
              </select>
            </div>
          </div>

          <div className="hs-input-group">
            <label className="hs-label">Frequency</label>
            <select
              className="hs-input"
              value={frequency}
              onChange={(e) => {
                const freq = e.target.value;
                setFrequency(freq);
                if (freq === 'Once Daily') setTimes(['09:00']);
                else if (freq === 'Twice Daily') setTimes(['09:00', '21:00']);
                else if (freq === 'Three Times Daily') setTimes(['09:00', '14:00', '21:00']);
              }}
            >
              <option value="Daily">Daily (Once a day)</option>
              <option value="Twice Daily">Twice Daily (Morning & Night)</option>
              <option value="Three Times Daily">Three Times Daily</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={saving} style={{ flex: 1 }}>
              Save Reminder
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MedicineRemindersPage;
