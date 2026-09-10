import { useEffect, useState, useCallback, useMemo } from 'react';
import type { EnrichedBike, FilterOptions, RawBike, UserLocation, VehicleTypeMap, DetectedTrip, BikeSnapshotDiff } from '../types/gbfs';
import { fetchBikes, fetchVehicleTypes } from '../services/limeApi';
import { estimateWalkingMinutes, getDistanceFromLatLonInMeters } from '../utils/distance';
import { bikeTracker } from '../services/bikeTracker';

interface UseBikesReturn {
  allBikes: EnrichedBike[];
  filteredBikes: EnrichedBike[];
  totalAvailable: number;
  rechargeCount: number;
  disabledCount: number;
  soonEmptyCount: number;
  recentTrips: DetectedTrip[];
  lastDiff: BikeSnapshotDiff | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  secondsSinceUpdate: number;
  refresh: () => Promise<void>;
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  resetFilters: () => void;
}

const REFRESH_INTERVAL_MS = 45000; // 45 seconds

const INITIAL_FILTERS: FilterOptions = {
  maxDistance: null, // all distances by default
  minBattery: null,  // all battery levels by default
  formFactor: 'all', // all vehicle types
  status: 'all',     // all bikes by default
  showChargingStations: true, // show Lime charging stations by default
  displayMode: 'all', // 'all' | 'stations_only' | 'bikes_only'
};

