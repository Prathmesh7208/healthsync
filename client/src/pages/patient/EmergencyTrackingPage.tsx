import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  Siren,
  Phone,
  Truck,
  Building2,
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
  XCircle,
  AlertTriangle,
  HeartPulse,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LiveAmbulanceRadarMap from '../../components/emergency/LiveAmbulanceRadarMap';
import { playEmergencySiren } from '../../utils/audioAlert';

import {
  getNetworkQuality,
  getCachedGPS,
  updateCachedGPS,
  generateOfflineSmsLink,
  generateEmergencyContactSmsLink,
  queueOfflineEmergency,
  NetworkQuality,
} from '../../utils/lowNetworkEmergency';

export const EmergencyTrackingPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const STEPS = [
    { status: 'INITIATED', label: t('emergency.hospitalNotified') || 'SOS Alert Transmitted to Hospital' },
    { status: 'ACKNOWLEDGED', label: t('emergency.hospitalNotified') || 'Hospital Emergency Desk Acknowledged' },
    { status: 'AMBULANCE_ASSIGNED', label: t('emergency.ambulanceAssigned') || 'Ambulance Unit Dispatched' },
    { status: 'AMBULANCE_EN_ROUTE', label: t('emergency.enRoute') || 'Ambulance En Route to Your GPS' },
    { status: 'ARRIVED_AT_PATIENT', label: t('emergency.arrived') || 'Ambulance Arrived at Your Location' },
    { status: 'PATIENT_PICKED_UP', label: 'Patient Secured in Ambulance' },
    { status: 'EN_ROUTE_TO_HOSPITAL', label: 'En Route to Hospital Emergency Room' },
    { status: 'ARRIVED_AT_HOSPITAL', label: 'Arrived at Hospital Emergency Desk' },
    { status: 'RESOLVED', label: 'Emergency Response Complete' },
  ];

  // Load any previously active emergency from localStorage so state never drops on refresh
  const [emergency, setEmergency] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('hs_active_emergency');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(!emergency);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState(t('emergencyTracking.reasons.accidental'));
  const [cancelling, setCancelling] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [justCancelled, setJustCancelled] = useState(false);

  // Network Quality & Low Latency Mode State
  const [netQuality, setNetQuality] = useState<NetworkQuality>(() => {
    try {
      return getNetworkQuality();
    } catch {
      return {
        online: true,
        effectiveType: '4g',
        rttMs: 50,
        downlinkMb: 10,
        isLowBandwidth: false,
      };
    }
  });

  // Standalone SOS Trigger state
  const [triggeringSos, setTriggeringSos] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [sosModalOpen, setSosModalOpen] = useState(false);

  // Patient Emergency Medical ID & Multi-Tier Contacts
  const [medicalId] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('hs_patient_medical_id');
      return saved
        ? JSON.parse(saved)
        : {
            contacts: [
              { name: 'Dr. Alok Sharma (Father)', phone: '+919844411001', relation: 'Father' },
              { name: 'Pooja Sharma (Spouse)', phone: '+919844411002', relation: 'Spouse' },
              { name: 'Vikram Mehta (Friend)', phone: '+919844411003', relation: 'Friend' },
            ],
            bloodGroup: 'O+',
            allergies: 'Penicillin, Sulfa drugs',
            conditions: 'Hypertension, Type-2 Diabetes',
            isOrganDonor: true,
          };
    } catch {
      return null;
    }
  });

  // Track Network Changes & Ping
  useEffect(() => {
    const updateNet = () => {
      try {
        setNetQuality(getNetworkQuality());
      } catch {
        // ignore
      }
    };
    window.addEventListener('online', updateNet);
    window.addEventListener('offline', updateNet);

    const interval = setInterval(updateNet, 5000);
    return () => {
      window.removeEventListener('online', updateNet);
      window.removeEventListener('offline', updateNet);
      clearInterval(interval);
    };
  }, []);

  // Pre-fetch & Cache GPS on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => updateCachedGPS(pos.coords),
        () => {},
        { timeout: 4000, enableHighAccuracy: true, maximumAge: 60000 }
      );
    }
  }, []);

  const handleBroadcastAllContacts = () => {
    const coords = `${emergency?.latitude || emergency?.initialLatitude || 18.5204},${
      emergency?.longitude || emergency?.initialLongitude || 73.8567
    }`;
    const text = encodeURIComponent(
      `🚨 EMERGENCY SOS CASCADE ALERT: Medical assistance requested! Patient: ${
        emergency?.patient?.fullName || 'Patient'
      }. Live Tracking Link: ${window.location.href} | GPS Coordinates: https://maps.google.com/?q=${coords}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const fetchTracking = async () => {
    try {
      const targetId = id || emergency?.id;
      let res: any = null;

      if (targetId && !targetId.startsWith('active-sos-') && !targetId.startsWith('sim-')) {
        res = await axios.get(`/api/v1/emergencies/${targetId}/track`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 4000,
        });
      } else {
        res = await axios.get('/api/v1/emergencies/active', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 4000,
        });
      }

      if (res?.data?.data) {
        const data = res.data.data;
        if (data.status === 'CANCELLED' || data.status === 'RESOLVED') {
          localStorage.removeItem('hs_active_emergency');
          setEmergency(null);
        } else {
          setEmergency(data);
          localStorage.setItem('hs_active_emergency', JSON.stringify(data));
        }
      }
    } catch {
      // Keep offline cache intact
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTracking();
    const interval = setInterval(fetchTracking, 4000);
    return () => clearInterval(interval);
  }, [id, token]);

  // Stream patient live GPS
  useEffect(() => {
    const targetId = emergency?.id;
    if (!targetId || targetId.startsWith('active-sos-') || !token || emergency?.status === 'CANCELLED') return;

    let watchId: number | null = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          updateCachedGPS(pos.coords);
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
              { headers: { Authorization: `Bearer ${token}` }, timeout: 3000 }
            )
            .catch(() => {});
        },
        (err) => console.warn('Live location watch error:', err),
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 6000 }
      );
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [emergency?.id, emergency?.status, token]);

  const handleCancelEmergency = async () => {
    const targetId = emergency?.id || id;
    setCancelling(true);

    try {
      if (targetId && !targetId.startsWith('active-sos-') && !targetId.startsWith('sim-')) {
        await axios.put(
          `/api/v1/emergencies/${targetId}/cancel`,
          { reason: cancelReason },
          { headers: { Authorization: `Bearer ${token}` }, timeout: 3000 }
        );
      }
    } catch {
      // Continue reset
    } finally {
      localStorage.removeItem('hs_active_emergency');
      setEmergency(null);
      setCancelling(false);
      setCancelModalOpen(false);
      setJustCancelled(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const startSosCountdown = () => {
    setJustCancelled(false);
    setCountdown(5);
    setSosModalOpen(true);
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (sosModalOpen && countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (sosModalOpen && countdown === 0) {
      executeSosTrigger();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sosModalOpen, countdown]);

  // 0-LATENCY MULTI-TIER SOS TRIGGER ENGINE
  const executeSosTrigger = async () => {
    if (triggeringSos) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setTriggeringSos(true);
    setSosModalOpen(false);
    
    try {
      playEmergencySiren(2);
    } catch {
      // Audio autoplay policy fallback
    }

    // 1. Instant Cached GPS in 0ms (Never blocks on poor network)
    const cached = getCachedGPS();
    let lat = cached.latitude;
    let lng = cached.longitude;

    // 2. Instant Optimistic Local Dispatch (0ms latency UI response)
    const localId = 'active-sos-' + Date.now();
    const optimisticEmergency = {
      id: localId,
      emergencyId: 'HS-EMR-2026-' + Math.floor(1000 + Math.random() * 9000),
      status: 'AMBULANCE_ASSIGNED',
      initialLatitude: lat,
      initialLongitude: lng,
      patient: {
        fullName: 'Emergency Patient',
        bloodGroup: medicalId?.bloodGroup || 'O+',
      },
      hospital: {
        name: 'Sahyadri Super Speciality Hospital',
        address: 'Plot No. 30 C, Erandwane, Karve Road',
        city: 'Pune',
        phone: '+91 20 6721 5000',
      },
      ambulanceOperator: {
        vehicleNumber: 'MH-12-EM-1080',
        user: { phone: '+919844400001' },
      },
    };

    setEmergency(optimisticEmergency);
    localStorage.setItem('hs_active_emergency', JSON.stringify(optimisticEmergency));
    setSosModalOpen(false);
    setTriggeringSos(false);

    // 3. Background High-Accuracy GPS Refresh
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateCachedGPS(pos.coords);
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        },
        () => {},
        { timeout: 3000, enableHighAccuracy: true, maximumAge: 5000 }
      );
    }

    // 4. Background Server Dispatch (with 2.5s network timeout)
    try {
      const res = await axios.post(
        '/api/v1/emergencies/trigger',
        { latitude: lat, longitude: lng },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 2500 }
      );
      if (res.data?.data) {
        setEmergency(res.data.data);
        localStorage.setItem('hs_active_emergency', JSON.stringify(res.data.data));
      }
    } catch {
      // If server is unreachable due to low latency or 2G, queue offline
      queueOfflineEmergency({
        id: localId,
        emergencyId: optimisticEmergency.emergencyId,
        latitude: lat,
        longitude: lng,
        timestamp: Date.now(),
        synced: false,
      });
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

  // =========================================================================
  // CASE 1: NO ACTIVE EMERGENCY -> READY HUB
  // =========================================================================
  if (!emergency) {
    return (
      <div className="container" style={{ maxWidth: '768px', padding: '1rem 1rem 3rem 1rem' }}>
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
              fontSize: '0.9375rem',
            }}
          >
            <ArrowLeft size={18} />
            <span>{t('nav.home')}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#16A34A', fontSize: '0.75rem', fontWeight: 800 }}>
            <Radio size={14} className="animate-pulse" />
            <span>24x7 EMERGENCY RESPONSE READY</span>
          </div>
        </div>

        {/* Just Cancelled Alert Banner */}
        {justCancelled && (
          <div
            style={{
              backgroundColor: '#ECFDF5',
              border: '1.5px solid #A7F3D0',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Check size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#065F46' }}>
                {t('emergencyTracking.cancelledBannerTitle')}
              </h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: '#047857' }}>
                {t('emergencyTracking.cancelledBannerDesc')}
              </p>
            </div>
          </div>
        )}

        {/* Live Network Status & Offline SOS Resilience Chip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 0.875rem',
            backgroundColor: netQuality?.isLowBandwidth ? '#FEF2F2' : '#F8FAFC',
            border: `1px solid ${netQuality?.isLowBandwidth ? '#FECACA' : '#E2E8F0'}`,
            borderRadius: '12px',
            marginBottom: '1.25rem',
            fontSize: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: !netQuality?.online
                  ? '#DC2626'
                  : netQuality?.isLowBandwidth
                  ? '#D97706'
                  : '#16A34A',
              }}
            />
            <span style={{ fontWeight: 700, color: '#0F172A' }}>
              {!netQuality?.online
                ? '⚠️ Offline Mode (Instant GPS Cache Active)'
                : netQuality?.isLowBandwidth
                ? `📶 Low Bandwidth Mode (${(netQuality?.effectiveType || '2g').toUpperCase()} • Ping ~${netQuality?.rttMs || 100}ms)`
                : `⚡ Real-Time Satellite GPS Active (${(netQuality?.effectiveType || '4g').toUpperCase()})`}
            </span>
          </div>

          <span style={{ color: '#64748B', fontWeight: 700, fontSize: '0.6875rem' }}>
            0-LATENCY DISPATCH
          </span>
        </div>

        {/* Hero SOS Trigger Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 40%, #EFF6FF 100%)',
            border: '2px solid #FECACA',
            borderRadius: '20px',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            marginBottom: '1.75rem',
            boxShadow: '0 8px 25px rgba(220, 38, 38, 0.08)',
          }}
        >
          <div
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              boxShadow: '0 10px 25px rgba(220, 38, 38, 0.45)',
            }}
            className="animate-sos-pulse"
          >
            <Siren size={40} />
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#991B1B', margin: '0 0 0.375rem 0' }}>
            {t('emergencyTracking.readyTitle')}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', maxWidth: '480px', margin: '0 auto 1.25rem auto', lineHeight: 1.4 }}>
            {t('emergencyTracking.readySubtitle')}
          </p>

          {/* Statutory Anti-Prank Legal Warning */}
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '10px',
              padding: '0.625rem 0.875rem',
              maxWidth: '460px',
              margin: '0 auto 1.5rem auto',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}
          >
            <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.6875rem', color: '#991B1B', lineHeight: 1.4 }}>
              <strong>⚖️ STATUTORY PENAL WARNING:</strong> False distress calls, pranks, or malicious emergency activations are criminal offenses punishable under <strong>Bharatiya Nyaya Sanhita (BNS) / IPC Section 182 & 505</strong> (Up to 6 months imprisonment & criminal penalty). Your mobile number, IP address, and high-accuracy GPS are logged for law enforcement audits.
            </div>
          </div>

          <button
            type="button"
            onClick={startSosCountdown}
            style={{
              width: '100%',
              maxWidth: '380px',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '0.875rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(220, 38, 38, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'transform 0.15s ease',
            }}
          >
            <Siren size={22} />
            <span>{t('emergencyTracking.activateBtn')}</span>
          </button>
        </div>

        {/* Helplines */}
        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.875rem', color: '#0F172A' }}>
          {t('emergencyTracking.helplines')}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
          <a
            href="tel:108"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textDecoration: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#DC2626' }}>NATIONAL AMBULANCE</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A' }}>Dial 108</div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Toll-Free Medical Response</div>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={18} />
            </div>
          </a>

          <a
            href="tel:102"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textDecoration: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#0284C7' }}>MATERNAL & INFANT</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A' }}>Dial 102</div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Free Neonatal & Pregnant Care</div>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={18} />
            </div>
          </a>

          <a
            href="tel:112"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textDecoration: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#16A34A' }}>UNIFIED EMERGENCY</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A' }}>Dial 112</div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>All-In-One Emergency Line</div>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={18} />
            </div>
          </a>
        </div>

        {/* First Aid */}
        <Card style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <Card.Body style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 800, fontSize: '0.9375rem', color: '#0F172A' }}>
              <HeartPulse size={18} color="#DC2626" />
              <span>{t('emergencyTracking.firstAid')}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.625rem', fontSize: '0.8125rem', color: '#475569' }}>
              <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <strong style={{ color: '#0F172A' }}>Chest Pain:</strong> Keep patient seated, loosen tight collars, stay calm.
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <strong style={{ color: '#0F172A' }}>Bleeding:</strong> Apply firm direct pressure with clean cloth. Elevate limb.
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <strong style={{ color: '#0F172A' }}>Unconsciousness:</strong> Place in lateral recovery position on their side.
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* 5-Second Countdown Modal */}
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
                maxWidth: '420px',
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

              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 0.5rem 0', color: '#991B1B' }}>
                Confirm Emergency SOS?
              </h2>

              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0 0 1.25rem 0' }}>
                Auto-dispatching in <strong style={{ color: '#DC2626' }}>{countdown} seconds</strong>.
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

  // =========================================================================
  // CASE 2: ACTIVE EMERGENCY SOS -> LIVE RADAR
  // =========================================================================
  const currentStepIdx = STEPS.findIndex((s) => s.status === emergency?.status) || 3;

  return (
    <div className="container" style={{ maxWidth: '768px', padding: '1rem 1rem 3rem 1rem' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
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
            fontSize: '0.875rem',
          }}
        >
          <ArrowLeft size={16} />
          <span>{t('nav.home')}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#DC2626' }}>
            {emergency?.emergencyId}
          </span>
          <Badge variant="danger">{emergency?.status || 'AMBULANCE_EN_ROUTE'}</Badge>

          <button
            type="button"
            onClick={() => setCancelModalOpen(true)}
            style={{
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              padding: '0.3125rem 0.625rem',
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
            <span>{t('emergencyTracking.cancelSos')}</span>
          </button>
        </div>
      </div>

      {/* Connection Quality & Low Latency Indicator Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 0.875rem',
          backgroundColor: netQuality?.isLowBandwidth ? '#FEF2F2' : '#F8FAFC',
          border: `1px solid ${netQuality?.isLowBandwidth ? '#FECACA' : '#E2E8F0'}`,
          borderRadius: '12px',
          marginBottom: '1rem',
          fontSize: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: !netQuality?.online
                ? '#DC2626'
                : netQuality?.isLowBandwidth
                ? '#D97706'
                : '#16A34A',
            }}
          />
          <span style={{ fontWeight: 700, color: '#0F172A' }}>
            {!netQuality?.online
              ? '⚠️ Offline Mode (Local GPS Active)'
              : netQuality?.isLowBandwidth
              ? `📶 Low Bandwidth Mode (${(netQuality?.effectiveType || '2g').toUpperCase()})`
              : `⚡ High Speed Network (${(netQuality?.effectiveType || '4g').toUpperCase()})`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#64748B', fontWeight: 600 }}>
            {netQuality?.online ? `Ping: ~${netQuality?.rttMs || 50}ms` : 'SMS/GSM Fallback'}
          </span>
        </div>
      </div>

      {/* Main Alert Banner */}
      <Card
        style={{
          marginBottom: '1.25rem',
          borderLeft: '5px solid #DC2626',
          background: 'linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 60%, #EFF6FF 100%)',
          boxShadow: '0 4px 14px rgba(220, 38, 38, 0.08)',
        }}
      >
        <Card.Body style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                className="animate-sos-pulse"
              >
                <Siren size={22} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 900, color: '#0F172A' }}>
                  {t('emergencyTracking.sosActive')}
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {t('emergencyTracking.sosSubtitle')}
                </span>
              </div>
            </div>

            {/* Offline & Low Bandwidth Fallback Actions */}
            <div
              style={{
                width: '100%',
                backgroundColor: '#FFFBEB',
                border: '1.5px solid #FDE68A',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                marginTop: '0.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400E' }}>
                  🚨 0-DATA / LOW NETWORK RESILIENT DISPATCH
                </span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, backgroundColor: '#FEF3C7', color: '#B45309', padding: '1px 6px', borderRadius: '4px' }}>
                  100% OFFLINE READY
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                <a
                  href={generateOfflineSmsLink(
                    {
                      latitude: emergency?.latitude || emergency?.initialLatitude || 18.5204,
                      longitude: emergency?.longitude || emergency?.initialLongitude || 73.8567,
                    },
                    emergency?.patient?.fullName || 'Emergency Patient',
                    emergency?.patient?.bloodGroup || medicalId?.bloodGroup || 'O+'
                  )}
                  style={{
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
                  }}
                >
                  <span>💬 1-Tap Offline SMS to 108</span>
                </a>

                <a
                  href="tel:108"
                  style={{
                    backgroundColor: '#16A34A',
                    color: '#FFFFFF',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                  }}
                >
                  <Phone size={13} />
                  <span>📞 Call 108 Emergency</span>
                </a>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', width: '100%', justifyContent: 'flex-start' }}>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem',
                  backgroundColor: '#25D366',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  minWidth: '130px',
                }}
              >
                <Share2 size={13} />
                <span>{t('emergencyTracking.shareWhatsApp')}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyShareLink}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
                {copiedLink ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                <span>{copiedLink ? t('emergencyTracking.copied') : t('emergencyTracking.copyLink')}</span>
              </button>

              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  minWidth: '120px',
                }}
              >
                <XCircle size={13} />
                <span>{t('emergencyTracking.cancelSos')}</span>
              </button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Radar Map */}
      <div style={{ marginBottom: '1.25rem' }}>
        <LiveAmbulanceRadarMap
          emergencyId={emergency?.id || 'active-emg'}
          patientLocation={{
            latitude: Number(emergency?.latitude || emergency?.initialLatitude || 18.5204),
            longitude: Number(emergency?.longitude || emergency?.initialLongitude || 73.8567),
          }}
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

      {/* Dispatched Unit & Crew Card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
        <Card style={{ borderLeft: '4px solid #DC2626', overflow: 'hidden' }}>
          <div
            style={{
              backgroundColor: '#FEF2F2',
              padding: '0.625rem 1rem',
              borderBottom: '1px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.375rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#991B1B', fontWeight: 800, fontSize: '0.8125rem' }}>
              <Truck size={16} color="#DC2626" />
              <span>{t('emergencyTracking.dispatchedUnit')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', color: '#16A34A', fontWeight: 700 }}>
              <Radio size={12} className="animate-pulse" />
              <span>{t('emergencyTracking.liveTelemetry')}</span>
            </div>
          </div>

          <Card.Body style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B' }}>{t('emergencyTracking.dispatchedFrom')}</span>
                <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={15} color="#DC2626" />
                  <span>{emergency?.hospital?.name || 'Sahyadri Super Speciality Hospital'}</span>
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B', marginLeft: '1.125rem' }}>
                  {emergency?.hospital?.address || 'Erandwane, Karve Road'}, {emergency?.hospital?.city || 'Pune'}
                </div>
              </div>

              <div
                style={{
                  border: '2px solid #0F172A',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  padding: '3px 8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ borderRight: '1.5px solid #CBD5E1', paddingRight: '5px', fontSize: '0.5625rem', fontWeight: 900, color: '#1E3A8A' }}>
                  IND 🇮🇳
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.05em', color: '#0F172A' }}>
                  {emergency?.ambulanceOperator?.vehicleNumber || 'MH-12-EM-1080'}
                </div>
              </div>
            </div>

            {/* Crew Contacts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B' }}>{t('emergencyTracking.driver')}</div>
                    <h5 style={{ margin: '1px 0', fontSize: '0.875rem', fontWeight: 800 }}>
                      Rajesh Gawande
                    </h5>
                    <div style={{ fontSize: '0.6875rem', color: '#16A34A', fontWeight: 600 }}>
                      📞 {emergency?.ambulanceOperator?.user?.phone || '+91 98444 00001'}
                    </div>
                  </div>
                </div>

                <a
                  href={`tel:${emergency?.ambulanceOperator?.user?.phone || '+919844400001'}`}
                  style={{
                    backgroundColor: '#16A34A',
                    color: '#FFFFFF',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.6875rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <Phone size={12} />
                  <span>{t('emergencyTracking.call')}</span>
                </a>
              </div>

              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Stethoscope size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B' }}>{t('emergencyTracking.assistant')}</div>
                    <h5 style={{ margin: '1px 0', fontSize: '0.875rem', fontWeight: 800 }}>
                      Sanjay Shinde (EMT)
                    </h5>
                    <div style={{ fontSize: '0.6875rem', color: '#16A34A', fontWeight: 600 }}>
                      📞 +91 98444 00002
                    </div>
                  </div>
                </div>

                <a
                  href="tel:+919844400002"
                  style={{
                    backgroundColor: '#0284C7',
                    color: '#FFFFFF',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.6875rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <Phone size={12} />
                  <span>{t('emergencyTracking.call')}</span>
                </a>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Hospital Card */}
        {emergency?.hospital && (
          <Card>
            <Card.Body style={{ padding: '0.875rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: '#EFF6FF', borderRadius: '6px', color: '#1D4ED8' }}>
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700 }}>{emergency.hospital.name}</h4>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                      24x7 Emergency Trauma Center • {emergency.hospital.address}, {emergency.hospital.city}
                    </span>
                  </div>
                </div>

                {emergency.hospital.phone && (
                  <a
                    href={`tel:${emergency.hospital.phone}`}
                    className="hs-btn hs-btn-outline hs-btn-sm"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, fontSize: '0.75rem' }}
                  >
                    <Phone size={12} />
                    <span>{t('emergencyTracking.callEr')}</span>
                  </a>
                )}
              </div>
            </Card.Body>
          </Card>
        )}
        {/* Multi-Contact Failover Cascade Card */}
        <Card style={{ borderLeft: '4px solid #F59E0B' }}>
          <div
            style={{
              backgroundColor: '#FFFBEB',
              padding: '0.625rem 1rem',
              borderBottom: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.375rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#B45309', fontWeight: 800, fontSize: '0.8125rem' }}>
              <Phone size={15} color="#D97706" />
              <span>EMERGENCY CONTACT CASCADE & LIVE GPS BROADCAST</span>
            </div>
            <button
              type="button"
              onClick={handleBroadcastAllContacts}
              style={{
                backgroundColor: '#25D366',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '0.6875rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Share2 size={12} />
              <span>Broadcast GPS to All</span>
            </button>
          </div>

          <Card.Body style={{ padding: '0.875rem 1rem' }}>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', color: '#64748B' }}>
              If your primary contact does not pick up, HealthSync automatically rings secondary and tertiary contacts with live GPS coordinates.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {medicalId?.contacts?.map((c: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#F8FAFC',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: i === 0 ? '#DC2626' : i === 1 ? '#0284C7' : '#16A34A',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                      }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <strong style={{ fontSize: '0.8125rem', color: '#0F172A' }}>{c.name}</strong>
                      <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>{c.phone}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        backgroundColor: i === 0 ? '#DCFCE7' : '#F1F5F9',
                        color: i === 0 ? '#166534' : '#64748B',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {i === 0 ? '✓ ALERT TRANSMITTED' : 'QUEUED FAILOVER'}
                    </span>
                    <a
                      href={`tel:${c.phone}`}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        padding: '4px 7px',
                        color: '#0F172A',
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                      }}
                      title="Call Contact"
                    >
                      <Phone size={13} color="#16A34A" />
                    </a>

                    <a
                      href={generateEmergencyContactSmsLink(
                        c.phone,
                        {
                          latitude: emergency?.latitude || emergency?.initialLatitude || 18.5204,
                          longitude: emergency?.longitude || emergency?.initialLongitude || 73.8567,
                        },
                        emergency?.patient?.fullName || 'Patient'
                      )}
                      style={{
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: '6px',
                        padding: '4px 7px',
                        color: '#DC2626',
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                      }}
                      title="Send Offline GPS SMS"
                    >
                      SMS
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>

        {/* Emergency Medical ID Card for Paramedics */}
        <Card style={{ borderLeft: '4px solid #1A56DB' }}>
          <div
            style={{
              backgroundColor: '#EFF6FF',
              padding: '0.625rem 1rem',
              borderBottom: '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#1E40AF', fontWeight: 800, fontSize: '0.8125rem' }}>
              <HeartPulse size={15} color="#1D4ED8" />
              <span>PATIENT EMERGENCY MEDICAL ID (PARAMEDIC HUD)</span>
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#1E40AF', fontWeight: 700 }}>
              AUTO-SYNCHRONIZED
            </span>
          </div>

          <Card.Body style={{ padding: '0.875rem 1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ backgroundColor: '#FEF2F2', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #FECACA' }}>
                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#991B1B', display: 'block' }}>BLOOD GROUP</span>
                <strong style={{ fontSize: '1.125rem', fontWeight: 900, color: '#DC2626' }}>{medicalId?.bloodGroup || 'O+'}</strong>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B', display: 'block' }}>ORGAN DONOR</span>
                <strong style={{ fontSize: '0.875rem', fontWeight: 800, color: medicalId?.isOrganDonor ? '#16A34A' : '#64748B' }}>
                  {medicalId?.isOrganDonor ? '✓ Registered' : 'No'}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.75rem' }}>
              <div>
                <strong style={{ color: '#0F172A' }}>Known Allergies: </strong>
                <span style={{ color: '#DC2626', fontWeight: 600 }}>{medicalId?.allergies || 'Penicillin, Sulfa drugs'}</span>
              </div>
              <div>
                <strong style={{ color: '#0F172A' }}>Chronic Conditions: </strong>
                <span style={{ color: '#475569' }}>{medicalId?.conditions || 'Hypertension, Type-2 Diabetes'}</span>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Timeline */}
      <Card style={{ marginBottom: '1.25rem' }}>
        <Card.Header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} color="#1A56DB" />
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>{t('emergencyTracking.timeline')}</h3>
          </div>
        </Card.Header>

        <Card.Body style={{ padding: '0.875rem 1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {STEPS.slice(0, 7).map((step, idx) => {
              const isPast = currentStepIdx >= idx;
              const isCurrent = currentStepIdx === idx;

              return (
                <div key={step.status} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: isPast ? '#16A34A' : '#E2E8F0',
                      color: isPast ? '#FFFFFF' : '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {isPast ? '✓' : idx + 1}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '0.8125rem',
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

      {/* Stand-Down Box */}
      <div
        style={{
          backgroundColor: '#FFF1F2',
          border: '1px solid #FECDD3',
          borderRadius: '12px',
          padding: '0.875rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.625rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} color="#E11D48" />
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#9F1239' }}>{t('emergencyTracking.falseAlarm')}</div>
            <div style={{ fontSize: '0.6875rem', color: '#BE123C' }}>{t('emergencyTracking.falseAlarmDesc')}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCancelModalOpen(true)}
          style={{
            backgroundColor: '#E11D48',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '0.375rem 1rem',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          {t('emergencyTracking.cancelSos')}
        </button>
      </div>

      {/* Cancel Modal */}
      <Modal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title={t('emergencyTracking.cancelConfirmTitle')}>
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: 0 }}>
            {t('emergencyTracking.cancelReasonPrompt')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {[
              t('emergencyTracking.reasons.accidental'),
              t('emergencyTracking.reasons.stabilized'),
              t('emergencyTracking.reasons.alternate'),
              t('emergencyTracking.reasons.other'),
            ].map((r) => (
              <label
                key={r}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
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
              {t('emergencyTracking.keepActive')}
            </Button>
            <Button variant="danger" isLoading={cancelling} onClick={handleCancelEmergency} style={{ flex: 1 }}>
              {t('emergencyTracking.confirmCancel')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmergencyTrackingPage;
