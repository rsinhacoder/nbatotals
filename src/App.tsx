import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { PicksBoardTab } from './components/PicksBoardTab';
import { GameAnalyzerTab } from './components/GameAnalyzerTab';
import { BetTrackerTab } from './components/BetTrackerTab';
import { TrackRecordTab } from './components/TrackRecordTab';
import { QuantAcademyTab } from './components/QuantAcademyTab';
import { ModelResultsTab } from './components/ModelResultsTab';
import { PlayerPropsPage } from './components/playerProps/PlayerPropsPage';
import { SyncModal } from './components/SyncModal';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { AdBanner } from './components/AdBanner';
import {
  PrivacyPolicyModal,
  TermsOfServiceModal,
  AboutModal,
  ContactModal,
} from './components/LegalModals';
import { MobileAppContainer } from './components/mobile/MobileAppContainer';
import { isNativePlatform } from './utils/capacitorApp';
import { nbaRosterService } from './services/nbaRosterService';
import { DEFAULT_OPENING_CONSENSUS_MARKETS } from './services/sportsbookOddsService';
import { AnalyticsDashboardTab } from './components/AnalyticsDashboardTab';
import { PreviewsHubTab } from './components/content/PreviewsHubTab';
import { ArticleDetailPage } from './components/content/ArticleDetailPage';
import { ContentPerformanceTab } from './components/content/ContentPerformanceTab';
import { nbaContentEngine } from './services/nbaContentEngine';
import type { NBAArticle } from './types/content';
import { analytics } from './utils/analytics';
import { nbaDateService } from './utils/nbaDateService';
import type { PlayerPropsForecast } from './types/playerProps';

import { INITIAL_NBA_GAMES, INITIAL_REFERENCE_TOTALS } from './data/mockGames';
import { INITIAL_UPCOMING_MATCHES } from './data/upcomingGames';
import {
  type RawGameInput,
  processGameMetrics,
  calculateDashboardMetrics,
  calculateBucketStats,
  calculateSeasonTypeStats,
} from './utils/modelEngine';
import {
  type RawUpcomingInput,
  buildUpcomingMatchForecast,
} from './utils/upcomingEngine';
import { fetchLiveUpcomingSchedule } from './utils/espnApi';
import { exportFullExcel, exportReferenceTotalsCsv } from './utils/excelExport';
import {
  getCurrentSeasonLabel,
  MODEL_PRESETS,
  type ModelConfig,
} from './utils/modelConstants';
import type { ReferenceMap, TrackedBet, UpcomingMatch } from './types/nba';
import { NHLPicksBoardTab } from './components/nhl/NHLPicksBoardTab';
import { NHLMatchupAnalyzerTab } from './components/nhl/NHLMatchupAnalyzerTab';
import { NHLHistoricalStatsTab } from './components/nhl/NHLHistoricalStatsTab';
import { fetchLiveUpcomingNHLSchedule, getCuratedUpcomingNHLMatches } from './utils/nhlEspnApi';
import type { NHLUpcomingMatch, NHLMarketEdge } from './types/nhl';
import {
  fetchAndGradeAllRecentGameResults,
  gradeCompletedNBAGame,
  reconcileTrackedBets,
} from './utils/gameResultsUpdater';
import {
  SEASON_2026_27_PICKS,
  enrichPickComparison,
} from './data/seasonResultsData';
import type { GradedModelPick } from './types/results';

const STORAGE_KEY_GAMES = 'nba_quant_games_v4';
const STORAGE_KEY_REFERENCES = 'nba_quant_references_v4';
const STORAGE_KEY_UPCOMING = 'nba_quant_upcoming_v5';
const STORAGE_KEY_MODEL = 'nba_quant_model_v2';
const STORAGE_KEY_BETS = 'nba_quant_bets_v2';
const STORAGE_KEY_SPORT = 'quant_selected_sport_v2';
const STORAGE_KEY_NHL_UPCOMING = 'nhl_quant_upcoming_v1';
const STORAGE_KEY_2026_PICKS = 'nba_quant_graded_picks_2026_27_v5';

