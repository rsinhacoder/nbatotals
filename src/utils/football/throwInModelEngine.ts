import type {
  FootballCompetition,
  FootballMarketOdds,
  TeamThrowInProfile,
  ThrowInConfidenceTier,
  ThrowInDataQuality,
  ThrowInForecast,
} from '../../types/football';

/**
 * Computes exact cumulative Poisson probability:
 * P(K <= maxK | lambda) = sum_{k=0}^{maxK} (lambda^k * exp(-lambda)) / k!
 */
export function cumulativePoissonProb(lambda: number, maxK: number): number {
  if (lambda <= 0) return 1.0;
  if (maxK < 0) return 0.0;

  let currentProb = Math.exp(-lambda); // k = 0
  let cumulative = currentProb;

  for (let k = 1; k <= maxK; k++) {
    currentProb = (currentProb * lambda) / k;
    cumulative += currentProb;
  }

  return Math.min(1.0, Math.max(0.0, cumulative));
}

/**
 * Computes discrete Poisson probability for exact count k
 */
export function poissonProb(lambda: number, k: number): number {
  if (k < 0) return 0;
  if (lambda <= 0) return k === 0 ? 1 : 0;

  let currentProb = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) {
    currentProb = (currentProb * lambda) / i;
  }
  return currentProb;
}

/**
 * Generates the probability mass distribution around lambda for visualization
 * Returns array of { count: number, probability: number }
 */
export function generateThrowInDistribution(
  lambda: number,
  minCount = 15,
  maxCount = 60
): Array<{ count: number; probability: number; isUnder40_5: boolean }> {
  const distribution: Array<{ count: number; probability: number; isUnder40_5: boolean }> = [];
  for (let c = minCount; c <= maxCount; c++) {
    distribution.push({
      count: c,
      probability: Number((poissonProb(lambda, c) * 100).toFixed(2)),
      isUnder40_5: c <= 40,
    });
  }
  return distribution;
}

/**
 * Estimates quantiles (e.g., 10th and 90th percentiles) for the 80% confidence interval
 */
export function calculatePoissonQuantiles(lambda: number): [number, number] {
  let low = 0;
  let high = 65;
  let cum = 0;

  for (let k = 0; k <= 80; k++) {
    cum += poissonProb(lambda, k);
    if (low === 0 && cum >= 0.1) {
      low = k;
    }
    if (cum >= 0.9) {
      high = k;
      break;
    }
  }

  return [Math.max(10, low), Math.min(65, high)];
}

/**
 * Calculates No-Vig Fair Implied Probabilities from decimal market odds
 */
