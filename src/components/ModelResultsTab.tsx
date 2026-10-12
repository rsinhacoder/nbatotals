import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Star,
  Search,
  Download,
  Filter,
  Calendar,
  Layers,
  Table as TableIcon,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Flame,
  ShieldCheck,
  RefreshCw,
  RotateCcw,
  Plus,
  X,
  Activity,
} from 'lucide-react';
import {
  SEASON_2026_27_PICKS,
  SEASON_2024_25_PICKS,
  calculateSeasonMetrics,
  getCumulativeEquityPoints,
} from '../data/seasonResultsData';
import type { GradedModelPick } from '../types/results';
import type { NBAGame } from '../types/nba';
import { gradeManualGameResult, type ManualGameInput } from '../utils/gameResultsUpdater';

interface ModelResultsTabProps {
  currentSport: 'nba' | 'nhl' | 'khl';
  onSelectSport?: (sport: 'nba' | 'nhl' | 'khl') => void;
  historicalGames?: NBAGame[];
  picks2026_27?: GradedModelPick[];
  onSyncGameResults?: () => Promise<number>;
  onResetPicks?: () => Promise<void>;
  onAddManualResult?: (pick: GradedModelPick) => void;
  isSyncingResults?: boolean;
  lastResultsSyncTime?: Date;
}

