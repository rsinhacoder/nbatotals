import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Users,
  CalendarDays,
  ShieldCheck,
  ChevronRight,
  Flame,
  Award,
  Sparkles,
  BarChart2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import type { UpcomingMatch } from '../../types/nba';
import type { PlayerPropsForecast } from '../../types/playerProps';
import { getTeamProfile } from '../../data/teamProfiles';

interface MobileHomeScreenProps {
  upcomingMatches: UpcomingMatch[];
  playerPropsForecasts: PlayerPropsForecast[];
  onNavigateTab: (tab: 'games' | 'props' | 'scanner' | 'profile') => void;
  onSelectGameDetail: (match: UpcomingMatch) => void;
  onSelectPlayerDetail: (forecast: PlayerPropsForecast) => void;
  onTrackBet?: (match: UpcomingMatch, type: 'UNDER' | 'OVER') => void;
}

export const MobileHomeScreen: React.FC<MobileHomeScreenProps> = ({
  upcomingMatches,
  playerPropsForecasts,
  onNavigateTab,
  onSelectGameDetail,
  onSelectPlayerDetail,
  onTrackBet,
}) => {
  // Compute data-driven summary counts
  const totalGames = upcomingMatches.length;
  const overPicksCount = upcomingMatches.filter((m) => m.recommendation.includes('OVER')).length;
  const underPicksCount = upcomingMatches.filter((m) => m.recommendation.includes('UNDER')).length;

  // Top Pick of the Slate (highest absolute edge)
  const topMatch = React.useMemo(() => {
    if (upcomingMatches.length === 0) return null;
    return [...upcomingMatches].sort((a, b) => Math.abs(b.edge) - Math.abs(a.edge))[0];
  }, [upcomingMatches]);

  // Top Player Prop of the Slate (highest recommendationEdge with offered line)
  const topProp = React.useMemo(() => {
    const offered = playerPropsForecasts.filter((f) => f.marketStatus === 'OFFERED');
    if (offered.length === 0) return null;
    return [...offered].sort((a, b) => b.recommendationEdge - a.recommendationEdge)[0];
  }, [playerPropsForecasts]);

  // Helper variables for top match
  const topPickType = topMatch ? (topMatch.recommendation.includes('OVER') ? 'OVER' : 'UNDER') : 'OVER';
  const topDiff = topMatch ? topMatch.edge : 0;
  const topEvPct = topMatch ? Math.max(3.2, Math.abs(topDiff) * 3.8) : 0;
  const topWinProb = topMatch ? Math.round(topMatch.confidenceScore || 65) : 65;

  return (
    <div className="space-y-4 pb-20 pt-2 px-3.5 max-w-md mx-auto">
      {/* 1. FEATURED SECTION: NBA FORECAST CENTER */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1427] via-[#0d162a] to-[#080d1a] border border-cyan-500/25 p-4 shadow-lg shadow-cyan-950/30">
        <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> QUANTITATIVE ENGINE
            </span>
            <span className="text-[11px] font-mono font-semibold text-slate-400">
              5-Year Model
            </span>
          </div>

          <h1 className="text-xl font-black text-white tracking-tight">
            NBA FORECAST CENTER
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-0.5 leading-snug">
            Game totals. Player props. Statistical edges.
          </p>

          {/* Quick Slate Live Summary Metrics */}
          <div className="grid grid-cols-4 gap-1.5 mt-3.5 pt-3 border-t border-slate-800/80">
            <div className="bg-slate-900/80 rounded-xl p-2 text-center border border-slate-800">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Games</span>
              <span className="text-base font-black text-white">{totalGames}</span>
            </div>
            <div className="bg-slate-900/80 rounded-xl p-2 text-center border border-slate-800">
              <span className="block text-[10px] text-emerald-400 font-bold uppercase">Overs</span>
              <span className="text-base font-black text-emerald-400">{overPicksCount}</span>
            </div>
            <div className="bg-slate-900/80 rounded-xl p-2 text-center border border-slate-800">
              <span className="block text-[10px] text-rose-400 font-bold uppercase">Unders</span>
              <span className="text-base font-black text-rose-400">{underPicksCount}</span>
            </div>
            <div className="bg-slate-900/80 rounded-xl p-2 text-center border border-slate-800">
              <span className="block text-[10px] text-cyan-400 font-bold uppercase">Props</span>
              <span className="text-base font-black text-cyan-400">{playerPropsForecasts.length}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THEOVER-STYLE FEATURED TOP PICK OF THE SLATE */}
      {topMatch && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-cyan-400" /> Top Matchup Pick
            </span>
            <button
              onClick={() => onNavigateTab('games')}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 transition cursor-pointer"
            >
              All {totalGames} Games <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="theover-card overflow-hidden">
            {/* Top Cyan Highlight Bar */}
            <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-3.5 py-2 flex items-center justify-between text-slate-950 font-bold text-xs">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded bg-slate-950 text-cyan-400 font-black text-[10px] tracking-wide uppercase">
                  TOP PICK
                </span>
                <span className="text-white text-xs font-black tracking-tight">
                  {topPickType} {topMatch.sportsbookLine}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-white font-mono">
                <span>+{Math.abs(topDiff).toFixed(1)} Pt Edge</span>
                <span>•</span>
                <span>{topWinProb}% Win Prob</span>
              </div>
            </div>

            {/* Matchup Content */}
            <div className="p-3.5 space-y-3">
              {/* Teams & Score / Time */}
              <div className="flex items-center justify-between">
                {/* Away Team */}
                <div className="flex items-center gap-2.5 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-white text-sm shrink-0">
                    {(topMatch as any).awayAbbrev || topMatch.awayTeam.slice(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm font-black text-white block leading-tight">
                      {topMatch.awayTeam}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {topMatch.awayRecord || 'Away'}
                    </span>
                  </div>
                </div>

                {/* Center Timing / Projection */}
                <div className="text-center px-2 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    AT
                  </span>
                  <div className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg text-xs font-mono font-black text-cyan-400 mt-0.5">
                    {topMatch.time}
                  </div>
                </div>

                {/* Home Team */}
                <div className="flex items-center gap-2.5 flex-1 justify-end text-right">
                  <div>
                    <span className="text-sm font-black text-white block leading-tight">
                      {topMatch.homeTeam}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {topMatch.homeRecord || 'Home'}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-white text-sm shrink-0">
                    {(topMatch as any).homeAbbrev || topMatch.homeTeam.slice(0, 3).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Data Grid: Sportsbook Line | Model Total | Point Edge */}
              <div className="grid grid-cols-3 gap-2 bg-[#060a14] p-2.5 rounded-xl border border-slate-800/80 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block uppercase">Book Line</span>
                  <span className="text-sm font-bold text-slate-200">{topMatch.sportsbookLine}</span>
                </div>
                <div>
                  <span className="text-[10px] text-cyan-400 font-sans block uppercase">Model Total</span>
                  <span className="text-sm font-black text-cyan-400">{topMatch.modelProjectedTotal.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block uppercase">Point Edge</span>
                  <span className={`text-sm font-black ${topDiff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {topDiff > 0 ? `+${topDiff.toFixed(1)}` : topDiff.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Quant Angle Narrative Box */}
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 leading-relaxed font-sans">
                <strong className="text-cyan-400">Quant Angle:</strong> Model projects {topMatch.modelProjectedTotal.toFixed(1)} total points against consensus line {topMatch.sportsbookLine} ({topDiff > 0 ? `+${topDiff.toFixed(1)}` : topDiff.toFixed(1)} pt discrepancy). Highest mathematical conviction lies on {topPickType} {topMatch.sportsbookLine}.
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onSelectGameDetail(topMatch)}
                  className="flex-1 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xs tracking-tight transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <BarChart2 className="w-3.5 h-3.5 text-slate-400" /> Deep Dive Analysis
                </button>
                {onTrackBet && (
                  <button
                    onClick={() => onTrackBet(topMatch, topPickType as 'OVER' | 'UNDER')}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs tracking-tight transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20"
                  >
                    + Track Pick
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. FEATURED PLAYER PROP PICK */}
      {topProp && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" /> Featured Player Prop
            </span>
            <button
              onClick={() => onNavigateTab('props')}
              className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-0.5 transition cursor-pointer"
            >
              All {playerPropsForecasts.length} Props <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div
            onClick={() => onSelectPlayerDetail(topProp)}
            className="theover-card p-3.5 flex items-center justify-between cursor-pointer transition active:scale-98 hover:border-purple-500/40"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                {topProp.headshotUrl ? (
                  <img
                    src={topProp.headshotUrl}
                    alt={topProp.playerName}
                    className="w-11 h-11 rounded-full object-cover bg-slate-900 border border-purple-500/30"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-white text-xs">
                    {topProp.playerName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 text-[8px] font-black px-1 py-0.2 rounded bg-purple-500 text-white uppercase">
                  {topProp.role}
                </span>
              </div>

              <div>
                <span className="text-sm font-black text-white block">
                  {topProp.playerName}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {topProp.team} vs {topProp.opponent} • Q1 Avg: {topProp.expectedQ1Points} pts
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800">
                    Line: <strong className="text-white">{topProp.pointsLine}</strong>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/60">
                    Proj: <strong className="text-cyan-400">{topProp.modelProjectedPoints}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`text-xs font-black px-2 py-0.8 rounded-lg block uppercase tracking-tight ${
                  topProp.recommendation.includes('OVER')
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {topProp.recommendation}
              </span>
              <span className="text-[10px] font-mono text-cyan-400 mt-1 block">
                +{topProp.recommendationEdge.toFixed(1)}% EV
              </span>
            </div>
          </div>
        </section>
      )}

      {/* 4. SIGNATURE SHORTCUTS GRID */}
      <section className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          onClick={() => onNavigateTab('scanner')}
          className="theover-card p-3 text-left transition active:scale-95 cursor-pointer hover:border-cyan-500/40 group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-2">
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xs font-black text-white block group-hover:text-cyan-400 transition">
            Q1 Edge Scanner
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">
            Live post-first quarter adjusted player projections
          </span>
        </button>

        <button
          onClick={() => onNavigateTab('profile')}
          className="theover-card p-3 text-left transition active:scale-95 cursor-pointer hover:border-cyan-500/40 group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mb-2">
            <Award className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-xs font-black text-white block group-hover:text-cyan-400 transition">
            Bet Portfolio & ROI
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">
            Tracked units, model accuracy & odds settings
          </span>
        </button>
      </section>
    </div>
  );
};
