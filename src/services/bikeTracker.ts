import type { EnrichedBike, DetectedTrip, BikeSnapshotDiff } from '../types/gbfs';
import { getDistanceFromLatLonInMeters } from '../utils/distance';

interface StoredBikePoint {
  id: string;
  shortId: string;
  lat: number;
  lon: number;
  batteryPercent: number | null;
  lastSeenTime: number;
}

const STORAGE_KEY_TRIPS = 'lime_paris_detected_trips';
const MAX_STORED_TRIPS = 100;

class BikeTrackerService {
  // Previous snapshot map (bike_id -> Point)
  private previousSnapshot: Map<string, StoredBikePoint> = new Map();
  // Recently departed bikes that might be mid-trip (bike_id -> Point when they vanished)
  private pendingDepartures: Map<string, StoredBikePoint> = new Map();
  // Historical inferred trips
  private detectedTrips: DetectedTrip[] = [];
  // Listeners for UI reactive updates
  private listeners: Set<(diff: BikeSnapshotDiff) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRIPS);
      if (saved) {
        this.detectedTrips = JSON.parse(saved);
      }
    } catch {
      this.detectedTrips = [];
    }
  }

  private saveToStorage() {
    try {
      const slice = this.detectedTrips.slice(0, MAX_STORED_TRIPS);
      localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(slice));
    } catch {
      // LocalStorage full or private browsing
    }
  }

  public subscribe(callback: (diff: BikeSnapshotDiff) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public getRecentTrips(): DetectedTrip[] {
    return this.detectedTrips;
  }

  public clearHistory() {
    this.detectedTrips = [];
    this.saveToStorage();
  }

  /**
   * Process a new incoming snapshot of bikes from GBFS refresh.
   * Compares with previous snapshot to deduce trips and state shifts.
   */
  public processSnapshot(currentBikes: EnrichedBike[]): BikeSnapshotDiff {
    const now = Date.now();
    const currentMap = new Map<string, EnrichedBike>();
    currentBikes.forEach((b) => currentMap.set(b.id, b));

    const newlyDetectedTrips: DetectedTrip[] = [];
    let departedCount = 0;
    let arrivedCount = 0;

    // 1. If this is our very first snapshot, populate and exit
    if (this.previousSnapshot.size === 0) {
      currentBikes.forEach((b) => {
        this.previousSnapshot.set(b.id, {
          id: b.id,
          shortId: b.shortId,
          lat: b.lat,
          lon: b.lon,
          batteryPercent: b.batteryPercent,
          lastSeenTime: now,
        });
      });

      return {
        timestamp: now,
        totalBikes: currentBikes.length,
        departedCount: 0,
        arrivedCount: 0,
        tripsDetected: [],
      };
    }

    // 2. Identify DEPARTURES (was in previousSnapshot, now missing in currentMap)
    this.previousSnapshot.forEach((prevBike, id) => {
      if (!currentMap.has(id)) {
        departedCount++;
        // Keep in pending departures to pair when it reappears
        this.pendingDepartures.set(id, prevBike);
      }
    });

    // 3. Identify ARRIVALS & TRIPS
    currentBikes.forEach((bike) => {
      const prev = this.previousSnapshot.get(bike.id);
      const departure = this.pendingDepartures.get(bike.id);

      // Case A: Bike reappeared after being absent (pending departure)
      if (departure && !prev) {
        arrivedCount++;
        const durationMin = Math.max(1, Math.round((now - departure.lastSeenTime) / 60000));
        const straightDist = getDistanceFromLatLonInMeters(
          departure.lat,
          departure.lon,
          bike.lat,
          bike.lon
        );

        let batteryDelta: number | null = null;
        let estimatedEnergyDist = straightDist;

        if (departure.batteryPercent !== null && bike.batteryPercent !== null) {
          batteryDelta = bike.batteryPercent - departure.batteryPercent;
          // If battery decreased during ride (e.g. -10%), estimate ~400m per 1%
          if (batteryDelta < 0) {
            const consumedPercent = Math.abs(batteryDelta);
            estimatedEnergyDist = Math.max(straightDist, consumedPercent * 400);
          }
        }

        const isRechargePriority = bike.needsRecharge;

        const trip: DetectedTrip = {
          id: `${bike.id}-${now}`,
          bikeId: bike.id,
          shortId: bike.shortId,
          startTime: departure.lastSeenTime,
          endTime: now,
          durationMinutes: durationMin,
          startLat: departure.lat,
          startLon: departure.lon,
          endLat: bike.lat,
          endLon: bike.lon,
          startBattery: departure.batteryPercent,
          endBattery: bike.batteryPercent,
          batteryDelta,
          straightDistanceMeters: Math.round(straightDist),
          estimatedEnergyDistanceMeters: Math.round(estimatedEnergyDist),
          isRechargePriorityNow: isRechargePriority,
        };

        newlyDetectedTrips.push(trip);
        this.pendingDepartures.delete(bike.id);
      }
    });

    // Clean up stale pending departures older than 6 hours
    const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
    this.pendingDepartures.forEach((dep, id) => {
      if (now - dep.lastSeenTime > SIX_HOURS_MS) {
        this.pendingDepartures.delete(id);
      }
    });

    // Update historical trips
    if (newlyDetectedTrips.length > 0) {
      this.detectedTrips = [...newlyDetectedTrips, ...this.detectedTrips].slice(0, MAX_STORED_TRIPS);
      this.saveToStorage();
    }

    // Refresh previous snapshot
    this.previousSnapshot.clear();
    currentBikes.forEach((b) => {
      this.previousSnapshot.set(b.id, {
        id: b.id,
        shortId: b.shortId,
        lat: b.lat,
        lon: b.lon,
        batteryPercent: b.batteryPercent,
        lastSeenTime: now,
      });
    });

    const diff: BikeSnapshotDiff = {
      timestamp: now,
      totalBikes: currentBikes.length,
      departedCount,
      arrivedCount,
      tripsDetected: newlyDetectedTrips,
    };

    // Notify listeners
    this.listeners.forEach((fn) => fn(diff));

    return diff;
  }
}

export const bikeTracker = new BikeTrackerService();
