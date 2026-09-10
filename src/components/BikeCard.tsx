import React from 'react';
import type { EnrichedBike } from '../types/gbfs';
import { formatDistance, formatWalkingTime, getBatteryBadge } from '../utils/distance';
import { Bike, Battery, MapPin, Footprints, Zap, AlertTriangle, Clock } from 'lucide-react';

interface BikeCardProps {
  bike: EnrichedBike;
  isSelected: boolean;
  onSelect: (bike: EnrichedBike) => void;
  onFocusOnMap: (bike: EnrichedBike) => void;
}

export const BikeCard: React.FC<BikeCardProps> = ({
  bike,
  isSelected,
  onSelect,
  onFocusOnMap,
}) => {
  const batteryBadge = getBatteryBadge(bike.batteryPercent);
  const distanceFormatted = formatDistance(bike.distanceMeters);
  const walkingFormatted = formatWalkingTime(bike.walkingMinutes);
  const rangeKm = bike.currentRangeMeters
    ? (bike.currentRangeMeters / 1000).toFixed(1).replace('.', ',')
    : null;

  return (
    <div
      onClick={() => onSelect(bike)}
      className={`relative p-3.5 rounded-2xl transition-all duration-200 cursor-pointer border ${
        isSelected
          ? 'bg-amber-50/80 border-amber-500 shadow-md ring-2 ring-amber-400/50'
          : bike.isDisabled
          ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300 shadow-sm'
          : bike.needsRecharge
          ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300 shadow-sm'
          : bike.soonEmpty
          ? 'bg-orange-50/40 border-orange-200 hover:border-orange-300 shadow-sm'
          : 'bg-white/80 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
      }`}
    >
      {/* Priority Tags for juicer operations */}
      {bike.isDisabled && (
        <div className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
          <AlertTriangle className="w-3 h-3" />
          <span>Désactivé • À recharger</span>
        </div>
      )}
      {!bike.isDisabled && bike.needsRecharge && (
        <div className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider">
          <Zap className="w-3 h-3 fill-current" />
          <span>Priorité recharge (Batterie faible)</span>
        </div>
      )}
      {!bike.isDisabled && !bike.needsRecharge && bike.soonEmpty && (
        <div className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider">
          <Clock className="w-3 h-3" />
          <span>Bientôt à plat (Anticipation recharge)</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        {/* Left icon & details */}
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              bike.isDisabled
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                : bike.needsRecharge
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                : bike.soonEmpty
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                : isSelected
                ? 'bg-[#00DE00] text-slate-950 font-black shadow-sm shadow-[#00DE00]/40'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {bike.isDisabled ? <AlertTriangle className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 tracking-tight">
                Lime-E #{bike.shortId}
              </span>
              {bike.distanceMeters !== null && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
                  {distanceFormatted}
                </span>
              )}
            </div>

            {walkingFormatted && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                <Footprints className="w-3.5 h-3.5 text-slate-400" />
                <span>{walkingFormatted}</span>
              </p>
            )}
          </div>
        </div>

        {/* Battery badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold shrink-0 ${batteryBadge.bgColor} ${batteryBadge.textColor} ${batteryBadge.borderColor}`}
          title={rangeKm ? `Autonomie estimée : ${rangeKm} km` : 'Autonomie'}
        >
          <Battery className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{batteryBadge.label}</span>
        </div>
      </div>

      {/* Card footer: Range & Action button */}
      <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-xs">
        <div className="text-slate-500 font-medium flex items-center gap-1">
          {rangeKm ? (
            <>
              <Zap className={`w-3 h-3 ${bike.needsRecharge ? 'text-amber-500 fill-amber-500' : 'text-emerald-600 fill-emerald-600'}`} />
              <span className={bike.needsRecharge ? 'text-amber-700 font-semibold' : ''}>
                ~{rangeKm} km d'autonomie
              </span>
            </>
          ) : (
            <span>{bike.isDisabled ? 'Hors service' : 'Prêt à rouler'}</span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFocusOnMap(bike);
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-[#008700] text-white font-medium transition active:scale-95 shadow-xs"
        >
          <MapPin className="w-3 h-3" />
          <span>Localiser</span>
        </button>
      </div>
    </div>
  );
};
