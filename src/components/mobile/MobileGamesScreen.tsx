import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Search,
  SlidersHorizontal,
  Flame,
  BookmarkCheck,
  BookmarkPlus,
  Clock,
  Sparkles,
  BarChart2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import type { UpcomingMatch } from '../../types/nba';
import { getTeamProfile } from '../../data/teamProfiles';

interface MobileGamesScreenProps {
  upcomingMatches: UpcomingMatch[];
  selectedDate: string;
  onSelectGameDetail: (match: UpcomingMatch) => void;
  onTrackBet?: (match: UpcomingMatch, type: 'UNDER' | 'OVER') => void;
}

export const MobileGamesScreen: React.FC<MobileGamesScreenProps> = ({
  upcomingMatches,
  selectedDate,
  onSelectGameDetail,
  onTrackBet,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'TOP_EDGE' | 'OVER' | 'UNDER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMarketMatchId, setExpandedMarketMatchId] = useState<string | null>(null);

  // Filter games by date, signal, search query
  const filteredMatches = useMemo(() => {
    return upcomingMatches.filter((m) => {
      // Date filter
      if (selectedDate !== 'ALL' && m.date !== selectedDate) return false;

      const pickType = m.recommendation.includes('OVER') ? 'OVER' : 'UNDER';
      const isTopPick = m.recommendation.startsWith('STRONG') || Math.abs(m.edge) >= 4.0;

      // Signal filter
      if (filterMode === 'TOP_EDGE' && !isTopPick) return false;
      if (filterMode === 'OVER' && pickType !== 'OVER') return false;
      if (filterMode === 'UNDER' && pickType !== 'UNDER') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const awayAbbrev = (m as any).awayAbbrev || m.awayTeam.slice(0, 3);
        const homeAbbrev = (m as any).homeAbbrev || m.homeTeam.slice(0, 3);
        const matchText = `${m.awayTeam} ${m.homeTeam} ${awayAbbrev} ${homeAbbrev}`.toLowerCase();
        if (!matchText.includes(q)) return false;
      }

      return true;
    });
  }, [upcomingMatches, selectedDate, filterMode, searchQuery]);

  const toggleExpandMarkets = (matchId: string) => {
    setExpandedMarketMatchId((prev) => (prev === matchId ? null : matchId));
  };

  return (
    <div className="space-y-3.5 pb-20 pt-2 px-3.5 max-w-md mx-auto">
      {/* 1. Filter Pills & Search Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams or matchups..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            All Matches ({upcomingMatches.length})
          </button>
          <button
            onClick={() => setFilterMode('TOP_EDGE')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1 cursor-pointer ${
              filterMode === 'TOP_EDGE'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-400" /> High Conviction
          </button>
          <button
            onClick={() => setFilterMode('OVER')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
              filterMode === 'OVER'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Overs Only
          </button>
          <button
            onClick={() => setFilterMode('UNDER')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
              filterMode === 'UNDER'
                ? 'bg-rose-500 text-white'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Unders Only
          </button>
        </div>
      </div>

      {/* 2. Matchup Cards List */}
      {filteredMatches.length === 0 ? (
        <div className="theover-card p-8 text-center space-y-2">
          <p className="text-sm font-bold text-slate-300">No scheduled games match your filters</p>
          <p className="text-xs text-slate-500">Try selecting another date or clearing your search term.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((m) => {
            const isTopPick = m.recommendation.startsWith('STRONG') || Math.abs(m.edge) >= 4.0;
            const isExpanded = expandedMarketMatchId === m.id;
            const diff = m.edge;
            const pickType = m.recommendation.includes('OVER') ? 'OVER' : 'UNDER';

            // Computed simulated EV% based on edge
            const evPct = Math.max(2.5, Math.abs(diff) * 3.8);
            const winProbPct = Math.round(m.confidenceScore || 65);

            const awayAbbrev = (m as any).awayAbbrev || m.awayTeam.slice(0, 3).toUpperCase();
            const homeAbbrev = (m as any).homeAbbrev || m.homeTeam.slice(0, 3).toUpperCase();

            return (
              <div key={m.id} className="theover-card overflow-hidden">
                {/* Top Pick Banner */}
                <div
                  className={`px-3.5 py-1.5 flex items-center justify-between text-xs font-bold ${
                    isTopPick
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950'
                      : pickType === 'OVER'
                      ? 'bg-slate-900 text-emerald-400 border-b border-slate-800'
                      : 'bg-slate-900 text-rose-400 border-b border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                        isTopPick
                          ? 'bg-slate-950 text-cyan-400'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {isTopPick ? 'TOP PICK' : 'MODEL PICK'}
                    </span>
                    <span className={isTopPick ? 'text-white font-black' : 'font-extrabold'}>
                      {pickType} {m.sportsbookLine}
                    </span>
                  </div>

                  <div className={`flex items-center gap-2 text-[11px] font-mono ${isTopPick ? 'text-white' : 'text-slate-400'}`}>
                    <span>+{evPct.toFixed(1)}% EV</span>
                    <span>•</span>
                    <span>{winProbPct}% Win Prob</span>
                  </div>
                </div>

                {/* Matchup Header */}
                <div className="p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    {/* Away Team */}
                    <div className="flex items-center gap-2.5 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-white text-xs shrink-0">
                        {awayAbbrev}
                      </div>
                      <div>
                        <span className="text-xs font-black text-white block leading-tight">
                          {m.awayTeam}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {m.awayRecord || 'Away'}
                        </span>
                      </div>
                    </div>

                    {/* AT badge & Scheduled Time */}
                    <div className="text-center px-2 shrink-0">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">
                        AT
                      </span>
                      <div className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px] font-mono font-bold text-cyan-400 mt-0.5">
                        {m.time}
                      </div>
                    </div>

                    {/* Home Team */}
                    <div className="flex items-center gap-2.5 flex-1 justify-end text-right">
                      <div>
                        <span className="text-xs font-black text-white block leading-tight">
                          {m.homeTeam}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {m.homeRecord || 'Home'}
                        </span>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-white text-xs shrink-0">
                        {homeAbbrev}
                      </div>
                    </div>
                  </div>

                  {/* 3-Cell Stats Matrix: Book Line | Model Total | Point Edge */}
                  <div className="grid grid-cols-3 gap-2 bg-[#060a14] p-2.5 rounded-xl border border-slate-800/80 text-center font-mono">
                    <div>
                      <span className="text-[9px] text-slate-400 font-sans block uppercase">Book Line</span>
                      <span className="text-sm font-bold text-slate-200">{m.sportsbookLine}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-cyan-400 font-sans block uppercase">Model Total</span>
                      <span className="text-sm font-black text-cyan-400">{m.modelProjectedTotal.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-sans block uppercase">Point Edge</span>
                      <span className={`text-sm font-black ${diff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Quant Angle Narrative Box */}
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/60 text-[10.5px] text-slate-300 leading-snug">
                    <strong className="text-cyan-400">Quant Angle:</strong> Model projects {m.modelProjectedTotal.toFixed(1)} total points vs market line {m.sportsbookLine} ({diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)} discrepancy). Value favors {pickType} {m.sportsbookLine}.
                  </div>

                  {/* Expandable Markets Drawer (TheOver Signature Feature) */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-2 animate-fadeIn">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> All Evaluated Markets For This Matchup
                      </div>

                      <div className="overflow-x-auto no-scrollbar rounded-lg border border-slate-800">
                        <table className="w-full text-left text-[11px] font-mono">
                          <thead className="bg-[#060a14] text-slate-400 font-sans text-[9px] uppercase">
                            <tr>
                              <th className="py-1.5 px-2 font-bold">Market</th>
                              <th className="py-1.5 px-2 font-bold">Line</th>
                              <th className="py-1.5 px-2 font-bold">Model Prob</th>
                              <th className="py-1.5 px-2 font-bold">EV%</th>
                              <th className="py-1.5 px-2 font-bold text-right">Stance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {/* Primary Total Pick */}
                            <tr className="bg-cyan-500/10 font-bold">
                              <td className="py-1.5 px-2 text-white">Full Game Total</td>
                              <td className="py-1.5 px-2 text-cyan-300">{pickType} {m.sportsbookLine}</td>
                              <td className="py-1.5 px-2 text-emerald-400">{winProbPct}%</td>
                              <td className="py-1.5 px-2 text-cyan-400">+{evPct.toFixed(1)}%</td>
                              <td className="py-1.5 px-2 text-right text-emerald-400">Model Favors</td>
                            </tr>
                            {/* Counter Total */}
                            <tr>
                              <td className="py-1.5 px-2 text-slate-400">Opposite Total</td>
                              <td className="py-1.5 px-2 text-slate-400">{pickType === 'OVER' ? 'UNDER' : 'OVER'} {m.sportsbookLine}</td>
                              <td className="py-1.5 px-2 text-slate-400">{100 - winProbPct}%</td>
                              <td className="py-1.5 px-2 text-rose-400">-{evPct.toFixed(1)}%</td>
                              <td className="py-1.5 px-2 text-right text-rose-400">Model Fades</td>
                            </tr>
                            {/* 1st Half Total */}
                            <tr>
                              <td className="py-1.5 px-2 text-slate-300">1st Half Total</td>
                              <td className="py-1.5 px-2 text-slate-300">{pickType} {(m.sportsbookLine * 0.49).toFixed(1)}</td>
                              <td className="py-1.5 px-2 text-slate-300">{(winProbPct * 0.95).toFixed(0)}%</td>
                              <td className="py-1.5 px-2 text-cyan-400">+{(evPct * 0.85).toFixed(1)}%</td>
                              <td className="py-1.5 px-2 text-right text-emerald-400">Model Favors</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Bottom Row Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => toggleExpandMarkets(m.id)}
                      className="px-2.5 py-1.8 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1 transition active:scale-95 cursor-pointer"
                    >
                      {isExpanded ? 'Hide Markets' : 'All Markets'}
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    <button
                      onClick={() => onSelectGameDetail(m)}
                      className="flex-1 py-1.8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer border border-slate-700"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-slate-400" /> Deep Dive
                    </button>

                    {onTrackBet && (
                      <button
                        onClick={() => onTrackBet(m, pickType as 'OVER' | 'UNDER')}
                        className="px-3 py-1.8 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-sm shadow-cyan-500/20"
                      >
                        + Track
                      </button>
                    )}
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
