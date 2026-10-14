import type { FootballFixture, FootballMatchStatus } from '../../types/football';
import { resolveCompetitionFromEspn } from '../../data/football/competitionsData';
import { resolveTeamThrowInProfile } from '../../data/football/historicalThrowInData';
import { calculateThrowInForecast } from '../../utils/football/throwInModelEngine';

const STORAGE_PREFIX = 'nbatotals_football_fixtures_';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Priority leagues to query from ESPN scoreboard endpoints
const ESPN_SOCCER_LEAGUES = [
  'eng.1',
  'esp.1',
  'ita.1',
  'ger.1',
  'fra.1',
  'uefa.champions',
  'uefa.europa',
  'eng.2',
  'usa.1',
  'ned.1',
  'por.1',
];

/**
 * Format a Date object to YYYYMMDD for ESPN API
 */
export function formatDateToEspn(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Maps ESPN match status text to FootballMatchStatus
 */
function normalizeEspnStatus(statusText: string): FootballMatchStatus {
  const s = (statusText || '').toLowerCase();
  if (s.includes('final') || s.includes('ft') || s.includes('completed')) return 'FINISHED';
  if (s.includes('in') || s.includes('live') || s.includes('halftime') || s.includes('ht') || s.includes("'")) return 'LIVE';
  if (s.includes('post') || s.includes('delay')) return 'POSTPONED';
  if (s.includes('canc') || s.includes('ab')) return 'CANCELLED';
  return 'SCHEDULED';
}

/**
 * Curated offline / fallback fixtures slate for demonstration or offline testing
 */
export const FALLBACK_FOOTBALL_FIXTURES: FootballFixture[] = [
  {
    id: 'fb_demo_01',
    name: 'Arsenal vs Manchester City',
    date: new Date().toISOString(),
    time: '16:30',
    status: 'SCHEDULED',
    homeTeam: {
      id: 'arsenal',
      name: 'Arsenal',
      abbrev: 'ARS',
      logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png',
    },
    awayTeam: {
      id: 'mancity',
      name: 'Manchester City',
      abbrev: 'MCI',
      logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png',
    },
    competition: {
      id: 'eng.1',
      name: 'English Premier League',
      country: 'England',
      logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png',
    },
    venue: 'Emirates Stadium, London',
  },
  {
    id: 'fb_demo_02',
    name: 'Real Madrid vs Barcelona',
    date: new Date().toISOString(),
    time: '20:00',
    status: 'SCHEDULED',
    homeTeam: {
      id: 'realmadrid',
      name: 'Real Madrid',
      abbrev: 'RMA',
      logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png',
    },
    awayTeam: {
      id: 'barcelona',
      name: 'Barcelona',
      abbrev: 'BAR',
      logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png',
    },
    competition: {
      id: 'esp.1',
      name: 'Spanish La Liga',
      country: 'Spain',
      logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png',
    },
    venue: 'Santiago Bernabéu, Madrid',
  },
  {
    id: 'fb_demo_03',
    name: 'Bayern Munich vs Bayer Leverkusen',
    date: new Date().toISOString(),
    time: '17:30',
    status: 'SCHEDULED',
    homeTeam: {
      id: 'bayern',
      name: 'Bayern Munich',
      abbrev: 'BAY',
      logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/132.png',
    },
    awayTeam: {
      id: 'leverkusen',
      name: 'Bayer Leverkusen',
      abbrev: 'B04',
      logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/131.png',
    },
    competition: {
      id: 'ger.1',
      name: 'German Bundesliga',
      country: 'Germany',
      logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/10.png',
    },
    venue: 'Allianz Arena, Munich',
  },
  {
    id: 'fb_demo_04',
    name: 'Inter Milan vs Juventus',
    date: new Date().toISOString(),
    time: '19:45',
    status: 'SCHEDULED',
    homeTeam: {
      id: 'inter',
      name: 'Inter Milan',
      abbrev: 'INT',
      logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
    },
    awayTeam: {
      id: 'juventus',
      name: 'Juventus',
      abbrev: 'JUV',
      logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/111.png',
    },
    competition: {
      id: 'ita.1',
      name: 'Italian Serie A',
      country: 'Italy',
      logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png',
    },
    venue: 'San Siro, Milan',
  },
  {
    id: 'fb_demo_05',
    name: 'Everton vs Getafe',
    date: new Date().toISOString(),
    time: '15:00',
    status: 'SCHEDULED',
    homeTeam: {
      id: 'everton',
      name: 'Everton',
      abbrev: 'EVE',
      logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/368.png',
    },
    awayTeam: {
      id: 'getafe',
      name: 'Getafe',
      abbrev: 'GET',
      logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/2922.png',
    },
    competition: {
      id: 'eng.1',
      name: 'Club Friendly / Direct Style Showcase',
      country: 'Europe',
    },
    venue: 'Goodison Park, Liverpool',
  },
  {
    id: 'fb_demo_06',
    name: 'Liverpool vs Chelsea',
    date: new Date().toISOString(),
    time: '16:30',
    status: 'SCHEDULED',
    homeTeam: {
      id: 'liverpool',
      name: 'Liverpool',
      abbrev: 'LIV',
      logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png',
    },
    awayTeam: {
      id: 'chelsea',
      name: 'Chelsea',
      abbrev: 'CHE',
      logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png',
    },
    competition: {
      id: 'eng.1',
      name: 'English Premier League',
      country: 'England',
      logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png',
    },
    venue: 'Anfield, Liverpool',
  },
];

/**
 * Enriches a fixture with historical throw-in profiles and quantitative forecast
 */
export function enrichFixtureWithForecast(fixture: FootballFixture): FootballFixture {
  const comp = resolveCompetitionFromEspn(fixture.competition.id || fixture.competition.name);
  const homeResolved = resolveTeamThrowInProfile(fixture.homeTeam.name, comp.id);
  const awayResolved = resolveTeamThrowInProfile(fixture.awayTeam.name, comp.id);

  // Add realistic market odds benchmark for marquee matchups
  let simulatedOdds: { underPrice: number; overPrice: number } | undefined = undefined;
  if (homeResolved.isVerified && awayResolved.isVerified) {
    // Top-tier bookmakers (e.g. Bet365, Pinnacle) typically price Under 40.5 between 1.80 and 1.95
    simulatedOdds = {
      underPrice: 1.87,
      overPrice: 1.95,
    };
  }

  const forecast = calculateThrowInForecast({
    matchId: fixture.id,
    homeTeamName: fixture.homeTeam.name,
    awayTeamName: fixture.awayTeam.name,
    competition: comp,
    kickoffTime: fixture.time,
    gameDate: fixture.date,
    venue: fixture.venue,
    homeProfile: homeResolved.profile,
    awayProfile: awayResolved.profile,
    isHomeVerified: homeResolved.isVerified,
    isAwayVerified: awayResolved.isVerified,
    marketOdds: simulatedOdds,
  });

  return {
    ...fixture,
    forecast,
  };
}

/**
 * Fetches soccer fixtures for a given date across top worldwide competitions
 */
export async function fetchFootballFixtures(date: Date = new Date()): Promise<FootballFixture[]> {
  const dateStr = formatDateToEspn(date);
  const cacheKey = `${STORAGE_PREFIX}${dateStr}`;

  // 1. Check local cache
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS && Array.isArray(parsed.fixtures) && parsed.fixtures.length > 0) {
          return parsed.fixtures;
        }
      }
    } catch {
      // Ignore cache read errors
    }
  }

  // 2. Fetch live data from ESPN Scoreboards across priority leagues concurrently
  const fetchedFixtures: FootballFixture[] = [];
  const fetchPromises = ESPN_SOCCER_LEAGUES.map(async (league) => {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${dateStr}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return;

      const data = await res.json();
      if (!data.events || !Array.isArray(data.events)) return;

      data.events.forEach((event: any) => {
        const compEvent = event.competitions?.[0];
        if (!compEvent) return;

        const competitors = compEvent.competitors || [];
        const homeComp = competitors.find((c: any) => c.homeAway === 'home') || competitors[0];
        const awayComp = competitors.find((c: any) => c.homeAway === 'away') || competitors[1];

        if (!homeComp || !awayComp) return;

        const fixture: FootballFixture = {
          id: event.id || `${league}_${homeComp.id}_${awayComp.id}`,
          name: event.name || `${homeComp.team.displayName} vs ${awayComp.team.displayName}`,
          date: event.date || new Date().toISOString(),
          time: new Date(event.date || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: normalizeEspnStatus(compEvent.status?.type?.name || event.status?.type?.name),
          statusDetail: compEvent.status?.type?.detail || event.status?.type?.detail,
          homeTeam: {
            id: homeComp.team.id,
            name: homeComp.team.displayName || homeComp.team.name,
            abbrev: homeComp.team.abbreviation || homeComp.team.name.slice(0, 3).toUpperCase(),
            logo: homeComp.team.logo || 'https://a.espncdn.com/i/teamlogos/default-team-logo-500.png',
            record: homeComp.records?.[0]?.summary,
          },
          awayTeam: {
            id: awayComp.team.id,
            name: awayComp.team.displayName || awayComp.team.name,
            abbrev: awayComp.team.abbreviation || awayComp.team.name.slice(0, 3).toUpperCase(),
            logo: awayComp.team.logo || 'https://a.espncdn.com/i/teamlogos/default-team-logo-500.png',
            record: awayComp.records?.[0]?.summary,
          },
          competition: {
            id: league,
            name: data.leagues?.[0]?.name || compEvent.league?.name || league,
            country: data.leagues?.[0]?.country || 'International',
            logo: data.leagues?.[0]?.logos?.[0]?.href,
          },
          venue: compEvent.venue?.fullName,
        };

        fetchedFixtures.push(enrichFixtureWithForecast(fixture));
      });
    } catch {
      // League fetch error ignored
    }
  });

  await Promise.allSettled(fetchPromises);

  // 3. If no matches were scheduled on that exact date across those leagues, provide fallback slate
  let finalFixtures: FootballFixture[] = fetchedFixtures;
  if (finalFixtures.length === 0) {
    finalFixtures = FALLBACK_FOOTBALL_FIXTURES.map((f) => enrichFixtureWithForecast(f));
  }

  // Deduplicate by match ID or teams
  const seen = new Set<string>();
  const dedupedFixtures = finalFixtures.filter((f) => {
    const key = `${f.homeTeam.name.toLowerCase()}_${f.awayTeam.name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Save to cache
  if (typeof window !== 'undefined' && dedupedFixtures.length > 0) {
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          timestamp: Date.now(),
          fixtures: dedupedFixtures,
        })
      );
    } catch {
      // Ignore cache write error
    }
  }

  return dedupedFixtures;
}

/**
 * Filter and sort fixtures for the UI
 */
export function filterAndSortFootballFixtures(
  fixtures: FootballFixture[],
  filter: {
    competitionId?: string;
    searchQuery?: string;
    sortBy?: 'edge' | 'probability' | 'lowest-expected' | 'time' | 'conviction';
  }
): FootballFixture[] {
  let list = [...fixtures];

  // 1. Filter by competition
  if (filter.competitionId && filter.competitionId !== 'all') {
    list = list.filter(
      (f) =>
        f.competition.id.toLowerCase() === filter.competitionId?.toLowerCase() ||
        f.forecast?.competition.id.toLowerCase() === filter.competitionId?.toLowerCase()
    );
  }

  // 2. Filter by search query
  if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
    const q = filter.searchQuery.toLowerCase().trim();
    list = list.filter(
      (f) =>
        f.homeTeam.name.toLowerCase().includes(q) ||
        f.awayTeam.name.toLowerCase().includes(q) ||
        f.competition.name.toLowerCase().includes(q)
    );
  }

  // 3. Sorting
  const sortBy = filter.sortBy || 'conviction';
  list.sort((a, b) => {
    const fA = a.forecast;
    const fB = b.forecast;
    if (!fA || !fB) return 0;

    switch (sortBy) {
      case 'conviction': {
        const tierRank: Record<string, number> = {
          HIGH_CONVICTION: 5,
          MODERATE_EDGE: 4,
          LEAN_UNDER: 3,
          NEUTRAL_PASS: 2,
          HIGH_VOLATILITY: 1,
        };
        const rankDiff = (tierRank[fB.confidenceTier] || 0) - (tierRank[fA.confidenceTier] || 0);
        if (rankDiff !== 0) return rankDiff;
        return fB.probabilityUnder40_5 - fA.probabilityUnder40_5;
      }
      case 'edge': {
        const edgeA = fA.marketProbabilityEdge ?? (fA.probabilityUnder40_5 - 50);
        const edgeB = fB.marketProbabilityEdge ?? (fB.probabilityUnder40_5 - 50);
        return edgeB - edgeA;
      }
      case 'probability':
        return fB.probabilityUnder40_5 - fA.probabilityUnder40_5;
      case 'lowest-expected':
        return fA.projectedTotalThrowIns - fB.projectedTotalThrowIns;
      case 'time':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      default:
        return 0;
    }
  });

  return list;
}
