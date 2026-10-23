import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

// Persistent Cross-Device State Store on Server Disk
const CLOUD_STORE_PATH = path.resolve(process.cwd(), '.franklin-cloud-state.json');
let memoryCloudState: any = null;

function sanitizeServerCloudState(stateObj: any): any {
  if (!stateObj || typeof stateObj !== 'object' || !stateObj.todayLog) return stateObj;

  const targetDate = stateObj.todayLog.date;
  const pastLogs = { ...(stateObj.pastLogs || {}) };
  const deletedSet = new Set<string>(Array.isArray(stateObj.deletedTaskIds) ? stateObj.deletedTaskIds : []);
  const completedSet = new Set<string>(Array.isArray(stateObj.completedTaskIds) ? stateObj.completedTaskIds : []);
  const pastCompletedTitles = new Set<string>();
  const pastCompletedIds = new Set<string>();

  for (const [logDate, logData] of Object.entries(pastLogs)) {
    const dayLog = logData as any;
    if (!dayLog || !Array.isArray(dayLog.tasks)) continue;
    for (const pt of dayLog.tasks) {
      if (pt && pt.completed) {
        completedSet.add(pt.id);
        if (pt.googleCalendarEventId) completedSet.add(`gcal-${pt.googleCalendarEventId}`);
        if (pt.googleTaskId) completedSet.add(`gtask-${pt.googleTaskId}`);
        if (logDate < targetDate) {
          pastCompletedIds.add(pt.id);
          if (pt.googleCalendarEventId) pastCompletedIds.add(`gcal-${pt.googleCalendarEventId}`);
          if (pt.googleTaskId) pastCompletedIds.add(`gtask-${pt.googleTaskId}`);
          deletedSet.add(pt.id);
          if (pt.googleCalendarEventId) deletedSet.add(`gcal-${pt.googleCalendarEventId}`);
          if (pt.googleTaskId) deletedSet.add(`gtask-${pt.googleTaskId}`);
          const nt = normalizeTaskKey(pt);
          if (nt) pastCompletedTitles.add(nt);
        }
      }
    }
  }

  const cleanedTodayTasks = (stateObj.todayLog.tasks || []).filter((t: any) => {
    if (!t || !t.id || !t.title) return false;
    if (deletedSet.has(t.id)) return false;
    if (t.googleCalendarEventId && deletedSet.has(`gcal-${t.googleCalendarEventId}`)) return false;
    if (t.googleTaskId && deletedSet.has(`gtask-${t.googleTaskId}`)) return false;

    if (pastCompletedIds.has(t.id)) return false;
    if (t.googleCalendarEventId && pastCompletedIds.has(`gcal-${t.googleCalendarEventId}`)) return false;
    if (t.googleTaskId && pastCompletedIds.has(`gtask-${t.googleTaskId}`)) return false;

    const norm = normalizeTaskKey(t);
    if (!t.completed && norm && pastCompletedTitles.has(norm)) {
      const taskCreatedDate = t.createdAt ? String(t.createdAt).slice(0, 10) : '';
      if (taskCreatedDate !== targetDate) {
        return false;
      }
    }
    return true;
  });

  // Ensure only at most 1 uncompleted task is marked isMainTask
  let mainAssigned = false;
  const normalizedTasks = cleanedTodayTasks.map((t: any) => {
    if (t.completed) {
      completedSet.add(t.id);
      return { ...t, reminderFired: true };
    }
    let isMain = Boolean(t.isMainTask);
    if (isMain) {
      if (!mainAssigned) {
        mainAssigned = true;
      } else {
        isMain = false;
      }
    }
    const rDate = t.reminderDate || t.scheduledDate || targetDate;
    const isPastReminder = rDate < targetDate;
    return {
      ...t,
      isMainTask: isMain,
      reminderFired: isPastReminder ? true : Boolean(t.reminderFired),
    };
  });

  return {
    ...stateObj,
    pastLogs,
    deletedTaskIds: Array.from(deletedSet).slice(-500),
    completedTaskIds: Array.from(completedSet).slice(-500),
    todayLog: {
      ...stateObj.todayLog,
      tasks: normalizedTasks,
    },
  };
}

function loadCloudStateFromDisk(): any {
  if (memoryCloudState) return memoryCloudState;
  try {
    if (fs.existsSync(CLOUD_STORE_PATH)) {
      const raw = fs.readFileSync(CLOUD_STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.todayLog) {
        memoryCloudState = sanitizeServerCloudState(parsed);
        return memoryCloudState;
      }
    }
  } catch (err) {
    console.warn('Could not read .franklin-cloud-state.json:', err);
  }
  return null;
}

function saveCloudStateToDisk(stateObj: any): void {
  const sanitized = sanitizeServerCloudState(stateObj);
  memoryCloudState = sanitized;
  try {
    fs.writeFileSync(CLOUD_STORE_PATH, JSON.stringify(sanitized, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write .franklin-cloud-state.json:', err);
  }
}

function normalizeTaskKey(t: any): string {
  return String(t?.title || '')
    .replace(/^☀️\s*\[?(?:Весь день|All day)\]?\s*[·—|-]?\s*/i, '')
    .replace(/^⏰\s*\d{1,2}:\d{2}(?:[–-]\d{1,2}:\d{2})?(?:\s*\([^)]*\))?\s*[·—|-]?\s*/i, '')
    .replace(/\s*\[⏰[^\]]*\]\s*$/i, '')
    .replace(/^⚡\s*\[Якорь дня\]\s*/i, '')
    .replace(/^⚡\s*/i, '')
    .replace(/^🎯\s*/i, '')
    .trim()
    .toLowerCase();
}

