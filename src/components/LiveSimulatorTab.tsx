import React, { useState, useMemo } from 'react';
import {
  Sliders,
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle,
  Layers,
} from 'lucide-react';
import {
  MODEL_INTERCEPT,
  MODEL_SLOPE,
  OTHER_3_INTERCEPT,
  OTHER_3_SLOPE,
  LOWEST_QUARTER_THRESHOLD,
  HISTORICAL_MAE,
  getLowestBucket,
} from '../utils/modelConstants';
import type { NBAGame } from '../types/nba';

interface LiveSimulatorTabProps {
  games: NBAGame[];
  initialLowestQ?: number;
  initialSportsbookLine?: number;
}

export const LiveSimulatorTab: React.FC<LiveSimulatorTabProps> = ({
  games,
  initialLowestQ = 44,
  initialSportsbookLine = 222.5,
}) => {
  const [inputMode, setInputMode] = useState<'quick' | 'quarters'>('quick');

  // Quick mode: Lowest Quarter input
  const [quickLowestQ, setQuickLowestQ] = useState<number>(initialLowestQ);

  // Full Quarters mode
  const [q1, setQ1] = useState<number>(initialLowestQ);
  const [q2, setQ2] = useState<number>(initialLowestQ + 11);
  const [q3, setQ3] = useState<number>(initialLowestQ + 8);
  const [q4, setQ4] = useState<number>(initialLowestQ + 6);

  // Sportsbook Reference Line
  const [sportsbookLine, setSportsbookLine] = useState<number>(initialSportsbookLine);

  // Derived lowest quarter based on mode
  const effectiveLowestQ = useMemo(() => {
    if (inputMode === 'quick') {
      return quickLowestQ;
    }
    return Math.min(q1, q2, q3, q4);
  }, [inputMode, quickLowestQ, q1, q2, q3, q4]);

  const effectiveHighestQ = useMemo(() => {
    if (inputMode === 'quick') {
      return quickLowestQ + 12; // estimated
    }
    return Math.max(q1, q2, q3, q4);
  }, [inputMode, quickLowestQ, q1, q2, q3, q4]);

  // Model Predictions
  const predictedRegulationTotal = useMemo(() => {
    return MODEL_INTERCEPT + MODEL_SLOPE * effectiveLowestQ;
  }, [effectiveLowestQ]);

  const predictedOther3 = useMemo(() => {
    return OTHER_3_INTERCEPT + OTHER_3_SLOPE * effectiveLowestQ;
  }, [effectiveLowestQ]);

  // Discrepancy & Edge vs Sportsbook Line
  const edge = useMemo(() => {
    return predictedRegulationTotal - sportsbookLine;
  }, [predictedRegulationTotal, sportsbookLine]);

  // Signal categorization
  const signal = useMemo(() => {
    if (edge <= -5.0) {
      return {
        label: 'STRONG UNDER VALUE',
        color: 'emerald',
        bg: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300',
        textColor: 'text-emerald-400',
        desc: `Model predicts ${predictedRegulationTotal.toFixed(1)}, which is ${Math.abs(edge).toFixed(1)} points below the sportsbook line (${sportsbookLine}). Significant historical edge on the UNDER.`,
      };
    } else if (edge < -2.0) {
      return {
        label: 'LEAN UNDER',
        color: 'cyan',
        bg: 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300',
        textColor: 'text-cyan-400',
        desc: `Model prediction is ${Math.abs(edge).toFixed(1)} points under the line. Favorable lean toward the UNDER.`,
      };
    } else if (edge <= 2.0) {
      return {
        label: 'MARKET ALIGNED (PASS)',
        color: 'slate',
        bg: 'bg-slate-900 border-slate-700 text-slate-300',
        textColor: 'text-slate-400',
        desc: `Model prediction (${predictedRegulationTotal.toFixed(1)}) closely matches the sportsbook total (${sportsbookLine}). No clear statistical discrepancy.`,
      };
    } else if (edge < 5.0) {
      return {
        label: 'LEAN OVER',
        color: 'amber',
        bg: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
        textColor: 'text-amber-400',
        desc: `Model prediction is ${edge.toFixed(1)} points above the sportsbook line. Favorable lean toward the OVER.`,
      };
    } else {
      return {
        label: 'STRONG OVER VALUE',
        color: 'rose',
        bg: 'bg-rose-950/80 border-rose-500/50 text-rose-300',
        textColor: 'text-rose-400',
        desc: `Model predicts ${predictedRegulationTotal.toFixed(1)}, which is ${edge.toFixed(1)} points above the sportsbook line (${sportsbookLine}). Significant historical edge on the OVER.`,
      };
    }
  }, [edge, predictedRegulationTotal, sportsbookLine]);

  // Historical bucket analysis for current lowest quarter
  const currentBucket = getLowestBucket(effectiveLowestQ);
  const bucketHistoricalGames = useMemo(() => {
    return games.filter((g) => g.lowestBucket === currentBucket);
  }, [games, currentBucket]);

  const bucketStats = useMemo(() => {
    const count = bucketHistoricalGames.length;
    if (count === 0) return null;
    const avgReg = bucketHistoricalGames.reduce((acc, g) => acc + g.regulationTotal, 0) / count;
    const under219Count = bucketHistoricalGames.filter((g) => g.regulationUnder219).length;
    const under219Pct = (under219Count / count) * 100;
    const avgErr = bucketHistoricalGames.reduce((acc, g) => acc + g.absoluteModelError, 0) / count;
    const successRate = (bucketHistoricalGames.filter((g) => g.withinHistoricalMAE).length / count) * 100;

    return {
      count,
      avgReg,
      under219Pct,
      avgErr,
      successRate,
    };
  }, [bucketHistoricalGames]);

  return (
    <div className="space-y-6">
      {/* Top Controller: Mode Selection & Quick Presets */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 m-0">
              <Sliders className="h-5 w-5 text-cyan-400" />
              Live In-Game &amp; Pre-Game Total Simulator
            </h2>
            <p className="text-xs text-slate-400 mt-1 m-0">
              Simulate regulation totals, other 3 quarters, and compute live betting edge against market lines.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setInputMode('quick')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                inputMode === 'quick'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Quick Lowest Q Slider
            </button>
            <button
              onClick={() => setInputMode('quarters')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                inputMode === 'quarters'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              4-Quarter Breakdown
            </button>
          </div>
        </div>

        {/* Inputs Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-5 border-t border-slate-800/80">
          {/* Input Block: Quarter inputs */}
          <div className="md:col-span-2 space-y-4">
            {inputMode === 'quick' ? (
              <div className="space-y-4 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-300">
                    Lowest Regulation Quarter (Points)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black font-mono text-cyan-400">
                      {quickLowestQ}
                    </span>
                    <span className="text-xs text-slate-400">pts</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="28"
                  max="62"
                  value={quickLowestQ}
                  onChange={(e) => setQuickLowestQ(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />

                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>28 (Extreme Defensive)</span>
                  <span>47 (Threshold Rule)</span>
                  <span>62 (Run &amp; Gun)</span>
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-xs text-slate-400 self-center mr-1">Presets:</span>
                  {[38, 42, 45, 47, 50, 54].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setQuickLowestQ(preset)}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                        quickLowestQ === preset
                          ? 'bg-cyan-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {preset} pts
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="text-xs font-semibold text-slate-300">
                  Individual Quarter Total Scores (Both Teams Combined)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Q1 Total</label>
                    <input
                      type="number"
                      value={q1}
                      onChange={(e) => setQ1(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Q2 Total</label>
                    <input
                      type="number"
                      value={q2}
                      onChange={(e) => setQ2(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Q3 Total</label>
                    <input
                      type="number"
                      value={q3}
                      onChange={(e) => setQ3(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Q4 Total</label>
                    <input
                      type="number"
                      value={q4}
                      onChange={(e) => setQ4(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>
                    Detected Lowest Quarter:{' '}
                    <strong className="text-cyan-400 font-mono text-sm">{effectiveLowestQ} pts</strong>
                  </span>
                  <span>
                    Detected Highest Quarter:{' '}
                    <strong className="text-white font-mono text-sm">{effectiveHighestQ} pts</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input Block: Sportsbook Line */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                Sportsbook Over/Under Total (Reference Line)
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Current Vegas / sports betting total to measure against the model
              </p>

              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={sportsbookLine}
                  onChange={(e) => setSportsbookLine(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-2xl font-mono font-bold text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex gap-2 mt-3">
                {[218.5, 222.5, 226.5, 230.5].map((linePreset) => (
                  <button
                    key={linePreset}
                    onClick={() => setSportsbookLine(linePreset)}
                    className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 transition-colors cursor-pointer"
                  >
                    {linePreset}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800/80 mt-3">
              Tolerance benchmark: <strong className="text-slate-200">±{HISTORICAL_MAE} pts</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Results & Edge Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Predictions Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-cyan-400" />
            Model Regression Output
          </h3>

          {/* Primary Metric: Predicted Regulation Total */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400">Predicted Regulation Total</div>
            <div className="text-4xl font-black text-cyan-400 font-mono tracking-tight my-1">
              {predictedRegulationTotal.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400">
              Formula: {MODEL_INTERCEPT.toFixed(2)} + ({MODEL_SLOPE.toFixed(2)} × {effectiveLowestQ})
            </div>
          </div>

          {/* Secondary Metric: Other 3 Quarters Model */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400">Predicted Other 3 Quarters</div>
            <div className="text-2xl font-extrabold text-slate-200 font-mono my-1">
              {predictedOther3.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400">
              Expected avg per other quarter: {(predictedOther3 / 3).toFixed(1)} pts
            </div>
          </div>

          {/* Confidence Band (MAE Interval) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-1">Expected 1-MAE Range (68% CI)</div>
            <div className="flex justify-between items-center font-mono text-sm">
              <span className="text-slate-300">
                {(predictedRegulationTotal - HISTORICAL_MAE).toFixed(1)}
              </span>
              <span className="text-cyan-400 font-bold">--- {predictedRegulationTotal.toFixed(1)} ---</span>
              <span className="text-slate-300">
                {(predictedRegulationTotal + HISTORICAL_MAE).toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Quant Betting Recommendation Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              Quant Discrepancy &amp; Market Edge
            </h3>

            {/* Edge Badge */}
            <div className={`border rounded-2xl p-5 ${signal.bg}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Recommended Position
                </span>
                {edge < 0 ? (
                  <TrendingDown className="h-5 w-5 text-emerald-400" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-rose-400" />
                )}
              </div>
              <div className="text-2xl font-black font-mono tracking-tight mt-1">
                {signal.label}
              </div>
              <p className="text-xs mt-2 leading-relaxed opacity-90">{signal.desc}</p>
            </div>

            {/* Market Gap Number */}
            <div className="mt-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex justify-between items-center font-mono">
              <div>
                <div className="text-xs text-slate-400 font-sans">Model vs Sportsbook Gap</div>
                <div className="text-xs text-slate-500 font-sans">
                  {predictedRegulationTotal.toFixed(1)} vs {sportsbookLine.toFixed(1)}
                </div>
              </div>
              <div
                className={`text-2xl font-black ${
                  edge < 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {edge > 0 ? `+${edge.toFixed(2)}` : edge.toFixed(2)} pts
              </div>
            </div>
          </div>

          {/* Under 219 Rule Alert if Lowest Q < 47 */}
          {effectiveLowestQ < LOWEST_QUARTER_THRESHOLD && (
            <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Rule Triggered: Lowest Q &lt; 47 ({effectiveLowestQ})</strong>
                <p className="text-[11px] text-amber-300/80 mt-0.5">
                  Historically, games where any quarter fails to reach 47 points show a strong statistical propensity to stay below 219 regulation points.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Historical Bucket Performance Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              Historical Bucket Context ({currentBucket})
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Empirical data from all games in the current database falling into the <strong>"{currentBucket}"</strong> bucket
            </p>

            {bucketStats ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Historical Games in Bucket:</span>
                  <span className="text-white font-bold">{bucketStats.count} games</span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Avg Actual Regulation Total:</span>
                  <span className="text-cyan-400 font-bold">{bucketStats.avgReg.toFixed(1)} pts</span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Under 219 Hit Frequency:</span>
                  <span
                    className={`font-bold ${
                      bucketStats.under219Pct >= 50 ? 'text-emerald-400' : 'text-slate-300'
                    }`}
                  >
                    {bucketStats.under219Pct.toFixed(1)}%
                  </span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Forecast Model Success Rate:</span>
                  <span className="text-emerald-400 font-bold">
                    {bucketStats.successRate.toFixed(1)}%
                  </span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Avg Model Absolute Error:</span>
                  <span className="text-slate-200">{bucketStats.avgErr.toFixed(2)} pts</span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No games recorded in bucket "{currentBucket}" yet.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center gap-1">
            <Info className="h-3.5 w-3.5 text-slate-400" />
            Historical sample provides real-world stability checks.
          </div>
        </div>
      </div>
    </div>
  );
};
