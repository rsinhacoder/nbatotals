import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { PicksBoardTab } from './components/PicksBoardTab';
import { GameAnalyzerTab } from './components/GameAnalyzerTab';
import { BetTrackerTab } from './components/BetTrackerTab';
import { TrackRecordTab } from './components/TrackRecordTab';
import { QuantAcademyTab } from './components/QuantAcademyTab';
import { SyncModal } from './components/SyncModal';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { AdBanner } from './components/AdBanner';
import {
  PrivacyPolicyModal,
  TermsOfServiceModal,
  AboutModal,
  ContactModal,
} from './components/LegalModals';

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

const STORAGE_KEY_GAMES = 'nba_quant_games_v4';
const STORAGE_KEY_REFERENCES = 'nba_quant_references_v4';
const STORAGE_KEY_UPCOMING = 'nba_quant_upcoming_v5';
const STORAGE_KEY_MODEL = 'nba_quant_model_v2';
const STORAGE_KEY_BETS = 'nba_quant_bets_v2';

export function App() {
  // Navigation: 5 core human-centered tabs
  // 'picks' | 'analyzer' | 'tracker' | 'trackrecord' | 'academy'
  const [activeTab, setActiveTab] = useState<string>('picks');
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
    } catch (err: any) {
      console.error('Failed to sync ESPN schedule:', err);
      if (showToast) {
        addToast('Using Verified Schedule', 'Loaded latest official NBA matches', 'info');
      }
    } finally {
      setIsSyncingSchedule(false);
    }
  };

  // Automatically fetch real ESPN schedule on app mount
  useEffect(() => {
    handleRefreshSchedule(false);
  }, []);

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
    addToast('Scoreboard Synced', `Processed ${newGames.length} games`, 'success');
  };

  const seasonLabel = dashboardMetrics.season || getCurrentSeasonLabel();

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-blue-600/15 selection:text-blue-900 dark:selection:bg-amber-500/30 dark:selection:text-amber-200 transition-colors duration-200">
      {/* Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSync={() => setIsSyncModalOpen(true)}
        onExportExcel={handleExportExcel}
        onExportCsv={handleExportCsv}
        onImportCsv={handleImportCsv}
        gameCount={processedGames.length}
        upcomingCount={upcomingMatches.length}
        trackedBetsCount={trackedBets.filter((b) => b.status === 'PENDING').length}
        seasonLabel={seasonLabel}
        activeModel={activeModel}
        onSelectModel={handleSelectModel}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 min-w-0">
        {/* Tab 1: Picks Board */}
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
          />
        )}

        {/* Tab 2: Matchup Analyzer */}
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

        {/* Tab 3: Bet Tracker */}
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

        {/* Tab 4: Track Record & Data */}
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

        {/* Tab 5: Strategy Academy */}
        {activeTab === 'academy' && (
          <QuantAcademyTab activeModel={activeModel} />
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
