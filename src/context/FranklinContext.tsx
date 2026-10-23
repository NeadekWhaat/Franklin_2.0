import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  FranklinState,
  DayMode,
  DailyTask,
  DailyLog,
  WeeklyPlan,
  SlipRecoveryEntry,
  GoalItem,
  HabitItem,
  PersonalityProfile,
  ValueItem,
  PrincipleItem,
  HabitDayStatus,
  MentorChatMessage,
  NotebookItem,
} from '../types/franklin';
import { MilestoneBadge, MilestoneStats } from '../types/milestone';
import { evaluateMilestones, playCelebrationSound } from '../utils/milestoneEngine';
import { DEFAULT_FRANKLIN_STATE } from '../config/franklinDefaults';

import { translations, Language } from '../i18n/translations';

const STORAGE_KEY = 'franklin_os_state_v2';

export function getLocalTodayDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function normalizeTaskTitle(title: string): string {
  return (title || '')
    .replace(/^☀️\s*\[?(?:Весь день|All day)\]?\s*[·—|-]?\s*/i, '')
    .replace(/^⏰\s*\d{1,2}:\d{2}(?:[–-]\d{1,2}:\d{2})?(?:\s*\([^)]*\))?\s*[·—|-]?\s*/i, '')
    .replace(/\s*\[⏰[^\]]*\]\s*$/i, '')
    .replace(/^⚡\s*\[Якорь дня\]\s*/i, '')
    .replace(/^⚡\s*/i, '')
    .replace(/^🎯\s*/i, '')
    .trim()
    .toLowerCase();
}

function isLegacyChatErrorMessage(m: MentorChatMessage): boolean {
  if (!m) return false;
  if (m.id.startsWith('err-')) return true;
  if (
    m.text.includes('Произошла ошибка связи с ИИ-советником:') ||
    m.text.includes('Connection error with AI Advisor:') ||
    m.text.includes('Unexpected token')
  ) {
    return true;
  }
  return false;
}

function migrateToRussianIfNeeded(data: FranklinState): FranklinState {
  if (!data) return data;
  const next: FranklinState & {
    chatTransferMigratedV2?: boolean;
    progressResetV3?: boolean;
    nineLevelsMigratedV4?: boolean;
    passportCompleteSyncV5?: boolean;
    cloudSyncEnabledV6?: boolean;
  } = { ...data };

  if (!next.settings) {
    next.settings = { cloudSyncEnabled: true, language: 'ru', theme: 'light' };
  } else {
    next.settings = {
      ...next.settings,
      cloudSyncEnabled: next.cloudSyncEnabledV6 ? next.settings.cloudSyncEnabled : true,
      language: next.settings.language || 'ru',
      theme: next.settings.theme || 'light',
    };
  }
  next.cloudSyncEnabledV6 = true;

  // Automatically self-heal and remove any legacy error messages from mentorChat
  if (next.mentorChat?.messages) {
    next.mentorChat = {
      ...next.mentorChat,
      messages: next.mentorChat.messages.filter((m) => !isLegacyChatErrorMessage(m)),
    };
  }

  // Ensure notebook is initialized with default entries if missing
  if (!next.notebook || !Array.isArray(next.notebook)) {
    next.notebook = DEFAULT_FRANKLIN_STATE.notebook || [];
  }

  const todayStr = getLocalTodayDate();
  const deletedIds = new Set<string>(next.deletedTaskIds || []);
  const completedIds = new Set<string>(next.completedTaskIds || []);

  if (!next.chatTransferMigratedV2 || !next.progressResetV3) {
    next.personality = DEFAULT_FRANKLIN_STATE.personality;
    next.values = DEFAULT_FRANKLIN_STATE.values;
    next.principles = DEFAULT_FRANKLIN_STATE.principles;
    next.vision = DEFAULT_FRANKLIN_STATE.vision;
    next.goals = DEFAULT_FRANKLIN_STATE.goals.map((g) => ({ ...g, progressPercent: 0 }));
    next.habits = DEFAULT_FRANKLIN_STATE.habits;
    next.systems = DEFAULT_FRANKLIN_STATE.systems;
    next.currentWeek = {
      ...DEFAULT_FRANKLIN_STATE.currentWeek,
      weeklyReview: undefined,
    };
    next.pastWeeks = [];
    next.pastLogs = next.pastLogs || {};
    next.slipLogs = next.slipLogs || [];
    next.milestones = {
      unlockedBadgeIds: {},
    };
    next.habitWeeklyRecords = {
      [todayStr]: {
        'h-focus': 'none',
        'h1': 'none',
        'h2': 'none',
        'h3': 'none',
        'h4': 'none',
        'h5': 'none',
        'h6': 'none',
        'h7': 'none',
        'h-exp': 'none',
      },
    };
    const baseDefaultTasks = DEFAULT_FRANKLIN_STATE.todayLog.tasks
      .filter((t) => !deletedIds.has(t.id) && !completedIds.has(t.id))
      .map((t) => ({ ...t, completed: false }));
    next.todayLog = {
      date: todayStr,
      dayMode: 'GREEN',
      energyLevel: 4,
      completedHabitIds: [],
      tasks: baseDefaultTasks,
      eveningReflection: undefined,
    };
    next.chatTransferMigratedV2 = true;
    next.progressResetV3 = true;
    next.nineLevelsMigratedV4 = true;
    next.passportCompleteSyncV5 = true;
    return sanitizeAndRolloverDailyTasks(next);
  }

  if (!next.nineLevelsMigratedV4 || !next.passportCompleteSyncV5) {
    next.personality = DEFAULT_FRANKLIN_STATE.personality;
    next.values = DEFAULT_FRANKLIN_STATE.values;
    next.principles = DEFAULT_FRANKLIN_STATE.principles;
    next.vision = DEFAULT_FRANKLIN_STATE.vision;
    next.systems = DEFAULT_FRANKLIN_STATE.systems;

    const existingGoalMap = new Map((next.goals || []).map((g) => [g.id, g]));
    const updatedDefaultGoals = DEFAULT_FRANKLIN_STATE.goals.map((defGoal) => {
      const prevGoal = existingGoalMap.get(defGoal.id);
      return {
        ...defGoal,
        progressPercent: prevGoal ? prevGoal.progressPercent : defGoal.progressPercent,
      };
    });
    const customGoals = (next.goals || []).filter(
      (g) => !DEFAULT_FRANKLIN_STATE.goals.some((defG) => defG.id === g.id)
    );
    next.goals = [...updatedDefaultGoals, ...customGoals];

    const customHabits = (next.habits || []).filter(
      (h) => !DEFAULT_FRANKLIN_STATE.habits.some((defH) => defH.id === h.id)
    );
    next.habits = [...DEFAULT_FRANKLIN_STATE.habits, ...customHabits];

    next.currentWeek = {
      ...DEFAULT_FRANKLIN_STATE.currentWeek,
      weeklyReview: next.currentWeek?.weeklyReview,
    };

    next.nineLevelsMigratedV4 = true;
    next.passportCompleteSyncV5 = true;
  }

  return sanitizeAndRolloverDailyTasks(next);
}

/**
 * Ensures that:
 * 1. When the date changes (todayLog.date !== todayStr), yesterday's log is archived into pastLogs
 *    and ONLY uncompleted tasks roll over to today (completed Anchor & secondary tasks NEVER return).
 * 2. Any task that was already completed on a past date (in pastLogs[d] where d < todayStr) is
 *    permanently recorded in completedTaskIds / deletedTaskIds and purged from todayLog.tasks.
 * 3. Old past-date reminders on carried-over uncompleted tasks do not falsely trigger alarms.
 */
