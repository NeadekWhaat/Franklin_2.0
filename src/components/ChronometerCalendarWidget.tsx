import React, { useState, useEffect, useMemo } from 'react';
import { useFranklin } from '../context/FranklinContext';
import {
  Bell,
  BellRing,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Calendar as CalendarIcon,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useGoogleWorkspace } from '../context/GoogleWorkspaceContext';

type LedColorTheme = 'cyan' | 'emerald' | 'amber' | 'rose';

const LED_THEMES: Record<
  LedColorTheme,
  {
    nameRu: string;
    nameEn: string;
    activeFill: string;
    activeFillLight: string;
    glowFilter: string;
    glowFilterLight: string;
    dimFill: string;
    dimFillLight: string;
    badgeBg: string;
    badgeText: string;
    dotClass: string;
  }
> = {
  cyan: {
    nameRu: 'Голубой неон',
    nameEn: 'Ice Cyan',
    activeFill: '#22d3ee',
    activeFillLight: '#0891b2',
    glowFilter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.85)) drop-shadow(0 0 18px rgba(6, 182, 212, 0.45))',
    glowFilterLight: 'drop-shadow(0 0 6px rgba(8, 145, 178, 0.35))',
    dimFill: 'rgba(34, 211, 238, 0.08)',
    dimFillLight: 'rgba(8, 145, 178, 0.09)',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-500/15 border-cyan-200 dark:border-cyan-500/40',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    dotClass: 'bg-cyan-500 dark:bg-cyan-400',
  },
  emerald: {
    nameRu: 'Изумруд',
    nameEn: 'Emerald',
    activeFill: '#34d399',
    activeFillLight: '#059669',
    glowFilter: 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.85)) drop-shadow(0 0 18px rgba(16, 185, 129, 0.45))',
    glowFilterLight: 'drop-shadow(0 0 6px rgba(5, 150, 105, 0.35))',
    dimFill: 'rgba(52, 211, 153, 0.08)',
    dimFillLight: 'rgba(5, 150, 105, 0.09)',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    dotClass: 'bg-emerald-500 dark:bg-emerald-400',
  },
  amber: {
    nameRu: 'Янтарь',
    nameEn: 'Amber Gold',
    activeFill: '#fbbf24',
    activeFillLight: '#d97706',
    glowFilter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.85)) drop-shadow(0 0 18px rgba(245, 158, 11, 0.45))',
    glowFilterLight: 'drop-shadow(0 0 6px rgba(217, 119, 6, 0.35))',
    dimFill: 'rgba(251, 191, 36, 0.08)',
    dimFillLight: 'rgba(217, 119, 6, 0.09)',
    badgeBg: 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    dotClass: 'bg-amber-500 dark:bg-amber-400',
  },
  rose: {
    nameRu: 'Рубин',
    nameEn: 'Ruby Red',
    activeFill: '#fb7185',
    activeFillLight: '#e11d48',
    glowFilter: 'drop-shadow(0 0 8px rgba(251, 113, 133, 0.85)) drop-shadow(0 0 18px rgba(244, 63, 94, 0.45))',
    glowFilterLight: 'drop-shadow(0 0 6px rgba(225, 29, 72, 0.35))',
    dimFill: 'rgba(251, 113, 133, 0.08)',
    dimFillLight: 'rgba(225, 29, 72, 0.09)',
    badgeBg: 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/40',
    badgeText: 'text-rose-700 dark:text-rose-300',
    dotClass: 'bg-rose-500 dark:bg-rose-400',
  },
};

// 7-segment digit map: [A (top), B (top-right), C (bottom-right), D (bottom), E (bottom-left), F (top-left), G (middle)]
const DIGIT_SEGMENTS: Record<string, [number, number, number, number, number, number, number]> = {
  '0': [1, 1, 1, 1, 1, 1, 0],
  '1': [0, 1, 1, 0, 0, 0, 0],
  '2': [1, 1, 0, 1, 1, 0, 1],
  '3': [1, 1, 1, 1, 0, 0, 1],
  '4': [0, 1, 1, 0, 0, 1, 1],
  '5': [1, 0, 1, 1, 0, 1, 1],
  '6': [1, 0, 1, 1, 1, 1, 1],
  '7': [1, 1, 1, 0, 0, 0, 0],
  '8': [1, 1, 1, 1, 1, 1, 1],
  '9': [1, 1, 1, 1, 0, 1, 1],
};

