import React, { useState, useMemo } from 'react';
import {
  Sliders,
  BookmarkPlus,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
} from 'lucide-react';
import { NBA_TEAMS, getTeamProfile } from '../data/teamProfiles';
import type { ModelConfig } from '../utils/modelConstants';
import type { NBAGame, TrackedBet } from '../types/nba';

interface GameAnalyzerTabProps {
  activeModel: ModelConfig;
  initialAwayTeam?: string;
  initialHomeTeam?: string;
  initialLine?: number;
  initialLowestQ?: number;
  onTrackBet: (bet: Omit<TrackedBet, 'id' | 'timestamp'>) => void;
  historicalGames?: NBAGame[];
}

export const GameAnalyzerTab: React.FC<GameAnalyzerTabProps> = ({
  activeModel,
  initialAwayTeam = 'Orlando Magic',
  initialHomeTeam = 'Miami Heat',
  initialLine = 221.5,
  initialLowestQ,
  onTrackBet,
  historicalGames = [],
}) => {
  const teamNames = Object.keys(NBA_TEAMS).sort();

  // Selected teams
  const [awayTeamName, setAwayTeamName] = useState<string>(initialAwayTeam);
  const [homeTeamName, setHomeTeamName] = useState<string>(initialHomeTeam);

  // Sportsbook Line
  const [sportsbookLine, setSportsbookLine] = useState<number>(initialLine);

  // Analysis Mode: 'pregame' vs 'live'
  const [analyzerMode, setAnalyzerMode] = useState<'pregame' | 'live'>('pregame');

  // Custom Lowest Quarter override (if user wants to test specific floor)
  const [manualLowestQ, setManualLowestQ] = useState<number | null>(
    initialLowestQ ?? null
  );

  // Live Quarter Scores
  const [liveQ1, setLiveQ1] = useState<number | ''>(42);
  const [liveQ2, setLiveQ2] = useState<number | ''>('');
  const [liveQ3, setLiveQ3] = useState<number | ''>('');
  const [liveQ4, setLiveQ4] = useState<number | ''>('');

  const awayProfile = useMemo(() => getTeamProfile(awayTeamName), [awayTeamName]);
  const homeProfile = useMemo(() => getTeamProfile(homeTeamName), [homeTeamName]);

  // Baseline projected lowest quarter from team defensive profiles and pace
  const baselineLowestQ = useMemo(() => {
    if (awayProfile && homeProfile) {
      const paceFactor = ((awayProfile.paceRating + homeProfile.paceRating) / 2 - 99.5) * 0.15;
      const defFactor = ((awayProfile.defensiveRating + homeProfile.defensiveRating) / 2 - 110.0) * 0.1;
      const avgFloor = (awayProfile.avgLowestQuarter + homeProfile.avgLowestQuarter) / 2;
      return Number(Math.max(34, Math.min(52, avgFloor + paceFactor + defFactor)).toFixed(1));
    }
    return 43.5;
  }, [awayProfile, homeProfile]);

  // Effective Lowest Quarter based on mode
  const effectiveLowestQ = useMemo(() => {
    if (analyzerMode === 'live') {
      const enteredQuarters = [liveQ1, liveQ2, liveQ3, liveQ4].filter(
        (q): q is number => typeof q === 'number' && !isNaN(q) && q > 0
      );
      if (enteredQuarters.length > 0) {
        return Math.min(...enteredQuarters);
      }
      return manualLowestQ ?? baselineLowestQ;
    }
    return manualLowestQ ?? baselineLowestQ;
  }, [analyzerMode, liveQ1, liveQ2, liveQ3, liveQ4, manualLowestQ, baselineLowestQ]);

  // Model Projections
  const projectedRegulationTotal = useMemo(() => {
    return Number((activeModel.intercept + activeModel.slope * effectiveLowestQ).toFixed(1));
  }, [activeModel, effectiveLowestQ]);

  // Edge calculation
  const edge = useMemo(() => {
    return Number((projectedRegulationTotal - sportsbookLine).toFixed(1));
  }, [projectedRegulationTotal, sportsbookLine]);

  const absEdge = Math.abs(edge);

  // Verdict & Recommendation
  const verdict = useMemo(() => {
    if (edge <= -5.0) {
      return {
        action: 'BET UNDER',
        type: 'UNDER' as const,
        conviction: 'HIGH CONVICTION',
        borderColor: 'border-emerald-300 dark:border-emerald-500/60',
        badgeBg: 'bg-emerald-600 text-white',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        units: 2.0,
        winProbability: Math.min(84, Math.round(50 + (absEdge / activeModel.historicalMae) * 28)),
        summary: `Strong UNDER edge of ${absEdge} points against market line of ${sportsbookLine}.`,
        reasoning: `Our 5-Year model projects a regulation total of ${projectedRegulationTotal} pts based on a projected lowest quarter of ${effectiveLowestQ} pts. The market total (${sportsbookLine}) is inflated.`,
      };
    } else if (edge <= -3.0) {
      return {
        action: 'BET UNDER',
        type: 'UNDER' as const,
        conviction: 'MODERATE VALUE',
        borderColor: 'border-emerald-300 dark:border-amber-400/50',
        badgeBg: 'bg-emerald-50 dark:bg-amber-500 text-emerald-800 dark:text-zinc-950 border border-emerald-300 dark:border-transparent',
        textColor: 'text-emerald-700 dark:text-amber-400',
        units: 1.0,
        winProbability: Math.min(68, Math.round(50 + (absEdge / activeModel.historicalMae) * 25)),
        summary: `Favorable UNDER edge of ${absEdge} points against market line of ${sportsbookLine}.`,
        reasoning: `Model projects ${projectedRegulationTotal} pts, creating a ${absEdge}-point gap under the market line. Favorable risk-to-reward for a standard position.`,
      };
    } else if (edge >= 5.0) {
      return {
        action: 'BET OVER',
        type: 'OVER' as const,
        conviction: 'HIGH CONVICTION',
        borderColor: 'border-rose-300 dark:border-rose-500/60',
        badgeBg: 'bg-rose-600 text-white',
        textColor: 'text-rose-700 dark:text-rose-400',
        units: 2.0,
        winProbability: Math.min(84, Math.round(50 + (absEdge / activeModel.historicalMae) * 28)),
        summary: `Strong OVER edge of ${absEdge} points against market line of ${sportsbookLine}.`,
        reasoning: `Our model projects a high regulation total of ${projectedRegulationTotal} pts with a high lowest-quarter floor of ${effectiveLowestQ} pts. Market total (${sportsbookLine}) is underpriced.`,
      };
    } else if (edge >= 3.0) {
      return {
        action: 'BET OVER',
        type: 'OVER' as const,
        conviction: 'MODERATE VALUE',
        borderColor: 'border-rose-300 dark:border-amber-500/50',
        badgeBg: 'bg-rose-50 dark:bg-amber-500 text-rose-800 dark:text-slate-950 border border-rose-300 dark:border-transparent',
        textColor: 'text-rose-700 dark:text-amber-400',
        units: 1.0,
        winProbability: Math.min(68, Math.round(50 + (absEdge / activeModel.historicalMae) * 25)),
        summary: `Favorable OVER edge of ${absEdge} points against market line of ${sportsbookLine}.`,
        reasoning: `Model projects ${projectedRegulationTotal} pts, offering a ${absEdge}-point buffer above the sportsbook line.`,
      };
    } else {
      return {
        action: 'PASS / FAIR LINE',
        type: 'PASS' as const,
        conviction: 'NO EDGE',
        borderColor: 'border-slate-200 dark:border-[#1c2438]',
        badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent',
        textColor: 'text-slate-500 dark:text-slate-400',
        units: 0,
        winProbability: 50,
        summary: `Market line of ${sportsbookLine} is efficiently priced relative to model projection (${projectedRegulationTotal}).`,
        reasoning: `The discrepancy (${absEdge} pts) is below our minimum profitable margin threshold (3.0 pts). We do not force action when the market is priced accurately.`,
      };
    }
  }, [edge, absEdge, sportsbookLine, projectedRegulationTotal, effectiveLowestQ, activeModel.historicalMae]);

  const comparableGames = useMemo(() => {
    if (!historicalGames.length) return [];
    return historicalGames
      .filter((g) => Math.abs(g.lowestQuarter - effectiveLowestQ) <= 1.5)
      .slice(0, 5);
  }, [historicalGames, effectiveLowestQ]);

  const handleTrackCurrentBet = () => {
    if (verdict.type === 'PASS') return;
    onTrackBet({
      matchId: `custom_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      matchup: `${awayTeamName} @ ${homeTeamName}`,
      pickType: verdict.type,
      targetLine: sportsbookLine,
      modelProjection: projectedRegulationTotal,
      edge: absEdge,
      units: verdict.units,
      odds: '-110',
      status: 'PENDING',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header & Mode Switcher */}
      <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs transition-colors duration-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-blue-600 dark:text-amber-400" />
              Matchup Analyzer &amp; In-Play Calculator
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              • Model: {activeModel.shortLabel}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
            Compare any two teams against sportsbook totals or simulate in-game quarter caps.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-[#090d16] border border-slate-200 dark:border-[#1c2438] rounded-lg p-0.5 shrink-0 self-start md:self-center">
          <button
            onClick={() => setAnalyzerMode('pregame')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              analyzerMode === 'pregame'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pre-Game
          </button>
          <button
            onClick={() => setAnalyzerMode('live')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              analyzerMode === 'live'
                ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600 dark:bg-rose-400 animate-pulse"></span>
            Live In-Play
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (5 cols): Teams & Inputs */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-4 space-y-3.5 shadow-xs transition-colors duration-200">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-blue-600 dark:text-amber-400" />
              Matchup &amp; Market Inputs
            </div>

            {/* Away Team */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Visiting Team (Away)
              </label>
              <select
                value={awayTeamName}
                onChange={(e) => setAwayTeamName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1c2438] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:bg-white dark:focus:bg-[#090d16] focus:border-blue-500 dark:focus:border-amber-400 transition-colors"
              >
                {teamNames.map((team) => (
                  <option key={`away_${team}`} value={team}>
                    {team}
                  </option>
                ))}
              </select>
              {awayProfile && (
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Pace: {awayProfile.paceRating}</span>
                  <span>•</span>
                  <span>Def: {awayProfile.defensiveRating}</span>
                  <span>•</span>
                  <span>Avg Floor: {awayProfile.avgLowestQuarter}</span>
                </div>
              )}
            </div>

            {/* Home Team */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Host Team (Home)
              </label>
              <select
                value={homeTeamName}
                onChange={(e) => setHomeTeamName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1c2438] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:bg-white dark:focus:bg-[#090d16] focus:border-blue-500 dark:focus:border-amber-400 transition-colors"
              >
                {teamNames.map((team) => (
                  <option key={`home_${team}`} value={team}>
                    {team}
                  </option>
                ))}
              </select>
              {homeProfile && (
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Pace: {homeProfile.paceRating}</span>
                  <span>•</span>
                  <span>Def: {homeProfile.defensiveRating}</span>
                  <span>•</span>
                  <span>Avg Floor: {homeProfile.avgLowestQuarter}</span>
                </div>
              )}
            </div>

            {/* Sportsbook Line Input */}
            <div className="pt-2 border-t border-slate-200 dark:border-[#1c2438]/80">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Sportsbook Total Line
                </label>
                <span className="text-xs font-mono font-bold text-blue-700 dark:text-amber-300">
                  {sportsbookLine} pts
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="180"
                  max="265"
                  value={sportsbookLine}
                  onChange={(e) => setSportsbookLine(parseFloat(e.target.value) || 220)}
                  className="w-24 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1c2438] rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-slate-900 dark:text-amber-300 text-center focus:border-blue-500 dark:focus:border-amber-400"
                />
                <input
                  type="range"
                  min="195"
                  max="245"
                  step="0.5"
                  value={sportsbookLine}
                  onChange={(e) => setSportsbookLine(parseFloat(e.target.value))}
                  className="flex-1 accent-blue-600 dark:accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Pregame vs Live Quarter Controls */}
            {analyzerMode === 'pregame' ? (
              <div className="pt-2 border-t border-slate-200 dark:border-[#1c2438]/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Projected Lowest Quarter Floor
                  </label>
                  {manualLowestQ !== null && (
                    <button
                      onClick={() => setManualLowestQ(null)}
                      className="text-[10px] text-blue-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Reset ({baselineLowestQ})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="32"
                    max="55"
                    step="0.5"
                    value={effectiveLowestQ}
                    onChange={(e) => setManualLowestQ(parseFloat(e.target.value))}
                    className="flex-1 accent-blue-600 dark:accent-amber-400 cursor-pointer"
                  />
                  <span className="w-14 py-1 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1c2438] rounded-md text-center font-mono font-bold text-xs text-slate-900 dark:text-amber-400">
                    {effectiveLowestQ}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
                  <span>Rule of 47: {effectiveLowestQ < 47 ? '✅ <47 (Under Pattern)' : '❌ ≥47'}</span>
                  <span>Floor: {effectiveLowestQ} pts</span>
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-200 dark:border-[#1c2438]/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Live Quarter Scores
                  </span>
                  <span className="font-mono text-[11px] text-blue-700 dark:text-amber-400 font-bold">
                    Cap: {effectiveLowestQ} pts
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: 'Q1', val: liveQ1, setter: setLiveQ1 },
                    { label: 'Q2', val: liveQ2, setter: setLiveQ2 },
                    { label: 'Q3', val: liveQ3, setter: setLiveQ3 },
                    { label: 'Q4', val: liveQ4, setter: setLiveQ4 },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                        {item.label}
                      </span>
                      <input
                        type="number"
                        placeholder="--"
                        value={item.val}
                        onChange={(e) =>
                          item.setter(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1c2438] rounded-md py-1 text-center font-mono font-bold text-slate-900 dark:text-white text-xs focus:border-rose-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Formula Card */}
          <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-3 text-[11px] text-slate-600 dark:text-slate-400 space-y-1 font-mono shadow-xs transition-colors duration-200">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-300 font-sans">
              <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-amber-400" />
              Regression Calculation
            </div>
            <div className="text-blue-700 dark:text-amber-300 font-bold">
              {activeModel.intercept.toFixed(2)} + ({activeModel.slope.toFixed(4)} × {effectiveLowestQ}) = {projectedRegulationTotal} pts
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): The Sharp Verdict & Edge */}
        <div className="lg:col-span-7 space-y-3">
          {/* Main Verdict Card */}
          <div
            className={`bg-white dark:bg-[#0f1422] border ${verdict.borderColor} rounded-xl p-5 shadow-xs space-y-4 relative overflow-hidden transition-colors duration-200`}
          >
            {/* Top Badge and Win Prob */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider ${verdict.badgeBg}`}>
                  {verdict.action} {verdict.type !== 'PASS' ? sportsbookLine : ''}
                </span>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${verdict.textColor}`}>
                  {verdict.conviction}
                </span>
              </div>

              {verdict.type !== 'PASS' && (
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Win Rate Est: </span>
                  <span className={`text-sm font-black font-mono ${verdict.textColor}`}>
                    {verdict.winProbability}%
                  </span>
                </div>
              )}
            </div>

            {/* Verdict Headline */}
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight m-0">
                {verdict.summary}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed m-0">
                {verdict.reasoning}
              </p>
            </div>

            {/* Numbers Comparison Strip */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1c2438] rounded-lg p-3 text-center">
              <div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Sportsbook Line
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-amber-300 font-mono mt-0.5">
                  {sportsbookLine}
                </div>
              </div>

              <div className="border-x border-slate-200 dark:border-[#1c2438]">
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Model Projected
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                  {projectedRegulationTotal}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Discrepancy (Edge)
                </div>
                <div
                  className={`text-lg font-bold font-mono mt-0.5 ${
                    edge <= -3 ? 'text-emerald-700 dark:text-emerald-400' : edge >= 3 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {edge > 0 ? `+${edge}` : edge} pts
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#1c2438]/80 flex-wrap gap-2 text-xs">
              <span className="text-slate-600 dark:text-slate-400">
                Rec Sizing: <strong className="text-slate-900 dark:text-white font-mono">{verdict.units > 0 ? `${verdict.units}u` : 'Pass'}</strong>
              </span>

              {verdict.type !== 'PASS' && (
                <button
                  onClick={handleTrackCurrentBet}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                >
                  <BookmarkPlus className="h-3.5 w-3.5" />
                  Track {verdict.action} {sportsbookLine}
                </button>
              )}
            </div>
          </div>

          {/* Historical Precedents Box */}
          {comparableGames.length > 0 && (
            <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-3.5 space-y-2 shadow-xs transition-colors duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Historical Precedents (Lowest Q ≈ {effectiveLowestQ} pts)
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-500 font-mono">
                  {comparableGames.length} Games
                </span>
              </div>

              <div className="space-y-1.5">
                {comparableGames.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1c2438]/80 rounded-lg px-2.5 py-1.5 text-[11px]"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {game.awayTeam} @ {game.homeTeam}
                      </span>
                      <span className="text-slate-500 text-[10px] ml-1.5 font-mono">
                        {game.date}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-slate-600 dark:text-slate-400">
                        Low Q: <strong className="text-blue-700 dark:text-amber-400">{game.lowestQuarter}</strong>
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">
                        Total: <strong className="text-slate-900 dark:text-white">{game.regulationTotal}</strong>
                      </span>
                      <span
                        className={`font-bold ${
                          game.regulationTotal < 219 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {game.regulationTotal < 219 ? '<219' : '≥219'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default GameAnalyzerTab;
