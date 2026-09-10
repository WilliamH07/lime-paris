import type { EnrichedBike, ChargingStation, UserLocation } from '../types/gbfs';
import type { SessionPlan, SessionWaypoint } from '../types/session';
import { getDistanceFromLatLonInMeters } from '../utils/distance';

interface OptimizerOptions {
  maxBikes?: number;
  maxRadiusMeters?: number;
  carryCapacity?: number; // Nombre de batteries transportées avant de devoir swap
}

/**
 * Calcule l'itinéraire le plus efficace pour une session de recharge Lime.
 * Combine les vélos prioritaires (désactivés et batteries faibles) et les stations Lime SwapStations.
 */
export function generateOptimizedRechargeSession(
  startLocation: UserLocation,
  bikes: EnrichedBike[],
  stations: ChargingStation[],
  options: OptimizerOptions = {}
): SessionPlan | null {
  const maxBikes = options.maxBikes ?? 6;
  const maxRadiusMeters = options.maxRadiusMeters ?? 3000;
  const carryCapacity = options.carryCapacity ?? 3;

  // 1. Filtrer et noter les vélos nécessitant une recharge
  const candidateBikes = bikes
    .filter((bike) => {
      const needsRecharge =
        bike.isDisabled ||
        (bike.batteryPercent !== null && bike.batteryPercent <= 25) ||
        bike.needsRecharge;
      return needsRecharge;
    })
    .map((bike) => {
      const distFromStart = getDistanceFromLatLonInMeters(
        startLocation.lat,
        startLocation.lon,
        bike.lat,
        bike.lon
      );
      // Score : priorité absolue aux désactivés, puis aux batteries les plus faibles
      const urgencyScore = bike.isDisabled
        ? 100
        : Math.max(10, 80 - (bike.batteryPercent ?? 20) * 2);
      // Facteur de distance : pénalité pour les vélos trop éloignés
      const distanceScore = Math.max(0, 100 - (distFromStart / 30));
      const totalScore = urgencyScore * 1.5 + distanceScore;

      return {
        bike,
        distFromStart,
        totalScore,
      };
    })
    .filter((item) => item.distFromStart <= maxRadiusMeters)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 16) // Sélectionner le vivier des meilleurs vélos candidats
    .map((item) => item.bike);

  if (candidateBikes.length === 0) {
    return null;
  }

  // 2. Construction de la tournée (Greedy Heuristic avec contrainte de capacité de swap)
  let currentLocation = { lat: startLocation.lat, lon: startLocation.lon };
  const remainingBikes = [...candidateBikes];
  const waypoints: SessionWaypoint[] = [];
  const routeCoordinates: [number, number][] = [[startLocation.lon, startLocation.lat]];

  // Étape 0 : Point de départ
  waypoints.push({
    id: 'step-start',
    order: 0,
    type: 'start',
    title: 'Votre position de départ',
    subtitle: 'Point de départ de la session de recharge',
    lat: startLocation.lat,
    lon: startLocation.lon,
    distanceFromPreviousMeters: 0,
    estimatedMinutesFromPrevious: 0,
    action: 'Démarrage de la tournée opérationnelle',
    isCompleted: true,
  });

  let batteriesCarried = 0;
  let bikesCollected = 0;
  let orderCounter = 1;
  let visitedStationIds = new Set<string>();

  while (bikesCollected < maxBikes && remainingBikes.length > 0) {
    // Si la capacité de transport est atteinte, on doit obligatoirement aller à une SwapStation
    if (batteriesCarried >= carryCapacity) {
      const nearestStation = findNearestStation(currentLocation, stations, visitedStationIds);
      if (nearestStation) {
        const legDist = getDistanceFromLatLonInMeters(
          currentLocation.lat,
          currentLocation.lon,
          nearestStation.lat,
          nearestStation.lon
        );
        const legMinutes = Math.max(1, Math.round(legDist / 140)) + 2; // ~8.5 km/h + 2 min d'opération swap

        waypoints.push({
          id: `step-station-${nearestStation.id}-${orderCounter}`,
          order: orderCounter++,
          type: 'station',
          title: nearestStation.name,
          subtitle: `${nearestStation.address} (${nearestStation.operator})`,
          lat: nearestStation.lat,
          lon: nearestStation.lon,
          distanceFromPreviousMeters: legDist,
          estimatedMinutesFromPrevious: legMinutes,
          action: `Déposer ${batteriesCarried} batteries déchargées et récupérer ${batteriesCarried} batteries 100% pleines`,
          station: nearestStation,
          isCompleted: false,
        });

        routeCoordinates.push([nearestStation.lon, nearestStation.lat]);
        currentLocation = { lat: nearestStation.lat, lon: nearestStation.lon };
        visitedStationIds.add(nearestStation.id);
        batteriesCarried = 0;
        continue;
      }
    }

    // Sélectionner le vélo le plus proche de la position actuelle
    let bestBikeIndex = -1;
    let minDistance = Infinity;

    for (let i = 0; i < remainingBikes.length; i++) {
      const dist = getDistanceFromLatLonInMeters(
        currentLocation.lat,
        currentLocation.lon,
        remainingBikes[i].lat,
        remainingBikes[i].lon
      );
      if (dist < minDistance) {
        minDistance = dist;
        bestBikeIndex = i;
      }
    }

    if (bestBikeIndex === -1) break;

    const chosenBike = remainingBikes.splice(bestBikeIndex, 1)[0];
    const legDist = minDistance;
    const legMinutes = Math.max(1, Math.round(legDist / 140)) + 2; // trajet + 2 min de prise en charge

    const bat = chosenBike.batteryPercent;
    const batLabel = bat !== null ? `${bat}%` : 'Inconnue';
    const statusLabel = chosenBike.isDisabled ? 'Vélo désactivé (priorité max)' : `Batterie faible (${batLabel})`;

    waypoints.push({
      id: `step-bike-${chosenBike.id}`,
      order: orderCounter++,
      type: 'bike',
      title: `Vélo Lime #${chosenBike.shortId}`,
      subtitle: statusLabel,
      lat: chosenBike.lat,
      lon: chosenBike.lon,
      distanceFromPreviousMeters: legDist,
      estimatedMinutesFromPrevious: legMinutes,
      action: `Remplacer ou récupérer la batterie (${batLabel})`,
      batteryPercent: chosenBike.batteryPercent,
      isDisabledBike: chosenBike.isDisabled,
      bike: chosenBike,
      isCompleted: false,
    });

    routeCoordinates.push([chosenBike.lon, chosenBike.lat]);
    currentLocation = { lat: chosenBike.lat, lon: chosenBike.lon };
    batteriesCarried++;
    bikesCollected++;
  }

  // Si on a des batteries en main à la fin, terminer par la SwapStation la plus proche pour déposer
  if (batteriesCarried > 0) {
    const finalStation = findNearestStation(currentLocation, stations, new Set());
    if (finalStation) {
      const legDist = getDistanceFromLatLonInMeters(
        currentLocation.lat,
        currentLocation.lon,
        finalStation.lat,
        finalStation.lon
      );
      const legMinutes = Math.max(1, Math.round(legDist / 140)) + 2;

      waypoints.push({
        id: `step-station-final-${finalStation.id}`,
        order: orderCounter++,
        type: 'station',
        title: `Clôture : ${finalStation.name}`,
        subtitle: `${finalStation.address} (${finalStation.operator})`,
        lat: finalStation.lat,
        lon: finalStation.lon,
        distanceFromPreviousMeters: legDist,
        estimatedMinutesFromPrevious: legMinutes,
        action: `Déposer les ${batteriesCarried} batteries déchargées et terminer la session`,
        station: finalStation,
        isCompleted: false,
      });

      routeCoordinates.push([finalStation.lon, finalStation.lat]);
    }
  }

  // 3. Calcul des totaux
  const totalDistanceMeters = waypoints.reduce((acc, wp) => acc + wp.distanceFromPreviousMeters, 0);
  const totalEstimatedMinutes = waypoints.reduce((acc, wp) => acc + wp.estimatedMinutesFromPrevious, 0);
  const totalStationsCount = waypoints.filter((wp) => wp.type === 'station').length;

  return {
    id: `session-${Date.now()}`,
    createdAt: Date.now(),
    totalBikesCount: bikesCollected,
    totalStationsCount,
    totalDistanceMeters,
    totalEstimatedMinutes,
    waypoints,
    routeCoordinates,
  };
}

function findNearestStation(
  pos: { lat: number; lon: number },
  stations: ChargingStation[],
  excludeIds: Set<string>
): ChargingStation | null {
  if (!Array.isArray(stations) || stations.length === 0) return null;

  let nearest: ChargingStation | null = null;
  let minDist = Infinity;

  for (const st of stations) {
    if (excludeIds.has(st.id)) continue;
    const dist = getDistanceFromLatLonInMeters(pos.lat, pos.lon, st.lat, st.lon);
    if (dist < minDist) {
      minDist = dist;
      nearest = st;
    }
  }

  // Si toutes ont été visitées, autoriser à revisiter
  if (!nearest && stations.length > 0) {
    return findNearestStation(pos, stations, new Set());
  }

  return nearest;
}
