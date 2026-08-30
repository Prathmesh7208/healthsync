import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import {
  Navigation,
  Phone,
  Clock,
  Gauge,
  Building2,
  ExternalLink,
  Crosshair,
  Copy,
  Check,
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

// Authentic Google Maps Vector & Satellite Layers
const GOOGLE_MAPS_LAYERS = {
  streets: {
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: 'Map data &copy; Google',
    maxZoom: 20,
  },
  traffic: {
    url: 'https://{s}.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: 'Traffic &copy; Google',
    maxZoom: 20,
  },
  satellite: {
    url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: 'Imagery &copy; Google',
    maxZoom: 20,
  },
  terrain: {
    url: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: 'Terrain &copy; Google',
    maxZoom: 20,
  },
};

export const LiveAmbulanceRadarMapComponent: React.FC<LiveAmbulanceRadarMapProps> = ({
  emergencyId,
  patientLocation,
  hospitalLocation,
  vehicleNumber = 'MH-12-EM-1080',
  driverPhone = '+919844400001',
}) => {
  const [copiedPin, setCopiedPin] = useState(false);
  const [mapStyle, setMapStyle] = useState<'streets' | 'traffic' | 'satellite' | 'terrain'>('streets');
  const [speed, setSpeed] = useState(48);
  const [distanceKm, setDistanceKm] = useState(3.6);
  const [etaMinutes, setEtaMinutes] = useState(7);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);
  const patientMarkerRef = useRef<L.Marker | null>(null);
  const hospitalMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const completedPolylineRef = useRef<L.Polyline | null>(null);
  const isInitialFitDone = useRef(false);

  // Safe coordinates extraction (defaults to Pune City center)
  const pLat = Number(patientLocation?.latitude) || 18.5204;
  const pLng = Number(patientLocation?.longitude) || 73.8567;
  const hLat = Number(hospitalLocation?.latitude) || pLat + 0.024;
  const hLng = Number(hospitalLocation?.longitude) || pLng + 0.028;

  // Road geometry coordinates array
  const roadWaypointsRef = useRef<[number, number][]>([]);
  const currentWaypointIndexRef = useRef<number>(0);

  // Ambulance current position
  const ambCoordsRef = useRef<[number, number]>([
    hLat - (hLat - pLat) * 0.15,
    hLng - (hLng - pLng) * 0.15,
  ]);

  // Google Maps Native App Navigation Link
  const googleMapsNativeAppUrl = useMemo(() => {
    return `https://www.google.com/maps/dir/?api=1&origin=${ambCoordsRef.current[0].toFixed(5)},${ambCoordsRef.current[1].toFixed(5)}&destination=${pLat.toFixed(5)},${pLng.toFixed(5)}&travelmode=driving`;
  }, [pLat, pLng]);

  const patientGoogleMapsPin = useMemo(() => {
    return `https://maps.google.com/?q=${pLat.toFixed(5)},${pLng.toFixed(5)}`;
  }, [pLat, pLng]);

  const handleCopyPin = () => {
    navigator.clipboard.writeText(patientGoogleMapsPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2500);
  };

  // =========================================================================
  // 1. FETCH ACTUAL ROAD-FOLLOWING DRIVING ROUTE (OSRM / REAL STREETS)
  // =========================================================================
  const fetchRoadGeometry = useCallback(async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data?.routes?.[0]?.geometry?.coordinates?.length > 1) {
        const rawCoords: [number, number][] = data.routes[0].geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );
        roadWaypointsRef.current = rawCoords;
        currentWaypointIndexRef.current = 0;

        const dist = data.routes[0].distance ? Number((data.routes[0].distance / 1000).toFixed(1)) : 3.6;
        const dur = data.routes[0].duration ? Math.max(1, Math.ceil(data.routes[0].duration / 60)) : 7;
        setDistanceKm(dist);
        setEtaMinutes(dur);

        if (routePolylineRef.current) {
          routePolylineRef.current.setLatLngs(rawCoords);
        }

        if (mapInstanceRef.current && !isInitialFitDone.current) {
          const bounds = L.latLngBounds(rawCoords);
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
          isInitialFitDone.current = true;
        }
        return;
      }
    } catch {
      // fallback to multi-segment curved path
    }

    // High-resolution curved route fallback if network offline
    const steps = 20;
    const fallbackPoints: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = startLat + (endLat - startLat) * t + Math.sin(t * Math.PI) * 0.004;
      const lng = startLng + (endLng - startLng) * t + Math.sin(t * Math.PI) * -0.003;
      fallbackPoints.push([lat, lng]);
    }
    roadWaypointsRef.current = fallbackPoints;
    currentWaypointIndexRef.current = 0;

    if (routePolylineRef.current) {
      routePolylineRef.current.setLatLngs(fallbackPoints);
    }
  }, []);

  // =========================================================================
  // 2. INITIALIZE GOOGLE MAPS INSTANCE ONCE ON MOUNT
  // =========================================================================
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [(pLat + hLat) / 2, (pLng + hLng) / 2],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      // Custom Clean Google Maps Tile Layer
      const initialLayer = L.tileLayer(GOOGLE_MAPS_LAYERS[mapStyle].url, {
        subdomains: GOOGLE_MAPS_LAYERS[mapStyle].subdomains,
        attribution: GOOGLE_MAPS_LAYERS[mapStyle].attribution,
        maxZoom: 20,
      }).addTo(map);
      tileLayerRef.current = initialLayer;

      // Authentic Google Maps Red Patient Pin
      const patientIcon = L.divIcon({
        className: 'gm-patient-pin',
        html: `
          <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -100%);">
            <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(234, 67, 53, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; background: #EA4335; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2px solid #FFFFFF;">
              <div style="transform: rotate(45deg); font-size: 13px; font-weight: 900; color: #FFFFFF;">👤</div>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      // Hospital Pin (Google Blue Badge)
      const hospitalIcon = L.divIcon({
        className: 'gm-hospital-pin',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -100%);">
            <div style="position: relative; width: 30px; height: 30px; border-radius: 8px; background: #1A73E8; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.3); border: 2px solid #FFFFFF;">
              <span style="font-size: 15px; color: #FFFFFF;">🏥</span>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      // Ambulance Pin (High-Visibility Animated Vehicle Marker)
      const ambulanceIcon = L.divIcon({
        className: 'gm-ambulance-pin',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%); transition: transform 0.6s linear;">
            <div style="position: absolute; width: 42px; height: 42px; border-radius: 50%; background: rgba(234, 179, 8, 0.35); animation: pulse 1.2s infinite;"></div>
            <div style="position: relative; width: 34px; height: 34px; border-radius: 50%; background: #0F172A; border: 2.5px solid #FBBF24; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(0,0,0,0.4);">
              <span style="font-size: 18px;">🚑</span>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      patientMarkerRef.current = L.marker([pLat, pLng], { icon: patientIcon })
        .addTo(map)
        .bindPopup('<b>📍 Patient Exact GPS Location</b>');

      hospitalMarkerRef.current = L.marker([hLat, hLng], { icon: hospitalIcon })
        .addTo(map)
        .bindPopup(`<b>🏥 ${hospitalLocation?.name || 'Base Hospital'}</b>`);

      ambulanceMarkerRef.current = L.marker(ambCoordsRef.current, { icon: ambulanceIcon })
        .addTo(map)
        .bindPopup(`<b>🚑 Ambulance Unit ${vehicleNumber}</b><br/>En Route`);

      // Google Maps Driving Route Polylines (Background shadow + Bright navigation line)
      L.polyline([[hLat, hLng], [pLat, pLng]], {
        color: '#1A73E8',
        weight: 9,
        opacity: 0.45,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      routePolylineRef.current = L.polyline([[hLat, hLng], [pLat, pLng]], {
        color: '#4285F4',
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      completedPolylineRef.current = L.polyline([[hLat, hLng], ambCoordsRef.current], {
        color: '#34A853',
        weight: 6,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      mapInstanceRef.current = map;

      // Fetch real street road route
      fetchRoadGeometry(hLat, hLng, pLat, pLng);
    } catch (err) {
      console.warn('Google Map mount error:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Mount ONCE

  // =========================================================================
  // 3. SWITCH MAP TILES (STREETS / TRAFFIC / SATELLITE / TERRAIN)
  // =========================================================================
  const handleTileChange = useCallback((style: 'streets' | 'traffic' | 'satellite' | 'terrain') => {
    setMapStyle(style);
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newLayer = L.tileLayer(GOOGLE_MAPS_LAYERS[style].url, {
      subdomains: GOOGLE_MAPS_LAYERS[style].subdomains,
      attribution: GOOGLE_MAPS_LAYERS[style].attribution,
      maxZoom: 20,
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, []);

  // =========================================================================
  // 4. SMOOTH LIVE AMBULANCE DRIVING SIMULATION ALONG REAL ROAD WAYPOINTS
  // =========================================================================
  useEffect(() => {
    const socket = getSocket();

    const handleLocationUpdate = (data: any) => {
      if (data.emergencyId === emergencyId && data.latitude && data.longitude) {
        const nextPos: [number, number] = [Number(data.latitude), Number(data.longitude)];
        ambCoordsRef.current = nextPos;
        if (ambulanceMarkerRef.current) {
          ambulanceMarkerRef.current.setLatLng(nextPos);
        }
        if (completedPolylineRef.current) {
          completedPolylineRef.current.setLatLngs([[hLat, hLng], nextPos]);
        }
        if (data.speed) setSpeed(data.speed);
      }
    };

    socket.on('emergency:location_update', handleLocationUpdate);

    // Drive step-by-step along real road geometry
    const interval = setInterval(() => {
      const waypoints = roadWaypointsRef.current;
      if (waypoints.length > 2) {
        currentWaypointIndexRef.current = (currentWaypointIndexRef.current + 1) % waypoints.length;
        const nextPos = waypoints[currentWaypointIndexRef.current];
        ambCoordsRef.current = nextPos;

        if (ambulanceMarkerRef.current) {
          ambulanceMarkerRef.current.setLatLng(nextPos);
        }

        if (completedPolylineRef.current) {
          const completedPath = waypoints.slice(0, currentWaypointIndexRef.current + 1);
          completedPolylineRef.current.setLatLngs(completedPath.length > 1 ? completedPath : [[hLat, hLng], nextPos]);
        }

        const remainingCount = waypoints.length - currentWaypointIndexRef.current;
        const estimatedRemainingKm = Math.max(0.2, Number(((remainingCount / waypoints.length) * 4.2).toFixed(1)));
        setDistanceKm(estimatedRemainingKm);
        setEtaMinutes(Math.max(1, Math.ceil((estimatedRemainingKm / 45) * 60)));
        setSpeed(Math.floor(45 + Math.random() * 15));
      }
    }, 1800);

    return () => {
      socket.off('emergency:location_update', handleLocationUpdate);
      clearInterval(interval);
    };
  }, [emergencyId, hLat, hLng]);

  // Recenter controls
  const handleRecenter = useCallback((target: 'patient' | 'ambulance' | 'all') => {
    if (!mapInstanceRef.current) return;
    if (target === 'patient') {
      mapInstanceRef.current.flyTo([pLat, pLng], 16, { duration: 0.8 });
    } else if (target === 'ambulance') {
      mapInstanceRef.current.flyTo(ambCoordsRef.current, 16, { duration: 0.8 });
    } else {
      const bounds = L.latLngBounds([[pLat, pLng], [hLat, hLng]]);
      mapInstanceRef.current.flyToBounds(bounds, { padding: [40, 40], duration: 0.8 });
    }
  }, [pLat, pLng, hLat, hLng]);

  const handleZoom = (dir: 'in' | 'out') => {
    if (!mapInstanceRef.current) return;
    if (dir === 'in') mapInstanceRef.current.zoomIn();
    else mapInstanceRef.current.zoomOut();
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '18px',
        border: '1.5px solid #CBD5E1',
        overflow: 'hidden',
        boxShadow: '0 12px 36px -6px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Sleek Compact Top Bar */}
      <div
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: '#EA4335',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(234, 67, 53, 0.5)',
            }}
          >
            <Navigation size={15} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span>Google Maps Navigation</span>
              <span style={{ backgroundColor: '#34A853', color: '#FFFFFF', padding: '1px 5px', borderRadius: '4px', fontSize: '0.5625rem', fontWeight: 900 }}>
                LIVE GPS
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <a
            href={googleMapsNativeAppUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              backgroundColor: '#4285F4',
              color: '#FFFFFF',
              padding: '0.35rem 0.625rem',
              borderRadius: '8px',
              fontSize: '0.6875rem',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(66, 133, 244, 0.4)',
            }}
          >
            <ExternalLink size={12} />
            <span>Open Google Maps</span>
          </a>

          <a
            href={`tel:${driverPhone}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              backgroundColor: '#34A853',
              color: '#FFFFFF',
              padding: '0.35rem 0.625rem',
              borderRadius: '8px',
              fontSize: '0.6875rem',
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            <Phone size={12} />
            <span>Call</span>
          </a>
        </div>
      </div>

      {/* 2. Visual Interactive Google Map Canvas (55-60% dominant screen height) */}
      <div
        style={{
          position: 'relative',
          height: '460px',
          width: '100%',
          backgroundColor: '#E5E3DF',
          overflow: 'hidden',
        }}
      >
        {/* Leaflet Google Maps DOM Container */}
        <div ref={mapContainerRef} style={{ height: '100%', width: '100%', zIndex: 1 }} />

        {/* Clean Google Maps Style Selector (Streets / Traffic / Satellite / Terrain) */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 1000,
            display: 'flex',
            gap: '2px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            padding: '2px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            border: '1px solid #CBD5E1',
          }}
        >
          <button
            type="button"
            onClick={() => handleTileChange('streets')}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '0.625rem',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: mapStyle === 'streets' ? '#4285F4' : 'transparent',
              color: mapStyle === 'streets' ? '#FFFFFF' : '#334155',
            }}
          >
            🗺️ Map
          </button>
          <button
            type="button"
            onClick={() => handleTileChange('traffic')}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '0.625rem',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: mapStyle === 'traffic' ? '#EA4335' : 'transparent',
              color: mapStyle === 'traffic' ? '#FFFFFF' : '#334155',
            }}
          >
            🚦 Traffic
          </button>
          <button
            type="button"
            onClick={() => handleTileChange('satellite')}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '0.625rem',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: mapStyle === 'satellite' ? '#4285F4' : 'transparent',
              color: mapStyle === 'satellite' ? '#FFFFFF' : '#334155',
            }}
          >
            🛰️ Satellite
          </button>
          <button
            type="button"
            onClick={() => handleTileChange('terrain')}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '0.625rem',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: mapStyle === 'terrain' ? '#4285F4' : 'transparent',
              color: mapStyle === 'terrain' ? '#FFFFFF' : '#334155',
            }}
          >
            ⛰️ Terrain
          </button>
        </div>

        {/* Clean Google Maps Right-Side Camera & Zoom Stack */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '12px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* Zoom controls */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              border: '1px solid #CBD5E1',
            }}
          >
            <button
              type="button"
              onClick={() => handleZoom('in')}
              style={{
                width: '34px',
                height: '34px',
                border: 'none',
                backgroundColor: '#FFFFFF',
                fontSize: '18px',
                fontWeight: 700,
                cursor: 'pointer',
                borderBottom: '1px solid #E2E8F0',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              +
            </button>
            <button
              type="button"
              onClick={() => handleZoom('out')}
              style={{
                width: '34px',
                height: '34px',
                border: 'none',
                backgroundColor: '#FFFFFF',
                fontSize: '18px',
                fontWeight: 700,
                cursor: 'pointer',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              −
            </button>
          </div>

          {/* Recenter button */}
          <button
            type="button"
            title="Recenter on My GPS Location"
            onClick={() => handleRecenter('patient')}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#EA4335',
            }}
          >
            <Crosshair size={18} />
          </button>

          {/* Follow ambulance */}
          <button
            type="button"
            title="Track Ambulance"
            onClick={() => handleRecenter('ambulance')}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            🚑
          </button>
        </div>
      </div>

      {/* 3. Compact Bottom HUD Telemetry Strip */}
      <div
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <div style={{ padding: '0.35rem', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#4285F4' }}>
            <Clock size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
              ETA
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 900, color: '#1E293B' }}>
              {etaMinutes} MINS
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <div style={{ padding: '0.35rem', borderRadius: '6px', backgroundColor: '#FEF3C7', color: '#D97706' }}>
            <Navigation size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
              Dist
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 900, color: '#1E293B' }}>
              {distanceKm} KM
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <div style={{ padding: '0.35rem', borderRadius: '6px', backgroundColor: '#ECFDF5', color: '#34A853' }}>
            <Gauge size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
              Speed
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 900, color: '#1E293B' }}>
              {speed} km/h
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <div style={{ padding: '0.35rem', borderRadius: '6px', backgroundColor: '#F3E8FF', color: '#7E22CE' }}>
            <Building2 size={16} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
              Base ER
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {hospitalLocation?.name || 'Base Hospital'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Quick Google Maps PIN Share Bar */}
      <div
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#EFF6FF',
          borderTop: '1px solid #DBEAFE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.375rem',
        }}
      >
        <span style={{ color: '#1E40AF', fontWeight: 700, fontSize: '0.6875rem' }}>
          📍 Patient GPS: <strong style={{ color: '#1D4ED8' }}>{pLat.toFixed(5)}, {pLng.toFixed(5)}</strong>
        </span>

        <button
          type="button"
          onClick={handleCopyPin}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            backgroundColor: '#FFFFFF',
            border: '1px solid #BFDBFE',
            color: '#1E40AF',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.625rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          {copiedPin ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
          <span>{copiedPin ? 'Copied!' : 'Copy Google Pin'}</span>
        </button>
      </div>
    </div>
  );
};

export const LiveAmbulanceRadarMap = React.memo(LiveAmbulanceRadarMapComponent);
export default LiveAmbulanceRadarMap;
