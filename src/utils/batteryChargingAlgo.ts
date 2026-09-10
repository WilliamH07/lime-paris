import type { BatterySlot } from '../types/gbfs';

/**
 * Algorithme d'estimation de temps de recharge pour batteries amovibles Lime (Gen 4 & Lime-E)
 * Caractéristiques techniques de la batterie Lime :
 * - Chimie : Lithium-ion NMC (Nickel-Manganèse-Cobalt)
 * - Tension nominale : 36V - 48V
 * - Capacité nominale : ~1 000 Wh (1 kWh)
 * 
 * Modèle de charge multi-étapes (CC/CV - Courant Constant / Tension Constante) :
 * 1. Phase CC (0% à 80%) :
 *    - Puissance de charge maximale injectée par l'armoire Lime (~500W en SwapStation Franprix, ~800W en Hub)
 *    - Vitesse de progression linéaire d'environ 1.25 % par minute.
 *    - De 0% à 80% : environ 64 minutes.
 * 
 * 2. Phase CV (80% à 100%) :
 *    - Saturation des cellules, réduction progressive de l'intensité pour préserver la chimie.
 *    - Vitesse d'environ 0.45 % par minute.
 *    - De 80% à 100% : environ 44 minutes.
 * 
 * Temps de charge total typique (0% -> 100%) : ~108 minutes (~1h48).
 */
export function estimateChargeTimeMinutes(currentPercent: number, isFastHub = false): number {
  if (currentPercent >= 100) return 0;

  const speedMultiplier = isFastHub ? 1.35 : 1.0;

  let totalMinutes = 0;

  if (currentPercent < 80) {
    // Phase 1 : CC jusqu'à 80%
    const ccNeeded = 80 - currentPercent;
    totalMinutes += ccNeeded / (1.25 * speedMultiplier);

    // Phase 2 : CV complète (80% à 100%)
    totalMinutes += 20 / (0.45 * speedMultiplier);
  } else {
    // Déjà en phase 2 : CV seule
    const cvNeeded = 100 - currentPercent;
    totalMinutes += cvNeeded / (0.45 * speedMultiplier);
  }

  return Math.max(1, Math.round(totalMinutes));
}

/**
 * Formate un nombre de minutes en libellé clair
 * Exemples : "Prête dans 12 min", "Prête dans 1h15", "Disponible maintenant"
 */
export function formatChargeDuration(minutes: number | null): string {
  if (minutes === null || minutes <= 0) return 'Disponible maintenant';
  if (minutes < 60) return `Prête dans ${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `Prête dans ${h}h` : `Prête dans ${h}h${m.toString().padStart(2, '0')}`;
}

/**
 * Génère les données de télémétrie des casiers de batteries pour une station Lime donnée.
 * Basé sur la capacité réelle des armoires Lime (8 à 16 casiers en magasin Franprix, 40 à 80 en Hub).
 */
export function generateStationSlots(stationId: string, isLimeHub = false): {
  totalSlots: number;
  availableBatteries: number;
  chargingBatteries: number;
  emptySlots: number;
  slots: BatterySlot[];
  nextReadyInMinutes: number | null;
} {
  // Graine déterministe par ID de station pour conserver la cohérence
  const hash = stationId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const totalSlots = isLimeHub ? 48 : 12;

  const slots: BatterySlot[] = [];
  let availableCount = 0;
  let chargingCount = 0;
  let emptyCount = 0;

  for (let i = 1; i <= totalSlots; i++) {
    const slotSeed = (hash * i * 31) % 100;

    let status: 'ready' | 'charging' | 'empty';
    let batteryPercent: number;
    let estimatedMinutesToFull: number;

    if (slotSeed < 45) {
      // 45% des casiers ont une batterie pleine prête à l'échange
      status = 'ready';
      batteryPercent = 100;
      estimatedMinutesToFull = 0;
      availableCount++;
    } else if (slotSeed < 85) {
      // 40% des casiers sont en cours de recharge
      status = 'charging';
      // Batterie entre 25% et 95%
      batteryPercent = 25 + ((slotSeed * 7) % 71);
      estimatedMinutesToFull = estimateChargeTimeMinutes(batteryPercent, isLimeHub);
      chargingCount++;
    } else {
      // 15% des casiers sont vides (prêts à recevoir une batterie déchargée)
      status = 'empty';
      batteryPercent = 0;
      estimatedMinutesToFull = 0;
      emptyCount++;
    }

    slots.push({
      slotNumber: i,
      status,
      batteryPercent,
      estimatedMinutesToFull,
    });
  }

  // Trier les casiers en cours de charge pour trouver le prochain disponible
  const chargingSlots = slots
    .filter((s) => s.status === 'charging')
    .sort((a, b) => a.estimatedMinutesToFull - b.estimatedMinutesToFull);

  const nextReadyInMinutes =
    availableCount > 0 ? 0 : chargingSlots.length > 0 ? chargingSlots[0].estimatedMinutesToFull : null;

  return {
    totalSlots,
    availableBatteries: availableCount,
    chargingBatteries: chargingCount,
    emptySlots: emptyCount,
    slots,
    nextReadyInMinutes,
  };
}
