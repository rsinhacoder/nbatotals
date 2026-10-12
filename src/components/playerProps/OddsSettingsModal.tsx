import React, { useState } from 'react';
import {
  X,
  Key,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Server,
  ExternalLink,
} from 'lucide-react';
import { sportsbookOddsService } from '../../services/sportsbookOddsService';
import type { SportsbookProviderStatus } from '../../types/playerProps';

interface OddsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshMarkets: () => void;
}

export const OddsSettingsModal: React.FC<OddsSettingsModalProps> = ({
  isOpen,
  onClose,
  onRefreshMarkets,
}) => {
  if (!isOpen) return null;

  const [apiKey, setApiKey] = useState(() => sportsbookOddsService.getApiKey() || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const status: SportsbookProviderStatus = sportsbookOddsService.getStatus();

  const handleSave = () => {
    sportsbookOddsService.saveApiKey(apiKey.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    onRefreshMarkets();
  };

  const handleClear = () => {
    setApiKey('');
    sportsbookOddsService.saveApiKey('');
    onRefreshMarkets();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-white p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black">Sportsbook Odds Provider Configuration</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live DraftKings / FanDuel Player Props Integration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Provider Telemetry Badge */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400">Connection Status:</span>
            <span
              className={`px-2 py-0.5 rounded-full font-black text-[11px] flex items-center gap-1 ${
                status.status === 'ONLINE'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : status.status === 'AWAITING_MARKETS'
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
              }`}
            >
              {status.status === 'ONLINE' && <CheckCircle2 className="w-3 h-3" />}
              {status.status}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Provider:</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">{status.providerName}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Last Sync Time:</span>
            <span className="font-mono text-slate-700 dark:text-slate-200">
              {status.lastSyncTime ? new Date(status.lastSyncTime).toLocaleTimeString() : 'Never'}
            </span>
          </div>

          {status.remainingDailyRequests !== undefined && (
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Quota Remaining:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {status.remainingDailyRequests} requests
              </span>
            </div>
          )}

          <div className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
            {status.statusMessage}
          </div>
        </div>

        {/* API Key Form */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            The Odds API Key (Optional)
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your The Odds API key..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
            You can also configure <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">VITE_ODDS_API_KEY</code> in your <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">.env</code> file. Keys remain securely on client/server and are never exposed publicly.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <a
            href="https://the-odds-api.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 font-semibold"
          >
            Get Free API Key <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-500"
            >
              Clear
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition flex items-center gap-1.5"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" /> Save & Sync
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
