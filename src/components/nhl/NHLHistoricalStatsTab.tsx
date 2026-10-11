import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Shield,
  Layers,
  Award,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  NHL_5_SEASON_SUMMARIES,
  NHL_5_SEASON_AGGREGATE,
  NHL_GOAL_DISTRIBUTION,
  NHL_MODEL_5_SEASON_BACKTEST,
} from '../../data/nhlHistoricalData';
import { getAllNHLTeams } from '../../data/nhlTeamProfiles';

export const NHLHistoricalStatsTab: React.FC = () => {
  const teams = getAllNHLTeams();
  type SortFieldType = 'fiveSeasonGPG' | 'fiveSeasonGAPG' | 'diff' | 'xgf60' | 'shotsFor60' | 'shotsAgainst60' | 'faceoffWinPct' | 'fiveSeasonWinPct';
  const [sortField, setSortField] = useState<SortFieldType>('fiveSeasonGPG');
  const [sortAsc, setSortAsc] = useState(false);

  // Compute team diffs and sort
  const teamRows = teams.map((t) => ({
    ...t,
    diff: Number((t.fiveSeasonGPG - t.fiveSeasonGAPG).toFixed(2)),
  }));

  teamRows.sort((a, b) => {
    const valA = sortField === 'diff' ? a.diff : (a[sortField] ?? 0);
    const valB = sortField === 'diff' ? b.diff : (b[sortField] ?? 0);
    return sortAsc ? valA - valB : valB - valA;
  });

  const handleSort = (field: SortFieldType) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                5-Season Empirical Dataset
              </span>
              <span className="text-xs text-slate-400">2020-21 through 2024-25 (6,115 Games)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              NHL 5-Season Statistics & Model Backtest
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Comprehensive empirical analysis of scoring trends, home ice advantage, goaltending impact, and backtested performance of the Poisson quantitative edge model across 6,115 regular season games.
            </p>
          </div>
        </div>

        {/* 6 Key Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Scoring Baseline</span>
            <span className="text-base sm:text-lg font-black text-white">{NHL_5_SEASON_AGGREGATE.avgGoalsPerGame} G/Game</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Home: 3.21 | Road: 2.97</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Shots on Goal (SOG)</span>
            <span className="text-base sm:text-lg font-black text-cyan-300">{NHL_5_SEASON_AGGREGATE.avgShotsPerGame} SOG/G</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{NHL_5_SEASON_AGGREGATE.leagueShootingPct}% Shooting Pct</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Faceoff Draws</span>
            <span className="text-base sm:text-lg font-black text-amber-300">{NHL_5_SEASON_AGGREGATE.avgFaceoffsPerGame} Draws/G</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">+1.2% Home Stick Edge</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Home Ice Advantage</span>
            <span className="text-base sm:text-lg font-black text-indigo-300">+{NHL_5_SEASON_AGGREGATE.homeIceAdvantage} Net Goals</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{NHL_5_SEASON_AGGREGATE.homeWinPct}% Win Rate</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Over 5.5 Hit Rate</span>
            <span className="text-base sm:text-lg font-black text-emerald-400">{NHL_5_SEASON_AGGREGATE.over5_5Pct}%</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Push 6.0: {NHL_5_SEASON_AGGREGATE.push6_0Pct}%</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Backtest ROI (5-Yr)</span>
            <span className="text-base sm:text-lg font-black text-emerald-400">+{NHL_MODEL_5_SEASON_BACKTEST.roi}%</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{NHL_MODEL_5_SEASON_BACKTEST.winRate}% Win Rate</span>
          </div>
        </div>
      </div>

      {/* Season by Season League Breakdown Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-blue-500" />
          Season-By-Season League Trends (Past 5 Seasons)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold">
              <tr>
                <th className="py-2.5 px-3">Season</th>
                <th className="py-2.5 px-3">Games</th>
                <th className="py-2.5 px-3">Goals / Game</th>
                <th className="py-2.5 px-3">SOG / Game</th>
                <th className="py-2.5 px-3">Faceoffs / Game</th>
                <th className="py-2.5 px-3">Home GPG</th>
                <th className="py-2.5 px-3">Road GPG</th>
                <th className="py-2.5 px-3">Home Win %</th>
                <th className="py-2.5 px-3">Overtime %</th>
                <th className="py-2.5 px-3">Over 5.5 %</th>
                <th className="py-2.5 px-3">Over 6.0 %</th>
                <th className="py-2.5 px-3">1P Over 1.5 %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {NHL_5_SEASON_SUMMARIES.map((s) => (
                <tr key={s.season} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{s.season}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">{s.games.toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-mono font-black text-indigo-600 dark:text-indigo-400">{s.goalsPerGame}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">{s.avgShotsPerGame}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">{s.avgFaceoffsPerGame}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">{s.homeGPG}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">{s.roadGPG}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">{s.homeWinPct}%</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">{s.otPct}%</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{s.over5_5Pct}%</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">{s.over6_0Pct}%</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">{s.p1Over1_5Pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Goal Distribution Frequency Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-cyan-500" />
            Total Goals Empirical Distribution (6,115 Games)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Notice the key hockey landing numbers: 5 and 6 goals account for over 33% of all NHL game outcomes.
          </p>

          <div className="space-y-2">
            {NHL_GOAL_DISTRIBUTION.map((d) => (
              <div key={d.total} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-bold font-mono text-slate-700 dark:text-slate-300 shrink-0">
                  {d.total} gls
                </span>
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-5 rounded-md overflow-hidden relative">
                  <div
                    className={`h-full rounded-md transition-all ${
                      d.total === '6'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600'
                        : d.total === '5' || d.total === '7'
                        ? 'bg-blue-500 dark:bg-blue-600'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    style={{ width: `${(d.pct / 18) * 100}%` }}
                  ></div>
                </div>
                <span className="w-14 text-right font-mono font-bold text-slate-900 dark:text-white shrink-0">
                  {d.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Backtest Breakdown by Market */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-500" />
            5-Season Out-of-Sample Model Backtest (≥5% EV)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Model profitability when wagering on markets identified with 5.0%+ expected value against closing market consensus odds.
          </p>

          <div className="space-y-3">
            {NHL_MODEL_5_SEASON_BACKTEST.marketBreakdown.map((m) => (
              <div
                key={m.market}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{m.market}</span>
                  <span className="text-[11px] text-slate-500">{m.bets} wagers • Avg Edge: {m.avgEdge}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400 block">
                    +{m.roi}% ROI
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">{m.winRate}% Hit Rate</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 32 Teams 5-Season Statistical Rankings */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-cyan-500" />
            All 32 NHL Teams: 5-Season Baseline Rankings
          </h3>
          <span className="text-xs text-slate-400">Click column headers to sort</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold">
              <tr>
                <th className="py-2.5 px-3">Team</th>
                <th className="py-2.5 px-3">Conf</th>
                <th
                  onClick={() => handleSort('fiveSeasonGPG')}
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <span className="flex items-center gap-1">
                    Goals For (GPG)
                    {sortField === 'fiveSeasonGPG' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('fiveSeasonGAPG')}
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <span className="flex items-center gap-1">
                    Goals Against (GAPG)
                    {sortField === 'fiveSeasonGAPG' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('diff')}
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <span className="flex items-center gap-1">
                    Goal Diff
                    {sortField === 'diff' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('shotsFor60')}
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <span className="flex items-center gap-1">
                    SF/60
                    {sortField === 'shotsFor60' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('shotsAgainst60')}
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <span className="flex items-center gap-1">
                    SA/60
                    {sortField === 'shotsAgainst60' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('faceoffWinPct')}
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <span className="flex items-center gap-1">
                    FO %
                    {sortField === 'faceoffWinPct' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('xgf60')}
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <span className="flex items-center gap-1">
                    5v5 xGF/60
                    {sortField === 'xgf60' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </th>
                <th className="py-2.5 px-3">PP %</th>
                <th className="py-2.5 px-3">PK %</th>
                <th
                  onClick={() => handleSort('fiveSeasonWinPct')}
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <span className="flex items-center gap-1">
                    Win %
                    {sortField === 'fiveSeasonWinPct' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {teamRows.map((t, idx) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-2 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <img
                      src={t.logo}
                      alt={t.name}
                      className="w-5 h-5 object-contain shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://a.espncdn.com/i/teamlogos/nhl/500/scoreboard/${t.abbreviation.toLowerCase()}.png`;
                      }}
                    />
                    <span>{t.name}</span>
                  </td>
                  <td className="py-2 px-3 text-slate-500">{t.conference.slice(0, 4)}</td>
                  <td className="py-2 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{t.fiveSeasonGPG}</td>
                  <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">{t.fiveSeasonGAPG}</td>
                  <td
                    className={`py-2 px-3 font-mono font-bold ${
                      t.diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                    }`}
                  >
                    {t.diff > 0 ? `+${t.diff}` : t.diff}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">{t.shotsFor60}</td>
                  <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">{t.shotsAgainst60}</td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                    <span
                      className={
                        t.faceoffWinPct >= 52.0
                          ? 'text-emerald-600 dark:text-emerald-400 font-black'
                          : t.faceoffWinPct <= 48.0
                          ? 'text-amber-600 dark:text-amber-400'
                          : ''
                      }
                    >
                      {t.faceoffWinPct}%
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">{t.xgf60}</td>
                  <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">{t.powerPlayPct}%</td>
                  <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">{t.penaltyKillPct}%</td>
                  <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">{t.fiveSeasonWinPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
