import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Users,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import type { NBAArticle } from '../../types/content';
import { nbaContentEngine } from '../../services/nbaContentEngine';
import { analytics } from '../../utils/analytics';
import { updateSEOHead, resetSEOHeadToDefault } from '../../utils/seoHead';
import { ArticleContentRenderer, stripMarkdown } from './ArticleContentRenderer';
import { ArticleImageBanner } from './ArticleImageBanner';

interface ArticleDetailPageProps {
  article: NBAArticle;
  onBack: () => void;
  onNavigateTab: (tab: string, gameId?: string) => void;
  onSelectArticle: (article: NBAArticle) => void;
}

export const ArticleDetailPage: React.FC<ArticleDetailPageProps> = ({
  article,
  onBack,
  onNavigateTab,
  onSelectArticle,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0]); // First FAQ open by default
  const [activeSectionId, setActiveSectionId] = useState<string>('');

  // Related articles
  const relatedArticles = useMemo(() => {
    return nbaContentEngine.getRelatedArticles(article, 3);
  }, [article]);

  // Update Dynamic SEO Head & Schema.org JSON-LD whenever article changes
  useEffect(() => {
    const isNHL = article.sport === 'nhl';
    updateSEOHead({
      title: `${article.title} — ${isNHL ? 'NHLTotals.com' : 'NBATotals.com'}`,
      description: article.metaDescription,
      canonicalUrl: `https://nbatotals.com/previews/${article.slug}`,
      article,
      breadcrumbs: [
        { name: 'Home', url: '/' },
        { name: isNHL ? 'NHL Previews & Analysis' : 'NBA Previews & Editorial', url: '/?tab=previews' },
        { name: article.title, url: `/previews/${article.slug}` },
      ],
    });

    // Track GA4 article view
    analytics.trackArticleView(article.slug, article.title, article.articleType, article.primaryKeyword);

    // Scroll to top of article
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      resetSEOHeadToDefault();
    };
  }, [article]);

  // Scroll depth tracking (25%, 50%, 75%, 100%)
  useEffect(() => {
    const trackedMilestones = new Set<number>();

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;

      const currentScroll = window.scrollY;
      const scrollPercent = Math.min(100, Math.round((currentScroll / scrollHeight) * 100));

      const milestones = [25, 50, 75, 100];
      for (const milestone of milestones) {
        if (scrollPercent >= milestone && !trackedMilestones.has(milestone)) {
          trackedMilestones.add(milestone);
          analytics.trackArticleScroll(article.slug, milestone);
        }
      }

      // Update active section for TOC
      const headingElements = article.sections
        .map((s) => document.getElementById(`section-${s.id}`))
        .filter(Boolean) as HTMLElement[];

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const el = headingElements[i];
        if (el && el.getBoundingClientRect().top <= 140) {
          setActiveSectionId(el.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [article]);

  const handleShare = async () => {
    const url = `https://nbatotals.com/previews/${article.slug}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      analytics.trackFeatureUse('share_article', { slug: article.slug, method: 'clipboard' });
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleCtaClick = (destinationTab: string, ctaName: string, gameId?: string) => {
    analytics.trackArticleCtaClick(article.slug, destinationTab, ctaName, gameId);
    onNavigateTab(destinationTab, gameId);
  };

  const modelCtx = article.modelContext;
  const allKeywords = [article.primaryKeyword, ...(article.secondaryKeywords || [])];

  return (
    <article className="max-w-5xl mx-auto space-y-8 pb-16 text-slate-800 dark:text-slate-200">
      {/* Top Breadcrumb & Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Previews &amp; Analysis
          </button>
          <span className="text-slate-400">/</span>
          <span className="truncate max-w-[280px] sm:max-w-md text-slate-700 dark:text-zinc-300">
            {stripMarkdown(article.title)}
          </span>
        </div>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer shrink-0"
          title="Copy article link"
        >
          {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copiedLink ? 'Copied Link!' : 'Share'}</span>
        </button>
      </nav>

      {/* Article Header */}
      <header className="space-y-4">
        {/* Category & Badge */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-500/10 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300 border border-blue-500/20 whitespace-nowrap shrink-0">
            {article.articleType.replace('_', ' ')}
          </span>
          {modelCtx && (
            <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-xs border whitespace-nowrap shrink-0 ${
              modelCtx.pickType === 'OVER'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                : modelCtx.pickType === 'UNDER'
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25'
                : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25'
            }`}>
              MODEL {modelCtx.pickType} ({Math.abs(modelCtx.edgePoints) > 0 ? `+${Math.abs(modelCtx.edgePoints).toFixed(1)} PTS` : 'NEUTRAL'})
            </span>
          )}
          <span className="text-slate-400 dark:text-zinc-500">•</span>
          <span className="flex items-center gap-1 text-slate-500 dark:text-zinc-400 whitespace-nowrap shrink-0">
            <Clock className="w-3 h-3 text-cyan-400" />
            {article.readingTimeMinutes} min read
          </span>
          <span className="text-slate-400 dark:text-zinc-500">•</span>
          <span className="flex items-center gap-1 text-slate-500 dark:text-zinc-400 whitespace-nowrap shrink-0">
            <Calendar className="w-3 h-3 text-blue-500" />
            {article.publishedAt.slice(0, 10)}
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          {stripMarkdown(article.title)}
        </h1>

        {/* Subtitle / Excerpt */}
        <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-300 leading-relaxed font-normal">
          {stripMarkdown(article.summary)}
        </p>

        {/* Author / Quantitative Attribution */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              NT
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-zinc-200">{article.author.name}</span>
              <span className="block text-[11px] text-slate-400">Role: {article.author.role}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="hidden sm:inline">{article.sport === 'nhl' ? 'Verified 5-Season Poisson Calibration' : 'Verified 5-Season OLS Calibration'}</span>
            <span className="sm:hidden font-mono font-bold text-slate-300">{article.sport === 'nhl' ? '5-Yr Poisson' : '5-Yr OLS'}</span>
          </div>
        </div>
      </header>

      {/* Relatable Matchup & Action Hero Banner */}
      <ArticleImageBanner article={article} variant="detail" />

      {/* NHL Quantitative Poisson Model Box */}
      {article.nhlModelContext && (
        <section aria-label="NHL Poisson Model Projection" className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0a1124] to-indigo-950 text-white border border-indigo-500/30 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm sm:text-base font-black tracking-wide uppercase text-cyan-300">
                NHL Poisson Quantitative Model Box
              </h2>
            </div>
            <div className="text-[11px] text-indigo-200/70 font-mono">
              Formula: <span className="text-white font-bold">{article.nhlModelContext.formula || 'Bivariate Poisson (5-Yr) + Goalie GSAx/60'}</span>
            </div>
          </div>

          {/* Core Numbers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[11px] text-indigo-200/70 uppercase tracking-wider block font-semibold">
                Consensus Total
              </span>
              <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
                {article.nhlModelContext.sportsbookTotal.toFixed(1)}
              </div>
              <span className="text-[10px] text-indigo-300/60 block mt-0.5">DraftKings / Pinnacle</span>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[11px] text-cyan-300/80 uppercase tracking-wider block font-semibold">
                Poisson Expected (xG)
              </span>
              <div className="text-xl sm:text-2xl font-black text-cyan-300 mt-0.5">
                {article.nhlModelContext.modelProjectedTotal.toFixed(2)}
              </div>
              <span className="text-[10px] text-cyan-200/60 block mt-0.5">Bivariate Poisson (5-Yr)</span>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[11px] text-indigo-200/70 uppercase tracking-wider block font-semibold">
                Calculated Edge
              </span>
              <div className={`text-xl sm:text-2xl font-black mt-0.5 ${
                Math.abs(article.nhlModelContext.goalEdge) >= 0.35 ? 'text-emerald-400' : 'text-amber-300'
              }`}>
                {article.nhlModelContext.goalEdge > 0 ? `+${article.nhlModelContext.goalEdge.toFixed(2)}` : article.nhlModelContext.goalEdge.toFixed(2)} g
              </div>
              <span className="text-[10px] text-indigo-200/60 block mt-0.5">
                {article.nhlModelContext.confidenceScore}% confidence
              </span>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[11px] text-indigo-200/70 uppercase tracking-wider block font-semibold">
                Recommendation
              </span>
              <div className="mt-0.5">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-black ${
                  article.nhlModelContext.pickType === 'OVER'
                    ? 'bg-emerald-500 text-slate-950'
                    : article.nhlModelContext.pickType === 'UNDER'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-700 text-white'
                }`}>
                  {article.nhlModelContext.pickType === 'OVER' && <TrendingUp className="w-3.5 h-3.5" />}
                  {article.nhlModelContext.pickType === 'UNDER' && <TrendingDown className="w-3.5 h-3.5" />}
                  {article.nhlModelContext.pickType} {article.nhlModelContext.sportsbookTotal.toFixed(1)}
                </span>
              </div>
              <span className="text-[10px] text-indigo-200/60 block mt-1 truncate">
                Puckline: {article.nhlModelContext.puckline > 0 ? `+${article.nhlModelContext.puckline}` : article.nhlModelContext.puckline} ({article.nhlModelContext.pucklineHomeOdds || '-110'})
              </span>
            </div>
          </div>

          {/* Goalie Matchup Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase block">Away Starting Netminder</span>
                <span className="text-sm font-bold text-white">{article.nhlModelContext.awayGoalie.name}</span>
              </div>
              <div className="text-right font-mono text-xs">
                <span className="text-slate-300 block">SV%: <strong className="text-white">{(article.nhlModelContext.awayGoalie.savePct * 100).toFixed(1)}%</strong></span>
                <span className="text-cyan-400 text-[11px]">GSAx/60: {article.nhlModelContext.awayGoalie.gsax60 >= 0 ? `+${article.nhlModelContext.awayGoalie.gsax60.toFixed(2)}` : article.nhlModelContext.awayGoalie.gsax60.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase block">Home Starting Netminder</span>
                <span className="text-sm font-bold text-white">{article.nhlModelContext.homeGoalie.name}</span>
              </div>
              <div className="text-right font-mono text-xs">
                <span className="text-slate-300 block">SV%: <strong className="text-white">{(article.nhlModelContext.homeGoalie.savePct * 100).toFixed(1)}%</strong></span>
                <span className="text-cyan-400 text-[11px]">GSAx/60: {article.nhlModelContext.homeGoalie.gsax60 >= 0 ? `+${article.nhlModelContext.homeGoalie.gsax60.toFixed(2)}` : article.nhlModelContext.homeGoalie.gsax60.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Interactive CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleCtaClick('nhl-picks', 'Model Box - View Live Line', article.gameId)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Live Line on NHL Edge Board</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            <button
              onClick={() => handleCtaClick('nhl-analyzer', 'Model Box - NHL Matchup Analyzer')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition-all border border-white/15 flex items-center gap-1.5 cursor-pointer"
            >
              <BarChart3 className="w-3 h-3 text-cyan-300" />
              <span>Simulate Matchup in NHL Analyzer</span>
            </button>

            <button
              onClick={() => handleCtaClick('nhl-stats', 'Model Box - 5-Season NHL Study')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-200 border border-cyan-400/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Activity className="w-3 h-3 text-cyan-300" />
              <span>5-Season Poisson Study (6,115 Games)</span>
            </button>
          </div>
        </section>
      )}

      {/* Model Box: Quantitative Forecast Card (Featured prominently above fold) */}
      {!article.nhlModelContext && modelCtx && (
        <section aria-label="Quantitative Model Projection" className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0d1424] to-blue-950 text-white border border-blue-500/30 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm sm:text-base font-black tracking-wide uppercase text-cyan-300">
                NBATotals Quantitative Model Box
              </h2>
            </div>
            <div className="text-[11px] text-blue-200/70 font-mono">
              Formula: <span className="text-white font-bold">{modelCtx.formula}</span>
            </div>
          </div>

          {/* Core Numbers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[11px] text-blue-200/70 uppercase tracking-wider block font-semibold">
                Consensus Total
              </span>
              <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
                {modelCtx.marketLine.toFixed(1)}
              </div>
              <span className="text-[10px] text-blue-300/60 block mt-0.5">DraftKings / FanDuel</span>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[11px] text-cyan-300/80 uppercase tracking-wider block font-semibold">
                Model Prediction
              </span>
              <div className="text-xl sm:text-2xl font-black text-cyan-300 mt-0.5">
                {modelCtx.projectedTotal.toFixed(1)}
              </div>
              <span className="text-[10px] text-cyan-200/60 block mt-0.5">OLS Regression (5-Yr)</span>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[11px] text-blue-200/70 uppercase tracking-wider block font-semibold">
                Calculated Edge
              </span>
              <div className={`text-xl sm:text-2xl font-black mt-0.5 ${
                Math.abs(modelCtx.edgePoints) >= 3.0 ? 'text-emerald-400' : 'text-amber-300'
              }`}>
                {Math.abs(modelCtx.edgePoints) > 0 ? `+${Math.abs(modelCtx.edgePoints).toFixed(1)}` : '0.0'} pts
              </div>
              <span className="text-[10px] text-blue-200/60 block mt-0.5">
                {modelCtx.confidenceScore}% confidence
              </span>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[11px] text-blue-200/70 uppercase tracking-wider block font-semibold">
                Recommendation
              </span>
              <div className="mt-0.5">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-black ${
                  modelCtx.pickType === 'OVER'
                    ? 'bg-emerald-500 text-slate-950'
                    : modelCtx.pickType === 'UNDER'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-700 text-white'
                }`}>
                  {modelCtx.pickType === 'OVER' && <TrendingUp className="w-3.5 h-3.5" />}
                  {modelCtx.pickType === 'UNDER' && <TrendingDown className="w-3.5 h-3.5" />}
                  {modelCtx.pickType} {modelCtx.marketLine.toFixed(1)}
                </span>
              </div>
              <span className="text-[10px] text-blue-200/60 block mt-1">
                Pace Floor Prob: {modelCtx.paceFloorProbability}%
              </span>
            </div>
          </div>

          {/* Interactive CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleCtaClick('picks', 'Model Box - View Live Line', article.gameId)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Live Line on Picks Board</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            <button
              onClick={() => handleCtaClick('analyzer', 'Model Box - Matchup Analyzer')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition-all border border-white/15 flex items-center gap-1.5 cursor-pointer"
            >
              <BarChart3 className="w-3 h-3 text-cyan-300" />
              <span>Simulate Matchup in Analyzer</span>
            </button>

            {article.playerSpotlights && article.playerSpotlights.length > 0 && (
              <button
                onClick={() => handleCtaClick('player-props', 'Model Box - Player Props Scanner')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-400/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Users className="w-3 h-3 text-purple-300" />
                <span>Shop Player Props ({article.playerSpotlights.length} Spotlighted)</span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* Main Content Layout with Sticky Table of Contents Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Semantic Article Body */}
        <div className="lg:col-span-8 space-y-8 leading-relaxed">
          {article.sections.map((section, idx) => (
            <section
              key={section.id}
              id={`section-${section.id}`}
              className="scroll-mt-24 space-y-4"
            >
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <span className="text-blue-600 dark:text-cyan-400 font-mono text-base font-normal">0{idx + 1}.</span>
                <span>{stripMarkdown(section.heading)}</span>
              </h2>

              <ArticleContentRenderer
                content={section.content}
                onNavigateTab={onNavigateTab}
              />

              {/* Callout Box if present */}
              {section.callout && (
                <div className={`p-4 sm:p-5 rounded-2xl border text-xs sm:text-sm my-4 shadow-xs ${
                  section.callout.type === 'STAT'
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-950 dark:text-blue-200'
                    : section.callout.type === 'WARNING'
                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-200'
                    : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200'
                }`}>
                  <div className="font-bold flex items-center gap-1.5 mb-1.5 text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>{stripMarkdown(section.callout.title)}</span>
                  </div>
                  <ArticleContentRenderer
                    content={section.callout.content}
                    onNavigateTab={onNavigateTab}
                    className="text-xs sm:text-sm !space-y-1.5 !leading-relaxed"
                  />
                </div>
              )}
            </section>
          ))}

          {/* Player Spotlights Section (Props Integration) */}
          {article.playerSpotlights && article.playerSpotlights.length > 0 && (
            <section id="section-player-props" className="scroll-mt-24 space-y-4 pt-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span>Key Player Props &amp; Scoring Outlines</span>
                </h2>
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                  {article.playerSpotlights.length} Analyzed
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {article.playerSpotlights.map((player) => {
                  const isOver = player.recommendation?.includes('OVER');
                  const lineText = player.pointsLine !== null ? `${player.pointsLine.toFixed(1)} PTS` : 'OFF MARKET';
                  return (
                    <div
                      key={player.playerName}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121827] shadow-xs space-y-2 hover:border-purple-400 dark:hover:border-purple-600 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {stripMarkdown(player.playerName)}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-zinc-400">
                            {player.team} • {player.position} ({player.role})
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                          isOver
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        }`}>
                          {player.recommendation || 'ANALYZE'} {lineText}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs py-1.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block">Line</span>
                          <span className="font-bold text-slate-800 dark:text-zinc-200">
                            {player.pointsLine !== null ? player.pointsLine.toFixed(1) : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block">Projected</span>
                          <span className="font-bold text-blue-600 dark:text-cyan-400">{player.projectedPoints.toFixed(1)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block">Edge</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {player.edge ? (player.edge > 0 ? `+${player.edge.toFixed(1)}` : player.edge.toFixed(1)) : '0.0'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                        {stripMarkdown(player.analysis)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Player Props Link CTA */}
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-purple-950 dark:text-purple-200">
                  <strong>Need full roster props?</strong> View starters, bench rotations, and injury adjustments for every scheduled game.
                </div>
                <button
                  onClick={() => handleCtaClick('player-props', 'Player Spotlight Section CTA')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shrink-0 cursor-pointer shadow-xs"
                >
                  Open Full Props Scanner
                </button>
              </div>
            </section>
          )}

          {/* FAQ Accordion Section (Rich Snippet Google Optimized) */}
          {article.faq && article.faq.length > 0 && (
            <section id="section-faq" className="scroll-mt-24 space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Frequently Asked Questions
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Direct answers regarding betting odds, model forecasts, and pace calculations for this matchup.
              </p>

              <div className="space-y-2 pt-2">
                {article.faq.map((faqItem, idx) => {
                  const isOpen = openFaqIndices.includes(idx);
                  return (
                    <div
                      key={faqItem.question}
                      className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#0f1422] transition-colors"
                    >
                      <button
                        onClick={() => toggleFaq(idx)}
                        className="w-full px-4 py-3 text-left font-semibold text-xs sm:text-sm text-slate-800 dark:text-zinc-200 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                      >
                        <span>{stripMarkdown(faqItem.question)}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-3.5 text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
                          <ArticleContentRenderer
                            content={faqItem.answer}
                            onNavigateTab={onNavigateTab}
                            className="text-xs sm:text-sm !space-y-1.5 !leading-relaxed"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Keywords & Semantic Meta Footer */}
          <footer className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-500 dark:text-zinc-400 mr-1">Search Keywords:</span>
              {allKeywords.map((kw) => (
                <span
                  key={kw}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-zinc-300 text-[11px]"
                >
                  #{kw}
                </span>
              ))}
            </div>

            {/* Disclaimer & Model Integrity */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
              <strong>Sports Analytics Disclaimer:</strong> All model projections, {article.sport === 'nhl' ? 'expected goal (xG) calculations' : 'pace calculations'}, and edges presented by {article.sport === 'nhl' ? 'NHLTotals.com' : 'NBATotals.com'} are quantitative estimates calibrated across {article.sport === 'nhl' ? '6,115 completed NHL games (2020–2025)' : '6,000 completed NBA games (2020–2025)'}. We do not guarantee wagering outcomes. Always practice responsible bankroll management and shop for the best available lines across regulated sportsbooks.
            </div>
          </footer>
        </div>

        {/* Right Column: Sticky Table of Contents & Quick Action Tools */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* Table of Contents */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1422] shadow-xs space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              <span>Table of Contents</span>
            </div>

            <nav className="space-y-1 text-xs">
              {article.sections.map((s, idx) => (
                <a
                  key={s.id}
                  href={`#section-${s.id}`}
                  className={`block px-2.5 py-1.5 rounded-lg transition-colors truncate ${
                    activeSectionId === `section-${s.id}`
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {idx + 1}. {stripMarkdown(s.heading)}
                </a>
              ))}
              {article.playerSpotlights && article.playerSpotlights.length > 0 && (
                <a
                  href="#section-player-props"
                  className="block px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  Player Props Breakdown
                </a>
              )}
              {article.faq && article.faq.length > 0 && (
                <a
                  href="#section-faq"
                  className="block px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  Frequently Asked Questions
                </a>
              )}
            </nav>
          </div>

          {/* Quick Tools Jump Card */}
          <div className="p-4 rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-50/60 to-indigo-50/60 dark:from-blue-950/30 dark:to-indigo-950/30 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
              Interactive Tools
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-normal">
              {article.sport === 'nhl'
                ? 'Compare this matchup with our 6,115-game empirical Poisson database and analyze goal edges in real time.'
                : 'Compare this matchup with our 6,000-game empirical database and adjust pace assumptions in real time.'}
            </p>
            <div className="space-y-2 pt-1">
              {article.sport === 'nhl' ? (
                <>
                  <button
                    onClick={() => handleCtaClick('nhl-picks', 'Sidebar - NHL Picks', article.gameId)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer"
                  >
                    <span>NHL Edge Board</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleCtaClick('nhl-analyzer', 'Sidebar - NHL Analyzer')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer"
                  >
                    <span>NHL Matchup Analyzer</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleCtaClick('nhl-stats', 'Sidebar - NHL Stats')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer"
                  >
                    <span>5-Season Poisson Study</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleCtaClick('academy', 'Sidebar - Strategy Academy')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer"
                  >
                    <span>Strategy Academy</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleCtaClick('picks', 'Sidebar - Picks Board', article.gameId)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer"
                  >
                    <span>Live Picks Board</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleCtaClick('analyzer', 'Sidebar - Matchup Analyzer')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer"
                  >
                    <span>Matchup Analyzer</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleCtaClick('player-props', 'Sidebar - Player Props')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer"
                  >
                    <span>Player Props Scanner</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleCtaClick('academy', 'Sidebar - Strategy Academy')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer"
                  >
                    <span>Rule of 47 Academy</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Related Articles & Educational Reads */}
          {relatedArticles.length > 0 && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1422] shadow-xs space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                Related Analyses &amp; Guides
              </div>

              <div className="space-y-3">
                {relatedArticles.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectArticle(rel)}
                    className="group cursor-pointer space-y-1 block"
                  >
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                      {rel.articleType.replace('_', ' ')}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {stripMarkdown(rel.title)}
                    </h4>
                    <span className="text-[10px] text-slate-400 block">
                      {rel.readingTimeMinutes} min read • {rel.publishedAt.slice(0, 10)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
};
