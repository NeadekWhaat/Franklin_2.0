import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken,
  onGoogleTokenExpired,
  fetchCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  fetchGoogleTasks,
  createGoogleTask,
  updateGoogleTaskStatus,
  deleteGoogleTask as apiDeleteGoogleTask,
  getCurrentHHMM,
  calculateEndTime,
  stripTimeDecorationsFromTitle,
  GoogleCalendarEvent,
  GoogleTaskItem,
} from '../services/googleWorkspace';
import { DailyTask } from '../types/franklin';
import { useFranklin, getLocalTodayDate } from './FranklinContext';

interface ConfirmationModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  isDestructive?: boolean;
  onConfirm: () => Promise<void> | void;
}

interface GoogleWorkspaceContextType {
  isConnected: boolean;
  user: User | null;
  isConnecting: boolean;
  isLoadingData: boolean;
  calendarEvents: GoogleCalendarEvent[];
  googleTasks: GoogleTaskItem[];
  lastRestoredCount: number;
  error: string | null;
  connectGoogle: () => Promise<boolean>;
  disconnectGoogle: () => Promise<void>;
  refreshData: () => Promise<void>;
  syncTaskToCalendar: (task: DailyTask, fallbackDate: string) => Promise<{ success: boolean; error?: string; eventId?: string }>;
  syncTaskToGoogleTasks: (task: DailyTask, fallbackDate?: string) => Promise<{ success: boolean; error?: string; googleTaskId?: string }>;
  syncTaskToBothCalendarAndTasks: (
    task: DailyTask,
    fallbackDate?: string
  ) => Promise<{ success: boolean; calendarEventId?: string; googleTaskId?: string; error?: string }>;
  requestDeleteCalendarEvent: (eventId: string, eventTitle: string) => void;
  requestDeleteGoogleTask: (taskId: string, taskTitle: string) => void;
  toggleGoogleTaskCompletion: (taskId: string, currentStatus: string) => Promise<void>;
  importGoogleTaskToDaily: (task: GoogleTaskItem) => void;
}

const GoogleWorkspaceContext = createContext<GoogleWorkspaceContextType | null>(null);

