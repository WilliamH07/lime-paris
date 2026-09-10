import React, { useState, useEffect, useRef } from 'react';
import type { EnrichedBike, FilterOptions, ChargingStation, DetectedTrip, BikeSnapshotDiff } from '../types/gbfs';
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
  Clock,
  History,
} from 'lucide-react';

interface BottomSheetProps {
  bikes: EnrichedBike[];
  chargingStations: ChargingStation[];
  totalAvailable: number;
  rechargeCount: number;
  disabledCount: number;
  soonEmptyCount?: number;
  recentTrips?: DetectedTrip[];
  lastDiff?: BikeSnapshotDiff | null;
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
type ActiveTab = 'bikes' | 'stations' | 'trips';

export const BottomSheet: React.FC<BottomSheetProps> = ({
  bikes,
  chargingStations,
  rechargeCount,
  disabledCount,
  soonEmptyCount = 0,
  recentTrips = [],
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
              className={`flex-1 py-2 px-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                activeTab === 'bikes'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Vélos ({bikes.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('stations')}
            className={`flex-1 py-2 px-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1 ${
              activeTab === 'stations'
                ? 'bg-[#00DE00] text-slate-950 shadow-sm shadow-[#00DE00]/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Stations ({chargingStations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trips')}
            title="Historique des courses et trajets récents"
            className={`py-2 px-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1 ${
              activeTab === 'trips'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Trajets ({recentTrips.length})</span>
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
                {soonEmptyCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {soonEmptyCount}
                  </span>
                )}
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
              soonEmptyCount={soonEmptyCount}
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

        {/* Sidebar Header for Detected Trips */}
        {activeTab === 'trips' && (
          <div className="p-4 border-b border-slate-100/80 shrink-0 bg-slate-50">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                <h2 className="font-extrabold text-base text-slate-900 tracking-tight">
                  Trajets &amp; Activité Live
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white">
                {recentTrips.length} détectés
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Trajets calculés en continu par comparaison de snapshots successifs.
            </p>
          </div>
        )}

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {activeTab === 'bikes' && filters.displayMode !== 'stations_only' && (
            <BikeList
              bikes={bikes}
              selectedBikeId={selectedBikeId}
              onSelectBike={onSelectBike}
              onFocusOnMap={onFocusOnMap}
              onResetFilters={onResetFilters}
            />
          )}

          {activeTab === 'stations' && (
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

          {activeTab === 'trips' && (
            <div className="flex flex-col gap-2.5">
              {recentTrips.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                  <p className="font-bold text-slate-800 text-xs">Surveillance active des 6 000 vélos</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                    Dès qu'un vélo termine sa course ou est déverrouillé aux prochains rafraîchissements, son parcours estimé et sa perte de batterie apparaîtront ici.
                  </p>
                </div>
              ) : (
                recentTrips.map((trip) => {
                  const energyKm = (trip.estimatedEnergyDistanceMeters / 1000).toFixed(1);
                  const straightKm = (trip.straightDistanceMeters / 1000).toFixed(1);
                  const minsAgo = Math.max(0, Math.round((Date.now() - trip.endTime) / 60000));
                  const timeAgoStr = minsAgo === 0 ? 'À l’instant' : `Il y a ${minsAgo} min`;

                  return (
                    <div
                      key={trip.id}
                      className={`p-3 rounded-2xl border transition shadow-xs ${
                        trip.isRechargePriorityNow
                          ? 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-400/50'
                          : 'bg-white border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-slate-900">
                            Lime-E #{trip.shortId}
                          </span>
                          {trip.isRechargePriorityNow ? (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black uppercase">
                              🚨 Posé à plat ({trip.endBattery}%)
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                              Posé • {trip.endBattery}%
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{timeAgoStr}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 py-1.5 px-2 bg-slate-50 rounded-xl text-[11px] text-slate-600 mb-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Durée</span>
                          <span className="font-bold text-slate-800">{trip.durationMinutes} min</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Consommation</span>
                          <span className="font-bold text-rose-600">
                            {trip.batteryDelta !== null ? `${trip.batteryDelta}%` : '--'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Dist. estimée</span>
                          <span className="font-bold text-slate-800">~{energyKm} km</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Net : {straightKm} km vol d'oiseau</span>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${trip.endLat},${trip.endLon}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-slate-900 hover:text-[#008700] flex items-center gap-1"
                        >
                          <span>Itinéraire GPS ➔</span>
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </aside>

      {/* 
        MOBILE BOTTOM SHEET (screens < md)
      */}
      <div
        className={`md:hidden fixed left-0 right-0 bottom-0 z-20 glass-panel rounded-t-[30px] shadow-2xl shadow-slate-950/25 border-t border-white/80 sheet-spring flex flex-col pb-safe ${
          mobileState === 'expanded' ? 'h-[84dvh]' : 'h-auto max-h-[230px]'
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
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl flex-1 overflow-x-auto no-scrollbar">
                {filters.displayMode !== 'stations_only' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab('bikes');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ${
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
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                    activeTab === 'stations'
                      ? 'bg-[#00DE00] text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Stations ({chargingStations.length})</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('trips');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                    activeTab === 'trips'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Trajets ({recentTrips.length})</span>
                </button>
              </div>

              {/* Toggle expand/collapse button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMobileState();
                }}
                className="p-2 rounded-xl bg-slate-100/90 text-slate-700 hover:bg-slate-200 transition active:scale-95 shrink-0"
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
                          : currentBike.soonEmpty
                          ? 'bg-orange-500 text-white'
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
                            {currentBike.isDisabled
                              ? 'Hors service'
                              : currentBike.soonEmpty
                              ? 'Bientôt à plat'
                              : 'Prêt à l’emploi'}
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
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                  <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
                    {activeTab === 'bikes'
                      ? `⚡ ${rechargeCount} à charger`
                      : activeTab === 'stations'
                      ? `⚡ ${chargingStations.length} stations Lime`
                      : `⏱ ${recentTrips.length} trajets détectés`}
                  </span>
                  {activeTab === 'bikes' && soonEmptyCount > 0 && (
                    <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                      +{soonEmptyCount} bientôt vides
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-slate-700 shrink-0 pl-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Filtres</span>
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
                  soonEmptyCount={soonEmptyCount}
                />
              </div>
            )}

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto pb-32 custom-scrollbar">
              {activeTab === 'bikes' && filters.displayMode !== 'stations_only' && (
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
              )}

              {activeTab === 'stations' && (
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

              {activeTab === 'trips' && (
                <div className="flex flex-col gap-2.5">
                  {recentTrips.length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                        <Clock className="w-6 h-6 animate-pulse" />
                      </div>
                      <p className="font-bold text-slate-800 text-xs">Surveillance active des 6 000 vélos</p>
                      <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                        Dès qu'un vélo termine sa course ou est déverrouillé aux prochains rafraîchissements, son parcours estimé et sa perte de batterie apparaîtront ici.
                      </p>
                    </div>
                  ) : (
                    recentTrips.map((trip) => {
                      const energyKm = (trip.estimatedEnergyDistanceMeters / 1000).toFixed(1);
                      const straightKm = (trip.straightDistanceMeters / 1000).toFixed(1);
                      const minsAgo = Math.max(0, Math.round((Date.now() - trip.endTime) / 60000));
                      const timeAgoStr = minsAgo === 0 ? 'À l’instant' : `Il y a ${minsAgo} min`;

                      return (
                        <div
                          key={trip.id}
                          className={`p-3 rounded-2xl border transition shadow-xs ${
                            trip.isRechargePriorityNow
                              ? 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-400/50'
                              : 'bg-white border-slate-200/80'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-xs text-slate-900">
                                Lime-E #{trip.shortId}
                              </span>
                              {trip.isRechargePriorityNow ? (
                                <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black uppercase">
                                  🚨 Posé à plat ({trip.endBattery}%)
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                                  Posé • {trip.endBattery}%
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">{timeAgoStr}</span>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 py-1.5 px-2 bg-slate-50 rounded-xl text-[11px] text-slate-600 mb-2">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Durée</span>
                              <span className="font-bold text-slate-800">{trip.durationMinutes} min</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Consommation</span>
                              <span className="font-bold text-rose-600">
                                {trip.batteryDelta !== null ? `${trip.batteryDelta}%` : '--'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Dist. estimée</span>
                              <span className="font-bold text-slate-800">~{energyKm} km</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Net : {straightKm} km vol d'oiseau</span>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${trip.endLat},${trip.endLon}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-slate-900 hover:text-[#008700] flex items-center gap-1"
                            >
                              <span>Itinéraire GPS ➔</span>
                            </a>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
