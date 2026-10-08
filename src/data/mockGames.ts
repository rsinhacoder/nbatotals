import type { RawGameInput } from '../utils/modelEngine';
import historicalData from './nbaHistoricalGames.json';

/**
 * 5-Year NBA Historical Database (2020-2025)
 * N = 6,000 completed NBA games with official quarter linescores,
 * scores, and historical consensus sportsbook lines.
 */
export const INITIAL_NBA_GAMES: RawGameInput[] = historicalData.games as RawGameInput[];

export const INITIAL_REFERENCE_TOTALS: Record<string, number> = historicalData.refs;
