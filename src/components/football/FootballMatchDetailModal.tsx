import React, { useMemo } from 'react';
import {
  X,
  ShieldCheck,
  Percent,
  Activity,
  Layers,
  Info,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Compass,
} from 'lucide-react';
import type { FootballFixture } from '../../types/football';
import { resolveTeamThrowInProfile } from '../../data/football/historicalThrowInData';
import { generateThrowInDistribution } from '../../utils/football/throwInModelEngine';

interface FootballMatchDetailModalProps {
  fixture: FootballFixture | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FootballMatchDetailModal: React.FC<FootballMatchDetailModalProps> = ({
  fixture,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !fixture || !fixture.forecast) return null;

  const forecast = fixture.forecast;
  const comp = forecast.competition;

  const homeProfile = useMemo(() => {
    return resolveTeamThrowInProfile(fixture.homeTeam.name, comp.id).profile;
  }, [fixture.homeTeam.name, comp.id]);

  const awayProfile = useMemo(() => {
    return resolveTeamThrowInProfile(fixture.awayTeam.name, comp.id).profile;
  }, [fixture.awayTeam.name, comp.id]);

  // Discrete Poisson probability mass distribution around lambda
  const distribution = useMemo(() => {
    const lambda = forecast.projectedTotalThrowIns;
    const min = Math.max(16, Math.floor(lambda - 12));
    const max = Math.min(52, Math.ceil(lambda + 14));
    return generateThrowInDistribution(lambda, min, max);
  }, [forecast.projectedTotalThrowIns]);

  const maxProb = useMemo(() => {
    return Math.max(...distribution.map((d) => d.probability), 1);
  }, [distribution]);

  const tierColors: Record<string, { bg: string; text: string; border: string }> = {
    HIGH_CONVICTION: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    MODERATE_EDGE: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
    LEAN_UNDER: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
    NEUTRAL_PASS: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' },
    HIGH_VOLATILITY: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
  };

  const currentTier = tierColors[forecast.confidenceTier] || tierColors.NEUTRAL_PASS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col text-slate-100">
        {/* Top Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 font-semibold text-slate-300 border border-slate-700 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              {comp.name}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {fixture.time}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Matchup Banner */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-b from-slate-800/40 to-transparent">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
            {/* Home Team */}
            <div className="flex items-center space-x-4">
              <img
                src={fixture.homeTeam.logo}
                alt={fixture.homeTeam.name}
                className="w-14 h-14 object-contain rounded-full bg-slate-800/80 p-1 border border-slate-700"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://a.espncdn.com/i/teamlogos/default-team-logo-500.png';
                }}
              />
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Home</span>
                <h3 className="text-lg font-bold text-white">{fixture.homeTeam.name}</h3>
                <div className="text-xs text-emerald-400 font-medium">
                  {homeProfile.under40_5Rate}% Under 40.5 ({homeProfile.avgPossessionPct}% Poss)
                </div>
              </div>
            </div>

