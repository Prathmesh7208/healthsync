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
  HeartPulse,
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
  const [cancelling, setCancelling] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Standalone SOS Trigger state when visiting /patient/emergency without an existing active SOS
  const [triggeringSos, setTriggeringSos] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [sosModalOpen, setSosModalOpen] = useState(false);

  const fetchTracking = async () => {
    try {
      if (id) {
        const res = await axios.get(`/api/v1/emergencies/${id}/track`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEmergency(res.data.data);
      } else {
        const res = await axios.get('/api/v1/emergencies/active', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEmergency(res.data.data);
      }
    } catch {
      setEmergency(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTracking();
    const interval = setInterval(fetchTracking, 4000); // 4s live polling
    return () => clearInterval(interval);
  }, [id, token]);

  // Continuously stream patient's live GPS breadcrumbs to hospital reception and ambulance
  useEffect(() => {
    const targetId = id || emergency?.id;
    if (!targetId || !token) return;

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
  }, [id, emergency?.id, token]);

  const handleCancelEmergency = async () => {
    const targetId = id || emergency?.id;
    if (!targetId) return;

    setCancelling(true);
    try {
      await axios.put(
        `/api/v1/emergencies/${targetId}/cancel`,
        { reason: 'Cancelled by patient from tracking dashboard' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Emergency response cancelled');
      setEmergency(null);
      navigate('/patient/home');
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
      `🚨 EMERGENCY SOS: Medical assistance has been requested! Track the live ambulance GPS location and response status here: ${window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Launch SOS from Standalone Command Center
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
      navigate('/patient/home');
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

  // ==========================================
  // CASE 1: NO ACTIVE EMERGENCY -> COMMAND CENTER
  // ==========================================
  if (!emergency) {
    return (
      <div className="container" style={{ maxWidth: '800px', padding: '1.5rem 1rem 4rem 1rem' }}>
        {/* Top Header */}
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
              color: '#1A56DB',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} />
            <span>Home</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#16A34A', fontSize: '0.75rem', fontWeight: 800 }}>
            <Radio size={14} className="animate-pulse" />
            <span>24x7 EMERGENCY SATELLITE DISPATCH ACTIVE</span>
          </div>
        </div>

        {/* Big Urgent Trigger Hero Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 50%, #EFF6FF 100%)',
            border: '2px solid #FECACA',
            borderRadius: '20px',
            padding: '2rem',
            textAlign: 'center',
            marginBottom: '2rem',
            boxShadow: '0 10px 25px rgba(220, 38, 38, 0.1)',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              boxShadow: '0 10px 25px rgba(220, 38, 38, 0.5)',
            }}
            className="animate-sos-pulse"
          >
            <Siren size={44} />
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#991B1B', margin: '0 0 0.5rem 0' }}>
            Emergency & Ambulance Command Center
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#64748B', maxWidth: '520px', margin: '0 auto 1.5rem auto' }}>
            Instant GPS dispatch to the nearest super-speciality hospital trauma bay with live turn-by-turn ambulance radar tracking.
          </p>

          <button
            type="button"
            onClick={startSosCountdown}
            style={{
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '1rem 2.5rem',
              fontSize: '1.125rem',
              fontWeight: 900,
              letterSpacing: '0.05em',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(220, 38, 38, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.625rem',
              transition: 'transform 0.15s ease',
            }}
          >
            <Siren size={24} />
            <span>ACTIVATE EMERGENCY SOS DISPATCH</span>
          </button>
        </div>

        {/* 24x7 Direct National & Local Ambulance Helplines */}
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1rem', color: '#0F172A' }}>
          National 24x7 Emergency Hotlines
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <a
            href="tel:108"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#DC2626' }}>NATIONAL AMBULANCE</div>
              <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#0F172A' }}>Dial 108</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Toll-Free Emergency Medical Response</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={20} />
            </div>
          </a>

          <a
            href="tel:102"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#0284C7' }}>MATERNAL & INFANT SOS</div>
              <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#0F172A' }}>Dial 102</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Free Neonatal & Pregnant Care</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={20} />
            </div>
          </a>

          <a
            href="tel:112"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#16A34A' }}>ALL-IN-ONE DISASTER SOS</div>
              <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#0F172A' }}>Dial 112</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>National Unified Emergency Response</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={20} />
            </div>
          </a>
        </div>

        {/* First Aid & Critical Triage Checklist */}
        <Card style={{ backgroundColor: '#F8FAFC' }}>
          <Card.Body style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 800, fontSize: '0.9375rem', color: '#0F172A' }}>
              <HeartPulse size={20} color="#DC2626" />
              <span>Immediate First-Aid Protocols</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: '0.8125rem', color: '#475569' }}>
              <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <strong style={{ color: '#0F172A' }}>Chest Pain / Heart Attack:</strong> Keep patient seated, loosen tight collars, and keep aspirin 325mg ready if advised.
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <strong style={{ color: '#0F172A' }}>Severe Bleeding / Trauma:</strong> Apply firm, direct pressure with a clean cloth. Elevate the wounded limb above heart level.
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <strong style={{ color: '#0F172A' }}>Unconsciousness / Choking:</strong> Place in the lateral recovery position on their side. Ensure clear airway.
              </div>
            </div>
          </Card.Body>
        </Card>

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
  }

  // ==========================================
  // CASE 2: ACTIVE EMERGENCY TRACKING HUD
  // ==========================================
  const currentStepIdx = STEPS.findIndex((s) => s.status === emergency.status);
  const isCancelled = emergency.status === 'CANCELLED';

  return (
    <div className="container" style={{ maxWidth: '800px', padding: '1.5rem 1rem 4rem 1rem' }}>
      {/* Top Navigation & Status Badge */}
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
            {emergency.emergencyId}
          </span>
          <Badge variant={isCancelled ? 'neutral' : 'danger'}>{emergency.status}</Badge>
        </div>
      </div>

      {/* Main Alert Tracking Banner */}
      <Card
        style={{
          marginBottom: '1.5rem',
          borderLeft: `6px solid ${isCancelled ? '#94A3B8' : '#DC2626'}`,
          background: isCancelled ? '#FFFFFF' : 'linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 60%, #EFF6FF 100%)',
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
                className={!isCancelled ? 'animate-sos-pulse' : ''}
              >
                <Siren size={26} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0F172A' }}>
                  {isCancelled ? 'Emergency Alert Cancelled' : 'Ambulance Live Tracking Active'}
                </h2>
                <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                  {isCancelled
                    ? 'This SOS request was resolved or cancelled.'
                    : 'Real-time telemetry link synchronized with ambulance dispatch.'}
                </span>
              </div>
            </div>

            {/* Quick Share / WhatsApp / Copy Link Actions */}
            {!isCancelled && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                  <span>Share on WhatsApp</span>
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
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Live Interactive GPS Ambulance Radar Map */}
      {!isCancelled && (
        <div style={{ marginBottom: '1.5rem' }}>
          <LiveAmbulanceRadarMap
            emergencyId={emergency.id}
            patientLocation={{
              latitude: Number(emergency.latitude || emergency.initialLatitude || 18.5204),
              longitude: Number(emergency.longitude || emergency.initialLongitude || 73.8567),
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
            vehicleNumber={emergency.ambulanceOperator?.vehicleNumber || 'MH-12-EM-1080'}
            driverPhone={emergency.ambulanceOperator?.user?.phone || '+919844400001'}
            status={emergency.status}
          />
        </div>
      )}

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

      {/* Emergency Status Stepper */}
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

      {/* Cancel Action if False Alarm */}
      {!isCancelled && emergency.status === 'INITIATED' && (
        <div style={{ textAlign: 'center' }}>
          <Button variant="ghost" size="sm" onClick={() => setCancelModalOpen(true)} style={{ color: '#DC2626' }}>
            False Alarm? Cancel Emergency
          </Button>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Cancel Emergency SOS?">
        <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
          Are you sure you want to recall the ambulance dispatch and cancel this emergency request?
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <Button variant="outline" onClick={() => setCancelModalOpen(false)} style={{ flex: 1 }}>
            No, Keep Active
          </Button>
          <Button variant="danger" isLoading={cancelling} onClick={handleCancelEmergency} style={{ flex: 1 }}>
            Yes, Cancel SOS
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default EmergencyTrackingPage;