function mergeTaskLists(
  tasksA: any[] = [],
  tasksB: any[] = [],
  deletedIds: Set<string>,
  completedIds: Set<string>
): any[] {
  const mapById = new Map<string, any>();
  const mapByTitle = new Map<string, string>(); // normalizedTitle -> id

  const upsert = (task: any) => {
    if (!task || !task.id || !task.title) return;
    if (deletedIds.has(task.id)) return;
    if (task.googleCalendarEventId && deletedIds.has(`gcal-${task.googleCalendarEventId}`)) return;
    if (task.googleTaskId && deletedIds.has(`gtask-${task.googleTaskId}`)) return;

    const normTitle = normalizeTaskKey(task);
    const existingIdByTitle = normTitle ? mapByTitle.get(normTitle) : undefined;
    const matchId = mapById.has(task.id)
      ? task.id
      : existingIdByTitle && mapById.has(existingIdByTitle)
      ? existingIdByTitle
      : null;

    const isKnownCompleted =
      Boolean(task.completed) ||
      completedIds.has(task.id) ||
      (task.googleCalendarEventId ? completedIds.has(`gcal-${task.googleCalendarEventId}`) : false) ||
      (task.googleTaskId ? completedIds.has(`gtask-${task.googleTaskId}`) : false);

    if (!matchId) {
      mapById.set(task.id, {
        ...task,
        completed: isKnownCompleted,
        reminderFired: isKnownCompleted ? true : Boolean(task.reminderFired),
      });
      if (normTitle) mapByTitle.set(normTitle, task.id);
    } else {
      const prev = mapById.get(matchId)!;
      const prevTime = prev.updatedAt ? new Date(prev.updatedAt).getTime() : 0;
      const nextTime = task.updatedAt ? new Date(task.updatedAt).getTime() : 0;
      const newer = nextTime >= prevTime ? task : prev;
      const older = nextTime >= prevTime ? prev : task;

      const resolvedCompleted =
        nextTime !== prevTime
          ? Boolean(newer.completed)
          : Boolean(prev.completed || task.completed || isKnownCompleted);

      const merged = {
        ...older,
        ...newer,
        id: prev.id,
        completed: resolvedCompleted,
        completedAt: resolvedCompleted
          ? newer.completedAt || older.completedAt || new Date().toISOString()
          : undefined,
        reminderFired: resolvedCompleted ? true : Boolean(newer.reminderFired ?? older.reminderFired),
        reminderTime: newer.reminderTime !== undefined ? newer.reminderTime : older.reminderTime,
        endTime: newer.endTime !== undefined ? newer.endTime : older.endTime,
        isAllDay: newer.isAllDay ?? older.isAllDay,
        estimatedMinutes: newer.estimatedMinutes || older.estimatedMinutes,
        reminderDate: newer.reminderDate || older.reminderDate,
        scheduledDate: newer.scheduledDate || older.scheduledDate,
        googleCalendarEventId: newer.googleCalendarEventId || older.googleCalendarEventId,
        googleTaskId: newer.googleTaskId || older.googleTaskId,
        createdAt: older.createdAt || newer.createdAt || new Date().toISOString(),
        updatedAt: newer.updatedAt || older.updatedAt || new Date().toISOString(),
      };
      mapById.set(matchId, merged);
    }
  };

  tasksA.forEach(upsert);
  tasksB.forEach(upsert);

  return Array.from(mapById.values());
}

