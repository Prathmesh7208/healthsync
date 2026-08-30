import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import {
  Crosshair,
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
  onMetricsUpdate?: (metrics: { etaMinutes: number; distanceKm: number; speed: number }) => void;
}

// Authentic Google Maps Vector & Satellite Layers
const GOOGLE_MAPS_LAYERS = {
  streets: {
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps',
    maxZoom: 20,
  },
  satellite: {
    url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps Satellite',
    maxZoom: 20,
  },
};

export const LiveAmbulanceRadarMapComponent: React.FC<LiveAmbulanceRadarMapProps> = ({
  emergencyId,
  patientLocation,
  hospitalLocation,
  vehicleNumber = 'MH-12-EM-1080',
  onMetricsUpdate,
}) => {
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);
  const patientMarkerRef = useRef<L.Marker | null>(null);
  const hospitalMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const completedPolylineRef = useRef<L.Polyline | null>(null);

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

        const dist = data.routes[0].distance ? Number((data.routes[0].distance / 1000).toFixed(1)) : 3.8;
        const dur = data.routes[0].duration ? Math.max(1, Math.ceil(data.routes[0].duration / 60)) : 6;
        if (onMetricsUpdate) {
          onMetricsUpdate({ distanceKm: dist, etaMinutes: dur, speed: 52 });
        }

        if (routePolylineRef.current) {
          routePolylineRef.current.setLatLngs(rawCoords);
        }

        if (mapInstanceRef.current) {
          const bounds = L.latLngBounds(rawCoords);
          mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
        }
        return;
      }
    } catch {
      // Fallback
    }

    // High-resolution curved route fallback
    const steps = 24;
    const fallbackPoints: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = startLat + (endLat - startLat) * t + Math.sin(t * Math.PI) * 0.003;
      const lng = startLng + (endLng - startLng) * t + Math.sin(t * Math.PI) * -0.002;
      fallbackPoints.push([lat, lng]);
    }
    roadWaypointsRef.current = fallbackPoints;
    currentWaypointIndexRef.current = 0;

    if (routePolylineRef.current) {
      routePolylineRef.current.setLatLngs(fallbackPoints);
    }
    if (mapInstanceRef.current) {
      const bounds = L.latLngBounds([[startLat, startLng], [endLat, endLng]]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [onMetricsUpdate]);

  // =========================================================================
  // 2. INITIALIZE GOOGLE MAPS ONCE ON MOUNT
  // =========================================================================
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      // Safely reset container _leaflet_id if already set by previous render
      if ((mapContainerRef.current as any)._leaflet_id != null) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [(pLat + hLat) / 2, (pLng + hLng) / 2],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });


      // Google Maps Vector Layer
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
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -100%);">
            <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(234, 67, 53, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; background: #EA4335; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2px solid #FFFFFF;">
              <div style="transform: rotate(45deg); font-size: 13px; font-weight: 900; color: #FFFFFF;">👤</div>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      // Hospital Pin (Google Blue Badge)
      const hospitalIcon = L.divIcon({
        className: 'gm-hospital-pin',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -100%);">
            <div style="position: relative; width: 28px; height: 28px; border-radius: 8px; background: #1A73E8; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.3); border: 2px solid #FFFFFF;">
              <span style="font-size: 14px; color: #FFFFFF;">🏥</span>
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      // Ambulance Pin (High-Visibility Animated Vehicle Marker)
      const ambulanceIcon = L.divIcon({
        className: 'gm-ambulance-pin',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
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
        .bindPopup('<b>📍 Patient Location</b>');

      hospitalMarkerRef.current = L.marker([hLat, hLng], { icon: hospitalIcon })
        .addTo(map)
        .bindPopup(`<b>🏥 ${hospitalLocation?.name || 'Base Hospital'}</b>`);

      ambulanceMarkerRef.current = L.marker(ambCoordsRef.current, { icon: ambulanceIcon })
        .addTo(map)
        .bindPopup(`<b>🚑 Unit ${vehicleNumber}</b><br/>En Route`);

      // Google Maps Driving Route Polylines
      L.polyline([[hLat, hLng], [pLat, pLng]], {
        color: '#1A73E8',
        weight: 8,
        opacity: 0.4,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      routePolylineRef.current = L.polyline([[hLat, hLng], [pLat, pLng]], {
        color: '#4285F4',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      completedPolylineRef.current = L.polyline([[hLat, hLng], ambCoordsRef.current], {
        color: '#34A853',
        weight: 5,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      mapInstanceRef.current = map;
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
  }, []); // Run ONCE on mount

  // =========================================================================
  // 3. SWITCH MAP TILES (MAP / SATELLITE)
  // =========================================================================
  const handleTileChange = useCallback((style: 'streets' | 'satellite') => {
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
  // 4. SMOOTH LIVE AMBULANCE DRIVING SIMULATION ALONG ROAD WAYPOINTS
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
      }
    };

    socket.on('emergency:location_update', handleLocationUpdate);

    // Drive step-by-step along real road geometry
    const interval = setInterval(() => {
      const waypoints = roadWaypointsRef.current;
      if (waypoints.length > 2) {
        // Move towards patient without looping back
        if (currentWaypointIndexRef.current < waypoints.length - 1) {
          currentWaypointIndexRef.current += 1;
        }
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
        const estimatedRemainingKm = Math.max(0.2, Number(((remainingCount / waypoints.length) * 4.0).toFixed(1)));
        const nextEta = Math.max(1, Math.ceil((estimatedRemainingKm / 45) * 60));
        const nextSpeed = Math.floor(46 + Math.random() * 12);

        if (onMetricsUpdate) {
          onMetricsUpdate({ distanceKm: estimatedRemainingKm, etaMinutes: nextEta, speed: nextSpeed });
        }
      }
    }, 2000);

    return () => {
      socket.off('emergency:location_update', handleLocationUpdate);
      clearInterval(interval);
    };
  }, [emergencyId, hLat, hLng, onMetricsUpdate]);

  // Recenter controls
  const handleRecenter = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const waypoints = roadWaypointsRef.current;
    if (waypoints.length > 1) {
      const bounds = L.latLngBounds(waypoints);
      mapInstanceRef.current.flyToBounds(bounds, { padding: [40, 40], duration: 0.8 });
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
        position: 'relative',
        height: '420px',
        width: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
        border: '1.5px solid #E2E8F0',
        backgroundColor: '#E5E3DF',
      }}
    >
      {/* Map DOM Canvas */}
      <div ref={mapContainerRef} style={{ height: '100%', width: '100%', zIndex: 1 }} />

      {/* Top-Right Clean Layer Switcher */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 1000,
          display: 'flex',
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          border: '1px solid #CBD5E1',
          overflow: 'hidden',
        }}
      >
        <button
          type="button"
          onClick={() => handleTileChange('streets')}
          style={{
            padding: '5px 10px',
            fontSize: '0.6875rem',
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: mapStyle === 'streets' ? '#4285F4' : '#FFFFFF',
            color: mapStyle === 'streets' ? '#FFFFFF' : '#475569',
          }}
        >
          Map
        </button>
        <button
          type="button"
          onClick={() => handleTileChange('satellite')}
          style={{
            padding: '5px 10px',
            fontSize: '0.6875rem',
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: mapStyle === 'satellite' ? '#4285F4' : '#FFFFFF',
            color: mapStyle === 'satellite' ? '#FFFFFF' : '#475569',
          }}
        >
          Satellite
        </button>
      </div>

      {/* Bottom-Right Minimal Camera Stack */}
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
        {/* Zoom */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            border: '1px solid #CBD5E1',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            onClick={() => handleZoom('in')}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              backgroundColor: '#FFFFFF',
              fontSize: '16px',
              fontWeight: 800,
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
              width: '32px',
              height: '32px',
              border: 'none',
              backgroundColor: '#FFFFFF',
              fontSize: '16px',
              fontWeight: 800,
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

        {/* Recenter */}
        <button
          type="button"
          title="Recenter Tracking View"
          onClick={handleRecenter}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#EA4335',
          }}
        >
          <Crosshair size={16} />
        </button>
      </div>
    </div>
  );
};

class RadarMapErrorBoundary extends React.Component<
  LiveAmbulanceRadarMapProps,
  { hasError: boolean }
> {

  constructor(props: LiveAmbulanceRadarMapProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn('Radar Map Boundary caught error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            height: '420px',
            width: '100%',
            borderRadius: '16px',
            backgroundColor: '#0F172A',
            border: '2px solid #38BDF8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            padding: '1.5rem',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '2px solid #38BDF8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              fontSize: '28px',
            }}
          >
            🚑
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0 0 0.375rem 0', color: '#F8FAFC' }}>
            Live Emergency Dispatch Radar Active
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: '0 0 1rem 0', maxWidth: '360px' }}>
            Unit {this.props.vehicleNumber || 'MH-12-EM-1080'} is en route to your GPS location with trauma response crew.
          </p>
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${this.props.patientLocation.latitude},${this.props.patientLocation.longitude}&travelmode=driving`}
            target="_blank"
            rel="noreferrer"
            style={{
              backgroundColor: '#4285F4',
              color: '#FFFFFF',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.8125rem',
              textDecoration: 'none',
            }}
          >
            Open in Google Maps App ↗
          </a>
        </div>
      );
    }
    return <LiveAmbulanceRadarMapComponent {...this.props} />;
  }
}

export const LiveAmbulanceRadarMap = React.memo(RadarMapErrorBoundary);
export default LiveAmbulanceRadarMap;

