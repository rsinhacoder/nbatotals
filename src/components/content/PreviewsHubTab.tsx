import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Search,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  Sparkles,
  BarChart3,
  BookOpen,
  Users,
  CheckCircle2,
  Share2,
  ExternalLink,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import type { NBAArticle, ArticleType } from '../../types/content';
import { nbaContentEngine } from '../../services/nbaContentEngine';
import { analytics } from '../../utils/analytics';
import { updateSEOHead } from '../../utils/seoHead';
import { nbaDateService } from '../../utils/nbaDateService';
import { stripMarkdown } from './ArticleContentRenderer';
import { ArticleImageBanner } from './ArticleImageBanner';

interface PreviewsHubTabProps {
  onSelectArticle: (article: NBAArticle) => void;
  onNavigateTab: (tab: string, gameId?: string) => void;
  upcomingMatches?: any[];
}

export const PreviewsHubTab: React.FC<PreviewsHubTabProps> = ({
  onSelectArticle,
  onNavigateTab,
  upcomingMatches = [],
}) => {
  const [selectedType, setSelectedType] = useState<ArticleType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Synchronize slate previews with upcoming matches if available
  useEffect(() => {
    if (upcomingMatches.length > 0) {
      nbaContentEngine.generatePreviewsForSlate(upcomingMatches);
    }
  }, [upcomingMatches]);

  const allArticles = useMemo(() => {
    return nbaContentEngine.getAllArticles();
  }, [upcomingMatches]);

  // Set Page SEO & Analytics on mount
  useEffect(() => {
    updateSEOHead({
      title: 'NBA Game Previews, Over/Under Predictions & Statistical Analysis — NBATotals.com',
      description: 'Data-backed NBA game previews, team pace breakdowns, and player scoring projections. Every preview combines 5-season OLS regression with consensus lines.',
      canonicalUrl: 'https://nbatotals.com/?tab=previews',
      breadcrumbs: [
        { name: 'Home', url: '/' },
        { name: 'NBA Previews & Analysis', url: '/?tab=previews' },
      ],
    });
    analytics.trackPageView('/?tab=previews', 'NBA Previews & Analysis Hub', 'content_hub');
  }, []);

  const filteredArticles = useMemo(() => {
    return allArticles.filter((article) => {
      if (selectedType !== 'ALL' && article.articleType !== selectedType) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = article.title.toLowerCase().includes(term);
        const matchesSummary = article.summary.toLowerCase().includes(term);
        const matchesKeyword = article.primaryKeyword.toLowerCase().includes(term);
        const matchesTeam =
          (article.awayTeam && article.awayTeam.toLowerCase().includes(term)) ||
          (article.homeTeam && article.homeTeam.toLowerCase().includes(term));
        if (!matchesTitle && !matchesSummary && !matchesKeyword && !matchesTeam) {
          return false;
        }
      }
      return true;
    });
  }, [allArticles, selectedType, searchTerm]);

  // Daily previews vs Evergreen/Study articles
  const dailyPreviews = useMemo(() => {
    return filteredArticles.filter((a) => a.articleType === 'DAILY_PREVIEW');
  }, [filteredArticles]);

  const editorialGuides = useMemo(() => {
    return filteredArticles.filter((a) => a.articleType !== 'DAILY_PREVIEW');
  }, [filteredArticles]);

  // Featured article is either the latest preview or the top evergreen guide
  const featuredArticle = useMemo(() => {
    return dailyPreviews[0] || editorialGuides[0] || allArticles[0];
  }, [dailyPreviews, editorialGuides, allArticles]);

  const handleShare = (article: NBAArticle, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/?tab=preview&slug=${article.slug}`;
    if (navigator.share) {
      navigator
        .share({
          title: article.title,
          text: article.metaDescription,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedSlug(article.slug);
        setTimeout(() => setCopiedSlug(null), 2500);
      });
    }
    analytics.trackShare('page', article.title, 'web_share');
  };

  const getTypeBadge = (type: ArticleType) => {
    switch (type) {
      case 'DAILY_PREVIEW':
        return {
          label: 'Game Preview',
          color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        };
      case 'PLAYER_ANALYSIS':
        return {
          label: 'Player Props Analysis',
          color: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        };
      case 'STATISTICAL_STUDY':
        return {
          label: 'Statistical Study',
          color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        };
      case 'EVERGREEN_GUIDE':
        return {
          label: 'Strategy Guide',
          color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        };
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. Header Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d1527] to-[#070b14] border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quantitative NBA Editorial &amp; Matchup Previews</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Original, Data-Backed NBA Previews &amp; Statistical Analyses
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Every preview is mathematically grounded in our 5-season Ordinary Least Squares regression model
            (N=6,000 games), evaluating team pace floors, lowest scoring quarter boundaries, and individual player point projections.
          </p>

          {/* Quick Cross-Navigation Links */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('picks')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            >
              <span>Live Picks Board</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <button
              onClick={() => onNavigateTab('player-props')}
              className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-bold text-xs border border-slate-700 flex items-center gap-2 transition cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Full Roster Player Props</span>
            </button>
            <button
              onClick={() => onNavigateTab('academy')}
              className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-bold text-xs border border-slate-700 flex items-center gap-2 transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Rule of 47 Academy</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Controls & Search Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search teams, players, topics, or models..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Content' },
            { id: 'DAILY_PREVIEW', label: 'Game Previews' },
            { id: 'PLAYER_ANALYSIS', label: 'Player Props' },
            { id: 'STATISTICAL_STUDY', label: 'Statistical Studies' },
            { id: 'EVERGREEN_GUIDE', label: 'Strategy Guides' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setSelectedType(pill.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                selectedType === pill.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Featured Spotlight Preview */}
      {featuredArticle && !searchTerm && selectedType === 'ALL' && (
        <div
          onClick={() => onSelectArticle(featuredArticle)}
          className="group relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-md hover:shadow-xl hover:border-blue-500/50 transition-all cursor-pointer flex flex-col lg:flex-row items-stretch"
        >
          {/* Featured Image */}
          <div className="lg:w-1/2 relative min-h-[260px] overflow-hidden bg-slate-900">
            <img
              src={featuredArticle.featuredImage}
              alt={featuredArticle.featuredImageAlt}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute top-4 left-4">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide border uppercase ${getTypeBadge(featuredArticle.articleType).color}`}>
                Featured Analysis
              </span>
            </div>
            {featuredArticle.modelContext && (
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Model Projection</div>
                  <div className="text-sm font-black text-white">
                    {featuredArticle.modelContext.projectedTotal.toFixed(1)} Pts vs {featuredArticle.modelContext.marketLine} Line
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-black ${
                  featuredArticle.modelContext.pickType === 'UNDER'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {featuredArticle.modelContext.pickType} EDGE ({Math.abs(featuredArticle.modelContext.edgePoints).toFixed(1)} PTS)
                </span>
              </div>
            )}
          </div>

          {/* Featured Details */}
          <div className="lg:w-1/2 p-6 sm:p-8 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {nbaDateService.formatScheduleDateLabel(featuredArticle.publishedAt.slice(0, 10))}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {featuredArticle.readingTimeMinutes} min read
                </span>
                <span>•</span>
                <span>{featuredArticle.wordCount} words</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white group-hover:text-blue-500 transition leading-snug">
                {stripMarkdown(featuredArticle.title)}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                {stripMarkdown(featuredArticle.summary)}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-black text-xs">
                  NT
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {featuredArticle.author.name}
                </span>
              </div>

              <span className="text-xs font-bold text-blue-500 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                <span>Read Full Article</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Daily Game Previews Grid */}
      {(selectedType === 'ALL' || selectedType === 'DAILY_PREVIEW') && dailyPreviews.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Today's Scheduled NBA Game Previews ({dailyPreviews.length})
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Grounded in 5-Season OLS Regression
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {dailyPreviews.map((preview) => {
              const isUnder = preview.modelContext?.pickType === 'UNDER';
              return (
                <article
                  key={preview.id}
                  onClick={() => onSelectArticle(preview)}
                  className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] overflow-hidden shadow-sm hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer flex flex-col justify-between"
                >
                  {/* Relatable Matchup Image Banner with Authentic Team Logos */}
                  <ArticleImageBanner article={preview} variant="card" />

                  <div className="p-5 space-y-3">
                    {/* Title */}
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-blue-500 transition line-clamp-2 leading-snug">
                      {stripMarkdown(preview.title)}
                    </h3>

                    {/* Model Context Mini Box */}
                    {preview.modelContext && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121b2d] border border-slate-100 dark:border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-500">Market Consensus:</span>
                          <span className="font-black text-slate-900 dark:text-white">
                            {preview.modelContext.marketLine} Pts
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-500">Model Projection:</span>
                          <span className="font-black text-blue-500">
                            {preview.modelContext.projectedTotal.toFixed(1)} Pts
                          </span>
                        </div>
                        <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">Model Edge:</span>
                          <span className={`font-black ${isUnder ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {preview.modelContext.pickType} ({Math.abs(preview.modelContext.edgePoints).toFixed(1)} pts)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {stripMarkdown(preview.summary)}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">
                      {preview.gameTime || 'Scheduled'}
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => handleShare(preview, e)}
                        className="p-1 rounded text-slate-400 hover:text-slate-200 transition cursor-pointer"
                        title="Share preview link"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-blue-500 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Read</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Editorial & Evergreen Strategy Shelf */}
      {(selectedType === 'ALL' || selectedType !== 'DAILY_PREVIEW') && editorialGuides.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Statistical Research Studies &amp; Strategy Guides ({editorialGuides.length})
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Long-Term Methodologies
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {editorialGuides.map((guide) => {
              return (
                <article
                  key={guide.id}
                  onClick={() => onSelectArticle(guide)}
                  className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] overflow-hidden shadow-sm hover:shadow-lg hover:border-purple-500/40 transition-all cursor-pointer flex flex-col justify-between"
                >
                  {/* Relatable Image Banner */}
                  <ArticleImageBanner article={guide} variant="card" />

                  <div className="p-5 space-y-3">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-purple-400 transition line-clamp-2 leading-snug">
                      {stripMarkdown(guide.title)}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {stripMarkdown(guide.summary)}
                    </p>
                  </div>

                  <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">
                      {guide.wordCount} words
                    </span>

                    <span className="text-xs font-bold text-purple-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Explore</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Empty State */}
      {filteredArticles.length === 0 && (
        <div className="py-16 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] space-y-3">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No matching articles or previews found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or reset the filter pill above to view all published editorial content.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedType('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
