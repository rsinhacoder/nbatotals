import React, { useState, useEffect } from 'react';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav, type MobileTab } from './MobileBottomNav';
import { MobileHomeScreen } from './MobileHomeScreen';
import { MobileGamesScreen } from './MobileGamesScreen';
import { MobilePlayerPropsScreen } from './MobilePlayerPropsScreen';
import { MobileQ1ScannerScreen } from './MobileQ1ScannerScreen';
import { MobileSettingsScreen } from './MobileSettingsScreen';
import { MatchDetailPage } from '../MatchDetailPage';
import { PlayerDetailModal } from '../playerProps/PlayerDetailModal';
import { OddsSettingsModal } from '../playerProps/OddsSettingsModal';
import type { UpcomingMatch, TrackedBet } from '../../types/nba';
import type { PlayerPropsForecast, OddsFormat } from '../../types/playerProps';
import type { ModelConfig } from '../../utils/modelConstants';
import { initializeNativeAndroid } from '../../utils/capacitorApp';
import { analytics } from '../../utils/analytics';
import { nbaDateService } from '../../utils/nbaDateService';

interface MobileAppContainerProps {
  upcomingMatches: UpcomingMatch[];
  playerPropsForecasts: PlayerPropsForecast[];
  trackedBets: TrackedBet[];
  activeModel: ModelConfig;
  onSelectModel: (config: ModelConfig) => void;
  onTrackBet: (match: UpcomingMatch, type: 'UNDER' | 'OVER') => void;
  onTrackPropBet?: (forecast: PlayerPropsForecast) => void;
  onRefreshSchedule: () => void;
  isSyncingSchedule: boolean;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenAbout: () => void;
  onOpenContact: () => void;
  onToggleDesktopMode?: () => void;
}

export const MobileAppContainer: React.FC<MobileAppContainerProps> = ({
  upcomingMatches,
  playerPropsForecasts,
  trackedBets,
  activeModel,
  onSelectModel,
  onTrackBet,
  onTrackPropBet,
  onRefreshSchedule,
  isSyncingSchedule,
  onOpenPrivacy,
  onOpenTerms,
  onOpenAbout,
  onOpenContact,
  onToggleDesktopMode,
}) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [selectedDate, setSelectedDate] = useState<string>(() => nbaDateService.getTodayEasternDate());
  const [oddsFormat, setOddsFormat] = useState<OddsFormat>('AMERICAN');

  // Modals
  const [selectedGameDetail, setSelectedGameDetail] = useState<UpcomingMatch | null>(null);
  const [selectedPlayerDetail, setSelectedPlayerDetail] = useState<PlayerPropsForecast | null>(null);
  const [isOddsSettingsOpen, setIsOddsSettingsOpen] = useState(false);

  // Available dates for schedule selector synced with real-time NBA schedule
  const availableDates = React.useMemo(() => {
    const existingDates = upcomingMatches.map((m) => m.date);
    return nbaDateService.getAvailableScheduleDates({ existingDates });
  }, [upcomingMatches]);

  // Track mobile screen view in GA4
  useEffect(() => {
    analytics.trackPageView(`/mobile/${activeTab}`, `NBA Totals App: ${activeTab.toUpperCase()}`, 'mobile_app');
  }, [activeTab]);

  // Android hardware back button handler
  useEffect(() => {
    initializeNativeAndroid(() => {
      // If modal is open, close modal
      if (selectedGameDetail) {
        setSelectedGameDetail(null);
        return true;
      }
      if (selectedPlayerDetail) {
        setSelectedPlayerDetail(null);
        return true;
      }
      if (isOddsSettingsOpen) {
        setIsOddsSettingsOpen(false);
        return true;
      }
      // If on sub-tab, go back to home
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true;
      }
      // Return false to allow default app exit
      return false;
    });
  }, [selectedGameDetail, selectedPlayerDetail, isOddsSettingsOpen, activeTab]);

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header */}
      <MobileHeader
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        availableDates={availableDates}
        isRefreshing={isSyncingSchedule}
        onRefresh={onRefreshSchedule}
        onOpenSettings={() => setActiveTab('profile')}
        onToggleDesktopMode={onToggleDesktopMode}
        gameCount={upcomingMatches.length}
      />

      {/* Main Screen Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'home' && (
          <MobileHomeScreen
            upcomingMatches={upcomingMatches}
            playerPropsForecasts={playerPropsForecasts}
            onNavigateTab={setActiveTab}
            onSelectGameDetail={setSelectedGameDetail}
            onSelectPlayerDetail={setSelectedPlayerDetail}
            onTrackBet={onTrackBet}
          />
        )}

        {activeTab === 'games' && (
          <MobileGamesScreen
            upcomingMatches={upcomingMatches}
            selectedDate={selectedDate}
            onSelectGameDetail={setSelectedGameDetail}
            onTrackBet={onTrackBet}
          />
        )}

        {activeTab === 'props' && (
          <MobilePlayerPropsScreen
            forecasts={playerPropsForecasts}
            oddsFormat={oddsFormat}
            onSelectPlayerDetail={setSelectedPlayerDetail}
            onTrackBet={onTrackPropBet}
          />
        )}

        {activeTab === 'scanner' && (
          <MobileQ1ScannerScreen
            forecasts={playerPropsForecasts}
            oddsFormat={oddsFormat}
            onSelectPlayerDetail={setSelectedPlayerDetail}
          />
        )}

        {activeTab === 'profile' && (
          <MobileSettingsScreen
            oddsFormat={oddsFormat}
            onChangeOddsFormat={setOddsFormat}
            activeModel={activeModel}
            onSelectModel={onSelectModel}
            trackedBets={trackedBets}
            onOpenPrivacy={onOpenPrivacy}
            onOpenTerms={onOpenTerms}
            onOpenAbout={onOpenAbout}
            onOpenContact={onOpenContact}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        gamesBadgeCount={upcomingMatches.length}
        propsBadgeCount={playerPropsForecasts.length}
        isQ1Active={true}
      />

      {/* Game Detail Modal */}
      {selectedGameDetail && (
        <div className="fixed inset-0 z-50 bg-[#070b14] overflow-y-auto animate-fadeIn">
          <div className="sticky top-0 z-10 bg-[#070b14]/90 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
              Matchup Deep Dive
            </span>
            <button
              onClick={() => setSelectedGameDetail(null)}
              className="text-xs font-bold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
            >
              Close ✕
            </button>
          </div>
          <div className="p-3">
            <MatchDetailPage
              match={selectedGameDetail}
              onBack={() => setSelectedGameDetail(null)}
              onTrackBet={onTrackBet}
              onSendToAnalyzer={() => {}}
              isTracked={trackedBets.some((b) => b.matchId === selectedGameDetail.id)}
              onUpdateSportsbookLine={() => {}}
            />
          </div>
        </div>
      )}

      {/* Player Detail Modal */}
      {selectedPlayerDetail && (
        <PlayerDetailModal
          forecast={selectedPlayerDetail}
          oddsFormat={oddsFormat}
          onClose={() => setSelectedPlayerDetail(null)}
        />
      )}

      {/* Odds Settings Modal */}
      <OddsSettingsModal
        isOpen={isOddsSettingsOpen}
        onClose={() => setIsOddsSettingsOpen(false)}
        onRefreshMarkets={onRefreshSchedule}
      />
    </div>
  );
};
