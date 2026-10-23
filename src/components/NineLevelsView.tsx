import React, { useState } from 'react';
import { useFranklin } from '../context/FranklinContext';
import { LIFE_DIRECTIONS } from '../config/franklinDefaults';
import { LifeDirectionId, GoalItem } from '../types/franklin';
import { GoalModal } from './GoalModal';
import {
  Layers,
  User,
  Heart,
  Scale,
  Eye,
  Target,
  Repeat,
  CheckSquare,
  Activity,
  Trash2,
  Pencil,
  Plus,
  Sliders,
  Compass,
  Moon,
  Sparkles,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface NineLevelsViewProps {
  onOpenCausalChain?: () => void;
  onOpenSlipRecovery?: () => void;
  onOpenEveningReflection?: () => void;
}

export const NineLevelsView: React.FC<NineLevelsViewProps> = ({
  onOpenCausalChain,
  onOpenSlipRecovery,
  onOpenEveningReflection,
}) => {
  const { state, addGoal, deleteGoal, updateGoal, addHabit, deleteHabit, language, t } = useFranklin();
  const [activeLevel, setActiveLevel] = useState<number>(3); // Default to Principles (Constitution)

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<GoalItem | null>(null);

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDirection, setNewGoalDirection] = useState<LifeDirectionId>('career');
  const [newGoalHorizon, setNewGoalHorizon] = useState<'1-year' | 'quarterly' | 'monthly'>('1-year');
  const [newGoalWhy, setNewGoalWhy] = useState('');

  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitDirection, setNewHabitDirection] = useState<LifeDirectionId>('health');
  const [newHabitTrigger, setNewHabitTrigger] = useState('');
  const [newHabitMicro, setNewHabitMicro] = useState('');

  const isRu = language === 'ru';

  const LEVELS = [
    {
      num: 1,
      title: 'Personality',
      ru: 'Личность',
      subRu: 'Самопонимание',
      subEn: 'Self-knowledge',
      questionEn: 'Who am I and how am I wired?',
      questionRu: 'Кто я и как я устроен?',
      icon: User,
    },
    {
      num: 2,
      title: 'Values',
      ru: 'Ценности',
      subRu: 'Что важно',
      subEn: 'Core drivers',
      questionEn: 'What do I live and make decisions for?',
      questionRu: 'Ради чего я живу и принимаю решения?',
      icon: Heart,
    },
    {
      num: 3,
      title: 'Principles',
      ru: 'Принципы',
      subRu: 'Конституция',
      subEn: 'Constitution',
      questionEn: 'How do I want to act? (Franklin Constitution)',
      questionRu: 'Как я хочу действовать? (Конституция Франклина)',
      icon: Scale,
    },
    {
      num: 4,
      title: 'Vision',
      ru: 'Видение',
      subRu: '10 и 3 года',
      subEn: '10y & 3y',
      questionEn: 'Where do I want to arrive? (10y & 3y)',
      questionRu: 'Куда я хочу прийти? (10 лет и 3 года)',
      icon: Eye,
    },
    {
      num: 5,
      title: 'Goals',
      ru: 'Цели',
      subRu: 'Результаты',
      subEn: 'Targets',
      questionEn: 'What concrete results do I want to achieve?',
      questionRu: 'Чего я хочу достичь на разных горизонтах?',
      icon: Target,
    },
    {
      num: 6,
      title: 'Systems',
      ru: 'Системы',
      subRu: 'Процессы',
      subEn: 'Processes',
      questionEn: 'How will I do it? (Repeatable processes)',
      questionRu: 'Как я буду это делать? (Повторяемые процессы)',
      icon: Repeat,
    },
    {
      num: 7,
      title: 'Habits',
      ru: 'Привычки',
      subRu: 'Регулярность',
      subEn: 'Consistency',
      questionEn: 'What do I do consistently?',
      questionRu: 'Что я делаю постоянно?',
      icon: CheckSquare,
    },
    {
      num: 8,
      title: 'Actions',
      ru: 'Действия',
      subRu: 'Задачи дня',
      subEn: 'Daily tasks',
      questionEn: 'What must I do today?',
      questionRu: 'Что я должен сделать сегодня?',
      icon: Activity,
    },
    {
      num: 9,
      title: 'Analysis',
      ru: 'Анализ',
      subRu: 'Корректировка',
      subEn: 'Review',
      questionEn: 'What works and what needs to change?',
      questionRu: 'Что работает, а что нужно изменить?',
      icon: Layers,
    },
  ];

  // Fallback dictionary in case older English principle items exist in imported JSON
  const PRINCIPLE_RU_BY_NUM: Record<
    number,
    { codeRu: string; codeEn: string; nameRu: string; summaryRu: string; lawTextRu: string; practicalRuleRu: string }
  > = {
    1: {
      codeRu: 'ДЕЙСТВИЕ',
      codeEn: 'ACTION',
      nameRu: 'Начинай сегодня',
      summaryRu: 'Не жди идеального момента, подходящего настроения или полной готовности.',
      lawTextRu:
        'Если действие занимает не более 10 минут, а обстоятельства позволяют его выполнить — начинай сегодня. Высокие стандарты для результата должны сочетаться с низким порогом для начала.',
      practicalRuleRu:
        'Вместо «надо начать учить английский» → «сегодня 10 минут английского». Меньше проектировать — больше делать.',
    },
    2: {
      codeRu: 'ОТВЕТСТВЕННОСТЬ',
      codeEn: 'RESPONSIBILITY',
      nameRu: 'Отвечай за следующий шаг',
      summaryRu: 'Не ищи виноватого — ищи следующий доступный шаг в имеющихся условиях.',
      lawTextRu:
        'Не все обстоятельства находятся под моим контролем, и мир не обязан быть справедливым. Но я всегда выбираю, что делать дальше с имеющимися условиями. Помощь других — бонус, а не фундамент.',
      practicalRuleRu:
        'Правило «Жалоба → действие»: вместо «почему я плохо сплю / не уверен в себе?» спроси: «Какое маленькое действие я сделаю сегодня?»',
    },
    3: {
      codeRu: 'ОБЯЗАТЕЛЬСТВА',
      codeEn: 'COMMITMENTS',
      nameRu: 'Сказал → сделал',
      summaryRu: 'Не давай себе обещаний, которые не собираешься выполнять. Но если дал — выполни.',
      lawTextRu:
        'Уверенность в себе строится не положительными мыслями, а реальными доказательствами собственной надёжности. Если обстоятельства изменились, осознанно пересмотри обязательство, а не молча игнорируй его.',
      practicalRuleRu:
        'Лучше дать 1 небольшое обещание себе и выполнить его, чем создать 10 амбициозных обязательств и отказаться от всех.',
    },
    4: {
      codeRu: 'ПРИОРИТЕТ',
      codeEn: 'PRIORITY',
      nameRu: 'Сначала важное',
      summaryRu: 'Сначала главное. Остальное может подождать.',
      lawTextRu:
        'В первую очередь выполняй то, что имеет наибольшее значение для текущего периода. Не пытайся одновременно радикально изменить все сферы жизни. Приоритет — это не только выбрать главное, но и сознательно отказаться от второстепенного.',
      practicalRuleRu:
        'Каждое воскресенье выбирай 1 главный фокус недели, 1 главную привычку и список того, что сознательно НЕ будешь делать.',
    },
    5: {
      codeRu: 'НАСТОЙЧИВОСТЬ',
      codeEn: 'PERSISTENCE',
      nameRu: 'Продолжай то, что работает',
      summaryRu: 'Если работает — продолжай, даже когда стало скучно.',
      lawTextRu:
        'Не бросай полезную систему только потому, что исчезла новизна. Не путай угасание первоначального дофаминового энтузиазма с отсутствием результата. Не оценивай дерево, пока оно ещё растёт (правило 90 дней).',
      practicalRuleRu: 'Продолжай проверенный метод, пока реальные факты не потребуют его изменить.',
    },
    6: {
      codeRu: 'ОБУЧЕНИЕ',
      codeEn: 'LEARNING',
      nameRu: 'Проверяй свои убеждения',
      summaryRu: 'Я могу ошибаться. Я постоянно проверяю гипотезы и улучшаю свои методы.',
      lawTextRu:
        'Мнение окружающих — это информация для анализа, а не окончательный приговор. Обучение должно увеличивать способность действовать, а не превращаться в бесконечное потребление контента.',
      practicalRuleRu:
        'Из каждой главы прикладной книги выноси максимум 3 строки в блокнот: 1) Идея 2) Для меня 3) Что меняю в Franklin 2.0.',
    },
    7: {
      codeRu: 'ЦЕННОСТЬ',
      codeEn: 'VALUE',
      nameRu: 'Создавай ценность',
      summaryRu: 'Создавай больше ценности, чем от тебя ожидают, и трать меньше, чем зарабатываешь.',
      lawTextRu:
        'В карьере — создавай профессиональную ценность, которую трудно заменить (сильный hunting, понимание GEO, экономика трафика, запуск партнёров с нуля). В финансах — систематически формируй капитал.',
      practicalRuleRu:
        'Заработал → отложил минимум 10% → распределил остальное → инвестировал → не увеличивал расходы автоматически.',
    },
  };

  const formatFrequency = (freq: string) => {
    if (freq === 'daily') return t('dailyFreq');
    if (freq === 'weekdays') return t('weekdaysFreq');
    if (freq === '3x_week') return t('threeTimesWeekFreq');
    if (freq === 'weekly') return t('weeklyFreq');
    return freq;
  };

  const formatHabitTier = (tier: string) => {
    if (tier === 'weekly_focus') return isRu ? 'Главная привычка недели' : 'Weekly Focus';
    if (tier === 'experiment') return isRu ? 'Эксперимент недели' : 'Weekly Experiment';
    return isRu ? 'Базовая привычка' : 'Base Habit';
  };

  const handleOpenEditGoal = (goal: GoalItem) => {
    setGoalToEdit(goal);
    setIsGoalModalOpen(true);
  };

  const handleOpenAddGoalModal = () => {
    setGoalToEdit(null);
    setIsGoalModalOpen(true);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    addGoal({
      title: newGoalTitle.trim(),
      directionId: newGoalDirection,
      horizon: newGoalHorizon,
      whyItMatters: newGoalWhy || (isRu ? 'Поддерживает стратегический приоритет' : 'Supports strategic direction'),
      progressPercent: 0,
      active: true,
    });
    setNewGoalTitle('');
    setNewGoalWhy('');
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    addHabit({
      title: newHabitTitle.trim(),
      directionId: newHabitDirection,
      tier: 'base',
      frequency: 'daily',
      anchorTrigger: newHabitTrigger || (isRu ? 'Каждый день после утреннего старта' : 'Set specific daily trigger'),
      microVersion: newHabitMicro || (isRu ? '2-минутная стартовая версия' : '2 minute starter version'),
      active: true,
    });
    setNewHabitTitle('');
    setNewHabitTrigger('');
    setNewHabitMicro('');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12 w-full max-w-full min-w-0 overflow-x-clip">
      {/* Header */}
      <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-5 sm:p-6 shadow-xs transition-colors duration-200">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-neutral-400">
          {isRu ? 'Базовая архитектура системы · 9 уровней' : 'Complete Life Architecture · The 9 Levels'}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
          {t('nineLevelsTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 mt-2 leading-relaxed">
          {t('nineLevelsIntro')}
        </p>
      </div>

      {/* Mobile/Tablet Horizontal Scrollable Levels Bar */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {LEVELS.map((lvl) => {
          const Icon = lvl.icon;
          const isActive = activeLevel === lvl.num;
          return (
            <button
              key={lvl.num}
              onClick={() => setActiveLevel(lvl.num)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'bg-white dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300'
              }`}
            >
              <span className="font-mono text-[11px] opacity-70">0{lvl.num}</span>
              <Icon size={13} />
              <span>{isRu ? lvl.ru : lvl.title}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop Grid of 9 Levels Navigation */}
      <div className="hidden lg:grid grid-cols-9 gap-2">
        {LEVELS.map((lvl) => {
          const Icon = lvl.icon;
          const isActive = activeLevel === lvl.num;
          return (
            <button
              key={lvl.num}
              onClick={() => setActiveLevel(lvl.num)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-slate-900 dark:bg-neutral-800 border-slate-900 dark:border-neutral-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#0e1118] border-slate-200/80 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-mono text-xs opacity-60">0{lvl.num}</span>
                <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400 dark:text-neutral-500'} />
              </div>
              <div className="font-semibold text-xs truncate">
                {isRu ? lvl.ru : lvl.title}
              </div>
              <div className="text-[10px] opacity-60 truncate font-mono">
                {isRu ? lvl.subRu : lvl.subEn}
              </div>
            </button>
          );
        })}
      </div>

      {/* Level Content Area */}
      <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-5 sm:p-7 shadow-xs space-y-6 transition-colors duration-200">
        {/* LEVEL 1: PERSONALITY */}
        {activeLevel === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200/80 dark:border-neutral-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-mono text-xs text-slate-400 dark:text-neutral-500">
                  {isRu ? 'Уровень 01 · Личность (Раздел 3 Паспорта)' : 'Level 01 · Personality'}
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isRu ? 'Кто я и как я устроен?' : 'Who am I and how am I wired?'}
                </h2>
                <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1">
                  {isRu
                    ? 'Franklin 2.0 разрабатывается с учётом индивидуального поведения, а не абстрактного представления об идеальном дисциплинированном человеке.'
                    : 'A system must be designed for real human neurology, not an imaginary robot.'}
                </p>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/80 dark:border-neutral-800 text-xs shrink-0">
                <div className="font-bold text-slate-900 dark:text-white">{state.personality.name}</div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">{state.personality.role}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/80 dark:border-neutral-800">
                <h3 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2.5 font-mono">
                  {isRu ? '3.1. Сильные стороны' : 'Superpowers & Strengths'}
                </h3>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-neutral-300">
                  {state.personality.strengths.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-500 shrink-0 font-bold">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/80 dark:border-neutral-800">
                <h3 className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2.5 font-mono">
                  {isRu ? '3.2. Основные сложности (9 факторов риска)' : 'Challenges to Account For'}
                </h3>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-neutral-300">
                  {state.personality.challenges.map((c, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-500 shrink-0 font-bold">{idx + 1}.</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/80 dark:border-neutral-800 text-xs space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                {isRu ? 'Каркас режима сна, работы и энергии (Раздел 12 и 16)' : 'Energy Rhythm Anchor'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 dark:text-neutral-300">
                <div>
                  <span className="text-slate-500 dark:text-neutral-500">
                    {isRu ? 'Ориентир сна: ' : 'Ideal Bedtime & Wakeup: '}
                  </span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                    {state.personality.energyRhythms.idealBedtime} – {state.personality.energyRhythms.idealWakeup}{' '}
                    {isRu ? '(8,5 ч в постели)' : '(8.5h)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-neutral-500">
                    {isRu ? 'Рабочий блок: ' : 'Peak Deep Work Window: '}
                  </span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                    {state.personality.energyRhythms.peakHours}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/80 dark:border-neutral-800 text-slate-600 dark:text-neutral-400">
                <span className="font-semibold text-slate-800 dark:text-neutral-200">
                  {isRu ? '3.3. Основной вывод системы: ' : 'Core Conclusion: '}
                </span>
                {isRu
                  ? 'Нужно проектировать поведение не для идеального дня, а для реальной жизни: уменьшать число ежедневных решений, делать старт максимально простым и обеспечивать лёгкий возврат после пропусков.'
                  : 'Design behavior for real life rather than an ideal day: reduce daily friction and make returning after slips effortless.'}
              </div>
            </div>
          </div>
        )}

        {/* LEVEL 2: VALUES */}
        {activeLevel === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200/80 dark:border-neutral-800 pb-3">
              <span className="font-mono text-xs text-slate-400 dark:text-neutral-500">
                {isRu ? 'Уровень 02 · Ценности' : 'Level 02 · Values'}
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isRu ? 'Ради чего я живу и принимаю решения?' : 'What do I live and make decisions for?'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1">
                {isRu
                  ? 'Ценности задают критерии для выбора приоритетов, когда время, внимание и силы ограничены.'
                  : 'Values guide trade-offs when time and energy are finite.'}
              </p>
            </div>

            <div className="space-y-3">
              {state.values.map((v) => (
                <div key={v.id} className="p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/80 dark:border-neutral-800">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 mb-1">
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">
                      {isRu ? v.titleRu || v.title : v.title}
                    </span>
                    <span className="font-mono text-slate-400 dark:text-neutral-500">
                      {isRu ? `Ценность 0${v.order}` : `Value 0${v.order}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed">{v.description}</p>
                </div>
              ))}
            </div>

            {/* Section 21 from PDF: Self-Trust Principle */}
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/15 border border-amber-200/80 dark:border-amber-900/40 text-xs space-y-2">
              <div className="font-bold text-amber-800 dark:text-amber-300 uppercase font-mono">
                {isRu ? 'Раздел 21 · Отдельный принцип: Доверие к себе' : 'Section 21 · Core Principle: Self-Trust'}
              </div>
              <p className="text-slate-700 dark:text-neutral-300 leading-relaxed">
                {isRu
                  ? 'Уверенность не должна строиться только на положительных мыслях о себе. Она опирается на реальные доказательства: 1) я могу начать, даже когда не хочется; 2) я способен завершить важную задачу; 3) я держу разумное обещание; 4) я признаю ошибку и восстанавливаюсь без самобичевания.'
                  : 'Confidence is built on real proof: starting when you do not feel like it, finishing key tasks, keeping reasonable promises, and recovering without guilt.'}
              </p>
            </div>
          </div>
        )}

        {/* LEVEL 3: PRINCIPLES (FRANKLIN CONSTITUTION) */}
        {activeLevel === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200/80 dark:border-neutral-800 pb-3">
              <span className="font-mono text-xs text-slate-400 dark:text-neutral-500">
                {isRu ? 'Уровень 03 · Принципы (Раздел 6 и 7 Паспорта)' : 'Level 03 · Principles'}
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isRu
                  ? 'Конституция Franklin 2.0: Семь основных законов'
                  : 'The Franklin 2.0 Constitution: 7 Core Laws'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1">
                {isRu
                  ? 'Постоянные принципы поведения, которые задают направление и не меняются каждую неделю.'
                  : 'Permanent behavioral rules that do not change from week to week.'}
              </p>
            </div>

            {/* Notebook First Page Creed */}
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-[#121622] border border-amber-200/90 dark:border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-[11px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold">
                  {isRu ? 'Страница 1 блокнота · Центральная формула системы' : 'Notebook Page 1 · Core System Creed'}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {isRu
                    ? '«Не пытайся стать другим человеком за один день. Каждую неделю становись немного сильнее».'
                    : '“Do not try to become a different person in one day. Every week become a little stronger.”'}
                </div>
              </div>
              <span className="font-mono text-[11px] px-3 py-1.5 rounded-lg bg-white dark:bg-[#0d1017] border border-amber-200 dark:border-neutral-800 text-amber-800 dark:text-amber-300 font-semibold shrink-0">
                {isRu ? 'МОЯ ЖИЗНЬ — МОЯ ОТВЕТСТВЕННОСТЬ' : 'MY LIFE — MY RESPONSIBILITY'}
              </span>
            </div>

            {/* 6.1 Seven Core Laws */}
            <div className="space-y-3">
              {state.principles.map((law) => {
                const ruFallback = PRINCIPLE_RU_BY_NUM[law.lawNumber];
                const displayCode = isRu
                  ? ruFallback?.codeRu || law.code
                  : ruFallback?.codeEn || law.code;
                const displayName = isRu && ruFallback ? ruFallback.nameRu : law.name;
                const displaySummary = isRu && ruFallback ? ruFallback.summaryRu : law.summary;
                const displayLawText = isRu && ruFallback ? ruFallback.lawTextRu : law.lawText;
                const displayPracticalRule = isRu && ruFallback ? ruFallback.practicalRuleRu : law.practicalRule;

                return (
                  <div
                    key={law.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/80 dark:border-neutral-800/80 hover:border-slate-300 dark:hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-amber-600 dark:text-amber-400 font-bold">
                          {isRu ? 'ЗАКОН' : 'LAW'} 0{law.lawNumber} · {displayCode}
                        </span>
                        <span className="text-slate-300 dark:text-neutral-600">/</span>
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">{displayName}</span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">{displaySummary}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed mb-2">{displayLawText}</p>
                    <div className="text-[11px] text-slate-600 dark:text-neutral-400 bg-white dark:bg-[#0d1017] p-2.5 rounded-lg border border-slate-200 dark:border-neutral-800/60 font-mono">
                      <span className="text-slate-400 dark:text-neutral-500">
                        {isRu ? 'Практическое правило: ' : 'Practical rule: '}
                      </span>
                      <span className="text-slate-900 dark:text-neutral-200">{displayPracticalRule}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 6.2 & 6.3 Additional Principles & Non-Literal Hormozi Adaptations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/80 dark:border-neutral-800 space-y-2.5">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono">
                  {isRu
                    ? '6.2. Дополнительные принципы поведения (Идеи А. Хормози)'
                    : '6.2. Additional Behavioral Principles'}
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-neutral-300">
                  <li>• {isRu ? 'Меньше говорить о планах — больше делать (меньше проектировать, больше экспериментировать)' : 'Talk less about plans, do more'}</li>
                  <li>• {isRu ? 'Не ждать идеальных условий для старта' : 'Do not wait for perfect conditions'}</li>
                  <li>• {isRu ? 'Не избегать необходимого дискомфорта (написать партнёру, позаниматься английским)' : 'Do not avoid necessary discomfort'}</li>
                  <li>• {isRu ? 'Если выбрал главное — выполняй его качественно (чтобы не приходилось переделывать)' : 'Once the main task is chosen, execute it with high quality'}</li>
                  <li>• {isRu ? 'Не бросать работающие методы только из-за скуки' : 'Never drop working methods out of boredom'}</li>
                  <li>• {isRu ? 'Каждую неделю учиться тому, что реально увеличивает ценность' : 'Learn something every week that increases real value'}</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/80 dark:border-neutral-800 space-y-2.5">
                <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase font-mono">
                  {isRu
                    ? '6.3. Принципы, которые НЕЛЬЗЯ применять буквально (Без самодавления)'
                    : '6.3. Rules NOT to Apply Literally (Preventing Burnout)'}
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-neutral-300">
                  <li>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {isRu ? 'Вместо «Только совершенство» → ' : 'Instead of "Only excellence" → '}
                    </span>
                    {isRu ? 'высокие стандарты результата, но низкий порог входа в задачу.' : 'high standards for results, low threshold to start.'}
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {isRu ? 'Вместо «Постоянно ищи дискомфорт» → ' : 'Instead of "Seek pain" → '}
                    </span>
                    {isRu ? 'не избегай нужного дискомфорта, но не превращай страдание в самоцель.' : 'do not avoid necessary discomfort, but rest when needed.'}
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {isRu ? 'Вместо «Мнение других не важно» → ' : 'Instead of "Ignore others" → '}
                    </span>
                    {isRu ? 'мнение других — это информация и обратная связь, а не приговор моей ценности.' : 'opinions are feedback data, not a verdict.'}
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {isRu ? 'Вместо «Всегда считай себя неправым» → ' : 'Instead of "Assume you are wrong" → '}
                    </span>
                    {isRu ? 'допускай возможность ошибки и проверяй выводы данными.' : 'test assumptions with data.'}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* LEVEL 4: VISION */}
        {activeLevel === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200/80 dark:border-neutral-800 pb-3">
              <span className="font-mono text-xs text-slate-400 dark:text-neutral-500">
                {isRu ? 'Уровень 04 · Видение (Раздел 4 и 13 Паспорта)' : 'Level 04 · Vision'}
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isRu
                  ? 'Желаемая жизнь: Горизонты 10 лет и 3 года по 6 сферам'
                  : 'Desired Future Life: 10-Year & 3-Year Horizons'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1">
                {isRu
                  ? 'Иерархия планирования: Видение на 10 лет → ориентиры на 3 года → цели на 1 год → цели на квартал → задачи месяца → фокус недели → главные действия дня.'
                  : 'Where do I want to arrive across each fundamental dimension?'}
              </p>
            </div>

            <div className="space-y-4">
              {LIFE_DIRECTIONS.map((dir) => (
                <div key={dir.id} className="p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/80 dark:border-neutral-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <span className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                      <span style={{ color: dir.color }}>●</span>
                      <span>{isRu ? dir.nameRu : dir.name}</span>
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">
                      {isRu ? dir.taglineRu : dir.tagline}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-white dark:bg-[#0d1017] border border-slate-200 dark:border-neutral-800">
                      <span className="text-slate-500 dark:text-neutral-500 font-mono uppercase text-[10px] block mb-1">
                        {isRu ? 'Горизонт 10 лет (Желаемая жизнь)' : '10-Year Horizon'}
                      </span>
                      <span className="text-slate-700 dark:text-neutral-300 leading-relaxed">{state.vision.tenYear[dir.id]}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-white dark:bg-[#0d1017] border border-slate-200 dark:border-neutral-800">
                      <span className="text-slate-500 dark:text-neutral-500 font-mono uppercase text-[10px] block mb-1">
                        {isRu ? 'Горизонт 3 года (Конкретные состояния)' : '3-Year Horizon'}
                      </span>
                      <span className="text-slate-700 dark:text-neutral-300 leading-relaxed">{state.vision.threeYear[dir.id]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LEVEL 5: GOALS */}
        {activeLevel === 5 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200/80 dark:border-neutral-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-mono text-xs text-slate-400 dark:text-neutral-500">
                  {isRu ? 'Уровень 05 · Цели · Вопрос 1: Куда я иду?' : 'Level 05 · Goals · Question 1: Where am I going?'}
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isRu
                    ? 'Стратегические цели (Год, Квартал, Месяц)'
                    : 'Strategic Results (1-Year, Quarterly, Monthly)'}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {onOpenCausalChain && (
                  <button
                    type="button"
                    onClick={onOpenCausalChain}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-medium text-slate-700 dark:text-neutral-200 transition-colors"
                  >
                    <Compass size={14} className="text-slate-500" />
                    <span>{t('interactiveCausalChain')}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleOpenAddGoalModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  <Plus size={14} />
                  <span>{isRu ? 'Добавить цель' : 'New Goal'}</span>
                </button>
              </div>
            </div>

            {/* Causal Chain Breadcrumbs Stream (preserved from Question 1) */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141824]/60 border border-slate-200/70 dark:border-neutral-800 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 text-xs font-mono whitespace-nowrap">
                <span className="text-slate-400 uppercase tracking-wider text-[11px] font-sans">
                  {isRu ? 'Причинный поток:' : 'Causal Flow:'}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{isRu ? 'Сон' : 'Sleep'}</span>
                <span className="text-slate-300 dark:text-neutral-600">→</span>
                <span className="text-emerald-500 dark:text-emerald-300 font-semibold">{isRu ? 'Энергия' : 'Energy'}</span>
                <span className="text-slate-300 dark:text-neutral-600">→</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">{isRu ? 'Самообладание' : 'Composure'}</span>
                <span className="text-slate-300 dark:text-neutral-600">→</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{isRu ? 'Глубокая работа' : 'Deep Work'}</span>
                <span className="text-slate-300 dark:text-neutral-600">→</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">{isRu ? 'Развитие' : 'Growth'}</span>
                <span className="text-slate-300 dark:text-neutral-600">→</span>
                <span className="text-amber-700 dark:text-amber-300 font-semibold">{isRu ? 'Капитал' : 'Capital'}</span>
                <span className="text-slate-300 dark:text-neutral-600">→</span>
                <span className="text-slate-900 dark:text-white font-bold">{isRu ? 'Свобода' : 'Freedom'}</span>
              </div>
            </div>

            <div className="space-y-3">
              {state.goals.map((g) => {
                const dir = LIFE_DIRECTIONS.find((d) => d.id === g.directionId) || LIFE_DIRECTIONS[0];
                const progress = g.progressPercent ?? 0;
                return (
                  <div key={g.id} className="p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/80 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400">
                        <span className="font-semibold text-slate-800 dark:text-neutral-200 flex items-center gap-1">
                          <span style={{ color: dir.color }}>●</span>
                          <span>{isRu ? dir.nameRu : dir.name}</span>
                        </span>
                        <span>·</span>
                        <span className="font-mono text-slate-400 dark:text-neutral-500">
                          {g.horizon === '1-year'
                            ? t('oneYearHorizon')
                            : g.horizon === 'quarterly'
                            ? t('quarterlyHorizon')
                            : t('monthlyHorizon')}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{g.title}</div>
                      {g.metric && (
                        <div className="text-xs text-slate-600 dark:text-neutral-400 font-mono">
                          {isRu ? 'Критерий / Метрика: ' : 'Target: '}
                          <span className="text-slate-800 dark:text-neutral-200">{g.metric}</span>
                        </div>
                      )}
                      {g.whyItMatters && (
                        <div className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                          {g.whyItMatters}
                        </div>
                      )}

                      {/* Progress bar with quick +/- buttons */}
                      <div className="pt-2 flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateGoal(g.id, { progressPercent: Math.max(0, progress - 5) })}
                            className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-300 text-[10px]"
                            title="-5%"
                          >
                            -5%
                          </button>
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white min-w-[34px] text-center">
                            {progress}%
                          </span>
                          <button
                            onClick={() => updateGoal(g.id, { progressPercent: Math.min(100, progress + 5) })}
                            className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-300 text-[10px]"
                            title="+5%"
                          >
                            +5%
                          </button>
                        </div>
                        <div className="flex-1 max-w-xs h-1.5 bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-amber-400 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-start">
                      <button
                        onClick={() => handleOpenEditGoal(g)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
                        title={isRu ? 'Редактировать цель' : 'Edit goal'}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteGoal(g.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
                        title={isRu ? 'Удалить цель' : 'Delete goal'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Goal inline form */}
            <form onSubmit={handleAddGoal} className="p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/80 dark:border-neutral-800 space-y-3">
              <div className="text-xs font-bold text-slate-800 dark:text-white font-mono uppercase">{t('addGoalTitle')}</div>
              <input
                type="text"
                placeholder={isRu ? 'Название цели (конкретный измеримый результат)...' : 'Goal title (concrete result)...'}
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                className="w-full bg-white dark:bg-[#0d1017] border border-slate-300 dark:border-neutral-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <select
                  value={newGoalDirection}
                  onChange={(e) => setNewGoalDirection(e.target.value as LifeDirectionId)}
                  className="bg-white dark:bg-[#0d1017] border border-slate-300 dark:border-neutral-700 rounded-lg p-2 text-slate-800 dark:text-white"
                >
                  {LIFE_DIRECTIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {isRu ? d.nameRu : d.name}
                    </option>
                  ))}
                </select>
                <select
                  value={newGoalHorizon}
                  onChange={(e) => setNewGoalHorizon(e.target.value as any)}
                  className="bg-white dark:bg-[#0d1017] border border-slate-300 dark:border-neutral-700 rounded-lg p-2 text-slate-800 dark:text-white"
                >
                  <option value="1-year">{isRu ? 'Годовая цель' : '1-Year Horizon'}</option>
                  <option value="quarterly">{isRu ? 'Квартальная цель' : 'Quarterly Horizon'}</option>
                  <option value="monthly">{isRu ? 'Месячная цель' : 'Monthly Horizon'}</option>
                </select>
              </div>
              <input
                type="text"
                placeholder={isRu ? 'Зачем это нужно (связка со стратегией)...' : 'Why it matters (Strategy Linkage)...'}
                value={newGoalWhy}
                onChange={(e) => setNewGoalWhy(e.target.value)}
                className="w-full bg-white dark:bg-[#0d1017] border border-slate-300 dark:border-neutral-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold rounded-lg transition-colors shadow-xs"
              >
                {t('addGoalTitle')}
              </button>
            </form>
          </div>
        )}

        {/* LEVEL 6: SYSTEMS */}
        {activeLevel === 6 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200/80 dark:border-neutral-800 pb-3">
              <span className="font-mono text-xs text-slate-400 dark:text-neutral-500">
                {isRu ? 'Уровень 06 · Системы' : 'Level 06 · Systems'}
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isRu ? 'Повторяемые процессы и протоколы (Системы 1–8 из паспорта)' : 'Repeatable Processes & Standard Protocols'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1">
                {isRu
                  ? 'Цели показывают направление. Системы — это управляемые процессы, в которых правильное действие становится проще.'
                  : 'Goals tell you where to go. Systems are how you consistently get there without relying on motivation.'}
              </p>
            </div>

            <div className="space-y-4">
              {state.systems.map((sys) => {
                const dir = LIFE_DIRECTIONS.find((d) => d.id === sys.directionId) || LIFE_DIRECTIONS[0];
                return (
                  <div key={sys.id} className="p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/80 dark:border-neutral-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500 dark:text-neutral-400 mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">{sys.title}</span>
                      <span className="font-mono text-slate-400 dark:text-neutral-500">
                        {isRu ? dir.nameRu : dir.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-neutral-400 mb-3">{sys.description}</p>
                    <div className="space-y-1.5 text-xs text-slate-700 dark:text-neutral-300">
                      {sys.steps.map((st, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="font-mono text-slate-400 dark:text-neutral-500 text-[11px] shrink-0">{i + 1}.</span>
                          <span>{st}</span>
                        </div>
                      ))}
                    </div>
                    {sys.lowEnergyAlternative && (
                      <div className="mt-3 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-2.5 rounded-lg">
                        <span className="font-mono font-semibold">
                          {isRu ? 'Минимальная версия (при низкой энергии): ' : 'Low-Energy Mode: '}
                        </span>
                        {sys.lowEnergyAlternative}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LEVEL 7: HABITS */}
        {activeLevel === 7 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200/80 dark:border-neutral-800 pb-3">
              <span className="font-mono text-xs text-slate-400 dark:text-neutral-500">
                {isRu ? 'Уровень 07 · Привычки (Раздел 8, 9 и 18 Паспорта)' : 'Level 07 · Habits'}
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isRu
                  ? 'Архитектура привычек (Главная недели, Базовые, Эксперимент)'
                  : 'Habit Architecture (Base, Weekly Focus, Experiment)'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1">
                {isRu
                  ? 'Компактная система (6–8 отслеживаемых привычек). Каждая привычка имеет конкретное определение, ясный триггер и 2-минутную микро-версию.'
                  : 'Keep the active list small (6–8 max). Always define the anchor trigger and a 2-minute micro version.'}
              </p>
            </div>

            <div className="space-y-3">
              {state.habits.map((h) => {
                const dir = LIFE_DIRECTIONS.find((d) => d.id === h.directionId) || LIFE_DIRECTIONS[0];
                return (
                  <div key={h.id} className="p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/80 dark:border-neutral-800 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-neutral-400 mb-1">
                        <span className="text-slate-900 dark:text-white font-semibold">{h.title}</span>
                        <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#0d1017] border border-slate-200 dark:border-neutral-800 font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                          {formatHabitTier(h.tier)}
                        </span>
                        <span className="font-mono text-slate-500 dark:text-neutral-400">
                          {formatFrequency(h.frequency)}
                        </span>
                        <span className="text-slate-300 dark:text-neutral-600">·</span>
                        <span className="text-slate-500 dark:text-neutral-400">{isRu ? dir.nameRu : dir.name}</span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-neutral-400">
                        {t('triggerPrefix')} <span className="text-slate-800 dark:text-neutral-200 font-medium">{h.anchorTrigger}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-neutral-500">
                        {t('microFallback')} <span className="text-slate-700 dark:text-neutral-300">{h.microVersion}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteHabit(h.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors shrink-0"
                      title={isRu ? 'Удалить привычку' : 'Delete habit'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add Habit */}
            <form onSubmit={handleAddHabit} className="p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/80 dark:border-neutral-800 space-y-3">
              <div className="text-xs font-bold text-slate-800 dark:text-white font-mono uppercase">{t('addHabitTitle')}</div>
              <input
                type="text"
                placeholder={isRu ? 'Название привычки (конкретное действие)...' : 'Habit title (specific, observable action)...'}
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
                className="w-full bg-white dark:bg-[#0d1017] border border-slate-300 dark:border-neutral-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <input
                  type="text"
                  placeholder={isRu ? 'Триггер привязки (например: сразу после кофе)...' : 'Anchor trigger (e.g., Right after morning coffee)...'}
                  value={newHabitTrigger}
                  onChange={(e) => setNewHabitTrigger(e.target.value)}
                  className="bg-white dark:bg-[#0d1017] border border-slate-300 dark:border-neutral-700 rounded-lg p-2 text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder={isRu ? 'Микро-шаг (например: 2 отжимания или 1 страница)...' : 'Micro fallback (e.g., 2 pushups or 1 page)...'}
                  value={newHabitMicro}
                  onChange={(e) => setNewHabitMicro(e.target.value)}
                  className="bg-white dark:bg-[#0d1017] border border-slate-300 dark:border-neutral-700 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-bold rounded-lg transition-colors shadow-xs"
              >
                {t('addHabitTitle')}
              </button>
            </form>
          </div>
        )}

        {/* LEVEL 8: ACTIONS */}
        {activeLevel === 8 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200/80 dark:border-neutral-800 pb-3">
              <span className="font-mono text-xs text-slate-400 dark:text-neutral-500">
                {isRu ? 'Уровень 08 · Действия (Раздел 10, 14 и 16 Паспорта)' : 'Level 08 · Actions'}
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isRu
                  ? 'Ежедневное планирование, 3 режима дня и недельный ритм'
                  : 'Daily Execution, 3 Day Modes & Weekly Rhythm'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1">
                {isRu
                  ? 'Вопрос дня: «Что сегодня действительно важно и какой минимум позволит считать день не потерянным?»'
                  : 'Every task exists to serve a system, goal, and value.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/80 dark:border-neutral-800 text-xs text-slate-700 dark:text-neutral-300 space-y-3">
              <div className="font-bold text-slate-900 dark:text-white">
                {isRu ? '10. Три режима исполнения дня (Адаптация под энергию):' : 'The Three Daily Execution Modes:'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                    {isRu ? 'ЗЕЛЁНЫЙ — ОБЫЧНЫЙ ДЕНЬ' : 'GREEN DAY'}
                  </span>
                  <p className="text-slate-600 dark:text-neutral-300 leading-relaxed">
                    {isRu
                      ? 'Выполняются: рабочие обязанности (09:00–18:00), базовые действия для здоровья, главная задача дня, главная привычка недели и дополнительные занятия.'
                      : 'Full schedule: Work, health routines, primary task, weekly habit, and secondary tasks.'}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                  <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">
                    {isRu ? 'ЖЁЛТЫЙ — ТЯЖЁЛЫЙ ДЕНЬ' : 'YELLOW DAY'}
                  </span>
                  <p className="text-slate-600 dark:text-neutral-300 leading-relaxed">
                    {isRu
                      ? 'При усталости или недосыпе: основные рабочие обязанности, нормально поесть и выпить воды, минимальное действие для здоровья, 1 важный шаг, подготовка вечера и сон к 23:30.'
                      : 'Tired / heavy day: Core work, 1 key task, water/nutrition, 10-min prep, sleep by 23:30.'}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
                  <span className="font-bold text-rose-700 dark:text-rose-400 block mb-1">
                    {isRu ? 'КРАСНЫЙ — ВСЁ НЕ ПО ПЛАНУ' : 'RED DAY'}
                  </span>
                  <p className="text-slate-600 dark:text-neutral-300 leading-relaxed">
                    {isRu
                      ? 'Задача — не усугубить ситуацию: критические обязанности, поесть, базовая гигиена, подготовка ко сну и восстановление. Без компенсации завтра.'
                      : 'Survival mode: Vital duties only, nourish body, hygiene, sleep. Zero guilt or punishment.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 16: Preliminary Weekly Rhythm */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/80 dark:border-neutral-800 text-xs space-y-3">
              <div className="font-bold text-slate-900 dark:text-white">
                {isRu ? '16. Недельный ритм по дням (Жёсткий каркас + гибкое содержимое):' : 'Weekly Rhythm by Day:'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {[
                  { day: isRu ? 'Понедельник' : 'Monday', focus: isRu ? '🧠 Адаптация к работе, знакомство с процессами, заметки' : 'Work adaptation & processes' },
                  { day: isRu ? 'Вторник' : 'Tuesday', focus: isRu ? '📚 Работа (09–18) + вечерний английский (19:45–20:15)' : 'Work + evening English' },
                  { day: isRu ? 'Среда' : 'Wednesday', focus: isRu ? '🏋️ Работа (09–18) + тренировка (19:00–20:30, без английского)' : 'Work + Gym workout' },
                  { day: isRu ? 'Четверг' : 'Thursday', focus: isRu ? '🚀 Работа + английский (19:15) + проф. развитие (LATAM / аналитика)' : 'Work + English + Career growth' },
                  { day: isRu ? 'Пятница' : 'Friday', focus: isRu ? '🎮 Работа → отдых (20:00–23:00 игры/фильм/девушка без чувства вины)' : 'Work → Guilt-free relaxation' },
                  { day: isRu ? 'Суббота' : 'Saturday', focus: isRu ? '🏠 Быт и переезд (10–12) + английский (15:00) + тренировка/бокс (18:00)' : 'Home, English & Boxing/Gym' },
                  { day: isRu ? 'Воскресенье' : 'Sunday', focus: isRu ? '🧭 Восстановление + Совет директоров (17:00) + подготовка к ПН (18:00)' : 'Recovery + Sunday Board (17:00)' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-white dark:bg-[#0d1017] border border-slate-200 dark:border-neutral-800">
                    <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">{item.day}</div>
                    <div className="text-slate-700 dark:text-neutral-300 leading-relaxed">{item.focus}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LEVEL 9: ANALYSIS */}
        {activeLevel === 9 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200/80 dark:border-neutral-800 pb-3">
              <span className="font-mono text-xs text-slate-400 dark:text-neutral-500">
                {isRu ? 'Уровень 09 · Анализ (Раздел 11, 15, 24 и 25 Паспорта)' : 'Level 09 · Analysis'}
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isRu
                  ? 'Оценка результатов, формулы системы и фильтр решений'
                  : 'Evaluation, Reflection & Course Correction'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1">
                {isRu
                  ? 'Анализ без самобичевания. Срыв — это диагностическая информация для упрощения шага или изменения среды.'
                  : 'Analysis without self-blame. A slip is diagnostic information to refine the system.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/80 dark:border-neutral-800 text-xs space-y-3">
              <div className="font-bold text-slate-900 dark:text-white">
                {isRu ? '25. Основные рабочие формулы Franklin 2.0:' : 'Core Working Formulas of Franklin 2.0:'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-mono text-[11px]">
                <div className="p-3 rounded-lg bg-white dark:bg-[#0d1017] border border-slate-200 dark:border-neutral-800">
                  <span className="text-slate-400 dark:text-neutral-500 block mb-0.5">{isRu ? 'Формула стратегии:' : 'Strategy:'}</span>
                  <span className="text-slate-900 dark:text-white font-semibold">Ценности → Видение → Цели → Системы</span>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-[#0d1017] border border-slate-200 dark:border-neutral-800">
                  <span className="text-slate-400 dark:text-neutral-500 block mb-0.5">{isRu ? 'Формула исполнения:' : 'Execution:'}</span>
                  <span className="text-slate-900 dark:text-white font-semibold">Фокус недели → Главная привычка → Главная задача дня → Действие</span>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-[#0d1017] border border-slate-200 dark:border-neutral-800">
                  <span className="text-slate-400 dark:text-neutral-500 block mb-0.5">{isRu ? 'Формула восстановления:' : 'Recovery:'}</span>
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">Срыв → Короткий анализ → Корректировка → Ближайшее действие → Возврат</span>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-[#0d1017] border border-slate-200 dark:border-neutral-800">
                  <span className="text-slate-400 dark:text-neutral-500 block mb-0.5">{isRu ? 'Формула личной уверенности:' : 'Self-Confidence:'}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Реалистичное обещание → Выполнение → Доказательство надёжности</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/80 dark:border-neutral-800 text-xs space-y-2.5">
              <div className="font-bold text-slate-900 dark:text-white">
                {isRu ? '24. Метод принятия решений (Проверка любой новой идеи или привычки):' : 'Decision-Making Filter:'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-neutral-300">
                <div>1. {isRu ? 'Соответствует ли это моим ценностям?' : 'Does it align with my values?'}</div>
                <div>2. {isRu ? 'Влияет ли это на долгосрочные цели?' : 'Does it impact long-term goals?'}</div>
                <div>3. {isRu ? 'Является ли это главным приоритетом сейчас?' : 'Is it the main priority right now?'}</div>
                <div>4. {isRu ? 'Какой конкретный результат должен появиться?' : 'What concrete result should appear?'}</div>
                <div>5. {isRu ? 'Какое конкретное действие и как часто нужно?' : 'What specific action and frequency are required?'}</div>
                <div>6. {isRu ? 'Что я прекращу или отложу ради этого?' : 'What will I stop or postpone for this?'}</div>
                <div>7. {isRu ? 'Могу ли я поддерживать это без постоянной мотивации?' : 'Can I sustain this without constant motivation?'}</div>
                <div>8. {isRu ? 'Как я буду действовать, если план нарушится?' : 'How will I act if the plan is disrupted?'}</div>
              </div>
            </div>

            {/* Interactive Evening Review & Resilience Station (Question 4: How am I coping?) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                      <Moon size={16} />
                      <span>{t('eveningRitualTitle')}</span>
                    </div>
                    {state.todayLog.eveningReflection ? (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {t('eveningRitualDone')}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500">
                        {t('eveningRitualReady')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed mb-3">
                    {t('eveningRitualDesc')}
                  </p>
                  {state.todayLog.eveningReflection && (
                    <div className="mb-3 p-3 rounded-lg bg-white dark:bg-[#0d1017] border border-slate-200 dark:border-neutral-800 text-xs space-y-1">
                      <div>
                        <span className="text-slate-400 font-mono">{isRu ? 'Победы: ' : 'Wins: '}</span>
                        <span className="text-slate-800 dark:text-neutral-200">{state.todayLog.eveningReflection.successes}</span>
                      </div>
                      {state.todayLog.eveningReflection.lessonLearned && (
                        <div>
                          <span className="text-slate-400 font-mono">{isRu ? 'Урок: ' : 'Lesson: '}</span>
                          <span className="text-slate-800 dark:text-neutral-200">{state.todayLog.eveningReflection.lessonLearned}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {onOpenEveningReflection && (
                  <button
                    type="button"
                    onClick={onOpenEveningReflection}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>{state.todayLog.eveningReflection ? t('editReflection') : t('launchEveningReview')}</span>
                    <ChevronRight size={13} />
                  </button>
                )}
              </div>

              <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-2">
                    <Sparkles size={16} />
                    <span>{t('resilienceStationTitle')}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed mb-3">
                    {t('frictionReducerDesc')}
                  </p>
                  {state.slipLogs.length > 0 && (
                    <div className="mb-3 p-3 rounded-lg bg-white dark:bg-[#0d1017] border border-slate-200 dark:border-neutral-800 text-xs">
                      <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase mb-1">
                        {isRu ? `Последний возврат в строй (${state.slipLogs.length} всего):` : 'Latest recovery:'}
                      </div>
                      <div className="text-slate-800 dark:text-neutral-200 font-medium">
                        {state.slipLogs[0].selectedMicroAction}
                      </div>
                    </div>
                  )}
                </div>

                {onOpenSlipRecovery && (
                  <button
                    type="button"
                    onClick={onOpenSlipRecovery}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <RotateCcw size={13} />
                    <span>{t('bounceBackBtn')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Level Pagination Bottom Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-neutral-800 text-xs">
          <button
            type="button"
            disabled={activeLevel <= 1}
            onClick={() => {
              setActiveLevel((prev) => Math.max(1, prev - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ChevronLeft size={14} />
            <span>{isRu ? 'Предыдущий уровень' : 'Previous level'}</span>
          </button>

          <span className="font-mono text-slate-400 text-xs">
            0{activeLevel} / 09
          </span>

          <button
            type="button"
            disabled={activeLevel >= 9}
            onClick={() => {
              setActiveLevel((prev) => Math.min(9, prev + 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <span>{isRu ? 'Следующий уровень' : 'Next level'}</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Goal Modal (Add / Edit / Delete) */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        goalToEdit={goalToEdit}
      />
    </div>
  );
};
