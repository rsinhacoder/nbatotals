export type NHLMarketType = 
  | 'TOTAL_OVER' 
  | 'TOTAL_UNDER' 
  | 'PUCKLINE_HOME' 
  | 'PUCKLINE_AWAY' 
  | 'MONEYLINE_HOME' 
  | 'MONEYLINE_AWAY' 
  | 'REGULATION_HOME' 
  | 'REGULATION_AWAY' 
  | 'REGULATION_DRAW'
  | 'P1_OVER' 
  | 'P1_UNDER'
  | 'SOG_TOTAL_OVER'
  | 'SOG_TOTAL_UNDER'
  | 'FACEOFFS_TOTAL';

export interface NHLMarketEdge {
  marketType: NHLMarketType;
  marketName: string; // e.g. "Over 5.5", "CAR -1.5", "Home ML", "1st Period Over 1.5", "Over 61.5 SOG"
  sportsbookLine: string; // e.g. "5.5", "-1.5", "+150", "61.5"
  sportsbookOdds: string; // American odds: "-110", "+145", etc.
  sportsbookDecimalOdds: number; // e.g. 1.91, 2.45
  modelProbability: number; // e.g. 0.582 (58.2%)
  sportsbookImpliedProb: number; // e.g. 0.524 (52.4%)
  edgePercent: number; // EV%: (modelProb * decimalOdds - 1) * 100, e.g. +7.4%
  pointOrGoalEdge?: number; // Model Total - Sportsbook Line, e.g. +0.45 goals or +2.1 SOG
  confidence: 'HIGH' | 'MEDIUM' | 'LEAN' | 'AVOID';
  starRating: 1 | 2 | 3 | 4 | 5;
  recommended: boolean;
  isModelFavored?: boolean; // Model probability >= 50% (model believes this outcome will hit)
}

export interface NHLStartingGoalie {
  name: string;
  confirmed: boolean; // Confirmed vs Projected
  savePct: number; // e.g. 0.915
  goalsAgainstAvg: number; // e.g. 2.45
  gsax60: number; // Goals Saved Above Expected per 60 mins (+0.35 = elite, -0.20 = poor)
  record: string; // e.g. "28-14-4"
}

export interface NHLTeamMetrics {
  id: string;
  name: string;
  abbreviation: string;
  city: string;
  conference: 'Eastern' | 'Western';
  division: 'Atlantic' | 'Metropolitan' | 'Central' | 'Pacific';
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  
  // 5-Season & Baseline Metrics
  fiveSeasonGPG: number; // Goals For per game
  fiveSeasonGAPG: number; // Goals Against per game
  fiveSeasonHomeGPG: number;
  fiveSeasonRoadGPG: number;
  fiveSeasonHomeGAPG: number;
  fiveSeasonRoadGAPG: number;
  fiveSeasonWinPct: number;
  fiveSeasonOTPct: number;

  // Advanced xG & Special Teams Metrics (per 60 mins)
  xgf60: number; // 5v5 Expected Goals For / 60
  xga60: number; // 5v5 Expected Goals Against / 60
  corsifPct: number; // Corsi For % (shot share)
  powerPlayPct: number; // Power Play % (e.g. 23.5%)
  penaltyKillPct: number; // Penalty Kill % (e.g. 81.2%)
  shotsFor60: number; // Shots on goal / 60
  shotsAgainst60: number;

  // Faceoffs Metrics
  faceoffWinPct: number; // 5-season Faceoff Win % (e.g. 52.4%)
  faceoffsPerGame: number; // Total draws per game (e.g. 58.5)
  offZoneFaceoffPct: number; // Offensive zone FO%

  // Goalies
  primaryGoalie: NHLStartingGoalie;
  backupGoalie: NHLStartingGoalie;
}

export interface NHLUpcomingMatch {
  id: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Live' | 'Final' | 'Delayed';
  awayTeam: string;
  homeTeam: string;
  awayAbbrev: string;
  homeAbbrev: string;
  awayRecord: string;
  homeRecord: string;
  venue: string;
  
  // Starting Goalies
  awayGoalie: NHLStartingGoalie;
  homeGoalie: NHLStartingGoalie;
  
  // Rest / B2B situation
  awayRestDays: number; // 0 = Back-to-Back
  homeRestDays: number;
  
  // Sportsbook Market Lines
  sportsbookTotal: number; // e.g. 5.5, 6.0, 6.5
  totalOverOdds: string; // e.g. "-115"
  totalUnderOdds: string; // e.g. "-105"
  sportsbookSpread: number; // Home puckline, e.g. -1.5 or +1.5
  spreadHomeOdds: string; // e.g. "+145"
  spreadAwayOdds: string; // e.g. "-175"
  moneylineHome: string; // e.g. "-160"
  moneylineAway: string; // e.g. "+135"

  // Model Goal Projections
  modelProjectedHomeGoals: number; // Lambda Home
  modelProjectedAwayGoals: number; // Lambda Away
  modelProjectedTotal: number; // Total Expected Goals
  goalEdge: number; // modelProjectedTotal - sportsbookTotal
  
  // Shots on Goal (SOG) Projections & Markets
  projectedHomeShots: number; // e.g. 32.4
  projectedAwayShots: number; // e.g. 28.8
  projectedTotalShots: number; // e.g. 61.2
  sportsbookShotsTotal: number; // e.g. 60.5 or 61.5
  shotsEdge: number; // projectedTotalShots - sportsbookShotsTotal
  
  // Faceoffs Projections
  projectedTotalFaceoffs: number; // e.g. 58.4
  projectedHomeFaceoffWinPct: number; // e.g. 52.6%
  projectedAwayFaceoffWinPct: number; // e.g. 47.4%
  projectedHomeFaceoffsWon: number;
  projectedAwayFaceoffsWon: number;

  // Probabilities
  probOver5_5: number;
  probUnder5_5: number;
  probOver6_0: number;
  probUnder6_0: number;
  probPush6_0: number;
  probOver6_5: number;
  probUnder6_5: number;
  probHomeWinRegulation: number;
  probAwayWinRegulation: number;
  probRegulationDraw: number;
  probHomeWinFullGame: number;
  probAwayWinFullGame: number;
  probHomeCoverSpread: number; // Home -1.5 (or +1.5 if dog)
  probAwayCoverSpread: number;
  prob1POver1_5: number;
  prob1PUnder1_5: number;

  // Highest Edge Market & All Evaluated Markets
  highestEdgeMarket: NHLMarketEdge;
  allMarketEdges: NHLMarketEdge[];

  // Analytical Context / Narrative
  keyAngle: string;
  factors: {
    xgFactor: string;
    goalieFactor: string;
    specialTeamsFactor: string;
    fatigueFactor: string;
    sogAndFaceoffsFactor: string;
  };
}

export interface NHLSeasonSummary {
  season: string;
  games: number;
  goalsPerGame: number;
  homeGPG: number;
  roadGPG: number;
  homeWinPct: number;
  otPct: number;
  over5_5Pct: number;
  over6_0Pct: number;
  push6_0Pct: number;
  over6_5Pct: number;
  oneGoalMarginPct: number;
  twoGoalMarginPct: number;
  p1Over1_5Pct: number;
  avgShotsPerGame: number;
  avgFaceoffsPerGame: number;
  leagueShootingPct: number;
}
