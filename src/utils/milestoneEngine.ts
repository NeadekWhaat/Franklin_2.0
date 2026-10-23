import { FranklinState } from '../types/franklin';
import { MilestoneBadge, MilestoneStats } from '../types/milestone';

/**
 * Static catalog of Franklin 2.0 Milestones & Virtual Badges
 */
interface BadgeDefinition {
  id: string;
  title: string;
  titleRu: string;
  description: string;
  descriptionRu: string;
  category: 'green_mode' | 'habit_streak' | 'resilience' | 'mastery';
  tier: 'bronze' | 'silver' | 'gold' | 'emerald' | 'diamond';
  iconName: string;
  targetValue: number;
  unit: string;
  unitRu: string;
  quote: string;
  quoteRu: string;
  calculateValue: (stats: InternalStats) => number;
}

interface InternalStats {
  currentGreenStreak: number;
  longestGreenStreak: number;
  totalGreenDays: number;
  highEnergyGreenStreak: number;
  maxActiveHabitStreak: number;
  longestHistoricHabitStreak: number;
  topHabitTitle: string;
  allHabitsDoneDaysCount: number;
  microResilienceCount: number;
  weeklyReviewsCount: number;
  slipsRecoveredCount: number;
  weeklyFocusDaysCount: number;
  // Expanded metrics for simple and complex badges
  completedHabitsTodayCount: number;
  modeChosen: number;
  hasAnchorTaskDone: number;
  totalCheckinsCount: number;
  activeGoalsCount: number;
  averageGoalsProgress: number;
  completedGoalsCount: number;
  eveningReflectionsCount: number;
  systemsCount: number;
  anchorTasksTotalDone: number;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ─────────────────────────────────────────────────────────────
  // 1. SIMPLE & INSTANT EARLY WINS (BRONZE)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'first_step',
    title: 'First Step',
    titleRu: 'Первый шаг',
    description: 'Complete at least 1 habit in the tracker today. The journey of mastery begins with a single action.',
    descriptionRu: 'Отметьте хотя бы 1 выполненную привычку сегодня. Путь к мастерству начинается с одного действия.',
    category: 'habit_streak',
    tier: 'bronze',
    iconName: 'Zap',
    targetValue: 1,
    unit: 'habits',
    unitRu: 'привычка',
    quote: 'Well done is better than well said.',
    quoteRu: 'Хорошо сделано лучше, чем хорошо сказано. Первый шаг положен!',
    calculateValue: (s) => s.completedHabitsTodayCount,
  },
  {
    id: 'mode_master',
    title: 'Conscious Mode',
    titleRu: 'Осознанный выбор',
    description: 'Acknowledge and set your Day Mode (Green/Yellow/Red) based on real vital capacity.',
    descriptionRu: 'Осознанно выберите режим дня (Зелёный/Жёлтый/Красный) под реальный уровень энергии.',
    category: 'resilience',
    tier: 'bronze',
    iconName: 'Shield',
    targetValue: 1,
    unit: 'check',
    unitRu: 'выбор',
    quote: 'He that governs well, leads without friction.',
    quoteRu: 'Управление днём начинается с честной оценки своих сил.',
    calculateValue: (s) => s.modeChosen,
  },
  {
    id: 'main_anchor_first',
    title: 'Anchor of the Day',
    titleRu: 'Якорь дня',
    description: 'Complete today’s #1 Primary Anchor Task. Even if the rest falls apart, today was a win.',
    descriptionRu: 'Выполните Главную задачу дня (Якорь). Что бы ни случилось, этот день прожит не зря.',
    category: 'mastery',
    tier: 'bronze',
    iconName: 'Target',
    targetValue: 1,
    unit: 'task',
    unitRu: 'задача',
    quote: 'Do not squander time, for that is the stuff life is made of.',
    quoteRu: 'Главное действие дня защищает весь остальной фундамент.',
    calculateValue: (s) => s.hasAnchorTaskDone,
  },
  {
    id: 'goals_starter_3',
    title: 'Strategic Compass',
    titleRu: 'Компас стратега',
    description: 'Start advancing progress (> 0%) on at least 3 active strategic goals across your life directions.',
    descriptionRu: 'Сдвиньте прогресс (> 0%) минимум по 3 активным стратегическим целям.',
    category: 'mastery',
    tier: 'bronze',
    iconName: 'Compass',
    targetValue: 3,
    unit: 'goals',
    unitRu: 'цели',
    quote: 'If you fail to plan, you are planning to fail.',
    quoteRu: 'Ясный компас целей отсекает 90% бессмысленной суеты.',
    calculateValue: (s) => s.activeGoalsCount,
  },
  {
    id: 'micro_first',
    title: 'Power of Micro-Step',
    titleRu: 'Сила малого шага',
    description: 'Execute a micro-action instead of a full skip ("2 pushups beats 0"). Momentum stays alive.',
    descriptionRu: 'Примените микро-версию действия при нехватке сил («2 отжимания лучше, чем 0»).',
    category: 'resilience',
    tier: 'bronze',
    iconName: 'ShieldCheck',
    targetValue: 1,
    unit: 'action',
    unitRu: 'действие',
    quote: 'Little strokes fell great oaks.',
    quoteRu: 'Малый шаг сохраняет нейронную цепочку и спасает от чувства вины.',
    calculateValue: (s) => s.microResilienceCount,
  },
  {
    id: 'evening_first',
    title: 'Evening Peace',
    titleRu: 'Вечерний покой',
    description: 'Complete Franklin’s 3-minute evening review ("What good have I done today?").',
    descriptionRu: 'Заполните вечерний 3-минутный обзор Франклина («Какое добро я сделал сегодня?»).',
    category: 'mastery',
    tier: 'bronze',
    iconName: 'Moon',
    targetValue: 1,
    unit: 'review',
    unitRu: 'обзор',
    quote: 'Let no pleasure tempt thee, no profit allure thee to do an evil.',
    quoteRu: 'Вечерняя рефлексия замыкает цикл дня и дарует спокойный сон.',
    calculateValue: (s) => s.eveningReflectionsCount,
  },
  {
    id: 'green_momentum_3',
    title: 'Green Momentum',
    titleRu: 'Зелёный импульс',
    description: 'Maintain Green Day Mode for 3 consecutive days in a row.',
    descriptionRu: 'Удерживайте Зелёный режим дня 3 дня подряд без срывов.',
    category: 'green_mode',
    tier: 'bronze',
    iconName: 'Zap',
    targetValue: 3,
    unit: 'days',
    unitRu: 'дня',
    quote: 'Energy and persistence conquer all things.',
    quoteRu: 'Энергия и упорство побеждают всё. Первые 3 дня закладывают фундамент.',
    calculateValue: (s) => Math.max(s.currentGreenStreak, s.longestGreenStreak),
  },
  {
    id: 'habit_spark_3',
    title: 'First Spark',
    titleRu: 'Первая искра',
    description: 'Reach a 3-day streak on any tracked habit.',
    descriptionRu: 'Достигните стрика в 3 дня по любой привычке в трекере.',
    category: 'habit_streak',
    tier: 'bronze',
    iconName: 'Flame',
    targetValue: 3,
    unit: 'days',
    unitRu: 'дня',
    quote: 'Never leave that till tomorrow which you can do today.',
    quoteRu: 'Импульс запущен! Три дня повторения начинают снижать трение.',
    calculateValue: (s) => Math.max(s.maxActiveHabitStreak, s.longestHistoricHabitStreak),
  },
  {
    id: 'slip_rebounder',
    title: 'Bounce-Back Champion',
    titleRu: 'Иммунитет к срывам',
    description: 'Analyze an obstacle using the Causal Chain without guilt or self-punishment.',
    descriptionRu: 'Разберите сбой через цепочку без самобичевания и вернитесь в строй.',
    category: 'resilience',
    tier: 'bronze',
    iconName: 'RotateCcw',
    targetValue: 1,
    unit: 'analyses',
    unitRu: 'анализ',
    quote: 'A slip is merely diagnostic data, not a failure.',
    quoteRu: 'Умение быстро встать после спотыкания ценнее, чем никогда не падать.',
    calculateValue: (s) => s.slipsRecoveredCount,
  },
  {
    id: 'micro_mastery_3',
    title: 'Micro-Action Shield',
    titleRu: 'Щит микро-действий',
    description: 'Use micro-versions 3 times instead of skipping.',
    descriptionRu: 'Используйте микро-версии 3 раза в трудные дни.',
    category: 'resilience',
    tier: 'bronze',
    iconName: 'Shield',
    targetValue: 3,
    unit: 'times',
    unitRu: 'раза',
    quote: 'Motion restores momentum.',
    quoteRu: 'Микро-шаг защищает привычку даже в самые загруженные дни.',
    calculateValue: (s) => s.microResilienceCount,
  },

  // ─────────────────────────────────────────────────────────────
  // 2. INTERMEDIATE CONSISTENCY (SILVER)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'green_week_7',
    title: 'Green Week Maestro',
    titleRu: 'Зелёная неделя',
    description: 'Maintain Green Day Mode for 7 consecutive days. A full week of high clarity.',
    descriptionRu: '7 дней подряд в Зелёном режиме. Полная неделя собранности и устойчивости.',
    category: 'green_mode',
    tier: 'silver',
    iconName: 'ShieldCheck',
    targetValue: 7,
    unit: 'days',
    unitRu: 'дней',
    quote: 'He that can have patience can have what he will.',
    quoteRu: 'Тот, кто умеет терпеливо управлять своим днём, способен управлять судьбой.',
    calculateValue: (s) => Math.max(s.currentGreenStreak, s.longestGreenStreak),
  },
  {
    id: 'habit_iron_7',
    title: 'Iron Consistency',
    titleRu: 'Железная неделя',
    description: 'Reach a 7-day streak on any tracked habit.',
    descriptionRu: 'Стрик 7 дней подряд по привычке. Целая неделя без единого сбоя.',
    category: 'habit_streak',
    tier: 'silver',
    iconName: 'CheckCircle2',
    targetValue: 7,
    unit: 'days',
    unitRu: 'дней',
    quote: 'Constant dripping hollows out a stone.',
    quoteRu: 'Неделя безупречного выполнения. Трение начинает испаряться.',
    calculateValue: (s) => Math.max(s.maxActiveHabitStreak, s.longestHistoricHabitStreak),
  },
  {
    id: 'green_high_voltage',
    title: 'High Voltage Green',
    titleRu: 'Высокий заряд',
    description: 'Maintain Green Day Mode with high energy (Level 4 or 5) for 3 consecutive days.',
    descriptionRu: '3 дня подряд в Зелёном режиме с высоким уровнем энергии (4 или 5).',
    category: 'green_mode',
    tier: 'silver',
    iconName: 'Flame',
    targetValue: 3,
    unit: 'days',
    unitRu: 'дня',
    quote: 'Early to bed and early to rise makes a man healthy, wealthy, and wise.',
    quoteRu: 'Сон и восстановление питают высокий заряд — основа для ясных решений.',
    calculateValue: (s) => s.highEnergyGreenStreak,
  },
  {
    id: 'weekly_focus_5',
    title: 'Weekly Focus Anchor',
    titleRu: 'Якорь недели',
    description: 'Complete the primary weekly focus habit at least 5 times in the week.',
    descriptionRu: 'Выполните главную фокусную привычку недели минимум 5 раз.',
    category: 'mastery',
    tier: 'silver',
    iconName: 'Target',
    targetValue: 5,
    unit: 'times',
    unitRu: 'раз',
    quote: 'One today is worth two tomorrows.',
    quoteRu: 'Один сегодняшний шаг стоит двух завтрашних обещаний. Фокус недели защищён.',
    calculateValue: (s) => s.weeklyFocusDaysCount,
  },
  {
    id: 'board_strategist',
    title: 'Sunday Strategist',
    titleRu: 'Стратег воскресенья',
    description: 'Complete a thoughtful Weekly Board review and document key lessons.',
    descriptionRu: 'Проведите рефлексию недели в Совете Директоров и зафиксируйте выводы.',
    category: 'mastery',
    tier: 'silver',
    iconName: 'BookOpen',
    targetValue: 1,
    unit: 'reviews',
    unitRu: 'обзор',
    quote: 'An investment in knowledge pays the best interest.',
    quoteRu: 'Осознанный пересмотр недели превращает ошибки в мудрость.',
    calculateValue: (s) => s.weeklyReviewsCount,
  },
  {
    id: 'anchor_streak_3',
    title: 'Focus Trilogy',
    titleRu: 'Трилогия фокуса',
    description: 'Successfully complete the #1 Primary Anchor Task for 3 days.',
    descriptionRu: 'Выполните Главную задачу дня 3 раза. Важнейшие рычаги стабильно закрываются.',
    category: 'mastery',
    tier: 'silver',
    iconName: 'Target',
    targetValue: 3,
    unit: 'tasks',
    unitRu: 'задачи',
    quote: 'Focus is saying no to the hundred other good ideas.',
    quoteRu: 'Умение держать фокус на главном делает день непобедимым.',
    calculateValue: (s) => s.anchorTasksTotalDone,
  },
  {
    id: 'reflection_streak_3',
    title: 'Mirror of Awareness',
    titleRu: 'Зеркало осознанности',
    description: 'Complete Franklin’s evening review 3 times across your journey.',
    descriptionRu: 'Заполните вечернюю рефлексию 3 раза. Объективный взгляд на факты.',
    category: 'resilience',
    tier: 'silver',
    iconName: 'Moon',
    targetValue: 3,
    unit: 'reviews',
    unitRu: 'раза',
    quote: 'Search others for their virtues, thy self for thy vices.',
    quoteRu: 'Честная вечерняя калибровка формирует стержень личности.',
    calculateValue: (s) => s.eveningReflectionsCount,
  },
  {
    id: 'checkins_bronze_15',
    title: 'Rhythm of Resilience',
    titleRu: 'Ритм устойчивости',
    description: 'Log 15 total completed habit check-ins in the Matrix.',
    descriptionRu: 'Накопите 15 суммарных отметок привычек в трекере.',
    category: 'habit_streak',
    tier: 'silver',
    iconName: 'CheckCircle2',
    targetValue: 15,
    unit: 'checkins',
    unitRu: 'отметок',
    quote: 'Diligence is the mother of good luck.',
    quoteRu: 'Стабильность в малом создаёт удачу в большом.',
    calculateValue: (s) => s.totalCheckinsCount,
  },
  {
    id: 'systems_architect_3',
    title: 'Systems Architect',
    titleRu: 'Архитектор процессов',
    description: 'Execute 3 daily system tasks to prove your protocols work in action.',
    descriptionRu: 'Выполните 3 ежедневные задачи по вашим системам в блоке дня.',
    category: 'mastery',
    tier: 'silver',
    iconName: 'Layers',
    targetValue: 3,
    unit: 'tasks',
    unitRu: 'задачи',
    quote: 'Systems run the business, and people run the systems.',
    quoteRu: 'Системы снимают нагрузку с воли и автоматизируют результат.',
    calculateValue: (s) => s.systemsCount,
  },

  // ─────────────────────────────────────────────────────────────
  // 3. DEEP MASTERY & DISCIPLINE (GOLD)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'green_clarity_14',
    title: 'Fortress of Clarity',
    titleRu: 'Крепость ясности',
    description: 'Maintain Green Day Mode for 14 consecutive days without emotional collapse.',
    descriptionRu: '14 дней подряд в Зелёном режиме. Ваша система стала бронёй от хаоса.',
    category: 'green_mode',
    tier: 'gold',
    iconName: 'Sparkles',
    targetValue: 14,
    unit: 'days',
    unitRu: 'дней',
    quote: 'Order in one’s days produces peace in one’s mind.',
    quoteRu: 'Порядок в делах рождает непревзойдённый покой и уверенность в душе.',
    calculateValue: (s) => Math.max(s.currentGreenStreak, s.longestGreenStreak),
  },
  {
    id: 'habit_neural_14',
    title: 'Neural Automator',
    titleRu: 'Автоматизм привычки',
    description: 'Reach a 14-day streak on any tracked habit. Friction begins to evaporate.',
    descriptionRu: '14 дней стрика. Действие выполняется на автомате без внутреннего сопротивления.',
    category: 'habit_streak',
    tier: 'gold',
    iconName: 'Compass',
    targetValue: 14,
    unit: 'days',
    unitRu: 'дней',
    quote: 'It is easier to prevent bad habits than to break them.',
    quoteRu: 'Привычка закреплена в нейронах. Трение уступило место гладкому потоку.',
    calculateValue: (s) => Math.max(s.maxActiveHabitStreak, s.longestHistoricHabitStreak),
  },
  {
    id: 'green_century_20',
    title: 'Century of Green',
    titleRu: 'Золотой фонд дней',
    description: 'Log 20 total Green days across your history.',
    descriptionRu: 'Накопите суммарно 20 Зелёных дней в истории системы.',
    category: 'green_mode',
    tier: 'gold',
    iconName: 'Award',
    targetValue: 20,
    unit: 'days',
    unitRu: 'дней',
    quote: 'Small strokes fell great oaks.',
    quoteRu: 'Малые удары валят вековые дубы. Каждый зелёный день приближает большую цель.',
    calculateValue: (s) => s.totalGreenDays,
  },
  {
    id: 'zenith_100_percent',
    title: 'Day Zenith (100%)',
    titleRu: 'Зенит дня (100%)',
    description: 'Complete 100% of all active habits in a single day.',
    descriptionRu: 'Закройте 100% всех привычек за один день (минимум 4 привычки).',
    category: 'habit_streak',
    tier: 'gold',
    iconName: 'Sun',
    targetValue: 1,
    unit: 'times',
    unitRu: 'раз',
    quote: 'Employ your time well if you mean to gain leisure.',
    quoteRu: 'Идеальный день в полном согласии со своими приоритетами.',
    calculateValue: (s) => s.allHabitsDoneDaysCount,
  },
  {
    id: 'checkins_gold_35',
    title: 'Master of Consistency',
    titleRu: 'Мастер постоянства',
    description: 'Accumulate 35 total habit check-ins in the matrix.',
    descriptionRu: 'Накопите 35 суммарных отметок привычек в трекере.',
    category: 'habit_streak',
    tier: 'gold',
    iconName: 'Trophy',
    targetValue: 35,
    unit: 'checkins',
    unitRu: 'отметок',
    quote: 'Action speaks louder than intention.',
    quoteRu: '35 конкретных доказательств надёжности перед самим собой.',
    calculateValue: (s) => s.totalCheckinsCount,
  },
  {
    id: 'anchor_titan_7',
    title: 'Invulnerable Anchor',
    titleRu: 'Неуязвимый якорь',
    description: 'Complete the #1 Primary Anchor Task 7 times.',
    descriptionRu: 'Закройте Главную задачу дня 7 раз. Выполнение ключевого приоритета стало железным правилом.',
    category: 'mastery',
    tier: 'gold',
    iconName: 'Crown',
    targetValue: 7,
    unit: 'tasks',
    unitRu: 'раз',
    quote: 'Drive thy business, or it will drive thee.',
    quoteRu: 'Ты управляешь своими приоритетами, а не обстоятельства управляют тобой.',
    calculateValue: (s) => s.anchorTasksTotalDone,
  },
  {
    id: 'goal_advancer_50',
    title: 'Strategic Momentum',
    titleRu: 'Стратегический сдвиг',
    description: 'Reach 50% or higher average progress across all active strategic goals.',
    descriptionRu: 'Доведите средний прогресс по всем целям до 50% и выше.',
    category: 'mastery',
    tier: 'gold',
    iconName: 'Award',
    targetValue: 50,
    unit: '%',
    unitRu: '%',
    quote: 'Resolution: resolve to perform what you ought; perform without fail what you resolve.',
    quoteRu: 'Планы превращаются в осязаемые цифры и результаты.',
    calculateValue: (s) => Math.round(s.averageGoalsProgress),
  },

  // ─────────────────────────────────────────────────────────────
  // 4. HIGH-DIFFICULTY TRANSFORMATION (EMERALD)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'green_titan_30',
    title: 'Unshakable Equilibrium',
    titleRu: 'Титановое равновесие',
    description: 'Maintain Green Day Mode for 30 consecutive days. Elite personal mastery.',
    descriptionRu: '30 дней непрерывного Зелёного режима. Высший пилотаж самообладания.',
    category: 'green_mode',
    tier: 'emerald',
    iconName: 'Crown',
    targetValue: 30,
    unit: 'days',
    unitRu: 'дней',
    quote: 'Constant dripping hollows out a stone.',
    quoteRu: 'Капля за каплей выдалбливает камень. Постоянство сделало невозможное вашей нормой.',
    calculateValue: (s) => Math.max(s.currentGreenStreak, s.longestGreenStreak),
  },
  {
    id: 'habit_nature_21',
    title: 'Second Nature',
    titleRu: 'Вторая натура',
    description: 'Achieve a 21-day continuous streak on any habit. The habit is now part of your identity.',
    descriptionRu: '21 день непрерывного стрика. Привычка стала естественной частью вашей личности.',
    category: 'habit_streak',
    tier: 'emerald',
    iconName: 'Trophy',
    targetValue: 21,
    unit: 'days',
    unitRu: 'день',
    quote: 'Your net worth to the world is usually determined by what remains after your bad habits are subtracted.',
    quoteRu: 'Постоянство в малом сделало привычку вашим характером.',
    calculateValue: (s) => Math.max(s.maxActiveHabitStreak, s.longestHistoricHabitStreak),
  },
  {
    id: 'checkins_emerald_60',
    title: 'Diamond Discipline',
    titleRu: 'Алмазная дисциплина',
    description: 'Accumulate 60 total habit check-ins in the matrix.',
    descriptionRu: 'Накопите 60 суммарных отметок привычек в трекере.',
    category: 'habit_streak',
    tier: 'emerald',
    iconName: 'Award',
    targetValue: 60,
    unit: 'checkins',
    unitRu: 'отметок',
    quote: 'Without continual growth and effort, such words as improvement, achievement, and success have no meaning.',
    quoteRu: '60 шагов к трансформации. Система работает как швейцарские часы.',
    calculateValue: (s) => s.totalCheckinsCount,
  },
  {
    id: 'zenith_triad_3',
    title: 'Zenith Triad',
    titleRu: 'Триумфальный зенит',
    description: 'Achieve 100% completion of all habits on 3 separate days.',
    descriptionRu: 'Закройте 100% всех привычек за день 3 раза.',
    category: 'habit_streak',
    tier: 'emerald',
    iconName: 'Sun',
    targetValue: 3,
    unit: 'days',
    unitRu: 'дня',
    quote: 'He that is good for making excuses is seldom good for anything else.',
    quoteRu: 'Три безупречных дня стопроцентного выполнения.',
    calculateValue: (s) => s.allHabitsDoneDaysCount,
  },
  {
    id: 'goal_finisher_1',
    title: 'Peak Conquered',
    titleRu: 'Взятая вершина',
    description: 'Complete at least 1 strategic goal to 100% completion.',
    descriptionRu: 'Доведите хотя бы 1 стратегическую цель до 100% выполнения.',
    category: 'mastery',
    tier: 'emerald',
    iconName: 'Crown',
    targetValue: 1,
    unit: 'goals',
    unitRu: 'цель',
    quote: 'Great outcomes are accumulated through unyielding fidelity to small daily steps.',
    quoteRu: 'Большая цель полностью покорена! Время ставить новые горизонты.',
    calculateValue: (s) => s.completedGoalsCount,
  },

  // ─────────────────────────────────────────────────────────────
  // 5. LEGENDARY FRANKLIN EXCELLENCE (DIAMOND)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'habit_centurion_30',
    title: 'Lifelong Habit',
    titleRu: 'Привычка на всю жизнь',
    description: 'Achieve a 30-day streak on any tracked habit. Complete integration.',
    descriptionRu: '30 дней непрерывного стрика по привычке. Полная интеграция в ДНК.',
    category: 'habit_streak',
    tier: 'diamond',
    iconName: 'Crown',
    targetValue: 30,
    unit: 'days',
    unitRu: 'дней',
    quote: 'The ancients tell us what is best; but we must learn of the moderns what is fittest.',
    quoteRu: '30 дней стрика. Никакого сопротивления — только чистая эффективность.',
    calculateValue: (s) => Math.max(s.maxActiveHabitStreak, s.longestHistoricHabitStreak),
  },
  {
    id: 'green_legend_50',
    title: 'Franklin Legend',
    titleRu: 'Легенда Франклина',
    description: 'Maintain Green Day Mode for 50 total days across your history.',
    descriptionRu: 'Накопите 50 суммарных Зелёных дней в истории системы.',
    category: 'green_mode',
    tier: 'diamond',
    iconName: 'Trophy',
    targetValue: 50,
    unit: 'days',
    unitRu: 'дней',
    quote: 'If you would not be forgotten, as soon as you are dead and rotten, either write things worth reading, or do things worth the writing.',
    quoteRu: '50 зелёных дней. Вы создали шедевр личной дисциплины.',
    calculateValue: (s) => s.totalGreenDays,
  },
  {
    id: 'grandmaster_franklin_100',
    title: 'Grandmaster of Virtues',
    titleRu: 'Гроссмейстер добродетелей',
    description: 'Log 100 total habit completions. The legendary 13 virtues of Franklin live through you.',
    descriptionRu: 'Накопите 100 суммарных отметок привычек в трекере. Легендарное постоянство.',
    category: 'mastery',
    tier: 'diamond',
    iconName: 'Crown',
    targetValue: 100,
    unit: 'checkins',
    unitRu: 'отметок',
    quote: 'A life of leisure and a life of laziness are two things. There will be sleeping enough in the grave.',
    quoteRu: '100 побед над прокрастинацией. Настоящая внутренняя свобода.',
    calculateValue: (s) => s.totalCheckinsCount,
  },
];

