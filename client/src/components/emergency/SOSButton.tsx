import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Siren, AlertOctagon, MapPin, Radio } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { playEmergencySiren } from '../../utils/audioAlert';

export const SOSButton: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [loading, setLoading] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredRef = useRef(false);

  // Helper to fetch live GPS with timeout promise
  const getPreciseGps = (): Promise<{ latitude: number; longitude: number; accuracy?: number }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ latitude: 18.5204, longitude: 73.8567 });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setGpsLocation(coords);
          resolve(coords);
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          resolve({ latitude: 18.5204, longitude: 73.8567 });
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    });
  };

  // Acquire high-accuracy GPS coordinates as soon as modal opens
  useEffect(() => {
    if (isOpen) {
      getPreciseGps();
    }
  }, [isOpen]);

  // 5-Second Countdown Auto-Confirm Timer
  useEffect(() => {
    if (isOpen) {
      hasTriggeredRef.current = false;
      setCountdown(5);

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            // Automatic trigger after 5 seconds
            if (!hasTriggeredRef.current) {
              hasTriggeredRef.current = true;
              executeDispatch();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  const handleOpenModal = () => {
    setIsOpen(true);
    getPreciseGps();
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    hasTriggeredRef.current = true;
    setIsOpen(false);
    setLoading(false);
  };

  const executeDispatch = async (manualLoc?: { latitude: number; longitude: number; accuracy?: number }) => {
    setLoading(true);
    playEmergencySiren(2);

    let loc = manualLoc || gpsLocation;
    if (!loc) {
      loc = await getPreciseGps();
    }

    try {
      const res = await axios.post(
        '/api/v1/emergencies/trigger',
        {
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const emergencyId = res.data.data.id;
      setIsOpen(false);
      setLoading(false);
      navigate(`/patient/emergency/${emergencyId}`);
    } catch (err) {
      console.error('Failed to trigger emergency SOS:', err);
      setIsOpen(false);
      setLoading(false);
      navigate('/patient/home');
    }
  };

  const handleManualConfirm = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    hasTriggeredRef.current = true;
    executeDispatch();
  };

  return (
    <>
      {/* Floating Pulsing Emergency SOS Trigger Button */}
      <button
        type="button"
        data-sos-button
        onClick={handleOpenModal}
        className="animate-sos-pulse"
        style={{
          position: 'fixed',
          bottom: '5.25rem',
          right: '1.25rem',
          zIndex: 40,
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#DC2626',
          color: '#FFFFFF',
          border: '3px solid #FFFFFF',
          boxShadow: '0 10px 25px rgba(220, 38, 38, 0.6), 0 0 20px rgba(220, 38, 38, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        aria-label="Emergency SOS"
        title="Trigger Emergency SOS"
      >
        <Siren size={24} />
        <span style={{ fontSize: '0.625rem', fontWeight: 900, letterSpacing: '0.05em', marginTop: '2px' }}>
          SOS
        </span>
      </button>

      {/* High-Priority 5-Second Countdown Auto-Confirm Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '2px solid #EF4444',
              width: '100%',
              maxWidth: '440px',
              padding: '2rem 1.5rem',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(220, 38, 38, 0.35)',
              color: '#0F172A',
              animation: 'scaleIn 0.2s ease',
            }}
          >
            {/* Siren Icon with Ring */}
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
                boxShadow: '0 0 30px rgba(220, 38, 38, 0.3)',
              }}
              className="animate-pulse"
            >
              <AlertOctagon size={42} />
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid #FECACA',
                borderRadius: '9999px',
                padding: '3px 10px',
                fontSize: '0.6875rem',
                fontWeight: 800,
                marginBottom: '0.5rem',
              }}
            >
              <Radio size={12} className="animate-pulse" />
              <span>LIVE GPS TRANSMISSION READY</span>
            </div>

            <h2 style={{ fontSize: '1.375rem', fontWeight: 900, margin: '0 0 0.5rem 0', color: '#991B1B' }}>
              Confirm Emergency SOS?
            </h2>

            <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0 0 1.5rem 0', lineHeight: 1.4 }}>
              Auto-dispatching in <strong style={{ color: '#DC2626' }}>{countdown} seconds</strong>. Your live GPS coordinates will be transmitted directly to the hospital reception desk and ambulance dispatch.
            </p>

            {/* Circular Countdown Display */}
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                border: '4px solid #FEE2E2',
                borderTopColor: '#DC2626',
                borderRightColor: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto',
                animation: 'spin 5s linear infinite',
              }}
            >
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: '#DC2626',
                  fontFamily: 'monospace',
                }}
              >
                {countdown}
              </div>
            </div>

            {/* Location indicator */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.75rem',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
                marginBottom: '1.5rem',
              }}
            >
              <MapPin size={14} color="#16A34A" />
              <span>
                GPS: {gpsLocation ? `${gpsLocation.latitude.toFixed(4)}, ${gpsLocation.longitude.toFixed(4)}` : 'Detecting GPS satellites...'}
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  color: '#64748B',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Cancel (False Alarm)
              </button>

              <button
                type="button"
                onClick={handleManualConfirm}
                disabled={loading}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#DC2626',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem',
                }}
              >
                <Siren size={16} />
                <span>{loading ? 'Transmitting...' : 'DISPATCH NOW'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SOSButton;
