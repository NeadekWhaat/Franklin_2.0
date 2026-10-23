import React, { useState, useMemo } from 'react';
import { useFranklin } from '../context/FranklinContext';
import { LIFE_DIRECTIONS } from '../config/franklinDefaults';
import { HabitDayStatus, HabitItem, LifeDirectionId } from '../types/franklin';
import {
  Check,
  Zap,
  Moon,
  X,
  Sparkles,
  TrendingUp,
  BarChart3,
  Calendar,
  Flame,
  Plus,
  HelpCircle,
  Activity,
  CheckCircle2,
  Minus,
  Trash2,
  Filter,
  Award,
  ShieldCheck,
  ArrowRight,
  PieChart,
  LayoutGrid,
  CalendarDays,
  Trophy,
} from 'lucide-react';
import { MilestonesView } from './MilestonesView';

export const HabitTrackerMatrix: React.FC = () => {
  const {
    state,
    cycleHabitStatus,
    setHabitStatusForDate,
    addHabit,
    deleteHabit,
    language,
    t,
    milestoneStats,
  } = useFranklin();

  const currentWeek = state.currentWeek;
  const habits = state.habits;
  const records = state.habitWeeklyRecords || {};
  const todayStr = state.todayLog.date;

  const [showMilestonesModal, setShowMilestonesModal] = useState(false);

  // View mode: 'matrix' (full 7-day table) or 'day' (mobile/tablet focused day checklist)
  const [viewMode, setViewMode] = useState<'matrix' | 'day'>('matrix');
  const [selectedDayDate, setSelectedDayDate] = useState<string>(todayStr);

  // Filtering state
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [weeklyFocusOnly, setWeeklyFocusOnly] = useState(false);

  // New habit form modal/inline
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDirection, setNewDirection] = useState<LifeDirectionId>('health');
  const [newTrigger, setNewTrigger] = useState('');
  const [newMicro, setNewMicro] = useState('');

  // Context menu / quick status popover for a cell
  const [activeCellMenu, setActiveCellMenu] = useState<{ dateStr: string; habitId: string } | null>(null);

  // Active chart tooltip state for touch/click on mobile or hover on desktop
  const [activeTooltipDay, setActiveTooltipDay] = useState<string | null>(null);

  // Calculate the 7 dates of the week starting from currentWeek.startDate (Monday)
  const weekDays = useMemo(() => {
    const days: { dateStr: string; dayIndex: number; dayNameRu: string; dayNameEn: string; dayNum: number; isPast: boolean }[] = [];
    const namesRu = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const namesEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const start = new Date(currentWeek.startDate);
    const today = new Date(todayStr);

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const isPast = new Date(dateStr) < today;

      days.push({
        dateStr,
        dayIndex: i,
        dayNameRu: namesRu[i],
        dayNameEn: namesEn[i],
        dayNum: d.getDate(),
        isPast,
      });
    }
    return days;
  }, [currentWeek.startDate, todayStr]);

  // Direction helper
  const getDirection = (id: LifeDirectionId) => {
    const dir = LIFE_DIRECTIONS.find((d) => d.id === id) || LIFE_DIRECTIONS[0];
    return {
      ...dir,
      displayName: language === 'ru' ? dir.nameRu : dir.name,
    };
  };

  // Filtered habits
  const filteredHabits = useMemo(() => {
    return habits.filter((h) => {
      if (weeklyFocusOnly && h.id !== currentWeek.primaryHabitId) return false;
      if (directionFilter !== 'all' && h.directionId !== directionFilter) return false;
      return true;
    });
  }, [habits, weeklyFocusOnly, directionFilter, currentWeek.primaryHabitId]);

  // Calculate Streak for a habit
  const calculateStreak = (habitId: string) => {
    let currentStreak = 0;
    const sortedDays = [...weekDays].sort((a, b) => b.dayIndex - a.dayIndex);
    const todayIndex = weekDays.findIndex((d) => d.dateStr === todayStr);

    const todayStatus = records[todayStr]?.[habitId] || 'none';
    const isTodayDone = todayStatus === 'done' || todayStatus === 'micro';

    let startIndex = todayIndex !== -1 ? todayIndex : sortedDays.length - 1;
    if (!isTodayDone && startIndex > 0) {
      startIndex = startIndex - 1;
    }

    for (let i = startIndex; i >= 0; i--) {
      const d = weekDays[i];
      const st = records[d.dateStr]?.[habitId] || 'none';
      if (st === 'done' || st === 'micro' || st === 'rest') {
        currentStreak++;
      } else {
        break;
      }
    }

    let bestStreak = 0;
    let tempStreak = 0;
    for (const d of weekDays) {
      const st = records[d.dateStr]?.[habitId] || 'none';
      if (st === 'done' || st === 'micro' || st === 'rest') {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    return { currentStreak, bestStreak: Math.max(bestStreak, currentStreak) };
  };

  // Status Cell Icon Helper
  const renderStatusCell = (status: HabitDayStatus, isPast: boolean) => {
    switch (status) {
      case 'done':
        return (
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/70 text-emerald-400 flex items-center justify-center transition-all transform active:scale-90 hover:brightness-125 shadow-sm shadow-emerald-950"
            title={language === 'ru' ? 'Выполнено полностью' : 'Fully completed'}
          >
            <Check size={16} strokeWidth={2.5} />
          </div>
        );
      case 'micro':
        return (
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500/20 border border-amber-500/70 text-amber-400 flex items-center justify-center transition-all transform active:scale-90 hover:brightness-125 shadow-sm shadow-amber-950"
            title={language === 'ru' ? 'Микро-шаг (сохранил непрерывность)' : 'Micro-step executed (saved momentum)'}
          >
            <Zap size={14} fill="currentColor" />
          </div>
        );
      case 'rest':
        return (
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-100 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700/80 text-slate-500 dark:text-neutral-400 flex items-center justify-center transition-all transform active:scale-90 hover:border-slate-300 dark:hover:border-neutral-600"
            title={language === 'ru' ? 'Запланированный отдых' : 'Planned rest day'}
          >
            <Moon size={13} />
          </div>
        );
      case 'missed':
        return (
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 text-rose-500 dark:text-rose-400/80 flex items-center justify-center transition-all transform active:scale-90 hover:border-rose-300 dark:hover:border-rose-700"
            title={language === 'ru' ? 'Пропущено' : 'Missed'}
          >
            <X size={13} strokeWidth={2.5} />
          </div>
        );
      case 'none':
      default:
        return (
          <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center transition-all transform active:scale-90 ${
              isPast
                ? 'bg-slate-100/70 dark:bg-[#10141f] border-slate-200 dark:border-neutral-800/80 text-slate-400 dark:text-neutral-600 hover:border-slate-300 dark:hover:border-neutral-700'
                : 'bg-slate-50 dark:bg-[#141824] border-slate-200 dark:border-neutral-800/80 text-slate-400 dark:text-neutral-600 hover:border-slate-300 dark:hover:border-neutral-700 hover:text-slate-600 dark:hover:text-neutral-400'
            }`}
            title={language === 'ru' ? 'Кликните для выбора статуса' : 'Click to cycle status'}
          >
            <Minus size={13} className="opacity-40" />
          </div>
        );
    }
  };

  // Analytics Calculations
  const analytics = useMemo(() => {
    let totalScheduledSlots = 0;
    let totalCompletedSlots = 0;
    let microSavesCount = 0;

    const dailyStats = weekDays.map((day) => {
      let count = 0;
      let total = 0;
      let microCount = 0;

      habits.forEach((h) => {
        total++;
        const st = records[day.dateStr]?.[h.id] || 'none';
        if (st === 'done' || st === 'micro') {
          count++;
          if (st === 'micro') microCount++;
        }
      });

      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      totalScheduledSlots += total;
      totalCompletedSlots += count;
      microSavesCount += microCount;

      let dayType: 'ideal' | 'solid' | 'dip' = 'dip';
      if (pct >= 80) dayType = 'ideal';
      else if (pct >= 50) dayType = 'solid';

      return {
        dateStr: day.dateStr,
        dayName: language === 'ru' ? day.dayNameRu : day.dayNameEn,
        dayNum: day.dayNum,
        completed: count,
        microCount,
        total,
        pct,
        dayType,
        isPast: day.isPast,
      };
    });

    const weeklyAvgPct =
      totalScheduledSlots > 0 ? Math.round((totalCompletedSlots / totalScheduledSlots) * 100) : 0;
    const idealDaysCount = dailyStats.filter((d) => d.pct >= 80).length;

    // Habit by habit stats with streaks
    const habitStats = habits.map((h) => {
      let doneCount = 0;
      let microCount = 0;

      weekDays.forEach((d) => {
        const st = records[d.dateStr]?.[h.id] || 'none';
        if (st === 'done') doneCount++;
        else if (st === 'micro') {
          doneCount++;
          microCount++;
        }
      });

      const pct = Math.round((doneCount / 7) * 100);
      const { currentStreak, bestStreak } = calculateStreak(h.id);

      return {
        habit: h,
        doneCount,
        microCount,
        pct,
        currentStreak,
        bestStreak,
      };
    });

    // Life direction balance
    const directionMap: Record<string, { total: number; done: number; nameRu: string; nameEn: string }> = {};
    LIFE_DIRECTIONS.forEach((dir) => {
      directionMap[dir.id] = { total: 0, done: 0, nameRu: dir.nameRu, nameEn: dir.name };
    });

    habits.forEach((h) => {
      if (directionMap[h.directionId]) {
        weekDays.forEach((d) => {
          directionMap[h.directionId].total += 1;
          const st = records[d.dateStr]?.[h.id] || 'none';
          if (st === 'done' || st === 'micro') {
            directionMap[h.directionId].done += 1;
          }
        });
      }
    });

    const directionStats = Object.entries(directionMap)
      .map(([id, data]) => {
        const pct = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
        return {
          id,
          name: language === 'ru' ? data.nameRu : data.nameEn,
          total: data.total,
          done: data.done,
          pct,
        };
      })
      .filter((d) => d.total > 0);

    return {
      dailyStats,
      weeklyAvgPct,
      idealDaysCount,
      microSavesCount,
      habitStats,
      directionStats,
    };
  }, [weekDays, habits, records, language]);

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addHabit({
      title: newTitle.trim(),
      directionId: newDirection,
      tier: 'base',
      frequency: 'daily',
      anchorTrigger: newTrigger || (language === 'ru' ? 'Ежедневный триггер' : 'Daily anchor trigger'),
      microVersion: newMicro || (language === 'ru' ? '2-минутный микро-шаг' : '2-minute micro action'),
      active: true,
    });
    setNewTitle('');
    setNewTrigger('');
    setNewMicro('');
    setShowAddHabit(false);
  };

  const handleMarkAllToday = () => {
    habits.forEach((h) => {
      const current = records[todayStr]?.[h.id] || 'none';
      if (current === 'none') {
        setHabitStatusForDate(todayStr, h.id, 'done');
      }
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16 w-full max-w-full min-w-0 overflow-x-clip">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HEADER & KPI CARDS
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-4 sm:p-6 shadow-xs transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-neutral-800/60">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5 font-bold">
              <Sparkles size={12} className="text-amber-500" />
              <span>{language === 'ru' ? 'Уровень 07 · Привычки и регулярность' : 'Level 07 · Habits & Consistency'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              {t('habitMatrixTitle')}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-neutral-400 font-mono px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800">
              {t('weekLabel')} {currentWeek.weekNumber} · {currentWeek.startDate} — {currentWeek.endDate}
            </span>
            <button
              onClick={handleMarkAllToday}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 size={13} />
              <span>{t('markAllTodayDone')}</span>
            </button>
            <button
              onClick={() => setShowMilestonesModal(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 flex items-center gap-1.5 transition-colors"
              title={t('milestonesTab')}
            >
              <Trophy size={13} className="text-amber-500" />
              <span>{t('milestonesShort')}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200/80 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold">
                {milestoneStats.unlockedBadgesCount}/{milestoneStats.totalBadgesCount}
              </span>
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 mt-3 leading-relaxed">
          {t('habitMatrixSubtitle')}
        </p>

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mt-5">
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 relative overflow-hidden group">
            <div className="text-[10px] sm:text-[11px] font-mono uppercase text-slate-500 dark:text-neutral-400 flex items-center gap-1 font-bold">
              <TrendingUp size={11} className="text-emerald-500" />
              <span>{t('weeklyAverage')}</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 flex items-baseline gap-1">
              <span>{analytics.weeklyAvgPct}%</span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-500 font-normal">
                {analytics.weeklyAvgPct >= 80 ? (language === 'ru' ? 'отлично' : 'great') : (language === 'ru' ? 'база' : 'base')}
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-neutral-500 mt-0.5">
              {language === 'ru' ? 'Выполнение всей недели' : 'Entire week completed'}
            </div>
            <div
              className={`absolute bottom-0 left-0 h-0.5 transition-all ${
                analytics.weeklyAvgPct >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${analytics.weeklyAvgPct}%` }}
            />
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 relative overflow-hidden group">
            <div className="text-[10px] sm:text-[11px] font-mono uppercase text-slate-500 dark:text-neutral-400 flex items-center gap-1 font-bold">
              <Award size={11} className="text-amber-500" />
              <span>{t('idealDays')}</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 flex items-baseline gap-1">
              <span>{analytics.idealDaysCount}</span>
              <span className="text-xs text-slate-500 dark:text-neutral-500 font-normal">/ 7 {language === 'ru' ? 'дн.' : 'days'}</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-neutral-500 mt-0.5">
              {language === 'ru' ? 'Дней с выполнением ≥80%' : 'Days with ≥80% completed'}
            </div>
            <div
              className="absolute bottom-0 left-0 h-0.5 bg-amber-500 transition-all"
              style={{ width: `${Math.round((analytics.idealDaysCount / 7) * 100)}%` }}
            />
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 relative overflow-hidden group">
            <div className="text-[10px] sm:text-[11px] font-mono uppercase text-slate-500 dark:text-neutral-400 flex items-center gap-1 font-bold">
              <Zap size={11} className="text-amber-500" />
              <span>{t('microSavesTitle')}</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-700 dark:text-amber-300 mt-1 flex items-baseline gap-1">
              <span>{analytics.microSavesCount}</span>
              <span className="text-xs text-slate-500 dark:text-neutral-500 font-normal">{language === 'ru' ? 'раз' : 'times'}</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-neutral-500 mt-0.5">
              {language === 'ru' ? 'Микро-шаги спасли серию' : 'Micro-steps kept continuity'}
            </div>
            <div className="absolute bottom-0 left-0 h-0.5 bg-amber-400 w-full opacity-40" />
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 relative overflow-hidden group">
            <div className="text-[10px] sm:text-[11px] font-mono uppercase text-slate-500 dark:text-neutral-400 flex items-center gap-1 font-bold">
              <Sparkles size={11} className="text-amber-500" />
              <span>{t('weeklyHabitTitle')}</span>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate">
              {habits.find((h) => h.id === currentWeek.primaryHabitId)?.title || habits[0]?.title}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-neutral-500 mt-0.5">
              {language === 'ru' ? '#1 Главный рычаг недели' : '#1 Weekly Leverage'}
            </div>
            <div className="absolute bottom-0 left-0 h-0.5 bg-amber-400 w-full" />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. CONTROLS, VIEW MODE SWITCHER & LEGEND BAR
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#141824] border border-slate-200/90 dark:border-neutral-800 flex flex-col xl:flex-row flex-wrap items-start xl:items-center justify-between gap-3.5 sm:gap-4 text-xs shadow-xs transition-colors duration-200">
        {/* View Mode Toggle: Matrix vs Day Focus for Mobile/Tablet */}
        <div className="flex items-center gap-2 w-full xl:w-auto justify-between xl:justify-start shrink-0">
          <div className="flex items-center bg-slate-100 dark:bg-[#0d1017] p-1 rounded-xl border border-slate-200 dark:border-neutral-800 shrink-0">
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid size={13} className="shrink-0" />
              <span>{t('mobileViewModeTable')}</span>
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays size={13} className="shrink-0" />
              <span>{t('mobileViewModeDay')}</span>
            </button>
          </div>

          {/* Quick Add Habit Button (Compact on mobile) */}
          <button
            onClick={() => setShowAddHabit(!showAddHabit)}
            className="md:hidden flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs shrink-0 shadow-xs whitespace-nowrap"
          >
            <Plus size={13} className="shrink-0" />
            <span>{showAddHabit ? t('cancelBtn') : t('addHabitTitle')}</span>
          </button>
        </div>

        {/* Legend Bar (Desktop & Tablet) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs w-full xl:w-auto py-1 xl:py-0 border-y xl:border-y-0 border-slate-100 dark:border-neutral-800/70">
          <span className="text-slate-400 dark:text-neutral-500 font-mono text-[11px] uppercase tracking-wider font-bold shrink-0">
            {language === 'ru' ? 'Статусы:' : 'Status:'}
          </span>
          <div className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <span className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Check size={10} strokeWidth={2.5} />
            </span>
            <span className="text-slate-700 dark:text-neutral-300 font-medium">{t('legendDone')}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <span className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Zap size={10} fill="currentColor" />
            </span>
            <span className="text-slate-700 dark:text-neutral-300 font-medium">{t('legendMicro')}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <span className="w-4 h-4 rounded bg-slate-200 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 flex items-center justify-center shrink-0">
              <Moon size={10} />
            </span>
            <span className="text-slate-700 dark:text-neutral-300 font-medium">{t('legendRest')}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <span className="w-4 h-4 rounded bg-rose-100 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <X size={10} strokeWidth={2.5} />
            </span>
            <span className="text-slate-700 dark:text-neutral-300 font-medium">{t('legendMissed')}</span>
          </div>
        </div>

        {/* Filter controls & Add button */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0d1017] p-1.5 rounded-xl border border-slate-200 dark:border-neutral-800 shrink-0">
            <Filter size={12} className="text-slate-400 dark:text-neutral-500 ml-1 shrink-0" />
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-white text-xs border-none focus:outline-none pr-1"
            >
              <option value="all">{t('filterAll')}</option>
              {LIFE_DIRECTIONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {language === 'ru' ? d.nameRu : d.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setWeeklyFocusOnly(!weeklyFocusOnly)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs transition-colors font-semibold shrink-0 whitespace-nowrap ${
              weeklyFocusOnly
                ? 'bg-amber-100 dark:bg-amber-950/30 border-amber-300 dark:border-amber-600/60 text-amber-800 dark:text-amber-300'
                : 'bg-slate-100 dark:bg-[#0d1017] border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles size={11} className="shrink-0" />
            <span>#1 {language === 'ru' ? 'Рычаг' : 'Focus'}</span>
          </button>

          <button
            onClick={() => setShowAddHabit(!showAddHabit)}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-bold transition-colors shadow-xs shrink-0 whitespace-nowrap"
          >
            <Plus size={14} className="shrink-0" />
            <span>{showAddHabit ? t('cancelBtn') : t('addHabitTitle')}</span>
          </button>
        </div>
      </div>

      {/* Add Habit inline form */}
      {showAddHabit && (
        <form
          onSubmit={handleCreateHabit}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1118] border border-slate-200 dark:border-neutral-700 shadow-md space-y-3.5 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-900 dark:text-white font-mono uppercase flex items-center gap-2">
              <Plus size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>{t('addHabitTitle')}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddHabit(false)}
              className="text-slate-400 hover:text-slate-900 dark:text-neutral-500 dark:hover:text-white p-1"
            >
              <X size={15} />
            </button>
          </div>

          <input
            type="text"
            placeholder={language === 'ru' ? 'Название привычки (действие, напр. «Тренировка в зале 1 ч»)...' : 'Habit title (action)...'}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-700 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-neutral-400 mb-1">{t('directionLabel')}</label>
              <select
                value={newDirection}
                onChange={(e) => setNewDirection(e.target.value as LifeDirectionId)}
                className="w-full bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-700 rounded-xl p-2 text-slate-900 dark:text-white"
              >
                {LIFE_DIRECTIONS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {language === 'ru' ? d.nameRu : d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-neutral-400 mb-1">{t('triggerPrefix')}</label>
              <input
                type="text"
                placeholder={language === 'ru' ? 'Якорный триггер (когда? напр. «После утренней воды»)...' : 'Anchor trigger (when?)...'}
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-700 rounded-xl p-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-neutral-400 mb-1">{t('microFallback')}</label>
              <input
                type="text"
                placeholder={language === 'ru' ? '2-минутный минимум (напр. «3 мин растяжки»)...' : 'Micro fallback action...'}
                value={newMicro}
                onChange={(e) => setNewMicro(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-700 rounded-xl p-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddHabit(false)}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white"
            >
              {t('cancelBtn')}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-neutral-200 transition-colors shadow-xs"
            >
              {t('addHabitTitle')}
            </button>
          </div>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          3A. DAY-BY-DAY FOCUSED CHECK-IN VIEW (IDEAL FOR SMARTPHONES & TABLETS)
         ───────────────────────────────────────────────────────────────────────────── */}
      {viewMode === 'day' && (
        <div className="space-y-4 animate-fade-in">
          {/* Day Selector Strip */}
          <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-3 sm:p-4 shadow-xs">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">
              {t('selectDayToCheckin')}
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {weekDays.map((d) => {
                const isSelected = d.dateStr === selectedDayDate;
                const isToday = d.dateStr === todayStr;
                const stat = analytics.dailyStats.find((s) => s.dateStr === d.dateStr);

                return (
                  <button
                    key={d.dateStr}
                    onClick={() => setSelectedDayDate(d.dateStr)}
                    className={`flex flex-col items-center py-2 px-1 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-neutral-800 border-slate-900 dark:border-white/60 text-white shadow-sm'
                        : isToday
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-[#141824] border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold font-mono">
                      {language === 'ru' ? d.dayNameRu : d.dayNameEn}
                    </span>
                    <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-400 dark:text-neutral-500'}`}>
                      {d.dayNum}
                    </span>
                    <span
                      className={`text-[9px] font-mono mt-1 px-1 rounded ${
                        (stat?.pct || 0) >= 80
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold'
                          : (stat?.pct || 0) >= 50
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold'
                          : isSelected
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-slate-200/70 dark:bg-neutral-800 text-slate-500 dark:text-neutral-500'
                      }`}
                    >
                      {stat?.pct || 0}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Habit cards list for the active day */}
          <div className="space-y-3">
            {filteredHabits.map((habit) => {
              const currentStatus: HabitDayStatus = records[selectedDayDate]?.[habit.id] || 'none';
              const isFocus = habit.id === currentWeek.primaryHabitId;
              const dir = getDirection(habit.directionId);
              const { currentStreak } = calculateStreak(habit.id);

              return (
                <div
                  key={habit.id}
                  className={`p-4 rounded-2xl border bg-white dark:bg-[#0e1118] transition-all shadow-xs ${
                    isFocus
                      ? 'border-amber-400 dark:border-amber-500/50 bg-amber-50/20 dark:bg-[#121622]'
                      : 'border-slate-200/90 dark:border-neutral-800/80 hover:border-slate-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 font-semibold">
                          {dir.displayName}
                        </span>
                        {isFocus && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-600/40 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1">
                            <Sparkles size={10} />
                            <span>#1 {language === 'ru' ? 'Рычаг' : 'Focus'}</span>
                          </span>
                        )}
                        {currentStreak > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 flex items-center gap-0.5 font-semibold">
                            <Flame size={10} />
                            <span>{currentStreak} {t('streakDays')}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                        {habit.title}
                      </h3>

                      <div className="text-xs text-slate-600 dark:text-neutral-400 mt-1 flex flex-col gap-0.5">
                        <span className="text-[11px]">
                          <strong className="text-slate-700 dark:text-neutral-500">{t('triggerPrefix')}</strong> {habit.anchorTrigger}
                        </span>
                        <span className="text-[11px] text-amber-700 dark:text-amber-400/90 font-mono">
                          {t('microFallback')} {habit.microVersion}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Touch-friendly Status Buttons */}
                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-200/80 dark:border-neutral-800/60 mt-3">
                    <button
                      onClick={() => setHabitStatusForDate(selectedDayDate, habit.id, 'done')}
                      className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border text-xs font-semibold transition-all min-h-[44px] ${
                        currentStatus === 'done'
                          ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-sm'
                          : 'bg-slate-50 dark:bg-[#141824] hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-800'
                      }`}
                    >
                      <Check size={16} strokeWidth={2.5} />
                      <span className="text-[10px] mt-1">{t('legendDone')}</span>
                    </button>

                    <button
                      onClick={() => setHabitStatusForDate(selectedDayDate, habit.id, 'micro')}
                      className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border text-xs font-semibold transition-all min-h-[44px] ${
                        currentStatus === 'micro'
                          ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
                          : 'bg-slate-50 dark:bg-[#141824] hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-800'
                      }`}
                    >
                      <Zap size={16} fill="currentColor" />
                      <span className="text-[10px] mt-1">{t('legendMicro')}</span>
                    </button>

                    <button
                      onClick={() => setHabitStatusForDate(selectedDayDate, habit.id, 'rest')}
                      className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border text-xs font-medium transition-all min-h-[44px] ${
                        currentStatus === 'rest'
                          ? 'bg-slate-700 dark:bg-neutral-700 text-white border-slate-600'
                          : 'bg-slate-50 dark:bg-[#141824] hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-800'
                      }`}
                    >
                      <Moon size={15} />
                      <span className="text-[10px] mt-1">{t('legendRest')}</span>
                    </button>

                    <button
                      onClick={() => setHabitStatusForDate(selectedDayDate, habit.id, 'missed')}
                      className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border text-xs font-medium transition-all min-h-[44px] ${
                        currentStatus === 'missed'
                          ? 'bg-rose-600 dark:bg-rose-950 text-white dark:text-rose-300 border-rose-500 dark:border-rose-800'
                          : 'bg-slate-50 dark:bg-[#141824] hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-500 dark:text-neutral-500 border-slate-200 dark:border-neutral-800'
                      }`}
                    >
                      <X size={15} strokeWidth={2.5} />
                      <span className="text-[10px] mt-1">{t('legendMissed')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          3B. THE HABIT TRACKER MATRIX (MON-SUN TABLE)
         ───────────────────────────────────────────────────────────────────────────── */}
      {viewMode === 'matrix' && (
        <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl overflow-hidden shadow-xs transition-colors duration-200">
          {/* Mobile Swipe Hint */}
          <div className="sm:hidden px-4 py-2 bg-slate-100 dark:bg-[#12151f] border-b border-slate-200 dark:border-neutral-800 text-[11px] font-mono text-slate-500 dark:text-neutral-400 flex items-center justify-between">
            <span>{language === 'ru' ? '← Свайп таблицы по дням (Пн–Вс) →' : '← Swipe table for days (Mon–Sun) →'}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{analytics.weeklyAvgPct}%</span>
          </div>

          <div className="overflow-x-auto no-scrollbar sm:overflow-x-visible">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-neutral-800 bg-slate-50/80 dark:bg-[#12151f]/90 text-slate-600 dark:text-neutral-400 font-mono text-[11px]">
                  <th className="py-3 px-4 min-w-[200px] sm:min-w-[280px] font-bold uppercase tracking-wider sticky left-0 bg-slate-50 dark:bg-[#12151f] sm:static z-20 border-r border-slate-200 dark:border-neutral-800/80 sm:border-r-0">
                    {language === 'ru' ? 'Привычка / Триггер привязки' : 'Habit & Anchor Trigger'}
                  </th>

                  {/* 7 Days: Mon-Sun */}
                  {weekDays.map((day) => {
                    const isToday = day.dateStr === todayStr;
                    return (
                      <th
                        key={day.dateStr}
                        className={`py-3 px-1.5 sm:px-2 text-center w-12 sm:w-14 shrink-0 transition-colors ${
                          isToday
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold border-x border-emerald-200 dark:border-emerald-800/50'
                            : ''
                        }`}
                      >
                        <div className="text-[11px]">{language === 'ru' ? day.dayNameRu : day.dayNameEn}</div>
                        <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono">{day.dayNum}</div>
                        {isToday && (
                          <div className="text-[9px] uppercase tracking-tighter text-emerald-600 dark:text-emerald-400 font-sans font-bold">
                            {language === 'ru' ? 'Сегодня' : 'Today'}
                          </div>
                        )}
                      </th>
                    );
                  })}

                  <th className="py-3 px-3 text-center min-w-[70px] font-bold uppercase tracking-wider">
                    {t('streakCurrent')}
                  </th>

                  <th className="py-3 px-4 text-right min-w-[90px] font-bold uppercase tracking-wider">
                    {t('weeklyCompletion')}
                  </th>

                  <th className="py-3 px-2 text-center w-10"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/80 dark:divide-neutral-800/60">
                {filteredHabits.map((habit) => {
                  const isWeeklyFocus = habit.id === currentWeek.primaryHabitId;
                  const dir = getDirection(habit.directionId);
                  const { currentStreak, bestStreak } = calculateStreak(habit.id);

                  let completedDays = 0;
                  weekDays.forEach((d) => {
                    const st = records[d.dateStr]?.[habit.id] || 'none';
                    if (st === 'done' || st === 'micro') completedDays++;
                  });
                  const habitPct = Math.round((completedDays / 7) * 100);

                  return (
                    <tr
                      key={habit.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-[#141824]/60 transition-colors ${
                        isWeeklyFocus ? 'bg-amber-50/50 dark:bg-amber-950/15 border-l-2 border-l-amber-500' : ''
                      }`}
                    >
                      {/* Habit Info */}
                      <td className="py-3.5 px-4 sticky left-0 bg-white dark:bg-[#0e1118] sm:static z-10 border-r border-slate-200 dark:border-neutral-800/80 sm:border-r-0">
                        <div className="flex items-center gap-2">
                          {isWeeklyFocus && (
                            <span
                              className="text-amber-700 dark:text-amber-400 shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-600/40 text-[10px] font-mono font-bold"
                              title={language === 'ru' ? 'Главная привычка недели (#1 рычаг)' : 'Weekly focus habit'}
                            >
                              <Sparkles size={11} />
                              <span>#1 {language === 'ru' ? 'Рычаг' : 'Focus'}</span>
                            </span>
                          )}
                          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {habit.title}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-slate-700 dark:text-neutral-300 font-semibold">{dir.displayName}</span>
                          <span className="text-slate-300 dark:text-neutral-600">·</span>
                          <span className="text-slate-600 dark:text-neutral-400">{habit.anchorTrigger}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-neutral-500 mt-0.5">
                          <span className="text-amber-600 dark:text-amber-400 font-mono font-semibold">{t('microFallback')}</span> {habit.microVersion}
                        </div>
                      </td>

                      {/* 7 Interactive Day Cells */}
                      {weekDays.map((day) => {
                        const isToday = day.dateStr === todayStr;
                        const status: HabitDayStatus = records[day.dateStr]?.[habit.id] || 'none';

                        return (
                          <td
                            key={day.dateStr}
                            onClick={() => cycleHabitStatus(day.dateStr, habit.id)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setActiveCellMenu({ dateStr: day.dateStr, habitId: habit.id });
                            }}
                            className={`py-2 px-1 text-center cursor-pointer select-none transition-colors relative group ${
                              isToday ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-x border-emerald-200 dark:border-emerald-800/40' : ''
                            }`}
                          >
                            <div className="flex items-center justify-center">
                              {renderStatusCell(status, day.isPast)}
                            </div>
                          </td>
                        );
                      })}

                      {/* Streak Counter Badge */}
                      <td className="py-3.5 px-3 text-center font-mono">
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                            currentStreak >= 5
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40'
                              : currentStreak >= 2
                              ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                              : currentStreak > 0
                              ? 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300'
                              : 'text-slate-400 dark:text-neutral-600'
                          }`}
                          title={`${t('streakCurrent')}: ${currentStreak} ${t('streakDays')}, ${t('streakBest')}: ${bestStreak}`}
                        >
                          <Flame size={12} className={currentStreak > 0 ? 'text-amber-500' : 'text-slate-400 dark:text-neutral-600'} />
                          <span>{currentStreak}</span>
                        </div>
                      </td>

                      {/* Weekly Completion Rate */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {completedDays} / 7
                          <span className="text-[10px] text-slate-400 dark:text-neutral-500 ml-1">({habitPct}%)</span>
                        </div>
                        <div className="w-16 h-1.5 bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden mt-1 ml-auto">
                          <div
                            className={`h-full transition-all duration-300 ${
                              habitPct >= 80 ? 'bg-emerald-500' : habitPct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${habitPct}%` }}
                          />
                        </div>
                      </td>

                      {/* Delete action */}
                      <td className="py-3.5 px-2 text-center">
                        <button
                          onClick={() => deleteHabit(habit.id)}
                          className="opacity-30 hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity p-1 rounded"
                          title={t('deleteHabitBtn')}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredHabits.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-xs text-slate-500 dark:text-neutral-500">
                      {language === 'ru' ? 'Нет привычек, соответствующих фильтру.' : 'No habits match current filter.'}
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Bottom Total Summary Row */}
              <tfoot>
                <tr className="border-t-2 border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#12151f] font-mono text-slate-600 dark:text-neutral-400">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white uppercase text-[11px] sticky left-0 bg-slate-50 dark:bg-[#12151f] sm:static z-10 border-r border-slate-200 dark:border-neutral-800/80 sm:border-r-0">
                    {t('dailyConsistency')}
                  </td>

                  {analytics.dailyStats.map((ds) => {
                    const isToday = ds.dateStr === todayStr;
                    return (
                      <td
                        key={ds.dateStr}
                        className={`py-3 px-1 text-center ${
                          isToday ? 'bg-emerald-50 dark:bg-emerald-950/40 border-x border-emerald-200 dark:border-emerald-800/50' : ''
                        }`}
                      >
                        <div
                          className={`text-xs font-bold ${
                            ds.pct >= 80
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : ds.pct >= 50
                              ? 'text-amber-600 dark:text-amber-300'
                              : ds.pct > 0
                              ? 'text-slate-800 dark:text-neutral-200'
                              : 'text-slate-400 dark:text-neutral-500'
                          }`}
                        >
                          {ds.pct}%
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-neutral-500">
                          {ds.completed}/{ds.total}
                        </div>
                      </td>
                    );
                  })}

                  <td className="py-3 px-3 text-center text-xs text-slate-400 dark:text-neutral-400">
                    —
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {analytics.weeklyAvgPct}%
                  </td>

                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Bottom Footer Info */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#0a0c12] border-t border-slate-200 dark:border-neutral-800 text-[11px] text-slate-500 dark:text-neutral-500 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HelpCircle size={13} className="text-slate-400 dark:text-neutral-400" />
              <span>{t('cycleHelp')}</span>
            </div>
            <div className="font-mono text-slate-500 dark:text-neutral-400 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>≥80% {language === 'ru' ? 'Идеал' : 'Ideal'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>≥50% {language === 'ru' ? 'Норма' : 'Solid'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>&lt;50% {language === 'ru' ? 'Спад' : 'Dip'}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Status Context Popover Modal if active */}
      {activeCellMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0e1118] border border-slate-200 dark:border-neutral-700 rounded-2xl p-4 w-full max-w-xs shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-2">
              <div className="text-xs font-bold text-slate-900 dark:text-white font-mono uppercase">
                {t('quickStatusMenu')}
              </div>
              <button
                onClick={() => setActiveCellMenu(null)}
                className="text-slate-400 hover:text-slate-900 dark:text-neutral-500 dark:hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => {
                  setHabitStatusForDate(activeCellMenu.dateStr, activeCellMenu.habitId, 'done');
                  setActiveCellMenu(null);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-left transition-colors"
              >
                <Check size={14} strokeWidth={2.5} />
                <span className="font-medium">{t('legendDone')}</span>
              </button>

              <button
                onClick={() => {
                  setHabitStatusForDate(activeCellMenu.dateStr, activeCellMenu.habitId, 'micro');
                  setActiveCellMenu(null);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-left transition-colors"
              >
                <Zap size={14} fill="currentColor" />
                <span className="font-medium">{t('legendMicro')}</span>
              </button>

              <button
                onClick={() => {
                  setHabitStatusForDate(activeCellMenu.dateStr, activeCellMenu.habitId, 'rest');
                  setActiveCellMenu(null);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700 text-left transition-colors"
              >
                <Moon size={14} />
                <span className="font-medium">{t('legendRest')}</span>
              </button>

              <button
                onClick={() => {
                  setHabitStatusForDate(activeCellMenu.dateStr, activeCellMenu.habitId, 'missed');
                  setActiveCellMenu(null);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 text-left transition-colors"
              >
                <X size={14} strokeWidth={2.5} />
                <span className="font-medium">{t('legendMissed')}</span>
              </button>

              <button
                onClick={() => {
                  setHabitStatusForDate(activeCellMenu.dateStr, activeCellMenu.habitId, 'none');
                  setActiveCellMenu(null);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#141824] dark:hover:bg-neutral-800 text-slate-500 dark:text-neutral-400 text-left transition-colors"
              >
                <Minus size={14} />
                <span>{language === 'ru' ? 'Очистить статус' : 'Clear status'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. VISUAL TREND CHARTS & ANALYTICS (ADAPTIVE LIGHT/DARK STYLING)
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Daily Completion Dynamics */}
        <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>{t('trendChartTitle')}</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{t('chartNormBenchmark')}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>{t('chartBaseBenchmark')}</span>
              </span>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-stretch gap-2">
              <div className="w-9 sm:w-11 shrink-0 flex flex-col justify-between text-[10px] font-mono text-slate-400 dark:text-neutral-500 pb-8 pt-6 text-right pr-1 select-none">
                <span className="leading-none">100%</span>
                <span className="leading-none text-emerald-600 dark:text-emerald-400 font-semibold">80%</span>
                <span className="leading-none text-amber-600 dark:text-amber-400 font-semibold">50%</span>
                <span className="leading-none">0%</span>
              </div>

              <div className="flex-1 relative">
                <div className="h-44 sm:h-48 relative border-b border-slate-300 dark:border-neutral-700/80 bg-slate-50/70 dark:bg-[#0a0d14]/40 rounded-t-xl">
                  <div className="absolute left-0 right-0 top-0 border-b border-slate-200/80 dark:border-neutral-800/60 pointer-events-none" />
                  <div className="absolute left-0 right-0 top-[20%] border-b border-dashed border-emerald-500/30 pointer-events-none" />
                  <div className="absolute left-0 right-0 top-[50%] border-b border-dotted border-amber-500/30 pointer-events-none" />

                  <div className="grid grid-cols-7 h-full items-end gap-1.5 sm:gap-3 px-1 sm:px-2 relative z-10">
                    {analytics.dailyStats.map((ds) => {
                      const isToday = ds.dateStr === todayStr;
                      const barHeight = Math.max(ds.pct, 4);

                      return (
                        <div
                          key={ds.dateStr}
                          onMouseEnter={() => setActiveTooltipDay(ds.dateStr)}
                          onMouseLeave={() => setActiveTooltipDay(null)}
                          onClick={() =>
                            setActiveTooltipDay(activeTooltipDay === ds.dateStr ? null : ds.dateStr)
                          }
                          className="h-full flex flex-col items-center justify-end group cursor-pointer relative"
                        >
                          <div className="h-7 flex flex-col items-center justify-end pb-1 transition-transform group-hover:scale-105">
                            {ds.microCount > 0 && (
                              <span
                                className="w-3.5 h-3.5 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center text-[9px] font-bold shadow-xs mb-0.5"
                                title={`${ds.microCount} ${language === 'ru' ? 'микро-шагов' : 'micro-saves'}`}
                              >
                                ⚡
                              </span>
                            )}
                            <span
                              className={`text-[10px] sm:text-xs font-mono font-bold leading-none ${
                                isToday
                                  ? 'text-emerald-600 dark:text-emerald-300'
                                  : ds.pct >= 80
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : ds.pct >= 50
                                  ? 'text-amber-600 dark:text-amber-300'
                                  : ds.pct > 0
                                  ? 'text-slate-600 dark:text-neutral-400'
                                  : 'text-slate-400 dark:text-neutral-600'
                              }`}
                            >
                              {ds.pct}%
                            </span>
                          </div>

                          <div className="w-full flex justify-center items-end flex-1 pb-0.5">
                            <div
                              className={`w-full max-w-[32px] sm:max-w-[42px] rounded-t-md sm:rounded-t-lg transition-all duration-500 ${
                                isToday
                                  ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-sm ring-1 ring-emerald-400/50'
                                  : ds.pct >= 80
                                  ? 'bg-emerald-500 hover:bg-emerald-400'
                                  : ds.pct >= 50
                                  ? 'bg-amber-500 hover:bg-amber-400'
                                  : ds.pct > 0
                                  ? 'bg-slate-400 dark:bg-neutral-600 hover:bg-slate-500'
                                  : 'bg-slate-200 dark:bg-neutral-800/40'
                              }`}
                              style={{ height: `${barHeight}%` }}
                            />
                          </div>

                          {activeTooltipDay === ds.dateStr && (
                            <div className="absolute bottom-full mb-2 z-30 w-36 sm:w-40 p-2 rounded-xl bg-white dark:bg-[#141824] border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 text-[11px] shadow-xl pointer-events-none animate-fade-in -translate-x-1/2 left-1/2">
                              <div className="font-bold text-slate-900 dark:text-white font-mono flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-1 mb-1">
                                <span>{ds.dayName}</span>
                                <span className="text-slate-400 dark:text-neutral-400 font-normal">{ds.dateStr.slice(5)}</span>
                              </div>
                              <div className="space-y-0.5 text-[10px] font-mono">
                                <div className="flex justify-between">
                                  <span className="text-slate-500 dark:text-neutral-400">{language === 'ru' ? 'Выполнено:' : 'Done:'}</span>
                                  <span className="text-slate-900 dark:text-white font-bold">{ds.completed}/{ds.total}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 dark:text-neutral-400">{language === 'ru' ? 'Процент:' : 'Rate:'}</span>
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{ds.pct}%</span>
                                </div>
                                {ds.microCount > 0 && (
                                  <div className="flex justify-between text-amber-600 dark:text-amber-300">
                                    <span>{language === 'ru' ? 'Микро-шагов:' : 'Micro:'}</span>
                                    <span>{ds.microCount}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5 sm:gap-3 px-1 sm:px-2 pt-2 text-center">
                  {analytics.dailyStats.map((ds) => {
                    const isToday = ds.dateStr === todayStr;
                    return (
                      <div key={ds.dateStr} className="space-y-0.5">
                        <span
                          className={`text-xs font-mono font-bold block ${
                            isToday ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-700 dark:text-neutral-300'
                          }`}
                        >
                          {ds.dayName}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono block">
                          {ds.dayNum}
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-neutral-600 font-mono block">
                          {ds.completed}/{ds.total}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-4 text-center pl-10 sm:pl-12">
              {analytics.dailyStats.map((ds) => (
                <div
                  key={ds.dateStr}
                  className={`py-1 rounded text-[9px] sm:text-[10px] font-mono font-medium transition-colors ${
                    ds.dayType === 'ideal'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                      : ds.dayType === 'solid'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                      : 'bg-slate-50 dark:bg-[#141824] text-slate-500 dark:text-neutral-500 border border-slate-200 dark:border-neutral-800/60'
                  }`}
                >
                  {ds.dayType === 'ideal'
                    ? t('idealDayBadge')
                    : ds.dayType === 'solid'
                    ? t('solidDayBadge')
                    : t('lowDayBadge')}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 2: Habit Reliability & Streaks Ranking */}
        <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <BarChart3 size={16} className="text-amber-500 dark:text-amber-400" />
              <span>{t('habitRankingTitle')}</span>
            </div>
            <span className="font-mono text-xs text-slate-500 dark:text-neutral-400">
              {habits.length} {language === 'ru' ? 'привычек' : 'habits'}
            </span>
          </div>

          <div className="space-y-3.5 pt-1 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
            {analytics.habitStats.map(({ habit, doneCount, pct, currentStreak }) => {
              const isFocus = habit.id === currentWeek.primaryHabitId;
              return (
                <div key={habit.id} className="space-y-1.5 group">
                  <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-2 text-xs">
                    <div
                      className={`min-w-0 flex-1 truncate flex items-center gap-1.5 ${
                        isFocus ? 'text-amber-700 dark:text-amber-300 font-bold' : 'text-slate-800 dark:text-neutral-200 font-medium'
                      }`}
                      title={habit.title}
                    >
                      {isFocus && <Sparkles size={12} className="text-amber-500 shrink-0" />}
                      <span className="truncate">{habit.title}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] ml-auto">
                      {currentStreak > 0 && (
                        <span
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold ${
                            currentStreak >= 21
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/50'
                              : currentStreak >= 14
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/50'
                              : currentStreak >= 7
                              ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600/50'
                              : 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700/40'
                          }`}
                          title={`${t('streakCurrent')}: ${currentStreak}`}
                        >
                          <Flame size={11} className={currentStreak >= 7 ? 'text-amber-500 animate-pulse' : ''} />
                          <span>{currentStreak} {t('streakDays')}</span>
                        </span>
                      )}
                      <span className="text-slate-500 dark:text-neutral-400 font-medium">
                        {doneCount}/7 <strong className="text-slate-900 dark:text-neutral-200 ml-1">({pct}%)</strong>
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-slate-100 dark:bg-neutral-800/90 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isFocus
                          ? 'bg-amber-500 dark:bg-amber-400'
                          : pct >= 80
                          ? 'bg-emerald-500 dark:bg-emerald-400'
                          : pct >= 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500/80'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 3: Life Spheres Balance */}
        <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <PieChart size={16} className="text-indigo-600 dark:text-purple-400" />
              <span>{t('directionBalanceTitle')}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
              {language === 'ru' ? 'Стратегический баланс' : 'Strategic Linkage'}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
            {language === 'ru'
              ? 'Связь привычек со стратегическими целями: баланс усилий между Здоровьем, Карьерой, Обучением и Финансами.'
              : 'Strategy-to-Action Linkage: Tracking whether habit execution maintains balance across Health, Career, Learning, and Finances.'}
          </p>

          <div className="space-y-3 pt-2 text-xs">
            {analytics.directionStats.map((dir) => (
              <div key={dir.id} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-700 dark:text-neutral-300 font-semibold">{dir.name}</span>
                  <span className="font-mono text-slate-500 dark:text-neutral-400">
                    {dir.done} / {dir.total} <strong className="text-slate-900 dark:text-neutral-200 ml-1">({dir.pct}%)</strong>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-neutral-800/90 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      dir.pct >= 80
                        ? 'bg-emerald-500 dark:bg-emerald-400'
                        : dir.pct >= 50
                        ? 'bg-indigo-500 dark:bg-purple-400'
                        : 'bg-slate-400 dark:bg-neutral-600'
                    }`}
                    style={{ width: `${dir.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: Causal Chain Energy vs Habit Execution */}
        <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <Activity size={16} className="text-blue-600 dark:text-blue-400" />
              <span>{t('causalEnergyTitle')}</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              {language === 'ru' ? 'Закон сна к 23:30' : 'Sleep Law to 23:30'}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
            {language === 'ru'
              ? 'Причинная модель Франклина: Качество сна и уровень энергии напрямую определяют процент закрытых привычек. Защита сна к 23:30 повышает стабильность на 40%.'
              : 'Franklin Causal Chain: Sleep and physical energy directly dictate habit execution. Protecting sleep schedule to 23:30 boosts weekly consistency by 40%.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800">
              <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-500 uppercase block font-semibold">
                {language === 'ru' ? 'Энергия 4–5 (Норма)' : 'High Energy'}
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono block mt-1">92%</span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400 block mt-0.5">
                {language === 'ru' ? 'Выполнение в норме' : 'Habit rate'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800">
              <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-500 uppercase block font-semibold">
                {language === 'ru' ? 'Энергия 3 (Усталость)' : 'Medium Energy'}
              </span>
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono block mt-1">68%</span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400 block mt-0.5">
                {language === 'ru' ? 'Спасают микро-шаги' : 'Micro-steps save day'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800">
              <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-500 uppercase block font-semibold">
                {language === 'ru' ? 'Энергия 1–2 (Спад)' : 'Low Energy'}
              </span>
              <span className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono block mt-1">40%</span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400 block mt-0.5">
                {language === 'ru' ? 'Режим выживания' : 'Survival mode'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Milestones & Badges Modal */}
      {showMilestonesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#090b10] border border-slate-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-2xl">
            <button
              onClick={() => setShowMilestonesModal(false)}
              className="absolute top-4 right-4 z-10 text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white p-2 rounded-lg bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800"
            >
              <X size={18} />
            </button>
            <MilestonesView />
          </div>
        </div>
      )}
    </div>
  );
};
