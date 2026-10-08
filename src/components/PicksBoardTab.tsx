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
    <div className="space-y-3.5">
      {/* 1. Revenue Header Banner: Leaderboard Ad Placement */}
      <AdBanner variant="leaderboard" />

      {/* 2. Official ESPN Schedule Status & Date Calendar Navigation */}
      <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-3 shadow-xs space-y-2.5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-slate-900 dark:text-zinc-100">
              Official ESPN NBA Schedule
            </span>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">
              • Verified Live Feed
            </span>
          </div>

          <div className="flex items-center gap-2">
            {lastSyncTime && (
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                Updated: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {onRefreshSchedule && (
              <button
                onClick={onRefreshSchedule}
                disabled={isSyncingSchedule}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncingSchedule ? 'animate-spin' : ''}`} />
                <span>{isSyncingSchedule ? 'Syncing...' : 'Sync ESPN Schedule'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Date Selector Pills (Calendar navigation) */}
        {uniqueDates.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
            <div className="flex items-center gap-1 text-slate-400 dark:text-zinc-500 mr-1 text-[11px] shrink-0 font-medium">
              <Calendar className="h-3 w-3 text-blue-600 dark:text-amber-400" />
              <span>Select Date:</span>
            </div>
            <button
              onClick={() => setSelectedDate('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium text-xs whitespace-nowrap transition-colors cursor-pointer ${
                selectedDate === 'ALL'
                  ? 'bg-blue-600 dark:bg-amber-500/20 text-white dark:text-amber-300 font-bold border border-blue-600 dark:border-amber-500/40 shadow-2xs'
                  : 'bg-slate-100 dark:bg-[#090d16] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#1c2438] hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              All Slate ({upcomingMatches.length})
            </button>
            {uniqueDates.map((dateStr) => {
              const count = upcomingMatches.filter((m) => m.date === dateStr).length;
              const label = formatDateLabel(dateStr);
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`px-2.5 py-1 rounded-lg font-medium text-xs whitespace-nowrap transition-colors cursor-pointer ${
                    selectedDate === dateStr
                      ? 'bg-blue-600 dark:bg-amber-500/20 text-white dark:text-amber-300 font-bold border border-blue-600 dark:border-amber-500/40 shadow-2xs'
                      : 'bg-slate-100 dark:bg-[#090d16] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#1c2438] hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Sleek, Professional Slate Toolbar - Right above the fold */}
      <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs transition-colors duration-200">
        {/* Left: Slate Title & Quick Counter Strip */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-200">
              {selectedDate === 'ALL'
                ? 'All Upcoming Matches'
                : selectedDate === todayEasternStr
                ? "Today's Match Slate"
                : `${formatDateLabel(selectedDate)} Slate`}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
              ({slateStats.total} Games)
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-[#1c2438] hidden sm:block"></div>

          {/* Compact summary badges */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 font-bold">
              {slateStats.underPicks} UNDER
            </span>
            <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 font-bold">
              {slateStats.overPicks} OVER
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#090d16] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#1c2438]">
              {slateStats.passPicks} FAIR
            </span>
          </div>
        </div>

        {/* Center/Right: Quick Filter Tabs & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-[#090d16] border border-slate-200 dark:border-[#1c2438] rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterMode === 'ALL'
                  ? 'bg-white dark:bg-[#182033] text-slate-900 dark:text-white font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              All ({slateStats.total})
            </button>
            <button
              onClick={() => setFilterMode('TOP_EDGE')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filterMode === 'TOP_EDGE'
                  ? 'bg-blue-600 dark:bg-amber-500/20 text-white dark:text-amber-300 border border-transparent dark:border-amber-500/40 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Flame className={`h-3 w-3 ${filterMode === 'TOP_EDGE' ? 'text-white dark:text-amber-400' : 'text-blue-600 dark:text-zinc-400'}`} />
              High Edge ({slateStats.highEdgeCount})
            </button>
            <button
              onClick={() => setFilterMode('UNDER')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterMode === 'UNDER'
                  ? 'bg-emerald-600 dark:bg-emerald-500/20 text-white dark:text-emerald-300 border border-transparent dark:border-emerald-500/40 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              Under ({slateStats.underPicks})
            </button>
            <button
              onClick={() => setFilterMode('OVER')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterMode === 'OVER'
                  ? 'bg-rose-600 dark:bg-rose-500/20 text-white dark:text-rose-300 border border-transparent dark:border-rose-500/40 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              Over ({slateStats.overPicks})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search teams..."
              className="w-36 sm:w-44 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1c2438] rounded-lg pl-8 pr-3 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:bg-white dark:focus:bg-[#090d16] focus:border-blue-500 dark:focus:border-amber-400 transition-colors"
            />
          </div>

          <button
            onClick={onOpenSync}
            className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1c2438] text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#121829] transition-colors cursor-pointer"
            title="Refresh Live Odds & Schedule"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Match Cards: Clickable with In-Feed Sponsored Revenue Unit */}
      {filteredMatches.length === 0 ? (
        <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-8 text-center text-slate-500 dark:text-zinc-400 text-xs shadow-xs">
          No matches found for your current filter. Try resetting search or selecting "All".
        </div>
      ) : (
        <div className="space-y-2.5">
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
                {/* In-feed native sponsored card between match rows */}
                {(index === 2 || (index > 2 && (index + 1) % 5 === 0)) && (
                  <AdBanner variant="native-card" className="my-1.5" />
                )}

                <div
                  onClick={() => setSelectedMatch(match)}
                  className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] hover:border-blue-300 dark:hover:border-[#2b3754] hover:bg-slate-50/50 dark:hover:bg-[#121829] hover:shadow-md rounded-xl transition-all shadow-xs cursor-pointer group"
                  title="Click to open dedicated match page with stats and news"
                >
                  {/* Main Match Row */}
                  <div className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Left: Teams & Tipoff */}
                    <div className="flex items-center gap-3.5 min-w-[280px]">
                      {/* Team Logos */}
                      <div className="flex items-center -space-x-2 shrink-0">
                        <img
                          src={away.logo}
                          alt={away.name}
                          className="h-9 w-9 object-contain bg-slate-50 dark:bg-[#090d16] rounded-lg p-1 border border-slate-200 dark:border-[#1c2438] shadow-2xs"
                        />
                        <img
                          src={home.logo}
                          alt={home.name}
                          className="h-9 w-9 object-contain bg-slate-50 dark:bg-[#090d16] rounded-lg p-1 border border-slate-200 dark:border-[#1c2438] shadow-2xs"
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-blue-600 dark:group-hover:text-amber-300 transition-colors">
                            {away.shortName} <span className="text-slate-400 dark:text-zinc-500 font-normal text-xs">@</span> {home.shortName}
                          </span>
                          {match.status === 'Live' ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/40 animate-pulse">
                              LIVE
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                              {formatDateLabel(match.date)} · {match.time}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <span>{away.abbreviation} ({match.awayRecord}) • {home.abbreviation} ({match.homeRecord})</span>
                          <span className="text-[10px] text-blue-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity font-sans font-semibold">
                            • Match Hub &amp; News ↗
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: The Core Quant Numbers Grid */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="grid grid-cols-3 gap-2 sm:gap-4 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1c2438] rounded-lg p-2 sm:px-4 sm:py-2 shrink-0"
                    >
                      {/* Market Line */}
                      <div className="text-center">
                        <div className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
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
                                className="w-14 bg-white dark:bg-[#141b2b] border border-blue-500 dark:border-amber-400 rounded px-1 text-xs font-mono text-slate-900 dark:text-white text-center"
                                autoFocus
                              />
                              <button
                                onClick={(e) => handleSaveEditLine(match.id, e)}
                                className="p-0.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => handleStartEditLine(match, e)}
                              className="font-mono text-base font-bold text-slate-900 dark:text-amber-300 hover:text-blue-600 dark:hover:text-amber-200 transition-colors cursor-pointer group flex items-center justify-center gap-1 mx-auto"
                              title="Click to edit sportsbook line"
                            >
                              <span>{match.sportsbookLine.toFixed(1)}</span>
                              <span className="text-[9px] text-slate-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-amber-400 underline font-sans font-normal">
                                edit
                              </span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Model Projection */}
                      <div className="text-center border-x border-slate-200 dark:border-[#1c2438]">
                        <div className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                          Model Total
                        </div>
                        <div className="font-mono text-base font-bold text-slate-900 dark:text-white mt-0.5">
                          {match.modelProjectedTotal.toFixed(1)}
                        </div>
                      </div>

                      {/* Discrepancy / Edge */}
                      <div className="text-center">
                        <div className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                          Point Edge
                        </div>
                        <div
                          className={`font-mono text-base font-bold mt-0.5 ${
                            match.edge <= -3.0
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : match.edge >= 3.0
                              ? 'text-rose-700 dark:text-rose-400'
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
                      className="flex items-center gap-2 justify-between lg:justify-end flex-wrap"
                    >
                      {/* The Primary Pick Verdict Badge */}
                      {isUnder || isLeanUnder ? (
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-500/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 shadow-2xs">
                          <TrendingDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                              {isUnder ? 'HIGH CONVICTION' : 'LEAN'}
                            </div>
                            <div className="text-xs font-black font-mono text-emerald-950 dark:text-white">
                              BET UNDER {match.sportsbookLine}
                            </div>
                          </div>
                        </div>
                      ) : isOver || isLeanOver ? (
                        <div className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 border border-rose-300 dark:border-rose-500/60 text-rose-800 dark:text-rose-300 flex items-center gap-2 shadow-2xs">
                          <TrendingUp className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                          <div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                              {isOver ? 'HIGH CONVICTION' : 'LEAN'}
                            </div>
                            <div className="text-xs font-black font-mono text-rose-950 dark:text-white">
                              BET OVER {match.sportsbookLine}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#090d16] border border-slate-200 dark:border-[#1c2438] text-slate-700 dark:text-zinc-400">
                          <div className="text-[9px] uppercase font-bold tracking-wider text-slate-500 dark:text-zinc-500">
                            EFFICIENT
                          </div>
                          <div className="text-xs font-bold text-slate-800 dark:text-zinc-300 font-mono">
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isTracked
                              ? 'bg-slate-100 dark:bg-[#182033] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#222c42]'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                          }`}
                        >
                          {isTracked ? (
                            <>
                              <BookmarkCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Tracked</span>
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="h-3.5 w-3.5" />
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
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#141b2a] hover:bg-slate-200 dark:hover:bg-[#1a2336] text-slate-700 dark:text-zinc-200 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 border border-slate-200 dark:border-[#222c42]"
                        title="Open in Matchup Analyzer"
                      >
                        <SlidersHorizontal className="h-3 w-3 text-slate-600 dark:text-amber-400" />
                        <span className="hidden sm:inline">Analyze</span>
                      </button>

                      {/* Details Toggle */}
                      <button
                        onClick={(e) => toggleExpand(match.id, e)}
                        className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
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
                      className="px-4 py-3 bg-slate-50 dark:bg-[#090d16] border-t border-slate-200 dark:border-[#1c2438] text-xs space-y-2 font-sans"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-700 dark:text-zinc-300">
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

                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                          Pace: {away.paceRating} vs {home.paceRating} • Def Rtg:{' '}
                          {away.defensiveRating} vs {home.defensiveRating}
                        </div>
                      </div>

                      <p className="text-slate-700 dark:text-zinc-300 leading-relaxed m-0 text-xs bg-white dark:bg-[#0f1422] p-2.5 rounded-lg border border-slate-200 dark:border-[#1c2438] shadow-2xs">
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
