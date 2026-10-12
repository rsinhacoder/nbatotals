import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Clock,
  Activity,
  Shield,
  Star,
} from 'lucide-react';
import type { PlayerPropsForecast, OddsFormat } from '../../types/playerProps';
import { getPlayerProfile } from '../../data/nbaPlayerBaselines';

interface PlayerPropsTableProps {
  forecasts: PlayerPropsForecast[];
  oddsFormat: OddsFormat;
  onSelectPlayer: (forecast: PlayerPropsForecast) => void;
  onTrackProp?: (forecast: PlayerPropsForecast) => void;
}

type SortField =
  | 'playerName'
  | 'pointsLine'
  | 'modelProjectedPoints'
  | 'pointsDifference'
  | 'modelProbOver'
  | 'probabilityEdgeOver'
  | 'recommendationEdge'
  | 'recommendationEv'
  | 'confidenceScore';

export const PlayerPropsTable: React.FC<PlayerPropsTableProps> = ({
  forecasts,
  oddsFormat,
  onSelectPlayer,
  onTrackProp,
}) => {
  const [sortField, setSortField] = useState<SortField>('recommendationEdge');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedForecasts = useMemo(() => {
    return [...forecasts].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'playerName') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      valA = Number(valA || 0);
      valB = Number(valB || 0);
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [forecasts, sortField, sortAsc]);

  const formatOdds = (american: string, decimal: number) => {
    return oddsFormat === 'AMERICAN' ? american : decimal.toFixed(3);
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 inline ml-1" />;
    }
    return sortAsc ? (
      <ChevronUp className="w-3 h-3 text-blue-500 inline ml-1" />
    ) : (
      <ChevronDown className="w-3 h-3 text-blue-500 inline ml-1" />
    );
  };

  if (forecasts.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 text-slate-400">
        No player props available matching current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-sm">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
          <tr>
            <th
              className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              onClick={() => handleSort('playerName')}
            >
              Player & Matchup {renderSortIndicator('playerName')}
            </th>
            <th
              className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white text-center"
              onClick={() => handleSort('pointsLine')}
            >
              Points Line {renderSortIndicator('pointsLine')}
            </th>
            <th className="py-3 px-3 text-center">Over / Under Odds</th>
            <th
              className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white text-center"
              onClick={() => handleSort('modelProjectedPoints')}
            >
              Model Proj {renderSortIndicator('modelProjectedPoints')}
            </th>
            <th
              className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white text-center"
              onClick={() => handleSort('pointsDifference')}
            >
              Points Δ {renderSortIndicator('pointsDifference')}
            </th>
            <th
              className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white text-center"
              onClick={() => handleSort('modelProbOver')}
            >
              Model Prob (O / U) {renderSortIndicator('modelProbOver')}
            </th>
            <th
              className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white text-center"
              onClick={() => handleSort('recommendationEdge')}
            >
              Prob Edge {renderSortIndicator('recommendationEdge')}
            </th>
            <th
              className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white text-center"
              onClick={() => handleSort('recommendationEv')}
            >
              EV % {renderSortIndicator('recommendationEv')}
            </th>
            <th className="py-3 px-3 text-center">1Q Pace</th>
            <th className="py-3 px-4 text-right">Recommendation & Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
          {sortedForecasts.map((f) => {
            const player = getPlayerProfile(f.playerId);
            const isOverEdge = f.recommendation === 'OVER EDGE';
            const isUnderEdge = f.recommendation === 'UNDER EDGE';

            return (
              <tr
                key={f.marketId}
                onClick={() => onSelectPlayer(f)}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
              >
                {/* Player & Matchup */}
                <td className="py-3 px-4 font-sans">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 font-black flex items-center justify-center text-xs shrink-0">
                      {f.team}
                    </div>
                    <div>
                      <div className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                        {f.playerName}
                        {player?.injuryStatus && player.injuryStatus !== 'ACTIVE' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500">
                            {player.injuryStatus}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        {f.team} vs {f.opponent} • {new Date(f.gameStartTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Points Line */}
                <td className="py-3 px-3 text-center">
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white text-sm">
                    {f.pointsLine}
                  </span>
                </td>

                {/* Over / Under Odds */}
                <td className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-[11px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      O: {formatOdds(f.overOdds, f.overDecimal)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      U: {formatOdds(f.underOdds, f.underDecimal)}
                    </span>
                  </div>
                </td>

                {/* Model Projection */}
                <td className="py-3 px-3 text-center font-black text-slate-900 dark:text-white text-sm">
                  {f.modelProjectedPoints} <span className="text-[10px] font-normal text-slate-400">pts</span>
                </td>

                {/* Points Difference */}
                <td className="py-3 px-3 text-center font-bold">
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs ${
                      f.pointsDifference > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : f.pointsDifference < 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {f.pointsDifference > 0 ? `+${f.pointsDifference}` : f.pointsDifference}
                  </span>
                </td>

                {/* Model Probabilities */}
                <td className="py-3 px-3 text-center text-[11px]">
                  <span className="text-slate-900 dark:text-white font-bold">
                    {(f.modelProbOver * 100).toFixed(1)}%
                  </span>
                  <span className="text-slate-400"> / </span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    {(f.modelProbUnder * 100).toFixed(1)}%
                  </span>
                </td>

                {/* Probability Edge */}
                <td className="py-3 px-3 text-center font-bold">
                  {f.recommendationEdge > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      +{f.recommendationEdge}%
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                {/* EV% */}
                <td className="py-3 px-3 text-center font-black">
                  {f.recommendationEv > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      +{f.recommendationEv}%
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                {/* 1Q Pace */}
                <td className="py-3 px-3 text-center text-[11px] text-slate-400">
                  <span className="font-bold text-slate-700 dark:text-slate-300">~{f.expectedQ1Points}</span> pts
                  <span className="block text-[10px]">({f.expectedQ1Minutes}m)</span>
                </td>

                {/* Recommendation Pill & Quick Action */}
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        isOverEdge
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                          : isUnderEdge
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                          : 'bg-slate-500/20 text-slate-500 dark:text-slate-400 border border-slate-500/30'
                      }`}
                    >
                      {isOverEdge && <TrendingUp className="w-3 h-3" />}
                      {isUnderEdge && <TrendingDown className="w-3 h-3" />}
                      {f.recommendation}
                    </span>

                    {onTrackProp && f.recommendation !== 'NO EDGE' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTrackProp(f);
                        }}
                        className="px-2 py-1 text-[10px] font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
                      >
                        Track
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
