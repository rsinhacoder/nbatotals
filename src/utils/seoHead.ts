/**
 * SEO Head & Structured Data Management Utility
 * Dynamically updates document title, meta tags, Open Graph, and Schema.org JSON-LD in the DOM.
 */

import type { NBAArticle } from '../types/content';

export function updateSEOHead(options: {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  article?: NBAArticle;
  breadcrumbs?: Array<{ name: string; url: string }>;
}): void {
  if (typeof document === 'undefined') return;

  // 1. Title tag
  document.title = options.title;

  // 2. Helper to set or create meta tag
  const setMeta = (name: string, content: string, isProperty: boolean = false) => {
    const attr = isProperty ? 'property' : 'name';
    let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // 3. Primary Meta Tags
  setMeta('description', options.description);
  setMeta('title', options.title);

  // 4. Canonical Link
  let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', options.canonicalUrl);

  // 5. Open Graph Meta Tags
  const image = options.ogImage || 'https://nbatotals.com/favicon.svg';
  const type = options.ogType || (options.article ? 'article' : 'website');

  setMeta('og:title', options.title, true);
  setMeta('og:description', options.description, true);
  setMeta('og:url', options.canonicalUrl, true);
  setMeta('og:image', image, true);
  setMeta('og:type', type, true);
  setMeta('og:site_name', 'NBA Totals', true);

  if (options.publishedTime) {
    setMeta('article:published_time', options.publishedTime, true);
  }
  if (options.modifiedTime) {
    setMeta('article:modified_time', options.modifiedTime, true);
  }

  // 6. Twitter Meta Tags
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', options.title);
  setMeta('twitter:description', options.description);
  setMeta('twitter:image', image);
  setMeta('twitter:url', options.canonicalUrl);

  // 7. Dynamic JSON-LD Structured Data
  updateArticleJsonLd(options.article);
  updateBreadcrumbsJsonLd(options.breadcrumbs);
}

/**
 * Injects or updates Schema.org NewsArticle & SportsEvent JSON-LD
 */
function updateArticleJsonLd(article?: NBAArticle): void {
  const SCRIPT_ID = 'seo-article-jsonld';
  let scriptEl = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

  if (!article) {
    if (scriptEl) scriptEl.remove();
    return;
  }

  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = SCRIPT_ID;
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }

  const schemas: any[] = [];

  // NewsArticle / BlogPosting Schema
  const articleSchema: any = {
    '@context': 'https://schema.org',
    '@type': article.articleType === 'DAILY_PREVIEW' ? 'NewsArticle' : 'BlogPosting',
    headline: article.title,
    description: article.metaDescription,
    image: [article.featuredImage || 'https://nbatotals.com/favicon.svg'],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.canonicalUrl,
    },
    author: {
      '@type': 'Organization',
      name: article.author.name,
      url: 'https://nbatotals.com/',
    },
    publisher: {
      '@type': 'Organization',
      name: 'NBA Totals',
      url: 'https://nbatotals.com/',
      logo: {
        '@type': 'ImageObject',
        url: 'https://nbatotals.com/favicon.svg',
      },
    },
    keywords: [article.primaryKeyword, ...article.secondaryKeywords].join(', '),
  };
  schemas.push(articleSchema);

  // SportsEvent Schema for Game Previews
  if (article.articleType === 'DAILY_PREVIEW' && article.awayTeam && article.homeTeam && article.gameDate) {
    const sportsEventSchema: any = {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: `${article.awayTeam} vs ${article.homeTeam}`,
      startDate: article.gameDate,
      sport: 'Basketball',
      competitor: [
        {
          '@type': 'SportsTeam',
          name: article.awayTeam,
        },
        {
          '@type': 'SportsTeam',
          name: article.homeTeam,
        },
      ],
      location: {
        '@type': 'Place',
        name: article.venue || `${article.homeTeam} Arena`,
      },
    };
    schemas.push(sportsEventSchema);
  }

  // FAQPage Schema if FAQs exist
  if (article.faq && article.faq.length > 0) {
    const faqSchema: any = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: article.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };
    schemas.push(faqSchema);
  }

  scriptEl.textContent = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);
}

/**
 * Injects or updates Schema.org BreadcrumbList JSON-LD
 */
function updateBreadcrumbsJsonLd(breadcrumbs?: Array<{ name: string; url: string }>): void {
  const SCRIPT_ID = 'seo-breadcrumbs-jsonld';
  let scriptEl = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

  if (!breadcrumbs || breadcrumbs.length === 0) {
    if (scriptEl) scriptEl.remove();
    return;
  }

  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = SCRIPT_ID;
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: crumb.name,
      item: crumb.url.startsWith('http') ? crumb.url : `https://nbatotals.com${crumb.url}`,
    })),
  };

  scriptEl.textContent = JSON.stringify(breadcrumbSchema);
}

/**
 * Resets dynamic JSON-LD scripts and restores default head state
 */
export function resetSEOHeadToDefault(): void {
  if (typeof document === 'undefined') return;

  const articleScript = document.getElementById('seo-article-jsonld');
  if (articleScript) articleScript.remove();

  const breadcrumbsScript = document.getElementById('seo-breadcrumbs-jsonld');
  if (breadcrumbsScript) breadcrumbsScript.remove();
}
