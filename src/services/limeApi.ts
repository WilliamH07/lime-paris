import type {
  FreeBikeStatusResponse,
  RawBike,
  VehicleTypeMap,
  VehicleTypesResponse,
} from '../types/gbfs';

/**
 * GBFS Endpoint Configuration
 * When running in Vite dev mode, we use the local proxy to bypass CORS restrictions.
 * In standalone production, we support direct calls or fallbacks.
 */
const BASE_URL = '/api/lime';

const FREE_BIKE_STATUS_URL = `${BASE_URL}/api/partners/v2/gbfs/paris/free_bike_status`;
const VEHICLE_TYPES_URL = `${BASE_URL}/api/partners/v2/gbfs/paris/vehicle_types`;

// Fallback in-memory cache for vehicle types to avoid redundant network transfers
let cachedVehicleTypes: VehicleTypeMap | null = null;
let vehicleTypesLastFetched = 0;
const VEHICLE_TYPES_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Default fallback vehicle types in case network fails
const DEFAULT_VEHICLE_TYPES: VehicleTypeMap = {
  '1': {
    vehicle_type_id: '1',
    form_factor: 'scooter',
    propulsion_type: 'electric',
    max_range_meters: 24140,
    name: 'Lime-S Gen 3',
  },
  '2': {
    vehicle_type_id: '2',
    form_factor: 'scooter',
    propulsion_type: 'electric',
    max_range_meters: 40233,
    name: 'Lime-S Gen 4',
  },
  '3': {
    vehicle_type_id: '3',
    form_factor: 'bicycle',
    propulsion_type: 'electric_assist',
    max_range_meters: 85000,
    name: 'Lime-E Bike',
  },
  '4': {
    vehicle_type_id: '4',
    form_factor: 'bicycle',
    propulsion_type: 'human',
    name: 'Lime Classic Bike',
  },
};

/**
 * Fetch bikes from the Lime Paris GBFS feed.
 * Includes both available bikes and disabled bikes (which need recharging/maintenance).
 * Only excludes currently reserved bikes (is_reserved === true).
 */
export async function fetchBikes(): Promise<{
  bikes: RawBike[];
  lastUpdated: number;
  ttl: number;
}> {
  try {
    const response = await fetch(FREE_BIKE_STATUS_URL, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur réseau Lime GBFS (${response.status} ${response.statusText})`);
    }

    const data: FreeBikeStatusResponse = await response.json();

    if (!data?.data?.bikes || !Array.isArray(data.data.bikes)) {
      throw new Error('Format de données GBFS invalide');
    }

    // Keep both available and disabled bikes (for recharging operations)
    // Only exclude bikes currently in active rental/reserved
    const relevantBikes = data.data.bikes.filter(
      (bike) => bike.is_reserved === false
    );

    return {
      bikes: relevantBikes,
      lastUpdated: data.last_updated ? data.last_updated * 1000 : Date.now(),
      ttl: data.ttl || 60,
    };
  } catch (error) {
    console.error('[Lime GBFS] Error fetching free bike status:', error);
    throw error;
  }
}

/**
 * Fetch vehicle types dictionary from Lime GBFS feed.
 * Maps vehicle_type_id -> RawVehicleType for fast O(1) lookup.
 */
export async function fetchVehicleTypes(): Promise<VehicleTypeMap> {
  const now = Date.now();
  if (cachedVehicleTypes && now - vehicleTypesLastFetched < VEHICLE_TYPES_CACHE_TTL) {
    return cachedVehicleTypes;
  }

  try {
    const response = await fetch(VEHICLE_TYPES_URL, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`[Lime GBFS] Warning fetching vehicle types: ${response.status}. Using defaults.`);
      return DEFAULT_VEHICLE_TYPES;
    }

    const data: VehicleTypesResponse = await response.json();
    const vehicleTypes = data?.data?.vehicle_types;

    if (!vehicleTypes || !Array.isArray(vehicleTypes)) {
      return DEFAULT_VEHICLE_TYPES;
    }

    const typeMap: VehicleTypeMap = {};
    for (const item of vehicleTypes) {
      typeMap[item.vehicle_type_id] = item;
    }

    cachedVehicleTypes = typeMap;
    vehicleTypesLastFetched = now;
    return typeMap;
  } catch (error) {
    console.warn('[Lime GBFS] Could not fetch vehicle types, falling back to defaults:', error);
    return cachedVehicleTypes || DEFAULT_VEHICLE_TYPES;
  }
}
