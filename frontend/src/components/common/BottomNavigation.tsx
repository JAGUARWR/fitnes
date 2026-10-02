import React from 'react';
import { Dumbbell, Calendar, BookOpen, TrendingUp, User as UserIcon } from 'lucide-react';
import { triggerHaptic } from '../../utils/telegram';

export type NavTab = 'workout' | 'programs' | 'exercises' | 'analytics' | 'profile';

interface BottomNavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  hasActiveWorkout: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onTabChange,
  hasActiveWorkout,
}) => {
  const tabs = [
    {
      id: 'workout' as NavTab,
      label: 'Тренировка',
      icon: Dumbbell,
      badge: hasActiveWorkout,
    },
    {
      id: 'programs' as NavTab,
      label: 'Программы',
      icon: Calendar,
    },
    {
      id: 'exercises' as NavTab,
      label: 'База',
      icon: BookOpen,
    },
    {
      id: 'analytics' as NavTab,
      label: 'Прогресс',
      icon: TrendingUp,
    },
    {
      id: 'profile' as NavTab,
      label: 'Профиль',
      icon: UserIcon,
    },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50 bg-[#0F172A]/70 backdrop-blur-2xl border border-white/10 rounded-full py-2.5 px-5 flex justify-between items-center shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => {
              triggerHaptic('selection');
              onTabChange(tab.id);
            }}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-full transition-all duration-300 active:scale-90 ${
              isActive
                ? 'text-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Icon
                size={22}
                strokeWidth={isActive ? 2.4 : 1.8}
                className={`transition-all duration-300 ${
                  isActive ? 'drop-shadow-[0_0_12px_rgba(56,189,248,0.65)] scale-110' : ''
                }`}
              />

              {/* Active live workout pulsing badge */}
              {tab.badge && (
                <>
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-sky-400 rounded-full animate-ping" />
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-sky-400 rounded-full shadow-neon-cyan" />
                </>
              )}
            </div>

            <span
              className={`text-[10px] tracking-tight mt-0.5 font-medium transition-all ${
                isActive ? 'text-sky-400 font-semibold opacity-100' : 'opacity-70'
              }`}
            >
              {tab.label}
            </span>

            {/* Glowing active indicator dot */}
            {isActive && (
              <span className="absolute -bottom-1 w-1 h-1 bg-sky-400 rounded-full shadow-[0_0_6px_#38BDF8]" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
