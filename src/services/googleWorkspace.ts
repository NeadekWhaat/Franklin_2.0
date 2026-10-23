import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Reuse existing app if initialized
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks',
];

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));

const TOKEN_STORAGE_KEY = 'franklin_gws_oauth_token_v1';
const TOKEN_EXPIRY_MS = 55 * 60 * 1000; // 55 minutes (Google OAuth access tokens last 60 mins)

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedTokenExpiresAt = 0;
const tokenExpiredListeners = new Set<() => void>();

export function onGoogleTokenExpired(cb: () => void): () => void {
  tokenExpiredListeners.add(cb);
  return () => {
    tokenExpiredListeners.delete(cb);
  };
}

function saveTokenToStorage(token: string, uid?: string) {
  const expiresAt = Date.now() + TOKEN_EXPIRY_MS;
  cachedAccessToken = token;
  cachedTokenExpiresAt = expiresAt;
  try {
    localStorage.setItem(
      TOKEN_STORAGE_KEY,
      JSON.stringify({
        token,
        uid: uid || auth.currentUser?.uid || '',
        expiresAt,
      })
    );
  } catch (e) {
    console.warn('Could not persist Google token in localStorage:', e);
  }
}

function loadTokenFromStorage(expectedUid?: string): string | null {
  if (cachedAccessToken && cachedTokenExpiresAt > Date.now()) {
    return cachedAccessToken;
  }
  cachedAccessToken = null;
  cachedTokenExpiresAt = 0;
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.expiresAt) return null;
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      tokenExpiredListeners.forEach((cb) => cb());
      return null;
    }
    if (expectedUid && parsed.uid && parsed.uid !== expectedUid) {
      return null;
    }
    cachedAccessToken = parsed.token;
    cachedTokenExpiresAt = parsed.expiresAt;
    return cachedAccessToken;
  } catch {
    return null;
  }
}

export function clearStoredToken() {
  cachedAccessToken = null;
  cachedTokenExpiresAt = 0;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
  tokenExpiredListeners.forEach((cb) => cb());
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const restoredToken = loadTokenFromStorage(user.uid);
      if (restoredToken) {
        if (onAuthSuccess) onAuthSuccess(user, restoredToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      clearStoredToken();
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token from authentication flow.');
    }
    saveTokenToStorage(credential.accessToken, result.user.uid);
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return loadTokenFromStorage(auth.currentUser?.uid);
};

export const logoutGoogle = async () => {
  clearStoredToken();
  await signOut(auth);
};

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS FOR DATE & TIME FORMATTING
   ───────────────────────────────────────────────────────────────────────────── */

export function getCurrentHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function calculateEndTime(startTime?: string, durationMinutes = 30): string {
  const parts = (startTime || getCurrentHHMM()).split(':');
  const startH = Number.isFinite(parseInt(parts[0], 10)) ? parseInt(parts[0], 10) : 10;
  const startM = Number.isFinite(parseInt(parts[1], 10)) ? parseInt(parts[1], 10) : 0;
  const totalMinutes = (startH * 60 + startM + (durationMinutes || 30)) % (24 * 60);
  const endH = Math.floor(totalMinutes / 60);
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

export function calculateDurationBetween(startTime?: string, endTime?: string): number {
  const sParts = (startTime || '10:00').split(':');
  const eParts = (endTime || '10:30').split(':');
  const sH = Number.isFinite(parseInt(sParts[0], 10)) ? parseInt(sParts[0], 10) : 10;
  const sM = Number.isFinite(parseInt(sParts[1], 10)) ? parseInt(sParts[1], 10) : 0;
  const eH = Number.isFinite(parseInt(eParts[0], 10)) ? parseInt(eParts[0], 10) : 10;
  const eM = Number.isFinite(parseInt(eParts[1], 10)) ? parseInt(eParts[1], 10) : 30;
  const diff = (eH * 60 + eM - (sH * 60 + sM) + 24 * 60) % (24 * 60);
  return diff > 0 ? diff : 30;
}

export function formatDurationLabel(minutes = 30, isRu = true, isAllDay = false): string {
  if (isAllDay || minutes >= 720) {
    return isRu ? 'Весь день' : 'All day';
  }
  const m = Number(minutes) || 30;
  if (m < 60) {
    return isRu ? `${m} мин` : `${m}m`;
  }
  const hours = Math.floor(m / 60);
  const rem = m % 60;
  if (rem === 0) {
    if (isRu) {
      return hours === 1 ? '1 час' : hours < 5 ? `${hours} часа` : `${hours} часов`;
    }
    return hours === 1 ? '1 hr' : `${hours} hrs`;
  }
  return isRu ? `${hours} ч ${rem} мин` : `${hours}h ${rem}m`;
}

export function stripTimeDecorationsFromTitle(title?: string): string {
  return (title || '')
    .replace(/^☀️\s*\[?(?:Весь день|All day)\]?\s*[·—|-]?\s*/i, '')
    .replace(/^⏰\s*\d{1,2}:\d{2}(?:[–-]\d{1,2}:\d{2})?(?:\s*\([^)]*\))?\s*[·—|-]?\s*/i, '')
    .replace(/\s*\[⏰[^\]]*\]\s*$/i, '')
    .trim();
}

