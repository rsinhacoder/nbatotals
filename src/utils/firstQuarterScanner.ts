import type {
  EarlyEdgeScannerReport,
  FirstQuarterPlayerStats,
  GamePeriodStatus,
  NBAPlayerProfile,
  PlayerPropsForecast,
} from '../types/playerProps';
import { evaluateMarketLineProbabilities, normalCdf } from './playerPropsEngine';

/**
 * Updates a player's projection post-Q1 by separating temporary shooting variance
 * from genuine usage and rotation signals.
 */
export function calculatePostQ1Update(
  preGameForecast: PlayerPropsForecast,
  player: NBAPlayerProfile,
  actualQ1Stats: {
    points: number;
    minutes: number;
    fgm: number;
    fga: number;
    threePm: number;
    threePa: number;
    ftm: number;
    fta: number;
    fouls: number;
  }
): FirstQuarterPlayerStats {
  const actualQ1Points = actualQ1Stats.points;
  const actualQ1Minutes = actualQ1Stats.minutes > 0 ? actualQ1Stats.minutes : player.q1Minutes;
  const actualFga = actualQ1Stats.fga;
  const actualFgm = actualQ1Stats.fgm;
  const actual3pa = actualQ1Stats.threePa;
  const actual3pm = actualQ1Stats.threePm;
  const actualFta = actualQ1Stats.fta;
  const actualFtm = actualQ1Stats.ftm;
  const fouls = actualQ1Stats.fouls;

  const preGameQ1Points = player.q1Ppg;
  const preGameQ1Minutes = player.q1Minutes;

  const pointsDiffQ1 = Number((actualQ1Points - preGameQ1Points).toFixed(1));
  const minDiffQ1 = Number((actualQ1Minutes - preGameQ1Minutes).toFixed(1));

  // Shooting efficiency (FG%)
  const actualShotEfficiency = actualFga > 0 ? Number(((actualFgm / actualFga) * 100).toFixed(1)) : 50.0;

  // Detect variance types:
  // Hot-hand variance: Very high FG% on low/normal attempts
  const isHotHandVariance = actualShotEfficiency >= 75.0 && actualFga <= 5;
  // Volume expansion: Significantly higher FGA than expected rate
  const expectedQ1Fga = (player.fgaPer36 / 36) * actualQ1Minutes;
  const isVolumeExpansion = actualFga >= expectedQ1Fga * 1.35 && actualFga >= 6;

  // Expected remaining playing time calculation:
  // Base remaining minutes = Total expected minutes - Actual Q1 minutes
  let expectedRemainingMinutes = Math.max(0, player.expectedMinutes - actualQ1Minutes);

  // Foul trouble adjustment: 2 fouls in Q1 typically forces coach to bench player in Q2
  if (fouls >= 2) {
    expectedRemainingMinutes = Math.max(10, expectedRemainingMinutes - 5.0);
  }

  // Regressed scoring rate per minute (PPM) for remaining 3 quarters:
  const baselinePpm = player.seasonPpg / player.seasonMinutes;
  
  // Estimate expected points generated from shot volume rather than pure actual makes:
  // (Expected FG% * FGA * 2.1)
  const expectedPointsFromVolume = actualFga * (player.trueShootingPct / 100) * 1.05 + actualFta * 0.78;
  const volumePpm = actualQ1Minutes > 0 ? expectedPointsFromVolume / actualQ1Minutes : baselinePpm;

  // Bayesian shrinkage: 70% baseline career PPM + 30% observed volume/pace
  let remainingPpm = baselinePpm * 0.70 + volumePpm * 0.30;

  // If foul trouble, slightly reduce aggression
  if (fouls >= 2) {
    remainingPpm *= 0.94;
  }

  const expectedRemainingPoints = expectedRemainingMinutes * remainingPpm;
  const updatedFinalPoints = Number((actualQ1Points + expectedRemainingPoints).toFixed(1));

  // Recalculate predictive probability distribution
  // Since 1 quarter is already locked in (deterministic), variance only applies to remaining minutes
  const remainingStdDev = Math.max(1.5, preGameForecast.modelStdDev * Math.sqrt(expectedRemainingMinutes / player.expectedMinutes));

  const probs = evaluateMarketLineProbabilities(
    preGameForecast.pointsLine,
    updatedFinalPoints,
    remainingStdDev
  );

  const probOverChange = Number(((probs.probOver - preGameForecast.modelProbOver) * 100).toFixed(1));
  const probUnderChange = Number(((probs.probUnder - preGameForecast.modelProbUnder) * 100).toFixed(1));

  // Updated Recommendation Post-Q1
  const updatedPointsDiff = Number((updatedFinalPoints - preGameForecast.pointsLine).toFixed(1));
  const updatedEdgeOver = Number(((probs.probOver - preGameForecast.noVigImpliedOver) * 100).toFixed(1));
  const updatedEdgeUnder = Number(((probs.probUnder - preGameForecast.noVigImpliedUnder) * 100).toFixed(1));

  let updatedRecommendation = preGameForecast.recommendation;
  let updatedEdge = preGameForecast.recommendationEdge;

  if (updatedEdgeOver >= 4.0) {
    updatedRecommendation = 'OVER EDGE';
    updatedEdge = updatedEdgeOver;
  } else if (updatedEdgeUnder >= 4.0) {
    updatedRecommendation = 'UNDER EDGE';
    updatedEdge = updatedEdgeUnder;
  } else {
    updatedRecommendation = 'NO EDGE';
    updatedEdge = 0;
  }

  // Determine Scanner Tag
  let scannerTag: FirstQuarterPlayerStats['scannerTag'] = 'NEUTRAL';
  let summary = '';

  if (fouls >= 2) {
    scannerTag = 'FOUL_RISK';
    summary = `Foul trouble alert (${fouls} early fouls). Expected remaining minutes reduced from ${player.expectedMinutes - actualQ1Minutes}m to ${expectedRemainingMinutes.toFixed(1)}m. Under probability increased by +${probUnderChange}%.`;
  } else if (isVolumeExpansion && updatedRecommendation === 'OVER EDGE') {
    scannerTag = 'ROLE_EXPANSION';
    summary = `High shot volume (${actualFga} FGA in Q1 vs ${expectedQ1Fga.toFixed(1)} exp). Sustainable offensive usage raises final projection to ${updatedFinalPoints} pts.`;
  } else if (isHotHandVariance) {
    scannerTag = 'NEUTRAL';
    summary = `Early scoring surge (${actualQ1Points} pts on ${actualFgm}/${actualFga} FG) driven by temporary shooting efficiency. Regressed remaining output to avoid overreacting.`;
  } else if (probOverChange >= 8.0) {
    scannerTag = 'BIG_OVER_SURGE';
    summary = `Over probability surged +${probOverChange}% since tip-off. Projected to finish with ${updatedFinalPoints} pts (Line: ${preGameForecast.pointsLine}).`;
  } else if (probUnderChange >= 8.0) {
    scannerTag = 'BIG_UNDER_SURGE';
    summary = `Under probability surged +${probUnderChange}% following low Q1 usage (${actualQ1Points} pts in ${actualQ1Minutes}m). Line at ${preGameForecast.pointsLine}.`;
  } else {
    summary = `First quarter scoring (${actualQ1Points} pts) tracked within normal expected range (Exp: ${preGameQ1Points} pts). Final projection updated to ${updatedFinalPoints} pts.`;
  }

  return {
    playerId: player.id,
    playerName: player.name,
    gameId: preGameForecast.gameId,
    team: player.team,
    opponent: preGameForecast.opponent,
    actualQ1Points,
    actualQ1Minutes,
    actualQ1Fgm: actualFgm,
    actualQ1Fga: actualFga,
    actualQ13pm: actual3pm,
    actualQ13pa: actual3pa,
    actualQ1Ftm: actualFtm,
    actualQ1Fta: actualFta,
    actualQ1Fouls: fouls,
    preGameExpectedQ1Points: preGameQ1Points,
    preGameExpectedQ1Minutes: preGameQ1Minutes,
    preGameProjectedFinalPoints: preGameForecast.modelProjectedPoints,
    pointsDifferenceQ1: pointsDiffQ1,
    minutesDifferenceQ1: minDiffQ1,
    actualShotEfficiency,
    isHotHandVariance,
    isVolumeExpansion,
    expectedRemainingMinutes: Number(expectedRemainingMinutes.toFixed(1)),
    updatedProjectedFinalPoints: updatedFinalPoints,
    currentPointsLine: preGameForecast.pointsLine,
    updatedProbOver: probs.probOver,
    updatedProbUnder: probs.probUnder,
    probOverChangeSinceTip: probOverChange,
    probUnderChangeSinceTip: probUnderChange,
    updatedRecommendation,
    updatedEdge,
    scannerTag,
    scannerSummary: summary,
  };
}

