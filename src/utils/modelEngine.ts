import type { NBAGame, DashboardMetrics, BucketStat, SeasonTypeStat, ReferenceMap } from '../types/nba';
import {
  type ModelConfig,
  DEFAULT_MODEL,
  LOWEST_QUARTER_THRESHOLD,
  REGULATION_TOTAL_THRESHOLD,
  BUCKET_ORDER,
  getLowestBucket,
  getCurrentSeasonLabel,
} from './modelConstants';

export interface RawGameInput {
  id: string;
  date: string;
  season?: string;
  seasonType?: 'Preseason' | 'Regular Season' | 'Other';
  awayTeam: string;
  homeTeam: string;
  awayScore: number;
  homeScore: number;
  q1Away: number;
  q1Home: number;
  q2Away: number;
  q2Home: number;
  q3Away: number;
  q3Home: number;
  q4Away: number;
  q4Home: number;
}

/**
 * Computes all model metrics for a single game based on its quarter breakdown and current active model config.
 */
export function processGameMetrics(
  raw: RawGameInput,
  referenceTotals: ReferenceMap = {},
  modelConfig: ModelConfig = DEFAULT_MODEL
): NBAGame {
  const q1 = raw.q1Away + raw.q1Home;
  const q2 = raw.q2Away + raw.q2Home;
  const q3 = raw.q3Away + raw.q3Home;
  const q4 = raw.q4Away + raw.q4Home;
  const quarters = [q1, q2, q3, q4];

  const regulationTotal = q1 + q2 + q3 + q4;
  const finalTotal = raw.awayScore + raw.homeScore;
  const overtimePoints = Math.max(0, finalTotal - regulationTotal);

  const lowestQuarter = Math.min(...quarters);
  const lowestIndex = quarters.indexOf(lowestQuarter);
  const lowestQuarterNumber = `Q${lowestIndex + 1}`;

  const highestQuarter = Math.max(...quarters);
  const highestIndex = quarters.indexOf(highestQuarter);
  const highestQuarterNumber = `Q${highestIndex + 1}`;

  const otherThreeQuarters = regulationTotal - lowestQuarter;

  // Dynamic Model Forecast Formulas
  const modelPredictedRegulationTotal = modelConfig.intercept + modelConfig.slope * lowestQuarter;
  const modelPredictedOther3 = modelConfig.other3Intercept + modelConfig.other3Slope * lowestQuarter;

  // Errors
  const modelError = regulationTotal - modelPredictedRegulationTotal;
  const absoluteModelError = Math.abs(modelError);

  const other3Error = otherThreeQuarters - modelPredictedOther3;
  const absoluteOther3Error = Math.abs(other3Error);

  // Success Criteria using model's benchmark MAE
  const benchmarkMae = modelConfig.historicalMae;
  const within5 = absoluteModelError <= 5;
  const within10 = absoluteModelError <= 10;
  const within15 = absoluteModelError <= 15;
  const withinHistoricalMAE = absoluteModelError <= benchmarkMae;
  const forecastResult: 'SUCCESS' | 'FAILURE' = withinHistoricalMAE ? 'SUCCESS' : 'FAILURE';

  // Thresholds
  const lowestUnder47 = lowestQuarter < LOWEST_QUARTER_THRESHOLD;
  const regulationUnder219 = regulationTotal < REGULATION_TOTAL_THRESHOLD;

  // Reference comparison
  const refTotal = referenceTotals[raw.id] !== undefined ? referenceTotals[raw.id] : null;
  let modelMinusReference: number | null = null;
  let referenceComparison: 'CLOSE' | 'LARGE GAP' | 'NO REFERENCE' = 'NO REFERENCE';

  if (refTotal !== null && !isNaN(refTotal)) {
    modelMinusReference = modelPredictedRegulationTotal - refTotal;
    referenceComparison = Math.abs(modelMinusReference) <= benchmarkMae ? 'CLOSE' : 'LARGE GAP';
  }

  const lowestBucket = getLowestBucket(lowestQuarter);

  return {
    id: raw.id,
    date: raw.date,
    season: raw.season || getCurrentSeasonLabel(new Date(raw.date)),
    seasonType: raw.seasonType || 'Regular Season',
    awayTeam: raw.awayTeam,
    homeTeam: raw.homeTeam,
    awayScore: raw.awayScore,
    homeScore: raw.homeScore,
    q1,
    q2,
    q3,
    q4,
    lowestQuarter,
    lowestQuarterNumber,
    highestQuarter,
    highestQuarterNumber,
    regulationTotal,
    otherThreeQuarters,
    overtimePoints,
    finalTotal,
    lowestUnder47,
    regulationUnder219,
    modelPredictedRegulationTotal,
    modelPredictedOther3,
    modelError,
    absoluteModelError,
    other3Error,
    absoluteOther3Error,
    within5,
    within10,
    within15,
    withinHistoricalMAE,
    forecastResult,
    referenceTotal: refTotal,
    modelMinusReference,
    referenceComparison,
    lowestBucket,
  };
}

