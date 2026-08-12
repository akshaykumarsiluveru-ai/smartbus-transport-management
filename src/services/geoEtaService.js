/**
 * SmartBus Real-Time Geodesic Distance & Dynamic ETA Calculation Engine
 * Uses:
 * 1. Current Bus Location (lat, lng)
 * 2. Next Stop Coordinates (lat, lng)
 * 3. Current Speed (km/h)
 * 4. Active delay minutes and operational status
 */

/**
 * Calculates Great-Circle Geodesic distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 Latitude of point 1
 * @param {number} lon1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lon2 Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const p1Lat = parseFloat(lat1);
  const p1Lng = parseFloat(lon1);
  const p2Lat = parseFloat(lat2);
  const p2Lng = parseFloat(lon2);

  if (isNaN(p1Lat) || isNaN(p1Lng) || isNaN(p2Lat) || isNaN(p2Lng)) {
    return 0;
  }

  const R = 6371; // Earth's mean radius in kilometers
  const dLat = ((p2Lat - p1Lat) * Math.PI) / 180;
  const dLon = ((p2Lng - p1Lng) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1Lat * Math.PI) / 180) *
      Math.cos((p2Lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.max(0, distance);
}

/**
 * Formats a distance in kilometers into a human-readable string (meters if < 1km, km otherwise)
 * @param {number} distanceKm Distance in kilometers
 * @returns {string} e.g. "450 m" or "2.35 km"
 */
export function formatDistance(distanceKm) {
  const d = Math.max(0, parseFloat(distanceKm) || 0);
  if (d < 0.05) {
    return 'At Stop';
  }
  if (d < 1.0) {
    return `${Math.round(d * 1000)} m`;
  }
  return `${d.toFixed(2)} km`;
}

/**
 * Calculates realistic travel time, dynamic ETA in minutes, and future Clock Arrival Time
 * @param {Object} params
 * @param {number} params.currentLat Current bus latitude
 * @param {number} params.currentLng Current bus longitude
 * @param {number} params.nextStopLat Target stop latitude
 * @param {number} params.nextStopLng Target stop longitude
 * @param {number} params.speed Current speed in km/h
 * @param {number} [params.delayMinutes=0] Active reported delay in minutes
 * @param {boolean} [params.isLive=true] Whether the trip is actively broadcasting
 * @param {string} [params.status='In Transit'] Current operational status
 * @param {number} [params.currentStopIdx=0] Index of current stop
 * @param {number} [params.totalStops=1] Total stops on route
 * @returns {Object} { distanceKm, distanceMeters, distanceText, etaMinutes, etaText, etaClockTime, speedDisplay }
 */
export function calculateRealEta({
  currentLat,
  currentLng,
  nextStopLat,
  nextStopLng,
  speed = 0,
  delayMinutes = 0,
  isLive = true,
  status = 'In Transit',
  currentStopIdx = 0,
  totalStops = 5,
}) {
  const curLat = parseFloat(currentLat);
  const curLng = parseFloat(currentLng);
  const nxtLat = parseFloat(nextStopLat);
  const nxtLng = parseFloat(nextStopLng);
  const currentSpeed = Math.max(0, parseFloat(speed) || 0);
  const activeDelay = Math.max(0, parseInt(delayMinutes) || 0);

  // If trip is completed or at depot yard
  if (!isLive || status === 'At Depot' || status === 'Completed') {
    return {
      distanceKm: 0,
      distanceMeters: 0,
      distanceText: '0 km (Depot Yard)',
      etaMinutes: 0,
      etaText: 'Completed',
      etaClockTime: '--:--',
      speedDisplay: 0,
    };
  }

  // Calculate Great-Circle Distance
  const distanceKm = calculateDistanceKm(curLat, curLng, nxtLat, nxtLng);
  const distanceMeters = Math.round(distanceKm * 1000);
  const distanceText = formatDistance(distanceKm);

  // If bus is at final stop and has arrived
  if (currentStopIdx >= totalStops - 1 && distanceKm < 0.05) {
    return {
      distanceKm: 0,
      distanceMeters: 0,
      distanceText: 'Terminal Reached',
      etaMinutes: 0,
      etaText: 'Arrived',
      etaClockTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      speedDisplay: 0,
    };
  }

  // Determine realistic travel time based on speed, distance, and traffic buffers
  let travelTimeMinutes = 0;

  if (currentSpeed < 5) {
    // BUS IS STOPPED OR AT A STOP:
    // Dwell time at current stop (0.75 min) + transit at nominal urban speed (25 km/h) + delay
    const nominalUrbanSpeedKmH = 25;
    const dwellTimeMin = distanceKm < 0.1 ? 0.2 : 0.75;
    travelTimeMinutes = dwellTimeMin + (distanceKm / nominalUrbanSpeedKmH) * 60 + activeDelay;
  } else {
    // BUS IS MOVING:
    // Effective speed blended with traffic factor (minimum effective speed of 15 km/h to prevent asymptotic infinity)
    const effectiveSpeed = Math.max(15, currentSpeed);
    // Add small junction buffer (0.3 min) + delay
    travelTimeMinutes = (distanceKm / effectiveSpeed) * 60 + 0.3 + activeDelay;
  }

  // Calculate final rounded integer ETA minutes
  let etaMinutes = Math.max(1, Math.round(travelTimeMinutes));
  if (distanceKm < 0.08) {
    etaMinutes = 1; // Approaching stop
  }

  // Format ETA text
  let etaText = `~${etaMinutes} mins`;
  if (etaMinutes === 1) {
    etaText = distanceKm < 0.1 ? '< 1 min (Arriving)' : '1 min';
  }

  // Calculate Target Clock Arrival Time (e.g. "08:45 AM")
  const arrivalTimestamp = Date.now() + etaMinutes * 60 * 1000;
  const etaClockTime = new Date(arrivalTimestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    distanceKm: parseFloat(distanceKm.toFixed(2)),
    distanceMeters,
    distanceText,
    etaMinutes,
    etaText,
    etaClockTime,
    speedDisplay: Math.round(currentSpeed),
  };
}
