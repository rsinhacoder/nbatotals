import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  TrendingDown,
  TrendingUp,
  Percent,
  Flame,
  Search,
  SlidersHorizontal,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Shield,
  Zap,
} from 'lucide-react';
import type { UpcomingMatch } from '../types/nba';
import { getTeamProfile } from '../data/teamProfiles';
import { fetchUpcomingScoreboard } from '../utils/espnApi';
import { buildUpcomingMatchForecast, type RawUpcomingInput } from '../utils/upcomingEngine';

interface UpcomingMatchesTabProps {
  upcomingMatches: UpcomingMatch[];
  onUpdateMatchOverride: (matchId: string, lowestQ?: number, line?: number) => void;
  onSendToSimulator: (lowestQ: number, line: number) => void;
  onSyncUpcomingLive: (newUpcoming: RawUpcomingInput[]) => void;
  onTrackMatchBet?: (match: UpcomingMatch, pickType: 'UNDER' | 'OVER') => void;
}

export const UpcomingMatchesTab: React.FC<UpcomingMatchesTabProps> = ({
  upcomingMatches,
  onUpdateMatchOverride,
  onSendToSimulator,
  onSyncUpcomingLive,
  onTrackMatchBet,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recFilter, setRecFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'TOMORROW'>('ALL');
  const [isFetchingLive, setIsFetchingLive] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  // Filtered upcoming matches
  const filteredMatches = useMemo(() => {
    return upcomingMatches.filter((match) => {
      // Search
      const searchMatch =
        searchTerm === '' ||
        match.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.homeTeam.toLowerCase().includes(searchTerm.toLowerCase());
      if (!searchMatch) return false;

      // Recommendation
      if (recFilter === 'UNDER' && !match.recommendation.includes('UNDER')) return false;
      if (recFilter === 'OVER' && !match.recommendation.includes('OVER')) return false;
      if (recFilter === 'STRONG' && !match.recommendation.startsWith('STRONG')) return false;

      // Date
      if (dateFilter === 'TODAY' && match.date !== todayStr) return false;
      if (dateFilter === 'TOMORROW' && match.date !== tomorrowStr) return false;

      return true;
    });
  }, [upcomingMatches, searchTerm, recFilter, dateFilter, todayStr, tomorrowStr]);

  // Top edge pick on current slate
  const topPick = useMemo(() => {
    if (upcomingMatches.length === 0) return null;
    return [...upcomingMatches].sort((a, b) => Math.abs(b.edge) - Math.abs(a.edge))[0];
  }, [upcomingMatches]);

  const handleFetchESPNUpcoming = async () => {
    setIsFetchingLive(true);
    try {
      const liveGames = await fetchUpcomingScoreboard(todayStr);
      if (liveGames.length > 0) {
        onSyncUpcomingLive(liveGames);
        alert(`Fetched ${liveGames.length} upcoming/live matchups from ESPN!`);
      } else {
        alert("No scheduled NBA games returned from ESPN for today's date.");
      }
    } catch (e) {
      console.error(e);
      alert('Could not fetch ESPN scoreboard.');
    } finally {
      setIsFetchingLive(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Slate Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 rounded-2xl p-5 glow-card">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
              <Zap className="h-4 w-4" />
              Empirical Matchup Forecasting Engine
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight m-0">
              Upcoming Matchups &amp; Sportsbook Lines
            </h2>
            <p className="text-xs text-slate-400 mt-1 m-0">
              Projects regulation totals using team pace, defensive ratings, and the lowest-quarter regression model.
            </p>
          </div>

          {/* Top Pick Highlight Card */}
          {topPick && (
            <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-3.5 flex items-center gap-3.5 self-stretch lg:self-auto">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Flame className="h-5 w-5 text-amber-400 animate-bounce" />
              </div>
              <div className="text-xs">
                <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  Slate Top Discrepancy
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                    {topPick.confidenceScore}% Conf
                  </span>
                </div>
                <div className="font-bold text-white text-sm">
                  {topPick.awayTeam} @ {topPick.homeTeam}
                </div>
                <div className="flex items-center gap-2 text-[11px] mt-0.5 font-mono">
                  <span className="text-cyan-400 font-semibold">{topPick.recommendation}</span>
                  <span className="text-slate-500">•</span>
                  <span className={topPick.edge < 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    Edge: {topPick.edge > 0 ? `+${topPick.edge}` : topPick.edge} pts
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 glow-card space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search upcoming teams (e.g. Celtics, Lakers, Knicks)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Quick Date Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setDateFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                dateFilter === 'ALL' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Slate
            </button>
            <button
              onClick={() => setDateFilter('TODAY')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                dateFilter === 'TODAY' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('TOMORROW')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                dateFilter === 'TOMORROW' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tomorrow
            </button>
          </div>

          {/* Live Fetch Button */}
          <button
            onClick={handleFetchESPNUpcoming}
            disabled={isFetchingLive}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white font-medium text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetchingLive ? 'animate-spin' : ''}`} />
            <span>Fetch ESPN Slate</span>
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 flex items-center gap-1 mr-1">
            <SlidersHorizontal className="h-3 w-3" /> Position Filter:
          </span>
          {[
            { id: 'ALL', label: 'All Matchups' },
            { id: 'UNDER', label: 'Under Value (Sluggish Quarters)' },
            { id: 'OVER', label: 'Over Value (Pace Matchups)' },
            { id: 'STRONG', label: 'Strong Value (High Edge)' },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setRecFilter(chip.id)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] font-medium ${
                recFilter === chip.id
                  ? 'bg-cyan-950 border border-cyan-500 text-cyan-300'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Matchup Cards Grid */}
      {filteredMatches.length === 0 ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
          No upcoming matchups found matching the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredMatches.map((match) => {
            const awayProf = getTeamProfile(match.awayTeam);
            const homeProf = getTeamProfile(match.homeTeam);

            const isStrongUnder = match.recommendation === 'STRONG UNDER';
            const isLeanUnder = match.recommendation === 'LEAN UNDER';
            const isStrongOver = match.recommendation === 'STRONG OVER';
            const isLeanOver = match.recommendation === 'LEAN OVER';

            let badgeBg = 'bg-slate-800 text-slate-300 border-slate-700';
            if (isStrongUnder) badgeBg = 'bg-emerald-950 text-emerald-300 border-emerald-500/60 shadow-emerald-950';
            else if (isLeanUnder) badgeBg = 'bg-cyan-950 text-cyan-300 border-cyan-500/60';
            else if (isStrongOver) badgeBg = 'bg-rose-950 text-rose-300 border-rose-500/60 shadow-rose-950';
            else if (isLeanOver) badgeBg = 'bg-amber-950 text-amber-300 border-amber-500/60';

            return (
              <div
                key={match.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card flex flex-col justify-between transition-all hover:border-slate-700/80"
              >
                <div>
                  {/* Top Match Header: Date, Time & Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{match.date}</span>
                      <span className="text-slate-600">•</span>
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{match.time}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {match.status === 'Live' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1 animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                          LIVE IN-PLAY
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                          {match.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Team Matchup Banner */}
                  <div className="grid grid-cols-2 gap-3 my-4">
                    {/* Away Team */}
                    <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                      <img
                        src={awayProf.logo}
                        alt={awayProf.name}
                        className="h-10 w-10 object-contain drop-shadow"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white text-sm truncate">
                          {awayProf.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {match.awayRecord || 'Away'} • Pace: {awayProf.paceRating}
                        </div>
                      </div>
                    </div>

                    {/* Home Team */}
                    <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                      <img
                        src={homeProf.logo}
                        alt={homeProf.name}
                        className="h-10 w-10 object-contain drop-shadow"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white text-sm truncate">
                          {homeProf.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {match.homeRecord || 'Home'} • Pace: {homeProf.paceRating}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Core Forecaster Metrics Comparison */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center font-mono">
                      {/* Projected Lowest Quarter */}
                      <div className="bg-slate-900/80 rounded-lg p-2.5">
                        <div className="text-[10px] font-sans text-slate-400 uppercase tracking-wider">
                          Projected Lowest Q
                        </div>
                        <div className="text-xl font-black text-cyan-400 my-0.5">
                          {match.projectedLowestQuarter} pts
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {match.projectedLowestQuarter < 47 ? '⚠️ Under 47 Alert' : 'Floor ≥ 47'}
                        </div>
                      </div>

                      {/* Model Projected Regulation Total */}
                      <div className="bg-slate-900/80 rounded-lg p-2.5">
                        <div className="text-[10px] font-sans text-slate-400 uppercase tracking-wider">
                          Model Forecast
                        </div>
                        <div className="text-xl font-black text-white my-0.5">
                          {match.modelProjectedTotal.toFixed(1)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Other 3 Q: {match.modelProjectedOther3.toFixed(1)}
                        </div>
                      </div>

                      {/* Sportsbook Consensus Total */}
                      <div className="bg-slate-900/80 rounded-lg p-2.5">
                        <div className="text-[10px] font-sans text-slate-400 uppercase tracking-wider">
                          Sportsbook Line
                        </div>
                        <div className="text-xl font-black text-amber-300 my-0.5">
                          {match.sportsbookLine.toFixed(1)}
                        </div>
                        <div className="text-[10px] text-slate-400">Consensus Total</div>
                      </div>
                    </div>

                    {/* Edge & Recommendation Pill */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wide border ${badgeBg}`}>
                          {match.recommendation}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Confidence: <strong className="text-slate-200">{match.confidenceScore}%</strong>
                        </span>
                      </div>

                      <div className="text-xs font-mono font-bold flex items-center gap-1">
                        <span className="text-slate-400 font-sans font-normal">Edge:</span>
                        <span
                          className={match.edge < 0 ? 'text-emerald-400' : 'text-rose-400'}
                        >
                          {match.edge > 0 ? `+${match.edge.toFixed(1)}` : match.edge.toFixed(1)} pts
                        </span>
                        {match.edge < 0 ? (
                          <TrendingDown className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-rose-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantitative Probabilities Bar */}
                  <div className="grid grid-cols-2 gap-3 my-3 text-xs">
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                      <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                        <span>P(Lowest Q &lt; 47)</span>
                        <span className="text-cyan-400 font-bold font-mono">
                          {match.lowestUnder47Probability}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div
                          className="bg-cyan-400 h-1.5 rounded-full"
                          style={{ width: `${match.lowestUnder47Probability}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                      <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                        <span>P(Regulation &lt; 219)</span>
                        <span className="text-emerald-400 font-bold font-mono">
                          {match.under219Probability}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div
                          className="bg-emerald-400 h-1.5 rounded-full"
                          style={{ width: `${match.under219Probability}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Narrative explanation */}
                  <p className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 leading-relaxed mb-3">
                    {match.keyNarrative}
                  </p>
                </div>

                {/* Card Actions & Live Simulation */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-[11px]">Tweak Lowest Q:</span>
                    <input
                      type="number"
                      step="0.5"
                      value={match.projectedLowestQuarter}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          onUpdateMatchOverride(match.id, val, match.sportsbookLine);
                        }
                      }}
                      className="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-cyan-400 font-mono focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {onTrackMatchBet && (
                      <button
                        onClick={() => onTrackMatchBet(match, match.edge <= 0 ? 'UNDER' : 'OVER')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                          match.edge <= 0
                            ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50'
                            : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/50'
                        }`}
                        title="Add this pick to your Bet Tracker portfolio"
                      >
                        <span>+ Track {match.edge <= 0 ? 'UNDER' : 'OVER'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSendToSimulator(match.projectedLowestQuarter, match.sportsbookLine)}
                      className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer transition-colors px-2 py-1"
                    >
                      <span>Simulate</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