function sanitizeAndRolloverDailyTasks(stateObj: FranklinState): FranklinState {
  if (!stateObj || !stateObj.todayLog) return stateObj;
  const todayStr = getLocalTodayDate();
  const next: FranklinState = {
    ...stateObj,
    pastLogs: { ...(stateObj.pastLogs || {}) },
  };

  const deletedSet = new Set<string>(next.deletedTaskIds || []);
  const completedSet = new Set<string>(next.completedTaskIds || []);

  // 1. If todayLog is from a previous day, archive it into pastLogs and remove completed tasks
  if (next.todayLog.date && next.todayLog.date !== todayStr) {
    const prevDate = next.todayLog.date;
    const prevExistingLog = next.pastLogs[prevDate];
    const combinedPrevTasksMap = new Map<string, DailyTask>();
    (prevExistingLog?.tasks || []).forEach((t) => {
      if (t && t.id) combinedPrevTasksMap.set(t.id, t);
    });
    (next.todayLog.tasks || []).forEach((t) => {
      if (t && t.id) {
        const existing = combinedPrevTasksMap.get(t.id);
        combinedPrevTasksMap.set(
          t.id,
          existing ? { ...existing, ...t, completed: Boolean(existing.completed || t.completed) } : t
        );
      }
    });

    next.pastLogs[prevDate] = {
      ...next.todayLog,
      date: prevDate,
      tasks: Array.from(combinedPrevTasksMap.values()),
    };

    // Record completed tasks from prevDate so they never resurrect
    for (const t of next.todayLog.tasks || []) {
      if (t && t.completed) {
        completedSet.add(t.id);
        deletedSet.add(t.id);
        if (t.googleCalendarEventId) {
          completedSet.add(`gcal-${t.googleCalendarEventId}`);
          deletedSet.add(`gcal-${t.googleCalendarEventId}`);
        }
        if (t.googleTaskId) {
          completedSet.add(`gtask-${t.googleTaskId}`);
          deletedSet.add(`gtask-${t.googleTaskId}`);
        }
      }
    }

    // Carry over ONLY uncompleted tasks to the new day!
    const carriedOverTasks = (next.todayLog.tasks || [])
      .filter((t) => t && !t.completed && !deletedSet.has(t.id) && !completedSet.has(t.id))
      .map((t) => ({
        ...t,
        completed: false,
        // Only keep reminderFired=false if the reminder was explicitly scheduled for todayStr
        reminderFired: t.reminderDate === todayStr ? false : true,
      }));

    next.todayLog = {
      date: todayStr,
      dayMode: next.todayLog.dayMode || 'GREEN',
      energyLevel: next.todayLog.energyLevel || 4,
      completedHabitIds: [],
      tasks: carriedOverTasks,
      eveningReflection: undefined,
    };
  }

  // 2. Scan all pastLogs (date < todayStr) to gather every task that was completed in the past
  const pastCompletedTitles = new Set<string>();
  for (const [logDate, logObj] of Object.entries(next.pastLogs || {})) {
    if (!logObj || logDate >= todayStr) continue;
    for (const pt of logObj.tasks || []) {
      if (pt && pt.completed) {
        completedSet.add(pt.id);
        deletedSet.add(pt.id);
        if (pt.googleCalendarEventId) {
          completedSet.add(`gcal-${pt.googleCalendarEventId}`);
          deletedSet.add(`gcal-${pt.googleCalendarEventId}`);
        }
        if (pt.googleTaskId) {
          completedSet.add(`gtask-${pt.googleTaskId}`);
          deletedSet.add(`gtask-${pt.googleTaskId}`);
        }
        const normTitle = normalizeTaskTitle(pt.title);
        if (normTitle) {
          pastCompletedTitles.add(normTitle);
        }
      }
    }
  }

  // 3. Filter todayLog.tasks to purge any task that was already completed in pastLogs or deleted,
  //    and deduplicate by ID and normalized title.
  const seenIds = new Set<string>();
  const seenActiveTitles = new Set<string>();
  const cleanTodayTasks: DailyTask[] = [];

  for (const t of next.todayLog.tasks || []) {
    if (!t || !t.id || !t.title) continue;
    if (deletedSet.has(t.id)) continue;
    if (t.googleCalendarEventId && deletedSet.has(`gcal-${t.googleCalendarEventId}`)) continue;
    if (t.googleTaskId && deletedSet.has(`gtask-${t.googleTaskId}`)) continue;

    const normTitle = normalizeTaskTitle(t.title);
    const isFromPastSchedule = !t.scheduledDate || t.scheduledDate < todayStr;

    // If this task was completed on a past day (by ID, Google ID, or past-scheduled title), purge it!
    if (
      completedSet.has(t.id) ||
      (t.googleCalendarEventId && completedSet.has(`gcal-${t.googleCalendarEventId}`)) ||
      (t.googleTaskId && completedSet.has(`gtask-${t.googleTaskId}`)) ||
      (isFromPastSchedule && normTitle && pastCompletedTitles.has(normTitle))
    ) {
      // Only keep it in todayLog if it was explicitly created/completed TODAY (scheduledDate === todayStr and completed === true)
      const completedToday =
        t.completed &&
        ((t.completedAt && t.completedAt.startsWith(todayStr)) || t.scheduledDate === todayStr);
      if (!completedToday) {
        deletedSet.add(t.id);
        continue;
      }
    }

    if (seenIds.has(t.id)) continue;
    if (!t.completed && normTitle && seenActiveTitles.has(normTitle)) continue;

    seenIds.add(t.id);
    if (!t.completed && normTitle) {
      seenActiveTitles.add(normTitle);
    }

    // Prevent old past-date reminders from firing unexpectedly today
    const effectiveRemDate = t.reminderDate || t.scheduledDate || todayStr;
    const sanitizedTask: DailyTask =
      effectiveRemDate < todayStr && !t.reminderFired
        ? { ...t, reminderFired: true }
        : t;

    cleanTodayTasks.push(sanitizedTask);
  }

  // Ensure at most one uncompleted task has isMainTask = true
  let foundActiveMain = false;
  const normalizedTodayTasks = cleanTodayTasks.map((t) => {
    if (!t.completed && t.isMainTask) {
      if (!foundActiveMain) {
        foundActiveMain = true;
        return t;
      }
      return { ...t, isMainTask: false };
    }
    return t;
  });

  next.todayLog = {
    ...next.todayLog,
    tasks: normalizedTodayTasks,
  };
  next.deletedTaskIds = Array.from(deletedSet).slice(-300);
  next.completedTaskIds = Array.from(completedSet).slice(-300);

  return next;
}


