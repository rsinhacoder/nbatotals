import type {
  FirstQuarterPlayerStats,
  GamePeriodStatus,
  InjuryStatus,
  NBAPlayerProfile,
  PlayerPropsMarket,
} from '../types/playerProps';
import { getPlayerProfile, NBA_PLAYER_PROFILES } from '../data/nbaPlayerBaselines';

const PROXY_SUMMARY_URL = '/api/espn/apis/site/v2/sports/basketball/nba/summary';
const DIRECT_SUMMARY_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary';

export interface LiveGameBoxscoreSummary {
  gameId: string;
  gameState: GamePeriodStatus;
  gameClock?: string;
  period?: number;
  awayTeam: string;
  homeTeam: string;
  awayScore: number;
  homeScore: number;
  athleteStats: Map<string, {
    minutes: number;
    points: number;
    fgm: number;
    fga: number;
    threePm: number;
    threePa: number;
    ftm: number;
    fta: number;
    fouls: number;
  }>;
  q1Stats: Map<string, {
    q1Points: number;
    q1Minutes: number;
    q1Fgm: number;
    q1Fga: number;
    q13pm: number;
    q13pa: number;
    q1Ftm: number;
    q1Fta: number;
    q1Fouls: number;
  }>;
  injuries: Array<{
    athleteId: string;
    athleteName: string;
    status: InjuryStatus;
    note: string;
  }>;
}

export class NBAPlayerStatsService {
  private summaryCache = new Map<string, { data: LiveGameBoxscoreSummary; timestamp: number }>();
  private readonly CACHE_TTL_MS = 60000; // 60s live cache

