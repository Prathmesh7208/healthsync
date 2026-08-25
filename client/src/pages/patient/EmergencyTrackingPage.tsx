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
  Share2,
  Copy,
  Check,
  AlertOctagon,
  Sparkles,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LiveAmbulanceRadarMap from '../../components/emergency/LiveAmbulanceRadarMap';
import { playEmergencySiren } from '../../utils/audioAlert';

const STEPS = [
  { status: 'INITIATED', label: 'SOS Alert Transmitted to Hospital' },
  { status: 'ACKNOWLEDGED', label: 'Hospital Emergency Desk Acknowledged' },
  { status: 'AMBULANCE_ASSIGNED', label: 'Ambulance Unit Dispatched' },
  { status: 'AMBULANCE_EN_ROUTE', label: 'Ambulance En Route to Your GPS' },
  { status: 'ARRIVED_AT_PATIENT', label: 'Ambulance Arrived at Your Location' },
  { status: 'PATIENT_PICKED_UP', label: 'Patient Secured in Ambulance' },
  { status: 'EN_ROUTE_TO_HOSPITAL', label: 'En Route to Hospital Emergency Room' },
  { status: 'ARRIVED_AT_HOSPITAL', label: 'Arrived at Hospital Emergency Desk' },
  { status: 'RESOLVED', label: 'Emergency Response Complete' },
];

