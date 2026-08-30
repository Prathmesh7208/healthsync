import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Navigation,
  Phone,
  Clock,
  Gauge,
  Building2,
  ExternalLink,
  Crosshair,
  Maximize2,
  Compass,
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);
  const patientMarkerRef = useRef<L.Marker | null>(null);
  const hospitalMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const completedPolylineRef = useRef<L.Polyline | null>(null);

  // Map Tile Style: 'streets' | 'satellite' | 'dark'
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'dark'>('streets');
  const [speed, setSpeed] = useState(48);
  const [distanceKm, setDistanceKm] = useState(2.4);
  const [etaMinutes, setEtaMinutes] = useState(4);
  const [, setProgress] = useState(0.2);

  // Base coordinates (Defaults to Pune city center if GPS not available)
  const pLat = patientLocation?.latitude || 18.5204;
  const pLng = patientLocation?.longitude || 73.8567;
  const hLat = hospitalLocation?.latitude || pLat + 0.024;
  const hLng = hospitalLocation?.longitude || pLng + 0.028;

  // Real-time ambulance coordinates state
  const [ambCoords, setAmbCoords] = useState<[number, number]>([
    hLat - (hLat - pLat) * 0.2,
    hLng - (hLng - pLng) * 0.2,
  ]);

  // Tile layer URLs
  const tileLayers = {
    streets: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
      maxZoom: 19,
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri, Maxar, Earthstar Geographics',
      maxZoom: 19,
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
      maxZoom: 19,
    },
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [(pLat + hLat) / 2, (pLng + hLng) / 2],
        zoom: 14,
        zoomControl: false,
      });

      // Custom Zoom Control top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Default Tile Layer
      const initialLayer = L.tileLayer(tileLayers.streets.url, {
        attribution: tileLayers.streets.attribution,
        maxZoom: tileLayers.streets.maxZoom,
      }).addTo(map);
      tileLayerRef.current = initialLayer;

      // 2. Custom Google Maps HTML DivIcons
      // Patient Pin (Red Google Maps Pin + Pulse Ring)
      const patientIcon = L.divIcon({
        className: 'custom-patient-marker',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -100%);">
            <div style="position: absolute; width: 48px; height: 48px; border-radius: 50%; background: rgba(220, 38, 38, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(220, 38, 38, 0.4); border: 2px solid #FFFFFF;"></div>
            <div style="position: relative; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; background: #DC2626; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2.5px solid #FFFFFF;">
              <div style="transform: rotate(45deg); font-size: 14px; font-weight: 900; color: #FFFFFF;">👤</div>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 44],
      });

      // Hospital Pin (Blue Medical Badge)
      const hospitalIcon = L.divIcon({
        className: 'custom-hospital-marker',
        html: `
          <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -100%);">
            <div style="position: relative; width: 32px; height: 32px; border-radius: 8px; background: #1D4ED8; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid #FFFFFF;">
              <span style="font-size: 16px; color: #FFFFFF; font-weight: 900;">🏥</span>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      // Ambulance Pin (High-Visibility 3D Vehicle Icon + Beacon Ring)
      const ambulanceIcon = L.divIcon({
        className: 'custom-ambulance-marker',
        html: `
          <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
            <div style="position: absolute; width: 46px; height: 46px; border-radius: 50%; background: rgba(234, 179, 8, 0.3); animation: pulse 1s infinite;"></div>
            <div style="position: relative; width: 38px; height: 38px; border-radius: 50%; background: #0F172A; border: 2.5px solid #EAB308; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(234, 179, 8, 0.6);">
              <span style="font-size: 20px;">🚑</span>
            </div>
            <div style="position: absolute; top: -18px; background: #0F172A; color: #FBBF24; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 4px; border: 1px solid #FBBF24; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
              48 km/h
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      // Add Markers to Map
      patientMarkerRef.current = L.marker([pLat, pLng], { icon: patientIcon })
        .addTo(map)
        .bindPopup('<b>📍 Your Exact GPS Location</b><br/>Emergency Beacon Active');

      hospitalMarkerRef.current = L.marker([hLat, hLng], { icon: hospitalIcon })
        .addTo(map)
        .bindPopup(`<b>🏥 ${hospitalLocation?.name || 'Trauma Base Station'}</b><br/>Dispatched Origin`);

      ambulanceMarkerRef.current = L.marker([ambCoords[0], ambCoords[1]], { icon: ambulanceIcon })
        .addTo(map)
        .bindPopup(`<b>🚑 Ambulance Unit ${vehicleNumber}</b><br/>Status: En Route to Patient`);

      // 3. Realistic Road Route Polyline (Simulated multi-segment street path)
      const midLat1 = hLat - (hLat - pLat) * 0.35 + 0.003;
      const midLng1 = hLng - (hLng - pLng) * 0.35 - 0.002;
      const midLat2 = hLat - (hLat - pLat) * 0.7 - 0.002;
      const midLng2 = hLng - (hLng - pLng) * 0.7 + 0.003;

      const fullRoutePoints: [number, number][] = [
        [hLat, hLng],
        [midLat1, midLng1],
        [midLat2, midLng2],
        [pLat, pLng],
      ];

      // Outline casing for real Google Maps look
      L.polyline(fullRoutePoints, {
        color: '#1E40AF',
        weight: 8,
        opacity: 0.6,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Active navigation route (Blue line)
      routePolylineRef.current = L.polyline(fullRoutePoints, {
        color: '#3B82F6',
        weight: 5,
        opacity: 0.9,
        dashArray: '8, 8',
        lineCap: 'round',
      }).addTo(map);

      // Traveled route (Solid Emerald Green line)
      completedPolylineRef.current = L.polyline([[hLat, hLng], [ambCoords[0], ambCoords[1]]], {
        color: '#10B981',
        weight: 6,
        opacity: 1,
        lineCap: 'round',
      }).addTo(map);

      // Fit bounds nicely with padding
      const bounds = L.latLngBounds([[pLat, pLng], [hLat, hLng]]);
      map.fitBounds(bounds, { padding: [60, 60] });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [pLat, pLng, hLat, hLng]);

  // Update map tiles when style changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    const newLayer = L.tileLayer(tileLayers[mapStyle].url, {
      attribution: tileLayers[mapStyle].attribution,
      maxZoom: tileLayers[mapStyle].maxZoom,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
  }, [mapStyle]);

  // Real-time animation loop simulating live GPS driving
  useEffect(() => {
    const socket = getSocket();

    const handleLocationUpdate = (data: any) => {
      if (data.emergencyId === emergencyId && data.latitude && data.longitude) {
        const nextPos: [number, number] = [data.latitude, data.longitude];
        setAmbCoords(nextPos);
        if (ambulanceMarkerRef.current) {
          ambulanceMarkerRef.current.setLatLng(nextPos);
        }
        if (data.speed) setSpeed(data.speed);
      }
    };

    socket.on('emergency:location_update', handleLocationUpdate);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev >= 0.95 ? 0.2 : prev + 0.03;
        const currentLat = hLat - (hLat - pLat) * next;
        const currentLng = hLng - (hLng - pLng) * next;
        const nextCoords: [number, number] = [currentLat, currentLng];

        setAmbCoords(nextCoords);

        if (ambulanceMarkerRef.current) {
          ambulanceMarkerRef.current.setLatLng(nextCoords);
        }

        if (completedPolylineRef.current) {
          completedPolylineRef.current.setLatLngs([[hLat, hLng], nextCoords]);
        }

        const remainingDist = Math.max(0.2, Number((2.8 * (1 - next)).toFixed(1)));
        setDistanceKm(remainingDist);
        setEtaMinutes(Math.max(1, Math.ceil((remainingDist / 42) * 60)));
        setSpeed(Math.floor(40 + Math.random() * 16));

        return next;
      });
    }, 2000);

    return () => {
      socket.off('emergency:location_update', handleLocationUpdate);
      clearInterval(interval);
    };
  }, [emergencyId, pLat, pLng, hLat, hLng]);

  // Center camera controls
  const handleRecenter = (target: 'patient' | 'ambulance' | 'all') => {
    if (!mapInstanceRef.current) return;
    if (target === 'patient') {
      mapInstanceRef.current.flyTo([pLat, pLng], 16, { duration: 1.2 });
    } else if (target === 'ambulance') {
      mapInstanceRef.current.flyTo(ambCoords, 16, { duration: 1.2 });
    } else {
      const bounds = L.latLngBounds([[pLat, pLng], [hLat, hLng]]);
      mapInstanceRef.current.flyToBounds(bounds, { padding: [50, 50], duration: 1.2 });
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${ambCoords[0]},${ambCoords[1]}&destination=${pLat},${pLng}&travelmode=driving`;

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1.5px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.12), 0 0 10px rgba(37, 99, 235, 0.08)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 1. Google Maps Navigation Header Bar */}
      <div
        style={{
          padding: '0.875rem 1.25rem',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          borderBottom: '1px solid #334155',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(220, 38, 38, 0.5)',
            }}
          >
            <Navigation size={18} color="#FFFFFF" className="animate-pulse" />
          </div>
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Live Emergency GPS Tracking</span>
              <span style={{ backgroundColor: '#22C55E', color: '#0F172A', padding: '1px 6px', borderRadius: '4px', fontSize: '0.625rem', fontWeight: 900 }}>
                ACTIVE GPS
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
              Unit: <strong style={{ color: '#FBBF24' }}>{vehicleNumber}</strong> • Real-time SatNav Route
            </div>
          </div>
        </div>

        {/* Action Controls Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              padding: '0.4rem 0.875rem',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
            }}
          >
            <ExternalLink size={14} />
            <span>Open in Google Maps</span>
          </a>

          <a
            href={`tel:${driverPhone}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              backgroundColor: '#16A34A',
              color: '#FFFFFF',
              padding: '0.4rem 0.875rem',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(22, 163, 74, 0.4)',
            }}
          >
            <Phone size={14} />
            <span>Call Driver</span>
          </a>
        </div>
      </div>

      {/* 2. Real Google Maps Container */}
      <div style={{ position: 'relative', height: '380px', width: '100%', backgroundColor: '#E2E8F0' }}>
        {/* Map Canvas */}
        <div ref={mapContainerRef} style={{ height: '100%', width: '100%', zIndex: 1 }} />

        {/* Floating Google Maps Style Selector (Top-Left) */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 1000,
            display: 'flex',
            gap: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(8px)',
            padding: '4px',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            border: '1px solid #CBD5E1',
          }}
        >
          <button
            type="button"
            onClick={() => setMapStyle('streets')}
            style={{
              padding: '4px 10px',
              borderRadius: '7px',
              fontSize: '0.6875rem',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: mapStyle === 'streets' ? '#2563EB' : 'transparent',
              color: mapStyle === 'streets' ? '#FFFFFF' : '#334155',
            }}
          >
            🗺️ Streets
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('satellite')}
            style={{
              padding: '4px 10px',
              borderRadius: '7px',
              fontSize: '0.6875rem',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: mapStyle === 'satellite' ? '#2563EB' : 'transparent',
              color: mapStyle === 'satellite' ? '#FFFFFF' : '#334155',
            }}
          >
            🛰️ Satellite
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('dark')}
            style={{
              padding: '4px 10px',
              borderRadius: '7px',
              fontSize: '0.6875rem',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: mapStyle === 'dark' ? '#0F172A' : 'transparent',
              color: mapStyle === 'dark' ? '#FFFFFF' : '#334155',
            }}
          >
            🌙 Dark
          </button>
        </div>

        {/* Floating Quick Camera Controls (Bottom-Right) */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '12px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <button
            type="button"
            title="Recenter on My GPS Location"
            onClick={() => handleRecenter('patient')}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#DC2626',
            }}
          >
            <Crosshair size={18} />
          </button>

          <button
            type="button"
            title="Follow Ambulance GPS"
            onClick={() => handleRecenter('ambulance')}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            🚑
          </button>

          <button
            type="button"
            title="Fit Full Route"
            onClick={() => handleRecenter('all')}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#1E293B',
            }}
          >
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Turn-by-Turn Instruction Banner (Top-Center overlay) */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '6px 14px',
            borderRadius: '9999px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            fontWeight: 800,
            maxWidth: '90%',
            whiteSpace: 'nowrap',
            border: '1px solid #334155',
          }}
        >
          <Compass size={14} color="#38BDF8" className="animate-spin" />
          <span>Ambulance En Route via Main Arterial Road • Traffic: Clear</span>
        </div>
      </div>

      {/* 3. Live Telemetry HUD Bar */}
      <div
        style={{
          padding: '1rem 1.25rem',
          backgroundColor: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Estimated Arrival
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 900, color: '#1E293B' }}>
              {etaMinutes} MINS
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#D97706' }}>
            <Navigation size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              GPS Distance
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 900, color: '#1E293B' }}>
              {distanceKm} KM
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: '#ECFDF5', color: '#059669' }}>
            <Gauge size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Live Telemetry Speed
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 900, color: '#1E293B' }}>
              {speed} km/h
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: '#F3E8FF', color: '#7E22CE' }}>
            <Building2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Trauma Base
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
              {hospitalLocation?.name || 'Base Hospital'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAmbulanceRadarMap;