/**
 * Computes deep stats across FranklinState to evaluate streaks and consistency
 */
export function computeMilestoneStats(state: FranklinState): InternalStats {
  const todayStr = state.todayLog.date;
  const records = state.habitWeeklyRecords || {};
  const pastLogs = state.pastLogs || {};

  const dayModeMap: Record<string, { dayMode: string; energyLevel: number }> = {};

  Object.entries(pastLogs).forEach(([date, log]) => {
    if (!log || !log.dayMode) return;
    const hasPastActivity =
      (log.completedHabitIds && log.completedHabitIds.length > 0) ||
      (log.tasks && log.tasks.some((t) => t.completed)) ||
      Boolean(log.eveningReflection);
    if (hasPastActivity) {
      dayModeMap[date] = { dayMode: log.dayMode, energyLevel: log.energyLevel || 3 };
    }
  });

  const todayRecordValues = Object.values(records[todayStr] || {});
  const hasTodayHabitCheckin =
    (state.todayLog.completedHabitIds && state.todayLog.completedHabitIds.length > 0) ||
    todayRecordValues.some((v) => v === 'done' || v === 'micro');
  const hasTodayTaskDone = (state.todayLog.tasks || []).some((t) => t.completed);
  const hasTodayActivity =
    hasTodayHabitCheckin ||
    hasTodayTaskDone ||
    Boolean(state.todayLog.eveningReflection) ||
    Boolean((state.todayLog as any).modeConfirmed);

  if (hasTodayActivity) {
    dayModeMap[todayStr] = {
      dayMode: state.todayLog.dayMode,
      energyLevel: state.todayLog.energyLevel || 3,
    };
  }

  Object.keys(records).forEach((date) => {
    if (!dayModeMap[date]) {
      const vals = Object.values(records[date] || {});
      if (vals.some((v) => v === 'done' || v === 'micro')) {
        dayModeMap[date] = { dayMode: 'GREEN', energyLevel: 3 };
      }
    }
  });

  const sortedDates = Object.keys(dayModeMap).sort();

  let currentGreenStreak = 0;
  let longestGreenStreak = 0;
  let totalGreenDays = 0;
  let highEnergyGreenStreak = 0;

  Object.values(dayModeMap).forEach((item) => {
    if (item.dayMode === 'GREEN') {
      totalGreenDays += 1;
    }
  });

  const todayIdx = sortedDates.indexOf(todayStr);
  if (todayIdx !== -1) {
    for (let i = todayIdx; i >= 0; i--) {
      const d = sortedDates[i];
      if (dayModeMap[d].dayMode === 'GREEN') {
        currentGreenStreak += 1;
      } else {
        break;
      }
    }
  }

  let tempGreen = 0;
  sortedDates.forEach((d) => {
    if (dayModeMap[d].dayMode === 'GREEN') {
      tempGreen += 1;
      if (tempGreen > longestGreenStreak) longestGreenStreak = tempGreen;
    } else {
      tempGreen = 0;
    }
  });
  if (currentGreenStreak > longestGreenStreak) {
    longestGreenStreak = currentGreenStreak;
  }

  if (todayIdx !== -1) {
    for (let i = todayIdx; i >= 0; i--) {
      const d = sortedDates[i];
      const item = dayModeMap[d];
      if (item.dayMode === 'GREEN' && item.energyLevel >= 4) {
        highEnergyGreenStreak += 1;
      } else {
        break;
      }
    }
  }

  const habitDates = Object.keys(records).sort();
  const habits = state.habits || [];
  let maxActiveHabitStreak = 0;
  let longestHistoricHabitStreak = 0;
  let topHabitTitle = '';
  let totalCheckinsCount = 0;

  habits.forEach((habit) => {
    let currentStreak = 0;
    let maxStreak = 0;

    for (let i = habitDates.length - 1; i >= 0; i--) {
      const date = habitDates[i];
      const status = records[date]?.[habit.id] || 'none';

      if (status === 'done' || status === 'micro') {
        currentStreak += 1;
      } else if (status === 'rest') {
        continue;
      } else {
        break;
      }
    }

    let rolling = 0;
    habitDates.forEach((date) => {
      const status = records[date]?.[habit.id] || 'none';
      if (status === 'done' || status === 'micro') {
        rolling += 1;
        totalCheckinsCount += 1;
        if (rolling > maxStreak) maxStreak = rolling;
      } else if (status === 'rest') {
        // preserves streak
      } else {
        rolling = 0;
      }
    });

    if (currentStreak > maxActiveHabitStreak) {
      maxActiveHabitStreak = currentStreak;
      topHabitTitle = habit.title;
    }
    if (maxStreak > longestHistoricHabitStreak) {
      longestHistoricHabitStreak = maxStreak;
    }
  });

  // Also include today's completedHabitIds in completedHabitsTodayCount
  const completedHabitsTodayCount = Math.max(
    (state.todayLog.completedHabitIds || []).length,
    Object.values(records[todayStr] || {}).filter((v) => v === 'done' || v === 'micro').length
  );

  let allHabitsDoneDaysCount = 0;
  let microResilienceCount = 0;

  habitDates.forEach((date) => {
    const dayRecords = records[date] || {};
    let doneOrRestCount = 0;
    let activeHabitsForDay = 0;

    habits.forEach((habit) => {
      if (!habit.active) return;
      activeHabitsForDay += 1;
      const status = dayRecords[habit.id] || 'none';
      if (status === 'done' || status === 'micro' || status === 'rest') {
        doneOrRestCount += 1;
      }
      if (status === 'micro') {
        microResilienceCount += 1;
      }
    });

    if (activeHabitsForDay >= 3 && doneOrRestCount === activeHabitsForDay) {
      allHabitsDoneDaysCount += 1;
    }
  });

  const focusHabitId = state.currentWeek.primaryHabitId || 'h-focus';
  let weeklyFocusDaysCount = 0;
  habitDates.forEach((date) => {
    const status = records[date]?.[focusHabitId];
    if (status === 'done' || status === 'micro') {
      weeklyFocusDaysCount += 1;
    }
  });

  let weeklyReviewsCount = state.pastWeeks.length;
  if (state.currentWeek.weeklyReview?.facts && state.currentWeek.weeklyReview.facts.trim().length > 0) {
    weeklyReviewsCount += 1;
  }

  const slipsRecoveredCount = (state.slipLogs || []).length;

  // Has anchor task done today (check both todayLog.tasks and archived pastLogs[todayDate])
  const todayDateKey = state.todayLog.date;
  const archivedTodayTasks = pastLogs[todayDateKey]?.tasks || [];
  const hasAnchorTaskDone =
    (state.todayLog.tasks || []).some((t) => t.isMainTask && t.completed) ||
    archivedTodayTasks.some((t) => t.isMainTask && t.completed)
      ? 1
      : 0;

  // Total anchor tasks & total daily tasks completed across history
  const todayCompletedIds = new Set<string>();
  let anchorTasksTotalDone = 0;
  let completedTasksTotalCount = 0;

  for (const t of [...(state.todayLog.tasks || []), ...archivedTodayTasks]) {
    if (t && t.completed && !todayCompletedIds.has(t.id)) {
      todayCompletedIds.add(t.id);
      completedTasksTotalCount += 1;
      if (t.isMainTask) {
        anchorTasksTotalDone += 1;
      }
    }
  }

  Object.entries(pastLogs).forEach(([logDate, log]) => {
    if (logDate === todayDateKey) return;
    if (log && Array.isArray(log.tasks)) {
      const completedInLog = log.tasks.filter((t) => t && t.completed);
      completedTasksTotalCount += completedInLog.length;
      if (completedInLog.some((t) => t.isMainTask)) {
        anchorTasksTotalDone += 1;
      }
    }
  });

  // Goals stats: count active goals that have been advanced (> 0%) for goals_starter_3
  const goals = state.goals || [];
  const activeGoalsCount = goals.filter((g) => g.active !== false && (g.progressPercent || 0) > 0).length;
  const totalGoalProgress = goals.reduce((acc, g) => acc + (g.progressPercent || 0), 0);
  const averageGoalsProgress = goals.length > 0 ? totalGoalProgress / goals.length : 0;
  const completedGoalsCount = goals.filter((g) => (g.progressPercent || 0) >= 100).length;

  // Evening reviews total
  let eveningReflectionsCount = state.todayLog.eveningReflection ? 1 : 0;
  Object.values(pastLogs).forEach((log) => {
    if (log?.eveningReflection) eveningReflectionsCount += 1;
  });

  // Mode chosen: only true after user explicitly selects/confirms Day Mode or Energy Level
  const modeChosen = (state.todayLog as any).modeConfirmed ? 1 : 0;

  // Systems tasks executed count
  const systemsCount = completedTasksTotalCount;

  return {
    currentGreenStreak,
    longestGreenStreak,
    totalGreenDays,
    highEnergyGreenStreak,
    maxActiveHabitStreak,
    longestHistoricHabitStreak,
    topHabitTitle,
    allHabitsDoneDaysCount,
    microResilienceCount,
    weeklyReviewsCount,
    slipsRecoveredCount,
    weeklyFocusDaysCount,
    completedHabitsTodayCount,
    modeChosen,
    hasAnchorTaskDone,
    totalCheckinsCount,
    activeGoalsCount,
    averageGoalsProgress,
    completedGoalsCount,
    eveningReflectionsCount,
    systemsCount,
    anchorTasksTotalDone,
  };
}

