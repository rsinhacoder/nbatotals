export type KHLMarketType =
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

export interface KHLMarketEdge {
  marketType: KHLMarketType;
  marketName: string; // e.g. "Under 5.0", "SKA -1.5", "Regulation Draw", "Over 58.5 SOG"
  sportsbookLine: string; // e.g. "5.0", "-1.5", "+280", "58.5"
  sportsbookOdds: string; // American odds: "-110", "+145", etc.
  sportsbookDecimalOdds: number; // e.g. 1.91, 3.80
  modelProbability: number; // e.g. 0.582 (58.2%)
  sportsbookImpliedProb: number; // e.g. 0.524 (52.4%)
  edgePercent: number; // EV%: (modelProb * decimalOdds - 1) * 100, e.g. +8.2%
  pointOrGoalEdge?: number; // Model Total - Sportsbook Line, e.g. -0.52 goals
  confidence: 'HIGH' | 'MEDIUM' | 'LEAN' | 'AVOID';
  starRating: 1 | 2 | 3 | 4 | 5;
  recommended: boolean;
  isModelFavored?: boolean;
  fairOdds?: string;
  recommendedUnits?: number;
}

export interface KHLStartingGoalie {
  name: string;
  confirmed: boolean;
  savePct: number; // e.g. 0.928
  goalsAgainstAvg: number; // e.g. 2.12
  gaa?: number;
  gsax60: number; // Goals Saved Above Expected per 60 mins
  record: string; // e.g. "24-11-3"
  status?: string;
}

export interface KHLTeamMetrics {
  id: string;
  name: string;
  abbreviation: string;
  city: string;
  country: string; // Russia, Belarus, Kazakhstan, China
  conference: 'Western' | 'Eastern';
  division: 'Bobrov' | 'Tarasov' | 'Kharlamov' | 'Chernyshev';
  logo: string;
  primaryColor: string;
  secondaryColor: string;

  // 5-Season Historical Baselines (2021-2026)
  fiveSeasonGPG: number; // Goals For per game (~2.3 to 3.2)
  fiveSeasonGAPG: number; // Goals Against per game (~1.9 to 3.4)
  fiveSeasonHomeGPG: number;
  fiveSeasonRoadGPG: number;
  fiveSeasonHomeGAPG: number;
  fiveSeasonRoadGAPG: number;
  fiveSeasonWinPct: number;
  fiveSeasonOTPct: number; // Regulation draw % (~22-26%)

  // Advanced xG & Special Teams Metrics (per 60 mins)
  xgf60: number; // 5v5 Expected Goals For / 60
  xga60: number; // 5v5 Expected Goals Against / 60
  corsifPct: number; // Corsi For %
  powerPlayPct: number; // e.g. 21.4%
  penaltyKillPct: number; // e.g. 83.2%
  shotsFor60: number; // Shots on goal / 60 (~28-33)
  shotsAgainst60: number;

  // Faceoffs Metrics
  faceoffWinPct: number; // Faceoff Win %
  faceoffsPerGame: number; // Total draws per game (~54-58)
  offZoneFaceoffPct: number;

  // Travel & Distance Factor (Far East trips to Khabarovsk/Vladivostok across 7-8 time zones)
  travelFatigueTier: 'NORMAL' | 'HIGH' | 'EXTREME_FAR_EAST';

  // Goalies
  primaryGoalie: KHLStartingGoalie;
  backupGoalie: KHLStartingGoalie;
}

export interface KHLUpcomingMatch {
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
  city: string;

  // Starting Goalies
  awayGoalie: KHLStartingGoalie;
  homeGoalie: KHLStartingGoalie;

  // Rest & Travel Situations
  awayRestDays: number;
  homeRestDays: number;
  isFarEastTravel: boolean; // Flag for flights across 7+ time zones (e.g. Moscow to Vladivostok)

  // Sportsbook Market Lines
  sportsbookTotal: number; // e.g. 4.5, 5.0, 5.5
  totalOverOdds: string;
  totalUnderOdds: string;
  sportsbookSpread: number; // Home puckline, e.g. -1.5 or +1.5
  spreadHomeOdds: string;
  spreadAwayOdds: string;
  moneylineHome: string; // 2-way ML
  moneylineAway: string;
  regulationHomeOdds?: string; // 3-way 60 min regulation
  regulationDrawOdds?: string;
  regulationAwayOdds?: string;

  // Model Goal Projections (Poisson Lambdas)
  modelProjectedHomeGoals: number;
  modelProjectedAwayGoals: number;
  modelProjectedTotal: number;
  goalEdge: number;

  // Shots on Goal (SOG)
  projectedHomeShots: number;
  projectedAwayShots: number;
  projectedTotalShots: number;
  sportsbookShotsTotal: number;
  shotsEdge: number;

  // Faceoffs
  projectedTotalFaceoffs: number;
  projectedHomeFaceoffWinPct: number;
  projectedAwayFaceoffWinPct: number;

  // Exact Probabilities
  probOver4_5: number;
  probUnder4_5: number;
  probOver5_0: number;
  probUnder5_0: number;
  probPush5_0: number;
  probOver5_5: number;
  probUnder5_5: number;
  probHomeWinRegulation: number;
  probAwayWinRegulation: number;
  probRegulationDraw: number;
  probHomeWinFullGame: number;
  probAwayWinFullGame: number;
  probHomeCoverSpread: number;
  probAwayCoverSpread: number;
  prob1POver1_5: number;
  prob1PUnder1_5: number;

  // Highest Edge Market & All Evaluated Markets
  highestEdgeMarket: KHLMarketEdge;
  allMarketEdges: KHLMarketEdge[];

  // Analytical Context / Narrative
  keyAngle: string;
  factors: {
    xgFactor: string;
    goalieFactor: string;
    specialTeamsFactor: string;
    travelAndFatigueFactor: string;
    sogFactor: string;
  };
}

export interface KHLSeasonSummary {
  season: string;
  games: number;
  goalsPerGame: number;
  homeGPG: number;
  roadGPG: number;
  homeWinPct: number;
  otPct: number; // Regulation Draw rate
  over4_5Pct: number;
  over5_0Pct: number;
  push5_0Pct: number;
  over5_5Pct: number;
  under5_5Pct: number;
  oneGoalMarginPct: number;
  avgShotsPerGame: number;
  avgFaceoffsPerGame: number;
  farEastVisitingWinPct: number; // Win % of visiting teams in Vladivostok/Khabarovsk
}
