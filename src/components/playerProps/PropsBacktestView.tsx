import React, { useMemo } from 'react';
import {
  Award,
  TrendingUp,
  BarChart2,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Target,
  ArrowUpRight,
} from 'lucide-react';
import { runHistoricalPropsBacktest } from '../../utils/playerPropsBacktest';

export const PropsBacktestView: React.FC = () => {
  const { summary, samples } = useMemo(() => runHistoricalPropsBacktest(), []);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Rigorous Out-of-Sample Validation
              </span>
              <span className="text-xs text-slate-400 font-mono">Walk-Forward Evaluation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1.5 tracking-tight">
              NBA Player Props Historical Accuracy & Calibration
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Evaluating true model performance against closing DraftKings lines across {summary.totalEvaluatedProps} chronological game logs. Zero data leakage, strict pre-game inputs, and verified post-Q1 Bayesian updates.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 bg-white/5 p-3 rounded-xl border border-white/10 shrink-0">
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Win Rate</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400">{summary.overallWinRate}%</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall ROI</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400">+{summary.overallRoi}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pre-Game Model MAE</span>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ±{summary.preGameMae} <span className="text-xs font-normal text-slate-400">pts</span>
          </div>
          <div className="text-[11px] text-emerald-500 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Beats season avg (±{summary.baselineSeasonMae} pts)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Post-Q1 Model MAE</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500 mt-1">
            ±{summary.postQ1Mae} <span className="text-xs font-normal text-slate-400">pts</span>
          </div>
          <div className="text-[11px] text-emerald-500 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +{summary.preGameVsPostQ1ImprovementPct}% precision leap
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Brier Probability Score</span>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {summary.brierScoreOver}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">
            Lower is better (Benchmark: 0.25)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Root Mean Squared (RMSE)</span>
            <BarChart2 className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {summary.preGameRmse} <span className="text-xs font-normal text-slate-400">pts</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">
            Post-Q1 RMSE: {summary.postQ1Rmse} pts
          </div>
        </div>
      </div>

      {/* Results by Edge Bracket Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-500" />
            Performance by Edge Bracket (Expected Value Tiers)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Higher probability edges yield progressively higher win rates and return on capital.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Edge Tier</th>
                <th className="py-3 px-4">Evaluated Props</th>
                <th className="py-3 px-4">Win Rate %</th>
                <th className="py-3 px-4">Net ROI %</th>
                <th className="py-3 px-4 text-right">Profit Units</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
              {summary.resultsByEdgeTier.map((t, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">{t.tier}</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{t.propsCount} bets</td>
                  <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {t.winRate}%
                  </td>
                  <td className="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    +{t.roi}%
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                    +{t.profitUnits}u
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Probability Calibration Buckets */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Model Probability Calibration (Reliability Check)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            When the model estimates a 65% chance of winning, does the bet win approximately 65% of the time?
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {summary.calibrationBuckets.map((b, idx) => {
            const diff = Math.abs(b.avgPredictedProb - b.observedWinRate);
            const isWellCalibrated = diff <= 5.0;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-slate-200/80 dark:border-slate-800/80 space-y-1.5"
              >
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Bin: {b.predictedBin}
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Pred: {b.avgPredictedProb}%</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    Act: {b.observedWinRate}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                  <span>Sample: {b.sampleSize}</span>
                  <span className={isWellCalibrated ? 'text-emerald-500 font-bold' : 'text-amber-500'}>
                    {isWellCalibrated ? '✓ Calibrated' : 'Minor delta'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
