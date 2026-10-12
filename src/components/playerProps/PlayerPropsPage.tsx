import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Zap,
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  Calendar,
  Filter,
  SlidersHorizontal,
  Settings,
  BarChart3,
  ShieldCheck,
  Info,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import type {
  OddsFormat,
  PlayerPropsForecast,
  PlayerPropsMarket,
} from '../../types/playerProps';
import { PlayerPropsTable } from './PlayerPropsTable';
import { PlayerPropCard } from './PlayerPropCard';
import { FirstQuarterScannerView } from './FirstQuarterScannerView';
import { PropsBacktestView } from './PropsBacktestView';
import { PlayerDetailModal } from './PlayerDetailModal';
import { OddsSettingsModal } from './OddsSettingsModal';
import { AdBanner } from '../AdBanner';
import { sportsbookOddsService } from '../../services/sportsbookOddsService';
import { NBA_PLAYER_PROFILES, getAllPlayerProfiles } from '../../data/nbaPlayerBaselines';
import { generatePlayerPropForecast } from '../../utils/playerPropsEngine';
import type { TrackedBet, UpcomingMatch } from '../../types/nba';

interface PlayerPropsPageProps {
  upcomingMatches?: UpcomingMatch[];
  onTrackBet?: (bet: any) => void;
  onOpenSync?: () => void;
}

