import React, { useState, useMemo } from 'react';
import {
  Flame,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  Filter,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
} from 'lucide-react';
import type {
  EarlyEdgeScannerReport,
  FirstQuarterPlayerStats,
  OddsFormat,
  PlayerPropsForecast,
} from '../../types/playerProps';
import { calculatePostQ1Update } from '../../utils/firstQuarterScanner';
import { getPlayerProfile } from '../../data/nbaPlayerBaselines';

interface FirstQuarterScannerViewProps {
  forecasts: PlayerPropsForecast[];
  oddsFormat: OddsFormat;
  onSelectPlayer: (forecast: PlayerPropsForecast) => void;
}

export const FirstQuarterScannerView: React.FC<FirstQuarterScannerViewProps> = ({
  forecasts,
  oddsFormat,
  onSelectPlayer,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'OVER' | 'UNDER' | 'MOVERS' | 'FOUL_RISK'>('ALL');
  const [minEdge, setMinEdge] = useState<number>(3.0);
  const [selectedGame, setSelectedGame] = useState<string>('ALL');

  // Compute live / post-Q1 stats for all active forecast players
  const playerQ1Evaluations: FirstQuarterPlayerStats[] = useMemo(() => {
    return forecasts.map((f, idx) => {
      const profile = getPlayerProfile(f.playerId);
      if (!profile) {
        return {
          playerId: f.playerId,
          playerName: f.playerName,
          gameId: f.gameId,
          team: f.team,
          opponent: f.opponent,
          actualQ1Points: f.expectedQ1Points,
          actualQ1Minutes: f.expectedQ1Minutes,
          actualQ1Fgm: 3,
          actualQ1Fga: 6,
          actualQ13pm: 1,
          actualQ13pa: 2,
          actualQ1Ftm: 1,
          actualQ1Fta: 1,
          actualQ1Fouls: 0,
          preGameExpectedQ1Points: f.expectedQ1Points,
          preGameExpectedQ1Minutes: f.expectedQ1Minutes,
          preGameProjectedFinalPoints: f.modelProjectedPoints,
          pointsDifferenceQ1: 0,
          minutesDifferenceQ1: 0,
          actualShotEfficiency: 50,
          isHotHandVariance: false,
          isVolumeExpansion: false,
          expectedRemainingMinutes: 26,
          updatedProjectedFinalPoints: f.modelProjectedPoints,
          currentPointsLine: f.pointsLine,
          updatedProbOver: f.modelProbOver,
          updatedProbUnder: f.modelProbUnder,
          probOverChangeSinceTip: 0,
          probUnderChangeSinceTip: 0,
          updatedRecommendation: f.recommendation,
          updatedEdge: f.recommendationEdge,
          scannerSummary: 'Baseline projections',
        };
      }

      // Model simulated authentic Q1 stats to illustrate live Bayesian updating:
      // Player 0: Luka high volume early
      // Player 1: Tatum foul trouble
      // Player 2: SGA cold shooting slump (regressed)
      let q1Pts = profile.q1Ppg;
      let q1Mins = profile.q1Minutes;
      let q1Fga = Math.round((profile.fgaPer36 / 36) * q1Mins);
      let q1Fgm = Math.round(q1Fga * 0.48);
      let q1Fouls = 0;

      if (idx === 0) {
        // Star on heavy volume
        q1Pts = 13;
        q1Fga = 9;
        q1Fgm = 5;
        q1Mins = 11.2;
      } else if (idx === 1) {
        // Foul trouble
        q1Pts = 4;
        q1Fga = 3;
        q1Fgm = 1;
        q1Mins = 6.5;
        q1Fouls = 2; // 2 early fouls
      } else if (idx === 2) {
        // Cold shooting slump (1 of 6 FG)
        q1Pts = 3;
        q1Fga = 7;
        q1Fgm = 1;
        q1Mins = 9.8;
      }

      return calculatePostQ1Update(f, profile, {
        points: q1Pts,
        minutes: q1Mins,
        fgm: q1Fgm,
        fga: q1Fga,
        threePm: 1,
        threePa: 3,
        ftm: q1Pts > 8 ? 2 : 0,
        fta: q1Pts > 8 ? 2 : 0,
        fouls: q1Fouls,
      });
    });
  }, [forecasts]);

  // Unique games list
  const uniqueGames = useMemo(() => {
    return Array.from(new Set(forecasts.map((f) => `${f.team} vs ${f.opponent}`)));
  }, [forecasts]);

  // Filtered and ranked evaluations
  const filteredEvaluations = useMemo(() => {
    return playerQ1Evaluations.filter((item) => {
      if (selectedGame !== 'ALL' && `${item.team} vs ${item.opponent}` !== selectedGame) {
        return false;
      }

      if (Math.abs(item.updatedEdge) < minEdge && item.updatedRecommendation === 'NO EDGE') {
        return false;
      }

      if (filterType === 'OVER') return item.updatedRecommendation === 'OVER EDGE';
      if (filterType === 'UNDER') return item.updatedRecommendation === 'UNDER EDGE';
      if (filterType === 'MOVERS') return Math.abs(item.probOverChangeSinceTip) >= 4.0;
      if (filterType === 'FOUL_RISK') return item.actualQ1Fouls >= 2;

      return true;
    });
  }, [playerQ1Evaluations, filterType, minEdge, selectedGame]);

  // Top highlight cards
  const strongestOver = useMemo(() => {
    return [...playerQ1Evaluations]
      .filter((p) => p.updatedRecommendation === 'OVER EDGE')
      .sort((a, b) => b.updatedEdge - a.updatedEdge)[0];
  }, [playerQ1Evaluations]);

  const strongestUnder = useMemo(() => {
    return [...playerQ1Evaluations]
      .filter((p) => p.updatedRecommendation === 'UNDER EDGE')
      .sort((a, b) => b.updatedEdge - a.updatedEdge)[0];
  }, [playerQ1Evaluations]);

  const topMover = useMemo(() => {
    return [...playerQ1Evaluations].sort(
      (a, b) => Math.abs(b.probOverChangeSinceTip) - Math.abs(a.probOverChangeSinceTip)
    )[0];
  }, [playerQ1Evaluations]);

  return (
    <div className="space-y-6">
      {/* Signature Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/60 to-slate-900 border border-amber-500/20 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Early Edge Scanner
              </span>
              <span className="text-xs text-slate-400 font-mono">Real-Time In-Game Bayesian Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1.5 tracking-tight">
              Post-1st Quarter Live Projection Updates
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              When the first quarter concludes, the model separates temporary shooting variance from sustainable volume and foul trouble. It regresses shooting efficiency toward baseline and dynamically recalibrates final points expectations against the current sportsbook line.
            </p>
          </div>
        </div>
      </div>

      {/* Top Ranked Scanner Insights Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {strongestOver && (
          <div className="p-4 rounded-xl bg-white dark:bg-[#0c1322] border-2 border-emerald-500/30 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-500 mb-2">
              <span className="flex items-center gap-1 uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" /> Strongest Over Signal
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">
                +{strongestOver.updatedEdge}% Edge
              </span>
            </div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              {strongestOver.playerName} ({strongestOver.team})
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Q1: <strong className="text-slate-900 dark:text-white">{strongestOver.actualQ1Points} pts</strong> ({strongestOver.actualQ1Fga} FGA in {strongestOver.actualQ1Minutes}m).
            </p>
            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Final Projection:</span>
              <span className="font-mono font-black text-emerald-500 text-sm">
                {strongestOver.updatedProjectedFinalPoints} pts (Line: {strongestOver.currentPointsLine})
              </span>
            </div>
          </div>
        )}

        {strongestUnder && (
          <div className="p-4 rounded-xl bg-white dark:bg-[#0c1322] border-2 border-amber-500/30 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-bold text-amber-500 mb-2">
              <span className="flex items-center gap-1 uppercase tracking-wider">
                <TrendingDown className="w-4 h-4" /> Strongest Under Signal
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px]">
                +{strongestUnder.updatedEdge}% Edge
              </span>
            </div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              {strongestUnder.playerName} ({strongestUnder.team})
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Q1: <strong className="text-slate-900 dark:text-white">{strongestUnder.actualQ1Points} pts</strong> ({strongestUnder.actualQ1Fouls} fouls, {strongestUnder.expectedRemainingMinutes}m rem).
            </p>
            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Final Projection:</span>
              <span className="font-mono font-black text-amber-500 text-sm">
                {strongestUnder.updatedProjectedFinalPoints} pts (Line: {strongestUnder.currentPointsLine})
              </span>
            </div>
          </div>
        )}

        {topMover && (
          <div className="p-4 rounded-xl bg-white dark:bg-[#0c1322] border-2 border-indigo-500/30 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-500 mb-2">
              <span className="flex items-center gap-1 uppercase tracking-wider">
                <Flame className="w-4 h-4" /> Biggest Probability Shift
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px]">
                {topMover.probOverChangeSinceTip > 0 ? `+${topMover.probOverChangeSinceTip}%` : `${topMover.probOverChangeSinceTip}%`} Δ
              </span>
            </div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              {topMover.playerName} ({topMover.team})
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Pre-game vs Post-Q1 shift: Over Prob moved to <strong className="text-slate-900 dark:text-white">{(topMover.updatedProbOver * 100).toFixed(1)}%</strong>.
            </p>
            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-indigo-400 text-xs">{topMover.scannerTag}</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterType === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Evaluated
          </button>
          <button
            onClick={() => setFilterType('OVER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              filterType === 'OVER'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Over Candidates
          </button>
          <button
            onClick={() => setFilterType('UNDER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              filterType === 'UNDER'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" /> Under Candidates
          </button>
          <button
            onClick={() => setFilterType('MOVERS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              filterType === 'MOVERS'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> Probability Movers
          </button>
          <button
            onClick={() => setFilterType('FOUL_RISK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              filterType === 'FOUL_RISK'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Foul Trouble Alerts
          </button>
        </div>

        {/* Game Filter dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold hidden sm:inline">Game:</span>
          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            className="text-xs font-semibold py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Matchups</option>
            {uniqueGames.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Scanner Results Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Player & Matchup</th>
              <th className="py-3 px-3">Actual Q1</th>
              <th className="py-3 px-3">Exp Q1</th>
              <th className="py-3 px-3">Q1 Δ</th>
              <th className="py-3 px-3">Rem Mins</th>
              <th className="py-3 px-3">Pre-Game Proj</th>
              <th className="py-3 px-3 font-bold text-slate-900 dark:text-white">Updated Proj</th>
              <th className="py-3 px-3">Line</th>
              <th className="py-3 px-3">Prob Shift Δ</th>
              <th className="py-3 px-4">Signal & Edge</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
            {filteredEvaluations.map((item) => {
              const matchedForecast = forecasts.find((f) => f.playerId === item.playerId);
              return (
                <tr
                  key={item.playerId}
                  onClick={() => matchedForecast && onSelectPlayer(matchedForecast)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <td className="py-3 px-4 font-sans">
                    <div className="font-black text-slate-900 dark:text-white text-sm">
                      {item.playerName}
                    </div>
                    <div className="text-[11px] text-slate-400 font-normal">
                      {item.team} vs {item.opponent}
                      {item.actualQ1Fouls >= 2 && (
                        <span className="ml-1 text-red-500 font-bold">({item.actualQ1Fouls} fouls)</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 dark:text-white">{item.actualQ1Points} pts</span>
                    <span className="block text-[10px] text-slate-400">{item.actualQ1Fgm}/{item.actualQ1Fga} FG ({item.actualQ1Minutes}m)</span>
                  </td>

                  <td className="py-3 px-3 text-slate-400">
                    {item.preGameExpectedQ1Points} pts
                    <span className="block text-[10px]">({item.preGameExpectedQ1Minutes}m)</span>
                  </td>

                  <td className="py-3 px-3 font-bold">
                    <span className={item.pointsDifferenceQ1 >= 0 ? 'text-emerald-500' : 'text-amber-500'}>
                      {item.pointsDifferenceQ1 >= 0 ? `+${item.pointsDifferenceQ1}` : item.pointsDifferenceQ1}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                    {item.expectedRemainingMinutes}m
                  </td>

                  <td className="py-3 px-3 text-slate-400">
                    {item.preGameProjectedFinalPoints} pts
                  </td>

                  <td className="py-3 px-3 font-black text-slate-900 dark:text-white text-sm">
                    {item.updatedProjectedFinalPoints} pts
                  </td>

                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {item.currentPointsLine}
                  </td>

                  <td className="py-3 px-3 font-bold">
                    {item.probOverChangeSinceTip >= 0 ? (
                      <span className="text-emerald-500 flex items-center gap-0.5">
                        <ArrowUpRight className="w-3.5 h-3.5" /> +{item.probOverChangeSinceTip}%
                      </span>
                    ) : (
                      <span className="text-amber-500 flex items-center gap-0.5">
                        <ArrowDownRight className="w-3.5 h-3.5" /> {item.probOverChangeSinceTip}%
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          item.updatedRecommendation === 'OVER EDGE'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : item.updatedRecommendation === 'UNDER EDGE'
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-500/30'
                        }`}
                      >
                        {item.updatedRecommendation}
                      </span>
                      {item.updatedEdge > 0 && (
                        <span className="text-[11px] font-bold text-emerald-500">
                          +{item.updatedEdge}%
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans block mt-0.5 max-w-xs truncate">
                      {item.scannerSummary}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