            {/* Central Forecast Card */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 shadow-lg">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                Projected Total Throw-Ins
              </div>
              <div className="text-3xl font-black text-white flex items-baseline gap-2">
                <span>{forecast.projectedTotalThrowIns}</span>
                <span
                  className={`text-sm font-bold ${
                    forecast.expectedDifference < 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {forecast.expectedDifference > 0
                    ? `+${forecast.expectedDifference}`
                    : `${forecast.expectedDifference}`}{' '}
                  vs 40.5
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentTier.bg} ${currentTier.text} ${currentTier.border}`}
                >
                  {forecast.confidenceTier.replace('_', ' ')}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                  {forecast.probabilityUnder40_5}% UNDER
                </span>
              </div>
            </div>

            {/* Away Team */}
            <div className="flex items-center space-x-4 justify-end md:text-right">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Away</span>
                <h3 className="text-lg font-bold text-white">{fixture.awayTeam.name}</h3>
                <div className="text-xs text-emerald-400 font-medium">
                  {awayProfile.under40_5Rate}% Under 40.5 ({awayProfile.avgPossessionPct}% Poss)
                </div>
              </div>
              <img
                src={fixture.awayTeam.logo}
                alt={fixture.awayTeam.name}
                className="w-14 h-14 object-contain rounded-full bg-slate-800/80 p-1 border border-slate-700"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://a.espncdn.com/i/teamlogos/default-team-logo-500.png';
                }}
              />
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Data-Grounded Explanation */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" /> Analytical Rationale & Match Dynamics
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed">{forecast.dataGroundedExplanation}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">
                Playing Style: <strong className="text-white">{forecast.paceAndPlayingStyleSummary}</strong>
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">
                Data Tier:{' '}
                <strong className={forecast.dataQuality === 'OPTA_VERIFIED' ? 'text-emerald-400' : 'text-amber-400'}>
                  {forecast.dataQuality.replace('_', ' ')}
                </strong>
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">
                Reliability Score: <strong className="text-cyan-400">{forecast.modelReliabilityScore}/100</strong>
              </span>
            </div>
          </div>

          {/* Mathematical Decomposition Card */}
          <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/60">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Quantitative Projection Decomposition
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">League Baseline ({comp.name})</span>
                <span className="text-base font-bold text-slate-200 font-mono">{comp.avgThrowInsPerMatch}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Home Proj. Generation</span>
                <span className="text-base font-bold text-cyan-400 font-mono">{forecast.projectedHomeThrowIns}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Away Proj. Generation</span>
                <span className="text-base font-bold text-cyan-400 font-mono">{forecast.projectedAwayThrowIns}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">80% Confidence Interval</span>
                <span className="text-base font-bold text-purple-400 font-mono">
                  [{forecast.uncertaintyRange[0]} – {forecast.uncertaintyRange[1]}]
                </span>
              </div>
            </div>
          </div>

          {/* Poisson Discrete Count Distribution Visualizer */}
          <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/60">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Percent className="w-4 h-4 text-cyan-400" /> Count-Distribution Probability Mass Function
                </h4>
                <p className="text-xs text-slate-400">
                  Poisson model P(K throw-ins) with cut-off threshold at Line 40.5
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                  <span className="text-slate-300">Under 40.5 ({forecast.probabilityUnder40_5}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rose-500 inline-block"></span>
                  <span className="text-slate-300">Over 40.5 ({forecast.probabilityOver40_5}%)</span>
                </div>
              </div>
            </div>

            {/* Custom SVG / Bar Distribution */}
            <div className="h-44 flex items-end gap-1 sm:gap-1.5 pt-6 pb-2 px-2 bg-slate-900/80 rounded-xl border border-slate-800 overflow-x-auto">
              {distribution.map((item) => {
                const heightPct = (item.probability / maxProb) * 100;
                return (
                  <div
                    key={item.count}
                    className="flex-1 min-w-[14px] flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-800 text-[10px] text-white px-1.5 py-0.5 rounded shadow whitespace-nowrap z-20 border border-slate-700">
                      {item.count} throw-ins: {item.probability}%
                    </div>

                    <div
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                      className={`w-full rounded-t transition-all ${
                        item.isUnder40_5
                          ? 'bg-emerald-500/80 group-hover:bg-emerald-400'
                          : 'bg-rose-500/80 group-hover:bg-rose-400'
                      }`}
                    />
                    <span className="text-[9px] text-slate-400 mt-1 font-mono">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Head-to-Head Audited Statistical Comparison */}
          <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/60">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" /> Team Tactical & Statistical Profile Comparison
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-2 px-3 font-semibold text-emerald-400">{fixture.homeTeam.name}</th>
                    <th className="py-2 px-3 font-semibold text-center text-slate-400">Metric</th>
                    <th className="py-2 px-3 font-semibold text-right text-emerald-400">{fixture.awayTeam.name}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-white">
                      {homeProfile.avgThrowInsTakenPerMatch}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-400">Throw-Ins Taken / Match</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-white">
                      {awayProfile.avgThrowInsTakenPerMatch}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-slate-300">
                      {homeProfile.avgOpponentThrowInsPerMatch}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-400">Opponent Throw-Ins Conceded</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-300">
                      {awayProfile.avgOpponentThrowInsPerMatch}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-emerald-400">
                      {homeProfile.under40_5Rate}%
                    </td>
                    <td className="py-2 px-3 text-center text-slate-400 font-semibold text-white">
                      Season Under 40.5 Rate
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                      {awayProfile.under40_5Rate}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-slate-300">
                      {homeProfile.last5Under40_5Rate}%
                    </td>
                    <td className="py-2 px-3 text-center text-slate-400">Last 5 Matches Under 40.5</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-300">
                      {awayProfile.last5Under40_5Rate}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-cyan-400 font-bold">
                      {homeProfile.avgPossessionPct}%
                    </td>
                    <td className="py-2 px-3 text-center text-slate-400">Average Possession %</td>
                    <td className="py-2 px-3 text-right font-mono text-cyan-400 font-bold">
                      {awayProfile.avgPossessionPct}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-slate-300">
                      {homeProfile.directPlayRatio}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-400">Direct Play Ratio (Long Balls)</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-300">
                      {awayProfile.directPlayRatio}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Market Odds & No-Vig Fair Value Table */}
          <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/60">
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Market Odds & Fair Value Edge Calculation
            </h4>
            {forecast.hasMarketOdds && forecast.marketOdds ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="py-2 px-3">Market</th>
                      <th className="py-2 px-3">Bookmaker Price</th>
                      <th className="py-2 px-3">Raw Implied</th>
                      <th className="py-2 px-3">No-Vig Fair Prob</th>
                      <th className="py-2 px-3">Model Prob</th>
                      <th className="py-2 px-3">Model Edge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    <tr>
                      <td className="py-2 px-3 font-bold text-white">Under 40.5</td>
                      <td className="py-2 px-3 font-mono text-emerald-400 font-bold">
                        {forecast.marketOdds.underPrice}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-400">
                        {forecast.marketOdds.rawUnderImpliedProb}%
                      </td>
                      <td className="py-2 px-3 font-mono text-cyan-400 font-semibold">
                        {forecast.marketOdds.noVigUnderProb}%
                      </td>
                      <td className="py-2 px-3 font-mono text-emerald-400 font-bold">
                        {forecast.probabilityUnder40_5}%
                      </td>
                      <td className="py-2 px-3 font-mono">
                        <span
                          className={`font-bold px-2 py-0.5 rounded ${
                            (forecast.marketProbabilityEdge || 0) > 0
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {(forecast.marketProbabilityEdge || 0) > 0
                            ? `+${forecast.marketProbabilityEdge}%`
                            : `${forecast.marketProbabilityEdge}%`}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-300">Over 40.5</td>
                      <td className="py-2 px-3 font-mono text-slate-300">{forecast.marketOdds.overPrice}</td>
                      <td className="py-2 px-3 font-mono text-slate-400">
                        {forecast.marketOdds.rawOverImpliedProb}%
                      </td>
                      <td className="py-2 px-3 font-mono text-cyan-400 font-semibold">
                        {forecast.marketOdds.noVigOverProb}%
                      </td>
                      <td className="py-2 px-3 font-mono text-rose-400 font-bold">
                        {forecast.probabilityOver40_5}%
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-400">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-300 block">Market Status: Off-Board / Unpriced</span>
                  <span>
                    Total throw-ins prop markets are typically posted by major bookmakers 4–12 hours prior to kickoff.
                    Statistical forecast remains 100% active.
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[11px] font-mono">
                  Off-Board
                </span>
              </div>
            )}
          </div>

          {/* Recent Match Logs for Both Teams */}
          {(homeProfile.recentLogs.length > 0 || awayProfile.recentLogs.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Home Team Logs */}
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/60">
                <h5 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" /> {fixture.homeTeam.name} Recent Throw-In Logs
                </h5>
                <div className="space-y-1.5">
                  {homeProfile.recentLogs.slice(0, 4).map((log, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded bg-slate-900/60 text-xs text-slate-300"
                    >
                      <div>
                        <span className="font-medium text-white">{log.isHome ? 'vs' : '@'} {log.opponent}</span>
                        <span className="text-[10px] text-slate-500 block font-mono">{log.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-300">{log.totalThrowIns} total</span>
                        {log.isUnder40_5 ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            UNDER
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400">
                            OVER
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Away Team Logs */}
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/60">
                <h5 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" /> {fixture.awayTeam.name} Recent Throw-In Logs
                </h5>
                <div className="space-y-1.5">
                  {awayProfile.recentLogs.slice(0, 4).map((log, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded bg-slate-900/60 text-xs text-slate-300"
                    >
                      <div>
                        <span className="font-medium text-white">{log.isHome ? 'vs' : '@'} {log.opponent}</span>
                        <span className="text-[10px] text-slate-500 block font-mono">{log.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-300">{log.totalThrowIns} total</span>
                        {log.isUnder40_5 ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            UNDER
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400">
                            OVER
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>NBATotals Football Analytics • Mathematical Throw-Ins Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
