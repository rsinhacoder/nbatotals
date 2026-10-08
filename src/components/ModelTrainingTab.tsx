import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Cpu,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  Sliders,
  Check,
  FileCode,
} from 'lucide-react';
import {
  type ModelConfig,
  MODEL_PRESETS,
  FIVE_YEAR_SEASON_STATS,
} from '../utils/modelConstants';

interface ModelTrainingTabProps {
  activeModel: ModelConfig;
  onSelectModel: (config: ModelConfig) => void;
}

export const ModelTrainingTab: React.FC<ModelTrainingTabProps> = ({
  activeModel,
  onSelectModel,
}) => {
  const [customIntercept, setCustomIntercept] = useState(activeModel.intercept);
  const [customSlope, setCustomSlope] = useState(activeModel.slope);
  const [isEditingCustom, setIsEditingCustom] = useState(false);

  // Generate comparison regression lines
  const comparisonChartData = React.useMemo(() => {
    const points = [];
    for (let x = 30; x <= 60; x += 2) {
      points.push({
        x,
        model5Year: Number((119.5598 + 2.3621 * x).toFixed(2)),
        model2Year: Number((114.7597 + 2.3274 * x).toFixed(2)),
        customModel: Number((customIntercept + customSlope * x).toFixed(2)),
      });
    }
    return points;
  }, [customIntercept, customSlope]);

  const handleApplyCustom = () => {
    const customConfig: ModelConfig = {
      id: 'CUSTOM',
      name: 'Custom Calibrated Model',
      shortLabel: 'Custom',
      intercept: customIntercept,
      slope: customSlope,
      other3Intercept: customIntercept,
      other3Slope: customSlope - 1.0,
      historicalMae: 10.0,
      rSquared: 0.45,
      sampleSize: 'User Calibrated',
      seasons: ['Custom'],
      description: 'Manually calibrated user regression coefficients.',
    };
    onSelectModel(customConfig);
    setIsEditingCustom(false);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 rounded-2xl p-5 glow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white m-0">
                  5-Year Multi-Season Model Training &amp; Calibration
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  N = 6,000 Games
                </span>
              </div>
              <p className="text-xs text-slate-400 m-0 mt-0.5">
                Trained across 5 full NBA seasons (2020-21 through 2024-25) via Ordinary Least Squares (OLS) regression.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 text-xs">
            <span className="text-slate-400 block text-[11px]">Active Regression Model</span>
            <span className="font-bold text-cyan-400 font-mono text-sm">{activeModel.name}</span>
          </div>
        </div>
      </div>

      {/* Model Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: 5-Year Trained Model */}
        <div
          onClick={() => onSelectModel(MODEL_PRESETS['5_YEAR'])}
          className={`border rounded-2xl p-5 cursor-pointer transition-all relative ${
            activeModel.id === '5_YEAR'
              ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-cyan-400"></span>
              <span className="font-bold text-white text-sm">
                5-Year Trained Model (2020-2025)
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Recommended
            </span>
          </div>

          <div className="mt-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 font-mono text-xs text-cyan-400">
            Reg Total = <strong>119.5598</strong> + <strong>2.3621</strong> × Lowest Q
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-center font-mono">
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 font-sans">Sample Size</div>
              <div className="font-bold text-white">6,000 Games</div>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 font-sans">5-Year MAE</div>
              <div className="font-bold text-emerald-400">9.77 pts</div>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 font-sans">5-Year R²</div>
              <div className="font-bold text-cyan-400">0.4650</div>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-3 leading-relaxed">
            Captures 5 consecutive seasons. Delivers an improved Mean Absolute Error (9.77 pts) with high sample stability.
          </p>

          {activeModel.id === '5_YEAR' && (
            <div className="mt-3 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Currently Applied Across App
            </div>
          )}
        </div>

        {/* Card 2: Original 2-Year Model */}
        <div
          onClick={() => onSelectModel(MODEL_PRESETS['2_YEAR'])}
          className={`border rounded-2xl p-5 cursor-pointer transition-all relative ${
            activeModel.id === '2_YEAR'
              ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-slate-400"></span>
              <span className="font-bold text-white text-sm">
                Original 2-Year Model (2023-2025)
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
              Original Script
            </span>
          </div>

          <div className="mt-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300">
            Reg Total = <strong>114.7597</strong> + <strong>2.3274</strong> × Lowest Q
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-center font-mono">
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 font-sans">Sample Size</div>
              <div className="font-bold text-white">2,460 Games</div>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 font-sans">Baseline MAE</div>
              <div className="font-bold text-amber-300">10.16 pts</div>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 font-sans">Baseline R²</div>
              <div className="font-bold text-slate-200">0.4410</div>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-3 leading-relaxed">
            The original formula from your Python script, trained exclusively on 2023-24 &amp; 2024-25.
          </p>

          {activeModel.id === '2_YEAR' && (
            <div className="mt-3 text-xs text-cyan-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Currently Applied Across App
            </div>
          )}
        </div>
      </div>

      {/* Season-by-Season Stability Breakdown */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden glow-card">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-white m-0">
              5-Year Season-by-Season Breakdown (2020-21 through 2024-25)
            </h3>
            <p className="text-xs text-slate-400 m-0 mt-0.5">
              Individual performance metrics per NBA season demonstrating consistent slope stability
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
            6,000 Total Games
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800 font-sans">
                <th className="py-3 px-4">Season</th>
                <th className="py-3 px-4">Completed Games</th>
                <th className="py-3 px-4">Avg Lowest Quarter</th>
                <th className="py-3 px-4 text-cyan-400">Avg Regulation Total</th>
                <th className="py-3 px-4 text-emerald-400">Season MAE</th>
                <th className="py-3 px-4">R² Correlation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {FIVE_YEAR_SEASON_STATS.map((row) => (
                <tr key={row.season} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-sans font-bold text-white flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                    {row.season}
                  </td>
                  <td className="py-3 px-4 text-slate-200">{row.games.toLocaleString()}</td>
                  <td className="py-3 px-4 text-slate-300">{row.avgLowestQ.toFixed(2)} pts</td>
                  <td className="py-3 px-4 font-bold text-white text-sm">{row.avgRegTotal.toFixed(2)} pts</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">{row.mae.toFixed(2)} pts</td>
                  <td className="py-3 px-4 text-cyan-400">{row.r2.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regression Slope Comparison Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card">
        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-cyan-400" />
          Regression Line Comparison: 5-Year Model vs. 2-Year Model
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Notice the remarkable slope parallelism (2.3621 vs 2.3274). The 5-year model accurately captures modern pace elevation.
        </p>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={comparisonChartData}
              margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="x"
                domain={[30, 60]}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                label={{ value: 'Lowest Quarter (pts)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                domain={[180, 265]}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                label={{ value: 'Regulation Total (pts)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey="model5Year"
                name="5-Year Model (Y = 119.56 + 2.362X)"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="model2Year"
                name="2-Year Model (Y = 114.76 + 2.327X)"
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
