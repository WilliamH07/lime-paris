/**
 * Haversine formula to compute great-circle distance between two GPS coordinates
 * Earth radius: 6,371,000 meters
 */
export function getDistanceFromLatLonInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format distance in meters to a clean human-readable French string
 * e.g. "80 m", "450 m", "1,2 km"
 */
export function formatDistance(meters: number | null): string {
  if (meters === null || meters === undefined) return 'Distance inconnue';
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = (meters / 1000).toFixed(1).replace('.', ',');
  return `${km} km`;
}

/**
 * Estimate walking duration at standard urban pedestrian pace (4.5 km/h = 75 m/min)
 */
export function estimateWalkingMinutes(meters: number | null, speedMPerMin = 75): number | null {
  if (meters === null || meters === undefined) return null;
  // Ne pas afficher de temps de marche piéton si la distance dépasse 5 km
  if (meters > 5000) return null;
  return Math.max(1, Math.round(meters / speedMPerMin));
}

/**
 * Format walking time to human-readable string
 * e.g. "1 min à pied", "4 min à pied"
 */
export function formatWalkingTime(minutes: number | null): string {
  if (minutes === null) return '';
  if (minutes <= 1) return '~1 min à pied';
  return `~${minutes} min à pied`;
}

/**
 * Get battery health visual color scheme
 */
export function getBatteryBadge(percent: number | null) {
  if (percent === null) {
    return {
      label: 'N/A',
      textColor: 'text-slate-500',
      bgColor: 'bg-slate-100',
      borderColor: 'border-slate-200',
      fillColor: '#94A3B8',
    };
  }
  if (percent >= 50) {
    return {
      label: `${percent}%`,
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      fillColor: '#10B981',
    };
  }
  if (percent >= 20) {
    return {
      label: `${percent}%`,
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      fillColor: '#F59E0B',
    };
  }
  return {
    label: `${percent}%`,
    textColor: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    fillColor: '#EF4444',
  };
}
