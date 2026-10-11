export type PickOutcome = 'WON' | 'LOST' | 'PUSH' | 'SUCCESS' | 'FAILURE';

export interface GradedModelPick {
  id: string;
  sport: 'NBA' | 'NHL' | 'KHL';
  date: string; // YYYY-MM-DD
  time?: string;
  matchup: string; // e.g. "New York Knicks @ Boston Celtics"
  awayTeam: string;
  homeTeam: string;
  awayAbbrev: string;
  homeAbbrev: string;
  awayLogo?: string;
  homeLogo?: string;

  // Model Pick Definition
  marketCategory: 'TOTAL' | 'SPREAD' | 'MONEYLINE' | 'SOG' | '1ST_PERIOD';
  marketName: string; // e.g. "UNDER 224.5", "Over 5.5 Goals", "CAR -1.5 Puckline", "Over 61.5 SOG"
  pickName?: string;
  sportsbookLine: string; // e.g. "224.5", "5.5", "-1.5", "61.5"
  sportsbookOdds: string; // e.g. "-110", "+142", "-125"
  decimalOdds: number; // e.g. 1.91, 2.42

  // Season & Explicit Pick Target Value
  season?: '2026-27' | '2024-25';
  modelPickValue?: string; // e.g. "UNDER 224.5 Pts", "OVER 5.5 Goals", "CAR -1.5 Puckline", "OVER 61.5 SOG"

  // Model Prediction at Game Time
  modelProjection: number; // Projected points, goals, or shots
  modelWinProb: number; // e.g. 0.584 (58.4%)
  edgePercent: number; // EV% or Point Edge
  pointOrGoalEdge?: number; // e.g. +7.4 pts or +0.8 goals
  confidence: 'HIGH' | 'MEDIUM' | 'LEAN';
  starRating: 1 | 2 | 3 | 4 | 5;

  // Actual Game Outcome & Box Score After Game
  actualScoreText?: string; // e.g. "107 - 105 (Total: 212 Pts)" or "2 - 1 (Total: 3 Goals)"
  currentValue?: string; // For backward compatibility
  valueDifferential?: string; // e.g. "+8.5 pts buffer (Under covered)", "-1.5 goals deficit"
  awayScore: number;
  homeScore: number;
  actualTotal: number;
  actualShots?: { away: number; home: number; total: number };
  actual1PScore?: { away: number; home: number; total: number };

  // Grading & Correctness
  outcome: PickOutcome;
  correctness?: 'SUCCESS' | 'FAILURE' | 'PUSH';
  unitsStaked: number; // 1.0 or 2.0
  profitUnits: number; // Net PnL in units (e.g. +0.91 or -1.00)
  closingLineValue?: string; // CLV e.g. "+1.5 pts" or "+0.5 goals"
  analysisRecap: string;
}

export interface SeasonPerformanceMetrics {
  totalPicks: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number; // Win % excluding pushes
  totalProfitUnits: number; // Net profit
  roi: number; // ROI %
  avgOdds: string;
  highEdgePicks: number;
  highEdgeWinRate: number;
  highEdgeProfitUnits: number;
}