/**
 * Builds the Early Edge Scanner rankings for all players in a game or slate.
 */
export function buildEarlyEdgeScannerReport(
  gameId: string,
  matchup: string,
  gameState: GamePeriodStatus,
  players: FirstQuarterPlayerStats[],
  gameClock?: string,
  awayScore?: number,
  homeScore?: number
): EarlyEdgeScannerReport {
  // Sort candidates by edge strength
  const overCandidates = [...players]
    .filter((p) => p.updatedRecommendation === 'OVER EDGE')
    .sort((a, b) => b.updatedEdge - a.updatedEdge);

  const underCandidates = [...players]
    .filter((p) => p.updatedRecommendation === 'UNDER EDGE')
    .sort((a, b) => b.updatedEdge - a.updatedEdge);

  const topOverMovers = [...players].sort((a, b) => b.probOverChangeSinceTip - a.probOverChangeSinceTip);
  const topUnderMovers = [...players].sort((a, b) => b.probUnderChangeSinceTip - a.probUnderChangeSinceTip);

  const strongestOver = overCandidates[0];
  const strongestUnder = underCandidates[0];
  const topOverMover = topOverMovers[0];
  const topUnderMover = topUnderMovers[0];

  if (strongestOver) strongestOver.scannerTag = 'STRONGEST_OVER';
  if (strongestUnder) strongestUnder.scannerTag = 'STRONGEST_UNDER';

  return {
    gameId,
    matchup,
    gameState,
    gameClock,
    awayScore,
    homeScore,
    players,
    strongestOver,
    strongestUnder,
    topOverMover,
    topUnderMover,
  };
}
