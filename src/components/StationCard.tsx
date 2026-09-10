import React from 'react';
import type { ChargingStation } from '../types/gbfs';
import { formatDistance, formatWalkingTime } from '../utils/distance';
import { Zap, MapPin, Footprints, ExternalLink, ShieldCheck } from 'lucide-react';

interface StationCardProps {
  station: ChargingStation;
  isSelected: boolean;
  onSelect: (station: ChargingStation) => void;
  onFocusOnMap: (station: ChargingStation) => void;
}

export const StationCard: React.FC<StationCardProps> = ({
  station,
  isSelected,
  onSelect,
  onFocusOnMap,
}) => {
  const dist = formatDistance(station.distanceMeters);
  const walk = formatWalkingTime(station.walkingMinutes);

  return (
    <div
      onClick={() => onSelect(station)}
      className={`relative p-3.5 rounded-2xl transition-all duration-200 cursor-pointer border ${
        isSelected
          ? 'bg-emerald-50/90 border-[#00DE00] shadow-md ring-2 ring-[#00DE00]/40'
          : 'bg-white/85 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
      }`}
    >
      {/* Header with Name and Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              station.isLimeHub
                ? 'bg-slate-900 text-[#00DE00]'
                : 'bg-[#00DE00] text-slate-950'
            } font-black shadow-sm`}
          >
            <Zap className="w-5 h-5 fill-current" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 tracking-tight leading-tight">
                {station.name}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{station.address}</p>
            {walk && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                <Footprints className="w-3.5 h-3.5 text-slate-400" />
                <span>{walk} ({dist})</span>
              </p>
            )}
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
            station.isLimeHub
              ? 'bg-slate-900 text-[#00DE00]'
              : 'bg-[#00DE00]/20 text-[#008700] border border-[#00DE00]/40'
          }`}
        >
          {station.isLimeHub ? 'Hub Lime' : 'SwapStation'}
        </span>
      </div>

      {/* Operator and Services Tags */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          {station.operator}
        </span>
        {station.plugTypes.map((tag, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-medium border border-emerald-200/60"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Card footer actions */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-400 font-medium">
          Emplacement physique certifié
        </span>

        <div className="flex items-center gap-2">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lon}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
            title="Itinéraire Google Maps"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Itinéraire</span>
          </a>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFocusOnMap(station);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-[#008700] text-white font-medium transition active:scale-95 shadow-xs"
          >
            <MapPin className="w-3 h-3" />
            <span>Carte</span>
          </button>
        </div>
      </div>
    </div>
  );
};