const GTASK_TIME_CACHE_KEY = 'franklin_gtask_times_v1';

interface CachedTaskTimeMeta {
  dueDate: string;
  dueTime: string;
  durationMinutes: number;
  isAllDay?: boolean;
}

function saveTaskTimeMeta(taskId: string, meta: CachedTaskTimeMeta) {
  if (!taskId) return;
  try {
    const raw = localStorage.getItem(GTASK_TIME_CACHE_KEY);
    const map: Record<string, CachedTaskTimeMeta> = raw ? JSON.parse(raw) : {};
    map[taskId] = meta;
    localStorage.setItem(GTASK_TIME_CACHE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

function getTaskTimeMeta(taskId: string): CachedTaskTimeMeta | undefined {
  if (!taskId) return undefined;
  try {
    const raw = localStorage.getItem(GTASK_TIME_CACHE_KEY);
    if (!raw) return undefined;
    const map: Record<string, CachedTaskTimeMeta> = JSON.parse(raw);
    return map[taskId];
  } catch {
    return undefined;
  }
}

function buildLocalDateTimeIso(dateStr: string, timeStr?: string, durationMinutes = 30): { startIso: string; endIso: string; timeZone: string } {
  const cleanDate = dateStr || new Date().toISOString().slice(0, 10);
  const parts = (timeStr || getCurrentHHMM()).split(':');
  const startH = Number.isFinite(parseInt(parts[0], 10)) ? parseInt(parts[0], 10) : 10;
  const startM = Number.isFinite(parseInt(parts[1], 10)) ? parseInt(parts[1], 10) : 0;

  const [y, m, d] = cleanDate.split('-').map((n) => parseInt(n, 10));
  const startDt = new Date(y, (m || 1) - 1, d || 1, startH, startM, 0);
  const endDt = new Date(startDt.getTime() + (durationMinutes || 30) * 60 * 1000);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  return {
    startIso: startDt.toISOString(),
    endIso: endDt.toISOString(),
    timeZone,
  };
}

export function extractTimeFromTextOrNotes(title?: string, notes?: string, due?: string): string | undefined {
  const combined = `${title || ''} ${notes || ''}`;
  const match = combined.match(/(?:⏰\s*|Время(?:\s*выполнения)?:\s*|\[)(\d{1,2}:\d{2})/i);
  if (match && match[1]) {
    const [h, m] = match[1].split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }
  if (due && due.includes('T')) {
    const timePart = due.split('T')[1]?.slice(0, 5);
    if (timePart && timePart !== '00:00') {
      return timePart;
    }
  }
  return undefined;
}

export function extractDurationFromTextOrNotes(title?: string, notes?: string): number | undefined {
  const combined = `${title || ''} ${notes || ''}`;
  const minMatch = combined.match(/\((\d+)\s*мин\)/i) || combined.match(/Длительность:\s*(\d+)\s*мин/i);
  if (minMatch && minMatch[1]) {
    const parsed = parseInt(minMatch[1], 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  const hrMatch = combined.match(/\((\d+(?:\.\d+)?)\s*(?:час|часа|часов|ч)\)/i);
  if (hrMatch && hrMatch[1]) {
    const parsed = Math.round(parseFloat(hrMatch[1]) * 60);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

export function extractDateFromNotesOrDue(due?: string, notes?: string): string | undefined {
  if (notes) {
    const m = notes.match(/Дата:\s*(\d{4}-\d{2}-\d{2})/);
    if (m && m[1]) return m[1];
  }
  if (due) {
    return due.slice(0, 10);
  }
  return undefined;
}

/* ─────────────────────────────────────────────────────────────────────────────
   GOOGLE CALENDAR API
   ───────────────────────────────────────────────────────────────────────────── */

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

export async function fetchCalendarEvents(timeMin?: string, timeMax?: string): Promise<GoogleCalendarEvent[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const now = new Date();
  const min = timeMin || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const max = timeMax || new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59).toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    min
  )}&timeMax=${encodeURIComponent(max)}&singleEvents=true&orderBy=startTime&maxResults=100`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (response.status === 401) {
    clearStoredToken();
    throw new Error('Сессия Google истекла (1 час). Пожалуйста, нажмите «Войти через Google» для обновления.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Calendar API error: ${response.status}`);
  }

  const data = await response.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    summary: item.summary || 'Без названия',
    description: item.description,
    start: item.start || {},
    end: item.end || {},
    htmlLink: item.htmlLink,
  }));
}

