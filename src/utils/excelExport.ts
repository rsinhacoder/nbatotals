import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { NBAGame, DashboardMetrics, BucketStat, SeasonTypeStat, ReferenceMap } from '../types/nba';
import {
  HISTORICAL_MAE,
  MODEL_INTERCEPT,
  MODEL_SLOPE,
  OTHER_3_INTERCEPT,
  OTHER_3_SLOPE,
} from './modelConstants';

export function exportFullExcel(
  games: NBAGame[],
  dashboard: DashboardMetrics,
  bucketStats: BucketStat[],
  seasonStats: SeasonTypeStat[]
) {
  const wb = XLSX.utils.book_new();

  // 1. DASHBOARD SHEET
  const dashboardRows = [
    ['NBA Forecast Dashboard', ''],
    ['', ''],
    ['Metric', 'Value'],
    ['Season', dashboard.season],
    ['Data Updated', dashboard.dataUpdated],
    ['Completed Games', dashboard.totalGames],
    ['Preseason Games', dashboard.preseasonGames],
    ['Regular Season Games', dashboard.regularGames],
    ['Reference Totals Entered', dashboard.referenceCount],
    ['Average Lowest Quarter', Number(dashboard.avgLowestQuarter.toFixed(2))],
    ['Average Highest Quarter', Number(dashboard.avgHighestQuarter.toFixed(2))],
    ['Average Regulation Total', Number(dashboard.avgRegulationTotal.toFixed(2))],
    ['Average Final Total', Number(dashboard.avgFinalTotal.toFixed(2))],
    ['Model Intercept', dashboard.modelIntercept],
    ['Model Slope', dashboard.modelSlope],
    ['R²', Number(dashboard.rSquared.toFixed(4))],
    ['MAE', Number(dashboard.mae.toFixed(2))],
    ['RMSE', Number(dashboard.rmse.toFixed(2))],
    ['Predictions Within ±5', `${dashboard.within5Pct.toFixed(2)}%`],
    ['Predictions Within ±10', `${dashboard.within10Pct.toFixed(2)}%`],
    ['Predictions Within ±15', `${dashboard.within15Pct.toFixed(2)}%`],
    ['Predictions Within Historical MAE', `${dashboard.withinHistoricalMaePct.toFixed(2)}%`],
    ['Forecast Success Rate', `${dashboard.forecastSuccessRate.toFixed(2)}%`],
    ['Lowest Quarter <47', `${dashboard.lowestUnder47} (${dashboard.lowestUnder47Pct.toFixed(2)}%)`],
    ['Lowest Quarter >=47', `${dashboard.lowest47OrMore} (${dashboard.lowest47OrMorePct.toFixed(2)}%)`],
    ['Regulation Total <219', `${dashboard.under219} (${dashboard.under219Pct.toFixed(2)}%)`],
    ['Regulation Total >=219', `${dashboard.atLeast219} (${dashboard.atLeast219Pct.toFixed(2)}%)`],
    ['Under 219 + Lowest <47', dashboard.under219LowestUnder47],
    ['Under 219 + Lowest >=47', dashboard.under219Lowest47OrMore],
    ['Under 219 Ratio <47 : >=47', dashboard.under219Ratio ? `${dashboard.under219Ratio.toFixed(2)} : 1` : 'N/A'],
  ];
  const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardRows);
  XLSX.utils.book_append_sheet(wb, wsDashboard, 'Dashboard');

  // 2. FORECAST EVALUATION SHEET
  const evalData = games.map((g) => ({
    'Game ID': g.id,
    'Date': g.date,
    'Season Type': g.seasonType,
    'Away Team': g.awayTeam,
    'Home Team': g.homeTeam,
    'Lowest Quarter': g.lowestQuarter,
    'Lowest Quarter Number': g.lowestQuarterNumber,
    'Model Predicted Regulation Total': Number(g.modelPredictedRegulationTotal.toFixed(2)),
    'Reference Total': g.referenceTotal !== null && g.referenceTotal !== undefined ? g.referenceTotal : '',
    'Model - Reference': g.modelMinusReference !== null && g.modelMinusReference !== undefined ? Number(g.modelMinusReference.toFixed(2)) : '',
    'Reference Comparison': g.referenceComparison || 'NO REFERENCE',
    'Regulation Total': g.regulationTotal,
    'Model Error': Number(g.modelError.toFixed(2)),
    'Absolute Model Error': Number(g.absoluteModelError.toFixed(2)),
    'Within ±5': g.within5 ? 'TRUE' : 'FALSE',
    'Within ±10': g.within10 ? 'TRUE' : 'FALSE',
    'Within ±15': g.within15 ? 'TRUE' : 'FALSE',
    'Within Historical MAE': g.withinHistoricalMAE ? 'TRUE' : 'FALSE',
    'Forecast Result': g.forecastResult,
  }));
  const wsEval = XLSX.utils.json_to_sheet(evalData);
  XLSX.utils.book_append_sheet(wb, wsEval, 'Forecast Evaluation');

  // 3. ALL GAMES SHEET
  const allGamesData = games.map((g) => ({
    'Game ID': g.id,
    'Date': g.date,
    'Season': g.season,
    'Season Type': g.seasonType,
    'Away Team': g.awayTeam,
    'Home Team': g.homeTeam,
    'Away Points': g.awayScore,
    'Home Points': g.homeScore,
    'Q1 Total': g.q1,
    'Q2 Total': g.q2,
    'Q3 Total': g.q3,
    'Q4 Total': g.q4,
    'Lowest Quarter': g.lowestQuarter,
    'Lowest Quarter Number': g.lowestQuarterNumber,
    'Highest Quarter': g.highestQuarter,
    'Highest Quarter Number': g.highestQuarterNumber,
    'Regulation Total': g.regulationTotal,
    'Other 3 Quarters': g.otherThreeQuarters,
    'Overtime Points': g.overtimePoints,
    'Final Total': g.finalTotal,
    'Lowest <47': g.lowestUnder47 ? 'YES' : 'NO',
    'Regulation <219': g.regulationUnder219 ? 'YES' : 'NO',
  }));
  const wsAllGames = XLSX.utils.json_to_sheet(allGamesData);
  XLSX.utils.book_append_sheet(wb, wsAllGames, 'All Games');

  // 4. BUCKET STABILITY SHEET
  const bucketData = bucketStats.map((b) => ({
    'Lowest Quarter Bucket': b.bucket,
    'Games': b.games,
    'Avg_Lowest_Quarter': Number(b.avgLowestQuarter.toFixed(2)),
    'Avg_Regulation_Total': Number(b.avgRegulationTotal.toFixed(2)),
    'Avg_Other_3_Quarters': Number(b.avgOther3Quarters.toFixed(2)),
    'Avg_Highest_Quarter': Number(b.avgHighestQuarter.toFixed(2)),
    'Avg_Model_Error': Number(b.avgModelError.toFixed(2)),
  }));
  const wsBuckets = XLSX.utils.json_to_sheet(bucketData);
  XLSX.utils.book_append_sheet(wb, wsBuckets, 'Bucket Stability');

  // 5. UNDER 219 ANALYSIS SHEET
  const under219Data = [
    {
      Condition: 'Regulation Total <219',
      Games: dashboard.under219,
      Percentage: Number(dashboard.under219Pct.toFixed(2)),
    },
    {
      Condition: 'Regulation Total >=219',
      Games: dashboard.atLeast219,
      Percentage: Number(dashboard.atLeast219Pct.toFixed(2)),
    },
    {
      Condition: 'Under 219 + Lowest Quarter <47',
      Games: dashboard.under219LowestUnder47,
      Percentage: dashboard.under219 > 0 ? Number(((dashboard.under219LowestUnder47 / dashboard.under219) * 100).toFixed(2)) : 0,
    },
    {
      Condition: 'Under 219 + Lowest Quarter >=47',
      Games: dashboard.under219Lowest47OrMore,
      Percentage: dashboard.under219 > 0 ? Number(((dashboard.under219Lowest47OrMore / dashboard.under219) * 100).toFixed(2)) : 0,
    },
  ];
  const wsUnder219 = XLSX.utils.json_to_sheet(under219Data);
  XLSX.utils.book_append_sheet(wb, wsUnder219, 'Under 219 Analysis');

  // 6. MODEL EXPLANATION SHEET
  const explanationData = [
    {
      Metric: 'Main Forecast Equation',
      Explanation: `Predicted Regulation Total = ${MODEL_INTERCEPT.toFixed(4)} + ${MODEL_SLOPE.toFixed(4)} × Lowest Regulation Quarter`,
    },
    {
      Metric: 'Other 3 Quarters Equation',
      Explanation: `Predicted Other 3 Quarters = ${OTHER_3_INTERCEPT.toFixed(4)} + ${OTHER_3_SLOPE.toFixed(4)} × Lowest Regulation Quarter`,
    },
    {
      Metric: 'R²',
      Explanation: 'How much of the variation in regulation totals is explained by the lowest quarter.',
    },
    {
      Metric: 'MAE',
      Explanation: 'Average absolute difference between model prediction and actual regulation total.',
    },
    {
      Metric: 'RMSE',
      Explanation: 'Square-root average of squared prediction errors.',
    },
    {
      Metric: 'SUCCESS',
      Explanation: `SUCCESS means the prediction was within ${HISTORICAL_MAE.toFixed(2)} points of the actual regulation total.`,
    },
    {
      Metric: '±5',
      Explanation: 'Prediction within 5 points of actual.',
    },
    {
      Metric: '±10',
      Explanation: 'Prediction within 10 points of actual.',
    },
    {
      Metric: '±15',
      Explanation: 'Prediction within 15 points of actual.',
    },
    {
      Metric: 'Reference Total',
      Explanation: 'Optional manually maintained reference/projected total (sportsbook line).',
    },
  ];
  const wsExplanation = XLSX.utils.json_to_sheet(explanationData);
  XLSX.utils.book_append_sheet(wb, wsExplanation, 'Model Explanation');

  // 7. SEASON TYPE SHEET
  const seasonData = seasonStats.map((s) => ({
    'Season Type': s.seasonType,
    'Games': s.games,
    'Avg_Lowest_Quarter': Number(s.avgLowestQuarter.toFixed(2)),
    'Avg_Highest_Quarter': Number(s.avgHighestQuarter.toFixed(2)),
    'Avg_Regulation_Total': Number(s.avgRegulationTotal.toFixed(2)),
    'Avg_Final_Total': Number(s.avgFinalTotal.toFixed(2)),
    'Under_219': s.under219Count,
    'Lowest_Under_47': s.lowestUnder47Count,
  }));
  const wsSeason = XLSX.utils.json_to_sheet(seasonData);
  XLSX.utils.book_append_sheet(wb, wsSeason, 'Season Type');

  // Auto column widths
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    const colWidths = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      colWidths.push({ wch: 22 });
    }
    sheet['!cols'] = colWidths;
  }

  // Generate buffer and trigger download
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'NBA_Current_Season_Forecast.xlsx');
}

export function exportReferenceTotalsCsv(referenceTotals: ReferenceMap) {
  const rows = [['Game ID', 'Reference Total']];
  for (const [gameId, val] of Object.entries(referenceTotals)) {
    if (val !== undefined && val !== null) {
      rows.push([gameId, String(val)]);
    }
  }
  const csvContent = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, 'Reference Totals.csv');
}
