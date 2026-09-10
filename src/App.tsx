import React, { useState, useCallback } from 'react';
import { useGeoLocation } from './hooks/useGeoLocation';
import { useBikes } from './hooks/useBikes';
import { useChargingStations } from './hooks/useChargingStations';
import { useRechargeSession } from './hooks/useRechargeSession';
import { MapView } from './components/MapView';
import { Header } from './components/Header';
import { BottomSheet } from './components/BottomSheet';
import { SessionCockpit } from './components/SessionCockpit';
import { IPhoneInstallModal } from './components/IPhoneInstallModal';
import type { EnrichedBike, ChargingStation, ViewDisplayMode } from './types/gbfs';
import type { SessionWaypoint } from './types/session';
import { Loader2, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const {
    location: userLocation,
    effectiveLocation,
    isUsingFallback,
    error: geoError,
    refreshLocation,
    setDefaultParisLocation,
  } = useGeoLocation();

  const {
    allBikes,
    filteredBikes,
    totalAvailable,
    rechargeCount,
    disabledCount,
    soonEmptyCount,
    recentTrips,
    lastDiff,
    loading: bikesLoading,
    error: bikesError,
    secondsSinceUpdate,
    refresh: refreshBikes,
    filters,
    setFilters,
    resetFilters,
  } = useBikes(userLocation || effectiveLocation);

  const {
    stations: chargingStations,
    refresh: refreshStations,
  } = useChargingStations(userLocation || effectiveLocation);

  const {
    isSessionActive,
    plan: sessionPlan,
    currentStepIndex,
    activeWaypoint,
    completedStepIds,
    progressPercent,
    startSession,
    endSession,
    completeCurrentStep,
    goToStep,
  } = useRechargeSession(effectiveLocation, allBikes, chargingStations);

  const [selectedBike, setSelectedBike] = useState<EnrichedBike | null>(null);
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);

  const handleSelectBike = useCallback((bike: EnrichedBike) => {
    setSelectedBike(bike);
    setSelectedStation(null);
  }, []);

  const handleSelectStation = useCallback((station: ChargingStation) => {
    setSelectedStation(station);
    setSelectedBike(null);
  }, []);

  const handleSelectWaypoint = useCallback((wp: SessionWaypoint) => {
    if (wp.bike) {
      setSelectedBike(wp.bike);
      setSelectedStation(null);
    } else if (wp.station) {
      setSelectedStation(wp.station);
      setSelectedBike(null);
    }
  }, []);

  const handleDeselect = useCallback(() => {
    setSelectedBike(null);
    setSelectedStation(null);
  }, []);

  const handleToggleSession = useCallback(() => {
    if (isSessionActive) {
      endSession();
    } else {
      const ok = startSession();
      if (ok) {
        setSelectedBike(null);
        setSelectedStation(null);
      }
    }
  }, [isSessionActive, endSession, startSession]);

  const handleChangeDisplayMode = useCallback((mode: ViewDisplayMode) => {
    setFilters((prev) => ({
      ...prev,
      displayMode: mode,
      showChargingStations: mode !== 'bikes_only',
    }));
  }, [setFilters]);

  const handleRecenterUser = useCallback(() => {
    refreshLocation();
    setSelectedBike(null);
    setSelectedStation(null);
  }, [refreshLocation]);

  const handleRecenterParis = useCallback(() => {
    setDefaultParisLocation();
    setSelectedBike(null);
    setSelectedStation(null);
  }, [setDefaultParisLocation]);

  const handleRefreshAll = useCallback(async () => {
    await Promise.all([refreshBikes(), refreshStations()]);
  }, [refreshBikes, refreshStations]);

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden bg-slate-100 font-sans">
      {/* Top Header */}
      <Header
        totalCount={totalAvailable}
        filteredCount={filteredBikes.length}
        rechargeCount={rechargeCount}
        soonEmptyCount={soonEmptyCount}
        stationsCount={chargingStations.length}
        displayMode={filters.displayMode}
        onChangeDisplayMode={handleChangeDisplayMode}
        loading={bikesLoading}
        secondsSinceUpdate={secondsSinceUpdate}
        onRefresh={handleRefreshAll}
        userLocation={userLocation}
        isUsingFallback={isUsingFallback}
        onRecenterUser={handleRecenterUser}
        onRecenterParis={handleRecenterParis}
        geoError={geoError}
        isSessionActive={isSessionActive}
        onToggleSession={handleToggleSession}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
      />

      {/* Fullscreen Mapbox View */}
      <MapView
        bikes={filteredBikes}
        chargingStations={chargingStations}
        displayMode={filters.displayMode}
        userLocation={userLocation}
        effectiveLocation={effectiveLocation}
        selectedBike={selectedBike}
        selectedStation={selectedStation}
        sessionPlan={sessionPlan}
        currentStepIndex={currentStepIndex}
        onSelectBike={handleSelectBike}
        onSelectStation={handleSelectStation}
        onSelectWaypoint={handleSelectWaypoint}
        onRecenterUser={handleRecenterUser}
        onDeselect={handleDeselect}
      />

      {/* Session Cockpit when recharge session is active */}
      {isSessionActive && sessionPlan ? (
        <SessionCockpit
          plan={sessionPlan}
          currentStepIndex={currentStepIndex}
          activeWaypoint={activeWaypoint}
          completedStepIds={completedStepIds}
          progressPercent={progressPercent}
          onCompleteStep={completeCurrentStep}
          onSelectStep={goToStep}
          onEndSession={endSession}
          onFocusWaypoint={handleSelectWaypoint}
        />
      ) : (
        /* Bottom Sheet on Mobile / Floating Sidebar on Desktop */
        <BottomSheet
          bikes={filteredBikes}
          chargingStations={chargingStations}
          totalAvailable={totalAvailable}
          rechargeCount={rechargeCount}
          disabledCount={disabledCount}
          soonEmptyCount={soonEmptyCount}
          recentTrips={recentTrips}
          lastDiff={lastDiff}
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={resetFilters}
          selectedBikeId={selectedBike?.id || null}
          selectedStationId={selectedStation?.id || null}
          selectedBike={selectedBike}
          selectedStation={selectedStation}
          onSelectBike={handleSelectBike}
          onFocusOnMap={handleSelectBike}
          onSelectStation={handleSelectStation}
          onFocusStationOnMap={handleSelectStation}
          onDeselect={handleDeselect}
        />
      )}

      {/* Safari iPhone Install Modal */}
      <IPhoneInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Initial Loading Overlay */}
      {bikesLoading && allBikes.length === 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-panel px-6 py-5 rounded-3xl shadow-2xl flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#00DE00] flex items-center justify-center text-slate-950 font-black shadow-lg shadow-[#00DE00]/40 animate-bounce">
              ⚡
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-sm">Chargement du réseau Lime Paris</h3>
              <p className="text-xs text-slate-500 mt-0.5">Connexion aux SwapStations &amp; vélos en direct...</p>
            </div>
            <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
          </div>
        </div>
      )}

      {/* Global API Error Toast */}
      {bikesError && (
        <div className="absolute bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-40 bg-rose-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{bikesError}</span>
          </div>
          <button
            type="button"
            onClick={handleRefreshAll}
            className="px-2.5 py-1 bg-white text-rose-700 font-bold rounded-lg hover:bg-rose-50 transition shrink-0"
          >
            Réessayer
          </button>
        </div>
      )}
    </main>
  );
};

export default App;
