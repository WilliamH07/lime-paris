import { useEffect, useState, useCallback } from 'react';
import type { ChargingStation, UserLocation } from '../types/gbfs';
import { fetchChargingStations } from '../services/chargingStationsApi';

export function useChargingStations(userLocation: UserLocation | null) {
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadStations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchChargingStations(userLocation);
      setStations(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur stations');
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  useEffect(() => {
    loadStations();
  }, [loadStations]);

  return {
    stations,
    loading,
    error,
    refresh: loadStations,
  };
}
