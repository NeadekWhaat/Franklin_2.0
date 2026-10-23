import React, { useState, useEffect } from 'react';
import { useFranklin } from '../context/FranklinContext';
import { ANTI_DOPAMINE_RULES } from '../config/franklinDefaults';
import { ShieldAlert, Play, Pause, RotateCcw, Sparkles, Zap } from 'lucide-react';

export const AntiDopamineView: React.FC = () => {
  const { language, t } = useFranklin();
  const isRu = language === 'ru';

  // 10-minute starter timer
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes
  const [timerActive, setTimerActive] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [completedSessions, setCompletedSessions] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (timerActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (secondsLeft === 0 && timerActive) {
      setTimerActive(false);
      setCompletedSessions((c) => c + 1);
    }
    return () => clearInterval(interval);
  }, [timerActive, secondsLeft]);

  const toggleTimer = () => setTimerActive(!timerActive);
  const resetTimer = () => {
    setTimerActive(false);
    setSecondsLeft(600);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const HORMOZI_PILLARS = [
    {
      title: isRu ? 'Начинай сегодня' : 'Start Today',
      rule: isRu
        ? 'Если действие занимает не более 10 минут, начни сегодня без ожидания идеального настроения.'
        : 'If it takes ≤ 10 min and conditions allow, start today.',
    },
    {
      title: isRu ? 'Вместо жалобы ищи действие' : 'Instead of Complaining, Seek Action',
      rule: isRu
        ? 'Бесполезно сетовать на обстоятельства. Определи свой следующий доступный шаг.'
        : 'Complaints waste cognitive energy. Find the immediate next step.',
    },
    {
      title: isRu ? 'Держи обещания себе' : 'Word Given is Word Kept',
      rule: isRu
        ? 'Уверенность в себе строится исключительно на выполнении того, что сам себе пообещал.'
        : 'Confidence is currency built by honoring promises to yourself.',
    },
    {
      title: isRu ? 'Сначала важное' : 'First Things First',
      rule: isRu
        ? 'Защищай ведущий приоритет; сознательно говори «нет» вторичным проектам.'
        : 'Focus on the single governing priority; say no to competing distractions.',
    },
    {
      title: isRu ? 'Продолжай то, что работает' : 'Persist with What Works',
      rule: isRu
        ? 'Не бросай полезную привычку только потому, что исчезла новизна и стало скучно.'
        : 'Do not drop working routines simply because the novelty excitement faded.',
    },
    {
      title: isRu ? 'Создавай незаменимую ценность' : 'Create Irreplaceable Value',
      rule: isRu
        ? 'В карьере и партнёрках: развивай навыки и связи, которые дают реальные цифры.'
        : 'In affiliate & work: build specialized skills and deep partner connections.',
    },
    {
      title: isRu ? 'Трать меньше, чем зарабатываешь' : 'Spend Less Than You Earn',
      rule: isRu
        ? 'Откладывай не менее 10% дохода для систематического формирования капитала свободы.'
        : 'Save ≥ 10% systematically to convert effort into permanent freedom.',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-5 sm:p-6 shadow-xs transition-colors duration-200">
        <div className="text-[11px] font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 font-bold">
          {isRu ? 'Управление вниманием и дофамином' : 'Attention & Dopamine Management'}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
          {t('adTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 mt-2 leading-relaxed">
          {t('adIntro')}
        </p>
      </div>

      {/* 10-Minute Friction Breaker Timer */}
      <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-6 sm:p-7 shadow-xs transition-colors duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-md space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
              <Zap size={14} />
              <span>{t('timerTitle')}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('timerSubtitle')}</h2>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              {t('timerDesc')}
            </p>
            <input
              type="text"
              placeholder={t('timerInputPlh')}
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="mt-3 w-full bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col items-center p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 shrink-0 w-full md:w-auto md:min-w-[240px]">
            <div className="text-4xl sm:text-5xl font-extrabold font-mono text-slate-900 dark:text-white tracking-wider mb-4">
              {timeFormatted}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTimer}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-xs ${
                  timerActive
                    ? 'bg-amber-500 text-neutral-950 hover:bg-amber-400'
                    : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900'
                }`}
              >
                {timerActive ? <Pause size={14} /> : <Play size={14} />}
                <span>{timerActive ? t('timerPause') : t('timerStart')}</span>
              </button>

              <button
                onClick={resetTimer}
                className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white bg-slate-100 dark:bg-[#0e1118] border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 transition-colors"
                title={isRu ? 'Сбросить таймер' : 'Reset timer'}
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {completedSessions > 0 && (
              <div className="mt-3 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ {isRu ? `Завершено сессий: ${completedSessions}` : `Completed sessions: ${completedSessions}`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 19: 8 Anti-Dopamine Rules from PDF */}
      <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-5 sm:p-7 shadow-xs space-y-4 transition-colors duration-200">
        <div className="border-b border-slate-200/80 dark:border-neutral-800/60 pb-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5">
            <ShieldAlert size={13} />
            <span>{isRu ? 'Раздел 19 Паспорта · Антидофаминовые правила' : 'Section 19 · Anti-Dopamine Rules'}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            {isRu
              ? '8 правил возвращения контроля над вниманием и удовольствием'
              : '8 Rules for Regaining Attention & Dopamine Control'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1">
            {isRu
              ? 'Задача — не полный отказ от удовольствий, а сокращение автоматического поведения, которое вытесняет важные задачи и разрушает сон.'
              : 'The goal is not total elimination of pleasure, but stopping automatic task avoidance.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ANTI_DOPAMINE_RULES.map((rule, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 flex items-start gap-2.5 text-xs"
            >
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400 shrink-0">0{idx + 1}.</span>
              <span className="text-slate-700 dark:text-neutral-300 leading-relaxed">
                {isRu ? rule.ru : rule.en}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 7: 7 Hormozi Behavioral Pillars */}
      <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-5 sm:p-7 shadow-xs space-y-4 transition-colors duration-200">
        <div className="border-b border-slate-200/80 dark:border-neutral-800/60 pb-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-bold">
            {isRu ? 'Раздел 7 Паспорта · Идеи Алекса Хормози в Franklin 2.0' : 'Behavioral Resilience Principles'}
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            {isRu ? '7 практических установок (поведенческий двигатель системы)' : '7 Rules of Dopamine Protection'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {HORMOZI_PILLARS.map((pillar, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">0{idx + 1}.</span>
                <span className="font-bold text-xs text-slate-900 dark:text-white">{pillar.title}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                {pillar.rule}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
