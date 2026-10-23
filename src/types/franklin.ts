/**
 * Franklin 2.0 Personal Operating System
 * Data structures representing the 9 Levels of Life Management
 */

export type DayMode = 'GREEN' | 'YELLOW' | 'RED';

export type LifeDirectionId =
  | 'health'
  | 'career'
  | 'learning'
  | 'finances'
  | 'confidence'
  | 'personal';

export interface LifeDirection {
  id: LifeDirectionId;
  name: string;
  nameRu: string;
  tagline: string;
  color: string;
}

// Level 1: Personality
export interface PersonalityProfile {
  name: string;
  role: string;
  strengths: string[];
  challenges: string[];
  energyRhythms: {
    idealBedtime: string;
    idealWakeup: string;
    peakHours: string;
    lowEnergyRecovery: string;
  };
}

// Level 2: Values
export interface ValueItem {
  id: string;
  title: string;
  titleRu: string;
  description: string;
  order: number;
}

// Level 3: Principles (Franklin Constitution)
export interface PrincipleItem {
  id: string;
  lawNumber: number;
  code: string; // e.g., ACTION, RESPONSIBILITY, COMMITMENTS, etc.
  name: string;
  summary: string;
  lawText: string;
  practicalRule: string;
}

// Level 4: Vision
export interface VisionHorizon {
  tenYear: Record<LifeDirectionId, string>;
  threeYear: Record<LifeDirectionId, string>;
}

// Level 5: Goals
export interface GoalItem {
  id: string;
  directionId: LifeDirectionId;
  horizon: '1-year' | 'quarterly' | 'monthly';
  title: string;
  metric?: string;
  whyItMatters: string;
  progressPercent: number;
  active: boolean;
}

// Level 6: Systems
export interface SystemProcess {
  id: string;
  directionId: LifeDirectionId;
  title: string;
  description: string;
  steps: string[];
  lowEnergyAlternative?: string;
}

// Level 7: Habits
export interface HabitItem {
  id: string;
  directionId: LifeDirectionId;
  title: string;
  tier: 'base' | 'weekly_focus' | 'experiment';
  linkedGoalId?: string;
  frequency: 'daily' | 'weekdays' | '3x_week' | 'weekly';
  anchorTrigger: string;
  microVersion: string; // e.g. "2 pushups or 3 min mobility"
  active: boolean;
}

// Level 8: Daily Tasks & Day Execution
export interface DailyTask {
  id: string;
  title: string;
  isMainTask: boolean; // The single anchor task of the day
  minModeRequired: DayMode; // Green = normal only, Yellow = keep in hard days, Red = keep in survival
  completed: boolean;
  linkedGoalId?: string;
  directionId: LifeDirectionId;
  estimatedMinutes?: number;
  reminderTime?: string; // HH:MM (e.g., "14:30")
  endTime?: string; // HH:MM (e.g., "15:00")
  isAllDay?: boolean; // True when task takes all day ("Весь день")
  reminderDate?: string; // YYYY-MM-DD
  reminderFired?: boolean;
  scheduledDate?: string; // YYYY-MM-DD (defaults to today)
  googleCalendarEventId?: string;
  googleTaskId?: string;
  completedAt?: string; // ISO timestamp when task was marked completed
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  dayMode: DayMode;
  energyLevel: 1 | 2 | 3 | 4 | 5;
  completedHabitIds: string[];
  tasks: DailyTask[];
  eveningReflection?: {
    successes: string;
    obstacles: string;
    lessonLearned: string;
    tomorrowPrep: string;
    completedAt: string;
  };
}

// Level 8.5: Weekly Focus & Plan ("Board of Directors")
export interface WeeklyPlan {
  id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  lifeEvent: string;
  primaryFocus: string;
  primaryHabitId: string;
  experiment: {
    hypothesis: string;
    method: string;
    result?: string;
    isSuccessful?: boolean;
  };
  whatToDrop: string[]; // Deliberate deprioritizations
  weeklyReview?: {
    facts: string;
    progress: string;
    obstacles: string;
    keyLesson: string;
    completedAt: string;
  };
}