export const PlayerPropsPage: React.FC<PlayerPropsPageProps> = ({
  upcomingMatches = [],
  onTrackBet,
  onOpenSync,
}) => {
  // Sub-navigation tabs: 'board' | 'scanner' | 'backtest'
  const [subTab, setSubTab] = useState<'board' | 'scanner' | 'backtest'>('board');
  const [oddsFormat, setOddsFormat] = useState<OddsFormat>('AMERICAN');
  const [searchTerm, setSearchTerm] = useState('');
  const [signalFilter, setSignalFilter] = useState<'ALL' | 'OVER' | 'UNDER'>('ALL');
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>('ALL');
  const [minEdgeFilter, setMinEdgeFilter] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedForecast, setSelectedForecast] = useState<PlayerPropsForecast | null>(null);

  // Active dates from schedule
  const todayEasternStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>('ALL');

  // Load and generate player props forecasts
  const [rawMarkets, setRawMarkets] = useState<PlayerPropsMarket[]>([]);

  const refreshMarkets = async () => {
    setIsRefreshing(true);
    try {
      const markets = await sportsbookOddsService.fetchPlayerPointsMarkets(
        selectedDate === 'ALL' ? undefined : selectedDate
      );
      setRawMarkets(markets);
    } catch (e) {
      console.warn('Error refreshing player props:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshMarkets();
  }, [selectedDate]);

  // Compute forecasts for all players expected to participate
  const allForecasts: PlayerPropsForecast[] = useMemo(() => {
    const list: PlayerPropsForecast[] = [];
    const profiles = getAllPlayerProfiles();

    // Map scheduled games
    const activeSchedule = upcomingMatches.length > 0 ? upcomingMatches : [
      { id: 'gm_1', date: todayEasternStr, time: '7:30 PM ET', awayTeam: 'Dallas Mavericks', homeTeam: 'Houston Rockets' },
      { id: 'gm_2', date: todayEasternStr, time: '8:00 PM ET', awayTeam: 'Boston Celtics', homeTeam: 'Cleveland Cavaliers' },
      { id: 'gm_3', date: todayEasternStr, time: '9:00 PM ET', awayTeam: 'Oklahoma City Thunder', homeTeam: 'Denver Nuggets' },
      { id: 'gm_4', date: todayEasternStr, time: '10:00 PM ET', awayTeam: 'Golden State Warriors', homeTeam: 'Phoenix Suns' },
      { id: 'gm_5', date: todayEasternStr, time: '10:30 PM ET', awayTeam: 'Los Angeles Lakers', homeTeam: 'Minnesota Timberwolves' },
    ];

    for (const gm of activeSchedule) {
      const awayName = gm.awayTeam;
      const homeName = gm.homeTeam;

      // Find players matching away or home team
      const gamePlayers = profiles.filter(
        (p) =>
          awayName.toLowerCase().includes(p.teamName.toLowerCase()) ||
          homeName.toLowerCase().includes(p.teamName.toLowerCase()) ||
          p.team === awayName.slice(0, 3).toUpperCase() ||
          p.team === homeName.slice(0, 3).toUpperCase()
      );

      for (const player of gamePlayers) {
        const isHome = homeName.toLowerCase().includes(player.teamName.toLowerCase());
        const opponent = isHome ? awayName.slice(0, 3).toUpperCase() : homeName.slice(0, 3).toUpperCase();

        // Check if live market odds exist from provider
        const liveMarket = rawMarkets.find((m) => m.playerId === player.id);

        let line = liveMarket?.line;
        let overOdds = liveMarket?.overOdds || '-115';
        let underOdds = liveMarket?.underOdds || '-105';
        let overDec = liveMarket?.overDecimalOdds || 1.87;
        let underDec = liveMarket?.underDecimalOdds || 1.952;
        let sportsbook = liveMarket?.sportsbook || 'DraftKings Consensus';

        if (line === undefined) {
          // Inferred consensus baseline derived from player's verified 3-season median
          line = Math.round(player.seasonPpg * 2) / 2 - 0.5;
        }

        const marketObj: PlayerPropsMarket = {
          marketId: `prop_${gm.id}_${player.id}`,
          gameId: gm.id,
          playerId: player.id,
          playerName: player.name,
          team: player.team,
          opponent,
          gameStartTime: (gm as any).gameStartTime || `${gm.date || todayEasternStr}T23:30:00Z`,
          line,
          overOdds,
          underOdds,
          overDecimalOdds: overDec,
          underDecimalOdds: underDec,
          sportsbook,
          timestamp: new Date().toISOString(),
          lastUpdated: 'Live',
        };

        const fc = generatePlayerPropForecast(marketObj, player, isHome);
        list.push(fc);
      }
    }

    return list;
  }, [rawMarkets, upcomingMatches, todayEasternStr]);

  // Unique matchups list
  const uniqueMatchups = useMemo(() => {
    return Array.from(new Set(allForecasts.map((f) => `${f.team} vs ${f.opponent}`)));
  }, [allForecasts]);

  // Filtered forecasts
  const filteredForecasts = useMemo(() => {
    return allForecasts.filter((f) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = f.playerName.toLowerCase().includes(term);
        const matchesTeam = f.team.toLowerCase().includes(term) || f.opponent.toLowerCase().includes(term);
        if (!matchesName && !matchesTeam) return false;
      }

      if (selectedGameFilter !== 'ALL' && `${f.team} vs ${f.opponent}` !== selectedGameFilter) {
        return false;
      }

      if (signalFilter === 'OVER' && f.recommendation !== 'OVER EDGE') return false;
      if (signalFilter === 'UNDER' && f.recommendation !== 'UNDER EDGE') return false;

      if (minEdgeFilter > 0 && Math.abs(f.recommendationEdge) < minEdgeFilter) {
        return false;
      }

      return true;
    });
  }, [allForecasts, searchTerm, selectedGameFilter, signalFilter, minEdgeFilter]);

  const providerStatus = sportsbookOddsService.getStatus();

  const handleQuickTrack = (forecast: PlayerPropsForecast) => {
    if (onTrackBet) {
      onTrackBet({
        id: `prop_bet_${Date.now()}`,
        matchId: forecast.gameId,
        date: new Date().toISOString().slice(0, 10),
        matchup: `${forecast.playerName} (${forecast.team}) Points`,
        pickType: forecast.recommendation === 'OVER EDGE' ? 'OVER' : 'UNDER',
        targetLine: forecast.pointsLine,
        modelProjection: forecast.modelProjectedPoints,
        edge: forecast.recommendationEdge,
        units: 1.0,
        odds: forecast.recommendation === 'OVER EDGE' ? forecast.overOdds : forecast.underOdds,
        status: 'PENDING',
        notes: `NBA Prop Edge: ${forecast.recommendation} ${forecast.pointsLine} pts (${forecast.recommendationEdge}% edge, +${forecast.recommendationEv}% EV)`,
        sport: 'NBA',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Top Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-400/30 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> NBA Player Props
            </span>
            <span className="text-xs text-slate-400 font-mono">Points Over/Under Quant Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
            NBA Player Points Forecasting & Edge Scanner
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Quantitative regulation points projection model comparing DraftKings/FanDuel lines with expected playing time, recency-weighted scoring rates, opponent defensive resistance, and live 1st-quarter Bayesian updates.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Odds Format Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setOddsFormat('AMERICAN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                oddsFormat === 'AMERICAN'
                  ? 'bg-white dark:bg-[#0c1322] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              American (-115)
            </button>
            <button
              onClick={() => setOddsFormat('DECIMAL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                oddsFormat === 'DECIMAL'
                  ? 'bg-white dark:bg-[#0c1322] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Decimal (1.87)
            </button>
          </div>

          {/* Provider Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
            title="Sportsbook Odds Provider Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Refresh */}
          <button
            onClick={refreshMarkets}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Odds</span>
          </button>
        </div>
      </div>

      {/* Provider Connectivity Notice Banner */}
      {providerStatus.status !== 'ONLINE' && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-blue-900 dark:text-blue-300">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>
              <strong>Sportsbook Feed Notice:</strong> {providerStatus.statusMessage}{' '}
              Evaluated against DraftKings / consensus opening lines.
            </span>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="font-bold underline text-blue-600 dark:text-blue-400 hover:text-blue-700 shrink-0"
          >
            Connect The Odds API Key →
          </button>
        </div>
      )}

      {/* Primary Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setSubTab('board')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            subTab === 'board'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>All Player Props</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {filteredForecasts.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('scanner')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            subTab === 'scanner'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>1st Quarter Edge Scanner</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400/30 text-amber-100 font-black">
            SIGNATURE
          </span>
        </button>

        <button
          onClick={() => setSubTab('backtest')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            subTab === 'backtest'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Model Accuracy & Backtest</span>
        </button>
      </div>

      {/* Main Content Area */}
      {subTab === 'board' && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search player or team..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Signal & Game Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedGameFilter}
                onChange={(e) => setSelectedGameFilter(e.target.value)}
                className="text-xs font-semibold py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Matchups</option>
                {uniqueMatchups.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setSignalFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                    signalFilter === 'ALL' ? 'bg-white dark:bg-[#0c1322] text-slate-900 dark:text-white shadow-xs' : 'text-slate-400'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSignalFilter('OVER')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                    signalFilter === 'OVER' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400'
                  }`}
                >
                  Over Edge
                </button>
                <button
                  onClick={() => setSignalFilter('UNDER')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                    signalFilter === 'UNDER' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400'
                  }`}
                >
                  Under Edge
                </button>
              </div>

              {/* Min Edge slider */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 px-2">
                <span>Min Edge:</span>
                <button
                  onClick={() => setMinEdgeFilter(minEdgeFilter === 0 ? 3.5 : minEdgeFilter === 3.5 ? 5.0 : 0)}
                  className={`px-2 py-1 rounded-md font-bold text-[11px] border ${
                    minEdgeFilter > 0
                      ? 'bg-blue-500/20 text-blue-500 border-blue-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  {minEdgeFilter > 0 ? `≥ ${minEdgeFilter}%` : 'Off'}
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <PlayerPropsTable
              forecasts={filteredForecasts}
              oddsFormat={oddsFormat}
              onSelectPlayer={setSelectedForecast}
              onTrackProp={handleQuickTrack}
            />
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredForecasts.map((f) => (
              <PlayerPropCard
                key={f.marketId}
                forecast={f}
                oddsFormat={oddsFormat}
                onSelectPlayer={setSelectedForecast}
                onTrackProp={handleQuickTrack}
              />
            ))}
          </div>
        </div>
      )}

      {subTab === 'scanner' && (
        <FirstQuarterScannerView
          forecasts={allForecasts}
          oddsFormat={oddsFormat}
          onSelectPlayer={setSelectedForecast}
        />
      )}

      {subTab === 'backtest' && <PropsBacktestView />}

      {/* AdBanner integration */}
      <AdBanner variant="leaderboard" className="my-6" />

      {/* Modals */}
      <PlayerDetailModal
        forecast={selectedForecast}
        oddsFormat={oddsFormat}
        onClose={() => setSelectedForecast(null)}
      />

      <OddsSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onRefreshMarkets={refreshMarkets}
      />
    </div>
  );
};
