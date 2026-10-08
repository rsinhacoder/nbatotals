export interface NBAGame {
  id: string;
  date: string;
  season: string;
  seasonType: 'Preseason' | 'Regular Season' | 'Other';
  awayTeam: string;
  homeTeam: string;
  awayScore: number;
  homeScore: number;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  lowestQuarter: number;
  lowestQuarterNumber: string; // 'Q1', 'Q2', etc.
  highestQuarter: number;
  highestQuarterNumber: string;
  regulationTotal: number;
  otherThreeQuarters: number;
  overtimePoints: number;
  finalTotal: number;
  lowestUnder47: boolean;
  regulationUnder219: boolean;
  
  // Model Calculations
  modelPredictedRegulationTotal: number;
  modelPredictedOther3: number;
  modelError: number;
  absoluteModelError: number;
  other3Error: number;
  absoluteOther3Error: number;
  
  // Accuracy
  within5: boolean;
  within10: boolean;
  within15: boolean;
  withinHistoricalMAE: boolean;
  forecastResult: 'SUCCESS' | 'FAILURE';
  
  // Reference comparison
  referenceTotal?: number | null;
  modelMinusReference?: number | null;
  referenceComparison?: 'CLOSE' | 'LARGE GAP' | 'NO REFERENCE';
  
  // Lowest Quarter Bucket
  lowestBucket: string;
}

export interface UpcomingMatch {
  id: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Live' | 'Final' | 'Delayed';
  awayTeam: string;
  homeTeam: string;
  awayRecord: string;
  homeRecord: string;
  sportsbookLine: number; // Opening or Current Consensus Over/Under line
  projectedLowestQuarter: number;
  modelProjectedTotal: number;
  modelProjectedOther3: number;
  edge: number; // modelProjectedTotal - sportsbookLine
  recommendation: 'STRONG UNDER' | 'LEAN UNDER' | 'MARKET ALIGNED' | 'LEAN OVER' | 'STRONG OVER';
  confidenceScore: number; // 0 - 100
  lowestUnder47Probability: number; // %
  under219Probability: number; // %
  keyNarrative: string;
  liveQuarterScores?: {
    q1?: number;
    q2?: number;
    q3?: number;
    q4?: number;
  };
}

export interface TrackedBet {
  id: string;
  matchId: string;
  date: string;
  matchup: string;
  pickType: 'UNDER' | 'OVER';
  targetLine: number;
  modelProjection: number;
  edge: number;
  units: number;
  odds: string; // e.g. "-110" or "1.91"
  status: 'PENDING' | 'WON' | 'LOST' | 'PUSH';
  actualTotal?: number;
  notes?: string;
  timestamp: string;
}

export interface BucketStat {
  bucket: string;
  games: number;
  avgLowestQuarter: number;
  avgRegulationTotal: number;
  avgOther3Quarters: number;
  avgHighestQuarter: number;
  avgModelError: number;
}

export interface SeasonTypeStat {
  seasonType: string;
  games: number;
  avgLowestQuarter: number;
  avgHighestQuarter: number;
  avgRegulationTotal: number;
  avgFinalTotal: number;
  under219Count: number;
  lowestUnder47Count: number;
}

export interface DashboardMetrics {
  season: string;
  dataUpdated: string;
  totalGames: number;
  preseasonGames: number;
  regularGames: number;
  referenceCount: number;
  avgLowestQuarter: number;
  avgHighestQuarter: number;
  avgRegulationTotal: number;
  avgFinalTotal: number;
  modelIntercept: number;
  modelSlope: number;
  rSquared: number;
  mae: number;
  rmse: number;
  within5Pct: number;
  within10Pct: number;
  within15Pct: number;
  withinHistoricalMaePct: number;
  forecastSuccessRate: number;
  lowestUnder47: number;
  lowest47OrMore: number;
  lowestUnder47Pct: number;
  lowest47OrMorePct: number;
  under219: number;
  atLeast219: number;
  under219Pct: number;
  atLeast219Pct: number;
  under219LowestUnder47: number;
  under219Lowest47OrMore: number;
  under219Ratio: number;
}

export interface ReferenceMap {
  [gameId: string]: number;
}
