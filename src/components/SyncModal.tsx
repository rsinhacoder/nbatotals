import React, { useState } from 'react';
import { X, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { syncDateRange } from '../utils/espnApi';
import type { RawGameInput } from '../utils/modelEngine';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: (newGames: RawGameInput[], replace: boolean) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, onSyncComplete }) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  
  // Default to past 14 days for quick, responsive syncing
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const defaultStartStr = twoWeeksAgo.toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState<string>(defaultStartStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [syncMode, setSyncMode] = useState<'merge' | 'replace'>('merge');

  const [isLoading, setIsLoading] = useState(false);
  const [progressText, setProgressText] = useState<string>('');
  const [progressPct, setProgressPct] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleApplyPreset = (daysBack: number) => {
    const start = new Date();
    start.setDate(start.getDate() - daysBack);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(todayStr);
  };

  const handleStartSync = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setProgressText('Connecting to ESPN scoreboard API...');
    setProgressPct(5);

    try {
      const fetchedGames = await syncDateRange(
        startDate,
        endDate,
        (currentDay, count, totalDays) => {
          const pct = Math.round((count / totalDays) * 90);
          setProgressPct(pct);
          setProgressText(`Fetching ${currentDay} (${count} of ${totalDays} days)...`);
        }
      );

      setProgressPct(100);
      setProgressText(`Successfully fetched ${fetchedGames.length} completed games!`);

      setTimeout(() => {
        setIsLoading(false);
        onSyncComplete(fetchedGames, syncMode === 'replace');
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Sync failed:', err);
      setIsLoading(false);
      setErrorMessage(
        err.message || 'Failed to fetch ESPN data. Make sure network access is available.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl relative text-slate-900 dark:text-zinc-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 m-0">Sync ESPN Scoreboard</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 m-0">
              Fetch official live &amp; completed NBA games directly
            </p>
          </div>
        </div>

        {/* Date Inputs */}
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-zinc-300 font-semibold block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isLoading}
                className="w-full bg-slate-50 dark:bg-[#0c101b] border border-slate-200 dark:border-zinc-700/80 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 focus:outline-none focus:bg-white dark:focus:bg-[#0c101b] focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-700 dark:text-zinc-300 font-semibold block mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isLoading}
                className="w-full bg-slate-50 dark:bg-[#0c101b] border border-slate-200 dark:border-zinc-700/80 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 focus:outline-none focus:bg-white dark:focus:bg-[#0c101b] focus:border-blue-500"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-slate-500 dark:text-zinc-400 block mb-1.5 font-medium">Quick Date Presets:</span>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPreset(3)}
                disabled={isLoading}
                className="py-1 px-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-[11px] transition-colors cursor-pointer text-center border border-slate-200 dark:border-zinc-700"
              >
                Last 3 Days
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(7)}
                disabled={isLoading}
                className="py-1 px-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-[11px] transition-colors cursor-pointer text-center border border-slate-200 dark:border-zinc-700"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(14)}
                disabled={isLoading}
                className="py-1 px-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-[11px] transition-colors cursor-pointer text-center border border-slate-200 dark:border-zinc-700"
              >
                Last 14 Days
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(30)}
                disabled={isLoading}
                className="py-1 px-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-[11px] transition-colors cursor-pointer text-center border border-slate-200 dark:border-zinc-700"
              >
                Last 30 Days
              </button>
            </div>
          </div>

          {/* Merge vs Replace Mode */}
          <div className="pt-2 border-t border-slate-200 dark:border-zinc-800">
            <span className="text-slate-500 dark:text-zinc-400 block mb-1.5 font-medium">Dataset Mode:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSyncMode('merge')}
                disabled={isLoading}
                className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  syncMode === 'merge'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                    : 'bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                Merge with Existing
              </button>
              <button
                type="button"
                onClick={() => setSyncMode('replace')}
                disabled={isLoading}
                className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  syncMode === 'replace'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                    : 'bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                Replace Dataset
              </button>
            </div>
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Progress Bar */}
          {isLoading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-slate-600 dark:text-zinc-400 font-mono text-[11px]">
                <span>{progressText}</span>
                <span>{progressPct}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-zinc-700">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-zinc-800 flex justify-end gap-2 text-xs">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-medium transition-colors cursor-pointer border border-slate-200 dark:border-zinc-700"
          >
            Cancel
          </button>
          <button
            onClick={handleStartSync}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Start Sync</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default SyncModal;
