import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Flame,
  Star,
  Search,
  Download,
  Filter,
  BarChart3,
  Calendar,
  Layers,
  Table as TableIcon,
  LayoutGrid,
  Shield,
  Activity,
  Target,
} from 'lucide-react';
import {
  CURRENT_SEASON_PICKS,
  calculateSeasonMetrics,
  getCumulativeEquityPoints,
} from '../data/seasonResultsData';
import type { GradedModelPick, PickOutcome } from '../types/results';

interface ModelResultsTabProps {
  currentSport: 'nba' | 'nhl';
  onSelectSport?: (sport: 'nba' | 'nhl') => void;
}

export const ModelResultsTab: React.FC<ModelResultsTabProps> = ({
  currentSport,
  onSelectSport,
}) => {
  const [sportFilter, setSportFilter] = useState<'ALL' | 'NBA' | 'NHL'>(
    currentSport === 'nhl' ? 'NHL' : 'NBA'
  );
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'WON' | 'LOST' | 'PUSH'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'TOTAL' | 'SPREAD' | 'MONEYLINE' | 'SOG' | '1ST_PERIOD'>('ALL');
  const [confidenceFilter, setConfidenceFilter] = useState<'ALL' | 'HIGH_ONLY'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC' | 'PROFIT_DESC' | 'EDGE_DESC'>('DATE_DESC');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Filtered picks based on current selections
  const filteredPicks = useMemo(() => {
    return CURRENT_SEASON_PICKS.filter((pick) => {
      // Sport filter
      if (sportFilter !== 'ALL' && pick.sport !== sportFilter) return false;

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
          pick.marketName.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [sportFilter, outcomeFilter, categoryFilter, confidenceFilter, searchTerm]);

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

  // Performance metrics for current filtered subset
  const metrics = useMemo(() => {
    return calculateSeasonMetrics(filteredPicks);
  }, [filteredPicks]);

  // Cumulative equity curve points
  const equityPoints = useMemo(() => {
    return getCumulativeEquityPoints(filteredPicks);
  }, [filteredPicks]);

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
      'Sport',
      'Date',
      'Matchup',
      'Pick',
      'Category',
      'Book Line',
      'Odds',
      'Model Projection',
      'Edge %',
      'Score',
      'Outcome',
      'Units Staked',
      'Profit Units',
      'Analysis Recap',
    ];

    const rows = sortedPicks.map((p) => [
      p.id,
      p.sport,
      p.date,
      `"${p.matchup}"`,
      `"${p.marketName}"`,
      p.marketCategory,
      p.sportsbookLine,
      p.sportsbookOdds,
      p.modelProjection,
      p.edgePercent,
      `"${p.awayScore} - ${p.homeScore}"`,
      p.outcome,
      p.unitsStaked,
      p.profitUnits,
      `"${p.analysisRecap.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Model_Current_Season_Results_${sportFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Hero Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-5 sm:p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                2024–25 Verified Track Record
              </span>
              <span className="text-xs text-slate-400">Current Season Official Picks Ledger</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Model Picks Results &amp; Performance Ledger
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Transparent, post-game audited records of every pick selected by the quantitative engine across the 2024–25 season. Verified against closing sportsbook consensus lines and official final box scores.
            </p>
          </div>

          {/* Sport Selector on Hero Banner */}
          <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/15 text-xs font-bold shrink-0">
            <button
              onClick={() => {
                setSportFilter('ALL');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                sportFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              All Sports
            </button>
            <button
              onClick={() => {
                setSportFilter('NBA');
                if (onSelectSport) onSelectSport('nba');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                sportFilter === 'NBA' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>🏀</span> NBA
            </button>
            <button
              onClick={() => {
                setSportFilter('NHL');
                if (onSelectSport) onSelectSport('nhl');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                sportFilter === 'NHL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>🏒</span> NHL
            </button>
          </div>
        </div>

        {/* 6 Top Key Performance Indicator Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Total Graded Picks</span>
            <span className="text-lg font-black text-white">{metrics.totalPicks} Wagers</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Audited 2024–25</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Win–Loss Record</span>
            <span className="text-lg font-black text-white">
              {metrics.wins}W - {metrics.losses}L - {metrics.pushes}P
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {metrics.pushes} Refund Pushes
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Win Rate</span>
            <span className="text-lg font-black text-emerald-400">{metrics.winRate}%</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Excl. pushes</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Net Profit</span>
            <span
              className={`text-lg font-black ${
                metrics.totalProfitUnits >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {metrics.totalProfitUnits >= 0 ? `+${metrics.totalProfitUnits}` : metrics.totalProfitUnits} Units
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Flat unit sizing</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Overall ROI</span>
            <span className="text-lg font-black text-cyan-300">
              {metrics.roi >= 0 ? `+${metrics.roi}%` : `${metrics.roi}%`}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Return on investment</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-slate-400 block mb-0.5">High-Edge Tier (4-5★)</span>
            <span className="text-lg font-black text-amber-300">{metrics.highEdgeWinRate}%</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              +{metrics.highEdgeProfitUnits}u ({metrics.highEdgePicks} bets)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Cumulative Equity Growth Curve */}
      {equityPoints.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Cumulative Units Growth Curve (2024–25 Season)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tracking equity progression as each qualified model pick resolves chronologically.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-bold">
                Current Equity: {metrics.totalProfitUnits >= 0 ? `+${metrics.totalProfitUnits}` : metrics.totalProfitUnits}u
              </span>
            </div>
          </div>

          {/* Lightweight Responsive SVG Equity Curve */}
          <div className="h-44 w-full pt-3 relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Zero baseline */}
              <line x1="0" y1="80" x2="1000" y2="80" stroke="#94a3b8" strokeDasharray="3 3" strokeOpacity="0.4" strokeWidth="1" />

              {/* Equity Line Path */}
              {(() => {
                const maxVal = Math.max(...equityPoints.map((p) => p.cumulativeProfit), 10);
                const minVal = Math.min(...equityPoints.map((p) => p.cumulativeProfit), -5);
                const range = maxVal - minVal || 1;

                const points = equityPoints.map((p, idx) => {
                  const x = (idx / (equityPoints.length - 1 || 1)) * 1000;
                  const y = 110 - ((p.cumulativeProfit - minVal) / range) * 95;
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                });

                const lineD = `M ${points.join(' L ')}`;
                const areaD = `M ${points.join(' L ')} L 1000,120 L 0,120 Z`;

                return (
                  <>
                    <path d={areaD} fill="url(#equityGradient)" />
                    <path d={lineD} fill="none" stroke="#10b981" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                );
              })()}
            </svg>
          </div>
        </div>
      )}

      {/* 3. Market Category Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {categoryBreakdown.map((cat) => (
          <div
            key={cat.id}
            onClick={() => setCategoryFilter(categoryFilter === cat.id ? 'ALL' : cat.id)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              categoryFilter === cat.id
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 shadow-sm ring-1 ring-blue-500/30'
                : 'bg-white dark:bg-[#0c121e] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{cat.label}</span>
              <span className="text-[10px] font-mono text-slate-500">{cat.totalPicks} picks</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-base font-black text-slate-900 dark:text-white">
                {cat.winRate}% Win
              </span>
              <span
                className={`text-xs font-mono font-bold ${
                  cat.totalProfitUnits >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                }`}
              >
                {cat.totalProfitUnits >= 0 ? `+${cat.totalProfitUnits}` : cat.totalProfitUnits}u
              </span>
            </div>
            <div className="text-[10px] text-slate-500 flex items-center justify-between mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <span>{cat.wins}W - {cat.losses}L</span>
              <span className="font-mono">ROI: {cat.roi >= 0 ? `+${cat.roi}%` : `${cat.roi}%`}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Filter & Search Command Strip */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Outcome Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setOutcomeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                outcomeFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Outcomes ({CURRENT_SEASON_PICKS.length})
            </button>
            <button
              onClick={() => setOutcomeFilter('WON')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                outcomeFilter === 'WON'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Won ({CURRENT_SEASON_PICKS.filter((p) => p.outcome === 'WON').length})
            </button>
            <button
              onClick={() => setOutcomeFilter('LOST')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                outcomeFilter === 'LOST'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 hover:text-rose-700'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Lost ({CURRENT_SEASON_PICKS.filter((p) => p.outcome === 'LOST').length})
            </button>
            <button
              onClick={() => setOutcomeFilter('PUSH')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                outcomeFilter === 'PUSH'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-600 dark:text-amber-400 hover:text-amber-700'
              }`}
            >
              <MinusCircle className="w-3.5 h-3.5" />
              Pushes ({CURRENT_SEASON_PICKS.filter((p) => p.outcome === 'PUSH').length})
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
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search team or pick..."
                className="w-40 sm:w-48 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
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
              title="Export Current Results as CSV"
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
            onClick={() => setCategoryFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setCategoryFilter('TOTAL')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              categoryFilter === 'TOTAL'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Game Totals O/U
          </button>
          <button
            onClick={() => setCategoryFilter('SPREAD')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              categoryFilter === 'SPREAD'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Pucklines &amp; Spreads
          </button>
          <button
            onClick={() => setCategoryFilter('MONEYLINE')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              categoryFilter === 'MONEYLINE'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Moneylines
          </button>
          <button
            onClick={() => setCategoryFilter('SOG')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              categoryFilter === 'SOG'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Shots on Goal (SOG)
          </button>
          <button
            onClick={() => setCategoryFilter('1ST_PERIOD')}
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

      {/* 5. Results Cards or Table View */}
      {sortedPicks.length === 0 ? (
        <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500 dark:text-slate-400 text-xs shadow-xs">
          No graded picks found matching your current filter criteria.
        </div>
      ) : viewMode === 'TABLE' ? (
        /* Dense Table View */
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold">
              <tr>
                <th className="py-2.5 px-3">Date &amp; Sport</th>
                <th className="py-2.5 px-3">Matchup</th>
                <th className="py-2.5 px-3">Model Pick</th>
                <th className="py-2.5 px-3">Book Line</th>
                <th className="py-2.5 px-3">Model Proj</th>
                <th className="py-2.5 px-3">Edge</th>
                <th className="py-2.5 px-3">Actual Score</th>
                <th className="py-2.5 px-3">Outcome</th>
                <th className="py-2.5 px-3 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedPicks.map((pick) => (
                <tr key={pick.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-bold text-slate-900 dark:text-white block">{pick.date}</span>
                    <span className="text-[10px] text-slate-400">{pick.sport}</span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                    {pick.matchup}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      {pick.outcome === 'WON' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : pick.outcome === 'LOST' ? (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      ) : (
                        <MinusCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      )}
                      <span>{pick.marketName}</span>
                      <span className="text-slate-400 font-mono text-[11px]">({pick.sportsbookOdds})</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                    {pick.sportsbookLine}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {pick.modelProjection}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    +{pick.edgePercent}% EV
                  </td>
                  <td className="py-2.5 px-3 font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                    {pick.awayScore} - {pick.homeScore} ({pick.actualTotal})
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        pick.outcome === 'WON'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                          : pick.outcome === 'LOST'
                          ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {pick.outcome}
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
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Cards View */
        <div className="space-y-3">
          {sortedPicks.map((pick) => {
            const isWon = pick.outcome === 'WON';
            const isLost = pick.outcome === 'LOST';

            return (
              <div
                key={pick.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isWon
                    ? 'bg-gradient-to-r from-emerald-500/5 via-transparent to-cyan-500/5 border-emerald-500/30 dark:border-emerald-500/20 shadow-xs'
                    : isLost
                    ? 'bg-white dark:bg-[#0c121e] border-slate-200 dark:border-slate-800'
                    : 'bg-amber-500/5 border-amber-500/30'
                }`}
              >
                {/* Card Top Ribbon */}
                <div
                  className={`px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold border-b ${
                    isWon
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500/30'
                      : isLost
                      ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/20 text-white border border-white/20">
                      {pick.sport} · {pick.marketCategory}
                    </span>
                    <span className="font-bold flex items-center gap-1 text-sm tracking-tight">
                      🎯 Pick:
                      <span className="underline decoration-white/40 underline-offset-2 ml-1">
                        {pick.marketName} ({pick.sportsbookOdds})
                      </span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-black text-xs ${
                        isWon ? 'bg-white text-emerald-800 shadow-xs' : 'bg-slate-700 text-white'
                      }`}
                    >
                      +{pick.edgePercent}% EV
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-black text-xs uppercase flex items-center gap-1 ${
                          isWon
                            ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-400/40'
                            : isLost
                            ? 'bg-rose-900/80 text-rose-200 border border-rose-500/40'
                            : 'bg-amber-900/80 text-amber-200 border border-amber-500/40'
                        }`}
                      >
                        {isWon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {isLost && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                        <span>{pick.outcome}</span>
                      </span>
                      <span
                        className={`font-mono font-black text-xs ${
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
                    {/* Teams & Score Badge */}
                    <div className="lg:col-span-5 flex items-center justify-between gap-3">
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

                      {/* Actual Score Badge */}
                      <div className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-[10px] font-black uppercase text-slate-400 block">FINAL SCORE</span>
                        <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
                          {pick.awayScore} - {pick.homeScore}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 block">
                          Total: {pick.actualTotal}
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

                    {/* Middle: Model Projection vs Book Line */}
                    <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200 dark:border-slate-800/80">
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Sportsbook Line</span>
                          <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                            {pick.sportsbookLine}
                          </span>
                          <span className="text-[10px] text-slate-400 block">{pick.sportsbookOdds}</span>
                        </div>
                        <div className="border-x border-slate-200 dark:border-slate-800 px-1">
                          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Model Proj</span>
                          <span className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">
                            {pick.modelProjection}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {(pick.modelWinProb * 100).toFixed(1)}% Prob
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Edge Value</span>
                          <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                            +{pick.edgePercent}%
                          </span>
                          <span className="text-[10px] text-slate-400 block">Expected Value</span>
                        </div>
                      </div>

                      {/* Optional SOG / 1P metrics if present */}
                      {pick.actualShots && (
                        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400">
                          <span>Actual SOG: {pick.actualShots.away} - {pick.actualShots.home} ({pick.actualShots.total} Total)</span>
                          <span className="text-cyan-500 font-bold">🎯 Shots Settled</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Profit Badge & Star Rating */}
                    <div className="lg:col-span-3 flex flex-col items-center sm:items-end justify-center text-right">
                      <div className="flex items-center gap-1 text-amber-400 mb-1">
                        {Array.from({ length: pick.starRating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Stake: {pick.unitsStaked} Unit
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
                    <span className="font-bold text-slate-800 dark:text-slate-200">Outcome Recap:</span> {pick.analysisRecap}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default ModelResultsTab;
