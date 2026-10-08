import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  BookmarkPlus,
  BookmarkCheck,
  Zap,
  Sliders,
  ExternalLink,
  Newspaper,
  Layers,
} from 'lucide-react';
import type { UpcomingMatch } from '../types/nba';
import { getTeamProfile } from '../data/teamProfiles';
import { fetchNBANews, type NBANewsArticle } from '../utils/espnApi';
import { AdBanner } from './AdBanner';

interface MatchDetailPageProps {
  match: UpcomingMatch;
  onBack: () => void;
  onTrackBet: (match: UpcomingMatch, pickType: 'UNDER' | 'OVER') => void;
  onSendToAnalyzer: (match: UpcomingMatch) => void;
  isTracked: boolean;
  onUpdateSportsbookLine: (matchId: string, newLine: number) => void;
}

export const MatchDetailPage: React.FC<MatchDetailPageProps> = ({
  match,
  onBack,
  onTrackBet,
  onSendToAnalyzer,
  isTracked,
  onUpdateSportsbookLine,
}) => {
  const away = useMemo(() => getTeamProfile(match.awayTeam), [match.awayTeam]);
  const home = useMemo(() => getTeamProfile(match.homeTeam), [match.homeTeam]);

  // Line editing / testing state
  const [currentLine, setCurrentLine] = useState<number>(match.sportsbookLine);
  const [newsArticles, setNewsArticles] = useState<NBANewsArticle[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(true);

  // Synchronize when match line changes
  useEffect(() => {
    setCurrentLine(match.sportsbookLine);
  }, [match.sportsbookLine]);

  // Fetch real-time ESPN NBA News
  useEffect(() => {
    let isMounted = true;
    async function loadNews() {
      setIsLoadingNews(true);
      const articles = await fetchNBANews();
      if (isMounted) {
        const awayKeywords = [away.name.toLowerCase(), away.shortName.toLowerCase(), away.abbreviation.toLowerCase()];
        const homeKeywords = [home.name.toLowerCase(), home.shortName.toLowerCase(), home.abbreviation.toLowerCase()];

        const teamRelevant = articles.filter((a) => {
          const text = (a.headline + ' ' + a.description).toLowerCase();
          return awayKeywords.some((k) => text.includes(k)) || homeKeywords.some((k) => text.includes(k));
        });

        if (teamRelevant.length > 0) {
          setNewsArticles(teamRelevant.slice(0, 5));
        } else {
          setNewsArticles(articles.slice(0, 5));
        }
        setIsLoadingNews(false);
      }
    }
    loadNews();
    return () => {
      isMounted = false;
    };
  }, [away, home]);

  // Dynamic edge based on slider line
  const dynamicEdge = useMemo(() => {
    return Number((match.modelProjectedTotal - currentLine).toFixed(1));
  }, [match.modelProjectedTotal, currentLine]);

  const absEdge = Math.abs(dynamicEdge);
  const isUnder = dynamicEdge <= -3.0;
  const isLeanUnder = dynamicEdge > -3.0 && dynamicEdge <= -1.5;
  const isOver = dynamicEdge >= 3.0;
  const isLeanOver = dynamicEdge < 3.0 && dynamicEdge >= 1.5;
  const isPass = Math.abs(dynamicEdge) < 1.5;

  const handleSaveLine = (val: number) => {
    setCurrentLine(val);
    onUpdateSportsbookLine(match.id, val);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Breadcrumb & Back Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1c2438] pb-3 transition-colors duration-200">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#141b2a] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
        >
          <ArrowLeft className="h-4 w-4 text-blue-600 dark:text-amber-400" />
          <span>Back to Match Slate</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
          <span>Match ID: #{match.id.replace('upc_', '')}</span>
          <span>•</span>
          <span className="text-slate-700 dark:text-zinc-300">{match.date}</span>
        </div>
      </div>

      {/* Matchup Hero Banner */}
      <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-5 shadow-xs transition-colors duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Teams Display */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Away Team */}
            <div className="flex items-center gap-3">
              <img
                src={away.logo}
                alt={away.name}
                className="h-14 w-14 object-contain bg-slate-50 dark:bg-[#090d16] rounded-xl p-2 border border-slate-200 dark:border-[#1c2438] shadow-2xs"
              />
              <div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                  Away
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {away.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                  {match.awayRecord} • Pace: {away.paceRating}
                </div>
              </div>
            </div>

            <div className="text-slate-400 dark:text-zinc-600 font-bold text-sm">@</div>

            {/* Home Team */}
            <div className="flex items-center gap-3">
              <img
                src={home.logo}
                alt={home.name}
                className="h-14 w-14 object-contain bg-slate-50 dark:bg-[#090d16] rounded-xl p-2 border border-slate-200 dark:border-[#1c2438] shadow-2xs"
              />
              <div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                  Home
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {home.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                  {match.homeRecord} • Pace: {home.paceRating}
                </div>
              </div>
            </div>
          </div>

          {/* Tipoff & Status */}
          <div className="flex flex-col md:items-end gap-1 shrink-0">
            <div className="flex items-center gap-2">
              {match.status === 'Live' ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/40 animate-pulse">
                  LIVE IN-PLAY
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 dark:bg-[#090d16] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#1c2438] font-mono">
                  {match.date} • {match.time}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400">
              Regulation 48 Minutes • NBA Official
            </div>
          </div>
        </div>
      </div>

      {/* The Core Over/Under Discrepancy & Action Card */}
      <div
        className={`bg-white dark:bg-[#0f1422] border ${
          isUnder
            ? 'border-emerald-300 dark:border-emerald-500/60'
            : isOver
            ? 'border-rose-300 dark:border-rose-500/60'
            : 'border-slate-200 dark:border-[#1c2438]'
        } rounded-xl p-5 shadow-xs space-y-4 transition-colors duration-200`}
      >
        {/* Top Verdict Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {isUnder || isLeanUnder ? (
              <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-500/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 shadow-2xs">
                <TrendingDown className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
                    Official Recommendation
                  </div>
                  <div className="text-base font-black font-mono text-emerald-950 dark:text-white">
                    BET UNDER {currentLine}
                  </div>
                </div>
              </div>
            ) : isOver || isLeanOver ? (
              <div className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 border border-rose-300 dark:border-rose-500/60 text-rose-800 dark:text-rose-300 flex items-center gap-2 shadow-2xs">
                <TrendingUp className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-rose-700 dark:text-rose-400">
                    Official Recommendation
                  </div>
                  <div className="text-base font-black font-mono text-rose-950 dark:text-white">
                    BET OVER {currentLine}
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#090d16] border border-slate-200 dark:border-[#1c2438] text-slate-700 dark:text-zinc-400">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-zinc-500">
                  Official Recommendation
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-zinc-300 font-mono">
                  PASS / LINE FAIRLY PRICED
                </div>
              </div>
            )}

            <div className="text-xs">
              <span className="text-slate-500 dark:text-zinc-400">Conviction: </span>
              <strong
                className={
                  isUnder ? 'text-emerald-700 dark:text-emerald-400' : isOver ? 'text-rose-700 dark:text-rose-400' : 'text-slate-700 dark:text-zinc-300'
                }
              >
                {match.recommendation} ({match.confidenceScore}%)
              </strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isPass && (
              <button
                onClick={() => onTrackBet(match, dynamicEdge < 0 ? 'UNDER' : 'OVER')}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isTracked
                    ? 'bg-slate-100 dark:bg-[#182033] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#222c42]'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                }`}
              >
                {isTracked ? (
                  <>
                    <BookmarkCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Position Tracked</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="h-4 w-4" />
                    <span>Track Bet ({absEdge >= 5 ? '2.0u' : '1.0u'})</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => onSendToAnalyzer(match)}
              className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#141b2a] hover:bg-slate-200 dark:hover:bg-[#1a2336] text-slate-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200 dark:border-[#222c42]"
            >
              <Sliders className="h-3.5 w-3.5 text-blue-600 dark:text-amber-400" />
              <span>Full Simulator</span>
            </button>
          </div>
        </div>

        {/* 3 Key Numbers Comparison Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1c2438] rounded-lg p-3.5 text-center">
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Sportsbook Total Line
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-amber-300 font-mono mt-0.5">
              {currentLine.toFixed(1)}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-zinc-500">Market Consensus</div>
          </div>

          <div className="border-y sm:border-y-0 sm:border-x border-slate-200 dark:border-[#1c2438] py-2 sm:py-0">
            <div className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Model Fair Total
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {match.modelProjectedTotal.toFixed(1)}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-zinc-500">48-Min Regulation</div>
          </div>

          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Point Discrepancy (Edge)
            </div>
            <div
              className={`text-xl font-black font-mono mt-0.5 ${
                dynamicEdge <= -3.0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : dynamicEdge >= 3.0
                  ? 'text-rose-700 dark:text-rose-400'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              {dynamicEdge > 0 ? `+${dynamicEdge.toFixed(1)}` : dynamicEdge.toFixed(1)} pts
            </div>
            <div className="text-[10px] text-slate-500 dark:text-zinc-500">
              {isUnder ? 'Under Safety Margin' : isOver ? 'Over Safety Margin' : 'Near Zero'}
            </div>
          </div>
        </div>

        {/* Interactive Line Adjuster Slider */}
        <div className="pt-2 border-t border-slate-200 dark:border-[#1c2438] space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-zinc-300">
              Test Line Sensitivity (Adjust Sportsbook Total)
            </span>
            <span className="font-mono text-blue-700 dark:text-amber-300 font-bold">
              {currentLine.toFixed(1)} pts
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="200"
              max="245"
              step="0.5"
              value={currentLine}
              onChange={(e) => handleSaveLine(parseFloat(e.target.value))}
              className="flex-1 accent-blue-600 dark:accent-amber-400 cursor-pointer"
            />
            <button
              onClick={() => handleSaveLine(match.sportsbookLine)}
              className="text-[11px] text-blue-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Reset ({match.sportsbookLine})
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Left: Quantitative Breakdown | Right: Game News & Sponsor Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (6 cols): Quantitative Math & Lowest Quarter Engine */}
        <div className="lg:col-span-6 space-y-4">
          {/* Lowest Quarter Engine */}
          <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-4 space-y-3 shadow-xs">
            <div className="text-xs font-bold text-slate-900 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-blue-600 dark:text-amber-400" />
              Lowest Quarter Mathematical Breakdown
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 dark:bg-[#090d16] p-2.5 rounded-lg border border-slate-200 dark:border-[#1c2438]">
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-semibold">
                  Projected Lowest Q Floor
                </div>
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-amber-400 mt-0.5">
                  {match.projectedLowestQuarter} pts
                </div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-500">Combined slowest period</div>
              </div>

              <div className="bg-slate-50 dark:bg-[#090d16] p-2.5 rounded-lg border border-slate-200 dark:border-[#1c2438]">
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-semibold">
                  Rule of 47 Evaluation
                </div>
                <div
                  className={`text-lg font-bold font-mono mt-0.5 ${
                    match.projectedLowestQuarter < 47 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {match.projectedLowestQuarter < 47 ? 'PASS (<47)' : 'FAIL (≥47)'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-500">
                  {match.projectedLowestQuarter < 47
                    ? '91.1% historical Under 219'
                    : 'High scoring probability'}
                </div>
              </div>
            </div>

            {/* Estimated Scoring per Quarter */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 uppercase">
                Estimated Regulation Scoring Distribution
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-mono">
                {(() => {
                  const floor = match.projectedLowestQuarter;
                  const otherAvg = (match.modelProjectedOther3 / 3).toFixed(1);
                  return [
                    { q: 'Q1', pts: `${otherAvg}`, desc: 'Average' },
                    { q: 'Q2', pts: `${otherAvg}`, desc: 'Average' },
                    { q: 'Q3', pts: `${otherAvg}`, desc: 'Average' },
                    { q: 'Q4 (Floor)', pts: `${floor}`, desc: 'Floor' },
                  ].map((p) => (
                    <div
                      key={p.q}
                      className="bg-slate-50 dark:bg-[#090d16] p-2 rounded-lg border border-slate-200 dark:border-[#1c2438]"
                    >
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400">{p.q}</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">{p.pts}</div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Why This Pick Narrative */}
            <div className="bg-slate-50 dark:bg-[#090d16] p-3 rounded-lg border border-slate-200 dark:border-[#1c2438] text-xs space-y-1">
              <span className="font-bold text-slate-900 dark:text-zinc-200">Model Key Narrative: </span>
              <p className="text-slate-700 dark:text-zinc-300 leading-relaxed m-0">{match.keyNarrative}</p>
            </div>
          </div>

          {/* Team Pace & Defensive Profile Matchup */}
          <div className="bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-[#1c2438] rounded-xl p-4 space-y-3 shadow-xs">
            <div className="text-xs font-bold text-slate-900 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-blue-600 dark:text-amber-400" />
              Team Pace &amp; Defensive Ratings Comparison
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-[#090d16] p-2.5 rounded-lg border border-slate-200 dark:border-[#1c2438]">
                <span className="text-slate-600 dark:text-zinc-400">Tempo / Pace (Poss / 48m)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {away.shortName}: {away.paceRating} vs {home.shortName}: {home.paceRating}
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-50 dark:bg-[#090d16] p-2.5 rounded-lg border border-slate-200 dark:border-[#1c2438]">
                <span className="text-slate-600 dark:text-zinc-400">Defensive Rating (Pts Allowed/100)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {away.shortName}: {away.defensiveRating} vs {home.shortName}: {home.defensiveRating}
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-50 dark:bg-[#090d16] p-2.5 rounded-lg border border-slate-200 dark:border-[#1c2438]">
                <span className="text-slate-600 dark:text-zinc-400">Historical Under 219 Rate</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {away.shortName}: {away.under219Rate}% | {home.shortName}: {home.under219Rate}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (6 cols): Breaking Game News & Sponsored Revenue Ad */}
        <div className="lg:col-span-6 space-y-4">
          {/* Revenue Generation Box Ad */}
          <AdBanner variant="box" />

          {/* Breaking News Feed */}
          <div className="bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-[#1c2438] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-blue-600 dark:text-amber-400" />
                Breaking News &amp; Team Intel
              </div>
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">Verified ESPN Feed</span>
            </div>

            {isLoadingNews ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-zinc-400">
                Loading latest news from ESPN...
              </div>
            ) : newsArticles.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-zinc-400">
                No recent breaking reports found for this matchup.
              </div>
            ) : (
              <div className="space-y-3">
                {newsArticles.map((article) => (
                  <a
                    key={article.id}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3.5 bg-slate-50/80 hover:bg-blue-50/50 dark:bg-[#111827] dark:hover:bg-[#172238] p-3 rounded-xl border border-slate-200/80 dark:border-[#1f293d] hover:border-blue-400 dark:hover:border-blue-500/50 transition-all group"
                  >
                    {article.imageUrl && (
                      <img
                        src={article.imageUrl}
                        alt="News thumbnail"
                        className="h-16 w-24 object-cover rounded-lg bg-slate-200 dark:bg-zinc-800 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                        {article.headline}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                        {article.description}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-zinc-500 font-mono mt-1.5 flex items-center gap-2">
                        <span>{new Date(article.published).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        <span>•</span>
                        <span className="text-blue-600 dark:text-blue-400 font-sans font-semibold flex items-center gap-1">
                          Full Story <ExternalLink className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default MatchDetailPage;