interface SevenSegmentDigitProps {
  char: string;
  activeFill: string;
  dimFill: string;
  glowFilter: string;
  size?: 'main' | 'seconds';
}

const SevenSegmentDigit: React.FC<SevenSegmentDigitProps> = ({
  char,
  activeFill,
  dimFill,
  glowFilter,
  size = 'main',
}) => {
  const segs = DIGIT_SEGMENTS[char] || [0, 0, 0, 0, 0, 0, 0];

  // Classic chamfered 7-segment polygon coordinates on a 60x104 viewBox
  const polygons = [
    // A: top horizontal
    '12,6 48,6 43,13 17,13',
    // B: top-right vertical
    '50,8 54,12 51,47 46,50 43,45 45,15',
    // C: bottom-right vertical
    '46,54 50,58 47,93 42,96 39,90 41,59',
    // D: bottom horizontal
    '14,91 40,91 44,98 8,98',
    // E: bottom-left vertical
    '11,54 15,59 13,89 7,95 4,91 7,58',
    // F: top-left vertical
    '14,8 19,15 17,45 12,50 9,46 11,12',
    // G: middle horizontal
    '15,48 43,48 46,52 42,56 14,56 11,52',
  ];

  const sizeClass =
    size === 'seconds'
      ? 'w-3.5 h-6 sm:w-6 sm:h-11'
      : 'w-7 h-12 sm:w-12 sm:h-[88px] md:w-[54px] md:h-[94px]';

  return (
    <svg
      viewBox="0 0 60 104"
      className={`${sizeClass} overflow-visible select-none shrink-0`}
    >
      {polygons.map((points, idx) => {
        const isOn = segs[idx] === 1;
        return (
          <polygon
            key={idx}
            points={points}
            fill={isOn ? activeFill : dimFill}
            style={isOn ? { filter: glowFilter, transition: 'fill 150ms ease' } : undefined}
          />
        );
      })}
    </svg>
  );
};

interface ChronometerCalendarWidgetProps {
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onQuickScheduleTask?: (dateStr: string) => void;
}

