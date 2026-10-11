import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Sparkles,
  Shield,
  Layers,
  CheckCircle2,
  BookmarkPlus,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Flame,
  Star,
  Activity,
  Target,
  Calendar,
  Clock,
  Search,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import type { NHLUpcomingMatch, NHLMarketEdge, NHLMarketType } from '../../types/nhl';
import { getNHLTeamProfile } from '../../data/nhlTeamProfiles';

interface NHLPicksBoardTabProps {
  upcomingMatches: NHLUpcomingMatch[];
  onTrackBet?: (match: NHLUpcomingMatch, market: NHLMarketEdge) => void;
  onSendToAnalyzer?: (match: NHLUpcomingMatch) => void;
  onRefreshSchedule?: () => void;
  isSyncingSchedule?: boolean;
  lastSyncTime?: Date;
}

export const NHLPicksBoardTab: React.FC<NHLPicksBoardTabProps> = ({
  upcomingMatches,
  onTrackBet,
  onSendToAnalyzer,
  onRefreshSchedule,
  isSyncingSchedule = false,
  lastSyncTime,
}) => {
  // Eastern Time reference for accurate NHL schedule calendar
  const todayEasternStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  }, []);

  // Sorted list of unique calendar dates
  const uniqueDates = useMemo(() => {
    return Array.from(new Set(upcomingMatches.map((m) => m.date))).sort();
  }, [upcomingMatches]);

  // Selected date: defaults to today if matches exist today, otherwise first date with matches, or 'ALL'
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const hasTodayGames = upcomingMatches.some((m) => m.date === todayEasternStr);
    if (hasTodayGames) return todayEasternStr;
    const sorted = Array.from(new Set(upcomingMatches.map((m) => m.date))).sort();
    return sorted.length > 0 ? sorted[0] : 'ALL';
  });

  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'HIGH_EV' | 'TOTALS' | 'PUCKLINE' | 'MONEYLINE' | 'FIRST_PERIOD' | 'SOG'>('ALL');
  const [sortBy, setSortBy] = useState<'DATE' | 'EDGE'>('DATE');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // Helper date formatters
  const formatDateLabel = (dateStr: string): string => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      if (dateStr === todayEasternStr) {
        return `Today (${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
      }
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getDateDetails = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      const isToday = dateStr === todayEasternStr;
      const weekday = isToday ? 'TODAY' : date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { weekday, monthDay, isToday };
    } catch {
      return { weekday: 'GAME', monthDay: dateStr, isToday: false };
    }
  };

  // Active matches for currently selected date
  const activeDateMatches = useMemo(() => {
    if (selectedDate === 'ALL') return upcomingMatches;
    return upcomingMatches.filter((m) => m.date === selectedDate);
  }, [upcomingMatches, selectedDate]);

  // Slate statistics
  const slateStats = useMemo(() => {
    const total = activeDateMatches.length;
    const highEV = activeDateMatches.filter((m) => m.highestEdgeMarket.edgePercent >= 5.0).length;
    const overPicks = activeDateMatches.filter((m) => m.highestEdgeMarket.marketType === 'TOTAL_OVER').length;
    const underPicks = activeDateMatches.filter((m) => m.highestEdgeMarket.marketType === 'TOTAL_UNDER').length;
    const sogPicks = activeDateMatches.filter((m) => m.highestEdgeMarket.marketType.startsWith('SOG')).length;
    const pucklinePicks = activeDateMatches.filter((m) => m.highestEdgeMarket.marketType.startsWith('PUCKLINE')).length;
    return { total, highEV, overPicks, underPicks, sogPicks, pucklinePicks };
  }, [activeDateMatches]);

  // Filter matches
  const filteredMatches = useMemo(() => {
    return upcomingMatches.filter((match) => {
      // Date filter
      if (selectedDate !== 'ALL' && match.date !== selectedDate) return false;

      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesSearch =
          match.awayTeam.toLowerCase().includes(query) ||
          match.homeTeam.toLowerCase().includes(query) ||
          match.awayAbbrev.toLowerCase().includes(query) ||
          match.homeAbbrev.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Market category filter
      if (selectedFilter === 'HIGH_EV') {
        return match.highestEdgeMarket.edgePercent >= 5.0;
      }
      if (selectedFilter === 'TOTALS') {
        return match.highestEdgeMarket.marketType === 'TOTAL_OVER' || match.highestEdgeMarket.marketType === 'TOTAL_UNDER';
      }
      if (selectedFilter === 'PUCKLINE') {
        return match.highestEdgeMarket.marketType === 'PUCKLINE_HOME' || match.highestEdgeMarket.marketType === 'PUCKLINE_AWAY';
      }
      if (selectedFilter === 'MONEYLINE') {
        return match.highestEdgeMarket.marketType === 'MONEYLINE_HOME' || match.highestEdgeMarket.marketType === 'MONEYLINE_AWAY';
      }
      if (selectedFilter === 'FIRST_PERIOD') {
        return match.highestEdgeMarket.marketType === 'P1_OVER' || match.highestEdgeMarket.marketType === 'P1_UNDER';
      }
      if (selectedFilter === 'SOG') {
        return match.highestEdgeMarket.marketType === 'SOG_TOTAL_OVER' || match.highestEdgeMarket.marketType === 'SOG_TOTAL_UNDER';
      }
      return true;
    });
  }, [upcomingMatches, selectedDate, searchTerm, selectedFilter]);

  // Sort matches based on user preference (Default: Date & Time chronological)
  const sortedMatches = useMemo(() => {
    return [...filteredMatches].sort((a, b) => {
      if (sortBy === 'DATE') {
        const dateComp = a.date.localeCompare(b.date);
        if (dateComp !== 0) return dateComp;
        const timeComp = a.time.localeCompare(b.time);
        if (timeComp !== 0) return timeComp;
        return b.highestEdgeMarket.edgePercent - a.highestEdgeMarket.edgePercent;
      } else {
        // Highest EV edge first
        return b.highestEdgeMarket.edgePercent - a.highestEdgeMarket.edgePercent;
      }
    });
  }, [filteredMatches, sortBy]);

  // Overall top edge of the active slate
  const slateTopEdge = useMemo(() => {
    return activeDateMatches.reduce<NHLMarketEdge | null>((best, m) => {
      if (!best || m.highestEdgeMarket.edgePercent > best.edgePercent) {
        return m.highestEdgeMarket;
      }
      return best;
    }, null);
  }, [activeDateMatches]);

  const getMarketBadgeColor = (type: NHLMarketType) => {
    if (type.startsWith('TOTAL')) return 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30';
    if (type.startsWith('PUCKLINE')) return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
    if (type.startsWith('MONEYLINE')) return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
    if (type.startsWith('SOG')) return 'bg-amber-500/20 text-amber-300 border-amber-400/30';
    if (type.startsWith('P1')) return 'bg-rose-500/20 text-rose-300 border-rose-400/30';
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
  };

  const getMarketCategoryLabel = (type: NHLMarketType) => {
    if (type.startsWith('TOTAL')) return 'GAME TOTAL';
    if (type.startsWith('PUCKLINE')) return 'PUCKLINE';
    if (type.startsWith('MONEYLINE')) return 'MONEYLINE';
    if (type.startsWith('SOG')) return 'SHOTS ON GOAL';
    if (type.startsWith('P1')) return '1ST PERIOD';
    return 'MARKET EDGE';
  };

  return (
    <div className="space-y-4">
      {/* 1. Top Slate Quant Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-5 sm:p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-cyan-400" />
                Poisson &amp; xG Edge Engine
              </span>
              <span className="text-xs text-slate-400">Past 5 Seasons Calibrated · Live Odds</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              NHL Highest Edge Picks Board
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Discrete Bivariate Poisson simulations evaluate all betting markets per game (Totals O/U, Pucklines -1.5/+1.5, Moneylines, Shots on Goal &amp; 1P) to isolate the sportsbooks&apos; widest mathematical mispricing that the model predicts to hit.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            {onRefreshSchedule && (
              <button
                onClick={onRefreshSchedule}
                disabled={isSyncingSchedule}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all cursor-pointer disabled:opacity-50"
                title={lastSyncTime ? `Last synced: ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Sync Slate'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSchedule ? 'animate-spin' : ''}`} />
                {isSyncingSchedule ? 'Syncing...' : 'Sync Slate'}
              </button>
            )}
          </div>
        </div>

        {/* Quick Quant Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Games on Slate</span>
            <span className="text-base font-black text-white">{slateStats.total} Matchups</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <span className="text-slate-400 block mb-0.5">High EV Opportunities (≥5%)</span>
            <span className="text-base font-black text-emerald-400">{slateStats.highEV} Strong Edges</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Slate Best Pick</span>
            <span className="text-base font-black text-cyan-300 truncate block">
              {slateTopEdge ? `${slateTopEdge.marketName} (+${slateTopEdge.edgePercent}% EV)` : 'Analyzing...'}
            </span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <span className="text-slate-400 block mb-0.5">5-Yr Baseline Avg</span>
            <span className="text-base font-black text-amber-300">6.18 Goals · 61.2 SOG</span>
          </div>
        </div>
      </div>

      {/* 2. Slate Command Center (Touch-First Date Ribbon + Filters + Search) */}
      <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-5 shadow-xs space-y-4">
        {/* Top Command Strip: Slate Title, Summary Badges, Sort & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Active Date Slate Title & Signal Tallies */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                {selectedDate === 'ALL'
                  ? 'All Upcoming Matches'
                  : selectedDate === todayEasternStr
                  ? "Today's NHL Slate"
                  : `${formatDateLabel(selectedDate)} Slate`}
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold">
                ({slateStats.total} Games)
              </span>
            </div>

            {/* Quick Signal Counts */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 font-bold">
                {slateStats.highEV} HIGH EV
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/80 font-bold">
                {slateStats.overPicks + slateStats.underPicks} TOTALS
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80 font-bold">
                {slateStats.sogPicks} SOG
              </span>
            </div>
          </div>

          {/* Right: Sort Dropdown & Search & Refresh */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setSortBy('DATE')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  sortBy === 'DATE'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Sort chronologically by date and game time"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Date &amp; Time
              </button>
              <button
                onClick={() => setSortBy('EDGE')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  sortBy === 'EDGE'
                    ? 'bg-cyan-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Sort games with highest mathematical EV edge first"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Highest EV Edge
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search teams..."
                className="w-36 sm:w-44 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* 3. Touch-First Mobile & Desktop Calendar Day Ribbon */}
        {uniqueDates.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-0.5">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-cyan-500" />
                Select Match Slate
              </span>
              <span className="font-mono text-[11px] normal-case text-slate-400">
                Swipe horizontally for more dates &rarr;
              </span>
            </div>

            <div className="flex items-stretch gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar snap-x">
              {/* All Games Card */}
              <button
                onClick={() => setSelectedDate('ALL')}
                className={`snap-start shrink-0 min-w-[80px] sm:min-w-[96px] px-3 py-2 rounded-xl border flex flex-col items-center justify-between transition-all cursor-pointer ${
                  selectedDate === 'ALL'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-md ring-2 ring-blue-500/30'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <span className={`text-[10px] font-black uppercase tracking-wider ${selectedDate === 'ALL' ? 'text-blue-100' : 'text-slate-400'}`}>
                  FULL
                </span>
                <span className="text-sm font-black my-0.5 whitespace-nowrap">
                  All Slate
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  selectedDate === 'ALL'
                    ? 'bg-blue-700/80 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {upcomingMatches.length} Games
                </span>
              </button>

              {/* Individual Dates */}
              {uniqueDates.map((dateStr) => {
                const count = upcomingMatches.filter((m) => m.date === dateStr).length;
                const { weekday, monthDay, isToday } = getDateDetails(dateStr);
                const isSelected = selectedDate === dateStr;
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`snap-start shrink-0 min-w-[82px] sm:min-w-[100px] px-3 py-2 rounded-xl border flex flex-col items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-500 shadow-md ring-2 ring-cyan-500/30'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-cyan-400 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className={`text-[10px] font-black tracking-wider flex items-center gap-1 ${
                      isSelected ? 'text-cyan-100' : isToday ? 'text-emerald-500 dark:text-emerald-400 font-black' : 'text-slate-400'
                    }`}>
                      {isToday && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                      {weekday}
                    </span>
                    <span className="text-sm font-black my-0.5 whitespace-nowrap">
                      {monthDay}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      isSelected
                        ? 'bg-cyan-700/80 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {count} {count === 1 ? 'Game' : 'Games'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Filter Pills Strip */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Markets ({activeDateMatches.length})
            </button>
            <button
              onClick={() => setSelectedFilter('HIGH_EV')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedFilter === 'HIGH_EV'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Top EV Only (≥5%)
            </button>
            <button
              onClick={() => setSelectedFilter('TOTALS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedFilter === 'TOTALS'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Game Totals O/U
            </button>
            <button
              onClick={() => setSelectedFilter('PUCKLINE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedFilter === 'PUCKLINE'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pucklines (-1.5/+1.5)
            </button>
            <button
              onClick={() => setSelectedFilter('MONEYLINE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedFilter === 'MONEYLINE'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Moneylines
            </button>
            <button
              onClick={() => setSelectedFilter('FIRST_PERIOD')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedFilter === 'FIRST_PERIOD'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              1st Period O/U
            </button>
            <button
              onClick={() => setSelectedFilter('SOG')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedFilter === 'SOG'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Shots on Goal (SOG)
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Showing <span className="font-bold text-slate-900 dark:text-white">{sortedMatches.length}</span> games
            {sortBy === 'DATE' ? ' sorted by date & time' : ' ranked by EV edge'}
          </div>
        </div>
      </div>

      {/* 5. Match Cards List */}
      {sortedMatches.length === 0 ? (
        <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500 dark:text-slate-400 text-xs shadow-xs">
          No matches found for your current filter. Try selecting &quot;All Slate&quot; or clearing your search.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedMatches.map((match, index) => {
            const homeProf = getNHLTeamProfile(match.homeAbbrev);
            const awayProf = getNHLTeamProfile(match.awayAbbrev);
            const topMarket = match.highestEdgeMarket;
            const isExpanded = expandedMatchId === match.id;
            const isHighEV = topMarket.edgePercent >= 5.0;

            // Render Date separator banner if selectedDate is ALL and date changes
            const prevMatch = index > 0 ? sortedMatches[index - 1] : null;
            const showDateHeader = selectedDate === 'ALL' && (!prevMatch || prevMatch.date !== match.date);

            return (
              <React.Fragment key={match.id}>
                {showDateHeader && (
                  <div className="flex items-center gap-2 pt-3 pb-1">
                    <Calendar className="w-4 h-4 text-cyan-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      {formatDateLabel(match.date)}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      ({sortedMatches.filter((m) => m.date === match.date).length} Games)
                    </span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 ml-2" />
                  </div>
                )}

                <div
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isHighEV
                      ? 'bg-gradient-to-r from-emerald-500/5 via-transparent to-cyan-500/5 border-emerald-500/30 dark:border-emerald-500/20 shadow-md'
                      : 'bg-white dark:bg-[#0c121e] border-slate-200 dark:border-slate-800 shadow-xs'
                  }`}
                >
                  {/* Top Highest Edge Ribbon: The model's predicted winner for this game */}
                  <div
                    className={`px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold border-b ${
                      isHighEV
                        ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/20 text-white flex items-center gap-1 border border-white/20">
                        <Target className="w-3 h-3 text-amber-300" />
                        {getMarketCategoryLabel(topMarket.marketType)}
                      </span>
                      <span className="font-black text-sm tracking-tight flex items-center gap-1">
                        🎯 Model Pick:
                        <span className="underline decoration-white/40 underline-offset-2 ml-1">
                          {topMarket.marketName} ({topMarket.sportsbookOdds})
                        </span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-black text-xs ${
                          isHighEV ? 'bg-white text-emerald-800 shadow-xs' : 'bg-cyan-600 text-white'
                        }`}
                      >
                        +{topMarket.edgePercent}% EV
                      </span>
                      <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-black/20 text-white/90 border border-white/10">
                        {(topMarket.modelProbability * 100).toFixed(1)}% Win Prob
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-0.5 text-amber-300">
                        {Array.from({ length: topMarket.starRating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] opacity-90 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{match.time} • {match.venue}</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Card Content */}
                  <div className="p-4 sm:p-5">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                      {/* Left: Teams & Goalie Matchup */}
                      <div className="lg:col-span-5 flex items-center justify-between gap-4">
                        {/* Away Team */}
                        <div className="flex-1 flex flex-col items-center text-center">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 relative flex items-center justify-center p-1.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs mb-1.5">
                            <img
                              src={awayProf.logo}
                              alt={awayProf.name}
                              className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://a.espncdn.com/i/teamlogos/nhl/500/scoreboard/${awayProf.abbreviation.toLowerCase()}.png`;
                              }}
                            />
                          </div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                            {awayProf.city}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {awayProf.abbreviation} • {match.awayRecord}
                          </span>
                          <div className="mt-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5 text-slate-400" />
                            <span className="truncate max-w-[110px]" title={match.awayGoalie.name}>
                              {match.awayGoalie.name.split(' ').pop()} ({(match.awayGoalie.savePct * 100).toFixed(1)}%)
                            </span>
                          </div>
                        </div>

                        {/* VS Badge & Expected Score */}
                        <div className="shrink-0 flex flex-col items-center justify-center px-2">
                          <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 mb-1">
                            AT
                          </span>
                          <div className="text-xs font-mono font-bold px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 text-center">
                            <div className="text-[10px] text-indigo-500 uppercase font-black">Proj Score</div>
                            <div className="text-base font-black">
                              {match.modelProjectedAwayGoals} - {match.modelProjectedHomeGoals}
                            </div>
                          </div>
                        </div>

                        {/* Home Team */}
                        <div className="flex-1 flex flex-col items-center text-center">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 relative flex items-center justify-center p-1.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs mb-1.5">
                            <img
                              src={homeProf.logo}
                              alt={homeProf.name}
                              className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://a.espncdn.com/i/teamlogos/nhl/500/scoreboard/${homeProf.abbreviation.toLowerCase()}.png`;
                              }}
                            />
                          </div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                            {homeProf.city}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {homeProf.abbreviation} • {match.homeRecord}
                          </span>
                          <div className="mt-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5 text-slate-400" />
                            <span className="truncate max-w-[110px]" title={match.homeGoalie.name}>
                              {match.homeGoalie.name.split(' ').pop()} ({(match.homeGoalie.savePct * 100).toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Quantitative Model Metrics */}
                      <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200 dark:border-slate-800/80">
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Sportsbook Line</span>
                            <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                              O/U {match.sportsbookTotal}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {match.totalOverOdds} / {match.totalUnderOdds}
                            </span>
                          </div>

                          <div className="border-x border-slate-200 dark:border-slate-800 px-1">
                            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Model Total</span>
                            <span className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">
                              {match.modelProjectedTotal}
                            </span>
                            <span className="text-[10px] text-slate-400 block">Expected Goals</span>
                          </div>

                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Goal Edge</span>
                            <span
                              className={`font-mono font-black text-sm ${
                                match.goalEdge > 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : match.goalEdge < 0
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {match.goalEdge > 0 ? `+${match.goalEdge}` : match.goalEdge}
                            </span>
                            <span className="text-[10px] text-slate-400 block">Discrepancy</span>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Puckline: {homeProf.abbreviation} {match.sportsbookSpread > 0 ? `+${match.sportsbookSpread}` : match.sportsbookSpread} ({match.spreadHomeOdds})</span>
                          <span>1P O/U 1.5: {(match.prob1POver1_5 * 100).toFixed(0)}% Over</span>
                        </div>

                        {/* SOG and Faceoffs Live Quant Preview */}
                        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <span className="font-bold text-slate-400">SOG:</span>
                            <span className="font-black text-slate-900 dark:text-white">
                              {match.projectedAwayShots} - {match.projectedHomeShots}
                            </span>
                            <span className="text-[10px] text-slate-400">({match.projectedTotalShots} tot)</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <span className="font-bold text-slate-400">FO%:</span>
                            <span className="font-black text-indigo-600 dark:text-indigo-400">
                              {match.projectedHomeFaceoffWinPct}%
                            </span>
                            <span className="text-[10px] text-slate-400">~{match.projectedTotalFaceoffs} drws</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Action Buttons & Expand */}
                      <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col gap-2 justify-center">
                        {onTrackBet && (
                          <button
                            onClick={() => onTrackBet(match, topMarket)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
                          >
                            <BookmarkPlus className="w-3.5 h-3.5" />
                            Track Pick ({topMarket.marketName})
                          </button>
                        )}

                        <div className="flex gap-2 w-full">
                          {onSendToAnalyzer && (
                            <button
                              onClick={() => onSendToAnalyzer(match)}
                              className="flex-1 flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                            >
                              <SlidersHorizontal className="w-3 h-3" />
                              Deep Dive
                            </button>
                          )}

                          <button
                            onClick={() => setExpandedMatchId(isExpanded ? null : match.id)}
                            className="flex-1 flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                          >
                            <Layers className="w-3 h-3" />
                            All Markets {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Analytical Narrative Context */}
                    <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Quant Angle:</span> {match.keyAngle}
                    </p>

                    {/* Expanded Multi-Market Comparison Table */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-cyan-500" />
                            All 10 Evaluated Markets for this Matchup
                          </h4>
                          <span className="text-[11px] text-slate-400">Green highlight indicates model&apos;s top pick</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold">
                              <tr>
                                <th className="py-2 px-3">Market</th>
                                <th className="py-2 px-3">Line &amp; Book Odds</th>
                                <th className="py-2 px-3">Model Win Prob</th>
                                <th className="py-2 px-3">Book Implied</th>
                                <th className="py-2 px-3">Expected Value (EV%)</th>
                                <th className="py-2 px-3">Model Stance</th>
                                <th className="py-2 px-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {match.allMarketEdges.map((m, mIdx) => {
                                const isTopPick = m.marketType === topMarket.marketType && m.marketName === topMarket.marketName;

                                return (
                                  <tr
                                    key={mIdx}
                                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                                      isTopPick ? 'bg-emerald-500/10 font-medium' : ''
                                    }`}
                                  >
                                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                      {isTopPick ? (
                                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black uppercase flex items-center gap-0.5">
                                          <Check className="w-3 h-3" />
                                          TOP PICK
                                        </span>
                                      ) : m.recommended ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      ) : null}
                                      {m.marketName}
                                    </td>
                                    <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                                      {m.sportsbookOdds} (Dec: {m.sportsbookDecimalOdds})
                                    </td>
                                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                      {(m.modelProbability * 100).toFixed(1)}%
                                    </td>
                                    <td className="py-2.5 px-3 font-mono text-slate-500">
                                      {(m.sportsbookImpliedProb * 100).toFixed(1)}%
                                    </td>
                                    <td className="py-2.5 px-3 font-mono font-black">
                                      <span
                                        className={`px-2 py-0.5 rounded-full ${
                                          m.edgePercent >= 5.0
                                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                                            : m.edgePercent >= 2.0
                                            ? 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300'
                                            : m.edgePercent >= 0
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            : 'text-red-500'
                                        }`}
                                      >
                                        {m.edgePercent > 0 ? `+${m.edgePercent}%` : `${m.edgePercent}%`}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span
                                        className={`text-[11px] font-bold ${
                                          m.modelProbability >= 0.50
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-slate-400'
                                        }`}
                                      >
                                        {m.modelProbability >= 0.50 ? 'Model Favors' : 'Model Fades'}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      {onTrackBet && (
                                        <button
                                          onClick={() => onTrackBet(match, m)}
                                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                            isTopPick
                                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                              : 'bg-slate-200 dark:bg-slate-700 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600'
                                          }`}
                                        >
                                          Track
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};