/**
 * Calculates Dashboard KPIs across an array of processed games.
 */
export function calculateDashboardMetrics(
  games: NBAGame[],
  modelConfig: ModelConfig = DEFAULT_MODEL
): DashboardMetrics {
  const totalGames = games.length;
  if (totalGames === 0) {
    return {
      season: getCurrentSeasonLabel(),
      dataUpdated: new Date().toISOString(),
      totalGames: 0,
      preseasonGames: 0,
      regularGames: 0,
      referenceCount: 0,
      avgLowestQuarter: 0,
      avgHighestQuarter: 0,
      avgRegulationTotal: 0,
      avgFinalTotal: 0,
      modelIntercept: modelConfig.intercept,
      modelSlope: modelConfig.slope,
      rSquared: 0,
      mae: 0,
      rmse: 0,
      within5Pct: 0,
      within10Pct: 0,
      within15Pct: 0,
      withinHistoricalMaePct: 0,
      forecastSuccessRate: 0,
      lowestUnder47: 0,
      lowest47OrMore: 0,
      lowestUnder47Pct: 0,
      lowest47OrMorePct: 0,
      under219: 0,
      atLeast219: 0,
      under219Pct: 0,
      atLeast219Pct: 0,
      under219LowestUnder47: 0,
      under219Lowest47OrMore: 0,
      under219Ratio: 0,
    };
  }

  const preseasonGames = games.filter((g) => g.seasonType === 'Preseason').length;
  const regularGames = games.filter((g) => g.seasonType === 'Regular Season').length;
  const referenceCount = games.filter((g) => g.referenceTotal !== null && g.referenceTotal !== undefined).length;

  const sumLowest = games.reduce((acc, g) => acc + g.lowestQuarter, 0);
  const sumHighest = games.reduce((acc, g) => acc + g.highestQuarter, 0);
  const sumReg = games.reduce((acc, g) => acc + g.regulationTotal, 0);
  const sumFinal = games.reduce((acc, g) => acc + g.finalTotal, 0);

  const avgLowestQuarter = sumLowest / totalGames;
  const avgHighestQuarter = sumHighest / totalGames;
  const avgRegulationTotal = sumReg / totalGames;
  const avgFinalTotal = sumFinal / totalGames;

  // Errors
  const sumAbsError = games.reduce((acc, g) => acc + g.absoluteModelError, 0);
  const mae = sumAbsError / totalGames;

  const sumSquaredError = games.reduce((acc, g) => acc + Math.pow(g.modelError, 2), 0);
  const rmse = Math.sqrt(sumSquaredError / totalGames);

  // R²: Pearson correlation squared between lowestQuarter and regulationTotal
  let rSquared = 0;
  if (totalGames > 1) {
    const meanX = avgLowestQuarter;
    const meanY = avgRegulationTotal;
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    for (const g of games) {
      const diffX = g.lowestQuarter - meanX;
      const diffY = g.regulationTotal - meanY;
      numerator += diffX * diffY;
      denomX += diffX * diffX;
      denomY += diffY * diffY;
    }
    const denom = Math.sqrt(denomX * denomY);
    if (denom > 0) {
      const r = numerator / denom;
      rSquared = Math.pow(r, 2);
    }
  }

  // Hit rates
  const countWithin5 = games.filter((g) => g.within5).length;
  const countWithin10 = games.filter((g) => g.within10).length;
  const countWithin15 = games.filter((g) => g.within15).length;
  const countWithinMAE = games.filter((g) => g.withinHistoricalMAE).length;

  const within5Pct = (countWithin5 / totalGames) * 100;
  const within10Pct = (countWithin10 / totalGames) * 100;
  const within15Pct = (countWithin15 / totalGames) * 100;
  const withinHistoricalMaePct = (countWithinMAE / totalGames) * 100;
  const forecastSuccessRate = withinHistoricalMaePct;

  // Thresholds
  const lowestUnder47 = games.filter((g) => g.lowestQuarter < LOWEST_QUARTER_THRESHOLD).length;
  const lowest47OrMore = totalGames - lowestUnder47;
  const lowestUnder47Pct = (lowestUnder47 / totalGames) * 100;
  const lowest47OrMorePct = (lowest47OrMore / totalGames) * 100;

  const under219 = games.filter((g) => g.regulationTotal < REGULATION_TOTAL_THRESHOLD).length;
  const atLeast219 = totalGames - under219;
  const under219Pct = (under219 / totalGames) * 100;
  const atLeast219Pct = (atLeast219 / totalGames) * 100;

  const under219LowestUnder47 = games.filter(
    (g) => g.regulationTotal < REGULATION_TOTAL_THRESHOLD && g.lowestQuarter < LOWEST_QUARTER_THRESHOLD
  ).length;

  const under219Lowest47OrMore = games.filter(
    (g) => g.regulationTotal < REGULATION_TOTAL_THRESHOLD && g.lowestQuarter >= LOWEST_QUARTER_THRESHOLD
  ).length;

  const under219Ratio =
    under219Lowest47OrMore > 0 ? under219LowestUnder47 / under219Lowest47OrMore : under219LowestUnder47 > 0 ? 999 : 0;

  return {
    season: games[0]?.season || getCurrentSeasonLabel(),
    dataUpdated: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    totalGames,
    preseasonGames,
    regularGames,
    referenceCount,
    avgLowestQuarter,
    avgHighestQuarter,
    avgRegulationTotal,
    avgFinalTotal,
    modelIntercept: modelConfig.intercept,
    modelSlope: modelConfig.slope,
    rSquared,
    mae,
    rmse,
    within5Pct,
    within10Pct,
    within15Pct,
    withinHistoricalMaePct,
    forecastSuccessRate,
    lowestUnder47,
    lowest47OrMore,
    lowestUnder47Pct,
    lowest47OrMorePct,
    under219,
    atLeast219,
    under219Pct,
    atLeast219Pct,
    under219LowestUnder47,
    under219Lowest47OrMore,
    under219Ratio,
  };
}

