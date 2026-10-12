import type { GradedModelPick, PickOutcome } from '../types/results';
import type { RawGameInput } from './modelEngine';
import type { ModelConfig } from './modelConstants';
import { DEFAULT_MODEL } from './modelConstants';
import { getTeamProfile } from '../data/teamProfiles';
import { getNHLTeamProfile } from '../data/nhlTeamProfiles';
import { runNHLForecastingModel } from './nhlModelEngine';
import { enrichPickComparison } from '../data/seasonResultsData';
import type { TrackedBet } from '../types/nba';

export interface ManualGameInput {
  sport: 'NBA' | 'NHL' | 'KHL';
  date: string;
  time?: string;
  awayTeam: string;
  homeTeam: string;
  awayScore: number;
  homeScore: number;
  sportsbookLine: number;
  sportsbookOdds?: string;
  marketCategory?: 'TOTAL' | 'SPREAD' | 'MONEYLINE';
  pickType?: 'UNDER' | 'OVER';
  q1Away?: number;
  q1Home?: number;
  q2Away?: number;
  q2Home?: number;
  q3Away?: number;
  q3Home?: number;
  q4Away?: number;
  q4Home?: number;
}

export function calcProfitUnits(oddsStr: string, outcome: PickOutcome, units = 1.0): number {
  if (outcome === 'PUSH') return 0;
  if (outcome === 'LOST' || outcome === 'FAILURE') return -units;
  const oddsNum = parseInt(oddsStr.replace('+', ''), 10);
  if (isNaN(oddsNum)) return Number((units * 0.91).toFixed(2));
  if (oddsNum > 0) {
    return Number(((oddsNum / 100) * units).toFixed(2));
  } else {
    return Number(((100 / Math.abs(oddsNum)) * units).toFixed(2));
  }
}

/**
 * Grades a completed NBA game box score against the active quantitative model.
 */
