import React, { useState, useEffect } from 'react';
import type { EnrichedBike, FilterOptions, ChargingStation } from '../types/gbfs';
import { FilterBar } from './FilterBar';
import { BikeList } from './BikeList';
import { StationCard } from './StationCard';
import { ChevronUp, ChevronDown, Zap, Bike } from 'lucide-react';

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
  onSelectBike: (bike: EnrichedBike) => void;
  onFocusOnMap: (bike: EnrichedBike) => void;
  onSelectStation: (station: ChargingStation) => void;
  onFocusStationOnMap: (station: ChargingStation) => void;
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
  onSelectBike,
  onFocusOnMap,
  onSelectStation,
  onFocusStationOnMap,
}) => {
  const [mobileState, setMobileState] = useState<SheetState>('peek');
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    filters.displayMode === 'stations_only' ? 'stations' : 'bikes'
  );

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
        className={`md:hidden fixed left-0 right-0 bottom-0 z-20 glass-panel rounded-t-[32px] shadow-2xl shadow-slate-950/20 border-t border-white/80 transition-all duration-300 ease-out flex flex-col ${
          mobileState === 'expanded'
            ? 'h-[84vh]'
            : 'h-[185px]'
        }`}
      >
        {/* Touch Handle & Header */}
        <div
          onClick={toggleMobileState}
          className="pt-2.5 pb-2 px-5 cursor-pointer shrink-0 border-b border-slate-100/60"
        >
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-2" />

          {/* Quick tab switcher on mobile */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {filters.displayMode !== 'stations_only' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('bikes');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    activeTab === 'bikes' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
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
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  activeTab === 'stations' ? 'bg-[#00DE00] text-slate-950 shadow-xs' : 'text-slate-600'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Stations Lime ({chargingStations.length})</span>
              </button>
            </div>

            <button
              type="button"
              className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
              aria-label="Toggle bottom sheet"
            >
              {mobileState === 'expanded' ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 pt-2">
          {activeTab === 'bikes' && filters.displayMode !== 'stations_only' && (
            <div className="shrink-0 mb-1">
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

          <div className="flex-1 overflow-y-auto pb-6 custom-scrollbar">
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
        </div>
      </div>
    </>
  );
};
