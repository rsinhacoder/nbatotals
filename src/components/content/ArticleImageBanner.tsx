import React from 'react';
import type { NBAArticle, ArticleType } from '../../types/content';
import { resolveTeamMeta } from '../../services/nbaRosterService';
import { Clock, TrendingUp, TrendingDown, Sparkles, MapPin, Calendar } from 'lucide-react';

interface ArticleImageBannerProps {
  article: NBAArticle;
  variant?: 'card' | 'hero' | 'detail';
  className?: string;
}

/**
 * Curated high-resolution relatable basketball imagery.
 * Deterministically selected based on article slug/teams so every blog
 * has a distinctive, beautiful sports photography backdrop.
 */
export const RELATABLE_NBA_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
    alt: 'Basketball going through a hoop during an NBA game',
  },
  {
    url: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1200&q=80',
    alt: 'NBA hardwood court and arena spotlights',
  },
  {
    url: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=1200&q=80',
    alt: 'Basketball tip-off at center court in packed arena',
  },
  {
    url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    alt: 'Basketball player shooting a jump shot under arena lights',
  },
  {
    url: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&w=1200&q=80',
    alt: 'Basketball on hardwood arena floor before tipoff',
  },
  {
    url: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?auto=format&fit=crop&w=1200&q=80',
    alt: 'Basketball hoop and modern illuminated stadium court',
  },
  {
    url: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1200&q=80',
    alt: 'Basketball net and arena rafters from court level',
  },
  {
    url: 'https://images.unsplash.com/photo-1563299796-17596ed6b017?auto=format&fit=crop&w=1200&q=80',
    alt: 'Basketball arena scoreboard and digital stadium lights',
  },
];

/**
 * Returns a stable relatable photo for an article based on its title or matchup
 */
export function getRelatableArticlePhoto(article: Partial<NBAArticle>): { url: string; alt: string } {
  if (article.featuredImage && !article.featuredImage.includes('photo-1546519638-68e109498ffc')) {
    return {
      url: article.featuredImage,
      alt: article.featuredImageAlt || 'NBA basketball analytics',
    };
  }

  const seed = (article.slug || article.title || article.id || 'nba').toLowerCase();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % RELATABLE_NBA_PHOTOS.length;
  return RELATABLE_NBA_PHOTOS[index];
}

