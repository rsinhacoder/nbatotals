import type { RawGameInput } from './modelEngine';
import type { RawUpcomingInput } from './upcomingEngine';
import { getTeamProfile } from '../data/teamProfiles';

const PROXY_BASE_URL = '/api/espn/apis/site/v2/sports/basketball/nba/scoreboard';
const DIRECT_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';

interface ESPNCompetitor {
  homeAway: 'home' | 'away';
  score?: string;
  records?: Array<{ summary: string }>;
  team: {
    id: string;
    displayName: string;
    shortDisplayName?: string;
    abbreviation?: string;
    logo?: string;
  };
  linescores?: Array<{
    period: number;
    value: number;
  }>;
}

interface ESPNOdds {
  overUnder?: number;
  details?: string;
}

interface ESPNEvent {
  id: string;
  date: string;
  status: {
    type: {
      completed: boolean;
      state?: string; // 'pre', 'in', 'post'
      detail?: string;
    };
  };
  competitions: Array<{
    competitors: ESPNCompetitor[];
    odds?: ESPNOdds[];
  }>;
}

interface ESPNScoreboardResponse {
  events?: ESPNEvent[];
}

/**
 * Fetches completed scoreboard for a given date (YYYY-MM-DD) and seasonType.
 */
export async function fetchScoreboard(dateStr: string, seasonType: number = 2): Promise<RawGameInput[]> {
  const formattedDate = dateStr.replace(/-/g, '');
  const urlParams = `?dates=${formattedDate}&seasontype=${seasonType}&limit=100`;

  let response: Response;
  try {
    response = await fetch(`${PROXY_BASE_URL}${urlParams}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Proxy status: ${response.status}`);
  } catch {
    try {
      response = await fetch(`${DIRECT_BASE_URL}${urlParams}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`Direct status: ${response.status}`);
    } catch {
      return [];
    }
  }

  const data: ESPNScoreboardResponse = await response.json();
  if (!data.events || !Array.isArray(data.events)) {
    return [];
  }

  const games: RawGameInput[] = [];

  for (const event of data.events) {
    if (!event.status?.type?.completed) continue;

    const comp = event.competitions?.[0];
    if (!comp || comp.competitors?.length !== 2) continue;

    const away = comp.competitors.find((c) => c.homeAway === 'away');
    const home = comp.competitors.find((c) => c.homeAway === 'home');
    if (!away || !home) continue;

    const awayPeriods = getPeriodMap(away.linescores);
    const homePeriods = getPeriodMap(home.linescores);

    // Require periods 1..4
    if (
      !awayPeriods[1] || !homePeriods[1] ||
      !awayPeriods[2] || !homePeriods[2] ||
      !awayPeriods[3] || !homePeriods[3] ||
      !awayPeriods[4] || !homePeriods[4]
    ) {
      continue;
    }

    games.push({
      id: event.id,
      date: event.date ? event.date.slice(0, 10) : dateStr,
      seasonType: seasonType === 1 ? 'Preseason' : 'Regular Season',
      awayTeam: away.team.displayName,
      homeTeam: home.team.displayName,
      awayScore: parseFloat(away.score || '0'),
      homeScore: parseFloat(home.score || '0'),
      q1Away: awayPeriods[1],
      q1Home: homePeriods[1],
      q2Away: awayPeriods[2],
      q2Home: homePeriods[2],
      q3Away: awayPeriods[3],
      q3Home: homePeriods[3],
      q4Away: awayPeriods[4],
      q4Home: homePeriods[4],
    });
  }

  return games;
}

/**
 * Fetches scheduled / upcoming / in-progress games for today or future dates from ESPN scoreboard.
 */
export async function fetchUpcomingScoreboard(dateStr: string): Promise<RawUpcomingInput[]> {
  const formattedDate = dateStr.replace(/-/g, '');
  const urlParams = `?dates=${formattedDate}&limit=100`;

  let response: Response;
  try {
    response = await fetch(`${PROXY_BASE_URL}${urlParams}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Proxy status: ${response.status}`);
  } catch {
    try {
      response = await fetch(`${DIRECT_BASE_URL}${urlParams}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`Direct status: ${response.status}`);
    } catch {
      return [];
    }
  }

  const data: ESPNScoreboardResponse = await response.json();
  if (!data.events || !Array.isArray(data.events)) {
    return [];
  }

  const upcoming: RawUpcomingInput[] = [];

  for (const event of data.events) {
    if (event.status?.type?.completed) continue;

    const comp = event.competitions?.[0];
    if (!comp || comp.competitors?.length !== 2) continue;

    const away = comp.competitors.find((c) => c.homeAway === 'away');
    const home = comp.competitors.find((c) => c.homeAway === 'home');
    if (!away || !home) continue;

    const gameDate = event.date ? new Date(event.date) : new Date();
    const nbaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(gameDate);
    const timeStr = gameDate.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
    }) + ' ET';

    const isLive = event.status?.type?.state === 'in';
    const status = isLive ? 'Live' : 'Scheduled';

    const oddsTotal = comp.odds?.[0]?.overUnder;
    let sportsbookLine: number;
    if (typeof oddsTotal === 'number' && oddsTotal > 150) {
      sportsbookLine = oddsTotal;
    } else {
      const awayProf = getTeamProfile(away.team.displayName);
      const homeProf = getTeamProfile(home.team.displayName);
      sportsbookLine = Number(((awayProf.avgRegulationTotal + homeProf.avgRegulationTotal) / 2).toFixed(1));
    }

    const liveQuarterScores: { q1?: number; q2?: number; q3?: number; q4?: number } = {};
    if (isLive) {
      const awayMap = getPeriodMap(away.linescores);
      const homeMap = getPeriodMap(home.linescores);
      if (awayMap[1] && homeMap[1]) liveQuarterScores.q1 = awayMap[1] + homeMap[1];
      if (awayMap[2] && homeMap[2]) liveQuarterScores.q2 = awayMap[2] + homeMap[2];
      if (awayMap[3] && homeMap[3]) liveQuarterScores.q3 = awayMap[3] + homeMap[3];
      if (awayMap[4] && homeMap[4]) liveQuarterScores.q4 = awayMap[4] + homeMap[4];
    }

    upcoming.push({
      id: event.id,
      date: nbaDate,
      time: timeStr,
      status,
      awayTeam: away.team.displayName,
      homeTeam: home.team.displayName,
      awayRecord: away.records?.[0]?.summary || '',
      homeRecord: home.records?.[0]?.summary || '',
      sportsbookLine,
      liveQuarterScores: Object.keys(liveQuarterScores).length > 0 ? liveQuarterScores : undefined,
    });
  }

  return upcoming;
}