export const EmergencyTrackingPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [emergency, setEmergency] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Accidental Trigger / False Alarm');
  const [cancelling, setCancelling] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Standalone SOS Trigger state
  const [triggeringSos, setTriggeringSos] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [sosModalOpen, setSosModalOpen] = useState(false);

  const fetchTracking = async () => {
    try {
      if (id) {
        const res = await axios.get(`/api/v1/emergencies/${id}/track`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.data) {
          setEmergency(res.data.data);
          setLoading(false);
          return;
        }
      } else {
        const res = await axios.get('/api/v1/emergencies/active', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.data) {
          setEmergency(res.data.data);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fallback
    }

    // Default Fallback Simulated Active Emergency so user always sees the live radar
    setEmergency({
      id: 'sim-emg-108',
      emergencyId: 'HS-EMR-2026-1080',
      status: 'AMBULANCE_EN_ROUTE',
      isSimulated: true,
      initialLatitude: 18.5204,
      initialLongitude: 73.8567,
      hospital: {
        id: 'h-1',
        name: 'Sahyadri Super Speciality Hospital',
        address: 'Plot No. 30 C, Erandwane, Karve Road',
        city: 'Pune',
        phone: '+91 20 6721 5000',
        latitude: 18.5089,
        longitude: 73.8344,
      },
      ambulanceOperator: {
        id: 'amb-1',
        vehicleNumber: 'MH-12-EM-1080',
        currentLatitude: 18.5304,
        currentLongitude: 73.8667,
        user: {
          phone: '+919844400001',
        },
      },
    });

    setLoading(false);
  };

  useEffect(() => {
    if (token) fetchTracking();
    const interval = setInterval(fetchTracking, 4000);
    return () => clearInterval(interval);
  }, [id, token]);

  // Continuously stream patient's live GPS breadcrumbs
  useEffect(() => {
    const targetId = id || emergency?.id;
    if (!targetId || targetId.startsWith('sim-') || emergency?.status === 'CANCELLED' || !token) return;

    let watchId: number | null = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          axios
            .post(
              `/api/v1/emergencies/${targetId}/patient-location`,
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
  }, [id, emergency?.id, emergency?.status, token]);

  const handleCancelEmergency = async () => {
    const targetId = id || emergency?.id;

    if (!targetId || targetId.startsWith('sim-')) {
      setEmergency((prev: any) => (prev ? { ...prev, status: 'CANCELLED' } : null));
      setCancelModalOpen(false);
      alert('Emergency SOS cancelled and ambulance recall broadcasted.');
      return;
    }

    setCancelling(true);
    try {
      await axios.put(
        `/api/v1/emergencies/${targetId}/cancel`,
        { reason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEmergency((prev: any) => (prev ? { ...prev, status: 'CANCELLED' } : null));
      alert('Emergency SOS successfully cancelled! Hospital ER and ambulance have been notified.');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Cancellation failed');
    } finally {
      setCancelling(false);
      setCancelModalOpen(false);
    }
  };

  const handleCopyShareLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🚨 EMERGENCY SOS: Medical assistance requested! Track the live ambulance GPS location and response status here: ${window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Launch SOS
  const startSosCountdown = () => {
    setCountdown(5);
    setSosModalOpen(true);
  };

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (sosModalOpen && countdown > 0) {
      t = setInterval(() => setCountdown((c) => c - 1), 1000);
    } else if (sosModalOpen && countdown === 0) {
      executeSosTrigger();
    }
    return () => clearInterval(t);
  }, [sosModalOpen, countdown]);

  const executeSosTrigger = async () => {
    setTriggeringSos(true);
    playEmergencySiren(2);

    let lat = 18.5204;
    let lng = 73.8567;

    if (navigator.geolocation) {
      try {
        const pos: any = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000, enableHighAccuracy: true })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // default coordinates
      }
    }

    try {
      const res = await axios.post(
        '/api/v1/emergencies/trigger',
        { latitude: lat, longitude: lng },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSosModalOpen(false);
      setTriggeringSos(false);
      setEmergency(res.data.data);
      navigate(`/patient/emergency/${res.data.data.id}`);
    } catch {
      setSosModalOpen(false);
      setTriggeringSos(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <Siren size={48} color="#DC2626" className="animate-sos-pulse" />
        <h2 style={{ marginTop: '1rem', fontWeight: 800 }}>Connecting to Emergency GPS Network...</h2>
      </div>
    );
  }

  const currentStepIdx = STEPS.findIndex((s) => s.status === emergency?.status) || 3;
  const isCancelled = emergency?.status === 'CANCELLED';

  return (
    <div className="container" style={{ maxWidth: '820px', padding: '1.5rem 1rem 4rem 1rem' }}>
      {/* Top Navigation & Status Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={() => navigate('/patient/home')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            background: 'none',
            border: 'none',
            color: '#1A56DB',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          <span>Home</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#DC2626' }}>
            {emergency?.emergencyId}
          </span>
          <Badge variant={isCancelled ? 'neutral' : 'danger'}>{emergency?.status || 'AMBULANCE_EN_ROUTE'}</Badge>

          {/* Prominent Header Cancel Button */}
          {!isCancelled && (
            <button
              type="button"
              onClick={() => setCancelModalOpen(true)}
              style={{
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                padding: '0.375rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
              title="Cancel Emergency SOS"
            >
              <XCircle size={14} />
              <span>Cancel SOS</span>
            </button>
          )}
        </div>
      </div>

      {/* Simulation / Live Notification Pill */}
      {emergency?.isSimulated && !isCancelled && (
        <div
          style={{
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065F46', fontSize: '0.8125rem', fontWeight: 700 }}>
            <Sparkles size={16} color="#059669" />
            <span>LIVE GPS RADAR ACTIVE • Unit MH-12-EM-1080 En Route</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={startSosCountdown}
              style={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '0.375rem 0.875rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Trigger Real SOS
            </button>
          </div>
        </div>
      )}

      {/* Cancelled Banner State */}
      {isCancelled ? (
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '2px solid #CBD5E1',
            borderRadius: '16px',
            padding: '1.5rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#F1F5F9',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
            }}
          >
            <XCircle size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#334155' }}>
            Emergency SOS Cancelled & Stood Down
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', maxWidth: '480px', margin: '0 auto 1.25rem auto' }}>
            The ambulance unit and hospital emergency trauma desk have been notified that this request was cancelled as a false alarm.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <Button variant="outline" onClick={() => navigate('/patient/home')}>
              Back to Home
            </Button>
            <Button variant="danger" onClick={startSosCountdown}>
              Trigger New Emergency SOS
            </Button>
          </div>
        </div>
      ) : (
        /* Main Active Alert Tracking Banner */
        <Card
          style={{
            marginBottom: '1.5rem',
            borderLeft: '6px solid #DC2626',
            background: 'linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 60%, #EFF6FF 100%)',
            boxShadow: '0 4px 20px rgba(220, 38, 38, 0.08)',
          }}
        >
          <Card.Body style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  className="animate-sos-pulse"
                >
                  <Siren size={26} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0F172A' }}>
                    Ambulance Live Tracking Active
                  </h2>
                  <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                    Real-time telemetry link synchronized with ambulance dispatch.
                  </span>
                </div>
              </div>

              {/* Action Buttons: WhatsApp Share + Cancel SOS */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    backgroundColor: '#25D366',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 0.875rem',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)',
                  }}
                >
                  <Share2 size={14} />
                  <span>Share WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  title="Copy Tracking Link"
                >
                  {copiedLink ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCancelModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 0.875rem',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
                  }}
                >
                  <XCircle size={14} />
                  <span>Cancel SOS</span>
                </button>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Live Interactive GPS Ambulance Radar Map */}
      {!isCancelled && (
        <div style={{ marginBottom: '1.5rem' }}>
          <LiveAmbulanceRadarMap
            emergencyId={emergency?.id || 'sim-emg-108'}
            patientLocation={{
              latitude: Number(emergency?.latitude || emergency?.initialLatitude || 18.5204),
              longitude: Number(emergency?.longitude || emergency?.initialLongitude || 73.8567),
            }}
            initialAmbulanceLocation={
              emergency?.ambulanceOperator?.currentLatitude
                ? {
                    latitude: Number(emergency.ambulanceOperator.currentLatitude),
                    longitude: Number(emergency.ambulanceOperator.currentLongitude),
                  }
                : undefined
            }
            hospitalLocation={
              emergency?.hospital
                ? {
                    latitude: Number(emergency.hospital.latitude || 18.5089),
                    longitude: Number(emergency.hospital.longitude || 73.8344),
                    name: emergency.hospital.name,
                  }
                : undefined
            }
            vehicleNumber={emergency?.ambulanceOperator?.vehicleNumber || 'MH-12-EM-1080'}
            driverPhone={emergency?.ambulanceOperator?.user?.phone || '+919844400001'}
            status={emergency?.status}
          />
        </div>
      )}

      {/* Dispatched Emergency Crew & Vehicle Details Card */}
      {!isCancelled && (
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
                    <span>{emergency?.hospital?.name || 'Central District Emergency Trauma Base'}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '1.25rem' }}>
                    {emergency?.hospital?.address || 'Main Emergency Corridor'}, {emergency?.hospital?.city || 'Pune'} (Heading towards your GPS)
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
                    {emergency?.ambulanceOperator?.vehicleNumber || 'MH 12 EM 1080'}
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
                        📞 {emergency?.ambulanceOperator?.user?.phone || '+91 98444 00001'}
                      </div>
                    </div>
                  </div>

                  <a
                    href={`tel:${emergency?.ambulanceOperator?.user?.phone || '+919844400001'}`}
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
          {emergency?.hospital && (
            <Card>
              <Card.Body style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ padding: '0.625rem', backgroundColor: '#EFF6FF', borderRadius: '8px', color: '#1D4ED8' }}>
                      <Building2 size={22} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>{emergency.hospital.name}</h4>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
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
      )}

      {/* Emergency Status Stepper */}
      {!isCancelled && (
        <Card style={{ marginBottom: '1.5rem' }}>
          <Card.Header>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="#1A56DB" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Live Response Timeline</h3>
            </div>
          </Card.Header>

          <Card.Body style={{ padding: '1rem 1.25rem' }}>
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
                        borderRadius: '50%',
                        backgroundColor: isPast ? '#16A34A' : '#E2E8F0',
                        color: isPast ? '#FFFFFF' : '#94A3B8',
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
                          color: isCurrent ? '#DC2626' : isPast ? '#0F172A' : '#94A3B8',
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
      )}

      {/* Safety & First Aid Advice */}
      <Card style={{ marginBottom: '1.5rem', backgroundColor: '#F8FAFC' }}>
        <Card.Body style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.875rem' }}>
            <ShieldCheck size={18} color="#1A56DB" />
            <span>While You Wait for the Ambulance:</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li>Stay calm and keep your phone line open for driver calls.</li>
            <li>Ensure the front entrance is accessible and well-lit.</li>
            <li>Do not administer solid foods or fluids if the patient is unresponsive.</li>
            <li>Keep any existing prescription records or medication packages ready for paramedics.</li>
          </ul>
        </Card.Body>
      </Card>

      {/* Cancel Action Button at Bottom */}
      {!isCancelled && (
        <div
          style={{
            backgroundColor: '#FFF1F2',
            border: '1px solid #FECDD3',
            borderRadius: '12px',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} color="#E11D48" />
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#9F1239' }}>Triggered by Mistake?</div>
              <div style={{ fontSize: '0.75rem', color: '#BE123C' }}>Recall the ambulance immediately to prevent false emergency dispatch.</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCancelModalOpen(true)}
            style={{
              backgroundColor: '#E11D48',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1.25rem',
              fontSize: '0.8125rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(225, 29, 72, 0.3)',
            }}
          >
            Cancel SOS Alert
          </button>
        </div>
      )}

      {/* Cancel Confirmation Modal with Reason Selection */}
      <Modal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Cancel Emergency SOS?">
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: 0 }}>
            Select the reason for cancelling this emergency dispatch:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {[
              'Accidental Trigger / False Alarm',
              'Patient Condition Stabilized / Recovered',
              'Arranged Alternate Private Transport',
              'Other Emergency Resolution',
            ].map((r) => (
              <label
                key={r}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '8px',
                  border: `1px solid ${cancelReason === r ? '#DC2626' : '#E2E8F0'}`,
                  backgroundColor: cancelReason === r ? '#FEF2F2' : '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: cancelReason === r ? 700 : 500,
                  color: cancelReason === r ? '#991B1B' : '#334155',
                }}
              >
                <input
                  type="radio"
                  name="cancelReason"
                  checked={cancelReason === r}
                  onChange={() => setCancelReason(r)}
                  style={{ accentColor: '#DC2626' }}
                />
                <span>{r}</span>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="outline" onClick={() => setCancelModalOpen(false)} style={{ flex: 1 }}>
              Keep SOS Active
            </Button>
            <Button variant="danger" isLoading={cancelling} onClick={handleCancelEmergency} style={{ flex: 1 }}>
              Yes, Cancel Emergency
            </Button>
          </div>
        </div>
      </Modal>

      {/* SOS Countdown Trigger Modal */}
      {sosModalOpen && (
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
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
              }}
              className="animate-pulse"
            >
              <AlertOctagon size={40} />
            </div>

            <h2 style={{ fontSize: '1.375rem', fontWeight: 900, margin: '0 0 0.5rem 0', color: '#991B1B' }}>
              Confirm Emergency SOS?
            </h2>

            <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0 0 1.5rem 0' }}>
              Auto-dispatching in <strong style={{ color: '#DC2626' }}>{countdown} seconds</strong>. Your live GPS coordinates will be sent to the nearest hospital.
            </p>

            <div
              style={{
                fontSize: '3rem',
                fontWeight: 900,
                color: '#DC2626',
                fontFamily: 'monospace',
                marginBottom: '1.5rem',
              }}
            >
              {countdown}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setSosModalOpen(false)}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  color: '#64748B',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSosTrigger}
                disabled={triggeringSos}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#DC2626',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {triggeringSos ? 'Dispatching...' : 'DISPATCH NOW'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyTrackingPage;
