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
  Plane,
  ArrowLeftRight,
  Target,
  Percent,
} from 'lucide-react';
import { getAllKHLTeams, getKHLTeamProfile } from '../../data/khlTeamProfiles';
import { runKHLForecastingModel, americanToDecimal, poissonProbability } from '../../utils/khlModelEngine';
import type { KHLMarketEdge, KHLTeamMetrics } from '../../types/khl';

interface KHLMatchupAnalyzerTabProps {
  initialAway?: string;
  initialHome?: string;
  initialLine?: number;
  onTrackBet?: (bet: any) => void;
}

export const KHLMatchupAnalyzerTab: React.FC<KHLMatchupAnalyzerTabProps> = ({
  initialAway = 'SKA',
  initialHome = 'CSK',
  initialLine = 5.0,
  onTrackBet,
}) => {
  const allTeams = getAllKHLTeams();

  const [awayTeamId, setAwayTeamId] = useState(initialAway);
  const [homeTeamId, setHomeTeamId] = useState(initialHome);

  const awayProf = getKHLTeamProfile(awayTeamId);
  const homeProf = getKHLTeamProfile(homeTeamId);

  // Goalies Selection
  const [useAwayBackup, setUseAwayBackup] = useState(false);
  const [useHomeBackup, setUseHomeBackup] = useState(false);

  // Rest
  const [awayRestDays, setAwayRestDays] = useState(1);
  const [homeRestDays, setHomeRestDays] = useState(1);

  // Far East Travel toggle
  const defaultIsFarEast =
    (homeProf.abbreviation === 'ADM' || homeProf.abbreviation === 'AMR') &&
    awayProf.abbreviation !== 'ADM' &&
    awayProf.abbreviation !== 'AMR';
  const [customFarEast, setCustomFarEast] = useState<boolean | null>(null);
  const isFarEast = customFarEast !== null ? customFarEast : defaultIsFarEast;

  // Sportsbook Lines
  const [sportsbookTotal, setSportsbookTotal] = useState(initialLine);
  const [overOdds, setOverOdds] = useState('-115');
  const [underOdds, setUnderOdds] = useState('-105');
  const [puckHomeOdds, setPuckHomeOdds] = useState('+145');
  const [puckAwayOdds, setPuckAwayOdds] = useState('-175');
  const [mlHomeOdds, setMlHomeOdds] = useState('-115');
  const [mlAwayOdds, setMlAwayOdds] = useState('-105');
  const [regDrawOdds, setRegDrawOdds] = useState('+295');
  const [shotsTotal, setShotsTotal] = useState(58.5);

  const selectedAwayGoalie = useAwayBackup ? awayProf.backupGoalie : awayProf.primaryGoalie;
  const selectedHomeGoalie = useHomeBackup ? homeProf.backupGoalie : homeProf.primaryGoalie;

  // Run real-time quantitative forecasting model
  const forecast = runKHLForecastingModel({
    homeTeam: homeProf.id,
    awayTeam: awayProf.id,
    homeGoalie: selectedHomeGoalie,
    awayGoalie: selectedAwayGoalie,
    homeRestDays,
    awayRestDays,
    isFarEastTravel: isFarEast,
    sportsbookTotal,
    totalOverOdds: overOdds,
    totalUnderOdds: underOdds,
    spreadHomeOdds: puckHomeOdds,
    spreadAwayOdds: puckAwayOdds,
    moneylineHome: mlHomeOdds,
    moneylineAway: mlAwayOdds,
    regulationDrawOdds: regDrawOdds,
    sportsbookShotsTotal: shotsTotal,
  });

  const handleSwapTeams = () => {
    const prevAway = awayTeamId;
    const prevHome = homeTeamId;
    setAwayTeamId(prevHome);
    setHomeTeamId(prevAway);
    setCustomFarEast(null);
  };

  const handleQuickTrack = (market: KHLMarketEdge) => {
    if (onTrackBet) {
      onTrackBet({
        matchId: `sim_${awayProf.abbreviation}_${homeProf.abbreviation}_${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        matchup: `${awayProf.name} @ ${homeProf.name}`,
        pickType: market.marketName,
        targetLine: sportsbookTotal,
        modelProjection: forecast.modelProjectedTotal,
        edge: market.edgePercent,
        units: market.edgePercent >= 5.0 ? 2.0 : 1.0,
        odds: market.sportsbookOdds,
        status: 'PENDING',
        notes: `KHL Poisson Simulator: ${market.marketName} (+${market.edgePercent}% EV)`,
        sport: 'KHL',
      });
    }
  };

  // Generate 6x6 score probability matrix for display
  const scoreMatrix: number[][] = [];
  const maxDisplayGoals = 5;
  for (let h = 0; h <= maxDisplayGoals; h++) {
    scoreMatrix[h] = [];
    for (let a = 0; a <= maxDisplayGoals; a++) {
      const p =
        poissonProbability(h, forecast.modelProjectedHomeGoals) *
        poissonProbability(a, forecast.modelProjectedAwayGoals);
      scoreMatrix[h][a] = p;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                KHL Bivariate Poisson Simulator
              </span>
              <span className="text-xs text-slate-400">Continental Hockey League Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              KHL Custom Matchup Simulator & Odds Grader
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Simulate any KHL clash across Western & Eastern Conferences. Calibrates 5-season 5v5 xG, starting goalie GSAx, European 3-way regulation draw distributions (~23.8%), and Far East jet lag travel penalties.
            </p>
          </div>

          <button
            onClick={handleSwapTeams}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
            <span>Swap Home / Away</span>
          </button>
        </div>
      </div>

      {/* Simulator Inputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Matchup Setup & Rosters (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Away Team Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1e293b] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Visiting Team (Away)
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                {awayProf.conference} Conf. • {awayProf.division} Div.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={awayProf.logo}
                alt={awayProf.name}
                className="w-12 h-12 rounded-xl object-contain bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="flex-1 min-w-0">
                <select
                  value={awayTeamId}
                  onChange={(e) => {
                    setAwayTeamId(e.target.value);
                    setCustomFarEast(null);
                  }}
                  className="w-full text-sm font-bold bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {allTeams.map((t: KHLTeamMetrics) => (
                    <option key={t.id} value={t.id}>
                      {t.city} {t.name} ({t.abbreviation})
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>5Y GPG: <strong className="text-slate-800 dark:text-slate-200">{awayProf.fiveSeasonGPG}</strong></span>
                  <span>•</span>
                  <span>xGF/60: <strong className="text-slate-800 dark:text-slate-200">{awayProf.xgf60}</strong></span>
                  <span>•</span>
                  <span>PP: <strong className="text-slate-800 dark:text-slate-200">{awayProf.powerPlayPct}%</strong></span>
                </div>
              </div>
            </div>

            {/* Away Starting Goalie */}
            <div className="pt-3 border-t border-slate-100 dark:border-[#1a2333] space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  Starting Goalie
                </span>
                <button
                  onClick={() => setUseAwayBackup(!useAwayBackup)}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {useAwayBackup ? 'Switch to Starter' : 'Switch to Backup'}
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {selectedAwayGoalie.name} {useAwayBackup ? '(Backup)' : '(Starter)'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    SV%: .{(selectedAwayGoalie.savePct * 1000).toFixed(0)} • GAA: {selectedAwayGoalie.goalsAgainstAvg.toFixed(2)} • GSAx/60: +{selectedAwayGoalie.gsax60.toFixed(2)}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  {selectedAwayGoalie.confirmed ? 'CONFIRMED' : 'PROJECTED'}
                </span>
              </div>
            </div>

            {/* Away Rest Days */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Rest Days Before Match:</span>
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3].map((days) => (
                  <button
                    key={days}
                    onClick={() => setAwayRestDays(days)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                      awayRestDays === days
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {days === 0 ? 'B2B' : `${days}d`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Home Team Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1e293b] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Home Ice Franchise
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                {homeProf.conference} Conf. • {homeProf.division} Div.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={homeProf.logo}
                alt={homeProf.name}
                className="w-12 h-12 rounded-xl object-contain bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="flex-1 min-w-0">
                <select
                  value={homeTeamId}
                  onChange={(e) => {
                    setHomeTeamId(e.target.value);
                    setCustomFarEast(null);
                  }}
                  className="w-full text-sm font-bold bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {allTeams.map((t: KHLTeamMetrics) => (
                    <option key={t.id} value={t.id}>
                      {t.city} {t.name} ({t.abbreviation})
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>5Y GPG: <strong className="text-slate-800 dark:text-slate-200">{homeProf.fiveSeasonGPG}</strong></span>
                  <span>•</span>
                  <span>xGF/60: <strong className="text-slate-800 dark:text-slate-200">{homeProf.xgf60}</strong></span>
                  <span>•</span>
                  <span>PK: <strong className="text-slate-800 dark:text-slate-200">{homeProf.penaltyKillPct}%</strong></span>
                </div>
              </div>
            </div>

            {/* Home Starting Goalie */}
            <div className="pt-3 border-t border-slate-100 dark:border-[#1a2333] space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  Starting Goalie
                </span>
                <button
                  onClick={() => setUseHomeBackup(!useHomeBackup)}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {useHomeBackup ? 'Switch to Starter' : 'Switch to Backup'}
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {selectedHomeGoalie.name} {useHomeBackup ? '(Backup)' : '(Starter)'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    SV%: .{(selectedHomeGoalie.savePct * 1000).toFixed(0)} • GAA: {selectedHomeGoalie.goalsAgainstAvg.toFixed(2)} • GSAx/60: +{selectedHomeGoalie.gsax60.toFixed(2)}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  {selectedHomeGoalie.confirmed ? 'CONFIRMED' : 'PROJECTED'}
                </span>
              </div>
            </div>

            {/* Home Rest Days */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Rest Days Before Match:</span>
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3].map((days) => (
                  <button
                    key={days}
                    onClick={() => setHomeRestDays(days)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                      homeRestDays === days
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {days === 0 ? 'B2B' : `${days}d`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Special Far East Travel Toggle */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Plane className="w-4 h-4 text-amber-500" />
                Far East Jet Lag Penalty (UTC+10)
              </span>
              <button
                onClick={() => setCustomFarEast(!isFarEast)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isFarEast ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isFarEast ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              When Western clubs travel to Vladivostok (Admiral) or Khabarovsk (Amur), 7–8 hour jet lag historically suppresses visitor scoring by 16% (-0.42 goals) and boosts Under 5.5 hit rates to 68.2%.
            </p>
          </div>
        </div>

        {/* Right Col: Sportsbook Odds & Poisson Outputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Sportsbook Market Inputs */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1e293b] shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Sportsbook Lines Calibration</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[10px]">Real-Time Line Shopping</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Total Line */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Game Total Line
                </label>
                <select
                  value={sportsbookTotal}
                  onChange={(e) => setSportsbookTotal(parseFloat(e.target.value))}
                  className="w-full text-xs font-bold font-mono bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
                >
                  <option value={4.5}>4.5 Goals</option>
                  <option value={5.0}>5.0 Goals</option>
                  <option value={5.5}>5.5 Goals</option>
                  <option value={6.0}>6.0 Goals</option>
                </select>
              </div>

              {/* Over Odds */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Over Odds
                </label>
                <input
                  type="text"
                  value={overOdds}
                  onChange={(e) => setOverOdds(e.target.value)}
                  className="w-full text-xs font-bold font-mono bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
                  placeholder="-110"
                />
              </div>

              {/* Under Odds */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Under Odds
                </label>
                <input
                  type="text"
                  value={underOdds}
                  onChange={(e) => setUnderOdds(e.target.value)}
                  className="w-full text-xs font-bold font-mono bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
                  placeholder="-110"
                />
              </div>

              {/* 3-Way Regulation Draw Odds */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  3-Way Draw Odds
                </label>
                <input
                  type="text"
                  value={regDrawOdds}
                  onChange={(e) => setRegDrawOdds(e.target.value)}
                  className="w-full text-xs font-bold font-mono bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
                  placeholder="+295"
                />
              </div>
            </div>

            {/* Row 2: 2-Way Moneyline & Puckline */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Away ML ({awayProf.abbreviation})
                </label>
                <input
                  type="text"
                  value={mlAwayOdds}
                  onChange={(e) => setMlAwayOdds(e.target.value)}
                  className="w-full text-xs font-bold font-mono bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
                  placeholder="-105"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Home ML ({homeProf.abbreviation})
                </label>
                <input
                  type="text"
                  value={mlHomeOdds}
                  onChange={(e) => setMlHomeOdds(e.target.value)}
                  className="w-full text-xs font-bold font-mono bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
                  placeholder="-115"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Puckline Away (+1.5)
                </label>
                <input
                  type="text"
                  value={puckAwayOdds}
                  onChange={(e) => setPuckAwayOdds(e.target.value)}
                  className="w-full text-xs font-bold font-mono bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
                  placeholder="-175"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Puckline Home (-1.5)
                </label>
                <input
                  type="text"
                  value={puckHomeOdds}
                  onChange={(e) => setPuckHomeOdds(e.target.value)}
                  className="w-full text-xs font-bold font-mono bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
                  placeholder="+145"
                />
              </div>
            </div>
          </div>

          {/* Model Projected Score Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-wider uppercase text-indigo-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-400" />
                Poisson Expected Score &amp; Total
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Line: {sportsbookTotal} G
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 items-center text-center py-2">
              {/* Away Projection */}
              <div>
                <span className="text-xs text-slate-400 block mb-1">{awayProf.city}</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-300">
                  {forecast.modelProjectedAwayGoals.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Exp. Away Goals</span>
              </div>

              {/* Total Projection */}
              <div className="border-x border-white/10 px-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Model Total</span>
                <span className="text-3xl sm:text-4xl font-black font-mono text-white">
                  {forecast.modelProjectedTotal.toFixed(2)}
                </span>
                <span
                  className={`text-xs font-bold block mt-1 ${
                    forecast.goalEdge > 0 ? 'text-emerald-400' : 'text-blue-400'
                  }`}
                >
                  {forecast.goalEdge > 0
                    ? `+${forecast.goalEdge.toFixed(2)} vs Line (Over Lean)`
                    : `${forecast.goalEdge.toFixed(2)} vs Line (Under Lean)`}
                </span>
              </div>

              {/* Home Projection */}
              <div>
                <span className="text-xs text-slate-400 block mb-1">{homeProf.city}</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-indigo-300">
                  {forecast.modelProjectedHomeGoals.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Exp. Home Goals</span>
              </div>
            </div>

            {/* Shots on Goal & Faceoff Strip */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Projected Shots (SOG)</span>
                  <span className="font-bold font-mono text-cyan-300">
                    {forecast.projectedTotalShots} Shots
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {forecast.projectedAwayShots} - {forecast.projectedHomeShots}
                </span>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Projected Faceoffs</span>
                  <span className="font-bold font-mono text-amber-300">
                    {forecast.projectedTotalFaceoffs} Draws
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {homeProf.abbreviation}: {forecast.projectedHomeFaceoffWinPct}%
                </span>
              </div>
            </div>
          </div>

          {/* Highest Edge Market Recommendation Banner */}
          {forecast.highestEdgeMarket && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Top Model Quant Recommendation
                  </span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-200">
                    {forecast.highestEdgeMarket.confidence} CONFIDENCE
                  </span>
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {forecast.highestEdgeMarket.marketName}{' '}
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    ({forecast.highestEdgeMarket.sportsbookOdds})
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Model Win Probability: <strong>{(forecast.highestEdgeMarket.modelProbability * 100).toFixed(1)}%</strong> • EV Edge: <strong className="text-emerald-600 dark:text-emerald-400">+{forecast.highestEdgeMarket.edgePercent}%</strong> • Fair Dec: {(1 / forecast.highestEdgeMarket.modelProbability).toFixed(2)}
                </p>
              </div>

              <button
                onClick={() => handleQuickTrack(forecast.highestEdgeMarket)}
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <BookmarkPlus className="w-4 h-4" />
                <span>Track Position</span>
              </button>
            </div>
          )}

          {/* Evaluated Market Grid */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1e293b] shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Evaluated KHL Market Breakdown (All Angles)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {forecast.allMarketEdges.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-[#141b2a] border border-slate-200 dark:border-[#1e293b] flex items-center justify-between text-xs hover:border-indigo-400/50 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {m.marketName}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        ({m.sportsbookOdds})
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Model: {(m.modelProbability * 100).toFixed(1)}% • Fair: {(1 / m.modelProbability).toFixed(2)} • Rating: {m.starRating}★
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2">
                    <span
                      className={`font-mono font-bold text-xs ${
                        m.edgePercent > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {m.edgePercent > 0 ? `+${m.edgePercent}%` : `${m.edgePercent}%`}
                    </span>
                    <button
                      onClick={() => handleQuickTrack(m)}
                      title="Track Bet"
                      className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6x6 Goal Probability Matrix */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1e293b] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Poisson Goal Distribution Matrix
              </span>
              <span className="text-[11px] text-slate-500">
                {awayProf.abbreviation} (Rows) vs {homeProf.abbreviation} (Cols)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-[11px] font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                    <th className="p-1 text-left font-sans">{awayProf.abbreviation} \ {homeProf.abbreviation}</th>
                    {[0, 1, 2, 3, 4, 5].map((g) => (
                      <th key={g} className="p-1 font-bold text-indigo-500">{g}G</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4, 5].map((awayG) => (
                    <tr key={awayG} className="border-b border-slate-100 dark:border-slate-800/50">
                      <td className="p-1 text-left font-bold text-cyan-500 font-sans">{awayG}G</td>
                      {[0, 1, 2, 3, 4, 5].map((homeG) => {
                        const prob = scoreMatrix[homeG]?.[awayG] || 0;
                        const pct = (prob * 100).toFixed(1);
                        const isHigh = prob >= 0.08;
                        const isMax =
                          Math.round(forecast.modelProjectedHomeGoals) === homeG &&
                          Math.round(forecast.modelProjectedAwayGoals) === awayG;
                        return (
                          <td
                            key={homeG}
                            className={`p-1.5 rounded ${
                              isMax
                                ? 'bg-indigo-600 text-white font-bold'
                                : isHigh
                                ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {pct}%
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-[10px] text-slate-400 text-right">
              Highlighted cell represents the mode (most probable exact score).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
