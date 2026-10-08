import { TrendingDown } from 'lucide-react';
import type { DashboardMetrics } from '../types/nba';
import { LOWEST_QUARTER_THRESHOLD, REGULATION_TOTAL_THRESHOLD } from '../utils/modelConstants';

interface ThresholdAnalysisTabProps {
  metrics: DashboardMetrics;
}

export const ThresholdAnalysisTab: React.FC<ThresholdAnalysisTabProps> = ({ metrics }) => {
  // 2x2 Contingency Table counts
  const cellLowestUnder47RegUnder219 = metrics.under219LowestUnder47;
  const cellLowestUnder47RegOver219 = metrics.lowestUnder47 - metrics.under219LowestUnder47;
  const cellLowestOver47RegUnder219 = metrics.under219Lowest47OrMore;
  const cellLowestOver47RegOver219 = metrics.lowest47OrMore - metrics.under219Lowest47OrMore;

  const pctLowestUnder47WentUnder = metrics.lowestUnder47 > 0
    ? (cellLowestUnder47RegUnder219 / metrics.lowestUnder47) * 100
    : 0;

  const pctLowestOver47WentUnder = metrics.lowest47OrMore > 0
    ? (cellLowestOver47RegUnder219 / metrics.lowest47OrMore) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white m-0">
              Under 219 &amp; Lowest Quarter Threshold Analysis
            </h2>
            <p className="text-xs text-slate-400 m-0 mt-0.5">
              Empirical testing of the dual threshold phenomena: Lowest Regulation Quarter &lt; {LOWEST_QUARTER_THRESHOLD} and Regulation Total &lt; {REGULATION_TOTAL_THRESHOLD}
            </p>
          </div>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total Games &lt; 219 Points
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            {metrics.under219}{' '}
            <span className="text-sm text-slate-400 font-sans">
              ({metrics.under219Pct.toFixed(1)}%)
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Out of {metrics.totalGames} total completed games
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Lowest Quarter &lt; 47 Rate
          </div>
          <div className="text-3xl font-extrabold text-cyan-400 font-mono mt-2">
            {metrics.lowestUnder47}{' '}
            <span className="text-sm text-slate-400 font-sans">
              ({metrics.lowestUnder47Pct.toFixed(1)}%)
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Games containing at least one sub-47 quarter
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Under 219 Ratio (&lt;47 vs ≥47)
          </div>
          <div className="text-3xl font-extrabold text-amber-400 font-mono mt-2">
            {metrics.under219Ratio > 0 ? `${metrics.under219Ratio.toFixed(2)} : 1` : 'N/A'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Likelihood multiplier of hitting Under 219
          </div>
        </div>
      </div>

      {/* 2x2 Contingency Matrix */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 glow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white m-0">
              2 × 2 Regime Contingency Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-1 m-0">
              Cross-tabulation of game outcomes by Lowest Quarter Threshold (&lt;47) and Regulation Total (&lt;219)
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
            N = {metrics.totalGames} Games
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quadrant 1: Lowest < 47 */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-sm font-bold text-cyan-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                Regime A: Lowest Quarter &lt; 47
              </span>
              <span className="text-xs font-mono text-slate-400">
                {metrics.lowestUnder47} Games Total
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 text-center">
                <div className="text-xs text-emerald-400 font-medium">Regulation &lt; 219</div>
                <div className="text-2xl font-black text-emerald-300 font-mono my-1">
                  {cellLowestUnder47RegUnder219}
                </div>
                <div className="text-[11px] text-emerald-400 font-bold">
                  {pctLowestUnder47WentUnder.toFixed(1)}% of Regime
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-400 font-medium">Regulation ≥ 219</div>
                <div className="text-2xl font-black text-slate-300 font-mono my-1">
                  {cellLowestUnder47RegOver219}
                </div>
                <div className="text-[11px] text-slate-400">
                  {(100 - pctLowestUnder47WentUnder).toFixed(1)}% of Regime
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              💡 <strong>Key Finding:</strong> When a game registers any quarter below 47 points,{' '}
              <strong className="text-emerald-400">{pctLowestUnder47WentUnder.toFixed(1)}%</strong> of games stayed under 219 points in regulation.
            </div>
          </div>

          {/* Quadrant 2: Lowest >= 47 */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-sm font-bold text-rose-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400"></span>
                Regime B: Lowest Quarter ≥ 47
              </span>
              <span className="text-xs font-mono text-slate-400">
                {metrics.lowest47OrMore} Games Total
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-400 font-medium">Regulation &lt; 219</div>
                <div className="text-2xl font-black text-slate-300 font-mono my-1">
                  {cellLowestOver47RegUnder219}
                </div>
                <div className="text-[11px] text-slate-400 font-bold">
                  {pctLowestOver47WentUnder.toFixed(1)}% of Regime
                </div>
              </div>

              <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 text-center">
                <div className="text-xs text-rose-400 font-medium">Regulation ≥ 219</div>
                <div className="text-2xl font-black text-rose-300 font-mono my-1">
                  {cellLowestOver47RegOver219}
                </div>
                <div className="text-[11px] text-rose-400">
                  {(100 - pctLowestOver47WentUnder).toFixed(1)}% of Regime
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              ⚠️ <strong>Pace Floor:</strong> When the lowest scoring quarter stays at or above 47, only{' '}
              <strong className="text-rose-400">{pctLowestOver47WentUnder.toFixed(1)}%</strong> of games finish below 219.
            </div>
          </div>
        </div>
      </div>

      {/* Excel Table Equivalent */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden glow-card">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-bold text-white m-0">
            Under 219 Breakdown Table
          </h3>
          <span className="text-xs text-slate-400">Excel Worksheet Mirror</span>
        </div>

        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead>
            <tr className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800 font-sans">
              <th className="py-3 px-4">Condition</th>
              <th className="py-3 px-4">Games</th>
              <th className="py-3 px-4">Percentage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            <tr className="hover:bg-slate-800/40 bg-emerald-950/20">
              <td className="py-3 px-4 font-sans font-semibold text-emerald-300">
                Regulation Total &lt; 219
              </td>
              <td className="py-3 px-4 font-bold text-white">{metrics.under219}</td>
              <td className="py-3 px-4 text-emerald-400 font-bold">{metrics.under219Pct.toFixed(2)}%</td>
            </tr>
            <tr className="hover:bg-slate-800/40 bg-rose-950/20">
              <td className="py-3 px-4 font-sans font-semibold text-rose-300">
                Regulation Total ≥ 219
              </td>
              <td className="py-3 px-4 font-bold text-white">{metrics.atLeast219}</td>
              <td className="py-3 px-4 text-rose-400 font-bold">{metrics.atLeast219Pct.toFixed(2)}%</td>
            </tr>
            <tr className="hover:bg-slate-800/40 bg-emerald-950/20">
              <td className="py-3 px-4 font-sans font-semibold text-emerald-300">
                Under 219 + Lowest Quarter &lt; 47
              </td>
              <td className="py-3 px-4 font-bold text-white">{metrics.under219LowestUnder47}</td>
              <td className="py-3 px-4 text-emerald-400 font-bold">
                {metrics.under219 > 0
                  ? ((metrics.under219LowestUnder47 / metrics.under219) * 100).toFixed(2)
                  : '0.00'}
                %
              </td>
            </tr>
            <tr className="hover:bg-slate-800/40 bg-rose-950/20">
              <td className="py-3 px-4 font-sans font-semibold text-rose-300">
                Under 219 + Lowest Quarter ≥ 47
              </td>
              <td className="py-3 px-4 font-bold text-white">{metrics.under219Lowest47OrMore}</td>
              <td className="py-3 px-4 text-rose-400 font-bold">
                {metrics.under219 > 0
                  ? ((metrics.under219Lowest47OrMore / metrics.under219) * 100).toFixed(2)
                  : '0.00'}
                %
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