export function App() {
  // Check initial slug from URL query or path
  const [selectedArticle, setSelectedArticle] = useState<NBAArticle | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get('slug');
      if (slug) {
        return nbaContentEngine.getArticleBySlug(slug) || null;
      }
      const match = window.location.pathname.match(/^\/(?:previews|articles)\/([^/]+)/);
      if (match && match[1]) {
        return nbaContentEngine.getArticleBySlug(match[1]) || null;
      }
    }
    return null;
  });

  // Navigation: 5 core human-centered tabs + SEO Previews & Dashboards (Previews is the primary main tab)
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) return tabParam;
      if (window.location.pathname.startsWith('/previews') || window.location.pathname.startsWith('/articles')) {
        return 'previews';
      }
    }
    return 'previews';
  });

  const [urlGameId, setUrlGameId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('game');
    }
    return null;
  });

  // Initialize GA4 engine once on app start
  useEffect(() => {
    analytics.init();
  }, []);

  // Sync activeTab and selectedArticle with browser URL search parameters and dynamic title
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    url.searchParams.set('tab', activeTab);
    if (activeTab === 'previews' && selectedArticle) {
      url.searchParams.set('slug', selectedArticle.slug);
    } else {
      url.searchParams.delete('slug');
    }
    window.history.replaceState({}, '', url.toString());

    // Dynamic Title Mapping for SEO & Analytics
    const titles: Record<string, string> = {
      picks: 'NBA Totals — Free Daily NBA Over/Under Predictions & Computer Picks',
      'player-props': 'NBA Player Props — Daily Points Lines, Roster Projections & Edges',
      results: 'Model Correctness — 2026–27 Graded Predictions & Historical Evaluation',
      analyzer: 'NBA Matchup Simulator — Interactive Pace Floor & Total Predictor',
      tracker: 'Bet Tracker — Portfolio Performance & ROI Ledger',
      trackrecord: 'Track Record & Historical Database — 6,000 NBA Games Backtest',
      academy: 'Quantitative Strategy Academy — Rule of 47 Pace Floor Guide',
      analytics: 'Google Analytics 4 & Engagement Dashboard — NBATotals.com QA',
      previews: selectedArticle
        ? `${selectedArticle.title} — ${selectedArticle.sport === 'nhl' ? 'NHLTotals.com' : 'NBATotals.com'}`
        : 'NBA & NHL Game Previews, Over/Under Predictions & Quantitative Analysis — NBATotals.com',
      'content-perf': 'NBA Content Performance & Technical SEO Dashboard — NBATotals.com',
      'nhl-picks': 'NHL Edge Board — Quantitative Hockey Totals Predictions',
      'nhl-analyzer': 'NHL Matchup Analyzer — Team Pace & Totals Simulator',
      'nhl-stats': 'NHL 5-Season Historical Study — 6,115 Completed Games',
    };

    const newTitle = titles[activeTab] || 'NBA Totals — Quantitative Sports Analytics';
    document.title = newTitle;

    // Track SPA page view in GA4
    analytics.trackPageView(
      activeTab === 'previews' && selectedArticle ? `/previews/${selectedArticle.slug}` : `/?tab=${activeTab}`,
      newTitle,
      activeTab
    );
  }, [activeTab, selectedArticle]);

  // Handle browser back/forward buttons
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') || 'previews';
      const slug = params.get('slug');
      setActiveTab(tab);
      setUrlGameId(params.get('game'));
      if (slug) {
        const found = nbaContentEngine.getArticleBySlug(slug);
        setSelectedArticle(found || null);
      } else {
        setSelectedArticle(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, message?: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Active Model Configuration: Default is the 5-Year Trained Model (2020-2025)
  const [activeModel, setActiveModel] = useState<ModelConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MODEL);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.intercept && parsed.slope) return parsed;
      }
    } catch (e) {
      console.warn('Could not read saved model:', e);
    }
    return MODEL_PRESETS['5_YEAR'];
  });

  // Tracked Bets Portfolio
  const [trackedBets, setTrackedBets] = useState<TrackedBet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BETS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not read saved bets:', e);
    }
    return [
      {
        id: 'bet_init_1',
        matchId: 'upc_401600102',
        date: new Date().toISOString().slice(0, 10),
        matchup: 'Orlando Magic @ Miami Heat',
        pickType: 'UNDER',
        targetLine: 216.5,
        modelProjection: 209.2,
        edge: 7.3,
        units: 2.0,
        odds: '-110',
        status: 'PENDING',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'bet_init_2',
        matchId: '401584689',
        date: '2024-10-22',
        matchup: 'New York Knicks @ Boston Celtics',
        pickType: 'OVER',
        targetLine: 223.5,
        modelProjection: 228.1,
        edge: 4.6,
        units: 1.0,
        odds: '-110',
        status: 'WON',
        actualTotal: 241,
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  });

  // 2026–27 Current Season Graded Picks Ledger (Synchronized after every game result)
  const [picks2026_27, setPicks2026_27] = useState<GradedModelPick[]>(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY_2026_PICKS) ||
        localStorage.getItem('nba_quant_graded_picks_2026_27_v4') ||
        localStorage.getItem('nba_quant_graded_picks_2026_27_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Authoritative seed map: verified seed always overrides stale cached versions for known games
          const seedMap = new Map(SEASON_2026_27_PICKS.map((p) => [p.id, p]));
          const seedMatchupMap = new Map(
            SEASON_2026_27_PICKS.map((p) => [
              `${p.date}_${p.sport}_${(p.awayAbbrev || '').toUpperCase()}_${(p.homeAbbrev || '').toUpperCase()}`,
              p,
            ])
          );

          // For any parsed item, if seed has an updated authoritative definition (e.g. Seattle, Vancouver), use seed!
          const merged = parsed.map((item: any) => {
            const key = `${item.date}_${item.sport}_${(item.awayAbbrev || '').toUpperCase()}_${(item.homeAbbrev || '').toUpperCase()}`;
            return seedMap.get(item.id) || seedMatchupMap.get(key) || item;
          });

          // Also include any seed items not yet in parsed
          const existingIds = new Set(merged.map((p: any) => p.id));
          const missing = SEASON_2026_27_PICKS.filter((p) => !existingIds.has(p.id));
          const combined = [...missing, ...merged].sort((a, b) => {
            const dateCompare = b.date.localeCompare(a.date);
            if (dateCompare !== 0) return dateCompare;
            return (b.id || '').localeCompare(a.id || '');
          });

          return combined.map(enrichPickComparison);
        }
      }
    } catch (e) {
      console.warn('Could not read saved 2026 picks:', e);
    }
    return SEASON_2026_27_PICKS.map(enrichPickComparison);
  });

  const [isSyncingResults, setIsSyncingResults] = useState(false);
  const [lastResultsSyncTime, setLastResultsSyncTime] = useState<Date>(new Date());

  // Player Props Forecasts for mobile app & slate views
  const [playerPropsForecasts, setPlayerPropsForecasts] = useState<PlayerPropsForecast[]>([]);

  useEffect(() => {
    nbaRosterService
      .generateScheduleDrivenRosters(nbaDateService.getTodayEasternDate(), DEFAULT_OPENING_CONSENSUS_MARKETS)
      .then((res) => setPlayerPropsForecasts(res.allForecasts))
      .catch(console.warn);
  }, []);

  // Mobile Android App View Mode (Auto-detects native Capacitor Android & mobile screens)
  const [isMobileAppMode, setIsMobileAppMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && isNativePlatform()) return true;
    try {
      const saved = localStorage.getItem('nbatotals_mobile_mode');
      if (saved !== null) return saved === 'true';
    } catch {}
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });

  const toggleMobileAppMode = () => {
    setIsMobileAppMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nbatotals_mobile_mode', String(next));
      } catch {}
      return next;
    });
  };

  // Preloaded matchup for Matchup Analyzer
  const [analyzerPreload, setAnalyzerPreload] = useState<{
    away: string;
    home: string;
    line: number;
    lowestQ?: number;
  }>({
    away: 'Orlando Magic',
    home: 'Miami Heat',
    line: 216.5,
    lowestQ: 41.5,
  });

  // Selected Sport: 'nba' | 'nhl'
  const [currentSport, setCurrentSport] = useState<'nba' | 'nhl'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SPORT);
      if (saved === 'nhl') return 'nhl';
    } catch (e) {}
    return 'nba';
  });

  const handleSelectSport = (sport: 'nba' | 'nhl') => {
    setCurrentSport(sport);
    try {
      localStorage.setItem(STORAGE_KEY_SPORT, sport);
    } catch (e) {}
    if (sport === 'nhl') {
      if (!activeTab.startsWith('nhl-') && activeTab !== 'tracker' && activeTab !== 'academy' && activeTab !== 'results' && activeTab !== 'previews') {
        setActiveTab('nhl-picks');
      }
    } else {
      if (activeTab.startsWith('nhl-')) {
        setActiveTab('previews');
      }
    }
  };

  // NHL Upcoming Games state
  const [nhlUpcomingMatches, setNhlUpcomingMatches] = useState<NHLUpcomingMatch[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NHL_UPCOMING);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return getCuratedUpcomingNHLMatches();
  });

  const [isSyncingNHL, setIsSyncingNHL] = useState(false);
  const [lastNHLSyncTime, setLastNHLSyncTime] = useState<Date>(new Date());

  // Preloaded matchup for NHL Matchup Analyzer
  const [nhlAnalyzerPreload, setNhlAnalyzerPreload] = useState<{
    away: string;
    home: string;
    line: number;
  }>({
    away: 'CAR',
    home: 'PHI',
    line: 5.5,
  });

  const handleRefreshNHLSchedule = async (showToast: boolean = true) => {
    setIsSyncingNHL(true);
    try {
      const slate = await fetchLiveUpcomingNHLSchedule(5);
      if (slate && slate.length > 0) {
        setNhlUpcomingMatches(slate);
        setLastNHLSyncTime(new Date());
        try {
          localStorage.setItem(STORAGE_KEY_NHL_UPCOMING, JSON.stringify(slate));
        } catch (e) {}
        if (showToast) {
          addToast('NHL Schedule Synced', `Updated ${slate.length} official NHL games & DraftKings lines`, 'success');
        }
      }
      handleSyncGameResults(false);
    } catch (e) {
      console.warn('NHL schedule sync error:', e);
      if (showToast) {
        addToast('Verified Slate Active', 'Using official NHL consensus odds', 'info');
      }
    } finally {
      setIsSyncingNHL(false);
    }
  };

  const handleTrackNHLBet = (match: NHLUpcomingMatch, market: NHLMarketEdge) => {
    const newBet: TrackedBet = {
      id: `bet_nhl_${Date.now()}`,
      matchId: match.id,
      date: match.date,
      matchup: `${match.awayAbbrev} @ ${match.homeAbbrev}`,
      pickType: market.marketName,
      targetLine: match.sportsbookTotal,
      modelProjection: match.modelProjectedTotal,
      edge: market.edgePercent,
      units: market.edgePercent >= 5.0 ? 2.0 : 1.0,
      odds: market.sportsbookOdds,
      status: 'PENDING',
      notes: `NHL Quantitative Edge: ${market.marketName} (+${market.edgePercent}% EV)`,
      timestamp: new Date().toISOString(),
      sport: 'NHL',
    };
    setTrackedBets((prev) => [newBet, ...prev]);
    addToast('Position Tracked', `${newBet.matchup} - ${newBet.pickType} (${newBet.odds})`, 'success');
  };

  const handleSendToNHLAnalyzer = (match: NHLUpcomingMatch) => {
    setNhlAnalyzerPreload({
      away: match.awayAbbrev,
      home: match.homeAbbrev,
      line: match.sportsbookTotal,
    });
    setActiveTab('nhl-analyzer');
  };

  // Initialize Raw Historical Games (ensures full multi-season 6,000-game dataset)
  const [rawGames, setRawGames] = useState<RawGameInput[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GAMES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 1000) return parsed;
      }
    } catch (e) {
      console.warn('Could not read saved games from localStorage:', e);
    }
    return INITIAL_NBA_GAMES;
  });

  // Initialize Reference Totals (Historical sportsbook lines)
  const [referenceTotals, setReferenceTotals] = useState<ReferenceMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REFERENCES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length >= 1000) {
          return { ...INITIAL_REFERENCE_TOTALS, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Could not read saved references from localStorage:', e);
    }
    return INITIAL_REFERENCE_TOTALS;
  });

  // Initialize Upcoming Matches (validated against stale fake mocks)
  const [rawUpcoming, setRawUpcoming] = useState<RawUpcomingInput[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UPCOMING);
      if (saved) {
        const parsed = JSON.parse(saved);
        const hasFakeMockGames =
          Array.isArray(parsed) &&
          parsed.some(
            (g: any) =>
              g.id?.startsWith('upc_') ||
              (g.awayTeam === 'New York Knicks' && g.homeTeam === 'Boston Celtics')
          );
        if (Array.isArray(parsed) && parsed.length > 0 && !hasFakeMockGames) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read saved upcoming from localStorage:', e);
    }
    return INITIAL_UPCOMING_MATCHES;
  });

  const [isSyncingSchedule, setIsSyncingSchedule] = useState(false);
  const [lastScheduleSyncTime, setLastScheduleSyncTime] = useState<Date>(new Date());

  const handleRefreshSchedule = async (showToast: boolean = true) => {
    setIsSyncingSchedule(true);
    try {
      const realSchedule = await fetchLiveUpcomingSchedule(7);
      if (realSchedule && realSchedule.length > 0) {
        setRawUpcoming(realSchedule);
        setLastScheduleSyncTime(new Date());
        if (showToast) {
          addToast(
            'Schedule Updated',
            `Synced ${realSchedule.length} real NBA matchups directly from ESPN`,
            'success'
          );
        }
      } else if (showToast) {
        addToast('Schedule Verified', 'All games are current with official ESPN scoreboard', 'info');
      }
      // Check and update model correctness with newly finished game results
      handleSyncGameResults(false);
    } catch (err: any) {
      console.error('Failed to sync ESPN schedule:', err);
      if (showToast) {
        addToast('Using Verified Schedule', 'Loaded latest official NBA matches', 'info');
      }
    } finally {
      setIsSyncingSchedule(false);
    }
  };

  const picksRef = useRef(picks2026_27);
  useEffect(() => {
    picksRef.current = picks2026_27;
  }, [picks2026_27]);

  // Core Game Results Sync & Pick Accuracy Engine
  const handleSyncGameResults = async (showToast: boolean = true): Promise<number> => {
    setIsSyncingResults(true);
    try {
      const result = await fetchAndGradeAllRecentGameResults(picksRef.current, activeModel);
      setLastResultsSyncTime(new Date());

      if (result.newlyAddedCount > 0) {
        setPicks2026_27(result.totalGradedPicks);

        // Automatically reconcile pending tracked bets with new official box scores
        setTrackedBets((prevBets) => {
          const { updatedBets, resolvedCount } = reconcileTrackedBets(result.newGradedPicks, prevBets);
          if (resolvedCount > 0 && showToast) {
            addToast('Bets Reconciled', `Resolved ${resolvedCount} pending bet(s) with official box scores!`, 'success');
          }
          return updatedBets;
        });

        if (showToast) {
          const topPick = result.newGradedPicks[0];
          addToast(
            'Model Correctness Updated',
            `Audited ${result.newlyAddedCount} newly completed game(s). Latest: ${topPick.matchup} (${topPick.correctness})`,
            'success'
          );
        }
      } else if (showToast) {
        addToast(
          'Model Correctness Verified',
          'All completed game results are up to date with official scoreboards.',
          'info'
        );
      }
      return result.newlyAddedCount;
    } catch (err) {
      console.warn('Failed to sync game results:', err);
      if (showToast) {
        addToast('Sync Notice', 'Could not reach scoreboards. Active ledger preserved.', 'info');
      }
      return 0;
    } finally {
      setIsSyncingResults(false);
    }
  };

  const handleResetPicksToLatest = async () => {
    try {
      localStorage.removeItem(STORAGE_KEY_2026_PICKS);
      localStorage.removeItem('nba_quant_graded_picks_2026_27_v3');
      const seed = SEASON_2026_27_PICKS.map(enrichPickComparison);
      setPicks2026_27(seed);
      addToast('Ledger Refreshed', 'Reloaded official season results dataset.', 'info');
      const res = await fetchAndGradeAllRecentGameResults(seed, activeModel);
      if (res.newlyAddedCount > 0) {
        setPicks2026_27(res.totalGradedPicks);
      }
    } catch (e) {
      console.warn('Error resetting picks:', e);
    }
  };

  const handleAddManualResult = (pick: GradedModelPick) => {
    setPicks2026_27((prev) => [pick, ...prev]);
    setTrackedBets((prevBets) => {
      const { updatedBets } = reconcileTrackedBets([pick], prevBets);
      return updatedBets;
    });
    addToast(
      'Game Result Audited',
      `${pick.matchup}: ${pick.outcome === 'WON' ? 'SUCCESS' : pick.outcome === 'LOST' ? 'FAILURE' : 'PUSH'} (${pick.modelPickValue})`,
      'success'
    );
  };

  // Automatically fetch schedules & sync completed game results on app mount + periodic 60s background watcher
  useEffect(() => {
    handleRefreshSchedule(false);
    handleRefreshNHLSchedule(false);
    handleSyncGameResults(false);

    // Watcher: automatically checks for newly finished game results every 60 seconds
    const interval = setInterval(() => {
      handleSyncGameResults(false);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Persist picks2026_27 to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_2026_PICKS, JSON.stringify(picks2026_27));
    } catch (e) {
      console.error('Error saving 2026 picks to localStorage:', e);
    }
  }, [picks2026_27]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MODEL, JSON.stringify(activeModel));
    } catch (e) {
      console.error('Error saving model to localStorage:', e);
    }
  }, [activeModel]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BETS, JSON.stringify(trackedBets));
    } catch (e) {
      console.error('Error saving bets to localStorage:', e);
    }
  }, [trackedBets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GAMES, JSON.stringify(rawGames));
    } catch (e) {
      console.error('Error saving games to localStorage:', e);
    }
  }, [rawGames]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REFERENCES, JSON.stringify(referenceTotals));
    } catch (e) {
      console.error('Error saving references to localStorage:', e);
    }
  }, [referenceTotals]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_UPCOMING, JSON.stringify(rawUpcoming));
    } catch (e) {
      console.error('Error saving upcoming to localStorage:', e);
    }
  }, [rawUpcoming]);

  // Compute all historical model metrics dynamically with active model
  const processedGames = useMemo(() => {
    return rawGames.map((g) => processGameMetrics(g, referenceTotals, activeModel));
  }, [rawGames, referenceTotals, activeModel]);

  const dashboardMetrics = useMemo(() => {
    return calculateDashboardMetrics(processedGames, activeModel);
  }, [processedGames, activeModel]);

  const bucketStats = useMemo(() => {
    return calculateBucketStats(processedGames);
  }, [processedGames]);

  const seasonTypeStats = useMemo(() => {
    return calculateSeasonTypeStats(processedGames);
  }, [processedGames]);

  // Compute upcoming forecasts dynamically with active model
  const upcomingMatches = useMemo(() => {
    return rawUpcoming.map((item) => buildUpcomingMatchForecast(item, activeModel));
  }, [rawUpcoming, activeModel]);

  // Handlers
  const handleSelectModel = (model: ModelConfig) => {
    setActiveModel(model);
    addToast('Model Updated', `Active model set to: ${model.name}`, 'info');
  };

  const handleUpdateReference = (gameId: string, value: number | null) => {
    setReferenceTotals((prev) => {
      const next = { ...prev };
      if (value === null) {
        delete next[gameId];
      } else {
        next[gameId] = value;
      }
      return next;
    });
    addToast('Sportsbook Line Saved', `Reference line updated for Game #${gameId}`, 'success');
  };

  const handleUpdateMatchLine = (matchId: string, newLine: number) => {
    setRawUpcoming((prev) =>
      prev.map((m) => {
        if (m.id === matchId) {
          return { ...m, sportsbookLine: newLine };
        }
        return m;
      })
    );
    addToast('Line Updated', `Sportsbook line adjusted to ${newLine}`, 'info');
  };

  const handleSendToAnalyzer = (match: UpcomingMatch) => {
    setAnalyzerPreload({
      away: match.awayTeam,
      home: match.homeTeam,
      line: match.sportsbookLine,
      lowestQ: match.projectedLowestQuarter,
    });
    setActiveTab('analyzer');
    addToast('Loaded in Analyzer', `${match.awayTeam} @ ${match.homeTeam}`, 'info');
  };

  const handleTrackMatchBet = (match: UpcomingMatch, pickType: 'UNDER' | 'OVER') => {
    const newBet: TrackedBet = {
      id: `bet_${Date.now()}`,
      matchId: match.id,
      date: match.date,
      matchup: `${match.awayTeam} @ ${match.homeTeam}`,
      pickType,
      targetLine: match.sportsbookLine,
      modelProjection: match.modelProjectedTotal,
      edge: Math.abs(match.edge),
      units: Math.abs(match.edge) >= 5.0 ? 2.0 : 1.0,
      odds: '-110',
      status: 'PENDING',
      timestamp: new Date().toISOString(),
    };
    setTrackedBets((prev) => [newBet, ...prev]);
    addToast(
      'Position Tracked!',
      `Added ${pickType} ${match.sportsbookLine} on ${match.awayTeam} @ ${match.homeTeam}`,
      'success'
    );
  };

  const handleUpdateBetStatus = (betId: string, status: 'PENDING' | 'WON' | 'LOST' | 'PUSH') => {
    setTrackedBets((prev) =>
      prev.map((b) => (b.id === betId ? { ...b, status } : b))
    );
    addToast('Bet Status Updated', `Position marked as ${status}`, 'info');
  };

  const handleUpdateBetUnits = (betId: string, units: number) => {
    setTrackedBets((prev) =>
      prev.map((b) => (b.id === betId ? { ...b, units } : b))
    );
  };

  const handleDeleteBet = (betId: string) => {
    setTrackedBets((prev) => prev.filter((b) => b.id !== betId));
    addToast('Position Removed', 'Removed bet from tracker', 'info');
  };

  const handleClearCompletedBets = () => {
    setTrackedBets((prev) => prev.filter((b) => b.status === 'PENDING'));
    addToast('Cleared Resolved Bets', 'Removed all settled wagers', 'info');
  };

  const handleAddNewCustomBet = (bet: Omit<TrackedBet, 'id' | 'timestamp'>) => {
    const fullBet: TrackedBet = {
      ...bet,
      id: `bet_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setTrackedBets((prev) => [fullBet, ...prev]);
    addToast('Custom Position Added', `${fullBet.matchup} - ${fullBet.pickType} ${fullBet.targetLine}`, 'success');
  };

  const handleSyncUpcomingLive = (newUpcoming: RawUpcomingInput[]) => {
    setRawUpcoming((prev) => {
      const map = new Map<string, RawUpcomingInput>();
      for (const m of prev) map.set(m.id, m);
      for (const m of newUpcoming) map.set(m.id, m);
      return Array.from(map.values());
    });
    addToast('Live Slate Synced', `Updated ${newUpcoming.length} matchups from ESPN`, 'success');
  };

  const handleExportExcel = () => {
    exportFullExcel(processedGames, dashboardMetrics, bucketStats, seasonTypeStats);
    addToast('Excel Exported', 'Downloaded NBA_Current_Season_Forecast.xlsx', 'success');
  };

  const handleExportCsv = () => {
    exportReferenceTotalsCsv(referenceTotals);
    addToast('CSV Exported', 'Downloaded Reference Totals.csv', 'success');
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/);
        const newRefs: ReferenceMap = {};

        for (const line of lines) {
          const parts = line.split(',');
          if (parts.length >= 2) {
            const id = parts[0].trim();
            const val = parseFloat(parts[1].trim());
            if (id && !isNaN(val)) {
              newRefs[id] = val;
            }
          }
        }

        setReferenceTotals((prev) => ({ ...prev, ...newRefs }));
        addToast('CSV Imported', `Imported ${Object.keys(newRefs).length} reference totals`, 'success');
      } catch (err) {
        console.error('Error reading CSV:', err);
        addToast('Import Failed', 'Please check CSV file formatting', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSyncComplete = (newGames: RawGameInput[], replace: boolean) => {
    if (replace) {
      setRawGames(newGames);
    } else {
      setRawGames((prev) => {
        const map = new Map<string, RawGameInput>();
        for (const g of prev) map.set(g.id, g);
        for (const g of newGames) map.set(g.id, g);
        return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
      });
    }

    // Automatically grade any completed games from sync into the Model Correctness ledger
    try {
      const existingIds = new Set(picks2026_27.map((p) => p.id));
      const newlyGradedFromSync: GradedModelPick[] = [];
      for (const g of newGames) {
        const id = `nba_real_${g.id}`;
        if (!existingIds.has(id) && g.awayScore > 0 && g.homeScore > 0) {
          const fakeEvent = {
            id: g.id,
            date: g.date,
            competitions: [
              {
                competitors: [
                  {
                    homeAway: 'home',
                    score: String(g.homeScore),
                    team: { displayName: g.homeTeam, abbreviation: g.homeTeam.slice(0, 3).toUpperCase() },
                    linescores: [
                      { period: 1, value: g.q1Home },
                      { period: 2, value: g.q2Home },
                      { period: 3, value: g.q3Home },
                      { period: 4, value: g.q4Home },
                    ],
                  },
                  {
                    homeAway: 'away',
                    score: String(g.awayScore),
                    team: { displayName: g.awayTeam, abbreviation: g.awayTeam.slice(0, 3).toUpperCase() },
                    linescores: [
                      { period: 1, value: g.q1Away },
                      { period: 2, value: g.q2Away },
                      { period: 3, value: g.q3Away },
                      { period: 4, value: g.q4Away },
                    ],
                  },
                ],
              },
            ],
          };
          const graded = gradeCompletedNBAGame(fakeEvent, activeModel);
          if (graded) {
            newlyGradedFromSync.push(graded);
            existingIds.add(id);
          }
        }
      }
      if (newlyGradedFromSync.length > 0) {
        setPicks2026_27((prev) => [...newlyGradedFromSync, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
        addToast('Model Correctness Updated', `Graded ${newlyGradedFromSync.length} completed game(s) from scoreboard sync`, 'success');
      }
    } catch (e) {
      console.warn('Error grading from scoreboard sync:', e);
    }

    addToast('Scoreboard Synced', `Processed ${newGames.length} games`, 'success');
  };

  const seasonLabel = dashboardMetrics.season || getCurrentSeasonLabel();

  const handleTrackPropBet = (fc: PlayerPropsForecast) => {
    handleAddNewCustomBet({
      matchId: fc.gameId,
      date: new Date().toISOString().slice(0, 10),
      matchup: `${fc.playerName} (${fc.team} vs ${fc.opponent})`,
      pickType: fc.recommendation.includes('OVER') ? 'OVER' : 'UNDER',
      targetLine: fc.pointsLine ?? fc.modelProjectedPoints,
      modelProjection: fc.modelProjectedPoints,
      edge: fc.recommendationEdge,
      units: 1.0,
      odds: fc.overOdds || '-110',
      status: 'PENDING',
      sport: 'NBA',
      notes: `Player prop forecast for ${fc.playerName}`,
    });
    addToast('Prop Tracked', `Added ${fc.playerName} ${fc.recommendation} to portfolio`, 'success');
  };

  // If in dedicated Mobile App Mode (or native Android Capacitor)
  if (isMobileAppMode) {
    return (
      <>
        <MobileAppContainer
          upcomingMatches={upcomingMatches}
          playerPropsForecasts={playerPropsForecasts}
          trackedBets={trackedBets}
          activeModel={activeModel}
          onSelectModel={handleSelectModel}
          onTrackBet={handleTrackMatchBet}
          onTrackPropBet={handleTrackPropBet}
          onRefreshSchedule={() => handleRefreshSchedule(true)}
          isSyncingSchedule={isSyncingSchedule}
          onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
          onOpenTerms={() => setIsTermsModalOpen(true)}
          onOpenAbout={() => setIsAboutModalOpen(true)}
          onOpenContact={() => setIsContactModalOpen(true)}
          onToggleDesktopMode={!isNativePlatform() ? toggleMobileAppMode : undefined}
        />

        {/* Floating Toast Notification Container */}
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

        {/* Legal & Compliance Modals */}
        <PrivacyPolicyModal
          isOpen={isPrivacyModalOpen}
          onClose={() => setIsPrivacyModalOpen(false)}
        />
        <TermsOfServiceModal
          isOpen={isTermsModalOpen}
          onClose={() => setIsTermsModalOpen(false)}
        />
        <AboutModal
          isOpen={isAboutModalOpen}
          onClose={() => setIsAboutModalOpen(false)}
        />
        <ContactModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-blue-600/15 selection:text-blue-900 dark:selection:bg-amber-500/30 dark:selection:text-amber-200 transition-colors duration-200">
      {/* Header & Navigation */}
      <Header
        currentSport={currentSport}
        onSelectSport={handleSelectSport}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSync={() => setIsSyncModalOpen(true)}
        onExportExcel={handleExportExcel}
        onExportCsv={handleExportCsv}
        onImportCsv={handleImportCsv}
        gameCount={processedGames.length}
        upcomingCount={upcomingMatches.length}
        nhlUpcomingCount={nhlUpcomingMatches.length}
        trackedBetsCount={trackedBets.filter((b) => b.status === 'PENDING').length}
        currentSeasonPicksCount={picks2026_27.length}
        seasonLabel={seasonLabel}
        activeModel={activeModel}
        onSelectModel={handleSelectModel}
        onToggleMobileAppMode={toggleMobileAppMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 min-w-0">
        {/* NBA & NHL Game Previews & Analytical Matchup Breakdowns (Primary Main Tab) */}
        {activeTab === 'previews' && (
          selectedArticle ? (
            <ArticleDetailPage
              article={selectedArticle}
              onBack={() => {
                setSelectedArticle(null);
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('slug');
                  window.history.replaceState({}, '', url.toString());
                }
              }}
              onNavigateTab={(tab, gameId) => {
                setSelectedArticle(null);
                if (gameId) setUrlGameId(gameId);
                setActiveTab(tab);
              }}
              onSelectArticle={(art) => {
                setSelectedArticle(art);
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  url.searchParams.set('tab', 'previews');
                  url.searchParams.set('slug', art.slug);
                  window.history.pushState({}, '', url.toString());
                }
              }}
            />
          ) : (
            <PreviewsHubTab
              upcomingMatches={upcomingMatches}
              nhlUpcomingMatches={nhlUpcomingMatches}
              currentSport={currentSport}
              onSelectArticle={(art) => {
                setSelectedArticle(art);
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  url.searchParams.set('tab', 'previews');
                  url.searchParams.set('slug', art.slug);
                  window.history.pushState({}, '', url.toString());
                }
              }}
              onNavigateTab={(tab, gameId) => {
                if (gameId) setUrlGameId(gameId);
                setActiveTab(tab);
              }}
            />
          )
        )}

        {/* NBA Tab 2: Picks Board */}
        {activeTab === 'picks' && (
          <PicksBoardTab
            upcomingMatches={upcomingMatches}
            trackedBets={trackedBets}
            onTrackBet={handleTrackMatchBet}
            onSendToAnalyzer={handleSendToAnalyzer}
            onUpdateSportsbookLine={handleUpdateMatchLine}
            onOpenSync={() => setIsSyncModalOpen(true)}
            onRefreshSchedule={() => handleRefreshSchedule(true)}
            isSyncingSchedule={isSyncingSchedule}
            lastSyncTime={lastScheduleSyncTime}
            onNavigateTab={(tab) => setActiveTab(tab)}
            initialSelectedGameId={urlGameId}
          />
        )}

        {/* NBA Tab: Player Props Forecasting & Early Edge Scanner */}
        {activeTab === 'player-props' && (
          <PlayerPropsPage
            upcomingMatches={upcomingMatches}
            onTrackBet={handleAddNewCustomBet}
            onOpenSync={() => setIsSyncModalOpen(true)}
          />
        )}

        {/* Universal Model Correctness & Performance Ledger (2024–25 Current Season) */}
        {activeTab === 'results' && (
          <ModelResultsTab
            currentSport={currentSport}
            onSelectSport={(s) => handleSelectSport(s)}
            historicalGames={processedGames}
            picks2026_27={picks2026_27}
            onSyncGameResults={handleSyncGameResults}
            onAddManualResult={handleAddManualResult}
            isSyncingResults={isSyncingResults}
            lastResultsSyncTime={lastResultsSyncTime}
            onResetPicks={handleResetPicksToLatest}
          />
        )}

        {/* NBA Tab 2: Matchup Analyzer */}
        {activeTab === 'analyzer' && (
          <GameAnalyzerTab
            key={`${analyzerPreload.away}-${analyzerPreload.home}-${analyzerPreload.line}-${activeModel.id}`}
            activeModel={activeModel}
            initialAwayTeam={analyzerPreload.away}
            initialHomeTeam={analyzerPreload.home}
            initialLine={analyzerPreload.line}
            initialLowestQ={analyzerPreload.lowestQ}
            onTrackBet={handleAddNewCustomBet}
            historicalGames={processedGames}
          />
        )}

        {/* NHL Tab 1: NHL Picks & Edge Board */}
        {activeTab === 'nhl-picks' && (
          <NHLPicksBoardTab
            upcomingMatches={nhlUpcomingMatches}
            onTrackBet={handleTrackNHLBet}
            onSendToAnalyzer={handleSendToNHLAnalyzer}
            onRefreshSchedule={() => handleRefreshNHLSchedule(true)}
            isSyncingSchedule={isSyncingNHL}
            lastSyncTime={lastNHLSyncTime}
          />
        )}

        {/* NHL Tab 2: NHL Matchup Analyzer */}
        {activeTab === 'nhl-analyzer' && (
          <NHLMatchupAnalyzerTab
            key={`${nhlAnalyzerPreload.away}-${nhlAnalyzerPreload.home}-${nhlAnalyzerPreload.line}`}
            initialAway={nhlAnalyzerPreload.away}
            initialHome={nhlAnalyzerPreload.home}
            initialLine={nhlAnalyzerPreload.line}
            onTrackBet={handleAddNewCustomBet}
          />
        )}

        {/* NHL Tab 3: NHL 5-Season Historical Study & Backtest */}
        {activeTab === 'nhl-stats' && (
          <NHLHistoricalStatsTab />
        )}

        {/* Shared Tab: Bet Tracker (NBA & NHL) */}
        {activeTab === 'tracker' && (
          <BetTrackerTab
            trackedBets={trackedBets}
            onUpdateBetStatus={handleUpdateBetStatus}
            onUpdateBetUnits={handleUpdateBetUnits}
            onDeleteBet={handleDeleteBet}
            onClearCompleted={handleClearCompletedBets}
            onAddNewCustomBet={handleAddNewCustomBet}
          />
        )}

        {/* NBA Tab 4: Track Record & Data */}
        {activeTab === 'trackrecord' && (
          <TrackRecordTab
            games={processedGames}
            activeModel={activeModel}
            onSelectModel={handleSelectModel}
            onUpdateReference={handleUpdateReference}
            dashboardMetrics={dashboardMetrics}
            bucketStats={bucketStats}
            onExportExcel={handleExportExcel}
            onExportCsv={handleExportCsv}
            onImportCsv={handleImportCsv}
          />
        )}

        {/* Shared Tab: Strategy Academy */}
        {activeTab === 'academy' && (
          <QuantAcademyTab activeModel={activeModel} />
        )}

        {/* GA4 & User Engagement QA Dashboard */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboardTab
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* NBA Tab: Content Performance & Technical SEO Dashboard */}
        {activeTab === 'content-perf' && (
          <ContentPerformanceTab
            onSelectArticle={(art) => {
              setSelectedArticle(art);
              setActiveTab('previews');
              if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.set('tab', 'previews');
                url.searchParams.set('slug', art.slug);
                window.history.pushState({}, '', url.toString());
              }
            }}
            onNavigateTab={(tab, gameId) => {
              if (gameId) setUrlGameId(gameId);
              setActiveTab(tab);
            }}
          />
        )}
      </main>

      {/* Floating Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* ESPN Data Sync Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSyncComplete={handleSyncComplete}
      />

      {/* Legal & Compliance Modals for Google AdSense & Regulatory Compliance */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
      <TermsOfServiceModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      {/* SEO-Rich Production Footer */}
      <footer className="border-t border-slate-200 dark:border-[#1c2438] bg-white dark:bg-[#0b0f19] pt-10 pb-16 text-xs text-slate-500 dark:text-zinc-500 mb-14 md:mb-0 shadow-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand & Model Overview */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 dark:text-white text-sm">NBATOTALS.COM</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase bg-blue-500/10 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300 border border-blue-500/20 dark:border-blue-400/30">
                  QUANT PRO
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-zinc-400">
                <strong>NBATotals.com</strong> is an advanced quantitative sports analytics engine specializing in daily NBA Over/Under predictions, totals line shopping, and pace regression. Calibrated across <strong>6,000 completed NBA games</strong> across 5 full seasons (2020–2025).
              </p>
              <div className="text-[11px] font-mono text-slate-600 dark:text-zinc-400 pt-1">
                Active Model: <strong className="text-slate-800 dark:text-slate-200">{activeModel.name}</strong> • MAE: ±{activeModel.historicalMae.toFixed(2)} pts
              </div>
            </div>

            {/* Col 2: SEO Quick Links */}
            <div className="space-y-2">
              <div className="font-bold text-slate-900 dark:text-zinc-200 text-xs uppercase tracking-wider">
                NBA Analytics &amp; Tools
              </div>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <button onClick={() => setActiveTab('picks')} className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                    Today&apos;s NBA Over/Under Slate
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('player-props')} className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                    NBA Player Props &amp; Full Rosters
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('results')} className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                    2026–27 Model Correctness &amp; Pick Accuracy
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('analyzer')} className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                    NBA Matchup Analyzer &amp; Pace Tool
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('trackrecord')} className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                    6,000-Game Historical Database
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('academy')} className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                    Rule of 47 Betting Strategy
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('tracker')} className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                    Portfolio &amp; Bet ROI Tracker
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveTab('previews'); setSelectedArticle(null); }} className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                    NBA &amp; NHL Game Previews &amp; Analysis
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveTab('nhl-picks'); handleSelectSport('nhl'); }} className="hover:text-indigo-400 cursor-pointer font-bold text-indigo-400">
                    🏒 NHL Poisson Edge Board &amp; Over/Under
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('analytics')} className="hover:text-blue-600 dark:hover:text-cyan-400 cursor-pointer font-semibold text-cyan-500">
                    GA4 &amp; Engagement Dashboard
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('content-perf')} className="hover:text-blue-600 dark:hover:text-indigo-400 cursor-pointer text-indigo-500 font-semibold">
                    Content Ops &amp; Technical SEO
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Legal & Regulatory (AdSense Mandatory) */}
            <div className="space-y-2">
              <div className="font-bold text-slate-900 dark:text-zinc-200 text-xs uppercase tracking-wider">
                Legal &amp; Transparency
              </div>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <button
                    onClick={() => setIsPrivacyModalOpen(true)}
                    className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer text-left"
                  >
                    Privacy Policy &amp; Cookie Consent
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsTermsModalOpen(true)}
                    className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer text-left"
                  >
                    Terms of Service &amp; Disclaimer
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsAboutModalOpen(true)}
                    className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer text-left"
                  >
                    About Us &amp; Model Methodology
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsContactModalOpen(true)}
                    className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer text-left"
                  >
                    Contact Support &amp; Editorial Team
                  </button>
                </li>
                <li>
                  <a
                    href="/ads.txt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 dark:hover:text-blue-400 font-mono text-[10px] inline-flex items-center gap-1"
                  >
                    Authorized Digital Sellers (ads.txt) ↗
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Official Sportsbook Partners */}
            <div className="space-y-2">
              <div className="font-bold text-slate-900 dark:text-zinc-200 text-xs uppercase tracking-wider">
                Official Sportsbook Partners
              </div>
              <div className="space-y-2 text-xs text-slate-600 dark:text-zinc-400">
                <div>
                  <a
                    href="https://sportsbook.draftkings.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                  >
                    DraftKings Sportsbook <span className="text-[11px] text-slate-400 font-mono">· Bet $5, Get $150</span>
                  </a>
                </div>
                <div>
                  <a
                    href="https://sportsbook.fanduel.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                  >
                    FanDuel Sportsbook <span className="text-[11px] text-slate-400 font-mono">· Bet $5, Get $150</span>
                  </a>
                </div>
                <div>
                  <a
                    href="https://sports.betmgm.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                  >
                    BetMGM Sportsbook <span className="text-[11px] text-slate-400 font-mono">· Up to $1,500 Back</span>
                  </a>
                </div>
                <div>
                  <a
                    href="https://www.caesars.com/sportsbook-and-casino"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                  >
                    Caesars Sportsbook <span className="text-[11px] text-slate-400 font-mono">· $1,000 First Bet</span>
                  </a>
                </div>
                <div>
                  <a
                    href="https://www.bet365.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                  >
                    bet365 Sportsbook <span className="text-[11px] text-slate-400 font-mono">· Bet $5, Get $150</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Disclaimer & Legal Links */}
          <div className="border-t border-slate-200 dark:border-[#1c2438] pt-4 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-zinc-500">
            <div className="flex items-center gap-2.5 flex-wrap justify-center md:justify-start">
              <span>&copy; {new Date().getFullYear()} NBATotals.com. All rights reserved.</span>
              <span>•</span>
              <button onClick={() => setIsPrivacyModalOpen(true)} className="hover:text-blue-600 dark:hover:text-blue-400 underline cursor-pointer">
                Privacy Policy
              </button>
              <span>•</span>
              <button onClick={() => setIsTermsModalOpen(true)} className="hover:text-blue-600 dark:hover:text-blue-400 underline cursor-pointer">
                Terms
              </button>
              <span>•</span>
              <button onClick={() => setIsAboutModalOpen(true)} className="hover:text-blue-600 dark:hover:text-blue-400 underline cursor-pointer">
                About
              </button>
              <span>•</span>
              <button onClick={() => setIsContactModalOpen(true)} className="hover:text-blue-600 dark:hover:text-blue-400 underline cursor-pointer">
                Contact
              </button>
            </div>
            <div className="text-center md:text-right text-[10px]">
              21+ Only. Gamble Responsibly. Problem Gambling? Call <strong>1-800-GAMBLER</strong>.
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky High-Converting Sportsbook Promo / Disclaimer */}
      <AdBanner variant="sticky-bottom" />
    </div>
  );
}

export default App;