export const GoogleWorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { updateTask, importExternalTasksToToday, syncNowWithCloud } = useFranklin();

  const [user, setUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [googleTasks, setGoogleTasks] = useState<GoogleTaskItem[]>([]);
  const [lastRestoredCount, setLastRestoredCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // User confirmation modal state for destructive mutations (MANDATORY rule)
  const [confirmModal, setConfirmModal] = useState<ConfirmationModalState>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Подтвердить',
    isDestructive: false,
    onConfirm: () => {},
  });

  // Reconcile fetched Google Calendar events and Google Tasks into Franklin's daily tasks
  const reconcileGoogleItemsIntoFranklin = useCallback(
    (events: GoogleCalendarEvent[], tasks: GoogleTaskItem[]) => {
      const todayIso = getLocalTodayDate();
      const candidates: Array<Partial<DailyTask> & { title: string }> = [];

      for (const evt of events) {
        if (!evt.summary) continue;
        let eventDateStr = todayIso;
        let reminderHHMM: string | undefined;

        let eventDuration = 30;
        if (evt.start?.dateTime) {
          const dt = new Date(evt.start.dateTime);
          if (!isNaN(dt.getTime())) {
            eventDateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
            reminderHHMM = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
            if (evt.end?.dateTime) {
              const endDt = new Date(evt.end.dateTime);
              const diffMin = Math.round((endDt.getTime() - dt.getTime()) / 60000);
              if (diffMin > 0 && diffMin <= 720) {
                eventDuration = diffMin;
              }
            }
          }
        } else if (evt.start?.date) {
          eventDateStr = evt.start.date.slice(0, 10);
          eventDuration = 720;
        }

        const isAllDayEvt = Boolean(evt.start?.date && !evt.start?.dateTime);

        const isFranklinEvent =
          Boolean(evt.description && (evt.description.includes('Франклин') || evt.description.includes('Franklin'))) ||
          evt.summary.includes('[Якорь дня]') ||
          evt.summary.startsWith('⚡') ||
          evt.summary.startsWith('🎯');

        // Only import events scheduled for TODAY (never resurrect past-date events!)
        if (eventDateStr === todayIso) {
          const isMain = evt.summary.includes('[Якорь дня]');
          const cleanSummary = stripTimeDecorationsFromTitle(
            evt.summary.replace(/^⚡\s*\[Якорь дня\]\s*/i, '').trim()
          );
          candidates.push({
            id: `gcal-${evt.id}`,
            title: cleanSummary || evt.summary,
            isMainTask: isMain,
            minModeRequired: 'GREEN',
            completed: false,
            directionId: 'career',
            estimatedMinutes: eventDuration,
            reminderTime: reminderHHMM,
            endTime: reminderHHMM ? calculateEndTime(reminderHHMM, eventDuration) : undefined,
            isAllDay: isAllDayEvt,
            reminderDate: eventDateStr,
            scheduledDate: eventDateStr,
            googleCalendarEventId: evt.id,
          });
        }
      }

      for (const gt of tasks) {
        if (!gt.title) continue;
        // Never re-import already completed Google Tasks into today's active queue
        if (gt.status === 'completed') continue;
        const dueStr = gt.dueDate || (gt.due ? gt.due.slice(0, 10) : todayIso);
        // Never import past-due Google Tasks from previous days unless they have no due date
        if (dueStr < todayIso) continue;
        const dueTimeStr = gt.dueTime;
        if (dueStr === todayIso) {
          const cleanTaskTitle = stripTimeDecorationsFromTitle(gt.title)
            .replace(/^⚡\s*/i, '')
            .trim();
          const dur = gt.durationMinutes || 30;
          candidates.push({
            id: `gtask-${gt.id}`,
            title: cleanTaskTitle || gt.title,
            isMainTask: gt.title.includes('⚡'),
            minModeRequired: 'GREEN',
            completed: false,
            directionId: 'career',
            estimatedMinutes: dur,
            reminderTime: dueTimeStr,
            endTime: dueTimeStr ? calculateEndTime(dueTimeStr, dur) : undefined,
            isAllDay: Boolean(gt.isAllDay),
            reminderDate: dueStr,
            scheduledDate: dueStr,
            googleTaskId: gt.id,
          });
        }
      }

      if (candidates.length > 0) {
        const added = importExternalTasksToToday(candidates);
        if (added > 0) {
          setLastRestoredCount((prev) => prev + added);
          syncNowWithCloud();
        }
      }
    },
    [importExternalTasksToToday, syncNowWithCloud]
  );

  const refreshData = useCallback(async () => {
    const validToken = await getAccessToken();
    if (!isConnected || !validToken) {
      if (!validToken && isConnected) {
        setIsConnected(false);
      }
      return;
    }
    setIsLoadingData(true);
    setError(null);
    try {
      const [events, tasks] = await Promise.allSettled([
        fetchCalendarEvents(),
        fetchGoogleTasks(),
      ]);

      const fetchedEvents = events.status === 'fulfilled' ? events.value : [];
      const fetchedTasks = tasks.status === 'fulfilled' ? tasks.value : [];

      if (events.status === 'fulfilled') {
        setCalendarEvents(fetchedEvents);
      } else {
        console.warn('Calendar fetch error:', events.reason);
      }

      if (tasks.status === 'fulfilled') {
        setGoogleTasks(fetchedTasks);
      } else {
        console.warn('Google Tasks fetch error:', tasks.reason);
      }

      reconcileGoogleItemsIntoFranklin(fetchedEvents, fetchedTasks);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки данных Google');
    } finally {
      setIsLoadingData(false);
    }
  }, [isConnected, reconcileGoogleItemsIntoFranklin]);

  useEffect(() => {
    const unsubscribeAuth = initAuth(
      (authUser) => {
        setUser(authUser);
        setIsConnected(true);
      },
      () => {
        setUser(null);
        setIsConnected(false);
        setCalendarEvents([]);
        setGoogleTasks([]);
      }
    );
    const unsubscribeExpiry = onGoogleTokenExpired(() => {
      setIsConnected(false);
    });
    return () => {
      unsubscribeAuth();
      unsubscribeExpiry();
    };
  }, []);

  useEffect(() => {
    if (isConnected) {
      refreshData();
    }
  }, [isConnected, refreshData]);

  const connectGoogle = async (): Promise<boolean> => {
    setIsConnecting(true);
    setError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setIsConnected(true);
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message || 'Не удалось подключить Google Workspace');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectGoogle = async () => {
    try {
      await logoutGoogle();
      setUser(null);
      setIsConnected(false);
      setCalendarEvents([]);
      setGoogleTasks([]);
    } catch (err: any) {
      setError(err.message || 'Ошибка выхода из Google');
    }
  };

  const syncTaskToCalendar = async (
    task: DailyTask,
    fallbackDate: string
  ): Promise<{ success: boolean; error?: string; eventId?: string }> => {
    const existingToken = await getAccessToken();
    if (!isConnected || !existingToken) {
      const connectedNow = await connectGoogle();
      if (!connectedNow) {
        return { success: false, error: 'Google Календарь не подключён. Нажмите «Войти через Google».' };
      }
    }

    const date = task.scheduledDate || task.reminderDate || fallbackDate || getLocalTodayDate();
    const time = task.reminderTime || getCurrentHHMM();
    const duration = task.isAllDay ? 720 : task.estimatedMinutes || 30;

    const runCreate = () =>
      createCalendarEvent({
        title: `${task.isMainTask ? '⚡ [Якорь дня] ' : ''}${task.title}`,
        description: `Задача из Личной ОС Франклин 2.0 (Режим: ${task.minModeRequired})`,
        startDate: date,
        startTime: time,
        durationMinutes: duration,
        isAllDay: task.isAllDay,
        existingEventId: task.googleCalendarEventId,
      });

    try {
      let createdEvt: GoogleCalendarEvent;
      try {
        createdEvt = await runCreate();
      } catch (firstErr: any) {
        if (
          String(firstErr?.message || '').includes('истекла') ||
          String(firstErr?.message || '').includes('Not authenticated')
        ) {
          const reconnected = await connectGoogle();
          if (!reconnected) throw firstErr;
          createdEvt = await runCreate();
        } else {
          throw firstErr;
        }
      }

      if (createdEvt?.id) {
        updateTask(task.id, {
          googleCalendarEventId: createdEvt.id,
          reminderTime: time,
          endTime: task.endTime || calculateEndTime(time, duration),
          isAllDay: task.isAllDay,
          reminderDate: date,
          scheduledDate: date,
          estimatedMinutes: duration,
        });
        syncNowWithCloud();
      }

      await refreshData();
      return { success: true, eventId: createdEvt?.id };
    } catch (err: any) {
      return { success: false, error: err.message || 'Ошибка синхронизации с Google Календарём' };
    }
  };

  const syncTaskToGoogleTasks = async (
    task: DailyTask,
    fallbackDate?: string
  ): Promise<{ success: boolean; error?: string; googleTaskId?: string }> => {
    const existingToken = await getAccessToken();
    if (!isConnected || !existingToken) {
      const connectedNow = await connectGoogle();
      if (!connectedNow) {
        return { success: false, error: 'Google Tasks не подключён. Нажмите «Войти через Google».' };
      }
    }

    const date = task.scheduledDate || task.reminderDate || fallbackDate || getLocalTodayDate();
    const time = task.reminderTime || getCurrentHHMM();
    const duration = task.isAllDay ? 720 : task.estimatedMinutes || 30;

    const runCreateTask = () =>
      createGoogleTask({
        title: `${task.isMainTask ? '⚡ ' : ''}${task.title}`,
        notes: `Синхронизировано из Франклин 2.0. Режим дня: ${task.minModeRequired}`,
        dueDate: date,
        dueTime: time,
        durationMinutes: duration,
        isAllDay: task.isAllDay,
        existingTaskId: task.googleTaskId,
      });

    try {
      let createdTask: GoogleTaskItem;
      try {
        createdTask = await runCreateTask();
      } catch (firstErr: any) {
        if (
          String(firstErr?.message || '').includes('истекла') ||
          String(firstErr?.message || '').includes('Not authenticated')
        ) {
          const reconnected = await connectGoogle();
          if (!reconnected) throw firstErr;
          createdTask = await runCreateTask();
        } else {
          throw firstErr;
        }
      }

      if (createdTask?.id) {
        updateTask(task.id, {
          googleTaskId: createdTask.id,
          reminderTime: time,
          endTime: task.endTime || calculateEndTime(time, duration),
          isAllDay: task.isAllDay,
          reminderDate: date,
          scheduledDate: date,
          estimatedMinutes: duration,
        });
        syncNowWithCloud();
      }

      await refreshData();
      return { success: true, googleTaskId: createdTask?.id };
    } catch (err: any) {
      return { success: false, error: err.message || 'Ошибка добавления в Google Tasks' };
    }
  };

  const syncTaskToBothCalendarAndTasks = async (
    task: DailyTask,
    fallbackDate?: string
  ): Promise<{ success: boolean; calendarEventId?: string; googleTaskId?: string; error?: string }> => {
    const existingToken = await getAccessToken();
    if (!isConnected || !existingToken) {
      const connectedNow = await connectGoogle();
      if (!connectedNow) {
        return { success: false, error: 'Google Workspace не подключён. Нажмите «Войти через Google».' };
      }
    }

    const date = task.scheduledDate || task.reminderDate || fallbackDate || getLocalTodayDate();
    const time = task.reminderTime || getCurrentHHMM();
    const duration = task.isAllDay ? 720 : task.estimatedMinutes || 30;

    const executeBoth = () =>
      Promise.allSettled([
        createCalendarEvent({
          title: `${task.isMainTask ? '⚡ [Якорь дня] ' : ''}${task.title}`,
          description: `Задача из Личной ОС Франклин 2.0 (Режим: ${task.minModeRequired})`,
          startDate: date,
          startTime: time,
          durationMinutes: duration,
          isAllDay: task.isAllDay,
          existingEventId: task.googleCalendarEventId,
        }),
        createGoogleTask({
          title: `${task.isMainTask ? '⚡ ' : ''}${task.title}`,
          notes: `Синхронизировано из Франклин 2.0. Режим дня: ${task.minModeRequired}`,
          dueDate: date,
          dueTime: time,
          durationMinutes: duration,
          isAllDay: task.isAllDay,
          existingTaskId: task.googleTaskId,
        }),
      ]);

    try {
      let [calRes, taskRes] = await executeBoth();

      if (calRes.status === 'rejected' && taskRes.status === 'rejected') {
        const errMsg = String(calRes.reason?.message || taskRes.reason?.message || '');
        if (errMsg.includes('истекла') || errMsg.includes('Not authenticated')) {
          const reconnected = await connectGoogle();
          if (reconnected) {
            [calRes, taskRes] = await executeBoth();
          }
        }
      }

      const calId = calRes.status === 'fulfilled' ? calRes.value?.id : undefined;
      const gTaskId = taskRes.status === 'fulfilled' ? taskRes.value?.id : undefined;

      if (calId || gTaskId) {
        updateTask(task.id, {
          ...(calId ? { googleCalendarEventId: calId } : {}),
          ...(gTaskId ? { googleTaskId: gTaskId } : {}),
          reminderTime: time,
          endTime: task.endTime || calculateEndTime(time, duration),
          isAllDay: task.isAllDay,
          reminderDate: date,
          scheduledDate: date,
          estimatedMinutes: duration,
        });
        syncNowWithCloud();
      }

      await refreshData();
      const firstError =
        calRes.status === 'rejected'
          ? calRes.reason?.message
          : taskRes.status === 'rejected'
          ? taskRes.reason?.message
          : undefined;
      return {
        success: Boolean(calId || gTaskId),
        calendarEventId: calId,
        googleTaskId: gTaskId,
        error: !calId && !gTaskId ? firstError || 'Не удалось синхронизировать с Google' : undefined,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Ошибка синхронизации с Google' };
    }
  };

  const requestDeleteCalendarEvent = (eventId: string, eventTitle: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Удалить событие из Google Календаря?',
      message: `Вы действительно хотите удалить «${eventTitle}» из вашего Google Календаря? Это действие нельзя отменить.`,
      confirmLabel: 'Удалить событие',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteCalendarEvent(eventId);
          await refreshData();
        } catch (err: any) {
          setError(err.message || 'Не удалось удалить событие');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const requestDeleteGoogleTask = (taskId: string, taskTitle: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Удалить задачу из Google Tasks?',
      message: `Вы действительно хотите удалить задачу «${taskTitle}» из списка Google Tasks?`,
      confirmLabel: 'Удалить задачу',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await apiDeleteGoogleTask(taskId);
          await refreshData();
        } catch (err: any) {
          setError(err.message || 'Не удалось удалить задачу');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const toggleGoogleTaskCompletion = async (taskId: string, currentStatus: string) => {
    const isCompleted = currentStatus === 'completed';
    try {
      await updateGoogleTaskStatus(taskId, !isCompleted);
      await refreshData();
    } catch (err: any) {
      setError(err.message || 'Не удалось обновить статус задачи Google');
    }
  };

  const importGoogleTaskToDaily = (_task: GoogleTaskItem) => {
    // Handled automatically by reconcileGoogleItemsIntoFranklin or manual trigger
  };

  return (
    <GoogleWorkspaceContext.Provider
      value={{
        isConnected,
        user,
        isConnecting,
        isLoadingData,
        calendarEvents,
        googleTasks,
        lastRestoredCount,
        error,
        connectGoogle,
        disconnectGoogle,
        refreshData,
        syncTaskToCalendar,
        syncTaskToGoogleTasks,
        syncTaskToBothCalendarAndTasks,
        requestDeleteCalendarEvent,
        requestDeleteGoogleTask,
        toggleGoogleTaskCompletion,
        importGoogleTaskToDaily,
      }}
    >
      {children}

      {/* Mandatory User Confirmation Dialog for Destructive Operations */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#0f131c] border border-slate-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in text-slate-800 dark:text-neutral-100">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {confirmModal.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => confirmModal.onConfirm()}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors ${
                  confirmModal.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-xs'
                    : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-neutral-900'
                }`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </GoogleWorkspaceContext.Provider>
  );
};

export const useGoogleWorkspace = () => {
  const ctx = useContext(GoogleWorkspaceContext);
  if (!ctx) {
    throw new Error('useGoogleWorkspace must be used within a GoogleWorkspaceProvider');
  }
  return ctx;
};
