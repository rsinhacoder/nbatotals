import rawSeason2026_27Data from './season2026_27ResultsData.json';
import rawSeason2024_25Data from './seasonResultsData.json';
import type { GradedModelPick, SeasonPerformanceMetrics } from '../types/results';

/**
 * Enriches any graded pick with explicit modelPickValue, currentValue,
 * valueDifferential, and audited correctness status.
 */
export function enrichPickComparison(pick: GradedModelPick): GradedModelPick {
  const actualTotal = pick.actualTotal ?? (pick.awayScore + pick.homeScore);
  const isHockey = pick.sport === 'NHL' || pick.sport === 'KHL';
  const unit = isHockey ? 'Goals' : 'Pts';

  let modelPickValue = pick.modelPickValue || pick.marketName;
  let currentValue = pick.currentValue || `${actualTotal} Total ${unit} (${pick.awayScore}-${pick.homeScore})`;
  let valueDifferential = pick.valueDifferential || '';

  if (!pick.valueDifferential) {
    if (pick.marketCategory === 'TOTAL') {
      const line = parseFloat(pick.sportsbookLine || '0');
      const isUnder = pick.marketName.toUpperCase().includes('UNDER');
      modelPickValue = isUnder ? `UNDER ${line} ${unit}` : `OVER ${line} ${unit}`;
      currentValue = `${actualTotal} Total ${unit} (${pick.awayScore}-${pick.homeScore})`;

      if (actualTotal === line) {
        valueDifferential = `Push exactly on line (${line} ${unit})`;
      } else if (isUnder) {
        const diff = line - actualTotal;
        valueDifferential = diff > 0 ? `+${diff.toFixed(1)} ${unit} buffer (Under covered)` : `-${Math.abs(diff).toFixed(1)} ${unit} over`;
      } else {
        const diff = actualTotal - line;
        valueDifferential = diff > 0 ? `+${diff.toFixed(1)} ${unit} clearance (Over covered)` : `-${Math.abs(diff).toFixed(1)} ${unit} short`;
      }
    } else if (pick.marketCategory === 'SPREAD') {
      const line = parseFloat(pick.sportsbookLine || '0');
      modelPickValue = pick.marketName;
      const isAway = pick.marketName.includes(pick.awayAbbrev) || pick.marketName.includes(pick.awayTeam);
      const margin = isAway ? (pick.awayScore - pick.homeScore) : (pick.homeScore - pick.awayScore);
      currentValue = `Final Margin: ${margin > 0 ? '+' : ''}${margin} ${unit} (${pick.awayScore}-${pick.homeScore})`;
      const cover = margin + line;
      valueDifferential = cover > 0 ? `Covered by +${cover.toFixed(1)} ${unit}` : cover === 0 ? `Push on Spread` : `Missed by ${Math.abs(cover).toFixed(1)} ${unit}`;
    } else if (pick.marketCategory === 'SOG') {
      const line = parseFloat(pick.sportsbookLine || '60');
      const totShots = pick.actualShots?.total ?? actualTotal;
      const isOver = pick.marketName.toUpperCase().includes('OVER');
      modelPickValue = isOver ? `OVER ${line} SOG` : `UNDER ${line} SOG`;
      currentValue = `${totShots} Total SOG (${pick.actualShots?.away ?? 0}-${pick.actualShots?.home ?? 0})`;
      const diff = totShots - line;
      valueDifferential = isOver ? (diff > 0 ? `+${diff.toFixed(1)} shots clearance` : `-${Math.abs(diff).toFixed(1)} shots short`) : (diff < 0 ? `+${Math.abs(diff).toFixed(1)} shots buffer` : `-${diff.toFixed(1)} shots over`);
    } else if (pick.marketCategory === '1ST_PERIOD') {
      const line = parseFloat(pick.sportsbookLine || '1.5');
      const tot1P = pick.actual1PScore?.total ?? 1;
      const isUnder = pick.marketName.toUpperCase().includes('UNDER');
      modelPickValue = isUnder ? `UNDER ${line} 1P Goals` : `OVER ${line} 1P Goals`;
      currentValue = `${tot1P} 1P Goals (${pick.actual1PScore?.away ?? 0}-${pick.actual1PScore?.home ?? 0})`;
      const diff = line - tot1P;
      valueDifferential = isUnder ? (diff > 0 ? `+${diff.toFixed(1)} goal buffer` : `-${Math.abs(diff).toFixed(1)} over`) : (diff < 0 ? `+${Math.abs(diff).toFixed(1)} clearance` : `-${diff.toFixed(1)} short`);
    } else {
      modelPickValue = pick.marketName;
      currentValue = `${pick.awayScore} - ${pick.homeScore}`;
      valueDifferential = pick.outcome === 'WON' ? 'Moneyline Victory' : 'Moneyline Defeat';
    }
  }

  const actualScoreText = `${pick.awayScore} - ${pick.homeScore} (Total: ${actualTotal} ${unit})`;

  return {
    ...pick,
    season: pick.season || '2024-25',
    modelPickValue,
    actualScoreText,
    currentValue: currentValue || actualScoreText,
    valueDifferential,
    correctness: pick.outcome === 'WON' ? 'SUCCESS' : pick.outcome === 'LOST' ? 'FAILURE' : 'PUSH',
  };
}

