import React from 'react';
import { RefreshCw, Navigation, AlertTriangle, Bike, Zap, Layers, Smartphone, Square } from 'lucide-react';
import type { UserLocation, ViewDisplayMode } from '../types/gbfs';

interface HeaderProps {
  totalCount: number;
  filteredCount: number;
  rechargeCount: number;
  stationsCount: number;
  displayMode: ViewDisplayMode;
  onChangeDisplayMode: (mode: ViewDisplayMode) => void;
  loading: boolean;
  secondsSinceUpdate: number;
  onRefresh: () => void;
  userLocation: UserLocation | null;
  isUsingFallback: boolean;
  onRecenterUser: () => void;
  onRecenterParis: () => void;
  geoError: string | null;
  isSessionActive: boolean;
  onToggleSession: () => void;
  onOpenInstallModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCount,
  filteredCount,
  rechargeCount,
  stationsCount,
  displayMode,
  onChangeDisplayMode,
  loading,
  secondsSinceUpdate,
  onRefresh,
  userLocation,
  isUsingFallback,
  onRecenterUser,
  onRecenterParis,
  geoError,
  isSessionActive,
  onToggleSession,
  onOpenInstallModal,
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none pt-safe px-3">
      <div className="max-w-6xl mx-auto flex flex-col gap-2">
        <div className="glass-panel rounded-2xl shadow-xl shadow-slate-900/5 px-4 py-3 flex items-center justify-between pointer-events-auto border border-white/60">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00DE00] flex items-center justify-center shadow-lg shadow-[#00DE00]/30 text-slate-950 font-black">
              {displayMode === 'stations_only' ? <Zap className="w-6 h-6 fill-current" /> : <Bike className="w-6 h-6 stroke-[2.5]" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                  {displayMode === 'stations_only' ? 'Stations Lime' : 'Lime Paris'}
                </h1>
                {displayMode === 'stations_only' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#00DE00]/20 text-[#008700] border border-[#00DE00]/40">
                    <Zap className="w-3 h-3 fill-current mr-1" />
                    {stationsCount} stations actives
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                    <Zap className="w-3 h-3 fill-amber-500 text-amber-500 mr-1" />
                    {rechargeCount} à charger
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>
                  {displayMode === 'stations_only'
                    ? `${stationsCount} SwapStations & Hubs (Vélos masqués)`
                    : filteredCount === totalCount
                    ? `${totalCount.toLocaleString()} vélos suivis`
                    : `${filteredCount} sur ${totalCount.toLocaleString()}`}
                </span>
                <span>•</span>
                <span>
                  {secondsSinceUpdate <= 2 ? 'À l’instant' : `Mis à jour il y a ${secondsSinceUpdate}s`}
                </span>
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Mode Session Toggle Button */}
            <button
              type="button"
              onClick={onToggleSession}
              title={
                isSessionActive
                  ? 'Terminer la session de recharge'
                  : 'Démarrer une session de recharge optimisée'
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 active:scale-95 shadow-md ${
                isSessionActive
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-400/50'
                  : 'bg-[#00DE00] hover:bg-[#00C700] text-slate-950 shadow-[#00DE00]/30'
              }`}
            >
              {isSessionActive ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>En Session</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline">Mode</span>
                  <span>Session</span>
                </>
              )}
            </button>

            {/* Display Mode Switcher (hidden in session mode to avoid conflict) */}
            {!isSessionActive && (
              <div className="hidden lg:flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => onChangeDisplayMode('all')}
                  title="Afficher vélos et stations"
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    displayMode === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Tout</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeDisplayMode('stations_only')}
                  title="Afficher uniquement les stations Lime"
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    displayMode === 'stations_only'
                      ? 'bg-[#00DE00] text-slate-950 shadow-sm shadow-[#00DE00]/30'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Stations</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeDisplayMode('bikes_only')}
                  title="Afficher uniquement les vélos"
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    displayMode === 'bikes_only'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Vélos</span>
                </button>
              </div>
            )}

            {/* iPhone Safari Install Help Button */}
            <button
              type="button"
              onClick={onOpenInstallModal}
              title="Installer sur iPhone (Safari)"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition active:scale-95 flex items-center justify-center"
            >
              <Smartphone className="w-4 h-4" />
            </button>

            {/* Geolocation Button */}
            {userLocation && !isUsingFallback ? (
              <button
                type="button"
                onClick={onRecenterUser}
                title="Centrer sur ma position"
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-blue-600 border border-slate-200/80 transition active:scale-95 flex items-center justify-center"
              >
                <Navigation className="w-4 h-4 fill-blue-600" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onRecenterParis}
                title="Position par défaut : Paris Centre"
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 text-xs font-medium transition active:scale-95 flex items-center gap-1"
              >
                <Navigation className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Paris</span>
              </button>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Rafraîchir les données"
              className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition active:scale-95 disabled:opacity-50 flex items-center justify-center shadow-md shadow-slate-900/10"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Geolocation Notice Banner */}
        {geoError && (
          <div className="glass-panel bg-amber-50/90 border border-amber-200/80 rounded-xl px-3 py-2 text-xs text-amber-800 flex items-center justify-between pointer-events-auto shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{geoError}</span>
            </div>
            <button
              type="button"
              onClick={onRecenterParis}
              className="underline font-semibold hover:text-amber-950 ml-2 whitespace-nowrap"
            >
              Centrer sur Paris
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
