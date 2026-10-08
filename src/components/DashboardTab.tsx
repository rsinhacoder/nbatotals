import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ReferenceLine,
} from 'recharts';
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Target,
  Percent,
  Calendar,
  Zap,
} from 'lucide-react';
import { NBAGame, DashboardMetrics } from '../types/nba';
import {
  MODEL_INTERCEPT,
  MODEL_SLOPE,
  LOWEST_QUARTER_THRESHOLD,
  REGULATION_TOTAL_THRESHOLD,
  HISTORICAL_MAE,
} from '../utils/modelConstants';

interface DashboardTabProps {
  metrics: DashboardMetrics;
  games: NBAGame[];
  onSelectGame?: (game: NBAGame) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ metrics, games }) => {
  // Scatter & Regression data preparation
  const scatterData = React.useMemo(() => {
    return games.map((g) => ({
      x: g.lowestQuarter,
      actual: g.regulationTotal,
      predicted: Number(g.modelPredictedRegulationTotal.toFixed(2)),
      matchup: `${g.awayTeam} @ ${g.homeTeam}`,
      date: g.date,
      result: g.forecastResult,
      error: Number(g.absoluteModelError.toFixed(2)),
    }));
  }, [games]);

  // Generate continuous regression line coordinates
  const regressionLineData = React.useMemo(() => {
    const minX = Math.min(...games.map((g) => g.lowestQuarter), 32);
    const maxX = Math.max(...games.map((g) => g.lowestQuarter), 58);
    const points = [];
    for (let x = Math.floor(minX); x <= Math.ceil(maxX); x += 2) {
      points.push({
        x,
        regressionLine: Number((MODEL_INTERCEPT + MODEL_SLOPE * x).toFixed(2)),
      });
    }
    return points;
  }, [games]);

  // Combine for composed chart
  const combinedChartData = React.useMemo(() => {
    const map = new Map<number, { x: number; regressionLine?: number; scatterPoints?: Array<{ actual: number; matchup: string; result: string; error: number }> }>();

    regressionLineData.forEach((p) => {
      map.set(p.x, { x: p.x, regressionLine: p.regressionLine });
    });

    scatterData.forEach((s) => {
      const existing = map.get(s.x) || { x: s.x };
      const points = existing.scatterPoints || [];
      points.push({
        actual: s.actual,
        matchup: s.matchup,
        result: s.result,
        error: s.error,
      });
      existing.scatterPoints = points;
      map.set(s.x, existing);
    });

    return Array.from(map.values()).sort((a, b) => a.x - b.x);
  }, [regressionLineData, scatterData]);

  // Accuracy distribution data
  const accuracyBars = [
    { name: 'Within ±5 pts', pct: metrics.within5Pct, fill: '#06b6d4' },
    { name: 'Within ±10 pts', pct: metrics.within10Pct, fill: '#3b82f6' },
    { name: 'Within ±15 pts', pct: metrics.within15Pct, fill: '#6366f1' },
    { name: 'Within MAE (10.16)', pct: metrics.forecastSuccessRate, fill: '#10b981' },
  ];

  // Under 219 split data
  const under219SplitData = [
    {
      group: 'Lowest Q < 47',
      under219Count: metrics.under219LowestUnder47,
      totalCount: metrics.lowestUnder47,
      underPct: metrics.lowestUnder47 > 0
        ? Number(((metrics.under219LowestUnder47 / metrics.lowestUnder47) * 100).toFixed(1))
        : 0,
      color: '#10b981',
    },
    {
      group: 'Lowest Q ≥ 47',
      under219Count: metrics.under219Lowest47OrMore,
      totalCount: metrics.lowest47OrMore,
      underPct: metrics.lowest47OrMore > 0
        ? Number(((metrics.under219Lowest47OrMore / metrics.lowest47OrMore) * 100).toFixed(1))
        : 0,
      color: '#f43f5e',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Model Equation & Season Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Zap className="h-3.5 w-3.5" />
            Empirical Regression Model Formula
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-white tracking-tight">
            Predicted Regulation Total ={' '}
            <span className="text-cyan-400">{MODEL_INTERCEPT.toFixed(4)}</span> +{' '}
            <span className="text-emerald-400">{MODEL_SLOPE.toFixed(4)}</span> ×{' '}
            <span className="text-amber-300">Lowest Quarter</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Derived from 2023-24 &amp; 2024-25 NBA seasons • Out-of-sample benchmarked on 2025-26 • Benchmark MAE: {HISTORICAL_MAE}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5">
          <Calendar className="h-4 w-4 text-cyan-400" />
          <div className="text-right">
            <div className="text-xs text-slate-400">Current Dataset</div>
            <div className="text-sm font-semibold text-slate-200">
              {metrics.totalGames} Games ({metrics.regularGames} Reg / {metrics.preseasonGames} Pre)
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Forecast Success Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Forecast Success Rate
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {metrics.forecastSuccessRate.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              (within ±{HISTORICAL_MAE} pts)
            </span>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.forecastSuccessRate)}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5">
              <span>Goal: &gt;70%</span>
              <span className="text-emerald-400 font-semibold font-mono">
                {Math.round((metrics.forecastSuccessRate / 100) * metrics.totalGames)} of {metrics.totalGames} Games
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Mean Absolute Error (MAE) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Mean Absolute Error
            </span>
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Target className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {metrics.mae.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">pts / game</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">Historical Benchmark:</span>
            <span className="font-mono font-semibold text-slate-200">{HISTORICAL_MAE} pts</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-slate-400">Delta vs Baseline:</span>
            <span
              className={`font-mono font-semibold ${
                metrics.mae <= HISTORICAL_MAE ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {metrics.mae <= HISTORICAL_MAE ? '▼' : '▲'}{' '}
              {Math.abs(metrics.mae - HISTORICAL_MAE).toFixed(2)} pts
            </span>
          </div>
        </div>

        {/* Card 3: Model Fit (R² & RMSE) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Statistical Fit (R² &amp; RMSE)
            </span>
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {metrics.rSquared.toFixed(4)}
            </span>
            <span className="text-xs text-slate-400">R² Correlation</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">RMSE (Spread Error):</span>
            <span className="font-mono font-semibold text-slate-200">{metrics.rmse.toFixed(2)} pts</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-slate-400">Variance Explained:</span>
            <span className="font-mono font-semibold text-cyan-400">
              {(metrics.rSquared * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Card 4: Under 219 Rule Multiplier */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Under 219 Signal Ratio
            </span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Percent className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400 font-mono">
              {metrics.under219Ratio > 0 ? `${metrics.under219Ratio.toFixed(2)} : 1` : 'N/A'}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">Under 219 (Lowest &lt; 47):</span>
            <span className="font-mono font-semibold text-emerald-400">
              {metrics.under219LowestUnder47} games
            </span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-slate-400">Under 219 (Lowest ≥ 47):</span>
            <span className="font-mono font-semibold text-rose-400">
              {metrics.under219Lowest47OrMore} games
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Lowest Quarter vs Regulation Total (Scatter + Regression) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Model Regression: Lowest Quarter vs. Regulation Total</span>
              </h3>
              <p className="text-xs text-slate-400">
                Green points = Within MAE ({HISTORICAL_MAE} pts) • Cyan line = Linear Model Fit
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 inline-block"></span> Success
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block"></span> Failure
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400 font-mono">
                — Reg Line
              </span>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={combinedChartData}
                margin={{ top: 10, right: 20, bottom: 25, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={['dataMin - 2', 'dataMax + 2']}
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  label={{
                    value: 'Lowest Regulation Quarter (Points)',
                    position: 'insideBottom',
                    offset: -15,
                    fill: '#94a3b8',
                    fontSize: 12,
                  }}
                />
                <YAxis
                  type="number"
                  domain={[170, 275]}
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  label={{
                    value: 'Regulation Total (Points)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#94a3b8',
                    fontSize: 12,
                  }}
                />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const p = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                        <div className="font-bold text-white">{p.matchup || `Lowest Q: ${p.x}`}</div>
                        <div className="text-slate-400">Lowest Quarter: <span className="font-mono text-cyan-400">{p.x}</span></div>
                        {p.actual && (
                          <div className="text-slate-300">
                            Actual Total: <span className="font-mono font-bold text-white">{p.actual}</span>
                          </div>
                        )}
                        {p.regressionLine && (
                          <div className="text-slate-300">
                            Model Predicted: <span className="font-mono text-cyan-400">{p.regressionLine}</span>
                          </div>
                        )}
                        {p.error !== undefined && (
                          <div className="text-slate-300">
                            Abs Error: <span className="font-mono text-amber-300">{p.error} pts</span>
                          </div>
                        )}
                        {p.result && (
                          <div className={`font-semibold ${p.result === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            Status: {p.result}
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                {/* Threshold Reference Lines */}
                <ReferenceLine
                  x={LOWEST_QUARTER_THRESHOLD}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Threshold: 47',
                    position: 'top',
                    fill: '#f59e0b',
                    fontSize: 11,
                  }}
                />
                <ReferenceLine
                  y={REGULATION_TOTAL_THRESHOLD}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Threshold: 219',
                    position: 'right',
                    fill: '#f59e0b',
                    fontSize: 11,
                  }}
                />
                {/* Scatter Points */}
                <Scatter
                  name="Actual Games"
                  data={scatterData}
                  fill="#10b981"
                  shape={(props: any) => {
                    const isSuccess = props.payload.result === 'SUCCESS';
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={4.5}
                        fill={isSuccess ? '#10b981' : '#f43f5e'}
                        stroke="#0f172a"
                        strokeWidth={1.5}
                        opacity={0.85}
                      />
                    );
                  }}
                />
                {/* Continuous Regression Fit Line */}
                <Line
                  type="monotone"
                  dataKey="regressionLine"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={false}
                  name="Model Regression Line"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Accuracy Bands Breakdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="h-4 w-4 text-cyan-400" />
              Accuracy Tier Rates
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Prediction accuracy rates across error thresholds
            </p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={accuracyBars} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    unit="%"
                  />
                  <Tooltip
                    formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'Accuracy']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="pct" radius={[6, 6, 0, 0]} fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Metrics Breakdown Table */}
          <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>Avg Lowest Quarter:</span>
              <span className="font-mono font-bold text-cyan-400">{metrics.avgLowestQuarter.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Avg Highest Quarter:</span>
              <span className="font-mono font-bold text-slate-200">{metrics.avgHighestQuarter.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Avg Regulation Total:</span>
              <span className="font-mono font-bold text-white">{metrics.avgRegulationTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Avg Final Total:</span>
              <span className="font-mono font-bold text-white">{metrics.avgFinalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Under 219 Insights Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Under 219 Frequency by Lowest Quarter Regime
          </h4>
          <p className="text-xs text-slate-400 mb-4">
            Comparison of Under 219 likelihood when Lowest Quarter is &lt;47 vs ≥47
          </p>

          <div className="grid grid-cols-2 gap-4">
            {under219SplitData.map((item) => (
              <div
                key={item.group}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between"
              >
                <div className="text-xs font-semibold text-slate-300">{item.group}</div>
                <div className="my-2">
                  <div className="text-2xl font-extrabold font-mono" style={{ color: item.color }}>
                    {item.underPct}%
                  </div>
                  <div className="text-[11px] text-slate-400">
                    went Under 219 ({item.under219Count} / {item.totalCount})
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${item.underPct}%`, backgroundColor: item.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-cyan-400" />
              Quant Key Insights &amp; Edge Rules
            </h4>
            <ul className="text-xs text-slate-300 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>
                  <strong>Lowest Quarter dictates the ceiling:</strong> When a game exhibits a quarter under 47 points, it demonstrates a <span className="text-emerald-400 font-semibold">{metrics.under219Ratio.toFixed(2)}x</span> higher propensity to finish below 219 regulation points.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>
                  <strong>Out-of-sample stability:</strong> The slope of <code className="text-cyan-300 font-mono">2.3274</code> proves that each 1-point variation in the lowest quarter shifts the expected regulation total by over 2.3 points.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>
                  <strong>Reference Totals (Sportsbook Line):</strong> Use the Evaluation tab or Live Simulator to compare the model's output with market closing lines to spot discrepancy edges.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
