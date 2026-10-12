import React from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Clock,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Calendar,
} from 'lucide-react';
import type { PlayerPropsForecast, OddsFormat } from '../../types/playerProps';
import { getPlayerProfile, getPlayerGameLogs } from '../../data/nbaPlayerBaselines';
import { getTeamProfile } from '../../data/teamProfiles';

interface PlayerDetailModalProps {
  forecast: PlayerPropsForecast | null;
  oddsFormat: OddsFormat;
  onClose: () => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  forecast,
  oddsFormat,
  onClose,
}) => {
  if (!forecast) return null;

  const player = getPlayerProfile(forecast.playerId);
  const gameLogs = getPlayerGameLogs(forecast.playerId);
  const oppProfile = getTeamProfile(forecast.opponent);

  const formatOdds = (american: string, decimal: number) => {
    return oddsFormat === 'AMERICAN' ? american : decimal.toFixed(3);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-white">
        {/* Header Banner */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6 bg-white/95 dark:bg-[#0c1322]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-xl text-white shadow-md">
              {forecast.team}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black">{forecast.playerName}</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {player?.position || 'G'} • #{player?.jersey || '0'}
                </span>
                {player?.injuryStatus === 'ACTIVE' ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Active
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {player?.injuryStatus}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {forecast.team} vs {forecast.opponent} ({oppProfile.name}) • Line:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {forecast.marketStatus === 'OFFERED' && forecast.pointsLine != null
                    ? `${forecast.pointsLine} pts`
                    : 'Off the Board (Not Offered)'}
                </strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Key Metric Snapshot Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Model Projection</span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                {forecast.modelProjectedPoints} <span className="text-xs font-normal text-slate-400">pts</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {forecast.marketStatus === 'OFFERED' && forecast.pointsLine != null
                  ? `${forecast.pointsDifference > 0 ? `+${forecast.pointsDifference}` : forecast.pointsDifference} vs Line`
                  : '80% Interval: ' + forecast.confidenceInterval80[0] + ' - ' + forecast.confidenceInterval80[1]}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Sportsbook Line</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {forecast.marketStatus === 'OFFERED' && forecast.pointsLine != null ? forecast.pointsLine : '—'}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {forecast.marketStatus === 'OFFERED' && forecast.pointsLine != null
                  ? `O: ${formatOdds(forecast.overOdds, forecast.overDecimal)} | U: ${formatOdds(forecast.underOdds, forecast.underDecimal)}`
                  : 'Market Not Offered'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Win Prob & No-Vig</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {forecast.marketStatus === 'OFFERED'
                  ? `${(forecast.recommendation === 'OVER EDGE' ? forecast.modelProbOver * 100 : forecast.modelProbUnder * 100).toFixed(1)}%`
                  : '—'}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {forecast.marketStatus === 'OFFERED'
                  ? `Edge: +${forecast.recommendationEdge}% (EV +${forecast.recommendationEv}%)`
                  : 'No Active Odds'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Model Stance</span>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                    forecast.recommendation === 'OVER EDGE'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                      : forecast.recommendation === 'UNDER EDGE'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                      : 'bg-slate-500/20 text-slate-600 dark:text-slate-300 border border-slate-500/30'
                  }`}
                >
                  {forecast.recommendation === 'OVER EDGE' && <TrendingUp className="w-3.5 h-3.5" />}
                  {forecast.recommendation === 'UNDER EDGE' && <TrendingDown className="w-3.5 h-3.5" />}
                  {forecast.recommendation}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Confidence: {forecast.confidenceScore}%</span>
            </div>
          </div>

          {/* Quant Narrative Banner */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50">
            <h3 className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Activity className="w-4 h-4 text-blue-500" />
              Quantitative Model Breakdown
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {forecast.keyNarrative}
            </p>
          </div>

          {/* Model Factors Decomposition */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Feature Signals & Matchup Drivers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#121b2d] border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Playing Time Model</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{forecast.factors.minutesFactor}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#121b2d] border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-2.5">
                <Flame className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Recency Weighted Scoring Rate</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{forecast.factors.recencyFactor}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#121b2d] border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Opponent Defensive Resistance</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{forecast.factors.matchupFactor}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#121b2d] border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-2.5">
                <Activity className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">1st Quarter Scoring Pace Baseline</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{forecast.factors.q1Baseline}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 80% Credible Predictive Interval */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-slate-200/80 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider">80% Predictive Scoring Interval</span>
              <span className="font-mono text-slate-600 dark:text-slate-300">
                [{forecast.confidenceInterval80[0]} pts — {forecast.confidenceInterval80[1]} pts]
              </span>
            </div>
            <div className="relative h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex items-center">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full opacity-70"
                style={{
                  marginLeft: `${Math.max(0, (forecast.confidenceInterval80[0] / 50) * 100)}%`,
                  width: `${Math.min(100, ((forecast.confidenceInterval80[1] - forecast.confidenceInterval80[0]) / 50) * 100)}%`,
                }}
              />
              {/* Target Line Marker (if offered) */}
              {forecast.pointsLine != null && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{ left: `${Math.min(100, Math.max(0, (forecast.pointsLine / 50) * 100))}%` }}
                  title={`Line: ${forecast.pointsLine}`}
                />
              )}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0 pts</span>
              {forecast.pointsLine != null ? (
                <span className="text-red-500 font-bold">Line: {forecast.pointsLine} pts</span>
              ) : (
                <span className="text-slate-400 font-bold">Line: Off Board</span>
              )}
              <span>50+ pts</span>
            </div>
          </div>

          {/* Recent Game Logs Table */}
          {gameLogs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Recent Verified Game Logs (Chronological Out-of-Sample)
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Opponent</th>
                      <th className="py-2.5 px-3">MIN</th>
                      <th className="py-2.5 px-3">Q1 PTS</th>
                      <th className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">PTS</th>
                      <th className="py-2.5 px-3">FG</th>
                      <th className="py-2.5 px-3">3PT</th>
                      <th className="py-2.5 px-3">Line Cover</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {gameLogs.map((log) => {
                      const hasLine = forecast.pointsLine != null;
                      const covered = hasLine && log.points > (forecast.pointsLine as number);
                      return (
                        <tr key={log.gameId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-2 px-3 text-slate-500 dark:text-slate-400">{log.date}</td>
                          <td className="py-2 px-3 font-sans font-bold">
                            {log.isHome ? 'vs' : '@'} {log.opponent} ({log.result})
                          </td>
                          <td className="py-2 px-3">{log.minutes}m</td>
                          <td className="py-2 px-3 font-bold text-indigo-600 dark:text-indigo-400">{log.q1Points}</td>
                          <td className="py-2 px-3 font-black text-slate-900 dark:text-white text-sm">{log.points}</td>
                          <td className="py-2 px-3">{log.fgm}/{log.fga}</td>
                          <td className="py-2 px-3">{log.threePm}/{log.threePa}</td>
                          <td className="py-2 px-3">
                            {hasLine ? (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  covered
                                    ? 'bg-emerald-500/20 text-emerald-500'
                                    : 'bg-amber-500/20 text-amber-500'
                                }`}
                              >
                                {covered ? 'OVER' : 'UNDER'}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