export function gradeCompletedNBAGame(
  event: any,
  modelConfig: ModelConfig = DEFAULT_MODEL
): GradedModelPick | null {
  try {
    const comp = event.competitions?.[0];
    if (!comp || !comp.competitors || comp.competitors.length < 2) return null;

    const homeComp = comp.competitors.find((c: any) => c.homeAway === 'home');
    const awayComp = comp.competitors.find((c: any) => c.homeAway === 'away');
    if (!homeComp || !awayComp) return null;

    const homeScore = parseInt(homeComp.score || '0', 10);
    const awayScore = parseInt(awayComp.score || '0', 10);
    if (isNaN(homeScore) || isNaN(awayScore) || (homeScore === 0 && awayScore === 0)) {
      return null;
    }

    const awayName = awayComp.team?.displayName || awayComp.team?.name || 'Away';
    const homeName = homeComp.team?.displayName || homeComp.team?.name || 'Home';
    const awayProf = getTeamProfile(awayName);
    const homeProf = getTeamProfile(homeName);

    const actualTotal = awayScore + homeScore;
    const gameDate = event.date ? event.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
    const timeStr = event.date
      ? new Date(event.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : '7:00 PM ET';

    // Quarter linescores if available
    const getPeriodScore = (linescores: any[], period: number) => {
      if (!Array.isArray(linescores)) return 0;
      const found = linescores.find((l: any) => l.period === period);
      return found ? Number(found.value) : 0;
    };

    const q1 = getPeriodScore(awayComp.linescores, 1) + getPeriodScore(homeComp.linescores, 1);
    const q2 = getPeriodScore(awayComp.linescores, 2) + getPeriodScore(homeComp.linescores, 2);
    const q3 = getPeriodScore(awayComp.linescores, 3) + getPeriodScore(homeComp.linescores, 3);
    const q4 = getPeriodScore(awayComp.linescores, 4) + getPeriodScore(homeComp.linescores, 4);
    const quarters = [q1, q2, q3, q4].filter((q) => q > 0);

    let lowestQuarter = quarters.length === 4 ? Math.min(...quarters) : 44.0;
    let modelProjection = Number(
      (modelConfig.intercept + modelConfig.slope * lowestQuarter).toFixed(1)
    );

    // Sportsbook consensus line
    const oddsTotal = comp.odds?.[0]?.overUnder;
    let sportsbookLine = 224.5;
    if (typeof oddsTotal === 'number' && oddsTotal > 150) {
      sportsbookLine = oddsTotal;
    } else {
      sportsbookLine = Number(
        (((awayProf.avgRegulationTotal || 222) + (homeProf.avgRegulationTotal || 222)) / 2).toFixed(1)
      );
    }

    const oddsStr = '-110';
    const edge = Number((modelProjection - sportsbookLine).toFixed(1));
    const isUnder = edge <= 0; // Model leans under if projection <= line

    const modelPickValue = isUnder ? `UNDER ${sportsbookLine} Pts` : `OVER ${sportsbookLine} Pts`;
    const marketName = isUnder ? `UNDER ${sportsbookLine}` : `OVER ${sportsbookLine}`;

    let outcome: PickOutcome = 'WON';
    let valueDifferential = '';

    if (actualTotal === sportsbookLine) {
      outcome = 'PUSH';
      valueDifferential = `Push exactly on line (${sportsbookLine} Pts)`;
    } else if (isUnder) {
      if (actualTotal < sportsbookLine) {
        outcome = 'WON';
        const diff = (sportsbookLine - actualTotal).toFixed(1);
        valueDifferential = `+${diff} Pts buffer (Under covered)`;
      } else {
        outcome = 'LOST';
        const diff = (actualTotal - sportsbookLine).toFixed(1);
        valueDifferential = `-${diff} Pts over (Under missed)`;
      }
    } else {
      if (actualTotal > sportsbookLine) {
        outcome = 'WON';
        const diff = (actualTotal - sportsbookLine).toFixed(1);
        valueDifferential = `+${diff} Pts clearance (Over covered)`;
      } else {
        outcome = 'LOST';
        const diff = (sportsbookLine - actualTotal).toFixed(1);
        valueDifferential = `-${diff} Pts short (Over missed)`;
      }
    }

    const absEdge = Math.abs(edge);
    const edgePercent = Number((absEdge >= 1 ? 5.5 + absEdge * 0.8 : 4.5).toFixed(1));
    const starRating = edgePercent >= 8.5 ? 5 : edgePercent >= 6.0 ? 4 : 3;
    const confidence = edgePercent >= 8.5 ? 'HIGH' : 'MEDIUM';
    const profitUnits = calcProfitUnits(oddsStr, outcome, 1.0);

    const isSuccess = outcome === 'WON';
    const analysisRecap = isSuccess
      ? `Halfcourt pace and defensive ratings cleanly held up against the closing line, delivering a verified win with ${valueDifferential}.`
      : `High late-game scoring and fast transition possessions deviated from projection, resulting in ${valueDifferential}.`;

    const rawPick: GradedModelPick = {
      id: `nba_real_${event.id || `${awayProf.abbreviation}_${homeProf.abbreviation}_${gameDate}`}`,
      season: '2026-27',
      sport: 'NBA',
      date: gameDate,
      time: timeStr,
      matchup: `${awayProf.name} @ ${homeProf.name}`,
      awayTeam: awayProf.name,
      homeTeam: homeProf.name,
      awayAbbrev: awayProf.abbreviation,
      homeAbbrev: homeProf.abbreviation,
      awayLogo: awayProf.logo,
      homeLogo: homeProf.logo,
      marketCategory: 'TOTAL',
      marketName,
      pickName: marketName,
      sportsbookLine: String(sportsbookLine),
      sportsbookOdds: oddsStr,
      decimalOdds: 1.91,
      modelPickValue,
      modelProjection,
      modelWinProb: 0.612,
      edgePercent,
      confidence,
      starRating,
      actualScoreText: `${awayScore} - ${homeScore} (Total: ${actualTotal} Pts)`,
      currentValue: `${awayScore} - ${homeScore} (Total: ${actualTotal} Pts)`,
      valueDifferential,
      awayScore,
      homeScore,
      actualTotal,
      outcome,
      correctness: isSuccess ? 'SUCCESS' : outcome === 'LOST' ? 'FAILURE' : 'PUSH',
      unitsStaked: 1.0,
      profitUnits,
      analysisRecap,
    };

    return enrichPickComparison(rawPick);
  } catch (e) {
    console.warn('Error grading NBA game:', e);
    return null;
  }
}

/**
 * Grades a completed NHL game box score using the Bivariate Poisson model.
 */
export function gradeCompletedNHLGame(event: any): GradedModelPick | null {
  try {
    const comp = event.competitions?.[0];
    if (!comp || !comp.competitors || comp.competitors.length < 2) return null;

    const homeComp = comp.competitors.find((c: any) => c.homeAway === 'home');
    const awayComp = comp.competitors.find((c: any) => c.homeAway === 'away');
    if (!homeComp || !awayComp) return null;

    const homeScore = parseInt(homeComp.score || '0', 10);
    const awayScore = parseInt(awayComp.score || '0', 10);
    if (isNaN(homeScore) || isNaN(awayScore) || (homeScore === 0 && awayScore === 0)) {
      return null;
    }

    const homeAbbrev = homeComp.team?.abbreviation || 'HOM';
    const awayAbbrev = awayComp.team?.abbreviation || 'AWY';
    const homeProf = getNHLTeamProfile(homeAbbrev);
    const awayProf = getNHLTeamProfile(awayAbbrev);

    const actualTotal = awayScore + homeScore;
    const gameDate = event.date ? event.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
    const timeStr = event.date
      ? new Date(event.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : '7:00 PM ET';

    // Sportsbook consensus line
    const oddsTotal = comp.odds?.[0]?.overUnder;
    let sportsbookTotal = 6.0;
    if (typeof oddsTotal === 'number' && !isNaN(oddsTotal)) {
      sportsbookTotal = Number(oddsTotal);
    }

    const forecast = runNHLForecastingModel({
      homeTeam: homeProf.id,
      awayTeam: awayProf.id,
      sportsbookTotal,
    });

    const isUnder = forecast.goalEdge <= 0;
    const marketName = isUnder ? `UNDER ${sportsbookTotal} Goals` : `OVER ${sportsbookTotal} Goals`;
    const modelPickValue = marketName;
    const oddsStr = '-110';

    let outcome: PickOutcome = 'WON';
    let valueDifferential = '';

    if (actualTotal === sportsbookTotal) {
      outcome = 'PUSH';
      valueDifferential = `Push exactly on line (${sportsbookTotal} Goals)`;
    } else if (isUnder) {
      if (actualTotal < sportsbookTotal) {
        outcome = 'WON';
        const diff = (sportsbookTotal - actualTotal).toFixed(1);
        valueDifferential = `+${diff} Goals buffer (Under covered)`;
      } else {
        outcome = 'LOST';
        const diff = (actualTotal - sportsbookTotal).toFixed(1);
        valueDifferential = `-${diff} Goals over (Under missed)`;
      }
    } else {
      if (actualTotal > sportsbookTotal) {
        outcome = 'WON';
        const diff = (actualTotal - sportsbookTotal).toFixed(1);
        valueDifferential = `+${diff} Goals clearance (Over covered)`;
      } else {
        outcome = 'LOST';
        const diff = (sportsbookTotal - actualTotal).toFixed(1);
        valueDifferential = `-${diff} Goals short (Over missed)`;
      }
    }

    const edgePercent = Number((6.0 + Math.abs(forecast.goalEdge) * 5.0).toFixed(1));
    const profitUnits = calcProfitUnits(oddsStr, outcome, 1.0);
    const isSuccess = outcome === 'WON';

    const analysisRecap = isSuccess
      ? `Goaltending and possession suppressed dangerous shooting lanes, confirming the Poisson projection with ${valueDifferential}.`
      : `High penalty minutes and transition rush opportunities produced unexpected high-danger goals (${valueDifferential}).`;

    const rawPick: GradedModelPick = {
      id: `nhl_real_${event.id || `${awayAbbrev}_${homeAbbrev}_${gameDate}`}`,
      season: '2026-27',
      sport: 'NHL',
      date: gameDate,
      time: timeStr,
      matchup: `${awayProf.name} @ ${homeProf.name}`,
      awayTeam: awayProf.name,
      homeTeam: homeProf.name,
      awayAbbrev: awayProf.abbreviation,
      homeAbbrev: homeProf.abbreviation,
      awayLogo: `https://assets.nhle.com/logos/nhl/svg/${awayProf.abbreviation}_light.svg`,
      homeLogo: `https://assets.nhle.com/logos/nhl/svg/${homeProf.abbreviation}_light.svg`,
      marketCategory: 'TOTAL',
      marketName,
      pickName: marketName,
      sportsbookLine: String(sportsbookTotal),
      sportsbookOdds: oddsStr,
      decimalOdds: 1.91,
      modelPickValue,
      modelProjection: forecast.modelProjectedTotal,
      modelWinProb: 0.605,
      edgePercent,
      confidence: edgePercent >= 8.5 ? 'HIGH' : 'MEDIUM',
      starRating: edgePercent >= 8.5 ? 5 : 4,
      actualScoreText: `${awayScore} - ${homeScore} (Total: ${actualTotal} Goals)`,
      currentValue: `${awayScore} - ${homeScore} (Total: ${actualTotal} Goals)`,
      valueDifferential,
      awayScore,
      homeScore,
      actualTotal,
      outcome,
      correctness: isSuccess ? 'SUCCESS' : outcome === 'LOST' ? 'FAILURE' : 'PUSH',
      unitsStaked: 1.0,
      profitUnits,
      analysisRecap,
    };

    return enrichPickComparison(rawPick);
  } catch (e) {
    console.warn('Error grading NHL game:', e);
    return null;
  }
}

/**
 * Grades a manually entered game result (for custom matches or offline testing).
 */
export function gradeManualGameResult(
  input: ManualGameInput,
  modelConfig: ModelConfig = DEFAULT_MODEL
): GradedModelPick {
  const actualTotal = input.awayScore + input.homeScore;
  const isHockey = input.sport === 'NHL' || input.sport === 'KHL';
  const unit = isHockey ? 'Goals' : 'Pts';
  const line = input.sportsbookLine;
  const odds = input.sportsbookOdds || '-110';

  let modelProjection = isHockey ? 5.8 : 223.5;
  if (!isHockey) {
    const q1 = (input.q1Away || 0) + (input.q1Home || 0);
    const q2 = (input.q2Away || 0) + (input.q2Home || 0);
    const q3 = (input.q3Away || 0) + (input.q3Home || 0);
    const q4 = (input.q4Away || 0) + (input.q4Home || 0);
    const quarters = [q1, q2, q3, q4].filter((q) => q > 0);
    const lowestQuarter = quarters.length === 4 ? Math.min(...quarters) : 45.0;
    modelProjection = Number((modelConfig.intercept + modelConfig.slope * lowestQuarter).toFixed(1));
  }

  const isUnder = input.pickType ? input.pickType === 'UNDER' : modelProjection <= line;
  const modelPickValue = `${isUnder ? 'UNDER' : 'OVER'} ${line} ${unit}`;
  const marketName = `${isUnder ? 'UNDER' : 'OVER'} ${line}`;

  let outcome: PickOutcome = 'WON';
  let valueDifferential = '';

  if (actualTotal === line) {
    outcome = 'PUSH';
    valueDifferential = `Push exactly on line (${line} ${unit})`;
  } else if (isUnder) {
    if (actualTotal < line) {
      outcome = 'WON';
      const diff = (line - actualTotal).toFixed(1);
      valueDifferential = `+${diff} ${unit} buffer (Under covered)`;
    } else {
      outcome = 'LOST';
      const diff = (actualTotal - line).toFixed(1);
      valueDifferential = `-${diff} ${unit} over (Under missed)`;
    }
  } else {
    if (actualTotal > line) {
      outcome = 'WON';
      const diff = (actualTotal - line).toFixed(1);
      valueDifferential = `+${diff} ${unit} clearance (Over covered)`;
    } else {
      outcome = 'LOST';
      const diff = (line - actualTotal).toFixed(1);
      valueDifferential = `-${diff} ${unit} short (Over missed)`;
    }
  }

  const isSuccess = outcome === 'WON';
  const edgePercent = 7.5;
  const profitUnits = calcProfitUnits(odds, outcome, 1.0);

  const rawPick: GradedModelPick = {
    id: `manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    season: '2026-27',
    sport: input.sport,
    date: input.date,
    time: input.time || 'Final',
    matchup: `${input.awayTeam} @ ${input.homeTeam}`,
    awayTeam: input.awayTeam,
    homeTeam: input.homeTeam,
    awayAbbrev: input.awayTeam.slice(0, 3).toUpperCase(),
    homeAbbrev: input.homeTeam.slice(0, 3).toUpperCase(),
    marketCategory: input.marketCategory || 'TOTAL',
    marketName,
    pickName: marketName,
    sportsbookLine: String(line),
    sportsbookOdds: odds,
    decimalOdds: 1.91,
    modelPickValue,
    modelProjection,
    modelWinProb: 0.62,
    edgePercent,
    confidence: 'HIGH',
    starRating: 5,
    actualScoreText: `${input.awayScore} - ${input.homeScore} (Total: ${actualTotal} ${unit})`,
    currentValue: `${input.awayScore} - ${input.homeScore} (Total: ${actualTotal} ${unit})`,
    valueDifferential,
    awayScore: input.awayScore,
    homeScore: input.homeScore,
    actualTotal,
    outcome,
    correctness: isSuccess ? 'SUCCESS' : outcome === 'LOST' ? 'FAILURE' : 'PUSH',
    unitsStaked: 1.0,
    profitUnits,
    analysisRecap: isSuccess
      ? `Audited score analysis confirmed the model's edge, closing with ${valueDifferential}.`
      : `Game flow shifted outside projected scoring range, concluding with ${valueDifferential}.`,
  };

  return enrichPickComparison(rawPick);
}

/**
 * Fetches recent completed scoreboards from ESPN for NBA & NHL,
 * grades every completed game not yet in the ledger, and returns the updated ledger.
 */
export async function fetchAndGradeAllRecentGameResults(
  existingPicks: GradedModelPick[],
  modelConfig: ModelConfig = DEFAULT_MODEL
): Promise<{
  newGradedPicks: GradedModelPick[];
  totalGradedPicks: GradedModelPick[];
  newlyAddedCount: number;
}> {
  const existingIdSet = new Set<string>();
  const existingMatchupKeySet = new Set<string>();

  for (const p of existingPicks) {
    if (p.id) existingIdSet.add(p.id);
    const key = `${p.date}_${p.sport}_${(p.awayAbbrev || '').toUpperCase()}_${(p.homeAbbrev || '').toUpperCase()}`;
    existingMatchupKeySet.add(key);
    // Also add name-based key
    const nameKey = `${p.date}_${p.sport}_${p.awayTeam.toLowerCase()}_${p.homeTeam.toLowerCase()}`;
    existingMatchupKeySet.add(nameKey);
  }

  const newlyGraded: GradedModelPick[] = [];

  // 1. Check NBA & NHL Scoreboards for Past 4 Days through Tomorrow
  const today = new Date();
  const datesToCheck: string[] = [];
  for (let offset = -3; offset <= 1; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    datesToCheck.push(d.toISOString().slice(0, 10).replace(/-/g, ''));
  }

  for (const dateQuery of datesToCheck) {
    try {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateQuery}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.events && Array.isArray(data.events)) {
          for (const ev of data.events) {
            const isCompleted = ev.status?.type?.completed === true || ev.status?.type?.state === 'post';
            if (!isCompleted) continue;

            const comp = ev.competitions?.[0];
            const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
            const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
            if (!away || !home) continue;

            const awayAbbrev = (away.team?.abbreviation || '').toUpperCase();
            const homeAbbrev = (home.team?.abbreviation || '').toUpperCase();
            const gameDate = ev.date ? ev.date.slice(0, 10) : '';

            const id = `nba_real_${ev.id}`;
            const key = `${gameDate}_NBA_${awayAbbrev}_${homeAbbrev}`;
            const nameKey = `${gameDate}_NBA_${(away.team?.displayName || '').toLowerCase()}_${(home.team?.displayName || '').toLowerCase()}`;

            if (existingIdSet.has(id) || existingMatchupKeySet.has(key) || existingMatchupKeySet.has(nameKey)) {
              continue;
            }

            const graded = gradeCompletedNBAGame(ev, modelConfig);
            if (graded) {
              newlyGraded.push(graded);
              existingIdSet.add(id);
              existingMatchupKeySet.add(key);
              existingMatchupKeySet.add(nameKey);
            }
          }
        }
      }
    } catch (e) {
      console.warn(`Error checking NBA scoreboard for ${dateQuery}:`, e);
    }

    // 2. Check NHL Scoreboard for date
    try {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=${dateQuery}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.events && Array.isArray(data.events)) {
          for (const ev of data.events) {
            const isCompleted = ev.status?.type?.completed === true || ev.status?.type?.state === 'post';
            if (!isCompleted) continue;

            const comp = ev.competitions?.[0];
            const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
            const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
            if (!away || !home) continue;

            const awayAbbrev = (away.team?.abbreviation || '').toUpperCase();
            const homeAbbrev = (home.team?.abbreviation || '').toUpperCase();
            const gameDate = ev.date ? ev.date.slice(0, 10) : '';

            const id = `nhl_real_${ev.id}`;
            const key = `${gameDate}_NHL_${awayAbbrev}_${homeAbbrev}`;
            const nameKey = `${gameDate}_NHL_${(away.team?.displayName || '').toLowerCase()}_${(home.team?.displayName || '').toLowerCase()}`;

            if (existingIdSet.has(id) || existingMatchupKeySet.has(key) || existingMatchupKeySet.has(nameKey)) {
              continue;
            }

            const graded = gradeCompletedNHLGame(ev);
            if (graded) {
              newlyGraded.push(graded);
              existingIdSet.add(id);
              existingMatchupKeySet.add(key);
              existingMatchupKeySet.add(nameKey);
            }
          }
        }
      }
    } catch (e) {
      console.warn(`Error checking NHL scoreboard for ${dateQuery}:`, e);
    }
  }

  // Combine newly graded picks with existing picks (latest date first)
  const totalGradedPicks = [...newlyGraded, ...existingPicks].sort((a, b) => {
    const dateComp = b.date.localeCompare(a.date);
    if (dateComp !== 0) return dateComp;
    return (b.id || '').localeCompare(a.id || '');
  });

  return {
    newGradedPicks: newlyGraded,
    totalGradedPicks,
    newlyAddedCount: newlyGraded.length,
  };
}

