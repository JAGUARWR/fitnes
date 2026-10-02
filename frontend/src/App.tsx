import React, { useState, useEffect } from 'react';
import { User, WorkoutSession, WorkoutProgram } from './types';
import { authApi, workoutsApi, programsApi } from './services/api';
import { initTelegramApp } from './utils/telegram';

import { BottomNavigation, NavTab } from './components/common/BottomNavigation';
import { LiveWorkoutView } from './components/workout/LiveWorkoutView';
import { ProgramsView } from './components/programs/ProgramsView';
import { ExerciseCatalogView } from './components/exercises/ExerciseCatalogView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ProfileView } from './components/profile/ProfileView';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('workout');
  const [user, setUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [activeProgram, setActiveProgram] = useState<WorkoutProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [programsKey, setProgramsKey] = useState(0); // bump to force ProgramsView remount

  useEffect(() => {
    initTelegramApp();
    const loadData = async () => {
      try {
        const [me, session, programs] = await Promise.all([
          authApi.getMe().catch(() => null),
          workoutsApi.getActive().catch(() => null),
          programsApi.list().catch(() => []),
        ]);
        if (me) setUser(me);
        if (session) setActiveSession(session);
        const activeProg = programs.find((p) => p.is_active) || null;
        if (activeProg) setActiveProgram(activeProg);
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07090E] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[#0A84FF] animate-spin" />
        <span className="text-xs text-slate-500 tracking-widest uppercase">Gym Tracker</span>
      </div>
    );
  }

  const athleteName = user?.first_name || user?.username || 'Атлет';
  const weightKg = user?.weight_kg;

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col selection:bg-[#0A84FF]/30">
      {/* ── Compact Header ── */}
      <header className="sticky top-0 z-30 bg-[#07090E]/90 backdrop-blur-md border-b border-white/[0.06] px-4 pt-3 pb-2.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Left: date + name */}
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] text-slate-400 font-medium">
              {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <span className="text-[17px] font-semibold text-white tracking-tight leading-snug">
              {athleteName}
            </span>
          </div>

          {/* Right: weight pill + profile dot */}
          <div className="flex items-center gap-2">
            {weightKg && (
              <button
                onClick={() => setCurrentTab('profile')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.07] border border-white/[0.08] backdrop-blur-md active:scale-95 transition-transform"
              >
                <span className="text-[13px] font-semibold text-white tabular-nums">
                  {weightKg % 1 === 0 ? `${weightKg}.0` : weightKg} кг
                </span>
              </button>
            )}
            <button
              onClick={() => setCurrentTab('profile')}
              className="w-8 h-8 rounded-full bg-[#0A84FF]/20 border border-[#0A84FF]/30 flex items-center justify-center active:scale-95 transition-transform"
            >
              <span className="text-[13px] font-bold text-[#0A84FF] leading-none select-none">
                {athleteName.charAt(0).toUpperCase()}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 w-full max-w-md mx-auto">
        {currentTab === 'workout' && (
          <LiveWorkoutView
            activeSession={activeSession}
            activeProgram={activeProgram}
            onSessionUpdated={setActiveSession}
            onNavigateToPrograms={() => setCurrentTab('programs')}
            onProgramImported={(program) => {
              setActiveProgram(program);
              setProgramsKey((k) => k + 1); // force ProgramsView to remount & reload
            }}
          />
        )}
        {currentTab === 'programs' && (
          <ProgramsView
            key={programsKey}
            user={user}
            activeProgram={activeProgram}
            onProgramActivated={setActiveProgram}
            onNavigateToWorkout={() => setCurrentTab('workout')}
          />
        )}
        {currentTab === 'exercises' && <ExerciseCatalogView />}
        {currentTab === 'analytics' && <AnalyticsView />}
        {currentTab === 'profile' && (
          <ProfileView user={user} onUserUpdated={setUser} />
        )}
      </main>

      <BottomNavigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        hasActiveWorkout={Boolean(activeSession && !activeSession.is_completed)}
      />
    </div>
  );
};

export default App;
