import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';
import { Layers, ShieldCheck, BarChart2 } from 'lucide-react';
import { BucketStat } from '../types/nba';

interface BucketStabilityTabProps {
  bucketStats: BucketStat[];
}

export const BucketStabilityTab: React.FC<BucketStabilityTabProps> = ({ bucketStats }) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white m-0">
              Lowest Quarter Bucket Stability Analysis
            </h2>
            <p className="text-xs text-slate-400 m-0 mt-0.5">
              Empirical stability evaluation across the 8 discrete scoring intervals: ≤35, 36–39, 40–42, 43–45, 46–47, 48–50, 51–53, 54+
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Regulation Total & Other 3 Quarters by Bucket */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-cyan-400" />
            Progression of Totals Across Buckets
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Compares Avg Regulation Total and Avg Other 3 Quarters across buckets
          </p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bucketStats}
                margin={{ top: 10, right: 10, bottom: 20, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis domain={[100, 270]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toFixed(2)} pts`]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar
                  dataKey="avgRegulationTotal"
                  name="Avg Regulation Total"
                  fill="#06b6d4"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="avgOther3Quarters"
                  name="Avg Other 3 Quarters"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Game Volume & Average Model Error */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 glow-card">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Sample Size &amp; Mean Model Error
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Distribution of games and consistency of error across bucket regimes
          </p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={bucketStats}
                margin={{ top: 10, right: 10, bottom: 20, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  label={{ value: 'Games', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 20]}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  label={{ value: 'Error (pts)', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="games"
                  name="Games Count"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgModelError"
                  name="Avg Model Abs Error"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#f59e0b' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bucket Data Table (Matching the Excel Sheet) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden glow-card">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-bold text-white m-0">
            Bucket Stability Summary Table
          </h3>
          <span className="text-xs text-slate-400">8 Scoring Intervals</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <th className="py-3 px-4 font-sans">Lowest Quarter Bucket</th>
                <th className="py-3 px-4">Games</th>
                <th className="py-3 px-4">Avg Lowest Q</th>
                <th className="py-3 px-4 text-cyan-400">Avg Regulation Total</th>
                <th className="py-3 px-4">Avg Other 3 Quarters</th>
                <th className="py-3 px-4">Avg Highest Q</th>
                <th className="py-3 px-4 text-amber-300">Avg Abs Model Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bucketStats.map((stat) => (
                <tr key={stat.bucket} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-sans font-bold text-white flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                    {stat.bucket}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-200">
                    {stat.games}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {stat.games > 0 ? stat.avgLowestQuarter.toFixed(2) : '--'}
                  </td>
                  <td className="py-3 px-4 font-bold text-cyan-400 text-sm">
                    {stat.games > 0 ? stat.avgRegulationTotal.toFixed(2) : '--'}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {stat.games > 0 ? stat.avgOther3Quarters.toFixed(2) : '--'}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {stat.games > 0 ? stat.avgHighestQuarter.toFixed(2) : '--'}
                  </td>
                  <td className="py-3 px-4 font-semibold text-amber-300">
                    {stat.games > 0 ? stat.avgModelError.toFixed(2) : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