export async function createCalendarEvent(event: {
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  durationMinutes?: number;
  isAllDay?: boolean;
  existingEventId?: string;
}): Promise<GoogleCalendarEvent> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const effectiveTime = event.startTime || getCurrentHHMM();
  const { startIso, timeZone } = buildLocalDateTimeIso(event.startDate, effectiveTime);
  const duration = event.isAllDay ? 720 : event.durationMinutes || 30;
  const startDt = new Date(startIso);
  const endDt = new Date(startDt.getTime() + duration * 60 * 1000);

  let startObj: { dateTime?: string; date?: string; timeZone?: string } = {
    dateTime: startDt.toISOString(),
    timeZone,
  };
  let endObj: { dateTime?: string; date?: string; timeZone?: string } = {
    dateTime: endDt.toISOString(),
    timeZone,
  };

  if (event.isAllDay) {
    const [y, m, d] = event.startDate.split('-').map((n) => parseInt(n, 10));
    const nextDate = new Date(y, (m || 1) - 1, (d || 1) + 1);
    const nextDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
    startObj = { date: event.startDate };
    endObj = { date: nextDateStr };
  }

  const payload = {
    summary: event.title,
    description: `${event.description || 'Задача из Личной ОС Франклин 2.0'}\n📅 Дата: ${event.startDate} | ${
      event.isAllDay ? '☀️ Весь день' : `⏰ Время: ${effectiveTime}–${calculateEndTime(effectiveTime, duration)} (${formatDurationLabel(duration, true)})`
    }`,
    start: startObj,
    end: endObj,
    reminders: event.isAllDay
      ? { useDefault: true }
      : {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 10 },
            { method: 'email', minutes: 30 },
          ],
        },
  };

  if (event.existingEventId) {
    const putResp = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(event.existingEventId)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );
    if (putResp.ok) {
      return await putResp.json();
    }
  }

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    clearStoredToken();
    throw new Error('Сессия Google истекла. Нажмите «Войти через Google».');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create calendar event: ${response.status}`);
  }

  return await response.json();
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 404 && response.status !== 410) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete calendar event: ${response.status}`);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   GOOGLE TASKS API
   ───────────────────────────────────────────────────────────────────────────── */

export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  durationMinutes?: number;
  isAllDay?: boolean;
  updated?: string;
}

export interface GoogleTaskList {
  id: string;
  title: string;
}

