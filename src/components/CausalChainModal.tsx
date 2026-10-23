import React from 'react';
import { useFranklin } from '../context/FranklinContext';
import { CAUSAL_CHAIN } from '../config/franklinDefaults';
import { ArrowRight, X, Sparkles } from 'lucide-react';

interface CausalChainModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CausalChainModal: React.FC<CausalChainModalProps> = ({ isOpen, onClose }) => {
  const { language, t } = useFranklin();
  const isRu = language === 'ru';
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#0e1118] border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 text-slate-900 dark:text-neutral-100 shadow-2xl overflow-y-auto max-h-[90vh] transition-colors duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors p-1 rounded-lg"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <div className="text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono font-bold mb-1">
            {t('chainModalKicker')}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('chainModalTitle')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-neutral-400 mt-2 leading-relaxed">
            {t('chainModalDesc')}
          </p>
        </div>

        {/* Chain visualization */}
        <div className="space-y-3 my-6">
          {CAUSAL_CHAIN.map((item, idx) => (
            <div
              key={item.step}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800/80 hover:border-slate-300 dark:hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center gap-3 sm:w-56 shrink-0">
                <span className="font-mono text-xs text-slate-400 dark:text-neutral-500 w-5">0{idx + 1}</span>
                <span className="font-bold text-slate-900 dark:text-white tracking-wide">
                  {isRu ? item.stepRu : item.step}
                </span>
                <span className="text-xs text-slate-400 dark:text-neutral-500 font-mono">
                  ({isRu ? item.step : item.stepRu})
                </span>
              </div>
              <div className="hidden sm:block text-slate-300 dark:text-neutral-600">
                <ArrowRight size={14} />
              </div>
              <div className="text-xs sm:text-sm text-slate-700 dark:text-neutral-300 leading-relaxed">
                {isRu ? item.descRu : item.desc}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 transition-colors shadow-xs"
          >
            {t('closeBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};
