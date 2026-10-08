// ============================================================
// HISTORICAL FORECASTING MODEL CONFIGURATION & CONSTANTS
// ============================================================

export interface ModelConfig {
  id: '5_YEAR' | '2_YEAR' | 'CUSTOM';
  name: string;
  shortLabel: string;
  intercept: number;
  slope: number;
  other3Intercept: number;
  other3Slope: number;
  historicalMae: number;
  rSquared: number;
  sampleSize: string;
  seasons: string[];
  description: string;
}

export const MODEL_PRESETS: Record<'5_YEAR' | '2_YEAR', ModelConfig> = {
  '5_YEAR': {
    id: '5_YEAR',
    name: '5-Year Trained Model (2020-21 to 2024-25)',
    shortLabel: '5-Year (2020-2025)',
    intercept: 119.5598,
    slope: 2.3621,
    other3Intercept: 119.5598,
    other3Slope: 1.3621,
    historicalMae: 9.77,
    rSquared: 0.465,
    sampleSize: '6,000 Games',
    seasons: ['2020-21', '2021-22', '2022-23', '2023-24', '2024-25'],
    description:
      'Trained via OLS regression on 6,000 completed NBA games across 5 full seasons. Outperforms short-window models with a lower MAE (9.77 pts) and 10.26:1 Under 219 ratio.',
  },
  '2_YEAR': {
    id: '2_YEAR',
    name: 'Original 2-Year Model (2023-24 + 2024-25)',
    shortLabel: '2-Year (2023-2025)',
    intercept: 114.7597,
    slope: 2.3274,
    other3Intercept: 114.7597,
    other3Slope: 1.3274,
    historicalMae: 10.16,
    rSquared: 0.441,
    sampleSize: '2,460 Games',
    seasons: ['2023-24', '2024-25'],
    description:
      'Original regression formula derived from 2023-24 and 2024-25, benchmarked out-of-sample on 2025-26.',
  },
};

// Defaults (now using the 5-Year trained model by default!)
export const DEFAULT_MODEL = MODEL_PRESETS['5_YEAR'];

export const MODEL_INTERCEPT = DEFAULT_MODEL.intercept;
export const MODEL_SLOPE = DEFAULT_MODEL.slope;

export const OTHER_3_INTERCEPT = DEFAULT_MODEL.other3Intercept;
export const OTHER_3_SLOPE = DEFAULT_MODEL.other3Slope;

export const LOWEST_QUARTER_THRESHOLD = 47;
export const REGULATION_TOTAL_THRESHOLD = 219;

export const HISTORICAL_MAE = DEFAULT_MODEL.historicalMae;
export const REFERENCE_TOLERANCE = HISTORICAL_MAE;

export const BUCKET_ORDER = [
  '≤35',
  '36–39',
  '40–42',
  '43–45',
  '46–47',
  '48–50',
  '51–53',
  '54+',
] as const;

export function getLowestBucket(val: number): string {
  if (val <= 35) return '≤35';
  if (val <= 39) return '36–39';
  if (val <= 42) return '40–42';
  if (val <= 45) return '43–45';
  if (val <= 47) return '46–47';
  if (val <= 50) return '48–50';
  if (val <= 53) return '51–53';
  return '54+';
}

export function getCurrentSeasonLabel(date: Date = new Date()): string {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const startYear = month >= 9 ? year : year - 1;
  const endYearShort = String(startYear + 1).slice(-2);
  return `${startYear}-${endYearShort}`;
}

export const FIVE_YEAR_SEASON_STATS = [
  { season: '2020-21', games: 1080, avgLowestQ: 44.95, avgRegTotal: 225.27, mae: 9.65, r2: 0.4691 },
  { season: '2021-22', games: 1230, avgLowestQ: 44.20, avgRegTotal: 221.11, mae: 10.06, r2: 0.4907 },
  { season: '2022-23', games: 1230, avgLowestQ: 45.72, avgRegTotal: 228.55, mae: 10.09, r2: 0.4312 },
  { season: '2023-24', games: 1230, avgLowestQ: 45.41, avgRegTotal: 228.14, mae: 9.82, r2: 0.4332 },
  { season: '2024-25', games: 1230, avgLowestQ: 45.16, avgRegTotal: 227.18, mae: 9.22, r2: 0.4760 },
];
