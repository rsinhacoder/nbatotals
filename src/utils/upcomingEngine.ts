import type { UpcomingMatch } from '../types/nba';
import {
  type ModelConfig,
  DEFAULT_MODEL,
  LOWEST_QUARTER_THRESHOLD,
} from './modelConstants';
import { calculateMatchupLowestQuarter, getTeamProfile } from '../data/teamProfiles';

export interface RawUpcomingInput {
  id: string;
  date: string;
  time: string;
  status?: 'Scheduled' | 'Live' | 'Final' | 'Delayed';
  awayTeam: string;
  homeTeam: string;
  awayRecord?: string;
  homeRecord?: string;
  sportsbookLine: number;
  customLowestQuarter?: number; // User override
  liveQuarterScores?: {
    q1?: number;
    q2?: number;
    q3?: number;
    q4?: number;
  };
}

export function buildUpcomingMatchForecast(
  input: RawUpcomingInput,
  modelConfig: ModelConfig = DEFAULT_MODEL
): UpcomingMatch {
  const awayProf = getTeamProfile(input.awayTeam);
  const homeProf = getTeamProfile(input.homeTeam);

  // If live quarters exist, determine current lowest quarter so far
  let liveLowestQ: number | null = null;
  if (input.liveQuarterScores) {
    const quarters = Object.values(input.liveQuarterScores).filter(
      (v): v is number => typeof v === 'number' && v > 0
    );
    if (quarters.length > 0) {
      liveLowestQ = Math.min(...quarters);
    }
  }

  // Determine effective projected lowest quarter
  let projectedLowestQuarter = input.customLowestQuarter;
  if (projectedLowestQuarter === undefined) {
    if (liveLowestQ !== null) {
      const theoreticalLowest = calculateMatchupLowestQuarter(input.awayTeam, input.homeTeam);
      projectedLowestQuarter = Math.min(liveLowestQ, theoreticalLowest);
    } else {
      projectedLowestQuarter = calculateMatchupLowestQuarter(input.awayTeam, input.homeTeam);
    }
  }

  projectedLowestQuarter = Number(projectedLowestQuarter.toFixed(1));

  // Run the regression formulas using the active modelConfig (5-Year trained by default)
  const modelProjectedTotal = Number(
    (modelConfig.intercept + modelConfig.slope * projectedLowestQuarter).toFixed(2)
  );

  const modelProjectedOther3 = Number(
    (modelConfig.other3Intercept + modelConfig.other3Slope * projectedLowestQuarter).toFixed(2)
  );

  const edge = Number((modelProjectedTotal - input.sportsbookLine).toFixed(2));

  // Probability estimations calibrated against empirical distribution
  let lowestUnder47Probability = 50;
  if (projectedLowestQuarter <= 41) lowestUnder47Probability = 88;
  else if (projectedLowestQuarter <= 43) lowestUnder47Probability = 78;
  else if (projectedLowestQuarter <= 45) lowestUnder47Probability = 66;
  else if (projectedLowestQuarter <= 47) lowestUnder47Probability = 52;
  else if (projectedLowestQuarter <= 49) lowestUnder47Probability = 34;
  else lowestUnder47Probability = 18;

  // Under 219 probability
  let under219Probability = 50;
  if (modelProjectedTotal <= 212) under219Probability = 84;
  else if (modelProjectedTotal <= 216) under219Probability = 74;
  else if (modelProjectedTotal <= 219) under219Probability = 61;
  else if (modelProjectedTotal <= 223) under219Probability = 42;
  else if (modelProjectedTotal <= 228) under219Probability = 26;
  else under219Probability = 12;

  // Recommendation categorization
  let recommendation: 'STRONG UNDER' | 'LEAN UNDER' | 'MARKET ALIGNED' | 'LEAN OVER' | 'STRONG OVER';
  if (edge <= -5.0) {
    recommendation = 'STRONG UNDER';
  } else if (edge <= -2.0) {
    recommendation = 'LEAN UNDER';
  } else if (edge < 2.0) {
    recommendation = 'MARKET ALIGNED';
  } else if (edge < 5.0) {
    recommendation = 'LEAN OVER';
  } else {
    recommendation = 'STRONG OVER';
  }

  const absEdge = Math.abs(edge);
  let confidenceScore = Math.min(95, Math.round(55 + absEdge * 6));
  if (liveLowestQ !== null && liveLowestQ < LOWEST_QUARTER_THRESHOLD) {
    confidenceScore = Math.min(98, confidenceScore + 10);
  }

  let keyNarrative = '';
  if (edge <= -3.0) {
    keyNarrative = `[${modelConfig.shortLabel}] Model identifies a ${Math.abs(edge).toFixed(1)} pt value on the UNDER. Projected lowest quarter (~${projectedLowestQuarter} pts) yields a regulation projection of ${modelProjectedTotal}, below market line ${input.sportsbookLine}.`;
  } else if (edge >= 3.0) {
    keyNarrative = `[${modelConfig.shortLabel}] Model identifies a +${edge.toFixed(1)} pt value on the OVER. Fast-paced matchup creates a high scoring floor (~${projectedLowestQuarter} lowest Q), projecting ${modelProjectedTotal} vs market line ${input.sportsbookLine}.`;
  } else {
    keyNarrative = `[${modelConfig.shortLabel}] Sportsbook line (${input.sportsbookLine}) matches the regression expectation. Model projection: ${modelProjectedTotal}.`;
  }

  return {
    id: input.id,
    date: input.date,
    time: input.time,
    status: input.status || 'Scheduled',
    awayTeam: input.awayTeam,
    homeTeam: input.homeTeam,
    awayRecord: input.awayRecord || '34-22',
    homeRecord: input.homeRecord || '38-18',
    sportsbookLine: input.sportsbookLine,
    projectedLowestQuarter,
    modelProjectedTotal,
    modelProjectedOther3,
    edge,
    recommendation,
    confidenceScore,
    lowestUnder47Probability,
    under219Probability,
    keyNarrative,
    liveQuarterScores: input.liveQuarterScores,
  };
}