export function calculateBucketStats(games: NBAGame[]): BucketStat[] {
  return BUCKET_ORDER.map((bucketName) => {
    const bucketGames = games.filter((g) => g.lowestBucket === bucketName);
    const count = bucketGames.length;
    if (count === 0) {
      return {
        bucket: bucketName,
        games: 0,
        avgLowestQuarter: 0,
        avgRegulationTotal: 0,
        avgOther3Quarters: 0,
        avgHighestQuarter: 0,
        avgModelError: 0,
      };
    }

    const avgLowestQuarter = bucketGames.reduce((acc, g) => acc + g.lowestQuarter, 0) / count;
    const avgRegulationTotal = bucketGames.reduce((acc, g) => acc + g.regulationTotal, 0) / count;
    const avgOther3Quarters = bucketGames.reduce((acc, g) => acc + g.otherThreeQuarters, 0) / count;
    const avgHighestQuarter = bucketGames.reduce((acc, g) => acc + g.highestQuarter, 0) / count;
    const avgModelError = bucketGames.reduce((acc, g) => acc + g.absoluteModelError, 0) / count;

    return {
      bucket: bucketName,
      games: count,
      avgLowestQuarter,
      avgRegulationTotal,
      avgOther3Quarters,
      avgHighestQuarter,
      avgModelError,
    };
  });
}

export function calculateSeasonTypeStats(games: NBAGame[]): SeasonTypeStat[] {
  const types = ['Preseason', 'Regular Season'];
  return types.map((st) => {
    const subset = games.filter((g) => g.seasonType === st);
    const count = subset.length;
    if (count === 0) {
      return {
        seasonType: st,
        games: 0,
        avgLowestQuarter: 0,
        avgHighestQuarter: 0,
        avgRegulationTotal: 0,
        avgFinalTotal: 0,
        under219Count: 0,
        lowestUnder47Count: 0,
      };
    }
    return {
      seasonType: st,
      games: count,
      avgLowestQuarter: subset.reduce((acc, g) => acc + g.lowestQuarter, 0) / count,
      avgHighestQuarter: subset.reduce((acc, g) => acc + g.highestQuarter, 0) / count,
      avgRegulationTotal: subset.reduce((acc, g) => acc + g.regulationTotal, 0) / count,
      avgFinalTotal: subset.reduce((acc, g) => acc + g.finalTotal, 0) / count,
      under219Count: subset.filter((g) => g.regulationUnder219).length,
      lowestUnder47Count: subset.filter((g) => g.lowestUnder47).length,
    };
  });
}
