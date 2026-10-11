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
  Plane,
  Clock,
  Search,
  Filter,
} from 'lucide-react';
import {
  KHL_HISTORICAL_SEASONS,
  KHL_FIVE_SEASON_AGGREGATE,
  KHL_FAR_EAST_TRAVEL_STUDY,
} from '../../data/khlHistoricalData';
import { getAllKHLTeams } from '../../data/khlTeamProfiles';
import type { KHLTeamMetrics } from '../../types/khl';

interface KHLTeamRow extends KHLTeamMetrics {
  diff: number;
}

export const KHLHistoricalStatsTab: React.FC = () => {
  const teams: KHLTeamMetrics[] = getAllKHLTeams();
  type SortFieldType =
    | 'fiveSeasonGPG'
    | 'fiveSeasonGAPG'
    | 'diff'
    | 'xgf60'
    | 'xga60'
    | 'shotsFor60'
    | 'shotsAgainst60'
    | 'powerPlayPct'
    | 'penaltyKillPct'
    | 'faceoffWinPct'
    | 'fiveSeasonWinPct';

  const [sortField, setSortField] = useState<SortFieldType>('fiveSeasonGPG');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedConf, setSelectedConf] = useState<'ALL' | 'WEST' | 'EAST'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Compute team diffs and filter
  const teamRows: KHLTeamRow[] = teams.map((t: KHLTeamMetrics) => ({
    ...t,
    diff: Number((t.fiveSeasonGPG - t.fiveSeasonGAPG).toFixed(2)),
  }));

  const filteredTeams: KHLTeamRow[] = teamRows.filter((t: KHLTeamRow) => {
    if (selectedConf === 'WEST' && t.conference !== 'Western') return false;
    if (selectedConf === 'EAST' && t.conference !== 'Eastern') return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q) ||
        t.abbreviation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  filteredTeams.sort((a: KHLTeamRow, b: KHLTeamRow) => {
    const valA = sortField === 'diff' ? a.diff : ((a[sortField] as number) ?? 0);
    const valB = sortField === 'diff' ? b.diff : ((b[sortField] as number) ?? 0);
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
              <span className="text-xs text-slate-400">2021-22 through 2025-26 (4,080 Games)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              KHL 5-Season Analytics &amp; Empirical Study
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Rigorous quantitative breakdown of Kontinental Hockey League scoring distributions, home ice edge, regulation draw probability, Under 5.5 hit rates, and the Far East travel phenomenon across 4,080 regular season games.
            </p>
          </div>
        </div>

        {/* 6 Key Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Scoring Baseline</span>
            <span className="text-base sm:text-lg font-black text-white">
              {KHL_FIVE_SEASON_AGGREGATE.avgGPG} G/Game
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Home: {KHL_FIVE_SEASON_AGGREGATE.avgHomeGPG} | Road: {KHL_FIVE_SEASON_AGGREGATE.avgRoadGPG}
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Under 5.5 Hit Rate</span>
            <span className="text-base sm:text-lg font-black text-emerald-400">
              {KHL_FIVE_SEASON_AGGREGATE.under5_5Rate}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Over 5.5: {KHL_FIVE_SEASON_AGGREGATE.over5_5Rate}%
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Regulation Draw Rate</span>
            <span className="text-base sm:text-lg font-black text-cyan-300">
              {KHL_FIVE_SEASON_AGGREGATE.regulationDrawRate}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              3-Way Draw High-EV Angle
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Shots on Goal (SOG)</span>
            <span className="text-base sm:text-lg font-black text-indigo-300">
              {KHL_FIVE_SEASON_AGGREGATE.avgShotsTotal} SOG/G
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Tighter Defensive Zone
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Faceoff Draws</span>
            <span className="text-base sm:text-lg font-black text-amber-300">
              {KHL_FIVE_SEASON_AGGREGATE.avgFaceoffsTotal} Draws/G
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Home Stick: 52.4% Win
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Far East Travel Deficit</span>
            <span className="text-base sm:text-lg font-black text-rose-300">
              -{KHL_FIVE_SEASON_AGGREGATE.travelFatigueDeficitFarEast} G
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              68.2% Under 5.5 in Vladivostok
            </span>
          </div>
        </div>
      </div>

      {/* Far East Travel Study Deep Dive Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-indigo-950 border border-amber-500/30 text-white shadow-lg space-y-4">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-amber-400" />
          <h3 className="text-base sm:text-lg font-black text-white">
            Specialized Study: The Far East Travel Penalty (Admiral &amp; Amur)
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30">
            8 Time Zones
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
          {KHL_FAR_EAST_TRAVEL_STUDY.description} When teams from Moscow or Saint Petersburg play in Vladivostok or Khabarovsk, their circadian rhythms are severely disrupted. The empirical data over 5 seasons proves this creates one of the sharpest inefficiencies in global sports betting.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="bg-black/40 rounded-xl p-3 border border-amber-500/20">
            <span className="text-slate-400 text-xs block mb-1">Visiting Team Goal Avg</span>
            <span className="text-xl font-black font-mono text-amber-300">
              {KHL_FAR_EAST_TRAVEL_STUDY.visitingTeamGoalScoringAverage} G
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              vs 2.35 G road average elsewhere
            </span>
          </div>

          <div className="bg-black/40 rounded-xl p-3 border border-amber-500/20">
            <span className="text-slate-400 text-xs block mb-1">Under 5.5 Hit Rate in Far East</span>
            <span className="text-xl font-black font-mono text-emerald-400">
              {KHL_FAR_EAST_TRAVEL_STUDY.under5_5RateInFarEast}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              +8.2% higher than league baseline
            </span>
          </div>

          <div className="bg-black/40 rounded-xl p-3 border border-amber-500/20">
            <span className="text-slate-400 text-xs block mb-1">Visiting Team Win Rate</span>
            <span className="text-xl font-black font-mono text-rose-400">
              {KHL_FAR_EAST_TRAVEL_STUDY.visitingTeamWinRate}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              vs 45.5% road win rate elsewhere
            </span>
          </div>

          <div className="bg-black/40 rounded-xl p-3 border border-amber-500/20">
            <span className="text-slate-400 text-xs block mb-1">Under 5.0 Hit Rate</span>
            <span className="text-xl font-black font-mono text-cyan-300">
              {KHL_FAR_EAST_TRAVEL_STUDY.under5_0RateInFarEast}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Strong market pricing inefficiency
            </span>
          </div>
        </div>
      </div>

      {/* 5-Season Comparative Overview Table */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1e293b] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              KHL Season-by-Season Evolution (2021–2026)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">4,080 Completed Games</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] uppercase">
                <th className="py-2.5 px-3">Season</th>
                <th className="py-2.5 px-3">Games</th>
                <th className="py-2.5 px-3">Goals / G</th>
                <th className="py-2.5 px-3">Home / Road G</th>
                <th className="py-2.5 px-3">Home Win %</th>
                <th className="py-2.5 px-3">Reg. Draw %</th>
                <th className="py-2.5 px-3">Over 4.5 %</th>
                <th className="py-2.5 px-3">Under 5.5 %</th>
                <th className="py-2.5 px-3">Avg SOG</th>
                <th className="py-2.5 px-3">Far East Road Win %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {KHL_HISTORICAL_SEASONS.map((s) => (
                <tr key={s.season} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-bold font-sans text-slate-900 dark:text-white">
                    {s.season}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{s.games}</td>
                  <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                    {s.goalsPerGame.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                    {s.homeGPG.toFixed(2)} / {s.roadGPG.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                    {s.homeWinPct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 font-bold text-cyan-600 dark:text-cyan-400">
                    {s.otPct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                    {s.over4_5Pct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                    {s.under5_5Pct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                    {s.avgShotsPerGame.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400">
                    {s.farEastVisitingWinPct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 23 Active KHL Franchises Historical Baselines Table */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1e293b] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              23 Active KHL Franchises — 5-Year Empirical Baselines
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any column header to sort teams by metric.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Conference Selector */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-800 text-xs">
              <button
                onClick={() => setSelectedConf('ALL')}
                className={`px-2 py-1 rounded-md font-bold cursor-pointer transition-all ${
                  selectedConf === 'ALL'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                All (23)
              </button>
              <button
                onClick={() => setSelectedConf('WEST')}
                className={`px-2 py-1 rounded-md font-bold cursor-pointer transition-all ${
                  selectedConf === 'WEST'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                West (11)
              </button>
              <button
                onClick={() => setSelectedConf('EAST')}
                className={`px-2 py-1 rounded-md font-bold cursor-pointer transition-all ${
                  selectedConf === 'EAST'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                East (12)
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search team..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] uppercase">
                <th className="py-2.5 px-3">Team</th>
                <th className="py-2.5 px-2">Conf / Div</th>
                <th
                  onClick={() => handleSort('fiveSeasonGPG')}
                  className="py-2.5 px-2 cursor-pointer hover:text-indigo-500"
                >
                  <span className="flex items-center gap-1">
                    GPG {sortField === 'fiveSeasonGPG' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('fiveSeasonGAPG')}
                  className="py-2.5 px-2 cursor-pointer hover:text-indigo-500"
                >
                  <span className="flex items-center gap-1">
                    GAPG {sortField === 'fiveSeasonGAPG' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('diff')}
                  className="py-2.5 px-2 cursor-pointer hover:text-indigo-500"
                >
                  <span className="flex items-center gap-1">
                    Diff {sortField === 'diff' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('xgf60')}
                  className="py-2.5 px-2 cursor-pointer hover:text-indigo-500"
                >
                  <span className="flex items-center gap-1">
                    xGF/60 {sortField === 'xgf60' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('shotsFor60')}
                  className="py-2.5 px-2 cursor-pointer hover:text-indigo-500"
                >
                  <span className="flex items-center gap-1">
                    SF/60 {sortField === 'shotsFor60' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('powerPlayPct')}
                  className="py-2.5 px-2 cursor-pointer hover:text-indigo-500"
                >
                  <span className="flex items-center gap-1">
                    PP % {sortField === 'powerPlayPct' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('penaltyKillPct')}
                  className="py-2.5 px-2 cursor-pointer hover:text-indigo-500"
                >
                  <span className="flex items-center gap-1">
                    PK % {sortField === 'penaltyKillPct' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('faceoffWinPct')}
                  className="py-2.5 px-2 cursor-pointer hover:text-indigo-500"
                >
                  <span className="flex items-center gap-1">
                    FO % {sortField === 'faceoffWinPct' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('fiveSeasonWinPct')}
                  className="py-2.5 px-2 cursor-pointer hover:text-indigo-500"
                >
                  <span className="flex items-center gap-1">
                    Win % {sortField === 'fiveSeasonWinPct' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {filteredTeams.map((t: KHLTeamRow) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-sans">
                    <div className="flex items-center gap-2">
                      <img
                        src={t.logo}
                        alt={t.name}
                        className="w-5 h-5 object-contain shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {t.city} {t.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {t.abbreviation}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-[11px] font-sans text-slate-500">
                    {t.conference} / {t.division}
                  </td>
                  <td className="py-2.5 px-2 font-bold text-slate-800 dark:text-slate-200">
                    {t.fiveSeasonGPG.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400">
                    {t.fiveSeasonGAPG.toFixed(2)}
                  </td>
                  <td
                    className={`py-2.5 px-2 font-bold ${
                      t.diff > 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {t.diff > 0 ? `+${t.diff.toFixed(2)}` : t.diff.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-indigo-600 dark:text-indigo-400 font-bold">
                    {t.xgf60.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400">
                    {t.shotsFor60.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400">
                    {t.powerPlayPct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400">
                    {t.penaltyKillPct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-2 text-amber-600 dark:text-amber-400">
                    {t.faceoffWinPct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-white">
                    {t.fiveSeasonWinPct.toFixed(1)}%
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
