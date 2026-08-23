import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Siren } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export const SOSButton: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isTriggered, setIsTriggered] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && !isTriggered && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isOpen && !isTriggered && countdown === 0) {
      handleTriggerEmergency();
    }
    return () => clearInterval(timer);
  }, [isOpen, countdown, isTriggered]);

  const handleOpen = () => {
    setCountdown(5);
    setIsTriggered(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsTriggered(false);
  };

  const triggerApi = async (latitude: number, longitude: number, accuracy?: number) => {
    setLoading(true);
    try {
      const res = await axios.post(
        '/api/v1/emergencies/trigger',
        { latitude, longitude, accuracy },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const emergencyId = res.data.data.id;
      setIsOpen(false);
      navigate(`/patient/emergency/${emergencyId}`);
    } catch {
      // Fallback
      setIsTriggered(true);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerEmergency = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          triggerApi(position.coords.latitude, position.coords.longitude, position.coords.accuracy);
        },
        () => {
          // Default to central coordinates if permission denied
          triggerApi(18.5204, 73.8567);
        }
      );
    } else {
      triggerApi(18.5204, 73.8567);
    }
  };

  return (
    <>
      {/* Floating Pulsing SOS Button */}
      <button
        type="button"
        onClick={handleOpen}
        className="animate-sos-pulse"
        style={{
          position: 'fixed',
          bottom: '5rem',
          right: '1.25rem',
          zIndex: 40,
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-danger-600)',
          color: '#FFFFFF',
          border: '3px solid #FFFFFF',
          boxShadow: 'var(--shadow-sos)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform var(--transition-fast)',
        }}
        aria-label="Emergency SOS"
      >
        <Siren size={24} />
        <span style={{ fontSize: '0.625rem', fontWeight: 800, letterSpacing: '0.05em' }}>SOS</span>
      </button>

      {/* Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={handleClose} size="sm">
        <div style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-danger-50)',
              color: 'var(--color-danger-600)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <AlertCircle size={36} />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
            Trigger Emergency SOS?
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            This will transmit your live GPS coordinates, alert the nearest hospital, and request ambulance dispatch.
          </p>

          <div
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              color: 'var(--color-danger-600)',
              marginBottom: '1.5rem',
            }}
          >
            {countdown}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="outline" onClick={handleClose} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={loading} onClick={handleTriggerEmergency} style={{ flex: 1 }}>
              Confirm SOS
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SOSButton;
