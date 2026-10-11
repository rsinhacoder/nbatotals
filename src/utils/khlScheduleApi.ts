import type { KHLUpcomingMatch } from '../types/khl';
import { getKHLTeamProfile } from '../data/khlTeamProfiles';
import { runKHLForecastingModel } from './khlModelEngine';

export function getCuratedUpcomingKHLMatches(): KHLUpcomingMatch[] {
  const todayEasternStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  const [y, m, d] = todayEasternStr.split('-').map(Number);

  const getDateStr = (offset: number) => {
    const dt = new Date(Date.UTC(y, m - 1, d + offset, 12, 0, 0));
    return dt.toISOString().slice(0, 10);
  };

  const sampleMatchups: Array<{
    away: string;
    home: string;
    dateOffset: number;
    time: string;
    total: number;
    overOdds: string;
    underOdds: string;
    puckHomeOdds: string;
    puckAwayOdds: string;
    mlHome: string;
    mlAway: string;
    regDrawOdds: string;
    isFarEast?: boolean;
    venue?: string;
  }> = [
    // Today (Day 0)
    {
      away: 'SKA',
      home: 'CSK', // Army Derby (Classic KHL Mega-Clash)
      dateOffset: 0,
      time: '12:30 PM ET (7:30 PM MSK)',
      total: 5.0,
      overOdds: '+105',
      underOdds: '-125',
      puckHomeOdds: '+155',
      puckAwayOdds: '-185',
      mlHome: '-115',
      mlAway: '-105',
      regDrawOdds: '+295',
      venue: 'CSKA Arena, Moscow',
    },
    {
      away: 'SAL',
      home: 'AKB', // Green Derby (Kazan vs Ufa)
      dateOffset: 0,
      time: '12:00 PM ET (7:00 PM MSK)',
      total: 4.5,
      overOdds: '-110',
      underOdds: '-110',
      puckHomeOdds: '+140',
      puckAwayOdds: '-170',
      mlHome: '-135',
      mlAway: '+115',
      regDrawOdds: '+285',
      venue: 'Tatneft Arena, Kazan',
    },
    {
      away: 'SPK',
      home: 'ADM', // Extreme Far East Travel Game (Spartak flying to Pacific Vladivostok)
      dateOffset: 0,
      time: '5:30 AM ET (12:30 PM VLAT)',
      total: 4.5,
      overOdds: '+115',
      underOdds: '-135',
      puckHomeOdds: '-120',
      puckAwayOdds: '+100',
      mlHome: '-110',
      mlAway: '-110',
      regDrawOdds: '+310',
      isFarEast: true,
      venue: 'Fetisov Arena, Vladivostok',
    },
    {
      away: 'TRA',
      home: 'MMG', // South Ural Rivalry
      dateOffset: 0,
      time: '10:00 AM ET (5:00 PM YEKT)',
      total: 5.5,
      overOdds: '-115',
      underOdds: '-105',
      puckHomeOdds: '+135',
      puckAwayOdds: '-165',
      mlHome: '-140',
      mlAway: '+120',
      regDrawOdds: '+290',
      venue: 'Arena Metallurg, Magnitogorsk',
    },
    {
      away: 'TOR',
      home: 'LOK', // Lokomotiv Defensive Showcase
      dateOffset: 0,
      time: '12:00 PM ET (7:00 PM MSK)',
      total: 4.5,
      overOdds: '+120',
      underOdds: '-140',
      puckHomeOdds: '-105',
      puckAwayOdds: '-115',
      mlHome: '-165',
      mlAway: '+140',
      regDrawOdds: '+300',
      venue: 'Arena 2000, Yaroslavl',
    },
    {
      away: 'SIB',
      home: 'AVG', // Siberian Derby
      dateOffset: 0,
      time: '9:30 AM ET (4:30 PM OMST)',
      total: 5.0,
      overOdds: '-110',
      underOdds: '-110',
      puckHomeOdds: '+130',
      puckAwayOdds: '-160',
      mlHome: '-150',
      mlAway: '+130',
      regDrawOdds: '+290',
      venue: 'G-Drive Arena, Omsk',
    },

    // Tomorrow (Day 1)
    {
      away: 'DYN',
      home: 'SPK', // Moscow Derby
      dateOffset: 1,
      time: '12:30 PM ET (7:30 PM MSK)',
      total: 5.5,
      overOdds: '-105',
      underOdds: '-115',
      puckHomeOdds: '+145',
      puckAwayOdds: '-175',
      mlHome: '+110',
      mlAway: '-130',
      regDrawOdds: '+285',
      venue: 'Megasport Sport Palace, Moscow',
    },
    {
      away: 'VIT',
      home: 'AMR', // Far East Travel Game (Khabarovsk)
      dateOffset: 1,
      time: '5:00 AM ET (12:00 PM VLAT)',
      total: 4.5,
      overOdds: '+110',
      underOdds: '-130',
      puckHomeOdds: '-115',
      puckAwayOdds: '-105',
      mlHome: '-130',
      mlAway: '+110',
      regDrawOdds: '+305',
      isFarEast: true,
      venue: 'Platinum Arena, Khabarovsk',
    },
    {
      away: 'SEV',
      home: 'SKA',
      dateOffset: 1,
      time: '12:30 PM ET (7:30 PM MSK)',
      total: 5.5,
      overOdds: '-115',
      underOdds: '-105',
      puckHomeOdds: '-130',
      puckAwayOdds: '+110',
      mlHome: '-220',
      mlAway: '+185',
      regDrawOdds: '+340',
      venue: 'SKA Arena, Saint Petersburg',
    },
    {
      away: 'BAR',
      home: 'AVT',
      dateOffset: 1,
      time: '10:00 AM ET (5:00 PM YEKT)',
      total: 5.0,
      overOdds: '-110',
      underOdds: '-110',
      puckHomeOdds: '+125',
      puckAwayOdds: '-155',
      mlHome: '-175',
      mlAway: '+150',
      regDrawOdds: '+300',
      venue: 'Uralets Arena, Yekaterinburg',
    },

    // Day 2
    {
      away: 'LOK',
      home: 'DYN',
      dateOffset: 2,
      time: '12:30 PM ET (7:30 PM MSK)',
      total: 4.5,
      overOdds: '+115',
      underOdds: '-135',
      puckHomeOdds: '+150',
      puckAwayOdds: '-180',
      mlHome: '-125',
      mlAway: '+105',
      regDrawOdds: '+290',
      venue: 'VTB Arena, Moscow',
    },
    {
      away: 'NEF',
      home: 'AKB', // Tatarstan Regional Match
      dateOffset: 2,
      time: '12:00 PM ET (7:00 PM MSK)',
      total: 5.0,
      overOdds: '-105',
      underOdds: '-115',
      puckHomeOdds: '+120',
      puckAwayOdds: '-150',
      mlHome: '-180',
      mlAway: '+155',
      regDrawOdds: '+310',
      venue: 'Tatneft Arena, Kazan',
    },
    {
      away: 'MNK',
      home: 'SOC',
      dateOffset: 2,
      time: '12:30 PM ET (7:30 PM MSK)',
      total: 5.0,
      overOdds: '-110',
      underOdds: '-110',
      puckHomeOdds: '+140',
      puckAwayOdds: '-170',
      mlHome: '+125',
      mlAway: '-145',
      regDrawOdds: '+285',
      venue: 'Bolshoy Ice Dome, Sochi',
    },

    // Day 3
    {
      away: 'CSK',
      home: 'TOR',
      dateOffset: 3,
      time: '12:00 PM ET (7:00 PM MSK)',
      total: 5.0,
      overOdds: '-110',
      underOdds: '-110',
      puckHomeOdds: '+135',
      puckAwayOdds: '-165',
      mlHome: '+120',
      mlAway: '-140',
      regDrawOdds: '+290',
      venue: 'Nagorny Arena, Nizhny Novgorod',
    },
    {
      away: 'KRS',
      home: 'LAD',
      dateOffset: 3,
      time: '11:00 AM ET (6:00 PM SAMT)',
      total: 5.0,
      overOdds: '-105',
      underOdds: '-115',
      puckHomeOdds: '+130',
      puckAwayOdds: '-160',
      mlHome: '-150',
      mlAway: '+130',
      regDrawOdds: '+295',
      venue: 'Lada Arena, Togliatti',
    },
  ];

  const allMatches: KHLUpcomingMatch[] = [];

  for (const item of sampleMatchups) {
    const homeProf = getKHLTeamProfile(item.home);
    const awayProf = getKHLTeamProfile(item.away);
    const dateStr = getDateStr(item.dateOffset);

    const isFarEast = Boolean(item.isFarEast);

    // Run KHL quantitative forecasting engine
    const forecast = runKHLForecastingModel({
      homeTeam: homeProf.id,
      awayTeam: awayProf.id,
      homeGoalie: homeProf.primaryGoalie,
      awayGoalie: awayProf.primaryGoalie,
      homeRestDays: 1,
      awayRestDays: isFarEast ? 1 : 1,
      isFarEastTravel: isFarEast,
      sportsbookTotal: item.total,
      totalOverOdds: item.overOdds,
      totalUnderOdds: item.underOdds,
      sportsbookSpread: -1.5,
      spreadHomeOdds: item.puckHomeOdds,
      spreadAwayOdds: item.puckAwayOdds,
      moneylineHome: item.mlHome,
      moneylineAway: item.mlAway,
      regulationDrawOdds: item.regDrawOdds,
    });

    const matchItem: KHLUpcomingMatch = {
      id: `khl_${homeProf.id}_${awayProf.id}_${dateStr}`,
      date: dateStr,
      time: item.time,
      status: 'Scheduled',
      awayTeam: awayProf.name,
      homeTeam: homeProf.name,
      awayAbbrev: awayProf.abbreviation,
      homeAbbrev: homeProf.abbreviation,
      awayRecord: '14-8',
      homeRecord: '16-6',
      venue: item.venue || `${homeProf.city} Arena`,
      city: homeProf.city,
      awayGoalie: awayProf.primaryGoalie,
      homeGoalie: homeProf.primaryGoalie,
      awayRestDays: 1,
      homeRestDays: 1,
      isFarEastTravel: isFarEast,
      sportsbookTotal: item.total,
      totalOverOdds: item.overOdds,
      totalUnderOdds: item.underOdds,
      sportsbookSpread: -1.5,
      spreadHomeOdds: item.puckHomeOdds,
      spreadAwayOdds: item.puckAwayOdds,
      moneylineHome: item.mlHome,
      moneylineAway: item.mlAway,
      regulationDrawOdds: item.regDrawOdds,
      modelProjectedHomeGoals: forecast.modelProjectedHomeGoals,
      modelProjectedAwayGoals: forecast.modelProjectedAwayGoals,
      modelProjectedTotal: forecast.modelProjectedTotal,
      goalEdge: forecast.goalEdge,
      projectedHomeShots: forecast.projectedHomeShots,
      projectedAwayShots: forecast.projectedAwayShots,
      projectedTotalShots: forecast.projectedTotalShots,
      sportsbookShotsTotal: forecast.sportsbookShotsTotal,
      shotsEdge: forecast.shotsEdge,
      projectedTotalFaceoffs: forecast.projectedTotalFaceoffs,
      projectedHomeFaceoffWinPct: forecast.projectedHomeFaceoffWinPct,
      projectedAwayFaceoffWinPct: forecast.projectedAwayFaceoffWinPct,
      probOver4_5: forecast.probOver4_5,
      probUnder4_5: forecast.probUnder4_5,
      probOver5_0: forecast.probOver5_0,
      probUnder5_0: forecast.probUnder5_0,
      probPush5_0: forecast.probPush5_0,
      probOver5_5: forecast.probOver5_5,
      probUnder5_5: forecast.probUnder5_5,
      probHomeWinRegulation: forecast.probHomeWinRegulation,
      probAwayWinRegulation: forecast.probAwayWinRegulation,
      probRegulationDraw: forecast.probRegulationDraw,
      probHomeWinFullGame: forecast.probHomeWinFullGame,
      probAwayWinFullGame: forecast.probAwayWinFullGame,
      probHomeCoverSpread: forecast.probHomeCoverSpread,
      probAwayCoverSpread: forecast.probAwayCoverSpread,
      prob1POver1_5: forecast.prob1POver1_5,
      prob1PUnder1_5: forecast.prob1PUnder1_5,
      highestEdgeMarket: forecast.highestEdgeMarket,
      allMarketEdges: forecast.allMarketEdges,
      keyAngle: forecast.keyAngle,
      factors: forecast.factors,
    };

    allMatches.push(matchItem);
  }

  // Sort matches chronologically by date
  allMatches.sort((a, b) => a.date.localeCompare(b.date));
  return allMatches;
}