  /**
   * Fetches summary, boxscore, and play-by-play for a given NBA game.
   */
  public async fetchGameSummary(gameId: string): Promise<LiveGameBoxscoreSummary | null> {
    const cached = this.summaryCache.get(gameId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    let res: Response;
    const urlParams = `?event=${gameId}`;
    try {
      res = await fetch(`${PROXY_SUMMARY_URL}${urlParams}`);
      if (!res.ok) throw new Error('Proxy failed');
    } catch {
      try {
        res = await fetch(`${DIRECT_SUMMARY_URL}${urlParams}`);
        if (!res.ok) return null;
      } catch {
        return null;
      }
    }

    try {
      const data = await res.json();
      const parsed = this.parseESPNSummary(gameId, data);
      if (parsed) {
        this.summaryCache.set(gameId, { data: parsed, timestamp: Date.now() });
      }
      return parsed;
    } catch (e) {
      console.warn(`Could not parse ESPN summary for ${gameId}:`, e);
      return null;
    }
  }

  private parseESPNSummary(gameId: string, data: any): LiveGameBoxscoreSummary | null {
    if (!data) return null;

    const header = data.header;
    const comp = header?.competitions?.[0];
    const awayComp = comp?.competitors?.find((c: any) => c.homeAway === 'away');
    const homeComp = comp?.competitors?.find((c: any) => c.homeAway === 'home');

    const awayTeam = awayComp?.team?.abbreviation || 'AWY';
    const homeTeam = homeComp?.team?.abbreviation || 'HOM';
    const awayScore = parseInt(awayComp?.score || '0', 10);
    const homeScore = parseInt(homeComp?.score || '0', 10);

    // Determine Game Period Status
    const statusType = comp?.status?.type;
    const period = comp?.status?.period || 1;
    const clock = comp?.status?.displayClock || '12:00';
    let gameState: GamePeriodStatus = 'SCHEDULED';

    if (statusType?.completed) {
      gameState = 'FINAL';
    } else if (statusType?.state === 'in') {
      if (period === 1) {
        gameState = 'Q1_IN_PROGRESS';
      } else if (period === 2 && clock === '12:00') {
        gameState = 'Q1_COMPLETED';
      } else if (period === 2) {
        gameState = 'HALFTIME'; // Or second quarter
      } else if (period === 3) {
        gameState = 'Q3_IN_PROGRESS';
      } else if (period >= 4) {
        gameState = 'Q4_IN_PROGRESS';
      }
    } else if (statusType?.state === 'pre') {
      gameState = 'PRE_GAME';
    }

    const athleteStats = new Map<string, any>();
    const q1Stats = new Map<string, any>();

    // Parse Boxscore Athletes
    const boxPlayers = data.boxscore?.players || [];
    for (const teamBox of boxPlayers) {
      const athletes = teamBox?.statistics?.[0]?.athletes || [];
      for (const a of athletes) {
        const ath = a.athlete;
        if (!ath?.id) continue;
        const stats = a.stats || [];
        // [MIN, PTS, FG, 3PT, FT, REB, AST, TO, STL, BLK, OREB, DREB, PF, +/-]
        const min = parseFloat(stats[0] || '0');
        const pts = parseFloat(stats[1] || '0');
        const fg = (stats[2] || '0-0').split('-');
        const fgm = parseFloat(fg[0] || '0');
        const fga = parseFloat(fg[1] || '0');
        const tp = (stats[3] || '0-0').split('-');
        const threePm = parseFloat(tp[0] || '0');
        const threePa = parseFloat(tp[1] || '0');
        const ft = (stats[4] || '0-0').split('-');
        const ftm = parseFloat(ft[0] || '0');
        const fta = parseFloat(ft[1] || '0');
        const fouls = parseFloat(stats[12] || '0');

        athleteStats.set(ath.id, {
          minutes: min,
          points: pts,
          fgm,
          fga,
          threePm,
          threePa,
          ftm,
          fta,
          fouls,
        });

        // Also index by normalized name for matching
        if (ath.displayName) {
          const normName = ath.displayName.toLowerCase().replace(/[^a-z0-9]/g, '-');
          athleteStats.set(normName, athleteStats.get(ath.id));
        }
      }
    }

    // Parse Play-by-Play for exact Q1 actions
    const plays: any[] = data.plays || [];
    const q1Plays = plays.filter((p) => p.period?.number === 1);

    for (const p of q1Plays) {
      const shooterId = p.participants?.[0]?.athlete?.id;
      if (!shooterId) continue;

      if (!q1Stats.has(shooterId)) {
        q1Stats.set(shooterId, {
          q1Points: 0,
          q1Minutes: 0,
          q1Fgm: 0,
          q1Fga: 0,
          q13pm: 0,
          q13pa: 0,
          q1Ftm: 0,
          q1Fta: 0,
          q1Fouls: 0,
        });
      }

      const rec = q1Stats.get(shooterId)!;
      if (p.shootingPlay) {
        const ptsAttempted = p.pointsAttempted || (p.text?.includes('three point') ? 3 : 2);
        if (ptsAttempted === 3) rec.q13pa += 1;
        else if (ptsAttempted === 2) rec.q1Fga += 1;

        if (p.scoringPlay) {
          const scoreVal = p.scoreValue || ptsAttempted;
          rec.q1Points += scoreVal;
          if (ptsAttempted === 3) rec.q13pm += 1;
          rec.q1Fgm += 1;
        }
      } else if (p.type?.text?.includes('Free Throw')) {
        rec.q1Fta += 1;
        if (p.scoringPlay) {
          rec.q1Ftm += 1;
          rec.q1Points += 1;
        }
      } else if (p.type?.text?.includes('Foul')) {
        rec.q1Fouls += 1;
      }
    }

    // Parse Injuries
    const injuries: any[] = [];
    for (const injTeam of data.injuries || []) {
      for (const inj of injTeam.injuries || []) {
        injuries.push({
          athleteId: inj.athlete?.id,
          athleteName: inj.athlete?.displayName,
          status: this.mapInjuryStatus(inj.status),
          note: inj.details?.type || inj.status || 'Active',
        });
      }
    }

    return {
      gameId,
      gameState,
      gameClock: clock,
      period,
      awayTeam,
      homeTeam,
      awayScore,
      homeScore,
      athleteStats,
      q1Stats,
      injuries,
    };
  }

  private mapInjuryStatus(statusStr: string): InjuryStatus {
    const s = (statusStr || '').toLowerCase();
    if (s.includes('out')) return 'OUT';
    if (s.includes('day-to-day') || s.includes('gtd')) return 'DAY_TO_DAY';
    if (s.includes('questionable')) return 'QUESTIONABLE';
    if (s.includes('probable')) return 'PROBABLE';
    return 'ACTIVE';
  }

  /**
   * Retrieves player profile and stats baseline.
   */
  public getPlayerProfile(nameOrId: string): NBAPlayerProfile | undefined {
    return getPlayerProfile(nameOrId);
  }

  /**
   * Builds FirstQuarterPlayerStats for a player given live summary data.
   */
  public extractQ1PlayerStats(
    playerProfile: NBAPlayerProfile,
    gameSummary: LiveGameBoxscoreSummary | null,
    pointsLine: number
  ): FirstQuarterPlayerStats {
    let actualQ1Points = playerProfile.q1Ppg;
    let actualQ1Minutes = playerProfile.q1Minutes;
    let actualQ1Fgm = 3;
    let actualQ1Fga = 6;
    let actualQ13pm = 1;
    let actualQ13pa = 2;
    let actualQ1Ftm = 1;
    let actualQ1Fta = 1;
    let actualQ1Fouls = 0;

    if (gameSummary) {
      const q1 =
        gameSummary.q1Stats.get(playerProfile.id) ||
        gameSummary.q1Stats.get(playerProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '-'));

      if (q1) {
        actualQ1Points = q1.q1Points;
        actualQ1Fgm = q1.q1Fgm;
        actualQ1Fga = q1.q1Fga;
        actualQ13pm = q1.q13pm;
        actualQ13pa = q1.q13pa;
        actualQ1Ftm = q1.q1Ftm;
        actualQ1Fta = q1.q1Fta;
        actualQ1Fouls = q1.q1Fouls;
      }

      const fullBox =
        gameSummary.athleteStats.get(playerProfile.id) ||
        gameSummary.athleteStats.get(playerProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '-'));

      if (fullBox && gameSummary.gameState === 'Q1_COMPLETED') {
        actualQ1Minutes = fullBox.minutes || playerProfile.q1Minutes;
      }
    }

