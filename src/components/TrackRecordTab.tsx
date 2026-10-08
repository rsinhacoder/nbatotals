import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Upload,
  FileSpreadsheet,
  Cpu,
  Layers,
  Edit2,
  Check,
  X,
  Table,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { NBAGame, DashboardMetrics, BucketStat } from '../types/nba';
import {
  type ModelConfig,
  MODEL_PRESETS,
  FIVE_YEAR_SEASON_STATS,
} from '../utils/modelConstants';
import { useTheme } from '../context/ThemeContext';

interface TrackRecordTabProps {
  games: NBAGame[];
  activeModel: ModelConfig;
  onSelectModel: (config: ModelConfig) => void;
  onUpdateReference: (gameId: string, referenceTotal: number | null) => void;
  dashboardMetrics: DashboardMetrics;
  bucketStats: BucketStat[];
  onExportExcel: () => void;
  onExportCsv: () => void;
  onImportCsv: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

type SubSection = 'DATABASE' | 'CALIBRATION' | 'BUCKETS';

export const TrackRecordTab: React.FC<TrackRecordTabProps> = ({
  games,
  activeModel,
  onSelectModel,
  onUpdateReference,
  dashboardMetrics,
  bucketStats,
  onExportExcel,
  onExportCsv,
  onImportCsv,
}) => {
  const { resolvedTheme } = useTheme();
  const [activeSubSection, setActiveSubSection] = useState<SubSection>('DATABASE');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Search & Filter state for Game Database
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState<'ALL' | 'SUCCESS' | 'FAILURE'>('ALL');
  const [selectedSeason, setSelectedSeason] = useState<string>('ALL');
  const [filterThreshold, setFilterThreshold] = useState<'ALL' | 'UNDER_47' | '47_OR_MORE'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const availableSeasons = useMemo(() => {
    const seasons = Array.from(new Set(games.map((g) => g.season).filter(Boolean))).sort().reverse();
    return seasons;
  }, [games]);

  // Sorting
  const [sortField] = useState<'date' | 'lowestQuarter' | 'regulationTotal' | 'absoluteModelError'>('date');
  const [sortAsc] = useState(false);

  // Inline reference editing
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      if (selectedSeason !== 'ALL' && game.season !== selectedSeason) return false;

      const matchSearch =
        searchTerm === '' ||
        game.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.date.includes(searchTerm);
      if (!matchSearch) return false;

      if (filterResult === 'SUCCESS' && game.forecastResult !== 'SUCCESS') return false;
      if (filterResult === 'FAILURE' && game.forecastResult !== 'FAILURE') return false;

      if (filterThreshold === 'UNDER_47' && !game.lowestUnder47) return false;
      if (filterThreshold === '47_OR_MORE' && game.lowestUnder47) return false;

      return true;
    });
  }, [games, searchTerm, filterResult, filterThreshold, selectedSeason]);

  const sortedGames = useMemo(() => {
    return [...filteredGames].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (sortField === 'date') {
        return sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [filteredGames, sortField, sortAsc]);

  const paginatedGames = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedGames.slice(start, start + pageSize);
  }, [sortedGames, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedGames.length / pageSize) || 1;

  const handleStartEdit = (game: NBAGame) => {
    setEditingGameId(game.id);
    setEditValue(game.referenceTotal !== null ? String(game.referenceTotal) : '');
  };

  const handleSaveEdit = (gameId: string) => {
    const val = parseFloat(editValue);
    if (editValue.trim() === '') {
      onUpdateReference(gameId, null);
    } else if (!isNaN(val) && val > 150) {
      onUpdateReference(gameId, val);
    }
    setEditingGameId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Sub-Nav and Export Buttons */}
      <div className="bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-[#1c2438] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-colors duration-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-indigo-950/80 text-blue-700 dark:text-indigo-400 border border-blue-200 dark:border-indigo-800/80 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5" />
              5-Year Quantitative Track Record
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              N = 6,000 NBA Games
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight m-0">
            Model Performance, Calibration &amp; Game Database
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 m-0 max-w-2xl">
            Audit every historical game, review the 5-season regression coefficients, test bucket stability, and export the official 7-sheet Excel workbook.
          </p>
        </div>

        {/* Action Controls & Excel Export */}
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <button
            onClick={onExportExcel}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel (.xlsx)
          </button>

          <button
            onClick={onExportCsv}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-transparent text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            Lines CSV
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={onImportCsv}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-transparent text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Upload className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
            Import CSV
          </button>
        </div>
      </div>

      {/* Sub-Navigation Pills */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#1c2438] pb-3 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveSubSection('DATABASE')}
          className={`px-4 py-2 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-2 ${
            activeSubSection === 'DATABASE'
              ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-[#0f1422] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Table className="h-4 w-4" />
          Game-by-Game Database ({games.length.toLocaleString()})
        </button>

        <button
          onClick={() => setActiveSubSection('CALIBRATION')}
          className={`px-4 py-2 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-2 ${
            activeSubSection === 'CALIBRATION'
              ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-[#0f1422] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Cpu className="h-4 w-4" />
          5-Year Regression Calibration
        </button>

        <button
          onClick={() => setActiveSubSection('BUCKETS')}
          className={`px-4 py-2 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-2 ${
            activeSubSection === 'BUCKETS'
              ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-[#0f1422] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="h-4 w-4" />
          Scoring Bucket Stability
        </button>
      </div>

      {/* Section 1: Completed Games Database */}
      {activeSubSection === 'DATABASE' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-colors duration-200">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by team (e.g. Celtics) or date..."
                className="w-full bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1c2438] rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-[#090d16] focus:border-blue-500 dark:focus:border-amber-400 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <select
                value={selectedSeason}
                onChange={(e) => {
                  setSelectedSeason(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1c2438] rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
              >
                <option value="ALL">All Seasons ({games.length.toLocaleString()} Games)</option>
                {availableSeasons.map((season) => {
                  const count = games.filter((g) => g.season === season).length;
                  return (
                    <option key={season} value={season}>
                      Season {season} ({count.toLocaleString()} Games)
                    </option>
                  );
                })}
              </select>

              <select
                value={filterResult}
                onChange={(e) => {
                  setFilterResult(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1c2438] rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Outcomes</option>
                <option value="SUCCESS">Success (Within MAE)</option>
                <option value="FAILURE">Exceeded MAE Margin</option>
              </select>

              <select
                value={filterThreshold}
                onChange={(e) => {
                  setFilterThreshold(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1c2438] rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Lowest Quarters</option>
                <option value="UNDER_47">Lowest Q &lt; 47 (Rule of 47)</option>
                <option value="47_OR_MORE">Lowest Q ≥ 47</option>
              </select>
            </div>
          </div>

          {/* Database Table */}
          <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl overflow-hidden shadow-xs transition-colors duration-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#090d16]/80 border-b border-slate-200 dark:border-[#1c2438] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date / Matchup</th>
                    <th className="py-3 px-3 text-center">Lowest Q</th>
                    <th className="py-3 px-3 text-center">Actual Total</th>
                    <th className="py-3 px-3 text-center">Model Forecast</th>
                    <th className="py-3 px-3 text-center">Market Line</th>
                    <th className="py-3 px-3 text-center">Abs Error</th>
                    <th className="py-3 px-3 text-center">Result</th>
                    <th className="py-3 px-4 text-right">Edit Line</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {paginatedGames.map((game) => (
                    <tr key={game.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-sans font-bold text-slate-900 dark:text-white text-xs">
                          {game.awayTeam} @ {game.homeTeam}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-500 font-mono mt-0.5">
                          {game.date} • {game.seasonType}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-blue-700 dark:text-amber-400">
                        {game.lowestQuarter} pts
                        <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-sans">
                          ({game.lowestQuarterNumber})
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white text-sm">
                        {game.regulationTotal}
                        {game.overtimePoints > 0 && (
                          <span className="text-[10px] text-blue-600 dark:text-amber-400 ml-1">
                            +{game.overtimePoints} OT
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center text-slate-700 dark:text-slate-300">
                        {game.modelPredictedRegulationTotal.toFixed(1)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {editingGameId === game.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              step="0.5"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-16 bg-white dark:bg-[#090d16] border border-blue-500 dark:border-amber-400 rounded px-1.5 py-0.5 text-center text-xs font-bold text-slate-900 dark:text-amber-300"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEdit(game.id)}
                              className="p-1 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingGameId(null)}
                              className="p-1 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-900 dark:text-amber-300 font-bold">
                            {game.referenceTotal !== null ? game.referenceTotal : '--'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center text-slate-500 dark:text-slate-400">
                        {game.absoluteModelError.toFixed(1)} pts
                      </td>

                      <td className="py-3 px-3 text-center font-sans">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            game.forecastResult === 'SUCCESS'
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {game.forecastResult}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleStartEdit(game)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors"
                          title="Edit Sportsbook Line"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="bg-slate-50 dark:bg-[#090d16]/80 px-4 py-3 border-t border-slate-200 dark:border-[#1c2438] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span>
                  Showing {sortedGames.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sortedGames.length)} of {sortedGames.length.toLocaleString()} games
                </span>
                <div className="flex items-center gap-1.5 border-l border-slate-300 dark:border-slate-700 pl-3">
                  <span>Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-transparent rounded-lg px-2 py-0.5 text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-transparent hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-slate-700 dark:text-slate-300"
                >
                  Previous
                </button>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-transparent hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-slate-700 dark:text-slate-300"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: 5-Year Calibration Details */}
      {activeSubSection === 'CALIBRATION' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-5 shadow-xs transition-colors duration-200">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Model Intercept (β₀)
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {activeModel.intercept.toFixed(4)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Baseline regulation constant
              </div>
            </div>

            <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-5 shadow-xs transition-colors duration-200">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Model Slope (β₁)
              </div>
              <div className="text-2xl font-black text-blue-700 dark:text-amber-400 font-mono mt-1">
                {activeModel.slope.toFixed(4)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Points gained per 1 pt Lowest Q
              </div>
            </div>

            <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-5 shadow-xs transition-colors duration-200">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Mean Absolute Error (MAE)
              </div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">
                {activeModel.historicalMae.toFixed(2)} pts
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Average forecast variance
              </div>
            </div>

            <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-5 shadow-xs transition-colors duration-200">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Under 219 Asymmetry Ratio
              </div>
              <div className="text-2xl font-black text-blue-700 dark:text-amber-400 font-mono mt-1">
                {dashboardMetrics.under219Ratio > 0 ? `${dashboardMetrics.under219Ratio.toFixed(2)} : 1` : '10.26 : 1'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                &lt;47 vs ≥47 Lowest Q ratio
              </div>
            </div>
          </div>

          {/* Model Switcher Card */}
          <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-6 shadow-xs space-y-4 transition-colors duration-200">
            <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">
              Active Regression Model Specification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(MODEL_PRESETS).map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => onSelectModel(preset)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    activeModel.id === preset.id
                      ? 'bg-blue-50/50 dark:bg-slate-800/80 border-blue-500 dark:border-amber-400 shadow-xs ring-1 ring-blue-500/30'
                      : 'bg-slate-50 dark:bg-[#090d16] border-slate-200 dark:border-[#1c2438] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{preset.name}</span>
                    {activeModel.id === preset.id && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 dark:bg-cyan-950 text-white dark:text-amber-300 border border-transparent dark:border-cyan-800">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-xs text-blue-700 dark:text-amber-300 font-bold mt-2">
                    Reg Total = {preset.intercept.toFixed(4)} + ({preset.slope.toFixed(4)} × Lowest Q)
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    MAE: <strong className="text-slate-900 dark:text-white">{preset.historicalMae} pts</strong> • R²: <strong className="text-slate-900 dark:text-white">{preset.rSquared?.toFixed(4) || '0.4650'}</strong> • Sample: <strong className="text-slate-900 dark:text-white">{preset.sampleSize}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Season by Season Breakdown */}
          <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-6 shadow-xs space-y-4 transition-colors duration-200">
            <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">
              5-Season Out-of-Sample Performance Stability
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-[#090d16]/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#1c2438] font-sans">
                  <tr>
                    <th className="py-2.5 px-3">Season</th>
                    <th className="py-2.5 px-3">Games</th>
                    <th className="py-2.5 px-3">Avg Reg Total</th>
                    <th className="py-2.5 px-3">Avg Lowest Q</th>
                    <th className="py-2.5 px-3">R² Fit</th>
                    <th className="py-2.5 px-3">MAE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {FIVE_YEAR_SEASON_STATS.map((s) => (
                    <tr key={s.season} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-white">{s.season}</td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{s.games.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{s.avgRegTotal.toFixed(1)}</td>
                      <td className="py-2.5 px-3 text-blue-700 dark:text-amber-400 font-bold">{s.avgLowestQ.toFixed(1)}</td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{s.r2.toFixed(4)}</td>
                      <td className="py-2.5 px-3 text-emerald-700 dark:text-emerald-400 font-bold">{s.mae.toFixed(2)} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Bucket Stability Chart */}
      {activeSubSection === 'BUCKETS' && (
        <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-6 shadow-xs space-y-6 transition-colors duration-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">
              Progression of Regulation Totals Across Lowest Quarter Buckets
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 m-0">
              Validates that scoring totals smoothly and monotonically scale with the lowest quarter.
            </p>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bucketStats} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={resolvedTheme === 'dark' ? '#1e293b' : '#e2e8f0'} vertical={false} />
                <XAxis dataKey="bucket" tick={{ fill: resolvedTheme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                <YAxis domain={[170, 260]} tick={{ fill: resolvedTheme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: resolvedTheme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: resolvedTheme === 'dark' ? '#334155' : '#cbd5e1',
                    borderRadius: '8px',
                    color: resolvedTheme === 'dark' ? '#fff' : '#0f172a',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="avgRegulationTotal" fill={resolvedTheme === 'dark' ? '#06b6d4' : '#2563eb'} name="Avg Regulation Total" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgOther3Quarters" fill={resolvedTheme === 'dark' ? '#6366f1' : '#93c5fd'} name="Avg Other 3 Quarters" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
export default TrackRecordTab;