/**
 * Fetches real upcoming & live schedule across multiple days (today and upcoming days)
 * from official ESPN NBA scoreboard API.
 */
export async function fetchLiveUpcomingSchedule(daysAhead: number = 7): Promise<RawUpcomingInput[]> {
  const now = new Date();
  const todayEasternStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(now);
  const [year, month, day] = todayEasternStr.split('-').map(Number);

  const allUpcoming: RawUpcomingInput[] = [];
  const seenIds = new Set<string>();

  for (let offset = 0; offset <= daysAhead; offset++) {
    const targetDate = new Date(Date.UTC(year, month - 1, day + offset, 12, 0, 0));
    const formattedDate = targetDate.toISOString().slice(0, 10).replace(/-/g, '');
    const urlParams = `?dates=${formattedDate}&limit=100`;

    let response: Response | null = null;
    try {
      response = await fetch(`${PROXY_BASE_URL}${urlParams}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) response = null;
    } catch {
      response = null;
    }

    if (!response) {
      try {
        response = await fetch(`${DIRECT_BASE_URL}${urlParams}`, {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) continue;
      } catch {
        continue;
      }
    }

    try {
      const data: ESPNScoreboardResponse = await response.json();
      if (!data.events || !Array.isArray(data.events)) continue;

      for (const event of data.events) {
        if (seenIds.has(event.id)) continue;

        const comp = event.competitions?.[0];
        if (!comp || comp.competitors?.length !== 2) continue;

        const away = comp.competitors.find((c) => c.homeAway === 'away');
        const home = comp.competitors.find((c) => c.homeAway === 'home');
        if (!away || !home) continue;

        const gameDate = event.date ? new Date(event.date) : new Date();
        const nbaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(gameDate);
        const timeStr = gameDate.toLocaleTimeString('en-US', {
          timeZone: 'America/New_York',
          hour: 'numeric',
          minute: '2-digit',
        }) + ' ET';

        const isLive = event.status?.type?.state === 'in';
        const isPost = event.status?.type?.completed || event.status?.type?.state === 'post';

        // Omit finished games from previous days
        if (isPost && nbaDate < todayEasternStr) continue;

        const status = isLive ? 'Live' : isPost ? 'Final' : 'Scheduled';

        const oddsTotal = comp.odds?.[0]?.overUnder;
        let sportsbookLine: number;
        if (typeof oddsTotal === 'number' && oddsTotal > 150) {
          sportsbookLine = oddsTotal;
        } else {
          const awayProf = getTeamProfile(away.team.displayName);
          const homeProf = getTeamProfile(home.team.displayName);
          sportsbookLine = Number(((awayProf.avgRegulationTotal + homeProf.avgRegulationTotal) / 2).toFixed(1));
        }

        const liveQuarterScores: { q1?: number; q2?: number; q3?: number; q4?: number } = {};
        if (isLive || isPost) {
          const awayMap = getPeriodMap(away.linescores);
          const homeMap = getPeriodMap(home.linescores);
          if (awayMap[1] && homeMap[1]) liveQuarterScores.q1 = awayMap[1] + homeMap[1];
          if (awayMap[2] && homeMap[2]) liveQuarterScores.q2 = awayMap[2] + homeMap[2];
          if (awayMap[3] && homeMap[3]) liveQuarterScores.q3 = awayMap[3] + homeMap[3];
          if (awayMap[4] && homeMap[4]) liveQuarterScores.q4 = awayMap[4] + homeMap[4];
        }

        seenIds.add(event.id);
        allUpcoming.push({
          id: event.id,
          date: nbaDate,
          time: timeStr,
          status,
          awayTeam: away.team.displayName,
          homeTeam: home.team.displayName,
          awayRecord: away.records?.[0]?.summary || '',
          homeRecord: home.records?.[0]?.summary || '',
          sportsbookLine,
          liveQuarterScores: Object.keys(liveQuarterScores).length > 0 ? liveQuarterScores : undefined,
        });
      }
    } catch (e) {
      console.warn('Error reading ESPN day payload:', e);
    }
  }

  return allUpcoming.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

function getPeriodMap(linescores?: Array<{ period: number; value: number }>): Record<number, number> {
  const map: Record<number, number> = {};
  if (!linescores) return map;
  for (const item of linescores) {
    if (item.period !== undefined && item.value !== undefined) {
      map[item.period] = Number(item.value);
    }
  }
  return map;
}

/**
 * Sync games across a date range with progress updates.
 */
export async function syncDateRange(
  startDateStr: string,
  endDateStr: string,
  onProgress?: (current: string, count: number, totalDays: number) => void
): Promise<RawGameInput[]> {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const days: string[] = [];

  const curr = new Date(start);
  while (curr <= end) {
    days.push(curr.toISOString().slice(0, 10));
    curr.setDate(curr.getDate() + 1);
  }

  const allGames: RawGameInput[] = [];

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    if (onProgress) {
      onProgress(day, i + 1, days.length);
    }

    const [preGames, regGames] = await Promise.all([
      fetchScoreboard(day, 1),
      fetchScoreboard(day, 2),
    ]);

    allGames.push(...preGames, ...regGames);
    await new Promise((res) => setTimeout(res, 60));
  }

  const map = new Map<string, RawGameInput>();
  for (const g of allGames) {
    map.set(g.id, g);
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export interface NBANewsArticle {
  id: string;
  headline: string;
  description: string;
  published: string;
  imageUrl?: string;
  link?: string;
}

/**
 * Fetches real-time NBA news and headlines from ESPN
 */
export async function fetchNBANews(): Promise<NBANewsArticle[]> {
  const PROXY_URL = '/api/espn/apis/site/v2/sports/basketball/nba/news?limit=25';
  const DIRECT_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=25';

  let res: Response;
  try {
    res = await fetch(PROXY_URL);
    if (!res.ok) throw new Error(`Proxy status: ${res.status}`);
  } catch {
    try {
      res = await fetch(DIRECT_URL);
      if (!res.ok) throw new Error(`Direct status: ${res.status}`);
    } catch {
      return [];
    }
  }

  try {
    const data = await res.json();
    if (!data.articles || !Array.isArray(data.articles)) return [];
    return data.articles.map((a: any) => ({
      id: String(a.id || Math.random()),
      headline: a.headline || '',
      description: a.description || '',
      published: a.published || new Date().toISOString(),
      imageUrl: a.images?.[0]?.url,
      link: a.links?.web?.href || 'https://www.espn.com/nba/',
    }));
  } catch {
    return [];
  }
}