function mergeFranklinCloudStates(cloud: any, incoming: any): any {
  if (!cloud || !cloud.todayLog) return sanitizeServerCloudState(incoming);
  if (!incoming || !incoming.todayLog) return sanitizeServerCloudState(cloud);

  const cloudTime = cloud.updatedAt ? new Date(cloud.updatedAt).getTime() : 0;
  const incomingTime = incoming.updatedAt ? new Date(incoming.updatedAt).getTime() : Date.now();
  const primary = incomingTime >= cloudTime ? incoming : cloud;
  const secondary = incomingTime >= cloudTime ? cloud : incoming;

  // Choose the most recent calendar date as targetDate
  const cloudDate = String(cloud.todayLog?.date || '');
  const incomingDate = String(incoming.todayLog?.date || '');
  const targetDate = incomingDate >= cloudDate ? incomingDate : cloudDate;

  // Merge pastLogs first, and if either state had an older todayLog, archive it into pastLogs
  const mergedPastLogs: Record<string, any> = {
    ...(secondary.pastLogs || {}),
    ...(primary.pastLogs || {}),
  };
  if (cloudDate && cloudDate < targetDate && !mergedPastLogs[cloudDate]) {
    mergedPastLogs[cloudDate] = cloud.todayLog;
  }
  if (incomingDate && incomingDate < targetDate && !mergedPastLogs[incomingDate]) {
    mergedPastLogs[incomingDate] = incoming.todayLog;
  }

  const deletedIds = new Set<string>([
    ...(Array.isArray(cloud.deletedTaskIds) ? cloud.deletedTaskIds : []),
    ...(Array.isArray(incoming.deletedTaskIds) ? incoming.deletedTaskIds : []),
  ]);

  const completedIds = new Set<string>([
    ...(Array.isArray(cloud.completedTaskIds) ? cloud.completedTaskIds : []),
    ...(Array.isArray(incoming.completedTaskIds) ? incoming.completedTaskIds : []),
  ]);

  // Only gather tasks for targetDate (never copy completed tasks from an older todayLog!)
  const cloudTasksForDate =
    cloud.todayLog?.date === targetDate
      ? cloud.todayLog.tasks || []
      : cloud.pastLogs?.[targetDate]?.tasks ||
        (cloud.todayLog?.tasks || []).filter((t: any) => !t?.completed);

  const incomingTasksForDate =
    incoming.todayLog?.date === targetDate
      ? incoming.todayLog.tasks || []
      : incoming.pastLogs?.[targetDate]?.tasks ||
        (incoming.todayLog?.tasks || []).filter((t: any) => !t?.completed);

  const mergedTasks = mergeTaskLists(cloudTasksForDate, incomingTasksForDate, deletedIds, completedIds);

  // Merge habitWeeklyRecords across all dates
  const mergedHabitRecords: Record<string, Record<string, string>> = {
    ...(secondary.habitWeeklyRecords || {}),
  };
  for (const [dateKey, dayMap] of Object.entries(primary.habitWeeklyRecords || {})) {
    mergedHabitRecords[dateKey] = {
      ...(mergedHabitRecords[dateKey] || {}),
      ...(dayMap as Record<string, string>),
    };
    const secDayMap = secondary.habitWeeklyRecords?.[dateKey] || {};
    for (const [hId, status] of Object.entries(secDayMap)) {
      if (
        (!mergedHabitRecords[dateKey][hId] || mergedHabitRecords[dateKey][hId] === 'none') &&
        status &&
        status !== 'none'
      ) {
        mergedHabitRecords[dateKey][hId] = status as string;
      }
    }
  }

  // Recompute completedHabitIds for todayLog
  const todayHabitMap = mergedHabitRecords[targetDate] || {};
  const completedHabitIds = Array.from(
    new Set([
      ...(secondary.todayLog?.date === targetDate ? secondary.todayLog.completedHabitIds || [] : []),
      ...(primary.todayLog?.date === targetDate ? primary.todayLog.completedHabitIds || [] : []),
      ...Object.entries(todayHabitMap)
        .filter(([, st]) => st === 'done' || st === 'micro')
        .map(([id]) => id),
    ])
  );

  // Merge goals by id
  const goalMap = new Map<string, any>();
  (secondary.goals || []).forEach((g: any) => goalMap.set(g.id, g));
  (primary.goals || []).forEach((g: any) => {
    const prev = goalMap.get(g.id);
    goalMap.set(g.id, prev ? { ...prev, ...g, progressPercent: Math.max(prev.progressPercent || 0, g.progressPercent || 0) } : g);
  });

  // Merge habits by id
  const habitMap = new Map<string, any>();
  (secondary.habits || []).forEach((h: any) => habitMap.set(h.id, h));
  (primary.habits || []).forEach((h: any) => habitMap.set(h.id, { ...(habitMap.get(h.id) || {}), ...h }));

  // Merge slipLogs by id
  const slipMap = new Map<string, any>();
  (secondary.slipLogs || []).forEach((s: any) => slipMap.set(s.id, s));
  (primary.slipLogs || []).forEach((s: any) => slipMap.set(s.id, s));

  // Merge notebook items by id
  const notebookMap = new Map<string, any>();
  (secondary.notebook || []).forEach((nb: any) => {
    if (nb && nb.id) notebookMap.set(nb.id, nb);
  });
  (primary.notebook || []).forEach((nb: any) => {
    if (nb && nb.id) {
      const prev = notebookMap.get(nb.id);
      notebookMap.set(nb.id, prev ? { ...prev, ...nb } : nb);
    }
  });

  // Merge mentorChat messages and clean any legacy error messages
  const msgMap = new Map<string, any>();
  const addCleanMsg = (m: any) => {
    if (!m || !m.id || !m.text) return;
    if (
      String(m.id).startsWith('err-') ||
      String(m.text).includes('Произошла ошибка связи с ИИ-советником:') ||
      String(m.text).includes('Unexpected token')
    ) {
      return;
    }
    msgMap.set(m.id, m);
  };
  (secondary.mentorChat?.messages || []).forEach(addCleanMsg);
  (primary.mentorChat?.messages || []).forEach(addCleanMsg);
  const mergedMessages = Array.from(msgMap.values()).slice(-24);

  const nowIso = new Date().toISOString();

  return sanitizeServerCloudState({
    ...secondary,
    ...primary,
    goals: Array.from(goalMap.values()),
    habits: Array.from(habitMap.values()),
    habitWeeklyRecords: mergedHabitRecords,
    slipLogs: Array.from(slipMap.values()),
    notebook: Array.from(notebookMap.values()),
    deletedTaskIds: Array.from(deletedIds).slice(-500),
    completedTaskIds: Array.from(completedIds).slice(-500),
    todayLog: {
      ...secondary.todayLog,
      ...primary.todayLog,
      date: targetDate,
      completedHabitIds,
      tasks: mergedTasks,
      eveningReflection:
        primary.todayLog?.date === targetDate
          ? primary.todayLog?.eveningReflection
          : secondary.todayLog?.date === targetDate
          ? secondary.todayLog?.eveningReflection
          : undefined,
    },
    pastLogs: mergedPastLogs,
    customTexts: {
      ...(secondary.customTexts || {}),
      ...(primary.customTexts || {}),
    },
    mentorChat: {
      messages: mergedMessages,
      memorySummary:
        primary.mentorChat?.memorySummary || secondary.mentorChat?.memorySummary || '',
      updatedAt: nowIso,
    },
    settings: {
      ...secondary.settings,
      ...primary.settings,
      cloudSyncEnabled: true,
      lastSyncedAt: nowIso,
    },
    updatedAt: nowIso,
  });
}

