import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Edit2,
  Check,
  X,
  ExternalLink,
  Info,
} from 'lucide-react';
import { NBAGame } from '../types/nba';

interface ForecastEvaluationTabProps {
  games: NBAGame[];
  onUpdateReference: (gameId: string, referenceTotal: number | null) => void;
}

type SortField =
  | 'date'
  | 'awayTeam'
  | 'lowestQuarter'
  | 'modelPredictedRegulationTotal'
  | 'referenceTotal'
  | 'modelMinusReference'
  | 'regulationTotal'
  | 'modelError'
  | 'absoluteModelError'
  | 'forecastResult';

export const ForecastEvaluationTab: React.FC<ForecastEvaluationTabProps> = ({
  games,
  onUpdateReference,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [seasonTypeFilter, setSeasonTypeFilter] = useState<'ALL' | 'Preseason' | 'Regular Season'>('ALL');
  const [resultFilter, setResultFilter] = useState<'ALL' | 'SUCCESS' | 'FAILURE'>('ALL');
  const [lowestQFilter, setLowestQFilter] = useState<'ALL' | 'UNDER_47' | '47_OR_MORE'>('ALL');
  const [regFilter, setRegFilter] = useState<'ALL' | 'UNDER_219' | '219_OR_MORE'>('ALL');
  const [refFilter, setRefFilter] = useState<'ALL' | 'CLOSE' | 'LARGE_GAP' | 'NO_REF'>('ALL');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Expanded game for detailed quarter breakdown modal / row
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);

  // Inline editing state
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleStartEdit = (game: NBAGame) => {
    setEditingGameId(game.id);
    setEditValue(game.referenceTotal !== null && game.referenceTotal !== undefined ? String(game.referenceTotal) : '');
  };

  const handleSaveEdit = (gameId: string) => {
    const val = parseFloat(editValue);
    if (!isNaN(val) && val > 0) {
      onUpdateReference(gameId, val);
    } else if (editValue.trim() === '') {
      onUpdateReference(gameId, null);
    }
    setEditingGameId(null);
  };

  const handleCancelEdit = () => {
    setEditingGameId(null);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered and sorted games
  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      // Search
      const searchMatch =
        searchTerm === '' ||
        g.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.id.includes(searchTerm) ||
        g.date.includes(searchTerm);

      if (!searchMatch) return false;

      // Season Type
      if (seasonTypeFilter !== 'ALL' && g.seasonType !== seasonTypeFilter) return false;

      // Result
      if (resultFilter !== 'ALL' && g.forecastResult !== resultFilter) return false;

      // Lowest Q
      if (lowestQFilter === 'UNDER_47' && !g.lowestUnder47) return false;
      if (lowestQFilter === '47_OR_MORE' && g.lowestUnder47) return false;

      // Reg Total
      if (regFilter === 'UNDER_219' && !g.regulationUnder219) return false;
      if (regFilter === '219_OR_MORE' && g.regulationUnder219) return false;

      // Reference
      if (refFilter === 'CLOSE' && g.referenceComparison !== 'CLOSE') return false;
      if (refFilter === 'LARGE_GAP' && g.referenceComparison !== 'LARGE GAP') return false;
      if (refFilter === 'NO_REF' && g.referenceComparison !== 'NO REFERENCE') return false;

      return true;
    });
  }, [games, searchTerm, seasonTypeFilter, resultFilter, lowestQFilter, regFilter, refFilter]);

  const sortedGames = useMemo(() => {
    return [...filteredGames].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (aVal === null || aVal === undefined) aVal = -999999;
      if (bVal === null || bVal === undefined) bVal = -999999;

      if (typeof aVal === 'string') {
        const cmp = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? cmp : -cmp;
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredGames, sortField, sortDirection]);

  // Pagination slice
  const totalPages = Math.ceil(sortedGames.length / pageSize) || 1;
  const paginatedGames = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedGames.slice(start, start + pageSize);
  }, [sortedGames, currentPage, pageSize]);

  // Statistics for current filtered slice
  const filteredSuccessRate = useMemo(() => {
    if (filteredGames.length === 0) return 0;
    const successes = filteredGames.filter((g) => g.forecastResult === 'SUCCESS').length;
    return (successes / filteredGames.length) * 100;
  }, [filteredGames]);

  const filteredAvgError = useMemo(() => {
    if (filteredGames.length === 0) return 0;
    const totalError = filteredGames.reduce((acc, g) => acc + g.absoluteModelError, 0);
    return totalError / filteredGames.length;
  }, [filteredGames]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 glow-card space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by team, date (YYYY-MM-DD), or ESPN Game ID..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>

          {/* Quick Filter Summaries */}
          <div className="flex items-center gap-3 text-xs bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 self-start md:self-auto">
            <span className="text-slate-400">
              Showing: <strong className="text-cyan-400">{filteredGames.length}</strong> of {games.length}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              Success: <strong className="text-emerald-400">{filteredSuccessRate.toFixed(1)}%</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              Avg Error: <strong className="text-amber-300">{filteredAvgError.toFixed(2)} pts</strong>
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 flex items-center gap-1 mr-1 font-medium">
            <SlidersHorizontal className="h-3 w-3" /> Filters:
          </span>

          {/* Season Type */}
          <select
            value={seasonTypeFilter}
            onChange={(e) => {
              setSeasonTypeFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Seasons</option>
            <option value="Regular Season">Regular Season</option>
            <option value="Preseason">Preseason</option>
          </select>

          {/* Forecast Result */}
          <select
            value={resultFilter}
            onChange={(e) => {
              setResultFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Results</option>
            <option value="SUCCESS">Success Only (Within MAE)</option>
            <option value="FAILURE">Failure Only (&gt;10.16)</option>
          </select>

          {/* Lowest Quarter Rule */}
          <select
            value={lowestQFilter}
            onChange={(e) => {
              setLowestQFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">Lowest Q: All</option>
            <option value="UNDER_47">Lowest Q &lt; 47</option>
            <option value="47_OR_MORE">Lowest Q ≥ 47</option>
          </select>

          {/* Regulation Total Rule */}
          <select
            value={regFilter}
            onChange={(e) => {
              setRegFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">Reg Total: All</option>
            <option value="UNDER_219">Regulation &lt; 219</option>
            <option value="219_OR_MORE">Regulation ≥ 219</option>
          </select>

          {/* Reference Line Filter */}
          <select
            value={refFilter}
            onChange={(e) => {
              setRefFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">Reference Line: All</option>
            <option value="CLOSE">Close (Within ±10.16)</option>
            <option value="LARGE_GAP">Large Gap (&gt;10.16)</option>
            <option value="NO_REF">No Reference Set</option>
          </select>

          {(searchTerm || seasonTypeFilter !== 'ALL' || resultFilter !== 'ALL' || lowestQFilter !== 'ALL' || regFilter !== 'ALL' || refFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSeasonTypeFilter('ALL');
                setResultFilter('ALL');
                setLowestQFilter('ALL');
                setRegFilter('ALL');
                setRefFilter('ALL');
                setCurrentPage(1);
              }}
              className="text-cyan-400 hover:text-cyan-300 underline text-xs px-2 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden glow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800 select-none">
                <th className="py-3 px-3 w-8"></th>
                <th
                  onClick={() => handleSort('date')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Date
                    {sortField === 'date' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('awayTeam')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Matchup
                    {sortField === 'awayTeam' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('lowestQuarter')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Lowest Q
                    {sortField === 'lowestQuarter' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('modelPredictedRegulationTotal')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Model Predicted
                    {sortField === 'modelPredictedRegulationTotal' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('referenceTotal')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Reference Total (Line)
                    {sortField === 'referenceTotal' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('modelMinusReference')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Model - Ref
                    {sortField === 'modelMinusReference' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('regulationTotal')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Actual Reg
                    {sortField === 'regulationTotal' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('modelError')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Error
                    {sortField === 'modelError' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('absoluteModelError')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Abs Error
                    {sortField === 'absoluteModelError' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('forecastResult')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Result
                    {sortField === 'forecastResult' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedGames.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    No games found matching your current filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedGames.map((game) => {
                  const isExpanded = expandedGameId === game.id;
                  const isEditing = editingGameId === game.id;

                  return (
                    <React.Fragment key={game.id}>
                      <tr className="hover:bg-slate-800/40 transition-colors">
                        {/* Expand Button */}
                        <td className="py-2.5 px-3 text-slate-500">
                          <button
                            onClick={() => setExpandedGameId(isExpanded ? null : game.id)}
                            className="p-1 hover:text-cyan-400 cursor-pointer"
                            title="Toggle quarter details"
                          >
                            <ChevronRight
                              className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90 text-cyan-400' : ''}`}
                            />
                          </button>
                        </td>

                        {/* Date & Season */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-mono text-slate-200">{game.date}</div>
                          <span
                            className={`text-[10px] font-semibold ${
                              game.seasonType === 'Regular Season' ? 'text-slate-500' : 'text-amber-500/80'
                            }`}
                          >
                            {game.seasonType}
                          </span>
                        </td>

                        {/* Matchup */}
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-white whitespace-nowrap">
                            {game.awayTeam} <span className="text-slate-500 font-normal">@</span> {game.homeTeam}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {game.awayScore} - {game.homeScore} {game.overtimePoints > 0 ? `(OT +${game.overtimePoints})` : ''}
                          </div>
                        </td>

                        {/* Lowest Quarter */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-white text-sm">
                              {game.lowestQuarter}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                              {game.lowestQuarterNumber}
                            </span>
                            {game.lowestUnder47 && (
                              <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold" title="Lowest < 47 (Strong Under indicator)">
                                &lt;47
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            Bucket: {game.lowestBucket}
                          </span>
                        </td>

                        {/* Model Predicted */}
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-cyan-400">
                          {game.modelPredictedRegulationTotal.toFixed(2)}
                        </td>

                        {/* Reference Total (Inline Editable) */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.5"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                autoFocus
                                className="w-16 bg-slate-950 border border-cyan-500 rounded px-1.5 py-0.5 text-xs text-white font-mono focus:outline-none"
                              />
                              <button
                                onClick={() => handleSaveEdit(game.id)}
                                className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                                title="Save line"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1 text-slate-400 hover:text-slate-300 cursor-pointer"
                                title="Cancel"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => handleStartEdit(game)}
                              className="group inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 cursor-pointer transition-colors"
                              title="Click to edit sportsbook reference line"
                            >
                              <span className="font-mono text-slate-200">
                                {game.referenceTotal !== null && game.referenceTotal !== undefined
                                  ? game.referenceTotal.toFixed(1)
                                  : <span className="text-slate-500 italic">--</span>}
                              </span>
                              <Edit2 className="h-2.5 w-2.5 text-slate-500 group-hover:text-cyan-400 opacity-60 group-hover:opacity-100" />
                            </div>
                          )}
                        </td>

                        {/* Model - Reference */}
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                          {game.modelMinusReference !== null && game.modelMinusReference !== undefined ? (
                            <span
                              className={`font-semibold ${
                                game.modelMinusReference < 0 ? 'text-emerald-400' : 'text-amber-400'
                              }`}
                            >
                              {game.modelMinusReference > 0 ? `+${game.modelMinusReference.toFixed(2)}` : game.modelMinusReference.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-600">--</span>
                          )}
                        </td>

                        {/* Actual Regulation Total */}
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-white">
                          {game.regulationTotal}
                          {game.regulationUnder219 && (
                            <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold" title="Regulation < 219">
                              &lt;219
                            </span>
                          )}
                        </td>

                        {/* Model Error */}
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                          <span className={game.modelError >= 0 ? 'text-slate-300' : 'text-slate-400'}>
                            {game.modelError >= 0 ? `+${game.modelError.toFixed(2)}` : game.modelError.toFixed(2)}
                          </span>
                        </td>

                        {/* Absolute Model Error */}
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              game.withinHistoricalMAE
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-rose-500/15 text-rose-400'
                            }`}
                          >
                            {game.absoluteModelError.toFixed(2)}
                          </span>
                        </td>

                        {/* Forecast Result */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                              game.forecastResult === 'SUCCESS'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                                : 'bg-rose-950 text-rose-300 border border-rose-800/80'
                            }`}
                          >
                            {game.forecastResult}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Quarter Breakdown */}
                      {isExpanded && (
                        <tr className="bg-slate-950/90 border-b border-slate-800">
                          <td colSpan={11} className="py-3 px-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              {/* Quarter Scores */}
                              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                                <div className="text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
                                  <Info className="h-3 w-3 text-cyan-400" /> Quarter Totals
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-center font-mono">
                                  <div className={`p-1.5 rounded ${game.lowestQuarterNumber === 'Q1' ? 'bg-cyan-950 border border-cyan-700' : 'bg-slate-950'}`}>
                                    <div className="text-[10px] text-slate-400">Q1</div>
                                    <div className="font-bold text-white">{game.q1}</div>
                                  </div>
                                  <div className={`p-1.5 rounded ${game.lowestQuarterNumber === 'Q2' ? 'bg-cyan-950 border border-cyan-700' : 'bg-slate-950'}`}>
                                    <div className="text-[10px] text-slate-400">Q2</div>
                                    <div className="font-bold text-white">{game.q2}</div>
                                  </div>
                                  <div className={`p-1.5 rounded ${game.lowestQuarterNumber === 'Q3' ? 'bg-cyan-950 border border-cyan-700' : 'bg-slate-950'}`}>
                                    <div className="text-[10px] text-slate-400">Q3</div>
                                    <div className="font-bold text-white">{game.q3}</div>
                                  </div>
                                  <div className={`p-1.5 rounded ${game.lowestQuarterNumber === 'Q4' ? 'bg-cyan-950 border border-cyan-700' : 'bg-slate-950'}`}>
                                    <div className="text-[10px] text-slate-400">Q4</div>
                                    <div className="font-bold text-white">{game.q4}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Extreme Quarters */}
                              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1.5 font-mono">
                                <div className="text-slate-400 font-sans font-semibold mb-1">
                                  Quarter Extremes
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Lowest Quarter:</span>
                                  <span className="text-cyan-400 font-bold">{game.lowestQuarter} ({game.lowestQuarterNumber})</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Highest Quarter:</span>
                                  <span className="text-white font-bold">{game.highestQuarter} ({game.highestQuarterNumber})</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Other 3 Quarters:</span>
                                  <span className="text-slate-200">{game.otherThreeQuarters}</span>
                                </div>
                              </div>

                              {/* Secondary Model Predictions */}
                              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1.5 font-mono">
                                <div className="text-slate-400 font-sans font-semibold mb-1">
                                  Other 3 Q Model
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Pred Other 3:</span>
                                  <span className="text-cyan-400">{game.modelPredictedOther3.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Other 3 Error:</span>
                                  <span className="text-slate-200">{game.other3Error.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Abs Other 3 Err:</span>
                                  <span className="text-amber-300">{game.absoluteOther3Error.toFixed(2)}</span>
                                </div>
                              </div>

                              {/* Game Links & Meta */}
                              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                                <div>
                                  <div className="text-slate-400 font-semibold mb-1">ESPN Info</div>
                                  <div className="font-mono text-slate-300 text-[11px]">ID: {game.id}</div>
                                </div>
                                <a
                                  href={`https://www.espn.com/nba/game/_/gameId/${game.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs mt-2"
                                >
                                  View on ESPN <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="ml-2">
              Page {currentPage} of {totalPages} ({filteredGames.length} total filtered games)
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <div className="px-3 py-1.5 font-mono text-slate-400">
              {currentPage} / {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
