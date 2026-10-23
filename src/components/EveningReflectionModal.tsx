import React, { useState } from 'react';
import { useFranklin } from '../context/FranklinContext';
import { X, Check, BookOpen } from 'lucide-react';

interface EveningReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EveningReflectionModal: React.FC<EveningReflectionModalProps> = ({ isOpen, onClose }) => {
  const { state, saveEveningReflection, t } = useFranklin();
  const existing = state.todayLog.eveningReflection;

  const [successes, setSuccesses] = useState(existing?.successes || '');
  const [obstacles, setObstacles] = useState(existing?.obstacles || '');
  const [lessonLearned, setLessonLearned] = useState(existing?.lessonLearned || '');
  const [tomorrowPrep, setTomorrowPrep] = useState(existing?.tomorrowPrep || '');
  const [savedToast, setSavedToast] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveEveningReflection({
      successes,
      obstacles,
      lessonLearned,
      tomorrowPrep,
      completedAt: new Date().toISOString(),
    });
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0e1118] border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 text-slate-900 dark:text-neutral-100 shadow-2xl overflow-y-auto max-h-[90vh] transition-colors duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors p-1 rounded-lg"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono font-bold mb-1">
            <BookOpen size={14} />
            <span>{t('eveningModalKicker')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('eveningModalTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 mt-1 leading-relaxed">
            {t('eveningModalDesc')}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5 font-mono">
              {t('evQ1')}
            </label>
            <textarea
              rows={2}
              value={successes}
              onChange={(e) => setSuccesses(e.target.value)}
              placeholder={t('evQ1Plh')}
              className="w-full bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-800 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5 font-mono">
              {t('evQ2')}
            </label>
            <textarea
              rows={2}
              value={obstacles}
              onChange={(e) => setObstacles(e.target.value)}
              placeholder={t('evQ2Plh')}
              className="w-full bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-800 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5 font-mono">
              {t('evQ3')}
            </label>
            <input
              type="text"
              value={lessonLearned}
              onChange={(e) => setLessonLearned(e.target.value)}
              placeholder={t('evQ3Plh')}
              className="w-full bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-800 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5 font-mono">
              {t('evQ4')}
            </label>
            <textarea
              rows={2}
              value={tomorrowPrep}
              onChange={(e) => setTomorrowPrep(e.target.value)}
              placeholder={t('evQ4Plh')}
              className="w-full bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-800 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="pt-3 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-neutral-500 font-mono">
              {existing ? t('savedTodayHint') : t('notYetLoggedHint')}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              >
                {t('cancelBtn')}
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 transition-colors shadow-xs"
              >
                {savedToast ? (
                  <>
                    <Check size={14} className="text-emerald-500 stroke-[3]" />
                    <span>{t('savedToast')}</span>
                  </>
                ) : (
                  <span>{t('saveReflectionBtn')}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