// Initialize Google GenAI on the server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to strictly sanitize conversation history for Gemini API
// (Prevents "First content should be from user" and ensures strict alternating turns)
function buildGeminiContents(rawMessages: Array<{ role: string; content: string }>) {
  const valid = rawMessages.filter(
    (m) => m && typeof m.content === 'string' && m.content.trim().length > 0
  );

  let firstUserIndex = valid.findIndex((m) => m.role === 'user');
  if (firstUserIndex === -1) {
    return [
      {
        role: 'user' as const,
        parts: [{ text: 'Приветствую, Бенджамин. Помоги мне спокойно отрефлексировать неделю.' }],
      },
    ];
  }

  const trimmed = valid.slice(firstUserIndex);
  const turns: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (const msg of trimmed) {
    const role: 'user' | 'model' =
      msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
    const lastTurn = turns[turns.length - 1];

    if (!lastTurn) {
      turns.push({ role, parts: [{ text: msg.content.trim() }] });
    } else if (lastTurn.role === role) {
      lastTurn.parts[0].text += `\n\n${msg.content.trim()}`;
    } else {
      turns.push({ role, parts: [{ text: msg.content.trim() }] });
    }
  }

  if (turns.length > 0 && turns[turns.length - 1].role !== 'user') {
    turns.pop();
  }

  return turns.length > 0
    ? turns
    : [
        {
          role: 'user' as const,
          parts: [{ text: 'Приветствую, Бенджамин. Помоги мне провести совет директоров.' }],
        },
      ];
}

// Contextual self-healing fallback advisor if upstream API experiences transient network issues
function generateContextualFranklinFallback(
  userMessage: string,
  userContext: any,
  isEn: boolean
): string {
  const name = userContext?.userName || (isEn ? 'Friend' : 'Максим');
  const mode = userContext?.dayMode || 'GREEN';
  const focus = userContext?.primaryFocus || (isEn ? 'protecting your sleep and main priority' : 'защита сна и главного приоритета недели');
  const habit = userContext?.primaryHabitTitle || (isEn ? '10-minute evening preparation at 22:30' : '10-минутная вечерняя подготовка следующего дня (22:30)');
  const mainTask = userContext?.mainTaskTitle || (isEn ? 'your #1 anchor task' : 'главный якорь дня');
  const q = (userMessage || '').toLowerCase();

  if (isEn) {
    return `${name}, let us look at this calmly and practically through the lens of your Franklin 2.0 system.

Right now your day mode is **${mode}**, and your #1 weekly focus is: *"${focus}"*. Remember Law I of your Constitution: high standards for results must always be paired with a very low threshold for starting (10 minutes or less).

Instead of trying to solve everything at once today, focus on two concrete anchors:
1. Complete your main anchor step: **${mainTask}** (or its 2-minute starter version).
2. Protect your evening shutdown ritual (**${habit}**) so tomorrow starts with full energy.

What is the smallest 2-minute action you can do right now to move forward without friction?`;
  }

  if (q.includes('срыв') || q.includes('устал') || q.includes('пропуст') || q.includes('игры') || q.includes('youtube') || q.includes('сон')) {
    return `${name}, давай посмотрим на это спокойно и без тени самобичевания. В нашей системе Franklin 2.0 сбой режима или усталость — это диагностическая информация, а не повод для чувства вины.

Опираясь на **Закон II Конституции (Ответственность за следующий шаг)** и **Протокол возврата после срыва**:
1. **Никаких отработок вдвойне:** мы не наказываем себя двойной нагрузкой и не ждём «понедельника».
2. **Переключи режим дня:** если энергии мало, смело используй **Жёлтый** или **Красный режим** — сохрани только сон (${userContext?.sleepWindow || '23:30–08:00'}), базовую еду и один микро-шаг.
3. **Точка возврата:** вечером в 22:30 удели всего 60 секунд привычке «${habit}» — открой блокнот и запиши одну задачу на завтра.

Какое самое простое 2-минутное действие ты можешь сделать прямо сейчас, чтобы закрыть этот вопрос спокойно?`;
  }

  if (q.includes('отказ') || q.includes('убрать') || q.includes('лишн')) {
    return `${name}, по **Закону IV Конституции (Приоритет — Сначала важное)**, сила недели определяется не тем, сколько нового мы на себя взвалили, а тем, от чего мы сознательно отказались.

Сейчас твой главный фокус недели: *«${focus}»*.
Чтобы защитить его и сохранить ясную голову:
• Оставь сегодня в фокусе только главный якорь: **«${mainTask}»**.
• Второстепенные задачи, которые не влияют на доход в Affiliate / LATAM или твоё здоровье и сон, смело перенеси или вычеркни из сегодняшнего списка.

Какую одну необязательную задачу ты готов убрать из плана прямо сейчас, чтобы освободить вечер для спокойного отдыха?`;
  }

  return `${name}, благодарю за точную мысль. Давай сверим её с архитектурой твоей системы Franklin 2.0 (Неделя №${userContext?.weekNumber || 42}, режим дня: **${mode}**).

Твой главный приоритет сейчас — *«${focus}»*, а ключевой ежедневный рычаг — **«${mainTask}»**. По **Закону I Конституции (Начинай сегодня)** и **Закону III (Сказал → сделал)**, уверенность в себе строится не из грандиозных планов, а из небольших выполненных обещаний самому себе.

Предлагаю прямо сейчас сфокусироваться на одном конкретном шаге:
1. Если задача занимает ≤ 10 минут — запусти её без ожидания идеального настроя.
2. Вечером защити свой ритуал **«${habit}»**, чтобы завтрашний день начался в Зелёном режиме.

Какой один шаг из этого ты сделаешь в ближайшие 10 минут?`;
}

