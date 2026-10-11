import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Flame,
  Shield,
  Activity,
  BookmarkPlus,
  RefreshCw,
  Star,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { getAllNHLTeams, getNHLTeamProfile } from '../../data/nhlTeamProfiles';
import { runNHLForecastingModel, americanToDecimal } from '../../utils/nhlModelEngine';
import type { NHLMarketEdge } from '../../types/nhl';

interface NHLMatchupAnalyzerTabProps {
  initialAway?: string;
  initialHome?: string;
  initialLine?: number;
  onTrackBet?: (bet: any) => void;
}

export const NHLMatchupAnalyzerTab: React.FC<NHLMatchupAnalyzerTabProps> = ({
  initialAway = 'CAR',
  initialHome = 'PHI',
  initialLine = 5.5,
  onTrackBet,
}) => {
  const allTeams = getAllNHLTeams();

  const [awayTeamId, setAwayTeamId] = useState(initialAway);
  const [homeTeamId, setHomeTeamId] = useState(initialHome);

  const awayProf = getNHLTeamProfile(awayTeamId);
  const homeProf = getNHLTeamProfile(homeTeamId);

  // Goalies Selection
  const [useAwayBackup, setUseAwayBackup] = useState(false);
  const [useHomeBackup, setUseHomeBackup] = useState(false);

  // Rest
  const [awayRestDays, setAwayRestDays] = useState(1);
  const [homeRestDays, setHomeRestDays] = useState(1);

  // Sportsbook Lines
  const [sportsbookTotal, setSportsbookTotal] = useState(initialLine);
  const [overOdds, setOverOdds] = useState('-115');
  const [underOdds, setUnderOdds] = useState('-105');
  const [puckHomeOdds, setPuckHomeOdds] = useState('-165');
  const [puckAwayOdds, setPuckAwayOdds] = useState('+140');
  const [mlHomeOdds, setMlHomeOdds] = useState('+130');
  const [mlAwayOdds, setMlAwayOdds] = useState('-155');

  const selectedAwayGoalie = useAwayBackup ? awayProf.backupGoalie : awayProf.primaryGoalie;
  const selectedHomeGoalie = useHomeBackup ? homeProf.backupGoalie : homeProf.primaryGoalie;

  // Run real-time quantitative forecasting model
  const forecast = runNHLForecastingModel({
    homeTeam: homeProf.id,
    awayTeam: awayProf.id,
    homeGoalie: selectedHomeGoalie,
    awayGoalie: selectedAwayGoalie,
    homeRestDays,
    awayRestDays,
    sportsbookTotal,
    totalOverOdds: overOdds,
    totalUnderOdds: underOdds,
    spreadHomeOdds: puckHomeOdds,
    spreadAwayOdds: puckAwayOdds,
    moneylineHome: mlHomeOdds,
    moneylineAway: mlAwayOdds,
  });

  const handleQuickTrack = (market: NHLMarketEdge) => {
    if (onTrackBet) {
      onTrackBet({
        matchId: `sim_${awayProf.abbreviation}_${homeProf.abbreviation}`,
        date: new Date().toISOString().slice(0, 10),
        matchup: `${awayProf.name} @ ${homeProf.name}`,
        pickType: market.marketName.includes('Over') ? 'OVER' : 'UNDER',
        targetLine: sportsbookTotal,
        modelProjection: forecast.modelProjectedTotal,
        edge: market.edgePercent,
        units: 1.0,
        odds: market.sportsbookOdds,
        status: 'PENDING',
        notes: `NHL Poisson Model Edge: ${market.marketName} (${market.edgePercent}% EV)`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-500/20 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                Poisson xG Matchup Simulator
              </span>
              <span className="text-xs text-slate-400">Interactive Goalie & Fatigue Modeler</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              NHL Matchup & Edge Analyzer
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Select any matchup, test starting vs backup goaltenders, evaluate back-to-back rest fatigue, and calculate exact Poisson win probabilities and EV edges across all 5 betting markets.
            </p>
          </div>
        </div>
      </div>

      {/* Team Selectors & Game Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Away Team Controls */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Away Team
            </span>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500">Rest:</span>
              <button
                onClick={() => setAwayRestDays(awayRestDays === 0 ? 1 : 0)}
                className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition-colors cursor-pointer ${
                  awayRestDays === 0
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {awayRestDays === 0 ? 'Back-to-Back (0d)' : 'Normal (1d+)'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 relative flex items-center justify-center p-1.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
              <img
                src={awayProf.logo}
                alt={awayProf.name}
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://a.espncdn.com/i/teamlogos/nhl/500/scoreboard/${awayProf.abbreviation.toLowerCase()}.png`;
                }}
              />
            </div>
            <div className="flex-1">
              <select
                value={awayTeamId}
                onChange={(e) => setAwayTeamId(e.target.value)}
                className="w-full text-base font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white cursor-pointer"
              >
                {allTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.conference})
                  </option>
                ))}
              </select>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex gap-2 font-mono">
                <span>5-Yr GF: {awayProf.fiveSeasonGPG}</span>
                <span>5-Yr GA: {awayProf.fiveSeasonGAPG}</span>
                <span>PP: {awayProf.powerPlayPct}%</span>
              </div>
            </div>
          </div>

          {/* Away Goalie Toggle */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-500" />
                Starting Goalie:
              </span>
              <button
                onClick={() => setUseAwayBackup(!useAwayBackup)}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                Switch to {useAwayBackup ? 'Starter' : 'Backup'}
              </button>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white">{selectedAwayGoalie.name}</span>
              <span className="font-mono text-slate-500">
                SV%: {(selectedAwayGoalie.savePct * 100).toFixed(1)}% | GSAx/60: {selectedAwayGoalie.gsax60 >= 0 ? '+' : ''}{selectedAwayGoalie.gsax60}
              </span>
            </div>
          </div>
        </div>

        {/* Home Team Controls */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Home Team (Ice Advantage +0.24 G)
            </span>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500">Rest:</span>
              <button
                onClick={() => setHomeRestDays(homeRestDays === 0 ? 1 : 0)}
                className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition-colors cursor-pointer ${
                  homeRestDays === 0
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {homeRestDays === 0 ? 'Back-to-Back (0d)' : 'Normal (1d+)'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 relative flex items-center justify-center p-1.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
              <img
                src={homeProf.logo}
                alt={homeProf.name}
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://a.espncdn.com/i/teamlogos/nhl/500/scoreboard/${homeProf.abbreviation.toLowerCase()}.png`;
                }}
              />
            </div>
            <div className="flex-1">
              <select
                value={homeTeamId}
                onChange={(e) => setHomeTeamId(e.target.value)}
                className="w-full text-base font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white cursor-pointer"
              >
                {allTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.conference})
                  </option>
                ))}
              </select>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex gap-2 font-mono">
                <span>5-Yr Home GF: {homeProf.fiveSeasonHomeGPG}</span>
                <span>5-Yr GA: {homeProf.fiveSeasonGAPG}</span>
                <span>PK: {homeProf.penaltyKillPct}%</span>
              </div>
            </div>
          </div>

          {/* Home Goalie Toggle */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-500" />
                Starting Goalie:
              </span>
              <button
                onClick={() => setUseHomeBackup(!useHomeBackup)}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                Switch to {useHomeBackup ? 'Starter' : 'Backup'}
              </button>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white">{selectedHomeGoalie.name}</span>
              <span className="font-mono text-slate-500">
                SV%: {(selectedHomeGoalie.savePct * 100).toFixed(1)}% | GSAx/60: {selectedHomeGoalie.gsax60 >= 0 ? '+' : ''}{selectedHomeGoalie.gsax60}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Projection Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
            Projected Score
          </span>
          <span className="text-2xl font-black font-mono text-slate-900 dark:text-white block">
            {awayProf.abbreviation} {forecast.modelProjectedAwayGoals} - {forecast.modelProjectedHomeGoals} {homeProf.abbreviation}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Poisson Arrival Rates (λ)
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
            Model Total Goals
          </span>
          <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 block">
            {forecast.modelProjectedTotal}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Expected 60-min Game Total
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
            Sportsbook Line
          </span>
          <div className="flex items-center justify-center gap-1.5">
            {[5.5, 6.0, 6.5].map((val) => (
              <button
                key={val}
                onClick={() => setSportsbookTotal(val)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono transition-colors cursor-pointer ${
                  sportsbookTotal === val
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Goal Edge: {forecast.goalEdge > 0 ? `+${forecast.goalEdge}` : forecast.goalEdge}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-center">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block mb-1 flex items-center justify-center gap-1">
            <Flame className="w-3.5 h-3.5 text-emerald-500" />
            Highest Edge Market
          </span>
          <span className="text-lg font-black text-slate-900 dark:text-white truncate block">
            {forecast.highestEdgeMarket.marketName}
          </span>
          <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
            +{forecast.highestEdgeMarket.edgePercent}% Expected Value
          </span>
        </div>
      </div>

      {/* Multi-Market Edge Evaluation Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-500" />
            Complete Market Fair Value & EV% Matrix
          </h3>
          <span className="text-xs text-slate-400">Ranked by Highest Mathematical Edge</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold">
              <tr>
                <th className="py-2 px-3">Betting Market</th>
                <th className="py-2 px-3">Line / Odds</th>
                <th className="py-2 px-3">Model True Prob</th>
                <th className="py-2 px-3">Sportsbook Implied</th>
                <th className="py-2 px-3">Expected Value (EV%)</th>
                <th className="py-2 px-3">Confidence</th>
                <th className="py-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {forecast.allMarketEdges.map((m, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    m.recommended ? 'bg-emerald-500/5' : ''
                  }`}
                >
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {m.recommended && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                    {m.marketName}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                    {m.sportsbookOdds} (Dec: {m.sportsbookDecimalOdds})
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {(m.modelProbability * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500">
                    {(m.sportsbookImpliedProb * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 font-mono font-black">
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        m.edgePercent >= 5.0
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                          : m.edgePercent >= 2.0
                          ? 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300'
                          : m.edgePercent >= 0
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          : 'text-red-500'
                      }`}
                    >
                      {m.edgePercent > 0 ? `+${m.edgePercent}%` : `${m.edgePercent}%`}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: m.starRating }).map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-current" />
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleQuickTrack(m)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-colors cursor-pointer"
                    >
                      Track
                    </button>
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
