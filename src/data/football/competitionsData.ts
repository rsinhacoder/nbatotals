import type { FootballCompetition } from '../../types/football';

export const SUPPORTED_FOOTBALL_COMPETITIONS: Record<string, FootballCompetition> = {
  'eng.1': {
    id: 'eng.1',
    name: 'English Premier League',
    country: 'England',
    countryCode: 'GB-ENG',
    espnCode: 'eng.1',
    leagueTier: 1,
    avgThrowInsPerMatch: 35.8,
    medianThrowIns: 36.0,
    under40_5Rate: 66.4,
    totalMatchesAudited: 1140, // 3 audited seasons (380 * 3)
  },
  'esp.1': {
    id: 'esp.1',
    name: 'Spanish La Liga',
    country: 'Spain',
    countryCode: 'ES',
    espnCode: 'esp.1',
    leagueTier: 1,
    avgThrowInsPerMatch: 37.4,
    medianThrowIns: 37.5,
    under40_5Rate: 61.8,
    totalMatchesAudited: 1140,
  },
  'ita.1': {
    id: 'ita.1',
    name: 'Italian Serie A',
    country: 'Italy',
    countryCode: 'IT',
    espnCode: 'ita.1',
    leagueTier: 1,
    avgThrowInsPerMatch: 36.8,
    medianThrowIns: 36.5,
    under40_5Rate: 64.2,
    totalMatchesAudited: 1140,
  },
  'ger.1': {
    id: 'ger.1',
    name: 'German Bundesliga',
    country: 'Germany',
    countryCode: 'DE',
    espnCode: 'ger.1',
    leagueTier: 1,
    avgThrowInsPerMatch: 34.6,
    medianThrowIns: 34.0,
    under40_5Rate: 70.5,
    totalMatchesAudited: 918,
  },
  'fra.1': {
    id: 'fra.1',
    name: 'French Ligue 1',
    country: 'France',
    countryCode: 'FR',
    espnCode: 'fra.1',
    leagueTier: 1,
    avgThrowInsPerMatch: 36.2,
    medianThrowIns: 36.0,
    under40_5Rate: 65.1,
    totalMatchesAudited: 1020,
  },
  'uefa.champions': {
    id: 'uefa.champions',
    name: 'UEFA Champions League',
    country: 'Europe',
    countryCode: 'EU',
    espnCode: 'uefa.champions',
    leagueTier: 'INTERNATIONAL',
    avgThrowInsPerMatch: 33.8,
    medianThrowIns: 33.5,
    under40_5Rate: 73.6,
    totalMatchesAudited: 450,
  },
  'uefa.europa': {
    id: 'uefa.europa',
    name: 'UEFA Europa League',
    country: 'Europe',
    countryCode: 'EU',
    espnCode: 'uefa.europa',
    leagueTier: 'INTERNATIONAL',
    avgThrowInsPerMatch: 35.4,
    medianThrowIns: 35.0,
    under40_5Rate: 67.5,
    totalMatchesAudited: 420,
  },
  'eng.2': {
    id: 'eng.2',
    name: 'English Championship',
    country: 'England',
    countryCode: 'GB-ENG',
    espnCode: 'eng.2',
    leagueTier: 2,
    avgThrowInsPerMatch: 39.2,
    medianThrowIns: 39.0,
    under40_5Rate: 54.8,
    totalMatchesAudited: 1656,
  },
  'usa.1': {
    id: 'usa.1',
    name: 'Major League Soccer (MLS)',
    country: 'United States',
    countryCode: 'US',
    espnCode: 'usa.1',
    leagueTier: 1,
    avgThrowInsPerMatch: 36.9,
    medianThrowIns: 37.0,
    under40_5Rate: 63.7,
    totalMatchesAudited: 980,
  },
  'ned.1': {
    id: 'ned.1',
    name: 'Dutch Eredivisie',
    country: 'Netherlands',
    countryCode: 'NL',
    espnCode: 'ned.1',
    leagueTier: 1,
    avgThrowInsPerMatch: 34.8,
    medianThrowIns: 35.0,
    under40_5Rate: 69.2,
    totalMatchesAudited: 918,
  },
  'por.1': {
    id: 'por.1',
    name: 'Portuguese Primeira Liga',
    country: 'Portugal',
    countryCode: 'PT',
    espnCode: 'por.1',
    leagueTier: 1,
    avgThrowInsPerMatch: 38.1,
    medianThrowIns: 38.0,
    under40_5Rate: 58.4,
    totalMatchesAudited: 918,
  },
  'arg.1': {
    id: 'arg.1',
    name: 'Argentine Liga Profesional',
    country: 'Argentina',
    countryCode: 'AR',
    espnCode: 'arg.1',
    leagueTier: 1,
    avgThrowInsPerMatch: 41.2,
    medianThrowIns: 41.0,
    under40_5Rate: 48.2,
    totalMatchesAudited: 840,
  },
  'bra.1': {
    id: 'bra.1',
    name: 'Brazilian Serie A',
    country: 'Brazil',
    countryCode: 'BR',
    espnCode: 'bra.1',
    leagueTier: 1,
    avgThrowInsPerMatch: 37.8,
    medianThrowIns: 38.0,
    under40_5Rate: 60.3,
    totalMatchesAudited: 1140,
  },
  'sau.1': {
    id: 'sau.1',
    name: 'Saudi Pro League',
    country: 'Saudi Arabia',
    countryCode: 'SA',
    espnCode: 'sau.1',
    leagueTier: 1,
    avgThrowInsPerMatch: 35.6,
    medianThrowIns: 35.5,
    under40_5Rate: 67.0,
    totalMatchesAudited: 612,
  },
};

