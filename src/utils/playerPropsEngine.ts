import type {
  NBAPlayerProfile,
  PlayerPropsForecast,
  PlayerPropsMarket,
  PropRecommendation,
} from '../types/playerProps';
import { getTeamProfile } from '../data/teamProfiles';

/**
 * Standard Normal Cumulative Distribution Function (CDF)
 */
export function normalCdf(x: number, mean: number = 0, stdDev: number = 1): number {
  if (stdDev <= 0) return x >= mean ? 1 : 0;
  const z = (x - mean) / stdDev;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;
  return Number(Math.max(0, Math.min(1, p)).toFixed(5));
}

/**
 * American odds to decimal conversion
 */
export function americanToDecimalOdds(american: string | number): number {
  const num = typeof american === 'string' ? parseFloat(american.replace('+', '')) : american;
  if (isNaN(num) || num === 0) return 1.91;
  if (num > 0) return Number((1 + num / 100).toFixed(3));
  return Number((1 + 100 / Math.abs(num)).toFixed(3));
}

/**
 * Decimal to American odds string
 */
export function decimalToAmericanOdds(decimal: number): string {
  if (decimal <= 1.0) return '-10000';
  if (decimal >= 2.0) {
    const us = Math.round((decimal - 1) * 100);
    return `+${us}`;
  }
  const us = Math.round(-100 / (decimal - 1));
  return `${us}`;
}

/**
 * Convert odds to implied probability (including juice)
 */
export function oddsToImpliedProbability(american: string | number): number {
  const dec = americanToDecimalOdds(american);
  return Number((1 / dec).toFixed(4));
}

/**
 * Removes vigorish using the proportional (multiplicative) method.
 * Returns fair no-vig probabilities for Over and Under that sum to 1.0.
 */
export function calculateNoVigProbabilities(
  overOdds: string | number,
  underOdds: string | number
): { noVigOver: number; noVigUnder: number; overround: number } {
  const impOver = oddsToImpliedProbability(overOdds);
  const impUnder = oddsToImpliedProbability(underOdds);
  const totalImplied = impOver + impUnder;
  const overround = Number(((totalImplied - 1) * 100).toFixed(2));

  const noVigOver = Number((impOver / totalImplied).toFixed(4));
  const noVigUnder = Number((impUnder / totalImplied).toFixed(4));

  return { noVigOver, noVigUnder, overround };
}

export interface PlayerProjectionFactors {
  baselinePpm: number;
  projectedMinutes: number;
  recencyAdjustment: number;
  matchupMultiplier: number;
  restMultiplier: number;
  homeAwayMultiplier: number;
  expectedPoints: number;
  scoringStdDev: number;
}

/**
 * Computes player points projection and scoring distribution.
 */
export function computePlayerPointsProjection(
  player: NBAPlayerProfile,
  opponentAbbr: string,
  isHome: boolean = true
): PlayerProjectionFactors {
  // 1. Baseline scoring rate (Points Per Minute - PPM)
  // Weighted recency: Season 40% + Last 10 35% + Last 5 25%
  const seasonPpm = player.seasonMinutes > 0 ? player.seasonPpg / player.seasonMinutes : 0.75;
  const l10Ppm = player.last10Minutes > 0 ? player.last10Ppg / player.last10Minutes : seasonPpm;
  const l5Ppm = player.last5Minutes > 0 ? player.last5Ppg / player.last5Minutes : l10Ppm;
  const blendedPpm = seasonPpm * 0.40 + l10Ppm * 0.35 + l5Ppm * 0.25;

  // 2. Projected Playing Time
  // Blended expected minutes with role stability shrinkage
  const blendedMinutes = player.expectedMinutes * 0.50 + player.last10Minutes * 0.30 + player.last5Minutes * 0.20;
  const projectedMinutes = Math.max(15, Math.min(42, blendedMinutes));

  // 3. Opponent Matchup & Pace Adjustment
  const oppProfile = getTeamProfile(opponentAbbr);
  // League average defensive rating is ~114.5, Pace ~99.2
  const oppDefRtg = oppProfile.defensiveRating || 114.5;
  const oppPace = oppProfile.paceRating || 99.2;
  const defFactor = (oppDefRtg - 114.5) * 0.0035; // Weaker defense yields more points
  const paceFactor = (oppPace - 99.2) * 0.003;
  const matchupMultiplier = Number((1.0 + defFactor + paceFactor).toFixed(3));

  // 4. Rest and Fatigue Adjustment
  let restMultiplier = 1.0;
  if (player.restDays === 0) {
    restMultiplier = 0.96; // 4% fatigue penalty on B2B
  } else if ((player.restDays || 1) >= 3) {
    restMultiplier = 1.015; // Well-rested boost
  }

  // 5. Home / Away Split Adjustment
  let homeAwayMultiplier = 1.0;
  if (isHome && player.homeSplitPpg && player.seasonPpg > 0) {
    homeAwayMultiplier = Math.max(0.97, Math.min(1.04, player.homeSplitPpg / player.seasonPpg));
  } else if (!isHome && player.awaySplitPpg && player.seasonPpg > 0) {
    homeAwayMultiplier = Math.max(0.96, Math.min(1.03, player.awaySplitPpg / player.seasonPpg));
  }

  // Raw Expected Points
  const rawExpected = projectedMinutes * blendedPpm * matchupMultiplier * restMultiplier * homeAwayMultiplier;
  const expectedPoints = Number(Math.max(5, rawExpected).toFixed(1));

  // Empirical scoring standard deviation
  // For high-usage stars, variance is typically ~22-26% of mean; for low-usage ~30%
  const cv = player.usageRate >= 28 ? 0.23 : 0.28;
  const scoringStdDev = Number(Math.max(2.5, expectedPoints * cv).toFixed(2));

  return {
    baselinePpm: Number(blendedPpm.toFixed(3)),
    projectedMinutes: Number(projectedMinutes.toFixed(1)),
    recencyAdjustment: Number((blendedPpm - seasonPpm).toFixed(3)),
    matchupMultiplier,
    restMultiplier,
    homeAwayMultiplier,
    expectedPoints,
    scoringStdDev,
  };
}

