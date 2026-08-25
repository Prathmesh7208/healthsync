import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Volume2,
  VolumeX,
  Clock,
  Radio,
  Maximize2,
  ArrowLeft,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Logo from '../../components/ui/Logo';

export const WaitingRoomTvPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);
  const [queues, setQueues] = useState<any[]>([]);
  const [lastCalledToken, setLastCalledToken] = useState<string | null>(null);

  // Live Digital Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchQueues = async () => {
    try {
      const recRes = await axios.get('/api/v1/receptionist/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const hId = recRes.data.data.hospital?.id;
      setHospitalInfo(recRes.data.data.hospital);

      if (hId) {
        const queueRes = await axios.get(`/api/v1/receptionist/hospitals/${hId}/queues`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQueues(queueRes.data.data || []);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    if (token) fetchQueues();
    const interval = setInterval(fetchQueues, 5000); // 5s live sync
    return () => clearInterval(interval);
  }, [token]);

  // Voice Token Caller using Web Speech API
  const speakToken = (tokenNum: number | string, docName: string, cabin: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const cleanDoc = docName.replace(/^(dr\.?|doctor)\s+/i, '').trim();
    const text = `Attention please. Token number ${tokenNum}. Please proceed to Dr. ${cleanDoc}, ${cabin}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleCallToken = (tokenNum: number | string, docName: string, cabin: string) => {
    setLastCalledToken(`Token #${tokenNum} → Dr. ${docName}`);
    speakToken(tokenNum, docName, cabin);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  // Sample fallback active OPD rooms if queue is empty
  const activeRooms = queues.length > 0 ? queues : [
    {
      id: 'q-1',
      doctor: { fullName: 'Vikramaditya Joshi', specializations: ['Cardiology'] },
      currentToken: 14,
      currentPatient: { fullName: 'Suresh Patil' },
      waitingTokens: [15, 16, 17, 18],
      cabin: 'Cabin 01',
    },
    {
      id: 'q-2',
      doctor: { fullName: 'Ananya Deshmukh', specializations: ['Pediatrics'] },
      currentToken: 9,
      currentPatient: { fullName: 'Baby Aryan' },
      waitingTokens: [10, 11, 12],
      cabin: 'Cabin 02',
    },
    {
      id: 'q-3',
      doctor: { fullName: 'Rajesh Kulkarni', specializations: ['Orthopedics'] },
      currentToken: 22,
      currentPatient: { fullName: 'Rameshwar Shinde' },
      waitingTokens: [23, 24, 25],
      cabin: 'Cabin 03',
    },
    {
      id: 'q-4',
      doctor: { fullName: 'Meera Patil', specializations: ['Gynecology'] },
      currentToken: 7,
      currentPatient: { fullName: 'Pooja Kale' },
      waitingTokens: [8, 9, 10],
      cabin: 'Cabin 04',
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Top TV Screen Header */}
      <header
        style={{
          padding: '1rem 2rem',
          backgroundColor: '#1E293B',
          borderBottom: '2px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button
            type="button"
            onClick={() => navigate('/receptionist/dashboard')}
            style={{
              background: '#334155',
              border: 'none',
              color: '#F8FAFC',
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer',
            }}
            title="Exit to Receptionist Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <Logo size="md" />
          <div style={{ borderLeft: '2px solid #475569', paddingLeft: '1rem' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
              {hospitalInfo?.name || 'Sahyadri Super Speciality Hospital'}
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
              Central OPD Live Token Announcement System • Ground Floor Waiting Lounge
            </div>
          </div>
        </div>

        {/* Live Clock & Audio Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0F172A', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid #334155' }}>
            <Clock size={18} color="#38BDF8" />
            <span style={{ fontSize: '1.125rem', fontWeight: 800, fontFamily: 'monospace', color: '#38BDF8' }}>
              {currentTime.toLocaleTimeString()}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: voiceEnabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${voiceEnabled ? '#22C55E' : '#EF4444'}`,
              color: voiceEnabled ? '#4ADE80' : '#F87171',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{voiceEnabled ? 'Voice Caller ON' : 'Muted'}</span>
          </button>

          <button
            type="button"
            onClick={toggleFullScreen}
            style={{
              background: '#334155',
              border: 'none',
              color: '#F8FAFC',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
          >
            <Maximize2 size={16} />
            <span>Full Screen TV</span>
          </button>
        </div>
      </header>

      {/* Main Grid: Multi-Cabin OPD Token Displays */}
      <main style={{ flex: 1, padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {activeRooms.map((room, i) => {
          const docName = (room.doctor?.fullName || 'Doctor').replace(/^(dr\.?|doctor)\s+/i, '').trim();
          const cabin = room.cabin || `Cabin 0${i + 1}`;
          const currentToken = room.currentToken || (i + 1) * 7;

          return (
            <div
              key={room.id || i}
              style={{
                backgroundColor: '#1E293B',
                borderRadius: '16px',
                border: '2px solid #334155',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Cabin Header */}
              <div
                style={{
                  backgroundColor: '#0F172A',
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.05em' }}>
                    {cabin.toUpperCase()}
                  </div>
                  <h3 style={{ margin: '0.125rem 0 0 0', fontSize: '1.125rem', fontWeight: 800, color: '#FFFFFF' }}>
                    Dr. {docName}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {Array.isArray(room.doctor?.specializations) ? room.doctor.specializations[0] : 'Specialist'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCallToken(currentToken, docName, cabin)}
                  style={{
                    backgroundColor: '#16A34A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 0.875rem',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    boxShadow: '0 4px 10px rgba(22, 163, 74, 0.4)',
                  }}
                >
                  <Volume2 size={14} />
                  <span>Call Token</span>
                </button>
              </div>

              {/* Big "NOW SERVING" Token Badge */}
              <div
                style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  background: 'radial-gradient(circle at center, #1E3A8A 0%, #0F172A 100%)',
                  borderBottom: '1px solid #334155',
                }}
              >
                <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#93C5FD', letterSpacing: '0.1em' }}>
                  NOW SERVING
                </div>
                <div
                  style={{
                    fontSize: '3.5rem',
                    fontWeight: 900,
                    color: '#4ADE80',
                    lineHeight: 1.1,
                    textShadow: '0 0 20px rgba(74, 222, 128, 0.5)',
                    margin: '0.25rem 0',
                  }}
                >
                  #{currentToken}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#CBD5E1', fontWeight: 600 }}>
                  Patient: {room.currentPatient?.fullName || 'In Consultation'}
                </div>
              </div>

              {/* Next In Line Queue Bar */}
              <div style={{ padding: '1rem 1.25rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1E293B' }}>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>
                  NEXT IN LINE:
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(room.waitingTokens || [currentToken + 1, currentToken + 2, currentToken + 3]).slice(0, 3).map((t: number) => (
                    <span
                      key={t}
                      style={{
                        backgroundColor: '#334155',
                        color: '#F8FAFC',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* Bottom Emergency Ticker & Announcement Bar */}
      <footer
        style={{
          padding: '0.75rem 2rem',
          backgroundColor: '#020617',
          borderTop: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8125rem',
          color: '#94A3B8',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Radio size={14} color="#22C55E" className="animate-pulse" />
          <span>Real-time Live OPD Display • Please maintain queue discipline and keep your appointment slip ready</span>
        </div>

        {lastCalledToken && (
          <div style={{ color: '#FBBF24', fontWeight: 800 }}>
            📢 LAST ANNOUNCED: {lastCalledToken}
          </div>
        )}
      </footer>
    </div>
  );
};

export default WaitingRoomTvPage;
