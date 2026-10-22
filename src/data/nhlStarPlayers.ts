/**
 * Marquee Star Players for all 32 NHL Franchises.
 * Uses official ESPN CDN high-resolution transparent player headshots and official team colors.
 */

export interface NHLStarPlayer {
  id: string;
  name: string;
  shortName: string;
  team: string; // Abbreviation e.g. "EDM"
  teamName: string;
  position: 'C' | 'LW' | 'RW' | 'D' | 'G';
  jersey: string;
  goalsPerGame: number;
  pointsPerGame: number;
  headshotUrl: string;
  primaryColor: string;
}

export const NHL_STAR_PLAYERS: Record<string, NHLStarPlayer> = {
  ANA: {
    id: '4565220',
    name: 'Trevor Zegras',
    shortName: 'T. Zegras',
    team: 'ANA',
    teamName: 'Anaheim Ducks',
    position: 'C',
    jersey: '#11',
    goalsPerGame: 0.32,
    pointsPerGame: 0.82,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/4565220.png',
    primaryColor: '#F47A38',
  },
  BOS: {
    id: '3114778',
    name: 'David Pastrnak',
    shortName: 'D. Pastrnak',
    team: 'BOS',
    teamName: 'Boston Bruins',
    position: 'RW',
    jersey: '#88',
    goalsPerGame: 0.58,
    pointsPerGame: 1.34,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/3114778.png',
    primaryColor: '#FFB81C',
  },
  BUF: {
    id: '4024855',
    name: 'Tage Thompson',
    shortName: 'T. Thompson',
    team: 'BUF',
    teamName: 'Buffalo Sabres',
    position: 'C',
    jersey: '#72',
    goalsPerGame: 0.52,
    pointsPerGame: 1.05,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/4024855.png',
    primaryColor: '#002654',
  },
  CAR: {
    id: '3899938',
    name: 'Sebastian Aho',
    shortName: 'S. Aho',
    team: 'CAR',
    teamName: 'Carolina Hurricanes',
    position: 'C',
    jersey: '#20',
    goalsPerGame: 0.44,
    pointsPerGame: 1.12,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/3899938.png',
    primaryColor: '#CC0000',
  },
  CBJ: {
    id: '3904178',
    name: 'Zach Werenski',
    shortName: 'Z. Werenski',
    team: 'CBJ',
    teamName: 'Columbus Blue Jackets',
    position: 'D',
    jersey: '#8',
    goalsPerGame: 0.22,
    pointsPerGame: 0.81,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/3904178.png',
    primaryColor: '#002654',
  },
  CGY: {
    id: '5074',
    name: 'Nazem Kadri',
    shortName: 'N. Kadri',
    team: 'CGY',
    teamName: 'Calgary Flames',
    position: 'C',
    jersey: '#91',
    goalsPerGame: 0.36,
    pointsPerGame: 0.92,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/5074.png',
    primaryColor: '#C8102E',
  },
  CHI: {
    id: '4697330',
    name: 'Connor Bedard',
    shortName: 'C. Bedard',
    team: 'CHI',
    teamName: 'Chicago Blackhawks',
    position: 'C',
    jersey: '#98',
    goalsPerGame: 0.42,
    pointsPerGame: 0.98,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/4697330.png',
    primaryColor: '#CF0A2C',
  },
  COL: {
    id: '3041970',
    name: 'Nathan MacKinnon',
    shortName: 'N. MacKinnon',
    team: 'COL',
    teamName: 'Colorado Avalanche',
    position: 'C',
    jersey: '#29',
    goalsPerGame: 0.62,
    pointsPerGame: 1.68,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/3041970.png',
    primaryColor: '#6F263D',
  },
  DAL: {
    id: '4233575',
    name: 'Jason Robertson',
    shortName: 'J. Robertson',
    team: 'DAL',
    teamName: 'Dallas Stars',
    position: 'LW',
    jersey: '#21',
    goalsPerGame: 0.45,
    pointsPerGame: 1.15,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/4233575.png',
    primaryColor: '#006847',
  },
  DET: {
    id: '3114755',
    name: 'Dylan Larkin',
    shortName: 'D. Larkin',
    team: 'DET',
    teamName: 'Detroit Red Wings',
    position: 'C',
    jersey: '#71',
    goalsPerGame: 0.41,
    pointsPerGame: 0.98,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/3114755.png',
    primaryColor: '#CE1126',
  },
  EDM: {
    id: '3895074',
    name: 'Connor McDavid',
    shortName: 'C. McDavid',
    team: 'EDM',
    teamName: 'Edmonton Oilers',
    position: 'C',
    jersey: '#97',
    goalsPerGame: 0.65,
    pointsPerGame: 1.82,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/3895074.png',
    primaryColor: '#041E42',
  },
  FLA: {
    id: '3041972',
    name: 'Aleksander Barkov',
    shortName: 'A. Barkov',
    team: 'FLA',
    teamName: 'Florida Panthers',
    position: 'C',
    jersey: '#16',
    goalsPerGame: 0.38,
    pointsPerGame: 1.10,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/3041972.png',
    primaryColor: '#041E42',
  },
  LAK: {
    id: '3466',
    name: 'Anze Kopitar',
    shortName: 'A. Kopitar',
    team: 'LAK',
    teamName: 'Los Angeles Kings',
    position: 'C',
    jersey: '#11',
    goalsPerGame: 0.32,
    pointsPerGame: 0.88,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/3466.png',
    primaryColor: '#111111',
  },
  MIN: {
    id: '3904177',
    name: 'Kirill Kaprizov',
    shortName: 'K. Kaprizov',
    team: 'MIN',
    teamName: 'Minnesota Wild',
    position: 'LW',
    jersey: '#97',
    goalsPerGame: 0.56,
    pointsPerGame: 1.28,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/3904177.png',
    primaryColor: '#154734',
  },
  MTL: {
    id: '4565219',
    name: 'Cole Caufield',
    shortName: 'C. Caufield',
    team: 'MTL',
    teamName: 'Montreal Canadiens',
    position: 'RW',
    jersey: '#22',
    goalsPerGame: 0.42,
    pointsPerGame: 0.84,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/4565219.png',
    primaryColor: '#AF1E2D',
  },
  NJD: {
    id: '4565218',
    name: 'Jack Hughes',
    shortName: 'J. Hughes',
    team: 'NJD',
    teamName: 'New Jersey Devils',
    position: 'C',
    jersey: '#86',
    goalsPerGame: 0.48,
    pointsPerGame: 1.25,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/4565218.png',
    primaryColor: '#CE1126',
  },
  NSH: {
    id: '5041',
    name: 'Roman Josi',
    shortName: 'R. Josi',
    team: 'NSH',
    teamName: 'Nashville Predators',
    position: 'D',
    jersey: '#59',
    goalsPerGame: 0.28,
    pointsPerGame: 1.02,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/5041.png',
    primaryColor: '#FFB81C',
  },
  NYI: {
    id: '3899939',
    name: 'Mathew Barzal',
    shortName: 'M. Barzal',
    team: 'NYI',
    teamName: 'New York Islanders',
    position: 'C',
    jersey: '#13',
    goalsPerGame: 0.30,
    pointsPerGame: 0.98,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/3899939.png',
    primaryColor: '#00539B',
  },
  NYR: {
    id: '3899937',
    name: 'Artemi Panarin',
    shortName: 'A. Panarin',
    team: 'NYR',
    teamName: 'New York Rangers',
    position: 'LW',
    jersey: '#10',
    goalsPerGame: 0.54,
    pointsPerGame: 1.45,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/3899937.png',
    primaryColor: '#0038A8',
  },
  OTT: {
    id: '4323751',
    name: 'Brady Tkachuk',
    shortName: 'B. Tkachuk',
    team: 'OTT',
    teamName: 'Ottawa Senators',
    position: 'LW',
    jersey: '#7',
    goalsPerGame: 0.44,
    pointsPerGame: 0.92,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/4323751.png',
    primaryColor: '#C52032',
  },
  PHI: {
    id: '3899940',
    name: 'Travis Konecny',
    shortName: 'T. Konecny',
    team: 'PHI',
    teamName: 'Philadelphia Flyers',
    position: 'RW',
    jersey: '#11',
    goalsPerGame: 0.42,
    pointsPerGame: 0.94,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/3899940.png',
    primaryColor: '#F74902',
  },
  PIT: {
    id: '3114',
    name: 'Sidney Crosby',
    shortName: 'S. Crosby',
    team: 'PIT',
    teamName: 'Pittsburgh Penguins',
    position: 'C',
    jersey: '#87',
    goalsPerGame: 0.46,
    pointsPerGame: 1.18,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/3114.png',
    primaryColor: '#FCB514',
  },
  SEA: {
    id: '4697331',
    name: 'Matty Beniers',
    shortName: 'M. Beniers',
    team: 'SEA',
    teamName: 'Seattle Kraken',
    position: 'C',
    jersey: '#10',
    goalsPerGame: 0.30,
    pointsPerGame: 0.72,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/4697331.png',
    primaryColor: '#001628',
  },
  SJS: {
    id: '5122000',
    name: 'Macklin Celebrini',
    shortName: 'M. Celebrini',
    team: 'SJS',
    teamName: 'San Jose Sharks',
    position: 'C',
    jersey: '#71',
    goalsPerGame: 0.42,
    pointsPerGame: 0.95,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/5122000.png',
    primaryColor: '#006D75',
  },
  STL: {
    id: '4233572',
    name: 'Robert Thomas',
    shortName: 'R. Thomas',
    team: 'STL',
    teamName: 'St. Louis Blues',
    position: 'C',
    jersey: '#18',
    goalsPerGame: 0.32,
    pointsPerGame: 1.05,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/4233572.png',
    primaryColor: '#002F87',
  },
  TBL: {
    id: '2563060',
    name: 'Nikita Kucherov',
    shortName: 'N. Kucherov',
    team: 'TBL',
    teamName: 'Tampa Bay Lightning',
    position: 'RW',
    jersey: '#86',
    goalsPerGame: 0.54,
    pointsPerGame: 1.76,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/2563060.png',
    primaryColor: '#002868',
  },
  TOR: {
    id: '4024849',
    name: 'Auston Matthews',
    shortName: 'A. Matthews',
    team: 'TOR',
    teamName: 'Toronto Maple Leafs',
    position: 'C',
    jersey: '#34',
    goalsPerGame: 0.75,
    pointsPerGame: 1.32,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/4024849.png',
    primaryColor: '#00205B',
  },
  UTA: {
    id: '4024854',
    name: 'Clayton Keller',
    shortName: 'C. Keller',
    team: 'UTA',
    teamName: 'Utah Hockey Club',
    position: 'LW',
    jersey: '#9',
    goalsPerGame: 0.41,
    pointsPerGame: 1.01,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/4024854.png',
    primaryColor: '#69B3E7',
  },
  VAN: {
    id: '4233566',
    name: 'Elias Pettersson',
    shortName: 'E. Pettersson',
    team: 'VAN',
    teamName: 'Vancouver Canucks',
    position: 'C',
    jersey: '#40',
    goalsPerGame: 0.45,
    pointsPerGame: 1.14,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/4233566.png',
    primaryColor: '#00205B',
  },
  VGK: {
    id: '3895075',
    name: 'Jack Eichel',
    shortName: 'J. Eichel',
    team: 'VGK',
    teamName: 'Vegas Golden Knights',
    position: 'C',
    jersey: '#9',
    goalsPerGame: 0.46,
    pointsPerGame: 1.18,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/3895075.png',
    primaryColor: '#B4975A',
  },
  WPG: {
    id: '3899946',
    name: 'Kyle Connor',
    shortName: 'K. Connor',
    team: 'WPG',
    teamName: 'Winnipeg Jets',
    position: 'LW',
    jersey: '#81',
    goalsPerGame: 0.52,
    pointsPerGame: 1.08,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/3899946.png',
    primaryColor: '#041E42',
  },
  WSH: {
    id: '3101',
    name: 'Alex Ovechkin',
    shortName: 'A. Ovechkin',
    team: 'WSH',
    teamName: 'Washington Capitals',
    position: 'LW',
    jersey: '#8',
    goalsPerGame: 0.51,
    pointsPerGame: 0.98,
    headshotUrl: 'https://a.espncdn.com/i/headshots/nhl/players/full/3101.png',
    primaryColor: '#041E42',
  },
};

