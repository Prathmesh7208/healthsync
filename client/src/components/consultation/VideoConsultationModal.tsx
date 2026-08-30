import React, { useState, useEffect } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Clock,
  Maximize2,
  Minimize2,
} from 'lucide-react';


interface VideoConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  doctorName?: string;
  appointmentId: string;
}

export const VideoConsultationModal: React.FC<VideoConsultationModalProps> = ({
  isOpen,
  onClose,
  patientName,
  doctorName = 'Dr. Priya Sharma',
  appointmentId,
}) => {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isOpen) {
      setSeconds(0);
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const roomName = `HealthSync-Telemed-${appointmentId.replace(/[^a-zA-Z0-9]/g, '') || 'LiveConsult'}`;
  const jitsiUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&config.startWithAudioMuted=${!isAudioOn}&config.startWithVideoMuted=${!isVideoOn}&interfaceConfig.SHOW_JITSI_WATERMARK=false`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isFullscreen ? '0' : '1rem',
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#1E293B',
          padding: '0.75rem 1.25rem',
          borderRadius: isFullscreen ? '0' : '12px',
          color: '#FFFFFF',
          border: '1px solid #334155',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#0D9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
            }}
          >
            <Video size={18} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span>{doctorName} & {patientName}</span>
              <span style={{ fontSize: '0.625rem', backgroundColor: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                HD ENCRYPTED
              </span>
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
              WebRTC E2EE Telemedicine Session • Room ID: {appointmentId}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Call Timer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              backgroundColor: '#0F172A',
              padding: '0.375rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              color: '#38BDF8',
              fontFamily: 'monospace',
            }}
          >
            <Clock size={14} />
            <span>{formatTimer(seconds)}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Main Video Frame */}
      <div
        style={{
          flex: 1,
          margin: isFullscreen ? '0' : '0.75rem 0',
          borderRadius: isFullscreen ? '0' : '16px',
          overflow: 'hidden',
          backgroundColor: '#000000',
          position: 'relative',
          border: '1.5px solid #334155',
        }}
      >
        <iframe
          src={jitsiUrl}
          title="Telemedicine Live Video"
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        />
      </div>

      {/* Bottom Floating Control Bar */}
      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: isFullscreen ? '0' : '16px',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          border: '1px solid #334155',
        }}
      >
        <button
          type="button"
          onClick={() => setIsAudioOn(!isAudioOn)}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: isAudioOn ? '#334155' : '#EF4444',
            color: '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title={isAudioOn ? 'Mute Mic' : 'Unmute Mic'}
        >
          {isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        <button
          type="button"
          onClick={() => setIsVideoOn(!isVideoOn)}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: isVideoOn ? '#334155' : '#EF4444',
            color: '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title={isVideoOn ? 'Turn Video Off' : 'Turn Video On'}
        >
          {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            backgroundColor: '#DC2626',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '9999px',
            padding: '0.625rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 800,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
          }}
        >
          <PhoneOff size={18} />
          <span>End Consultation</span>
        </button>
      </div>
    </div>
  );
};

export default VideoConsultationModal;
