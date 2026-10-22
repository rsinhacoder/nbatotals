import React from 'react';
import type { NBAArticle, ArticleType } from '../../types/content';
import { resolveTeamMeta } from '../../services/nbaRosterService';
import { getStarPlayerForTeam, NBA_STAR_PLAYERS } from '../../data/nbaStarPlayers';
import { getStarPlayerForNHLTeam, NHL_STAR_PLAYERS } from '../../data/nhlStarPlayers';
import { getNHLTeamProfile } from '../../data/nhlTeamProfiles';
import { Clock, TrendingUp, TrendingDown, MapPin, Zap } from 'lucide-react';

interface ArticleImageBannerProps {
  article: NBAArticle;
  variant?: 'card' | 'hero' | 'detail';
  className?: string;
}

interface StarPlayerData {
  name: string;
  shortName: string;
  team: string;
  position: string;
  jersey: string;
  stat: string;
  headshotUrl: string;
  primaryColor: string;
}

/**
 * High-impact Player Card Pod with dynamic team-colored radial aura,
 * official team logo watermark, halo ring, and torso gradient fade mask.
 */
const PlayerHeadshotCard: React.FC<{
  star: StarPlayerData;
  teamLogo: string;
  teamName: string;
  isHome?: boolean;
  size?: 'card' | 'detail-mobile' | 'detail-desktop';
}> = ({ star, teamLogo, teamName, isHome = false, size = 'card' }) => {
  // 1. MOBILE DETAIL VIEW POD (Compact 2-column card that never overflows)
  if (size === 'detail-mobile') {
    return (
      <div
        className="w-full h-44 rounded-2xl overflow-hidden relative border border-white/20 bg-gradient-to-b from-white/10 via-slate-900/80 to-slate-950 shadow-xl flex flex-col justify-between p-2.5"
        style={{
          boxShadow: `0 8px 24px -4px ${star.primaryColor}60, inset 0 1px 1px rgba(255, 255, 255, 0.2)`,
        }}
      >
        {/* Top Edge Team Color Glow Line */}
        <div
          className="absolute top-0 inset-x-0 h-[2px]"
          style={{
            background: `linear-gradient(to right, transparent, ${star.primaryColor}, transparent)`,
          }}
        />

        {/* Dynamic Radial Spotlight Aura */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 40%, ${star.primaryColor}90 0%, ${star.primaryColor}25 55%, transparent 75%)`,
          }}
        />

        {/* Large Team Logo Watermark */}
        {teamLogo && (
          <img
            src={teamLogo}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 m-auto w-24 h-24 object-contain opacity-25 scale-125 filter contrast-125 pointer-events-none select-none"
          />
        )}

        {/* Subtle Decorative Halo Ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-white/10 pointer-events-none" />

        {/* Top Row: Team Logo & Position/Jersey */}
        <div className="relative z-20 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/15">
            {teamLogo && <img src={teamLogo} alt={teamName} className="w-3.5 h-3.5 object-contain" />}
            <span className="text-[10px] font-mono font-black text-white">{star.team}</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-300 font-bold bg-slate-950/80 px-1.5 py-0.5 rounded border border-white/10">
            {star.position} {star.jersey}
          </span>
        </div>

        {/* Star Player Headshot with Soft Torso Mask Fade */}
        <div className="relative z-10 w-full h-24 flex items-end justify-center">
          <img
            src={star.headshotUrl}
            alt={star.name}
            className="h-24 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)] filter brightness-105"
            style={{
              maskImage: 'linear-gradient(to bottom, black 72%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 72%, transparent 100%)',
            }}
            loading="lazy"
          />
        </div>

        {/* Bottom Row: Truncated Player Name & Primary Stat */}
        <div className="relative z-20 bg-slate-950/90 backdrop-blur-md px-2 py-1 rounded-lg border border-white/15 text-center shadow-md">
          <div className="text-[11px] font-black text-white truncate leading-tight">
            {star.shortName || star.name}
          </div>
          <div className="text-[10px] font-mono font-bold text-cyan-400 mt-0.5">
            {star.stat}
          </div>
        </div>
      </div>
    );
  }

  // 2. DESKTOP DETAIL VIEW POD
  if (size === 'detail-desktop') {
    return (
      <div
        className="w-24 h-24 lg:w-28 lg:h-28 rounded-2xl overflow-hidden relative border border-white/20 bg-gradient-to-b from-white/10 via-slate-900/80 to-slate-950 shadow-2xl flex items-end justify-center shrink-0"
        style={{
          boxShadow: `0 8px 32px ${star.primaryColor}55, inset 0 1px 1px rgba(255, 255, 255, 0.2)`,
        }}
      >
        {/* Top Edge Team Color Glow Line */}
        <div
          className="absolute top-0 inset-x-0 h-[2px]"
          style={{
            background: `linear-gradient(to right, transparent, ${star.primaryColor}, transparent)`,
          }}
        />

        {/* Dynamic Radial Spotlight Aura */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 35%, ${star.primaryColor}90 0%, ${star.primaryColor}30 55%, transparent 75%)`,
          }}
        />

        {/* Large Team Logo Watermark */}
        {teamLogo && (
          <img
            src={teamLogo}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 m-auto w-24 h-24 object-contain opacity-25 scale-125 filter contrast-125 pointer-events-none select-none"
          />
        )}

        {/* Subtle Decorative Halo Ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-white/10 pointer-events-none" />

        {/* Player Headshot */}
        <img
          src={star.headshotUrl}
          alt={star.name}
          className="relative z-10 w-full h-full object-contain object-bottom scale-110 drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] filter brightness-105"
          style={{
            maskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
          }}
          loading="lazy"
        />

        {/* Corner Team Logo Badge */}
        <div
          className={`absolute z-20 ${
            isHome ? '-bottom-1.5 -left-1.5' : '-bottom-1.5 -right-1.5'
          } w-7 h-7 rounded-full bg-slate-950 p-1 border border-white/20 shadow-md flex items-center justify-center`}
        >
          {teamLogo && <img src={teamLogo} alt={teamName} className="w-full h-full object-contain" />}
        </div>
      </div>
    );
  }

  // 3. CARD VIEW POD (Used in PreviewsHub cards & Featured Card)
  return (
    <div
      className="w-28 sm:w-32 h-32 sm:h-36 rounded-2xl overflow-hidden relative border border-white/20 bg-gradient-to-b from-white/10 via-slate-900/80 to-slate-950 shadow-xl flex items-end justify-center group-hover:scale-105 transition-transform shrink-0"
      style={{
        boxShadow: `0 8px 24px -4px ${star.primaryColor}66, inset 0 1px 1px rgba(255, 255, 255, 0.2)`,
      }}
    >
      {/* Top Edge Team Color Glow Line */}
      <div
        className="absolute top-0 inset-x-0 h-[2px]"
        style={{
          background: `linear-gradient(to right, transparent, ${star.primaryColor}, transparent)`,
        }}
      />

      {/* Dynamic Radial Spotlight Aura */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 35%, ${star.primaryColor}85 0%, ${star.primaryColor}20 55%, transparent 75%)`,
        }}
      />

      {/* Large Team Logo Watermark */}
      {teamLogo && (
        <img
          src={teamLogo}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 m-auto w-20 h-20 sm:w-24 sm:h-24 object-contain opacity-25 scale-125 filter contrast-125 pointer-events-none select-none"
        />
      )}

      {/* Decorative Halo Ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-white/10 pointer-events-none" />

      {/* Corner Floating Team Logo Badge */}
      <div
        className={`absolute z-20 ${
          isHome ? 'top-1.5 right-1.5' : 'top-1.5 left-1.5'
        } flex items-center gap-1 bg-slate-950/90 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/20 shadow-md`}
      >
        {teamLogo && <img src={teamLogo} alt={teamName} className="w-3.5 h-3.5 object-contain" />}
        <span className="text-[9px] font-mono font-bold text-white">{star.team}</span>
      </div>

      {/* Star Player Headshot with Torso Gradient Fade Mask */}
      <img
        src={star.headshotUrl}
        alt={star.name}
        className="relative z-10 w-full h-full object-contain object-bottom scale-110 drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)] filter brightness-105"
        style={{
          maskImage: 'linear-gradient(to bottom, black 72%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 72%, transparent 100%)',
        }}
        loading="lazy"
      />

      {/* Attached Bottom Player Name Tag */}
      <div className="absolute bottom-1 inset-x-1.5 z-20 bg-slate-950/90 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-white/15 text-center shadow-lg truncate">
        <span className="text-[10px] font-black text-white">{star.shortName}</span>{' '}
        <span className="text-cyan-400 font-mono text-[9px] font-bold">({star.stat})</span>
      </div>
    </div>
  );
};

export const ArticleImageBanner: React.FC<ArticleImageBannerProps> = ({
  article,
  variant = 'card',
  className = '',
}) => {
  const isNHL = article.sport === 'nhl';
  const isDailyPreview = article.articleType === 'DAILY_PREVIEW' || Boolean(article.awayTeam && article.homeTeam);

  // Team metadata & star player resolution
  let awayLogo = '';
  let awayTeamName = '';
  let homeLogo = '';
  let homeTeamName = '';

  let awayStar: StarPlayerData = {
    name: '',
    shortName: '',
    team: '',
    position: '',
    jersey: '',
    stat: '',
    headshotUrl: '',
    primaryColor: '#2563eb',
  };

  let homeStar: StarPlayerData = {
    name: '',
    shortName: '',
    team: '',
    position: '',
    jersey: '',
    stat: '',
    headshotUrl: '',
    primaryColor: '#059669',
  };

  if (isNHL) {
    const awayProfile = article.awayTeam ? getNHLTeamProfile(article.awayTeam) : null;
    const homeProfile = article.homeTeam ? getNHLTeamProfile(article.homeTeam) : null;
    awayLogo = awayProfile?.logo || '';
    awayTeamName = awayProfile?.name || article.awayTeam || '';
    homeLogo = homeProfile?.logo || '';
    homeTeamName = homeProfile?.name || article.homeTeam || '';

    const awayStarObj = article.awayTeam ? getStarPlayerForNHLTeam(article.awayTeam) : NHL_STAR_PLAYERS['EDM'];
    const homeStarObj = article.homeTeam ? getStarPlayerForNHLTeam(article.homeTeam) : NHL_STAR_PLAYERS['TOR'];

    awayStar = {
      name: awayStarObj.name,
      shortName: awayStarObj.shortName,
      team: awayStarObj.team,
      position: awayStarObj.position,
      jersey: awayStarObj.jersey,
      stat: `${awayStarObj.pointsPerGame} PTS/G`,
      headshotUrl: awayStarObj.headshotUrl,
      primaryColor: awayStarObj.primaryColor,
    };

    homeStar = {
      name: homeStarObj.name,
      shortName: homeStarObj.shortName,
      team: homeStarObj.team,
      position: homeStarObj.position,
      jersey: homeStarObj.jersey,
      stat: `${homeStarObj.pointsPerGame} PTS/G`,
      headshotUrl: homeStarObj.headshotUrl,
      primaryColor: homeStarObj.primaryColor,
    };
  } else {
    const awayMeta = article.awayTeam ? resolveTeamMeta(article.awayTeam) : null;
    const homeMeta = article.homeTeam ? resolveTeamMeta(article.homeTeam) : null;
    awayLogo = awayMeta?.logo || '';
    awayTeamName = awayMeta?.name || article.awayTeam || '';
    homeLogo = homeMeta?.logo || '';
    homeTeamName = homeMeta?.name || article.homeTeam || '';

    const awayStarObj = article.awayTeam ? getStarPlayerForTeam(article.awayTeam) : NBA_STAR_PLAYERS['BOS'];
    const homeStarObj = article.homeTeam ? getStarPlayerForTeam(article.homeTeam) : NBA_STAR_PLAYERS['DAL'];

    awayStar = {
      name: awayStarObj.name,
      shortName: awayStarObj.shortName,
      team: awayStarObj.team,
      position: awayStarObj.position,
      jersey: awayStarObj.jersey,
      stat: `${awayStarObj.ppg} PPG`,
      headshotUrl: awayStarObj.headshotUrl,
      primaryColor: awayStarObj.primaryColor,
    };

    homeStar = {
      name: homeStarObj.name,
      shortName: homeStarObj.shortName,
      team: homeStarObj.team,
      position: homeStarObj.position,
      jersey: homeStarObj.jersey,
      stat: `${homeStarObj.ppg} PPG`,
      headshotUrl: homeStarObj.headshotUrl,
      primaryColor: homeStarObj.primaryColor,
    };
  }

  const modelCtx = article.modelContext;
  const nhlCtx = article.nhlModelContext;

  const getTypeBadge = (type: ArticleType) => {
    if (isNHL) {
      return { label: '🏒 NHL Preview', color: 'bg-indigo-600/90 text-white border-indigo-400/40' };
    }
    switch (type) {
      case 'DAILY_PREVIEW':
        return { label: '🏀 NBA Preview', color: 'bg-blue-600/90 text-white border-blue-400/40' };
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
            ? `radial-gradient(circle at 15% 50%, ${awayStar.primaryColor}35, transparent 50%), radial-gradient(circle at 85% 50%, ${homeStar.primaryColor}35, transparent 50%), #070b14`
            : 'radial-gradient(circle at 50% 50%, rgba(30, 58, 138, 0.25), transparent 70%), #070b14',
        }}
      >
        {/* Subtle Geometric Court / Rink Lines Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 p-4 sm:p-7 flex flex-col justify-between min-h-[260px] sm:min-h-[320px] gap-4">
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

          {/* Center: Star Player Face-Off */}
          {isDailyPreview && awayLogo && homeLogo ? (
            <>
              {/* MOBILE LAYOUT (< sm): 2-Column Responsive Grid that NEVER overflows */}
              <div className="sm:hidden grid grid-cols-2 gap-2.5 relative my-1">
                {/* Away Player Mobile Pod */}
                <PlayerHeadshotCard
                  star={awayStar}
                  teamLogo={awayLogo}
                  teamName={awayTeamName}
                  size="detail-mobile"
                />

                {/* Overlaid Center VS Badge */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center pointer-events-none">
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-mono font-black text-xs shadow-xl border border-white/20">
                    VS
                  </span>
                  {article.gameTime && (
                    <span className="text-[10px] font-mono font-bold text-cyan-300 bg-slate-950/95 px-2 py-0.5 rounded-full border border-white/15 mt-1 shadow-md whitespace-nowrap">
                      {article.gameTime}
                    </span>
                  )}
                </div>

                {/* Home Player Mobile Pod */}
                <PlayerHeadshotCard
                  star={homeStar}
                  teamLogo={homeLogo}
                  teamName={homeTeamName}
                  isHome={true}
                  size="detail-mobile"
                />
              </div>

              {/* DESKTOP LAYOUT (>= sm): Spacious Widescreen Duel */}
              <div className="hidden sm:flex items-center justify-between gap-6 py-2 relative">
                {/* Away Star Player */}
                <div className="flex items-center gap-4 flex-1">
                  <PlayerHeadshotCard
                    star={awayStar}
                    teamLogo={awayLogo}
                    teamName={awayTeamName}
                    size="detail-desktop"
                  />

                  <div className="text-left min-w-0">
                    <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                      {awayStar.team} • {awayStar.position} {awayStar.jersey}
                    </div>
                    <div className="font-black text-white text-xl lg:text-2xl tracking-tight truncate">
                      {awayStar.name}
                    </div>
                    <div className="text-sm font-mono text-slate-300 font-bold mt-0.5">
                      {awayStar.stat}
                    </div>
                  </div>
                </div>

                {/* Center VS & Slate Schedule */}
                <div className="flex flex-col items-center shrink-0 px-4">
                  <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-mono font-black text-sm tracking-widest shadow-xl border border-white/20">
                    VS
                  </span>
                  {article.gameTime && (
                    <span className="text-xs text-cyan-300 font-mono mt-1.5 font-bold">
                      {article.gameTime}
                    </span>
                  )}
                  {isNHL && nhlCtx ? (
                    <span className="mt-1.5 text-[11px] font-mono text-slate-300 font-semibold">
                      Total: <strong className="text-white">{nhlCtx.sportsbookTotal} Goals</strong>
                    </span>
                  ) : modelCtx ? (
                    <span className="mt-1.5 text-[11px] font-mono text-slate-300 font-semibold">
                      Line: <strong className="text-white">{modelCtx.marketLine}</strong>
                    </span>
                  ) : null}
                </div>

                {/* Home Star Player */}
                <div className="flex items-center justify-end gap-4 flex-1 text-right">
                  <div className="text-right min-w-0">
                    <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                      {homeStar.team} • {homeStar.position} {homeStar.jersey}
                    </div>
                    <div className="font-black text-white text-xl lg:text-2xl tracking-tight truncate">
                      {homeStar.name}
                    </div>
                    <div className="text-sm font-mono text-slate-300 font-bold mt-0.5">
                      {homeStar.stat}
                    </div>
                  </div>

                  <PlayerHeadshotCard
                    star={homeStar}
                    teamLogo={homeLogo}
                    teamName={homeTeamName}
                    isHome={true}
                    size="detail-desktop"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Non-matchup player spotlight or statistical study */
            <div className="py-4 flex items-center gap-5">
              <PlayerHeadshotCard
                star={isNHL ? {
                  name: NHL_STAR_PLAYERS['EDM'].name,
                  shortName: NHL_STAR_PLAYERS['EDM'].shortName,
                  team: 'EDM',
                  position: NHL_STAR_PLAYERS['EDM'].position,
                  jersey: NHL_STAR_PLAYERS['EDM'].jersey,
                  stat: `${NHL_STAR_PLAYERS['EDM'].pointsPerGame} PTS/G`,
                  headshotUrl: NHL_STAR_PLAYERS['EDM'].headshotUrl,
                  primaryColor: NHL_STAR_PLAYERS['EDM'].primaryColor,
                } : {
                  name: NBA_STAR_PLAYERS['BOS'].name,
                  shortName: NBA_STAR_PLAYERS['BOS'].shortName,
                  team: 'BOS',
                  position: NBA_STAR_PLAYERS['BOS'].position,
                  jersey: NBA_STAR_PLAYERS['BOS'].jersey,
                  stat: `${NBA_STAR_PLAYERS['BOS'].ppg} PPG`,
                  headshotUrl: NBA_STAR_PLAYERS['BOS'].headshotUrl,
                  primaryColor: NBA_STAR_PLAYERS['BOS'].primaryColor,
                }}
                teamLogo=""
                teamName=""
                size="detail-desktop"
              />
              <div className="space-y-1">
                <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isNHL ? 'NHL Poisson Goal Modeling' : 'NBA Quantitative Player Modeling'}</span>
                </div>
                <div className="text-white font-extrabold text-lg sm:text-xl">
                  {article.title}
                </div>
                <div className="text-xs text-slate-300">
                  {isNHL
                    ? 'Calibrated using 5-season bivariate Poisson distributions, starting goalie GSAx, and 5v5 Corsi possession.'
                    : 'Calibrated using real possession data, defensive efficiency, and player usage rates.'}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Row: Venue / Model Conviction */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 border-t border-white/10 pt-3">
            <span className="flex items-center gap-1.5 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{article.venue || (homeTeamName ? `${homeTeamName} Arena` : 'Regulation Arena')}</span>
            </span>

            {isNHL && nhlCtx ? (
              <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase flex items-center gap-1 shadow-md ${
                nhlCtx.pickType === 'OVER'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-amber-400 text-slate-950'
              }`}>
                {nhlCtx.pickType === 'OVER' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>MODEL {nhlCtx.pickType} {nhlCtx.sportsbookTotal} GOALS ({nhlCtx.goalEdge > 0 ? `+${nhlCtx.goalEdge.toFixed(2)}` : nhlCtx.goalEdge.toFixed(2)})</span>
              </span>
            ) : modelCtx ? (
              <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase flex items-center gap-1 shadow-md ${
                modelCtx.pickType === 'OVER'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-amber-400 text-slate-950'
              }`}>
                {modelCtx.pickType === 'OVER' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>MODEL {modelCtx.pickType} {modelCtx.marketLine.toFixed(1)}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // 2. CARD VIEW: High-Impact Star Player Duel on Every Blog & Preview Card
  return (
    <div
      className={`relative h-52 sm:h-56 w-full overflow-hidden bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 ${className}`}
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

      {/* Main Visual: Star Player Headshots (Left Pod vs Right Pod) */}
      {isDailyPreview && awayLogo && homeLogo ? (
        <div className="absolute inset-0 flex items-center justify-between px-3 sm:px-6 z-10 pt-5">
          {/* Away Team Star Player Pod */}
          <PlayerHeadshotCard
            star={awayStar}
            teamLogo={awayLogo}
            teamName={awayTeamName}
            size="card"
          />

          {/* Center Matchup Pill */}
          <div className="flex flex-col items-center justify-center self-center my-auto z-20 px-1 pointer-events-none">
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-mono font-black text-[10px] tracking-wider border border-white/20 shadow-lg">
              VS
            </span>
            {article.gameTime && (
              <span className="text-[9px] font-mono text-cyan-300 font-bold mt-1 bg-slate-950/85 px-2 py-0.5 rounded border border-white/10 shadow-xs whitespace-nowrap">
                {article.gameTime}
              </span>
            )}
          </div>

          {/* Home Team Star Player Pod */}
          <PlayerHeadshotCard
            star={homeStar}
            teamLogo={homeLogo}
            teamName={homeTeamName}
            isHome={true}
            size="card"
          />
        </div>
      ) : (
        /* Non-matchup Guide */
        <div className="absolute inset-0 flex items-center justify-center p-3 z-10 pt-4">
          <div className="flex items-center gap-4 bg-slate-950/85 backdrop-blur-md p-3 rounded-2xl border border-cyan-500/30 shadow-xl max-w-sm">
            <PlayerHeadshotCard
              star={isNHL ? {
                name: NHL_STAR_PLAYERS['EDM'].name,
                shortName: NHL_STAR_PLAYERS['EDM'].shortName,
                team: 'EDM',
                position: NHL_STAR_PLAYERS['EDM'].position,
                jersey: NHL_STAR_PLAYERS['EDM'].jersey,
                stat: `${NHL_STAR_PLAYERS['EDM'].pointsPerGame} PTS/G`,
                headshotUrl: NHL_STAR_PLAYERS['EDM'].headshotUrl,
                primaryColor: NHL_STAR_PLAYERS['EDM'].primaryColor,
              } : {
                name: NBA_STAR_PLAYERS['BOS'].name,
                shortName: NBA_STAR_PLAYERS['BOS'].shortName,
                team: 'BOS',
                position: NBA_STAR_PLAYERS['BOS'].position,
                jersey: NBA_STAR_PLAYERS['BOS'].jersey,
                stat: `${NBA_STAR_PLAYERS['BOS'].ppg} PPG`,
                headshotUrl: NBA_STAR_PLAYERS['BOS'].headshotUrl,
                primaryColor: NBA_STAR_PLAYERS['BOS'].primaryColor,
              }}
              teamLogo=""
              teamName=""
              size="card"
            />
            <div className="text-left min-w-0">
              <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                {isNHL ? 'C. McDavid • Oilers' : 'J. Tatum • Celtics'}
              </div>
              <div className="text-xs font-bold text-white truncate max-w-[170px] mt-0.5">
                {article.title}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                Quantitative predictive breakdown
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Centered Bottom Model Conviction Pill (Never collides with player headshots or name tags) */}
      {isNHL && nhlCtx ? (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg border border-white/20 flex items-center gap-1 ${
            nhlCtx.pickType === 'OVER'
              ? 'bg-emerald-500 text-slate-950'
              : 'bg-amber-400 text-slate-950'
          }`}>
            {nhlCtx.pickType === 'OVER' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>MODEL {nhlCtx.pickType} {nhlCtx.sportsbookTotal}</span>
            <span className="font-mono opacity-85">({nhlCtx.goalEdge > 0 ? `+${nhlCtx.goalEdge.toFixed(2)}` : nhlCtx.goalEdge.toFixed(2)})</span>
          </span>
        </div>
      ) : modelCtx ? (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg border border-white/20 flex items-center gap-1 ${
            modelCtx.pickType === 'OVER'
              ? 'bg-emerald-500 text-slate-950'
              : 'bg-amber-400 text-slate-950'
          }`}>
            {modelCtx.pickType === 'OVER' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>MODEL {modelCtx.pickType} {modelCtx.marketLine.toFixed(1)}</span>
            <span className="font-mono opacity-85">({Math.abs(modelCtx.edgePoints) > 0 ? `+${Math.abs(modelCtx.edgePoints).toFixed(1)}` : '0.0'})</span>
          </span>
        </div>
      ) : null}
    </div>
  );
};

export default ArticleImageBanner;
