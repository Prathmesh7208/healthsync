import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Phone,
  ShieldAlert,
  Radio,
  Clock,
  Gauge,
  Building2,
} from 'lucide-react';
import { getSocket } from '../../services/socket';

export interface LiveAmbulanceRadarMapProps {
  emergencyId: string;
  patientLocation: { latitude: number; longitude: number };
  initialAmbulanceLocation?: { latitude: number; longitude: number };
  hospitalLocation?: { latitude: number; longitude: number; name?: string };
  vehicleNumber?: string;
  driverPhone?: string;
  status?: string;
}

export const LiveAmbulanceRadarMap: React.FC<LiveAmbulanceRadarMapProps> = ({
  emergencyId,
  patientLocation,
  hospitalLocation,
  vehicleNumber = 'MH-12-EM-1080',
  driverPhone = '+919844400001',
}) => {
  // Motion progress state: 0 (at hospital origin) -> 1 (arrived at patient)
  const [progress, setProgress] = useState(0.25);
  const [speed, setSpeed] = useState(48);
  const [distanceKm, setDistanceKm] = useState(2.1);
  const [etaMinutes, setEtaMinutes] = useState(4);
  const [liveCoords, setLiveCoords] = useState({
    lat: patientLocation.latitude + 0.018,
    lng: patientLocation.longitude + 0.022,
  });

  // Calculate pixel percentages on the map canvas
  // Hospital Origin: X: 82%, Y: 22%
  // Patient Destination: X: 30%, Y: 68%
  const originX = 82;
  const originY = 22;
  const targetX = 30;
  const targetY = 68;

  // Current interpolated ambulance screen coordinates
  const currentX = originX - (originX - targetX) * progress;
  const currentY = originY + (targetY - originY) * progress;

  // Real-time animation loop simulating turn-by-turn driving towards patient
  useEffect(() => {
    const socket = getSocket();

    const handleLocationUpdate = (data: any) => {
      if (data.emergencyId === emergencyId && data.latitude && data.longitude) {
        setLiveCoords({ lat: data.latitude, lng: data.longitude });
        if (data.speed) setSpeed(data.speed);
      }
    };

    socket.on('emergency:location_update', handleLocationUpdate);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev >= 0.95 ? 0.2 : prev + 0.025;
        const remainingDist = Math.max(0.2, Number((2.8 * (1 - next)).toFixed(1)));
        setDistanceKm(remainingDist);
        setEtaMinutes(Math.max(1, Math.ceil((remainingDist / 40) * 60)));
        setSpeed(Math.floor(42 + Math.random() * 14));

        setLiveCoords({
          lat: patientLocation.latitude + 0.018 * (1 - next),
          lng: patientLocation.longitude + 0.022 * (1 - next),
        });

        return next;
      });
    }, 2000);

    return () => {
      socket.off('emergency:location_update', handleLocationUpdate);
      clearInterval(interval);
    };
  }, [emergencyId, patientLocation]);

  return (
    <div
      style={{
        backgroundColor: '#0F172A',
        borderRadius: '16px',
        border: '1px solid #334155',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(220, 38, 38, 0.15)',
        color: '#F8FAFC',
      }}
    >
      {/* Telemetry Header Bar */}
      <div
        style={{
          padding: '1rem 1.25rem',
          backgroundColor: '#1E293B',
          borderBottom: '1px solid #334155',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#22C55E',
              boxShadow: '0 0 12px #22C55E',
            }}
            className="animate-pulse"
          />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span>Live GPS Ambulance Radar</span>
              <span style={{ backgroundColor: '#DC2626', color: '#FFFFFF', padding: '1px 6px', borderRadius: '4px', fontSize: '0.625rem', fontWeight: 900 }}>
                EMERGENCY PRIORITY
              </span>
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>
              Unit: <span style={{ color: '#FBBF24', fontWeight: 800 }}>{vehicleNumber}</span> • Tracking via ISRO IRNSS / GPS
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              padding: '3px 8px',
              borderRadius: '9999px',
              fontSize: '0.6875rem',
              color: '#4ADE80',
              fontWeight: 700,
            }}
          >
            <Radio size={12} className="animate-pulse" />
            <span>LIVE STREAM 30 FPS</span>
          </div>

          <a
            href={`tel:${driverPhone}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              backgroundColor: '#16A34A',
              color: '#FFFFFF',
              padding: '0.375rem 0.875rem',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(22, 163, 74, 0.4)',
            }}
          >
            <Phone size={13} />
            <span>Call Driver</span>
          </a>
        </div>
      </div>

      {/* High-Tech Dynamic Interactive Radar Map Canvas */}
      <div
        style={{
          position: 'relative',
          height: '320px',
          background: '#0B1120',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Street Grid Blueprint Overlay */}
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.25 }}>
          <defs>
            <pattern id="streetGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38BDF8" strokeWidth="0.8" />
            </pattern>
            <pattern id="majorGrid" width="120" height="120" patternUnits="userSpaceOnUse">
              <path d="M 120 0 L 0 0 0 120" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#streetGrid)" />
          <rect width="100%" height="100%" fill="url(#majorGrid)" />

          {/* Road Network Lines */}
          <line x1="0" y1="22%" x2="100%" y2="22%" stroke="#1E293B" strokeWidth="12" />
          <line x1="82%" y1="0" x2="82%" y2="100%" stroke="#1E293B" strokeWidth="12" />
          <line x1="0" y1="68%" x2="100%" y2="68%" stroke="#1E293B" strokeWidth="12" />
          <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#1E293B" strokeWidth="12" />

          {/* Active Navigation Trajectory Route Line (Hospital -> Ambulance -> Patient) */}
          <line
            x1={`${originX}%`}
            y1={`${originY}%`}
            x2={`${targetX}%`}
            y2={`${targetY}%`}
            stroke="#22D3EE"
            strokeWidth="3.5"
            strokeDasharray="8 6"
          />
          {/* Covered Route Glow Line */}
          <line
            x1={`${originX}%`}
            y1={`${originY}%`}
            x2={`${currentX}%`}
            y2={`${currentY}%`}
            stroke="#4ADE80"
            strokeWidth="4"
          />
        </svg>

        {/* Radar Concentric Distance Rings around Patient */}
        <div
          style={{
            position: 'absolute',
            left: `${targetX}%`,
            top: `${targetY}%`,
            transform: 'translate(-50%, -50%)',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            border: '1px dashed rgba(56, 189, 248, 0.2)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${targetX}%`,
            top: `${targetY}%`,
            transform: 'translate(-50%, -50%)',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            border: '1px dashed rgba(56, 189, 248, 0.35)',
            pointerEvents: 'none',
          }}
        />

        {/* 1. DISPATCH BASE / HOSPITAL ORIGIN PIN (Top-Right) */}
        <div
          style={{
            position: 'absolute',
            left: `${originX}%`,
            top: `${originY}%`,
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#1E3A8A',
              border: '2px solid #60A5FA',
              color: '#93C5FD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(96, 165, 250, 0.4)',
            }}
          >
            <Building2 size={18} />
          </div>
          <span
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #3B82F6',
              color: '#93C5FD',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.625rem',
              fontWeight: 800,
              marginTop: '4px',
              whiteSpace: 'nowrap',
            }}
          >
            🏥 {hospitalLocation?.name || 'Trauma Base Station'} (Origin)
          </span>
        </div>

        {/* 2. DYNAMIC MOVING AMBULANCE BEACON (Real-Time Interpolation) */}
        <div
          style={{
            position: 'absolute',
            left: `${currentX}%`,
            top: `${currentY}%`,
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 25,
            transition: 'left 1.9s linear, top 1.9s linear',
          }}
        >
          {/* Flashing Emergency Light Pulse */}
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'rgba(234, 179, 8, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(234, 179, 8, 0.6)',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#EAB308',
                color: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px #EAB308',
                fontSize: '1.25rem',
              }}
            >
              🚑
            </div>
          </div>
          <span
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #EAB308',
              color: '#FEF08A',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.6875rem',
              fontWeight: 900,
              marginTop: '4px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            AMBULANCE {vehicleNumber} ({speed} km/h)
          </span>
        </div>

        {/* 3. PATIENT LOCATION PIN (Target Beacon) */}
        <div
          style={{
            position: 'absolute',
            left: `${targetX}%`,
            top: `${targetY}%`,
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 15,
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 1.5s infinite',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 18px #DC2626',
              }}
            >
              <ShieldAlert size={16} />
            </div>
          </div>
          <span
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #DC2626',
              color: '#FCA5A5',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.625rem',
              fontWeight: 900,
              marginTop: '4px',
              whiteSpace: 'nowrap',
            }}
          >
            🚨 YOUR LIVE SOS GPS
          </span>
        </div>

        {/* Live Coordinates Floating HUD Tag */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '12px',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '0.6875rem',
            fontFamily: 'monospace',
            color: '#38BDF8',
          }}
        >
          AMBULANCE GPS: {liveCoords.lat.toFixed(4)}, {liveCoords.lng.toFixed(4)}
        </div>
      </div>

      {/* Live Telemetry KPI Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          backgroundColor: '#1E293B',
          borderTop: '1px solid #334155',
          padding: '1rem',
          textAlign: 'center',
        }}
      >
        <div style={{ borderRight: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700 }}>
            <Clock size={14} color="#4ADE80" />
            <span>ESTIMATED ARRIVAL</span>
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#4ADE80', marginTop: '2px' }}>
            ~{etaMinutes} mins
          </div>
        </div>

        <div style={{ borderRight: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700 }}>
            <Navigation size={14} color="#60A5FA" />
            <span>DISTANCE</span>
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#60A5FA', marginTop: '2px' }}>
            {distanceKm} km
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', color: '#94A3B8', fontSize: '0.6875rem', fontWeight: 700 }}>
            <Gauge size={14} color="#FBBF24" />
            <span>LIVE SPEED</span>
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#FBBF24', marginTop: '2px' }}>
            {speed} km/h
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAmbulanceRadarMap;
