import React, { useState } from 'react';
import type { EnrichedBike } from '../types/gbfs';
import { BikeCard } from './BikeCard';
import { Frown, ChevronDown } from 'lucide-react';

interface BikeListProps {
  bikes: EnrichedBike[];
  selectedBikeId: string | null;
  onSelectBike: (bike: EnrichedBike) => void;
  onFocusOnMap: (bike: EnrichedBike) => void;
  onResetFilters: () => void;
}

const PAGE_SIZE = 40;

export const BikeList: React.FC<BikeListProps> = ({
  bikes,
  selectedBikeId,
  onSelectBike,
  onFocusOnMap,
  onResetFilters,
}) => {
  const [displayCount, setDisplayCount] = useState<number>(PAGE_SIZE);

  const displayedBikes = bikes.slice(0, displayCount);
  const hasMore = bikes.length > displayCount;

  if (bikes.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <Frown className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-slate-800 text-sm">Aucun vélo trouvé</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Aucun vélo Lime ne correspond à vos filtres actuels dans ce secteur.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
        >
          Réinitialiser les filtres
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {displayedBikes.map((bike) => (
        <BikeCard
          key={bike.id}
          bike={bike}
          isSelected={bike.id === selectedBikeId}
          onSelect={onSelectBike}
          onFocusOnMap={onFocusOnMap}
        />
      ))}

      {hasMore && (
        <button
          type="button"
          onClick={() => setDisplayCount((prev) => prev + PAGE_SIZE)}
          className="w-full py-2.5 mt-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-98"
        >
          <span>Afficher plus de vélos ({bikes.length - displayCount} restants)</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