export const ModelResultsTab: React.FC<ModelResultsTabProps> = ({
  currentSport,
  onSelectSport,
  picks2026_27,
  onSyncGameResults,
  onResetPicks,
  onAddManualResult,
  isSyncingResults = false,
  lastResultsSyncTime,
}) => {
  // Season Selector: '2026-27' (Current Season) is DEFAULT
  const [seasonFilter, setSeasonFilter] = useState<'2026-27' | '2024-25' | 'ALL'>('2026-27');

  // Sport Filter: 'ALL' | 'NBA' | 'NHL' | 'KHL'
  const [sportFilter, setSportFilter] = useState<'ALL' | 'NBA' | 'NHL' | 'KHL'>(
    currentSport === 'khl' ? 'KHL' : currentSport === 'nhl' ? 'NHL' : 'NBA'
  );

  // Month Filter
  const [monthFilter, setMonthFilter] = useState<string>('ALL');

  // Outcome / Correctness Filter
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'WON' | 'LOST' | 'PUSH'>('ALL');

  // Market Category Filter
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'TOTAL' | 'SPREAD' | 'MONEYLINE' | 'SOG' | '1ST_PERIOD'>('ALL');

  // Confidence Filter
  const [confidenceFilter, setConfidenceFilter] = useState<'ALL' | 'HIGH_ONLY'>('ALL');

  // Search & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC' | 'PROFIT_DESC' | 'EDGE_DESC'>('DATE_DESC');

  // View Mode: Cards vs Table
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Manual Game Grader Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualSport, setManualSport] = useState<'NBA' | 'NHL' | 'KHL'>('NBA');
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [manualAwayTeam, setManualAwayTeam] = useState('');
  const [manualHomeTeam, setManualHomeTeam] = useState('');
  const [manualAwayScore, setManualAwayScore] = useState('');
  const [manualHomeScore, setManualHomeScore] = useState('');
  const [manualLine, setManualLine] = useState('');
  const [manualOdds, setManualOdds] = useState('-110');
  const [manualPickOverride, setManualPickOverride] = useState<'AUTO' | 'UNDER' | 'OVER'>('AUTO');
  const [manualErrorMessage, setManualErrorMessage] = useState('');

  // Active 2026-27 Picks (defaults to props, then static dataset)
  const active2026Picks = useMemo(() => {
    return picks2026_27 && picks2026_27.length > 0 ? picks2026_27 : SEASON_2026_27_PICKS;
  }, [picks2026_27]);

  // Base picks determined by selected season
  const basePicks = useMemo(() => {
    if (seasonFilter === '2026-27') return active2026Picks;
    if (seasonFilter === '2024-25') return SEASON_2024_25_PICKS;
    return [...active2026Picks, ...SEASON_2024_25_PICKS];
  }, [seasonFilter, active2026Picks]);

  // Dynamic month options based on season
  const monthOptions = useMemo(() => {
    if (seasonFilter === '2026-27') {
      const months = Array.from(new Set(active2026Picks.map((p) => p.date.slice(0, 7)))).sort().reverse();
      return [
        { id: 'ALL', label: 'Full 2026–27 Season' },
        ...months.map((m) => ({ id: m, label: `${m} (Active Slate)` })),
      ];
    } else if (seasonFilter === '2024-25') {
      return [
        { id: 'ALL', label: 'Full 2024–25 Season' },
        { id: '2024-10', label: 'Oct 2024' },
        { id: '2024-11', label: 'Nov 2024' },
        { id: '2024-12', label: 'Dec 2024' },
        { id: '2025-01', label: 'Jan 2025' },
        { id: '2025-02', label: 'Feb 2025' },
        { id: '2025-03', label: 'Mar 2025' },
        { id: '2025-04', label: 'Apr 2025' },
      ];
    } else {
      return [
        { id: 'ALL', label: 'All Seasons' },
        { id: '2026-10', label: 'Oct 2026 (Current)' },
        { id: '2024-10', label: 'Oct 2024' },
        { id: '2025-04', label: 'Apr 2025' },
      ];
    }
  }, [seasonFilter, active2026Picks]);

  // Filtered picks based on current selections
  const filteredPicks = useMemo(() => {
    return basePicks.filter((pick) => {
      // Sport filter
      if (sportFilter !== 'ALL' && pick.sport !== sportFilter) return false;

      // Month filter
      if (monthFilter !== 'ALL' && !pick.date.startsWith(monthFilter)) return false;

      // Outcome filter
      if (outcomeFilter !== 'ALL' && pick.outcome !== outcomeFilter) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && pick.marketCategory !== categoryFilter) return false;

      // Confidence filter
      if (confidenceFilter === 'HIGH_ONLY' && pick.confidence !== 'HIGH') return false;

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesSearch =
          pick.matchup.toLowerCase().includes(query) ||
          pick.awayTeam.toLowerCase().includes(query) ||
          pick.homeTeam.toLowerCase().includes(query) ||
          pick.awayAbbrev.toLowerCase().includes(query) ||
          pick.homeAbbrev.toLowerCase().includes(query) ||
          pick.marketName.toLowerCase().includes(query) ||
          (pick.modelPickValue && pick.modelPickValue.toLowerCase().includes(query)) ||
          (pick.currentValue && pick.currentValue.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [basePicks, sportFilter, monthFilter, outcomeFilter, categoryFilter, confidenceFilter, searchTerm]);

  // Sort picks
  const sortedPicks = useMemo(() => {
    return [...filteredPicks].sort((a, b) => {
      if (sortBy === 'DATE_DESC') return b.date.localeCompare(a.date);
      if (sortBy === 'DATE_ASC') return a.date.localeCompare(b.date);
      if (sortBy === 'PROFIT_DESC') return b.profitUnits - a.profitUnits;
      if (sortBy === 'EDGE_DESC') return b.edgePercent - a.edgePercent;
      return 0;
    });
  }, [filteredPicks, sortBy]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(sortedPicks.length / pageSize));
  const paginatedPicks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPicks.slice(start, start + pageSize);
  }, [sortedPicks, currentPage, pageSize]);

  // Performance metrics for current filtered subset
  const metrics = useMemo(() => {
    return calculateSeasonMetrics(filteredPicks);
  }, [filteredPicks]);

  // Cumulative equity curve points
  const equityPoints = useMemo(() => {
    return getCumulativeEquityPoints(filteredPicks);
  }, [filteredPicks]);

  // Total sport counts in current selected season
  const totalNBAPicks = useMemo(() => basePicks.filter((p) => p.sport === 'NBA').length, [basePicks]);
  const totalNHLPicks = useMemo(() => basePicks.filter((p) => p.sport === 'NHL').length, [basePicks]);
  const totalKHLPicks = useMemo(() => basePicks.filter((p) => p.sport === 'KHL').length, [basePicks]);

  // Market Category breakdown
  const categoryBreakdown = useMemo(() => {
    const categories: Array<{ id: 'TOTAL' | 'SPREAD' | 'MONEYLINE' | 'SOG' | '1ST_PERIOD'; label: string }> = [
      { id: 'TOTAL', label: 'Game Totals (O/U)' },
      { id: 'SPREAD', label: 'Pucklines & Spreads' },
      { id: 'MONEYLINE', label: 'Moneylines' },
      { id: 'SOG', label: 'Shots on Goal (SOG)' },
      { id: '1ST_PERIOD', label: '1st Period Totals' },
    ];

    return categories.map((cat) => {
      const subset = filteredPicks.filter((p) => p.marketCategory === cat.id);
      const subMetrics = calculateSeasonMetrics(subset);
      return {
        ...cat,
        ...subMetrics,
      };
    });
  }, [filteredPicks]);

  // Export current results to CSV
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Season',
      'Sport',
      'Date',
      'Matchup',
      'Model Pick Value',
      'Actual Score After Game',
      'Value Differential',
      'Market Category',
      'Closing Line',
      'Odds',
      'Model Projection',
      'EV Edge %',
      'Final Score',
      'Model Correctness',
      'Units Staked',
      'Net Profit Units',
      'Analysis Recap',
    ];

    const rows = sortedPicks.map((p) => [
      p.id,
      p.season || '2026-27',
      p.sport,
      p.date,
      `"${p.matchup}"`,
      `"${p.modelPickValue || p.marketName}"`,
      `"${p.awayScore}-${p.homeScore} (${p.actualTotal} Total)"`,
      `"${p.valueDifferential || ''}"`,
      p.marketCategory,
      p.sportsbookLine,
      p.sportsbookOdds,
      p.modelProjection,
      p.edgePercent,
      `"${p.awayScore}-${p.homeScore}"`,
      p.outcome === 'WON' ? 'SUCCESS' : p.outcome === 'LOST' ? 'FAILURE' : 'PUSH',
      p.unitsStaked,
      p.profitUnits,
      `"${(p.analysisRecap || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `model_correctness_${seasonFilter.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Header & Season Selector Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {seasonFilter === '2026-27'
                ? '2026–27 CURRENT SEASON ACTIVE'
                : seasonFilter === '2024-25'
                ? '2024–25 AUDIT LEDGER'
                : 'ALL SEASONS COMBINED'}
            </span>
            <span className="text-xs text-slate-300 font-mono">
              Audited Box Scores &amp; Consensus Closing Lines
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Model Correctness &amp; Pick Accuracy
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
            Verifying algorithmic edges by evaluating the chosen <strong className="text-white">Model Pick Value</strong> against the <strong className="text-white">Actual Score after the game</strong> to determine <strong className="text-emerald-400">SUCCESS</strong> or <strong className="text-rose-400">FAILURE</strong>.
          </p>
        </div>

        {/* Season Selector Tabs */}
        <div className="flex flex-wrap items-center bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 gap-1.5 shrink-0 self-start md:self-center">
          <button
            onClick={() => {
              setSeasonFilter('2026-27');
              setMonthFilter('ALL');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              seasonFilter === '2026-27'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>2026–27 (Current Season)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono font-bold">
              {active2026Picks.length}
            </span>
          </button>

          <button
            onClick={() => {
              setSeasonFilter('2024-25');
              setMonthFilter('ALL');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              seasonFilter === '2024-25'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>2024–25 (Historical)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
              {SEASON_2024_25_PICKS.length.toLocaleString()}
            </span>
          </button>

          <button
            onClick={() => {
              setSeasonFilter('ALL');
              setMonthFilter('ALL');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              seasonFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All ({(active2026Picks.length + SEASON_2024_25_PICKS.length).toLocaleString()})</span>
          </button>
        </div>
      </div>

      {/* Live Game Result Watcher & Sync Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Live Game Result Engine Active
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-500" />
                Auto-Updates After Every Game
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Continuously verifies box scores from official NBA &amp; NHL scoreboards, grading Model Pick Value vs Actual Score after each game.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {lastResultsSyncTime && (
            <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
              Synced: {lastResultsSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          {onSyncGameResults && (
            <button
              onClick={() => onSyncGameResults()}
              disabled={isSyncingResults}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              title="Check ESPN Scoreboards for newly completed game results"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingResults ? 'animate-spin' : ''}`} />
              <span>{isSyncingResults ? 'Checking Scores...' : 'Check Game Results'}</span>
            </button>
          )}

          {onResetPicks && (
            <button
              onClick={() => onResetPicks()}
              disabled={isSyncingResults}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs transition-all cursor-pointer"
              title="Reload all verified official results and clear local cache"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Reload Official Slate</span>
            </button>
          )}

          <button
            onClick={() => {
              setManualErrorMessage('');
              setIsManualModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs transition-all cursor-pointer"
            title="Grade a custom or exhibition game result"
          >
            <Plus className="w-3.5 h-3.5 text-blue-500" />
            <span>+ Grade Result</span>
          </button>
        </div>
      </div>

      {/* 2. Top Timeline / Monthly Navigation */}
      <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Season Timeline Filter:
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {filteredPicks.length.toLocaleString()} Picks Matching
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {monthOptions.map((opt) => {
            const isSelected = monthFilter === opt.id;
            const count =
              opt.id === 'ALL'
                ? basePicks.length
                : basePicks.filter((p) => p.date.startsWith(opt.id)).length;

            return (
              <button
                key={opt.id}
                onClick={() => {
                  setMonthFilter(opt.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? 'bg-blue-700/80 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Executive KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Win Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Correctness Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {metrics.winRate}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Excludes pushes</div>
        </div>

        {/* Record S-F-P */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Pick Record (S-F-P)</span>
            <Award className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {metrics.wins}-{metrics.losses}
            {metrics.pushes > 0 && `-${metrics.pushes}`}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Success - Failure - Push
          </div>
        </div>

        {/* Total Picks */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Total Graded</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {metrics.totalPicks.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {seasonFilter === '2026-27' ? '2026–27 Season' : seasonFilter === '2024-25' ? '2024–25 Season' : 'Combined'}
          </div>
        </div>

        {/* Net Units Profit */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Net Profit</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div
            className={`text-2xl font-black font-mono ${
              metrics.totalProfitUnits >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {metrics.totalProfitUnits >= 0 ? `+${metrics.totalProfitUnits}` : metrics.totalProfitUnits}u
          </div>
          <div className="text-[10px] text-slate-400 mt-1">1 unit flat stake</div>
        </div>

        {/* ROI % */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">ROI %</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div
            className={`text-2xl font-black font-mono ${
              metrics.roi >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {metrics.roi >= 0 ? `+${metrics.roi}%` : `${metrics.roi}%`}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Return on capital</div>
        </div>

        {/* High Edge Tier */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">High-Edge Tier</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {metrics.highEdgeWinRate}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            +{metrics.highEdgeProfitUnits}u ({metrics.highEdgePicks} picks)
          </div>
        </div>
      </div>

      {/* 4. Cumulative Bankroll Curve SVG Chart */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Cumulative Bankroll Growth Curve ({seasonFilter === '2026-27' ? '2026–27 Season' : seasonFilter === '2024-25' ? '2024–25 Season' : 'All Seasons'})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audited equity growth tracking 1.0 unit stakes on every published Model Pick.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Peak: +{equityPoints.length > 0 ? Math.max(...equityPoints.map((p) => p.cumulativeProfit)) : 0}u
            </span>
          </div>
        </div>

        {/* SVG Equity Chart */}
        {equityPoints.length > 1 && (
          <div className="h-44 w-full relative">
            {(() => {
              const maxProfit = Math.max(...equityPoints.map((p) => p.cumulativeProfit), 10);
              const minProfit = Math.min(...equityPoints.map((p) => p.cumulativeProfit), -5);
              const range = maxProfit - minProfit || 1;
              const width = 1000;
              const height = 160;

              const pointsStr = equityPoints
                .map((pt, idx) => {
                  const x = (idx / (equityPoints.length - 1)) * width;
                  const y = height - ((pt.cumulativeProfit - minProfit) / range) * (height - 20) - 10;
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(' ');

              const zeroY = height - ((0 - minProfit) / range) * (height - 20) - 10;

              return (
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Zero Line */}
                  <line
                    x1="0"
                    y1={zeroY}
                    x2={width}
                    y2={zeroY}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                    opacity="0.4"
                  />

                  {/* Gradient Area */}
                  <polygon
                    points={`0,${zeroY} ${pointsStr} ${width},${zeroY}`}
                    fill="url(#equityGrad)"
                  />

                  {/* Main Curve */}
                  <polyline
                    points={pointsStr}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              );
            })()}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>Start: {equityPoints[0]?.date || '—'}</span>
          <span>End: {equityPoints[equityPoints.length - 1]?.date || '—'}</span>
        </div>
      </div>

      {/* 5. Filter Controls Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Sport Filter Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => {
                setSportFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                sportFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Sports ({basePicks.length.toLocaleString()})
            </button>
            <button
              onClick={() => {
                setSportFilter('NBA');
                setCurrentPage(1);
                onSelectSport?.('nba');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                sportFilter === 'NBA'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🏀 NBA ({totalNBAPicks.toLocaleString()})
            </button>
            <button
              onClick={() => {
                setSportFilter('NHL');
                setCurrentPage(1);
                onSelectSport?.('nhl');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                sportFilter === 'NHL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🏒 NHL ({totalNHLPicks.toLocaleString()})
            </button>
            <button
              onClick={() => {
                setSportFilter('KHL');
                setCurrentPage(1);
                onSelectSport?.('khl');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                sportFilter === 'KHL'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ❄️ KHL ({totalKHLPicks.toLocaleString()})
            </button>
          </div>

          {/* Outcome Filters */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-xs overflow-x-auto">
            <button
              onClick={() => {
                setOutcomeFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                outcomeFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({filteredPicks.length.toLocaleString()})
            </button>
            <button
              onClick={() => {
                setOutcomeFilter('WON');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                outcomeFilter === 'WON'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              SUCCESS ({filteredPicks.filter((p) => p.outcome === 'WON').length.toLocaleString()})
            </button>
            <button
              onClick={() => {
                setOutcomeFilter('LOST');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                outcomeFilter === 'LOST'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 dark:text-rose-400 hover:text-rose-800'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              FAILURE ({filteredPicks.filter((p) => p.outcome === 'LOST').length.toLocaleString()})
            </button>
            <button
              onClick={() => {
                setOutcomeFilter('PUSH');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                outcomeFilter === 'PUSH'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 dark:text-amber-400 hover:text-amber-800'
              }`}
            >
              <MinusCircle className="w-3.5 h-3.5" />
              PUSH ({filteredPicks.filter((p) => p.outcome === 'PUSH').length.toLocaleString()})
            </button>
          </div>

          {/* Right Controls: Search, Sort, View Toggle & CSV Export */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search team or pick..."
                className="w-40 sm:w-48 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none font-medium cursor-pointer"
            >
              <option value="DATE_DESC">Newest First</option>
              <option value="DATE_ASC">Oldest First</option>
              <option value="PROFIT_DESC">Highest Profit</option>
              <option value="EDGE_DESC">Highest EV Edge</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setViewMode('CARDS')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'CARDS'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* CSV Export Button */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              title="Export Current Model Correctness Ledger as CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Second Row: Market Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-slate-400 font-bold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Markets:
          </span>
          <button
            onClick={() => {
              setCategoryFilter('ALL');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              setCategoryFilter('TOTAL');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              categoryFilter === 'TOTAL'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Totals (O/U)
          </button>
          <button
            onClick={() => {
              setCategoryFilter('SPREAD');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              categoryFilter === 'SPREAD'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Pucklines &amp; Spreads
          </button>
          <button
            onClick={() => {
              setCategoryFilter('SOG');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              categoryFilter === 'SOG'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Shots on Goal (SOG)
          </button>
          <button
            onClick={() => {
              setCategoryFilter('1ST_PERIOD');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              categoryFilter === '1ST_PERIOD'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            1st Period (1P)
          </button>
        </div>
      </div>

      {/* 6. Results Cards or Table View */}
      {sortedPicks.length === 0 ? (
        <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500 dark:text-slate-400 text-xs shadow-xs">
          No graded Model Picks found matching your current filter criteria.
        </div>
      ) : viewMode === 'TABLE' ? (
        /* Dense Table View */
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs overflow-x-auto space-y-3">
          <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold">
              <tr>
                <th className="py-2.5 px-3">Date &amp; Sport</th>
                <th className="py-2.5 px-3">Matchup</th>
                <th className="py-2.5 px-3 font-black text-blue-600 dark:text-blue-400">🎯 Model Pick Value</th>
                <th className="py-2.5 px-3 font-black text-slate-900 dark:text-white">🏁 Actual Score (Final)</th>
                <th className="py-2.5 px-3">Margin / Clearance</th>
                <th className="py-2.5 px-3">Model Proj</th>
                <th className="py-2.5 px-3 text-center">Correctness</th>
                <th className="py-2.5 px-3 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedPicks.map((pick) => {
                const isSuccess = pick.outcome === 'WON';
                const isFailure = pick.outcome === 'LOST';

                return (
                  <tr key={pick.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-bold text-slate-900 dark:text-white block">{pick.date}</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-slate-400">{pick.sport}</span>
                        {pick.season && (
                          <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {pick.season}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {pick.matchup}
                    </td>
                    <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                          {pick.modelPickValue || pick.marketName}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">({pick.sportsbookOdds})</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {pick.awayScore} - {pick.homeScore}
                        </span>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                          Total: {pick.actualTotal} {pick.sport === 'NHL' ? 'Goals' : 'Pts'}
                          {pick.marketCategory === 'SOG' && pick.actualShots ? ` · ${pick.actualShots.total} SOG` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs whitespace-nowrap">
                      <span className={isSuccess ? 'text-emerald-600 dark:text-emerald-400 font-bold' : isFailure ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-400'}>
                        {pick.valueDifferential || '—'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                      {pick.modelProjection}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
                          isSuccess
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : isFailure
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {isSuccess && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                        {isFailure && <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />}
                        {pick.outcome === 'PUSH' && <MinusCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                        <span>{isSuccess ? 'SUCCESS' : isFailure ? 'FAILURE' : 'PUSH'}</span>
                      </span>
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono font-black whitespace-nowrap ${
                        pick.profitUnits > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : pick.profitUnits < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {pick.profitUnits > 0 ? `+${pick.profitUnits}u` : `${pick.profitUnits}u`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Cards View with Dedicated Model Pick Value vs Current Value Section */
        <div className="space-y-3">
          {paginatedPicks.map((pick) => {
            const isSuccess = pick.outcome === 'WON';
            const isFailure = pick.outcome === 'LOST';

            return (
              <div
                key={pick.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isSuccess
                    ? 'bg-gradient-to-r from-emerald-500/5 via-transparent to-cyan-500/5 border-emerald-500/30 dark:border-emerald-500/20 shadow-xs'
                    : isFailure
                    ? 'bg-white dark:bg-[#0c121e] border-slate-200 dark:border-slate-800'
                    : 'bg-amber-500/5 border-amber-500/30'
                }`}
              >
                {/* Card Top Ribbon */}
                <div
                  className={`px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold border-b ${
                    isSuccess
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500/30'
                      : isFailure
                      ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/20 text-white border border-white/20">
                      {pick.season || '2026-27'} · {pick.sport} · {pick.marketCategory}
                    </span>
                    <span className="font-bold flex items-center gap-1 text-sm tracking-tight">
                      🎯 Pick:
                      <span className="underline decoration-white/40 underline-offset-2 ml-1 font-black">
                        {pick.modelPickValue || pick.marketName} ({pick.sportsbookOdds})
                      </span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-black text-xs ${
                        isSuccess ? 'bg-white text-emerald-800 shadow-xs' : 'bg-slate-700 text-white'
                      }`}
                    >
                      +{pick.edgePercent}% EV
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-3 py-1 rounded-full font-black text-xs uppercase flex items-center gap-1.5 shadow-xs ${
                          isSuccess
                            ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-400/50'
                            : isFailure
                            ? 'bg-rose-900/80 text-rose-200 border border-rose-500/50'
                            : 'bg-amber-900/80 text-amber-200 border border-amber-500/50'
                        }`}
                      >
                        {isSuccess && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {isFailure && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                        {pick.outcome === 'PUSH' && <MinusCircle className="w-3.5 h-3.5 text-amber-400" />}
                        <span>{isSuccess ? 'SUCCESS' : isFailure ? 'FAILURE' : 'PUSH'}</span>
                      </span>
                      <span
                        className={`font-mono font-black text-xs ml-1 ${
                          pick.profitUnits > 0
                            ? 'text-emerald-300'
                            : pick.profitUnits < 0
                            ? 'text-rose-300'
                            : 'text-slate-300'
                        }`}
                      >
                        ({pick.profitUnits > 0 ? `+${pick.profitUnits}u` : `${pick.profitUnits}u`})
                      </span>
                    </div>

                    <div className="text-[11px] opacity-90 font-mono hidden sm:inline">
                      {pick.date} {pick.time && `• ${pick.time}`}
                    </div>
                  </div>
                </div>

                {/* Card Main Body */}
                <div className="p-4 sm:p-5">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Teams & Score Badge (Col 4) */}
                    <div className="lg:col-span-4 flex items-center justify-between gap-3">
                      {/* Away Team */}
                      <div className="flex-1 text-center">
                        {pick.awayLogo && (
                          <div className="w-12 h-12 mx-auto mb-1 flex items-center justify-center p-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                            <img src={pick.awayLogo} alt={pick.awayTeam} className="max-h-full max-w-full object-contain" />
                          </div>
                        )}
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block leading-tight">
                          {pick.awayTeam}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{pick.awayAbbrev}</span>
                      </div>

                      {/* Actual Final Score Badge */}
                      <div className="shrink-0 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">FINAL SCORE</span>
                        <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
                          {pick.awayScore} - {pick.homeScore}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 block mt-0.5">
                          {pick.actualTotal} Total {pick.sport === 'NHL' ? 'Goals' : 'Pts'}
                        </span>
                      </div>

                      {/* Home Team */}
                      <div className="flex-1 text-center">
                        {pick.homeLogo && (
                          <div className="w-12 h-12 mx-auto mb-1 flex items-center justify-center p-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                            <img src={pick.homeLogo} alt={pick.homeTeam} className="max-h-full max-w-full object-contain" />
                          </div>
                        )}
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block leading-tight">
                          {pick.homeTeam}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{pick.homeAbbrev}</span>
                      </div>
                    </div>

                    {/* Middle: Dedicated "Model Pick Value vs Actual Score (After Game)" Panel (Col 5) */}
                    <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/70 rounded-xl p-3 border border-slate-200 dark:border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                          Model Pick Value vs. Actual Score (After Game)
                        </span>
                        <span
                          className={`font-black ${
                            isSuccess
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isFailure
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-amber-500'
                          }`}
                        >
                          {isSuccess ? '✓ SUCCESS' : isFailure ? '✕ FAILURE' : '— PUSH'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* Model Pick Value */}
                        <div className="bg-white dark:bg-slate-950/70 p-2 rounded-lg border border-slate-200/70 dark:border-slate-800/70">
                          <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">
                            🎯 Model Pick Value
                          </span>
                          <span
                            className="font-mono font-black text-xs text-slate-900 dark:text-white block mt-0.5 truncate"
                            title={pick.modelPickValue || pick.marketName}
                          >
                            {pick.modelPickValue || pick.marketName}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                            Line: {pick.sportsbookLine} ({pick.sportsbookOdds})
                          </span>
                        </div>

                        {/* Actual Score After Game */}
                        <div className="bg-white dark:bg-slate-950/70 p-2 rounded-lg border border-slate-200/70 dark:border-slate-800/70">
                          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                            🏁 Actual Score After Game
                          </span>
                          <span
                            className="font-mono font-black text-xs text-slate-900 dark:text-white block mt-0.5 truncate"
                            title={`${pick.awayScore} - ${pick.homeScore} (${pick.actualTotal} Total)`}
                          >
                            {pick.awayScore} - {pick.homeScore}
                            <span className="text-[10px] font-normal text-indigo-600 dark:text-indigo-400 ml-1 font-sans">
                              ({pick.actualTotal} {pick.sport === 'NHL' ? 'Goals' : 'Pts'})
                            </span>
                          </span>
                          <span
                            className={`text-[10px] block mt-0.5 font-semibold truncate ${
                              isSuccess
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isFailure
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                            title={pick.valueDifferential}
                          >
                            {pick.valueDifferential || (isSuccess ? 'Target Covered' : 'Target Missed')}
                          </span>
                        </div>
                      </div>

                      {/* Model Projection & EV Subline */}
                      <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-slate-500 dark:text-slate-400 border-t border-slate-200/40 dark:border-slate-800/40">
                        <span>Model Proj: <strong className="text-indigo-600 dark:text-indigo-400">{pick.modelProjection}</strong></span>
                        <span>Edge: <strong className="text-emerald-600 dark:text-emerald-400">+{pick.edgePercent}% EV</strong></span>
                        <span>Prob: <strong>{(pick.modelWinProb * 100).toFixed(1)}%</strong></span>
                      </div>
                    </div>

                    {/* Right: Star Rating & Units (Col 3) */}
                    <div className="lg:col-span-3 flex flex-col items-center sm:items-end justify-center text-right">
                      <div className="flex items-center gap-1 text-amber-400 mb-1">
                        {Array.from({ length: pick.starRating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Stake: {pick.unitsStaked} Unit Flat
                      </div>
                      <div
                        className={`text-base font-black font-mono mt-0.5 ${
                          pick.profitUnits > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : pick.profitUnits < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {pick.profitUnits > 0 ? `+${pick.profitUnits} Units` : `${pick.profitUnits} Units`}
                      </div>
                    </div>
                  </div>

                  {/* Analysis Recap Note */}
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Outcome Evaluation:</span> {pick.analysisRecap}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 7. Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-900 dark:text-white">
              {Math.min(currentPage * pageSize, sortedPicks.length).toLocaleString()}
            </strong>{' '}
            of <strong className="text-slate-900 dark:text-white">{sortedPicks.length.toLocaleString()}</strong> graded picks in {seasonFilter === '2026-27' ? '2026–27 Season' : seasonFilter === '2024-25' ? '2024–25 Season' : 'All Seasons'}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-bold text-slate-900 dark:text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 8. Manual Game Result Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative text-slate-900 dark:text-zinc-100 max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setIsManualModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">
                  Grade Game Box Score
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                  Audit model correctness for any finished match with final scores
                </p>
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const awayScoreNum = parseInt(manualAwayScore, 10);
                const homeScoreNum = parseInt(manualHomeScore, 10);
                const lineNum = parseFloat(manualLine);

                if (!manualAwayTeam.trim() || !manualHomeTeam.trim()) {
                  setManualErrorMessage('Please enter both away and home team names.');
                  return;
                }
                if (isNaN(awayScoreNum) || isNaN(homeScoreNum) || awayScoreNum < 0 || homeScoreNum < 0) {
                  setManualErrorMessage('Please enter valid final box scores.');
                  return;
                }
                if (isNaN(lineNum) || lineNum <= 0) {
                  setManualErrorMessage('Please enter a valid sportsbook line.');
                  return;
                }

                const manualInput: ManualGameInput = {
                  sport: manualSport,
                  date: manualDate,
                  awayTeam: manualAwayTeam.trim(),
                  homeTeam: manualHomeTeam.trim(),
                  awayScore: awayScoreNum,
                  homeScore: homeScoreNum,
                  sportsbookLine: lineNum,
                  sportsbookOdds: manualOdds.trim() || '-110',
                  pickType: manualPickOverride === 'AUTO' ? undefined : manualPickOverride,
                };

                const gradedPick = gradeManualGameResult(manualInput);
                if (onAddManualResult) {
                  onAddManualResult(gradedPick);
                }
                setIsManualModalOpen(false);
                setManualAwayTeam('');
                setManualHomeTeam('');
                setManualAwayScore('');
                setManualHomeScore('');
                setManualLine('');
                setManualErrorMessage('');
              }}
              className="space-y-3.5 text-xs"
            >
              {/* Sport Selector */}
              <div>
                <label className="text-slate-700 dark:text-zinc-300 font-semibold block mb-1">
                  Sport League
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['NBA', 'NHL', 'KHL'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setManualSport(s);
                        if (s === 'NBA' && (!manualLine || manualLine === '5.5' || manualLine === '6.0')) {
                          setManualLine('224.5');
                        } else if ((s === 'NHL' || s === 'KHL') && (!manualLine || manualLine === '224.5')) {
                          setManualLine('6.0');
                        }
                      }}
                      className={`py-1.5 px-3 rounded-xl border font-bold transition-all cursor-pointer text-center ${
                        manualSport === s
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      {s === 'NBA' ? '🏀 NBA' : s === 'NHL' ? '🏒 NHL' : '❄️ KHL'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-slate-700 dark:text-zinc-300 font-semibold block mb-1">
                  Game Date
                </label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Teams */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-zinc-300 font-semibold block mb-1">
                    Away Team
                  </label>
                  <input
                    type="text"
                    value={manualAwayTeam}
                    onChange={(e) => setManualAwayTeam(e.target.value)}
                    placeholder="e.g. Dallas Mavericks"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-zinc-300 font-semibold block mb-1">
                    Home Team
                  </label>
                  <input
                    type="text"
                    value={manualHomeTeam}
                    onChange={(e) => setManualHomeTeam(e.target.value)}
                    placeholder="e.g. Houston Rockets"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-zinc-300 font-semibold block mb-1">
                    Away Final Score
                  </label>
                  <input
                    type="number"
                    value={manualAwayScore}
                    onChange={(e) => setManualAwayScore(e.target.value)}
                    placeholder={manualSport === 'NBA' ? '112' : '3'}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-zinc-300 font-semibold block mb-1">
                    Home Final Score
                  </label>
                  <input
                    type="number"
                    value={manualHomeScore}
                    onChange={(e) => setManualHomeScore(e.target.value)}
                    placeholder={manualSport === 'NBA' ? '108' : '2'}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Sportsbook Line & Odds */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-zinc-300 font-semibold block mb-1">
                    Closing Line ({manualSport === 'NBA' ? 'Pts' : 'Goals'})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={manualLine}
                    onChange={(e) => setManualLine(e.target.value)}
                    placeholder={manualSport === 'NBA' ? '224.5' : '6.0'}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-zinc-300 font-semibold block mb-1">
                    Consensus Odds
                  </label>
                  <input
                    type="text"
                    value={manualOdds}
                    onChange={(e) => setManualOdds(e.target.value)}
                    placeholder="-110"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Pick Direction Override */}
              <div>
                <label className="text-slate-700 dark:text-zinc-300 font-semibold block mb-1">
                  Model Pick Logic
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualPickOverride('AUTO')}
                    className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer text-center ${
                      manualPickOverride === 'AUTO'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    Auto Model Projection
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualPickOverride('UNDER')}
                    className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer text-center ${
                      manualPickOverride === 'UNDER'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    Force UNDER
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualPickOverride('OVER')}
                    className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer text-center ${
                      manualPickOverride === 'OVER'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    Force OVER
                  </button>
                </div>
              </div>

              {manualErrorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs">
                  {manualErrorMessage}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Audit &amp; Add Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelResultsTab;
