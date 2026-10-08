import React, { useState } from 'react';
import { BookOpen, Calculator, CheckCircle2, Cpu } from 'lucide-react';
import {
  MODEL_INTERCEPT,
  MODEL_SLOPE,
  OTHER_3_INTERCEPT,
  OTHER_3_SLOPE,
  HISTORICAL_MAE,
} from '../utils/modelConstants';

export const ModelExplanationTab: React.FC = () => {
  const [interactiveX, setInteractiveX] = useState<number>(44);

  const mainCalc = MODEL_INTERCEPT + MODEL_SLOPE * interactiveX;
  const other3Calc = OTHER_3_INTERCEPT + OTHER_3_SLOPE * interactiveX;

  const explanations = [
    {
      term: 'Main Forecast Equation',
      formula: `Predicted Regulation Total = ${MODEL_INTERCEPT.toFixed(4)} + ${MODEL_SLOPE.toFixed(4)} × Lowest Regulation Quarter`,
      desc: 'Linear regression model trained to estimate the 48-minute regulation total score using the lowest scoring quarter as the sole independent predictor.',
    },
    {
      term: 'Other 3 Quarters Equation',
      formula: `Predicted Other 3 Quarters = ${OTHER_3_INTERCEPT.toFixed(4)} + ${OTHER_3_SLOPE.toFixed(4)} × Lowest Regulation Quarter`,
      desc: 'Predicts the cumulative score of the remaining three quarters excluding the lowest quarter. Notice that the slope is exactly (MODEL_SLOPE - 1.0000 = 1.3274).',
    },
    {
      term: 'R² (Coefficient of Determination)',
      formula: 'R² = r²',
      desc: 'Measures how much of the variation in final regulation totals is explained strictly by the variation in the lowest scoring quarter. In testing, this exhibits very high out-of-sample explanatory power.',
    },
    {
      term: 'MAE (Mean Absolute Error)',
      formula: 'MAE = (1/n) × Σ |Actual - Predicted|',
      desc: `The average absolute margin of error across all forecasts. The historical out-of-sample benchmark is ${HISTORICAL_MAE} points.`,
    },
    {
      term: 'RMSE (Root Mean Squared Error)',
      formula: 'RMSE = √[(1/n) × Σ (Actual - Predicted)²]',
      desc: 'Heavily penalizes extreme outliers. Helps evaluate the dispersion and spread risk of model predictions.',
    },
    {
      term: 'SUCCESS / FAILURE Criterion',
      formula: `|Error| ≤ ${HISTORICAL_MAE} pts`,
      desc: `A prediction is graded as SUCCESS if the absolute prediction error is within the historical out-of-sample MAE (${HISTORICAL_MAE} points). Otherwise, it is marked as FAILURE.`,
    },
    {
      term: 'Accuracy Bands (±5, ±10, ±15)',
      formula: '|Error| ≤ 5, 10, 15',
      desc: 'Key precision indicators used in sports betting to gauge how frequently predictions fall within standard basketball totals ranges.',
    },
    {
      term: 'Reference Total Comparison',
      formula: '|Model - Reference| ≤ 10.16',
      desc: 'Compares the model forecast with the sportsbook opening/closing line. If the absolute difference is within tolerance, it is marked "CLOSE"; if greater, it is flagged as "LARGE GAP", indicating a potential market pricing discrepancy.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white m-0">
              Quantitative Methodology &amp; Mathematical Specification
            </h2>
            <p className="text-xs text-slate-400 m-0 mt-0.5">
              Comprehensive reference of the formulas, derivations, out-of-sample testing parameters, and evaluation criteria.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Sandbox Equation Explorer */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-cyan-500/30 rounded-2xl p-6 glow-card">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-2">
          <Calculator className="h-4 w-4" />
          Interactive Equation Sandbox
        </div>
        <h3 className="text-base font-bold text-white m-0 mb-3">
          Deconstruct the Regression Calculation in Real Time
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <label className="text-xs text-slate-300 font-semibold block">
              Adjust Lowest Quarter (X): <span className="font-mono text-cyan-400 text-base">{interactiveX}</span>
            </label>
            <input
              type="range"
              min="30"
              max="60"
              value={interactiveX}
              onChange={(e) => setInteractiveX(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>30 pts</span>
              <span>45 pts</span>
              <span>60 pts</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-1.5">
            <div className="text-slate-400 font-sans font-semibold">Predicted Regulation Total (Y)</div>
            <div className="text-2xl font-black text-cyan-400">
              {mainCalc.toFixed(2)}
            </div>
            <div className="text-slate-400 text-[11px]">
              = {MODEL_INTERCEPT.toFixed(4)} + ({MODEL_SLOPE.toFixed(4)} × {interactiveX})
            </div>
            <div className="text-slate-500 text-[11px]">
              = {MODEL_INTERCEPT.toFixed(2)} + {(MODEL_SLOPE * interactiveX).toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-1.5">
            <div className="text-slate-400 font-sans font-semibold">Predicted Other 3 Quarters</div>
            <div className="text-2xl font-black text-slate-200">
              {other3Calc.toFixed(2)}
            </div>
            <div className="text-slate-400 text-[11px]">
              = {OTHER_3_INTERCEPT.toFixed(4)} + ({OTHER_3_SLOPE.toFixed(4)} × {interactiveX})
            </div>
            <div className="text-slate-500 text-[11px]">
              Average per remaining quarter: {(other3Calc / 3).toFixed(1)} pts
            </div>
          </div>
        </div>
      </div>

      {/* Model Derivation & Provenance Callout */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 glow-card">
        <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <Cpu className="h-4 w-4 text-emerald-400" />
          Model Origin &amp; Validation Protocol
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          The regression parameters were trained on full-season NBA tracking data from the{' '}
          <strong className="text-white">2023-24</strong> and{' '}
          <strong className="text-white">2024-25</strong> seasons, capturing pace adjustments, modern 3-point volume, and offensive efficiency distributions. The model was subsequently validated{' '}
          <strong className="text-cyan-400">out-of-sample on the 2025-26 season</strong>, verifying that the empirical relationship between the lowest scoring quarter and the overall regulation total remains stable across varying refereeing points of emphasis and pace variations.
        </p>
      </div>

      {/* Terms & Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {explanations.map((item) => (
          <div
            key={item.term}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white">{item.term}</span>
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="font-mono text-xs text-cyan-400 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
              {item.formula}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
