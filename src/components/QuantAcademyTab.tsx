import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Target,
  TrendingDown,
  Sliders,
  DollarSign,
  Calculator,
  Flame,
} from 'lucide-react';
import { type ModelConfig } from '../utils/modelConstants';

interface QuantAcademyTabProps {
  activeModel: ModelConfig;
}

export const QuantAcademyTab: React.FC<QuantAcademyTabProps> = ({ activeModel }) => {
  // Interactive Sandbox state
  const [sandboxLowestQ, setSandboxLowestQ] = useState<number>(42);
  const [sandboxMarketLine, setSandboxMarketLine] = useState<number>(223.5);

  const sandboxPredictedTotal = useMemo(() => {
    return Number((activeModel.intercept + activeModel.slope * sandboxLowestQ).toFixed(1));
  }, [activeModel, sandboxLowestQ]);

  const sandboxPredictedOther3 = useMemo(() => {
    return Number((activeModel.other3Intercept + activeModel.other3Slope * sandboxLowestQ).toFixed(1));
  }, [activeModel, sandboxLowestQ]);

  const sandboxAvgOtherQ = (sandboxPredictedOther3 / 3).toFixed(1);

  const sandboxEdge = Number((sandboxPredictedTotal - sandboxMarketLine).toFixed(1));

  return (
    <div className="space-y-8">
      {/* Academy Hero Header */}
      <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-6 sm:p-8 shadow-xs relative overflow-hidden transition-colors duration-200">
        <div className="max-w-3xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-emerald-950/80 text-blue-700 dark:text-emerald-400 border border-blue-200 dark:border-emerald-800/80">
            <GraduationCap className="h-4 w-4" />
            Quantitative Sports Betting Strategy
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight m-0">
            How to Beat NBA Over/Under Lines Using the{' '}
            <span className="text-blue-600 dark:text-amber-400">Lowest Quarter Regression</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed m-0">
            Most bettors lose money betting NBA totals because they rely on season points-per-game averages. This quantitative model was trained across <strong>6,000 NBA games</strong> (5 complete seasons) to isolate the single strongest predictor of game pace: the <strong>lowest-scoring quarter floor</strong>.
          </p>
        </div>
      </div>

      {/* 4 Core Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pillar 1: The Flaw in Sportsbook Lines */}
        <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-6 shadow-xs space-y-3 transition-colors duration-200">
          <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-amber-500/10 border border-blue-200 dark:border-amber-400/30 flex items-center justify-center">
            <Target className="h-5 w-5 text-blue-600 dark:text-amber-400" />
          </div>
          <div className="text-xs font-bold text-blue-700 dark:text-amber-400 uppercase tracking-wider">
            Concept #1
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white m-0">
            Why Sportsbook Totals are Inefficient
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed m-0">
            Sportsbooks set Over/Under totals (e.g. 226.5) by averaging Team A’s pace and Team B’s pace. This arithmetic average fails because basketball scoring distribution is <strong>asymmetrical</strong>. When a team suffers a shooting drought or plays extensive bench rotations in the 2nd quarter, that cold quarter drags down the entire game’s scoring ceiling beyond what simple averages foresee.
          </p>
        </div>

        {/* Pillar 2: The Lowest Quarter Formula */}
        <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-6 shadow-xs space-y-3 transition-colors duration-200">
          <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
            <Calculator className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Concept #2
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white m-0">
            The 5-Year OLS Regression Equation
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed m-0">
            Across 6,000 NBA regular-season games from 2020 through 2025, our Ordinary Least Squares (OLS) regression discovered:
          </p>
          <div className="bg-slate-50 dark:bg-[#090d16] p-3 rounded-xl border border-slate-200 dark:border-[#1c2438] font-mono text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 font-bold">
            Total Points = 119.5598 + (2.3621 × Lowest Quarter)
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed m-0">
            For every 1 point increase in the lowest quarter, the final regulation total rises by an average of <strong>2.36 points</strong>. Mean Absolute Error (MAE) is only <strong>9.77 points</strong>.
          </p>
        </div>

        {/* Pillar 3: The 47-Point Threshold Rule */}
        <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-6 shadow-xs space-y-3 transition-colors duration-200">
          <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-amber-500/10 border border-blue-200 dark:border-amber-500/30 flex items-center justify-center">
            <TrendingDown className="h-5 w-5 text-blue-600 dark:text-amber-400" />
          </div>
          <div className="text-xs font-bold text-blue-700 dark:text-amber-400 uppercase tracking-wider">
            Concept #3
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white m-0">
            The Rule of 47: The 10.26 : 1 Asymmetry
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed m-0">
            Empirical data yields an astonishing rule: when an NBA game contains <strong>even one quarter scoring below 47 combined points</strong>:
          </p>
          <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
            <li><strong>91.1%</strong> of all games that finish Under 219 points had a Lowest Q &lt; 47.</li>
            <li>Games with Lowest Q &lt; 47 produce <strong>10.26 times more Under 219 outcomes</strong> than games where every quarter reaches 47+ points.</li>
          </ul>
        </div>

        {/* Pillar 4: Live In-Game Capping */}
        <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-6 shadow-xs space-y-3 transition-colors duration-200">
          <div className="h-10 w-10 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center">
            <Flame className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
            Concept #4
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white m-0">
            The Live In-Game Statistical Cap
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed m-0">
            If you are watching a live game and Quarter 1 finishes with 41 total points:
          </p>
          <div className="bg-slate-50 dark:bg-[#090d16] p-3 rounded-xl border border-slate-200 dark:border-[#1c2438] text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <div className="font-bold text-rose-700 dark:text-rose-300">The Lowest Quarter ceiling is locked at ≤ 41!</div>
            <div>Maximum expected regulation total: 119.56 + (2.3621 × 41) ≈ <strong>216.4 pts</strong>.</div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed m-0">
            If sportsbooks are still posting live totals of 223.5 at the end of Q1, you hold an immediate <strong>+7.1 point statistical advantage on the UNDER</strong>.
          </p>
        </div>
      </div>

      {/* Interactive Strategy Sandbox */}
      <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-6 sm:p-8 shadow-xs space-y-6 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-cyan-950 text-blue-700 dark:text-amber-300 border border-blue-200 dark:border-cyan-800 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5" />
                Interactive Simulation Sandbox
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight m-0">
              Test the Model in Real Time
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 m-0">
              Drag the sliders below to see how the lowest quarter directly dictates the final game score and reveals whether to bet Over or Under.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
          {/* Sliders Input */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Hypothetical Lowest Quarter Score
                </label>
                <span className="text-base font-mono font-bold text-blue-700 dark:text-amber-400">
                  {sandboxLowestQ} Points
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="56"
                step="1"
                value={sandboxLowestQ}
                onChange={(e) => setSandboxLowestQ(parseInt(e.target.value))}
                className="w-full accent-blue-600 dark:accent-amber-400 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-500 mt-1 font-mono">
                <span>30 pts (Extreme Defensive)</span>
                <span className="text-blue-700 dark:text-amber-400 font-bold">47 Threshold</span>
                <span>56 pts (Shootout)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Sportsbook Consensus Over/Under Line
                </label>
                <span className="text-base font-mono font-bold text-blue-700 dark:text-amber-300">
                  {sandboxMarketLine} Points
                </span>
              </div>
              <input
                type="range"
                min="200"
                max="240"
                step="0.5"
                value={sandboxMarketLine}
                onChange={(e) => setSandboxMarketLine(parseFloat(e.target.value))}
                className="w-full accent-blue-600 dark:accent-amber-400 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-500 mt-1 font-mono">
                <span>200.0 (Low Pace)</span>
                <span>220.0 (Average)</span>
                <span>240.0 (High Pace)</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 dark:text-slate-400">Quick Scenarios:</span>
              <button
                onClick={() => {
                  setSandboxLowestQ(38);
                  setSandboxMarketLine(224.5);
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent cursor-pointer transition-colors"
              >
                Sluggish Q2 (38 pts)
              </button>
              <button
                onClick={() => {
                  setSandboxLowestQ(44);
                  setSandboxMarketLine(222.0);
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent cursor-pointer transition-colors"
              >
                NBA Average (44 pts)
              </button>
              <button
                onClick={() => {
                  setSandboxLowestQ(50);
                  setSandboxMarketLine(228.0);
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent cursor-pointer transition-colors"
              >
                High Pace / Fast (50 pts)
              </button>
            </div>
          </div>

          {/* Sandbox Live Output Box */}
          <div className="bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1c2438] rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Model Projected Total
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {sandboxPredictedTotal} pts
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Other 3 Quarters Sum:</span>
                <span className="font-mono text-slate-900 dark:text-amber-300 font-bold">
                  {sandboxPredictedOther3} pts (avg {sandboxAvgOtherQ}/Q)
                </span>
              </div>

              <div className="h-px bg-slate-200 dark:bg-slate-800"></div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Point Discrepancy (Edge)
                </span>
                <span
                  className={`text-xl font-black font-mono ${
                    sandboxEdge <= -3 ? 'text-emerald-700 dark:text-emerald-400' : sandboxEdge >= 3 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {sandboxEdge > 0 ? `+${sandboxEdge}` : sandboxEdge} pts
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Breaches &lt;219 Threshold:</span>
                <span className={`font-bold ${sandboxPredictedTotal < 219 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                  {sandboxPredictedTotal < 219 ? 'YES (Under 219)' : 'NO (219 or More)'}
                </span>
              </div>
            </div>

            {/* Verdict in sandbox */}
            <div
              className={`p-4 rounded-xl border ${
                sandboxEdge <= -3
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-300'
                  : sandboxEdge >= 3
                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-500/40 text-rose-900 dark:text-rose-300'
                  : 'bg-white dark:bg-[#0f1422] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400'
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-wider">
                {sandboxEdge <= -3 ? '📉 ACTIONABLE PICK: BET UNDER' : sandboxEdge >= 3 ? '📈 ACTIONABLE PICK: BET OVER' : '⚪ MARKET ALIGNED: PASS'}
              </div>
              <div className="text-xs mt-1">
                {sandboxEdge <= -3
                  ? `Model is ${Math.abs(sandboxEdge)} pts lower than the book (${sandboxMarketLine}). High probability UNDER.`
                  : sandboxEdge >= 3
                  ? `Model is ${sandboxEdge} pts higher than the book (${sandboxMarketLine}). High probability OVER.`
                  : `Model closely aligns with market line (${sandboxMarketLine}). No sufficient edge.`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bet Sizing and Risk Management */}
      <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-6 sm:p-8 shadow-xs space-y-6 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-amber-500/10 border border-blue-200 dark:border-amber-500/30 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-blue-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white m-0">
              Bankroll Management &amp; Unit Sizing Rules
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
              Disciplined position sizing protects your bankroll during cold streaks and maximizes compound growth.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-[#090d16] p-4 rounded-2xl border border-slate-200 dark:border-[#1c2438] space-y-2">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              Edge &lt; 3.0 Points
            </div>
            <div className="text-lg font-bold text-slate-700 dark:text-slate-300">
              0 Units (PASS)
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed m-0">
              Do not force bets. A margin under 3 points does not adequately overcome the standard -110 sportsbook vig (4.76% break-even hurdle).
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-[#090d16] p-4 rounded-2xl border border-blue-200 dark:border-amber-400/30 space-y-2">
            <div className="text-xs font-bold text-blue-700 dark:text-amber-400 uppercase">
              Edge 3.5 to 4.9 Points
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              1.0 Unit (Standard Play)
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed m-0">
              Solid statistical divergence with estimated 56–62% win rate. Represents 1% of total bankroll.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-[#090d16] p-4 rounded-2xl border border-emerald-300 dark:border-emerald-500/40 space-y-2">
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">
              Edge ≥ 5.0 Points
            </div>
            <div className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
              2.0 Units (Max Conviction)
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed m-0">
              Significant market mispricing. Historically occurs on only 15–20% of slates with estimated 68–74% win rate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default QuantAcademyTab;
