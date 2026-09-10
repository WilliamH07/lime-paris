import React from 'react';
import { Share, PlusSquare, X, Smartphone, Check } from 'lucide-react';

interface IPhoneInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IPhoneInstallModal: React.FC<IPhoneInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm glass-panel-dark rounded-3xl p-5 text-white shadow-2xl border border-white/20 pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00DE00] flex items-center justify-center text-slate-950 font-black shadow-md shadow-[#00DE00]/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white leading-tight">
                Installer sur iPhone
              </h3>
              <p className="text-xs text-slate-400">Plein écran &amp; Dynamic Island</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0">
              <Share className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-white">1. Touchez Partager</p>
              <p className="text-slate-300 mt-0.5">
                Dans Safari, appuyez sur l'icône Partager au centre de la barre en bas.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-xl bg-[#00DE00]/20 text-[#00DE00] font-bold flex items-center justify-center shrink-0">
              <PlusSquare className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-white">2. « Sur l'écran d'accueil »</p>
              <p className="text-slate-300 mt-0.5">
                Faites défiler le menu et sélectionnez l'option avec l'icône plus (+).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-white">3. Confirmez « Ajouter »</p>
              <p className="text-slate-300 mt-0.5">
                L'application s'ouvrira comme une vraie app native sans barre d'adresse !
              </p>
            </div>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-3 rounded-xl bg-[#00DE00] hover:bg-[#00C700] text-slate-950 font-black text-xs transition shadow-lg shadow-[#00DE00]/30"
        >
          C'est compris !
        </button>
      </div>
    </div>
  );
};