export function calculateNoVigOdds(
  underOdds: number,
  overOdds: number,
  line = 40.5,
  bookmaker = 'Pinnacle / Audited Consensus'
): FootballMarketOdds {
  const rawUnderImpliedProb = 1 / underOdds;
  const rawOverImpliedProb = 1 / overOdds;
  const overround = rawUnderImpliedProb + rawOverImpliedProb;

  const noVigUnderProb = (rawUnderImpliedProb / overround) * 100;
  const noVigOverProb = (rawOverImpliedProb / overround) * 100;

  return {
    bookmaker,
    line,
    overPrice: Number(overOdds.toFixed(2)),
    underPrice: Number(underOdds.toFixed(2)),
    rawUnderImpliedProb: Number((rawUnderImpliedProb * 100).toFixed(2)),
    rawOverImpliedProb: Number((rawOverImpliedProb * 100).toFixed(2)),
    overround: Number((overround * 100).toFixed(2)),
    noVigUnderProb: Number(noVigUnderProb.toFixed(1)),
    noVigOverProb: Number(noVigOverProb.toFixed(1)),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Main Quantitative Throw-In Forecasting Engine
 * Evaluates match dynamics, possession splits, historical generation/concession rates,
 * and derives exact count distribution probabilities.
 */
export function calculateThrowInForecast(params: {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  competition: FootballCompetition;
  kickoffTime: string;
  gameDate: string;
  venue?: string;
  homeProfile: TeamThrowInProfile;
  awayProfile: TeamThrowInProfile;
  isHomeVerified: boolean;
  isAwayVerified: boolean;
  marketOdds?: { underPrice: number; overPrice: number; line?: number; bookmaker?: string };
}): ThrowInForecast {
  const {
    matchId,
    homeTeamName,
    awayTeamName,
    competition,
    kickoffTime,
    gameDate,
    venue,
    homeProfile,
    awayProfile,
    isHomeVerified,
    isAwayVerified,
    marketOdds,
  } = params;

  const leagueBaseline = competition.avgThrowInsPerMatch;
  const halfLeague = leagueBaseline / 2;

  // 1. Offense / Defense Generation & Concession Deltas
  const homeOffenseDelta = (homeProfile.homeThrowInsTakenAvg || homeProfile.avgThrowInsTakenPerMatch) - halfLeague;
  const awayOffenseDelta = (awayProfile.awayThrowInsTakenAvg || awayProfile.avgThrowInsTakenPerMatch) - halfLeague;
  const homeDefenseDelta = (homeProfile.homeOpponentThrowInsAvg || homeProfile.avgOpponentThrowInsPerMatch) - halfLeague;
  const awayDefenseDelta = (awayProfile.awayOpponentThrowInsAvg || awayProfile.avgOpponentThrowInsPerMatch) - halfLeague;

  // Projected throw-ins per side
  const projectedHomeThrowIns = Number((halfLeague + homeOffenseDelta * 0.75 + awayDefenseDelta * 0.75).toFixed(1));
  const projectedAwayThrowIns = Number((halfLeague + awayOffenseDelta * 0.75 + homeDefenseDelta * 0.75).toFixed(1));

  let rawTotal = projectedHomeThrowIns + projectedAwayThrowIns;

  // 2. Tactical Adjustments
  // A. Dominant possession suppresses sideline clearances and resets
  const avgPossession = (homeProfile.avgPossessionPct + awayProfile.avgPossessionPct) / 2;
  const possessionDelta = homeProfile.avgPossessionPct - awayProfile.avgPossessionPct;
  let tacticalAdjustment = 0;

  if (homeProfile.avgPossessionPct > 60 || awayProfile.avgPossessionPct > 60) {
    // One highly dominant team keeps ball circulating in midfield
    tacticalAdjustment -= 1.4;
  }
  if (avgPossession > 56) {
    tacticalAdjustment -= 0.8;
  }

  // B. Direct play styling (long balls, aerial duels along wings generate more throw-ins)
  const combinedDirectness = (homeProfile.directPlayRatio + awayProfile.directPlayRatio) / 2;
  if (combinedDirectness > 0.35) {
    tacticalAdjustment += 2.2;
  } else if (combinedDirectness < 0.18) {
    tacticalAdjustment -= 1.6;
  }

  // C. Recent Form Weighting (Blend 70% long-term + 30% recent last-10 matches)
  const recentFormCombined = (homeProfile.last10MatchAvg + awayProfile.last10MatchAvg) / 2;
  const blendedTotal = Number((rawTotal * 0.7 + recentFormCombined * 0.3 + tacticalAdjustment).toFixed(1));
  const projectedTotalThrowIns = Math.max(20.0, Math.min(55.0, blendedTotal));

  // 3. Probabilities via Integer Count Distribution
  const lambda = projectedTotalThrowIns;
  const probabilityUnder40_5 = Number((cumulativePoissonProb(lambda, 40) * 100).toFixed(1));
  const probabilityOver40_5 = Number((100 - probabilityUnder40_5).toFixed(1));
  const probabilityUnder38_5 = Number((cumulativePoissonProb(lambda, 38) * 100).toFixed(1));
  const probabilityUnder42_5 = Number((cumulativePoissonProb(lambda, 42) * 100).toFixed(1));

  const expectedDifference = Number((projectedTotalThrowIns - 40.5).toFixed(1));
  const uncertaintyRange = calculatePoissonQuantiles(lambda);

  // 4. Historical Matchup Evidence
  const homeUnder40_5Rate = homeProfile.under40_5Rate;
  const awayUnder40_5Rate = awayProfile.under40_5Rate;
  const combinedHistoricalUnderRate = Number(((homeUnder40_5Rate + awayUnder40_5Rate) / 2).toFixed(1));
  const historicalSampleSize = homeProfile.matchesPlayed + awayProfile.matchesPlayed;

  // 5. Data Quality & Reliability Scoring
  let dataQuality: ThrowInDataQuality = 'SAMPLE_CALIBRATED';
  let reliabilityScore = 65;

  if (isHomeVerified && isAwayVerified) {
    dataQuality = 'OPTA_VERIFIED';
    reliabilityScore = 88;
    if (historicalSampleSize > 100) reliabilityScore += 6;
  } else if (isHomeVerified || isAwayVerified) {
    dataQuality = 'SAMPLE_CALIBRATED';
    reliabilityScore = 72;
  } else {
    dataQuality = 'LIMITED_SAMPLE';
    reliabilityScore = 55;
  }

  // 6. Confidence Tier Classification
  let confidenceTier: ThrowInConfidenceTier = 'NEUTRAL_PASS';
  if (projectedTotalThrowIns <= 34.0 && probabilityUnder40_5 >= 75.0 && dataQuality === 'OPTA_VERIFIED') {
    confidenceTier = 'HIGH_CONVICTION';
  } else if (projectedTotalThrowIns <= 37.0 && probabilityUnder40_5 >= 66.0) {
    confidenceTier = 'MODERATE_EDGE';
  } else if (projectedTotalThrowIns <= 39.5 && probabilityUnder40_5 >= 58.0) {
    confidenceTier = 'LEAN_UNDER';
  } else if (projectedTotalThrowIns > 41.5 || probabilityUnder40_5 < 48.0) {
    confidenceTier = 'HIGH_VOLATILITY';
  } else {
    confidenceTier = 'NEUTRAL_PASS';
  }

  // 7. Market Odds & Edge Calculation
  let formattedMarketOdds: FootballMarketOdds | undefined = undefined;
  let marketProbabilityEdge: number | undefined = undefined;
  let isMarketValuePositive = false;

  if (marketOdds && marketOdds.underPrice > 1.0 && marketOdds.overPrice > 1.0) {
    formattedMarketOdds = calculateNoVigOdds(
      marketOdds.underPrice,
      marketOdds.overPrice,
      marketOdds.line || 40.5,
      marketOdds.bookmaker || 'Consensus Sportsbook'
    );
    const edge = Number((probabilityUnder40_5 - formattedMarketOdds.noVigUnderProb).toFixed(1));
    marketProbabilityEdge = edge;
    isMarketValuePositive = edge >= 2.0;
  }

  // 8. Transparent Data-Grounded Explanation Generator
  const explanationBullets: string[] = [];
  if (homeProfile.avgPossessionPct > 58 || awayProfile.avgPossessionPct > 58) {
    const highPossTeam = homeProfile.avgPossessionPct > awayProfile.avgPossessionPct ? homeProfile.teamName : awayProfile.teamName;
    const possVal = Math.max(homeProfile.avgPossessionPct, awayProfile.avgPossessionPct);
    explanationBullets.push(
      `${highPossTeam} controls high possession (${possVal}%), sustaining central build-up and suppressing touchline ball exits.`
    );
  }

  explanationBullets.push(
    `Combined multi-season Under 40.5 hit rate is ${combinedHistoricalUnderRate}% across ${historicalSampleSize} verified fixtures (League baseline: ${competition.avgThrowInsPerMatch} / match).`
  );

  if (homeProfile.last5Under40_5Rate >= 80 && awayProfile.last5Under40_5Rate >= 80) {
    explanationBullets.push(
      `Strong recent form: ${homeProfile.teamName} is ${homeProfile.last5Under40_5Rate}% Under 40.5 over their last 5, and ${awayProfile.teamName} is ${awayProfile.last5Under40_5Rate}%.`
    );
  } else if (combinedDirectness > 0.35) {
    explanationBullets.push(
      `Direct stylistic risk: Direct play ratio of ${combinedDirectness.toFixed(2)} indicates higher long-ball frequency toward touchlines.`
    );
  }

  const paceAndPlayingStyleSummary =
    combinedDirectness < 0.22
      ? 'Controlled Midfield Buildup (Low Sideline Variance)'
      : combinedDirectness > 0.35
      ? 'Direct Aerial Style (High Sideline Incursions)'
      : 'Balanced Positional Play';

  return {
    matchId,
    homeTeamName,
    awayTeamName,
    competition,
    kickoffTime,
    gameDate,
    venue,
    projectedTotalThrowIns,
    projectedHomeThrowIns,
    projectedAwayThrowIns,
    expectedDifference,
    medianProjected: Math.round(projectedTotalThrowIns),
    uncertaintyRange,
    probabilityUnder40_5,
    probabilityOver40_5,
    probabilityUnder38_5,
    probabilityUnder42_5,
    homeUnder40_5Rate,
    awayUnder40_5Rate,
    combinedHistoricalUnderRate,
    historicalSampleSize,
    marketOdds: formattedMarketOdds,
    hasMarketOdds: Boolean(formattedMarketOdds),
    marketProbabilityEdge,
    isMarketValuePositive,
    dataQuality,
    confidenceTier,
    modelReliabilityScore: reliabilityScore,
    possessionDelta: Number(possessionDelta.toFixed(1)),
    paceAndPlayingStyleSummary,
    dataGroundedExplanation: explanationBullets.join(' '),
  };
}