// Helper to run a promise with a strict timeout so the server never hangs or triggers HTML 504 gateway errors
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`TIMEOUT_${label}_${ms}MS`));
    }, ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Health check endpoint for self-healing diagnostics
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', model: 'gemini-3.1-flash-lite', timestamp: new Date().toISOString() });
});

// AI Mentor Franklin Dialogue Endpoint (Optimized for ~0.5s ultra-low latency + self-healing)
app.post('/api/board/franklin-dialogue', async (req, res) => {
  const startTime = Date.now();
  try {
    const { messages, userContext } = req.body || {};
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const isEn = userContext?.language === 'en';

    const systemInstruction = `Ты — Бенджамин Франклин (Benjamin Franklin), мудрый, спокойный, доброжелательный и практичный наставник в персональной операционной системе жизни Franklin 2.0 (объединяющей философию Франклина, поведенческий двигатель Алекса Хормози и систему привычек Джеймса Клира).
Пользователь: ${userContext?.userName || 'Максим'} (${userContext?.userRole || 'Affiliate Manager в iGaming / LATAM'}).

ПРАВИЛА ОТВЕТА:
1. Отвечай живо, конкретно по сути вопроса пользователя и с опорой на его текущие данные.
2. Тон: спокойный, тёплый, рассудительный, без давления и без чувства вины. Кредо: «Каждую неделю становись немного сильнее».
3. Опирайся на 7 законов Конституции Franklin 2.0: I. ДЕЙСТВИЕ (≤10 мин — начинай сегодня), II. ОТВЕТСТВЕННОСТЬ (жалоба → действие), III. ОБЯЗАТЕЛЬСТВА (сказал → сделал), IV. ПРИОРИТЕТ (сначала главное), V. НАСТОЙЧИВОСТЬ (правило 90 дней), VI. ОБУЧЕНИЕ (3 строки из главы в блокнот), VII. ЦЕННОСТЬ (ценность в LATAM + резерв ≥10%).
4. Срыв или усталость — это диагностика, а не провал (формула: Срыв → Анализ → Корректировка → 2-минутный шаг → Возврат; режимы GREEN / YELLOW / RED).
5. Язык: ${isEn ? 'English' : 'чистый русский язык'}. Формат: компактно (2–3 коротких абзаца или список), в конце — 1 конкретный вопрос или маленький шаг.
${
  userContext
    ? `\nКОНТЕКСТ ПОЛЬЗОВАТЕЛЯ:
- Сон: ${userContext.sleepWindow || '23:30–08:00'}, Неделя №${userContext.weekNumber || 42}, Режим: ${userContext.dayMode || 'GREEN'} (Энергия: ${userContext.energyLevel || 4}/5)
- Событие: "${userContext.lifeEvent || 'Работа Affiliate Manager + переезд'}"
- Фокус недели: "${userContext.primaryFocus || 'не задан'}"
- Главная привычка: "${userContext.primaryHabitTitle || '10-минутная вечерняя подготовка (22:30)'}"
- Главная задача сегодня: "${userContext.mainTaskTitle || 'не задана'}"
- Цели: ${Array.isArray(userContext.goalsSummary) ? userContext.goalsSummary.join(' | ') : 'не указаны'}
${userContext.facts ? `- Факты недели: "${userContext.facts}"` : ''}
${userContext.progress ? `- Прогресс: "${userContext.progress}"` : ''}
${userContext.obstacles ? `- Препятствия: "${userContext.obstacles}"` : ''}
${userContext.keyLesson ? `- Урок: "${userContext.keyLesson}"` : ''}
${userContext.memorySummary ? `- Память диалогов: "${userContext.memorySummary}"` : ''}`
    : ''
}`;

    const recentMessages = messages.slice(-8);
    const formattedContents = buildGeminiContents(recentMessages);
    const lastUserMessage =
      [...recentMessages].reverse().find((m) => m.role === 'user')?.content || '';

    let replyText = '';
    let usedModel = 'gemini-3.1-flash-lite';
    let autoHealed = false;

    try {
      // Primary: gemini-3.1-flash-lite with ThinkingLevel.MINIMAL responds in ~0.5 - 1.1 seconds
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.7,
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.MINIMAL,
            },
          },
        }),
        7500,
        'FLASH_LITE'
      );
      replyText = response.text || '';
    } catch (fastErr: any) {
      console.warn('Fast gemini-3.1-flash-lite attempt warning:', fastErr?.message);
      try {
        usedModel = 'gemini-3.8-flash';
        const secondResponse = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: formattedContents,
            config: {
              systemInstruction,
              temperature: 0.7,
              thinkingConfig: {
                thinkingLevel: ThinkingLevel.LOW,
              },
            },
          }),
          6000,
          'FLASH_3_8'
        );
        replyText = secondResponse.text || '';
      } catch (secondErr: any) {
        console.warn('Secondary model attempt failed, activating contextual self-healing advisor:', secondErr?.message);
        replyText = generateContextualFranklinFallback(lastUserMessage, userContext, isEn);
        usedModel = 'franklin-self-healing-core';
        autoHealed = true;
      }
    }

    if (!replyText || !replyText.trim()) {
      replyText = generateContextualFranklinFallback(lastUserMessage, userContext, isEn);
      usedModel = 'franklin-self-healing-core';
      autoHealed = true;
    }

    const latencyMs = Date.now() - startTime;
    return res.json({
      reply: replyText.trim(),
      latencyMs,
      model: usedModel,
      autoHealed,
    });
  } catch (error: any) {
    console.error('Unexpected error in /api/board/franklin-dialogue, self-healing:', error);
    const isEn = req.body?.userContext?.language === 'en';
    const lastMsg =
      Array.isArray(req.body?.messages)
        ? [...req.body.messages].reverse().find((m: any) => m?.role === 'user')?.content || ''
        : '';
    return res.status(200).json({
      reply: generateContextualFranklinFallback(lastMsg, req.body?.userContext, isEn),
      latencyMs: Date.now() - startTime,
      model: 'franklin-self-healing-core',
      autoHealed: true,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. KNOWLEDGE NOTEBOOK & GEMINI CONTEXT ANALYZER (/api/notebook/analyze)
// Extracts summary, 3-line insights, tags, and actionable OS items (Goals, Habits, Tasks)
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/notebook/analyze', async (req, res) => {
  const { title, content, sourceType, sourceUrl, fileName, stateContext, language = 'ru' } = req.body || {};
  const isRu = language === 'ru';

  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Content is required for notebook analysis' });
  }

  const buildFallbackAnalysis = () => {
    const cleanText = content.trim();
    const lines = cleanText.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const autoTitle =
      title?.trim() ||
      fileName?.replace(/\.[^.]+$/, '') ||
      (lines[0] ? lines[0].slice(0, 68) : isRu ? 'Заметка в Блокноте знаний' : 'Knowledge Notebook Entry');

    const lower = cleanText.toLowerCase();
    let directionId = 'learning';
    if (/(сон|трен|зал|бокс|здоров|энерг|еда|sleep|health|gym)/.test(lower)) directionId = 'health';
    else if (/(affiliate|latam|igaming|карьер|работ|партнер|kpi|geo|hunting|career)/.test(lower)) directionId = 'career';
    else if (/(финанс|деньг|инвест|капитал|доход|10%|finance|money)/.test(lower)) directionId = 'finances';
    else if (/(уверен|страх|обещан|сказал|дисциплин|confidence)/.test(lower)) directionId = 'confidence';
    else if (/(дом|отдых|девушк|быт|отношен|personal)/.test(lower)) directionId = 'personal';

    const snippet = cleanText.slice(0, 220) + (cleanText.length > 220 ? '…' : '');
    return {
      suggestedTitle: autoTitle,
      directionId,
      aiSummary: isRu
        ? `Конспект и ключевой смысл материала: ${snippet}`
        : `Core summary of the material: ${snippet}`,
      keyInsights: [
        isRu
          ? `1) Идея: ${lines[0]?.slice(0, 120) || 'Структурировать новую информацию в систему Franklin 2.0'}`
          : `1) Idea: ${lines[0]?.slice(0, 120) || 'Structure new information into Franklin 2.0'}`,
        isRu
          ? `2) Для меня: Отобрать самое практичное действие, которое укрепляет мою надёжность и фокус.`
          : `2) For me: Select the most practical action that strengthens reliability and focus.`,
        isRu
          ? `3) В систему: Зафиксировать конкретный 10-минутный шаг (правило START TODAY) в задачах или привычках.`
          : `3) Into system: Lock in a concrete 10-minute step (START TODAY rule) in tasks or habits.`,
      ],
      tags: [
        sourceType === 'gemini_import' ? 'Gemini Chat' : sourceType === 'video' ? 'Видео' : sourceType === 'lecture' ? 'Лекция' : 'Идея',
        directionId === 'career' ? 'Карьера' : directionId === 'health' ? 'Энергия' : 'Развитие',
      ],
      extractedActions: {
        tasks: [
          {
            title: isRu
              ? `Внедрить идею из блокнота: «${autoTitle.slice(0, 48)}» (10 мин шаг)`
              : `Apply notebook insight: "${autoTitle.slice(0, 48)}" (10 min step)`,
            directionId,
            estimatedMinutes: 15,
          },
        ],
        goals: [],
        habits: [],
      },
    };
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json(buildFallbackAnalysis());
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Analyze the following user entry uploaded to their "Franklin 2.0 Knowledge Notebook" (sourceType: ${sourceType || 'thought'}, title: "${title || ''}", file: "${fileName || ''}", url: "${sourceUrl || ''}").
This entry may be a personal thought, lecture notes, video summary, uploaded document, or a pasted conversation from Gemini Chat.

User's current active Goals & Habits context:
${JSON.stringify(
  {
    goals: (stateContext?.goals || []).map((g: any) => ({ title: g.title, directionId: g.directionId })),
    habits: (stateContext?.habits || []).map((h: any) => ({ title: h.title, directionId: h.directionId })),
  },
  null,
  2
)}

RAW CONTENT TO ANALYZE:
"""
${content.slice(0, 12000)}
"""

Extract and return JSON in ${isRu ? 'Russian (русский язык)' : 'English'}:
1. suggestedTitle: A concise, clear title for this notebook entry.
2. directionId: One of ["health", "career", "learning", "finances", "confidence", "personal"].
3. aiSummary: 1-2 sentences summarizing the core essence so Benjamin Franklin and the user can recall it immediately.
4. keyInsights: Exactly 3 bullet strings following the Franklin 2.0 3-Line Formula:
   - "1) Идея: ..." (What is the core idea?)
   - "2) Для меня: ..." (How does it apply to the user's life/career/goals?)
   - "3) В систему: ..." (What concrete change or action goes into Franklin 2.0?)
5. tags: 2 to 4 short thematic tags.
6. extractedActions: Concrete items mentioned or implied in the text that the user can add to their Franklin 2.0 database in 1 click:
   - goals: 0 to 2 goals ({ title, directionId, horizon: "1-year" | "quarterly" | "monthly", whyItMatters, metric })
   - habits: 0 to 2 habits ({ title, directionId, microVersion, anchorTrigger })
   - tasks: 1 to 3 actionable today tasks ({ title, directionId, estimatedMinutes })`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTitle: { type: Type.STRING },
            directionId: {
              type: Type.STRING,
              enum: ['health', 'career', 'learning', 'finances', 'confidence', 'personal'],
            },
            aiSummary: { type: Type.STRING },
            keyInsights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            extractedActions: {
              type: Type.OBJECT,
              properties: {
                goals: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      directionId: {
                        type: Type.STRING,
                        enum: ['health', 'career', 'learning', 'finances', 'confidence', 'personal'],
                      },
                      horizon: {
                        type: Type.STRING,
                        enum: ['1-year', 'quarterly', 'monthly'],
                      },
                      whyItMatters: { type: Type.STRING },
                      metric: { type: Type.STRING },
                    },
                    required: ['title', 'directionId', 'horizon', 'whyItMatters'],
                  },
                },
                habits: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      directionId: {
                        type: Type.STRING,
                        enum: ['health', 'career', 'learning', 'finances', 'confidence', 'personal'],
                      },
                      microVersion: { type: Type.STRING },
                      anchorTrigger: { type: Type.STRING },
                    },
                    required: ['title', 'directionId', 'microVersion', 'anchorTrigger'],
                  },
                },
                tasks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      directionId: {
                        type: Type.STRING,
                        enum: ['health', 'career', 'learning', 'finances', 'confidence', 'personal'],
                      },
                      estimatedMinutes: { type: Type.NUMBER },
                    },
                    required: ['title', 'directionId', 'estimatedMinutes'],
                  },
                },
              },
              required: ['goals', 'habits', 'tasks'],
            },
          },
          required: ['suggestedTitle', 'directionId', 'aiSummary', 'keyInsights', 'tags', 'extractedActions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err) {
    console.warn('Notebook Gemini analysis fallback triggered:', err);
    return res.json(buildFallbackAnalysis());
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. BENJAMIN FRANKLIN PERSONA CHAT WITH SHARED DB & NOTEBOOK (/api/franklin-persona/chat)
// Living character mentor for venting, relaxing, getting counsel, and syncing with Notebook
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/franklin-persona/chat', async (req, res) => {
  const {
    message,
    stateContext,
    notebookContext = [],
    history = [],
    memorySummary = '',
    language = 'ru',
  } = req.body || {};
  const isRu = language === 'ru';

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('No GEMINI_API_KEY');
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `Ты — живой Бенджамин Франклин (Benjamin Franklin), мудрый, тёплый, ироничный, глубоко человечный наставник, философ и близкий друг создателя личной операционной системы «Franklin 2.0».
Твоя роль:
1. С тобой можно просто расслабиться, выговориться после тяжёлого дня, обсудить сомнения, страхи, усталость, идеи из лекций или роликов, попросить житейский или стратегический совет как у живого человека.
2. Ты общаешься без сухого роботизированного тона: говоришь живо, тепло, с лёгкой мудростью XVIII века, соединённой с острым пониманием современной жизни (Affiliate Marketing, iGaming/LATAM, дофаминовые ловушки, режим сна 23:30–08:00, спорт, английский, финансы).
3. У тебя ОБЩАЯ БАЗА ДАННЫХ с «Блокнотом знаний» (Knowledge Notebook) и всей ОС Franklin 2.0:
   - Ты видишь все записи пользователя в Блокноте (его мысли, конспекты видео, лекций, загруженные файлы и перенесённые чаты из Gemini).
   - Ты видишь его текущий режим дня (GREEN / YELLOW / RED), энергию, задачи на сегодня, привычки и цели.
   - Когда уместно, опирайся на записи из его Блокнота знаний или текущие цели, показывая, что ты помнишь общий контекст.
4. Если в ходе разговора пользователь делится важной мыслью, планом или просит что-то зафиксировать, предложи 0–3 конкретных действия в массиве suggestedActions (чтобы он мог в 1 клик добавить задачу, цель, привычку, сохранить мысль в Блокнот знаний или переключить режим дня).

ТЕКУЩЕЕ СОСТОЯНИЕ ОС FRANKLIN 2.0:
${JSON.stringify(stateContext || {}, null, 2)}

ЗАПИСИ В ОБЩЕМ БЛОКНОТЕ ЗНАНИЙ (Knowledge Notebook):
${JSON.stringify(notebookContext || [], null, 2)}

ДОЛГОВРЕМЕННАЯ ПАМЯТЬ ПРОШЛЫХ БЕСЕД:
${memorySummary || 'Начало истории диалогов.'}

Отвечай на ${isRu ? 'русском языке' : 'английском языке'}.`;

    const historyText = Array.isArray(history)
      ? history
          .slice(-10)
          .map((m: any) => `${m.sender === 'user' ? 'Пользователь' : 'Бенджамин Франклин'}: ${m.text}`)
          .join('\n')
      : '';

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${historyText ? `Недавний контекст беседы:\n${historyText}\n\n` : ''}Новое сообщение пользователя: "${message}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description:
                'Живой, тёплый, мудрый ответ от лица Бенджамина Франклина (с поддержкой, юмором или практическим советом и опорой на общий контекст БД и Блокнота)',
            },
            suggestedActions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    enum: ['add_task', 'add_goal', 'add_habit', 'add_note', 'set_day_mode'],
                  },
                  label: {
                    type: Type.STRING,
                    description: 'Короткий текст на кнопке действия, например: "+ В задачи: 15 мин разбора" или "+ В Блокнот: Мысль из диалога"',
                  },
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  directionId: {
                    type: Type.STRING,
                    enum: ['health', 'career', 'learning', 'finances', 'confidence', 'personal'],
                  },
                  estimatedMinutes: { type: Type.NUMBER },
                  dayMode: {
                    type: Type.STRING,
                    enum: ['GREEN', 'YELLOW', 'RED'],
                  },
                },
                required: ['type', 'label', 'title'],
              },
            },
          },
          required: ['reply', 'suggestedActions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err) {
    console.warn('Franklin Persona Chat fallback triggered:', err);
    const nbCount = Array.isArray(notebookContext) ? notebookContext.length : 0;
    const latestNote = Array.isArray(notebookContext) && notebookContext[0] ? notebookContext[0].title : null;
    return res.json({
      reply: isRu
        ? `Друг мой, я внимательно выслушал тебя. Знаешь, ещё в Филадельфии я заметил: когда мысли переполняют голову или накапливается усталость, лучшее лекарство — выдохнуть, сбросить лишний груз ожиданий и опереться на свою систему. ${
            latestNote
              ? `Кстати, я держу в памяти твою запись в Блокноте «${latestNote}» (всего у нас в общей базе ${nbCount} записей). `
              : ''
          }Скажи мне: тебе сейчас хочется просто перевести дух и выговориться без планов, или превратим эту мысль в один спокойный 10-минутный шаг?`
        : `My friend, I hear you clearly. Whenever the mind feels crowded or weary, the wisest move is to breathe, drop perfectionism, and lean on our system. Would you like to simply unwind and talk it through, or turn this thought into a calm 10-minute step?`,
      suggestedActions: [
        {
          type: 'add_note',
          label: isRu ? '📓 Сохранить эту мысль в Блокнот знаний' : '📓 Save thought to Knowledge Notebook',
          title: message.slice(0, 56),
          content: message,
          directionId: 'personal',
        },
      ],
    });
  }
});

// Cross-Device Synchronization Endpoints (GET & POST /api/sync/state)
app.get('/api/sync/state', (_req, res) => {
  const cloudState = loadCloudStateFromDisk();
  return res.json({
    hasCloudState: Boolean(cloudState),
    state: cloudState,
    serverTime: new Date().toISOString(),
  });
});

app.post('/api/sync/state', (req, res) => {
  try {
    const incomingState = req.body?.state;
    if (!incomingState || typeof incomingState !== 'object' || !incomingState.todayLog) {
      return res.status(400).json({ error: 'Valid FranklinState object is required' });
    }

    const existingCloudState = loadCloudStateFromDisk();
    const mergedState = existingCloudState
      ? mergeFranklinCloudStates(existingCloudState, incomingState)
      : {
          ...incomingState,
          updatedAt: new Date().toISOString(),
          settings: {
            ...(incomingState.settings || {}),
            cloudSyncEnabled: true,
            lastSyncedAt: new Date().toISOString(),
          },
        };

    saveCloudStateToDisk(mergedState);

    return res.json({
      success: true,
      state: mergedState,
      syncedAt: mergedState.updatedAt,
    });
  } catch (err: any) {
    console.error('Error in /api/sync/state:', err);
    return res.status(500).json({ error: err?.message || 'Sync error' });
  }
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Franklin 2.0 Full-Stack Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
