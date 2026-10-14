import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Calendar as CalendarIcon,
  RotateCw,
  TrendingDown,
  Percent,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import type { FootballFixture } from '../../types/football';
import { SUPPORTED_FOOTBALL_COMPETITIONS } from '../../data/football/competitionsData';
import {
  fetchFootballFixtures,
  filterAndSortFootballFixtures,
} from '../../services/football/footballDataService';
import { FootballMatchDetailModal } from './FootballMatchDetailModal';
import { FootballBacktestModal } from './FootballBacktestModal';

interface FootballThrowInScannerTabProps {
  onSelectGame?: (gameId: string) => void;
}

export const FootballThrowInScannerTab: React.FC<FootballThrowInScannerTabProps> = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [fixtures, setFixtures] = useState<FootballFixture[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedComp, setSelectedComp] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'conviction' | 'edge' | 'probability' | 'lowest-expected' | 'time'>('conviction');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [activeModalFixture, setActiveModalFixture] = useState<FootballFixture | null>(null);
  const [isBacktestModalOpen, setIsBacktestModalOpen] = useState<boolean>(false);

  // Fetch fixtures when selectedDate changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchFootballFixtures(selectedDate)
      .then((data) => {
        if (isMounted) {
          setFixtures(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  // Filter and sort fixtures
  const filteredFixtures = useMemo(() => {
    return filterAndSortFootballFixtures(fixtures, {
      competitionId: selectedComp,
      searchQuery,
      sortBy,
    });
  }, [fixtures, selectedComp, searchQuery, sortBy]);

  // Aggregate stats for top banner
  const bannerStats = useMemo(() => {
    const total = fixtures.length;
    const highConvictionPicks = fixtures.filter(
      (f) => f.forecast?.confidenceTier === 'HIGH_CONVICTION' || f.forecast?.confidenceTier === 'MODERATE_EDGE'
    ).length;
    const verifiedCount = fixtures.filter((f) => f.forecast?.dataQuality === 'OPTA_VERIFIED').length;
    const avgProjected =
      total > 0
        ? (
            fixtures.reduce((acc, f) => acc + (f.forecast?.projectedTotalThrowIns || 36), 0) / total
          ).toFixed(1)
        : '35.4';

    const topPickProb = fixtures.reduce(
      (max, f) => Math.max(max, f.forecast?.probabilityUnder40_5 || 0),
      0
    );

    return {
      total,
      highConvictionPicks,
      verifiedCount,
      avgProjected,
      topPickProb: topPickProb > 0 ? `${topPickProb.toFixed(1)}%` : '—',
    };
  }, [fixtures]);

  // Date helper buttons
  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const isTomorrow = (d: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      d.getDate() === tomorrow.getDate() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getFullYear() === tomorrow.getFullYear()
    );
  };

  const handleSelectToday = () => {
    setSelectedDate(new Date());
  };

  const handleSelectTomorrow = () => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    setSelectedDate(t);
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const [year, month, day] = e.target.value.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, day));
    }
  };

  const formatDateInputValue = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 pb-12">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              GLOBAL FOOTBALL EDGE SCANNER
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Total Match Throw-Ins <span className="text-emerald-400">Under 40.5</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Quantitative Poisson & Negative Binomial count-distribution models scanning worldwide football leagues.
              Ground truth calibrated on multi-season Opta event data with no-vig fair value market edge analysis.
            </p>
          </div>

          {/* Action Button: Audit & Backtest */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setIsBacktestModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-600 text-white text-xs font-semibold shadow-md transition"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Backtest & Calibration Audit</span>
            </button>

            <button
              onClick={() => {
                setIsLoading(true);
                fetchFootballFixtures(selectedDate).then((data) => {
                  setFixtures(data);
                  setIsLoading(false);
                });
              }}
              title="Refresh Fixtures"
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Aggregated Quick Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-700/60">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Scanned Fixtures</div>
            <div className="text-xl font-black text-white mt-0.5">{bannerStats.total}</div>
            <div className="text-[10px] text-slate-500">Scheduled on selected date</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Under 40.5 Edge Picks</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{bannerStats.highConvictionPicks}</div>
            <div className="text-[10px] text-emerald-400/80 font-medium">High / Moderate Conviction</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Peak Under Probability</div>
            <div className="text-xl font-black text-cyan-400 mt-0.5">{bannerStats.topPickProb}</div>
            <div className="text-[10px] text-slate-500">Highest modeled edge today</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Avg Projected Throw-Ins</div>
            <div className="text-xl font-black text-purple-400 mt-0.5">{bannerStats.avgProjected}</div>
            <div className="text-[10px] text-slate-500">Baseline threshold: 40.5</div>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Filters Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        {/* Row 1: Date Bar & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Date Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectToday}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                isToday(selectedDate)
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Today
            </button>
            <button
              onClick={handleSelectTomorrow}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                isTomorrow(selectedDate)
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Tomorrow
            </button>
            <div className="relative flex items-center">
              <CalendarIcon className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={formatDateInputValue(selectedDate)}
                onChange={handleDateInputChange}
                className="pl-8 pr-2 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teams or leagues..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Row 2: Competition Pills & Sort Dropdown */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-800">
          {/* League Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            <button
              onClick={() => setSelectedComp('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                selectedComp === 'all'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:text-white'
              }`}
            >
              All Leagues ({fixtures.length})
            </button>

            {Object.values(SUPPORTED_FOOTBALL_COMPETITIONS).map((comp) => {
              const count = fixtures.filter(
                (f) =>
                  f.competition.id.toLowerCase() === comp.id.toLowerCase() ||
                  f.forecast?.competition.id.toLowerCase() === comp.id.toLowerCase()
              ).length;
              if (count === 0 && selectedComp !== comp.id) return null;

              return (
                <button
                  key={comp.id}
                  onClick={() => setSelectedComp(comp.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                    selectedComp === comp.id
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:text-white'
                  }`}
                >
                  {comp.name} {count > 0 ? `(${count})` : ''}
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="conviction">Highest Conviction Under</option>
              <option value="edge">Highest Value Edge</option>
              <option value="lowest-expected">Lowest Projected Throw-Ins</option>
              <option value="probability">Probability Under 40.5</option>
              <option value="time">Kickoff Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Matches Slate */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse p-6"
            />
          ))}
        </div>
      ) : filteredFixtures.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <Layers className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white">No Football Matches Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            No matches match the selected date or filter criteria. Try selecting "All Leagues" or browsing tomorrow's slate.
          </p>
          <button
            onClick={() => {
              setSelectedComp('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/30 transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFixtures.map((fixture) => {
            const forecast = fixture.forecast;
            if (!forecast) return null;

            const isConviction =
              forecast.confidenceTier === 'HIGH_CONVICTION' || forecast.confidenceTier === 'MODERATE_EDGE';

            return (
              <div
                key={fixture.id}
                onClick={() => setActiveModalFixture(fixture)}
                className={`relative group rounded-2xl bg-slate-900/90 border transition-all cursor-pointer p-5 flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 ${
                  isConviction ? 'border-emerald-500/30 bg-slate-900' : 'border-slate-800'
                }`}
              >
                {/* Top Row: League & Status & Conviction Pill */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                        {fixture.competition.name}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {fixture.time}
                      </span>
                    </div>

                    {/* Confidence Tier Pill */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        forecast.confidenceTier === 'HIGH_CONVICTION'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : forecast.confidenceTier === 'MODERATE_EDGE'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                          : forecast.confidenceTier === 'LEAN_UNDER'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : forecast.confidenceTier === 'HIGH_VOLATILITY'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {forecast.confidenceTier.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Teams Matchup Header */}
                  <div className="flex items-center justify-between gap-2 py-2">
                    {/* Home Team */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <img
                        src={fixture.homeTeam.logo}
                        alt={fixture.homeTeam.name}
                        className="w-8 h-8 rounded-full bg-slate-800 p-0.5 shrink-0 object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://a.espncdn.com/i/teamlogos/default-team-logo-500.png';
                        }}
                      />
                      <div className="truncate">
                        <span className="text-sm font-bold text-white block truncate">
                          {fixture.homeTeam.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Home</span>
                      </div>
                    </div>

                    <div className="px-2 text-xs font-mono font-bold text-slate-500">VS</div>

                    {/* Away Team */}
                    <div className="flex items-center justify-end gap-2.5 flex-1 min-w-0 text-right">
                      <div className="truncate">
                        <span className="text-sm font-bold text-white block truncate">
                          {fixture.awayTeam.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Away</span>
                      </div>
                      <img
                        src={fixture.awayTeam.logo}
                        alt={fixture.awayTeam.name}
                        className="w-8 h-8 rounded-full bg-slate-800 p-0.5 shrink-0 object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://a.espncdn.com/i/teamlogos/default-team-logo-500.png';
                        }}
                      />
                    </div>
                  </div>

                  {/* Quantitative Projection Box */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Projected Match Total
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-white font-mono">
                            {forecast.projectedTotalThrowIns}
                          </span>
                          <span
                            className={`text-xs font-bold font-mono ${
                              forecast.expectedDifference < 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {forecast.expectedDifference > 0
                              ? `+${forecast.expectedDifference}`
                              : `${forecast.expectedDifference}`}{' '}
                            vs 40.5
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          P(Under 40.5)
                        </span>
                        <span className="text-lg font-black text-emerald-400 font-mono">
                          {forecast.probabilityUnder40_5}%
                        </span>
                      </div>
                    </div>

                    {/* Probability Progress Bar */}
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${forecast.probabilityUnder40_5}%` }}
                        className={`h-full transition-all ${
                          forecast.probabilityUnder40_5 >= 75
                            ? 'bg-emerald-500'
                            : forecast.probabilityUnder40_5 >= 60
                            ? 'bg-cyan-500'
                            : 'bg-amber-500'
                        }`}
                      />
                      <div
                        style={{ width: `${100 - forecast.probabilityUnder40_5}%` }}
                        className="h-full bg-rose-500/80"
                      />
                    </div>
                  </div>

                  {/* Market Edge & Data Quality Row */}
                  <div className="mt-3 flex items-center justify-between text-xs pt-1">
                    {forecast.hasMarketOdds && forecast.marketOdds ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Under 40.5 Odds:</span>
                        <span className="font-mono font-bold text-white">{forecast.marketOdds.underPrice}</span>
                        {(forecast.marketProbabilityEdge || 0) > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            +{forecast.marketProbabilityEdge}% Edge
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-mono">Market: Off-Board / Prop Unpriced</span>
                    )}

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        forecast.dataQuality === 'OPTA_VERIFIED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {forecast.dataQuality === 'OPTA_VERIFIED' ? 'Opta Verified' : 'Calibrated Baseline'}
                    </span>
                  </div>

                  {/* Explanation Bullets Preview */}
                  <p className="mt-3 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {forecast.dataGroundedExplanation}
                  </p>
                </div>

                {/* Card Action Link */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 group-hover:text-emerald-400 transition">
                  <span className="font-medium">Inspect Poisson Decomposition & Logs</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Match Detail Modal */}
      <FootballMatchDetailModal
        fixture={activeModalFixture}
        isOpen={Boolean(activeModalFixture)}
        onClose={() => setActiveModalFixture(null)}
      />

      {/* Backtest & Calibration Audit Modal */}
      <FootballBacktestModal
        isOpen={isBacktestModalOpen}
        onClose={() => setIsBacktestModalOpen(false)}
      />
    </div>
  );
};
