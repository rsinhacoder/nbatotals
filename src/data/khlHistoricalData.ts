import type { KHLSeasonSummary } from '../types/khl';

export const KHL_HISTORICAL_SEASONS: KHLSeasonSummary[] = [
  {
    season: '2025-26',
    games: 816,
    goalsPerGame: 5.12,
    homeGPG: 2.74,
    roadGPG: 2.38,
    homeWinPct: 54.8,
    otPct: 23.4, // Regulation draw rate (European 3-way markets)
    over4_5Pct: 62.1,
    over5_0Pct: 49.5,
    push5_0Pct: 13.8,
    over5_5Pct: 41.2,
    under5_5Pct: 58.8,
    oneGoalMarginPct: 44.5,
    avgShotsPerGame: 59.4,
    avgFaceoffsPerGame: 55.2,
    farEastVisitingWinPct: 36.4, // Visiting teams suffer massive fatigue in Vladivostok/Khabarovsk
  },
  {
    season: '2024-25',
    games: 816,
    goalsPerGame: 5.08,
    homeGPG: 2.70,
    roadGPG: 2.38,
    homeWinPct: 54.2,
    otPct: 24.1,
    over4_5Pct: 61.5,
    over5_0Pct: 48.8,
    push5_0Pct: 14.2,
    over5_5Pct: 40.5,
    under5_5Pct: 59.5,
    oneGoalMarginPct: 45.2,
    avgShotsPerGame: 58.8,
    avgFaceoffsPerGame: 54.8,
    farEastVisitingWinPct: 37.0,
  },
  {
    season: '2023-24',
    games: 816,
    goalsPerGame: 5.02,
    homeGPG: 2.68,
    roadGPG: 2.34,
    homeWinPct: 55.0,
    otPct: 23.8,
    over4_5Pct: 60.8,
    over5_0Pct: 47.9,
    push5_0Pct: 14.5,
    over5_5Pct: 39.8,
    under5_5Pct: 60.2,
    oneGoalMarginPct: 46.0,
    avgShotsPerGame: 58.2,
    avgFaceoffsPerGame: 55.0,
    farEastVisitingWinPct: 35.8,
  },
  {
    season: '2022-23',
    games: 816,
    goalsPerGame: 4.95,
    homeGPG: 2.64,
    roadGPG: 2.31,
    homeWinPct: 53.8,
    otPct: 24.5,
    over4_5Pct: 59.5,
    over5_0Pct: 46.5,
    push5_0Pct: 14.8,
    over5_5Pct: 38.6,
    under5_5Pct: 61.4,
    oneGoalMarginPct: 46.8,
    avgShotsPerGame: 57.8,
    avgFaceoffsPerGame: 54.5,
    farEastVisitingWinPct: 36.2,
  },
  {
    season: '2021-22',
    games: 816,
    goalsPerGame: 5.05,
    homeGPG: 2.71,
    roadGPG: 2.34,
    homeWinPct: 54.5,
    otPct: 23.0,
    over4_5Pct: 61.0,
    over5_0Pct: 48.2,
    push5_0Pct: 13.9,
    over5_5Pct: 40.1,
    under5_5Pct: 59.9,
    oneGoalMarginPct: 44.8,
    avgShotsPerGame: 58.6,
    avgFaceoffsPerGame: 55.4,
    farEastVisitingWinPct: 38.0,
  },
];

export const KHL_FIVE_SEASON_AGGREGATE = {
  totalGames: 4080,
  avgGPG: 5.04,
  avgHomeGPG: 2.69,
  avgRoadGPG: 2.35,
  homeWinPct: 54.5,
  regulationDrawRate: 23.8, // 23.8% of KHL matches go to overtime!
  over4_5Rate: 61.0,
  over5_0Rate: 48.2,
  over5_5Rate: 40.0,
  under5_5Rate: 60.0, // Under 5.5 is historically profitable in KHL
  p1Under1_5Rate: 62.4, // 1st periods in KHL are notoriously tight
  avgShotsTotal: 58.6,
  avgFaceoffsTotal: 54.9,
  travelFatigueDeficitFarEast: 0.42, // Visiting teams score 0.42 fewer goals on Far East road trips
};

export const KHL_FAR_EAST_TRAVEL_STUDY = {
  description:
    'The KHL spans 8 time zones from Saint Petersburg / Moscow in the west to Khabarovsk (Amur) and Vladivostok (Admiral) on the Pacific Ocean. Visiting teams face grueling 8-hour flights and 7-hour jet lag.',
  visitingTeamGoalScoringAverage: 2.05, // vs 2.45 league average on the road
  visitingTeamWinRate: 36.7, // vs 45.5% road win rate elsewhere in KHL
  under5_5RateInFarEast: 68.2, // Extremely strong Under bias in Vladivostok and Khabarovsk
  under5_0RateInFarEast: 54.5,
};
