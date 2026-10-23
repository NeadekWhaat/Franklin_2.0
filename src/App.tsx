import React, { useState } from 'react';
import { FranklinProvider, useFranklin } from './context/FranklinContext';
import { Navigation, ActiveTab } from './components/Navigation';
import { CommandCenter } from './components/CommandCenter';
import { HabitTrackerMatrix } from './components/HabitTrackerMatrix';
import { WeeklyBoardView } from './components/WeeklyBoardView';
import { NineLevelsView } from './components/NineLevelsView';
import { AntiDopamineView } from './components/AntiDopamineView';
import { SettingsView } from './components/SettingsView';
import { MilestonesView } from './components/MilestonesView';
import { BadgeUnlockModal } from './components/BadgeUnlockModal';
import { CausalChainModal } from './components/CausalChainModal';
import { EveningReflectionModal } from './components/EveningReflectionModal';
import { SlipRecoveryModal } from './components/SlipRecoveryModal';
import { DevTextEditorOverlay } from './components/DevTextEditorOverlay';

function MainApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('command-center');
  const [isCausalChainOpen, setIsCausalChainOpen] = useState(false);
  const [isEveningReflectionOpen, setIsEveningReflectionOpen] = useState(false);
  const [isSlipRecoveryOpen, setIsSlipRecoveryOpen] = useState(false);

  const { t, celebratingBadge, dismissCelebration, theme } = useFranklin();

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} min-h-screen w-full max-w-full overflow-x-clip bg-[#f8fafc] dark:bg-[#07080c] text-slate-800 dark:text-neutral-100 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900 dark:selection:bg-neutral-800 dark:selection:text-white antialiased transition-colors duration-200`}>
      {/* Top sticky navigation and day mode command bar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCausalChain={() => setIsCausalChainOpen(true)}
        onOpenSlipRecovery={() => setIsSlipRecoveryOpen(true)}
        onOpenEveningReflection={() => setIsEveningReflectionOpen(true)}
      />

      {/* Main viewport canvas */}
      <main className="flex-1 max-w-7xl w-full min-w-0 mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 lg:pb-12 overflow-x-clip">
        {activeTab === 'command-center' && (
          <CommandCenter
            onOpenCausalChain={() => setIsCausalChainOpen(true)}
            onOpenSlipRecovery={() => setIsSlipRecoveryOpen(true)}
            onOpenEveningReflection={() => setIsEveningReflectionOpen(true)}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'habit-matrix' && <HabitTrackerMatrix />}

        {activeTab === 'notebook' && (
          <WeeklyBoardView key="notebook-hub" initialSection="notebook" />
        )}

        {activeTab === 'weekly-board' && (
          <WeeklyBoardView key="board-hub" initialSection="franklin-chat" />
        )}

        {activeTab === 'milestones' && <MilestonesView />}

        {activeTab === 'nine-levels' && (
          <NineLevelsView
            onOpenCausalChain={() => setIsCausalChainOpen(true)}
            onOpenSlipRecovery={() => setIsSlipRecoveryOpen(true)}
            onOpenEveningReflection={() => setIsEveningReflectionOpen(true)}
          />
        )}

        {activeTab === 'anti-dopamine' && <AntiDopamineView />}

        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Modals */}
      <CausalChainModal
        isOpen={isCausalChainOpen}
        onClose={() => setIsCausalChainOpen(false)}
      />

      <EveningReflectionModal
        isOpen={isEveningReflectionOpen}
        onClose={() => setIsEveningReflectionOpen(false)}
      />

      <SlipRecoveryModal
        isOpen={isSlipRecoveryOpen}
        onClose={() => setIsSlipRecoveryOpen(false)}
      />

      {/* Triumphant Badge Unlock Celebration Modal */}
      <BadgeUnlockModal
        badge={celebratingBadge}
        onClose={dismissCelebration}
        onViewAllMilestones={() => setActiveTab('milestones')}
      />

      {/* Developer Visual Text Editor Overlay */}
      <DevTextEditorOverlay />

      {/* Quiet, editorial footer */}
      <footer className="border-t border-slate-200/80 dark:border-neutral-900 bg-white dark:bg-[#090b10] py-6 mb-16 lg:mb-0 text-xs text-slate-500 dark:text-neutral-500 text-center transition-colors">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-serif italic text-slate-700 dark:text-neutral-300 text-sm">
            {t('quoteText')}
          </p>
          <p className="text-[11px] font-mono text-slate-400 dark:text-neutral-600">
            {t('quoteSub')}
          </p>
        </div>
      </footer>
    </div>
  );
}

import { GoogleWorkspaceProvider } from './context/GoogleWorkspaceContext';

export default function App() {
  return (
    <FranklinProvider>
      <GoogleWorkspaceProvider>
        <MainApp />
      </GoogleWorkspaceProvider>
    </FranklinProvider>
  );
}
