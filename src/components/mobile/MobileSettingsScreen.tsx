import React from 'react';
import {
  SlidersHorizontal,
  DollarSign,
  ShieldCheck,
  Award,
  ExternalLink,
  Info,
  Smartphone,
  Lock,
  FileText,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import type { OddsFormat } from '../../types/playerProps';
import { type ModelConfig, MODEL_PRESETS } from '../../utils/modelConstants';
import type { TrackedBet } from '../../types/nba';

interface MobileSettingsScreenProps {
  oddsFormat: OddsFormat;
  onChangeOddsFormat: (format: OddsFormat) => void;
  activeModel: ModelConfig;
  onSelectModel: (config: ModelConfig) => void;
  trackedBets: TrackedBet[];
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenAbout: () => void;
  onOpenContact: () => void;
}

export const MobileSettingsScreen: React.FC<MobileSettingsScreenProps> = ({
  oddsFormat,
  onChangeOddsFormat,
  activeModel,
  onSelectModel,
  trackedBets,
  onOpenPrivacy,
  onOpenTerms,
  onOpenAbout,
  onOpenContact,
}) => {
  // Bet portfolio calculations
  const totalBets = trackedBets.length;
  const wonBets = trackedBets.filter((b) => b.status === 'WON').length;
  const lostBets = trackedBets.filter((b) => b.status === 'LOST').length;
  const pendingBets = trackedBets.filter((b) => b.status === 'PENDING').length;
  const winRate = wonBets + lostBets > 0 ? ((wonBets / (wonBets + lostBets)) * 100).toFixed(0) : '—';

  return (
    <div className="space-y-4 pb-20 pt-2 px-3.5 max-w-md mx-auto">
      {/* 1. App Identity Card */}
      <div className="theover-card p-4 space-y-2 border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-cyan-500/20">
            NT
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-base">NBA Totals</span>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PRO v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              AI Quantitative NBA Over/Under &amp; Player Props Engine
            </p>
          </div>
        </div>
      </div>

      {/* 2. Odds Format Selector */}
      <div className="theover-card p-3.5 space-y-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
          Odds Presentation Format
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onChangeOddsFormat('AMERICAN')}
            className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              oddsFormat === 'AMERICAN'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-sm shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            American (-110, +135)
          </button>
          <button
            onClick={() => onChangeOddsFormat('DECIMAL')}
            className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              oddsFormat === 'DECIMAL'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-sm shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Decimal (1.91, 2.35)
          </button>
        </div>
      </div>

      {/* 3. Regression Model Calibration */}
      <div className="theover-card p-3.5 space-y-2.5">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
          Active Quantitative Model
        </span>
        <div className="space-y-1.5">
          {Object.values(MODEL_PRESETS).map((m) => {
            const isSelected = activeModel.id === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelectModel(m)}
                className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="text-xs font-black block leading-tight">
                    {m.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    MAE: ±{m.historicalMae.toFixed(2)} pts • Sample: {m.sampleSize.toLocaleString()} Games
                  </span>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Portfolio Bet Tracker Overview */}
      <div className="theover-card p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Portfolio Track Record
          </span>
          <span className="text-[10px] font-mono text-cyan-400 font-bold">
            {winRate !== '—' ? `${winRate}% Win Rate` : 'Active'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
          <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
            <span className="text-[9px] text-slate-400 font-sans block uppercase">Total</span>
            <span className="text-sm font-black text-white">{totalBets}</span>
          </div>
          <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
            <span className="text-[9px] text-emerald-400 font-sans block uppercase">Won</span>
            <span className="text-sm font-black text-emerald-400">{wonBets}</span>
          </div>
          <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
            <span className="text-[9px] text-rose-400 font-sans block uppercase">Lost</span>
            <span className="text-sm font-black text-rose-400">{lostBets}</span>
          </div>
          <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
            <span className="text-[9px] text-amber-400 font-sans block uppercase">Pending</span>
            <span className="text-sm font-black text-amber-400">{pendingBets}</span>
          </div>
        </div>
      </div>

      {/* 5. Google Play & Android App Info */}
      <div className="theover-card p-3.5 space-y-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
          Android Package &amp; Build
        </span>
        <div className="bg-[#060a14] p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Application ID:</span>
            <span className="text-cyan-400 font-bold">com.nbatotals.app</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Version:</span>
            <span>1.0.0 (Build 1)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Target SDK:</span>
            <span>Android 15 (API 35)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Runtime:</span>
            <span>Capacitor Native Bridge</span>
          </div>
        </div>
      </div>

      {/* 6. Legal, Disclaimers & Google Play Compliance */}
      <div className="theover-card p-3.5 space-y-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
          Compliance &amp; Information
        </span>
        <div className="space-y-1 text-xs">
          <button
            onClick={onOpenAbout}
            className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-200 flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-cyan-400" /> About Model &amp; Methodology
            </span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </button>
          <button
            onClick={onOpenPrivacy}
            className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-855 text-slate-200 flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-cyan-400" /> Privacy Policy &amp; Cookie Consent
            </span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </button>
          <button
            onClick={onOpenTerms}
            className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-200 flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-cyan-400" /> Terms of Service &amp; Disclaimer
            </span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </button>
          <button
            onClick={onOpenContact}
            className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-200 flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-cyan-400" /> Support &amp; Contact
            </span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </button>
        </div>

        {/* Responsible Gaming Banner */}
        <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-[10px] text-amber-300 leading-relaxed mt-2">
          <strong>Responsible Gaming Disclaimer:</strong> NBA Totals is an independent quantitative sports analytics and predictive research engine intended solely for informational and entertainment purposes. We do not accept wagers. If you or someone you know has a gambling problem, call <strong>1-800-GAMBLER</strong>.
        </div>
      </div>
    </div>
  );
};
