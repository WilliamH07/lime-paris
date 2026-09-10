import React, { useState, useEffect, useRef } from 'react';
import type { EnrichedBike, FilterOptions, ChargingStation } from '../types/gbfs';
import { FilterBar } from './FilterBar';
import { BikeList } from './BikeList';
import { StationCard } from './StationCard';
import { formatDistance, formatWalkingTime, getBatteryBadge } from '../utils/distance';
import {
  ChevronUp,
  ChevronDown,
  Zap,
  Bike,
  X,
  MapPin,
  ExternalLink,
  Battery,
  Footprints,
  AlertTriangle,
  SlidersHorizontal,
} from 'lucide-react';

interface BottomSheetProps {
  bikes: EnrichedBike[];
  chargingStations: ChargingStation[];
  totalAvailable: number;
  rechargeCount: number;
  disabledCount: number;
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onResetFilters: () => void;
  selectedBikeId: string | null;
  selectedStationId: string | null;
  selectedBike?: EnrichedBike | null;
  selectedStation?: ChargingStation | null;
  onSelectBike: (bike: EnrichedBike) => void;
  onFocusOnMap: (bike: EnrichedBike) => void;
  onSelectStation: (station: ChargingStation) => void;
  onFocusStationOnMap: (station: ChargingStation) => void;
  onDeselect?: () => void;
}

type SheetState = 'peek' | 'expanded';
type ActiveTab = 'bikes' | 'stations';

