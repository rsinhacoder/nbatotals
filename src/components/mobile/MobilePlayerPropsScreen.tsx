import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowUpDown,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { PlayerPropsForecast, OddsFormat } from '../../types/playerProps';

interface MobilePlayerPropsScreenProps {
  forecasts: PlayerPropsForecast[];
  oddsFormat: OddsFormat;
  onSelectPlayerDetail: (forecast: PlayerPropsForecast) => void;
  onTrackBet?: (forecast: PlayerPropsForecast) => void;
}

export const MobilePlayerPropsScreen: React.FC<MobilePlayerPropsScreenProps> = ({
  forecasts,
  oddsFormat,
  onSelectPlayerDetail,
  onTrackBet,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'STARTER' | 'BENCH'>('ALL');
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'OFFERED' | 'UNOFFERED'>('ALL');
  const [signalFilter, setSignalFilter] = useState<'ALL' | 'OVER' | 'UNDER'>('ALL');
  const [sortBy, setSortBy] = useState<'EDGE' | 'POINTS' | 'MINUTES'>('EDGE');

  // Filtered & Sorted forecasts
  const filteredForecasts = useMemo(() => {
    return forecasts
      .filter((f) => {
        // Role filter
        if (roleFilter === 'STARTER' && !f.isStarter) return false;
        if (roleFilter === 'BENCH' && f.isStarter) return false;

        // Market filter
        if (marketFilter === 'OFFERED' && f.marketStatus !== 'OFFERED') return false;
        if (marketFilter === 'UNOFFERED' && f.marketStatus === 'OFFERED') return false;

        // Signal filter
        if (signalFilter === 'OVER' && !f.recommendation.includes('OVER')) return false;
        if (signalFilter === 'UNDER' && !f.recommendation.includes('UNDER')) return false;

        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const text = `${f.playerName} ${f.team} ${f.opponent} ${f.role}`.toLowerCase();
          if (!text.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'EDGE') {
          // Sort offered edges first, then unoffered by points
          if (a.marketStatus === 'OFFERED' && b.marketStatus !== 'OFFERED') return -1;
          if (b.marketStatus === 'OFFERED' && a.marketStatus !== 'OFFERED') return 1;
          return b.recommendationEdge - a.recommendationEdge;
        }
        if (sortBy === 'POINTS') {
          return b.modelProjectedPoints - a.modelProjectedPoints;
        }
        if (sortBy === 'MINUTES') {
          return b.expectedQ1Minutes - a.expectedQ1Minutes;
        }
        return 0;
      });
  }, [forecasts, roleFilter, marketFilter, signalFilter, searchTerm, sortBy]);

  const offeredCount = forecasts.filter((f) => f.marketStatus === 'OFFERED').length;
  const unofferedCount = forecasts.filter((f) => f.marketStatus !== 'OFFERED').length;

  return (
    <div className="space-y-3 pb-20 pt-2 px-3.5 max-w-md mx-auto">
      {/* 1. Search & Filter Header */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search NBA player or team..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {/* Role Filter */}
          <button
            onClick={() => setRoleFilter(roleFilter === 'ALL' ? 'STARTER' : roleFilter === 'STARTER' ? 'BENCH' : 'ALL')}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
              roleFilter !== 'ALL'
                ? 'bg-purple-500 text-white'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Role: {roleFilter}
          </button>

          {/* Market Status Filter */}
          <button
            onClick={() => setMarketFilter(marketFilter === 'ALL' ? 'OFFERED' : marketFilter === 'OFFERED' ? 'UNOFFERED' : 'ALL')}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
              marketFilter !== 'ALL'
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Markets: {marketFilter === 'ALL' ? 'All' : marketFilter === 'OFFERED' ? 'Listed Only' : 'Off Board'}
          </button>

          {/* Signal Filter */}
          <button
            onClick={() => setSignalFilter(signalFilter === 'ALL' ? 'OVER' : signalFilter === 'OVER' ? 'UNDER' : 'ALL')}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
              signalFilter === 'OVER'
                ? 'bg-emerald-500 text-slate-950 font-black'
                : signalFilter === 'UNDER'
                ? 'bg-rose-500 text-white font-black'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Signal: {signalFilter}
          </button>

          {/* Sort By Toggle */}
          <button
            onClick={() => setSortBy(sortBy === 'EDGE' ? 'POINTS' : sortBy === 'POINTS' ? 'MINUTES' : 'EDGE')}
            className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-900 text-slate-400 border border-slate-800 shrink-0 cursor-pointer flex items-center gap-1"
          >
            <ArrowUpDown className="w-3 h-3 text-cyan-400" /> Sort: {sortBy}
          </button>
        </div>

        {/* Live Counts Bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
          <span>{filteredForecasts.length} Players Shown</span>
          <span>{offeredCount} Offered • {unofferedCount} Off Board</span>
        </div>
      </div>

      {/* 2. Player Props Cards */}
      {filteredForecasts.length === 0 ? (
        <div className="theover-card p-8 text-center space-y-2">
          <p className="text-sm font-bold text-slate-300">No players match the criteria</p>
          <p className="text-xs text-slate-500">Reset your filters to see all roster players.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredForecasts.map((fc) => {
            const isOffered = fc.marketStatus === 'OFFERED';
            const approxMins = (fc as any).expectedMinutes || (fc.expectedQ1Minutes ? Number((fc.expectedQ1Minutes * 3.6).toFixed(1)) : 28);
            const injuryStatus = (fc as any).injuryStatus || 'ACTIVE';

            return (
              <div
                key={fc.marketId}
                onClick={() => onSelectPlayerDetail(fc)}
                className="theover-card overflow-hidden transition active:scale-98 cursor-pointer hover:border-cyan-500/40"
              >
                {/* Card Top Banner */}
                <div className="p-3 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    {/* Player Info with Headshot / Avatar */}
                    <div className="flex items-center gap-2.5">
                      <div className="relative shrink-0">
                        {fc.headshotUrl ? (
                          <img
                            src={fc.headshotUrl}
                            alt={fc.playerName}
                            className="w-10 h-10 rounded-full object-cover bg-slate-900 border border-slate-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-slate-300 text-xs">
                            {fc.playerName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-1 -right-1 text-[8px] font-black px-1 py-0.2 rounded uppercase ${
                            fc.isStarter ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {fc.role || (fc.isStarter ? 'Starter' : 'Bench')}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white leading-tight">
                            {fc.playerName}
                          </span>
                          {injuryStatus !== 'ACTIVE' && (
                            <span className="text-[9px] font-extrabold px-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              {injuryStatus}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {fc.team} vs {fc.opponent} • Exp {approxMins}m
                        </span>
                      </div>
                    </div>

                    {/* Recommendation Badge */}
                    <div className="text-right shrink-0">
                      {isOffered ? (
                        <span
                          className={`text-[10px] font-black px-2 py-0.8 rounded uppercase tracking-tight block ${
                            fc.recommendation.includes('OVER')
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {fc.recommendation}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase block">
                          OFF BOARD
                        </span>
                      )}
                      {isOffered && (
                        <span className="text-[10px] font-mono text-cyan-400 font-bold block mt-0.5">
                          +{fc.recommendationEdge.toFixed(1)}% EV
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 4-Cell Stats Grid Inspired by TheOver */}
                  <div className="grid grid-cols-4 gap-1.5 bg-[#060a14] p-2 rounded-xl border border-slate-800/80 text-center font-mono text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 font-sans block uppercase">Line</span>
                      <span className="font-bold text-white">
                        {isOffered ? fc.pointsLine : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-cyan-400 font-sans block uppercase">Model</span>
                      <span className="font-black text-cyan-400">
                        {fc.modelProjectedPoints} pts
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-emerald-400 font-sans block uppercase">Over %</span>
                      <span className="font-bold text-slate-200">
                        {isOffered ? `${(fc.modelProbOver * 100).toFixed(0)}%` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-rose-400 font-sans block uppercase">Under %</span>
                      <span className="font-bold text-slate-200">
                        {isOffered ? `${(fc.modelProbUnder * 100).toFixed(0)}%` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Odds & Diff Footer */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-0.5 px-0.5">
                    <div>
                      {isOffered ? (
                        <span>
                          Book Odds: Over {fc.overOdds} / Under {fc.underOdds}
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          Sportsbook market not offered for this bench player
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      {isOffered && (
                        <span className={fc.pointsDifference > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          Diff: {fc.pointsDifference > 0 ? `+${fc.pointsDifference}` : fc.pointsDifference} pts
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
