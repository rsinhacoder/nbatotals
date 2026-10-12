import React from 'react';
import { Home, CalendarDays, Users, Zap, User, SlidersHorizontal } from 'lucide-react';

export type MobileTab = 'home' | 'games' | 'props' | 'scanner' | 'profile';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  gamesBadgeCount?: number;
  propsBadgeCount?: number;
  isQ1Active?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  gamesBadgeCount,
  propsBadgeCount,
  isQ1Active,
}) => {
  const navItems: { id: MobileTab; label: string; icon: React.ElementType; badge?: string; badgeColor?: string }[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
    },
    {
      id: 'games',
      label: 'Games',
      icon: CalendarDays,
      badge: gamesBadgeCount ? String(gamesBadgeCount) : undefined,
      badgeColor: 'bg-cyan-500 text-slate-950',
    },
    {
      id: 'props',
      label: 'Props',
      icon: Users,
      badge: propsBadgeCount ? String(propsBadgeCount) : undefined,
      badgeColor: 'bg-purple-500 text-white',
    },
    {
      id: 'scanner',
      label: 'Q1 Scanner',
      icon: Zap,
      badge: isQ1Active ? 'LIVE' : undefined,
      badgeColor: 'bg-emerald-400 text-slate-950 animate-pulse',
    },
    {
      id: 'profile',
      label: 'Settings',
      icon: SlidersHorizontal,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#070b14]/95 backdrop-blur-lg border-t border-slate-800/90 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 h-14 items-center px-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className="relative flex flex-col items-center justify-center h-full w-full py-1 text-center transition-all duration-200 active:scale-95 cursor-pointer group"
              aria-label={item.label}
            >
              {/* Active ambient glow pill */}
              {isActive && (
                <div className="absolute top-0 w-8 h-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-sm shadow-cyan-400/50"></div>
              )}

              {/* Icon Container with Badge */}
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive
                      ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {item.badge && (
                  <span
                    className={`absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[9px] font-black leading-none ${
                      item.badgeColor || 'bg-cyan-500 text-slate-950'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] tracking-tight mt-1 transition-colors ${
                  isActive ? 'font-bold text-white' : 'font-medium text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