interface FranklinContextType {
  state: FranklinState;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  translateAllSampleDataToRussian: () => void;
  t: (key: keyof typeof translations.ru) => string;
  badges: MilestoneBadge[];
  milestoneStats: MilestoneStats;
  celebratingBadge: MilestoneBadge | null;
  dismissCelebration: () => void;
  setDayMode: (mode: DayMode) => void;
  setEnergyLevel: (level: 1 | 2 | 3 | 4 | 5) => void;
  toggleHabit: (habitId: string) => void;
  setHabitStatusForDate: (date: string, habitId: string, status: HabitDayStatus) => void;
  cycleHabitStatus: (date: string, habitId: string) => void;
  toggleTask: (taskId: string) => void;
  addTask: (task: Omit<DailyTask, 'id' | 'completed'>) => DailyTask;
  updateTask: (taskId: string, updates: Partial<DailyTask>) => void;
  deleteTask: (taskId: string) => void;
  setMainTask: (taskId: string) => void;
  clearCompletedTasks: () => void;
  importExternalTasksToToday: (externalTasks: Array<Partial<DailyTask> & { title: string }>) => number;
  activeReminderAlert: DailyTask | null;
  dismissReminderAlert: () => void;
  snoozeReminderAlert: (minutes?: number) => void;
  testReminderNotification: () => void;
  saveEveningReflection: (reflection: NonNullable<DailyLog['eveningReflection']>) => void;
  logSlipRecovery: (entry: Omit<SlipRecoveryEntry, 'id' | 'timestamp'>) => void;
  updateWeeklyPlan: (updates: Partial<WeeklyPlan>) => void;
  archiveAndStartNewWeek: (newPlan: WeeklyPlan) => void;
  updatePersonality: (profile: Partial<PersonalityProfile>) => void;
  updateValues: (values: ValueItem[]) => void;
  updatePrinciples: (principles: PrincipleItem[]) => void;
  updateGoal: (goalId: string, updates: Partial<GoalItem>) => void;
  addGoal: (goal: Omit<GoalItem, 'id'>) => void;
  deleteGoal: (goalId: string) => void;
  addHabit: (habit: Omit<HabitItem, 'id'>) => void;
  updateHabit: (habitId: string, updates: Partial<HabitItem>) => void;
  deleteHabit: (habitId: string) => void;
  exportStateJson: () => void;
  importStateJson: (jsonString: string) => { success: boolean; error?: string };
  resetToDefaults: () => void;
  resetProgressOnly: () => void;
  toggleCloudSync: (enabled: boolean) => void;
  syncNowWithCloud: () => Promise<boolean>;
  isCloudSyncing: boolean;
  cloudSyncStatus: 'synced' | 'syncing' | 'local' | 'error';
  // Dev Text Editor Mode
  isEditMode: boolean;
  setIsEditMode: (val: boolean) => void;
  toggleEditMode: () => void;
  customTexts: Record<string, string>;
  setCustomText: (originalText: string, newText: string) => void;
  removeCustomText: (originalText: string) => void;
  clearAllCustomTexts: () => void;
  // Persistent Mentor Chat with Rolling Memory
  appendMentorMessages: (newMessages: MentorChatMessage[]) => void;
  updateMentorMessage: (id: string, updates: Partial<MentorChatMessage>) => void;
  clearMentorChat: () => void;
  updateMentorMemorySummary: (summary: string) => void;
  // Shared Knowledge Notebook (Gemini Context & Personal Lab)
  addNotebookItem: (item: Omit<NotebookItem, 'id' | 'createdAt' | 'updatedAt'>) => NotebookItem;
  updateNotebookItem: (id: string, updates: Partial<NotebookItem>) => void;
  deleteNotebookItem: (id: string) => void;
  togglePinNotebookItem: (id: string) => void;
  // Font scale (standard 100%, comfortable 110%, large 125%)
  fontScale: 'standard' | 'comfortable' | 'large';
  setFontScale: (scale: 'standard' | 'comfortable' | 'large') => void;
  cycleFontScale: () => void;
}

const FranklinContext = createContext<FranklinContextType | null>(null);

