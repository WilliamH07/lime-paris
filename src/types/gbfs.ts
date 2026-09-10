/**
 * GBFS (General Bikeshare Feed Specification) Types & App Models
 * Reference: GBFS v2.2 - Lime Paris Feeds & Lime SwapStation Battery Model
 */

export interface RawBike {
  bike_id: string;
  lat: number;
  lon: number;
  is_reserved: boolean;
  is_disabled: boolean | number;
  vehicle_type_id: string;
  vehicle_type?: string;
  current_range_meters?: number;
  last_reported?: number;
  pricing_plan_id?: string;
  rental_uris?: {
    android?: string;
    ios?: string;
  };
}

export interface FreeBikeStatusResponse {
  last_updated: number;
  ttl: number;
  version: string;
  data: {
    bikes: RawBike[];
  };
}

export interface RawVehicleType {
  vehicle_type_id: string;
  form_factor: 'bicycle' | 'scooter' | string;
  propulsion_type: 'electric' | 'electric_assist' | 'human' | string;
  max_range_meters?: number;
  name?: string;
}

export interface VehicleTypesResponse {
  last_updated: number;
  ttl: number;
  version: string;
  data: {
    vehicle_types: RawVehicleType[];
  };
}

export type VehicleTypeMap = Record<string, RawVehicleType>;

export interface EnrichedBike {
  id: string;
  shortId: string;
  lat: number;
  lon: number;
  vehicleTypeId: string;
  formFactor: 'bicycle' | 'scooter' | string;
  propulsionType: string;
  currentRangeMeters?: number;
  maxRangeMeters?: number;
  batteryPercent: number | null;
  distanceMeters: number | null;
  walkingMinutes: number | null;
  isReserved: boolean;
  isDisabled: boolean;
  needsRecharge: boolean;
}

export interface BatterySlot {
  slotNumber: number;
  status: 'ready' | 'charging' | 'empty';
  batteryPercent: number; // 0 to 100
  estimatedMinutesToFull: number; // 0 if ready
}

export interface ChargingStation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  operator: string;
  plugTypes: string[];
  powerKw: number | null;
  hasStandardSocket: boolean;
  isTwoWheeler: boolean;
  distanceMeters: number | null;
  walkingMinutes: number | null;
  isLimeHub?: boolean;
}

export interface UserLocation {
  lat: number;
  lon: number;
  accuracy?: number;
}

export type ViewDisplayMode = 'all' | 'stations_only' | 'bikes_only';

export interface FilterOptions {
  maxDistance: number | null; // e.g. 300, 500, 1000 or null (all)
  minBattery: number | null;  // e.g. 20, 50 or null (all)
  formFactor: 'all' | 'bicycle' | 'scooter';
  status: 'all' | 'recharge' | 'disabled' | 'available';
  showChargingStations: boolean;
  displayMode: ViewDisplayMode; // 'all' | 'stations_only' | 'bikes_only'
}