    const preGameExpectedQ1Points = playerProfile.q1Ppg;
    const preGameExpectedQ1Minutes = playerProfile.q1Minutes;
    const pointsDiffQ1 = Number((actualQ1Points - preGameExpectedQ1Points).toFixed(1));
    const minDiffQ1 = Number((actualQ1Minutes - preGameExpectedQ1Minutes).toFixed(1));

    const actualEfficiency = actualQ1Fga > 0 ? Number(((actualQ1Fgm / actualQ1Fga) * 100).toFixed(1)) : 50.0;
    const isHotHandVariance = actualEfficiency >= 75.0 && actualQ1Fga <= 4;
    const isVolumeExpansion = actualQ1Fga >= 8;

    // Calculate remaining minutes based on foul trouble and expected rotation
    let expectedRemainingMinutes = playerProfile.expectedMinutes - actualQ1Minutes;
    if (actualQ1Fouls >= 2) {
      expectedRemainingMinutes = Math.max(12, expectedRemainingMinutes - 4.5); // Bench time penalty
    }

    // Regressed remaining scoring rate (pts/min)
    const basePpm = playerProfile.seasonPpg / playerProfile.seasonMinutes;
    // Blend: 75% baseline PPM + 25% early game pace
    const earlyPpm = actualQ1Minutes > 0 ? actualQ1Points / actualQ1Minutes : basePpm;
    const blendedPpm = basePpm * 0.75 + earlyPpm * 0.25;

    const remainingExpectedPoints = expectedRemainingMinutes * blendedPpm;
    const updatedProjectedFinalPoints = Number((actualQ1Points + remainingExpectedPoints).toFixed(1));

    return {
      playerId: playerProfile.id,
      playerName: playerProfile.name,
      gameId: gameSummary?.gameId || 'game_sim',
      team: playerProfile.team,
      opponent: playerProfile.team === 'DAL' ? 'HOU' : 'OPP',
      actualQ1Points,
      actualQ1Minutes,
      actualQ1Fgm,
      actualQ1Fga,
      actualQ13pm,
      actualQ13pa,
      actualQ1Ftm,
      actualQ1Fta,
      actualQ1Fouls,
      preGameExpectedQ1Points,
      preGameExpectedQ1Minutes,
      preGameProjectedFinalPoints: playerProfile.seasonPpg,
      pointsDifferenceQ1: pointsDiffQ1,
      minutesDifferenceQ1: minDiffQ1,
      actualShotEfficiency: actualEfficiency,
      isHotHandVariance,
      isVolumeExpansion,
      expectedRemainingMinutes: Number(expectedRemainingMinutes.toFixed(1)),
      updatedProjectedFinalPoints,
      currentPointsLine: pointsLine,
      updatedProbOver: 0.5,
      updatedProbUnder: 0.5,
      probOverChangeSinceTip: 0,
      probUnderChangeSinceTip: 0,
      updatedRecommendation: 'NO EDGE',
      updatedEdge: 0,
      scannerSummary: '',
    };
  }
}

export const nbaPlayerStatsService = new NBAPlayerStatsService();
