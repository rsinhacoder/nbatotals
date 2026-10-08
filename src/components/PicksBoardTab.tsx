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

      {/* 2. Hero Authority Banner: Professional Quant Brand Anchor */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#0a1122] to-blue-950 border border-slate-800 text-white p-4 sm:p-6 shadow-md">
        {/* Ambient Glow Accents */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>2024–25 Quant Model · Live ESPN Odds</span>
            </div>
            {lastSyncTime && (
              <span className="text-xs text-slate-400 font-mono">
                ESPN Synced: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white m-0">
              NBA Over/Under Projections &amp; Edge Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl m-0">
              Calibrated across <strong className="text-white">6,000 completed NBA games</strong> using pace-adjusted offensive/defensive ratings, referee scoring tendencies, and the proprietary <strong className="text-blue-300">Rule of 47</strong> quarter floor.
            </p>
          </div>

          {/* 4 Stat Proof Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
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

      {/* 3. Slate Command Center (Touch-First Date Ribbon + Filters + Search) */}
      <div className="bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-[#1c2438] rounded-2xl p-3 sm:p-5 shadow-xs space-y-4 transition-colors">
        {/* Top Command Strip: Slate Title, Summary Badges, Filters & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Slate Title & Quantitative Signal Tallies */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#141b2b] px-3 py-1.5 rounded-full border border-slate-200 dark:border-[#222c42]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                {selectedDate === 'ALL'
                  ? 'All Upcoming Matches'
                  : selectedDate === todayEasternStr
                  ? "Today's Slate"
                  : `${formatDateLabel(selectedDate)}`}
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 font-semibold">
                ({slateStats.total} Games)
              </span>
            </div>

            {/* Quick Signal Counts */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 font-bold">
                {slateStats.underPicks} UNDER
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 font-bold">
                {slateStats.overPicks} OVER
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#141b2b] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#222c42]">
                {slateStats.passPicks} FAIR
              </span>
            </div>
          </div>

          {/* Right: Quick Filter Tabs & Search & Live ESPN Sync */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Pills */}
            <div className="flex items-center bg-slate-100 dark:bg-[#141b2b] border border-slate-200 dark:border-[#222c42] rounded-xl p-0.5 text-xs sm:text-sm">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterMode === 'ALL'
                    ? 'bg-white dark:bg-[#1c2438] text-slate-900 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                All ({slateStats.total})
              </button>
              <button
                onClick={() => setFilterMode('TOP_EDGE')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  filterMode === 'TOP_EDGE'
                    ? 'bg-blue-600 dark:bg-amber-500/25 text-white dark:text-amber-300 border border-transparent dark:border-amber-500/40 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <Flame className={`h-3.5 w-3.5 ${filterMode === 'TOP_EDGE' ? 'text-white dark:text-amber-400' : 'text-blue-600 dark:text-zinc-400'}`} />
                Top Edge ({slateStats.highEdgeCount})
              </button>
              <button
                onClick={() => setFilterMode('UNDER')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterMode === 'UNDER'
                    ? 'bg-emerald-600 dark:bg-emerald-500/25 text-white dark:text-emerald-300 border border-transparent dark:border-emerald-500/40 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                Under ({slateStats.underPicks})
              </button>
              <button
                onClick={() => setFilterMode('OVER')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterMode === 'OVER'
                    ? 'bg-rose-600 dark:bg-rose-500/25 text-white dark:text-rose-300 border border-transparent dark:border-rose-500/40 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                Over ({slateStats.overPicks})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 dark:text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search teams..."
                className="w-36 sm:w-44 bg-slate-50 dark:bg-[#141b2b] border border-slate-200 dark:border-[#222c42] rounded-xl pl-9 pr-3 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:bg-white dark:focus:bg-[#141b2b] focus:border-blue-500 dark:focus:border-amber-400 transition-colors"
              />
            </div>

            {/* Live Refresh Button */}
            {onRefreshSchedule ? (
              <button
                onClick={onRefreshSchedule}
                disabled={isSyncingSchedule}
                className="p-2 rounded-xl bg-slate-50 dark:bg-[#141b2b] border border-slate-200 dark:border-[#222c42] text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#1c2438] transition-colors cursor-pointer disabled:opacity-50"
                title={lastSyncTime ? `ESPN Sync: ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Sync ESPN Schedule'}
              >
                <RefreshCw className={`h-4 w-4 ${isSyncingSchedule ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            ) : (
              <button
                onClick={onOpenSync}
                className="p-2 rounded-xl bg-slate-50 dark:bg-[#141b2b] border border-slate-200 dark:border-[#222c42] text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#1c2438] transition-colors cursor-pointer"
                title="Refresh Live Odds & Schedule"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* 4. Touch-First Mobile Calendar Day Ribbon */}
        {uniqueDates.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-[#1a2337] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider px-0.5">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
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
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/30'
                    : 'bg-slate-50 dark:bg-[#141b2b] text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-[#222c42] hover:border-blue-400 hover:bg-white dark:hover:bg-[#1c2438]'
                }`}
              >
                <span className={`text-[10px] font-black uppercase tracking-wider ${selectedDate === 'ALL' ? 'text-blue-100' : 'text-slate-500 dark:text-zinc-400'}`}>
                  FULL
                </span>
                <span className="text-sm font-black my-0.5 whitespace-nowrap">
                  All Slate
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
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
                    className={`snap-start shrink-0 min-w-[82px] sm:min-w-[100px] px-3 py-2 rounded-xl border flex flex-col items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/30'
                        : 'bg-slate-50 dark:bg-[#141b2b] text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-[#222c42] hover:border-blue-400 hover:bg-white dark:hover:bg-[#1c2438]'
                    }`}
                  >
                    <span className={`text-[10px] font-black tracking-wider flex items-center gap-1 ${
                      isSelected ? 'text-blue-100' : isToday ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-500 dark:text-zinc-400'
                    }`}>
                      {isToday && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                      {weekday}
                    </span>
                    <span className="text-sm font-black my-0.5 whitespace-nowrap">
                      {monthDay}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
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
          </div>
        )}
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
                  <div className="p-3.5 sm:p-5 pl-4 sm:pl-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    {/* Left: Teams & Tipoff */}
                    <div className="flex items-center gap-3.5 w-full xl:w-auto min-w-0">
                      {/* Team Logos */}
                      <div className="flex items-center -space-x-2.5 shrink-0">
                        <img
                          src={away.logo}
                          alt={away.name}
                          className="h-11 w-11 sm:h-12 sm:w-12 object-contain bg-slate-50 dark:bg-[#141b2b] rounded-2xl p-1.5 border border-slate-200/90 dark:border-[#222c42] shadow-xs"
                        />
                        <img
                          src={home.logo}
                          alt={home.name}
                          className="h-11 w-11 sm:h-12 sm:w-12 object-contain bg-slate-50 dark:bg-[#141b2b] rounded-2xl p-1.5 border border-slate-200/90 dark:border-[#222c42] shadow-xs"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-slate-900 dark:text-white text-base sm:text-lg lg:text-xl tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {away.shortName} <span className="text-slate-400 dark:text-zinc-500 font-normal text-sm">@</span> {home.shortName}
                          </span>
                          {match.status === 'Live' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
                              LIVE
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-100 dark:bg-[#141b2b] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#222c42]">
                              {formatDateLabel(match.date)} · {match.time}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-1 flex items-center gap-2 flex-wrap">
                          <span>{away.abbreviation} ({match.awayRecord}) • {home.abbreviation} ({match.homeRecord})</span>
                          <span className="text-xs font-sans font-bold text-blue-600 dark:text-blue-400 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            Match Hub ↗
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: The Core Quant Numbers Grid */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="w-full xl:w-auto grid grid-cols-3 gap-2 sm:gap-6 bg-slate-50/90 dark:bg-[#070b14] border border-slate-200/90 dark:border-[#1e273d] rounded-2xl p-3 sm:px-5 sm:py-3.5"
                    >
                      {/* Market Line */}
                      <div className="text-center">
                        <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                          Market Line
                        </div>
                        <div className="mt-1">
                          {isEditingLine ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="0.5"
                                value={tempLineValue}
                                onChange={(e) => setTempLineValue(e.target.value)}
                                className="w-16 bg-white dark:bg-[#141b2b] border border-blue-500 dark:border-amber-400 rounded-lg px-1.5 py-0.5 text-sm font-mono text-slate-900 dark:text-white text-center font-bold"
                                autoFocus
                              />
                              <button
                                onClick={(e) => handleSaveEditLine(match.id, e)}
                                className="p-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => handleStartEditLine(match, e)}
                              className="font-mono text-lg sm:text-2xl font-black text-slate-900 dark:text-amber-300 hover:text-blue-600 dark:hover:text-amber-200 transition-colors cursor-pointer group flex items-center justify-center gap-1 mx-auto"
                              title="Click to edit sportsbook line"
                            >
                              <span>{match.sportsbookLine.toFixed(1)}</span>
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-amber-400 underline font-sans font-normal">
                                edit
                              </span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Model Projection */}
                      <div className="text-center border-x border-slate-200/90 dark:border-[#1e273d]">
                        <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                          Model Total
                        </div>
                        <div className="font-mono text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                          {match.modelProjectedTotal.toFixed(1)}
                        </div>
                      </div>

                      {/* Discrepancy / Edge */}
                      <div className="text-center">
                        <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                          Point Edge
                        </div>
                        <div
                          className={`font-mono text-lg sm:text-2xl font-black mt-1 ${
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

                    {/* Right: Sharp Actionable Recommendation & Buttons */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="w-full xl:w-auto flex items-center gap-2.5 justify-between xl:justify-end flex-wrap"
                    >
                      {/* The Primary Pick Verdict Badge */}
                      {isUnder || isLeanUnder ? (
                        <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/15 to-emerald-500/5 dark:from-emerald-950/80 dark:to-emerald-900/60 border border-emerald-300 dark:border-emerald-500/60 text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5 shadow-2xs">
                          <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                              {isUnder ? 'HIGH CONVICTION' : 'LEAN'}
                            </div>
                            <div className="text-xs sm:text-sm font-black font-mono text-emerald-950 dark:text-white">
                              BET UNDER {match.sportsbookLine}
                            </div>
                          </div>
                        </div>
                      ) : isOver || isLeanOver ? (
                        <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-rose-500/10 via-rose-500/15 to-rose-500/5 dark:from-rose-950/80 dark:to-rose-900/60 border border-rose-300 dark:border-rose-500/60 text-rose-900 dark:text-rose-200 flex items-center gap-2.5 shadow-2xs">
                          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                              {isOver ? 'HIGH CONVICTION' : 'LEAN'}
                            </div>
                            <div className="text-xs sm:text-sm font-black font-mono text-rose-950 dark:text-white">
                              BET OVER {match.sportsbookLine}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-100 dark:bg-[#141b2b] border border-slate-200 dark:border-[#222c42] text-slate-700 dark:text-zinc-400">
                          <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-zinc-500">
                            MARKET EFFICIENT
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-300 font-mono">
                            PASS / FAIR LINE
                          </div>
                        </div>
                      )}

                      {/* Action Button: Track Bet */}
                      {!isPass && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTrackBet(match, match.edge < 0 ? 'UNDER' : 'OVER');
                          }}
                          className={`px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                            isTracked
                              ? 'bg-slate-100 dark:bg-[#141b2b] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#222c42]'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                          }`}
                        >
                          {isTracked ? (
                            <>
                              <BookmarkCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              <span>Tracked</span>
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="h-4 w-4" />
                              <span>+ Track</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Action Button: Deep Analyze */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendToAnalyzer(match);
                        }}
                        className="px-3.5 py-2 sm:py-2.5 rounded-xl bg-slate-100 dark:bg-[#141b2b] hover:bg-slate-200 dark:hover:bg-[#1c2438] text-slate-700 dark:text-zinc-200 text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-200 dark:border-[#222c42]"
                        title="Open in Matchup Analyzer"
                      >
                        <SlidersHorizontal className="h-4 w-4 text-slate-600 dark:text-amber-400" />
                        <span className="hidden sm:inline">Analyze</span>
                      </button>

                      {/* Details Toggle */}
                      <button
                        onClick={(e) => toggleExpand(match.id, e)}
                        className="p-2 sm:p-2.5 rounded-xl text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141b2b] transition-colors cursor-pointer"
                        title="Toggle quick preview notes"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
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
