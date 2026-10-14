/**
 * Global Football Throw-Ins Under 40.5 Types & Data Models
 * Defines schemas for fixtures, historical throw-in statistics,
 * quantitative count-distribution models, market odds, and backtesting.
 */

export type FootballMatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED' | 'ABANDONED';

export type ThrowInConfidenceTier = 'HIGH_CONVICTION' | 'MODERATE_EDGE' | 'LEAN_UNDER' | 'NEUTRAL_PASS' | 'HIGH_VOLATILITY';

export type ThrowInDataQuality = 'OPTA_VERIFIED' | 'SAMPLE_CALIBRATED' | 'LIMITED_SAMPLE' | 'UNSUPPORTED_DATA';

export interface FootballCompetition {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  espnCode: string;
  leagueTier: 1 | 2 | 'INTERNATIONAL';
  avgThrowInsPerMatch: number; // League historical average (e.g. 35.8 for EPL, 37.4 for La Liga)
  medianThrowIns: number;
  under40_5Rate: number; // % of games finishing under 40.5
  totalMatchesAudited: number;
}

export interface TeamThrowInProfile {
  teamId: string;
  teamName: string;
  shortName: string;
  abbreviation: string;
  logo: string;
  competitionId: string;
  competitionName: string;
  country: string;
  
  // Throw-Ins Taken / Won by the team
  avgThrowInsTakenPerMatch: number;
  homeThrowInsTakenAvg: number;
  awayThrowInsTakenAvg: number;

  // Throw-Ins Conceded / Opponent Throw-Ins
  avgOpponentThrowInsPerMatch: number;
  homeOpponentThrowInsAvg: number;
  awayOpponentThrowInsAvg: number;

  // Total Match Throw-Ins (Combined both teams)
  avgTotalMatchThrowIns: number;
  homeTotalMatchThrowInsAvg: number;
  awayTotalMatchThrowInsAvg: number;
  medianTotalThrowIns: number;
  stdDevThrowIns: number;

  // Recent Form (Last 5, 10, 15 matches)
  last5MatchAvg: number;
  last10MatchAvg: number;
  last15MatchAvg?: number;
  last5Under40_5Rate: number;
  last10Under40_5Rate: number;

  // Season-to-Date Frequencies
  matchesPlayed: number;
  under38_5Rate: number;
  under39_5Rate: number;
  under40_5Rate: number;
  under41_5Rate: number;
  under42_5Rate: number;

  // Tactical Indicators (Explanatory variables)
  avgPossessionPct: number; // Teams > 58% possession typically average fewer throw-ins
  passAccuracyPct: number;
  crossesPerMatch: number;
  directPlayRatio: number; // Direct long balls vs short buildup (0.0 to 1.0)
  pitchWidthMeters?: number;

  // Match Logs (Recent completed matches)
  recentLogs: Array<{
    date: string;
    opponent: string;
    isHome: boolean;
    throwInsTaken: number;
    throwInsConceded: number;
    totalThrowIns: number;
    isUnder40_5: boolean;
  }>;
}

export interface FootballMarketOdds {
  bookmaker: string;
  line: number; // e.g. 40.5
  overPrice: number; // Decimal odds (e.g. 1.95)
  underPrice: number; // Decimal odds (e.g. 1.88)
  rawUnderImpliedProb: number; // 1 / underPrice (e.g. 53.19%)
  rawOverImpliedProb: number;
  overround: number; // e.g. 104.47%
  noVigUnderProb: number; // Fair probability after bookmaker juice removal
  noVigOverProb: number;
  lastUpdated: string;
}

export interface ThrowInForecast {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  competition: FootballCompetition;
  kickoffTime: string;
  gameDate: string;
  venue?: string;

  // Model Core Projections
  projectedTotalThrowIns: number;
  projectedHomeThrowIns: number;
  projectedAwayThrowIns: number;
  expectedDifference: number; // projectedTotal - 40.5
  medianProjected: number;
  uncertaintyRange: [number, number]; // 80% confidence interval [min, max]

  // Count Distribution Probabilities (Poisson / NegBinomial)
  probabilityUnder40_5: number; // Probability match has <= 40 throw-ins
  probabilityOver40_5: number;
  probabilityUnder38_5: number;
  probabilityUnder42_5: number;

  // Historical Matchup Evidence
  homeUnder40_5Rate: number;
  awayUnder40_5Rate: number;
  combinedHistoricalUnderRate: number;
  historicalSampleSize: number; // Total relevant completed matches analyzed

  // Market & Edge (if verified odds available)
  marketOdds?: FootballMarketOdds;
  hasMarketOdds: boolean;
  marketProbabilityEdge?: number; // modelUnderProb - noVigUnderProb (percentage points)
  isMarketValuePositive: boolean;

  // Data Quality & Model Confidence
  dataQuality: ThrowInDataQuality;
  confidenceTier: ThrowInConfidenceTier;
  modelReliabilityScore: number; // 0 - 100 based on historical calibration & sample size
  
  // Tactical Factors
  possessionDelta: number; // homePossession - awayPossession
  paceAndPlayingStyleSummary: string;
  dataGroundedExplanation: string;
}

export interface FootballFixture {
  id: string;
  name: string;
  date: string;
  time: string;
  status: FootballMatchStatus;
  statusDetail?: string;
  homeTeam: {
    id: string;
    name: string;
    abbrev: string;
    logo: string;
    record?: string;
  };
  awayTeam: {
    id: string;
    name: string;
    abbrev: string;
    logo: string;
    record?: string;
  };
  competition: {
    id: string;
    name: string;
    country: string;
    logo?: string;
  };
  venue?: string;
  forecast?: ThrowInForecast;
}

export interface ThrowInBacktestMatch {
  matchId: string;
  date: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  actualThrowIns: number;
  projectedThrowIns: number;
  modelUnder40_5Prob: number;
  actualUnder40_5: boolean;
  absoluteError: number;
  brierScore: number;
  logLoss: number;
  marketUnderOdds?: number;
  marketNoVigProb?: number;
  edgePoints?: number;
}

export interface ThrowInBacktestSummary {
  totalMatchesEvaluated: number;
  evaluationPeriod: string;
  meanAbsoluteError: number;
  rootMeanSquaredError: number;
  overallBrierScore: number;
  overallLogLoss: number;
  actualUnder40_5Count: number;
  actualUnder40_5Rate: number;
  calibrationTiers: Array<{
    predictedRange: string;
    minProb: number;
    maxProb: number;
    matchCount: number;
    actualUnderRate: number;
    predictedAvgProb: number;
    calibrationDelta: number; // actual - predicted
  }>;
  competitionBreakdown: Array<{
    competition: string;
    matchCount: number;
    mae: number;
    actualUnderRate: number;
    modelUnderRate: number;
  }>;
}