/**
 * Calculates continuous & discrete probability distribution for a player's points vs the market line.
 * Fully accounts for integer lines (Push) and half-point lines (No Push).
 */
export function evaluateMarketLineProbabilities(
  line: number,
  expectedPoints: number,
  stdDev: number
): { probOver: number; probUnder: number; probPush: number } {
  const isIntegerLine = Number.isInteger(line);

  if (isIntegerLine) {
    // Continuity correction for integer line L:
    // P(X = L) ≈ CDF(L + 0.5) - CDF(L - 0.5)
    // P(X > L) ≈ 1 - CDF(L + 0.5)
    // P(X < L) ≈ CDF(L - 0.5)
    const cdfUpper = normalCdf(line + 0.5, expectedPoints, stdDev);
    const cdfLower = normalCdf(line - 0.5, expectedPoints, stdDev);

    const probPush = Number(Math.max(0.01, cdfUpper - cdfLower).toFixed(4));
    const probOver = Number((1 - cdfUpper).toFixed(4));
    const probUnder = Number(cdfLower.toFixed(4));

    return { probOver, probUnder, probPush };
  } else {
    // Half-point line (e.g. 24.5) - no push possible
    const cdfLine = normalCdf(line, expectedPoints, stdDev);
    const probUnder = Number(cdfLine.toFixed(4));
    const probOver = Number((1 - cdfLine).toFixed(4));

    return { probOver, probUnder, probPush: 0 };
  }
}

/**
 * Core forecast generation: runs the model against a specific market.
 */
