import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Clock, ChevronDown, Check } from 'lucide-react';
import { useTheme, type ThemePreference } from '../context/ThemeContext';

export const ThemeSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { themePreference, resolvedTheme, setThemePreference, isDaytime, currentHour } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 === 0 ? 12 : hour % 12;
    return `${h} ${period}`;
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#141b2a] dark:hover:bg-[#1a2336] text-slate-700 dark:text-zinc-200 border border-slate-300 dark:border-[#222c42] font-medium transition-colors cursor-pointer text-xs shadow-2xs"
        title="Toggle Theme (Auto / Light / Dark)"
      >
        {themePreference === 'auto' ? (
          <>
            <div className="relative flex items-center">
              <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-amber-400" />
            </div>
            <span className="font-semibold hidden sm:inline">
              Auto ({isDaytime ? 'Day ☀️' : 'Night 🌙'})
            </span>
          </>
        ) : themePreference === 'light' ? (
          <>
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-semibold hidden sm:inline">Light</span>
          </>
        ) : (
          <>
            <Moon className="h-3.5 w-3.5 text-blue-400" />
            <span className="font-semibold hidden sm:inline">Dark</span>
          </>
        )}
        <ChevronDown className="h-3 w-3 text-slate-400 dark:text-zinc-400 hidden sm:inline" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-1.5 w-64 rounded-xl shadow-xl bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#222c42] p-1.5 z-50 animate-fade-in text-xs space-y-1">
          <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider border-b border-slate-100 dark:border-[#1c2438] mb-1 flex items-center justify-between">
            <span>Theme Preference</span>
            <span className="font-mono">Local: {formatHour(currentHour)}</span>
          </div>

          {/* Option 1: Auto (Time of Day) */}
          <button
            type="button"
            onClick={() => {
              setThemePreference('auto');
              setIsOpen(false);
            }}
            className={`w-full text-left px-2.5 py-2 rounded-lg cursor-pointer transition-colors flex items-start gap-2.5 ${
              themePreference === 'auto'
                ? 'bg-blue-50 dark:bg-[#1a2338] text-blue-700 dark:text-amber-300 font-semibold'
                : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#141b2a]'
            }`}
          >
            <Clock className="h-4 w-4 text-blue-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold">Auto (Time of Day)</span>
                {themePreference === 'auto' && (
                  <Check className="h-3.5 w-3.5 text-blue-600 dark:text-amber-400 shrink-0" />
                )}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-tight">
                7 AM–7 PM Light ☀️ • 7 PM–7 AM Dark 🌙
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                • Current status: {isDaytime ? 'Daytime (Light)' : 'Night (Dark)'}
              </div>
            </div>
          </button>

          {/* Option 2: Light Mode */}
          <button
            type="button"
            onClick={() => {
              setThemePreference('light');
              setIsOpen(false);
            }}
            className={`w-full text-left px-2.5 py-2 rounded-lg cursor-pointer transition-colors flex items-start gap-2.5 ${
              themePreference === 'light'
                ? 'bg-blue-50 dark:bg-[#1a2338] text-blue-700 dark:text-amber-300 font-semibold'
                : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#141b2a]'
            }`}
          >
            <Sun className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold">Light Mode</span>
                {themePreference === 'light' && (
                  <Check className="h-3.5 w-3.5 text-blue-600 dark:text-amber-400 shrink-0" />
                )}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-tight">
                Clean professional daytime theme
              </div>
            </div>
          </button>

          {/* Option 3: Dark Mode */}
          <button
            type="button"
            onClick={() => {
              setThemePreference('dark');
              setIsOpen(false);
            }}
            className={`w-full text-left px-2.5 py-2 rounded-lg cursor-pointer transition-colors flex items-start gap-2.5 ${
              themePreference === 'dark'
                ? 'bg-blue-50 dark:bg-[#1a2338] text-blue-700 dark:text-amber-300 font-semibold'
                : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#141b2a]'
            }`}
          >
            <Moon className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold">Dark Mode</span>
                {themePreference === 'dark' && (
                  <Check className="h-3.5 w-3.5 text-blue-600 dark:text-amber-400 shrink-0" />
                )}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-tight">
                Deep obsidian night theme
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
export default ThemeSwitcher;