// Level 9: Analysis & Slip Recovery
export interface SlipRecoveryEntry {
  id: string;
  timestamp: string;
  date: string;
  trigger: string;
  rootCause: 'fatigue' | 'novelty_seeking' | 'perfectionism' | 'over_planning' | 'unclear_first_step' | 'external';
  selectedMicroAction: string;
  recoveryRuleApplied: string;
  note?: string;
}

export type HabitDayStatus = 'done' | 'micro' | 'rest' | 'missed' | 'none';

export type NotebookSourceType = 'thought' | 'video' | 'lecture' | 'file' | 'gemini_import';

export interface NotebookExtractedActions {
  goals?: Array<{
    title: string;
    directionId: LifeDirectionId;
    horizon: '1-year' | 'quarterly' | 'monthly';
    whyItMatters: string;
    metric?: string;
    applied?: boolean;
  }>;
  habits?: Array<{
    title: string;
    directionId: LifeDirectionId;
    microVersion: string;
    anchorTrigger: string;
    applied?: boolean;
  }>;
  tasks?: Array<{
    title: string;
    directionId: LifeDirectionId;
    estimatedMinutes: number;
    reminderTime?: string;
    applied?: boolean;
  }>;
}

export interface NotebookItem {
  id: string;
  title: string;
  sourceType: NotebookSourceType;
  sourceUrl?: string;
  fileName?: string;
  content: string;
  aiSummary?: string;
  keyInsights?: string[];
  tags: string[];
  directionId: LifeDirectionId;
  extractedActions?: NotebookExtractedActions;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MentorChatAction {
  type: 'add_task' | 'add_goal' | 'add_habit' | 'add_note' | 'set_day_mode' | 'slip_logged' | 'mode_switched' | 'task_focused';
  label: string;
  payload?: any;
  applied?: boolean;
}

export interface MentorChatMessage {
  id: string;
  sender: 'franklin' | 'user';
  text: string;
  timestamp: string;
  actionCard?: {
    type: 'slip_logged' | 'mode_switched' | 'task_focused';
    label: string;
  };
  actions?: MentorChatAction[];
}

// Full State Container
export interface FranklinState {
  version: number;
  personality: PersonalityProfile;
  values: ValueItem[];
  principles: PrincipleItem[];
  vision: VisionHorizon;
  goals: GoalItem[];
  systems: SystemProcess[];
  habits: HabitItem[];
  currentWeek: WeeklyPlan;
  pastWeeks: WeeklyPlan[];
  todayLog: DailyLog;
  pastLogs: Record<string, DailyLog>; // key: YYYY-MM-DD
  habitWeeklyRecords: Record<string, Record<string, HabitDayStatus>>; // key: date YYYY-MM-DD -> habitId -> status
  slipLogs: SlipRecoveryEntry[];
  notebook?: NotebookItem[]; // Shared Knowledge Notebook (thoughts, lectures, videos, files, Gemini imports)
  milestones?: {
    unlockedBadgeIds: Record<string, string>; // badgeId -> ISO string
  };
  customTexts?: Record<string, string>; // originalText -> customOverrideText
  deletedTaskIds?: string[]; // Track intentionally deleted task IDs across devices
  completedTaskIds?: string[]; // Track completed task IDs (including gcal-/gtask- IDs) so they never resurrect on next day
  updatedAt?: string; // ISO timestamp of latest state modification
  mentorChat?: {
    messages: MentorChatMessage[]; // Capped at MAX 24 messages
    memorySummary: string; // Compact rolling summary of older archived messages (max ~800 chars)
    updatedAt: string;
  };
  settings: {
    cloudSyncEnabled: boolean;
    cloudSyncEndpoint?: string;
    lastSyncedAt?: string;
    language: 'ru' | 'en';
    theme?: 'light' | 'dark';
  };
}

