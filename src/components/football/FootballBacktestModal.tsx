import React, { useMemo, useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  TrendingDown,
  Layers,
  ShieldCheck,
  Search,
} from 'lucide-react';
import {
  AUDITED_HISTORICAL_THROW_IN_MATCHES,
  calculateBacktestSummary,
} from '../../services/football/footballBacktestService';

interface FootballBacktestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FootballBacktestModal: React.FC<FootballBacktestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedComp, setSelectedComp] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const summary = useMemo(() => {
    return calculateBacktestSummary(AUDITED_HISTORICAL_THROW_IN_MATCHES);
  }, []);

  const filteredMatches = useMemo(() => {
    return AUDITED_HISTORICAL_THROW_IN_MATCHES.filter((m) => {
      const matchComp =
        selectedComp === 'all' || m.competition.toLowerCase().includes(selectedComp.toLowerCase());
      const matchSearch =
        searchQuery === '' ||
        m.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.competition.toLowerCase().includes(searchQuery.toLowerCase());
      return matchComp && matchSearch;
    });
  }, [selectedComp, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col text-slate-100">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Football Model Backtesting & Calibration Audit
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  Opta Audited
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Evaluation of out-of-sample European fixtures against verified Opta match event statistics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Top Performance Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium mb-1">
                <Layers className="w-3.5 h-3.5 text-blue-400" /> Matches Evaluated
              </div>
              <div className="text-2xl font-black text-white">{summary.totalMatchesEvaluated}</div>
              <div className="text-[11px] text-slate-400 mt-1">Multi-Season Opta</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium mb-1">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> Mean Abs. Error
              </div>
              <div className="text-2xl font-black text-emerald-400">{summary.meanAbsoluteError}</div>
              <div className="text-[11px] text-slate-400 mt-1">Throw-ins / match</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium mb-1">
                <TrendingDown className="w-3.5 h-3.5 text-purple-400" /> RMSE
              </div>
              <div className="text-2xl font-black text-purple-400">{summary.rootMeanSquaredError}</div>
              <div className="text-[11px] text-slate-400 mt-1">Dispersion penalizer</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Brier Score
              </div>
              <div className="text-2xl font-black text-cyan-400">{summary.overallBrierScore}</div>
              <div className="text-[11px] text-emerald-400 mt-1">Benchmark &lt; 0.10</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Under 40.5 Hit Rate
              </div>
              <div className="text-2xl font-black text-amber-400">{summary.actualUnder40_5Rate}%</div>
              <div className="text-[11px] text-slate-400 mt-1">
                {summary.actualUnder40_5Count} / {summary.totalMatchesEvaluated} Under
              </div>
            </div>
          </div>

          {/* Model Calibration Tiers Section */}
          <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" /> Probability Calibration Table
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              A well-calibrated forecasting model ensures matches predicted at 90% probability finish under the line
              approximately 90% of the time.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Predicted Probability Band</th>
                    <th className="py-2.5 px-3 font-semibold">Matches in Bucket</th>
                    <th className="py-2.5 px-3 font-semibold">Average Model Prob</th>
                    <th className="py-2.5 px-3 font-semibold">Empirical Hit Rate</th>
                    <th className="py-2.5 px-3 font-semibold">Calibration Delta</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {summary.calibrationTiers.map((tier, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-medium text-white">{tier.predictedRange}</td>
                      <td className="py-2.5 px-3">{tier.matchCount} fixtures</td>
                      <td className="py-2.5 px-3 text-cyan-400">{tier.predictedAvgProb > 0 ? `${tier.predictedAvgProb}%` : '—'}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-400">
                        {tier.matchCount > 0 ? `${tier.actualUnderRate}%` : '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        {tier.matchCount > 0 ? (
                          <span
                            className={
                              Math.abs(tier.calibrationDelta) <= 5.0
                                ? 'text-emerald-400 font-medium'
                                : 'text-amber-400 font-medium'
                            }
                          >
                            {tier.calibrationDelta > 0 ? `+${tier.calibrationDelta}%` : `${tier.calibrationDelta}%`}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {tier.matchCount === 0 ? (
                          <span className="text-slate-500">No Sample</span>
                        ) : Math.abs(tier.calibrationDelta) <= 5.0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Well Calibrated
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3" /> Slight Variance
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Competition Breakdown */}
          <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" /> League-by-League Accuracy
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Competition</th>
                    <th className="py-2 px-3 font-semibold">Matches</th>
                    <th className="py-2 px-3 font-semibold">MAE (Throw-Ins)</th>
                    <th className="py-2 px-3 font-semibold">Model Under %</th>
                    <th className="py-2 px-3 font-semibold">Actual Under %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {summary.competitionBreakdown.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-medium text-white">{c.competition}</td>
                      <td className="py-2 px-3">{c.matchCount}</td>
                      <td className="py-2 px-3 text-emerald-400 font-semibold">{c.mae}</td>
                      <td className="py-2 px-3 text-cyan-400">{c.modelUnderRate}%</td>
                      <td className="py-2 px-3 font-bold text-emerald-400">{c.actualUnderRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Individual Matches Log */}
          <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Audited Fixture Log</h3>
                <p className="text-xs text-slate-400">Examine predictions vs actual out-of-bounds throw-in counts</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search teams..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <select
                  value={selectedComp}
                  onChange={(e) => setSelectedComp(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Competitions</option>
                  <option value="Premier League">Premier League</option>
                  <option value="La Liga">La Liga</option>
                  <option value="Bundesliga">Bundesliga</option>
                  <option value="Serie A">Serie A</option>
                  <option value="Champions League">Champions League</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Competition</th>
                    <th className="py-2 px-3">Match</th>
                    <th className="py-2 px-3">Projected</th>
                    <th className="py-2 px-3">Actual</th>
                    <th className="py-2 px-3">Model Under %</th>
                    <th className="py-2 px-3">Line (40.5)</th>
                    <th className="py-2 px-3">Abs Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {filteredMatches.map((m) => (
                    <tr key={m.matchId} className="hover:bg-slate-800/50">
                      <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{m.date}</td>
                      <td className="py-2 px-3 text-slate-400">{m.competition}</td>
                      <td className="py-2 px-3 font-semibold text-white">
                        {m.homeTeam} vs {m.awayTeam}
                      </td>
                      <td className="py-2 px-3 text-cyan-400 font-mono">{m.projectedThrowIns}</td>
                      <td className="py-2 px-3 font-mono font-bold text-white">{m.actualThrowIns}</td>
                      <td className="py-2 px-3 text-emerald-400 font-semibold">{m.modelUnder40_5Prob}%</td>
                      <td className="py-2 px-3">
                        {m.actualUnder40_5 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            UNDER (HIT)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            OVER
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-300">{m.absoluteError}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Continuous Out-of-Sample Calibration • NBATotals Quantitative Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
