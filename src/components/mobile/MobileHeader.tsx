import { RefreshCw, SlidersHorizontal, Settings, ShieldCheck, User, Laptop } from 'lucide-react';

interface MobileHeaderProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  availableDates: { label: string; value: string }[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onToggleDesktopMode?: () => void;
  gameCount?: number;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  selectedDate,
  onSelectDate,
  availableDates,
  isRefreshing,
  onRefresh,
  onOpenSettings,
  onToggleDesktopMode,
  gameCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#070b14]/95 backdrop-blur-md border-b border-slate-800/80 pt-safe">
      {/* Top App Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-lg blur-[2px] opacity-75 animate-pulse"></div>
            <div className="relative h-8 w-8 rounded-lg bg-[#0b101e] border border-cyan-500/30 flex items-center justify-center shadow-xs">
              <span className="text-cyan-400 font-black text-sm tracking-tighter">NT</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-base tracking-tight">NBA TOTALS</span>
              <span className="text-[9px] font-black tracking-widest px-1 py-0.2 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 uppercase">
                AI
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>2026–27 Live Slate</span>
              {gameCount > 0 && <span>• {gameCount} Games</span>}
            </div>
          </div>
        </div>

        {/* Right Action Icons: Refresh & Settings */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 flex items-center justify-center transition active:scale-95 disabled:opacity-50"
            title="Refresh Live Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 flex items-center justify-center transition active:scale-95"
            title="App Settings & Odds"
            aria-label="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {onToggleDesktopMode && (
            <button
              onClick={onToggleDesktopMode}
              className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 flex items-center justify-center transition active:scale-95"
              title="Switch to Web View"
              aria-label="Web View"
            >
              <Laptop className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Date Picker Carousel */}
      <div className="px-3 pb-2 pt-0.5 overflow-x-auto no-scrollbar flex items-center gap-1.5">
        {availableDates.map((d) => {
          const isSelected = selectedDate === d.value;
          return (
            <button
              key={d.value}
              onClick={() => onSelectDate(d.value)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold tracking-tight transition-all active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              {d.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