/**
 * Resolves star player for any NHL team name or abbreviation
 */
export function getStarPlayerForNHLTeam(teamOrAbbrev: string): NHLStarPlayer {
  if (!teamOrAbbrev) return NHL_STAR_PLAYERS['EDM'];

  const clean = teamOrAbbrev.trim().toUpperCase();

  // Direct match by abbreviation
  if (NHL_STAR_PLAYERS[clean]) {
    return NHL_STAR_PLAYERS[clean];
  }

  // Substring match by city or team name
  const lower = teamOrAbbrev.toLowerCase();
  for (const star of Object.values(NHL_STAR_PLAYERS)) {
    if (
      star.teamName.toLowerCase().includes(lower) ||
      lower.includes(star.teamName.toLowerCase()) ||
      lower.includes(star.team.toLowerCase())
    ) {
      return star;
    }
  }

  // Keyword fallbacks
  if (lower.includes('oilers') || lower.includes('edmonton')) return NHL_STAR_PLAYERS['EDM'];
  if (lower.includes('leafs') || lower.includes('toronto')) return NHL_STAR_PLAYERS['TOR'];
  if (lower.includes('avalanche') || lower.includes('colorado')) return NHL_STAR_PLAYERS['COL'];
  if (lower.includes('bruins') || lower.includes('boston')) return NHL_STAR_PLAYERS['BOS'];
  if (lower.includes('rangers') || lower.includes('new york r')) return NHL_STAR_PLAYERS['NYR'];
  if (lower.includes('panthers') || lower.includes('florida')) return NHL_STAR_PLAYERS['FLA'];
  if (lower.includes('lightning') || lower.includes('tampa')) return NHL_STAR_PLAYERS['TBL'];
  if (lower.includes('hurricanes') || lower.includes('carolina')) return NHL_STAR_PLAYERS['CAR'];
  if (lower.includes('penguins') || lower.includes('pittsburgh')) return NHL_STAR_PLAYERS['PIT'];
  if (lower.includes('capitals') || lower.includes('washington')) return NHL_STAR_PLAYERS['WSH'];
  if (lower.includes('knights') || lower.includes('vegas')) return NHL_STAR_PLAYERS['VGK'];
  if (lower.includes('devils') || lower.includes('new jersey')) return NHL_STAR_PLAYERS['NJD'];
  if (lower.includes('wild') || lower.includes('minnesota')) return NHL_STAR_PLAYERS['MIN'];
  if (lower.includes('canucks') || lower.includes('vancouver')) return NHL_STAR_PLAYERS['VAN'];
  if (lower.includes('stars') || lower.includes('dallas')) return NHL_STAR_PLAYERS['DAL'];
  if (lower.includes('jets') || lower.includes('winnipeg')) return NHL_STAR_PLAYERS['WPG'];
  if (lower.includes('islanders')) return NHL_STAR_PLAYERS['NYI'];
  if (lower.includes('wings') || lower.includes('detroit')) return NHL_STAR_PLAYERS['DET'];
  if (lower.includes('flyers') || lower.includes('philadelphia')) return NHL_STAR_PLAYERS['PHI'];
  if (lower.includes('senators') || lower.includes('ottawa')) return NHL_STAR_PLAYERS['OTT'];
  if (lower.includes('canadiens') || lower.includes('montreal')) return NHL_STAR_PLAYERS['MTL'];
  if (lower.includes('sabres') || lower.includes('buffalo')) return NHL_STAR_PLAYERS['BUF'];
  if (lower.includes('blue jackets') || lower.includes('columbus')) return NHL_STAR_PLAYERS['CBJ'];
  if (lower.includes('blackhawks') || lower.includes('chicago')) return NHL_STAR_PLAYERS['CHI'];
  if (lower.includes('predators') || lower.includes('nashville')) return NHL_STAR_PLAYERS['NSH'];
  if (lower.includes('blues') || lower.includes('st. louis') || lower.includes('st louis')) return NHL_STAR_PLAYERS['STL'];
  if (lower.includes('utah')) return NHL_STAR_PLAYERS['UTA'];
  if (lower.includes('flames') || lower.includes('calgary')) return NHL_STAR_PLAYERS['CGY'];
  if (lower.includes('kings') || lower.includes('los angeles')) return NHL_STAR_PLAYERS['LAK'];
  if (lower.includes('kraken') || lower.includes('seattle')) return NHL_STAR_PLAYERS['SEA'];
  if (lower.includes('ducks') || lower.includes('anaheim')) return NHL_STAR_PLAYERS['ANA'];
  if (lower.includes('sharks') || lower.includes('san jose')) return NHL_STAR_PLAYERS['SJS'];

  return NHL_STAR_PLAYERS['EDM'];
}
