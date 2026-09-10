import React, { useState } from 'react';
import type { SessionPlan, SessionWaypoint } from '../types/session';
import { formatDistance } from '../utils/distance';
import {
  Zap,
  Bike,
  CheckCircle2,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  X,
  Navigation,
  MapPin,
  Clock,
} from 'lucide-react';

interface SessionCockpitProps {
  plan: SessionPlan;
  currentStepIndex: number;
  activeWaypoint: SessionWaypoint | null;
  completedStepIds: string[];
  progressPercent: number;
  onCompleteStep: () => void;
  onSelectStep: (index: number) => void;
  onEndSession: () => void;
  onFocusWaypoint: (wp: SessionWaypoint) => void;
}

export const SessionCockpit: React.FC<SessionCockpitProps> = ({
  plan,
  currentStepIndex,
  activeWaypoint,
  completedStepIds,
  progressPercent,
  onCompleteStep,
  onSelectStep,
  onEndSession,
  onFocusWaypoint,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const totalSteps = plan.waypoints.length - 1;
  const isLastStep = currentStepIndex >= plan.waypoints.length - 1;
  const isFinished = completedStepIds.length >= totalSteps;

  const totalDistKm = (plan.totalDistanceMeters / 1000).toFixed(1);

  return (
    <div className="absolute left-3 right-3 bottom-0 z-30 pb-safe pointer-events-none transition-all duration-300">
      <div className="max-w-md mx-auto pointer-events-auto flex flex-col gap-2">
        {/* Main Cockpit Card */}
        <div className="glass-panel-dark rounded-3xl p-4 text-white shadow-2xl border border-white/20 backdrop-blur-2xl">
          {/* Top Session Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00DE00] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00DE00]"></span>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#00DE00]">
                    Session de Recharge
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-slate-200 font-semibold">
                    {plan.totalBikesCount} vélos • {plan.totalStationsCount} swaps
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    ~{plan.totalEstimatedMinutes} min
                  </span>
                  <span>•</span>
                  <span>{totalDistKm} km au total</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onEndSession}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
              title="Quitter la session"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1.5">
              <span>
                Étape {currentStepIndex} sur {totalSteps}
              </span>
              <span className="text-[#00DE00] font-bold">{progressPercent}% terminé</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00DE00] to-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Current Active Step Hero Card */}
          {activeWaypoint && !isFinished ? (
            <div className="mt-3.5 p-3.5 rounded-2xl bg-white/10 border border-white/15">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 ${
                      activeWaypoint.type === 'station'
                        ? 'bg-[#00DE00] text-slate-950 shadow-md shadow-[#00DE00]/30'
                        : activeWaypoint.isDisabledBike
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                        : 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                    }`}
                  >
                    {activeWaypoint.type === 'station' ? (
                      <Zap className="w-5 h-5 fill-current" />
                    ) : (
                      <Bike className="w-5 h-5 stroke-[2.5]" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-300">
                      Étape en cours
                    </span>
                    <h3 className="text-sm font-extrabold text-white leading-tight">
                      {activeWaypoint.title}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-1">{activeWaypoint.subtitle}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-[#00DE00] block">
                    {formatDistance(activeWaypoint.distanceFromPreviousMeters)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ~{activeWaypoint.estimatedMinutesFromPrevious} min
                  </span>
                </div>
              </div>

              {/* Action Banner */}
              <div className="mt-3 p-2 rounded-xl bg-black/40 border border-white/10 text-xs font-medium text-emerald-300 flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 shrink-0 text-[#00DE00]" />
                <span>{activeWaypoint.action}</span>
              </div>

              {/* Big Action Buttons */}
              <div className="mt-3.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onCompleteStep}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#00DE00] hover:bg-[#00C700] active:scale-[0.98] text-slate-950 font-black text-sm transition shadow-lg shadow-[#00DE00]/30 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 fill-current" />
                  <span>{isLastStep ? 'Terminer la session' : '✓ Fait / Étape suivante'}</span>
                </button>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeWaypoint.lat},${activeWaypoint.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-white/15 hover:bg-white/25 text-white transition active:scale-95 flex items-center justify-center"
                  title="Ouvrir GPS"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => onFocusWaypoint(activeWaypoint)}
                  className="p-3 rounded-xl bg-white/15 hover:bg-white/25 text-white transition active:scale-95 flex items-center justify-center"
                  title="Centrer carte"
                >
                  <MapPin className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3.5 p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-center">
              <CheckCircle2 className="w-8 h-8 text-[#00DE00] mx-auto mb-1.5" />
              <h3 className="font-extrabold text-sm text-white">Session terminée avec succès !</h3>
              <p className="text-xs text-slate-300 mt-1">
                Tous les vélos ont été traités et les batteries déposées aux stations.
              </p>
              <button
                type="button"
                onClick={onEndSession}
                className="mt-3 w-full py-2.5 rounded-xl bg-[#00DE00] text-slate-950 font-black text-xs transition"
              >
                Clôturer la session
              </button>
            </div>
          )}

          {/* Toggle Full Itinerary List */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="w-full mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <span>Feuille de route complète ({totalSteps} étapes)</span>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {/* Expanded Step List */}
          {isExpanded && (
            <div className="mt-2.5 max-h-56 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
              {plan.waypoints.slice(1).map((wp, idx) => {
                const stepNum = idx + 1;
                const isCurrent = stepNum === currentStepIndex;
                const isDone = completedStepIds.includes(wp.id);

                return (
                  <div
                    key={wp.id}
                    onClick={() => {
                      onSelectStep(stepNum);
                      onFocusWaypoint(wp);
                    }}
                    className={`p-2.5 rounded-xl transition cursor-pointer border flex items-center justify-between text-xs ${
                      isCurrent
                        ? 'bg-white/20 border-[#00DE00] text-white shadow-xs'
                        : isDone
                        ? 'bg-white/5 border-white/5 text-slate-400 opacity-60'
                        : 'bg-white/10 border-white/10 text-slate-200 hover:bg-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center shrink-0 ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-[#00DE00] text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {isDone ? '✓' : stepNum}
                      </span>
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{wp.title}</span>
                          {wp.type === 'station' && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#00DE00]/20 text-[#00DE00]">
                              SWAP
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{wp.action}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                      {formatDistance(wp.distanceFromPreviousMeters)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
