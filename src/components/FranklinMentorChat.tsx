import React, { useState, useRef, useEffect } from 'react';
import { useFranklin } from '../context/FranklinContext';
import {
  MentorChatMessage,
  MentorChatAction,
  NotebookItem,
  LifeDirectionId,
  DayMode,
} from '../types/franklin';
import {
  Feather,
  X,
  Send,
  Sparkles,
  BatteryLow,
  ShieldAlert,
  Compass,
  CheckCircle2,
  ArrowRight,
  Trash2,
  Brain,
  BookOpen,
  Coffee,
  Plus,
  Check,
  Loader2,
  MessageCircleHeart,
} from 'lucide-react';

interface FranklinMentorChatProps {
  onFocusTask: (taskId: string) => void;
  embedded?: boolean;
  initialNoteToDiscuss?: NotebookItem | null;
  onClearNoteToDiscuss?: () => void;
  onOpenNotebook?: () => void;
}

export const FranklinMentorChat: React.FC<FranklinMentorChatProps> = ({
  onFocusTask,
  embedded = false,
  initialNoteToDiscuss = null,
  onClearNoteToDiscuss,
  onOpenNotebook,
}) => {
  const {
    state,
    language,
    theme,
    setDayMode,
    logSlipRecovery,
    appendMentorMessages,
    updateMentorMessage,
    clearMentorChat,
    addTask,
    addGoal,
    addHabit,
    addNotebookItem,
  } = useFranklin();

  const isRu = language === 'ru';
  const isLight = theme === 'light';

  const [isOpen, setIsOpen] = useState(embedded);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const anchorTask =
    state.todayLog.tasks.find((t) => t.isMainTask) || state.todayLog.tasks[0];
  const notebookItems = state.notebook || [];

  const getInitialGreeting = (): MentorChatMessage => ({
    id: 'welcome-1',
    sender: 'franklin',
    timestamp: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    text: isRu
      ? `Приветствую тебя, друг мой! Я — Бенджамин Франклин. Здесь мы можем говорить совершенно свободно: можешь просто выговориться после дня, поделиться сомнениями, попросить житейский совет или обсудить идеи из твоего Блокнота знаний (сейчас в нашей общей памяти ${notebookItems.length} зап.). О чём размышляешь сегодня?`
      : `Greetings, my friend! I am Benjamin Franklin. Here we can speak freely: unwind after a long day, share doubts, ask for counsel, or discuss ideas from your Knowledge Notebook (${notebookItems.length} notes in our shared memory). What is on your mind today?`,
  });

  const storedMessages = state.mentorChat?.messages || [];
  const memorySummary = state.mentorChat?.memorySummary || '';
  const messages: MentorChatMessage[] =
    storedMessages.length > 0 ? storedMessages : [getInitialGreeting()];

  useEffect(() => {
    if (isOpen || embedded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isOpen, embedded, isSending]);

  // Automatically trigger discussion if user clicked "Discuss with Franklin" from the Knowledge Notebook
  useEffect(() => {
    if (initialNoteToDiscuss) {
      setIsOpen(true);
      const prompt = isRu
        ? `Бенджамин, давай обсудим мою запись из Блокнота знаний: «${initialNoteToDiscuss.title}». Вот её суть: ${
            initialNoteToDiscuss.aiSummary || initialNoteToDiscuss.content.slice(0, 300)
          }. Что ты об этом думаешь и как мне лучше применить это в жизни?`
        : `Benjamin, let's discuss my Knowledge Notebook entry: "${initialNoteToDiscuss.title}". Summary: ${
            initialNoteToDiscuss.aiSummary || initialNoteToDiscuss.content.slice(0, 300)
          }. What are your thoughts and counsel on this?`;
      if (onClearNoteToDiscuss) {
        onClearNoteToDiscuss();
      }
      handleSendMessage(prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNoteToDiscuss]);

  const handleApplyAction = (msgId: string, actionIndex: number, action: MentorChatAction) => {
    if (action.applied) return;

    const payload = action.payload || {};
    const dirId: LifeDirectionId = payload.directionId || 'personal';

    if (action.type === 'add_task') {
      addTask({
        title: payload.title || action.label,
        directionId: dirId,
        isMainTask: false,
        minModeRequired: 'YELLOW',
        estimatedMinutes: payload.estimatedMinutes || 15,
      });
    } else if (action.type === 'add_goal') {
      addGoal({
        title: payload.title || action.label,
        directionId: dirId,
        horizon: 'quarterly',
        whyItMatters: payload.content || 'Из беседы с Бенджамином Франклином',
        metric: 'Системный прогресс в Franklin 2.0',
        progressPercent: 0,
        active: true,
      });
    } else if (action.type === 'add_habit') {
      addHabit({
        title: payload.title || action.label,
        directionId: dirId,
        tier: 'supporting',
        frequency: 'daily',
        microVersion: '60 секунд микро-шага',
        anchorTrigger: 'Ежедневный слот в системе',
      });
    } else if (action.type === 'add_note') {
      addNotebookItem({
        title: payload.title || (isRu ? 'Мысль из беседы с Франклином' : 'Insight from Franklin Chat'),
        sourceType: 'thought',
        content: payload.content || payload.title || action.label,
        aiSummary: isRu
          ? 'Сохранено напрямую из живого диалога с Бенджамином Франклином.'
          : 'Saved directly from conversation with Benjamin Franklin.',
        tags: [isRu ? 'Беседа с Франклином' : 'Franklin Counsel'],
        directionId: dirId,
        isPinned: false,
      });
    } else if (action.type === 'set_day_mode' && payload.dayMode) {
      setDayMode(payload.dayMode as DayMode);
    }

    const targetMsg = messages.find((m) => m.id === msgId);
    if (targetMsg && targetMsg.actions) {
      const updatedActions = targetMsg.actions.map((a, idx) =>
        idx === actionIndex ? { ...a, applied: true } : a
      );
      updateMentorMessage(msgId, { actions: updatedActions });
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const query = (textOverride ?? input).trim();
    if (!query || isSending) return;

    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: MentorChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: nowTime,
    };

    const seed = storedMessages.length === 0 ? [getInitialGreeting()] : [];
    appendMentorMessages([...seed, userMsg]);
    if (!textOverride) setInput('');

    setIsSending(true);

    try {
      const stateContext = {
        dayMode: state.todayLog.dayMode,
        energyLevel: state.todayLog.energyLevel,
        anchorTask: anchorTask ? anchorTask.title : null,
        todayTasks: state.todayLog.tasks.map((t) => ({
          title: t.title,
          completed: t.completed,
          isMainTask: t.isMainTask,
        })),
        goals: state.goals.map((g) => ({
          title: g.title,
          directionId: g.directionId,
          progressPercent: g.progressPercent,
        })),
        habits: state.habits.map((h) => ({
          title: h.title,
          microVersion: h.microVersion,
        })),
        recentSlipsCount: state.slipLogs.length,
      };

      const notebookContext = (state.notebook || []).slice(0, 12).map((nb) => ({
        title: nb.title,
        sourceType: nb.sourceType,
        directionId: nb.directionId,
        aiSummary: nb.aiSummary,
        keyInsights: nb.keyInsights,
        contentSnippet: nb.content.slice(0, 350),
        tags: nb.tags,
      }));

      const response = await fetch('/api/franklin-persona/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          stateContext,
          notebookContext,
          history: messages.slice(-10),
          memorySummary,
          language,
        }),
      });

      const data = await response.json();

      const mappedActions: MentorChatAction[] = Array.isArray(data.suggestedActions)
        ? data.suggestedActions.map((act: any) => ({
            type: act.type || 'add_note',
            label: act.label || act.title || (isRu ? 'Добавить в БД' : 'Add to DB'),
            payload: {
              title: act.title,
              content: act.content || query,
              directionId: act.directionId || 'personal',
              estimatedMinutes: act.estimatedMinutes || 15,
              dayMode: act.dayMode,
            },
            applied: false,
          }))
        : [];

      const franklinMsg: MentorChatMessage = {
        id: `franklin-${Date.now() + 1}`,
        sender: 'franklin',
        text:
          data.reply ||
          (isRu
            ? 'Друг мой, я рядом. Давай сделаем спокойный вдох и выберем один простой шаг.'
            : 'My friend, I am here. Let us take a calm breath and pick one simple step.'),
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        actions: mappedActions,
      };

      appendMentorMessages([franklinMsg]);
    } catch (err) {
      console.warn('Franklin chat fallback:', err);
      const fallbackMsg: MentorChatMessage = {
        id: `franklin-${Date.now() + 1}`,
        sender: 'franklin',
        text: isRu
          ? 'Друг мой, даже когда внешние линии связи шумят, наша внутренняя система остаётся нерушимой. Выдохни, сбрось лишнее напряжение — 1% спокойного действия всегда сильнее 0% идеальных планов.'
          : 'My friend, our internal system remains steady. Take a breath — 1% calm action beats 0% perfection.',
        timestamp: nowTime,
      };
      appendMentorMessages([fallbackMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickEmotionalAction = (
    kind: 'relax_vent' | 'discuss_notebook' | 'low_energy' | 'slip_recovery' | 'focus_anchor'
  ) => {
    if (kind === 'relax_vent') {
      handleSendMessage(
        isRu
          ? 'Бенджамин, хочу просто перевести дух, расслабиться и поговорить по душам без гонки и чувства вины. Поддержи меня мудрым словом.'
          : 'Benjamin, I just want to unwind, breathe, and talk candidly without pressure or guilt. Share some warm wisdom.'
      );
    } else if (kind === 'discuss_notebook') {
      const latest = notebookItems[0];
      handleSendMessage(
        latest
          ? isRu
            ? `Бенджамин, давай обсудим записи из моего Блокнота знаний (особенно «${latest.title}») — как они связаны с моими текущими целями в БД?`
            : `Benjamin, let's discuss my Knowledge Notebook entries (especially "${latest.title}") and how they connect to my active goals.`
          : isRu
          ? 'Бенджамин, какие главные идеи мне стоит записать в наш общий Блокнот знаний на этой неделе?'
          : 'Benjamin, what core ideas should I record in our shared Knowledge Notebook this week?'
      );
    } else if (kind === 'low_energy') {
      setDayMode('YELLOW');
      handleSendMessage(
        isRu
          ? 'Чувствую усталость и перегрузку. Я переключил день в Жёлтый режим — помоги спокойно отсечь всё лишнее.'
          : 'I feel tired and overloaded. I switched to Yellow Mode — help me calmly cut secondary noise.'
      );
    } else if (kind === 'slip_recovery') {
      logSlipRecovery({
        date: state.todayLog.date,
        trigger: isRu ? 'Беседа с Бенджамином в чате' : 'Conversation with Benjamin in chat',
        rootCause: 'fatigue',
        selectedMicroAction: isRu
          ? 'Спокойный возврат в строй за 60 секунд без самобичевания'
          : 'Calm 60-second return without guilt',
        recoveryRuleApplied: isRu
          ? 'Правило Франклина: Срыв — это информация для анализа, а не приговор'
          : 'Franklin Rule: A slip is data, not a sentence',
      });
      handleSendMessage(
        isRu
          ? 'У меня произошёл небольшой срыв / прокрастинация. Я зафиксировал его в журнале — помоги вернуться в строй без чувства вины.'
          : 'I had a slip / procrastination moment. Help me return to track without guilt.'
      );
    } else if (kind === 'focus_anchor' && anchorTask) {
      onFocusTask(anchorTask.id);
    }
  };

  // Render Chat Window Content (used in both embedded and floating modes)
  const renderChatBody = () => (
    <div
      className={`flex flex-col overflow-hidden transition-colors ${
        embedded
          ? `w-full rounded-2xl border shadow-xs min-h-[580px] max-h-[740px] ${
              isLight
                ? 'bg-white border-slate-200/90 text-slate-800'
                : 'bg-[#0b0e16] border-neutral-800/90 text-neutral-100'
            }`
          : 'fixed bottom-6 right-6 z-50 w-[390px] sm:w-[440px] max-w-[calc(100vw-24px)] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl text-white max-h-[84vh]'
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b flex items-center justify-between ${
          embedded
            ? isLight
              ? 'bg-gradient-to-r from-amber-50/90 via-white to-slate-50 border-slate-200/80'
              : 'bg-gradient-to-r from-[#131826] to-[#0b0e16] border-neutral-800'
            : 'bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 shrink-0 shadow-inner">
            <Feather size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3
                className={`text-sm sm:text-base font-bold font-serif tracking-wide ${
                  embedded && isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {isRu ? 'Бенджамин Франклин' : 'Benjamin Franklin'}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                <BookOpen size={10} />
                {isRu
                  ? `Единая БД · Блокнот (${notebookItems.length})`
                  : `Shared DB · Notebook (${notebookItems.length})`}
              </span>
            </div>
            <p
              className={`text-[11px] flex items-center gap-1.5 mt-0.5 ${
                embedded && isLight ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {isRu
                ? 'Инструмент №2 · Живой персонаж, собеседник для души и личный наставник'
                : 'Tool #2 · Living persona, confidant & personal mentor'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenNotebook && (
            <button
              type="button"
              onClick={onOpenNotebook}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                embedded && isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-amber-300 border-slate-700'
              }`}
              title={isRu ? 'Перейти в Блокнот знаний' : 'Open Knowledge Notebook'}
            >
              <BookOpen size={13} />
              <span className="hidden sm:inline">{isRu ? 'Блокнот' : 'Notebook'}</span>
            </button>
          )}

          {storedMessages.length > 0 && (
            <button
              type="button"
              onClick={clearMentorChat}
              title={isRu ? 'Очистить историю чата' : 'Clear chat history'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/40 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}

          {!embedded && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Rolling Long-Term Memory Indicator */}
      {memorySummary && (
        <div
          className={`px-4 py-1.5 border-b flex items-center gap-2 text-[11px] ${
            embedded && isLight
              ? 'bg-amber-50/70 border-amber-200/60 text-amber-800'
              : 'bg-amber-950/20 border-slate-800/80 text-amber-300/90'
          }`}
        >
          <Brain size={12} className="shrink-0 text-amber-500" />
          <span className="truncate" title={memorySummary}>
            {isRu ? 'Долгосрочная память Франклина активна' : 'Long-term memory active'}: {memorySummary}
          </span>
        </div>
      )}

      {/* Messages Stream */}
      <div
        className={`flex-1 p-4 overflow-y-auto space-y-3.5 ${
          embedded
            ? isLight
              ? 'bg-slate-50/60'
              : 'bg-[#080a10]'
            : 'bg-slate-900/60 max-h-[390px] min-h-[290px]'
        }`}
      >
        {messages.map((msg) => {
          const isFranklin = msg.sender === 'franklin';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isFranklin ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  isFranklin
                    ? embedded && isLight
                      ? 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-2xs'
                      : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-xs'
                    : 'bg-amber-500 text-slate-950 font-medium rounded-tr-xs shadow-xs'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {/* Legacy Action Card */}
                {msg.actionCard && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/40 flex items-center gap-2 text-[11px] font-semibold text-emerald-500 dark:text-emerald-300">
                    <CheckCircle2 size={13} className="shrink-0" />
                    <span>{msg.actionCard.label}</span>
                  </div>
                )}

                {/* Interactive Suggested DB Actions from Franklin */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/70 space-y-1.5">
                    <span className="block text-[10px] font-mono uppercase tracking-wider opacity-70">
                      {isRu
                        ? 'Предложения Франклина для общей БД:'
                        : 'Franklin DB Suggestions:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.actions.map((act, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={act.applied}
                          onClick={() => handleApplyAction(msg.id, idx, act)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            act.applied
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                              : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {act.applied ? <Check size={12} /> : <Plus size={12} />}
                          <span>
                            {act.applied
                              ? isRu
                                ? `Выполнено: ${act.label}`
                                : `Applied: ${act.label}`
                              : act.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                {isFranklin ? (isRu ? 'Бенджамин Франклин' : 'Benjamin Franklin') : isRu ? 'Вы' : 'You'} •{' '}
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-start">
            <div
              className={`rounded-2xl rounded-tl-xs px-4 py-3 text-xs flex items-center gap-2 border ${
                embedded && isLight
                  ? 'bg-white border-slate-200 text-slate-600'
                  : 'bg-slate-800/90 border-slate-700 text-amber-300'
              }`}
            >
              <Loader2 size={14} className="animate-spin text-amber-500" />
              <span>
                {isRu
                  ? 'Бенджамин сверяется с общим Блокнотом и обдумывает ответ...'
                  : 'Benjamin is consulting your shared Notebook and reflecting...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Conversation & State Chips */}
      <div
        className={`px-3.5 py-2.5 border-t flex flex-wrap gap-1.5 ${
          embedded && isLight
            ? 'bg-white border-slate-200/80'
            : 'bg-slate-950 border-slate-800/80'
        }`}
      >
        <button
          type="button"
          onClick={() => handleQuickEmotionalAction('relax_vent')}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-[11px] font-medium transition-colors"
        >
          <Coffee size={11} />
          {isRu ? 'Поговорить по душам / Выдохнуть' : 'Unwind & Talk'}
        </button>

        <button
          type="button"
          onClick={() => handleQuickEmotionalAction('discuss_notebook')}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-[11px] font-medium transition-colors"
        >
          <BookOpen size={11} />
          {isRu ? 'Обсудить идеи из Блокнота' : 'Discuss Notebook Ideas'}
        </button>

        <button
          type="button"
          onClick={() => handleQuickEmotionalAction('low_energy')}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-[11px] font-medium transition-colors"
        >
          <BatteryLow size={11} />
          {isRu ? 'Мало сил (Жёлтый режим)' : 'Low energy'}
        </button>

        <button
          type="button"
          onClick={() => handleQuickEmotionalAction('slip_recovery')}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-[11px] font-medium transition-colors"
        >
          <ShieldAlert size={11} />
          {isRu ? 'Срыв без вины' : 'Zero-guilt slip'}
        </button>

        {anchorTask && !anchorTask.completed && (
          <button
            type="button"
            onClick={() => handleQuickEmotionalAction('focus_anchor')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-300 text-[11px] font-medium transition-colors"
          >
            <Compass size={11} />
            {isRu ? 'Старт Якоря (25м)' : 'Start Anchor (25m)'}
            <ArrowRight size={10} />
          </button>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className={`p-3 border-t flex items-center gap-2 ${
          embedded && isLight
            ? 'bg-slate-50 border-slate-200/80'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isRu
              ? 'Поделитесь мыслью, спросите совет у Бенджамина или обсудите запись из Блокнота...'
              : 'Share a thought, ask Benjamin for counsel, or discuss a Notebook note...'
          }
          className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-colors ${
            embedded && isLight
              ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-500'
              : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500/60'
          }`}
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-semibold transition-colors shrink-0 inline-flex items-center gap-1.5 text-xs"
        >
          <Send size={14} />
          {embedded && <span className="hidden sm:inline">{isRu ? 'Отправить' : 'Send'}</span>}
        </button>
      </form>
    </div>
  );

  if (embedded) {
    return renderChatBody();
  }

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2.5 pl-3.5 pr-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/25 border border-amber-500/40 transition-all hover:scale-[1.02] group"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 group-hover:rotate-6 transition-transform">
            <MessageCircleHeart size={16} />
          </div>
          <div className="text-left">
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <Sparkles size={10} />
              {isRu ? 'Живой Ментор · Общая БД' : 'Living Mentor · Shared DB'}
            </div>
            <div className="text-xs font-bold">
              {isRu ? 'Чат с Франклином' : 'Chat with Franklin'}
            </div>
          </div>
        </button>
      )}

      {/* Slide-over Mentor Panel */}
      {isOpen && renderChatBody()}
    </>
  );
};
