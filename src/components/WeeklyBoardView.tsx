import React, { useState } from 'react';
import { useFranklin } from '../context/FranklinContext';
import { WeeklyPlan, NotebookItem } from '../types/franklin';
import { FranklinMentorChat } from './FranklinMentorChat';
import { KnowledgeNotebookView } from './KnowledgeNotebookView';
import {
  CheckCircle,
  HelpCircle,
  Sparkles,
  Save,
  Clock,
  History,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  X,
  AlertTriangle,
  BookOpen,
  MessageCircleHeart,
} from 'lucide-react';

interface WeeklyBoardViewProps {
  initialSection?: 'board' | 'franklin-chat' | 'notebook';
}

export const WeeklyBoardView: React.FC<WeeklyBoardViewProps> = ({
  initialSection = 'board',
}) => {
  const { state, updateWeeklyPlan, archiveAndStartNewWeek, toggleHabit, language, t } = useFranklin();
  const [activeSection, setActiveSection] = useState<'board' | 'franklin-chat' | 'notebook'>(
    initialSection
  );
  const [noteToDiscuss, setNoteToDiscuss] = useState<NotebookItem | null>(null);
  const currentWeek = state.currentWeek;
  const records = state.habitWeeklyRecords || {};
  const isRu = language === 'ru';
  const weeklyFocusHabit = state.habits.find((h) => h.id === currentWeek.primaryHabitId) || state.habits[0];
  const completedHabitIds = state.todayLog.completedHabitIds;

  // Form states for the Sunday Review
  const [facts, setFacts] = useState(currentWeek.weeklyReview?.facts || '');
  const [progress, setProgress] = useState(currentWeek.weeklyReview?.progress || '');
  const [obstacles, setObstacles] = useState(currentWeek.weeklyReview?.obstacles || '');
  const [keyLesson, setKeyLesson] = useState(currentWeek.weeklyReview?.keyLesson || '');

  // Next week configuration
  const [lifeEvent, setLifeEvent] = useState(currentWeek.lifeEvent);
  const [primaryFocus, setPrimaryFocus] = useState(currentWeek.primaryFocus);
  const [primaryHabitId, setPrimaryHabitId] = useState(currentWeek.primaryHabitId);
  const [experimentHypothesis, setExperimentHypothesis] = useState(currentWeek.experiment.hypothesis);
  const [experimentMethod, setExperimentMethod] = useState(currentWeek.experiment.method);
  const [whatToDropStr, setWhatToDropStr] = useState(currentWeek.whatToDrop.join('\n'));

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [activeAdvisor, setActiveAdvisor] = useState<string | null>(null);

  // Compute habit completion rate for the current week
  const habitCompletionRate = React.useMemo(() => {
    let total = 0;
    let completed = 0;
    Object.values(records).forEach((dayMap) => {
      Object.values(dayMap).forEach((st) => {
        total++;
        if (st === 'done' || st === 'micro') completed++;
      });
    });
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [records]);

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    const dropList = whatToDropStr
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    updateWeeklyPlan({
      lifeEvent,
      primaryFocus,
      primaryHabitId,
      whatToDrop: dropList,
      experiment: {
        ...currentWeek.experiment,
        hypothesis: experimentHypothesis,
        method: experimentMethod,
      },
      weeklyReview: {
        facts,
        progress,
        obstacles,
        keyLesson,
        completedAt: new Date().toISOString(),
      },
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2200);
  };

  const executeArchiveNextWeek = () => {
    const nextWeekNumber = currentWeek.weekNumber + 1;
    const now = new Date();
    const startDate = now.toISOString().split('T')[0];
    const endDateObj = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endDate = endDateObj.toISOString().split('T')[0];

    const freshPlan: WeeklyPlan = {
      id: `week-${nextWeekNumber}`,
      weekNumber: nextWeekNumber,
      startDate,
      endDate,
      lifeEvent: lifeEvent || (isRu ? 'Новый недельный период' : 'New weekly cycle'),
      primaryFocus: primaryFocus || (isRu ? 'Поддержание базовых привычек' : 'Maintain core routines'),
      primaryHabitId: primaryHabitId || state.habits[0]?.id || 'h1',
      experiment: {
        hypothesis: experimentHypothesis || (isRu ? 'Тестирование нового окна времени' : 'Testing new scheduling window'),
        method: experimentMethod || (isRu ? '10 минут выделенного времени' : 'Dedicated 10 min window'),
      },
      whatToDrop: whatToDropStr.split('\n').filter(Boolean),
    };

    archiveAndStartNewWeek(freshPlan);
    setShowArchiveConfirm(false);
  };

  const ADVISORS = [
    {
      id: 'franklin',
      name: t('mentorFranklinTitle'),
      role: t('mentorFranklinRole'),
      question: t('mentorFranklinQuestion'),
      color: 'border-amber-500/50 text-amber-600 dark:text-amber-300',
    },
    {
      id: 'hormozi',
      name: t('mentorHormoziTitle'),
      role: t('mentorHormoziRole'),
      question: t('mentorHormoziQuestion'),
      color: 'border-emerald-500/50 text-emerald-600 dark:text-emerald-300',
    },
    {
      id: 'aurelius',
      name: t('mentorAureliusTitle'),
      role: t('mentorAureliusRole'),
      question: t('mentorAureliusQuestion'),
      color: 'border-blue-500/50 text-blue-600 dark:text-blue-300',
    },
    {
      id: 'munger',
      name: t('mentorMungerTitle'),
      role: t('mentorMungerRole'),
      question: t('mentorMungerQuestion'),
      color: 'border-purple-500/50 text-purple-600 dark:text-purple-300',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16 w-full max-w-full min-w-0 overflow-x-clip">
      {/* ─────────────────────────────────────────────────────────────────────────────
          UNIFIED HUB SWITCHER: 1. Knowledge Notebook  2. Benjamin Franklin Chat  3. Board of Directors
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSection('notebook')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSection === 'notebook'
                ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-xs'
                : 'bg-slate-100/80 dark:bg-[#141824] text-slate-700 dark:text-neutral-300 hover:bg-slate-200/70 dark:hover:bg-neutral-800'
            }`}
          >
            <BookOpen size={15} className={activeSection === 'notebook' ? '' : 'text-amber-500'} />
            <span>{isRu ? '1. Блокнот знаний & Gemini' : '1. Knowledge Notebook & Gemini'}</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-black/10 dark:bg-white/10">
              {(state.notebook || []).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('franklin-chat')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSection === 'franklin-chat'
                ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-xs'
                : 'bg-slate-100/80 dark:bg-[#141824] text-slate-700 dark:text-neutral-300 hover:bg-slate-200/70 dark:hover:bg-neutral-800'
            }`}
          >
            <MessageCircleHeart
              size={15}
              className={activeSection === 'franklin-chat' ? '' : 'text-emerald-500'}
            />
            <span>{isRu ? '2. Чат с Бенджамином Франклином' : '2. Chat with Benjamin Franklin'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('board')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSection === 'board'
                ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-xs'
                : 'bg-slate-100/80 dark:bg-[#141824] text-slate-700 dark:text-neutral-300 hover:bg-slate-200/70 dark:hover:bg-neutral-800'
            }`}
          >
            <Users size={15} className={activeSection === 'board' ? '' : 'text-indigo-500'} />
            <span>{isRu ? '3. Совет директоров (Неделя)' : '3. Weekly Board Review'}</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            {isRu
              ? 'Единая БД: Блокнот + Франклин + 9 Уровней синхронизированы'
              : 'Shared DB: Notebook + Franklin + 9 Levels synced'}
          </span>
        </div>
      </div>

      {activeSection === 'notebook' && (
        <KnowledgeNotebookView
          onAskFranklinAboutNote={(note) => {
            setNoteToDiscuss(note);
            setActiveSection('franklin-chat');
          }}
        />
      )}

      {activeSection === 'franklin-chat' && (
        <FranklinMentorChat
          embedded={true}
          onFocusTask={() => {}}
          initialNoteToDiscuss={noteToDiscuss}
          onClearNoteToDiscuss={() => setNoteToDiscuss(null)}
          onOpenNotebook={() => setActiveSection('notebook')}
        />
      )}

      {activeSection === 'board' && (
        <>
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HEADER BANNER & WEEKLY STATS
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-5 sm:p-6 shadow-xs transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-neutral-800/60">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-bold">
              <Users size={13} />
              <span>{t('wbTitle')}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              {t('wbSubtitle')}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-neutral-400 font-mono px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800">
              {t('weekLabel')} {currentWeek.weekNumber} · {currentWeek.startDate} — {currentWeek.endDate}
            </span>
            <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 font-semibold">
              <TrendingUp size={12} />
              <span>{t('habitConsistencyWeekly')} <strong className="font-bold">{habitCompletionRate}%</strong></span>
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 mt-4 leading-relaxed">
          {t('wbIntro')}
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          1.5. QUESTION 2: WHAT MATTERS MOST RIGHT NOW? (ACTIVE WEEKLY FOCUS & EXPERIMENT)
         ───────────────────────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/70 dark:border-neutral-800/60">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              {t('q2Kicker')}
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
              <span>{t('q2Title')}</span>
              <span className="text-xs font-normal text-slate-400 dark:text-neutral-500 font-mono">
                ({t('q2Subtitle')})
              </span>
            </h2>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            {t('weekLabel')} {currentWeek.weekNumber} · {currentWeek.startDate} — {currentWeek.endDate}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Primary Focus Statement & #1 Weekly Habit Check-in */}
          <div className="lg:col-span-2 p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                {t('contextAndFocus')}
              </div>
              <div className="text-xs text-slate-600 dark:text-neutral-400 mb-2 font-mono">
                {t('eventLabel')}:{' '}
                <span className="text-slate-900 dark:text-white font-semibold">{currentWeek.lifeEvent}</span>
              </div>
              <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
                &ldquo;{currentWeek.primaryFocus}&rdquo;
              </div>
            </div>

            {weeklyFocusHabit && (
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono font-bold flex items-center gap-1">
                    <Sparkles size={11} />
                    <span>{t('weeklyHabitTitle')}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
                    {weeklyFocusHabit.title}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleHabit(weeklyFocusHabit.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                    completedHabitIds.includes(weeklyFocusHabit.id)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                  }`}
                >
                  {completedHabitIds.includes(weeklyFocusHabit.id) ? t('doneToday') : t('checkIn')}
                </button>
              </div>
            )}
          </div>

          {/* Experiment of the Week */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                <Sparkles size={12} className="text-indigo-500" />
                <span>{t('experimentTitle')}</span>
              </div>
              <div className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed font-medium">
                {currentWeek.experiment.hypothesis}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/70 dark:border-neutral-800 flex items-center justify-between text-[11px] font-mono">
              <span className={currentWeek.experiment.isSuccessful ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}>
                {currentWeek.experiment.isSuccessful
                  ? isRu ? '✓ Гипотеза подтверждается' : '✓ Hypothesis validated'
                  : isRu ? 'В процессе проверки' : 'In validation'}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateWeeklyPlan({
                    experiment: {
                      ...currentWeek.experiment,
                      isSuccessful: !currentWeek.experiment.isSuccessful,
                    },
                  })
                }
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                {currentWeek.experiment.isSuccessful
                  ? isRu ? 'Сбросить' : 'Reset'
                  : isRu ? 'Подтвердить' : 'Validate'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. VIRTUAL BOARD OF DIRECTORS (ADVISORS COUNCIL)
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 transition-colors duration-200">
        <div className="border-b border-slate-200/80 dark:border-neutral-800/60 pb-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-bold">
            {t('boardMembersTitle')}
          </div>
          <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1">
            {t('boardMembersDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ADVISORS.map((advisor) => (
            <div
              key={advisor.id}
              onClick={() => setActiveAdvisor(activeAdvisor === advisor.id ? null : advisor.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                activeAdvisor === advisor.id
                  ? 'border-slate-800 dark:border-white/60 bg-slate-100 dark:bg-[#182033] shadow-xs'
                  : 'bg-slate-50 dark:bg-[#141824] border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-900 dark:text-white">{advisor.name}</span>
                <span className="font-mono text-[10px] text-slate-400 dark:text-neutral-500 uppercase">{advisor.role}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-neutral-300 italic leading-relaxed">
                &ldquo;{advisor.question}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2.5. INTERACTIVE FRANKLIN AI DIALOGUE & MENTORING SESSION
         ───────────────────────────────────────────────────────────────────────────── */}
      <FranklinMentorChat
        weeklyDraft={{
          facts,
          progress,
          obstacles,
          keyLesson,
        }}
        onApplyAdvice={(adviceText) => {
          setKeyLesson((prev) => (prev ? `${prev}\n\n[Совет Франклина]: ${adviceText}` : adviceText));
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 2000);
        }}
      />

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. THE 5 QUESTIONS TO PICK THE WEEKLY LEVERAGE HABIT
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 text-xs text-slate-700 dark:text-neutral-300 shadow-xs">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold mb-3">
          <HelpCircle size={15} className="text-blue-500" />
          <span>{t('fiveQuestionsTitle')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-[11px] text-slate-600 dark:text-neutral-400">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0d1017] border border-slate-200 dark:border-neutral-800 leading-relaxed">
            {t('qW1')}
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0d1017] border border-slate-200 dark:border-neutral-800 leading-relaxed">
            {t('qW2')}
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0d1017] border border-slate-200 dark:border-neutral-800 leading-relaxed">
            {t('qW3')}
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0d1017] border border-slate-200 dark:border-neutral-800 leading-relaxed">
            {t('qW4')}
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0d1017] border border-slate-200 dark:border-neutral-800 leading-relaxed">
            {t('qW5')}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. STRUCTURED SUNDAY REVIEW FORM (PARTS 1 & 2)
         ───────────────────────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSaveReview} className="space-y-6">
        {/* Part 1: Sunday Review */}
        <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6 transition-colors duration-200">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Clock size={16} className="text-amber-500" />
            <span>{t('wbPart1Title')}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5 font-mono">
                {t('wbFacts')}
              </label>
              <textarea
                rows={3}
                value={facts}
                onChange={(e) => setFacts(e.target.value)}
                placeholder={t('wbFactsPlh')}
                className="w-full bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-800 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5 font-mono">
                {t('wbProgress')}
              </label>
              <textarea
                rows={3}
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                placeholder={t('wbProgressPlh')}
                className="w-full bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-800 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5 font-mono">
                {t('wbObstacles')}
              </label>
              <textarea
                rows={3}
                value={obstacles}
                onChange={(e) => setObstacles(e.target.value)}
                placeholder={t('wbObstaclesPlh')}
                className="w-full bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-800 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5 font-mono">
                {t('wbKeyLesson')}
              </label>
              <textarea
                rows={3}
                value={keyLesson}
                onChange={(e) => setKeyLesson(e.target.value)}
                placeholder={t('wbKeyLessonPlh')}
                className="w-full bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-800 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Part 2: Planning the Next Cycle */}
        <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6 transition-colors duration-200">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-500" />
            <span>{t('wbPart2Title')}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5 font-mono">
                {t('wbEvent')}
              </label>
              <input
                type="text"
                value={lifeEvent}
                onChange={(e) => setLifeEvent(e.target.value)}
                placeholder={isRu
                  ? 'например: адаптация к новой нагрузке и выстраивание режима дня'
                  : 'e.g., Onboarding in new company & adapting to new daily rhythm'
                }
                className="w-full bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-800 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5 font-mono">
                {t('wbFocus')}
              </label>
              <input
                type="text"
                value={primaryFocus}
                onChange={(e) => setPrimaryFocus(e.target.value)}
                placeholder={isRu
                  ? 'например: спокойно войти в рабочий ритм, сохранить 3 тренировки в зале и сон к 23:30'
                  : 'e.g., Calmly adapt to new workflow, maintain baseline 3x gym, and protect sleep'
                }
                className="w-full bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-800 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5 font-mono">
                {t('wbHabit')}
              </label>
              <select
                value={primaryHabitId}
                onChange={(e) => setPrimaryHabitId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-800 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-indigo-500"
              >
                {state.habits.map((h) => {
                  const freqLabel = h.frequency === 'daily'
                    ? t('dailyFreq')
                    : h.frequency === 'weekdays'
                    ? t('weekdaysFreq')
                    : h.frequency === '3x_week'
                    ? t('threeTimesWeekFreq')
                    : t('weeklyFreq');
                  return (
                    <option key={h.id} value={h.id}>
                      {h.title} ({freqLabel})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5 font-mono">
                {t('wbExperiment')}
              </label>
              <input
                type="text"
                value={experimentMethod}
                onChange={(e) => setExperimentMethod(e.target.value)}
                placeholder={isRu
                  ? 'например: убирать телефон на зарядку в другой конец комнаты в 22:30'
                  : 'e.g., Put phone on desk charger across room at 22:30'
                }
                className="w-full bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-800 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5 font-mono">
                {t('wbWhatToDrop')}
              </label>
              <textarea
                rows={3}
                value={whatToDropStr}
                onChange={(e) => setWhatToDropStr(e.target.value)}
                placeholder={isRu
                  ? 'Не начинать новые сторонние проекты\nНе переживать об изучении третьего языка прямо сейчас\nНе делать масштабных уборок, пока рабочий график не стабилизируется'
                  : 'Do not start new side projects\nDo not worry about learning German right now\nDo not reorganize wardrobe until work rhythm stabilizes'
                }
                className="w-full bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-800 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <p className="text-[11px] text-slate-500 dark:text-neutral-500 mt-1">
                {t('wbWhatToDropHint')}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowArchiveConfirm(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-[#141824] dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 transition-colors"
            >
              {t('archiveWeekBtn')}
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 transition-colors shadow-xs"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle size={15} className="text-emerald-500 stroke-[3]" />
                  <span>{t('savedWeeklyToast')}</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>{t('saveWeeklyBtn')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0e1118] border border-slate-200 dark:border-neutral-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <AlertTriangle size={18} />
              <span>{t('confirmArchiveTitle')}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
              {t('confirmArchiveDesc')}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              >
                {t('cancelBtn')}
              </button>
              <button
                type="button"
                onClick={executeArchiveNextWeek}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 transition-colors shadow-xs"
              >
                {t('confirmArchiveConfirmBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. PAST WEEKS ARCHIVE
         ───────────────────────────────────────────────────────────────────────────── */}
      {state.pastWeeks.length > 0 && (
        <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-4 font-bold">
            <History size={14} />
            <span>{t('pastWeeksTitle')} ({state.pastWeeks.length})</span>
          </div>

          <div className="space-y-3">
            {state.pastWeeks.map((pw) => (
              <div key={pw.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 text-xs">
                <div className="flex justify-between items-center text-slate-500 dark:text-neutral-400 font-mono mb-1">
                  <span className="font-bold text-slate-900 dark:text-white">{t('weekLabel')} {pw.weekNumber}</span>
                  <span>{pw.startDate} — {pw.endDate}</span>
                </div>
                <div className="text-slate-800 dark:text-neutral-200 font-medium mb-1">&ldquo;{pw.primaryFocus}&rdquo;</div>
                {pw.weeklyReview?.keyLesson && (
                  <div className="text-slate-500 dark:text-neutral-400 text-[11px]">
                    {t('lessonLabel')}: {pw.weeklyReview.keyLesson}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
