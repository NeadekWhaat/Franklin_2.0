import React, { useState } from 'react';
import { useFranklin } from '../context/FranklinContext';
import { LIFE_DIRECTIONS } from '../config/franklinDefaults';
import { DayMode, LifeDirectionId, DailyTask, HabitDayStatus } from '../types/franklin';
import { ActiveTab } from './Navigation';
import { HabitTrackerMatrix } from './HabitTrackerMatrix';
import { ChronometerCalendarWidget } from './ChronometerCalendarWidget';
import { CommandCenterCharts } from './CommandCenterCharts';
import {
  Check,
  Plus,
  Trash2,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  Trophy,
  Flame,
  Zap,
  Clock,
  Bell,
  BellRing,
  CalendarPlus,
  Download,
  X,
  CheckCircle2,
  CheckSquare,
} from 'lucide-react';
import { GoogleWorkspaceHub } from './GoogleWorkspaceHub';
import { useGoogleWorkspace } from '../context/GoogleWorkspaceContext';
import {
  calculateEndTime,
  calculateDurationBetween,
  formatDurationLabel,
} from '../services/googleWorkspace';

interface CommandCenterProps {
  onOpenCausalChain: () => void;
  onOpenSlipRecovery: () => void;
  onOpenEveningReflection: () => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

/**
 * Generates a Google Calendar event template URL so the user can save the task
 * with push notifications to Android / iOS / Windows Desktop Chrome in 1 click.
 */
function buildGoogleCalendarUrl(task: DailyTask, fallbackDate: string): string {
  const dateStr = (task.reminderDate || task.scheduledDate || fallbackDate).replace(/-/g, '');
  const timeStr = task.reminderTime || '10:00';
  const [hh, mm] = timeStr.split(':').map((n) => parseInt(n, 10));
  const startH = Number.isFinite(hh) ? hh : 10;
  const startM = Number.isFinite(mm) ? mm : 0;

  const durationMinutes = task.estimatedMinutes || 30;
  const endTotalMinutes = startH * 60 + startM + durationMinutes;
  const endH = Math.floor(endTotalMinutes / 60) % 24;
  const endM = endTotalMinutes % 60;

  const startFormatted = `${dateStr}T${String(startH).padStart(2, '0')}${String(startM).padStart(2, '0')}00`;
  const endFormatted = `${dateStr}T${String(endH).padStart(2, '0')}${String(endM).padStart(2, '0')}00`;

  const title = `${task.isMainTask ? '⚡ [Якорь дня] ' : '🎯 '}${task.title}`;
  const details = `Задача из Личной ОС Франклин 2.0.\nМинимальный режим: ${task.minModeRequired}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startFormatted}/${endFormatted}`,
    details,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Downloads an .ics alarm file for native Windows Calendar / Outlook / Apple Calendar
 */
function downloadTaskIcs(task: DailyTask, fallbackDate: string) {
  const dateStr = (task.reminderDate || task.scheduledDate || fallbackDate).replace(/-/g, '');
  const timeStr = task.reminderTime || '10:00';
  const [hh, mm] = timeStr.split(':').map((n) => parseInt(n, 10));
  const startH = Number.isFinite(hh) ? hh : 10;
  const startM = Number.isFinite(mm) ? mm : 0;
  const endH = (startH + 1) % 24;

  const dtStart = `${dateStr}T${String(startH).padStart(2, '0')}${String(startM).padStart(2, '0')}00`;
  const dtEnd = `${dateStr}T${String(endH).padStart(2, '0')}${String(startM).padStart(2, '0')}00`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Franklin 2.0 Personal OS//RU',
    'BEGIN:VEVENT',
    `UID:${task.id}@franklin-os.local`,
    `DTSTAMP:${dtStart}Z`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${task.isMainTask ? '[Якорь дня] ' : ''}${task.title}`,
    'DESCRIPTION:Напоминание из Личной ОС Франклин 2.0',
    'BEGIN:VALARM',
    'TRIGGER:-PT5M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Напоминание Франклин 2.0',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `franklin-reminder-${task.id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  onOpenCausalChain,
  onOpenSlipRecovery,
  onOpenEveningReflection,
  onNavigateTab,
}) => {
  const {
    state,
    language,
    t,
    milestoneStats,
    setDayMode,
    setEnergyLevel,
    toggleHabit,
    setHabitStatusForDate,
    toggleTask,
    addTask,
    updateTask,
    deleteTask,
    clearCompletedTasks,
    setMainTask,
    activeReminderAlert,
    dismissReminderAlert,
    snoozeReminderAlert,
  } = useFranklin();

  const isRu = language === 'ru';
  const currentMode = state.todayLog.dayMode;
  const energyLevel = state.todayLog.energyLevel;
  const currentWeek = state.currentWeek;
  const todayTasks = state.todayLog.tasks;
  const completedHabitIds = state.todayLog.completedHabitIds;

  // Selected date in the mini-calendar (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(() => state.todayLog.date);

  // Mobile section filter ('all' shows everything, or filter to specific block to eliminate scrolling on phones)
  const [mobileSection, setMobileSection] = useState<'all' | 'tasks' | 'habits' | 'clock' | 'google' | 'charts'>('all');

  // Google Workspace integration
  const {
    isConnected: isGoogleConnected,
    syncTaskToCalendar,
    syncTaskToGoogleTasks,
    syncTaskToBothCalendarAndTasks,
  } = useGoogleWorkspace();
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const getDefaultSuggestedTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    const roundedM = now.getMinutes() < 30 ? '30' : '00';
    if (roundedM === '00') {
      now.setHours(now.getHours() + 1);
    }
    return `${String(now.getHours()).padStart(2, '0')}:${roundedM}`;
  };

  const handleSyncTaskToGoogleCalendar = async (task: DailyTask) => {
    const targetDate = task.scheduledDate || task.reminderDate || selectedDate || state.todayLog.date;
    const res = await syncTaskToCalendar(task, targetDate);
    if (res.success) {
      const timeLabel = task.reminderTime || getDefaultSuggestedTime();
      setSyncFeedback(
        isRu
          ? `«${task.title}» в Google Календаре (${targetDate} в ${timeLabel})!`
          : `Added to Google Calendar (${targetDate} at ${timeLabel})!`
      );
    } else {
      setSyncFeedback(res.error || (isRu ? 'Ошибка синхронизации' : 'Sync error'));
    }
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  const handleSyncTaskToGoogleTasks = async (task: DailyTask) => {
    const targetDate = task.scheduledDate || task.reminderDate || selectedDate || state.todayLog.date;
    const res = await syncTaskToGoogleTasks(task, targetDate);
    if (res.success) {
      const timeLabel = task.reminderTime || getDefaultSuggestedTime();
      setSyncFeedback(
        isRu
          ? `«${task.title}» в Google Tasks (${targetDate} в ${timeLabel})!`
          : `Added to Google Tasks (${targetDate} at ${timeLabel})!`
      );
    } else {
      setSyncFeedback(res.error || (isRu ? 'Ошибка синхронизации' : 'Sync error'));
    }
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  // Habits view mode: 'today' (interactive daily tracker) or 'matrix' (7-day matrix)
  const [habitsViewMode, setHabitsViewMode] = useState<'today' | 'matrix'>('today');

  // New task & reminder form state
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDirection, setNewTaskDirection] = useState<LifeDirectionId>('career');
  const [isMainTaskNew, setIsMainTaskNew] = useState(false);
  const [minModeNew, setMinModeNew] = useState<DayMode>('GREEN');
  const [newTaskReminderTime, setNewTaskReminderTime] = useState<string>(() => getDefaultSuggestedTime());
  const [newTaskEndTime, setNewTaskEndTime] = useState<string>(() =>
    calculateEndTime(getDefaultSuggestedTime(), 30)
  );
  const [isAllDayNew, setIsAllDayNew] = useState<boolean>(false);
  const [noAlarmNew, setNoAlarmNew] = useState<boolean>(false);
  const [newTaskScheduledDate, setNewTaskScheduledDate] = useState<string>(() => state.todayLog.date);
  // Multi-select checkboxes for Google Calendar and Google Tasks (if both checked -> syncs to both; if neither -> app only)
  const [syncToCalendar, setSyncToCalendar] = useState<boolean>(true);
  const [syncToTasks, setSyncToTasks] = useState<boolean>(true);

  const openAddTaskDrawer = (asAnchor = false) => {
    const freshStart = getDefaultSuggestedTime();
    setNewTaskReminderTime(freshStart);
    setNewTaskEndTime(calculateEndTime(freshStart, 30));
    setNewTaskScheduledDate(selectedDate || state.todayLog.date);
    if (asAnchor) {
      setIsMainTaskNew(true);
    }
    setShowAddTaskForm(true);
  };

  const handleStartTimeChange = (newStart: string) => {
    const currentDur = calculateDurationBetween(newTaskReminderTime, newTaskEndTime);
    setNewTaskReminderTime(newStart);
    setNewTaskEndTime(calculateEndTime(newStart, currentDur));
    setIsAllDayNew(false);
    setNoAlarmNew(false);
  };

  const calculatedDurationMinutes = isAllDayNew
    ? 720
    : noAlarmNew
    ? 30
    : calculateDurationBetween(newTaskReminderTime, newTaskEndTime);

  // Editing reminder inline for an existing task
  const [editingReminderTaskId, setEditingReminderTaskId] = useState<string | null>(null);
  // Collapsible completed tasks section at the bottom of the task manager
  const [showCompletedTasks, setShowCompletedTasks] = useState<boolean>(false);

  // Filter tasks based on day mode
  const visibleTasks = todayTasks.filter((task) => {
    if (task.isMainTask) return true;
    if (currentMode === 'GREEN') return true;
    if (currentMode === 'YELLOW') return task.minModeRequired === 'YELLOW' || task.minModeRequired === 'RED';
    if (currentMode === 'RED') return task.minModeRequired === 'RED';
    return true;
  });

  const activeVisibleTasks = visibleTasks.filter((task) => !task.completed);
  const completedTasksList = todayTasks.filter((task) => task.completed);
  const hiddenCount = todayTasks.filter((t) => !t.completed).length - activeVisibleTasks.length;

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const effectiveTime = noAlarmNew
      ? undefined
      : isAllDayNew
      ? '09:00'
      : newTaskReminderTime || getDefaultSuggestedTime();
    const effectiveDate = newTaskScheduledDate || selectedDate || state.todayLog.date;
    const effectiveDuration = calculatedDurationMinutes;
    const endTime = noAlarmNew
      ? undefined
      : isAllDayNew
      ? '21:00'
      : newTaskEndTime || (effectiveTime ? calculateEndTime(effectiveTime, effectiveDuration) : undefined);
    const durationText = formatDurationLabel(effectiveDuration, isRu, isAllDayNew);
    const timeSummary = noAlarmNew
      ? isRu
        ? 'Без будильника'
        : 'No alarm'
      : isAllDayNew
      ? isRu
        ? 'Весь день'
        : 'All day'
      : `${effectiveTime}–${endTime}, ${durationText}`;

    // Request notification permission automatically when user sets a reminder
    if (effectiveTime && !noAlarmNew && !isAllDayNew && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const createdTask = addTask({
      title: newTaskTitle.trim(),
      isMainTask: isMainTaskNew,
      minModeRequired: minModeNew,
      directionId: newTaskDirection,
      estimatedMinutes: effectiveDuration,
      reminderTime: effectiveTime,
      endTime,
      isAllDay: isAllDayNew,
      reminderDate: effectiveTime ? effectiveDate : undefined,
      scheduledDate: effectiveDate,
      reminderFired: noAlarmNew || isAllDayNew ? true : false,
    });

    const sendToCal = syncToCalendar;
    const sendToTasks = syncToTasks;

    const nextStart = getDefaultSuggestedTime();
    setNewTaskTitle('');
    setNewTaskReminderTime(nextStart);
    setNewTaskEndTime(calculateEndTime(nextStart, 30));
    setIsAllDayNew(false);
    setNoAlarmNew(false);
    setIsMainTaskNew(false);
    setSyncToCalendar(true);
    setSyncToTasks(true);
    setShowAddTaskForm(false);

    if (sendToCal && sendToTasks) {
      const res = await syncTaskToBothCalendarAndTasks(createdTask, effectiveDate);
      setSyncFeedback(
        res.success
          ? isRu
            ? `🚀 «${createdTask.title}» (${effectiveDate}, ${timeSummary}) создана и в Календаре, и в Tasks!`
            : `🚀 "${createdTask.title}" (${effectiveDate}, ${timeSummary}) synced to both Calendar & Tasks!`
          : res.error || (isRu ? 'Задача сохранена в приложении' : 'Saved in app')
      );
    } else if (sendToCal) {
      const res = await syncTaskToCalendar(createdTask, effectiveDate);
      setSyncFeedback(
        res.success
          ? isRu
            ? `📅 Событие «${createdTask.title}» (${effectiveDate}, ${timeSummary}) создано в Google Календаре!`
            : `📅 Event "${createdTask.title}" (${effectiveDate}, ${timeSummary}) created in Google Calendar!`
          : res.error || (isRu ? 'Задача сохранена в приложении (ошибка Google Календаря)' : 'Saved in app')
      );
    } else if (sendToTasks) {
      const res = await syncTaskToGoogleTasks(createdTask, effectiveDate);
      setSyncFeedback(
        res.success
          ? isRu
            ? `✅ Напоминание «${createdTask.title}» (${effectiveDate}, ${timeSummary}) создано в Google Tasks!`
            : `✅ Reminder "${createdTask.title}" (${effectiveDate}, ${timeSummary}) created in Google Tasks!`
          : res.error || (isRu ? 'Задача сохранена в приложении (ошибка Google Tasks)' : 'Saved in app')
      );
    } else {
      setSyncFeedback(
        isRu
          ? `⚡ Задача «${createdTask.title}» (${effectiveDate}, ${timeSummary}) сохранена в приложении!`
          : `⚡ Task "${createdTask.title}" saved in app!`
      );
    }
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  const handleQuickScheduleFromCalendar = (dateStr: string) => {
    setSelectedDate(dateStr);
    setNewTaskScheduledDate(dateStr);
    if (!newTaskReminderTime) {
      setNewTaskReminderTime(getDefaultSuggestedTime());
    }
    setShowAddTaskForm(true);
  };

  const getDirection = (id: LifeDirectionId) => {
    const dir = LIFE_DIRECTIONS.find((d) => d.id === id) || LIFE_DIRECTIONS[0];
    return {
      ...dir,
      displayName: isRu ? dir.nameRu : dir.name,
    };
  };

  const activeHabits = state.habits.filter((h) => h.active);
  const anchorTask = todayTasks.find((t) => t.isMainTask && !t.completed);
  const completedAnchorTask = todayTasks.find((t) => t.isMainTask && t.completed);

  const handleSetTaskReminder = async (taskId: string, timeVal: string) => {
    const cleanTime = timeVal.trim();
    if (cleanTime && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    const targetDate = selectedDate || state.todayLog.date;
    updateTask(taskId, {
      reminderTime: cleanTime || undefined,
      endTime: cleanTime ? calculateEndTime(cleanTime, 30) : undefined,
      isAllDay: false,
      reminderDate: cleanTime ? targetDate : undefined,
      scheduledDate: targetDate,
      reminderFired: cleanTime ? false : true,
    });
    setEditingReminderTaskId(null);

    // If connected to Google, also update/sync this task's time & date to Google Calendar & Google Tasks
    const existingTask = todayTasks.find((t) => t.id === taskId);
    if (existingTask && isGoogleConnected && timeVal) {
      const updatedTaskObj: DailyTask = {
        ...existingTask,
        reminderTime: timeVal,
        reminderDate: targetDate,
        scheduledDate: targetDate,
      };
      const res = await syncTaskToBothCalendarAndTasks(updatedTaskObj, targetDate);
      if (res.success) {
        setSyncFeedback(
          isRu
            ? `Время ${timeVal} (${targetDate}) обновлено в Google Календаре и Tasks!`
            : `Time ${timeVal} (${targetDate}) synced to Google Calendar & Tasks!`
        );
        setTimeout(() => setSyncFeedback(null), 3500);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 w-full max-w-full min-w-0 overflow-x-clip">
      {/* ─────────────────────────────────────────────────────────────────────────────
          FLOATING REMINDER ALERT BANNER (WHEN A REMINDER FIRES OR IS TESTED)
         ───────────────────────────────────────────────────────────────────────────── */}
      {activeReminderAlert && (
        <div className="fixed bottom-4 inset-x-3 sm:left-auto sm:right-5 z-50 sm:max-w-md bg-[#090d16] text-white border-2 border-cyan-400/80 rounded-2xl p-4 sm:p-5 shadow-2xl animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
                <BellRing size={18} className="animate-bounce" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 font-bold">
                  {isRu ? '⚡ СИГНАЛ НАПОМИНАНИЯ ФРАНКЛИН 2.0' : '⚡ FRANKLIN 2.0 REMINDER ALERT'}
                </div>
                <div className="text-sm font-bold text-white mt-0.5 leading-snug">
                  {activeReminderAlert.title}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissReminderAlert}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {activeReminderAlert.id !== 'test-reminder' && (
              <button
                type="button"
                onClick={() => {
                  toggleTask(activeReminderAlert.id);
                  dismissReminderAlert();
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Check size={13} className="stroke-[3]" />
                <span>{isRu ? 'Выполнено' : 'Mark Done'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => snoozeReminderAlert(10)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Clock size={12} />
              <span>{isRu ? 'Отложить на 10 мин' : 'Snooze 10m'}</span>
            </button>
            <button
              type="button"
              onClick={dismissReminderAlert}
              className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs font-medium ml-auto"
            >
              {isRu ? 'Закрыть' : 'Dismiss'}
            </button>
          </div>
        </div>
      )}

      {/* Sync Toast Feedback */}
      {syncFeedback && (
        <div className="fixed top-16 right-5 z-50 max-w-sm bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <Check size={14} className="stroke-[3]" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MOBILE QUICK SECTION SWITCHER (ELIMINATES SCROLL FATIGUE ON PHONES)
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <button
          type="button"
          onClick={() => setMobileSection('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            mobileSection === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
              : 'bg-white dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300'
          }`}
        >
          ⚡ {isRu ? 'Все блоки' : 'All'}
        </button>
        <button
          type="button"
          onClick={() => setMobileSection('tasks')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            mobileSection === 'tasks'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300'
          }`}
        >
          🎯 {isRu ? 'Задачи' : 'Tasks'} ({activeVisibleTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileSection('habits')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            mobileSection === 'habits'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300'
          }`}
        >
          💎 {isRu ? 'Привычки' : 'Habits'} ({completedHabitIds.length}/{activeHabits.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileSection('google')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            mobileSection === 'google'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300'
          }`}
        >
          🌐 Google {isGoogleConnected ? '✓' : ''}
        </button>
        <button
          type="button"
          onClick={() => setMobileSection('clock')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            mobileSection === 'clock'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
              : 'bg-white dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300'
          }`}
        >
          ⏱ {isRu ? 'Часы & Календарь' : 'Clock & Calendar'}
        </button>
        <button
          type="button"
          onClick={() => setMobileSection('charts')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            mobileSection === 'charts'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
              : 'bg-white dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300'
          }`}
        >
          📊 {isRu ? 'Графики OS' : 'OS Telemetry'}
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          1. COMPACT STATUS BAR: DAY MODE, VITAL ENERGY & STREAK
         ───────────────────────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#0e1118] border border-slate-200/80 dark:border-neutral-800/80 rounded-2xl p-4 sm:px-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Day Mode & Vital Energy */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
              {t('dayMode')}:
            </span>
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-neutral-800/90 border border-slate-200/60 dark:border-neutral-700/60">
              <button
                type="button"
                onClick={() => setDayMode('GREEN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  currentMode === 'GREEN'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                <span>{t('greenModeShort')}</span>
              </button>
              <button
                type="button"
                onClick={() => setDayMode('YELLOW')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  currentMode === 'YELLOW'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-200" />
                <span>{t('yellowModeShort')}</span>
              </button>
              <button
                type="button"
                onClick={() => setDayMode('RED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  currentMode === 'RED'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-200" />
                <span>{t('redModeShort')}</span>
              </button>
            </div>

            {/* Energy Dots */}
            <div className="flex items-center gap-1.5 sm:ml-2 pl-3 border-l border-slate-200 dark:border-neutral-800">
              <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                {t('todaysEnergy')}
              </span>
              <div className="flex gap-1">
                {([1, 2, 3, 4, 5] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setEnergyLevel(lvl)}
                    className={`w-5 h-5 rounded-md text-[10px] font-mono font-bold transition-all ${
                      energyLevel >= lvl
                        ? 'bg-amber-400 text-neutral-950 shadow-xs'
                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500 hover:bg-slate-200'
                    }`}
                    title={`${lvl} / 5`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Metrics & Link to Milestones */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-neutral-300">
              <Flame size={15} className="text-emerald-500" />
              <span>
                {isRu ? 'Зелёный стрик:' : 'Green streak:'}{' '}
                <strong className="text-slate-900 dark:text-white font-mono">
                  {milestoneStats.currentGreenStreak} дн.
                </strong>
              </span>
            </div>

            <span className="text-slate-300 dark:text-neutral-700">·</span>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('milestones')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-700/40 font-semibold hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
              >
                <Trophy size={13} className="text-amber-500" />
                <span>
                  {isRu ? 'Значки:' : 'Badges:'}{' '}
                  <span className="font-mono">
                    {milestoneStats.unlockedBadgesCount}/{milestoneStats.totalBadgesCount}
                  </span>
                </span>
                <ChevronRight size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Day Mode Advice Banner (Only when Yellow or Red) */}
        {currentMode === 'YELLOW' && (
          <div className="mt-3 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5 animate-fade-in">
            <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>{t('yellowModeBannerTitle')}</strong> {t('yellowModeBannerDesc')}
            </div>
          </div>
        )}
        {currentMode === 'RED' && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2.5 animate-fade-in">
            <AlertTriangle size={15} className="text-rose-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>{t('redModeBannerTitle')}</strong> {t('redModeBannerDesc')}
            </div>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. TOP ROW: 7-SEGMENT LED CHRONOMETER & INTERACTIVE MINI-CALENDAR
         ───────────────────────────────────────────────────────────────────────────── */}
      {(mobileSection === 'all' || mobileSection === 'clock') && (
        <ChronometerCalendarWidget
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onQuickScheduleTask={handleQuickScheduleFromCalendar}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          2.5. GOOGLE WORKSPACE SYNC HUB (CALENDAR & TASKS REAL-TIME)
         ───────────────────────────────────────────────────────────────────────────── */}
      {(mobileSection === 'all' || mobileSection === 'google') && (
        <GoogleWorkspaceHub isCompact={mobileSection === 'all'} />
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. MIDDLE ROW: SIDE-BY-SIDE TASK MANAGER WITH REMINDERS & HABIT TRACKER
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-w-0">
        {/* LEFT COLUMN (6 COLS): TASK & REMINDER MANAGER */}
        {(mobileSection === 'all' || mobileSection === 'tasks') && (
        <section className="col-span-1 lg:col-span-6 min-w-0 overflow-x-clip bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100 dark:border-neutral-800/80">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-bold">
                {isRu ? 'ЗАДАЧНИК + НАПОМИНАНИЯ (ПК И СМАРТФОН)' : 'TASKS & REMINDERS (PC & MOBILE)'}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
                <span>{isRu ? 'План действий и будильники задач' : 'Action Plan & Task Alarms'}</span>
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                if (showAddTaskForm) {
                  setShowAddTaskForm(false);
                } else {
                  openAddTaskDrawer(false);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold transition-colors shadow-xs shrink-0"
            >
              <Plus size={14} />
              <span>{t('addActionBtn')}</span>
            </button>
          </div>

          {/* Add Task + Reminder Drawer */}
          {showAddTaskForm && (
            <form
              onSubmit={handleCreateTask}
              className="p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 space-y-3.5 animate-fade-in"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-white font-mono uppercase">
                  {isRu ? 'Новая задача с напоминанием' : 'New Task with Reminder'}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-cyan-600 dark:text-cyan-400 bg-white dark:bg-[#0d1017] border border-slate-300 dark:border-neutral-700 rounded-lg px-2.5 py-1 shadow-2xs">
                  <span className="text-slate-500 dark:text-neutral-400 font-sans font-medium">
                    {isRu ? 'Дата:' : 'Date:'}
                  </span>
                  <input
                    type="date"
                    value={newTaskScheduledDate}
                    onChange={(e) => setNewTaskScheduledDate(e.target.value)}
                    className="bg-transparent text-cyan-700 dark:text-cyan-300 font-bold text-[11px] font-mono focus:outline-none cursor-pointer"
                    title={isRu ? 'Выберите дату задачи' : 'Select task date'}
                  />
                </span>
              </div>

              <input
                type="text"
                required
                placeholder={t('actionTitlePlaceholder')}
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#0d1017] border border-slate-300 dark:border-neutral-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />

              {/* Row 1: Direction & Minimum Mode (perfectly aligned h-5 labels + h-9 selects) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs items-end">
                <div className="flex flex-col">
                  <label className="h-5 flex items-center text-[11px] text-slate-500 dark:text-neutral-400 mb-1 truncate">
                    {t('directionLabel')}
                  </label>
                  <select
                    value={newTaskDirection}
                    onChange={(e) => setNewTaskDirection(e.target.value as LifeDirectionId)}
                    className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-[#0d1017] border border-slate-300 dark:border-neutral-700 text-slate-800 dark:text-white text-xs"
                  >
                    {LIFE_DIRECTIONS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {isRu ? d.nameRu : d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="h-5 flex items-center text-[11px] text-slate-500 dark:text-neutral-400 mb-1 truncate">
                    {t('minModeLabel')}
                  </label>
                  <select
                    value={minModeNew}
                    onChange={(e) => setMinModeNew(e.target.value as DayMode)}
                    className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-[#0d1017] border border-slate-300 dark:border-neutral-700 text-slate-800 dark:text-white text-xs"
                  >
                    <option value="GREEN">{t('greenOnly')}</option>
                    <option value="YELLOW">{t('retainInYellow')}</option>
                    <option value="RED">{t('retainInRed')}</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Start Time & End Time Picker + "Весь день" / "Без будильника" */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs items-end">
                <div className="flex flex-col">
                  <label className="h-5 flex items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-neutral-400 mb-1">
                    <span className="flex items-center gap-1 truncate">
                      <Bell size={11} className="text-cyan-500 shrink-0" />
                      <span className="truncate">{isRu ? 'Время начала:' : 'Start time:'}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500 shrink-0">
                      {noAlarmNew
                        ? isRu
                          ? 'Без звонка'
                          : 'No alarm'
                        : isAllDayNew
                        ? '09:00'
                        : isRu
                        ? 'Звук + ПК'
                        : 'Alarm'}
                    </span>
                  </label>
                  <input
                    type="time"
                    value={newTaskReminderTime}
                    disabled={isAllDayNew || noAlarmNew}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className={`w-full h-9 px-2.5 rounded-lg bg-white dark:bg-[#0d1017] border border-slate-300 dark:border-neutral-700 text-slate-800 dark:text-white text-xs font-mono ${
                      isAllDayNew || noAlarmNew ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="h-5 flex items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-neutral-400 mb-1">
                    <span className="flex items-center gap-1 truncate">
                      <Clock size={11} className="text-cyan-500 shrink-0" />
                      <span className="truncate">{isRu ? 'Время окончания:' : 'End time:'}</span>
                    </span>
                    <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold shrink-0">
                      {noAlarmNew
                        ? isRu
                          ? '🔕 Без будильника'
                          : '🔕 No alarm'
                        : isAllDayNew
                        ? isRu
                          ? '☀️ Весь день'
                          : '☀️ All day'
                        : `⏱ ${formatDurationLabel(calculatedDurationMinutes, isRu)}`}
                    </span>
                  </label>
                  <div className="flex items-center gap-1.5 h-9">
                    <input
                      type="time"
                      value={newTaskEndTime}
                      disabled={isAllDayNew || noAlarmNew}
                      onChange={(e) => {
                        setIsAllDayNew(false);
                        setNoAlarmNew(false);
                        setNewTaskEndTime(e.target.value);
                      }}
                      className={`flex-1 min-w-0 h-9 px-2.5 rounded-lg bg-white dark:bg-[#0d1017] border border-slate-300 dark:border-neutral-700 text-slate-800 dark:text-white text-xs font-mono ${
                        isAllDayNew || noAlarmNew ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsAllDayNew((v) => {
                          const next = !v;
                          if (next) setNoAlarmNew(false);
                          return next;
                        });
                      }}
                      className={`h-9 px-2 rounded-lg border text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 ${
                        isAllDayNew
                          ? 'bg-amber-500 text-neutral-950 border-amber-500 font-bold shadow-xs'
                          : 'bg-white dark:bg-[#0d1017] text-slate-700 dark:text-neutral-300 border-slate-300 dark:border-neutral-700 hover:border-amber-400'
                      }`}
                      title={isRu ? 'Задача займёт весь день (без звукового сигнала)' : 'All-day task'}
                    >
                      <span>☀️</span>
                      <span>{isRu ? 'Весь день' : 'All day'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNoAlarmNew((v) => {
                          const next = !v;
                          if (next) setIsAllDayNew(false);
                          return next;
                        });
                      }}
                      className={`h-9 px-2 rounded-lg border text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 ${
                        noAlarmNew
                          ? 'bg-slate-800 dark:bg-white text-white dark:text-neutral-950 border-slate-800 dark:border-white font-bold shadow-xs'
                          : 'bg-white dark:bg-[#0d1017] text-slate-600 dark:text-neutral-400 border-slate-300 dark:border-neutral-700 hover:border-slate-400'
                      }`}
                      title={isRu ? 'Без звукового будильника' : 'No alarm'}
                    >
                      <span>🔕</span>
                      <span className="hidden sm:inline">{isRu ? 'Без звонка' : 'Silent'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Google Destination Selector (3 compact, native buttons with checkboxes and icons) */}
              <div className="pt-1 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-neutral-300">
                    {isRu ? 'Куда отправить задачу:' : 'Where to send task:'}
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300">
                    {syncToCalendar && syncToTasks
                      ? isRu
                        ? '✓ Календарь + ✓ Задача'
                        : '✓ Calendar + ✓ Task'
                      : syncToCalendar
                      ? isRu
                        ? '✓ Только Google Календарь'
                        : '✓ Google Calendar'
                      : syncToTasks
                      ? isRu
                        ? '✓ Только Google Tasks'
                        : '✓ Google Tasks'
                      : isRu
                      ? '⚡ Локально в приложении'
                      : '⚡ App only'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Option 1: Календарь */}
                  <button
                    type="button"
                    onClick={() => setSyncToCalendar((v) => !v)}
                    className={`h-10 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between gap-2 ${
                      syncToCalendar
                        ? 'bg-blue-600/12 dark:bg-blue-500/20 text-blue-700 dark:text-blue-200 border-blue-500 dark:border-blue-400 shadow-2xs'
                        : 'bg-white dark:bg-[#0d1017] text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-800 hover:border-blue-400/60 hover:text-slate-900 dark:hover:text-neutral-200'
                    }`}
                    title={isRu ? 'Отправить событие в Google Календарь' : 'Send event to Google Calendar'}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                          syncToCalendar
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 dark:border-neutral-600 bg-transparent'
                        }`}
                      >
                        {syncToCalendar && <Check size={11} className="stroke-[3]" />}
                      </span>
                      <span className="whitespace-nowrap font-bold">{isRu ? 'Календарь' : 'Calendar'}</span>
                    </span>
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        syncToCalendar
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-neutral-800 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      <CalendarPlus size={13} />
                    </span>
                  </button>

                  {/* Option 2: Задача */}
                  <button
                    type="button"
                    onClick={() => setSyncToTasks((v) => !v)}
                    className={`h-10 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between gap-2 ${
                      syncToTasks
                        ? 'bg-emerald-600/12 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-200 border-emerald-500 dark:border-emerald-400 shadow-2xs'
                        : 'bg-white dark:bg-[#0d1017] text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-800 hover:border-emerald-400/60 hover:text-slate-900 dark:hover:text-neutral-200'
                    }`}
                    title={isRu ? 'Отправить задачу в Google Tasks' : 'Send task to Google Tasks'}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                          syncToTasks
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-neutral-600 bg-transparent'
                        }`}
                      >
                        {syncToTasks && <Check size={11} className="stroke-[3]" />}
                      </span>
                      <span className="whitespace-nowrap font-bold">{isRu ? 'Задача' : 'Task'}</span>
                    </span>
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        syncToTasks
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      <CheckSquare size={13} />
                    </span>
                  </button>

                  {/* Option 3: Native Franklin Local Mode ("В приложение") */}
                  <button
                    type="button"
                    onClick={() => {
                      setSyncToCalendar(false);
                      setSyncToTasks(false);
                    }}
                    className={`h-10 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between gap-2 ${
                      !syncToCalendar && !syncToTasks
                        ? 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500 dark:border-amber-400 shadow-2xs'
                        : 'bg-white dark:bg-[#0d1017] text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-800 hover:border-amber-400/60 hover:text-slate-900 dark:hover:text-neutral-200'
                    }`}
                    title={
                      isRu
                        ? 'Сохранить локально внутри приложения Франклин (без отправки в Google)'
                        : 'Save locally inside Franklin app only'
                    }
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                          !syncToCalendar && !syncToTasks
                            ? 'bg-amber-500 border-amber-500 text-neutral-950'
                            : 'border-slate-300 dark:border-neutral-600 bg-transparent'
                        }`}
                      >
                        {!syncToCalendar && !syncToTasks && <Check size={10} className="stroke-[3]" />}
                      </span>
                      <span className="whitespace-nowrap font-bold">
                        {isRu ? 'В приложении' : 'In App'}
                      </span>
                    </span>
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 font-serif font-black text-xs ${
                        !syncToCalendar && !syncToTasks
                          ? 'bg-amber-500 text-neutral-950'
                          : 'bg-slate-100 dark:bg-neutral-800 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      F
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={isMainTaskNew}
                    onChange={(e) => setIsMainTaskNew(e.target.checked)}
                    className="rounded accent-amber-500"
                  />
                  <span className="font-medium">{t('setAsAnchor')}</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTaskForm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-800"
                  >
                    {t('cancelBtn')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold transition-colors"
                  >
                    {t('saveActionBtn')}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* MAIN ANCHOR TASK HERO CARD */}
          {anchorTask ? (
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                anchorTask.completed
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/50'
                  : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-700/60 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleTask(anchorTask.id)}
                    className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                      anchorTask.completed
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'border-2 border-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                    }`}
                  >
                    {anchorTask.completed && <Check size={14} className="stroke-[3]" />}
                  </button>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400">
                        {t('mainAnchorTaskTitle')}
                      </span>
                      <span className="text-slate-400 dark:text-neutral-500">·</span>
                      <span className="text-[11px] text-slate-600 dark:text-neutral-300 font-medium">
                        {getDirection(anchorTask.directionId).displayName}
                      </span>
                      <span className="text-slate-400 dark:text-neutral-500">·</span>
                      <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
                        📅 {anchorTask.scheduledDate || state.todayLog.date}
                      </span>
                      <span className="text-[11px] font-mono text-amber-700 dark:text-amber-300">
                        {anchorTask.isAllDay
                          ? isRu
                            ? '☀️ Весь день'
                            : '☀️ All day'
                          : `⏱ ${formatDurationLabel(anchorTask.estimatedMinutes || 30, isRu)}`}
                      </span>
                    </div>

                    <div
                      className={`text-sm sm:text-base font-bold leading-snug ${
                        anchorTask.completed
                          ? 'text-emerald-900 dark:text-emerald-200 line-through opacity-80'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {anchorTask.title}
                    </div>

                    {/* Reminder & Calendar Sync Controls for Anchor Task */}
                    <div className="flex flex-wrap items-center gap-2 pt-1.5">
                      {editingReminderTaskId === anchorTask.id ? (
                        <div className="inline-flex items-center gap-1.5 bg-white dark:bg-neutral-900 px-2 py-1 rounded-lg border border-cyan-500">
                          <input
                            type="time"
                            defaultValue={anchorTask.reminderTime || getDefaultSuggestedTime()}
                            onBlur={(e) => handleSetTaskReminder(anchorTask.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSetTaskReminder(anchorTask.id, (e.target as HTMLInputElement).value);
                              }
                            }}
                            autoFocus
                            className="text-xs font-mono bg-transparent text-slate-900 dark:text-white focus:outline-none"
                          />
                          {anchorTask.reminderTime && (
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSetTaskReminder(anchorTask.id, '');
                              }}
                              className="text-[10px] font-mono text-rose-500 hover:text-rose-400 px-1"
                              title={isRu ? 'Отключить будильник' : 'Disable alarm'}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingReminderTaskId(anchorTask.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-colors ${
                            anchorTask.reminderTime
                              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-700 dark:text-cyan-300'
                              : 'bg-white/80 dark:bg-neutral-900/70 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:border-cyan-400'
                          }`}
                        >
                          <Bell size={11} />
                          <span>
                            {anchorTask.isAllDay
                              ? isRu
                                ? '☀️ Весь день'
                                : '☀️ All day'
                              : anchorTask.reminderTime
                              ? `${anchorTask.reminderTime}–${
                                  anchorTask.endTime ||
                                  calculateEndTime(anchorTask.reminderTime, anchorTask.estimatedMinutes || 30)
                                }`
                              : isRu
                              ? '+ Будильник'
                              : '+ Reminder'}
                          </span>
                        </button>
                      )}

                      {/* Google Calendar Direct Sync / 1-Click Link */}
                      <button
                        type="button"
                        onClick={() => handleSyncTaskToGoogleCalendar(anchorTask)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-colors ${
                          anchorTask.googleCalendarEventId
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-white/80 dark:bg-neutral-900/70 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-300'
                        }`}
                        title={isRu ? 'Синхронизировать с Google Календарём' : 'Sync to Google Calendar'}
                      >
                        <CalendarPlus size={11} className={anchorTask.googleCalendarEventId ? 'text-emerald-500' : 'text-blue-500'} />
                        <span>
                          {anchorTask.googleCalendarEventId
                            ? isRu
                              ? '✓ В Календаре'
                              : '✓ In Calendar'
                            : isRu
                            ? 'В Google Календарь'
                            : 'Google Calendar'}
                        </span>
                      </button>

                      {/* Google Tasks Direct Sync */}
                      <button
                        type="button"
                        onClick={() => handleSyncTaskToGoogleTasks(anchorTask)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-colors ${
                          anchorTask.googleTaskId
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-white/80 dark:bg-neutral-900/70 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-300'
                        }`}
                        title={isRu ? 'Синхронизировать с Google Tasks' : 'Sync to Google Tasks'}
                      >
                        <CheckSquare size={11} className={anchorTask.googleTaskId ? 'text-emerald-500' : 'text-blue-500'} />
                        <span>
                          {anchorTask.googleTaskId
                            ? isRu
                              ? '✓ В Tasks'
                              : '✓ In Tasks'
                            : isRu
                            ? 'В Google Tasks'
                            : 'Google Tasks'}
                        </span>
                      </button>

                      {/* .ICS Download for Windows Calendar / Outlook */}
                      <button
                        type="button"
                        onClick={() => downloadTaskIcs(anchorTask, state.todayLog.date)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono bg-white/80 dark:bg-neutral-900/70 border border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        title={isRu ? 'Скачать .ics будильник для календаря Windows / Телефона' : 'Download .ics file'}
                      >
                        <Download size={11} />
                        <span>.ics</span>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteTask(anchorTask.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                  title={isRu ? 'Удалить' : 'Delete'}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ) : completedAnchorTask ? (
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check size={12} className="stroke-[3]" />
                </span>
                <span className="truncate">
                  {isRu ? 'Якорь дня выполнен и перенесён в список выполненных:' : 'Anchor task completed:'}{' '}
                  <strong className="font-semibold">{completedAnchorTask.title}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => openAddTaskDrawer(true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-800 dark:text-emerald-200 font-semibold text-[11px] shrink-0 transition-colors"
              >
                + {isRu ? 'Новый якорь' : 'New Anchor'}
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-amber-300 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-950/10 text-xs text-slate-600 dark:text-neutral-300 flex items-center justify-between">
              <span>
                {isRu
                  ? 'Главная задача дня не выбрана. Назначьте одну задачу якорем.'
                  : 'No anchor task assigned yet.'}
              </span>
              <button
                type="button"
                onClick={() => openAddTaskDrawer(true)}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shrink-0"
              >
                + {isRu ? 'Назначить якорь' : 'Set Anchor'}
              </button>
            </div>
          )}

          {/* ACTIVE SECONDARY TASKS LIST WITH INLINE REMINDERS & GOOGLE CALENDAR */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
              <span className="font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider font-mono text-[11px]">
                {t('secondaryActionsTitle')} ({activeVisibleTasks.filter((t) => !t.isMainTask).length})
              </span>
              {hiddenCount > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-mono text-[11px]">
                  {isRu
                    ? `Скрыто ${hiddenCount} в режиме ${currentMode}`
                    : `${hiddenCount} hidden in ${currentMode}`}
                </span>
              )}
            </div>

            {activeVisibleTasks.filter((t) => !t.isMainTask).length === 0 ? (
              <div className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-neutral-800 text-center text-xs text-slate-400 dark:text-neutral-500">
                {completedTasksList.length > 0
                  ? isRu
                    ? '🎉 Все текущие задачи выполнены! Отличная работа.'
                    : '🎉 All active tasks completed! Great job.'
                  : isRu
                  ? 'Нет активных второстепенных задач.'
                  : 'No active secondary tasks.'}
              </div>
            ) : (
              <div className="space-y-2">
                {activeVisibleTasks
                  .filter((t) => !t.isMainTask)
                  .map((task) => {
                    const dir = getDirection(task.directionId);
                    return (
                      <div
                        key={task.id}
                        className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors bg-white dark:bg-[#141824] border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700"
                      >
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleTask(task.id)}
                            className="mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 border border-slate-300 dark:border-neutral-700 hover:border-emerald-500"
                            title={isRu ? 'Отметить выполненной' : 'Mark completed'}
                          >
                            {task.completed && <Check size={11} className="stroke-[3]" />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold leading-snug text-slate-800 dark:text-neutral-100">
                              {task.title}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                              <span style={{ color: dir.color }}>● {dir.displayName}</span>
                              <span className="text-cyan-600 dark:text-cyan-400">
                                📅 {task.scheduledDate || state.todayLog.date}
                              </span>
                              {task.isAllDay ? (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  ☀️ {isRu ? 'Весь день' : 'All day'}
                                </span>
                              ) : (
                                <>
                                  {task.reminderTime && (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                      ⏰ {task.reminderTime}–
                                      {task.endTime ||
                                        calculateEndTime(task.reminderTime, task.estimatedMinutes || 30)}
                                    </span>
                                  )}
                                  <span className="text-slate-500 dark:text-neutral-400">
                                    ⏱ {formatDurationLabel(task.estimatedMinutes || 30, isRu)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Task Reminder & Calendar Actions */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {editingReminderTaskId === task.id ? (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 border border-cyan-500">
                              <input
                                type="time"
                                defaultValue={task.reminderTime || getDefaultSuggestedTime()}
                                onBlur={(e) => handleSetTaskReminder(task.id, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSetTaskReminder(task.id, (e.target as HTMLInputElement).value);
                                  }
                                }}
                                autoFocus
                                className="text-[11px] font-mono bg-transparent text-slate-900 dark:text-white focus:outline-none"
                              />
                              {task.reminderTime && (
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSetTaskReminder(task.id, '');
                                  }}
                                  className="text-[10px] font-mono text-rose-500 hover:text-rose-400 px-0.5"
                                  title={isRu ? 'Отключить будильник' : 'Disable alarm'}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingReminderTaskId(task.id)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 border transition-colors ${
                                task.reminderTime
                                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600 dark:text-cyan-300 font-bold'
                                  : 'border-transparent text-slate-400 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-neutral-800'
                              }`}
                              title={isRu ? 'Установить звуковое напоминание' : 'Set reminder time'}
                            >
                              <Bell size={11} />
                              <span>
                                {task.isAllDay
                                  ? isRu
                                    ? 'Весь день'
                                    : 'All day'
                                  : task.reminderTime
                                  ? `${task.reminderTime}–${
                                      task.endTime ||
                                      calculateEndTime(task.reminderTime, task.estimatedMinutes || 30)
                                    }`
                                  : isRu
                                  ? 'Время'
                                  : 'Alarm'}
                              </span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleSyncTaskToGoogleCalendar(task)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              task.googleCalendarEventId
                                ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10'
                                : 'text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-neutral-800'
                            }`}
                            title={isRu ? 'Синхронизировать с Google Календарём' : 'Sync to Google Calendar'}
                          >
                            <CalendarPlus size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSyncTaskToGoogleTasks(task)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              task.googleTaskId
                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                                : 'text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-neutral-800'
                            }`}
                            title={isRu ? 'Синхронизировать с Google Tasks' : 'Sync to Google Tasks'}
                          >
                            <CheckSquare size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setMainTask(task.id)}
                            className="text-[10px] font-mono text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 px-1.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                            title={t('setAsAnchor')}
                          >
                            {isRu ? 'В якорь' : 'Anchor'}
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteTask(task.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded"
                            title={isRu ? 'Удалить' : 'Delete'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* COLLAPSIBLE COMPLETED TASKS DRAWER (PRESERVES STATISTICS) */}
          {completedTasksList.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-neutral-800/80">
              <button
                type="button"
                onClick={() => setShowCompletedTasks((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-neutral-900/60 dark:hover:bg-neutral-800/70 border border-slate-200/80 dark:border-neutral-800 text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono text-[10px] font-bold">
                    ✓
                  </span>
                  <span className="font-mono font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-neutral-300">
                    {isRu ? 'Выполненные задачи' : 'Completed Tasks'} ({completedTasksList.length})
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 hidden sm:inline">
                    · {isRu ? 'учтены в статистике' : 'counted in stats'}
                  </span>
                </div>
                <ChevronRight
                  size={14}
                  className={`text-slate-400 transition-transform duration-200 ${
                    showCompletedTasks ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {showCompletedTasks && (
                <div className="mt-2 space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between px-1 pb-1">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                      {isRu
                        ? 'Выполненные задачи автоматически уходят в архив в 00:00 и не возвращаются на следующий день'
                        : 'Completed tasks automatically archive at midnight'}
                    </span>
                    <button
                      type="button"
                      onClick={clearCompletedTasks}
                      className="px-2.5 py-1 rounded-lg bg-slate-200/70 hover:bg-slate-300/70 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[10px] font-mono font-semibold text-slate-700 dark:text-neutral-300 shrink-0 transition-colors"
                      title={isRu ? 'Перенести выполненные задачи в архив дня прямо сейчас' : 'Archive completed tasks now'}
                    >
                      {isRu ? 'В архив (очистить список)' : 'Archive completed'}
                    </button>
                  </div>
                  {completedTasksList.map((task) => {
                    const dir = getDirection(task.directionId);
                    return (
                      <div
                        key={task.id}
                        className="p-2.5 rounded-xl border bg-slate-50/80 dark:bg-neutral-900/40 border-slate-200/80 dark:border-neutral-800/80 flex items-center justify-between gap-2.5 opacity-80 hover:opacity-100 transition-opacity"
                      >
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleTask(task.id)}
                            className="mt-0.5 w-4 h-4 rounded flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shrink-0"
                            title={isRu ? 'Вернуть в текущие задачи' : 'Restore to active tasks'}
                          >
                            <Check size={11} className="stroke-[3]" />
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium leading-snug line-through text-slate-400 dark:text-neutral-500 flex items-center gap-1.5 flex-wrap">
                              {task.isMainTask && (
                                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 no-underline">
                                  {isRu ? 'Якорь' : 'Anchor'}
                                </span>
                              )}
                              <span>{task.title}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                              <span style={{ color: dir.color }}>● {dir.displayName}</span>
                              <span>📅 {task.scheduledDate || state.todayLog.date}</span>
                              {task.isAllDay ? (
                                <span>☀️ {isRu ? 'Весь день' : 'All day'}</span>
                              ) : (
                                task.reminderTime && (
                                  <span>
                                    ⏰ {task.reminderTime}–
                                    {task.endTime ||
                                      calculateEndTime(task.reminderTime, task.estimatedMinutes || 30)}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded shrink-0"
                          title={isRu ? 'Удалить навсегда' : 'Delete permanently'}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
        )}

        {/* RIGHT COLUMN (6 COLS): INTERACTIVE HABIT TRACKER */}
        {(mobileSection === 'all' || mobileSection === 'habits') && (
        <section className="col-span-1 lg:col-span-6 min-w-0 overflow-x-clip bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-100 dark:border-neutral-800/80">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                {isRu ? 'ТРЕКЕР ПРИВЫЧЕК (БЕЗ ОБНУЛЕНИЯ)' : 'HABIT TRACKER (ZERO-RESET)'}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
                <span>{t('activeHabitsTitle')}</span>
                <span className="text-xs font-mono font-normal text-slate-500 dark:text-neutral-400">
                  ({completedHabitIds.length}/{activeHabits.length})
                </span>
              </h2>
            </div>

            {/* View Switcher: Daily Cards vs Weekly Matrix */}
            <div className="inline-flex p-0.5 rounded-xl bg-slate-100 dark:bg-neutral-800 border border-slate-200/60 dark:border-neutral-700/60 text-xs">
              <button
                type="button"
                onClick={() => setHabitsViewMode('today')}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  habitsViewMode === 'today'
                    ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400'
                }`}
              >
                {isRu ? 'Сегодня' : 'Today'}
              </button>
              <button
                type="button"
                onClick={() => setHabitsViewMode('matrix')}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  habitsViewMode === 'matrix'
                    ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400'
                }`}
              >
                {isRu ? 'Матрица недели' : 'Weekly Matrix'}
              </button>
            </div>
          </div>

          {habitsViewMode === 'today' ? (
            <div className="space-y-2.5">
              {activeHabits.map((habit) => {
                const todayStatus: HabitDayStatus =
                  state.habitWeeklyRecords?.[state.todayLog.date]?.[habit.id] ||
                  (completedHabitIds.includes(habit.id) ? 'done' : 'none');
                const isDone = todayStatus === 'done' || todayStatus === 'micro';
                const dir = getDirection(habit.directionId);
                const isFocus = habit.id === currentWeek.primaryHabitId;

                return (
                  <div
                    key={habit.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      todayStatus === 'done'
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/40'
                        : todayStatus === 'micro'
                        ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/40'
                        : 'bg-white dark:bg-[#141824] border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div
                      onClick={() => toggleHabit(habit.id)}
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                          todayStatus === 'done'
                            ? 'bg-emerald-600 text-white'
                            : todayStatus === 'micro'
                            ? 'bg-amber-500 text-neutral-950'
                            : 'border border-slate-300 dark:border-neutral-700'
                        }`}
                      >
                        {isDone && <Check size={13} className="stroke-[3]" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-neutral-400 font-mono">
                          <span style={{ color: dir.color }} className="font-bold">
                            ●
                          </span>
                          <span>{dir.displayName}</span>
                          {isFocus && (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                              · #{isRu ? '1 Фокус недели' : '1 Weekly Focus'}
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-xs sm:text-sm font-semibold truncate ${
                            isDone ? 'line-through text-slate-500 dark:text-neutral-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {habit.title}
                        </div>
                        {habit.microVersion && (
                          <div className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                            <span className="font-mono text-amber-600 dark:text-amber-400">
                              {t('microFallback')}
                            </span>{' '}
                            {habit.microVersion}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Status Buttons: Full vs Micro-Step */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setHabitStatusForDate(
                            state.todayLog.date,
                            habit.id,
                            todayStatus === 'micro' ? 'none' : 'micro'
                          )
                        }
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono font-semibold border transition-colors ${
                          todayStatus === 'micro'
                            ? 'bg-amber-500 text-neutral-950 border-amber-500'
                            : 'border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:border-amber-400 hover:text-amber-500'
                        }`}
                        title={isRu ? 'Засчитать микро-версию (сохраняет стрик в тяжёлый день)' : 'Count Micro-version'}
                      >
                        {isRu ? 'Микро' : 'Micro'}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleHabit(habit.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors ${
                          todayStatus === 'done'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-emerald-500 hover:text-white'
                        }`}
                      >
                        {todayStatus === 'done' ? '✓' : isRu ? 'Готово' : 'Done'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="pt-1">
              <HabitTrackerMatrix />
            </div>
          )}
        </section>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. BOTTOM ROW: VISUAL PROGRESS CHARTS & UNDER-THE-HOOD OS TELEMETRY
         ───────────────────────────────────────────────────────────────────────────── */}
      {(mobileSection === 'all' || mobileSection === 'charts') && (
        <CommandCenterCharts
          onOpenCausalChain={onOpenCausalChain}
          onOpenSlipRecovery={onOpenSlipRecovery}
          onOpenEveningReflection={onOpenEveningReflection}
          onNavigateTab={onNavigateTab}
        />
      )}
    </div>
  );
};
