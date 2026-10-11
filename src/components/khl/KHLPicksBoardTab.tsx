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
  Plane,
  PlaneLanding,
  Check,
} from 'lucide-react';
import type { KHLUpcomingMatch, KHLMarketEdge, KHLMarketType } from '../../types/khl';
import { getKHLTeamProfile } from '../../data/khlTeamProfiles';

interface KHLPicksBoardTabProps {
  upcomingMatches: KHLUpcomingMatch[];
  onTrackBet?: (match: KHLUpcomingMatch, market: KHLMarketEdge) => void;
  onSendToAnalyzer?: (match: KHLUpcomingMatch) => void;
  onRefreshSchedule?: () => void;
  isSyncingSchedule?: boolean;
}

export const KHLPicksBoardTab: React.FC<KHLPicksBoardTabProps> = ({
  upcomingMatches,
  onTrackBet,
  onSendToAnalyzer,
  onRefreshSchedule,
  isSyncingSchedule = false,
}) => {
  const todayEasternStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  }, []);

  const uniqueDates = useMemo(() => {
    return Array.from(new Set(upcomingMatches.map((m) => m.date))).sort();
  }, [upcomingMatches]);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const hasTodayGames = upcomingMatches.some((m) => m.date === todayEasternStr);
    if (hasTodayGames) return todayEasternStr;
    const sorted = Array.from(new Set(upcomingMatches.map((m) => m.date))).sort();
    return sorted.length > 0 ? sorted[0] : 'ALL';
  });

  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'HIGH_EV' | 'TOTALS' | 'PUCKLINE' | 'MONEYLINE' | 'REG_DRAW' | 'FIRST_PERIOD' | 'SOG'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

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

  const activeDateMatches = useMemo(() => {
    if (selectedDate === 'ALL') return upcomingMatches;
    return upcomingMatches.filter((m) => m.date === selectedDate);
  }, [upcomingMatches, selectedDate]);

  const slateStats = useMemo(() => {
    const total = activeDateMatches.length;
    const highEV = activeDateMatches.filter((m) => m.highestEdgeMarket.edgePercent >= 5.0).length;
    const underPicks = activeDateMatches.filter((m) => m.highestEdgeMarket.marketType === 'TOTAL_UNDER').length;
    const overPicks = activeDateMatches.filter((m) => m.highestEdgeMarket.marketType === 'TOTAL_OVER').length;
    const farEastGames = activeDateMatches.filter((m) => m.isFarEastTravel).length;
    return { total, highEV, underPicks, overPicks, farEastGames };
  }, [activeDateMatches]);

  const filteredMatches = useMemo(() => {
    return activeDateMatches.filter((match) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesTeam =
          match.awayTeam.toLowerCase().includes(q) ||
          match.homeTeam.toLowerCase().includes(q) ||
          match.awayAbbrev.toLowerCase().includes(q) ||
          match.homeAbbrev.toLowerCase().includes(q) ||
          match.city.toLowerCase().includes(q);
        if (!matchesTeam) return false;
      }

      if (selectedFilter === 'HIGH_EV') {
        return match.highestEdgeMarket.edgePercent >= 5.0;
      }
      if (selectedFilter === 'TOTALS') {
        return match.highestEdgeMarket.marketType.startsWith('TOTAL');
      }
      if (selectedFilter === 'PUCKLINE') {
        return match.highestEdgeMarket.marketType.startsWith('PUCKLINE');
      }
      if (selectedFilter === 'MONEYLINE') {
        return match.highestEdgeMarket.marketType.startsWith('MONEYLINE');
      }
      if (selectedFilter === 'REG_DRAW') {
        return match.highestEdgeMarket.marketType === 'REGULATION_DRAW';
      }
      if (selectedFilter === 'FIRST_PERIOD') {
        return match.highestEdgeMarket.marketType.startsWith('P1');
      }
      if (selectedFilter === 'SOG') {
        return match.highestEdgeMarket.marketType.startsWith('SOG');
      }
      return true;
    });
  }, [activeDateMatches, selectedFilter, searchTerm]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border border-teal-800/40 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                KONTINENTAL HOCKEY LEAGUE · QUANT MODEL
              </span>
              <span className="text-xs text-slate-300 font-mono">
                Bivariate Poisson · Travel Jet Lag Adjustment · 3-Way Regulation
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              KHL Model Edge Board
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Quantitative mathematical modeling across all 23 KHL franchises. Automatically accounts for European low-scoring defensive structures, starting goalies, and Far East travel fatigue.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onRefreshSchedule && (
              <button
                onClick={onRefreshSchedule}
                disabled={isSyncingSchedule}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSchedule ? 'animate-spin' : ''}`} />
                <span>{isSyncingSchedule ? 'Syncing...' : 'Sync Slate'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Interactive Calendar Date Selector */}
      <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Select KHL Slate Date:
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {activeDateMatches.length} Matches on Slate
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedDate('ALL')}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedDate === 'ALL'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>All Slates</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
              {upcomingMatches.length}
            </span>
          </button>

          {uniqueDates.map((dateStr) => {
            const isSelected = selectedDate === dateStr;
            const count = upcomingMatches.filter((m) => m.date === dateStr).length;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>{formatDateLabel(dateStr)}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-teal-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Slate Executive KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total Slate Games</span>
          <span className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
            {slateStats.total}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-500" /> High EV Picks (≥5%)
          </span>
          <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            {slateStats.highEV}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Under Model Picks</span>
          <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block">
            {slateStats.underPicks}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Over Model Picks</span>
          <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
            {slateStats.overPicks}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block flex items-center gap-1">
            <Plane className="w-3.5 h-3.5 text-blue-500" /> Far East Travel Slates
          </span>
          <span className="text-xl font-black font-mono text-blue-600 dark:text-blue-400 mt-0.5 block">
            {slateStats.farEastGames}
          </span>
        </div>
      </div>

      {/* 4. Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              selectedFilter === 'ALL'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            All Markets
          </button>
          <button
            onClick={() => setSelectedFilter('HIGH_EV')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${
              selectedFilter === 'HIGH_EV'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> High EV Edge
          </button>
          <button
            onClick={() => setSelectedFilter('TOTALS')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              selectedFilter === 'TOTALS'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Totals (O/U)
          </button>
          <button
            onClick={() => setSelectedFilter('PUCKLINE')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              selectedFilter === 'PUCKLINE'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Pucklines
          </button>
          <button
            onClick={() => setSelectedFilter('REG_DRAW')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              selectedFilter === 'REG_DRAW'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            3-Way Draws
          </button>
          <button
            onClick={() => setSelectedFilter('FIRST_PERIOD')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              selectedFilter === 'FIRST_PERIOD'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            1st Period
          </button>
          <button
            onClick={() => setSelectedFilter('SOG')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              selectedFilter === 'SOG'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Shots on Goal
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search KHL club or city..."
            className="w-full sm:w-52 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* 5. Match Cards Board */}
      <div className="space-y-4">
        {filteredMatches.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-xs">
            No KHL matches found matching your selected criteria.
          </div>
        ) : (
          filteredMatches.map((match) => {
            const isExpanded = expandedMatchId === match.id;
            const topEdge = match.highestEdgeMarket;
            const homeProf = getKHLTeamProfile(match.homeAbbrev);
            const awayProf = getKHLTeamProfile(match.awayAbbrev);

            return (
              <div
                key={match.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] shadow-xs overflow-hidden transition-all"
              >
                {/* Top Ribbon */}
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                      ❄️ KHL · {match.time}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {match.venue}
                    </span>
                    {match.isFarEastTravel && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <PlaneLanding className="w-3 h-3 text-amber-500" />
                        Far East Travel Fatigue (+7h Jet Lag)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      Model Proj: <strong className="text-indigo-600 dark:text-indigo-400">{match.modelProjectedTotal} Goals</strong>
                    </span>
                  </div>
                </div>

                {/* Main Card Body */}
                <div className="p-4 sm:p-5">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Teams Column (5 cols) */}
                    <div className="lg:col-span-5 flex items-center justify-between gap-3">
                      {/* Away Team */}
                      <div className="flex-1 text-center">
                        <div className="w-12 h-12 mx-auto mb-1.5 flex items-center justify-center p-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                          {awayProf.logo ? (
                            <img src={awayProf.logo} alt={match.awayTeam} className="max-h-full max-w-full object-contain" />
                          ) : (
                            <span className="font-black text-sm text-slate-700">{match.awayAbbrev}</span>
                          )}
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block leading-tight">
                          {match.awayTeam}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {awayProf.city} ({match.awayRecord})
                        </span>
                        <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/60 py-0.5 px-1.5 rounded-md">
                          G: {match.awayGoalie.name} (.{Math.round(match.awayGoalie.savePct * 1000)})
                        </div>
                      </div>

                      {/* VS & Model Expected Goals */}
                      <div className="shrink-0 text-center px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                        <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">PROJECTED xG</span>
                        <div className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white mt-0.5">
                          {match.modelProjectedAwayGoals} - {match.modelProjectedHomeGoals}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400 block mt-0.5">
                          Total: {match.modelProjectedTotal}
                        </span>
                      </div>

                      {/* Home Team */}
                      <div className="flex-1 text-center">
                        <div className="w-12 h-12 mx-auto mb-1.5 flex items-center justify-center p-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                          {homeProf.logo ? (
                            <img src={homeProf.logo} alt={match.homeTeam} className="max-h-full max-w-full object-contain" />
                          ) : (
                            <span className="font-black text-sm text-slate-700">{match.homeAbbrev}</span>
                          )}
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block leading-tight">
                          {match.homeTeam}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {homeProf.city} ({match.homeRecord})
                        </span>
                        <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/60 py-0.5 px-1.5 rounded-md">
                          G: {match.homeGoalie.name} (.{Math.round(match.homeGoalie.savePct * 1000)})
                        </div>
                      </div>
                    </div>

                    {/* Top Quantified Market Edge (4 cols) */}
                    <div className="lg:col-span-4 p-3.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 mb-1">
                        <span className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5 text-teal-500" />
                          Highest Edge Market
                        </span>
                        <span className="font-mono px-1.5 py-0.2 rounded-full bg-teal-100 dark:bg-teal-900/80 font-black">
                          +{topEdge.edgePercent}% EV
                        </span>
                      </div>

                      <div className="text-sm font-black font-mono text-slate-900 dark:text-white mt-1">
                        🎯 {topEdge.marketName}{' '}
                        <span className="text-slate-500 text-xs font-normal">({topEdge.sportsbookOdds})</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-teal-200/50 dark:border-teal-800/30 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                        <div>
                          <span>Model Win Prob:</span>{' '}
                          <strong className="text-slate-900 dark:text-white">{(topEdge.modelProbability * 100).toFixed(1)}%</strong>
                        </div>
                        <div>
                          <span>Sportsbook Line:</span>{' '}
                          <strong className="text-slate-900 dark:text-white">{topEdge.sportsbookLine}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Actions Column (3 cols) */}
                    <div className="lg:col-span-3 flex flex-col gap-2 justify-center">
                      {onTrackBet && (
                        <button
                          onClick={() => onTrackBet(match, topEdge)}
                          className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" />
                          <span>Track Top Pick</span>
                        </button>
                      )}

                      {onSendToAnalyzer && (
                        <button
                          onClick={() => onSendToAnalyzer(match)}
                          className="w-full py-1.5 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-teal-500" />
                          <span>Simulator</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedMatchId(isExpanded ? null : match.id)}
                        className="w-full text-center text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center gap-1 pt-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Details' : 'View All Markets'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Strategic Key Angle */}
                  <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <strong className="text-slate-900 dark:text-white font-bold">Key Tactical Angle:</strong> {match.keyAngle}
                  </div>

                  {/* Expandable Accordion with All Evaluated Markets */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        All Evaluated KHL Markets &amp; Model Probabilities
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {match.allMarketEdges.map((m, idx) => {
                          const isTop = m.marketType === topEdge.marketType;

                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                                isTop
                                  ? 'bg-teal-500/10 border-teal-500/40'
                                  : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block font-mono">
                                  {m.marketName}
                                </span>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Prob: {(m.modelProbability * 100).toFixed(1)}% · Odds: {m.sportsbookOdds}
                                </div>
                              </div>

                              <div className="text-right">
                                <span
                                  className={`font-mono font-black text-xs ${
                                    m.edgePercent > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                                  }`}
                                >
                                  {m.edgePercent > 0 ? `+${m.edgePercent}%` : `${m.edgePercent}%`} EV
                                </span>
                                {onTrackBet && (
                                  <button
                                    onClick={() => onTrackBet(match, m)}
                                    className="block mt-1 text-[10px] text-teal-600 hover:underline font-bold cursor-pointer"
                                  >
                                    Track
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
