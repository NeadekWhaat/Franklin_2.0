/**
 * Milestone and Virtual Badges System for Franklin 2.0
 */

export type BadgeCategory = 'green_mode' | 'habit_streak' | 'resilience' | 'mastery';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'emerald' | 'diamond';

export interface MilestoneBadge {
  id: string;
  title: string;
  titleRu: string;
  description: string;
  descriptionRu: string;
  category: BadgeCategory;
  tier: BadgeTier;
  iconName: string; // Lucide icon key
  targetValue: number;
  currentValue: number;
  unit: string;
  unitRu: string;
  unlocked: boolean;
  unlockedAt?: string;
  quote: string;
  quoteRu: string;
  secret?: boolean;
}

export interface MilestoneStats {
  currentGreenStreak: number;
  longestGreenStreak: number;
  totalGreenDays: number;
  highEnergyGreenStreak: number;
  maxActiveHabitStreak: number;
  longestHistoricHabitStreak: number;
  topHabitTitle?: string;
  allHabitsDoneDaysCount: number;
  microResilienceCount: number;
  weeklyReviewsCount: number;
  slipsRecoveredCount: number;
  unlockedBadgesCount: number;
  totalBadgesCount: number;
  overallProgressPercent: number;
}
