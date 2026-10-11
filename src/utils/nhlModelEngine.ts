import type {
  NHLMarketEdge,
  NHLMarketType,
  NHLStartingGoalie,
  NHLUpcomingMatch,
} from '../types/nhl';
import { getNHLTeamProfile } from '../data/nhlTeamProfiles';
import { NHL_5_SEASON_AGGREGATE } from '../data/nhlHistoricalData';

// Poisson Probability Calculation
function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

export function poissonProbability(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

// Odds Conversion Utilities
export function americanToDecimal(american: string | number): number {
  const num = typeof american === 'string' ? parseFloat(american.replace('+', '')) : american;
  if (isNaN(num) || num === 0) return 2.0;
  if (num > 0) return Number((1 + num / 100).toFixed(3));
  return Number((1 + 100 / Math.abs(num)).toFixed(3));
}

export function decimalToAmerican(decimal: number): string {
  if (decimal <= 1.0) return '-10000';
  if (decimal >= 2.0) {
    const us = Math.round((decimal - 1) * 100);
    return `+${us}`;
  }
  const us = Math.round(-100 / (decimal - 1));
  return `${us}`;
}

export function americanToImpliedProb(american: string | number): number {
  const dec = americanToDecimal(american);
  return Number((1 / dec).toFixed(4));
}

export interface NHLModelParameters {
  homeTeam: string;
  awayTeam: string;
  homeGoalie?: NHLStartingGoalie;
  awayGoalie?: NHLStartingGoalie;
  homeRestDays?: number; // 0 = B2B
  awayRestDays?: number;
  sportsbookTotal?: number;
  totalOverOdds?: string;
  totalUnderOdds?: string;
  sportsbookSpread?: number;
  spreadHomeOdds?: string;
  spreadAwayOdds?: string;
  moneylineHome?: string;
  moneylineAway?: string;
}

export function runNHLForecastingModel(params: NHLModelParameters) {
  const homeProf = getNHLTeamProfile(params.homeTeam);
  const awayProf = getNHLTeamProfile(params.awayTeam);

  const homeGoalie = params.homeGoalie || homeProf.primaryGoalie;
  const awayGoalie = params.awayGoalie || awayProf.primaryGoalie;

  const homeRest = params.homeRestDays !== undefined ? params.homeRestDays : 1;
  const awayRest = params.awayRestDays !== undefined ? params.awayRestDays : 1;

  const leagueHomeAvg = NHL_5_SEASON_AGGREGATE.homeGPG; // 3.21
  const leagueRoadAvg = NHL_5_SEASON_AGGREGATE.roadGPG; // 2.97
  const leagueTotalAvg = NHL_5_SEASON_AGGREGATE.avgGoalsPerGame; // 6.18

  // 1. 5v5 Expected Goals & Shot Generation Ratios
  const homeOffenseRatio = homeProf.xgf60 / (leagueTotalAvg / 2);
  const homeDefenseRatio = homeProf.xga60 / (leagueTotalAvg / 2);
  const awayOffenseRatio = awayProf.xgf60 / (leagueTotalAvg / 2);
  const awayDefenseRatio = awayProf.xga60 / (leagueTotalAvg / 2);

  // 2. Goaltending Adjustments (Goals Saved Above Expected & SV%)
  // Baseline league SV% is ~0.902. Elite goalies save ~0.35+ goals/60.
  const awayGoalieSuppression = Math.max(-0.45, Math.min(0.45, awayGoalie.gsax60 * 0.75));
  const homeGoalieSuppression = Math.max(-0.45, Math.min(0.45, homeGoalie.gsax60 * 0.75));

  // 3. Special Teams Net Rating (Power Play % vs Penalty Kill %)
  // Average PP is ~21%, average PK is ~79%.
  const homeSpecialTeamsNet = (homeProf.powerPlayPct - (100 - awayProf.penaltyKillPct)) * 0.012;
  const awaySpecialTeamsNet = (awayProf.powerPlayPct - (100 - homeProf.penaltyKillPct)) * 0.012;

  // 4. Rest & Back-to-Back (B2B) Fatigue Multipliers
  let homeRestMod = 0;
  if (homeRest === 0) homeRestMod = -0.16; // Concede more, score less
  let awayRestMod = 0;
  if (awayRest === 0) awayRestMod = -0.18;

  // Calculate Base Expected Goals (Lambda) for each team
  let lambdaHome =
    leagueHomeAvg *
    (homeOffenseRatio * 0.55 + 0.45) *
    (awayDefenseRatio * 0.55 + 0.45) -
    awayGoalieSuppression +
    homeSpecialTeamsNet +
    homeRestMod;

  let lambdaAway =
    leagueRoadAvg *
    (awayOffenseRatio * 0.55 + 0.45) *
    (homeDefenseRatio * 0.55 + 0.45) -
    homeGoalieSuppression +
    awaySpecialTeamsNet +
    awayRestMod;

  // Clamp within realistic NHL expectations (1.6 to 4.8 goals)
  lambdaHome = Math.max(1.65, Math.min(4.85, Number(lambdaHome.toFixed(2))));
  lambdaAway = Math.max(1.45, Math.min(4.65, Number(lambdaAway.toFixed(2))));

  const modelProjectedTotal = Number((lambdaHome + lambdaAway).toFixed(2));

  // 5. Build Bivariate Poisson Score Matrix (10x10)
  const maxGoals = 9;
  const scoreMatrix: number[][] = [];
  let sumProb = 0;

  for (let h = 0; h <= maxGoals; h++) {
    scoreMatrix[h] = [];
    for (let a = 0; a <= maxGoals; a++) {
      const p = poissonProbability(h, lambdaHome) * poissonProbability(a, lambdaAway);
      scoreMatrix[h][a] = p;
      sumProb += p;
    }
  }

  // Normalize matrix so probabilities sum to 1.0
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      scoreMatrix[h][a] = scoreMatrix[h][a] / sumProb;
    }
  }

  // Empty-Net Adjustment:
  // In NHL, ~28% of 1-goal leads lead to an empty net goal in the final 2 minutes.
  // This transitions some 1-goal margins (e.g. 3-2) into 2-goal margins (e.g. 4-2).
  let probOver5_5 = 0;
  let probUnder5_5 = 0;
  let probOver6_0 = 0;
  let probUnder6_0 = 0;
  let probPush6_0 = 0;
  let probOver6_5 = 0;
  let probUnder6_5 = 0;

  let probHomeWinReg = 0;
  let probAwayWinReg = 0;
  let probRegDraw = 0;

  let homeMinus1_5 = 0;
  let awayMinus1_5 = 0;

  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const p = scoreMatrix[h][a];
      const tot = h + a;

      if (tot > 5.5) probOver5_5 += p;
      else probUnder5_5 += p;

      if (tot > 6.0) probOver6_0 += p;
      else if (tot === 6.0) probPush6_0 += p;
      else probUnder6_0 += p;

      if (tot > 6.5) probOver6_5 += p;
      else probUnder6_5 += p;

      if (h > a) {
        probHomeWinReg += p;
        if (h - a >= 2) homeMinus1_5 += p;
        else if (h - a === 1) {
          // Empty-net shift: 28% chance of 1-goal win becoming 2-goal win
          homeMinus1_5 += p * 0.28;
        }
      } else if (a > h) {
        probAwayWinReg += p;
        if (a - h >= 2) awayMinus1_5 += p;
        else if (a - h === 1) {
          awayMinus1_5 += p * 0.28;
        }
      } else {
        probRegDraw += p;
      }
    }
  }

  // Full game OT distribution (52% home win in OT/SO)
  const probHomeWinFullGame = probHomeWinReg + probRegDraw * 0.52;
  const probAwayWinFullGame = probAwayWinReg + probRegDraw * 0.48;

  // 1st Period totals (approx 28.2% of total goals occur in 1P)
  const lambda1P = modelProjectedTotal * 0.282;
  const prob1P0 = Math.exp(-lambda1P);
  const prob1P1 = lambda1P * Math.exp(-lambda1P);
  const prob1PUnder1_5 = prob1P0 + prob1P1;
  const prob1POver1_5 = 1 - prob1PUnder1_5;

  // Determine Sportsbook Inputs (with robust defaults if not supplied)
  const sbTotal = params.sportsbookTotal || 6.0;
  const sbOverOdds = params.totalOverOdds || '-110';
  const sbUnderOdds = params.totalUnderOdds || '-110';
  const sbSpreadHomeOdds = params.spreadHomeOdds || '+145';
  const sbSpreadAwayOdds = params.spreadAwayOdds || '-175';
  const sbMLHomeOdds = params.moneylineHome || '-140';
  const sbMLAwayOdds = params.moneylineAway || '+120';

  // 6. Evaluate ALL Markets for Edge & Expected Value (EV%)
  const allMarkets: NHLMarketEdge[] = [];

  // Market 1: Total Over / Under
  const modelProbOver =
    sbTotal === 5.5
      ? probOver5_5
      : sbTotal === 6.5
      ? probOver6_5
      : probOver6_0 / (probOver6_0 + probUnder6_0); // Exclude push for push-void market

  const modelProbUnder =
    sbTotal === 5.5
      ? probUnder5_5
      : sbTotal === 6.5
      ? probUnder6_5
      : probUnder6_0 / (probOver6_0 + probUnder6_0);

  const decOver = americanToDecimal(sbOverOdds);
  const decUnder = americanToDecimal(sbUnderOdds);
  const evOver = Number(((modelProbOver * decOver - 1) * 100).toFixed(2));
  const evUnder = Number(((modelProbUnder * decUnder - 1) * 100).toFixed(2));
  const goalEdge = Number((modelProjectedTotal - sbTotal).toFixed(2));

  allMarkets.push({
    marketType: 'TOTAL_OVER',
    marketName: `Over ${sbTotal} Goals`,
    sportsbookLine: `Over ${sbTotal}`,
    sportsbookOdds: sbOverOdds,
    sportsbookDecimalOdds: decOver,
    modelProbability: Number(modelProbOver.toFixed(3)),
    sportsbookImpliedProb: americanToImpliedProb(sbOverOdds),
    edgePercent: evOver,
    pointOrGoalEdge: goalEdge,
    confidence: evOver >= 7.5 ? 'HIGH' : evOver >= 4.5 ? 'MEDIUM' : evOver >= 1.5 ? 'LEAN' : 'AVOID',
    starRating: evOver >= 8.0 ? 5 : evOver >= 5.5 ? 4 : evOver >= 3.0 ? 3 : evOver >= 1.0 ? 2 : 1,
    recommended: evOver >= 3.5,
  });

  allMarkets.push({
    marketType: 'TOTAL_UNDER',
    marketName: `Under ${sbTotal} Goals`,
    sportsbookLine: `Under ${sbTotal}`,
    sportsbookOdds: sbUnderOdds,
    sportsbookDecimalOdds: decUnder,
    modelProbability: Number(modelProbUnder.toFixed(3)),
    sportsbookImpliedProb: americanToImpliedProb(sbUnderOdds),
    edgePercent: evUnder,
    pointOrGoalEdge: -goalEdge,
    confidence: evUnder >= 7.5 ? 'HIGH' : evUnder >= 4.5 ? 'MEDIUM' : evUnder >= 1.5 ? 'LEAN' : 'AVOID',
    starRating: evUnder >= 8.0 ? 5 : evUnder >= 5.5 ? 4 : evUnder >= 3.0 ? 3 : evUnder >= 1.0 ? 2 : 1,
    recommended: evUnder >= 3.5,
  });

  // Market 2: Puckline Spread (-1.5 / +1.5)
  const decPuckHome = americanToDecimal(sbSpreadHomeOdds);
  const decPuckAway = americanToDecimal(sbSpreadAwayOdds);
  const evPuckHome = Number(((homeMinus1_5 * decPuckHome - 1) * 100).toFixed(2));
  const evPuckAway = Number((((1 - homeMinus1_5) * decPuckAway - 1) * 100).toFixed(2));

  allMarkets.push({
    marketType: 'PUCKLINE_HOME',
    marketName: `${homeProf.abbreviation} -1.5 (Puckline)`,
    sportsbookLine: '-1.5',
    sportsbookOdds: sbSpreadHomeOdds,
    sportsbookDecimalOdds: decPuckHome,
    modelProbability: Number(homeMinus1_5.toFixed(3)),
    sportsbookImpliedProb: americanToImpliedProb(sbSpreadHomeOdds),
    edgePercent: evPuckHome,
    confidence: evPuckHome >= 7.5 ? 'HIGH' : evPuckHome >= 4.5 ? 'MEDIUM' : evPuckHome >= 1.5 ? 'LEAN' : 'AVOID',
    starRating: evPuckHome >= 8.0 ? 5 : evPuckHome >= 5.5 ? 4 : evPuckHome >= 3.0 ? 3 : evPuckHome >= 1.0 ? 2 : 1,
    recommended: evPuckHome >= 3.5,
  });

  allMarkets.push({
    marketType: 'PUCKLINE_AWAY',
    marketName: `${awayProf.abbreviation} +1.5 (Puckline)`,
    sportsbookLine: '+1.5',
    sportsbookOdds: sbSpreadAwayOdds,
    sportsbookDecimalOdds: decPuckAway,
    modelProbability: Number((1 - homeMinus1_5).toFixed(3)),
    sportsbookImpliedProb: americanToImpliedProb(sbSpreadAwayOdds),
    edgePercent: evPuckAway,
    confidence: evPuckAway >= 7.5 ? 'HIGH' : evPuckAway >= 4.5 ? 'MEDIUM' : evPuckAway >= 1.5 ? 'LEAN' : 'AVOID',
    starRating: evPuckAway >= 8.0 ? 5 : evPuckAway >= 5.5 ? 4 : evPuckAway >= 3.0 ? 3 : evPuckAway >= 1.0 ? 2 : 1,
    recommended: evPuckAway >= 3.5,
  });

  // Market 3: Full-Game Moneyline
  const decMLHome = americanToDecimal(sbMLHomeOdds);
  const decMLAway = americanToDecimal(sbMLAwayOdds);
  const evMLHome = Number(((probHomeWinFullGame * decMLHome - 1) * 100).toFixed(2));
  const evMLAway = Number(((probAwayWinFullGame * decMLAway - 1) * 100).toFixed(2));

  allMarkets.push({
    marketType: 'MONEYLINE_HOME',
    marketName: `${homeProf.abbreviation} Moneyline`,
    sportsbookLine: 'ML',
    sportsbookOdds: sbMLHomeOdds,
    sportsbookDecimalOdds: decMLHome,
    modelProbability: Number(probHomeWinFullGame.toFixed(3)),
    sportsbookImpliedProb: americanToImpliedProb(sbMLHomeOdds),
    edgePercent: evMLHome,
    confidence: evMLHome >= 7.5 ? 'HIGH' : evMLHome >= 4.5 ? 'MEDIUM' : evMLHome >= 1.5 ? 'LEAN' : 'AVOID',
    starRating: evMLHome >= 8.0 ? 5 : evMLHome >= 5.5 ? 4 : evMLHome >= 3.0 ? 3 : evMLHome >= 1.0 ? 2 : 1,
    recommended: evMLHome >= 3.5,
  });

  allMarkets.push({
    marketType: 'MONEYLINE_AWAY',
    marketName: `${awayProf.abbreviation} Moneyline`,
    sportsbookLine: 'ML',
    sportsbookOdds: sbMLAwayOdds,
    sportsbookDecimalOdds: decMLAway,
    modelProbability: Number(probAwayWinFullGame.toFixed(3)),
    sportsbookImpliedProb: americanToImpliedProb(sbMLAwayOdds),
    edgePercent: evMLAway,
    confidence: evMLAway >= 7.5 ? 'HIGH' : evMLAway >= 4.5 ? 'MEDIUM' : evMLAway >= 1.5 ? 'LEAN' : 'AVOID',
    starRating: evMLAway >= 8.0 ? 5 : evMLAway >= 5.5 ? 4 : evMLAway >= 3.0 ? 3 : evMLAway >= 1.0 ? 2 : 1,
    recommended: evMLAway >= 3.5,
  });

  // Market 4: 1st Period Over/Under 1.5
  const sb1POverOdds = '-115';
  const sb1PUnderOdds = '-105';
  const dec1POver = americanToDecimal(sb1POverOdds);
  const dec1PUnder = americanToDecimal(sb1PUnderOdds);
  const ev1POver = Number(((prob1POver1_5 * dec1POver - 1) * 100).toFixed(2));
  const ev1PUnder = Number(((prob1PUnder1_5 * dec1PUnder - 1) * 100).toFixed(2));

  allMarkets.push({
    marketType: 'P1_OVER',
    marketName: '1st Period Over 1.5 Goals',
    sportsbookLine: '1P Over 1.5',
    sportsbookOdds: sb1POverOdds,
    sportsbookDecimalOdds: dec1POver,
    modelProbability: Number(prob1POver1_5.toFixed(3)),
    sportsbookImpliedProb: americanToImpliedProb(sb1POverOdds),
    edgePercent: ev1POver,
    confidence: ev1POver >= 7.5 ? 'HIGH' : ev1POver >= 4.5 ? 'MEDIUM' : ev1POver >= 1.5 ? 'LEAN' : 'AVOID',
    starRating: ev1POver >= 8.0 ? 5 : ev1POver >= 5.5 ? 4 : ev1POver >= 3.0 ? 3 : ev1POver >= 1.0 ? 2 : 1,
    recommended: ev1POver >= 3.5,
  });

  allMarkets.push({
    marketType: 'P1_UNDER',
    marketName: '1st Period Under 1.5 Goals',
    sportsbookLine: '1P Under 1.5',
    sportsbookOdds: sb1PUnderOdds,
    sportsbookDecimalOdds: dec1PUnder,
    modelProbability: Number(prob1PUnder1_5.toFixed(3)),
    sportsbookImpliedProb: americanToImpliedProb(sb1PUnderOdds),
    edgePercent: ev1PUnder,
    confidence: ev1PUnder >= 7.5 ? 'HIGH' : ev1PUnder >= 4.5 ? 'MEDIUM' : ev1PUnder >= 1.5 ? 'LEAN' : 'AVOID',
    starRating: ev1PUnder >= 8.0 ? 5 : ev1PUnder >= 5.5 ? 4 : ev1PUnder >= 3.0 ? 3 : ev1PUnder >= 1.0 ? 2 : 1,
    recommended: ev1PUnder >= 3.5,
  });

  // Market 5: 3-Way 60-Minute Regulation Draw (High payout hockey market)
  const drawOdds = '+310';
  const decDraw = americanToDecimal(drawOdds);
  const evDraw = Number(((probRegDraw * decDraw - 1) * 100).toFixed(2));

  allMarkets.push({
    marketType: 'REGULATION_DRAW',
    marketName: '60-Min Regulation Tie (Draw)',
    sportsbookLine: '60m Tie',
    sportsbookOdds: drawOdds,
    sportsbookDecimalOdds: decDraw,
    modelProbability: Number(probRegDraw.toFixed(3)),
    sportsbookImpliedProb: americanToImpliedProb(drawOdds),
    edgePercent: evDraw,
    confidence: evDraw >= 7.5 ? 'HIGH' : evDraw >= 4.5 ? 'MEDIUM' : evDraw >= 1.5 ? 'LEAN' : 'AVOID',
    starRating: evDraw >= 8.0 ? 5 : evDraw >= 5.5 ? 4 : evDraw >= 3.0 ? 3 : evDraw >= 1.0 ? 2 : 1,
    recommended: evDraw >= 4.0,
  });

  // 7. Shots on Goal (SOG) & Total Faceoffs Modeling
  // SOG: Home advantage (+1.2 SOG) + FO% possession leverage
  const homeFoBonus = (homeProf.faceoffWinPct - 50) * 0.12;
  const awayFoBonus = (awayProf.faceoffWinPct - 50) * 0.12;

  let rawHomeShots = (homeProf.shotsFor60 * 0.52 + awayProf.shotsAgainst60 * 0.48) + 1.2 + homeFoBonus;
  let rawAwayShots = (awayProf.shotsFor60 * 0.52 + homeProf.shotsAgainst60 * 0.48) - 0.4 + awayFoBonus;

  // Rest modifier on shots
  if (homeRest === 0) rawHomeShots -= 1.1;
  if (awayRest === 0) rawAwayShots -= 1.2;

  const projectedHomeShots = Number(Math.max(22.0, Math.min(42.0, rawHomeShots)).toFixed(1));
  const projectedAwayShots = Number(Math.max(20.0, Math.min(40.0, rawAwayShots)).toFixed(1));
  const projectedTotalShots = Number((projectedHomeShots + projectedAwayShots).toFixed(1));

  const sportsbookShotsTotal = 61.5;
  const shotsEdge = Number((projectedTotalShots - sportsbookShotsTotal).toFixed(1));

  // Normal CDF approximation for Shots on Goal Total (Std Dev ~ 7.2)
  const sogStdDev = 7.2;
  const sogZ = (sportsbookShotsTotal - projectedTotalShots) / sogStdDev;
  // Error function approximation for Phi(z)
  const phiZ = 1 / (1 + Math.exp(-0.07056 * Math.pow(sogZ, 3) - 1.5976 * sogZ));
  const probSOGUnder = Number(phiZ.toFixed(3));
  const probSOGOver = Number((1 - phiZ).toFixed(3));

  const sbSOGOdds = '-115';
  const decSOG = americanToDecimal(sbSOGOdds);
  const evSOGOver = Number(((probSOGOver * decSOG - 1) * 100).toFixed(2));
  const evSOGUnder = Number(((probSOGUnder * decSOG - 1) * 100).toFixed(2));

  allMarkets.push({
    marketType: 'SOG_TOTAL_OVER',
    marketName: `Over ${sportsbookShotsTotal} Shots on Goal`,
    sportsbookLine: `O ${sportsbookShotsTotal} SOG`,
    sportsbookOdds: sbSOGOdds,
    sportsbookDecimalOdds: decSOG,
    modelProbability: probSOGOver,
    sportsbookImpliedProb: americanToImpliedProb(sbSOGOdds),
    edgePercent: evSOGOver,
    pointOrGoalEdge: shotsEdge,
    confidence: evSOGOver >= 7.5 ? 'HIGH' : evSOGOver >= 4.5 ? 'MEDIUM' : evSOGOver >= 1.5 ? 'LEAN' : 'AVOID',
    starRating: evSOGOver >= 8.0 ? 5 : evSOGOver >= 5.5 ? 4 : evSOGOver >= 3.0 ? 3 : evSOGOver >= 1.0 ? 2 : 1,
    recommended: evSOGOver >= 3.5,
  });

  allMarkets.push({
    marketType: 'SOG_TOTAL_UNDER',
    marketName: `Under ${sportsbookShotsTotal} Shots on Goal`,
    sportsbookLine: `U ${sportsbookShotsTotal} SOG`,
    sportsbookOdds: sbSOGOdds,
    sportsbookDecimalOdds: decSOG,
    modelProbability: probSOGUnder,
    sportsbookImpliedProb: americanToImpliedProb(sbSOGOdds),
    edgePercent: evSOGUnder,
    pointOrGoalEdge: -shotsEdge,
    confidence: evSOGUnder >= 7.5 ? 'HIGH' : evSOGUnder >= 4.5 ? 'MEDIUM' : evSOGUnder >= 1.5 ? 'LEAN' : 'AVOID',
    starRating: evSOGUnder >= 8.0 ? 5 : evSOGUnder >= 5.5 ? 4 : evSOGUnder >= 3.0 ? 3 : evSOGUnder >= 1.0 ? 2 : 1,
    recommended: evSOGUnder >= 3.5,
  });

  // Faceoffs Projections:
  // Baseline ~58.4 faceoffs per game. Pace increases with shot volume & whistles
  const projectedTotalFaceoffs = Number(
    Math.max(50.0, Math.min(66.0, 58.4 + (projectedTotalShots - 61.2) * 0.12)).toFixed(1)
  );

  // Home center stick placement advantage adds +1.2% in faceoff win rate
  const homeFOPower = homeProf.faceoffWinPct + 1.2;
  const awayFOPower = awayProf.faceoffWinPct;
  const projectedHomeFaceoffWinPct = Number(((homeFOPower / (homeFOPower + awayFOPower)) * 100).toFixed(1));
  const projectedAwayFaceoffWinPct = Number((100 - projectedHomeFaceoffWinPct).toFixed(1));

  const projectedHomeFaceoffsWon = Number(
    (projectedTotalFaceoffs * (projectedHomeFaceoffWinPct / 100)).toFixed(1)
  );
  const projectedAwayFaceoffsWon = Number(
    (projectedTotalFaceoffs * (projectedAwayFaceoffWinPct / 100)).toFixed(1)
  );

  // Flag isModelFavored (true if model win probability is at least 50%)
  for (const m of allMarkets) {
    m.isModelFavored = m.modelProbability >= 0.50;
  }

  // Filter markets that the model actually believes will be correct (win probability >= 50%)
  const modelFavoredMarkets = allMarkets.filter((m) => m.modelProbability >= 0.50);
  modelFavoredMarkets.sort((a, b) => b.edgePercent - a.edgePercent);

  // Sort all markets by Edge % descending
  allMarkets.sort((a, b) => b.edgePercent - a.edgePercent);

  // Highest edge market that the model believes will be correct (can be of any market: Totals, Puckline, ML, SOG, 1P)
  const highestEdgeMarket =
    modelFavoredMarkets.length > 0 && modelFavoredMarkets[0].edgePercent > 0
      ? modelFavoredMarkets[0]
      : (modelFavoredMarkets[0] || allMarkets[0]);

  // Key narrative context
  let narrative = '';
  if (Math.abs(goalEdge) >= 0.4) {
    narrative = `Model projects ${modelProjectedTotal} total goals vs market line ${sbTotal} (${goalEdge > 0 ? '+' : ''}${goalEdge} goal discrepancy). Strongest value lies on ${highestEdgeMarket.marketName} (${highestEdgeMarket.edgePercent > 0 ? '+' : ''}${highestEdgeMarket.edgePercent}% EV). SOG projected at ${projectedTotalShots} (${projectedHomeShots}-${projectedAwayShots}).`;
  } else if (highestEdgeMarket.edgePercent >= 5.0) {
    narrative = `While total line is fairly priced near ${sbTotal}, Poisson simulation spots high mispricing on ${highestEdgeMarket.marketName} with a ${highestEdgeMarket.edgePercent}% Expected Value. Faceoff control favors ${projectedHomeFaceoffWinPct >= 50 ? homeProf.abbreviation : awayProf.abbreviation} (${Math.max(projectedHomeFaceoffWinPct, projectedAwayFaceoffWinPct)}%).`;
  } else {
    narrative = `Evenly matched goaltending and 5v5 ratings produce balanced expectations. ${highestEdgeMarket.marketName} holds the top marginal edge at ${highestEdgeMarket.edgePercent}% EV with ${projectedTotalShots} projected shots on goal.`;
  }

  return {
    modelProjectedHomeGoals: lambdaHome,
    modelProjectedAwayGoals: lambdaAway,
    modelProjectedTotal,
    goalEdge,
    projectedHomeShots,
    projectedAwayShots,
    projectedTotalShots,
    sportsbookShotsTotal,
    shotsEdge,
    projectedTotalFaceoffs,
    projectedHomeFaceoffWinPct,
    projectedAwayFaceoffWinPct,
    projectedHomeFaceoffsWon,
    projectedAwayFaceoffsWon,
    probOver5_5: Number(probOver5_5.toFixed(3)),
    probUnder5_5: Number(probUnder5_5.toFixed(3)),
    probOver6_0: Number(probOver6_0.toFixed(3)),
    probUnder6_0: Number(probUnder6_0.toFixed(3)),
    probPush6_0: Number(probPush6_0.toFixed(3)),
    probOver6_5: Number(probOver6_5.toFixed(3)),
    probUnder6_5: Number(probUnder6_5.toFixed(3)),
    probHomeWinRegulation: Number(probHomeWinReg.toFixed(3)),
    probAwayWinRegulation: Number(probAwayWinReg.toFixed(3)),
    probRegulationDraw: Number(probRegDraw.toFixed(3)),
    probHomeWinFullGame: Number(probHomeWinFullGame.toFixed(3)),
    probAwayWinFullGame: Number(probAwayWinFullGame.toFixed(3)),
    probHomeCoverSpread: Number(homeMinus1_5.toFixed(3)),
    probAwayCoverSpread: Number((1 - homeMinus1_5).toFixed(3)),
    prob1POver1_5: Number(prob1POver1_5.toFixed(3)),
    prob1PUnder1_5: Number(prob1PUnder1_5.toFixed(3)),
    highestEdgeMarket,
    allMarketEdges: allMarkets,
    keyAngle: narrative,
    factors: {
      xgFactor: `5v5 xG: ${homeProf.abbreviation} ${homeProf.xgf60.toFixed(2)} vs ${awayProf.abbreviation} ${awayProf.xgf60.toFixed(2)}`,
      goalieFactor: `Net Goalie GSAx/60: ${homeGoalie.name} (${homeGoalie.gsax60 >= 0 ? '+' : ''}${homeGoalie.gsax60}) vs ${awayGoalie.name} (${awayGoalie.gsax60 >= 0 ? '+' : ''}${awayGoalie.gsax60})`,
      specialTeamsFactor: `PP vs PK: ${homeProf.abbreviation} PP ${homeProf.powerPlayPct}% vs ${awayProf.penaltyKillPct}% PK | ${awayProf.abbreviation} PP ${awayProf.powerPlayPct}% vs ${homeProf.penaltyKillPct}% PK`,
      fatigueFactor: `Rest: ${homeProf.abbreviation} (${homeRest === 0 ? 'B2B 0d' : `${homeRest}d rest`}) vs ${awayProf.abbreviation} (${awayRest === 0 ? 'B2B 0d' : `${awayRest}d rest`})`,
      sogAndFaceoffsFactor: `SOG: ${projectedHomeShots} - ${projectedAwayShots} (Tot: ${projectedTotalShots}) | Faceoffs: ${projectedHomeFaceoffWinPct}% vs ${projectedAwayFaceoffWinPct}% (~${projectedTotalFaceoffs} draws)`,
    },
  };
}