export const BottomSheet: React.FC<BottomSheetProps> = ({
  bikes,
  chargingStations,
  rechargeCount,
  disabledCount,
  filters,
  onFilterChange,
  onResetFilters,
  selectedBikeId,
  selectedStationId,
  selectedBike,
  selectedStation,
  onSelectBike,
  onFocusOnMap,
  onSelectStation,
  onFocusStationOnMap,
  onDeselect,
}) => {
  const [mobileState, setMobileState] = useState<SheetState>('peek');
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    filters.displayMode === 'stations_only' ? 'stations' : 'bikes'
  );

  const touchStartY = useRef<number | null>(null);

  // Sync tab with external displayMode changes
  useEffect(() => {
    if (filters.displayMode === 'stations_only') {
      setActiveTab('stations');
    } else if (filters.displayMode === 'bikes_only') {
      setActiveTab('bikes');
    }
  }, [filters.displayMode]);

  const hasActiveFilters =
    filters.maxDistance !== null ||
    filters.minBattery !== null ||
    filters.formFactor !== 'all' ||
    filters.status !== 'all';

  const toggleMobileState = () => {
    setMobileState((prev) => (prev === 'peek' ? 'expanded' : 'peek'));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    if (deltaY > 45) {
      // Swiped up -> expand
      setMobileState('expanded');
    } else if (deltaY < -45) {
      // Swiped down -> peek
      setMobileState('peek');
    }
    touchStartY.current = null;
  };

  const currentBike =
    selectedBike || (selectedBikeId ? bikes.find((b) => b.id === selectedBikeId) : null);
  const currentStation =
    selectedStation ||
    (selectedStationId ? chargingStations.find((s) => s.id === selectedStationId) : null);
  const hasSelection = Boolean(currentBike || currentStation);

  return (
    <>
      {/* 
        DESKTOP FLOATING SIDEBAR (md and up) 
      */}
      <aside className="hidden md:flex flex-col absolute top-24 left-4 bottom-4 w-96 z-20 glass-panel rounded-3xl shadow-2xl shadow-slate-900/10 border border-white/60 overflow-hidden">
        {/* Navigation Tabs */}
        <div className="p-3 bg-slate-100/70 border-b border-slate-200/60 flex items-center gap-1">
          {filters.displayMode !== 'stations_only' && (
            <button
              type="button"
              onClick={() => setActiveTab('bikes')}
              className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'bikes'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>Vélos ({bikes.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('stations')}
            className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'stations'
                ? 'bg-[#00DE00] text-slate-950 shadow-sm shadow-[#00DE00]/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Stations Lime ({chargingStations.length})</span>
          </button>
        </div>

        {/* Sidebar Header for Bikes */}
        {activeTab === 'bikes' && filters.displayMode !== 'stations_only' && (
          <div className="p-4 border-b border-slate-100/80 shrink-0 bg-white/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <h2 className="font-extrabold text-base text-slate-900 tracking-tight">
                  Vélos &amp; Recharge
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" />
                  {rechargeCount}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white">
                  {bikes.length}
                </span>
              </div>
            </div>

            <FilterBar
              filters={filters}
              onChange={onFilterChange}
              onReset={onResetFilters}
              hasActiveFilters={hasActiveFilters}
              rechargeCount={rechargeCount}
              disabledCount={disabledCount}
            />
          </div>
        )}

        {/* Sidebar Header for Lime Charging Stations */}
        {activeTab === 'stations' && (
          <div className="p-4 border-b border-slate-100/80 shrink-0 bg-emerald-50/50">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00DE00] animate-pulse" />
                <h2 className="font-extrabold text-base text-slate-900 tracking-tight">
                  Stations de charge Lime
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00DE00] text-slate-950">
                {chargingStations.length} stations
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Armoires d'échange de batteries (Franprix) &amp; Hubs logistiques Lime.
            </p>
          </div>
        )}

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {activeTab === 'bikes' && filters.displayMode !== 'stations_only' ? (
            <BikeList
              bikes={bikes}
              selectedBikeId={selectedBikeId}
              onSelectBike={onSelectBike}
              onFocusOnMap={onFocusOnMap}
              onResetFilters={onResetFilters}
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {chargingStations.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  isSelected={station.id === selectedStationId}
                  onSelect={onSelectStation}
                  onFocusOnMap={onFocusStationOnMap}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* 
        MOBILE BOTTOM SHEET (screens < md)
      */}
      <div
        className={`md:hidden fixed left-0 right-0 bottom-0 z-20 glass-panel rounded-t-[30px] shadow-2xl shadow-slate-950/25 border-t border-white/80 transition-all duration-300 ease-out flex flex-col pb-safe ${
          mobileState === 'expanded' ? 'h-[84dvh]' : 'h-auto max-h-[220px]'
        }`}
      >
        {/* Drag Handle & Header bar */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="pt-2.5 pb-1.5 px-4 cursor-pointer shrink-0 select-none"
          onClick={() => {
            if (mobileState === 'peek' && !hasSelection) {
              setMobileState('expanded');
            }
          }}
        >
          <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-2" />

          {/* Quick tab switcher (shown when NOT viewing a single selected item in peek mode) */}
          {(!hasSelection || mobileState === 'expanded') && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl">
                {filters.displayMode !== 'stations_only' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab('bikes');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      activeTab === 'bikes'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Bike className="w-3.5 h-3.5" />
                    <span>Vélos ({bikes.length})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('stations');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'stations'
                      ? 'bg-[#00DE00] text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Stations ({chargingStations.length})</span>
                </button>
              </div>

              {/* Toggle expand/collapse button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMobileState();
                }}
                className="p-2 rounded-xl bg-slate-100/90 text-slate-700 hover:bg-slate-200 transition active:scale-95"
                aria-label={mobileState === 'expanded' ? 'Réduire' : 'Agrandir'}
              >
                {mobileState === 'expanded' ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* 
          PEEK MODE CONTENT
        */}
        {mobileState === 'peek' && (
          <div className="px-4 pb-2.5">
            {/* SUB-CASE 1: A Bike is selected */}
            {currentBike && (
              <div className="bg-white/95 rounded-2xl p-3 border border-slate-200/80 shadow-sm flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        currentBike.isDisabled
                          ? 'bg-rose-600 text-white'
                          : currentBike.needsRecharge
                          ? 'bg-amber-500 text-white'
                          : 'bg-[#00DE00] text-slate-950'
                      }`}
                    >
                      {currentBike.isDisabled ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Bike className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-slate-900">
                          Lime-E #{currentBike.shortId}
                        </span>
                        {currentBike.distanceMeters !== null && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {formatDistance(currentBike.distanceMeters)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        {currentBike.walkingMinutes ? (
                          <>
                            <Footprints className="w-3 h-3 text-slate-400" />
                            <span>{formatWalkingTime(currentBike.walkingMinutes)} à pied</span>
                          </>
                        ) : (
                          <span>
                            {currentBike.isDisabled ? 'Hors service' : 'Prêt à l’emploi'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const badge = getBatteryBadge(currentBike.batteryPercent);
                      return (
                        <div
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold ${badge.bgColor} ${badge.textColor} ${badge.borderColor}`}
                        >
                          <Battery className="w-3 h-3 stroke-[2.5]" />
                          <span>{badge.label}</span>
                        </div>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeselect?.();
                      }}
                      className="p-1 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
                      title="Fermer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quick actions for selected bike */}
                <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => onFocusOnMap(currentBike)}
                    className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-1 active:scale-95"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Centrer</span>
                  </button>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${currentBike.lat},${currentBike.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 rounded-xl bg-slate-900 text-white flex items-center justify-center gap-1 active:scale-95 shadow-xs"
                  >
                    <span>Itinéraire GPS</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setMobileState('expanded')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
                    title="Voir toute la liste"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* SUB-CASE 2: A Station is selected */}
            {!currentBike && currentStation && (
              <div className="bg-white/95 rounded-2xl p-3 border border-slate-200/80 shadow-sm flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#00DE00] text-slate-950 font-black flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                        {currentStation.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {currentStation.address}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeselect?.();
                    }}
                    className="p-1 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
                    title="Fermer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100 text-xs font-semibold">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${currentStation.lat},${currentStation.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 rounded-xl bg-slate-900 text-white flex items-center justify-center gap-1 active:scale-95 shadow-xs"
                  >
                    <span>Itinéraire Station</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setMobileState('expanded')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1"
                  >
                    <span>Liste</span>
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* SUB-CASE 3: Nothing selected -> Sleek collapsed summary bar */}
            {!hasSelection && (
              <div
                onClick={() => setMobileState('expanded')}
                className="mt-1 flex items-center justify-between p-2.5 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs cursor-pointer active:scale-98 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-xs font-bold text-slate-800">
                    {activeTab === 'bikes'
                      ? `⚡ ${rechargeCount} vélos à recharger`
                      : `⚡ ${chargingStations.length} stations Lime prêtes`}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Liste &amp; Filtres</span>
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 
          EXPANDED MODE CONTENT
        */}
        {mobileState === 'expanded' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 pt-1">
            {/* Filter Bar (for bikes tab) */}
            {activeTab === 'bikes' && filters.displayMode !== 'stations_only' && (
              <div className="shrink-0 mb-1 border-b border-slate-100 pb-1">
                <FilterBar
                  filters={filters}
                  onChange={onFilterChange}
                  onReset={onResetFilters}
                  hasActiveFilters={hasActiveFilters}
                  rechargeCount={rechargeCount}
                  disabledCount={disabledCount}
                />
              </div>
            )}

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto pb-32 custom-scrollbar">
              {activeTab === 'bikes' && filters.displayMode !== 'stations_only' ? (
                <BikeList
                  bikes={bikes}
                  selectedBikeId={selectedBikeId}
                  onSelectBike={onSelectBike}
                  onFocusOnMap={(bike) => {
                    onFocusOnMap(bike);
                    setMobileState('peek');
                  }}
                  onResetFilters={onResetFilters}
                />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {chargingStations.map((station) => (
                    <StationCard
                      key={station.id}
                      station={station}
                      isSelected={station.id === selectedStationId}
                      onSelect={onSelectStation}
                      onFocusOnMap={(st) => {
                        onFocusStationOnMap(st);
                        setMobileState('peek');
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