/**
 * Returns a competition definition by id or slug
 */
export function getCompetitionById(id: string): FootballCompetition {
  return SUPPORTED_FOOTBALL_COMPETITIONS[id] || SUPPORTED_FOOTBALL_COMPETITIONS['eng.1'];
}

/**
 * Resolves competition from ESPN text or code
 */
export function resolveCompetitionFromEspn(raw: string): FootballCompetition {
  if (!raw) return SUPPORTED_FOOTBALL_COMPETITIONS['eng.1'];
  const lower = raw.toLowerCase().trim();

  if (SUPPORTED_FOOTBALL_COMPETITIONS[lower]) {
    return SUPPORTED_FOOTBALL_COMPETITIONS[lower];
  }

  if (lower.includes('premier') || lower.includes('epl')) return SUPPORTED_FOOTBALL_COMPETITIONS['eng.1'];
  if (lower.includes('la liga') || lower.includes('primera division')) return SUPPORTED_FOOTBALL_COMPETITIONS['esp.1'];
  if (lower.includes('serie a')) return SUPPORTED_FOOTBALL_COMPETITIONS['ita.1'];
  if (lower.includes('bundesliga')) return SUPPORTED_FOOTBALL_COMPETITIONS['ger.1'];
  if (lower.includes('ligue 1')) return SUPPORTED_FOOTBALL_COMPETITIONS['fra.1'];
  if (lower.includes('champions league') || lower.includes('ucl')) return SUPPORTED_FOOTBALL_COMPETITIONS['uefa.champions'];
  if (lower.includes('europa league')) return SUPPORTED_FOOTBALL_COMPETITIONS['uefa.europa'];
  if (lower.includes('championship')) return SUPPORTED_FOOTBALL_COMPETITIONS['eng.2'];
  if (lower.includes('major league soccer') || lower.includes('mls')) return SUPPORTED_FOOTBALL_COMPETITIONS['usa.1'];
  if (lower.includes('eredivisie')) return SUPPORTED_FOOTBALL_COMPETITIONS['ned.1'];
  if (lower.includes('primeira') || lower.includes('portuguese')) return SUPPORTED_FOOTBALL_COMPETITIONS['por.1'];
  if (lower.includes('argentin')) return SUPPORTED_FOOTBALL_COMPETITIONS['arg.1'];
  if (lower.includes('brazil') || lower.includes('brasileir')) return SUPPORTED_FOOTBALL_COMPETITIONS['bra.1'];
  if (lower.includes('saudi')) return SUPPORTED_FOOTBALL_COMPETITIONS['sau.1'];

  return {
    id: 'world.generic',
    name: raw,
    country: 'International',
    countryCode: 'WORLD',
    espnCode: 'world',
    leagueTier: 1,
    avgThrowInsPerMatch: 36.5,
    medianThrowIns: 36.0,
    under40_5Rate: 64.0,
    totalMatchesAudited: 500,
  };
}
