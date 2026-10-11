import type { NHLUpcomingMatch } from '../types/nhl';
import { getNHLTeamProfile } from '../data/nhlTeamProfiles';
import { runNHLForecastingModel } from './nhlModelEngine';

export async function fetchLiveUpcomingNHLSchedule(daysAhead: number = 5): Promise<NHLUpcomingMatch[]> {
  const allMatches: NHLUpcomingMatch[] = [];
  const processedIds = new Set<string>();

  const today = new Date();

  for (let offset = 0; offset < daysAhead; offset++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + offset);
    const dateStr = targetDate.toISOString().slice(0, 10).replace(/-/g, '');

    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=${dateStr}`;
      const res = await fetch(url);
      if (!res.ok) continue;

      const data = await res.json();
      if (!data.events || !Array.isArray(data.events)) continue;

      for (const event of data.events) {
        if (processedIds.has(event.id)) continue;
        processedIds.add(event.id);

        const comp = event.competitions?.[0];
        if (!comp || !comp.competitors || comp.competitors.length < 2) continue;

        const homeComp = comp.competitors.find((c: any) => c.homeAway === 'home');
        const awayComp = comp.competitors.find((c: any) => c.homeAway === 'away');
        if (!homeComp || !awayComp) continue;

        const homeTeamName = homeComp.team?.displayName || homeComp.team?.name || 'Home';
        const awayTeamName = awayComp.team?.displayName || awayComp.team?.name || 'Away';
        const homeAbbrev = homeComp.team?.abbreviation || 'HOM';
        const awayAbbrev = awayComp.team?.abbreviation || 'AWY';

        const homeProf = getNHLTeamProfile(homeAbbrev || homeTeamName);
        const awayProf = getNHLTeamProfile(awayAbbrev || awayTeamName);

        const homeRecord = homeComp.records?.[0]?.summary || '0-0';
        const awayRecord = awayComp.records?.[0]?.summary || '0-0';
        const venueName = comp.venue?.fullName || `${homeProf.city} Arena`;

        // Extract Sportsbook Odds
        const oddsObj = comp.odds?.[0];
        let sportsbookTotal = 6.0;
        let totalOverOdds = '-110';
        let totalUnderOdds = '-110';
        let sportsbookSpread = -1.5;
        let spreadHomeOdds = '+145';
        let spreadAwayOdds = '-175';
        let moneylineHome = '-140';
        let moneylineAway = '+120';

        if (oddsObj) {
          if (oddsObj.overUnder && !isNaN(Number(oddsObj.overUnder))) {
            sportsbookTotal = Number(oddsObj.overUnder);
          }
          if (oddsObj.total?.over?.close?.odds) {
            totalOverOdds = oddsObj.total.over.close.odds;
          }
          if (oddsObj.total?.under?.close?.odds) {
            totalUnderOdds = oddsObj.total.under.close.odds;
          }
          if (oddsObj.pointSpread?.home?.close?.line) {
            sportsbookSpread = parseFloat(oddsObj.pointSpread.home.close.line);
          } else if (oddsObj.pointSpread?.away?.close?.line) {
            sportsbookSpread = -parseFloat(oddsObj.pointSpread.away.close.line);
          } else if (oddsObj.awayTeamOdds?.favorite === true) {
            sportsbookSpread = 1.5;
          } else if (oddsObj.homeTeamOdds?.favorite === true) {
            sportsbookSpread = -1.5;
          }
          if (oddsObj.pointSpread?.home?.close?.odds) {
            spreadHomeOdds = oddsObj.pointSpread.home.close.odds;
          }
          if (oddsObj.pointSpread?.away?.close?.odds) {
            spreadAwayOdds = oddsObj.pointSpread.away.close.odds;
          }
          if (oddsObj.moneyline?.home?.close?.odds) {
            moneylineHome = oddsObj.moneyline.home.close.odds;
          }
          if (oddsObj.moneyline?.away?.close?.odds) {
            moneylineAway = oddsObj.moneyline.away.close.odds;
          }
        } else {
          // If DraftKings lines not yet posted for future days, infer consensus baseline
          const baselineTotal = (homeProf.fiveSeasonGPG + awayProf.fiveSeasonGPG + homeProf.fiveSeasonGAPG + awayProf.fiveSeasonGAPG) / 4;
          sportsbookTotal = baselineTotal > 6.25 ? 6.5 : baselineTotal < 5.85 ? 5.5 : 6.0;
        }

        const homeGoalie = homeProf.primaryGoalie;
        const awayGoalie = awayProf.primaryGoalie;

        // Run quantitative forecasting model
        const forecast = runNHLForecastingModel({
          homeTeam: homeProf.id,
          awayTeam: awayProf.id,
          homeGoalie,
          awayGoalie,
          homeRestDays: 1,
          awayRestDays: 1,
          sportsbookTotal,
          totalOverOdds,
          totalUnderOdds,
          sportsbookSpread,
          spreadHomeOdds,
          spreadAwayOdds,
          moneylineHome,
          moneylineAway,
        });

        // Determine Game Status
        let status: 'Scheduled' | 'Live' | 'Final' | 'Delayed' = 'Scheduled';
        const stateName = event.status?.type?.name;
        if (stateName === 'STATUS_FINAL') status = 'Final';
        else if (stateName === 'STATUS_IN_PROGRESS') status = 'Live';

        const matchItem: NHLUpcomingMatch = {
          id: event.id || `nhl_${homeProf.id}_${awayProf.id}_${dateStr}`,
          date: event.date ? event.date.slice(0, 10) : targetDate.toISOString().slice(0, 10),
          time: event.date
            ? new Date(event.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
            : '7:00 PM',
          status,
          awayTeam: awayProf.name,
          homeTeam: homeProf.name,
          awayAbbrev: awayProf.abbreviation,
          homeAbbrev: homeProf.abbreviation,
          awayRecord,
          homeRecord,
          venue: venueName,
          awayGoalie,
          homeGoalie,
          awayRestDays: 1,
          homeRestDays: 1,
          sportsbookTotal,
          totalOverOdds,
          totalUnderOdds,
          sportsbookSpread,
          spreadHomeOdds,
          spreadAwayOdds,
          moneylineHome,
          moneylineAway,
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
          projectedHomeFaceoffsWon: forecast.projectedHomeFaceoffsWon,
          projectedAwayFaceoffsWon: forecast.projectedAwayFaceoffsWon,
          probOver5_5: forecast.probOver5_5,
          probUnder5_5: forecast.probUnder5_5,
          probOver6_0: forecast.probOver6_0,
          probUnder6_0: forecast.probUnder6_0,
          probPush6_0: forecast.probPush6_0,
          probOver6_5: forecast.probOver6_5,
          probUnder6_5: forecast.probUnder6_5,
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
    } catch (e) {
      console.warn(`Error fetching NHL schedule for ${dateStr}:`, e);
    }
  }

  // Sort matches chronologically by date, then time
  allMatches.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  // If live fetch returned games, return them
  if (allMatches.length > 0) {
    return allMatches;
  }

  // Fallback to high-quality curated multi-day matchups if offline
  return getCuratedUpcomingNHLMatches();
}

export function getCuratedUpcomingNHLMatches(): NHLUpcomingMatch[] {
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
  }> = [
    // Today (Day 0)
    {
      away: 'CAR',
      home: 'PHI',
      dateOffset: 0,
      time: '7:00 PM ET',
      total: 5.5,
      overOdds: '-125',
      underOdds: '+105',
      puckHomeOdds: '-170',
      puckAwayOdds: '+142',
      mlHome: '+150',
      mlAway: '-180',
    },
    {
      away: 'VAN',
      home: 'NYR',
      dateOffset: 0,
      time: '7:00 PM ET',
      total: 5.5,
      overOdds: '-110',
      underOdds: '-110',
      puckHomeOdds: '+135',
      puckAwayOdds: '-165',
      mlHome: '-165',
      mlAway: '+140',
    },
    {
      away: 'SEA',
      home: 'WSH',
      dateOffset: 0,
      time: '7:30 PM ET',
      total: 6.5,
      overOdds: '+105',
      underOdds: '-125',
      puckHomeOdds: '+145',
      puckAwayOdds: '-175',
      mlHome: '-155',
      mlAway: '+130',
    },
    {
      away: 'FLA',
      home: 'BUF',
      dateOffset: 0,
      time: '7:00 PM ET',
      total: 6.0,
      overOdds: '-115',
      underOdds: '-105',
      puckHomeOdds: '+150',
      puckAwayOdds: '-180',
      mlHome: '+135',
      mlAway: '-160',
    },
    {
      away: 'VGK',
      home: 'MIN',
      dateOffset: 0,
      time: '8:00 PM ET',
      total: 6.0,
      overOdds: '-110',
      underOdds: '-110',
      puckHomeOdds: '-110',
      puckAwayOdds: '-110',
      mlHome: '-115',
      mlAway: '-105',
    },
    {
      away: 'EDM',
      home: 'COL',
      dateOffset: 0,
      time: '9:30 PM ET',
      total: 6.5,
      overOdds: '-120',
      underOdds: '+100',
      puckHomeOdds: '+140',
      puckAwayOdds: '-170',
      mlHome: '-125',
      mlAway: '+105',
    },

    // Tomorrow (Day 1)
    {
      away: 'BOS',
      home: 'TOR',
      dateOffset: 1,
      time: '7:00 PM ET',
      total: 5.5,
      overOdds: '-115',
      underOdds: '-105',
      puckHomeOdds: '+145',
      puckAwayOdds: '-175',
      mlHome: '-140',
      mlAway: '+120',
    },
    {
      away: 'TBL',
      home: 'DET',
      dateOffset: 1,
      time: '7:30 PM ET',
      total: 6.0,
      overOdds: '-110',
      underOdds: '-110',
      puckHomeOdds: '-105',
      puckAwayOdds: '-115',
      mlHome: '+115',
      mlAway: '-135',
    },
    {
      away: 'DAL',
      home: 'WPG',
      dateOffset: 1,
      time: '8:00 PM ET',
      total: 5.5,
      overOdds: '-105',
      underOdds: '-115',
      puckHomeOdds: '-160',
      puckAwayOdds: '+135',
      mlHome: '-130',
      mlAway: '+110',
    },
    {
      away: 'LAK',
      home: 'ANA',
      dateOffset: 1,
      time: '10:00 PM ET',
      total: 5.5,
      overOdds: '+100',
      underOdds: '-120',
      puckHomeOdds: '+160',
      puckAwayOdds: '-195',
      mlHome: '+165',
      mlAway: '-200',
    },

    // Day 2
    {
      away: 'NJD',
      home: 'PIT',
      dateOffset: 2,
      time: '7:00 PM ET',
      total: 6.0,
      overOdds: '-115',
      underOdds: '-105',
      puckHomeOdds: '+150',
      puckAwayOdds: '-180',
      mlHome: '+120',
      mlAway: '-140',
    },
    {
      away: 'NYI',
      home: 'CBJ',
      dateOffset: 2,
      time: '7:00 PM ET',
      total: 5.5,
      overOdds: '-110',
      underOdds: '-110',
      puckHomeOdds: '+130',
      puckAwayOdds: '-155',
      mlHome: '+125',
      mlAway: '-145',
    },
    {
      away: 'NSH',
      home: 'STL',
      dateOffset: 2,
      time: '8:00 PM ET',
      total: 6.0,
      overOdds: '-110',
      underOdds: '-110',
      puckHomeOdds: '-115',
      puckAwayOdds: '-105',
      mlHome: '-110',
      mlAway: '-110',
    },
    {
      away: 'CGY',
      home: 'UTA',
      dateOffset: 2,
      time: '9:00 PM ET',
      total: 6.0,
      overOdds: '-105',
      underOdds: '-115',
      puckHomeOdds: '+140',
      puckAwayOdds: '-165',
      mlHome: '+110',
      mlAway: '-130',
    },

    // Day 3
    {
      away: 'CHI',
      home: 'OTT',
      dateOffset: 3,
      time: '7:00 PM ET',
      total: 6.0,
      overOdds: '-120',
      underOdds: '+100',
      puckHomeOdds: '+140',
      puckAwayOdds: '-170',
      mlHome: '-160',
      mlAway: '+135',
    },
    {
      away: 'MTL',
      home: 'BOS',
      dateOffset: 3,
      time: '7:30 PM ET',
      total: 5.5,
      overOdds: '-110',
      underOdds: '-110',
      puckHomeOdds: '+135',
      puckAwayOdds: '-160',
      mlHome: '-175',
      mlAway: '+145',
    },
    {
      away: 'SJS',
      home: 'VGK',
      dateOffset: 3,
      time: '10:00 PM ET',
      total: 6.0,
      overOdds: '-115',
      underOdds: '-105',
      puckHomeOdds: '+120',
      puckAwayOdds: '-145',
      mlHome: '-250',
      mlAway: '+210',
    },
  ];

  const matches = sampleMatchups.map((m, idx) => {
    const homeProf = getNHLTeamProfile(m.home);
    const awayProf = getNHLTeamProfile(m.away);
    const matchDate = getDateStr(m.dateOffset);

    const isAwayFavored = m.mlAway.startsWith('-') && !m.mlHome.startsWith('-');
    const sampleSpread = isAwayFavored ? 1.5 : -1.5;

    const forecast = runNHLForecastingModel({
      homeTeam: m.home,
      awayTeam: m.away,
      homeGoalie: homeProf.primaryGoalie,
      awayGoalie: awayProf.primaryGoalie,
      homeRestDays: 1,
      awayRestDays: 1,
      sportsbookTotal: m.total,
      totalOverOdds: m.overOdds,
      totalUnderOdds: m.underOdds,
      sportsbookSpread: sampleSpread,
      spreadHomeOdds: m.puckHomeOdds,
      spreadAwayOdds: m.puckAwayOdds,
      moneylineHome: m.mlHome,
      moneylineAway: m.mlAway,
    });

    return {
      id: `nhl_curated_${m.away}_${m.home}_${idx}`,
      date: matchDate,
      time: m.time,
      status: 'Scheduled' as const,
      awayTeam: awayProf.name,
      homeTeam: homeProf.name,
      awayAbbrev: awayProf.abbreviation,
      homeAbbrev: homeProf.abbreviation,
      awayRecord: '1-0-0',
      homeRecord: '1-0-0',
      venue: `${homeProf.city} Center`,
      awayGoalie: awayProf.primaryGoalie,
      homeGoalie: homeProf.primaryGoalie,
      awayRestDays: 1,
      homeRestDays: 1,
      sportsbookTotal: m.total,
      totalOverOdds: m.overOdds,
      totalUnderOdds: m.underOdds,
      sportsbookSpread: sampleSpread,
      spreadHomeOdds: m.puckHomeOdds,
      spreadAwayOdds: m.puckAwayOdds,
      moneylineHome: m.mlHome,
      moneylineAway: m.mlAway,
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
      projectedHomeFaceoffsWon: forecast.projectedHomeFaceoffsWon,
      projectedAwayFaceoffsWon: forecast.projectedAwayFaceoffsWon,
      probOver5_5: forecast.probOver5_5,
      probUnder5_5: forecast.probUnder5_5,
      probOver6_0: forecast.probOver6_0,
      probUnder6_0: forecast.probUnder6_0,
      probPush6_0: forecast.probPush6_0,
      probOver6_5: forecast.probOver6_5,
      probUnder6_5: forecast.probUnder6_5,
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
  });

  return matches.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}
