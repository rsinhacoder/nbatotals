import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Zap,
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  Calendar,
  Filter,
  SlidersHorizontal,
  Settings,
  BarChart3,
  ShieldCheck,
  Info,
  DollarSign,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  ListFilter,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import type {
  OddsFormat,
  PlayerPropsForecast,
  PlayerPropsMarket,
  ScheduledGameWithRosters,
  RosterCoverageMetrics,
} from '../../types/playerProps';
import { PlayerPropsTable } from './PlayerPropsTable';
import { PlayerPropCard } from './PlayerPropCard';
import { FirstQuarterScannerView } from './FirstQuarterScannerView';
import { PropsBacktestView } from './PropsBacktestView';
import { PlayerDetailModal } from './PlayerDetailModal';
import { OddsSettingsModal } from './OddsSettingsModal';
import { AdBanner } from '../AdBanner';
import { sportsbookOddsService } from '../../services/sportsbookOddsService';
import { nbaRosterService } from '../../services/nbaRosterService';
import type { TrackedBet, UpcomingMatch } from '../../types/nba';

interface PlayerPropsPageProps {
  upcomingMatches?: UpcomingMatch[];
  onTrackBet?: (bet: any) => void;
  onOpenSync?: () => void;
}

export const PlayerPropsPage: React.FC<PlayerPropsPageProps> = ({
  upcomingMatches = [],
  onTrackBet,
  onOpenSync,
}) => {
  // Sub-navigation tabs: 'board' | 'scanner' | 'backtest'
  const [subTab, setSubTab] = useState<'board' | 'scanner' | 'backtest'>('board');
  const [oddsFormat, setOddsFormat] = useState<OddsFormat>('AMERICAN');

  // Presentation views: 'grouped' (Game Cards with Full Rosters) | 'table' (Flat Master Board)
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [signalFilter, setSignalFilter] = useState<'ALL' | 'OVER' | 'UNDER'>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'STARTER' | 'BENCH'>('ALL');
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'OFFERED' | 'UNOFFERED'>('ALL');
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>('ALL');
  const [minEdgeFilter, setMinEdgeFilter] = useState<number>(0);

  // Date selection
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-12');

  // Loading states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedForecast, setSelectedForecast] = useState<PlayerPropsForecast | null>(null);

  // Grouped Games & Schedule Data
  const [groupedGames, setGroupedGames] = useState<ScheduledGameWithRosters[]>([]);
  const [allForecasts, setAllForecasts] = useState<PlayerPropsForecast[]>([]);
  const [coverageMetrics, setCoverageMetrics] = useState<RosterCoverageMetrics | null>(null);

  // Expanded Game IDs set
  const [expandedGameIds, setExpandedGameIds] = useState<Set<string>>(new Set());

  // Available dates for schedule selector
  const availableDates = [
    { label: "Today (Oct 12)", value: '2026-10-12' },
    { label: "Tomorrow (Oct 13)", value: '2026-10-13' },
    { label: "Wed, Oct 14", value: '2026-10-14' },
    { label: "Thu, Oct 15", value: '2026-10-15' },
    { label: "Sun, Oct 11", value: '2026-10-11' },
    { label: "Sat, Oct 10", value: '2026-10-10' },
    { label: "Fri, Oct 09", value: '2026-10-09' },
    { label: "Thu, Oct 08", value: '2026-10-08' },
    { label: "All Scheduled Games", value: 'ALL' },
  ];

  // Refresh and load pipeline
  const loadScheduleAndRosters = async () => {
    setIsRefreshing(true);
    try {
      const liveMarkets = await sportsbookOddsService.fetchPlayerPointsMarkets(
        selectedDate === 'ALL' ? undefined : selectedDate
      );

      const result = await nbaRosterService.generateScheduleDrivenRosters(
        selectedDate,
        liveMarkets
      );

      setGroupedGames(result.groupedGames);
      setAllForecasts(result.allForecasts);
      setCoverageMetrics(result.metrics);

      // Expand all games by default for clear immediate visibility
      setExpandedGameIds(new Set(result.groupedGames.map((g) => g.id)));
    } catch (e) {
      console.warn('Error loading schedule-driven rosters:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadScheduleAndRosters();
  }, [selectedDate]);

  // Unique matchups list for filter dropdown
  const uniqueMatchups = useMemo(() => {
    return Array.from(
      new Set(groupedGames.map((g) => `${g.awayTeam.abbreviation} @ ${g.homeTeam.abbreviation}`))
    );
  }, [groupedGames]);

  // Filter single forecast helper
  const matchesFilters = (f: PlayerPropsForecast) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesName = f.playerName.toLowerCase().includes(term);
      const matchesTeam =
        f.team.toLowerCase().includes(term) || f.opponent.toLowerCase().includes(term);
      if (!matchesName && !matchesTeam) return false;
    }

    if (selectedGameFilter !== 'ALL') {
      const [awayAbbr, homeAbbr] = selectedGameFilter.split(' @ ');
      if (
        !(
          (f.team === awayAbbr && f.opponent === homeAbbr) ||
          (f.team === homeAbbr && f.opponent === awayAbbr)
        )
      ) {
        return false;
      }
    }

    if (roleFilter === 'STARTER' && !f.isStarter) return false;
    if (roleFilter === 'BENCH' && f.isStarter) return false;

    if (marketFilter === 'OFFERED' && f.marketStatus !== 'OFFERED') return false;
    if (marketFilter === 'UNOFFERED' && f.marketStatus === 'OFFERED') return false;

    if (signalFilter === 'OVER' && f.recommendation !== 'OVER EDGE') return false;
    if (signalFilter === 'UNDER' && f.recommendation !== 'UNDER EDGE') return false;

    if (minEdgeFilter > 0 && Math.abs(f.recommendationEdge) < minEdgeFilter) {
      return false;
    }

    return true;
  };

  // Filtered master list (for Table View & Scanner)
  const filteredForecasts = useMemo(() => {
    return allForecasts.filter(matchesFilters);
  }, [allForecasts, searchTerm, selectedGameFilter, roleFilter, marketFilter, signalFilter, minEdgeFilter]);

  // Toggle single game expand/collapse
  const toggleGameExpanded = (gameId: string) => {
    setExpandedGameIds((prev) => {
      const next = new Set(prev);
      if (next.has(gameId)) next.delete(gameId);
      else next.add(gameId);
      return next;
    });
  };

  // Expand / Collapse all games
  const handleToggleAllGames = () => {
    if (expandedGameIds.size === groupedGames.length) {
      setExpandedGameIds(new Set());
    } else {
      setExpandedGameIds(new Set(groupedGames.map((g) => g.id)));
    }
  };

  const providerStatus = sportsbookOddsService.getStatus();

  const handleQuickTrack = (forecast: PlayerPropsForecast) => {
    if (onTrackBet && forecast.marketStatus === 'OFFERED' && forecast.pointsLine != null) {
      onTrackBet({
        id: `prop_bet_${Date.now()}`,
        matchId: forecast.gameId,
        date: new Date().toISOString().slice(0, 10),
        matchup: `${forecast.playerName} (${forecast.team}) Points`,
        pickType: forecast.recommendation === 'OVER EDGE' ? 'OVER' : 'UNDER',
        targetLine: forecast.pointsLine,
        modelProjection: forecast.modelProjectedPoints,
        edge: forecast.recommendationEdge,
        units: 1.0,
        odds: forecast.recommendation === 'OVER EDGE' ? forecast.overOdds : forecast.underOdds,
        status: 'PENDING',
        notes: `NBA Prop Edge: ${forecast.recommendation} ${forecast.pointsLine} pts (${forecast.recommendationEdge}% edge, +${forecast.recommendationEv}% EV)`,
        sport: 'NBA',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-400/30 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> NBA Player Props Engine
            </span>
            <span className="text-xs text-slate-400 font-mono">Full Rosters • Every Scheduled Game</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
            NBA Player Points Forecasting &amp; Roster Edge Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Quantitative scoring projections for <strong>every scheduled game</strong> and <strong>every eligible roster player</strong> (including starters, rotation bench, and reserves). Evaluates live sportsbook lines where offered, and flags unoffered lines explicitly without mock bias.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Odds Format Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setOddsFormat('AMERICAN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                oddsFormat === 'AMERICAN'
                  ? 'bg-white dark:bg-[#0c1322] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              American (-115)
            </button>
            <button
              onClick={() => setOddsFormat('DECIMAL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                oddsFormat === 'DECIMAL'
                  ? 'bg-white dark:bg-[#0c1322] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Decimal (1.87)
            </button>
          </div>

          {/* Provider Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
            title="Sportsbook Odds Provider Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Refresh Odds */}
          <button
            onClick={loadScheduleAndRosters}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync Rosters</span>
          </button>
        </div>
      </div>

      {/* Roster Coverage Dashboard */}
      {coverageMetrics && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0d1627] to-[#0a1120] text-white border border-slate-800 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  Complete NBA Schedule &amp; Full Roster Coverage
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    100% PROCESSED
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Every scheduled game and all active team members evaluated independently of sportsbook postings.
                </p>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400 font-mono">
              Last Sync: <strong className="text-white">{coverageMetrics.lastSyncTime}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-3">
            <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Scheduled Games</span>
              <span className="text-xl font-black text-white block mt-0.5">{coverageMetrics.scheduledGames}</span>
              <span className="text-[10px] text-emerald-400 font-mono">All {coverageMetrics.processedGames} processed</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Participating Teams</span>
              <span className="text-xl font-black text-blue-400 block mt-0.5">{coverageMetrics.totalTeams}</span>
              <span className="text-[10px] text-slate-400">Complete squads</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Players</span>
              <span className="text-xl font-black text-white block mt-0.5">{coverageMetrics.totalRosterPlayers}</span>
              <span className="text-[10px] text-slate-400">Starters + Bench</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Starters</span>
              <span className="text-xl font-black text-indigo-400 block mt-0.5">{coverageMetrics.startersCount}</span>
              <span className="text-[10px] text-slate-400">Starting 5 units</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Bench &amp; Reserves</span>
              <span className="text-xl font-black text-purple-400 block mt-0.5">{coverageMetrics.benchCount}</span>
              <span className="text-[10px] text-purple-300">Included in model</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Sportsbook Lines</span>
              <span className="text-xl font-black text-emerald-400 block mt-0.5">{coverageMetrics.playersWithMarkets}</span>
              <span className="text-[10px] text-emerald-300">Live points lines</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Off The Board</span>
              <span className="text-xl font-black text-slate-400 block mt-0.5">{coverageMetrics.playersWithoutMarkets}</span>
              <span className="text-[10px] text-slate-400">Unlisted bench</span>
            </div>
          </div>
        </div>
      )}

      {/* Primary Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setSubTab('board')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            subTab === 'board'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>NBA Roster Props Board</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {allForecasts.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('scanner')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            subTab === 'scanner'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>1st Quarter Edge Scanner</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400/30 text-amber-100 font-black">
            LIVE PACE
          </span>
        </button>

        <button
          onClick={() => setSubTab('backtest')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            subTab === 'backtest'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Model Accuracy &amp; Backtest</span>
        </button>
      </div>

      {/* Main Board Area */}
      {subTab === 'board' && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            {/* Top Row: Date Selector & View Mode Switcher */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Date Selector */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-xs font-bold text-slate-500">Slate Date:</span>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-bold py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableDates.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode Switcher & Expand/Collapse Toggle */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {viewMode === 'grouped' && (
                  <button
                    onClick={handleToggleAllGames}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
                  >
                    {expandedGameIds.size === groupedGames.length ? 'Collapse All' : 'Expand All'}
                  </button>
                )}

                <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setViewMode('grouped')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition ${
                      viewMode === 'grouped'
                        ? 'bg-white dark:bg-[#0c1322] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Grouped by Game</span>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition ${
                      viewMode === 'table'
                        ? 'bg-white dark:bg-[#0c1322] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5" />
                    <span>Flat Master Board</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Row: Search, Role, Market, Signal Filters */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              {/* Search Input */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search player, team, or position..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Multi-Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Matchup Filter */}
                <select
                  value={selectedGameFilter}
                  onChange={(e) => setSelectedGameFilter(e.target.value)}
                  className="text-xs font-semibold py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="ALL">All Matchups ({groupedGames.length})</option>
                  {uniqueMatchups.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>

                {/* Role Filter */}
                <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setRoleFilter('ALL')}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition ${
                      roleFilter === 'ALL'
                        ? 'bg-white dark:bg-[#0c1322] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-400'
                    }`}
                  >
                    All Roles
                  </button>
                  <button
                    onClick={() => setRoleFilter('STARTER')}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition ${
                      roleFilter === 'STARTER'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400'
                    }`}
                  >
                    Starters
                  </button>
                  <button
                    onClick={() => setRoleFilter('BENCH')}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition ${
                      roleFilter === 'BENCH'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-400'
                    }`}
                  >
                    Bench &amp; Reserves
                  </button>
                </div>

                {/* Market Status Filter */}
                <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setMarketFilter('ALL')}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition ${
                      marketFilter === 'ALL'
                        ? 'bg-white dark:bg-[#0c1322] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-400'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setMarketFilter('OFFERED')}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition ${
                      marketFilter === 'OFFERED'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400'
                    }`}
                  >
                    Lines Available
                  </button>
                  <button
                    onClick={() => setMarketFilter('UNOFFERED')}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition ${
                      marketFilter === 'UNOFFERED'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'text-slate-400'
                    }`}
                  >
                    Off Board
                  </button>
                </div>

                {/* Signal Filter */}
                <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setSignalFilter('ALL')}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition ${
                      signalFilter === 'ALL'
                        ? 'bg-white dark:bg-[#0c1322] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-400'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSignalFilter('OVER')}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition ${
                      signalFilter === 'OVER'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400'
                    }`}
                  >
                    Over Edge
                  </button>
                  <button
                    onClick={() => setSignalFilter('UNDER')}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition ${
                      signalFilter === 'UNDER'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-400'
                    }`}
                  >
                    Under Edge
                  </button>
                </div>

                {/* Min Edge Filter */}
                <button
                  onClick={() =>
                    setMinEdgeFilter(minEdgeFilter === 0 ? 3.5 : minEdgeFilter === 3.5 ? 5.0 : 0)
                  }
                  className={`px-2.5 py-1 rounded-md font-bold text-xs border transition ${
                    minEdgeFilter > 0
                      ? 'bg-blue-500/20 text-blue-500 border-blue-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  {minEdgeFilter > 0 ? `Edge ≥ ${minEdgeFilter}%` : 'Edge Filter: Off'}
                </button>
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: GROUPED BY GAME (Primary Organized View) */}
          {viewMode === 'grouped' && (
            <div className="space-y-6">
              {groupedGames.map((game) => {
                const isExpanded = expandedGameIds.has(game.id);

                // Filter players for this game according to active filters
                const awayFiltered = game.awayTeam.allPlayers.filter(matchesFilters);
                const homeFiltered = game.homeTeam.allPlayers.filter(matchesFilters);
                const totalFilteredInGame = awayFiltered.length + homeFiltered.length;

                // Separate starters and bench for display
                const awayStarters = awayFiltered.filter((f) => f.isStarter);
                const awayBench = awayFiltered.filter((f) => !f.isStarter);

                const homeStarters = homeFiltered.filter((f) => f.isStarter);
                const homeBench = homeFiltered.filter((f) => !f.isStarter);

                return (
                  <div
                    key={game.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-sm overflow-hidden"
                  >
                    {/* Game Matchup Header */}
                    <div
                      onClick={() => toggleGameExpanded(game.id)}
                      className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/60 dark:to-[#0c1322] border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-900/80 transition"
                    >
                      {/* Teams & Logos */}
                      <div className="flex items-center gap-4">
                        {/* Away Team */}
                        <div className="flex items-center gap-2.5">
                          <img
                            src={game.awayTeam.logo}
                            alt={game.awayTeam.name}
                            className="w-8 h-8 object-contain shrink-0"
                            onError={(e) => {
                              (e.target as any).style.display = 'none';
                            }}
                          />
                          <div>
                            <div className="font-black text-slate-900 dark:text-white text-base">
                              {game.awayTeam.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {game.awayTeam.abbreviation} • {game.awayTeam.record || 'Away'}
                            </div>
                          </div>
                        </div>

                        <span className="font-mono text-xs font-black text-slate-400 px-1">@</span>

                        {/* Home Team */}
                        <div className="flex items-center gap-2.5">
                          <img
                            src={game.homeTeam.logo}
                            alt={game.homeTeam.name}
                            className="w-8 h-8 object-contain shrink-0"
                            onError={(e) => {
                              (e.target as any).style.display = 'none';
                            }}
                          />
                          <div>
                            <div className="font-black text-slate-900 dark:text-white text-base">
                              {game.homeTeam.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {game.homeTeam.abbreviation} • {game.homeTeam.record || 'Home'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Game Details & Coverage Status */}
                      <div className="flex items-center gap-3 shrink-0 flex-wrap">
                        {/* Tip-off Time */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{game.time}</span>
                        </div>

                        {/* Coverage Badge */}
                        <div className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {game.totalPlayers} Roster Players • {game.marketsAvailableCount} Active Lines
                        </div>

                        {/* Expand / Collapse Icon */}
                        <div className="p-1 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-500">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Game Body: Away & Home Rosters */}
                    {isExpanded && (
                      <div className="p-4 sm:p-6 space-y-8">
                        {totalFilteredInGame === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-xs">
                            No players in this game match the current filter criteria.
                          </div>
                        ) : (
                          <>
                            {/* AWAY TEAM ROSTER SECTION */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={game.awayTeam.logo}
                                    alt=""
                                    className="w-5 h-5 object-contain"
                                  />
                                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                                    {game.awayTeam.name} Roster ({awayFiltered.length} Players)
                                  </h3>
                                </div>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {awayStarters.length} Starters • {awayBench.length} Bench &amp; Reserves
                                </span>
                              </div>

                              {/* Away Starters */}
                              {awayStarters.length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                    <span>Starting Five ({awayStarters.length})</span>
                                  </div>
                                  <div className="hidden md:block">
                                    <PlayerPropsTable
                                      forecasts={awayStarters}
                                      oddsFormat={oddsFormat}
                                      onSelectPlayer={setSelectedForecast}
                                      onTrackProp={handleQuickTrack}
                                    />
                                  </div>
                                  <div className="md:hidden space-y-2">
                                    {awayStarters.map((f) => (
                                      <PlayerPropCard
                                        key={f.marketId}
                                        forecast={f}
                                        oddsFormat={oddsFormat}
                                        onSelectPlayer={setSelectedForecast}
                                        onTrackProp={handleQuickTrack}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Away Bench */}
                              {awayBench.length > 0 && (
                                <div className="space-y-2 pt-2">
                                  <div className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                                    <span>Bench Rotation &amp; Reserves ({awayBench.length})</span>
                                  </div>
                                  <div className="hidden md:block">
                                    <PlayerPropsTable
                                      forecasts={awayBench}
                                      oddsFormat={oddsFormat}
                                      onSelectPlayer={setSelectedForecast}
                                      onTrackProp={handleQuickTrack}
                                    />
                                  </div>
                                  <div className="md:hidden space-y-2">
                                    {awayBench.map((f) => (
                                      <PlayerPropCard
                                        key={f.marketId}
                                        forecast={f}
                                        oddsFormat={oddsFormat}
                                        onSelectPlayer={setSelectedForecast}
                                        onTrackProp={handleQuickTrack}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* HOME TEAM ROSTER SECTION */}
                            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={game.homeTeam.logo}
                                    alt=""
                                    className="w-5 h-5 object-contain"
                                  />
                                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                                    {game.homeTeam.name} Roster ({homeFiltered.length} Players)
                                  </h3>
                                </div>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {homeStarters.length} Starters • {homeBench.length} Bench &amp; Reserves
                                </span>
                              </div>

                              {/* Home Starters */}
                              {homeStarters.length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                    <span>Starting Five ({homeStarters.length})</span>
                                  </div>
                                  <div className="hidden md:block">
                                    <PlayerPropsTable
                                      forecasts={homeStarters}
                                      oddsFormat={oddsFormat}
                                      onSelectPlayer={setSelectedForecast}
                                      onTrackProp={handleQuickTrack}
                                    />
                                  </div>
                                  <div className="md:hidden space-y-2">
                                    {homeStarters.map((f) => (
                                      <PlayerPropCard
                                        key={f.marketId}
                                        forecast={f}
                                        oddsFormat={oddsFormat}
                                        onSelectPlayer={setSelectedForecast}
                                        onTrackProp={handleQuickTrack}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Home Bench */}
                              {homeBench.length > 0 && (
                                <div className="space-y-2 pt-2">
                                  <div className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                                    <span>Bench Rotation &amp; Reserves ({homeBench.length})</span>
                                  </div>
                                  <div className="hidden md:block">
                                    <PlayerPropsTable
                                      forecasts={homeBench}
                                      oddsFormat={oddsFormat}
                                      onSelectPlayer={setSelectedForecast}
                                      onTrackProp={handleQuickTrack}
                                    />
                                  </div>
                                  <div className="md:hidden space-y-2">
                                    {homeBench.map((f) => (
                                      <PlayerPropCard
                                        key={f.marketId}
                                        forecast={f}
                                        oddsFormat={oddsFormat}
                                        onSelectPlayer={setSelectedForecast}
                                        onTrackProp={handleQuickTrack}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 2: FLAT MASTER BOARD */}
          {viewMode === 'table' && (
            <div className="space-y-4">
              <div className="hidden md:block">
                <PlayerPropsTable
                  forecasts={filteredForecasts}
                  oddsFormat={oddsFormat}
                  onSelectPlayer={setSelectedForecast}
                  onTrackProp={handleQuickTrack}
                />
              </div>

              <div className="md:hidden space-y-3">
                {filteredForecasts.map((f) => (
                  <PlayerPropCard
                    key={f.marketId}
                    forecast={f}
                    oddsFormat={oddsFormat}
                    onSelectPlayer={setSelectedForecast}
                    onTrackProp={handleQuickTrack}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 1st Quarter Edge Scanner */}
      {subTab === 'scanner' && (
        <FirstQuarterScannerView
          forecasts={allForecasts}
          oddsFormat={oddsFormat}
          onSelectPlayer={setSelectedForecast}
        />
      )}

      {/* Model Backtest */}
      {subTab === 'backtest' && <PropsBacktestView />}

      {/* AdBanner integration */}
      <AdBanner variant="leaderboard" className="my-6" />

      {/* Modals */}
      <PlayerDetailModal
        forecast={selectedForecast}
        oddsFormat={oddsFormat}
        onClose={() => setSelectedForecast(null)}
      />

      <OddsSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onRefreshMarkets={loadScheduleAndRosters}
      />
    </div>
  );
};
