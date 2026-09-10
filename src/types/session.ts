import type { EnrichedBike, ChargingStation } from './gbfs';

export type WaypointType = 'start' | 'bike' | 'station';

export interface SessionWaypoint {
  id: string;
  order: number;
  type: WaypointType;
  title: string;
  subtitle: string;
  lat: number;
  lon: number;
  distanceFromPreviousMeters: number;
  estimatedMinutesFromPrevious: number;
  action: string;
  batteryPercent?: number | null;
  isDisabledBike?: boolean;
  bike?: EnrichedBike;
  station?: ChargingStation;
  isCompleted: boolean;
}

export interface SessionPlan {
  id: string;
  createdAt: number;
  totalBikesCount: number;
  totalStationsCount: number;
  totalDistanceMeters: number;
  totalEstimatedMinutes: number;
  waypoints: SessionWaypoint[];
  routeCoordinates: [number, number][]; // [lon, lat] pairs
}

export interface SessionProgress {
  isActive: boolean;
  plan: SessionPlan | null;
  currentStepIndex: number;
  completedStepIds: string[];
}
