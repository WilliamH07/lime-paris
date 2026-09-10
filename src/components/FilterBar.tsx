import React from 'react';
import type { FilterOptions } from '../types/gbfs';
import { Zap, RotateCcw, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface FilterBarProps {
  filters: FilterOptions;
  onChange: (newFilters: FilterOptions) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  rechargeCount: number;
  disabledCount: number;
  soonEmptyCount?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  onReset,
  hasActiveFilters,
  rechargeCount,
  disabledCount,
  soonEmptyCount = 0,
}) => {
  return (
    <div className="flex flex-col gap-2.5 pb-2">
      {/* Primary Priority Filter: Status (À recharger / Bientôt vide / Désactivés / Disponibles / Tous) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <button
          type="button"
          onClick={() => onChange({ ...filters, status: 'all' })}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            filters.status === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tous les vélos
        </button>

        <button
          type="button"
          onClick={() => onChange({ ...filters, status: 'recharge' })}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            filters.status === 'recharge'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
              : 'bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100'
          }`}
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>À recharger ({rechargeCount})</span>
        </button>

        {soonEmptyCount > 0 && (
          <button
            type="button"
            onClick={() => onChange({ ...filters, status: 'soon_empty' })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              filters.status === 'soon_empty'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                : 'bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Bientôt vide ({soonEmptyCount})</span>
          </button>
        )}

        {disabledCount > 0 && (
          <button
            type="button"
            onClick={() => onChange({ ...filters, status: 'disabled' })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              filters.status === 'disabled'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Désactivés ({disabledCount})</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onChange({ ...filters, status: 'available' })}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
            filters.status === 'available'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Prêts à rouler</span>
        </button>
      </div>

      {/* Distance filter pills */}
      <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            Rayon
          </span>
          <button
            type="button"
            onClick={() => onChange({ ...filters, maxDistance: null })}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              filters.maxDistance === null
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tous
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...filters, maxDistance: 300 })}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              filters.maxDistance === 300
                ? 'bg-[#00DE00] text-slate-950 font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            &lt; 300m
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...filters, maxDistance: 500 })}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              filters.maxDistance === 500
                ? 'bg-[#00DE00] text-slate-950 font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            &lt; 500m
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...filters, maxDistance: 1000 })}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              filters.maxDistance === 1000
                ? 'bg-[#00DE00] text-slate-950 font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            &lt; 1km
          </button>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold transition shrink-0 ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            Réinit
          </button>
        )}
      </div>
    </div>
  );
};
