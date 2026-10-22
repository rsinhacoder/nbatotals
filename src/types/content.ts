/**
 * NBA Content Engine Types & Data Models
 * Defines the schema for automated, data-backed NBA articles, previews, and performance tracking.
 */

export type ArticleType =
  | 'DAILY_PREVIEW'
  | 'PLAYER_ANALYSIS'
  | 'STATISTICAL_STUDY'
  | 'EVERGREEN_GUIDE';

export type ContentStatus =
  | 'PUBLISHED'
  | 'SCHEDULED'
  | 'NEEDS_REFRESH'
  | 'ARCHIVED';

export interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
}

export interface PlayerSpotlight {
  playerId: string;
  playerName: string;
  team: string;
  position: string;
  role: 'Starter' | 'Bench' | 'Reserve';
  projectedPoints: number;
  pointsLine: number | null;
  overOdds?: string;
  underOdds?: string;
  edge?: number;
  recommendation?: 'OVER EDGE' | 'UNDER EDGE' | 'NO EDGE' | 'OFF MARKET';
  analysis: string;
}

export interface ArticleModelContext {
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  awayAbbrev: string;
  homeAbbrev: string;
  gameDate: string;
  gameTime: string;
  venue?: string;
  projectedTotal: number;
  marketLine: number;
  edgePoints: number;
  pickType: 'OVER' | 'UNDER' | 'PASS';
  lowestQuarterProjected: number;
  formula: string;
  confidenceScore: number;
  paceFloorProbability: number; // e.g. 85.2% Under if Q < 47
}

export interface ArticleNHLModelContext {
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  awayAbbrev: string;
  homeAbbrev: string;
  gameDate: string;
  gameTime: string;
  venue?: string;
  sportsbookTotal: number;
  modelProjectedTotal: number;
  projectedTotal?: number;
  modelProjectedHomeGoals: number;
  modelProjectedAwayGoals: number;
  goalEdge: number;
  edge?: number;
  pickType: 'OVER' | 'UNDER' | 'PASS';
  formula?: string;
  puckline: number;
  pucklineLine?: number;
  pucklineFavorite?: string;
  pucklineHomeOdds: string;
  pucklineAwayOdds: string;
  moneylineHome: string;
  moneylineAway: string;
  awayGoalie: {
    name: string;
    confirmed: boolean;
    savePct: number;
    gaa: number;
    gsax60: number;
    record: string;
  };
  homeGoalie: {
    name: string;
    confirmed: boolean;
    savePct: number;
    gaa: number;
    gsax60: number;
    record: string;
  };
  projectedTotalShots: number;
  sportsbookShotsTotal: number;
  confidenceScore: number;
  probOver5_5: number;
  probUnder5_5: number;
  probOver6_0: number;
  probUnder6_0: number;
  probOver6_5: number;
  probUnder6_5: number;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface InternalLinkItem {
  text: string;
  url: string;
  anchorType: 'game_forecast' | 'player_props' | 'analyzer' | 'academy' | 'results';
  contextSnippet?: string;
}

export interface ArticleSection {
  id: string;
  heading: string;
  level: 2 | 3;
  content: string; // Markdown or sanitized HTML
  type?: 'prose' | 'model_box' | 'stat_grid' | 'player_spotlight' | 'tactical_key' | 'faq';
  data?: any;
  callout?: {
    type: 'STAT' | 'WARNING' | 'EDGE';
    title: string;
    content: string;
  };
}

export interface NBAArticle {
  id: string;
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  sport?: 'nba' | 'nhl';
  articleType: ArticleType;
  status: ContentStatus;
  publishedAt: string;
  updatedAt: string;
  gameDate?: string;
  gameId?: string;
  awayTeam?: string;
  homeTeam?: string;
  awayAbbrev?: string;
  homeAbbrev?: string;
  gameTime?: string;
  venue?: string;
  featuredImage: string;
  featuredImageAlt: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string;
  readingTimeMinutes: number;
  wordCount: number;
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  summary: string;
  tableOfContents: TableOfContentsItem[];
  sections: ArticleSection[];
  modelContext?: ArticleModelContext;
  nhlModelContext?: ArticleNHLModelContext;
  playerSpotlights?: PlayerSpotlight[];
  faq: FAQItem[];
  internalLinks: InternalLinkItem[];
  relatedArticleSlugs: string[];
  performance: {
    pageViews: number;
    organicImpressions: number;
    organicClicks: number;
    avgPosition: number;
    ctrPercent: number;
    avgScrollDepth: number;
    ctaToPicksClicks: number;
    ctaToPropsClicks: number;
    lastReviewedAt: string;
  };
}

export interface ContentPerformanceMetrics {
  slug: string;
  title: string;
  type: ArticleType;
  publishedDate: string;
  targetKeyword: string;
  primaryIntent: string;
  wordCount: number;
  pageViews: number;
  organicImpressions: number;
  organicClicks: number;
  avgPosition: number;
  ctrPercent: number;
  avgScrollDepth: number;
  ctaToPicksClicks: number;
  ctaToPropsClicks: number;
  status: ContentStatus;
  lastReviewed: string;
}

export interface KeywordOpportunity {
  id: string;
  keyword: string;
  intent: string;
  type: ArticleType;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  searchDemandLevel: 'VERY HIGH' | 'HIGH' | 'STEADY';
  existingCoverageUrl?: string;
  dataAdvantage: string;
  action: string;
}
