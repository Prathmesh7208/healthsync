import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Phone,
  Siren,
  ArrowRight,
  Navigation,
  AlertTriangle,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Badge from '../../components/ui/Badge';
import LiveAmbulanceRadarMap from '../../components/emergency/LiveAmbulanceRadarMap';

const LIFECYCLE_STEPS = [
  { status: 'AMBULANCE_ASSIGNED', label: 'Unit Assigned', nextAction: 'Start Driving to Patient', nextStatus: 'AMBULANCE_EN_ROUTE' },
  { status: 'AMBULANCE_EN_ROUTE', label: 'En Route to Patient', nextAction: 'Arrived at Patient', nextStatus: 'ARRIVED_AT_PATIENT' },
  { status: 'ARRIVED_AT_PATIENT', label: 'At Patient Location', nextAction: 'Patient Picked Up', nextStatus: 'PATIENT_PICKED_UP' },
  { status: 'PATIENT_PICKED_UP', label: 'Patient Secured', nextAction: 'En Route to Hospital ER', nextStatus: 'EN_ROUTE_TO_HOSPITAL' },
  { status: 'EN_ROUTE_TO_HOSPITAL', label: 'En Route to Hospital', nextAction: 'Arrived at Hospital ER', nextStatus: 'ARRIVED_AT_HOSPITAL' },
  { status: 'ARRIVED_AT_HOSPITAL', label: 'At Hospital ER', nextAction: 'Handover Complete — Close Run', nextStatus: 'RESOLVED' },
];

export const ActiveEmergencyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [emergency, setEmergency] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchEmergency = async () => {
    try {
      const res = await axios.get(`/api/v1/ambulance/emergencies/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmergency(res.data.data);
    } catch {
      // defaults
    } finally {
      setLoading(false);
    }
  };

  // GPS Watcher & Location Broadcaster
  useEffect(() => {
    let watchId: number;

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude, speed, heading } = pos.coords;

          try {
            await axios.post(
              '/api/v1/ambulance/me/location',
              { latitude, longitude, speed, heading, emergencyId: id },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch {
            // ignore network glitch
          }
        },
        (err) => console.warn('Ambulance GPS watch error:', err),
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    }

    return () => {
      if (watchId && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [id, token]);

  useEffect(() => {
    if (id && token) fetchEmergency();
  }, [id, token]);

  const currentStep = LIFECYCLE_STEPS.find((s) => s.status === emergency?.status) || LIFECYCLE_STEPS[0];

  const handleAdvanceStatus = async () => {
    if (!currentStep.nextStatus) return;

    if (currentStep.nextStatus === 'RESOLVED') {
      if (!confirm('Complete handover and conclude this emergency run?')) return;
    }

    setUpdating(true);
    try {
      await axios.put(
        `/api/v1/ambulance/emergencies/${id}/status`,
        { status: currentStep.nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (currentStep.nextStatus === 'RESOLVED') {
        alert('Emergency run concluded successfully!');
        navigate('/ambulance/dashboard');
      } else {
        fetchEmergency();
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Status transition failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !emergency) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <p style={{ color: '#94A3B8' }}>Loading Emergency Navigation...</p>
      </div>
    );
  }

  const patient = emergency.patient;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
      {/* Top Banner with ETA and Status */}
      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #334155',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Siren size={20} color="#EF4444" className="animate-sos-pulse" />
            <span style={{ fontWeight: 800, color: '#EF4444', fontSize: '0.875rem' }}>{emergency.emergencyId}</span>
          </div>
          <Badge variant="danger">{emergency.status}</Badge>
        </div>

        {/* Live Route HUD Display */}
        <div
          style={{
            backgroundColor: '#0F172A',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>DESTINATION</span>
            <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Navigation size={18} />
              <span>
                {['ARRIVED_AT_PATIENT', 'PATIENT_PICKED_UP', 'EN_ROUTE_TO_HOSPITAL'].includes(emergency.status)
                  ? emergency.hospital?.name || 'Hospital ER'
                  : 'Patient GPS Location'}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>ESTIMATED ETA</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4ADE80' }}>4 - 7 mins</div>
          </div>
        </div>
      </div>

      {/* Live Interactive GPS Ambulance Radar Map */}
      <LiveAmbulanceRadarMap
        emergencyId={emergency.id}
        patientLocation={{
          latitude: Number(emergency.latitude || 18.5204),
          longitude: Number(emergency.longitude || 73.8567),
        }}
        initialAmbulanceLocation={
          emergency.ambulanceOperator?.currentLatitude
            ? {
                latitude: Number(emergency.ambulanceOperator.currentLatitude),
                longitude: Number(emergency.ambulanceOperator.currentLongitude),
              }
            : undefined
        }
        hospitalLocation={
          emergency.hospital
            ? {
                latitude: Number(emergency.hospital.latitude || 18.5308),
                longitude: Number(emergency.hospital.longitude || 73.8742),
                name: emergency.hospital.name,
              }
            : undefined
        }
        vehicleNumber={emergency.ambulanceOperator?.vehicleNumber || 'MH-12-EM-108'}
        driverPhone={emergency.ambulanceOperator?.user?.phone || '+919844400001'}
        status={emergency.status}
      />

      {/* Patient Triage & Vitals Card */}
      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #334155',
          padding: '1.25rem',
        }}
      >
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0 0 0.75rem 0', color: '#FFFFFF' }}>
          Patient Emergency Profile
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{patient?.fullName || 'Emergency Patient'}</div>
              <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                Gender: {patient?.gender || 'N/A'} • Blood Group: <strong style={{ color: '#EF4444' }}>{patient?.bloodGroup || 'UNKNOWN'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${Number(emergency.latitude || emergency.initialLatitude || 18.5204)},${Number(emergency.longitude || emergency.initialLongitude || 73.8567)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.875rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                }}
              >
                <Navigation size={14} />
                <span>Navigate (Google Maps)</span>
              </a>

              {patient?.emergencyContactPhone && (
                <a
                  href={`tel:${patient.emergencyContactPhone}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem 0.875rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: '#22C55E',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                  }}
                >
                  <Phone size={14} />
                  <span>Call SOS Contact</span>
                </a>
              )}
            </div>
          </div>

          {/* Allergies Alert */}
          {patient?.knownAllergies && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.625rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#FCA5A5',
                fontSize: '0.8125rem',
              }}
            >
              <AlertTriangle size={16} color="#EF4444" />
              <span><strong>ALLERGIES:</strong> {patient.knownAllergies}</span>
            </div>
          )}
        </div>
      </div>

      {/* Big Action Lifecycle Advancement Button */}
      <div
        style={{
          position: 'sticky',
          bottom: '4rem',
          zIndex: 20,
          backgroundColor: '#0F172A',
          padding: '0.5rem 0',
        }}
      >
        <button
          type="button"
          onClick={handleAdvanceStatus}
          disabled={updating}
          style={{
            width: '100%',
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#EF4444',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '1.125rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.5)',
          }}
        >
          <span>{currentStep.nextAction}</span>
          <ArrowRight size={22} />
        </button>
      </div>
    </div>
  );
};

export default ActiveEmergencyPage;