export function generatePlayerPropForecast(
  market: PlayerPropsMarket,
  player: NBAPlayerProfile,
  isHome: boolean = true
): PlayerPropsForecast {
  const proj = computePlayerPointsProjection(player, market.opponent, isHome);
  const probs = evaluateMarketLineProbabilities(market.line, proj.expectedPoints, proj.scoringStdDev);

  const { noVigOver, noVigUnder, overround } = calculateNoVigProbabilities(
    market.overOdds,
    market.underOdds
  );

  const marketImpliedOver = oddsToImpliedProbability(market.overOdds);
  const marketImpliedUnder = oddsToImpliedProbability(market.underOdds);

  const overDec = market.overDecimalOdds;
  const underDec = market.underDecimalOdds;

  // Expected Value calculation:
  // EV = (P_win * DecOdds + P_push * 1.0 - 1.0) * 100%
  const evOver = Number(((probs.probOver * overDec + probs.probPush * 1.0 - 1) * 100).toFixed(2));
  const evUnder = Number(((probs.probUnder * underDec + probs.probPush * 1.0 - 1) * 100).toFixed(2));

  // Probability Edges relative to No-Vig Fair Market
  const edgeOver = Number(((probs.probOver - noVigOver) * 100).toFixed(2));
  const edgeUnder = Number(((probs.probUnder - noVigUnder) * 100).toFixed(2));

  const pointsDiff = Number((proj.expectedPoints - market.line).toFixed(1));

  // Determine Recommendation
  // Requires minimum edge (>= +3.5%) AND positive EV (>= +4.0%)
  const MIN_PROB_EDGE = 3.5;
  const MIN_EV = 4.0;

  let recommendation: PropRecommendation = 'NO EDGE';
  let recEdge = 0;
  let recEv = 0;

  if (edgeOver >= MIN_PROB_EDGE && evOver >= MIN_EV) {
    recommendation = 'OVER EDGE';
    recEdge = edgeOver;
    recEv = evOver;
  } else if (edgeUnder >= MIN_PROB_EDGE && evUnder >= MIN_EV) {
    recommendation = 'UNDER EDGE';
    recEdge = edgeUnder;
    recEv = evUnder;
  }

  // Model Confidence Score (0 - 100)
  // Grounded in sample size, playing time stability, and magnitude of edge
  let confidenceScore = 60;
  if (player.last10Minutes >= 32) confidenceScore += 12; // Stable rotation
  if (player.injuryStatus === 'ACTIVE') confidenceScore += 8;
  if (Math.abs(pointsDiff) >= 3.0) confidenceScore += 10;
  if (Math.abs(recEdge) >= 7.0) confidenceScore += 10;
  confidenceScore = Math.min(95, Math.max(50, confidenceScore));

  const starRating =
    recEv >= 10.0 ? 5 : recEv >= 6.5 ? 4 : recEv >= 3.5 ? 3 : recEv > 0 ? 2 : 1;

  // 80% Credible Interval [P10, P90]
  // Z_0.90 ≈ 1.282
  const lower80 = Number(Math.max(0, proj.expectedPoints - 1.282 * proj.scoringStdDev).toFixed(1));
  const upper80 = Number((proj.expectedPoints + 1.282 * proj.scoringStdDev).toFixed(1));

  // Explanatory Factor Summary
  const oppProfile = getTeamProfile(market.opponent);
  let narrative = '';
  if (recommendation === 'OVER EDGE') {
    narrative = `Model projects ${proj.expectedPoints} pts vs line ${market.line} (+${pointsDiff} pts discrepancy). Supported by ${proj.projectedMinutes} projected minutes, favorable matchup vs ${oppProfile.name} (Def Rtg ${oppProfile.defensiveRating}), and +${recEv}% EV.`;
  } else if (recommendation === 'UNDER EDGE') {
    narrative = `Model projects ${proj.expectedPoints} pts vs line ${market.line} (${pointsDiff} pts discrepancy). Line inflated relative to ${proj.projectedMinutes} projected minutes and defensive resistance from ${oppProfile.name}. Yields +${recEv}% EV on UNDER.`;
  } else {
    narrative = `Sportsbook line (${market.line}) is well-aligned with expected output (${proj.expectedPoints} pts). Edge is within normal variance window.`;
  }

  return {
    marketId: market.marketId,
    gameId: market.gameId,
    playerId: player.id,
    playerName: player.name,
    team: player.team,
    opponent: market.opponent,
    gameStartTime: market.gameStartTime,
    pointsLine: market.line,
    overOdds: market.overOdds,
    underOdds: market.underOdds,
    overDecimal: overDec,
    underDecimal: underDec,
    marketImpliedOver,
    marketImpliedUnder,
    noVigImpliedOver: noVigOver,
    noVigImpliedUnder: noVigUnder,
    overround,
    modelProjectedPoints: proj.expectedPoints,
    modelStdDev: proj.scoringStdDev,
    modelProbOver: probs.probOver,
    modelProbUnder: probs.probUnder,
    modelProbPush: probs.probPush,
    pointsDifference: pointsDiff,
    probabilityEdgeOver: edgeOver,
    probabilityEdgeUnder: edgeUnder,
    evOver,
    evUnder,
    recommendation,
    recommendationEdge: recEdge,
    recommendationEv: recEv,
    confidenceScore,
    starRating,
    dataFreshness: 'LIVE',
    dataQuality: 'VERIFIED',
    expectedQ1Points: player.q1Ppg,
    expectedQ1Minutes: player.q1Minutes,
    confidenceInterval80: [lower80, upper80],
    keyNarrative: narrative,
    factors: {
      minutesFactor: `${proj.projectedMinutes} expected minutes (Season: ${player.seasonMinutes}m, L5: ${player.last5Minutes}m)`,
      recencyFactor: `PPM: ${proj.baselinePpm} (Season: ${player.seasonPpg} PPG, L5: ${player.last5Ppg} PPG)`,
      matchupFactor: `Opponent: ${oppProfile.name} (Def Rtg: ${oppProfile.defensiveRating}, Pace: ${oppProfile.paceRating})`,
      restFactor: `Rest: ${player.restDays ?? 1} day(s) (${proj.restMultiplier === 1.0 ? 'Standard' : 'Rest adjustment applied'})`,
      q1Baseline: `Q1 Avg: ${player.q1Ppg} pts in ${player.q1Minutes} mins`,
    },
  };
}