export const ChronometerCalendarWidget: React.FC<ChronometerCalendarWidgetProps> = ({
  selectedDate,
  onSelectDate,
  onQuickScheduleTask,
}) => {
  const { state, language, theme, testReminderNotification } = useFranklin();
  const { calendarEvents } = useGoogleWorkspace();
  const isRu = language === 'ru';
  const isLight = theme === 'light';

  const [now, setNow] = useState<Date>(() => new Date());
  const [isMobileCalendarOpen, setIsMobileCalendarOpen] = useState(false);
  const [ledColor, setLedColor] = useState<LedColorTheme>(() => {
    const saved = localStorage.getItem('franklin_led_color') as LedColorTheme | null;
    return saved && LED_THEMES[saved] ? saved : 'cyan';
  });

  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() =>
    'Notification' in window ? Notification.permission : 'default'
  );

  // Calendar month navigation state
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChangeLedColor = (color: LedColorTheme) => {
    setLedColor(color);
    try {
      localStorage.setItem('franklin_led_color', color);
    } catch {
      // ignore
    }
  };

  const requestDesktopNotifications = async () => {
    if (!('Notification' in window)) return;
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        testReminderNotification();
      }
    } catch {
      // ignore
    }
  };

  const hoursStr = String(now.getHours()).padStart(2, '0');
  const minutesStr = String(now.getMinutes()).padStart(2, '0');
  const secondsStr = String(now.getSeconds()).padStart(2, '0');
  const colonLit = now.getSeconds() % 2 === 0;

  const themeObj = LED_THEMES[ledColor];
  const currentActiveFill = isLight ? themeObj.activeFillLight : themeObj.activeFill;
  const currentDimFill = isLight ? themeObj.dimFillLight : themeObj.dimFill;
  const currentGlowFilter = isLight ? themeObj.glowFilterLight : themeObj.glowFilter;

  // Determine current energy window based on time of day and Franklin Passport
  const energyPhase = useMemo(() => {
    const h = now.getHours() + now.getMinutes() / 60;
    if (h >= 10 && h < 14) {
      return {
        label: isRu ? '⚡ Пик глубокой работы (Окно №1: 10:00–14:00)' : '⚡ Peak Deep Work Window #1 (10:00–14:00)',
        color: 'text-emerald-600 dark:text-emerald-400',
      };
    }
    if (h >= 16 && h < 19.5) {
      return {
        label: isRu ? '🔥 Второе рабочее окно и Тренировка (16:00–19:30)' : '🔥 Peak Window #2 & Training (16:00–19:30)',
        color: 'text-cyan-600 dark:text-cyan-400',
      };
    }
    if (h >= 7.5 && h < 10) {
      return {
        label: isRu ? '🌅 Утренний запуск и гидратация (07:30–10:00)' : '🌅 Morning Launch & Mobility (07:30–10:00)',
        color: 'text-amber-600 dark:text-amber-300',
      };
    }
    if (h >= 14 && h < 16) {
      return {
        label: isRu ? '🌿 Дневная перезагрузка и чтение вслух (14:00–16:00)' : '🌿 Afternoon Recovery & Reading (14:00–16:00)',
        color: 'text-teal-600 dark:text-teal-300',
      };
    }
    if (h >= 22 || h < 7.5) {
      return {
        label: isRu ? '🌙 Вечерний ритуал / Сон без экранов (22:30–07:30)' : '🌙 Evening Shutdown & Sleep (22:30–07:30)',
        color: 'text-indigo-600 dark:text-indigo-300',
      };
    }
    return {
      label: isRu ? '🧭 Вечерний обзор и подготовка завтрашнего дня' : '🧭 Evening Review & Prep',
      color: 'text-amber-600 dark:text-amber-300',
    };
  }, [now, isRu]);

  // Next upcoming reminder today
  const nextReminderTask = useMemo(() => {
    const currentHHMM = `${hoursStr}:${minutesStr}`;
    const todayIso = state.todayLog.date;
    const upcoming = state.todayLog.tasks
      .filter((t) => !t.completed && t.reminderTime && (!t.reminderDate || t.reminderDate === todayIso) && t.reminderTime > currentHHMM)
      .sort((a, b) => (a.reminderTime || '').localeCompare(b.reminderTime || ''));
    return upcoming[0] || null;
  }, [state.todayLog.tasks, state.todayLog.date, hoursStr, minutesStr]);

  // Calendar grid generation (Monday-first)
  const calendarData = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Convert Sunday (0) .. Saturday (6) to Monday (0) .. Sunday (6)
    const startWeekday = (firstDayOfMonth.getDay() + 6) % 7;
    const totalDays = lastDayOfMonth.getDate();

    const days: Array<{
      dayNumber: number | null;
      dateStr: string | null;
      isToday: boolean;
      isSelected: boolean;
      hasCompletedHabits: boolean;
      hasScheduledTasks: boolean;
      hasReminders: boolean;
    }> = [];

    for (let i = 0; i < startWeekday; i++) {
      days.push({
        dayNumber: null,
        dateStr: null,
        isToday: false,
        isSelected: false,
        hasCompletedHabits: false,
        hasScheduledTasks: false,
        hasReminders: false,
        hasGoogleEvents: false,
      });
    }

    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayHabits = state.habitWeeklyRecords?.[dateStr] || {};
      const hasCompletedHabits = Object.values(dayHabits).some((st) => st === 'done' || st === 'micro');

      const tasksForDay = state.todayLog.tasks.filter((t) => {
        const taskDate = t.scheduledDate || t.reminderDate || state.todayLog.date;
        return taskDate === dateStr;
      });
      const hasScheduledTasks = tasksForDay.some((t) => !t.completed);
      const hasReminders = tasksForDay.some((t) => Boolean(t.reminderTime) && !t.completed);
      const hasGoogleEvents = calendarEvents.some((evt) => {
        const evtDate = (evt.start.dateTime || evt.start.date || '').slice(0, 10);
        return evtDate === dateStr;
      });

      days.push({
        dayNumber: d,
        dateStr,
        isToday: dateStr === todayIso,
        isSelected: dateStr === selectedDate,
        hasCompletedHabits,
        hasScheduledTasks,
        hasReminders,
        hasGoogleEvents,
      });
    }

    return { year, month, days };
  }, [calendarViewDate, now, state.habitWeeklyRecords, state.todayLog.tasks, state.todayLog.date, selectedDate, calendarEvents]);

  const monthNamesRu = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const weekDaysRu = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
  const weekDaysEn = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

  const formattedFullDate = useMemo(() => {
    try {
      return now.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return state.todayLog.date;
    }
  }, [now, isRu, state.todayLog.date]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch max-w-full overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────────────────────
          LEFT (7 COLS): 7-SEGMENT LED CHRONOMETER & RHYTHM TELEMETRY
         ───────────────────────────────────────────────────────────────────────────── */}
      <div
        className={`lg:col-span-7 min-w-0 relative rounded-2xl p-4 sm:p-6 overflow-hidden flex flex-col justify-between transition-colors duration-200 ${
          isLight
            ? 'bg-white text-slate-900 border border-slate-200/90 shadow-xs'
            : 'bg-[#07090e] text-white border border-slate-800/90 shadow-xl'
        }`}
      >
        {/* Subtle ambient radial glow matching selected LED color */}
        <div
          className={`pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-64 sm:w-96 h-56 rounded-full blur-3xl transition-all duration-700 ${
            isLight ? 'opacity-10' : 'opacity-20'
          }`}
          style={{ backgroundColor: currentActiveFill }}
        />

        {/* Top Bar: Chronometer Title + Color Switcher + Desktop Notification Status */}
        <div
          className={`relative z-10 flex flex-wrap items-center justify-between gap-2 pb-3 border-b ${
            isLight ? 'border-slate-100' : 'border-white/10'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${themeObj.dotClass} animate-pulse`} />
            <span
              className={`text-[11px] font-mono uppercase tracking-wider sm:tracking-widest font-semibold truncate ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              {isRu ? 'ХРОНОМЕТР ФРАНКЛИНА · 24H' : 'FRANKLIN CHRONOMETER · 24H'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* LED Glow Color Switcher */}
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
                isLight ? 'bg-slate-100 border-slate-200/80' : 'bg-white/5 border-white/10'
              }`}
            >
              <span
                className={`text-[10px] font-mono mr-0.5 hidden sm:inline ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {isRu ? 'Свечение:' : 'Glow:'}
              </span>
              {(['cyan', 'emerald', 'amber', 'rose'] as LedColorTheme[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleChangeLedColor(c)}
                  title={isRu ? LED_THEMES[c].nameRu : LED_THEMES[c].nameEn}
                  className={`w-3.5 h-3.5 rounded-full transition-transform ${
                    ledColor === c
                      ? isLight
                        ? 'scale-125 ring-2 ring-slate-900/60'
                        : 'scale-125 ring-2 ring-white/80'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: isLight ? LED_THEMES[c].activeFillLight : LED_THEMES[c].activeFill }}
                />
              ))}
            </div>

            {/* Sound & Desktop Notification Test/Enable Button */}
            {notifPermission === 'granted' ? (
              <button
                type="button"
                onClick={testReminderNotification}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold transition-colors ${
                  isLight
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300'
                }`}
                title={isRu ? 'Нажмите для проверки звука и уведомления Windows' : 'Click to test sound & desktop alert'}
              >
                <Volume2 size={12} />
                <span>{isRu ? 'Тест звука' : 'Test Alert'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={requestDesktopNotifications}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold transition-colors ${
                  isLight
                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300'
                }`}
                title={isRu ? 'Включить системные уведомления Windows со звуком' : 'Enable Windows Desktop Notifications'}
              >
                <BellRing size={12} />
                <span>{isRu ? 'Уведомления' : 'Alerts'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Centerpiece: 7-Segment Digital Clock with Surface Reflection */}
        <div className="relative z-10 my-4 sm:my-5 flex flex-col items-center justify-center max-w-full overflow-hidden">
          <div
            className={`relative flex items-baseline justify-center gap-1 sm:gap-2.5 px-3 sm:px-5 py-2.5 sm:py-3.5 rounded-2xl border shadow-inner max-w-full transition-colors ${
              isLight
                ? 'bg-slate-50 border-slate-200/90'
                : 'bg-[#04060a]/90 border-white/5'
            }`}
          >
            {/* 24H Indicator Label on Left */}
            <div className="hidden sm:flex flex-col items-end justify-between h-[80px] pr-2 text-[10px] font-mono tracking-widest select-none">
              <span style={{ color: currentActiveFill, filter: currentGlowFilter }} className="font-bold">
                24H
              </span>
              <span className={isLight ? 'text-slate-400' : 'text-slate-600'}>SYNC</span>
            </div>

            {/* Hours */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <SevenSegmentDigit
                char={hoursStr[0]}
                activeFill={currentActiveFill}
                dimFill={currentDimFill}
                glowFilter={currentGlowFilter}
              />
              <SevenSegmentDigit
                char={hoursStr[1]}
                activeFill={currentActiveFill}
                dimFill={currentDimFill}
                glowFilter={currentGlowFilter}
              />
            </div>

            {/* Blinking LED Colon */}
            <div className="flex flex-col justify-center gap-2.5 sm:gap-4 px-0.5 sm:px-1 self-center">
              <div
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-xs transition-opacity duration-150"
                style={{
                  backgroundColor: colonLit ? currentActiveFill : currentDimFill,
                  filter: colonLit ? currentGlowFilter : 'none',
                }}
              />
              <div
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-xs transition-opacity duration-150"
                style={{
                  backgroundColor: colonLit ? currentActiveFill : currentDimFill,
                  filter: colonLit ? currentGlowFilter : 'none',
                }}
              />
            </div>

            {/* Minutes */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <SevenSegmentDigit
                char={minutesStr[0]}
                activeFill={currentActiveFill}
                dimFill={currentDimFill}
                glowFilter={currentGlowFilter}
              />
              <SevenSegmentDigit
                char={minutesStr[1]}
                activeFill={currentActiveFill}
                dimFill={currentDimFill}
                glowFilter={currentGlowFilter}
              />
            </div>

            {/* Seconds (Smaller 7-Segment Pair) */}
            <div className="flex items-center gap-0.5 sm:gap-1 pl-1.5 sm:pl-2 self-end pb-0.5 sm:pb-1">
              <SevenSegmentDigit
                char={secondsStr[0]}
                activeFill={currentActiveFill}
                dimFill={currentDimFill}
                glowFilter={currentGlowFilter}
                size="seconds"
              />
              <SevenSegmentDigit
                char={secondsStr[1]}
                activeFill={currentActiveFill}
                dimFill={currentDimFill}
                glowFilter={currentGlowFilter}
                size="seconds"
              />
            </div>
          </div>

          {/* Desk Surface LED Reflection Effect */}
          <div
            className={`w-44 sm:w-64 h-4 -mt-1 rounded-full blur-xl pointer-events-none transition-colors duration-500 ${
              isLight ? 'opacity-15' : 'opacity-35'
            }`}
            style={{ backgroundColor: currentActiveFill }}
          />
        </div>

        {/* Bottom Telemetry Bar: Date, Current Energy Window & Next Reminder */}
        <div
          className={`relative z-10 pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs min-w-0 ${
            isLight ? 'border-slate-100' : 'border-white/10'
          }`}
        >
          <div className="min-w-0">
            <div className={`font-semibold capitalize truncate ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
              {formattedFullDate}
            </div>
            <div className={`text-[11px] font-mono mt-0.5 ${energyPhase.color} break-words`}>
              {energyPhase.label}
            </div>
          </div>

          {nextReminderTask ? (
            <div className={`px-3 py-1.5 rounded-xl border ${themeObj.badgeBg} flex items-center gap-2 min-w-0 max-w-full overflow-hidden`}>
              <Bell size={13} className={`${themeObj.badgeText} animate-bounce shrink-0`} />
              <div className="text-[11px] font-mono min-w-0 truncate">
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                  {isRu ? 'Напоминание в ' : 'Reminder at '}
                </span>
                <strong className={themeObj.badgeText}>{nextReminderTask.reminderTime}</strong>
                <span className={`ml-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  · {nextReminderTask.title}
                </span>
              </div>
            </div>
          ) : (
            <div className={`text-[11px] font-mono flex items-center gap-1.5 shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <Clock size={12} className="text-slate-400 shrink-0" />
              <span>
                {isRu
                  ? `Идеальный отбой: ${state.personality.energyRhythms.idealBedtime}`
                  : `Target bedtime: ${state.personality.energyRhythms.idealBedtime}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          RIGHT (5 COLS): INTERACTIVE MINI-CALENDAR WITH TASK & HABIT MARKERS
         ───────────────────────────────────────────────────────────────────────────── */}
      <div
        className={`lg:col-span-5 min-w-0 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between transition-colors duration-200 ${
          isLight
            ? 'bg-white border border-slate-200/90 text-slate-900'
            : 'bg-[#0e1118] border border-neutral-800/90 text-white'
        }`}
      >
        <div>
          {/* Calendar Header */}
          <div
            className={`flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b ${
              isLight ? 'border-slate-100' : 'border-neutral-800/80'
            }`}
          >
            <div className="flex items-center gap-2">
              <CalendarIcon size={16} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
              <h3 className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {isRu ? monthNamesRu[calendarData.month] : monthNamesEn[calendarData.month]}{' '}
                <span className={`font-mono font-normal ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  {calendarData.year}
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                  setCalendarViewDate(new Date());
                  onSelectDate(todayIso);
                }}
                className={`px-2 py-1 rounded-md text-[10px] font-mono font-semibold transition-colors mr-1 ${
                  isLight
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {isRu ? 'Сегодня' : 'Today'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setCalendarViewDate(new Date(calendarData.year, calendarData.month - 1, 1))
                }
                className={`p-1 rounded-lg ${
                  isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-neutral-800 text-neutral-400'
                }`}
                title={isRu ? 'Предыдущий месяц' : 'Previous month'}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setCalendarViewDate(new Date(calendarData.year, calendarData.month + 1, 1))
                }
                className={`p-1 rounded-lg ${
                  isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-neutral-800 text-neutral-400'
                }`}
                title={isRu ? 'Следующий месяц' : 'Next month'}
              >
                <ChevronRight size={15} />
              </button>

              {/* Mobile Expand/Collapse Calendar Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileCalendarOpen((v) => !v)}
                className={`lg:hidden ml-1 px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 ${
                  isLight ? 'bg-slate-100 text-slate-600' : 'bg-neutral-800 text-neutral-300'
                }`}
              >
                <span>{isMobileCalendarOpen ? (isRu ? 'Свернуть' : 'Hide') : (isRu ? 'Сетка' : 'Grid')}</span>
                {isMobileCalendarOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>
          </div>

          {/* Calendar Grid (Always visible on desktop, collapsible on mobile to save vertical scroll) */}
          <div className={`${isMobileCalendarOpen ? 'block' : 'hidden lg:block'} mt-3`}>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {(isRu ? weekDaysRu : weekDaysEn).map((wd, idx) => (
                <div
                  key={wd}
                  className={`text-[10px] font-mono font-bold uppercase ${
                    idx >= 5
                      ? 'text-rose-500/80 dark:text-rose-400/80'
                      : 'text-slate-400 dark:text-neutral-500'
                  }`}
                >
                  {wd}
                </div>
              ))}
            </div>

            {/* Days Matrix */}
            <div className="grid grid-cols-7 gap-1">
              {calendarData.days.map((cell, idx) => {
                if (!cell.dayNumber || !cell.dateStr) {
                  return <div key={`empty-${idx}`} className="h-8" />;
                }

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => onSelectDate(cell.dateStr!)}
                    className={`relative h-8 rounded-lg text-xs font-mono flex flex-col items-center justify-center transition-all ${
                      cell.isSelected
                        ? 'bg-cyan-600 text-white font-bold shadow-xs'
                        : cell.isToday
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/40 font-bold'
                        : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800/80'
                    }`}
                  >
                    <span>{cell.dayNumber}</span>

                    {/* Activity / Reminder / Google Calendar Micro-Dots */}
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {cell.hasCompletedHabits && (
                        <span
                          className={`w-1 h-1 rounded-full ${
                            cell.isSelected ? 'bg-white' : 'bg-emerald-500'
                          }`}
                          title={isRu ? 'Привычки выполнены' : 'Habits completed'}
                        />
                      )}
                      {cell.hasReminders && (
                        <span
                          className={`w-1 h-1 rounded-full ${
                            cell.isSelected ? 'bg-amber-200' : 'bg-cyan-400'
                          }`}
                          title={isRu ? 'Установлено напоминание' : 'Reminder set'}
                        />
                      )}
                      {!cell.hasReminders && cell.hasScheduledTasks && (
                        <span
                          className={`w-1 h-1 rounded-full ${
                            cell.isSelected ? 'bg-white/80' : 'bg-amber-500'
                          }`}
                          title={isRu ? 'Запланированы задачи' : 'Scheduled tasks'}
                        />
                      )}
                      {cell.hasGoogleEvents && (
                        <span
                          className={`w-1 h-1 rounded-full ${
                            cell.isSelected ? 'bg-blue-200' : 'bg-blue-500'
                          }`}
                          title={isRu ? 'События в Google Календаре' : 'Google Calendar events'}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Date Footer & Legend */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-2.5 text-slate-500 dark:text-neutral-400 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {isRu ? 'Привычки' : 'Habits'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              {isRu ? 'Будильник' : 'Reminder'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Google
            </span>
          </div>

          {onQuickScheduleTask && (
            <button
              type="button"
              onClick={() => onQuickScheduleTask(selectedDate)}
              className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold font-mono"
            >
              + {isRu ? `Задача на ${selectedDate.slice(8)}.${selectedDate.slice(5, 7)}` : `Task for ${selectedDate.slice(5)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
