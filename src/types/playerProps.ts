export type OddsFormat = 'AMERICAN' | 'DECIMAL';

export type PropRecommendation = 'OVER EDGE' | 'UNDER EDGE' | 'NO EDGE' | 'OFF MARKET';

export type InjuryStatus = 'ACTIVE' | 'DAY_TO_DAY' | 'OUT' | 'QUESTIONABLE' | 'DOUBTFUL' | 'PROBABLE';

export type MarketStatus = 'OFFERED' | 'NOT_OFFERED' | 'SUSPENDED' | 'UNAVAILABLE';

export type PlayerRole = 'Starter' | 'Bench' | 'Reserve';

export type GamePeriodStatus =
  | 'SCHEDULED'
  | 'PRE_GAME'
  | 'Q1_IN_PROGRESS'
  | 'Q1_COMPLETED'
  | 'HALFTIME'
  | 'Q3_IN_PROGRESS'
  | 'Q4_IN_PROGRESS'
  | 'FINAL'
  | 'POSTPONED';

export interface NBAPlayerProfile {
  id: string; // ESPN or NBA ID
  name: string;
  team: string; // Abbreviation e.g. 'DAL', 'BOS'
  teamId?: string; // ESPN team ID e.g. '24'
  teamName: string; // Full name e.g. 'Dallas Mavericks'
  position: string; // 'PG', 'SG', 'SF', 'PF', 'C'
  jersey: string;
  role?: PlayerRole;
  isStarter: boolean;
  expectedMinutes: number;
  seasonPpg: number;
  seasonMinutes: number;
  last5Ppg: number;
  last10Ppg: number;
  last5Minutes: number;
  last10Minutes: number;
  q1Ppg: number; // Historical average points in Q1
  q1Minutes: number; // Historical average minutes in Q1
  fgaPer36: number;
  threePaPer36: number;
  ftaPer36: number;
  usageRate: number; // %
  trueShootingPct: number; // %
  injuryStatus: InjuryStatus;
  injuryNote?: string;
  homeSplitPpg?: number;
  awaySplitPpg?: number;
  restDays?: number;
  headshotUrl?: string;
}

export interface PlayerPropsMarket {
  marketId: string;
  gameId: string;
  playerId: string;
  playerName: string;
  team: string;
  teamId?: string;
  opponent: string;
  gameStartTime: string;
  marketStatus: MarketStatus;
  role?: PlayerRole;
  line: number | null; // e.g. 24.5 or null when not offered
  overOdds: string; // e.g. "-115" or "—"
  underOdds: string; // e.g. "-105" or "—"
  overDecimalOdds: number; // e.g. 1.870 or 0
  underDecimalOdds: number; // e.g. 1.952 or 0
  sportsbook: string; // 'DraftKings' | 'FanDuel' | 'The Odds API' | 'Consensus'
  timestamp: string;
  lastUpdated: string;
  lineMovement?: 'UP' | 'DOWN' | 'UNCHANGED';
  previousLine?: number;
  alternateLines?: Array<{
    line: number;
    overOdds: string;
    underOdds: string;
  }>;
  isSuspended?: boolean;
}

export interface PlayerPropsForecast {
  marketId: string;
  gameId: string;
  playerId: string;
  playerName: string;
  team: string;
  teamId?: string;
  opponent: string;
  gameStartTime: string;
  marketStatus: MarketStatus;
  role: PlayerRole;
  isStarter: boolean;
  pointsLine: number | null;
  overOdds: string;
  underOdds: string;
  overDecimal: number;
  underDecimal: number;
  headshotUrl?: string;
  
  // Market Implied (No-Vig)
  marketImpliedOver: number; // Raw implied (includes vig)
  marketImpliedUnder: number;
  noVigImpliedOver: number; // Fair no-vig probability (0 - 1)
  noVigImpliedUnder: number;
  overround: number; // Sportsbook margin %

  // Model Projections
  modelProjectedPoints: number; // Expected final points
  modelStdDev: number; // Scoring uncertainty (sigma)
  modelProbOver: number; // Probability points > line
  modelProbUnder: number; // Probability points < line
  modelProbPush: number; // Probability points === line (for integer lines)
  
  // Edges
  pointsDifference: number; // modelProjectedPoints - pointsLine (0 if unoffered)
  probabilityEdgeOver: number; // (modelProbOver - noVigImpliedOver) * 100
  probabilityEdgeUnder: number; // (modelProbUnder - noVigImpliedUnder) * 100
  evOver: number; // (modelProbOver * overDecimal - 1) * 100
  evUnder: number; // (modelProbUnder * underDecimal - 1) * 100

  // Decision & Recommendations
  recommendation: PropRecommendation;
  recommendationEdge: number; // Probability edge of recommended side
  recommendationEv: number; // EV% of recommended side
  confidenceScore: number; // 0 - 100
  starRating: number; // 1 - 5 stars
  dataFreshness: 'LIVE' | 'RECENT' | 'STALE' | 'CACHED';
  dataQuality: 'VERIFIED' | 'PRELIMINARY' | 'INSUFFICIENT';

  // 1st Quarter Baseline
  expectedQ1Points: number;
  expectedQ1Minutes: number;

  // Credible interval (80% range)
  confidenceInterval80: [number, number];

