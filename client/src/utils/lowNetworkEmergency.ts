/**
 * HealthSync Low-Latency & Offline Emergency SOS Engine
 * Provides resilient emergency dispatch across 2G/3G, high packet loss, and zero-connectivity environments.
 */

export interface NetworkQuality {
  online: boolean;
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'offline';
  rttMs: number;
  downlinkMb: number;
  isLowBandwidth: boolean;
}

export interface CachedGPS {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

// 1. Measure and stream live network connectivity & latency
export const getNetworkQuality = (): NetworkQuality => {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (!isOnline) {
    return {
      online: false,
      effectiveType: 'offline',
      rttMs: 9999,
      downlinkMb: 0,
      isLowBandwidth: true,
    };
  }

  const conn: any = typeof navigator !== 'undefined' ? (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection : null;

  const effectiveType = conn?.effectiveType || '4g';
  const rttMs = conn?.rtt || 50;
  const downlinkMb = conn?.downlink || 10;
  const isLowBandwidth = effectiveType === '2g' || effectiveType === 'slow-2g' || rttMs > 400 || !isOnline;

  return {
    online: isOnline,
    effectiveType,
    rttMs,
    downlinkMb,
    isLowBandwidth,
  };
};

// 2. Cache & Retrieve Last Known GPS in <1ms
export const getCachedGPS = (): CachedGPS => {
  try {
    const saved = localStorage.getItem('hs_last_known_gps');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Valid if less than 6 hours old
      if (Date.now() - parsed.timestamp < 6 * 3600 * 1000) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }

  // Pune default center if no previous cache
  return {
    latitude: 18.5204,
    longitude: 73.8567,
    accuracy: 15,
    timestamp: Date.now(),
  };
};

export const updateCachedGPS = (coords: { latitude: number; longitude: number; accuracy?: number }) => {
  try {
    const payload: CachedGPS = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy || 10,
      timestamp: Date.now(),
    };
    localStorage.setItem('hs_last_known_gps', JSON.stringify(payload));
  } catch {
    // ignore
  }
};

// 3. Offline Emergency Queue (Stores requests to sync immediately when network blips back)
export interface OfflineEmergencyRecord {
  id: string;
  emergencyId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  synced: boolean;
  medicalIdSummary?: string;
}

export const queueOfflineEmergency = (record: OfflineEmergencyRecord) => {
  try {
    const existing = getQueuedEmergencies();
    existing.push(record);
    localStorage.setItem('hs_offline_emergencies_queue', JSON.stringify(existing));
  } catch {
    // ignore
  }
};

export const getQueuedEmergencies = (): OfflineEmergencyRecord[] => {
  try {
    const raw = localStorage.getItem('hs_offline_emergencies_queue');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const clearSyncedEmergency = (id: string) => {
  try {
    const remaining = getQueuedEmergencies().filter((e) => e.id !== id);
    localStorage.setItem('hs_offline_emergencies_queue', JSON.stringify(remaining));
  } catch {
    // ignore
  }
};

// 4. Direct 1-Tap Offline SMS & GSM Payload Formatter
export const generateOfflineSmsLink = (
  coords: { latitude: number; longitude: number },
  patientName = 'Patient',
  bloodGroup = 'O+'
): string => {
  const latStr = coords.latitude.toFixed(5);
  const lngStr = coords.longitude.toFixed(5);
  const mapsUrl = `https://maps.google.com/?q=${latStr},${lngStr}`;

  const message = `EMERGENCY SOS: Medical assistance urgently required for ${patientName} (Blood: ${bloodGroup}). GPS: ${latStr}, ${lngStr} | Map: ${mapsUrl}`;

  // 108 is the National Ambulance Emergency Service in India
  return `sms:108?body=${encodeURIComponent(message)}`;
};

export const generateEmergencyContactSmsLink = (
  phone: string,
  coords: { latitude: number; longitude: number },
  patientName = 'Patient'
): string => {
  const latStr = coords.latitude.toFixed(5);
  const lngStr = coords.longitude.toFixed(5);
  const mapsUrl = `https://maps.google.com/?q=${latStr},${lngStr}`;

  const message = `🚨 EMERGENCY SOS ALERT: ${patientName} has triggered a medical emergency! Live GPS: ${latStr}, ${lngStr}. Open Live Map: ${mapsUrl}`;

  return `sms:${phone}?body=${encodeURIComponent(message)}`;
};
