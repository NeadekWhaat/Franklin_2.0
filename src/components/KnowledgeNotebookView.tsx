import React, { useState, useRef, useMemo } from 'react';
import { useFranklin } from '../context/FranklinContext';
import {
  NotebookItem,
  NotebookSourceType,
  LifeDirectionId,
  NotebookExtractedActions,
} from '../types/franklin';
import { LIFE_DIRECTIONS } from '../config/franklinDefaults';
import {
  BookOpen,
  Sparkles,
  Upload,
  Video,
  GraduationCap,
  Lightbulb,
  FileText,
  Plus,
  Pin,
  Trash2,
  CheckCircle2,
  Search,
  Target,
  Layers,
  ListChecks,
  MessageSquare,
  ExternalLink,
  Loader2,
  Tag,
  ChevronDown,
  ChevronUp,
  Check,
  Bot,
} from 'lucide-react';

interface KnowledgeNotebookViewProps {
  onAskFranklinAboutNote?: (note: NotebookItem) => void;
}

export const KnowledgeNotebookView: React.FC<KnowledgeNotebookViewProps> = ({
  onAskFranklinAboutNote,
}) => {
  const {
    state,
    language,
    theme,
    addNotebookItem,
    updateNotebookItem,
    deleteNotebookItem,
    togglePinNotebookItem,
    addGoal,
    addHabit,
    addTask,
  } = useFranklin();

  const isRu = language === 'ru';
  const isLight = theme === 'light';
  const notebookItems = state.notebook || [];

  // Composer State
  const [isComposerOpen, setIsComposerOpen] = useState(true);
  const [sourceType, setSourceType] = useState<NotebookSourceType>('thought');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [directionId, setDirectionId] = useState<LifeDirectionId>('learning');
  const [customTagsInput, setCustomTagsInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoApplyActions, setAutoApplyActions] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<NotebookSourceType | 'all'>('all');
  const [selectedDirectionFilter, setSelectedDirectionFilter] = useState<LifeDirectionId | 'all'>('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(
    notebookItems[0]?.id || null
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const SOURCE_TYPES: {
    id: NotebookSourceType;
    label: string;
    icon: React.ReactNode;
    badgeColor: string;
    placeholderTitle: string;
    placeholderContent: string;
  }[] = [
    {
      id: 'thought',
      label: isRu ? 'Мысль / Идея' : 'Thought / Idea',
      icon: <Lightbulb size={14} />,
      badgeColor: isLight
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : 'bg-amber-950/40 text-amber-300 border-amber-800/60',
      placeholderTitle: isRu
        ? 'Например: Как выстроить сильный hunting партнёров в LATAM...'
        : 'E.g. How to build strong partner hunting in LATAM...',
      placeholderContent: isRu
        ? 'Запишите свою мысль, наблюдение, инсайт за день или идею проекта. Франклин сразу увидит её в общей базе знаний...'
        : 'Write your thought, observation, daily insight, or project idea...',
    },
    {
      id: 'gemini_import',
      label: isRu ? 'Импорт из Gemini' : 'Gemini Chat Import',
      icon: <Bot size={14} />,
      badgeColor: isLight
        ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
        : 'bg-indigo-950/40 text-indigo-300 border-indigo-800/60',
      placeholderTitle: isRu
        ? 'Разбор из чата Gemini / NotebookLM (определится автоматически)'
        : 'Insight from Gemini Chat / NotebookLM',
      placeholderContent: isRu
        ? 'Вставьте сюда текст диалога или ответ из чата Gemini / NotebookLM. ИИ автоматически выделит из него цели, задачи, привычки и сохранит контекст для Бенджамина Франклина...'
        : 'Paste your Gemini chat or NotebookLM output here. AI will automatically extract goals, tasks, habits, and sync context with Franklin...',
    },
    {
      id: 'video',
      label: isRu ? 'Ролик / YouTube' : 'Video / YouTube',
      icon: <Video size={14} />,
      badgeColor: isLight
        ? 'bg-rose-50 text-rose-800 border-rose-200'
        : 'bg-rose-950/40 text-rose-300 border-rose-800/60',
      placeholderTitle: isRu
        ? 'Название ролика, подкаста или интервью'
        : 'Video, podcast, or interview title',
      placeholderContent: isRu
        ? 'Вставьте понравившиеся мысли из ролика, таймкоды или субтитры — ИИ соберёт из них выжимку по формуле 3 строк и предложит шаги для внедрения...'
        : 'Paste key takeaways, timestamps, or transcript from the video...',
    },
    {
      id: 'lecture',
      label: isRu ? 'Лекция / Книга' : 'Lecture / Book',
      icon: <GraduationCap size={14} />,
      badgeColor: isLight
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
        : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60',
      placeholderTitle: isRu
        ? 'Глава книги, лекция или рабочий материал (SOP / KPI)'
        : 'Book chapter, lecture, or SOP material',
      placeholderContent: isRu
        ? 'Формула 3 строк Франклина:\n1) Идея (Что понял?)\n2) Для меня (Как это относится ко мне?)\n3) В систему (Что конкретно меняю в Franklin 2.0?)'
        : 'Franklin 3-Line Formula:\n1) Idea\n2) For me\n3) Into the system',
    },
    {
      id: 'file',
      label: isRu ? 'Файл / Документ' : 'File / Document',
      icon: <Upload size={14} />,
      badgeColor: isLight
        ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
        : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60',
      placeholderTitle: isRu
        ? 'Название загруженного файла или отчёта'
        : 'Uploaded file or document title',
      placeholderContent: isRu
        ? 'Выберите текстовый файл (.txt, .md, .json, .csv) кнопкой выше или вставьте содержимое документа сюда...'
        : 'Upload a text file (.txt, .md, .json, .csv) above or paste document contents here...',
    },
  ];

  const activeSourceMeta =
    SOURCE_TYPES.find((s) => s.id === sourceType) || SOURCE_TYPES[0];

  const showToast = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => {
      setStatusBanner((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^.]+$/, ''));
    }
    setSourceType('file');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || '');
      setContent(text.slice(0, 25000));
      showToast(
        isRu
          ? `📁 Файл «${file.name}» загружен. Нажмите «Сохранить с ИИ-разбором», чтобы связать с БД.`
          : `📁 File "${file.name}" loaded. Click "Save with AI Analysis" to link with DB.`
      );
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveEntry = async (withAiAnalysis: boolean) => {
    if (!content.trim()) return;

    const manualTags = customTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (!withAiAnalysis) {
      const created = addNotebookItem({
        title:
          title.trim() ||
          content.trim().split('\n')[0].slice(0, 64) ||
          (isRu ? 'Заметка в блокноте' : 'Notebook entry'),
        sourceType,
        sourceUrl: sourceUrl.trim() || undefined,
        fileName: fileName || undefined,
        content: content.trim(),
        tags: manualTags.length > 0 ? manualTags : [activeSourceMeta.label],
        directionId,
        isPinned: false,
      });
      setExpandedItemId(created.id);
      setTitle('');
      setContent('');
      setSourceUrl('');
      setFileName('');
      setCustomTagsInput('');
      showToast(
        isRu
          ? '✅ Запись сохранена в единую БД Franklin 2.0 и уже доступна Бенджамину в чате!'
          : '✅ Entry saved to shared Franklin 2.0 DB and available to Benjamin in chat!'
      );
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/notebook/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          sourceType,
          sourceUrl: sourceUrl.trim() || undefined,
          fileName: fileName || undefined,
          stateContext: {
            goals: state.goals,
            habits: state.habits,
          },
          language,
        }),
      });

      const data = await response.json();
      const finalDirection: LifeDirectionId =
        data.directionId || directionId || 'learning';
      const finalTags = Array.from(
        new Set([...manualTags, ...(Array.isArray(data.tags) ? data.tags : [])])
      );

      let extractedActions: NotebookExtractedActions | undefined =
        data.extractedActions;

      // If user enabled auto-apply to OS DB, immediately add extracted tasks/goals/habits
      let autoAppliedCount = 0;
      if (autoApplyActions && extractedActions) {
        if (Array.isArray(extractedActions.goals)) {
          extractedActions.goals = extractedActions.goals.map((g) => {
            addGoal({
              title: g.title,
              directionId: g.directionId || finalDirection,
              horizon: g.horizon || 'quarterly',
              whyItMatters: g.whyItMatters || data.aiSummary || '',
              metric: g.metric || 'Системное выполнение по блокноту Franklin 2.0',
              progressPercent: 0,
              active: true,
            });
            autoAppliedCount++;
            return { ...g, applied: true };
          });
        }
        if (Array.isArray(extractedActions.habits)) {
          extractedActions.habits = extractedActions.habits.map((h) => {
            addHabit({
              title: h.title,
              directionId: h.directionId || finalDirection,
              tier: 'supporting',
              frequency: 'daily',
              microVersion: h.microVersion || '60 секунд микро-шага',
              anchorTrigger: h.anchorTrigger || 'В утренний или вечерний слот системы',
            });
            autoAppliedCount++;
            return { ...h, applied: true };
          });
        }
        if (Array.isArray(extractedActions.tasks)) {
          extractedActions.tasks = extractedActions.tasks.map((tItem) => {
            addTask({
              title: tItem.title,
              directionId: tItem.directionId || finalDirection,
              isMainTask: false,
              minModeRequired: 'YELLOW',
              estimatedMinutes: tItem.estimatedMinutes || 15,
            });
            autoAppliedCount++;
            return { ...tItem, applied: true };
          });
        }
      }

      const created = addNotebookItem({
        title: title.trim() || data.suggestedTitle || 'Заметка в Блокноте знаний',
        sourceType,
        sourceUrl: sourceUrl.trim() || undefined,
        fileName: fileName || undefined,
        content: content.trim(),
        aiSummary: data.aiSummary,
        keyInsights: Array.isArray(data.keyInsights) ? data.keyInsights : [],
        tags: finalTags.length > 0 ? finalTags : [activeSourceMeta.label],
        directionId: finalDirection,
        extractedActions,
        isPinned: false,
      });

      setExpandedItemId(created.id);
      setTitle('');
      setContent('');
      setSourceUrl('');
      setFileName('');
      setCustomTagsInput('');

      showToast(
        autoAppliedCount > 0
          ? isRu
            ? `✨ Gemini разобрал запись, синхронизировал контекст с Франклином и добавил ${autoAppliedCount} эл. в БД!`
            : `✨ Gemini analyzed the entry, synced with Franklin, and added ${autoAppliedCount} items to DB!`
          : isRu
          ? '✨ Gemini выделил 3 ключевые идеи и подготовил цели/задачи для добавления в БД!'
          : '✨ Gemini extracted 3 key insights and prepared goals/tasks for 1-click DB import!'
      );
    } catch (err) {
      console.error('Failed to analyze notebook item:', err);
      handleSaveEntry(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyExtractedGoal = (item: NotebookItem, goalIndex: number) => {
    const goals = item.extractedActions?.goals;
    if (!goals || !goals[goalIndex] || goals[goalIndex].applied) return;
    const g = goals[goalIndex];

    addGoal({
      title: g.title,
      directionId: g.directionId || item.directionId,
      horizon: g.horizon || 'quarterly',
      whyItMatters: g.whyItMatters || item.aiSummary || item.title,
      metric: g.metric || 'По материалам Блокнота знаний',
      progressPercent: 0,
      active: true,
    });

    const nextGoals = goals.map((entry, idx) =>
      idx === goalIndex ? { ...entry, applied: true } : entry
    );
    updateNotebookItem(item.id, {
      extractedActions: {
        ...item.extractedActions,
        goals: nextGoals,
      },
    });
    showToast(isRu ? `🎯 Цель «${g.title}» добавлена в 9 Уровней ОС!` : `🎯 Goal "${g.title}" added!`);
  };

  const handleApplyExtractedHabit = (item: NotebookItem, habitIndex: number) => {
    const habits = item.extractedActions?.habits;
    if (!habits || !habits[habitIndex] || habits[habitIndex].applied) return;
    const h = habits[habitIndex];

    addHabit({
      title: h.title,
      directionId: h.directionId || item.directionId,
      tier: 'supporting',
      frequency: 'daily',
      microVersion: h.microVersion || '60 секунд микро-версии',
      anchorTrigger: h.anchorTrigger || 'Ежедневный триггер',
    });

    const nextHabits = habits.map((entry, idx) =>
      idx === habitIndex ? { ...entry, applied: true } : entry
    );
    updateNotebookItem(item.id, {
      extractedActions: {
        ...item.extractedActions,
        habits: nextHabits,
      },
    });
    showToast(
      isRu
        ? `🔁 Привычка «${h.title}» добавлена в Матрицу дисциплины!`
        : `🔁 Habit "${h.title}" added to Habit Matrix!`
    );
  };

  const handleApplyExtractedTask = (item: NotebookItem, taskIndex: number) => {
    const tasks = item.extractedActions?.tasks;
    if (!tasks || !tasks[taskIndex] || tasks[taskIndex].applied) return;
    const tItem = tasks[taskIndex];

    addTask({
      title: tItem.title,
      directionId: tItem.directionId || item.directionId,
      isMainTask: false,
      minModeRequired: 'YELLOW',
      estimatedMinutes: tItem.estimatedMinutes || 15,
    });

    const nextTasks = tasks.map((entry, idx) =>
      idx === taskIndex ? { ...entry, applied: true } : entry
    );
    updateNotebookItem(item.id, {
      extractedActions: {
        ...item.extractedActions,
        tasks: nextTasks,
      },
    });
    showToast(
      isRu
        ? `⚡ Задача «${tItem.title}» добавлена на Пульт сегодняшнего дня!`
        : `⚡ Task "${tItem.title}" added to today's Command Center!`
    );
  };

  const handleApplyAllActionsForItem = (item: NotebookItem) => {
    const actions = item.extractedActions;
    if (!actions) return;
    let count = 0;

    const nextGoals = (actions.goals || []).map((g) => {
      if (!g.applied) {
        addGoal({
          title: g.title,
          directionId: g.directionId || item.directionId,
          horizon: g.horizon || 'quarterly',
          whyItMatters: g.whyItMatters || item.aiSummary || item.title,
          metric: g.metric || 'По материалам Блокнота знаний',
          progressPercent: 0,
          active: true,
        });
        count++;
      }
      return { ...g, applied: true };
    });

    const nextHabits = (actions.habits || []).map((h) => {
      if (!h.applied) {
        addHabit({
          title: h.title,
          directionId: h.directionId || item.directionId,
          tier: 'supporting',
          frequency: 'daily',
          microVersion: h.microVersion || '60 секунд микро-версии',
          anchorTrigger: h.anchorTrigger || 'Ежедневный триггер',
        });
        count++;
      }
      return { ...h, applied: true };
    });

    const nextTasks = (actions.tasks || []).map((tItem) => {
      if (!tItem.applied) {
        addTask({
          title: tItem.title,
          directionId: tItem.directionId || item.directionId,
          isMainTask: false,
          minModeRequired: 'YELLOW',
          estimatedMinutes: tItem.estimatedMinutes || 15,
        });
        count++;
      }
      return { ...tItem, applied: true };
    });

    updateNotebookItem(item.id, {
      extractedActions: {
        goals: nextGoals,
        habits: nextHabits,
        tasks: nextTasks,
      },
    });

    if (count > 0) {
      showToast(
        isRu
          ? `🚀 Все рекомендации (${count} шт.) внедрены в базу данных Franklin 2.0!`
          : `🚀 All ${count} items added to Franklin 2.0 database!`
      );
    }
  };

  const filteredItems = useMemo(() => {
    return [...notebookItems]
      .filter((item) => {
        if (selectedSourceFilter !== 'all' && item.sourceType !== selectedSourceFilter) {
          return false;
        }
        if (selectedDirectionFilter !== 'all' && item.directionId !== selectedDirectionFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const inTitle = item.title.toLowerCase().includes(q);
          const inContent = item.content.toLowerCase().includes(q);
          const inSummary = (item.aiSummary || '').toLowerCase().includes(q);
          const inTags = (item.tags || []).some((t) => t.toLowerCase().includes(q));
          return inTitle || inContent || inSummary || inTags;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [notebookItems, selectedSourceFilter, selectedDirectionFilter, searchQuery]);

  const getDirectionLabel = (dirId: LifeDirectionId) => {
    const found = LIFE_DIRECTIONS.find((d) => d.id === dirId);
    return found ? (isRu ? found.nameRu : found.name) : dirId;
  };

  return (
    <div className="space-y-6">
      {/* Top Status Toast */}
      {statusBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} className="text-emerald-400 shrink-0" />
            <span>{statusBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-emerald-400 hover:text-white text-xs font-mono px-2 py-0.5 rounded"
          >
            OK
          </button>
        </div>
      )}

      {/* Architecture Context Card: Shared DB between Notebook & Benjamin Franklin */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
          isLight
            ? 'bg-gradient-to-r from-amber-50/90 via-white to-indigo-50/70 border-slate-200/90 text-slate-800'
            : 'bg-gradient-to-r from-[#111522] via-[#0d1018] to-[#131829] border-neutral-800 text-neutral-100'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <BookOpen size={12} />
                {isRu ? 'Инструмент №1 · Лаборатория Идей' : 'Tool #1 · Idea Lab'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 size={12} />
                {isRu
                  ? `Общая БД с Бенджамином Франклином (${notebookItems.length} зап.)`
                  : `Shared DB with Benjamin Franklin (${notebookItems.length} notes)`}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              {isRu
                ? 'Блокнот знаний & Интеграция контекста Gemini'
                : 'Knowledge Notebook & Gemini Context Hub'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              {isRu
                ? 'Загружайте сюда понравившиеся идеи, конспекты видео, лекций, файлы (.txt, .md, .json) или вставляйте диалоги из чата Gemini. ИИ автоматически выделит из них новые цели, задачи и привычки для вашей ОС, а Бенджамин Франклин будет помнить каждую запись в живом общении.'
                : 'Upload ideas, video notes, lectures, files, or paste Gemini chats. AI automatically extracts new goals, tasks, and habits into your OS while keeping Benjamin Franklin in full context.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsComposerOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 hover:opacity-90 transition-opacity shadow-xs"
            >
              <Plus size={14} />
              {isComposerOpen
                ? isRu
                  ? 'Свернуть редактор'
                  : 'Hide Composer'
                : isRu
                ? 'Новая запись / Импорт'
                : 'New Entry / Import'}
            </button>
          </div>
        </div>
      </div>

      {/* Knowledge Composer & Gemini Import Panel */}
      {isComposerOpen && (
        <div
          className={`rounded-2xl border p-4 sm:p-6 space-y-4 shadow-xs transition-colors ${
            isLight
              ? 'bg-white border-slate-200/90 text-slate-800'
              : 'bg-[#0b0e16] border-neutral-800/90 text-neutral-100'
          }`}
        >
          {/* Source Type Selector Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {SOURCE_TYPES.map((st) => {
                const isActive = sourceType === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSourceType(st.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-amber-500 dark:text-slate-950 dark:border-amber-400 shadow-2xs'
                        : isLight
                        ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        : 'bg-neutral-900/80 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                    }`}
                  >
                    {st.icon}
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>

            {/* File upload trigger */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.json,.csv,.log"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  isLight
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700'
                }`}
              >
                <Upload size={13} className="text-cyan-500" />
                <span>
                  {fileName
                    ? `${isRu ? 'Файл:' : 'File:'} ${fileName}`
                    : isRu
                    ? 'Загрузить файл (.txt, .md, .json)'
                    : 'Upload file (.txt, .md, .json)'}
                </span>
              </button>
            </div>
          </div>

          {/* Title, Direction & Optional Link Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
                {isRu ? 'Заголовок записи (или оставьте пустым для ИИ)' : 'Entry Title (optional for AI)'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={activeSourceMeta.placeholderTitle}
                className={`w-full px-3.5 py-2 rounded-xl text-sm border outline-none transition-colors ${
                  isLight
                    ? 'bg-slate-50/70 border-slate-200 focus:border-slate-400 focus:bg-white text-slate-900'
                    : 'bg-neutral-900/70 border-neutral-800 focus:border-amber-500/60 text-neutral-100'
                }`}
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
                {isRu ? 'Сфера жизни (Направление)' : 'Life Direction'}
              </label>
              <select
                value={directionId}
                onChange={(e) => setDirectionId(e.target.value as LifeDirectionId)}
                className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${
                  isLight
                    ? 'bg-slate-50/70 border-slate-200 text-slate-900'
                    : 'bg-neutral-900/70 border-neutral-800 text-neutral-100'
                }`}
              >
                {LIFE_DIRECTIONS.map((dir) => (
                  <option key={dir.id} value={dir.id}>
                    {isRu ? dir.nameRu : dir.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
                {sourceType === 'video' || sourceType === 'lecture'
                  ? isRu
                    ? 'Ссылка на YouTube / Источник'
                    : 'YouTube / Source URL'
                  : isRu
                  ? 'Теги (через запятую)'
                  : 'Tags (comma separated)'}
              </label>
              {sourceType === 'video' || sourceType === 'lecture' ? (
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${
                    isLight
                      ? 'bg-slate-50/70 border-slate-200 text-slate-900'
                      : 'bg-neutral-900/70 border-neutral-800 text-neutral-100'
                  }`}
                />
              ) : (
                <input
                  type="text"
                  value={customTagsInput}
                  onChange={(e) => setCustomTagsInput(e.target.value)}
                  placeholder={isRu ? 'LATAM, привычки, идеи...' : 'LATAM, habits, ideas...'}
                  className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${
                    isLight
                      ? 'bg-slate-50/70 border-slate-200 text-slate-900'
                      : 'bg-neutral-900/70 border-neutral-800 text-neutral-100'
                  }`}
                />
              )}
            </div>
          </div>

          {/* Main Content / Transcript / Gemini Chat Paste Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                {sourceType === 'gemini_import'
                  ? isRu
                    ? 'Текст из чата Gemini / NotebookLM для синхронизации с БД'
                    : 'Gemini Chat / NotebookLM Text to Sync with DB'
                  : isRu
                  ? 'Содержание (мысли, конспект лекции, разбор ролика или текст файла)'
                  : 'Content (thoughts, lecture notes, video takeaways, or file text)'}
              </label>
              {sourceType === 'lecture' && (
                <button
                  type="button"
                  onClick={() =>
                    setContent((prev) =>
                      prev
                        ? prev
                        : '1) Идея (Что понял?): \n2) Для меня (Как относится ко мне?): \n3) В систему (Что меняю в Franklin 2.0?): '
                    )
                  }
                  className="text-[11px] font-mono text-amber-600 dark:text-amber-400 hover:underline"
                >
                  {isRu ? '+ Вставить шаблон 3 строк Франклина' : '+ Insert 3-Line Formula template'}
                </button>
              )}
            </div>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={activeSourceMeta.placeholderContent}
              className={`w-full p-3.5 rounded-xl text-sm border outline-none leading-relaxed transition-colors ${
                isLight
                  ? 'bg-slate-50/70 border-slate-200 focus:border-slate-400 focus:bg-white text-slate-900'
                  : 'bg-neutral-900/70 border-neutral-800 focus:border-amber-500/60 text-neutral-100'
              }`}
            />
          </div>

          {/* Action Bar: Auto-apply toggle & Save buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={autoApplyActions}
                onChange={(e) => setAutoApplyActions(e.target.checked)}
                className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
              />
              <span>
                {isRu
                  ? 'Автоматически добавлять найденные цели, привычки и задачи сразу в БД ОС'
                  : 'Automatically add extracted goals, habits, and tasks directly into OS DB'}
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={!content.trim() || isAnalyzing}
                onClick={() => handleSaveEntry(false)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-40 ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                }`}
              >
                {isRu ? 'Просто сохранить заметку' : 'Save Note Only'}
              </button>

              <button
                type="button"
                disabled={!content.trim() || isAnalyzing}
                onClick={() => handleSaveEntry(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400 transition-all shadow-sm disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>
                      {isRu ? 'Gemini разбирает и связывает с БД...' : 'Gemini analyzing & syncing...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>
                      {isRu
                        ? 'Разобрать через Gemini ИИ и связать с БД'
                        : 'Analyze with Gemini AI & Sync to DB'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isRu
                ? 'Поиск по идеям, лекциям, тегам или импортам Gemini...'
                : 'Search thoughts, lectures, tags, or Gemini imports...'
            }
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm border outline-none transition-colors ${
              isLight
                ? 'bg-white border-slate-200 text-slate-800 focus:border-slate-400'
                : 'bg-[#0b0e16] border-neutral-800 text-neutral-100 focus:border-neutral-600'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedSourceFilter('all')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              selectedSourceFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950'
                : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
          >
            {isRu ? 'Все типы' : 'All'} ({notebookItems.length})
          </button>

          {SOURCE_TYPES.map((st) => {
            const count = notebookItems.filter((i) => i.sourceType === st.id).length;
            if (count === 0 && selectedSourceFilter !== st.id) return null;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() =>
                  setSelectedSourceFilter(selectedSourceFilter === st.id ? 'all' : st.id)
                }
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  selectedSourceFilter === st.id
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-amber-500 dark:text-slate-950 dark:border-amber-400'
                    : isLight
                    ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                }`}
              >
                {st.icon}
                <span>{st.label}</span>
                <span className="opacity-70 font-mono text-[10px]">({count})</span>
              </button>
            );
          })}

          <select
            value={selectedDirectionFilter}
            onChange={(e) =>
              setSelectedDirectionFilter(e.target.value as LifeDirectionId | 'all')
            }
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border outline-none ${
              isLight
                ? 'bg-white text-slate-700 border-slate-200'
                : 'bg-neutral-900 text-neutral-300 border-neutral-800'
            }`}
          >
            <option value="all">{isRu ? 'Все сферы жизни' : 'All Directions'}</option>
            {LIFE_DIRECTIONS.map((d) => (
              <option key={d.id} value={d.id}>
                {isRu ? d.nameRu : d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Knowledge Cards List */}
      {filteredItems.length === 0 ? (
        <div
          className={`rounded-2xl border p-10 text-center space-y-2 ${
            isLight
              ? 'bg-white border-slate-200/80 text-slate-500'
              : 'bg-[#0b0e16] border-neutral-800 text-neutral-400'
          }`}
        >
          <BookOpen size={28} className="mx-auto opacity-40" />
          <p className="text-sm font-medium">
            {isRu
              ? 'В этой выборке пока нет записей. Добавьте идею, конспект ролика или импорт из чата Gemini выше!'
              : 'No entries found. Add a thought, video takeaway, or Gemini chat import above!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredItems.map((item) => {
            const stMeta =
              SOURCE_TYPES.find((s) => s.id === item.sourceType) || SOURCE_TYPES[0];
            const isExpanded = expandedItemId === item.id;

            const pendingGoals = (item.extractedActions?.goals || []).filter((g) => !g.applied);
            const pendingHabits = (item.extractedActions?.habits || []).filter((h) => !h.applied);
            const pendingTasks = (item.extractedActions?.tasks || []).filter((t) => !t.applied);
            const totalPendingActions =
              pendingGoals.length + pendingHabits.length + pendingTasks.length;

            const hasAnyExtracted =
              (item.extractedActions?.goals?.length || 0) +
                (item.extractedActions?.habits?.length || 0) +
                (item.extractedActions?.tasks?.length || 0) >
              0;

            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all ${
                  item.isPinned
                    ? isLight
                      ? 'bg-amber-50/30 border-amber-300/80 shadow-2xs'
                      : 'bg-[#101420] border-amber-500/40 shadow-xs'
                    : isLight
                    ? 'bg-white border-slate-200/90 hover:border-slate-300'
                    : 'bg-[#0b0e16] border-neutral-800/90 hover:border-neutral-700'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div
                    className="space-y-2 flex-1 cursor-pointer"
                    onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${stMeta.badgeColor}`}
                      >
                        {stMeta.icon}
                        <span>{stMeta.label}</span>
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-mono ${
                          isLight
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {getDirectionLabel(item.directionId)}
                      </span>

                      {item.fileName && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                          <FileText size={11} />
                          {item.fileName}
                        </span>
                      )}

                      {totalPendingActions > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          <Sparkles size={11} />
                          {isRu
                            ? `Готово к внедрению в БД: ${totalPendingActions}`
                            : `Ready for OS DB: ${totalPendingActions}`}
                        </span>
                      )}

                      <span className="text-[11px] font-mono text-slate-400 dark:text-neutral-500">
                        {new Date(item.createdAt).toLocaleDateString(
                          isRu ? 'ru-RU' : 'en-US',
                          { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
                        )}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold tracking-tight">
                      {item.title}
                    </h3>

                    {item.aiSummary && (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
                        <span className="font-semibold text-amber-600 dark:text-amber-400 mr-1.5">
                          {isRu ? 'Выжимка ИИ:' : 'AI Summary:'}
                        </span>
                        {item.aiSummary}
                      </p>
                    )}

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {item.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono ${
                              isLight
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                            }`}
                          >
                            <Tag size={9} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Quick Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                    {onAskFranklinAboutNote && (
                      <button
                        type="button"
                        onClick={() => onAskFranklinAboutNote(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                          isLight
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                            : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-800/60'
                        }`}
                        title={
                          isRu
                            ? 'Обсудить эту запись с Бенджамином Франклином в чате'
                            : 'Discuss this note with Benjamin Franklin in chat'
                        }
                      >
                        <MessageSquare size={13} />
                        <span>{isRu ? 'Обсудить с Франклином' : 'Discuss with Franklin'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => togglePinNotebookItem(item.id)}
                      className={`p-2 rounded-xl border transition-colors ${
                        item.isPinned
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-500'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-200'
                      }`}
                      title={isRu ? 'Закрепить вверху' : 'Pin entry'}
                    >
                      <Pin size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteNotebookItem(item.id)}
                      className={`p-2 rounded-xl border transition-colors ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-rose-400'
                      }`}
                      title={isRu ? 'Удалить запись' : 'Delete entry'}
                    >
                      <Trash2 size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                      className={`p-2 rounded-xl border transition-colors ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-600'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Body: 3-Line Insights, Extracted OS Actions & Full Text */}
                {isExpanded && (
                  <div
                    className={`px-4 sm:px-5 pb-5 pt-3 border-t space-y-4 ${
                      isLight ? 'border-slate-100' : 'border-neutral-800/80'
                    }`}
                  >
                    {/* 3-Line Insights Formula */}
                    {item.keyInsights && item.keyInsights.length > 0 && (
                      <div
                        className={`p-3.5 rounded-xl border space-y-2 ${
                          isLight
                            ? 'bg-amber-50/50 border-amber-200/70'
                            : 'bg-amber-950/20 border-amber-900/40'
                        }`}
                      >
                        <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                          <Sparkles size={13} />
                          {isRu
                            ? 'Формула 3 строк Франклина (Идея → Для меня → В систему)'
                            : 'Franklin 3-Line Formula (Idea → For Me → Into System)'}
                        </div>
                        <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-neutral-200">
                          {item.keyInsights.map((insight, idx) => (
                            <li key={idx} className="leading-relaxed flex items-start gap-2">
                              <span className="text-amber-500 font-bold">•</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Extracted OS Database Actions (Goals, Habits, Tasks) */}
                    {hasAnyExtracted && (
                      <div
                        className={`p-4 rounded-xl border space-y-3 ${
                          isLight
                            ? 'bg-slate-50/80 border-slate-200/90'
                            : 'bg-[#0f131f] border-neutral-800'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700 dark:text-neutral-200 flex items-center gap-1.5">
                            <Target size={14} className="text-emerald-500" />
                            <span>
                              {isRu
                                ? 'Синхронизация с БД Операционной Системы (Цели, Привычки, Задачи)'
                                : 'Sync with OS Database (Goals, Habits, Tasks)'}
                            </span>
                          </div>

                          {totalPendingActions > 0 && (
                            <button
                              type="button"
                              onClick={() => handleApplyAllActionsForItem(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                            >
                              <CheckCircle2 size={13} />
                              <span>
                                {isRu
                                  ? `Внедрить всё в БД (${totalPendingActions})`
                                  : `Add All to DB (${totalPendingActions})`}
                              </span>
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Extracted Goals */}
                          {(item.extractedActions?.goals || []).map((g, gIdx) => (
                            <div
                              key={`g-${gIdx}`}
                              className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                                isLight
                                  ? 'bg-white border-slate-200'
                                  : 'bg-neutral-900/90 border-neutral-800'
                              }`}
                            >
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold text-indigo-600 dark:text-indigo-400">
                                  <Target size={11} />
                                  {isRu ? 'Цель (Уровень 5)' : 'Goal (Level 5)'}
                                </span>
                                <p className="text-xs font-semibold leading-snug">{g.title}</p>
                                {g.whyItMatters && (
                                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 line-clamp-2">
                                    {g.whyItMatters}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                disabled={g.applied}
                                onClick={() => handleApplyExtractedGoal(item, gIdx)}
                                className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                                  g.applied
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 cursor-default'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                }`}
                              >
                                {g.applied ? (
                                  <>
                                    <Check size={12} />
                                    <span>{isRu ? 'Добавлено в Цели' : 'Added to Goals'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus size={12} />
                                    <span>{isRu ? 'В Цели ОС' : 'Add to Goals'}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ))}

                          {/* Extracted Habits */}
                          {(item.extractedActions?.habits || []).map((h, hIdx) => (
                            <div
                              key={`h-${hIdx}`}
                              className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                                isLight
                                  ? 'bg-white border-slate-200'
                                  : 'bg-neutral-900/90 border-neutral-800'
                              }`}
                            >
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold text-amber-600 dark:text-amber-400">
                                  <Layers size={11} />
                                  {isRu ? 'Привычка (Матрица)' : 'Habit (Matrix)'}
                                </span>
                                <p className="text-xs font-semibold leading-snug">{h.title}</p>
                                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                                  {isRu ? 'Микро:' : 'Micro:'} {h.microVersion}
                                </p>
                              </div>
                              <button
                                type="button"
                                disabled={h.applied}
                                onClick={() => handleApplyExtractedHabit(item, hIdx)}
                                className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                                  h.applied
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 cursor-default'
                                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                }`}
                              >
                                {h.applied ? (
                                  <>
                                    <Check size={12} />
                                    <span>{isRu ? 'В Матрице привычек' : 'Added to Habits'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus size={12} />
                                    <span>{isRu ? 'В Привычки ОС' : 'Add to Habits'}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ))}

                          {/* Extracted Tasks */}
                          {(item.extractedActions?.tasks || []).map((tItem, tIdx) => (
                            <div
                              key={`t-${tIdx}`}
                              className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                                isLight
                                  ? 'bg-white border-slate-200'
                                  : 'bg-neutral-900/90 border-neutral-800'
                              }`}
                            >
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">
                                  <ListChecks size={11} />
                                  {isRu
                                    ? `Задача (${tItem.estimatedMinutes || 15} мин)`
                                    : `Task (${tItem.estimatedMinutes || 15}m)`}
                                </span>
                                <p className="text-xs font-semibold leading-snug">{tItem.title}</p>
                              </div>
                              <button
                                type="button"
                                disabled={tItem.applied}
                                onClick={() => handleApplyExtractedTask(item, tIdx)}
                                className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                                  tItem.applied
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 cursor-default'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                }`}
                              >
                                {tItem.applied ? (
                                  <>
                                    <Check size={12} />
                                    <span>{isRu ? 'Добавлено на сегодня' : 'Added to Today'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus size={12} />
                                    <span>{isRu ? 'В Задачи сегодня' : 'Add to Today Tasks'}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Original Source Content */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                          {isRu ? 'Полный текст записи / исходник' : 'Full Note / Source Content'}
                        </span>
                        {item.sourceUrl && (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:underline"
                          >
                            <span>{isRu ? 'Открыть источник' : 'Open Source'}</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      <div
                        className={`p-3.5 rounded-xl text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-sans border ${
                          isLight
                            ? 'bg-slate-50 border-slate-200/70 text-slate-700'
                            : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-300'
                        }`}
                      >
                        {item.content}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