export const FranklinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FranklinState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.version === 2) {
          if (!parsed.habitWeeklyRecords) {
            parsed.habitWeeklyRecords = DEFAULT_FRANKLIN_STATE.habitWeeklyRecords || {};
          }
          return migrateToRussianIfNeeded(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse Franklin state from localStorage, falling back to defaults', e);
    }
    return migrateToRussianIfNeeded(DEFAULT_FRANKLIN_STATE);
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save Franklin state to localStorage', e);
    }
  }, [state]);

  // Cross-Device Synchronization Engine (/api/sync/state + localStorage across tabs)
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'local' | 'error'>(
    state.settings.cloudSyncEnabled ? 'synced' : 'local'
  );
  const stateRef = React.useRef(state);
  stateRef.current = state;
  const isSyncInFlightRef = React.useRef(false);
  const pendingFollowUpSyncRef = React.useRef(false);
  const skipNextAutoPushRef = React.useRef(false);

  const syncNowWithCloud = useCallback(async (): Promise<boolean> => {
    if (isSyncInFlightRef.current) {
      pendingFollowUpSyncRef.current = true;
      return false;
    }
    isSyncInFlightRef.current = true;
    setIsCloudSyncing(true);
    setCloudSyncStatus('syncing');
    try {
      const response = await fetch('/api/sync/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: stateRef.current }),
      });
      if (!response.ok) {
        throw new Error(`Sync status ${response.status}`);
      }
      const data = await response.json();
      if (data && data.state && data.state.todayLog) {
        skipNextAutoPushRef.current = true;
        setState((prev) => {
          const deletedSet = new Set<string>([
            ...(prev.deletedTaskIds || []),
            ...(data.state.deletedTaskIds || []),
          ]);
          const completedSet = new Set<string>([
            ...(prev.completedTaskIds || []),
            ...(data.state.completedTaskIds || []),
          ]);
          const localTasks = prev.todayLog?.tasks || [];
          const remoteTasks: DailyTask[] = data.state.todayLog?.tasks || [];
          const mergedTaskMap = new Map<string, DailyTask>();

          for (const rt of remoteTasks) {
            if (!rt || !rt.id || deletedSet.has(rt.id)) continue;
            mergedTaskMap.set(rt.id, rt);
          }
          for (const lt of localTasks) {
            if (!lt || !lt.id || deletedSet.has(lt.id)) continue;
            const existing = mergedTaskMap.get(lt.id);
            if (!existing) {
              mergedTaskMap.set(lt.id, lt);
            } else {
              const lTime = lt.updatedAt ? new Date(lt.updatedAt).getTime() : 0;
              const rTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
              const newer = lTime >= rTime ? lt : existing;
              const older = lTime >= rTime ? existing : lt;
              mergedTaskMap.set(lt.id, {
                ...older,
                ...newer,
                completed: lTime !== rTime ? Boolean(newer.completed) : Boolean(lt.completed || existing.completed),
                completedAt: newer.completedAt || older.completedAt,
                googleCalendarEventId: newer.googleCalendarEventId || older.googleCalendarEventId,
                googleTaskId: newer.googleTaskId || older.googleTaskId,
                reminderTime: newer.reminderTime ?? older.reminderTime,
                endTime: newer.endTime ?? older.endTime,
                isAllDay: newer.isAllDay ?? older.isAllDay,
                estimatedMinutes: newer.estimatedMinutes || older.estimatedMinutes,
                scheduledDate: newer.scheduledDate || older.scheduledDate,
                reminderDate: newer.reminderDate || older.reminderDate,
                reminderFired: Boolean(newer.reminderFired || older.reminderFired),
              });
            }
          }

          const merged = migrateToRussianIfNeeded({
            ...prev,
            ...data.state,
            deletedTaskIds: Array.from(deletedSet),
            completedTaskIds: Array.from(completedSet),
            todayLog: {
              ...prev.todayLog,
              ...data.state.todayLog,
              tasks: Array.from(mergedTaskMap.values()),
            },
            settings: {
              ...prev.settings,
              ...(data.state.settings || {}),
              cloudSyncEnabled: prev.settings.cloudSyncEnabled,
              lastSyncedAt: data.syncedAt || new Date().toISOString(),
            },
          });
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
      setCloudSyncStatus(stateRef.current.settings.cloudSyncEnabled ? 'synced' : 'local');
      return true;
    } catch (err) {
      console.warn('Cloud sync warning:', err);
      setCloudSyncStatus('error');
      return false;
    } finally {
      isSyncInFlightRef.current = false;
      setIsCloudSyncing(false);
      if (pendingFollowUpSyncRef.current) {
        pendingFollowUpSyncRef.current = false;
        setTimeout(() => {
          syncNowWithCloud();
        }, 250);
      }
    }
  }, []);

  // Initial sync on mount + window focus / visibilitychange + 20s heartbeat for cross-device sync
  useEffect(() => {
    if (!state.settings.cloudSyncEnabled) {
      setCloudSyncStatus('local');
      return;
    }
    syncNowWithCloud();

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && stateRef.current.settings.cloudSyncEnabled) {
        syncNowWithCloud();
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.todayLog) {
            skipNextAutoPushRef.current = true;
            setState(parsed);
          }
        } catch {}
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('storage', handleStorageEvent);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && stateRef.current.settings.cloudSyncEnabled) {
        syncNowWithCloud();
      }
    }, 20000);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('storage', handleStorageEvent);
      clearInterval(interval);
    };
  }, [state.settings.cloudSyncEnabled, syncNowWithCloud]);

  // Debounced auto-push whenever local state mutates
  useEffect(() => {
    if (!state.settings.cloudSyncEnabled) return;
    if (skipNextAutoPushRef.current) {
      skipNextAutoPushRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      syncNowWithCloud();
    }, 700);
    return () => clearTimeout(timer);
  }, [
    state.todayLog,
    state.habitWeeklyRecords,
    state.goals,
    state.habits,
    state.currentWeek,
    state.slipLogs,
    state.customTexts,
    state.settings.cloudSyncEnabled,
    syncNowWithCloud,
  ]);

  // Theme synchronization (light / dark)
  const theme = state.settings.theme || 'light';

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        theme: newTheme,
      },
    }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        theme: prev.settings.theme === 'dark' ? 'light' : 'dark',
      },
    }));
  }, []);

  // Typography font scale state (standard 100%, comfortable 110%, large 125%)
  const [fontScale, setFontScaleState] = useState<'standard' | 'comfortable' | 'large'>(() => {
    try {
      const saved = localStorage.getItem('franklin_font_scale');
      if (saved === 'standard' || saved === 'comfortable' || saved === 'large') {
        return saved;
      }
    } catch {}
    return 'comfortable'; // Defaults to comfortable so mobile and Russian text are immediately legible!
  });

  const setFontScale = useCallback((scale: 'standard' | 'comfortable' | 'large') => {
    setFontScaleState(scale);
    try {
      localStorage.setItem('franklin_font_scale', scale);
    } catch {}
  }, []);

  const cycleFontScale = useCallback(() => {
    setFontScaleState((prev) => {
      const next = prev === 'standard' ? 'comfortable' : prev === 'comfortable' ? 'large' : 'standard';
      try {
        localStorage.setItem('franklin_font_scale', next);
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-font-scale', fontScale);
  }, [fontScale]);

  const translateAllSampleDataToRussian = useCallback(() => {
    setState((prev) => migrateToRussianIfNeeded({ ...DEFAULT_FRANKLIN_STATE, version: 2 }));
  }, []);

  const [celebrationQueue, setCelebrationQueue] = useState<MilestoneBadge[]>([]);
  const isFirstMountRef = React.useRef(true);

  const { badges, stats: milestoneStats, newlyUnlocked } = useMemo(() => {
    return evaluateMilestones(state);
  }, [state]);

  useEffect(() => {
    if (newlyUnlocked.length > 0) {
      const newBadgeMap: Record<string, string> = {
        ...(state.milestones?.unlockedBadgeIds || {}),
      };
      newlyUnlocked.forEach((b) => {
        newBadgeMap[b.id] = b.unlockedAt || new Date().toISOString();
      });

      setState((prev) => ({
        ...prev,
        milestones: {
          unlockedBadgeIds: newBadgeMap,
        },
      }));

      if (!isFirstMountRef.current) {
        setCelebrationQueue((prev) => [...prev, ...newlyUnlocked]);
        playCelebrationSound();
      }
    }
    isFirstMountRef.current = false;
  }, [newlyUnlocked]);

  const dismissCelebration = useCallback(() => {
    setCelebrationQueue((prev) => prev.slice(1));
  }, []);

  const celebratingBadge = celebrationQueue[0] || null;

  const setDayMode = useCallback((dayMode: DayMode) => {
    setState((prev) => ({
      ...prev,
      todayLog: {
        ...prev.todayLog,
        dayMode,
        modeConfirmed: true,
      } as DailyLog,
    }));
  }, []);

  const setEnergyLevel = useCallback((energyLevel: 1 | 2 | 3 | 4 | 5) => {
    setState((prev) => ({
      ...prev,
      todayLog: {
        ...prev.todayLog,
        energyLevel,
        modeConfirmed: true,
      } as DailyLog,
    }));
  }, []);

  const setHabitStatusForDate = useCallback((date: string, habitId: string, status: HabitDayStatus) => {
    setState((prev) => {
      const prevRecords = prev.habitWeeklyRecords || {};
      const dayRecord = { ...(prevRecords[date] || {}), [habitId]: status };
      const updatedRecords = { ...prevRecords, [date]: dayRecord };

      let updatedCompletedIds = prev.todayLog.completedHabitIds;
      if (date === prev.todayLog.date) {
        if (status === 'done' || status === 'micro') {
          if (!updatedCompletedIds.includes(habitId)) {
            updatedCompletedIds = [...updatedCompletedIds, habitId];
          }
        } else {
          updatedCompletedIds = updatedCompletedIds.filter((id) => id !== habitId);
        }
      }

      return {
        ...prev,
        habitWeeklyRecords: updatedRecords,
        todayLog: {
          ...prev.todayLog,
          completedHabitIds: updatedCompletedIds,
        },
      };
    });
  }, []);

  const cycleHabitStatus = useCallback((date: string, habitId: string) => {
    setState((prev) => {
      const prevRecords = prev.habitWeeklyRecords || {};
      const current = prevRecords[date]?.[habitId] || 'none';
      const order: HabitDayStatus[] = ['none', 'done', 'micro', 'rest', 'missed'];
      const nextIdx = (order.indexOf(current) + 1) % order.length;
      const nextStatus = order[nextIdx];

      const dayRecord = { ...(prevRecords[date] || {}), [habitId]: nextStatus };
      const updatedRecords = { ...prevRecords, [date]: dayRecord };

      let updatedCompletedIds = prev.todayLog.completedHabitIds;
      if (date === prev.todayLog.date) {
        if (nextStatus === 'done' || nextStatus === 'micro') {
          if (!updatedCompletedIds.includes(habitId)) {
            updatedCompletedIds = [...updatedCompletedIds, habitId];
          }
        } else {
          updatedCompletedIds = updatedCompletedIds.filter((id) => id !== habitId);
        }
      }

      return {
        ...prev,
        habitWeeklyRecords: updatedRecords,
        todayLog: {
          ...prev.todayLog,
          completedHabitIds: updatedCompletedIds,
        },
      };
    });
  }, []);

  const toggleHabit = useCallback((habitId: string) => {
    setState((prev) => {
      const exists = prev.todayLog.completedHabitIds.includes(habitId);
      const updated = exists
        ? prev.todayLog.completedHabitIds.filter((id) => id !== habitId)
        : [...prev.todayLog.completedHabitIds, habitId];

      const todayDate = prev.todayLog.date;
      const prevRecords = prev.habitWeeklyRecords || {};
      const dayRecord = {
        ...(prevRecords[todayDate] || {}),
        [habitId]: (exists ? 'none' : 'done') as HabitDayStatus,
      };

      return {
        ...prev,
        habitWeeklyRecords: { ...prevRecords, [todayDate]: dayRecord },
        todayLog: {
          ...prev.todayLog,
          completedHabitIds: updated,
        },
      };
    });
  }, []);

  // Real-time Task Reminder Alert & Chime Engine
  const [activeReminderAlert, setActiveReminderAlert] = useState<DailyTask | null>(null);

  const toggleTask = useCallback((taskId: string) => {
    const nowIso = new Date().toISOString();
    setActiveReminderAlert((prevAlert) => (prevAlert?.id === taskId ? null : prevAlert));
    setState((prev) => {
      const target = prev.todayLog.tasks.find((t) => t.id === taskId);
      const willBeCompleted = target ? !target.completed : true;
      const completedSet = new Set<string>(prev.completedTaskIds || []);

      if (target) {
        if (willBeCompleted) {
          completedSet.add(target.id);
          if (target.googleCalendarEventId) completedSet.add(`gcal-${target.googleCalendarEventId}`);
          if (target.googleTaskId) completedSet.add(`gtask-${target.googleTaskId}`);
        } else {
          completedSet.delete(target.id);
          if (target.googleCalendarEventId) completedSet.delete(`gcal-${target.googleCalendarEventId}`);
          if (target.googleTaskId) completedSet.delete(`gtask-${target.googleTaskId}`);
        }
      }

      return {
        ...prev,
        updatedAt: nowIso,
        completedTaskIds: Array.from(completedSet).slice(-300),
        todayLog: {
          ...prev.todayLog,
          tasks: prev.todayLog.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed ? nowIso : undefined,
                  reminderFired: !t.completed ? true : t.reminderFired,
                  updatedAt: nowIso,
                }
              : t
          ),
        },
      };
    });
  }, []);

  const addTask = useCallback((taskData: Omit<DailyTask, 'id' | 'completed'>): DailyTask => {
    const now = new Date();
    const nowIso = now.toISOString();
    const todayStr = getLocalTodayDate();
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const schedDate = taskData.scheduledDate || todayStr;
    const remDate = taskData.reminderDate || schedDate;

    // If reminderTime is already in the past for today, mark reminderFired=true so it doesn't falsely blast immediately
    const isPastTimeToday =
      Boolean(taskData.reminderTime) &&
      !taskData.isAllDay &&
      remDate === todayStr &&
      taskData.reminderTime! < currentHHMM;

    const newTask: DailyTask = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      completed: false,
      scheduledDate: schedDate,
      reminderDate: remDate,
      reminderFired:
        taskData.reminderFired !== undefined
          ? taskData.reminderFired
          : Boolean(taskData.isAllDay || !taskData.reminderTime || isPastTimeToday),
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setState((prev) => {
      let tasks = [...prev.todayLog.tasks];
      if (newTask.isMainTask) {
        // Only unset isMainTask on uncompleted tasks so completed Anchor tasks keep their history badge
        tasks = tasks.map((t) => (!t.completed ? { ...t, isMainTask: false } : t));
      }
      return {
        ...prev,
        updatedAt: nowIso,
        todayLog: {
          ...prev.todayLog,
          tasks: [...tasks, newTask],
        },
      };
    });
    return newTask;
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<DailyTask>) => {
    const now = new Date();
    const nowIso = now.toISOString();
    const todayStr = getLocalTodayDate();
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setState((prev) => ({
      ...prev,
      updatedAt: nowIso,
      todayLog: {
        ...prev.todayLog,
        tasks: prev.todayLog.tasks.map((t) => {
          if (t.id !== taskId) return t;
          const nextTask = { ...t, ...updates, updatedAt: nowIso };
          if ('reminderTime' in updates || 'reminderDate' in updates || 'isAllDay' in updates) {
            const effDate = nextTask.reminderDate || nextTask.scheduledDate || todayStr;
            if (nextTask.isAllDay || !nextTask.reminderTime) {
              nextTask.reminderFired = true;
            } else if (updates.reminderFired === undefined) {
              nextTask.reminderFired = effDate === todayStr && nextTask.reminderTime < currentHHMM;
            }
          }
          return nextTask;
        }),
      },
    }));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    const nowIso = new Date().toISOString();
    setActiveReminderAlert((prevAlert) => (prevAlert?.id === taskId ? null : prevAlert));
    setState((prev) => {
      const target = prev.todayLog.tasks.find((t) => t.id === taskId);
      const nextDeleted = Array.from(
        new Set([
          ...(prev.deletedTaskIds || []),
          taskId,
          ...(target?.googleCalendarEventId ? [`gcal-${target.googleCalendarEventId}`] : []),
          ...(target?.googleTaskId ? [`gtask-${target.googleTaskId}`] : []),
        ])
      ).slice(-300);

      return {
        ...prev,
        updatedAt: nowIso,
        deletedTaskIds: nextDeleted,
        todayLog: {
          ...prev.todayLog,
          tasks: prev.todayLog.tasks.filter((t) => t.id !== taskId),
        },
      };
    });
  }, []);

  const setMainTask = useCallback((taskId: string) => {
    const nowIso = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      updatedAt: nowIso,
      todayLog: {
        ...prev.todayLog,
        tasks: prev.todayLog.tasks.map((t) => {
          if (t.completed) return t;
          return {
            ...t,
            isMainTask: t.id === taskId,
            updatedAt: t.id === taskId || t.isMainTask ? nowIso : t.updatedAt,
          };
        }),
      },
    }));
  }, []);

  const clearCompletedTasks = useCallback(() => {
    const nowIso = new Date().toISOString();
    setState((prev) => {
      const todayDate = prev.todayLog.date || getLocalTodayDate();
      const completedToday = prev.todayLog.tasks.filter((t) => t.completed);
      if (completedToday.length === 0) return prev;

      const remainingActive = prev.todayLog.tasks.filter((t) => !t.completed);
      const completedSet = new Set<string>(prev.completedTaskIds || []);
      const deletedSet = new Set<string>(prev.deletedTaskIds || []);

      for (const ct of completedToday) {
        completedSet.add(ct.id);
        deletedSet.add(ct.id);
        if (ct.googleCalendarEventId) {
          completedSet.add(`gcal-${ct.googleCalendarEventId}`);
          deletedSet.add(`gcal-${ct.googleCalendarEventId}`);
        }
        if (ct.googleTaskId) {
          completedSet.add(`gtask-${ct.googleTaskId}`);
          deletedSet.add(`gtask-${ct.googleTaskId}`);
        }
      }

      // Preserve completed tasks in pastLogs[todayDate] so all statistics & badges remain 100% accurate
      const existingArchiveLog = prev.pastLogs?.[todayDate];
      const archivedMap = new Map<string, DailyTask>();
      (existingArchiveLog?.tasks || []).forEach((t) => {
        if (t && t.id) archivedMap.set(t.id, t);
      });
      completedToday.forEach((t) => {
        archivedMap.set(t.id, t);
      });

      return {
        ...prev,
        updatedAt: nowIso,
        completedTaskIds: Array.from(completedSet).slice(-300),
        deletedTaskIds: Array.from(deletedSet).slice(-300),
        pastLogs: {
          ...(prev.pastLogs || {}),
          [todayDate]: {
            ...(existingArchiveLog || prev.todayLog),
            date: todayDate,
            tasks: Array.from(archivedMap.values()),
          },
        },
        todayLog: {
          ...prev.todayLog,
          tasks: remainingActive,
        },
      };
    });
  }, []);

  // Two-Way Restoration: Import tasks from Google Calendar / Google Tasks if not already present, deleted, or completed
  const importExternalTasksToToday = useCallback(
    (externalTasks: Array<Partial<DailyTask> & { title: string }>): number => {
      if (!externalTasks || externalTasks.length === 0) return 0;
      let addedCount = 0;

      setState((prev) => {
        const deletedSet = new Set(prev.deletedTaskIds || []);
        const completedSet = new Set(prev.completedTaskIds || []);
        const pastCompletedTitles = new Set<string>();
        for (const logObj of Object.values(prev.pastLogs || {})) {
          for (const pt of logObj?.tasks || []) {
            if (pt && pt.completed) {
              completedSet.add(pt.id);
              if (pt.googleCalendarEventId) completedSet.add(`gcal-${pt.googleCalendarEventId}`);
              if (pt.googleTaskId) completedSet.add(`gtask-${pt.googleTaskId}`);
              const nt = normalizeTaskTitle(pt.title);
              if (nt) pastCompletedTitles.add(nt);
            }
          }
        }

        const currentTasks = [...(prev.todayLog.tasks || [])];
        const existingIds = new Set(currentTasks.map((t) => t.id));
        const existingGcalIds = new Set(
          currentTasks.map((t) => t.googleCalendarEventId).filter(Boolean)
        );
        const existingGtaskIds = new Set(
          currentTasks.map((t) => t.googleTaskId).filter(Boolean)
        );
        const existingTitles = new Set(
          currentTasks.map((t) => normalizeTaskTitle(t.title)).filter(Boolean)
        );

        const now = new Date();
        const nowIso = now.toISOString();
        const todayStr = getLocalTodayDate();
        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        for (const ext of externalTasks) {
          if (ext.completed) continue; // Never import already-completed external tasks into active list

          const cleanTitle = (ext.title || '')
            .replace(/^⚡\s*\[Якорь дня\]\s*/i, '')
            .replace(/^⚡\s*/i, '')
            .replace(/^🎯\s*/i, '')
            .trim();
          if (!cleanTitle) continue;

          const extDate = ext.scheduledDate || ext.reminderDate || todayStr;
          // Never re-import past-date external events/tasks
          if (extDate < todayStr) continue;

          const candidateId =
            ext.id ||
            (ext.googleCalendarEventId ? `gcal-${ext.googleCalendarEventId}` : undefined) ||
            (ext.googleTaskId ? `gtask-${ext.googleTaskId}` : undefined) ||
            `ext-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

          const norm = normalizeTaskTitle(cleanTitle);

          if (
            deletedSet.has(candidateId) ||
            completedSet.has(candidateId) ||
            (ext.googleCalendarEventId &&
              (deletedSet.has(`gcal-${ext.googleCalendarEventId}`) ||
                completedSet.has(`gcal-${ext.googleCalendarEventId}`))) ||
            (ext.googleTaskId &&
              (deletedSet.has(`gtask-${ext.googleTaskId}`) ||
                completedSet.has(`gtask-${ext.googleTaskId}`))) ||
            (norm && pastCompletedTitles.has(norm))
          ) {
            continue;
          }

          if (
            existingIds.has(candidateId) ||
            (ext.googleCalendarEventId && existingGcalIds.has(ext.googleCalendarEventId)) ||
            (ext.googleTaskId && existingGtaskIds.has(ext.googleTaskId)) ||
            existingTitles.has(norm)
          ) {
            const matchIdx = currentTasks.findIndex(
              (t) => normalizeTaskTitle(t.title) === norm
            );
            if (matchIdx !== -1) {
              const existingTask = currentTasks[matchIdx];
              if (
                (ext.googleCalendarEventId && !existingTask.googleCalendarEventId) ||
                (ext.googleTaskId && !existingTask.googleTaskId) ||
                (ext.reminderTime && !existingTask.reminderTime)
              ) {
                currentTasks[matchIdx] = {
                  ...existingTask,
                  googleCalendarEventId:
                    existingTask.googleCalendarEventId || ext.googleCalendarEventId,
                  googleTaskId: existingTask.googleTaskId || ext.googleTaskId,
                  reminderTime: existingTask.reminderTime || ext.reminderTime,
                  endTime: existingTask.endTime || ext.endTime,
                  isAllDay: existingTask.isAllDay ?? ext.isAllDay,
                };
                addedCount++;
              }
            }
            continue;
          }

          const hasMainAlready = currentTasks.some((t) => !t.completed && t.isMainTask);
          const isMain = Boolean(ext.isMainTask && !hasMainAlready);
          const isPastTimeToday =
            Boolean(ext.reminderTime) &&
            !ext.isAllDay &&
            extDate === todayStr &&
            ext.reminderTime! < currentHHMM;

          const newTask: DailyTask = {
            id: candidateId,
            title: cleanTitle,
            isMainTask: isMain,
            minModeRequired: ext.minModeRequired || 'GREEN',
            completed: false,
            directionId: ext.directionId || 'career',
            estimatedMinutes: ext.estimatedMinutes || 30,
            reminderTime: ext.reminderTime,
            endTime: ext.endTime,
            isAllDay: ext.isAllDay,
            reminderDate: extDate,
            scheduledDate: extDate,
            googleCalendarEventId: ext.googleCalendarEventId,
            googleTaskId: ext.googleTaskId,
            reminderFired: Boolean(ext.isAllDay || !ext.reminderTime || isPastTimeToday),
            createdAt: nowIso,
            updatedAt: nowIso,
          };

          currentTasks.push(newTask);
          existingIds.add(candidateId);
          existingTitles.add(norm);
          if (ext.googleCalendarEventId) existingGcalIds.add(ext.googleCalendarEventId);
          if (ext.googleTaskId) existingGtaskIds.add(ext.googleTaskId);
          addedCount++;
        }

        if (addedCount === 0) return prev;

        return {
          ...prev,
          updatedAt: nowIso,
          todayLog: {
            ...prev.todayLog,
            tasks: currentTasks,
          },
        };
      });

      return addedCount;
    },
    []
  );

  const playReminderChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 chord arpeggio
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + i * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.6);
      });
    } catch {
      // Ignore audio errors if blocked by browser autoplay policy
    }
  }, []);

  const triggerSystemNotification = useCallback((title: string, body: string) => {
    playReminderChime();
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          tag: `franklin-reminder-${Date.now()}`,
          requireInteraction: true,
        });
      } catch {
        // Fallback if Notification constructor fails in certain contexts
      }
    }
  }, [playReminderChime]);

  useEffect(() => {
    const checkRemindersAndRollover = () => {
      const now = new Date();
      const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Live midnight rollover check if the app stays open across days
      if (state.todayLog.date && state.todayLog.date !== todayIso) {
        setState((prev) => sanitizeAndRolloverDailyTasks(prev));
        return;
      }

      const dueTask = state.todayLog.tasks.find((t) => {
        if (t.completed || t.isAllDay || !t.reminderTime || t.reminderFired) return false;
        const targetDate = t.reminderDate || t.scheduledDate || state.todayLog.date;
        if (targetDate !== todayIso) return false;
        return t.reminderTime <= currentHHMM;
      });

      if (dueTask) {
        setState((prev) => ({
          ...prev,
          todayLog: {
            ...prev.todayLog,
            tasks: prev.todayLog.tasks.map((t) =>
              t.id === dueTask.id ? { ...t, reminderFired: true } : t
            ),
          },
        }));
        setActiveReminderAlert(dueTask);
        triggerSystemNotification(
          '⚡ Франклин 2.0 — Напоминание о задаче',
          `${dueTask.isMainTask ? '[ЯКОРЬ ДНЯ] ' : ''}${dueTask.title}`
        );
      }
    };

    const interval = setInterval(checkRemindersAndRollover, 10000);
    checkRemindersAndRollover();
    return () => clearInterval(interval);
  }, [state.todayLog.tasks, state.todayLog.date, triggerSystemNotification]);

  const dismissReminderAlert = useCallback(() => {
    setActiveReminderAlert(null);
  }, []);

  const snoozeReminderAlert = useCallback((minutes = 10) => {
    if (!activeReminderAlert) return;
    const now = new Date(Date.now() + minutes * 60000);
    const nextHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const nextDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    updateTask(activeReminderAlert.id, {
      reminderTime: nextHHMM,
      reminderDate: nextDate,
      reminderFired: false,
    });
    setActiveReminderAlert(null);
  }, [activeReminderAlert, updateTask]);

  const testReminderNotification = useCallback(() => {
    triggerSystemNotification(
      '🔔 Тест уведомлений Франклин 2.0',
      'Звуковой сигнал и системные уведомления Windows / Браузера работают исправно!'
    );
    const sampleTask: DailyTask = state.todayLog.tasks.find((t) => t.isMainTask) || {
      id: 'test-reminder',
      title: 'Проверка боевого напоминания: Звук + Уведомление рабочего стола',
      isMainTask: true,
      minModeRequired: 'GREEN',
      completed: false,
      directionId: 'career',
      reminderTime: new Date().toTimeString().slice(0, 5),
    };
    setActiveReminderAlert(sampleTask);
  }, [state.todayLog.tasks, triggerSystemNotification]);

  const saveEveningReflection = useCallback((reflection: NonNullable<DailyLog['eveningReflection']>) => {
    setState((prev) => ({
      ...prev,
      todayLog: {
        ...prev.todayLog,
        eveningReflection: reflection,
      },
    }));
  }, []);

  const logSlipRecovery = useCallback((entryData: Omit<SlipRecoveryEntry, 'id' | 'timestamp'>) => {
    const entry: SlipRecoveryEntry = {
      ...entryData,
      id: `slip-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      slipLogs: [entry, ...prev.slipLogs],
    }));
  }, []);

  const updateWeeklyPlan = useCallback((updates: Partial<WeeklyPlan>) => {
    setState((prev) => ({
      ...prev,
      currentWeek: {
        ...prev.currentWeek,
        ...updates,
      },
    }));
  }, []);

  const archiveAndStartNewWeek = useCallback((newPlan: WeeklyPlan) => {
    setState((prev) => ({
      ...prev,
      pastWeeks: [prev.currentWeek, ...prev.pastWeeks],
      currentWeek: newPlan,
    }));
  }, []);

  const updatePersonality = useCallback((profile: Partial<PersonalityProfile>) => {
    setState((prev) => ({
      ...prev,
      personality: {
        ...prev.personality,
        ...profile,
      },
    }));
  }, []);

  const updateValues = useCallback((values: ValueItem[]) => {
    setState((prev) => ({ ...prev, values }));
  }, []);

  const updatePrinciples = useCallback((principles: PrincipleItem[]) => {
    setState((prev) => ({ ...prev, principles }));
  }, []);

  const updateGoal = useCallback((goalId: string, updates: Partial<GoalItem>) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === goalId ? { ...g, ...updates } : g)),
    }));
  }, []);

  const addGoal = useCallback((goalData: Omit<GoalItem, 'id'>) => {
    const newGoal: GoalItem = {
      ...goalData,
      id: `goal-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      goals: [...prev.goals, newGoal],
    }));
  }, []);

  const deleteGoal = useCallback((goalId: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== goalId),
    }));
  }, []);

  const addHabit = useCallback((habitData: Omit<HabitItem, 'id'>) => {
    const newHabit: HabitItem = {
      ...habitData,
      id: `habit-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      habits: [...prev.habits, newHabit],
    }));
  }, []);

  const updateHabit = useCallback((habitId: string, updates: Partial<HabitItem>) => {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => (h.id === habitId ? { ...h, ...updates } : h)),
    }));
  }, []);

  const deleteHabit = useCallback((habitId: string) => {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== habitId),
    }));
  }, []);

  const exportStateJson = useCallback(() => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('download', `franklin_2_backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [state]);

  const importStateJson = useCallback((jsonString: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Invalid JSON format' };
      }
      if (!parsed.todayLog || !parsed.personality || !parsed.currentWeek) {
        return { success: false, error: 'JSON is missing required Franklin 2.0 root properties' };
      }
      setState(parsed);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Could not parse JSON' };
    }
  }, []);

  const resetToDefaults = useCallback(() => {
    setCelebrationQueue([]);
    setState((prev) => ({
      ...DEFAULT_FRANKLIN_STATE,
      settings: prev.settings,
      chatTransferMigratedV2: true,
      progressResetV3: true,
      nineLevelsMigratedV4: true,
      passportCompleteSyncV5: true,
    } as FranklinState));
  }, []);

  const resetProgressOnly = useCallback(() => {
    setCelebrationQueue([]);
    const todayStr = getLocalTodayDate();
    setState((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      goals: prev.goals.map((g) => ({ ...g, progressPercent: 0 })),
      currentWeek: {
        ...prev.currentWeek,
        weeklyReview: undefined,
      },
      pastWeeks: [],
      pastLogs: {},
      slipLogs: [],
      milestones: {
        unlockedBadgeIds: {},
      },
      habitWeeklyRecords: {
        [todayStr]: Object.fromEntries(prev.habits.map((h) => [h.id, 'none' as HabitDayStatus])),
      },
      todayLog: {
        date: todayStr,
        dayMode: 'GREEN',
        energyLevel: 4,
        completedHabitIds: [],
        tasks: prev.todayLog.tasks.map((t) => ({ ...t, completed: false })),
        eveningReflection: undefined,
      },
    }));
  }, []);

  const toggleCloudSync = useCallback((enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      settings: {
        ...prev.settings,
        cloudSyncEnabled: enabled,
        lastSyncedAt: enabled ? new Date().toISOString() : prev.settings.lastSyncedAt,
      },
    }));
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        language: lang,
      },
    }));
  }, []);

  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  const customTexts = useMemo(() => state.customTexts || {}, [state.customTexts]);

  const setCustomText = useCallback((originalText: string, newText: string) => {
    const key = originalText.trim();
    if (!key) return;
    setState((prev) => {
      const nextCustom = { ...(prev.customTexts || {}) };
      if (!newText.trim() || newText.trim() === key) {
        delete nextCustom[key];
      } else {
        nextCustom[key] = newText;
      }
      return {
        ...prev,
        customTexts: nextCustom,
      };
    });
  }, []);

  const removeCustomText = useCallback((originalText: string) => {
    const key = originalText.trim();
    setState((prev) => {
      const nextCustom = { ...(prev.customTexts || {}) };
      delete nextCustom[key];
      return {
        ...prev,
        customTexts: nextCustom,
      };
    });
  }, []);

  const clearAllCustomTexts = useCallback(() => {
    setState((prev) => ({
      ...prev,
      customTexts: {},
    }));
  }, []);

  const appendMentorMessages = useCallback((newMessages: MentorChatMessage[]) => {
    const MAX_STORED_MESSAGES = 24;
    const MAX_MEMORY_CHARS = 800;

    setState((prev) => {
      const existing = prev.mentorChat?.messages || [];
      const existingSummary = prev.mentorChat?.memorySummary || '';
      const combined = [...existing, ...newMessages];

      let nextMessages = combined;
      let nextSummary = existingSummary;

      if (combined.length > MAX_STORED_MESSAGES) {
        const overflowCount = combined.length - MAX_STORED_MESSAGES;
        const evicted = combined.slice(0, overflowCount);
        nextMessages = combined.slice(overflowCount);

        // Extract compact context notes from evicted user messages and action cards
        const evictedNotes = evicted
          .filter((m) => m.sender === 'user' || m.actionCard)
          .map((m) => {
            if (m.actionCard) return `[Действие: ${m.actionCard.label}]`;
            const snippet = m.text.replace(/\s+/g, ' ').trim().slice(0, 110);
            return `• ${snippet}`;
          })
          .join(' ');

        if (evictedNotes) {
          const merged = nextSummary ? `${nextSummary} ${evictedNotes}` : evictedNotes;
          nextSummary = merged.length > MAX_MEMORY_CHARS
            ? '…' + merged.slice(merged.length - MAX_MEMORY_CHARS)
            : merged;
        }
      }

      return {
        ...prev,
        mentorChat: {
          messages: nextMessages,
          memorySummary: nextSummary,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const clearMentorChat = useCallback(() => {
    setState((prev) => ({
      ...prev,
      mentorChat: {
        messages: [],
        memorySummary: '',
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const updateMentorMemorySummary = useCallback((summary: string) => {
    setState((prev) => ({
      ...prev,
      mentorChat: {
        messages: prev.mentorChat?.messages || [],
        memorySummary: summary.slice(0, 800),
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const updateMentorMessage = useCallback((id: string, updates: Partial<MentorChatMessage>) => {
    setState((prev) => {
      if (!prev.mentorChat?.messages) return prev;
      return {
        ...prev,
        mentorChat: {
          ...prev.mentorChat,
          messages: prev.mentorChat.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const addNotebookItem = useCallback(
    (itemData: Omit<NotebookItem, 'id' | 'createdAt' | 'updatedAt'>): NotebookItem => {
      const nowIso = new Date().toISOString();
      const newItem: NotebookItem = {
        ...itemData,
        id: `nb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setState((prev) => ({
        ...prev,
        notebook: [newItem, ...(prev.notebook || [])],
        updatedAt: nowIso,
      }));
      return newItem;
    },
    []
  );

  const updateNotebookItem = useCallback((id: string, updates: Partial<NotebookItem>) => {
    const nowIso = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      notebook: (prev.notebook || []).map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: nowIso } : item
      ),
      updatedAt: nowIso,
    }));
  }, []);

  const deleteNotebookItem = useCallback((id: string) => {
    const nowIso = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      notebook: (prev.notebook || []).filter((item) => item.id !== id),
      updatedAt: nowIso,
    }));
  }, []);

  const togglePinNotebookItem = useCallback((id: string) => {
    const nowIso = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      notebook: (prev.notebook || []).map((item) =>
        item.id === id ? { ...item, isPinned: !item.isPinned, updatedAt: nowIso } : item
      ),
      updatedAt: nowIso,
    }));
  }, []);

  const language = state.settings.language || 'ru';

  const t = useCallback(
    (key: keyof typeof translations.ru): string => {
      const dict = translations[language] || translations.ru;
      return dict[key] || translations.ru[key] || (key as string);
    },
    [language]
  );

  const value = useMemo(
    () => ({
      state,
      language,
      setLanguage,
      theme,
      setTheme,
      toggleTheme,
      translateAllSampleDataToRussian,
      t,
      badges,
      milestoneStats,
      celebratingBadge,
      dismissCelebration,
      setDayMode,
      setEnergyLevel,
      toggleHabit,
      setHabitStatusForDate,
      cycleHabitStatus,
      toggleTask,
      addTask,
      updateTask,
      deleteTask,
      setMainTask,
      importExternalTasksToToday,
      activeReminderAlert,
      dismissReminderAlert,
      snoozeReminderAlert,
      testReminderNotification,
      saveEveningReflection,
      logSlipRecovery,
      updateWeeklyPlan,
      archiveAndStartNewWeek,
      updatePersonality,
      updateValues,
      updatePrinciples,
      updateGoal,
      addGoal,
      deleteGoal,
      addHabit,
      updateHabit,
      deleteHabit,
      exportStateJson,
      importStateJson,
      resetToDefaults,
      resetProgressOnly,
      toggleCloudSync,
      syncNowWithCloud,
      isCloudSyncing,
      cloudSyncStatus,
      isEditMode,
      setIsEditMode,
      toggleEditMode,
      customTexts,
      setCustomText,
      removeCustomText,
      clearAllCustomTexts,
      appendMentorMessages,
      updateMentorMessage,
      clearMentorChat,
      updateMentorMemorySummary,
      addNotebookItem,
      updateNotebookItem,
      deleteNotebookItem,
      togglePinNotebookItem,
      fontScale,
      setFontScale,
      cycleFontScale,
    }),
    [
      state,
      language,
      setLanguage,
      theme,
      setTheme,
      toggleTheme,
      translateAllSampleDataToRussian,
      t,
      badges,
      milestoneStats,
      celebratingBadge,
      dismissCelebration,
      setDayMode,
      setEnergyLevel,
      toggleHabit,
      setHabitStatusForDate,
      cycleHabitStatus,
      toggleTask,
      addTask,
      updateTask,
      deleteTask,
      setMainTask,
      clearCompletedTasks,
      importExternalTasksToToday,
      activeReminderAlert,
      dismissReminderAlert,
      snoozeReminderAlert,
      testReminderNotification,
      saveEveningReflection,
      logSlipRecovery,
      updateWeeklyPlan,
      archiveAndStartNewWeek,
      updatePersonality,
      updateValues,
      updatePrinciples,
      updateGoal,
      addGoal,
      deleteGoal,
      addHabit,
      updateHabit,
      deleteHabit,
      exportStateJson,
      importStateJson,
      resetToDefaults,
      resetProgressOnly,
      toggleCloudSync,
      syncNowWithCloud,
      isCloudSyncing,
      cloudSyncStatus,
      isEditMode,
      setIsEditMode,
      toggleEditMode,
      customTexts,
      setCustomText,
      removeCustomText,
      clearAllCustomTexts,
      appendMentorMessages,
      updateMentorMessage,
      clearMentorChat,
      updateMentorMemorySummary,
      addNotebookItem,
      updateNotebookItem,
      deleteNotebookItem,
      togglePinNotebookItem,
      fontScale,
      setFontScale,
      cycleFontScale,
    ]
  );

  return <FranklinContext.Provider value={value}>{children}</FranklinContext.Provider>;
};

export const useFranklin = () => {
  const context = useContext(FranklinContext);
  if (!context) {
    throw new Error('useFranklin must be used within a FranklinProvider');
  }
  return context;
};
