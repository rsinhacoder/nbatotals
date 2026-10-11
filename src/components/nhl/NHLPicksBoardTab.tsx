import React, { useState } from 'react';
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
} from 'lucide-react';
import type { NHLUpcomingMatch, NHLMarketEdge } from '../../types/nhl';
import { getNHLTeamProfile } from '../../data/nhlTeamProfiles';

interface NHLPicksBoardTabProps {
  upcomingMatches: NHLUpcomingMatch[];
  onTrackBet?: (match: NHLUpcomingMatch, market: NHLMarketEdge) => void;
  onSendToAnalyzer?: (match: NHLUpcomingMatch) => void;
  onRefreshSchedule?: () => void;
  isSyncingSchedule?: boolean;
}

export const NHLPicksBoardTab: React.FC<NHLPicksBoardTabProps> = ({
  upcomingMatches,
  onTrackBet,
  onSendToAnalyzer,
  onRefreshSchedule,
  isSyncingSchedule = false,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'HIGH_EV' | 'TOTALS' | 'PUCKLINE' | 'FIRST_PERIOD'>('ALL');
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // Filter matches
  const filteredMatches = upcomingMatches.filter((match) => {
    if (selectedFilter === 'HIGH_EV') {
      return match.highestEdgeMarket.edgePercent >= 5.0;
    }
    if (selectedFilter === 'TOTALS') {
      return match.highestEdgeMarket.marketType === 'TOTAL_OVER' || match.highestEdgeMarket.marketType === 'TOTAL_UNDER';
    }
    if (selectedFilter === 'PUCKLINE') {
      return match.highestEdgeMarket.marketType === 'PUCKLINE_HOME' || match.highestEdgeMarket.marketType === 'PUCKLINE_AWAY';
    }
    if (selectedFilter === 'FIRST_PERIOD') {
      return match.highestEdgeMarket.marketType === 'P1_OVER' || match.highestEdgeMarket.marketType === 'P1_UNDER';
    }
    return true;
  });

  // Sort matches so highest EV edge appears first!
  const sortedMatches = [...filteredMatches].sort(
    (a, b) => b.highestEdgeMarket.edgePercent - a.highestEdgeMarket.edgePercent
  );

  // Top Edge of the slate
  const slateTopEdge = upcomingMatches.reduce<NHLMarketEdge | null>((best, m) => {
    if (!best || m.highestEdgeMarket.edgePercent > best.edgePercent) {
      return m.highestEdgeMarket;
    }
    return best;
  }, null);

  const highEdgeCount = upcomingMatches.filter((m) => m.highestEdgeMarket.edgePercent >= 5.0).length;

  return (
    <div className="space-y-6">
      {/* Top Slate Quant Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-5 sm:p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-cyan-400" />
                Poisson & xG Edge Engine
              </span>
              <span className="text-xs text-slate-400">Past 5 Seasons Calibrated</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              NHL Highest Edge Picks Board
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Discrete Bivariate Poisson simulations evaluate 5 betting markets per game (Totals O/U 5.5/6.0/6.5, Puckline -1.5, 1st Period & Moneyline) to isolate the sportsbooks' widest mathematical mispricings.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            {onRefreshSchedule && (
              <button
                onClick={onRefreshSchedule}
                disabled={isSyncingSchedule}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all cursor-pointer disabled:opacity-50"
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
            <span className="text-base font-black text-white">{upcomingMatches.length} Matchups</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <span className="text-slate-400 block mb-0.5">High EV Opportunities (≥5%)</span>
            <span className="text-base font-black text-emerald-400">{highEdgeCount} Strong Edges</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Slate Best Edge</span>
            <span className="text-base font-black text-cyan-300 truncate block">
              {slateTopEdge ? `${slateTopEdge.marketName} (+${slateTopEdge.edgePercent}% EV)` : 'Analyzing...'}
            </span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <span className="text-slate-400 block mb-0.5">5-Yr Baseline Avg</span>
            <span className="text-base font-black text-amber-300">6.18 Goals/Game</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedFilter === 'ALL'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Markets ({upcomingMatches.length})
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
            Pucklines (-1.5)
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
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing <span className="font-bold text-slate-900 dark:text-white">{sortedMatches.length}</span> games ranked by edge
        </div>
      </div>

      {/* Match Cards List */}
      <div className="space-y-4">
        {sortedMatches.map((match) => {
          const homeProf = getNHLTeamProfile(match.homeAbbrev);
          const awayProf = getNHLTeamProfile(match.awayAbbrev);
          const topMarket = match.highestEdgeMarket;
          const isExpanded = expandedMatchId === match.id;

          const isHighEV = topMarket.edgePercent >= 5.0;

          return (
            <div
              key={match.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isHighEV
                  ? 'bg-gradient-to-r from-emerald-500/5 via-transparent to-cyan-500/5 border-emerald-500/30 dark:border-emerald-500/20 shadow-md'
                  : 'bg-white dark:bg-[#0c121e] border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              {/* Top Highest Edge Ribbon */}
              <div
                className={`px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold border-b ${
                  isHighEV
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500/30'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 font-black uppercase tracking-wider">
                    <Target className="w-3.5 h-3.5" />
                    Highest Edge Market:
                  </span>
                  <span className="font-bold underline decoration-white/40 underline-offset-2">
                    {topMarket.marketName} ({topMarket.sportsbookOdds})
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-black text-xs ${
                      isHighEV ? 'bg-white text-emerald-800 shadow-xs' : 'bg-blue-600 text-white'
                    }`}
                  >
                    +{topMarket.edgePercent}% EV
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 text-amber-300">
                    {Array.from({ length: topMarket.starRating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                  <span className="text-[11px] opacity-90">{match.time} • {match.venue}</span>
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
                      <div className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 text-center">
                        <div>Proj Score</div>
                        <div className="text-sm font-black">
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
                      <span>Puckline: {homeProf.abbreviation} {match.sportsbookSpread} ({match.spreadHomeOdds})</span>
                      <span>1P O/U 1.5: {(match.prob1POver1_5 * 100).toFixed(0)}% Over</span>
                    </div>
                  </div>

                  {/* Right: Action Buttons & Expand */}
                  <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col gap-2 justify-center">
                    {onTrackBet && (
                      <button
                        onClick={() => onTrackBet(match, topMarket)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        Track {topMarket.marketName}
                      </button>
                    )}

                    <div className="flex gap-2 w-full">
                      {onSendToAnalyzer && (
                        <button
                          onClick={() => onSendToAnalyzer(match)}
                          className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          Deep Dive
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedMatchId(isExpanded ? null : match.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
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
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-500" />
                      All Evaluated Markets for this Game (Ranked by Mathematical Edge)
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold">
                          <tr>
                            <th className="py-2 px-3">Market</th>
                            <th className="py-2 px-3">Line & Book Odds</th>
                            <th className="py-2 px-3">Model Fair Prob</th>
                            <th className="py-2 px-3">Book Implied</th>
                            <th className="py-2 px-3">Expected Value (EV%)</th>
                            <th className="py-2 px-3">Rating</th>
                            <th className="py-2 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {match.allMarketEdges.map((m, mIdx) => (
                            <tr
                              key={mIdx}
                              className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                                m.recommended ? 'bg-emerald-500/5' : ''
                              }`}
                            >
                              <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                {m.recommended && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
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
                                <div className="flex items-center gap-0.5 text-amber-400">
                                  {Array.from({ length: m.starRating }).map((_, i) => (
                                    <Star key={i} className="w-2.5 h-2.5 fill-current" />
                                  ))}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {onTrackBet && (
                                  <button
                                    onClick={() => onTrackBet(match, m)}
                                    className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-200 dark:bg-slate-700 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-colors cursor-pointer"
                                  >
                                    Track
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
