import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  Flame,
  ChevronRight,
} from 'lucide-react';
import type { PlayerPropsForecast, OddsFormat } from '../../types/playerProps';
import { getPlayerProfile } from '../../data/nbaPlayerBaselines';

interface PlayerPropCardProps {
  forecast: PlayerPropsForecast;
  oddsFormat: OddsFormat;
  onSelectPlayer: (forecast: PlayerPropsForecast) => void;
  onTrackProp?: (forecast: PlayerPropsForecast) => void;
}

export const PlayerPropCard: React.FC<PlayerPropCardProps> = ({
  forecast,
  oddsFormat,
  onSelectPlayer,
  onTrackProp,
}) => {
  const player = getPlayerProfile(forecast.playerId);
  const isOverEdge = forecast.recommendation === 'OVER EDGE';
  const isUnderEdge = forecast.recommendation === 'UNDER EDGE';

  const formatOdds = (american: string, decimal: number) => {
    return oddsFormat === 'AMERICAN' ? american : decimal.toFixed(3);
  };

  return (
    <div
      onClick={() => onSelectPlayer(forecast)}
      className="p-4 rounded-xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/40 transition cursor-pointer space-y-3"
    >
      {/* Header: Player & Matchup */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 font-black flex items-center justify-center text-xs shrink-0">
            {forecast.team}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-black text-slate-900 dark:text-white text-sm">{forecast.playerName}</h4>
              {player?.injuryStatus && player.injuryStatus !== 'ACTIVE' && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500">
                  {player.injuryStatus}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {forecast.team} vs {forecast.opponent} • {new Date(forecast.gameStartTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Signal Badge */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 ${
            isOverEdge
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
              : isUnderEdge
              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
              : 'bg-slate-500/20 text-slate-500 dark:text-slate-400 border border-slate-500/30'
          }`}
        >
          {isOverEdge && <TrendingUp className="w-3 h-3" />}
          {isUnderEdge && <TrendingDown className="w-3 h-3" />}
          {forecast.recommendation}
        </span>
      </div>

      {/* Line vs Model Proj Comparison Box */}
      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-[#121b2d] border border-slate-200/60 dark:border-slate-800/60 text-center">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Line</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
            {forecast.pointsLine}
          </span>
          <span className="text-[10px] text-slate-400 block">pts</span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Model Proj</span>
          <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
            {forecast.modelProjectedPoints}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">
            {forecast.pointsDifference > 0 ? `+${forecast.pointsDifference}` : forecast.pointsDifference} Δ
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Edge (EV%)</span>
          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
            {forecast.recommendationEdge > 0 ? `+${forecast.recommendationEdge}%` : '—'}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">
            {forecast.recommendationEv > 0 ? `+${forecast.recommendationEv}%` : '—'}
          </span>
        </div>
      </div>

      {/* Footer: Odds & 1Q Info */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <div>
          <span>Odds: </span>
          <span className="text-slate-600 dark:text-slate-300 font-mono">
            O {formatOdds(forecast.overOdds, forecast.overDecimal)} / U {formatOdds(forecast.underOdds, forecast.underDecimal)}
          </span>
        </div>

        <div className="flex items-center gap-1 text-blue-500 font-bold">
          <span>Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
