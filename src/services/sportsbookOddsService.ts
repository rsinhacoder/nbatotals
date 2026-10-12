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

export class TheOddsApiProvider implements SportsbookOddsProvider {
  private providerName = 'The Odds API (DraftKings / FanDuel / US Consensus)';
  private cachedMarkets: PlayerPropsMarket[] = [];
  private lastSyncTime: string | null = null;
  private remainingRequests: number = 500;
  private statusMessage: string = 'Provider initialized';
  private currentStatus: SportsbookProviderStatus['status'] = 'UNCONFIGURED';

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
        this.currentStatus = 'UNCONFIGURED';
        this.statusMessage = 'Awaiting API Key (Configure in Settings)';
      }

      const cached = localStorage.getItem(STORAGE_KEY_CACHE);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.markets)) {
          this.cachedMarkets = parsed.markets;
          this.lastSyncTime = parsed.timestamp;
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
    // Check localStorage first, then import.meta.env
    const stored = localStorage.getItem(STORAGE_KEY_API_KEY);
    if (stored && stored.trim().length > 0) return stored.trim();
    const envKey = (import.meta as any).env?.VITE_ODDS_API_KEY;
    if (envKey && envKey.trim().length > 0) return envKey.trim();
    return null;
  }

  public saveApiKey(key: string): void {
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
