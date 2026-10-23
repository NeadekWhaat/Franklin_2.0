import React, { useState, useEffect, useRef } from 'react';
import { useFranklin } from '../context/FranklinContext';
import { DayMode } from '../types/franklin';
import {
  Compass,
  LayoutDashboard,
  Layers,
  ShieldAlert,
  Settings,
  Moon,
  Sun,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Feather,
  Trophy,
  Edit3,
  Type,
  SlidersHorizontal,
  Globe,
  Check,
  BookOpen,
} from 'lucide-react';
import { useGoogleWorkspace } from '../context/GoogleWorkspaceContext';

export type ActiveTab =
  | 'command-center'
  | 'habit-matrix'
  | 'notebook'
  | 'weekly-board'
  | 'milestones'
  | 'nine-levels'
  | 'anti-dopamine'
  | 'settings';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenCausalChain: () => void;
  onOpenSlipRecovery: () => void;
  onOpenEveningReflection: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenCausalChain,
  onOpenSlipRecovery,
  onOpenEveningReflection,
}) => {
  const {
    state,
    setDayMode,
    language,
    setLanguage,
    t,
    milestoneStats,
    theme,
    toggleTheme,
    isEditMode,
    toggleEditMode,
    customTexts,
    fontScale,
    setFontScale,
  } = useFranklin();
  const { isConnected: isGoogleConnected, user: googleUser, connectGoogle } = useGoogleWorkspace();
  const currentMode = state.todayLog.dayMode;
  const isRu = language === 'ru';
  const isLight = theme === 'light';

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activePopover, setActivePopover] = useState<'rituals' | 'quick-settings' | 'mode' | null>(null);

  const headerRef = useRef<HTMLElement | null>(null);

  // Close popovers when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const MODES: {
    mode: DayMode;
    label: string;
    shortLabel: string;
    dotColor: string;
    badgeBg: string;
    badgeText: string;
    desc: string;
  }[] = [
    {
      mode: 'GREEN',
      label: t('greenModeShort'),
      shortLabel: isRu ? 'Зелёный' : 'Green',
      dotColor: 'bg-emerald-500',
      badgeBg: isLight
        ? 'bg-emerald-50 border-emerald-200/90 hover:bg-emerald-100/80'
        : 'bg-emerald-950/40 border-emerald-800/60 hover:bg-emerald-950/70',
      badgeText: isLight ? 'text-emerald-800' : 'text-emerald-300',
      desc: isRu ? 'Обычный продуктивный ритм' : 'Normal productive day',
    },
    {
      mode: 'YELLOW',
      label: t('yellowModeShort'),
      shortLabel: isRu ? 'Жёлтый' : 'Yellow',
      dotColor: 'bg-amber-500',
      badgeBg: isLight
        ? 'bg-amber-50 border-amber-200/90 hover:bg-amber-100/80'
        : 'bg-amber-950/40 border-amber-800/60 hover:bg-amber-950/70',
      badgeText: isLight ? 'text-amber-800' : 'text-amber-300',
      desc: isRu ? 'Усталость или стресс · Срез второстепенного' : 'Fatigue / high load · Cut secondary',
    },
    {
      mode: 'RED',
      label: t('redModeShort'),
      shortLabel: isRu ? 'Красный' : 'Red',
      dotColor: 'bg-rose-500',
      badgeBg: isLight
        ? 'bg-rose-50 border-rose-200/90 hover:bg-rose-100/80'
        : 'bg-rose-950/40 border-rose-800/60 hover:bg-rose-950/70',
      badgeText: isLight ? 'text-rose-800' : 'text-rose-300',
      desc: isRu ? 'Выживание · Критический минимум без вины' : 'Survival mode · Minimum without guilt',
    },
  ];

  const currentModeObj = MODES.find((m) => m.mode === currentMode) || MODES[0];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    setActivePopover(null);
  };

  const NAV_ITEMS: {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    badge?: React.ReactNode;
  }[] = [
    {
      id: 'command-center',
      label: isRu ? 'Пульт' : 'Command',
      icon: <LayoutDashboard size={12} className="shrink-0 hidden xl:block" />,
    },
    {
      id: 'habit-matrix',
      label: isRu ? 'Матрица' : 'Habits',
      icon: <Layers size={12} className="shrink-0 hidden xl:block" />,
    },
    {
      id: 'notebook',
      label: isRu ? 'Блокнот' : 'Notebook',
      icon: <BookOpen size={12} className="text-amber-500 shrink-0 hidden xl:block" />,
      badge: (
        <span className="hidden 2xl:inline text-[10px] font-mono tabular-nums opacity-75">
          {(state.notebook || []).length}
        </span>
      ),
    },
    {
      id: 'weekly-board',
      label: isRu ? 'Франклин' : 'Franklin',
      icon: <Feather size={12} className="text-amber-500 shrink-0 hidden xl:block" />,
    },
    {
      id: 'milestones',
      label: isRu ? 'Значки' : 'Badges',
      icon: <Trophy size={12} className="text-amber-500 shrink-0 hidden xl:block" />,
      badge: (
        <span className="hidden 2xl:inline text-[10px] font-mono tabular-nums opacity-75">
          {milestoneStats.unlockedBadgesCount}/{milestoneStats.totalBadgesCount}
        </span>
      ),
    },
    {
      id: 'nine-levels',
      label: isRu ? '9 уровней' : '9 Levels',
      icon: <Compass size={12} className="shrink-0 hidden xl:block" />,
    },
    {
      id: 'anti-dopamine',
      label: isRu ? 'Дофамин' : 'Dopamine',
      icon: <ShieldAlert size={12} className="shrink-0 hidden xl:block" />,
    },
    {
      id: 'settings',
      label: isRu ? 'Настройки' : 'Settings',
      icon: <Settings size={12} className="shrink-0 hidden xl:block" />,
    },
  ];

  return (
    <>
      <header
        ref={headerRef}
        className={`sticky top-0 z-40 w-full max-w-full backdrop-blur-md border-b transition-colors duration-200 ${
          isLight
            ? 'bg-white/95 border-slate-200/90 text-slate-800 shadow-2xs'
            : 'bg-[#090b10]/95 border-neutral-800/90 text-neutral-100 shadow-xs'
        }`}
      >
        {/* Single Modern Command Bar Row */}
        <div className="max-w-7xl w-full mx-auto px-[10px] sm:px-[16px] lg:px-[20px] h-[54px] flex items-center justify-between gap-[6px] sm:gap-[8px] xl:gap-[12px]">
          {/* ZONE 1: Brand Identity */}
          <button
            type="button"
            onClick={() => handleSelectTab('command-center')}
            className="flex items-center gap-[8px] text-left group shrink-0 min-w-0"
            title={`${t('appName')} — ${t('appSubtitle')}`}
          >
            <div className="relative w-[32px] h-[32px] rounded-xl bg-slate-900 dark:bg-[#131824] border border-slate-700/80 dark:border-cyan-500/30 flex items-center justify-center shadow-2xs group-hover:border-amber-400/70 transition-colors shrink-0 overflow-hidden">
              <svg
                viewBox="0 0 36 36"
                className="w-[20px] h-[20px] shrink-0"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="18"
                  cy="18"
                  r="14.5"
                  stroke="url(#franklinRingGrad)"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                <path
                  d="M18 6.5L28 25.5H8L18 6.5Z"
                  stroke="url(#franklinPyramidGrad)"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                  fill="rgba(34, 211, 238, 0.08)"
                />
                <line x1="13.5" y1="16" x2="22.5" y2="16" stroke="#22d3ee" strokeWidth="1.2" strokeOpacity="0.65" />
                <line x1="10.8" y1="21" x2="25.2" y2="21" stroke="#22d3ee" strokeWidth="1.2" strokeOpacity="0.45" />
                <path
                  d="M19.2 10.5L14.8 18.2H18.4L16.8 25L21.6 16.8H18L19.2 10.5Z"
                  fill="#fbbf24"
                />
                <defs>
                  <linearGradient id="franklinRingGrad" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#22d3ee" />
                    <stop offset="1" stopColor="#fbbf24" />
                  </linearGradient>
                  <linearGradient id="franklinPyramidGrad" x1="18" y1="6.5" x2="18" y2="25.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#fbbf24" />
                    <stop offset="1" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <span
              className={`font-extrabold tracking-tight text-[13px] xl:text-[14px] font-mono whitespace-nowrap hidden min-[360px]:inline lg:hidden xl:inline ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {t('appName')}
            </span>
          </button>

          {/* ZONE 2: Center Segmented Navigation Tabs (Desktop) */}
          <nav
            className={`hidden lg:flex items-center gap-[2px] p-[3px] rounded-xl border min-w-0 max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
              isLight
                ? 'bg-slate-100/90 border-slate-200/70'
                : 'bg-[#121621] border-neutral-800/80'
            }`}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center gap-[5px] px-[7px] xl:px-[9px] py-[5px] text-[12px] leading-none font-medium rounded-lg whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? isLight
                        ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                        : 'bg-neutral-800 text-white font-semibold shadow-2xs'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge}
                </button>
              );
            })}
          </nav>

          {/* ZONE 3: Right Compact Controls (Day Mode, Rituals Dropdown, Theme, Quick Settings Dropdown) */}
          <div className="flex items-center gap-[5px] sm:gap-[6px] shrink-0 relative z-10">
            {/* Compact Day Mode Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActivePopover((p) => (p === 'mode' ? null : 'mode'))}
                className={`flex items-center gap-[5px] px-[8px] sm:px-[10px] py-[6px] rounded-xl border text-[11px] sm:text-[12px] leading-none font-semibold transition-colors whitespace-nowrap shrink-0 ${currentModeObj.badgeBg} ${currentModeObj.badgeText}`}
                title={isRu ? 'Сменить режим дня' : 'Switch Day Mode'}
              >
                <span className={`w-[8px] h-[8px] rounded-full shrink-0 ${currentModeObj.dotColor}`} />
                <span className="2xl:hidden">{currentModeObj.shortLabel}</span>
                <span className="hidden 2xl:inline">{currentModeObj.label}</span>
                <ChevronDown
                  size={12}
                  className={`opacity-70 transition-transform duration-150 shrink-0 ${
                    activePopover === 'mode' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {activePopover === 'mode' && (
                <div
                  className={`fixed left-3 right-3 top-15 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-64 rounded-2xl border p-2 shadow-xl z-50 animate-fade-in ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-800'
                      : 'bg-[#10141f] border-neutral-800 text-neutral-100'
                  }`}
                >
                  <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    {t('dayMode')}
                  </div>
                  <div className="space-y-1">
                    {MODES.map((m) => {
                      const isSelected = currentMode === m.mode;
                      return (
                        <button
                          key={m.mode}
                          type="button"
                          onClick={() => {
                            setDayMode(m.mode);
                            setActivePopover(null);
                          }}
                          className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-start gap-2.5 ${
                            isSelected
                              ? isLight
                                ? 'bg-slate-100 text-slate-900'
                                : 'bg-neutral-800/90 text-white'
                              : isLight
                              ? 'hover:bg-slate-50 text-slate-700'
                              : 'hover:bg-neutral-800/40 text-neutral-300'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${m.dotColor}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold flex items-center justify-between">
                              <span>{m.label}</span>
                              {isSelected && <Check size={13} className="text-emerald-500 shrink-0" />}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 leading-snug">
                              {m.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Unified "Rituals" Menu Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActivePopover((p) => (p === 'rituals' ? null : 'rituals'))}
                className={`flex items-center gap-[5px] px-[8px] sm:px-[10px] py-[6px] rounded-xl border text-[11px] sm:text-[12px] leading-none font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  activePopover === 'rituals'
                    ? isLight
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-neutral-900 border-white'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200/80 border-slate-200/80 text-slate-700'
                    : 'bg-[#131722] hover:bg-[#1a2030] border-neutral-800 text-neutral-200'
                }`}
                title={isRu ? 'Быстрые ритуалы Франклина' : 'Franklin Quick Rituals'}
              >
                <Sparkles size={13} className="text-amber-500 shrink-0" />
                <span className="hidden sm:inline lg:hidden xl:inline">{isRu ? 'Ритуалы' : 'Rituals'}</span>
                <ChevronDown
                  size={12}
                  className={`opacity-70 transition-transform duration-150 shrink-0 ${
                    activePopover === 'rituals' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {activePopover === 'rituals' && (
                <div
                  className={`fixed left-3 right-3 top-15 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72 rounded-2xl border p-2 shadow-xl z-50 animate-fade-in ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-800'
                      : 'bg-[#10141f] border-neutral-800 text-neutral-100'
                  }`}
                >
                  <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    {isRu ? 'Быстрые ритуалы Франклина' : 'Franklin Quick Rituals'}
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActivePopover(null);
                        onOpenCausalChain();
                      }}
                      className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-start gap-3 ${
                        isLight ? 'hover:bg-slate-100' : 'hover:bg-neutral-800/60'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Compass size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold">{t('causalChainBtn')}</div>
                        <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 leading-snug">
                          {isRu
                            ? 'Связь сегодняшних задач с главной целью и миссией'
                            : 'Connect daily tasks to your core mission'}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActivePopover(null);
                        onOpenSlipRecovery();
                      }}
                      className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-start gap-3 ${
                        isLight ? 'hover:bg-emerald-50/80' : 'hover:bg-emerald-950/30'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          {t('frictionReducerBtn')}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 leading-snug">
                          {isRu
                            ? 'Быстрый возврат в ритм после паузы без чувства вины'
                            : 'Zero-guilt recovery protocol after a slip'}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActivePopover(null);
                        onOpenEveningReflection();
                      }}
                      className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-start gap-3 ${
                        isLight ? 'hover:bg-amber-50/80' : 'hover:bg-amber-950/30'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Moon size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-amber-700 dark:text-amber-300">
                          {t('eveningReviewBtn')}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 leading-snug">
                          {isRu
                            ? 'Итоги дня по методу Франклина и фокус на завтра'
                            : 'Evening reflection and tomorrow preparation'}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-[7px] rounded-xl border transition-colors shrink-0 ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200/80 border-slate-200/80 text-slate-700'
                  : 'bg-[#131722] hover:bg-[#1a2030] border-neutral-800 text-neutral-300'
              }`}
              title={
                theme === 'dark'
                  ? isRu
                    ? 'Включить светлую тему'
                    : 'Switch to Light theme'
                  : isRu
                  ? 'Включить тёмную тему'
                  : 'Switch to Dark theme'
              }
            >
              {theme === 'dark' ? (
                <Sun size={14} className="text-amber-400" />
              ) : (
                <Moon size={14} className="text-slate-700" />
              )}
            </button>

            {/* Unified Quick Settings Popover (Font Scale, Language, Text Editor, Google Status) */}
            <div className="relative">
              <button
                type="button"
                data-dev-editor-ignore="true"
                onClick={() => setActivePopover((p) => (p === 'quick-settings' ? null : 'quick-settings'))}
                className={`relative p-[7px] rounded-xl border transition-colors shrink-0 flex items-center gap-1 ${
                  activePopover === 'quick-settings' || isEditMode
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-2xs'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200/80 border-slate-200/80 text-slate-700'
                    : 'bg-[#131722] hover:bg-[#1a2030] border-neutral-800 text-neutral-300'
                }`}
                title={isRu ? 'Быстрые настройки интерфейса' : 'Quick Interface Settings'}
              >
                <SlidersHorizontal size={14} />
                {isGoogleConnected && !isEditMode && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
              </button>

              {activePopover === 'quick-settings' && (
                <div
                  data-dev-editor-ignore="true"
                  className={`fixed left-3 right-3 top-15 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72 rounded-2xl border p-3.5 shadow-xl z-50 space-y-3.5 animate-fade-in ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-800'
                      : 'bg-[#10141f] border-neutral-800 text-neutral-100'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-neutral-400">
                      {isRu ? 'Быстрые настройки' : 'Quick Settings'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectTab('settings')}
                      className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                      {isRu ? 'Все настройки →' : 'All settings →'}
                    </button>
                  </div>

                  {/* 1. Google Account Status */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">
                      Google Workspace
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActivePopover(null);
                        if (!isGoogleConnected) connectGoogle();
                        else handleSelectTab('settings');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                        isGoogleConnected
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300'
                          : isLight
                          ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        <span className="truncate">
                          {isGoogleConnected
                            ? googleUser?.email || (isRu ? 'Подключено' : 'Connected')
                            : isRu
                            ? 'Подключить Google'
                            : 'Connect Google'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono shrink-0 ml-1">
                        {isGoogleConnected ? '✓' : '→'}
                      </span>
                    </button>
                  </div>

                  {/* 2. Font Scale Selector */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1.5">
                        <Type size={12} className="text-cyan-500" />
                        {isRu ? 'Размер текста' : 'Font Scale'}
                      </span>
                      <span className="font-mono text-[10px]">
                        {fontScale === 'standard' ? '100%' : fontScale === 'comfortable' ? '110%' : '125%'}
                      </span>
                    </div>
                    <div
                      className={`grid grid-cols-3 gap-1 p-1 rounded-xl border ${
                        isLight ? 'bg-slate-100 border-slate-200/70' : 'bg-neutral-900 border-neutral-800'
                      }`}
                    >
                      {(['standard', 'comfortable', 'large'] as const).map((sc) => (
                        <button
                          key={sc}
                          type="button"
                          onClick={() => setFontScale(sc)}
                          className={`py-1 rounded-lg text-[11px] font-mono font-semibold transition-all ${
                            fontScale === sc
                              ? isLight
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'bg-neutral-800 text-white shadow-2xs'
                              : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {sc === 'standard' ? '100%' : sc === 'comfortable' ? '110%' : '125%'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Language Selector */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                      <Globe size={12} className="text-emerald-500" />
                      {isRu ? 'Язык интерфейса' : 'Language'}
                    </span>
                    <div
                      className={`inline-flex p-0.5 rounded-lg border ${
                        isLight ? 'bg-slate-100 border-slate-200/80' : 'bg-neutral-900 border-neutral-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setLanguage('ru')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                          language === 'ru'
                            ? isLight
                              ? 'bg-white text-slate-900 font-bold shadow-2xs'
                              : 'bg-neutral-800 text-white font-bold shadow-2xs'
                            : 'text-slate-500 dark:text-neutral-400'
                        }`}
                      >
                        RU
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage('en')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                          language === 'en'
                            ? isLight
                              ? 'bg-white text-slate-900 font-bold shadow-2xs'
                              : 'bg-neutral-800 text-white font-bold shadow-2xs'
                            : 'text-slate-500 dark:text-neutral-400'
                        }`}
                      >
                        EN
                      </button>
                    </div>
                  </div>

                  {/* 4. Developer Visual Text Editor Toggle */}
                  <div className="pt-1 border-t border-slate-100 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => {
                        toggleEditMode();
                        setActivePopover(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        isEditMode
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : isLight
                          ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Edit3 size={13} className={isEditMode ? 'text-slate-950' : 'text-amber-500'} />
                        <span>
                          {isEditMode
                            ? isRu
                              ? 'Редактор текста: ВКЛ'
                              : 'Text Editor: ON'
                            : isRu
                            ? 'Редактор любого текста'
                            : 'Visual Text Editor'}
                        </span>
                      </span>
                      {Object.keys(customTexts).length > 0 && !isEditMode && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-mono">
                          {Object.keys(customTexts).length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 w-full max-w-full overflow-x-clip bg-white/95 dark:bg-[#090b10]/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-neutral-800/90 px-1.5 py-1.5 safe-area-pb shadow-2xl transition-colors">
        <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto min-w-0">
          <button
            onClick={() => handleSelectTab('command-center')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all min-h-[48px] min-w-0 ${
              activeTab === 'command-center'
                ? 'text-slate-900 dark:text-white font-bold bg-slate-100 dark:bg-[#141824]'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            <LayoutDashboard size={17} className="shrink-0" />
            <span className="text-[10px] mt-1 truncate max-w-full px-0.5">{t('mobileNavCommand')}</span>
          </button>

          <button
            onClick={() => handleSelectTab('habit-matrix')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all min-h-[48px] min-w-0 ${
              activeTab === 'habit-matrix'
                ? 'text-slate-900 dark:text-white font-bold bg-slate-100 dark:bg-[#141824]'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            <Layers size={17} className="shrink-0" />
            <span className="text-[10px] mt-1 truncate max-w-full px-0.5">{t('mobileNavHabits')}</span>
          </button>

          <button
            onClick={() => handleSelectTab('notebook')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all min-h-[48px] min-w-0 relative ${
              activeTab === 'notebook'
                ? 'text-slate-900 dark:text-white font-bold bg-slate-100 dark:bg-[#141824]'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            <BookOpen size={17} className="text-amber-500 shrink-0" />
            <span className="text-[10px] mt-1 truncate max-w-full px-0.5">
              {isRu ? 'Блокнот' : 'Notebook'}
            </span>
          </button>

          <button
            onClick={() => handleSelectTab('weekly-board')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all min-h-[48px] min-w-0 relative ${
              activeTab === 'weekly-board'
                ? 'text-slate-900 dark:text-white font-bold bg-slate-100 dark:bg-[#141824]'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            <Feather size={17} className="text-amber-500 shrink-0" />
            <span className="text-[10px] mt-1 truncate max-w-full px-0.5">
              {isRu ? 'Франклин' : 'Franklin'}
            </span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 transition-all min-h-[48px] min-w-0"
          >
            <Menu size={17} className="shrink-0" />
            <span className="text-[10px] mt-1 truncate max-w-full px-0.5">{t('mobileNavMore')}</span>
          </button>
        </div>
      </nav>

      {/* MOBILE DRAWER MODAL */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative bg-white dark:bg-[#0e1118] border-t border-slate-200 dark:border-neutral-800 rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto z-10 shadow-2xl space-y-5 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white uppercase font-mono">
                  {t('appName')}
                </span>
                <span className="text-xs text-slate-500 dark:text-neutral-400">· {t('allViewsTitle')}</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile Font Size Controls */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-500">
                <span>{isRu ? 'Размер шрифта для чтения' : 'Reading Font Size'}</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">
                  {fontScale === 'standard' ? '100%' : fontScale === 'comfortable' ? '110%' : '125%'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setFontScale('standard')}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold text-center border transition-all ${
                    fontScale === 'standard'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-neutral-900 border-slate-900'
                      : 'bg-slate-50 dark:bg-[#141824] border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300'
                  }`}
                >
                  Обычный (100%)
                </button>
                <button
                  type="button"
                  onClick={() => setFontScale('comfortable')}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold text-center border transition-all ${
                    fontScale === 'comfortable'
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-[#141824] border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300'
                  }`}
                >
                  Комфортный (110%)
                </button>
                <button
                  type="button"
                  onClick={() => setFontScale('large')}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold text-center border transition-all ${
                    fontScale === 'large'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-[#141824] border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300'
                  }`}
                >
                  Крупный (125%)
                </button>
              </div>
            </div>

            {/* Quick Tools */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                {t('quickToolsTitle')}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenCausalChain();
                  }}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 flex flex-col items-center gap-1.5 text-center"
                >
                  <Compass size={16} className="text-slate-600 dark:text-neutral-300" />
                  <span className="text-[11px] font-medium text-slate-800 dark:text-neutral-200">{t('causalChainBtn')}</span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenSlipRecovery();
                  }}
                  className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex flex-col items-center gap-1.5 text-center"
                >
                  <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">{t('frictionReducerBtn')}</span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenEveningReflection();
                  }}
                  className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex flex-col items-center gap-1.5 text-center"
                >
                  <Moon size={16} className="text-amber-600 dark:text-amber-400" />
                  <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300">{t('eveningReviewBtn')}</span>
                </button>
              </div>
            </div>

            {/* Core Views */}
            <div className="space-y-1.5">
              <button
                onClick={() => handleSelectTab('notebook')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'notebook'
                    ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-700/50'
                    : 'bg-slate-50 dark:bg-[#141824] text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen size={16} className="text-amber-500" />
                  <span>{isRu ? 'Блокнот знаний & Gemini' : 'Knowledge Notebook & Gemini'}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                  {(state.notebook || []).length}
                </span>
              </button>

              <button
                onClick={() => handleSelectTab('weekly-board')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'weekly-board'
                    ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-700/50'
                    : 'bg-slate-50 dark:bg-[#141824] text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Feather size={16} className="text-amber-500" />
                  <span>{isRu ? 'Чат с Франклином и Совет директоров' : 'Franklin Chat & Board'}</span>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </button>

              <button
                onClick={() => handleSelectTab('milestones')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'milestones'
                    ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-700/50'
                    : 'bg-slate-50 dark:bg-[#141824] text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Trophy size={16} className="text-amber-500" />
                  <span>{t('milestonesTab')}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                  {milestoneStats.unlockedBadgesCount}/{milestoneStats.totalBadgesCount}
                </span>
              </button>

              <button
                onClick={() => handleSelectTab('nine-levels')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'nine-levels'
                    ? 'bg-slate-900 text-white dark:bg-neutral-800 font-semibold'
                    : 'bg-slate-50 dark:bg-[#141824] text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers size={16} />
                  <span>{t('nineLevels')}</span>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </button>

              <button
                onClick={() => handleSelectTab('anti-dopamine')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'anti-dopamine'
                    ? 'bg-slate-900 text-white dark:bg-neutral-800 font-semibold'
                    : 'bg-slate-50 dark:bg-[#141824] text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert size={16} />
                  <span>{t('antiDopamine')}</span>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </button>

              <button
                onClick={() => handleSelectTab('settings')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-slate-900 text-white dark:bg-neutral-800 font-semibold'
                    : 'bg-slate-50 dark:bg-[#141824] text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings size={16} />
                  <span>{t('settings')}</span>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
