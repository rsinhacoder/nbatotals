import React from 'react';
import type { NBAArticle, ArticleType } from '../../types/content';
import { resolveTeamMeta } from '../../services/nbaRosterService';
import { getStarPlayerForTeam, NBA_STAR_PLAYERS, type NBAStarPlayer } from '../../data/nbaStarPlayers';
import { Clock, TrendingUp, TrendingDown, Sparkles, MapPin, Zap } from 'lucide-react';

interface ArticleImageBannerProps {
  article: NBAArticle;
  variant?: 'card' | 'hero' | 'detail';
  className?: string;
}

export const ArticleImageBanner: React.FC<ArticleImageBannerProps> = ({
  article,
  variant = 'card',
  className = '',
}) => {
  const isDailyPreview = article.articleType === 'DAILY_PREVIEW' || Boolean(article.awayTeam && article.homeTeam);

  const awayMeta = article.awayTeam ? resolveTeamMeta(article.awayTeam) : null;
  const homeMeta = article.homeTeam ? resolveTeamMeta(article.homeTeam) : null;

  const awayStar: NBAStarPlayer = article.awayTeam
    ? getStarPlayerForTeam(article.awayTeam)
    : NBA_STAR_PLAYERS['BOS'];
  const homeStar: NBAStarPlayer = article.homeTeam
    ? getStarPlayerForTeam(article.homeTeam)
    : NBA_STAR_PLAYERS['DAL'];

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

  // 1. DETAIL VIEW: Widescreen Star Player Matchup Showcase on Article Detail Page
  if (variant === 'detail') {
    return (
      <div
        className={`relative w-full rounded-3xl overflow-hidden shadow-2xl bg-slate-950 border border-slate-200 dark:border-slate-800 ${className}`}
        style={{
          background: isDailyPreview
            ? `radial-gradient(circle at 15% 50%, ${awayStar.primaryColor}30, transparent 45%), radial-gradient(circle at 85% 50%, ${homeStar.primaryColor}30, transparent 45%), #070b14`
            : 'radial-gradient(circle at 50% 50%, rgba(30, 58, 138, 0.25), transparent 70%), #070b14',
        }}
      >
        {/* Subtle Geometric Court Lines Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 p-5 sm:p-8 flex flex-col justify-between min-h-[260px] sm:min-h-[320px]">
          {/* Top Row: Category pill & Reading time */}
          <div className="flex items-center justify-between text-xs">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-md ${badge.color}`}>
              {badge.label}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white font-mono text-xs border border-white/10">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{article.readingTimeMinutes} min read</span>
            </span>
          </div>

          {/* Center: Star Player Face-Off (No stock photos!) */}
          {isDailyPreview && awayMeta && homeMeta ? (
            <div className="py-2 flex items-center justify-between gap-2 sm:gap-6 relative">
              {/* Away Star Player */}
              <div className="flex items-center gap-3 sm:gap-4 flex-1">
                <div className="relative shrink-0">
                  <div
                    className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl p-1 bg-gradient-to-b from-white/15 to-white/5 border border-white/15 shadow-2xl flex items-center justify-center overflow-hidden"
                    style={{ boxShadow: `0 8px 32px ${awayStar.primaryColor}40` }}
                  >
                    <img
                      src={awayStar.headshotUrl}
                      alt={awayStar.name}
                      className="w-full h-full object-cover object-top scale-110 drop-shadow-xl"
                      loading="lazy"
                    />
                  </div>
                  {/* Floating Team Logo Badge */}
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-950 p-1 border border-white/20 shadow-md flex items-center justify-center">
                    <img src={awayMeta.logo} alt={awayMeta.name} className="w-full h-full object-contain" />
                  </div>
                </div>

                <div className="text-left min-w-0">
                  <div className="text-[10px] sm:text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    {awayStar.team} • {awayStar.position} {awayStar.jersey}
                  </div>
                  <div className="font-black text-white text-base sm:text-2xl tracking-tight truncate">
                    {awayStar.name}
                  </div>
                  <div className="text-xs sm:text-sm font-mono text-slate-300 font-bold mt-0.5">
                    {awayStar.ppg} PPG
                  </div>
                </div>
              </div>

              {/* Center VS & Slate Schedule */}
              <div className="flex flex-col items-center shrink-0 px-2 sm:px-4">
                <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-mono font-black text-xs sm:text-sm tracking-widest shadow-xl border border-white/20">
                  VS
                </span>
                {article.gameTime && (
                  <span className="text-[11px] text-cyan-300 font-mono mt-1.5 font-bold">
                    {article.gameTime}
                  </span>
                )}
                {modelCtx && (
                  <span className="mt-1.5 text-[10px] font-mono text-slate-300 font-semibold hidden sm:inline-block">
                    Line: <strong className="text-white">{modelCtx.marketLine}</strong>
                  </span>
                )}
              </div>

              {/* Home Star Player */}
              <div className="flex items-center justify-end gap-3 sm:gap-4 flex-1 text-right">
                <div className="text-right min-w-0">
                  <div className="text-[10px] sm:text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    {homeStar.team} • {homeStar.position} {homeStar.jersey}
                  </div>
                  <div className="font-black text-white text-base sm:text-2xl tracking-tight truncate">
                    {homeStar.name}
                  </div>
                  <div className="text-xs sm:text-sm font-mono text-slate-300 font-bold mt-0.5">
                    {homeStar.ppg} PPG
                  </div>
                </div>

                <div className="relative shrink-0">
                  <div
                    className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl p-1 bg-gradient-to-b from-white/15 to-white/5 border border-white/15 shadow-2xl flex items-center justify-center overflow-hidden"
                    style={{ boxShadow: `0 8px 32px ${homeStar.primaryColor}40` }}
                  >
                    <img
                      src={homeStar.headshotUrl}
                      alt={homeStar.name}
                      className="w-full h-full object-cover object-top scale-110 drop-shadow-xl"
                      loading="lazy"
                    />
                  </div>
                  {/* Floating Team Logo Badge */}
                  <div className="absolute -bottom-2 -left-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-950 p-1 border border-white/20 shadow-md flex items-center justify-center">
                    <img src={homeMeta.logo} alt={homeMeta.name} className="w-full h-full object-contain" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Non-matchup player spotlight or statistical study */
            <div className="py-4 flex items-center gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-1 bg-white/10 border border-white/20 shadow-xl overflow-hidden shrink-0">
                <img
                  src={article.articleType === 'PLAYER_ANALYSIS' ? NBA_STAR_PLAYERS['SAS'].headshotUrl : NBA_STAR_PLAYERS['BOS'].headshotUrl}
                  alt="NBA Featured Star"
                  className="w-full h-full object-cover object-top scale-110"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>NBA Quantitative Player Modeling</span>
                </div>
                <div className="text-white font-extrabold text-lg sm:text-xl">
                  {article.title}
                </div>
                <div className="text-xs text-slate-300">
                  Calibrated using real possession data, defensive efficiency, and player usage rates.
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

  // 2. CARD VIEW: High-Impact Star Player Duel on Every Blog & Preview Card
  return (
    <div
      className={`relative h-44 sm:h-48 w-full overflow-hidden bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 ${className}`}
      style={{
        background: isDailyPreview
          ? `linear-gradient(135deg, ${awayStar.primaryColor}35 0%, #080d19 50%, ${homeStar.primaryColor}35 100%), #070b14`
          : 'linear-gradient(135deg, #1e3a8a30 0%, #080d19 50%, #064e3b30 100%), #070b14',
      }}
    >
      {/* Background Graphic Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* Top Floating Badge Row */}
      <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between z-20">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${badge.color}`}>
          {badge.label}
        </span>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-mono text-slate-200 border border-white/10">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>{article.readingTimeMinutes}m</span>
        </span>
      </div>

      {/* Main Visual: Star Player Headshots (Left vs Right) */}
      {isDailyPreview && awayMeta && homeMeta ? (
        <div className="absolute inset-0 flex items-end justify-between px-3 sm:px-6 z-10 pt-4">
          {/* Away Team Star Player */}
          <div className="flex flex-col items-start pb-2 relative group-hover:translate-x-0.5 transition-transform">
            {/* Team Logo Badge */}
            <div className="flex items-center gap-1.5 mb-1 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 z-20">
              <img src={awayMeta.logo} alt={awayMeta.name} className="w-3.5 h-3.5 object-contain" />
              <span className="text-[10px] font-mono font-bold text-white">{awayStar.team}</span>
            </div>

            {/* Real ESPN Player Headshot */}
            <div className="relative">
              <img
                src={awayStar.headshotUrl}
                alt={awayStar.name}
                className="h-28 sm:h-32 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.8)] filter brightness-95 group-hover:scale-105 transition-transform"
                loading="lazy"
              />
              {/* Star Player Name Pill */}
              <div className="absolute -bottom-1.5 left-0 bg-slate-950/90 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-white border border-white/10 truncate max-w-[120px]">
                {awayStar.shortName} <span className="text-cyan-400 font-mono text-[9px]">{awayStar.ppg}p</span>
              </div>
            </div>
          </div>

          {/* Center Matchup Pill */}
          <div className="flex flex-col items-center justify-center self-center my-auto z-20 px-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-mono font-black text-[10px] tracking-wider border border-white/20 shadow-lg">
              VS
            </span>
            {article.gameTime && (
              <span className="text-[9px] font-mono text-slate-300 font-bold mt-1 bg-slate-950/80 px-1.5 py-0.2 rounded">
                {article.gameTime}
              </span>
            )}
          </div>

          {/* Home Team Star Player */}
          <div className="flex flex-col items-end pb-2 relative group-hover:-translate-x-0.5 transition-transform">
            {/* Team Logo Badge */}
            <div className="flex items-center gap-1.5 mb-1 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 z-20">
              <span className="text-[10px] font-mono font-bold text-white">{homeStar.team}</span>
              <img src={homeMeta.logo} alt={homeMeta.name} className="w-3.5 h-3.5 object-contain" />
            </div>

            {/* Real ESPN Player Headshot */}
            <div className="relative">
              <img
                src={homeStar.headshotUrl}
                alt={homeStar.name}
                className="h-28 sm:h-32 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.8)] filter brightness-95 group-hover:scale-105 transition-transform"
                loading="lazy"
              />
              {/* Star Player Name Pill */}
              <div className="absolute -bottom-1.5 right-0 bg-slate-950/90 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-white border border-white/10 truncate max-w-[120px] text-right">
                {homeStar.shortName} <span className="text-cyan-400 font-mono text-[9px]">{homeStar.ppg}p</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Non-matchup Guide: Feature marquee NBA superstar headshot */
        <div className="absolute inset-0 flex items-center justify-center p-3 z-10">
          <div className="flex items-center gap-4 bg-slate-950/80 backdrop-blur-md p-2.5 rounded-2xl border border-cyan-500/30">
            <img
              src={article.articleType === 'PLAYER_ANALYSIS' ? NBA_STAR_PLAYERS['SAS'].headshotUrl : NBA_STAR_PLAYERS['BOS'].headshotUrl}
              alt="NBA Star"
              className="w-14 h-14 object-contain rounded-xl bg-white/5 p-1"
            />
            <div className="text-left">
              <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                {article.articleType === 'PLAYER_ANALYSIS' ? 'V. Wembanyama • Spurs' : 'J. Tatum • Celtics'}
              </div>
              <div className="text-xs font-bold text-white truncate max-w-[170px]">
                {article.title}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Model Conviction Pill */}
      {modelCtx && (
        <div className="absolute bottom-2 left-3 z-20">
          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 ${
            modelCtx.pickType === 'OVER'
              ? 'bg-emerald-500 text-slate-950'
              : 'bg-amber-400 text-slate-950'
          }`}>
            {modelCtx.pickType} {modelCtx.marketLine.toFixed(1)}
            <span className="opacity-80">({Math.abs(modelCtx.edgePoints) > 0 ? `+${Math.abs(modelCtx.edgePoints).toFixed(1)}` : '0.0'})</span>
          </span>
        </div>
      )}
    </div>
  );
};