  // Explanatory Factor Summary
  keyNarrative: string;
  factors: {
    minutesFactor: string;
    recencyFactor: string;
    matchupFactor: string;
    restFactor: string;
    q1Baseline: string;
  };
}

export interface RosterCoverageMetrics {
  scheduledGames: number;
  processedGames: number;
  totalTeams: number;
  totalRosterPlayers: number;
  startersCount: number;
  benchCount: number;
  playersWithMarkets: number;
  playersWithoutMarkets: number;
  validProjections: number;
  lastSyncTime: string;
}

export interface ScheduledGameWithRosters {
  id: string; // canonical game ID
  date: string; // YYYY-MM-DD
  time: string; // "7:30 PM ET"
  status: string; // "Scheduled" | "Live" | "Final"
  venue?: string;
  awayTeam: {
    id: string;
    name: string;
    abbreviation: string;
    logo?: string;
    record?: string;
    starters: PlayerPropsForecast[];
    bench: PlayerPropsForecast[];
    allPlayers: PlayerPropsForecast[];
  };
  homeTeam: {
    id: string;
    name: string;
    abbreviation: string;
    logo?: string;
    record?: string;
    starters: PlayerPropsForecast[];
    bench: PlayerPropsForecast[];
    allPlayers: PlayerPropsForecast[];
  };
  totalPlayers: number;
  marketsAvailableCount: number;
}

export interface FirstQuarterPlayerStats {
  playerId: string;
  playerName: string;
  gameId: string;
  team: string;
  opponent: string;
  
  // Actual Q1 Boxscore
  actualQ1Points: number;
  actualQ1Minutes: number;
  actualQ1Fgm: number;
  actualQ1Fga: number;
  actualQ13pm: number;
  actualQ13pa: number;
  actualQ1Ftm: number;
  actualQ1Fta: number;
  actualQ1Fouls: number;
  
  // Pre-Game Expectations
  preGameExpectedQ1Points: number;
  preGameExpectedQ1Minutes: number;
  preGameProjectedFinalPoints: number;
  
  // Early Variances
  pointsDifferenceQ1: number; // actualQ1Points - preGameExpectedQ1Points
  minutesDifferenceQ1: number;
  actualShotEfficiency: number; // FG%
  isHotHandVariance: boolean; // Shot efficiency > 75% on low volume
  isVolumeExpansion: boolean; // FGA pace significantly above baseline

  // Updated Projections Post-Q1
  expectedRemainingMinutes: number;
  updatedProjectedFinalPoints: number;
  currentPointsLine: number | null;
  updatedProbOver: number;
  updatedProbUnder: number;
  probOverChangeSinceTip: number; // updatedProbOver - preGameProbOver
  probUnderChangeSinceTip: number;

  // Scanner Signals
  updatedRecommendation: PropRecommendation;
  updatedEdge: number;
  scannerTag?: 'STRONGEST_OVER' | 'STRONGEST_UNDER' | 'BIG_OVER_SURGE' | 'BIG_UNDER_SURGE' | 'ROLE_EXPANSION' | 'FOUL_RISK' | 'NEUTRAL';
  scannerSummary: string;
}

export interface EarlyEdgeScannerReport {
  gameId: string;
  matchup: string;
  gameState: GamePeriodStatus;
  gameClock?: string;
  awayScore?: number;
  homeScore?: number;
  players: FirstQuarterPlayerStats[];
  strongestOver?: FirstQuarterPlayerStats;
  strongestUnder?: FirstQuarterPlayerStats;
  topOverMover?: FirstQuarterPlayerStats;
  topUnderMover?: FirstQuarterPlayerStats;
}

export interface PlayerGameLog {
  gameId: string;
  date: string;
  opponent: string;
  isHome: boolean;
  minutes: number;
  points: number;
  q1Points: number;
  q1Minutes: number;
  fgm: number;
  fga: number;
  threePm: number;
  threePa: number;
  ftm: number;
  fta: number;
  plusMinus: number;
  result: 'W' | 'L';
  teamScore: number;
  oppScore: number;
}

export interface HistoricalPropsValidationResult {
  totalEvaluatedProps: number;
  preGameMae: number; // Mean Absolute Error
  postQ1Mae: number;
  baselineSeasonMae: number;
  preGameRmse: number;
  postQ1Rmse: number;
  brierScoreOver: number;
  brierScoreUnder: number;
  overallWinRate: number; // %
  overallRoi: number; // %
  preGameVsPostQ1ImprovementPct: number;
  resultsByEdgeTier: Array<{
    tier: string; // e.g. "Edge >= 7%", "Edge 5-7%"
    propsCount: number;
    winRate: number;
    roi: number;
    profitUnits: number;
  }>;
  calibrationBuckets: Array<{
    predictedBin: string; // "50-60%", "60-70%"
    avgPredictedProb: number;
    observedWinRate: number;
    sampleSize: number;
  }>;
}

export interface SportsbookProviderStatus {
  providerName: string;
  isConfigured: boolean;
  status: 'ONLINE' | 'AWAITING_MARKETS' | 'RATE_LIMITED' | 'UNCONFIGURED' | 'ERROR';
  lastSyncTime: string | null;
  activeGamesWithMarkets: number;
  totalMarketsAvailable: number;
  remainingDailyRequests?: number;
  statusMessage: string;
}