export function useBikes(userLocation: UserLocation | null): UseBikesReturn {
  const [rawBikes, setRawBikes] = useState<RawBike[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeMap>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState<number>(0);
  const [filters, setFilters] = useState<FilterOptions>(INITIAL_FILTERS);

  // Load bike and vehicle types data
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
    setError(null);

    try {
      // Parallel fetch for speed
      const [bikesResult, typesResult] = await Promise.all([
        fetchBikes(),
        fetchVehicleTypes(),
      ]);

      setRawBikes(bikesResult.bikes);
      setVehicleTypes(typesResult);
      setLastUpdated(new Date(bikesResult.lastUpdated));
      setSecondsSinceUpdate(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des vélos Lime';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Periodic background refresh every 45s
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [loadData]);

  // Live timer for "Mis à jour il y a X s"
  useEffect(() => {
    if (!lastUpdated) return;

    const timer = setInterval(() => {
      const diffSec = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      setSecondsSinceUpdate(diffSec);
    }, 1000);

    return () => clearInterval(timer);
  }, [lastUpdated]);

  // Enrich bikes with distance, battery, recharge priority status
  const allBikes = useMemo<EnrichedBike[]>(() => {
    if (!rawBikes.length) return [];

    const enriched = rawBikes.map((bike) => {
      const vType = vehicleTypes[bike.vehicle_type_id];
      const maxRange = vType?.max_range_meters;

      // Battery percentage calculation: (current_range_meters / max_range_meters) * 100
      let batteryPercent: number | null = null;
      if (
        typeof bike.current_range_meters === 'number' &&
        typeof maxRange === 'number' &&
        maxRange > 0
      ) {
        const computed = Math.round((bike.current_range_meters / maxRange) * 100);
        batteryPercent = Math.min(100, Math.max(0, computed));
      }

      // Distance calculation (Haversine)
      let distanceMeters: number | null = null;
      let walkingMinutes: number | null = null;

      if (userLocation) {
        distanceMeters = getDistanceFromLatLonInMeters(
          userLocation.lat,
          userLocation.lon,
          bike.lat,
          bike.lon
        );
        walkingMinutes = estimateWalkingMinutes(distanceMeters);
      }

      const isDisabled = Boolean(bike.is_disabled);
      // Needs recharge if disabled, or battery <= 20%, or range under 10 km
      const needsRecharge =
        isDisabled ||
        (batteryPercent !== null && batteryPercent <= 20) ||
        (typeof bike.current_range_meters === 'number' && bike.current_range_meters <= 10000);

      // Smart pre-emptive recharge candidate: 21% to 35% battery (will need recharge within 1-2 rides)
      const soonEmpty =
        !isDisabled &&
        !needsRecharge &&
        ((batteryPercent !== null && batteryPercent > 20 && batteryPercent <= 35) ||
          (typeof bike.current_range_meters === 'number' &&
            bike.current_range_meters > 10000 &&
            bike.current_range_meters <= 16000));

      return {
        id: bike.bike_id,
        shortId: bike.bike_id.length > 8 ? bike.bike_id.substring(0, 8).toUpperCase() : bike.bike_id,
        lat: bike.lat,
        lon: bike.lon,
        vehicleTypeId: bike.vehicle_type_id,
        formFactor: vType?.form_factor || (bike.vehicle_type === 'scooter' ? 'scooter' : 'bicycle'),
        propulsionType: vType?.propulsion_type || 'electric',
        currentRangeMeters: bike.current_range_meters,
        maxRangeMeters: maxRange,
        batteryPercent,
        distanceMeters,
        walkingMinutes,
        isReserved: bike.is_reserved,
        isDisabled,
        needsRecharge,
        soonEmpty,
      };
    });

    // PRIORITY SORTING:
    // 1. Disabled bikes & bikes needing recharge FIRST
    // 2. Then sorted by distance within each priority tier
    enriched.sort((a, b) => {
      // Tier 1: Disabled bikes (highest priority)
      if (a.isDisabled && !b.isDisabled) return -1;
      if (!a.isDisabled && b.isDisabled) return 1;

      // Tier 2: Needs recharge (low battery)
      if (a.needsRecharge && !b.needsRecharge) return -1;
      if (!a.needsRecharge && b.needsRecharge) return 1;

      // Within tier: sort by distance ascending
      if (userLocation) {
        if (a.distanceMeters === null) return 1;
        if (b.distanceMeters === null) return -1;
        return a.distanceMeters - b.distanceMeters;
      }

      return 0;
    });

    return enriched;
  }, [rawBikes, vehicleTypes, userLocation]);

  // Filtered bikes based on user criteria
  const filteredBikes = useMemo<EnrichedBike[]>(() => {
    return allBikes.filter((bike) => {
      // Status filter (À recharger, Bientôt vide, Désactivés, Disponibles)
      if (filters.status === 'recharge' && !bike.needsRecharge) return false;
      if (filters.status === 'soon_empty' && !bike.soonEmpty) return false;
      if (filters.status === 'disabled' && !bike.isDisabled) return false;
      if (filters.status === 'available' && (bike.isDisabled || bike.needsRecharge)) return false;

      // Distance filter
      if (filters.maxDistance !== null && bike.distanceMeters !== null) {
        if (bike.distanceMeters > filters.maxDistance) return false;
      }

      // Battery filter
      if (filters.minBattery !== null) {
        if (bike.batteryPercent === null || bike.batteryPercent < filters.minBattery) {
          return false;
        }
      }

      // Form factor filter
      if (filters.formFactor !== 'all') {
        if (bike.formFactor !== filters.formFactor) return false;
      }

      return true;
    });
  }, [allBikes, filters]);

  // Track snapshots & newly inferred trips on each refresh
  const [lastDiff, setLastDiff] = useState<BikeSnapshotDiff | null>(null);
  const [recentTrips, setRecentTrips] = useState<DetectedTrip[]>(() => bikeTracker.getRecentTrips());

  useEffect(() => {
    if (!allBikes.length) return;
    const diff = bikeTracker.processSnapshot(allBikes);
    setLastDiff(diff);
    setRecentTrips([...bikeTracker.getRecentTrips()]);
  }, [allBikes]);

  // Compute counters
  const rechargeCount = useMemo(() => {
    return allBikes.filter((b) => b.needsRecharge).length;
  }, [allBikes]);

  const disabledCount = useMemo(() => {
    return allBikes.filter((b) => b.isDisabled).length;
  }, [allBikes]);

  const soonEmptyCount = useMemo(() => {
    return allBikes.filter((b) => b.soonEmpty).length;
  }, [allBikes]);

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  return {
    allBikes,
    filteredBikes,
    totalAvailable: allBikes.length,
    rechargeCount,
    disabledCount,
    soonEmptyCount,
    recentTrips,
    lastDiff,
    loading,
    error,
    lastUpdated,
    secondsSinceUpdate,
    refresh: () => loadData(false),
    filters,
    setFilters,
    resetFilters,
  };
}
