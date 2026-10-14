import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Search,
  ExternalLink,
  Sparkles,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Key,
  ShieldAlert,
  ArrowUpRight,
  Filter,
  Eye,
  MousePointerClick,
  Compass,
  FileText,
  Clock,
  Layers,
  HelpCircle,
  Calendar,
} from 'lucide-react';
import type { NBAArticle, ContentStatus, ArticleType, KeywordOpportunity } from '../../types/content';
import { nbaContentEngine } from '../../services/nbaContentEngine';
import { analytics } from '../../utils/analytics';
import { stripMarkdown } from './ArticleContentRenderer';

interface ContentPerformanceTabProps {
  onSelectArticle: (article: NBAArticle) => void;
  onNavigateTab: (tab: string, gameId?: string) => void;
}

export const ContentPerformanceTab: React.FC<ContentPerformanceTabProps> = ({
  onSelectArticle,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ContentStatus | 'ALL'>('ALL');
  const [selectedType, setSelectedType] = useState<ArticleType | 'ALL'>('ALL');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [refreshedSlugs, setRefreshedSlugs] = useState<Set<string>>(new Set());

  const articles = useMemo(() => {
    return nbaContentEngine.getAllArticles();
  }, []);

  const overview = useMemo(() => {
    return nbaContentEngine.getContentOverview();
  }, [articles]);

  const keywordOpportunities = useMemo(() => {
    return nbaContentEngine.getKeywordOpportunities();
  }, []);

  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const matchesSearch =
        art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        art.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        art.primaryKeyword.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatus === 'ALL' || art.status === selectedStatus;
      const matchesType = selectedType === 'ALL' || art.articleType === selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [articles, searchTerm, selectedStatus, selectedType]);

  const needsRefreshList = useMemo(() => {
    return articles.filter(
      (a) => a.status === 'NEEDS_REFRESH' || (a.modelContext?.edgePoints && Math.abs(a.modelContext.edgePoints) > 4.5)
    );
  }, [articles]);

  const handleCopyUrl = async (slug: string) => {
    const url = `https://nbatotals.com/previews/${slug}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  const handleRefreshArticle = (art: NBAArticle) => {
    setRefreshedSlugs((prev) => new Set(prev).add(art.slug));
    analytics.trackFeatureUse('refresh_article_content', { slug: art.slug });
  };

  return (
    <div className="space-y-8 pb-16 text-slate-800 dark:text-slate-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              NBA Content Performance &amp; Technical SEO Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300 border border-emerald-500/20">
              GA4 CONNECTED
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 max-w-3xl">
            Monitor organic impressions, search rankings, reader engagement, and internal conversion into picks and prop tools. All daily content is systematically generated from verified OLS regression forecasts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab('previews')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Open Previews Hub</span>
          </button>
        </div>
      </div>

      {/* Section 1: Executive KPI Metrics Grid */}
      <section aria-label="Executive SEO Metrics" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1422] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Published</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {overview.totalArticles}
          </div>
          <span className="text-[10px] text-slate-400 block">
            {overview.dailyPreviews} daily • {overview.guidesAndStudies} evergreen
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1422] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Organic Impressions</span>
            <Eye className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {overview.totalImpressions.toLocaleString()}
          </div>
          <span className="text-[10px] text-indigo-500/80 block font-mono">
            Across 5 Core Seed Topics
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1422] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Organic Search Clicks</span>
            <MousePointerClick className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {overview.totalOrganicClicks.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-500/80 block font-mono">
            Avg CTR: {overview.avgCtr.toFixed(2)}%
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1422] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Article Pageviews</span>
            <Layers className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
            {overview.totalViews.toLocaleString()}
          </div>
          <span className="text-[10px] text-cyan-500/80 block">
            GA4 trackArticleView
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1422] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Internal Tool Clicks</span>
            <ArrowUpRight className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {overview.totalCtaClicks.toLocaleString()}
          </div>
          <span className="text-[10px] text-amber-500/80 block font-mono">
            Picks &amp; Props CTAs
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1422] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Content Conversion</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {overview.internalConversionRate.toFixed(1)}%
          </div>
          <span className="text-[10px] text-purple-500/80 block">
            Articles to Tools Funnel
          </span>
        </div>
      </section>

      {/* Section 2: Google Search Console API Status & Transparent Onboarding */}
      <section aria-label="Search Console Status" className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-[#101728] to-slate-900 text-white border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">
              Google Search Console (GSC) Integration &amp; Crawl Status
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
              PENDING GSC SERVICE ACCOUNT
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>XML Sitemap Status</span>
            </div>
            <p className="text-zinc-300 leading-normal">
              Sitemap available at <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">/sitemap.xml</code>. Contains canonical URLs for all previews, models, guides, and tools.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Schema.org JSON-LD</span>
            </div>
            <p className="text-zinc-300 leading-normal">
              Every article injects dynamic <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">NewsArticle</code>, <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">SportsEvent</code>, and <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">FAQPage</code> rich snippets into the DOM head.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="font-semibold text-amber-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>External GSC API Sync</span>
            </div>
            <p className="text-zinc-300 leading-normal">
              Metrics shown are verified baseline projections and client-side GA4 sessions. To sync real-time GSC impression tables, provide Google Cloud service credentials in Vercel environment.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Content Refresh Alerts (if any need review) */}
      {needsRefreshList.length > 0 && (
        <section aria-label="Content Refresh Alerts" className="p-4 rounded-xl border border-amber-300/40 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Content Freshness Alerts: High Edge / Line Drift ({needsRefreshList.length})</span>
            </div>
            <span className="text-[11px] text-amber-700 dark:text-amber-300">
              Recommended for pre-game review
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {needsRefreshList.map((art) => (
              <div
                key={art.slug}
                className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-white dark:bg-[#111726] text-xs space-y-1.5"
              >
                <div className="font-bold text-slate-900 dark:text-white truncate">
                  {stripMarkdown(art.title)}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                  <span>Edge: <strong className="text-amber-600 dark:text-amber-400">{art.modelContext?.edgePoints ? Math.abs(art.modelContext.edgePoints).toFixed(1) : '0.0'} pts</strong></span>
                  <span>Line: {art.modelContext?.marketLine}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onSelectArticle(art)}
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-zinc-200 cursor-pointer"
                  >
                    Inspect
                  </button>
                  <button
                    onClick={() => handleRefreshArticle(art)}
                    className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{refreshedSlugs.has(art.slug) ? 'Refreshed!' : 'Mark Updated'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 4: Article Catalog Management Table */}
      <section aria-label="Article Catalog" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>NBA Content Catalog &amp; SEO Performance</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {filteredArticles.length} of {articles.length} articles matching active filters.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search keywords or titles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-[#141b2b] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-52 sm:w-64"
              />
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-[#141b2b] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Content Types</option>
              <option value="DAILY_PREVIEW">Daily Previews</option>
              <option value="PLAYER_ANALYSIS">Player Analysis</option>
              <option value="HISTORICAL_STUDY">Historical Studies</option>
              <option value="EVERGREEN_GUIDE">Evergreen Guides</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-[#141b2b] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="NEEDS_REFRESH">Needs Refresh</option>
            </select>
          </div>
        </div>

        {/* Catalog Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#0f1422] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Article &amp; URL Slug</th>
                  <th className="py-3 px-3">Type / Status</th>
                  <th className="py-3 px-3">Primary Keyword &amp; Intent</th>
                  <th className="py-3 px-3 text-right">Pageviews</th>
                  <th className="py-3 px-3 text-right">Organic Clicks (CTR)</th>
                  <th className="py-3 px-3 text-right">Tool CTAs</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredArticles.map((art) => {
                  const ctr = art.performance.organicImpressions > 0
                    ? ((art.performance.organicClicks / art.performance.organicImpressions) * 100).toFixed(1)
                    : '0.0';

                  const totalCtas = (art.performance.ctaToPicksClicks || 0) + (art.performance.ctaToPropsClicks || 0);

                  return (
                    <tr
                      key={art.slug}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Title & Slug */}
                      <td className="py-3 px-4 max-w-xs">
                        <button
                          onClick={() => onSelectArticle(art)}
                          className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left line-clamp-1 cursor-pointer block"
                        >
                          {stripMarkdown(art.title)}
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono truncate block mt-0.5">
                          /previews/{art.slug}
                        </span>
                      </td>

                      {/* Type / Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                            {art.articleType.replace('_', ' ')}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            art.status === 'PUBLISHED'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            {art.status}
                          </span>
                        </div>
                      </td>

                      {/* Keyword & Intent */}
                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="font-semibold text-slate-800 dark:text-zinc-200 truncate">
                          &quot;{art.primaryKeyword}&quot;
                        </div>
                        <span className="text-[10px] text-slate-400 line-clamp-1">
                          {art.searchIntent}
                        </span>
                      </td>

                      {/* Pageviews */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {art.performance.pageViews.toLocaleString()}
                      </td>

                      {/* Organic Clicks & CTR */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {art.performance.organicClicks.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {ctr}% CTR ({art.performance.organicImpressions.toLocaleString()} imp)
                        </span>
                      </td>

                      {/* Tool CTAs */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono">
                        <span className="font-bold text-blue-600 dark:text-cyan-400">
                          {totalCtas}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {art.performance.ctaToPicksClicks} picks • {art.performance.ctaToPropsClicks} props
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSelectArticle(art)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer"
                            title="Read Article"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCopyUrl(art.slug)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer"
                            title="Copy Live URL"
                          >
                            {copiedSlug === art.slug ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <ExternalLink className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {art.gameId && (
                            <button
                              onClick={() => onNavigateTab('picks', art.gameId)}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                              title="Jump to Game on Picks Board"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 5: Keyword Opportunity & Content Strategy Backlog */}
      <section aria-label="Keyword Opportunity Backlog" className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-500" />
            <span>High-Intent Keyword Opportunity Backlog</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Target search queries identified with high organic search volume and strong alignment with our quantitative OLS models and pace data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {keywordOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1422] shadow-xs space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white text-xs font-mono">
                  &quot;{opp.keyword}&quot;
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300 shrink-0">
                  {opp.searchDemandLevel}
                </span>
              </div>

              <div className="text-xs text-slate-600 dark:text-zinc-400 space-y-1">
                <div>
                  <strong className="text-slate-800 dark:text-zinc-200">Intent:</strong> {opp.intent}
                </div>
                <div>
                  <strong className="text-slate-800 dark:text-zinc-200">Data Edge:</strong> {opp.dataAdvantage}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400 font-semibold">{opp.priority} PRIORITY</span>
                <button
                  onClick={() => onNavigateTab('previews')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 cursor-pointer transition-colors"
                >
                  {opp.action}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
