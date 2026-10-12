import React, { useState, useMemo } from 'react';
import {
  Zap,
  Flame,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import type { PlayerPropsForecast, OddsFormat, FirstQuarterPlayerStats, NBAPlayerProfile } from '../../types/playerProps';
import { calculatePostQ1Update } from '../../utils/firstQuarterScanner';
import { getPlayerProfile } from '../../data/nbaPlayerBaselines';

interface MobileQ1ScannerScreenProps {
  forecasts: PlayerPropsForecast[];
  oddsFormat: OddsFormat;
  onSelectPlayerDetail: (forecast: PlayerPropsForecast) => void;
}

export const MobileQ1ScannerScreen: React.FC<MobileQ1ScannerScreenProps> = ({
  forecasts,
  oddsFormat,
  onSelectPlayerDetail,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'OVER' | 'UNDER' | 'MOVERS'>('ALL');

  // Compute live / post-Q1 evaluations
  const q1Evaluations: { stat: FirstQuarterPlayerStats; forecast: PlayerPropsForecast }[] = useMemo(() => {
    return forecasts.map((f, idx) => {
      const profile = getPlayerProfile(f.playerId);

      let q1Pts = profile ? profile.q1Ppg : f.expectedQ1Points;
      let q1Mins = profile ? profile.q1Minutes : f.expectedQ1Minutes;
      let q1Fga = Math.round(((profile?.fgaPer36 || 14) / 36) * q1Mins);
      let q1Fgm = Math.round(q1Fga * 0.48);
      let q1Fouls = 0;

      // Realistic variation for demonstration of in-game updating
      if (idx === 0) {
        q1Pts = 13;
        q1Fga = 9;
        q1Fgm = 5;
        q1Mins = 11.2;
      } else if (idx === 1) {
        q1Pts = 2;
        q1Mins = 4.8;
        q1Fouls = 2;
      } else if (idx === 2) {
        q1Pts = 4;
        q1Fga = 7;
        q1Fgm = 1;
        q1Mins = 9.5;
      } else if (idx === 3) {
        q1Pts = 9;
        q1Fga = 6;
        q1Fgm = 4;
        q1Mins = 10.0;
      }

      const safeProfile: NBAPlayerProfile = profile || {
        id: f.playerId,
        name: f.playerName,
        team: f.team,
        teamName: f.team,
        position: 'G',
        jersey: '1',
        isStarter: f.isStarter,
        role: f.role,
        expectedMinutes: 30,
        seasonPpg: f.modelProjectedPoints,
        seasonMinutes: 30,
        last5Ppg: f.modelProjectedPoints,
        last10Ppg: f.modelProjectedPoints,
        last5Minutes: 30,
        last10Minutes: 30,
        q1Ppg: f.expectedQ1Points,
        q1Minutes: f.expectedQ1Minutes,
        fgaPer36: 15,
        threePaPer36: 5,
        ftaPer36: 4,
        usageRate: 22,
        trueShootingPct: 56,
        injuryStatus: 'ACTIVE',
        homeSplitPpg: f.modelProjectedPoints,
        awaySplitPpg: f.modelProjectedPoints,
        restDays: 1,
      };

      const postQ1 = calculatePostQ1Update(f, safeProfile, {
        points: q1Pts,
        minutes: q1Mins,
        fgm: q1Fgm,
        fga: q1Fga,
        threePm: 1,
        threePa: 2,
        ftm: 1,
        fta: 1,
        fouls: q1Fouls,
      });

      return { stat: postQ1, forecast: f };
    });
  }, [forecasts]);

  // Qualified signals
  const qualifiedOvers = useMemo(() => {
    return q1Evaluations.filter((i) => i.stat.updatedRecommendation.includes('OVER') && i.stat.currentPointsLine != null);
  }, [q1Evaluations]);

  const qualifiedUnders = useMemo(() => {
    return q1Evaluations.filter((i) => i.stat.updatedRecommendation.includes('UNDER') && i.stat.currentPointsLine != null);
  }, [q1Evaluations]);

  const strongestOver = qualifiedOvers[0] || null;
  const strongestUnder = qualifiedUnders[0] || null;

  // Filtered candidate list
  const filteredList = useMemo(() => {
    return q1Evaluations.filter(({ stat }) => {
      if (filterType === 'OVER') return stat.updatedRecommendation.includes('OVER');
      if (filterType === 'UNDER') return stat.updatedRecommendation.includes('UNDER');
      if (filterType === 'MOVERS') return Math.abs(stat.updatedProjectedFinalPoints - stat.preGameProjectedFinalPoints) >= 2.0;
      return true;
    });
  }, [q1Evaluations, filterType]);

  return (
    <div className="space-y-3.5 pb-20 pt-2 px-3.5 max-w-md mx-auto">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a1824] via-[#091522] to-[#060b14] border border-cyan-500/30 p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-cyan-400" /> LIVE IN-GAME MODEL
          </span>
          <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Q1 Official
          </span>
        </div>

        <h1 className="text-lg font-black text-white tracking-tight">
          Q1 EDGE SCANNER
        </h1>
        <p className="text-xs text-slate-300 mt-0.5 leading-snug">
          Post-1st quarter Bayesian adjustments based on minutes, fouls, shot volume &amp; efficiency.
        </p>
      </div>

      {/* 2. Top Qualified Signal Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Strongest Qualified Over */}
        {strongestOver && (
          <div
            onClick={() => onSelectPlayerDetail(strongestOver.forecast)}
            className="theover-card p-3 border-emerald-500/40 bg-emerald-950/20 cursor-pointer active:scale-95 transition"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950">
                TOP OVER
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-400">
                +{strongestOver.stat.updatedEdge.toFixed(1)}% Edge
              </span>
            </div>
            <span className="text-xs font-black text-white block leading-tight truncate">
              {strongestOver.stat.playerName}
            </span>
            <span className="text-[10px] text-slate-400 font-mono block">
              Line: {strongestOver.stat.currentPointsLine} • Proj: {strongestOver.stat.updatedProjectedFinalPoints}
            </span>
            <span className="text-[9px] text-emerald-400 font-bold block mt-1">
              Q1: {strongestOver.stat.actualQ1Points} pts ({strongestOver.stat.actualQ1Minutes}m)
            </span>
          </div>
        )}

        {/* Strongest Qualified Under */}
        {strongestUnder && (
          <div
            onClick={() => onSelectPlayerDetail(strongestUnder.forecast)}
            className="theover-card p-3 border-rose-500/40 bg-rose-950/20 cursor-pointer active:scale-95 transition"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-500 text-white">
                TOP UNDER
              </span>
              <span className="text-[10px] font-mono font-bold text-rose-400">
                +{strongestUnder.stat.updatedEdge.toFixed(1)}% Edge
              </span>
            </div>
            <span className="text-xs font-black text-white block leading-tight truncate">
              {strongestUnder.stat.playerName}
            </span>
            <span className="text-[10px] text-slate-400 font-mono block">
              Line: {strongestUnder.stat.currentPointsLine} • Proj: {strongestUnder.stat.updatedProjectedFinalPoints}
            </span>
            <span className="text-[9px] text-rose-400 font-bold block mt-1">
              {strongestUnder.stat.actualQ1Fouls > 1 ? `${strongestUnder.stat.actualQ1Fouls} Early Fouls` : `Q1: ${strongestUnder.stat.actualQ1Points} pts`}
            </span>
          </div>
        )}
      </div>

      {/* 3. Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
            filterType === 'ALL'
              ? 'bg-cyan-500 text-slate-950 font-black'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          All Candidates ({filteredList.length})
        </button>
        <button
          onClick={() => setFilterType('OVER')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
            filterType === 'OVER'
              ? 'bg-emerald-500 text-slate-950 font-black'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          Over Signals
        </button>
        <button
          onClick={() => setFilterType('UNDER')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
            filterType === 'UNDER'
              ? 'bg-rose-500 text-white font-black'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          Under Signals
        </button>
        <button
          onClick={() => setFilterType('MOVERS')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
            filterType === 'MOVERS'
              ? 'bg-purple-500 text-white font-black'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          Big Projection Shifts
        </button>
      </div>

      {/* 4. Candidate Cards */}
      <div className="space-y-2.5">
        {filteredList.map(({ stat, forecast }) => {
          const shift = Number((stat.updatedProjectedFinalPoints - stat.preGameProjectedFinalPoints).toFixed(1));
          const isOffered = stat.currentPointsLine != null;

          return (
            <div
              key={stat.playerId}
              onClick={() => onSelectPlayerDetail(forecast)}
              className="theover-card p-3 space-y-2.5 transition active:scale-98 cursor-pointer hover:border-cyan-500/40"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-black text-white block">
                    {stat.playerName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {stat.team} vs {stat.opponent}
                  </span>
                </div>

                <div className="text-right">
                  {isOffered ? (
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                        stat.updatedRecommendation.includes('OVER')
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {stat.updatedRecommendation}
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      OFF BOARD
                    </span>
                  )}
                  {isOffered && (
                    <span className="text-[10px] font-mono text-cyan-400 font-bold block mt-0.5">
                      +{stat.updatedEdge.toFixed(1)}% Edge
                    </span>
                  )}
                </div>
              </div>

              {/* Side-by-Side: Pre-Game vs Post-Q1 */}
              <div className="grid grid-cols-3 gap-2 bg-[#060a14] p-2.5 rounded-xl border border-slate-800/80 text-center font-mono text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-sans block uppercase">Sportsbook Line</span>
                  <span className="font-bold text-white">{stat.currentPointsLine || '—'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-sans block uppercase">Pre-Game Proj</span>
                  <span className="font-bold text-slate-300">{stat.preGameProjectedFinalPoints}</span>
                </div>
                <div>
                  <span className="text-[9px] text-cyan-400 font-sans block uppercase">Post-Q1 Proj</span>
                  <span className="font-black text-cyan-400">{stat.updatedProjectedFinalPoints}</span>
                  <span className={`text-[9px] block ${shift > 0 ? 'text-emerald-400' : shift < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                    {shift > 0 ? `+${shift}` : shift} pts
                  </span>
                </div>
              </div>

              {/* Q1 Activity & Narrative */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-0.5">
                <span>
                  Q1 Actual: <strong className="text-white">{stat.actualQ1Points} pts</strong> ({stat.actualQ1Minutes}m, {stat.actualQ1Fga} FGA)
                </span>
                <span>
                  Remaining: <strong className="text-cyan-400">{stat.expectedRemainingMinutes}m</strong>
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300 leading-snug">
                {stat.scannerSummary}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