/**
 * 2026–27 CURRENT Regular Season Graded Picks Ledger.
 * Features early October 2026 matchups across NBA and NHL with audited results.
 */
export const SEASON_2026_27_PICKS: GradedModelPick[] = (rawSeason2026_27Data as GradedModelPick[]).map(enrichPickComparison);

/**
 * 2024–25 Historical Backtest Graded Picks Ledger.
 * Features 2,067 full-season regular season games.
 */
export const SEASON_2024_25_PICKS: GradedModelPick[] = (rawSeason2024_25Data as GradedModelPick[]).map((p) =>
  enrichPickComparison({ ...p, season: '2024-25' })
);

/**
 * All Graded Picks across all seasons.
 */
export const ALL_GRADED_PICKS: GradedModelPick[] = [...SEASON_2026_27_PICKS, ...SEASON_2024_25_PICKS];

/**
 * Default Current Season Picks is 2026–27 (Current Season).
 */
export const CURRENT_SEASON_PICKS: GradedModelPick[] = SEASON_2026_27_PICKS;

/**
 * Calculates real-time season performance metrics for a given subset of picks.
 */
export function calculateSeasonMetrics(picks: GradedModelPick[]): SeasonPerformanceMetrics {
  const totalPicks = picks.length;
  if (totalPicks === 0) {
    return {
      totalPicks: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
      winRate: 0,
      totalProfitUnits: 0,
      roi: 0,
      avgOdds: '-110',
      highEdgePicks: 0,
      highEdgeWinRate: 0,
      highEdgeProfitUnits: 0,
    };
  }

  const wins = picks.filter((p) => p.outcome === 'WON').length;
  const losses = picks.filter((p) => p.outcome === 'LOST').length;
  const pushes = picks.filter((p) => p.outcome === 'PUSH').length;

  const totalDecided = wins + losses;
  const winRate = totalDecided > 0 ? Number(((wins / totalDecided) * 100).toFixed(1)) : 0;

  const totalProfitUnits = Number(
    picks.reduce((acc, p) => acc + p.profitUnits, 0).toFixed(2)
  );

  const totalStaked = picks.reduce((acc, p) => acc + p.unitsStaked, 0);
  const roi = totalStaked > 0 ? Number(((totalProfitUnits / totalStaked) * 100).toFixed(2)) : 0;

  // High Edge Tier (confidence === 'HIGH')
  const highEdge = picks.filter((p) => p.confidence === 'HIGH');
  const highWins = highEdge.filter((p) => p.outcome === 'WON').length;
  const highDecided = highWins + highEdge.filter((p) => p.outcome === 'LOST').length;
  const highEdgeWinRate = highDecided > 0 ? Number(((highWins / highDecided) * 100).toFixed(1)) : 0;
  const highEdgeProfitUnits = Number(
    highEdge.reduce((acc, p) => acc + p.profitUnits, 0).toFixed(2)
  );

  return {
    totalPicks,
    wins,
    losses,
    pushes,
    winRate,
    totalProfitUnits,
    roi,
    avgOdds: '-110',
    highEdgePicks: highEdge.length,
    highEdgeWinRate,
    highEdgeProfitUnits,
  };
}

/**
 * Generates cumulative profit trendline points for charting equity growth.
 */
export function getCumulativeEquityPoints(picks: GradedModelPick[]) {
  // Sort chronologically (oldest to newest)
  const sorted = [...picks].sort((a, b) => a.date.localeCompare(b.date));
  let cumulative = 0;

  return sorted.map((p, idx) => {
    cumulative += p.profitUnits;
    return {
      index: idx + 1,
      date: p.date,
      matchup: p.matchup,
      pickName: p.marketName,
      profitUnits: p.profitUnits,
      cumulativeProfit: Number(cumulative.toFixed(2)),
      outcome: p.outcome,
      sport: p.sport,
    };
  });
}
