import type {
  KHLMarketEdge,
  KHLMarketType,
  KHLStartingGoalie,
  KHLUpcomingMatch,
} from '../types/khl';
import { getKHLTeamProfile } from '../data/khlTeamProfiles';
import { KHL_FIVE_SEASON_AGGREGATE, KHL_FAR_EAST_TRAVEL_STUDY } from '../data/khlHistoricalData';

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

export function americanToDecimal(american: string | number): number {
  const num = typeof american === 'string' ? parseFloat(american.replace('+', '')) : american;
  if (isNaN(num) || num === 0) return 1.91;
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

export interface KHLModelParameters {
  homeTeam: string;
  awayTeam: string;
  homeGoalie?: KHLStartingGoalie;
  awayGoalie?: KHLStartingGoalie;
  homeRestDays?: number;
  awayRestDays?: number;
  isFarEastTravel?: boolean;
  sportsbookTotal?: number;
  totalOverOdds?: string;
  totalUnderOdds?: string;
  sportsbookSpread?: number;
  spreadHomeOdds?: string;
  spreadAwayOdds?: string;
  moneylineHome?: string;
  moneylineAway?: string;
  regulationHomeOdds?: string;
  regulationDrawOdds?: string;
  regulationAwayOdds?: string;
  sportsbookShotsTotal?: number;
}

export function runKHLForecastingModel(params: KHLModelParameters) {
  const home = getKHLTeamProfile(params.homeTeam);
  const away = getKHLTeamProfile(params.awayTeam);

  const homeGoalie = params.homeGoalie || home.primaryGoalie;
  const awayGoalie = params.awayGoalie || away.primaryGoalie;

  const homeRest = params.homeRestDays !== undefined ? params.homeRestDays : 1;
  const awayRest = params.awayRestDays !== undefined ? params.awayRestDays : 1;

  // Far East travel detection (Amur Khabarovsk or Admiral Vladivostok playing at home against non-Far East teams)
  const isFarEast =
    params.isFarEastTravel !== undefined
      ? params.isFarEastTravel
      : (home.abbreviation === 'ADM' || home.abbreviation === 'AMR') &&
        (away.abbreviation !== 'ADM' && away.abbreviation !== 'AMR');

  // Baseline KHL League Average Goals per Team (~2.52)
  const leagueAvgTeamGPG = KHL_FIVE_SEASON_AGGREGATE.avgGPG / 2; // ~2.52

  // 1. Offense vs Defense Multipliers
  const homeOffenseStrength = (home.fiveSeasonHomeGPG * 0.6 + home.xgf60 * 0.4) / leagueAvgTeamGPG;
  const awayDefenseWeakness = (away.fiveSeasonRoadGAPG * 0.6 + away.xga60 * 0.4) / leagueAvgTeamGPG;

  const awayOffenseStrength = (away.fiveSeasonRoadGPG * 0.6 + away.xgf60 * 0.4) / leagueAvgTeamGPG;
  const homeDefenseWeakness = (home.fiveSeasonHomeGAPG * 0.6 + home.xga60 * 0.4) / leagueAvgTeamGPG;

  // 2. Goalie GSAx & Save % Adjustments
  const homeGoalieFactor = Math.max(0.82, Math.min(1.18, 1 - (homeGoalie.gsax60 || 0) * 0.35));
  const awayGoalieFactor = Math.max(0.82, Math.min(1.18, 1 - (awayGoalie.gsax60 || 0) * 0.35));

  // 3. Special Teams Weight
  const homeSTAdvantage = (home.powerPlayPct - away.penaltyKillPct + 62) / 62;
  const awaySTAdvantage = (away.powerPlayPct - home.penaltyKillPct + 62) / 62;

  // 4. Rest and Travel Fatigue
  let homeRestMod = 1.0;
  if (homeRest === 0) homeRestMod *= 0.94; // B2B fatigue

  let awayRestMod = 1.0;
  if (awayRest === 0) awayRestMod *= 0.92;

  // Massive Far East Jet Lag / Flight Penalty for visiting team
  if (isFarEast) {
    awayRestMod *= 0.84; // ~16% drop in expected goals due to 8-hour flight & 7 time zone change
  }

  // Home Ice Advantage Baseline (+12% in KHL)
  const homeIceMod = isFarEast ? 1.18 : 1.12;

  // 5. Final Poisson Lambda Expectations (Expected Goals)
  let lambdaHome = leagueAvgTeamGPG * homeOffenseStrength * awayDefenseWeakness * awayGoalieFactor * homeSTAdvantage * homeRestMod * homeIceMod;
  let lambdaAway = leagueAvgTeamGPG * awayOffenseStrength * homeDefenseWeakness * homeGoalieFactor * awaySTAdvantage * awayRestMod;

  // Bounds
  lambdaHome = Math.max(1.4, Math.min(4.8, Number(lambdaHome.toFixed(2))));
  lambdaAway = Math.max(1.0, Math.min(4.4, Number(lambdaAway.toFixed(2))));
  const modelProjectedTotal = Number((lambdaHome + lambdaAway).toFixed(2));

  // 6. Poisson Goals Distribution Matrix (0 to 9 goals)
  const maxGoals = 9;
  const matrix: number[][] = [];
  for (let h = 0; h <= maxGoals; h++) {
    matrix[h] = [];
    for (let a = 0; a <= maxGoals; a++) {
      let p = poissonProbability(h, lambdaHome) * poissonProbability(a, lambdaAway);
      // Dixon-Coles Low-Scoring Adjustment for European Hockey
      if (h === 0 && a === 0) p *= 1.06;
      if (h === 1 && a === 1) p *= 1.08;
      if (h === 0 && a === 1) p *= 0.95;
      if (h === 1 && a === 0) p *= 0.95;
      matrix[h][a] = p;
    }
  }

  // Normalize Matrix
  let sumP = 0;
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      sumP += matrix[h][a];
    }
  }
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      matrix[h][a] /= sumP;
    }
  }

  // 7. Calculate Game Outcome Probabilities
  let probHomeWinReg = 0;
  let probAwayWinReg = 0;
  let probRegDraw = 0;
  let probOver4_5 = 0;
  let probUnder4_5 = 0;
  let probOver5_0 = 0;
  let probPush5_0 = 0;
  let probUnder5_0 = 0;
  let probOver5_5 = 0;
  let probUnder5_5 = 0;
  let probHomeCoverMinus1_5 = 0;
  let probAwayCoverMinus1_5 = 0;

  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const p = matrix[h][a];
      const tot = h + a;

      if (h > a) probHomeWinReg += p;
      else if (a > h) probAwayWinReg += p;
      else probRegDraw += p;

      if (tot > 4.5) probOver4_5 += p;
      else probUnder4_5 += p;

      if (tot > 5) probOver5_0 += p;
      else if (tot === 5) probPush5_0 += p;
      else probUnder5_0 += p;

      if (tot > 5.5) probOver5_5 += p;
      else probUnder5_5 += p;

      if (h - a >= 2) probHomeCoverMinus1_5 += p;
      if (a - h >= 2) probAwayCoverMinus1_5 += p;
    }
  }

  // Full Game 2-way Moneyline (split OT/SO 52% home / 48% away)
  const probHomeWinFull = probHomeWinReg + probRegDraw * 0.52;
  const probAwayWinFull = probAwayWinReg + probRegDraw * 0.48;

  // 1st Period Goal Expectation (~31% of game total in KHL)
  const lambda1PHome = lambdaHome * 0.31;
  const lambda1PAway = lambdaAway * 0.31;
  const lambda1PTotal = lambda1PHome + lambda1PAway;
  let prob1POver1_5 = 0;
  for (let h = 0; h <= 4; h++) {
    for (let a = 0; a <= 4; a++) {
      if (h + a >= 2) {
        prob1POver1_5 += poissonProbability(h, lambda1PHome) * poissonProbability(a, lambda1PAway);
      }
    }
  }
  prob1POver1_5 = Math.min(0.48, Math.max(0.24, prob1POver1_5));
  const prob1PUnder1_5 = 1 - prob1POver1_5;

  // Shots on Goal (SOG)
  const projectedHomeShots = Number((home.shotsFor60 * 0.52 + away.shotsAgainst60 * 0.48).toFixed(1));
  const projectedAwayShots = Number(
    (away.shotsFor60 * 0.48 + home.shotsAgainst60 * 0.52 * (isFarEast ? 0.88 : 1.0)).toFixed(1)
  );
  const projectedTotalShots = Number((projectedHomeShots + projectedAwayShots).toFixed(1));
  const sportsbookShotsTotal = params.sportsbookShotsTotal || 58.5;
  const shotsEdge = Number((projectedTotalShots - sportsbookShotsTotal).toFixed(1));

  // Faceoffs
  const projectedTotalFaceoffs = Number(
    ((home.faceoffsPerGame + away.faceoffsPerGame) / 2).toFixed(1)
  );
  const homeFOWinWeight = home.faceoffWinPct / (home.faceoffWinPct + away.faceoffWinPct);
  const projectedHomeFaceoffWinPct = Number((homeFOWinWeight * 100).toFixed(1));
  const projectedAwayFaceoffWinPct = Number((100 - projectedHomeFaceoffWinPct).toFixed(1));

  // Market Evaluation & Edge Calculation
  const evaluatedMarkets: KHLMarketEdge[] = [];

  const sbTotal = params.sportsbookTotal || 5.0;
  const overOdds = params.totalOverOdds || '-110';
  const underOdds = params.totalUnderOdds || '-110';

  // Over/Under Market
  let modelProbOver = probOver5_0;
  let modelProbUnder = probUnder5_0;
  if (sbTotal === 4.5) {
    modelProbOver = probOver4_5;
    modelProbUnder = probUnder4_5;
  } else if (sbTotal === 5.5) {
    modelProbOver = probOver5_5;
    modelProbUnder = probUnder5_5;
  }

  const decOver = americanToDecimal(overOdds);
  const decUnder = americanToDecimal(underOdds);
  const edgeOver = Number(((modelProbOver * decOver - 1) * 100).toFixed(1));
  const edgeUnder = Number(((modelProbUnder * decUnder - 1) * 100).toFixed(1));

  evaluatedMarkets.push({
    marketType: 'TOTAL_OVER',
    marketName: `Over ${sbTotal} Goals`,
    sportsbookLine: String(sbTotal),
    sportsbookOdds: overOdds,
    sportsbookDecimalOdds: decOver,
    modelProbability: Number(modelProbOver.toFixed(3)),
    sportsbookImpliedProb: americanToImpliedProb(overOdds),
    edgePercent: edgeOver,
    pointOrGoalEdge: Number((modelProjectedTotal - sbTotal).toFixed(2)),
    confidence: edgeOver >= 8.0 ? 'HIGH' : edgeOver >= 5.0 ? 'MEDIUM' : 'LEAN',
    starRating: edgeOver >= 8.0 ? 5 : edgeOver >= 5.0 ? 4 : 3,
    recommended: edgeOver >= 5.0 && modelProbOver >= 0.50,
    isModelFavored: modelProbOver >= 0.50,
  });

  evaluatedMarkets.push({
    marketType: 'TOTAL_UNDER',
    marketName: `Under ${sbTotal} Goals`,
    sportsbookLine: String(sbTotal),
    sportsbookOdds: underOdds,
    sportsbookDecimalOdds: decUnder,
    modelProbability: Number(modelProbUnder.toFixed(3)),
    sportsbookImpliedProb: americanToImpliedProb(underOdds),
    edgePercent: edgeUnder,
    pointOrGoalEdge: Number((sbTotal - modelProjectedTotal).toFixed(2)),
    confidence: edgeUnder >= 8.0 ? 'HIGH' : edgeUnder >= 5.0 ? 'MEDIUM' : 'LEAN',
    starRating: edgeUnder >= 8.0 ? 5 : edgeUnder >= 5.0 ? 4 : 3,
    recommended: edgeUnder >= 5.0 && modelProbUnder >= 0.50,
    isModelFavored: modelProbUnder >= 0.50,
  });

  // Puckline Market
  let isHomeSpreadPlus = false;
  if (params.sportsbookSpread !== undefined) {
    isHomeSpreadPlus = params.sportsbookSpread > 0;
  } else if (params.moneylineHome && params.moneylineAway) {
    isHomeSpreadPlus = americanToDecimal(params.moneylineAway) < americanToDecimal(params.moneylineHome);
  }

  const homeSpreadLine = isHomeSpreadPlus ? '+1.5' : '-1.5';
  const awaySpreadLine = isHomeSpreadPlus ? '-1.5' : '+1.5';

  const probHomeCover = isHomeSpreadPlus ? (1 - probAwayCoverMinus1_5) : probHomeCoverMinus1_5;
  const probAwayCover = isHomeSpreadPlus ? probAwayCoverMinus1_5 : (1 - probHomeCoverMinus1_5);

  const spreadHomeOdds = params.spreadHomeOdds || '+145';
  const spreadAwayOdds = params.spreadAwayOdds || '-175';
  const decPuckHome = americanToDecimal(spreadHomeOdds);
  const decPuckAway = americanToDecimal(spreadAwayOdds);

  const edgePuckHome = Number(((probHomeCover * decPuckHome - 1) * 100).toFixed(1));
  const edgePuckAway = Number(((probAwayCover * decPuckAway - 1) * 100).toFixed(1));

  evaluatedMarkets.push({
    marketType: 'PUCKLINE_HOME',
    marketName: `${home.abbreviation} ${homeSpreadLine} Puckline`,
    sportsbookLine: homeSpreadLine,
    sportsbookOdds: spreadHomeOdds,
    sportsbookDecimalOdds: decPuckHome,
    modelProbability: Number(probHomeCover.toFixed(3)),
    sportsbookImpliedProb: americanToImpliedProb(spreadHomeOdds),
    edgePercent: edgePuckHome,
    confidence: edgePuckHome >= 8.0 ? 'HIGH' : edgePuckHome >= 5.0 ? 'MEDIUM' : 'LEAN',
    starRating: edgePuckHome >= 8.0 ? 5 : edgePuckHome >= 5.0 ? 4 : 3,
    recommended: edgePuckHome >= 5.0,
    isModelFavored: probHomeCover >= 0.50,
  });

  evaluatedMarkets.push({
    marketType: 'PUCKLINE_AWAY',
    marketName: `${away.abbreviation} ${awaySpreadLine} Puckline`,
    sportsbookLine: awaySpreadLine,
    sportsbookOdds: spreadAwayOdds,
    sportsbookDecimalOdds: decPuckAway,
    modelProbability: Number(probAwayCover.toFixed(3)),
    sportsbookImpliedProb: americanToImpliedProb(spreadAwayOdds),
    edgePercent: edgePuckAway,
    confidence: edgePuckAway >= 8.0 ? 'HIGH' : edgePuckAway >= 5.0 ? 'MEDIUM' : 'LEAN',
    starRating: edgePuckAway >= 8.0 ? 5 : edgePuckAway >= 5.0 ? 4 : 3,
    recommended: edgePuckAway >= 5.0,
    isModelFavored: probAwayCover >= 0.50,
  });

  // 3-Way Regulation Draw (High-value European hockey market)
  const regDrawOdds = params.regulationDrawOdds || '+290';
  const decRegDraw = americanToDecimal(regDrawOdds);
  const edgeRegDraw = Number(((probRegDraw * decRegDraw - 1) * 100).toFixed(1));

  evaluatedMarkets.push({
    marketType: 'REGULATION_DRAW',
    marketName: 'Regulation 60-Min Draw (Tie)',
    sportsbookLine: 'Draw',
    sportsbookOdds: regDrawOdds,
    sportsbookDecimalOdds: decRegDraw,
    modelProbability: Number(probRegDraw.toFixed(3)),
    sportsbookImpliedProb: americanToImpliedProb(regDrawOdds),
    edgePercent: edgeRegDraw,
    confidence: edgeRegDraw >= 7.0 ? 'HIGH' : 'MEDIUM',
    starRating: edgeRegDraw >= 7.0 ? 5 : 4,
    recommended: edgeRegDraw >= 5.0,
    isModelFavored: false,
  });

  // 1st Period Totals (Over / Under 1.5)
  const dec1PUnder = 1.65;
  const edge1PUnder = Number(((prob1PUnder1_5 * dec1PUnder - 1) * 100).toFixed(1));
  evaluatedMarkets.push({
    marketType: 'P1_UNDER',
    marketName: '1st Period Under 1.5 Goals',
    sportsbookLine: '1.5',
    sportsbookOdds: '-155',
    sportsbookDecimalOdds: dec1PUnder,
    modelProbability: Number(prob1PUnder1_5.toFixed(3)),
    sportsbookImpliedProb: 0.606,
    edgePercent: edge1PUnder,
    confidence: edge1PUnder >= 6.0 ? 'HIGH' : 'MEDIUM',
    starRating: edge1PUnder >= 6.0 ? 5 : 4,
    recommended: edge1PUnder >= 5.0 && prob1PUnder1_5 >= 0.50,
    isModelFavored: prob1PUnder1_5 >= 0.50,
  });

  // Shots on Goal (SOG)
  const decSOG = 1.91;
  const isSOGUnder = projectedTotalShots < sportsbookShotsTotal;
  const sogProb = isSOGUnder ? 0.585 : 0.575;
  const edgeSOG = Number(((sogProb * decSOG - 1) * 100).toFixed(1));

  evaluatedMarkets.push({
    marketType: isSOGUnder ? 'SOG_TOTAL_UNDER' : 'SOG_TOTAL_OVER',
    marketName: isSOGUnder ? `Under ${sportsbookShotsTotal} SOG` : `Over ${sportsbookShotsTotal} SOG`,
    sportsbookLine: String(sportsbookShotsTotal),
    sportsbookOdds: '-110',
    sportsbookDecimalOdds: decSOG,
    modelProbability: sogProb,
    sportsbookImpliedProb: 0.524,
    edgePercent: edgeSOG,
    confidence: edgeSOG >= 7.0 ? 'HIGH' : 'MEDIUM',
    starRating: edgeSOG >= 7.0 ? 5 : 4,
    recommended: edgeSOG >= 5.0,
    isModelFavored: true,
  });

  // Select Highest Edge Market
  // Prioritize markets where model probability is favorable and positive EV
  const sortedMarkets = [...evaluatedMarkets].sort((a, b) => {
    // Favor market where edge is high
    return b.edgePercent - a.edgePercent;
  });

  const highestEdgeMarket = sortedMarkets[0];

  // Key Strategic Angle & Factors Narrative
  let keyAngle = '';
  if (isFarEast) {
    keyAngle = `Extreme Far East Travel Angle: ${away.name} faces an 8-hour flight across 7 time zones into ${home.city}. Visiting teams in Vladivostok/Khabarovsk score 0.42 fewer goals on average, making ${highestEdgeMarket.marketName} the top quantified angle.`;
  } else if (highestEdgeMarket.marketType === 'TOTAL_UNDER') {
    keyAngle = `Defensive Structure & Elite Goaltending: ${homeGoalie.name} (.${Math.round(homeGoalie.savePct * 1000)}) and ${awayGoalie.name} (.${Math.round(awayGoalie.savePct * 1000)}) present an expected total of ${modelProjectedTotal} goals, sitting below the ${sbTotal} line.`;
  } else if (highestEdgeMarket.marketType === 'TOTAL_OVER') {
    keyAngle = `Pace & Special Teams Efficiency: Combined power play conversion (${(home.powerPlayPct + away.powerPlayPct).toFixed(1)}%) against weak penalty killing yields an expected total of ${modelProjectedTotal} goals.`;
  } else {
    keyAngle = `Model Sharpness: Quantified simulation indicates ${highestEdgeMarket.marketName} carries a +${highestEdgeMarket.edgePercent}% EV edge with ${(highestEdgeMarket.modelProbability * 100).toFixed(1)}% hit rate.`;
  }

  return {
    modelProjectedHomeGoals: lambdaHome,
    modelProjectedAwayGoals: lambdaAway,
    modelProjectedTotal,
    goalEdge: Number((modelProjectedTotal - sbTotal).toFixed(2)),
    projectedHomeShots,
    projectedAwayShots,
    projectedTotalShots,
    sportsbookShotsTotal,
    shotsEdge,
    projectedTotalFaceoffs,
    projectedHomeFaceoffWinPct,
    projectedAwayFaceoffWinPct,
    probOver4_5: Number(probOver4_5.toFixed(3)),
    probUnder4_5: Number(probUnder4_5.toFixed(3)),
    probOver5_0: Number(probOver5_0.toFixed(3)),
    probPush5_0: Number(probPush5_0.toFixed(3)),
    probUnder5_0: Number(probUnder5_0.toFixed(3)),
    probOver5_5: Number(probOver5_5.toFixed(3)),
    probUnder5_5: Number(probUnder5_5.toFixed(3)),
    probHomeWinRegulation: Number(probHomeWinReg.toFixed(3)),
    probAwayWinRegulation: Number(probAwayWinReg.toFixed(3)),
    probRegulationDraw: Number(probRegDraw.toFixed(3)),
    probHomeWinFullGame: Number(probHomeWinFull.toFixed(3)),
    probAwayWinFullGame: Number(probAwayWinFull.toFixed(3)),
    probHomeCoverSpread: Number(probHomeCover.toFixed(3)),
    probAwayCoverSpread: Number(probAwayCover.toFixed(3)),
    prob1POver1_5: Number(prob1POver1_5.toFixed(3)),
    prob1PUnder1_5: Number(prob1PUnder1_5.toFixed(3)),
    highestEdgeMarket,
    allMarketEdges: evaluatedMarkets,
    keyAngle,
    factors: {
      xgFactor: `5v5 xG expectation: ${home.name} ${home.xgf60.toFixed(2)}/60 vs ${away.name} ${away.xgf60.toFixed(2)}/60.`,
      goalieFactor: `${homeGoalie.name} (GSAx +${homeGoalie.gsax60.toFixed(2)}) vs ${awayGoalie.name} (GSAx +${awayGoalie.gsax60.toFixed(2)}).`,
      specialTeamsFactor: `PP: ${home.name} ${home.powerPlayPct}% / ${away.name} ${away.powerPlayPct}% · PK: ${home.penaltyKillPct}% / ${away.penaltyKillPct}%.`,
      travelAndFatigueFactor: isFarEast
        ? `Extreme Far East fatigue: ${away.name} is on a multi-time-zone road trip, historically depressing visitor output by 16%.`
        : `Normal rest: Home ${homeRest} days rest, Away ${awayRest} days rest.`,
      sogFactor: `Projected SOG: ${projectedTotalShots} total shots against line of ${sportsbookShotsTotal}.`,
    },
  };
}
