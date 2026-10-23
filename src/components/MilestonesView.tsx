import React, { useState, useMemo } from 'react';
import { useFranklin } from '../context/FranklinContext';
import { MilestoneBadge, BadgeCategory, BadgeTier } from '../types/milestone';
import { BadgeUnlockModal } from './BadgeUnlockModal';
import {
  Trophy,
  Zap,
  Flame,
  ShieldCheck,
  Sparkles,
  Crown,
  CheckCircle2,
  Compass,
  Sun,
  Shield,
  Target,
  BookOpen,
  RotateCcw,
  Award,
  Lock,
  Check,
  ChevronRight,
  Filter,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  Flame,
  ShieldCheck,
  Sparkles,
  Crown,
  CheckCircle2,
  Compass,
  Trophy,
  Sun,
  Shield,
  Target,
  BookOpen,
  RotateCcw,
  Award,
};

export const MilestonesView: React.FC = () => {
  const { badges, milestoneStats, language, t, resetProgressOnly } = useFranklin();
  const isRu = language === 'ru';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'in_progress'>('all');
  const [previewBadge, setPreviewBadge] = useState<MilestoneBadge | null>(null);

  // Filtered badges
  const filteredBadges = useMemo(() => {
    return badges.filter((badge) => {
      // Category filter
      if (selectedCategory !== 'all' && badge.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter === 'unlocked' && !badge.unlocked) {
        return false;
      }
      if (statusFilter === 'in_progress' && badge.unlocked) {
        return false;
      }
      return true;
    });
  }, [badges, selectedCategory, statusFilter]);

  // Find the closest locked milestone
  const closestLockedBadge = useMemo(() => {
    const locked = badges.filter((b) => !b.unlocked);
    if (locked.length === 0) return null;
    return locked.reduce((closest, curr) => {
      const currPct = curr.currentValue / curr.targetValue;
      const closestPct = closest.currentValue / closest.targetValue;
      return currPct > closestPct ? curr : closest;
    }, locked[0]);
  }, [badges]);

  const getTierStyles = (tier: BadgeTier, unlocked: boolean) => {
    if (!unlocked) {
      return {
        cardBorder: 'border-slate-200 dark:border-neutral-800/80 hover:border-slate-300 dark:hover:border-neutral-700/80',
        bg: 'bg-white dark:bg-neutral-900/40 hover:bg-slate-50 dark:hover:bg-neutral-900/60',
        iconBg: 'bg-slate-100 dark:bg-neutral-800/80 text-slate-400 dark:text-neutral-500 border border-slate-200 dark:border-neutral-700/50',
        pill: 'bg-slate-100 dark:bg-neutral-800/80 text-slate-500 dark:text-neutral-400 border-slate-200 dark:border-neutral-700/50',
        tierName: tier.toUpperCase(),
        barColor: 'bg-slate-300 dark:bg-neutral-700',
        textColor: 'text-slate-500 dark:text-neutral-400',
      };
    }

    switch (tier) {
      case 'emerald':
        return {
          cardBorder: 'border-emerald-300 dark:border-emerald-500/50 hover:border-emerald-400 dark:hover:border-emerald-400/80 shadow-xs shadow-emerald-500/10',
          bg: 'bg-emerald-50/50 dark:bg-gradient-to-br dark:from-emerald-950/30 dark:via-neutral-900/70 dark:to-neutral-950/90',
          iconBg: 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xs border-emerald-400/50',
          pill: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40',
          tierName: isRu ? 'Изумруд' : 'Emerald',
          barColor: 'bg-gradient-to-r from-emerald-500 to-teal-400',
          textColor: 'text-emerald-700 dark:text-emerald-300',
        };
      case 'diamond':
        return {
          cardBorder: 'border-cyan-300 dark:border-cyan-500/50 hover:border-cyan-400 dark:hover:border-cyan-400/80 shadow-xs shadow-cyan-500/10',
          bg: 'bg-cyan-50/50 dark:bg-gradient-to-br dark:from-cyan-950/30 dark:via-neutral-900/70 dark:to-neutral-950/90',
          iconBg: 'bg-gradient-to-tr from-cyan-500 to-blue-400 text-white shadow-xs border-cyan-400/50',
          pill: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/40',
          tierName: isRu ? 'Алмаз' : 'Diamond',
          barColor: 'bg-gradient-to-r from-cyan-400 to-blue-500',
          textColor: 'text-cyan-700 dark:text-cyan-300',
        };
      case 'gold':
        return {
          cardBorder: 'border-amber-300 dark:border-amber-500/50 hover:border-amber-400 dark:hover:border-amber-400/80 shadow-xs shadow-amber-500/10',
          bg: 'bg-amber-50/50 dark:bg-gradient-to-br dark:from-amber-950/30 dark:via-neutral-900/70 dark:to-neutral-950/90',
          iconBg: 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-neutral-950 shadow-xs border-amber-400/50',
          pill: 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/40',
          tierName: isRu ? 'Золото' : 'Gold',
          barColor: 'bg-gradient-to-r from-amber-400 to-yellow-400',
          textColor: 'text-amber-700 dark:text-amber-300',
        };
      case 'silver':
        return {
          cardBorder: 'border-slate-300 dark:border-slate-400/40 hover:border-slate-400 dark:hover:border-slate-300/70 shadow-xs',
          bg: 'bg-slate-100/60 dark:bg-gradient-to-br dark:from-slate-900/40 dark:via-neutral-900/70 dark:to-neutral-950/90',
          iconBg: 'bg-gradient-to-tr from-slate-400 to-slate-200 text-neutral-900 shadow-xs border-slate-300/40',
          pill: 'bg-slate-200/80 dark:bg-slate-400/20 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-300/30',
          tierName: isRu ? 'Серебро' : 'Silver',
          barColor: 'bg-gradient-to-r from-slate-400 to-slate-200',
          textColor: 'text-slate-700 dark:text-slate-200',
        };
      case 'bronze':
      default:
        return {
          cardBorder: 'border-orange-300 dark:border-orange-500/40 hover:border-orange-400 dark:hover:border-orange-400/70 shadow-xs',
          bg: 'bg-orange-50/50 dark:bg-gradient-to-br dark:from-orange-950/30 dark:via-neutral-900/70 dark:to-neutral-950/90',
          iconBg: 'bg-gradient-to-tr from-orange-500 to-amber-600 text-white shadow-xs border-orange-400/40',
          pill: 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-500/30',
          tierName: isRu ? 'Бронза' : 'Bronze',
          barColor: 'bg-gradient-to-r from-orange-500 to-amber-500',
          textColor: 'text-orange-700 dark:text-orange-300',
        };
    }
  };

  const getCategoryLabel = (category: BadgeCategory) => {
    switch (category) {
      case 'green_mode':
        return t('filterGreenMode');
      case 'habit_streak':
        return t('filterHabitStreaks');
      case 'resilience':
        return isRu ? 'Стойкость' : 'Resilience';
      case 'mastery':
      default:
        return t('filterMastery');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16 w-full max-w-full min-w-0 overflow-x-clip">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO HEADER & KEY STATS CARDS
          ───────────────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#11131c] dark:to-[#0a0b10] border border-slate-200/90 dark:border-neutral-800/90 p-5 sm:p-7 shadow-xs overflow-hidden transition-colors duration-200">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-60 h-60 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2">
              <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{t('milestonesTitle')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t('milestonesTab')}
            </h1>
            <p className="text-slate-600 dark:text-neutral-400 text-sm mt-1 max-w-xl leading-relaxed">
              {t('milestonesSubtitle')}
            </p>
          </div>

          {/* Quick Progress Ring / Counter + Reset Progress Button */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={resetProgressOnly}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-neutral-800/80 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-700 dark:text-neutral-300 dark:hover:text-rose-300 border border-slate-200 hover:border-rose-200 dark:border-neutral-700 dark:hover:border-rose-500/40 text-xs font-semibold transition-colors"
              title={isRu ? 'Обнулить прогресс целей, привычек и достижений для тестирования' : 'Reset all progress and achievements for testing'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isRu ? 'Сбросить прогресс' : 'Reset Progress'}</span>
            </button>

            <div className="flex items-center gap-4 bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 p-3 sm:p-4 rounded-2xl">
              <div className="relative w-14 h-14 rounded-full flex items-center justify-center bg-white dark:bg-neutral-950 border-2 border-emerald-500/40 shadow-xs">
                <span className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {milestoneStats.overallProgressPercent}%
                </span>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">
                  {t('unlockedBadges')}
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                    {milestoneStats.unlockedBadgesCount}
                  </span>{' '}
                  <span className="text-slate-400 dark:text-neutral-500 font-normal">
                    / {milestoneStats.totalBadgesCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Overview Mini-Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-200/80 dark:border-neutral-800/80">
          {/* Card 1: Green Day Streak */}
          <div className="bg-slate-50/80 dark:bg-[#0e1017] border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-500/30">
              <Flame className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-semibold truncate">
                {t('activeGreenStreak')}
              </div>
              <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span>{milestoneStats.currentGreenStreak}</span>
                <span className="text-xs text-slate-500 dark:text-neutral-400 font-normal">
                  {isRu ? 'дн. подряд' : 'days streak'}
                </span>
                {milestoneStats.longestGreenStreak > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono ml-auto">
                    {isRu ? 'Рекорд:' : 'Max:'} {milestoneStats.longestGreenStreak}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Habit Top Streak */}
          <div className="bg-slate-50/80 dark:bg-[#0e1017] border border-amber-200 dark:border-amber-500/30 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-semibold truncate">
                {t('activeHabitStreak')}
              </div>
              <div className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <span>{milestoneStats.maxActiveHabitStreak}</span>
                <span className="text-xs text-slate-500 dark:text-neutral-400 font-normal">
                  {isRu ? 'дн.' : 'days'}
                </span>
                {milestoneStats.longestHistoricHabitStreak > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono ml-auto">
                    {isRu ? 'Рекорд:' : 'Max:'} {milestoneStats.longestHistoricHabitStreak}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: 100% Zenith Days */}
          <div className="bg-slate-50/80 dark:bg-[#0e1017] border border-cyan-200 dark:border-cyan-500/30 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-200 dark:border-cyan-500/30">
              <Sun className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-semibold truncate">
                {isRu ? 'Идеальные дни (100%)' : '100% Zenith Days'}
              </div>
              <div className="text-base sm:text-lg font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                <span>{milestoneStats.allHabitsDoneDaysCount}</span>
                <span className="text-xs text-slate-500 dark:text-neutral-400 font-normal">
                  {isRu ? 'дней' : 'days'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-mono ml-auto">
                  {milestoneStats.microResilienceCount} {isRu ? 'микро' : 'micro'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Closest Milestone */}
          <div className="bg-slate-50/80 dark:bg-[#0e1017] border border-slate-200 dark:border-neutral-800 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-amber-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-semibold truncate">
                {t('closestMilestone')}
              </div>
              {closestLockedBadge ? (
                <div className="truncate text-xs font-semibold text-slate-900 dark:text-white flex items-center justify-between gap-1">
                  <span className="truncate">
                    {isRu ? closestLockedBadge.titleRu : closestLockedBadge.title}
                  </span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold shrink-0">
                    {closestLockedBadge.currentValue}/{closestLockedBadge.targetValue}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  {isRu ? 'Все значки открыты!' : 'All unlocked!'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. FILTERS AND CATEGORIES BAR
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#0d0e15] border border-slate-200/90 dark:border-neutral-800/80 p-2 sm:p-3 rounded-2xl shadow-xs transition-colors duration-200">
        {/* Category Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {[
            { id: 'all', label: t('filterAllBadges') },
            { id: 'green_mode', label: t('filterGreenMode') },
            { id: 'habit_streak', label: t('filterHabitStreaks') },
            { id: 'mastery', label: t('filterMastery') },
            { id: 'resilience', label: isRu ? 'Стойкость' : 'Resilience' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 dark:bg-neutral-800 text-white shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-900/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 self-end sm:self-auto shrink-0 bg-slate-100 dark:bg-neutral-900/90 border border-slate-200 dark:border-neutral-800 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('filterAllBadges')}
          </button>
          <button
            onClick={() => setStatusFilter('unlocked')}
            className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
              statusFilter === 'unlocked'
                ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/30'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('filterUnlocked')}
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
              statusFilter === 'in_progress'
                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('filterLocked')}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. BADGES GRID
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredBadges.map((badge) => {
          const IconComponent = ICON_MAP[badge.iconName] || Trophy;
          const tier = getTierStyles(badge.tier, badge.unlocked);
          const title = isRu ? badge.titleRu : badge.title;
          const description = isRu ? badge.descriptionRu : badge.description;
          const quote = isRu ? badge.quoteRu : badge.quote;
          const unit = isRu ? badge.unitRu : badge.unit;
          const progressPercent = Math.min(
            100,
            Math.round((badge.currentValue / badge.targetValue) * 100)
          );

          return (
            <div
              key={badge.id}
              onClick={() => setPreviewBadge(badge)}
              className={`group relative rounded-2xl border ${tier.cardBorder} ${tier.bg} p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-xs`}
            >
              <div>
                {/* Top Row: Category & Tier Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400">
                    {getCategoryLabel(badge.category)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${tier.pill}`}
                    >
                      {tier.tierName}
                    </span>
                    {badge.unlocked ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700/60 flex items-center justify-center text-slate-500 dark:text-neutral-400">
                        <Lock className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Card Content: Icon and Text */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl ${tier.iconBg} flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105`}
                  >
                    <IconComponent className="w-7 h-7 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                      {title}
                    </h3>
                    <p className="text-slate-600 dark:text-neutral-400 text-xs mt-1 leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>

                {/* Franklin Quote Snippet */}
                <div className="mt-3.5 pt-3 border-t border-slate-200/80 dark:border-neutral-800/80 text-[11px] text-slate-600 dark:text-neutral-400 italic font-serif">
                  «{quote}»
                </div>
              </div>

              {/* Bottom Progress Bar & Requirement */}
              <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-neutral-800/60">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 dark:text-neutral-400 text-[11px]">
                    {badge.unlocked ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                        {t('badgeUnlockedOn')}{' '}
                        {badge.unlockedAt
                          ? new Date(badge.unlockedAt).toLocaleDateString(
                              isRu ? 'ru-RU' : 'en-US',
                              { month: 'short', day: 'numeric' }
                            )
                          : isRu ? 'Ранее' : 'Earned'}
                      </span>
                    ) : (
                      <span>
                        {t('progressLabel')}:{' '}
                        <strong className="text-slate-800 dark:text-neutral-200 font-mono">
                          {badge.currentValue}/{badge.targetValue} {unit}
                        </strong>
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-neutral-300">
                    {progressPercent}%
                  </span>
                </div>

                <div className="w-full h-1.5 bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${tier.barColor} transition-all duration-500`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Preview Modal */}
      {previewBadge && (
        <BadgeUnlockModal
          badge={previewBadge}
          onClose={() => setPreviewBadge(null)}
          onViewAllMilestones={() => setPreviewBadge(null)}
        />
      )}
    </div>
  );
};
