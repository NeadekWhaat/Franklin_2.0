import React, { useEffect, useState } from 'react';
import { useFranklin } from '../context/FranklinContext';
import { MilestoneBadge, BadgeTier } from '../types/milestone';
import {
  Trophy,
  Zap,
  Flame,
  ShieldCheck,
  Sparkles,
  Crown,
  CheckCircle2,
  Compass,
  Sun,
  Shield,
  Target,
  BookOpen,
  RotateCcw,
  Award,
  X,
  Share2,
  Check,
} from 'lucide-react';

interface BadgeUnlockModalProps {
  badge: MilestoneBadge | null;
  onClose: () => void;
  onViewAllMilestones?: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  Flame,
  ShieldCheck,
  Sparkles,
  Crown,
  CheckCircle2,
  Compass,
  Trophy,
  Sun,
  Shield,
  Target,
  BookOpen,
  RotateCcw,
  Award,
};

export const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({
  badge,
  onClose,
  onViewAllMilestones,
}) => {
  const { language, t } = useFranklin();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [badge]);

  if (!badge) return null;

  const IconComponent = ICON_MAP[badge.iconName] || Trophy;

  const isRu = language === 'ru';
  const title = isRu ? badge.titleRu : badge.title;
  const description = isRu ? badge.descriptionRu : badge.description;
  const quote = isRu ? badge.quoteRu : badge.quote;
  const unit = isRu ? badge.unitRu : badge.unit;

  const getTierStyles = (tier: BadgeTier) => {
    switch (tier) {
      case 'emerald':
        return {
          glow: 'from-emerald-500/30 via-emerald-600/20 to-teal-900/10',
          border: 'border-emerald-500/50',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          iconGlow: 'bg-gradient-to-tr from-emerald-500 to-teal-300 text-neutral-950 shadow-emerald-500/50',
          badgeName: isRu ? 'Изумрудный' : 'Emerald',
          accent: 'text-emerald-400',
        };
      case 'diamond':
        return {
          glow: 'from-cyan-500/30 via-blue-600/20 to-purple-900/10',
          border: 'border-cyan-500/50',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          iconGlow: 'bg-gradient-to-tr from-cyan-400 to-blue-300 text-neutral-950 shadow-cyan-500/50',
          badgeName: isRu ? 'Алмазный' : 'Diamond',
          accent: 'text-cyan-400',
        };
      case 'gold':
        return {
          glow: 'from-amber-500/30 via-yellow-600/20 to-orange-950/10',
          border: 'border-amber-500/50',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          iconGlow: 'bg-gradient-to-tr from-amber-400 to-yellow-200 text-neutral-950 shadow-amber-500/50',
          badgeName: isRu ? 'Золотой' : 'Gold',
          accent: 'text-amber-400',
        };
      case 'silver':
        return {
          glow: 'from-slate-300/20 via-neutral-400/15 to-neutral-800/10',
          border: 'border-slate-300/40',
          badgeBg: 'bg-slate-400/20 text-slate-200 border-slate-300/30',
          iconGlow: 'bg-gradient-to-tr from-slate-200 to-slate-400 text-neutral-950 shadow-slate-400/40',
          badgeName: isRu ? 'Серебряный' : 'Silver',
          accent: 'text-slate-300',
        };
      case 'bronze':
      default:
        return {
          glow: 'from-orange-600/25 via-amber-700/15 to-neutral-900/10',
          border: 'border-orange-500/40',
          badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
          iconGlow: 'bg-gradient-to-tr from-orange-400 to-amber-600 text-neutral-950 shadow-orange-500/40',
          badgeName: isRu ? 'Бронзовый' : 'Bronze',
          accent: 'text-orange-400',
        };
    }
  };

  const tier = getTierStyles(badge.tier);

  const handleShare = () => {
    const textToCopy = `🏆 Franklin 2.0 Milestone Unlocked: "${title}" (${tier.badgeName})!\n${description}\n"${quote}" — Benjamin Franklin`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background celebration particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-amber-500/15 via-emerald-500/10 to-transparent blur-3xl pointer-events-none" />
        {/* Floating confetti dots */}
        <div className="absolute top-1/4 left-1/3 w-3 h-3 rounded-full bg-amber-400/80 animate-ping duration-1000" />
        <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-emerald-400/80 animate-ping duration-700 delay-150" />
        <div className="absolute bottom-1/3 left-1/4 w-2.5 h-2.5 rounded-full bg-cyan-400/80 animate-pulse duration-1000 delay-300" />
        <div className="absolute bottom-1/4 right-1/3 w-3 h-3 rounded-full bg-purple-400/80 animate-ping duration-1000 delay-500" />
      </div>

      <div
        className={`relative w-full max-w-lg bg-[#0c0d14] border ${tier.border} rounded-2xl shadow-2xl p-6 sm:p-8 text-neutral-100 overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className={`absolute top-0 left-0 right-0 h-40 bg-gradient-to-b ${tier.glow} pointer-events-none`} />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 rounded-lg bg-neutral-900/60 hover:bg-neutral-800 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Ribbon */}
        <div className="relative text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/90 border border-neutral-700/60 text-xs font-medium tracking-wide uppercase text-neutral-300 mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin duration-3000" />
            {t('celebrationTitle')}
          </div>

          {/* Central Shiny Badge Icon with dynamic glow */}
          <div className="relative my-4 flex justify-center">
            <div className="relative">
              {/* Outer pulsing ring */}
              <div className={`absolute -inset-3 rounded-2xl bg-gradient-to-r ${tier.glow} blur-xl animate-pulse opacity-80`} />

              {/* The Medal / Badge Box */}
              <div
                className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ${tier.iconGlow} shadow-xl flex items-center justify-center border-2 border-white/20`}
              >
                <IconComponent className="w-12 h-12 sm:w-14 sm:h-14 stroke-[2.2]" />
              </div>

              {/* Tier Pill */}
              <div
                className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase border shadow-md ${tier.badgeBg}`}
              >
                {tier.badgeName}
              </div>
            </div>
          </div>

          {/* Badge Title */}
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-4">
            {title}
          </h2>

          {/* Badge Description */}
          <p className="text-neutral-300 text-sm sm:text-base mt-2 max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Stats Milestone Bar */}
        <div className="relative bg-neutral-900/80 border border-neutral-800/80 rounded-xl p-3.5 mb-5 text-xs text-neutral-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              {isRu ? 'Норматив выполнен:' : 'Requirement reached:'}{' '}
              <strong className="text-white font-mono text-sm">
                {badge.targetValue} {unit}
              </strong>
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold text-[11px]">
            100% {isRu ? 'Закрыто' : 'Complete'}
          </span>
        </div>

        {/* Benjamin Franklin Quote Box */}
        <div className="relative bg-[#11131c] border border-neutral-800 rounded-xl p-4 mb-6">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {t('celebrationFranklinQuote')}
          </div>
          <blockquote className="italic text-sm text-neutral-200 font-serif leading-relaxed">
            «{quote}»
          </blockquote>
          <div className="text-right text-[11px] text-neutral-400 mt-1.5 font-medium">
            — Benjamin Franklin
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Trophy className="w-4 h-4" />
            {t('celebrationClaimBtn')}
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-neutral-200 text-sm font-medium transition-colors"
            title={isRu ? 'Скопировать текст достижения' : 'Copy achievement text'}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">{isRu ? 'Скопировано!' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-neutral-400" />
                <span>{isRu ? 'Поделиться' : 'Share'}</span>
              </>
            )}
          </button>

          {onViewAllMilestones && (
            <button
              onClick={() => {
                onClose();
                onViewAllMilestones();
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 text-sm font-medium transition-colors"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>{t('viewAllBadges')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
