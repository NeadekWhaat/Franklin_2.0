import React, { useState } from 'react';
import { useGoogleWorkspace } from '../context/GoogleWorkspaceContext';
import { useFranklin } from '../context/FranklinContext';
import {
  Calendar as CalendarIcon,
  CheckSquare,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  Check,
  AlertCircle,
  LogIn,
  LogOut,
  Sparkles,
  ArrowDownToLine,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  createCalendarEvent,
  createGoogleTask,
  calculateEndTime,
  formatDurationLabel,
  stripTimeDecorationsFromTitle,
} from '../services/googleWorkspace';

interface GoogleWorkspaceHubProps {
  defaultTab?: 'calendar' | 'tasks';
  isCompact?: boolean;
}

export const GoogleWorkspaceHub: React.FC<GoogleWorkspaceHubProps> = ({
  defaultTab = 'calendar',
  isCompact = false,
}) => {
  const {
    isConnected,
    user,
    isConnecting,
    isLoadingData,
    calendarEvents,
    googleTasks,
    error,
    connectGoogle,
    disconnectGoogle,
    refreshData,
    requestDeleteCalendarEvent,
    requestDeleteGoogleTask,
    toggleGoogleTaskCompletion,
  } = useGoogleWorkspace();

  const { addTask, language } = useFranklin();
  const isRu = language === 'ru';

  const [activeTab, setActiveTab] = useState<'calendar' | 'tasks'>(defaultTab);
  const [isCollapsed, setIsCollapsed] = useState(isCompact);

  // New calendar event form state
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [eventTime, setEventTime] = useState('11:00');
  const [eventDuration, setEventDuration] = useState<number>(30);

  // New Google task form state (with Date, Time & Duration!)
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDate, setTaskDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [taskTime, setTaskTime] = useState('12:00');
  const [taskDuration, setTaskDuration] = useState<number>(30);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    try {
      const cleanTitle = eventTitle.trim();
      const createdEvt = await createCalendarEvent({
        title: cleanTitle,
        startDate: eventDate,
        startTime: eventTime,
        durationMinutes: eventDuration,
      });

      // Also save in Franklin daily tasks with date, time & duration!
      addTask({
        title: cleanTitle,
        directionId: 'career',
        minModeRequired: 'GREEN',
        isMainTask: false,
        estimatedMinutes: eventDuration,
        reminderTime: eventTime,
        reminderDate: eventDate,
        scheduledDate: eventDate,
        googleCalendarEventId: createdEvt?.id,
      });
      setEventTitle('');
      setShowAddEvent(false);
      setActionSuccess(
        isRu
          ? `📅 Событие «${cleanTitle}» (${eventDate}, ${eventTime}–${calculateEndTime(eventTime, eventDuration)}) создано в Google Календаре и Задачах дня!`
          : `📅 Event (${eventDate} at ${eventTime}) saved to Google Calendar & Franklin!`
      );
      await refreshData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    try {
      const cleanTitle = taskTitle.trim();
      const createdTask = await createGoogleTask({
        title: cleanTitle,
        notes: 'Создано из ОС Франклин 2.0',
        dueDate: taskDate,
        dueTime: taskTime,
        durationMinutes: taskDuration,
      });

      // Also save in Franklin daily tasks with date, time & duration!
      addTask({
        title: cleanTitle,
        directionId: 'career',
        minModeRequired: 'GREEN',
        isMainTask: false,
        estimatedMinutes: taskDuration,
        reminderTime: taskTime,
        reminderDate: taskDate,
        scheduledDate: taskDate,
        googleTaskId: createdTask?.id,
      });
      setTaskTitle('');
      setShowAddTask(false);
      setActionSuccess(
        isRu
          ? `✅ Напоминание «${cleanTitle}» (${taskDate}, ${taskTime}–${calculateEndTime(taskTime, taskDuration)}) создано в Google Tasks и Задачах дня!`
          : `✅ Reminder (${taskDate} at ${taskTime}) saved to Google Tasks & Franklin!`
      );
      await refreshData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleImportToFranklin = (t: { id: string; title: string; dueDate?: string; dueTime?: string; durationMinutes?: number }) => {
    const cleanTitle = stripTimeDecorationsFromTitle(t.title);
    addTask({
      title: cleanTitle || t.title,
      directionId: 'career',
      minModeRequired: 'GREEN',
      isMainTask: false,
      estimatedMinutes: t.durationMinutes || 30,
      reminderTime: t.dueTime,
      reminderDate: t.dueDate,
      scheduledDate: t.dueDate,
      googleTaskId: t.id,
    });
    setActionSuccess(isRu ? `«${cleanTitle}» добавлена в задачи дня!` : `"${cleanTitle}" added to daily tasks!`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  return (
    <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/90 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            G
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Google Workspace
              </h3>
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-neutral-600'
                }`}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              {isRu
                ? 'Синхронизация с Google Календарём и Google Tasks'
                : 'Google Calendar & Tasks Real-Time Sync'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected && (
            <button
              type="button"
              onClick={() => refreshData()}
              disabled={isLoadingData}
              className="p-1.5 rounded-lg text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              title={isRu ? 'Обновить данные Google' : 'Refresh Google data'}
            >
              <RefreshCw size={14} className={isLoadingData ? 'animate-spin' : ''} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed((v) => !v)}
            className="p-1.5 rounded-lg text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
            title={isCollapsed ? (isRu ? 'Развернуть' : 'Expand') : (isRu ? 'Свернуть' : 'Collapse')}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
          <Check size={14} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs font-medium text-rose-800 dark:text-rose-300 flex items-center gap-2 animate-fade-in">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content when not collapsed */}
      {!isCollapsed && (
        <div className="space-y-4 pt-1">
          {/* Sign in with Google Button (MANDATORY standard format from workspace skill) */}
          {!isConnected ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 text-center space-y-3">
              <p className="text-xs text-slate-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
                {isRu
                  ? 'Подключите ваш Google аккаунт для двусторонней синхронизации задач дня с Google Tasks и событий с Google Календарём прямо на ваш рабочий стол и телефон.'
                  : 'Connect your Google account to sync daily tasks with Google Tasks and events with Google Calendar directly to your PC and mobile device.'}
              </p>

              <button
                type="button"
                onClick={connectGoogle}
                disabled={isConnecting}
                className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1b2030] hover:bg-slate-100 dark:hover:bg-[#22283d] text-slate-800 dark:text-white border border-slate-300 dark:border-neutral-700 shadow-sm text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {/* Official Google 'G' Icon */}
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>
                  {isConnecting
                    ? isRu
                      ? 'Подключение...'
                      : 'Connecting...'
                    : isRu
                    ? 'Войти через Google'
                    : 'Sign in with Google'}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Account badge & disconnect button */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 text-xs">
                <div className="flex items-center gap-2.5">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google User'}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[10px]">
                      {user?.displayName?.[0] || 'G'}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-neutral-200">
                      {user?.displayName || 'Google Account'}
                    </span>
                    <span className="text-slate-400 dark:text-neutral-500 text-[11px] ml-1.5 hidden sm:inline">
                      ({user?.email})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={disconnectGoogle}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-500 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 text-[11px] font-medium transition-colors"
                >
                  <LogOut size={12} />
                  <span>{isRu ? 'Отключить' : 'Disconnect'}</span>
                </button>
              </div>

              {/* Sub-tabs: Google Calendar vs Google Tasks */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-neutral-800 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('calendar')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'calendar'
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <CalendarIcon size={13} />
                  <span>
                    {isRu ? 'Google Календарь' : 'Google Calendar'} ({calendarEvents.length})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('tasks')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'tasks'
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <CheckSquare size={13} />
                  <span>
                    {isRu ? 'Google Tasks' : 'Google Tasks'} ({googleTasks.length})
                  </span>
                </button>
              </div>

              {/* TAB 1: GOOGLE CALENDAR */}
              {activeTab === 'calendar' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                      {isRu ? 'Предстоящие события' : 'Upcoming Events'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddEvent((v) => !v)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Plus size={12} />
                      <span>{isRu ? 'Создать событие' : 'New Event'}</span>
                    </button>
                  </div>

                  {showAddEvent && (
                    <form
                      onSubmit={handleCreateEvent}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 space-y-2.5 animate-fade-in"
                    >
                      <input
                        type="text"
                        required
                        placeholder={isRu ? 'Название события' : 'Event summary'}
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0e1118] border border-slate-300 dark:border-neutral-700 text-xs text-slate-900 dark:text-white"
                      />
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0e1118] border border-slate-300 dark:border-neutral-700 text-slate-800 dark:text-white text-xs"
                        />
                        <input
                          type="time"
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0e1118] border border-slate-300 dark:border-neutral-700 text-slate-800 dark:text-white text-xs"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddEvent(false)}
                          className="px-3 py-1 rounded-lg text-xs text-slate-500"
                        >
                          {isRu ? 'Отмена' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                        >
                          {isRu ? 'Сохранить в Календарь' : 'Save to Calendar'}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {calendarEvents.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-400">
                        {isRu ? 'Нет запланированных событий на этот период' : 'No events scheduled'}
                      </div>
                    ) : (
                      calendarEvents.map((evt) => {
                        let dateTimeDisplay = evt.start.date || '';
                        if (evt.start.dateTime) {
                          const dt = new Date(evt.start.dateTime);
                          if (!isNaN(dt.getTime())) {
                            const dStr = dt.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            });
                            const tStr = dt.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                            dateTimeDisplay = `📅 ${dStr} · ⏰ ${tStr}`;
                          }
                        }
                        return (
                          <div
                            key={evt.id}
                            className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/80 dark:border-neutral-800/80 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 dark:text-white truncate">
                                {evt.summary}
                              </div>
                              <div className="text-[11px] text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                                {dateTimeDisplay}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {evt.htmlLink && (
                                <a
                                  href={evt.htmlLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-lg text-slate-400 hover:text-blue-500"
                                  title={isRu ? 'Открыть в Google Календаре' : 'Open in Google Calendar'}
                                >
                                  <ExternalLink size={13} />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => requestDeleteCalendarEvent(evt.id, evt.summary)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-500"
                                title={isRu ? 'Удалить из Google Календаря' : 'Delete from Google Calendar'}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: GOOGLE TASKS */}
              {activeTab === 'tasks' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                      {isRu ? 'Задачи из Google Tasks' : 'Google Tasks List'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddTask((v) => !v)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Plus size={12} />
                      <span>{isRu ? 'Добавить задачу' : 'New Task'}</span>
                    </button>
                  </div>

                  {showAddTask && (
                    <form
                      onSubmit={handleCreateTask}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 space-y-2.5 animate-fade-in"
                    >
                      <input
                        type="text"
                        required
                        placeholder={isRu ? 'Название задачи в Google Tasks и Календарь' : 'Task title'}
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0e1118] border border-slate-300 dark:border-neutral-700 text-xs text-slate-900 dark:text-white"
                      />
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <input
                          type="date"
                          value={taskDate}
                          onChange={(e) => setTaskDate(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0e1118] border border-slate-300 dark:border-neutral-700 text-slate-800 dark:text-white text-xs font-mono"
                        />
                        <input
                          type="time"
                          value={taskTime}
                          onChange={(e) => setTaskTime(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0e1118] border border-slate-300 dark:border-neutral-700 text-slate-800 dark:text-white text-xs font-mono"
                        />
                        <select
                          value={taskDuration}
                          onChange={(e) => setTaskDuration(Number(e.target.value))}
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0e1118] border border-slate-300 dark:border-neutral-700 text-slate-800 dark:text-white text-xs font-mono"
                        >
                          <option value={10}>{isRu ? '10 мин' : '10m'}</option>
                          <option value={15}>{isRu ? '15 мин' : '15m'}</option>
                          <option value={30}>{isRu ? '30 мин' : '30m'}</option>
                          <option value={45}>{isRu ? '45 мин' : '45m'}</option>
                          <option value={60}>{isRu ? '1 час' : '1h'}</option>
                          <option value={90}>{isRu ? '1.5 часа' : '1.5h'}</option>
                          <option value={120}>{isRu ? '2 часа' : '2h'}</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddTask(false)}
                          className="px-3 py-1 rounded-lg text-xs text-slate-500"
                        >
                          {isRu ? 'Отмена' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                        >
                          {isRu ? 'Сохранить в Google Tasks' : 'Save to Google Tasks'}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {googleTasks.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-400">
                        {isRu ? 'Нет задач в Google Tasks' : 'No tasks in Google Tasks'}
                      </div>
                    ) : (
                      googleTasks.map((t) => {
                        const isDone = t.status === 'completed';
                        const displayTitle = stripTimeDecorationsFromTitle(t.title) || t.title;
                        return (
                          <div
                            key={t.id}
                            className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs transition-colors ${
                              isDone
                                ? 'bg-slate-50/60 dark:bg-[#141824]/60 border-slate-200/50 dark:border-neutral-800/50 opacity-60'
                                : 'bg-slate-50 dark:bg-[#141824] border-slate-200/80 dark:border-neutral-800/80'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <button
                                type="button"
                                onClick={() => toggleGoogleTaskCompletion(t.id, t.status)}
                                className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                                  isDone
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'border-slate-300 dark:border-neutral-600 hover:border-blue-500'
                                }`}
                              >
                                {isDone && <Check size={11} className="stroke-[3]" />}
                              </button>
                              <div className="min-w-0">
                                <div
                                  className={`truncate font-medium ${
                                    isDone
                                      ? 'line-through text-slate-400 dark:text-neutral-500'
                                      : 'text-slate-800 dark:text-neutral-200'
                                  }`}
                                >
                                  {displayTitle}
                                </div>
                                {(t.dueDate || t.dueTime) && (
                                  <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                                    {t.dueDate && <span>📅 {t.dueDate}</span>}
                                    {t.dueTime && (
                                      <span className="font-semibold">
                                        ⏰ {t.dueTime}–{calculateEndTime(t.dueTime, t.durationMinutes || 30)} ({formatDurationLabel(t.durationMinutes || 30, isRu)})
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleImportToFranklin(t)}
                                className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                                title={isRu ? 'Импортировать в задачи Франклина' : 'Import to Franklin daily tasks'}
                              >
                                <ArrowDownToLine size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => requestDeleteGoogleTask(t.id, t.title)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-500"
                                title={isRu ? 'Удалить из Google Tasks' : 'Delete from Google Tasks'}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