export const ArticleImageBanner: React.FC<ArticleImageBannerProps> = ({
  article,
  variant = 'card',
  className = '',
}) => {
  const photo = getRelatableArticlePhoto(article);
  const isDailyPreview = article.articleType === 'DAILY_PREVIEW' || Boolean(article.awayTeam && article.homeTeam);

  const awayMeta = article.awayTeam ? resolveTeamMeta(article.awayTeam) : null;
  const homeMeta = article.homeTeam ? resolveTeamMeta(article.homeTeam) : null;
  const modelCtx = article.modelContext;

  const getTypeBadge = (type: ArticleType) => {
    switch (type) {
      case 'DAILY_PREVIEW':
        return { label: 'Game Preview', color: 'bg-blue-600/90 text-white border-blue-400/40' };
      case 'PLAYER_ANALYSIS':
        return { label: 'Player Props', color: 'bg-purple-600/90 text-white border-purple-400/40' };
      case 'STATISTICAL_STUDY':
        return { label: 'Statistical Study', color: 'bg-emerald-600/90 text-white border-emerald-400/40' };
      case 'EVERGREEN_GUIDE':
        return { label: 'Strategy Guide', color: 'bg-amber-600/90 text-white border-amber-400/40' };
    }
  };

  const badge = getTypeBadge(article.articleType);

  // 1. DETAIL VIEW: Cinematic Widescreen Header Banner for Article Detail Page
  if (variant === 'detail') {
    return (
      <div className={`relative w-full rounded-3xl overflow-hidden shadow-2xl bg-slate-950 border border-slate-200 dark:border-slate-800 ${className}`}>
        {/* Background Image with blur & dark gradient overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={photo.url}
            alt={photo.alt}
            className="w-full h-full object-cover opacity-35 filter brightness-75 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/50" />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-between min-h-[200px] sm:min-h-[240px]">
          {/* Top Row: Category pill & Read time */}
          <div className="flex items-center justify-between text-xs">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-md ${badge.color}`}>
              {badge.label}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white font-mono text-xs border border-white/10">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{article.readingTimeMinutes} min read</span>
            </span>
          </div>

          {/* Center: If Game Preview, Team Matchup Showcase with Authentic ESPN Logos */}
          {isDailyPreview && awayMeta && homeMeta ? (
            <div className="py-4 flex items-center justify-center gap-6 sm:gap-12">
              {/* Away Team */}
              <div className="flex flex-col items-center text-center space-y-1.5 group">
                <div
                  className="w-16 h-16 sm:w-22 sm:h-22 rounded-2xl p-2.5 bg-white/10 backdrop-blur-md border border-white/20 shadow-xl flex items-center justify-center transition-transform group-hover:scale-105"
                  style={{ boxShadow: `0 8px 24px ${awayMeta.primaryColor}33` }}
                >
                  <img
                    src={awayMeta.logo}
                    alt={awayMeta.name}
                    className="w-full h-full object-contain drop-shadow-lg"
                  />
                </div>
                <div className="font-black text-white text-sm sm:text-base tracking-tight">
                  {awayMeta.name}
                </div>
                <span className="text-[11px] text-slate-300 font-mono font-semibold uppercase tracking-wider">
                  Away
                </span>
              </div>

              {/* VS Divider */}
              <div className="flex flex-col items-center">
                <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-mono font-black text-xs sm:text-sm tracking-widest shadow-lg border border-white/20">
                  VS
                </span>
                {article.gameTime && (
                  <span className="text-[11px] text-cyan-300 font-mono mt-1 font-bold">
                    {article.gameTime}
                  </span>
                )}
              </div>

              {/* Home Team */}
              <div className="flex flex-col items-center text-center space-y-1.5 group">
                <div
                  className="w-16 h-16 sm:w-22 sm:h-22 rounded-2xl p-2.5 bg-white/10 backdrop-blur-md border border-white/20 shadow-xl flex items-center justify-center transition-transform group-hover:scale-105"
                  style={{ boxShadow: `0 8px 24px ${homeMeta.primaryColor}33` }}
                >
                  <img
                    src={homeMeta.logo}
                    alt={homeMeta.name}
                    className="w-full h-full object-contain drop-shadow-lg"
                  />
                </div>
                <div className="font-black text-white text-sm sm:text-base tracking-tight">
                  {homeMeta.name}
                </div>
                <span className="text-[11px] text-slate-300 font-mono font-semibold uppercase tracking-wider">
                  Home
                </span>
              </div>
            </div>
          ) : (
            <div className="py-6 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <div className="text-white font-bold text-base sm:text-lg">
                  {article.primaryKeyword}
                </div>
                <div className="text-xs text-slate-300">
                  Verified empirical basketball analytics • NBATotals Quantitative Lab
                </div>
              </div>
            </div>
          )}

          {/* Bottom Row: Venue / Model Conviction */}
          <div className="flex items-center justify-between text-xs text-slate-300 border-t border-white/10 pt-3">
            <span className="flex items-center gap-1.5 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{article.venue || (homeMeta ? `${homeMeta.city} Arena` : 'NBA Regulation Arena')}</span>
            </span>

            {modelCtx && (
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase flex items-center gap-1 ${
                modelCtx.pickType === 'OVER'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-amber-400 text-slate-950'
              }`}>
                {modelCtx.pickType === 'OVER' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>MODEL {modelCtx.pickType} {modelCtx.marketLine.toFixed(1)}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. CARD VIEW: Grid Thumbnail Banner for PreviewsHubTab & Hub Cards
  return (
    <div className={`relative h-40 sm:h-44 w-full overflow-hidden bg-slate-950 ${className}`}>
      {/* Background Photography */}
      <img
        src={photo.url}
        alt={photo.alt}
        className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500 filter brightness-90"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/40" />

      {/* Top Floating Badge */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${badge.color}`}>
          {badge.label}
        </span>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/70 backdrop-blur-md text-[10px] font-mono text-slate-200 border border-white/10">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>{article.readingTimeMinutes}m</span>
        </span>
      </div>

      {/* Center Matchup Graphics for Game Previews */}
      {isDailyPreview && awayMeta && homeMeta ? (
        <div className="absolute inset-0 flex items-center justify-center gap-4 sm:gap-6 px-4 z-10 pt-3">
          {/* Away Team */}
          <div className="flex flex-col items-center space-y-1">
            <div
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl p-1.5 bg-slate-900/80 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
              style={{ boxShadow: `0 4px 16px ${awayMeta.primaryColor}40` }}
            >
              <img
                src={awayMeta.logo}
                alt={awayMeta.name}
                className="w-full h-full object-contain drop-shadow"
              />
            </div>
            <span className="text-[11px] font-black text-white font-mono tracking-wider drop-shadow">
              {awayMeta.abbrev}
            </span>
          </div>

          {/* VS Center Badge */}
          <div className="flex flex-col items-center">
            <span className="px-2 py-0.5 rounded-full bg-blue-600/90 text-white font-mono font-black text-[10px] tracking-wider border border-white/20 shadow-md">
              VS
            </span>
          </div>

          {/* Home Team */}
          <div className="flex flex-col items-center space-y-1">
            <div
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl p-1.5 bg-slate-900/80 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
              style={{ boxShadow: `0 4px 16px ${homeMeta.primaryColor}40` }}
            >
              <img
                src={homeMeta.logo}
                alt={homeMeta.name}
                className="w-full h-full object-contain drop-shadow"
              />
            </div>
            <span className="text-[11px] font-black text-white font-mono tracking-wider drop-shadow">
              {homeMeta.abbrev}
            </span>
          </div>
        </div>
      ) : (
        /* Non-matchup guides / studies */
        <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 text-center">
            <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>5-Season OLS Quantitative Model</span>
            </span>
          </div>
        </div>
      )}

      {/* Bottom Model Conviction Bar */}
      {modelCtx && (
        <div className="absolute bottom-2.5 right-3 z-10">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 ${
            modelCtx.pickType === 'OVER'
              ? 'bg-emerald-500 text-slate-950'
              : 'bg-amber-400 text-slate-950'
          }`}>
            {modelCtx.pickType} {modelCtx.marketLine.toFixed(1)}
            <span className="opacity-75">({Math.abs(modelCtx.edgePoints) > 0 ? `+${Math.abs(modelCtx.edgePoints).toFixed(1)}` : '0.0'})</span>
          </span>
        </div>
      )}

      {article.gameTime && (
        <div className="absolute bottom-2.5 left-3 z-10 text-[10px] font-mono text-slate-300 font-semibold drop-shadow">
          {article.gameTime}
        </div>
      )}
    </div>
  );
};
