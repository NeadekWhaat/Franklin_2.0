import React, { useMemo } from 'react';
import { useFranklin } from '../context/FranklinContext';
import { LIFE_DIRECTIONS } from '../config/franklinDefaults';
import { ActiveTab } from './Navigation';
import {
  Activity,
  BarChart3,
  Compass,
  Sparkles,
  Moon,
  RotateCcw,
  ChevronRight,
  Layers,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

interface CommandCenterChartsProps {
  onOpenCausalChain: () => void;
  onOpenSlipRecovery: () => void;
  onOpenEveningReflection: () => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

export const CommandCenterCharts: React.FC<CommandCenterChartsProps> = ({
  onOpenCausalChain,
  onOpenSlipRecovery,
  onOpenEveningReflection,
  onNavigateTab,
}) => {
  const { state, language, t } = useFranklin();
  const isRu = language === 'ru';

  const activeHabits = useMemo(() => state.habits.filter((h) => h.active), [state.habits]);
  const todayTasks = state.todayLog.tasks;
  const completedTasksCount = todayTasks.filter((t) => t.completed).length;
  const completedHabitsCount = state.todayLog.completedHabitIds.length;

  const totalTodayItems = todayTasks.length + activeHabits.length;
  const completedTodayItems = completedTasksCount + completedHabitsCount;
  const todayOverallPercent =
    totalTodayItems > 0 ? Math.round((completedTodayItems / totalTodayItems) * 100) : 0;

  // Last 7 days habit & execution velocity
  const last7DaysData = useMemo(() => {
    const result: Array<{
      dateStr: string;
      shortLabel: string;
      doneCount: number;
      microCount: number;
      totalHabits: number;
      percent: number;
      isToday: boolean;
    }> = [];

    const dayNamesRu = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const total = Math.max(1, activeHabits.length);

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayRecord = state.habitWeeklyRecords?.[dateStr] || {};

      let doneCount = 0;
      let microCount = 0;

      activeHabits.forEach((h) => {
        const st = dayRecord[h.id];
        if (st === 'done') doneCount++;
        else if (st === 'micro') microCount++;
        else if (i === 0 && state.todayLog.completedHabitIds.includes(h.id)) {
          doneCount++;
        }
      });

      const pct = Math.min(100, Math.round(((doneCount + microCount * 0.75) / total) * 100));
      result.push({
        dateStr,
        shortLabel: isRu ? dayNamesRu[d.getDay()] : dayNamesEn[d.getDay()],
        doneCount,
        microCount,
        totalHabits: activeHabits.length,
        percent: pct,
        isToday: i === 0,
      });
    }
    return result;
  }, [activeHabits, state.habitWeeklyRecords, state.todayLog.completedHabitIds, isRu]);

  // 6 Life Directions Telemetry (Goals + Active Habits + Today's Tasks)
  const directionsTelemetry = useMemo(() => {
    return LIFE_DIRECTIONS.map((dir) => {
      const dirGoals = state.goals.filter((g) => g.directionId === dir.id);
      const dirHabits = activeHabits.filter((h) => h.directionId === dir.id);
      const dirTasks = todayTasks.filter((t) => t.directionId === dir.id);

      const doneHabits = dirHabits.filter((h) => state.todayLog.completedHabitIds.includes(h.id)).length;
      const doneTasks = dirTasks.filter((t) => t.completed).length;

      const avgGoalProgress =
        dirGoals.length > 0
          ? Math.round(dirGoals.reduce((acc, g) => acc + (g.progressPercent || 0), 0) / dirGoals.length)
          : 0;

      const todayTotal = dirHabits.length + dirTasks.length;
      const todayDone = doneHabits + doneTasks;
      const dailyPulsePercent =
        todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : avgGoalProgress;

      return {
        ...dir,
        displayName: isRu ? dir.nameRu : dir.name,
        goalsCount: dirGoals.length,
        avgGoalProgress,
        habitsCount: dirHabits.length,
        doneHabits,
        tasksCount: dirTasks.length,
        doneTasks,
        dailyPulsePercent,
      };
    });
  }, [state.goals, activeHabits, todayTasks, state.todayLog.completedHabitIds, isRu]);

  // SVG Ring parameters
  const ringRadius = 38;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (todayOverallPercent / 100) * ringCircumference;

  return (
    <div className="space-y-5 min-w-0 max-w-full overflow-x-clip">
      {/* ─────────────────────────────────────────────────────────────────────────────
          ROW 1: VISUAL PROGRESS CHARTS (DAILY RING + 7-DAY BAR CHART + 6 DIRECTIONS)
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-w-0">
        {/* LEFT (6 COLS): TODAY'S EXECUTION RING & 7-DAY VELOCITY CHART */}
        <div className="lg:col-span-6 min-w-0 bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/90 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-neutral-800/80">
            <div className="flex items-center gap-2">
              <BarChart3 size={17} className="text-emerald-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isRu ? 'График импульса и дисциплины (7 дней)' : '7-Day Momentum & Discipline Chart'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  {isRu ? 'Визуализация выполнения привычек и задач дня' : 'Daily habits & tasks execution velocity'}
                </p>
              </div>
            </div>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('habit-matrix')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>{isRu ? 'Матрица привычек' : 'Habit Matrix'}</span>
                <ChevronRight size={13} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center my-auto">
            {/* Radial Progress Gauge for Today */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/70 dark:border-neutral-800">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                  <circle
                    cx="48"
                    cy="48"
                    r={ringRadius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-200 dark:text-neutral-800"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r={ringRadius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                    className="text-emerald-500 transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                    {todayOverallPercent}%
                  </span>
                  <span className="text-[9px] font-mono uppercase text-slate-400">
                    {isRu ? 'Сегодня' : 'Today'}
                  </span>
                </div>
              </div>

              <div className="mt-2 text-center">
                <div className="text-xs font-semibold text-slate-800 dark:text-neutral-200">
                  {completedTodayItems} {isRu ? 'из' : 'of'} {totalTodayItems} {isRu ? 'шагов' : 'actions'}
                </div>
                <div className="text-[10px] font-mono text-slate-500 dark:text-neutral-400">
                  {isRu
                    ? `Задачи: ${completedTasksCount}/${todayTasks.length} · Привычки: ${completedHabitsCount}/${activeHabits.length}`
                    : `Tasks: ${completedTasksCount}/${todayTasks.length} · Habits: ${completedHabitsCount}/${activeHabits.length}`}
                </div>
              </div>
            </div>

            {/* 7-Day Vertical Bar Chart */}
            <div className="sm:col-span-7 flex flex-col justify-between h-full">
              <div className="flex items-end justify-between gap-2 h-32 pt-4 px-2">
                {last7DaysData.map((day) => (
                  <div
                    key={day.dateStr}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
                  >
                    <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.percent}%
                    </span>
                    <div className="w-full max-w-[26px] h-20 bg-slate-100 dark:bg-neutral-800/90 rounded-lg overflow-hidden flex items-end p-0.5">
                      <div
                        className={`w-full rounded-md transition-all duration-500 ${
                          day.isToday
                            ? 'bg-gradient-to-t from-cyan-500 to-emerald-400 shadow-xs'
                            : day.percent >= 60
                            ? 'bg-emerald-500/80'
                            : day.percent > 0
                            ? 'bg-amber-500/75'
                            : 'bg-slate-300 dark:bg-neutral-700'
                        }`}
                        style={{ height: `${Math.max(8, day.percent)}%` }}
                        title={`${day.dateStr}: ${day.percent}% (${day.doneCount} полных, ${day.microCount} микро)`}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-mono ${
                        day.isToday
                          ? 'font-bold text-cyan-600 dark:text-cyan-400'
                          : 'text-slate-500 dark:text-neutral-400'
                      }`}
                    >
                      {day.shortLabel}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                <span>{isRu ? 'Зелёный — норма, Жёлтый — микро-шаг' : 'Green — full, Amber — micro-step'}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {isRu ? 'Без обнуления' : 'Zero-Reset'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT (6 COLS): 6 LIFE DIRECTIONS TELEMETRY ("UNDER THE HOOD" OF THE 9 LEVELS) */}
        <div className="lg:col-span-6 min-w-0 bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/90 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-neutral-800/80">
            <div className="flex items-center gap-2">
              <Activity size={17} className="text-cyan-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isRu ? 'Телеметрия 6 сфер жизни (Пульс ОС)' : '6 Life Directions Telemetry (OS Pulse)'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  {isRu ? 'Связь сегодняшних действий с целями из отдела «9 Уровней»' : 'Live link between daily execution and 9 Levels architecture'}
                </p>
              </div>
            </div>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('nine-levels')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Layers size={13} />
                <span>{isRu ? 'В «9 Уровней»' : '9 Levels'}</span>
                <ChevronRight size={13} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-auto">
            {directionsTelemetry.map((dir) => (
              <div
                key={dir.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/70 dark:border-neutral-800 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-800 dark:text-neutral-100 flex items-center gap-1.5 truncate">
                    <span style={{ color: dir.color }}>●</span>
                    <span className="truncate">{dir.displayName}</span>
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-neutral-300">
                    {dir.dailyPulsePercent}%
                  </span>
                </div>

                <div className="w-full h-1.5 bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(6, dir.dailyPulsePercent)}%`,
                      backgroundColor: dir.color,
                    }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-slate-500 dark:text-neutral-400">
                  <span>
                    {isRu ? 'Привычки:' : 'Habits:'} {dir.doneHabits}/{dir.habitsCount}
                  </span>
                  <span>
                    {isRu ? 'Задачи:' : 'Tasks:'} {dir.doneTasks}/{dir.tasksCount}
                  </span>
                  <span>
                    {isRu ? 'Цели:' : 'Goals:'} {dir.avgGoalProgress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          ROW 2: COMPACT OS COCKPIT BAR (CAUSAL CHAIN, WEEKLY FOCUS, EVENING RITUAL & SLIP RECOVERY)
          Visualizes the core mechanics without duplicating the heavy forms from Weekly/Levels tabs
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Weekly Focus & Causal Chain Quick View */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
              <span className="flex items-center gap-1 font-bold">
                <TrendingUp size={13} />
                {isRu ? `Фокус недели №${state.currentWeek.weekNumber}` : `Week #${state.currentWeek.weekNumber} Focus`}
              </span>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('weekly-board')}
                  className="hover:underline text-[10px]"
                >
                  {isRu ? 'Совет директоров →' : 'Weekly Board →'}
                </button>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-relaxed">
              «{state.currentWeek.primaryFocus}»
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenCausalChain}
            className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#141824] dark:hover:bg-neutral-800 text-xs font-semibold text-slate-700 dark:text-neutral-200 flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Compass size={13} className="text-indigo-500" />
              <span>{isRu ? 'Причинная цепь: Сон → Свобода' : 'Causal Chain: Sleep → Freedom'}</span>
            </span>
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Card 2: Evening Ritual (10-min shutdown) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Moon size={13} />
                {t('eveningRitualTitle')}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300">
                {state.todayLog.eveningReflection ? t('eveningRitualDone') : '22:30'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
              {isRu
                ? 'Закрытие дня за 3 минуты: фиксируем победы, выводы и главный якорь на завтра.'
                : '3-minute day shutdown: record wins, key lesson, and tomorrow anchor.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenEveningReflection}
            className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>{state.todayLog.eveningReflection ? t('editReflection') : t('launchEveningReview')}</span>
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Card 3: Anti-Slip Protocol (Resilience Station) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck size={13} />
                {t('resilienceStationTitle')}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {isRu ? 'Правило 2 дней' : '2-Day Rule'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
              {isRu
                ? 'Упал темп или случился срыв? Переключи систему на микро-шаг за 60 секунд без чувства вины.'
                : 'Lost momentum? Switch to a 60-second micro-action without guilt.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenSlipRecovery}
            className="mt-3 w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw size={13} />
            <span>{t('bounceBackBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
