import { useEffect, useState, useCallback } from 'react';
import type { UserLocation } from '../types/gbfs';

// Default Paris Center coordinates (Hôtel de Ville / Châtelet)
export const PARIS_DEFAULT_LOCATION: UserLocation = {
  lat: 48.856614,
  lon: 2.352222,
};

interface UseGeoLocationReturn {
  location: UserLocation | null;
  effectiveLocation: UserLocation; // either user's real location or Paris default fallback
  isUsingFallback: boolean;
  loading: boolean;
  error: string | null;
  refreshLocation: () => void;
  setDefaultParisLocation: () => void;
}

export function useGeoLocation(): UseGeoLocationReturn {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [fallbackLocation, setFallbackLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError("La géolocalisation n'est pas supportée par votre navigateur.");
      setLoading(false);
      setFallbackLocation(PARIS_DEFAULT_LOCATION);
      return;
    }

    setLoading(true);
    setError(null);

    const geoSuccess = (position: GeolocationPosition) => {
      setLocation({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      setFallbackLocation(null);
      setLoading(false);
      setError(null);
    };

    const geoError = (err: GeolocationPositionError) => {
      let message = 'Impossible de récupérer votre position.';
      switch (err.code) {
        case err.PERMISSION_DENIED:
          message = 'Accès à la géolocalisation refusé. Affichage centré sur Paris.';
          break;
        case err.POSITION_UNAVAILABLE:
          message = 'Position non disponible. Affichage centré sur Paris.';
          break;
        case err.TIMEOUT:
          message = 'Délai de géolocalisation dépassé. Affichage centré sur Paris.';
          break;
      }
      setError(message);
      setFallbackLocation(PARIS_DEFAULT_LOCATION);
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(geoSuccess, geoError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    });
  }, []);

  useEffect(() => {
    requestLocation();

    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
          setFallbackLocation(null);
          setLoading(false);
        },
        () => {
          // Keep current fallback on silent watch error
        },
        {
          enableHighAccuracy: true,
          maximumAge: 15000,
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [requestLocation]);

  const setDefaultParisLocation = useCallback(() => {
    setFallbackLocation(PARIS_DEFAULT_LOCATION);
    setError(null);
  }, []);

  const isUsingFallback = location === null;
  const effectiveLocation = location || fallbackLocation || PARIS_DEFAULT_LOCATION;

  return {
    location,
    effectiveLocation,
    isUsingFallback,
    loading,
    error,
    refreshLocation: requestLocation,
    setDefaultParisLocation,
  };
}
