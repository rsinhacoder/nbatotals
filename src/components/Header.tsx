import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  SlidersHorizontal,
  BookmarkCheck,
  BarChart3,
  GraduationCap,
  ChevronDown,
  CalendarDays,
} from 'lucide-react';
import { type ModelConfig, MODEL_PRESETS } from '../utils/modelConstants';
import { ThemeSwitcher } from './ThemeSwitcher';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSync: () => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  onImportCsv: (e: React.ChangeEvent<HTMLInputElement>) => void;
  gameCount: number;
  upcomingCount: number;
  trackedBetsCount: number;
  seasonLabel: string;
  activeModel: ModelConfig;
  onSelectModel: (config: ModelConfig) => void;
}

const QuantLogoMark: React.FC = () => (
  <div className="relative group shrink-0">
    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-xl blur-[2px] opacity-70 group-hover:opacity-100 transition duration-300"></div>
    <div className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-900 via-[#0a1122] to-blue-950 p-1.5 sm:p-2 flex items-center justify-center border border-white/15 shadow-sm">
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full transform group-hover:scale-105 transition-transform duration-300"
      >
        <defs>
          <linearGradient id="quantLineGrad" x1="4" y1="24" x2="28" y2="8" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" />
            <stop offset="0.6" stopColor="#60a5fa" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
          <radialGradient id="quantNodeGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(25 8) rotate(90) scale(7)">
            <stop stopColor="#38bdf8" stopOpacity="0.85" />
            <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Basketball seam lines & court curvature */}
        <circle cx="16" cy="16" r="13" stroke="#94a3b8" strokeWidth="1.5" strokeOpacity="0.3" />
        <path d="M16 3v26" stroke="#94a3b8" strokeWidth="1.2" strokeOpacity="0.2" strokeDasharray="2 2" />
        <path d="M3 16h26" stroke="#94a3b8" strokeWidth="1.2" strokeOpacity="0.2" strokeDasharray="2 2" />
        <path d="M6 9.5c5 3.5 15 3.5 20 0" stroke="#94a3b8" strokeWidth="1.3" strokeOpacity="0.25" />
        <path d="M6 22.5c5-3.5 15-3.5 20 0" stroke="#94a3b8" strokeWidth="1.3" strokeOpacity="0.25" />

        {/* Quantitative Regression Curve / Sharp Trendline */}
        <path
          d="M5 23.5L11.5 17L17 20L25 8"
          stroke="url(#quantLineGrad)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Target Signal Beacon */}
        <circle cx="25" cy="8" r="6" fill="url(#quantNodeGlow)" />
        <circle cx="25" cy="8" r="2.2" fill="#ffffff" />
        <circle cx="25" cy="8" r="3.2" stroke="#38bdf8" strokeWidth="1" />
      </svg>
    </div>
  </div>
);

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSync,
  onExportExcel,
  onExportCsv,
  onImportCsv,
  gameCount,
  upcomingCount,
  trackedBetsCount,
  seasonLabel,
  activeModel,
  onSelectModel,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  // Modern 5 Core Navigation Items
  const tabs = [
    {
      id: 'picks',
      label: 'Picks Board',
      icon: CalendarDays,
      badge: upcomingCount > 0 ? String(upcomingCount) : undefined,
      badgeColor: 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    },
    {
      id: 'analyzer',
      label: 'Matchup Analyzer',
      icon: SlidersHorizontal,
    },
    {
      id: 'tracker',
      label: 'Bet Tracker',
      icon: BookmarkCheck,
      badge: trackedBetsCount > 0 ? String(trackedBetsCount) : undefined,
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
    {
      id: 'trackrecord',
      label: 'Track Record & Data',
      icon: BarChart3,
      badge: activeModel.shortLabel,
      badgeColor: 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    },
    {
      id: 'academy',
      label: 'Strategy Academy',
      icon: GraduationCap,
    },
  ];

  return (
    <header className="border-b border-slate-200 dark:border-[#1c2438] bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md sticky top-0 z-40 shadow-xs transition-colors duration-200">
      {/* Top Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        {/* Left: Brand Identity & Active Model Selector */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Logo Badge */}
          <QuantLogoMark />

          {/* Brand Title */}
          <div className="flex items-center gap-1.5 shrink-0">
            <h1 className="text-base sm:text-xl font-black tracking-tight text-slate-900 dark:text-white m-0 flex items-center gap-1">
              <span>NBA</span>
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-400 bg-clip-text text-transparent">
                TOTALS
              </span>
              <span className="text-slate-400 dark:text-zinc-500 font-medium text-xs hidden lg:inline">.com</span>
            </h1>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-blue-500/10 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300 border border-blue-500/20 dark:border-blue-400/30">
              QUANT PRO
            </span>
          </div>

          {/* Model Dropdown Trigger */}
          <div className="relative inline-block text-left shrink-0">
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#141b2a] hover:bg-slate-50 dark:hover:bg-[#1c2438] text-slate-800 dark:text-slate-100 border border-slate-300/80 dark:border-[#222c42] shadow-2xs transition-all cursor-pointer group"
              title={`Active Model: ${activeModel.name}`}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-400"></span>
              </span>
              <span className="font-mono text-[11px] font-bold sm:hidden">
                {activeModel.id === '5_YEAR' ? '5-Yr' : activeModel.id === '2_YEAR' ? '2-Yr' : 'Model'}
              </span>
              <span className="font-mono font-medium hidden sm:inline">
                {activeModel.shortLabel}
              </span>
              <ChevronDown
                className={`h-3 w-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${
                  isModelDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isModelDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsModelDropdownOpen(false)}
                />
                <div className="origin-top-left absolute left-0 mt-1.5 w-72 rounded-xl shadow-xl bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#222c42] p-2 z-50 animate-fade-in text-xs">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider border-b border-slate-100 dark:border-[#1c2438] mb-1.5 flex items-center justify-between">
                    <span>Regression Model Calibration</span>
                    <span className="text-blue-600 dark:text-blue-400 font-mono">N=6,000 DB</span>
                  </div>
                  <button
                    onClick={() => {
                      onSelectModel(MODEL_PRESETS['5_YEAR']);
                      setIsModelDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      activeModel.id === '5_YEAR'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-bold border border-blue-200 dark:border-blue-800/60'
                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#141b2a]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">5-Year Multi-Season (2020–2025)</span>
                      {activeModel.id === '5_YEAR' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-600 text-white font-bold">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                      6,000 Games • MAE 9.77 • R² 0.465
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onSelectModel(MODEL_PRESETS['2_YEAR']);
                      setIsModelDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-colors mt-1 ${
                      activeModel.id === '2_YEAR'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-bold border border-blue-200 dark:border-blue-800/60'
                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#141b2a]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Original 2-Year (2023–2025)</span>
                      {activeModel.id === '2_YEAR' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-600 text-white font-bold">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                      2,460 Games • MAE 10.16 • Baseline
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Utility Group */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 text-xs">
          {/* Theme Switcher (Time of Day / Light / Dark) */}
          <ThemeSwitcher />

          {/* Sync ESPN button */}
          <button
            onClick={onOpenSync}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition-all cursor-pointer text-xs"
            title="Fetch live games from ESPN API"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sync Live</span>
          </button>

          {/* Export / Data Actions Dropdown */}
          <div className="relative inline-block text-left">
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 dark:bg-[#141b2a] dark:hover:bg-[#1a2336] text-slate-700 dark:text-zinc-200 border border-slate-300 dark:border-[#222c42] font-medium transition-colors cursor-pointer text-xs shadow-2xs"
              title="Data / Export"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Data / Export</span>
              <ChevronDown className="h-3 w-3 text-slate-400 dark:text-zinc-400 hidden sm:inline" />
            </button>

            {isExportDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsExportDropdownOpen(false)}
                />
                <div className="origin-top-right absolute right-0 mt-1.5 w-48 rounded-xl shadow-lg bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#222c42] p-1.5 z-50 animate-fade-in text-xs space-y-1">
                  <button
                    onClick={() => {
                      onExportExcel();
                      setIsExportDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-[#1a2336] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Download Excel (.xlsx)</span>
                  </button>

                  <button
                    onClick={() => {
                      onExportCsv();
                      setIsExportDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-[#1a2336] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="h-3.5 w-3.5 text-blue-600" />
                    <span>Export Ref Lines (.csv)</span>
                  </button>

                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setIsExportDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-[#1a2336] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5 text-slate-600" />
                    <span>Load Ref Lines (.csv)</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={onImportCsv}
            accept=".csv"
            className="hidden"
          />
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-[#1c2438]">
        <nav className="flex space-x-1 sm:space-x-1.5 overflow-x-auto scrollbar-none py-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 dark:bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-[#141b2a]'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-zinc-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-md text-[10px] font-bold border ${
                      isActive
                        ? 'bg-slate-800 dark:bg-blue-700 text-slate-200 dark:text-white border-slate-700 dark:border-blue-500'
                        : tab.badgeColor || 'bg-slate-100 dark:bg-[#141b2a] text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-[#222c42]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
export default Header;
