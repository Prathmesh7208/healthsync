import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Siren,
  Phone,
  Truck,
  Building2,
  ShieldCheck,
  Clock,
  ArrowLeft,
  User,
  Stethoscope,
  MapPin,
  Radio,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LiveAmbulanceRadarMap from '../../components/emergency/LiveAmbulanceRadarMap';

const STEPS = [
  { status: 'INITIATED', label: 'SOS Alert Transmitted' },
  { status: 'ACKNOWLEDGED', label: 'Hospital Emergency Desk Acknowledged' },
  { status: 'AMBULANCE_ASSIGNED', label: 'Ambulance Unit Dispatched' },
  { status: 'AMBULANCE_EN_ROUTE', label: 'Ambulance En Route to You' },
  { status: 'ARRIVED_AT_PATIENT', label: 'Ambulance Arrived at Your Location' },
  { status: 'PATIENT_PICKED_UP', label: 'Patient Secured in Ambulance' },
  { status: 'EN_ROUTE_TO_HOSPITAL', label: 'En Route to Hospital Emergency Room' },
  { status: 'ARRIVED_AT_HOSPITAL', label: 'Arrived at Hospital Emergency Desk' },
  { status: 'RESOLVED', label: 'Emergency Response Complete' },
];

export const EmergencyTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [emergency, setEmergency] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchTracking = async () => {
    try {
      const res = await axios.get(`/api/v1/emergencies/${id}/track`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmergency(res.data.data);
    } catch {
      // defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && token) fetchTracking();
    const interval = setInterval(fetchTracking, 4000); // 4s live polling for emergency tracking
    return () => clearInterval(interval);
  }, [id, token]);

  // Continuously stream patient's live GPS breadcrumbs to hospital reception and ambulance
  useEffect(() => {
    if (!id || !token) return;

    let watchId: number | null = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          axios
            .post(
              `/api/v1/emergencies/${id}/patient-location`,
              {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                speed: pos.coords.speed,
                heading: pos.coords.heading,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            )
            .catch(() => {});
        },
        (err) => console.warn('Live location watch error:', err),
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [id, token]);

  const handleCancelEmergency = async () => {
    setCancelling(true);
    try {
      await axios.put(
        `/api/v1/emergencies/${id}/cancel`,
        { reason: 'Cancelled by patient from tracking dashboard' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Emergency response cancelled');
      navigate('/patient/home');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  };

  if (loading || !emergency) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <Siren size={48} color="var(--color-danger-600)" className="animate-sos-pulse" />
        <h2 style={{ marginTop: '1rem', fontWeight: 800 }}>Connecting to Emergency Response Network...</h2>
      </div>
    );
  }

  const currentStepIdx = STEPS.findIndex((s) => s.status === emergency.status);
  const isCancelled = emergency.status === 'CANCELLED';

  return (
    <div className="container" style={{ maxWidth: '720px', padding: '1.5rem 1rem 4rem 1rem' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => navigate('/patient/home')}
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
          <span>Home</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-danger-700)' }}>
            {emergency.emergencyId}
          </span>
          <Badge variant={isCancelled ? 'neutral' : 'danger'}>{emergency.status}</Badge>
        </div>
      </div>

      {/* Main Alert Tracking Banner */}
      <Card
        style={{
          marginBottom: '1.5rem',
          borderLeft: `5px solid ${isCancelled ? 'var(--color-slate-400)' : 'var(--color-danger-600)'}`,
          background: isCancelled ? 'var(--bg-surface)' : 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
        }}
      >
        <Card.Body style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-danger-600)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className={!isCancelled ? 'animate-sos-pulse' : ''}
            >
              <Siren size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-danger-900)' }}>
                {isCancelled ? 'Emergency Alert Cancelled' : 'Emergency Assistance In Progress'}
              </h2>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-danger-700)' }}>
                {isCancelled
                  ? 'This SOS request was marked as resolved or false alarm.'
                  : 'Live GPS link established with nearest hospital emergency triage desk.'}
              </span>
            </div>
          </div>

          {!isCancelled && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1rem',
                border: '1px solid var(--color-danger-200)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RESPONSE STATUS</span>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-danger-700)' }}>
                  {emergency.ambulanceOperator ? 'Ambulance En Route' : 'Coordinating Dispatch'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ESTIMATED ARRIVAL</span>
                <div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--color-success-700)' }}>
                  {emergency.ambulanceOperator ? '3 - 6 mins' : 'Stand By'}
                </div>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Live Interactive GPS Ambulance Radar Map */}
      {!isCancelled && (
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
      )}

      {/* Emergency Status Stepper */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <Card.Header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} color="var(--color-primary-600)" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Live Response Timeline</h3>
          </div>
        </Card.Header>

        <Card.Body style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {STEPS.slice(0, 7).map((step, idx) => {
              const isPast = currentStepIdx >= idx;
              const isCurrent = currentStepIdx === idx;

              return (
                <div key={step.status} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: isPast ? 'var(--color-success-600)' : 'var(--color-slate-200)',
                      color: isPast ? '#FFFFFF' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {isPast ? '✓' : idx + 1}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: isCurrent ? 800 : isPast ? 600 : 400,
                        color: isCurrent ? 'var(--color-danger-700)' : isPast ? 'var(--text-primary)' : 'var(--text-muted)',
                      }}
                    >
                      {step.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>

      {/* Dispatched Emergency Crew & Vehicle Details Card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Ambulance Unit & Crew Identity Card */}
        <Card style={{ borderLeft: '5px solid #DC2626', overflow: 'hidden' }}>
          <div
            style={{
              backgroundColor: '#FEF2F2',
              padding: '0.75rem 1.25rem',
              borderBottom: '1px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991B1B', fontWeight: 800, fontSize: '0.875rem' }}>
              <Truck size={18} color="#DC2626" />
              <span>DISPATCHED AMBULANCE UNIT & EMERGENCY CREW</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: '#16A34A', fontWeight: 700 }}>
              <Radio size={14} className="animate-pulse" />
              <span>LIVE GPS TELEMETRY ACTIVE</span>
            </div>
          </div>

          <Card.Body style={{ padding: '1.25rem' }}>
            {/* Origin & Plate Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>DISPATCHED FROM BASE:</span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <MapPin size={16} color="#DC2626" />
                  <span>{emergency.hospital?.name || 'Central District Emergency Trauma Base'}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '1.25rem' }}>
                  {emergency.hospital?.address || 'Main Emergency Corridor'}, {emergency.hospital?.city || 'Pune'} (Heading towards your GPS)
                </div>
              </div>

              {/* Realistic Indian Number Plate Badge */}
              <div
                style={{
                  border: '2px solid #0F172A',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  padding: '4px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ borderRight: '1.5px solid #CBD5E1', paddingRight: '6px', fontSize: '0.625rem', fontWeight: 900, color: '#1E3A8A' }}>
                  IND 🇮🇳
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.08em', color: '#0F172A' }}>
                  {emergency.ambulanceOperator?.vehicleNumber || 'MH 12 EM 1080'}
                </div>
              </div>
            </div>

            {/* Crew Members Grid: Driver + Assistant EMT Paramedic */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {/* Primary Driver */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#EFF6FF',
                      color: '#1D4ED8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <User size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B' }}>AMBULANCE PILOT (DRIVER)</div>
                    <h5 style={{ margin: '1px 0', fontSize: '0.9375rem', fontWeight: 800 }}>
                      Rajesh Gawande
                    </h5>
                    <div style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>
                      📞 {emergency.ambulanceOperator?.user?.phone || '+91 98444 00001'}
                    </div>
                  </div>
                </div>

                <a
                  href={`tel:${emergency.ambulanceOperator?.user?.phone || '+919844400001'}`}
                  style={{
                    backgroundColor: '#16A34A',
                    color: '#FFFFFF',
                    padding: '0.5rem 0.875rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                  }}
                >
                  <Phone size={14} />
                  <span>Call Driver</span>
                </a>
              </div>

              {/* Assistant EMT / Paramedic */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#ECFDF5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Stethoscope size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B' }}>EMT ASSISTANT (PARAMEDIC)</div>
                    <h5 style={{ margin: '1px 0', fontSize: '0.9375rem', fontWeight: 800 }}>
                      Sanjay Shinde (EMT)
                    </h5>
                    <div style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>
                      📞 +91 98444 00002
                    </div>
                  </div>
                </div>

                <a
                  href="tel:+919844400002"
                  style={{
                    backgroundColor: '#0284C7',
                    color: '#FFFFFF',
                    padding: '0.5rem 0.875rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  <Phone size={14} />
                  <span>Call Assistant</span>
                </a>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Hospital Emergency Desk Card */}
        {emergency.hospital && (
          <Card>
            <Card.Body style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ padding: '0.625rem', backgroundColor: 'var(--color-primary-50)', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary-600)' }}>
                    <Building2 size={22} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>{emergency.hospital.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      24x7 Emergency Trauma Center • {emergency.hospital.address}, {emergency.hospital.city}
                    </span>
                  </div>
                </div>

                {emergency.hospital.phone && (
                  <a
                    href={`tel:${emergency.hospital.phone}`}
                    className="hs-btn hs-btn-outline hs-btn-sm"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontWeight: 700 }}
                  >
                    <Phone size={14} />
                    <span>Call ER Desk</span>
                  </a>
                )}
              </div>
            </Card.Body>
          </Card>
        )}
      </div>

      {/* Safety & First Aid Advice */}
      <Card style={{ marginBottom: '1.5rem', backgroundColor: 'var(--color-slate-50)' }}>
        <Card.Body style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.875rem' }}>
            <ShieldCheck size={18} color="var(--color-primary-600)" />
            <span>While You Wait for the Ambulance:</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li>Stay calm and keep your phone line open for driver calls.</li>
            <li>Ensure the front entrance is accessible and well-lit.</li>
            <li>Do not administer solid foods or fluids if the patient is unresponsive.</li>
            <li>Keep any existing prescription records or medication packages ready for paramedics.</li>
          </ul>
        </Card.Body>
      </Card>

      {/* Cancel Action if False Alarm */}
      {!isCancelled && emergency.status === 'INITIATED' && (
        <div style={{ textAlign: 'center' }}>
          <Button variant="ghost" size="sm" onClick={() => setCancelModalOpen(true)} style={{ color: 'var(--color-danger-600)' }}>
            False Alarm? Cancel Emergency
          </Button>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Cancel Emergency SOS?">
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Are you sure you want to recall the ambulance dispatch and cancel this emergency request?
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <Button variant="outline" onClick={() => setCancelModalOpen(false)} style={{ flex: 1 }}>
            Keep Assistance Active
          </Button>
          <Button variant="danger" isLoading={cancelling} onClick={handleCancelEmergency} style={{ flex: 1 }}>
            Confirm Cancellation
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default EmergencyTrackingPage;