/**
 * Evaluates all badges against the current state and returns enriched badges,
 * computed stats, and any badges that are newly unlocked in this evaluation turn.
 */
export function evaluateMilestones(state: FranklinState): {
  badges: MilestoneBadge[];
  stats: MilestoneStats;
  newlyUnlocked: MilestoneBadge[];
} {
  const internalStats = computeMilestoneStats(state);
  const previouslyUnlocked = state.milestones?.unlockedBadgeIds || {};
  const newlyUnlocked: MilestoneBadge[] = [];

  const badges: MilestoneBadge[] = BADGE_DEFINITIONS.map((def) => {
    const currentValue = def.calculateValue(internalStats);
    const meetsCriteria = currentValue >= def.targetValue;
    const wasAlreadyUnlocked = Boolean(previouslyUnlocked[def.id]);

    const unlocked = meetsCriteria || wasAlreadyUnlocked;
    let unlockedAt = previouslyUnlocked[def.id];

    if (meetsCriteria && !wasAlreadyUnlocked) {
      unlockedAt = new Date().toISOString();
      const newBadge: MilestoneBadge = {
        id: def.id,
        title: def.title,
        titleRu: def.titleRu,
        description: def.description,
        descriptionRu: def.descriptionRu,
        category: def.category,
        tier: def.tier,
        iconName: def.iconName,
        targetValue: def.targetValue,
        currentValue,
        unit: def.unit,
        unitRu: def.unitRu,
        unlocked: true,
        unlockedAt,
        quote: def.quote,
        quoteRu: def.quoteRu,
      };
      newlyUnlocked.push(newBadge);
    }

    return {
      id: def.id,
      title: def.title,
      titleRu: def.titleRu,
      description: def.description,
      descriptionRu: def.descriptionRu,
      category: def.category,
      tier: def.tier,
      iconName: def.iconName,
      targetValue: def.targetValue,
      currentValue: Math.min(def.targetValue, currentValue),
      unit: def.unit,
      unitRu: def.unitRu,
      unlocked,
      unlockedAt,
      quote: def.quote,
      quoteRu: def.quoteRu,
    };
  });

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const overallProgress = badges.length > 0 ? Math.round((unlockedCount / badges.length) * 100) : 0;

  const stats: MilestoneStats = {
    currentGreenStreak: internalStats.currentGreenStreak,
    longestGreenStreak: internalStats.longestGreenStreak,
    totalGreenDays: internalStats.totalGreenDays,
    highEnergyGreenStreak: internalStats.highEnergyGreenStreak,
    maxActiveHabitStreak: internalStats.maxActiveHabitStreak,
    longestHistoricHabitStreak: internalStats.longestHistoricHabitStreak,
    topHabitTitle: internalStats.topHabitTitle,
    allHabitsDoneDaysCount: internalStats.allHabitsDoneDaysCount,
    microResilienceCount: internalStats.microResilienceCount,
    weeklyReviewsCount: internalStats.weeklyReviewsCount,
    slipsRecoveredCount: internalStats.slipsRecoveredCount,
    unlockedBadgesCount: unlockedCount,
    totalBadgesCount: badges.length,
    overallProgressPercent: overallProgress,
  };

  return {
    badges,
    stats,
    newlyUnlocked,
  };
}

/**
 * Triumphant Celebration Chime via Web Audio API
 */
export function playCelebrationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const startTime = ctx.currentTime + 0.05;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime + i * 0.1);

      gain.gain.setValueAtTime(0, startTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.25, startTime + i * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.1 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + i * 0.1);
      osc.stop(startTime + i * 0.1 + 0.5);
    });
  } catch (err) {
    // Audio autostart restricted or unsupported
  }
}