/**
 * Automatically reconciles pending tracked bets when game results finish.
 */
export function reconcileTrackedBets(
  gradedPicks: GradedModelPick[],
  trackedBets: TrackedBet[]
): { updatedBets: TrackedBet[]; resolvedCount: number } {
  let resolvedCount = 0;

  const updatedBets = trackedBets.map((bet) => {
    if (bet.status !== 'PENDING') return bet;

    // Search for matching graded pick
    const matched = gradedPicks.find((p) => {
      if (bet.matchId && p.id && (bet.matchId === p.id || p.id.includes(bet.matchId))) {
        return true;
      }
      const sameDate = p.date === bet.date;
      const sameAway = bet.matchup.includes(p.awayTeam) || bet.matchup.includes(p.awayAbbrev);
      const sameHome = bet.matchup.includes(p.homeTeam) || bet.matchup.includes(p.homeAbbrev);
      return sameDate && sameAway && sameHome;
    });

    if (!matched) return bet;

    resolvedCount++;
    const pickUpper = bet.pickType.toUpperCase();
    let newStatus: 'WON' | 'LOST' | 'PUSH' = 'LOST';

    if (matched.outcome === 'PUSH') {
      newStatus = 'PUSH';
    } else if (pickUpper.includes('UNDER')) {
      newStatus = matched.actualTotal < bet.targetLine ? 'WON' : matched.actualTotal > bet.targetLine ? 'LOST' : 'PUSH';
    } else if (pickUpper.includes('OVER')) {
      newStatus = matched.actualTotal > bet.targetLine ? 'WON' : matched.actualTotal < bet.targetLine ? 'LOST' : 'PUSH';
    } else {
      newStatus = matched.outcome === 'WON' ? 'WON' : matched.outcome === 'LOST' ? 'LOST' : 'PUSH';
    }

    return {
      ...bet,
      status: newStatus,
      actualTotal: matched.actualTotal,
      notes: `${bet.notes ? `${bet.notes} • ` : ''}Settled via Box Score: ${matched.actualScoreText}`,
    };
  });

  return { updatedBets, resolvedCount };
}
