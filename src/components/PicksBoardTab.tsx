import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  TrendingUp,
  BookmarkCheck,
  BookmarkPlus,
  SlidersHorizontal,
  Flame,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  Check,
  Calendar,
} from 'lucide-react';
import { MatchDetailPage } from './MatchDetailPage';
import { AdBanner } from './AdBanner';
import type { UpcomingMatch, TrackedBet } from '../types/nba';
import { getTeamProfile } from '../data/teamProfiles';

interface PicksBoardTabProps {
  upcomingMatches: UpcomingMatch[];
  trackedBets: TrackedBet[];
  onTrackBet: (match: UpcomingMatch, type: 'UNDER' | 'OVER') => void;
  onSendToAnalyzer: (match: UpcomingMatch) => void;
  onUpdateSportsbookLine: (matchId: string, newLine: number) => void;
  onOpenSync: () => void;
  onRefreshSchedule?: () => void;
  isSyncingSchedule?: boolean;
  lastSyncTime?: Date;
}

export const PicksBoardTab: React.FC<PicksBoardTabProps> = ({
  upcomingMatches,
  trackedBets,
  onTrackBet,
  onSendToAnalyzer,
  onUpdateSportsbookLine,
  onOpenSync,
  onRefreshSchedule,
  isSyncingSchedule,
  lastSyncTime,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'TOP_EDGE' | 'UNDER' | 'OVER'>('ALL');
  const todayEasternStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
    const hasTodayGames = upcomingMatches.some((m) => m.date === todayStr);
    return hasTodayGames ? todayStr : 'ALL';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<UpcomingMatch | null>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // Line editing modal/inline state
  const [editingLineMatchId, setEditingLineMatchId] = useState<string | null>(null);
  const [tempLineValue, setTempLineValue] = useState<string>('');

  // Sorted unique schedule dates
  const uniqueDates = useMemo(() => {
    return Array.from(new Set(upcomingMatches.map((m) => m.date))).sort();
  }, [upcomingMatches]);

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

  // Slate overview stats
  const slateStats = useMemo(() => {
    const total = activeDateMatches.length;
    const underPicks = activeDateMatches.filter((m) => m.recommendation.includes('UNDER')).length;
    const overPicks = activeDateMatches.filter((m) => m.recommendation.includes('OVER')).length;
    const passPicks = activeDateMatches.filter(
      (m) =>
        m.recommendation === 'MARKET ALIGNED' ||
        m.recommendation.includes('PASS') ||
        m.recommendation.includes('FAIR')
    ).length;
    const highEdgeCount = activeDateMatches.filter((m) => Math.abs(m.edge) >= 4.0).length;
    return { total, underPicks, overPicks, passPicks, highEdgeCount };
  }, [activeDateMatches]);

  // Filtered matches
  const filteredMatches = useMemo(() => {
    return upcomingMatches.filter((match) => {
      if (selectedDate !== 'ALL' && match.date !== selectedDate) return false;

      const searchMatch =
        searchTerm === '' ||
        match.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.homeTeam.toLowerCase().includes(searchTerm.toLowerCase());
      if (!searchMatch) return false;

      if (filterMode === 'UNDER' && !match.recommendation.includes('UNDER')) return false;
      if (filterMode === 'OVER' && !match.recommendation.includes('OVER')) return false;
      if (filterMode === 'TOP_EDGE' && Math.abs(match.edge) < 4.0) return false;

      return true;
    });
  }, [upcomingMatches, searchTerm, filterMode, selectedDate]);

  const handleStartEditLine = (match: UpcomingMatch, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLineMatchId(match.id);
    setTempLineValue(String(match.sportsbookLine));
  };

  const handleSaveEditLine = (matchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const val = parseFloat(tempLineValue);
    if (!isNaN(val) && val > 150) {
      onUpdateSportsbookLine(matchId, val);
      if (selectedMatch && selectedMatch.id === matchId) {
        setSelectedMatch((prev) => (prev ? { ...prev, sportsbookLine: val } : null));
      }
    }
    setEditingLineMatchId(null);
  };

  const toggleExpand = (matchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedMatchId((prev) => (prev === matchId ? null : matchId));
  };

  // If a match is selected, render the dedicated Match Detail Page!
  if (selectedMatch) {
    const isCurrentTracked = trackedBets.some((b) => b.matchId === selectedMatch.id);
    const currentMatchObj = upcomingMatches.find((m) => m.id === selectedMatch.id) || selectedMatch;

    return (
      <MatchDetailPage
        match={currentMatchObj}
        onBack={() => setSelectedMatch(null)}
        onTrackBet={onTrackBet}
        onSendToAnalyzer={onSendToAnalyzer}
        isTracked={isCurrentTracked}
        onUpdateSportsbookLine={(matchId, newLine) => {
          onUpdateSportsbookLine(matchId, newLine);
          setSelectedMatch((prev) => (prev ? { ...prev, sportsbookLine: newLine } : null));
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Optional Sleek Partner Odds Strip (Dismissible) */}
      <AdBanner variant="leaderboard" />

      {/* 2. Hero Authority Banner: Compact on Mobile, Rich on Desktop */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#0a1122] to-blue-950 border border-slate-800 text-white p-3.5 sm:p-6 shadow-sm">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2.5 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-[11px] sm:text-xs font-bold tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>2024–25 Quant Model · Live ESPN Odds</span>
            </div>
            {lastSyncTime && (
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                ESPN Synced: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <div>
            <h2 className="text-base sm:text-2xl font-black tracking-tight text-white m-0">
              NBA Over/Under Projections &amp; Edge Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl m-0 mt-1 hidden sm:block">
              Calibrated across <strong className="text-white">6,000 completed NBA games</strong> using pace-adjusted ratings, referee tendencies, and the proprietary <strong className="text-blue-300">Rule of 47</strong> quarter floor.
            </p>
          </div>

          {/* Mobile sleek stat chips (saves 150px on phone screens) */}
          <div className="flex sm:hidden items-center justify-between gap-1.5 text-[10px] font-mono pt-0.5 text-slate-300">
            <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
              <strong className="text-white font-bold">6,000+</strong> Games
            </span>
            <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
              MAE <strong className="text-emerald-400 font-bold">±9.77</strong>
            </span>
            <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
              Rule 47 <strong className="text-cyan-300 font-bold">85%</strong>
            </span>
            <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
              <strong className="text-blue-300 font-bold">100%</strong> Free
            </span>
          </div>

          {/* Desktop 4 Stat Proof Tiles */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3 backdrop-blur-xs">
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Historical DB</div>
              <div className="text-lg sm:text-2xl font-black font-mono text-white mt-0.5">6,000+</div>
              <div className="text-[11px] text-slate-400">Validated Games</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3 backdrop-blur-xs">
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Model MAE</div>
              <div className="text-lg sm:text-2xl font-black font-mono text-emerald-400 mt-0.5">±9.77 pts</div>
              <div className="text-[11px] text-slate-400">vs Books ±11.20</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3 backdrop-blur-xs">
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Rule of 47 Win %</div>
              <div className="text-lg sm:text-2xl font-black font-mono text-cyan-300 mt-0.5">85.2%</div>
              <div className="text-[11px] text-slate-400">Lowest Q &lt; 47</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3 backdrop-blur-xs">
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Feeds</div>
              <div className="text-lg sm:text-2xl font-black font-mono text-blue-400 mt-0.5">100% Free</div>
              <div className="text-[11px] text-slate-400">Zero Paywall</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Slate Command Center (Touch Date Ribbon + Quick Filters) */}
      <div className="bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-[#1c2438] rounded-2xl p-2.5 sm:p-4 shadow-xs space-y-2.5 sm:space-y-3 transition-colors">
        {/* Date Selector Ribbon First */}
        {uniqueDates.length > 0 && (
          <div className="flex items-stretch gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar snap-x">
            {/* All Games Card */}
            <button
              onClick={() => setSelectedDate('ALL')}
              className={`snap-start shrink-0 min-w-[70px] sm:min-w-[88px] px-2.5 py-1.5 rounded-xl border flex flex-col items-center justify-between transition-all cursor-pointer ${
                selectedDate === 'ALL'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-500/30'
                  : 'bg-slate-50 dark:bg-[#141b2b] text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-[#222c42] hover:border-blue-400'
              }`}
            >
              <span className={`text-[9px] font-black uppercase tracking-wider ${selectedDate === 'ALL' ? 'text-blue-100' : 'text-slate-400'}`}>
                FULL
              </span>
              <span className="text-xs sm:text-sm font-black my-0.5 whitespace-nowrap">
                All Slate
              </span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                selectedDate === 'ALL'
                  ? 'bg-blue-700/80 text-white'
                  : 'bg-slate-200/80 dark:bg-[#1c2438] text-slate-600 dark:text-zinc-400'
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
                  className={`snap-start shrink-0 min-w-[72px] sm:min-w-[90px] px-2.5 py-1.5 rounded-xl border flex flex-col items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-500/30'
                      : 'bg-slate-50 dark:bg-[#141b2b] text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-[#222c42] hover:border-blue-400'
                  }`}
                >
                  <span className={`text-[9px] font-black tracking-wider flex items-center gap-1 ${
                    isSelected ? 'text-blue-100' : isToday ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-400'
                  }`}>
                    {isToday && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                    {weekday}
                  </span>
                  <span className="text-xs sm:text-sm font-black my-0.5 whitespace-nowrap">
                    {monthDay}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected
                      ? 'bg-blue-700/80 text-white'
                      : 'bg-slate-200/80 dark:bg-[#1c2438] text-slate-600 dark:text-zinc-400'
                  }`}>
                    {count} {count === 1 ? 'Game' : 'Games'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Filters, Search & Signal Tallies */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-[#1a2337]">
          {/* Signal summary pills */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono flex-wrap">
            <span className="font-bold text-slate-700 dark:text-zinc-300 mr-0.5">
              {selectedDate === 'ALL'
                ? 'All Games'
                : selectedDate === todayEasternStr
                ? "Today's Slate"
                : formatDateLabel(selectedDate)}:
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 font-bold">
              {slateStats.underPicks} Under
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 font-bold">
              {slateStats.overPicks} Over
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#141b2b] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#222c42]">
              {slateStats.passPicks} Fair
            </span>
          </div>

          {/* Quick Filters & Search */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-slate-100 dark:bg-[#141b2b] border border-slate-200 dark:border-[#222c42] rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterMode === 'ALL'
                    ? 'bg-white dark:bg-[#1c2438] text-slate-900 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                All ({slateStats.total})
              </button>
              <button
                onClick={() => setFilterMode('TOP_EDGE')}
                className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-0.5 ${
                  filterMode === 'TOP_EDGE'
                    ? 'bg-blue-600 dark:bg-amber-500/25 text-white dark:text-amber-300 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                <Flame className="h-3 w-3" />
                <span>Edge ({slateStats.highEdgeCount})</span>
              </button>
              <button
                onClick={() => setFilterMode('UNDER')}
                className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterMode === 'UNDER'
                    ? 'bg-emerald-600 dark:bg-emerald-500/25 text-white dark:text-emerald-300 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                Under
              </button>
              <button
                onClick={() => setFilterMode('OVER')}
                className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterMode === 'OVER'
                    ? 'bg-rose-600 dark:bg-rose-500/25 text-white dark:text-rose-300 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                Over
              </button>
            </div>

            {/* Compact Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-24 sm:w-36 bg-slate-50 dark:bg-[#141b2b] border border-slate-200 dark:border-[#222c42] rounded-xl pl-7 pr-2 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white transition-colors"
              />
            </div>

            {/* Refresh Button */}
            {onRefreshSchedule ? (
              <button
                onClick={onRefreshSchedule}
                disabled={isSyncingSchedule}
                className="p-1 rounded-xl bg-slate-50 dark:bg-[#141b2b] border border-slate-200 dark:border-[#222c42] text-slate-600 dark:text-zinc-400 hover:text-blue-600 transition-colors cursor-pointer disabled:opacity-50"
                title="Sync schedule"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncingSchedule ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            ) : (
              <button
                onClick={onOpenSync}
                className="p-1 rounded-xl bg-slate-50 dark:bg-[#141b2b] border border-slate-200 dark:border-[#222c42] text-slate-600 dark:text-zinc-400 hover:text-blue-600 transition-colors cursor-pointer"
                title="Refresh schedule"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Match Cards: Clickable with In-Feed Sponsored Revenue Unit */}
      {filteredMatches.length === 0 ? (
        <div className="bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-[#1c2438] rounded-2xl p-8 text-center text-slate-500 dark:text-zinc-400 text-xs shadow-xs">
          No matches found for your current filter. Try selecting &quot;All&quot; or clearing your search.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((match, index) => {
            const away = getTeamProfile(match.awayTeam);
            const home = getTeamProfile(match.homeTeam);

            const isUnder = match.edge <= -3.0;
            const isLeanUnder = match.edge > -3.0 && match.edge <= -1.5;
            const isOver = match.edge >= 3.0;
            const isLeanOver = match.edge < 3.0 && match.edge >= 1.5;
            const isPass = Math.abs(match.edge) < 1.5;

            const isTracked = trackedBets.some((b) => b.matchId === match.id);
            const isExpanded = expandedMatchId === match.id;
            const isEditingLine = editingLineMatchId === match.id;

            return (
              <React.Fragment key={match.id}>
                {/* In-feed native sponsored card: appear once after game 4 to avoid ad fatigue */}
                {index === 3 && (
                  <AdBanner variant="native-card" className="my-1.5" />
                )}

                <div
                  onClick={() => setSelectedMatch(match)}
                  className="relative bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-[#1c2438] hover:border-blue-400/80 dark:hover:border-blue-500/50 hover:shadow-lg rounded-2xl transition-all duration-200 shadow-xs cursor-pointer group overflow-hidden"
                  title="Click to open dedicated match page with stats and news"
                >
                  {/* Subtle left conviction indicator strip */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${
                      isUnder
                        ? 'bg-emerald-500'
                        : isOver
                        ? 'bg-rose-500'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  />

                  {/* Main Match Row */}
                  <div className="p-3 sm:p-4 pl-3.5 sm:pl-5 space-y-2.5 xl:space-y-0 xl:flex xl:items-center xl:justify-between xl:gap-4">
                    {/* 1. Teams Matchup & Tipoff */}
                    <div className="flex items-center justify-between gap-2 xl:min-w-[280px]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex items-center -space-x-2 shrink-0">
                          <img
                            src={away.logo}
                            alt={away.name}
                            className="h-8 w-8 sm:h-9 sm:w-9 object-contain bg-slate-50 dark:bg-[#141b2b] rounded-xl p-1 border border-slate-200/90 dark:border-[#222c42] shadow-2xs"
                          />
                          <img
                            src={home.logo}
                            alt={home.name}
                            className="h-8 w-8 sm:h-9 sm:w-9 object-contain bg-slate-50 dark:bg-[#141b2b] rounded-xl p-1 border border-slate-200/90 dark:border-[#222c42] shadow-2xs"
                          />
                        </div>

                        <div className="min-w-0 truncate">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-black text-slate-900 dark:text-white text-sm sm:text-base tracking-tight truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {away.shortName} <span className="text-slate-400 font-normal text-xs">@</span> {home.shortName}
                            </span>
                            <span className="text-[10px] font-sans font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                              Hub ↗
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono truncate">
                            {away.abbreviation} ({match.awayRecord}) • {home.abbreviation} ({match.homeRecord})
                          </div>
                        </div>
                      </div>

                      {/* Tipoff / Live Pill */}
                      <div className="shrink-0 text-right">
                        {match.status === 'Live' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                            LIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-slate-100 dark:bg-[#141b2b] text-slate-600 dark:text-zinc-400 border border-slate-200/80 dark:border-[#222c42] whitespace-nowrap">
                            {formatDateLabel(match.date)} · {match.time}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 2. Compact 3-Column Quant Metrics Box */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="grid grid-cols-3 gap-1 py-1.5 px-3 sm:px-4 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-slate-200/80 dark:border-[#1e273d] xl:w-auto"
                    >
                      {/* Market Line */}
                      <div className="text-center">
                        <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                          Market Line
                        </div>
                        <div className="mt-0.5">
                          {isEditingLine ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="0.5"
                                value={tempLineValue}
                                onChange={(e) => setTempLineValue(e.target.value)}
                                className="w-14 bg-white dark:bg-[#141b2b] border border-blue-500 dark:border-amber-400 rounded px-1 text-xs font-mono text-slate-900 dark:text-white text-center font-bold"
                                autoFocus
                              />
                              <button
                                onClick={(e) => handleSaveEditLine(match.id, e)}
                                className="p-0.5 text-emerald-600 dark:text-emerald-400"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => handleStartEditLine(match, e)}
                              className="font-mono text-sm sm:text-lg font-black text-slate-900 dark:text-amber-300 hover:text-blue-600 transition-colors cursor-pointer group flex items-center justify-center gap-1 mx-auto"
                              title="Click to edit line"
                            >
                              <span>{match.sportsbookLine.toFixed(1)}</span>
                              <span className="text-[9px] text-slate-400 underline font-sans font-normal">
                                edit
                              </span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Model Total */}
                      <div className="text-center border-x border-slate-200/80 dark:border-[#1e273d]">
                        <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                          Model Total
                        </div>
                        <div className="font-mono text-sm sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                          {match.modelProjectedTotal.toFixed(1)}
                        </div>
                      </div>

                      {/* Point Edge */}
                      <div className="text-center">
                        <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                          Point Edge
                        </div>
                        <div
                          className={`font-mono text-sm sm:text-lg font-black mt-0.5 ${
                            match.edge <= -3.0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : match.edge >= 3.0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          {match.edge > 0 ? `+${match.edge.toFixed(1)}` : match.edge.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    {/* 3. Single-Row Action Bar (Verdict + Actions, Never Wraps) */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-between gap-1.5 pt-0.5 xl:pt-0 xl:gap-2.5"
                    >
                      {/* Pick Verdict Badge */}
                      <div className="min-w-0 flex-1">
                        {isUnder || isLeanUnder ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200">
                            <TrendingDown className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div className="text-xs font-black font-mono truncate">
                              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mr-1 hidden sm:inline">
                                {isUnder ? 'BET' : 'LEAN'}
                              </span>
                              UNDER {match.sportsbookLine}
                            </div>
                          </div>
                        ) : isOver || isLeanOver ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200">
                            <TrendingUp className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                            <div className="text-xs font-black font-mono truncate">
                              <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 mr-1 hidden sm:inline">
                                {isOver ? 'BET' : 'LEAN'}
                              </span>
                              OVER {match.sportsbookLine}
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 dark:bg-[#141b2b] border border-slate-200 dark:border-[#222c42] text-slate-600 dark:text-zinc-400 text-xs font-mono font-bold">
                            PASS / FAIR LINE
                          </div>
                        )}
                      </div>

                      {/* Button Group */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!isPass && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTrackBet(match, match.edge < 0 ? 'UNDER' : 'OVER');
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              isTracked
                                ? 'bg-slate-100 dark:bg-[#141b2b] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#222c42]'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {isTracked ? (
                              <>
                                <BookmarkCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span className="hidden sm:inline">Tracked</span>
                              </>
                            ) : (
                              <>
                                <BookmarkPlus className="h-3.5 w-3.5" />
                                <span>+ Track</span>
                              </>
                            )}
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSendToAnalyzer(match);
                          }}
                          className="p-1 sm:px-2.5 sm:py-1 rounded-lg bg-slate-100 dark:bg-[#141b2b] hover:bg-slate-200 dark:hover:bg-[#1c2438] text-slate-700 dark:text-zinc-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 border border-slate-200 dark:border-[#222c42]"
                          title="Open in Matchup Analyzer"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-600 dark:text-amber-400" />
                          <span className="hidden sm:inline">Analyze</span>
                        </button>

                        <button
                          onClick={(e) => toggleExpand(match.id, e)}
                          className="p-1 rounded-lg text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141b2b] transition-colors cursor-pointer"
                          title="Toggle quick preview notes"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Details Drawer */}
                  {isExpanded && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50/90 dark:bg-[#070b14] border-t border-slate-200/90 dark:border-[#1c2438] text-xs sm:text-sm space-y-2.5 font-sans"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3 text-xs font-mono text-slate-700 dark:text-zinc-300 flex-wrap">
                          <span>
                            Projected Lowest Quarter:{' '}
                            <strong className="text-blue-700 dark:text-amber-400">
                              {match.projectedLowestQuarter} pts
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Rule of 47 Check:{' '}
                            <strong
                              className={
                                match.projectedLowestQuarter < 47
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-amber-700 dark:text-amber-400'
                              }
                            >
                              {match.projectedLowestQuarter < 47
                                ? 'YES (<47) - 91% Under Pattern'
                                : 'NO (≥47)'}
                            </strong>
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                          Pace: {away.paceRating} vs {home.paceRating} • Def Rtg:{' '}
                          {away.defensiveRating} vs {home.defensiveRating}
                        </div>
                      </div>

                      <p className="text-slate-700 dark:text-zinc-300 leading-relaxed m-0 text-xs sm:text-sm bg-white dark:bg-[#0c1220] p-3 rounded-xl border border-slate-200/90 dark:border-[#1c2438] shadow-2xs">
                        <span className="font-bold text-slate-900 dark:text-zinc-200">Why this pick: </span>
                        {match.keyNarrative}
                      </p>
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default PicksBoardTab;
