import React, { useState, useEffect } from 'react';
import { GoalItem, LifeDirectionId } from '../types/franklin';
import { LIFE_DIRECTIONS } from '../config/franklinDefaults';
import { useFranklin } from '../context/FranklinContext';
import {
  X,
  Target,
  Trash2,
  Check,
  Sparkles,
} from 'lucide-react';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: GoalItem | null;
}

const GOAL_TEMPLATES = [
  {
    title: 'Войти в новую компанию как Affiliate Manager: понять систему и создать труднозаменимую ценность',
    directionId: 'career' as LifeDirectionId,
    horizon: 'quarterly' as const,
    metric: '1-я неделя: изучить продукт, KPI, GEO и процессы → далее сильный hunting, аналитика и запуск партнёров с нуля',
    whyItMatters: 'Сначала понять систему и стать самым надёжным, затем создавать ценность, которую трудно заменить.',
    progressPercent: 25,
  },
  {
    title: 'Стабилизировать каркас сна (23:30–08:00), набрать мышечную массу и увеличить силу',
    directionId: 'health' as LifeDirectionId,
    horizon: '1-year' as const,
    metric: '8,5 ч в постели (23:30–08:00), тренировки / бокс 2–3 раза в неделю (Ср, Сб) и утренний запуск в 08:00',
    whyItMatters: 'Сон и физическая форма — фундамент цепочки: определяют энергию, самообладание и продуктивность.',
    progressPercent: 40,
  },
  {
    title: '90 дней системного английского без ранней оценки и сборка личной книги «Franklin 2.0 — Manual»',
    directionId: 'learning' as LifeDirectionId,
    horizon: 'quarterly' as const,
    metric: 'Английский 3–4 раза в неделю (Вт, Чт, Сб, Вс) + внедрить минимум 5 идей из «Атомных привычек» по формуле 3 строк',
    whyItMatters: 'Не оценивать дерево, пока оно растёт. Превращать прочитанные главы в конкретные правила своей системы.',
    progressPercent: 35,
  },
  {
    title: 'Формировать капитал: откладывать минимум 10% дохода и тратить меньше, чем зарабатываешь',
    directionId: 'finances' as LifeDirectionId,
    horizon: '1-year' as const,
    metric: 'Заработал → сразу отложил ≥10% → распределил остальное → инвестировал без роста расходов',
    whyItMatters: 'Простая и устойчивая финансовая система постепенно создаёт капитал и свободу выбора.',
    progressPercent: 55,
  },
  {
    title: 'Укреплять доверие к себе через правило «Сказал → сделал» и внутреннее самообладание',
    directionId: 'confidence' as LifeDirectionId,
    horizon: 'quarterly' as const,
    metric: 'Ежедневные доказательства надёжности; мнение других воспринимать как информацию, а не приговор',
    whyItMatters: 'Уверенность строится доказательствами того, что я выполняю обещания себе и действую вместо жалоб.',
    progressPercent: 60,
  },
  {
    title: 'Обустроить дом и рабочее пространство после переезда, защитив границу работы и жизни (18:00)',
    directionId: 'personal' as LifeDirectionId,
    horizon: 'monthly' as const,
    metric: 'Постоянное рабочее место без лишнего, закрытие ноутбука в 18:00, субботний быт и отдых без вины',
    whyItMatters: 'После 18:00 работа не должна превращаться во второй рабочий день. Дом и отдых дают устойчивость.',
    progressPercent: 45,
  },
];

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  goalToEdit,
}) => {
  const { addGoal, updateGoal, deleteGoal, language } = useFranklin();
  const isRu = language === 'ru';

  const [title, setTitle] = useState('');
  const [directionId, setDirectionId] = useState<LifeDirectionId>('career');
  const [horizon, setHorizon] = useState<'1-year' | 'quarterly' | 'monthly'>('quarterly');
  const [metric, setMetric] = useState('');
  const [whyItMatters, setWhyItMatters] = useState('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (goalToEdit) {
      setTitle(goalToEdit.title || '');
      setDirectionId(goalToEdit.directionId || 'career');
      setHorizon(goalToEdit.horizon || 'quarterly');
      setMetric(goalToEdit.metric || '');
      setWhyItMatters(goalToEdit.whyItMatters || '');
      setProgressPercent(goalToEdit.progressPercent ?? 0);
      setShowDeleteConfirm(false);
    } else {
      setTitle('');
      setDirectionId('career');
      setHorizon('quarterly');
      setMetric('');
      setWhyItMatters('');
      setProgressPercent(0);
      setShowDeleteConfirm(false);
    }
  }, [goalToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (goalToEdit) {
      updateGoal(goalToEdit.id, {
        title: title.trim(),
        directionId,
        horizon,
        metric: metric.trim(),
        whyItMatters: whyItMatters.trim(),
        progressPercent: Math.min(100, Math.max(0, Number(progressPercent) || 0)),
      });
    } else {
      addGoal({
        title: title.trim(),
        directionId,
        horizon,
        metric: metric.trim(),
        whyItMatters: whyItMatters.trim() || (isRu ? 'Поддерживает стратегический приоритет' : 'Supports strategic focus'),
        progressPercent: Math.min(100, Math.max(0, Number(progressPercent) || 0)),
        active: true,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (goalToEdit) {
      deleteGoal(goalToEdit.id);
      onClose();
    }
  };

  const applyTemplate = (tpl: (typeof GOAL_TEMPLATES)[0]) => {
    setTitle(tpl.title);
    setDirectionId(tpl.directionId);
    setHorizon(tpl.horizon);
    setMetric(tpl.metric);
    setWhyItMatters(tpl.whyItMatters);
    setProgressPercent(tpl.progressPercent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0e1118] border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-7 shadow-2xl my-8 text-slate-900 dark:text-neutral-100 transition-colors duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800/80 transition-colors"
          title={isRu ? 'Закрыть' : 'Close'}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-200 dark:border-neutral-800">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Target size={20} />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
              {isRu ? 'Уровень 05 · Стратегические ориентиры' : 'Level 05 · Strategic Horizon'}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {goalToEdit
                ? isRu
                  ? 'Редактировать стратегическую цель'
                  : 'Edit Strategic Goal'
                : isRu
                ? 'Новая стратегическая цель'
                : 'New Strategic Goal'}
            </h2>
          </div>
        </div>

        {/* Quick Template Chips (only if creating new) */}
        {!goalToEdit && (
          <div className="mb-5 p-3 rounded-xl bg-slate-50 dark:bg-[#141824]/60 border border-slate-200 dark:border-neutral-800/80">
            <div className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 mb-2 flex items-center gap-1.5 font-semibold">
              <Sparkles size={12} className="text-amber-500" />
              <span>{isRu ? 'Шаблоны целей из вашего паспорта Franklin 2.0:' : 'Quick Franklin Templates:'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {GOAL_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 dark:bg-neutral-800/70 dark:hover:bg-neutral-800 text-[11px] text-slate-700 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white border border-slate-200 dark:border-neutral-700/60 transition-colors text-left shadow-2xs"
                >
                  {tpl.directionId === 'health' && '🏋️ '}
                  {tpl.directionId === 'career' && '💼 '}
                  {tpl.directionId === 'finances' && '💰 '}
                  {tpl.directionId === 'learning' && '📚 '}
                  {tpl.directionId === 'confidence' && '🛡️ '}
                  {tpl.directionId === 'personal' && '🏠 '}
                  {tpl.title.slice(0, 36)}...
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
              {isRu ? 'Название цели (конкретный результат) *' : 'Goal Title (Concrete Outcome) *'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                isRu
                  ? 'например: Войти в новую компанию как Affiliate Manager и понять систему'
                  : 'e.g., Master Affiliate Manager role & LATAM funnels'
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-700 focus:border-amber-500 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Direction & Horizon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                {isRu ? 'Сфера жизни' : 'Life Direction'}
              </label>
              <select
                value={directionId}
                onChange={(e) => setDirectionId(e.target.value as LifeDirectionId)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-700 focus:border-amber-500 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
              >
                {LIFE_DIRECTIONS.map((dir) => (
                  <option key={dir.id} value={dir.id}>
                    {isRu ? dir.nameRu : dir.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                {isRu ? 'Горизонт планирования' : 'Time Horizon'}
              </label>
              <select
                value={horizon}
                onChange={(e) => setHorizon(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-700 focus:border-amber-500 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="1-year">{isRu ? 'Годовая цель (1 год)' : '1-Year Horizon'}</option>
                <option value="quarterly">{isRu ? 'Квартальная цель (90 дней)' : 'Quarterly Horizon'}</option>
                <option value="monthly">{isRu ? 'Месячная цель (1 месяц)' : 'Monthly Horizon'}</option>
              </select>
            </div>
          </div>

          {/* Target Metric */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
              {isRu ? 'Измеримый целевой показатель (Метрика)' : 'Target Metric / Key Result'}
            </label>
            <input
              type="text"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              placeholder={
                isRu
                  ? 'например: 8,5 ч сна (23:30–08:00) и тренировки 2–3 раза в неделю'
                  : 'e.g., 30 active partners, €150k monthly GGR'
              }
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-700 focus:border-amber-500 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none"
            />
          </div>

          {/* Why It Matters */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
              {isRu ? 'Зачем это нужно? (Связь с причинно-следственной цепочкой)' : 'Why It Matters (Strategy Link)'}
            </label>
            <textarea
              rows={2}
              value={whyItMatters}
              onChange={(e) => setWhyItMatters(e.target.value)}
              placeholder={
                isRu
                  ? 'например: Создаёт труднозаменимую профессиональную ценность и спокойный фундамент.'
                  : 'e.g., Creates irreplaceable professional leverage.'
              }
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-700 focus:border-amber-500 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none resize-none"
            />
          </div>

          {/* Progress Percent Slider */}
          <div className="pt-2 pb-1">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-neutral-300">
                {isRu ? 'Текущий прогресс выполнения:' : 'Current Progress:'}
              </span>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold text-sm">
                {progressPercent}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progressPercent}
                onChange={(e) => setProgressPercent(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setProgressPercent((p) => Math.max(0, p - 5))}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[11px] text-slate-700 dark:text-neutral-300 font-mono"
                >
                  -5%
                </button>
                <button
                  type="button"
                  onClick={() => setProgressPercent((p) => Math.min(100, p + 5))}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[11px] text-slate-700 dark:text-neutral-300 font-mono"
                >
                  +5%
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-neutral-800">
            {goalToEdit ? (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">{isRu ? 'Удалить?' : 'Delete?'}</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white transition-colors"
                  >
                    {isRu ? 'Да, удалить' : 'Confirm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-neutral-800 text-xs text-slate-700 dark:text-neutral-300"
                  >
                    {isRu ? 'Отмена' : 'Cancel'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors w-full sm:w-auto justify-center"
                >
                  <Trash2 size={14} />
                  <span>{isRu ? 'Удалить цель' : 'Delete Goal'}</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-800 text-xs font-semibold text-slate-700 dark:text-neutral-300 transition-colors"
              >
                {isRu ? 'Отмена' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
              >
                <Check size={14} />
                <span>{goalToEdit ? (isRu ? 'Сохранить изменения' : 'Save Changes') : (isRu ? 'Создать цель' : 'Create Goal')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