export async function fetchGoogleTaskLists(): Promise<GoogleTaskList[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const response = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Tasks API error: ${response.status}`);
  }

  const data = await response.json();
  return (data.items || []).map((l: any) => ({ id: l.id, title: l.title }));
}

export async function fetchGoogleTasks(taskListId = '@default'): Promise<GoogleTaskItem[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?showCompleted=true&showHidden=true&maxResults=100`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    clearStoredToken();
    throw new Error('Сессия Google истекла. Нажмите «Войти через Google».');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Tasks API error: ${response.status}`);
  }

  const data = await response.json();
  return (data.items || []).map((t: any) => {
    const cachedMeta = getTaskTimeMeta(t.id);
    const isAllDayDetected =
      Boolean(cachedMeta?.isAllDay) ||
      /☀️|\[?Весь день\]?|All day/i.test(`${t.title || ''} ${t.notes || ''}`);
    const extractedTime = extractTimeFromTextOrNotes(t.title, t.notes, t.due) || cachedMeta?.dueTime;
    const extractedDate = extractDateFromNotesOrDue(t.due, t.notes) || cachedMeta?.dueDate;
    const extractedDuration = isAllDayDetected
      ? 720
      : extractDurationFromTextOrNotes(t.title, t.notes) || cachedMeta?.durationMinutes || 30;
    return {
      id: t.id,
      title: t.title || 'Без названия',
      notes: t.notes,
      status: t.status,
      due: t.due,
      dueDate: extractedDate,
      dueTime: extractedTime,
      durationMinutes: extractedDuration,
      isAllDay: isAllDayDetected,
      updated: t.updated,
    };
  });
}

export async function createGoogleTask(
  task: {
    title: string;
    notes?: string;
    dueDate?: string; // YYYY-MM-DD
    dueTime?: string; // HH:MM
    durationMinutes?: number;
    isAllDay?: boolean;
    existingTaskId?: string;
  },
  taskListId = '@default'
): Promise<GoogleTaskItem> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const now = new Date();
  const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const effectiveDate = task.dueDate || localToday;
  const effectiveTime = task.dueTime || getCurrentHHMM();
  const duration = task.isAllDay ? 720 : task.durationMinutes || 30;
  const endTime = calculateEndTime(effectiveTime, duration);
  const durationText = formatDurationLabel(duration, true, task.isAllDay);

  // Clean any prior time tags so we never duplicate them, then place time + duration right at the start of the title & first line of notes
  const cleanBaseTitle = stripTimeDecorationsFromTitle(task.title);
  const formattedTitle = task.isAllDay
    ? `☀️ [Весь день] · ${cleanBaseTitle}`
    : `⏰ ${effectiveTime}–${endTime} (${durationText}) · ${cleanBaseTitle}`;
  const cleanNotesBase = (task.notes || 'Личная ОС Франклин 2.0')
    .replace(/^(?:⏰|☀️)[^\n]*\n?/i, '')
    .replace(/\n?📅 Дата:[^\n]*/i, '')
    .trim();
  const formattedNotes = task.isAllDay
    ? `☀️ Время выполнения: Весь день | 📅 Дата: ${effectiveDate}\n${cleanNotesBase}`
    : `⏰ Время выполнения: ${effectiveTime} – ${endTime} (${durationText}) | 📅 Дата: ${effectiveDate}\n${cleanNotesBase}`;

  const payload: any = {
    title: formattedTitle,
    notes: formattedNotes,
    due: `${effectiveDate}T${task.isAllDay ? '09:00' : effectiveTime}:00.000Z`,
  };

  if (task.existingTaskId) {
    const patchResp = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${encodeURIComponent(task.existingTaskId)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );
    if (patchResp.ok) {
      const updated = await patchResp.json();
      saveTaskTimeMeta(updated.id || task.existingTaskId, {
        dueDate: effectiveDate,
        dueTime: effectiveTime,
        durationMinutes: duration,
        isAllDay: task.isAllDay,
      });
      return {
        ...updated,
        dueDate: effectiveDate,
        dueTime: effectiveTime,
        durationMinutes: duration,
      };
    }
  }

  const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    clearStoredToken();
    throw new Error('Сессия Google истекла. Нажмите «Войти через Google».');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create task: ${response.status}`);
  }

  const created = await response.json();
  if (created?.id) {
    saveTaskTimeMeta(created.id, {
      dueDate: effectiveDate,
      dueTime: effectiveTime,
      durationMinutes: duration,
    });
  }
  return {
    ...created,
    dueDate: effectiveDate,
    dueTime: effectiveTime,
    durationMinutes: duration,
  };
}

export async function updateGoogleTaskStatus(
  taskId: string,
  completed: boolean,
  taskListId = '@default'
): Promise<GoogleTaskItem> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const payload = {
    status: completed ? 'completed' : 'needsAction',
  };

  const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to update task: ${response.status}`);
  }

  return await response.json();
}

export async function deleteGoogleTask(taskId: string, taskListId = '@default'): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete task: ${response.status}`);
  }
}

