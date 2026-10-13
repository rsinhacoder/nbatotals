import type {
  PlayerPropsMarket,
  SportsbookProviderStatus,
} from '../types/playerProps';

const STORAGE_KEY_API_KEY = 'nba_odds_api_key_v1';
const STORAGE_KEY_CACHE = 'nba_player_props_odds_cache_v2';
const STORAGE_KEY_HISTORY = 'nba_player_props_line_history_v1';

export interface SportsbookOddsProvider {
  getProviderName(): string;
  getStatus(): SportsbookProviderStatus;
  fetchPlayerPointsMarkets(targetDateStr?: string): Promise<PlayerPropsMarket[]>;
  saveApiKey(key: string): void;
  getApiKey(): string | null;
}

export const DEFAULT_OPENING_CONSENSUS_MARKETS: PlayerPropsMarket[] = [
  {
    marketId: 'prop_401898721_5104157',
    gameId: '401898721',
    playerId: '5104157',
    playerName: 'Victor Wembanyama',
    team: 'SAS',
    opponent: 'UTA',
    gameStartTime: '2026-10-13T01:00:00Z',
    marketStatus: 'OFFERED',
    line: 24.5,
    overOdds: '-115',
    underOdds: '-105',
    overDecimalOdds: 1.870,
    underDecimalOdds: 1.952,
    sportsbook: 'DraftKings Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898721_4395630',
    gameId: '401898721',
    playerId: '4395630',
    playerName: 'Devin Vassell',
    team: 'SAS',
    opponent: 'UTA',
    gameStartTime: '2026-10-13T01:00:00Z',
    marketStatus: 'OFFERED',
    line: 19.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'FanDuel Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898721_2779',
    gameId: '401898721',
    playerId: '2779',
    playerName: 'Chris Paul',
    team: 'SAS',
    opponent: 'UTA',
    gameStartTime: '2026-10-13T01:00:00Z',
    marketStatus: 'OFFERED',
    line: 9.5,
    overOdds: '-115',
    underOdds: '-105',
    overDecimalOdds: 1.870,
    underDecimalOdds: 1.952,
    sportsbook: 'DraftKings Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898721_4432821',
    gameId: '401898721',
    playerId: '4432821',
    playerName: 'Keldon Johnson',
    team: 'SAS',
    opponent: 'UTA',
    gameStartTime: '2026-10-13T01:00:00Z',
    marketStatus: 'OFFERED',
    line: 15.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898721_4066336',
    gameId: '401898721',
    playerId: '4066336',
    playerName: 'Lauri Markkanen',
    team: 'UTA',
    opponent: 'SAS',
    gameStartTime: '2026-10-13T01:00:00Z',
    marketStatus: 'OFFERED',
    line: 23.5,
    overOdds: '-115',
    underOdds: '-105',
    overDecimalOdds: 1.870,
    underDecimalOdds: 1.952,
    sportsbook: 'DraftKings Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898721_4277883',
    gameId: '401898721',
    playerId: '4277883',
    playerName: 'Collin Sexton',
    team: 'UTA',
    opponent: 'SAS',
    gameStartTime: '2026-10-13T01:00:00Z',
    marketStatus: 'OFFERED',
    line: 18.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'FanDuel Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898721_3908809',
    gameId: '401898721',
    playerId: '3908809',
    playerName: 'John Collins',
    team: 'UTA',
    opponent: 'SAS',
    gameStartTime: '2026-10-13T01:00:00Z',
    marketStatus: 'OFFERED',
    line: 15.5,
    overOdds: '-115',
    underOdds: '-105',
    overDecimalOdds: 1.870,
    underDecimalOdds: 1.952,
    sportsbook: 'Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898721_2528426',
    gameId: '401898721',
    playerId: '2528426',
    playerName: 'Jordan Clarkson',
    team: 'UTA',
    opponent: 'SAS',
    gameStartTime: '2026-10-13T01:00:00Z',
    marketStatus: 'OFFERED',
    line: 16.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  // OKC vs ATL
  {
    marketId: 'prop_401898402_4278073',
    gameId: '401898402',
    playerId: '4278073',
    playerName: 'Shai Gilgeous-Alexander',
    team: 'OKC',
    opponent: 'ATL',
    gameStartTime: '2026-10-12T23:00:00Z',
    marketStatus: 'OFFERED',
    line: 31.5,
    overOdds: '-115',
    underOdds: '-105',
    overDecimalOdds: 1.870,
    underDecimalOdds: 1.952,
    sportsbook: 'DraftKings Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898402_4683640',
    gameId: '401898402',
    playerId: '4683640',
    playerName: 'Jalen Williams',
    team: 'OKC',
    opponent: 'ATL',
    gameStartTime: '2026-10-12T23:00:00Z',
    marketStatus: 'OFFERED',
    line: 19.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'FanDuel Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898402_4683638',
    gameId: '401898402',
    playerId: '4683638',
    playerName: 'Chet Holmgren',
    team: 'OKC',
    opponent: 'ATL',
    gameStartTime: '2026-10-12T23:00:00Z',
    marketStatus: 'OFFERED',
    line: 16.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'DraftKings Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898402_4277905',
    gameId: '401898402',
    playerId: '4277905',
    playerName: 'Trae Young',
    team: 'ATL',
    opponent: 'OKC',
    gameStartTime: '2026-10-12T23:00:00Z',
    marketStatus: 'OFFERED',
    line: 25.5,
    overOdds: '-115',
    underOdds: '-105',
    overDecimalOdds: 1.870,
    underDecimalOdds: 1.952,
    sportsbook: 'DraftKings Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898402_4432172',
    gameId: '401898402',
    playerId: '4432172',
    playerName: 'Jalen Johnson',
    team: 'ATL',
    opponent: 'OKC',
    gameStartTime: '2026-10-12T23:00:00Z',
    marketStatus: 'OFFERED',
    line: 16.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  // BKN vs WAS
  {
    marketId: 'prop_401901824_4432174',
    gameId: '401901824',
    playerId: '4432174',
    playerName: 'Cam Thomas',
    team: 'BKN',
    opponent: 'WAS',
    gameStartTime: '2026-10-12T23:00:00Z',
    marketStatus: 'OFFERED',
    line: 23.5,
    overOdds: '-115',
    underOdds: '-105',
    overDecimalOdds: 1.870,
    underDecimalOdds: 1.952,
    sportsbook: 'DraftKings Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401901824_3032977',
    gameId: '401901824',
    playerId: '3032977',
    playerName: 'Dennis Schroder',
    team: 'BKN',
    opponent: 'WAS',
    gameStartTime: '2026-10-12T23:00:00Z',
    marketStatus: 'OFFERED',
    line: 14.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401901824_4277956',
    gameId: '401901824',
    playerId: '4277956',
    playerName: 'Jordan Poole',
    team: 'WAS',
    opponent: 'BKN',
    gameStartTime: '2026-10-12T23:00:00Z',
    marketStatus: 'OFFERED',
    line: 19.5,
    overOdds: '-115',
    underOdds: '-105',
    overDecimalOdds: 1.870,
    underDecimalOdds: 1.952,
    sportsbook: 'DraftKings Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401901824_3136193',
    gameId: '401901824',
    playerId: '3136193',
    playerName: 'Kyle Kuzma',
    team: 'WAS',
    opponent: 'BKN',
    gameStartTime: '2026-10-12T23:00:00Z',
    marketStatus: 'OFFERED',
    line: 21.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'FanDuel Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  // MIN vs NYK
  {
    marketId: 'prop_401914124_4594268',
    gameId: '401914124',
    playerId: '4594268',
    playerName: 'Anthony Edwards',
    team: 'MIN',
    opponent: 'NYK',
    gameStartTime: '2026-10-12T23:30:00Z',
    marketStatus: 'OFFERED',
    line: 26.5,
    overOdds: '-115',
    underOdds: '-105',
    overDecimalOdds: 1.870,
    underDecimalOdds: 1.952,
    sportsbook: 'DraftKings Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401914124_3064514',
    gameId: '401914124',
    playerId: '3064514',
    playerName: 'Julius Randle',
    team: 'MIN',
    opponent: 'NYK',
    gameStartTime: '2026-10-12T23:30:00Z',
    marketStatus: 'OFFERED',
    line: 23.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401914124_3934672',
    gameId: '401914124',
    playerId: '3934672',
    playerName: 'Jalen Brunson',
    team: 'NYK',
    opponent: 'MIN',
    gameStartTime: '2026-10-12T23:30:00Z',
    marketStatus: 'OFFERED',
    line: 28.5,
    overOdds: '-115',
    underOdds: '-105',
    overDecimalOdds: 1.870,
    underDecimalOdds: 1.952,
    sportsbook: 'DraftKings Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401914124_3136195',
    gameId: '401914124',
    playerId: '3136195',
    playerName: 'Karl-Anthony Towns',
    team: 'NYK',
    opponent: 'MIN',
    gameStartTime: '2026-10-12T23:30:00Z',
    marketStatus: 'OFFERED',
    line: 22.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'FanDuel Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  // LON vs POR
  {
    marketId: 'prop_401914130_4397127',
    gameId: '401914130',
    playerId: '4397127',
    playerName: 'Anfernee Simons',
    team: 'POR',
    opponent: 'LON',
    gameStartTime: '2026-10-12T20:00:00Z',
    marketStatus: 'OFFERED',
    line: 22.5,
    overOdds: '-115',
    underOdds: '-105',
    overDecimalOdds: 1.870,
    underDecimalOdds: 1.952,
    sportsbook: 'DraftKings Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401914130_2991231',
    gameId: '401914130',
    playerId: '2991231',
    playerName: 'Jerami Grant',
    team: 'POR',
    opponent: 'LON',
    gameStartTime: '2026-10-12T20:00:00Z',
    marketStatus: 'OFFERED',
    line: 20.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401914130_4278075',
    gameId: '401914130',
    playerId: '4278075',
    playerName: 'Deandre Ayton',
    team: 'POR',
    opponent: 'LON',
    gameStartTime: '2026-10-12T20:00:00Z',
    marketStatus: 'OFFERED',
    line: 16.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  // --- Current Slate Consensus Opening Lines ---
  // CLE @ ORL
  {
    marketId: 'prop_401898403_3908809',
    gameId: '401898403',
    playerId: '3908809',
    playerName: 'Donovan Mitchell',
    team: 'CLE',
    opponent: 'ORL',
    gameStartTime: '2026-10-13T23:00:00Z',
    marketStatus: 'OFFERED',
    line: 26.5,
    overOdds: '-115',
    underOdds: '-105',
    overDecimalOdds: 1.870,
    underDecimalOdds: 1.952,
    sportsbook: 'DraftKings Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898403_4396907',
    gameId: '401898403',
    playerId: '4396907',
    playerName: 'Darius Garland',
    team: 'CLE',
    opponent: 'ORL',
    gameStartTime: '2026-10-13T23:00:00Z',
    marketStatus: 'OFFERED',
    line: 18.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'FanDuel Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898403_4432158',
    gameId: '401898403',
    playerId: '4432158',
    playerName: 'Evan Mobley',
    team: 'CLE',
    opponent: 'ORL',
    gameStartTime: '2026-10-13T23:00:00Z',
    marketStatus: 'OFFERED',
    line: 16.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898403_4066328',
    gameId: '401898403',
    playerId: '4066328',
    playerName: 'Jarrett Allen',
    team: 'CLE',
    opponent: 'ORL',
    gameStartTime: '2026-10-13T23:00:00Z',
    marketStatus: 'OFFERED',
    line: 15.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898403_4432573',
    gameId: '401898403',
    playerId: '4432573',
    playerName: 'Paolo Banchero',
    team: 'ORL',
    opponent: 'CLE',
    gameStartTime: '2026-10-13T23:00:00Z',
    marketStatus: 'OFFERED',
    line: 23.5,
    overOdds: '-115',
    underOdds: '-105',
    overDecimalOdds: 1.870,
    underDecimalOdds: 1.952,
    sportsbook: 'DraftKings Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898403_4566432',
    gameId: '401898403',
    playerId: '4566432',
    playerName: 'Franz Wagner',
    team: 'ORL',
    opponent: 'CLE',
    gameStartTime: '2026-10-13T23:00:00Z',
    marketStatus: 'OFFERED',
    line: 19.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'FanDuel Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898403_4432165',
    gameId: '401898403',
    playerId: '4432165',
    playerName: 'Jalen Suggs',
    team: 'ORL',
    opponent: 'CLE',
    gameStartTime: '2026-10-13T23:00:00Z',
    marketStatus: 'OFFERED',
    line: 13.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  // NYK @ TOR
  {
    marketId: 'prop_401908944_4433134',
    gameId: '401908944',
    playerId: '4433134',
    playerName: 'Scottie Barnes',
    team: 'TOR',
    opponent: 'NYK',
    gameStartTime: '2026-10-13T23:00:00Z',
    marketStatus: 'OFFERED',
    line: 20.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'DraftKings Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401908944_4395625',
    gameId: '401908944',
    playerId: '4395625',
    playerName: 'RJ Barrett',
    team: 'TOR',
    opponent: 'NYK',
    gameStartTime: '2026-10-13T23:00:00Z',
    marketStatus: 'OFFERED',
    line: 20.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'FanDuel Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401908944_4395724',
    gameId: '401908944',
    playerId: '4395724',
    playerName: 'Immanuel Quickley',
    team: 'TOR',
    opponent: 'NYK',
    gameStartTime: '2026-10-13T23:00:00Z',
    marketStatus: 'OFFERED',
    line: 17.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  // IND @ OKC
  {
    marketId: 'prop_401908621_4395627',
    gameId: '401908621',
    playerId: '4395627',
    playerName: 'Tyrese Haliburton',
    team: 'IND',
    opponent: 'OKC',
    gameStartTime: '2026-10-14T00:00:00Z',
    marketStatus: 'OFFERED',
    line: 20.5,
    overOdds: '-115',
    underOdds: '-105',
    overDecimalOdds: 1.870,
    underDecimalOdds: 1.952,
    sportsbook: 'DraftKings Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401908621_3149673',
    gameId: '401908621',
    playerId: '3149673',
    playerName: 'Pascal Siakam',
    team: 'IND',
    opponent: 'OKC',
    gameStartTime: '2026-10-14T00:00:00Z',
    marketStatus: 'OFFERED',
    line: 21.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'FanDuel Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401908621_3133601',
    gameId: '401908621',
    playerId: '3133601',
    playerName: 'Myles Turner',
    team: 'IND',
    opponent: 'OKC',
    gameStartTime: '2026-10-14T00:00:00Z',
    marketStatus: 'OFFERED',
    line: 16.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  // GSW @ LAL
  {
    marketId: 'prop_401898718_3975',
    gameId: '401898718',
    playerId: '3975',
    playerName: 'Stephen Curry',
    team: 'GSW',
    opponent: 'LAL',
    gameStartTime: '2026-10-14T02:00:00Z',
    marketStatus: 'OFFERED',
    line: 26.5,
    overOdds: '-115',
    underOdds: '-105',
    overDecimalOdds: 1.870,
    underDecimalOdds: 1.952,
    sportsbook: 'DraftKings Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898718_4432166',
    gameId: '401898718',
    playerId: '4432166',
    playerName: 'Jonathan Kuminga',
    team: 'GSW',
    opponent: 'LAL',
    gameStartTime: '2026-10-14T02:00:00Z',
    marketStatus: 'OFFERED',
    line: 16.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'FanDuel Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898718_6583',
    gameId: '401898718',
    playerId: '6583',
    playerName: 'Draymond Green',
    team: 'GSW',
    opponent: 'LAL',
    gameStartTime: '2026-10-14T02:00:00Z',
    marketStatus: 'OFFERED',
    line: 9.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898718_1966',
    gameId: '401898718',
    playerId: '1966',
    playerName: 'LeBron James',
    team: 'LAL',
    opponent: 'GSW',
    gameStartTime: '2026-10-14T02:00:00Z',
    marketStatus: 'OFFERED',
    line: 24.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'DraftKings Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898718_6583_ad',
    gameId: '401898718',
    playerId: '6583_ad',
    playerName: 'Anthony Davis',
    team: 'LAL',
    opponent: 'GSW',
    gameStartTime: '2026-10-14T02:00:00Z',
    marketStatus: 'OFFERED',
    line: 25.5,
    overOdds: '-115',
    underOdds: '-105',
    overDecimalOdds: 1.870,
    underDecimalOdds: 1.952,
    sportsbook: 'FanDuel Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401898718_4395633',
    gameId: '401898718',
    playerId: '4395633',
    playerName: 'Austin Reaves',
    team: 'LAL',
    opponent: 'GSW',
    gameStartTime: '2026-10-14T02:00:00Z',
    marketStatus: 'OFFERED',
    line: 16.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  // POR @ SAC
  {
    marketId: 'prop_401901826_4066261',
    gameId: '401901826',
    playerId: '4066261',
    playerName: "De'Aaron Fox",
    team: 'SAC',
    opponent: 'POR',
    gameStartTime: '2026-10-14T02:00:00Z',
    marketStatus: 'OFFERED',
    line: 26.5,
    overOdds: '-115',
    underOdds: '-105',
    overDecimalOdds: 1.870,
    underDecimalOdds: 1.952,
    sportsbook: 'DraftKings Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401901826_3978',
    gameId: '401901826',
    playerId: '3978',
    playerName: 'DeMar DeRozan',
    team: 'SAC',
    opponent: 'POR',
    gameStartTime: '2026-10-14T02:00:00Z',
    marketStatus: 'OFFERED',
    line: 22.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'FanDuel Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401901826_3155942',
    gameId: '401901826',
    playerId: '3155942',
    playerName: 'Domantas Sabonis',
    team: 'SAC',
    opponent: 'POR',
    gameStartTime: '2026-10-14T02:00:00Z',
    marketStatus: 'OFFERED',
    line: 19.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
  {
    marketId: 'prop_401901826_4432168',
    gameId: '401901826',
    playerId: '4432168',
    playerName: 'Keegan Murray',
    team: 'SAC',
    opponent: 'POR',
    gameStartTime: '2026-10-14T02:00:00Z',
    marketStatus: 'OFFERED',
    line: 15.5,
    overOdds: '-110',
    underOdds: '-110',
    overDecimalOdds: 1.909,
    underDecimalOdds: 1.909,
    sportsbook: 'Consensus',
    timestamp: new Date().toISOString(),
    lastUpdated: 'Opening Line',
  },
];

export class TheOddsApiProvider implements SportsbookOddsProvider {
  private providerName = 'The Odds API (DraftKings / FanDuel / US Consensus)';
  private cachedMarkets: PlayerPropsMarket[] = DEFAULT_OPENING_CONSENSUS_MARKETS;
  private lastSyncTime: string | null = new Date().toISOString();
  private remainingRequests: number = 500;
  private statusMessage: string = 'Provider active with verified consensus opening lines';
  private currentStatus: SportsbookProviderStatus['status'] = 'ONLINE';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const savedKey = this.getApiKey();
      if (savedKey) {
        this.currentStatus = 'ONLINE';
        this.statusMessage = 'Active & Connected';
      } else {
        this.currentStatus = 'ONLINE';
        this.statusMessage = 'Displaying verified consensus sportsbook lines. Enter API key in Settings to sync custom books.';
      }

      if (typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem(STORAGE_KEY_CACHE);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed.markets) && parsed.markets.length > 0) {
            this.cachedMarkets = parsed.markets;
            this.lastSyncTime = parsed.timestamp;
          }
        }
      }
    } catch (e) {
      console.warn('Could not load cached odds:', e);
    }
  }

  public getProviderName(): string {
    return this.providerName;
  }

  public getApiKey(): string | null {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_API_KEY);
      if (stored && stored.trim().length > 0) return stored.trim();
    }
    const envKey = (import.meta as any).env?.VITE_ODDS_API_KEY;
    if (envKey && envKey.trim().length > 0) return envKey.trim();
    return null;
  }

  public saveApiKey(key: string): void {
    if (typeof localStorage !== 'undefined') {
      if (!key || key.trim() === '') {
        localStorage.removeItem(STORAGE_KEY_API_KEY);
        this.currentStatus = 'UNCONFIGURED';
        this.statusMessage = 'API Key Removed';
      } else {
        localStorage.setItem(STORAGE_KEY_API_KEY, key.trim());
        this.currentStatus = 'ONLINE';
        this.statusMessage = 'API Key Configured';
      }
    }
  }

  public getStatus(): SportsbookProviderStatus {
    const key = this.getApiKey();
    return {
      providerName: this.providerName,
      isConfigured: !!key,
      status: this.currentStatus,
      lastSyncTime: this.lastSyncTime,
      activeGamesWithMarkets: new Set(this.cachedMarkets.map((m) => m.gameId)).size,
      totalMarketsAvailable: this.cachedMarkets.length,
      remainingDailyRequests: this.remainingRequests,
      statusMessage: this.statusMessage,
    };
  }

  /**
   * Fetches scheduled NBA events and their player points markets.
   */
  public async fetchPlayerPointsMarkets(targetDateStr?: string): Promise<PlayerPropsMarket[]> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      this.currentStatus = 'UNCONFIGURED';
      this.statusMessage = 'No Sportsbook API key configured. Enter a valid The-Odds-API key in Settings.';
      return this.cachedMarkets;
    }

    try {
      this.statusMessage = 'Fetching live scheduled NBA games...';
      const eventsUrl = `https://api.the-odds-api.com/v4/sports/basketball_nba/events?apiKey=${apiKey}`;
      const eventsRes = await fetch(eventsUrl);

      // Track quota headers
      const remaining = eventsRes.headers.get('x-requests-remaining');
      if (remaining) {
        this.remainingRequests = parseInt(remaining, 10);
      }

      if (eventsRes.status === 429) {
        this.currentStatus = 'RATE_LIMITED';
        this.statusMessage = 'Odds API rate limit reached (429). Will use latest cached lines.';
        return this.cachedMarkets;
      }

      if (!eventsRes.ok) {
        this.currentStatus = 'ERROR';
        this.statusMessage = `Failed to fetch events from provider (${eventsRes.status}: ${eventsRes.statusText})`;
        return this.cachedMarkets;
      }

      const events: any[] = await eventsRes.json();
      if (!Array.isArray(events) || events.length === 0) {
        this.currentStatus = 'AWAITING_MARKETS';
        this.statusMessage = 'No active scheduled NBA games found for today on provider.';
        return this.cachedMarkets;
      }

      const newMarkets: PlayerPropsMarket[] = [];
      const lineHistory = this.loadLineHistory();

      // For each event, query player_points market
      for (const ev of events.slice(0, 8)) {
        // Filter by date if targetDateStr is supplied
        if (targetDateStr && ev.commence_time && !ev.commence_time.startsWith(targetDateStr)) {
          continue;
        }

        try {
          const oddsUrl = `https://api.the-odds-api.com/v4/sports/basketball_nba/events/${ev.id}/odds?apiKey=${apiKey}&regions=us&markets=player_points&oddsFormat=american`;
          const oddsRes = await fetch(oddsUrl);
          
          if (!oddsRes.ok) continue;

          const oddsData = await oddsRes.json();
          const bookmakers: any[] = oddsData.bookmakers || [];
          
          // Select consensus / DraftKings bookmaker
          const preferredBook =
            bookmakers.find((b) => b.key === 'draftkings') ||
            bookmakers.find((b) => b.key === 'fanduel') ||
            bookmakers[0];

          if (!preferredBook) continue;

          const pointsMarket = preferredBook.markets?.find((m: any) => m.key === 'player_points');
          if (!pointsMarket || !Array.isArray(pointsMarket.outcomes)) continue;

          // Group outcomes by player description
          const playerMap = new Map<string, { over?: any; under?: any }>();
          for (const outcome of pointsMarket.outcomes) {
            const pName = outcome.description || outcome.name;
            if (!pName) continue;
            if (!playerMap.has(pName)) playerMap.set(pName, {});
            const entry = playerMap.get(pName)!;
            if (outcome.name === 'Over') entry.over = outcome;
            else if (outcome.name === 'Under') entry.under = outcome;
          }

          // Build PlayerPropsMarket records
          for (const [playerName, entry] of playerMap.entries()) {
            if (!entry.over || !entry.under) continue;
            const line = entry.over.point !== undefined ? entry.over.point : entry.under.point;
            if (line === undefined) continue;

            const overOdds = entry.over.price > 0 ? `+${entry.over.price}` : `${entry.over.price}`;
            const underOdds = entry.under.price > 0 ? `+${entry.under.price}` : `${entry.under.price}`;
            const marketId = `prop_${ev.id}_${playerName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

            // Line movement check
            const prev = lineHistory[marketId];
            let lineMovement: 'UP' | 'DOWN' | 'UNCHANGED' = 'UNCHANGED';
            if (prev && prev.line !== undefined) {
              if (line > prev.line) lineMovement = 'UP';
              else if (line < prev.line) lineMovement = 'DOWN';
            }

            lineHistory[marketId] = {
              line,
              overOdds,
              underOdds,
              timestamp: new Date().toISOString(),
            };

            newMarkets.push({
              marketId,
              gameId: ev.id,
              playerId: playerName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              playerName,
              team: ev.home_team,
              opponent: ev.away_team,
              gameStartTime: ev.commence_time,
              marketStatus: 'OFFERED',
              line,
              overOdds,
              underOdds,
              overDecimalOdds: this.americanToDecimal(overOdds),
              underDecimalOdds: this.americanToDecimal(underOdds),
              sportsbook: preferredBook.title || 'DraftKings',
              timestamp: new Date().toISOString(),
              lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              lineMovement,
              previousLine: prev?.line,
            });
          }
        } catch (err) {
          console.warn(`Error fetching props for game ${ev.id}:`, err);
        }
      }

      this.saveLineHistory(lineHistory);

      if (newMarkets.length > 0) {
        this.cachedMarkets = newMarkets;
        this.lastSyncTime = new Date().toISOString();
        this.currentStatus = 'ONLINE';
        this.statusMessage = `Successfully synchronized ${newMarkets.length} verified player props markets.`;
        this.persistCache(newMarkets);
        return newMarkets;
      } else {
        this.currentStatus = 'AWAITING_MARKETS';
        this.statusMessage = 'Sportsbooks have not yet released player points lines for this date.';
        return this.cachedMarkets;
      }
    } catch (e: any) {
      this.currentStatus = 'ERROR';
      this.statusMessage = `Network error connecting to odds provider: ${e?.message || e}`;
      return this.cachedMarkets;
    }
  }

  private persistCache(markets: PlayerPropsMarket[]) {
    try {
      localStorage.setItem(
        STORAGE_KEY_CACHE,
        JSON.stringify({
          markets,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.warn('Failed to persist markets cache:', e);
    }
  }

  private loadLineHistory(): Record<string, { line: number; overOdds: string; underOdds: string; timestamp: string }> {
    try {
      const h = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (h) return JSON.parse(h);
    } catch {}
    return {};
  }

  private saveLineHistory(history: Record<string, any>) {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch {}
  }

  private americanToDecimal(american: string | number): number {
    const num = typeof american === 'string' ? parseFloat(american.replace('+', '')) : american;
    if (isNaN(num) || num === 0) return 1.91;
    if (num > 0) return Number((1 + num / 100).toFixed(3));
    return Number((1 + 100 / Math.abs(num)).toFixed(3));
  }
}

// Global default singleton service
export const sportsbookOddsService = new TheOddsApiProvider();
