import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Coffee } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export const ScheduleManagementPage: React.FC = () => {
  const { token } = useAuthStore();

  const [schedules, setSchedules] = useState<any[]>([]);
  const [breaks, setBreaks] = useState<any[]>([]);
  const [affiliations, setAffiliations] = useState<any[]>([]);

  // Add Schedule Modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [hospitalId, setHospitalId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('MONDAY');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState(15);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Add Break Modal
  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const [breakHospitalId, setBreakHospitalId] = useState('');
  const [breakDay, setBreakDay] = useState('MONDAY');
  const [breakStartTime, setBreakStartTime] = useState('13:00');
  const [breakEndTime, setBreakEndTime] = useState('14:00');
  const [savingBreak, setSavingBreak] = useState(false);

  const fetchData = async () => {
    try {
      const [schedRes, profileRes] = await Promise.all([
        axios.get('/api/v1/doctors/me/schedules', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/v1/doctors/me/profile', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setSchedules(schedRes.data.data.schedules || []);
      setBreaks(schedRes.data.data.breaks || []);
      const affs = profileRes.data.data.affiliations || [];
      setAffiliations(affs);
      if (affs.length > 0) {
        setHospitalId(affs[0].hospitalId);
        setBreakHospitalId(affs[0].hospitalId);
      }
    } catch {
      // defaults
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError(null);
    setSavingSchedule(true);
    try {
      await axios.post(
        '/api/v1/doctors/me/schedules',
        {
          hospitalId,
          dayOfWeek,
          startTime,
          endTime,
          slotDurationMinutes: Number(slotDuration),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setScheduleModalOpen(false);
      fetchData();
    } catch (err: any) {
      setScheduleError(err.response?.data?.error?.message || 'Failed to create schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Remove this schedule block?')) return;
    try {
      await axios.delete(`/api/v1/doctors/me/schedules/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Delete failed');
    }
  };

  const handleCreateBreak = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBreak(true);
    try {
      await axios.post(
        '/api/v1/doctors/me/breaks',
        {
          hospitalId: breakHospitalId,
          dayOfWeek: breakDay,
          startTime: breakStartTime,
          endTime: breakEndTime,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBreakModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to add break');
    } finally {
      setSavingBreak(false);
    }
  };

  const handleDeleteBreak = async (id: string) => {
    if (!confirm('Remove this break period?')) return;
    try {
      await axios.delete(`/api/v1/doctors/me/breaks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Delete failed');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ minWidth: '220px', flex: '1 1 auto' }}>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Doctor Schedule & Shift Setup</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Configure recurring working hours, slot lengths, and break intervals across partner hospitals.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Coffee size={15} />}
            onClick={() => setBreakModalOpen(true)}
          >
            Add Break
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => setScheduleModalOpen(true)}
          >
            Add Working Hours
          </Button>
        </div>
      </div>

      {/* Weekly Schedule Overview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '2rem' }}>
        {DAYS.map((day) => {
          const daySchedules = schedules.filter((s) => s.dayOfWeek === day);
          const dayBreaks = breaks.filter((b) => b.dayOfWeek === day);

          return (
            <Card key={day}>
              <Card.Body style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ minWidth: '110px', flexShrink: 0 }}>
                    <strong style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>{day}</strong>
                    <div style={{ fontSize: '0.75rem', color: daySchedules.length === 0 ? 'var(--text-muted)' : 'var(--color-primary-600)', fontWeight: 600 }}>
                      {daySchedules.length === 0 ? 'Off Duty' : `${daySchedules.length} Shift(s)`}
                    </div>
                  </div>

                  <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }}>
                    {daySchedules.length === 0 ? (
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No working hours scheduled.</span>
                    ) : (
                      daySchedules.map((sched) => (
                        <div
                          key={sched.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--color-primary-50)',
                            border: '1px solid var(--color-primary-200)',
                            gap: '0.5rem',
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <span style={{ fontWeight: 700, color: 'var(--color-primary-900)' }}>
                              {sched.startTime} - {sched.endTime}
                            </span>
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--color-primary-700)' }}>
                              ({sched.slotDurationMinutes} min slots) • {sched.hospital?.name}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteSchedule(sched.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--color-danger-600)', cursor: 'pointer' }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}

                    {/* Breaks on this day */}
                    {dayBreaks.map((b) => (
                      <div
                        key={b.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.375rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-warning-50)',
                          border: '1px solid var(--color-warning-100)',
                          fontSize: '0.8125rem',
                        }}
                      >
                        <span style={{ color: 'var(--color-warning-800)', fontWeight: 600 }}>
                          ☕ Break: {b.startTime} - {b.endTime} ({b.hospital?.name})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteBreak(b.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-danger-600)', cursor: 'pointer' }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card.Body>
            </Card>
          );
        })}
      </div>

      {/* Add Working Hours Modal */}
      <Modal isOpen={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} title="Add Working Hours">
        <form onSubmit={handleCreateSchedule}>
          {scheduleError && (
            <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-danger-50)', color: 'var(--color-danger-700)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
              {scheduleError}
            </div>
          )}

          <div className="hs-input-group">
            <label className="hs-label">Hospital / Clinic Location</label>
            <select className="hs-input" value={hospitalId} onChange={(e) => setHospitalId(e.target.value)}>
              {affiliations.map((aff) => (
                <option key={aff.hospitalId} value={aff.hospitalId}>
                  {aff.hospital?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="hs-input-group">
            <label className="hs-label">Day of Week</label>
            <select className="hs-input" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
              {DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="hs-input-group">
              <label className="hs-label">Start Time</label>
              <input type="time" className="hs-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div className="hs-input-group">
              <label className="hs-label">End Time</label>
              <input type="time" className="hs-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>
          </div>

          <div className="hs-input-group">
            <label className="hs-label">Slot Duration</label>
            <select className="hs-input" value={slotDuration} onChange={(e) => setSlotDuration(Number(e.target.value))}>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes (Standard)</option>
              <option value={20}>20 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="outline" type="button" onClick={() => setScheduleModalOpen(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={savingSchedule} style={{ flex: 1 }}>
              Save Schedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Break Modal */}
      <Modal isOpen={breakModalOpen} onClose={() => setBreakModalOpen(false)} title="Add Break Period">
        <form onSubmit={handleCreateBreak}>
          <div className="hs-input-group">
            <label className="hs-label">Hospital Location</label>
            <select className="hs-input" value={breakHospitalId} onChange={(e) => setBreakHospitalId(e.target.value)}>
              {affiliations.map((aff) => (
                <option key={aff.hospitalId} value={aff.hospitalId}>{aff.hospital?.name}</option>
              ))}
            </select>
          </div>

          <div className="hs-input-group">
            <label className="hs-label">Day of Week</label>
            <select className="hs-input" value={breakDay} onChange={(e) => setBreakDay(e.target.value)}>
              {DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="hs-input-group">
              <label className="hs-label">Break Start</label>
              <input type="time" className="hs-input" value={breakStartTime} onChange={(e) => setBreakStartTime(e.target.value)} required />
            </div>
            <div className="hs-input-group">
              <label className="hs-label">Break End</label>
              <input type="time" className="hs-input" value={breakEndTime} onChange={(e) => setBreakEndTime(e.target.value)} required />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="outline" type="button" onClick={() => setBreakModalOpen(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={savingBreak} style={{ flex: 1 }}>
              Save Break
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ScheduleManagementPage;
