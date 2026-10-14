import React from 'react';
import { ExternalLink, Sparkles, ChevronRight, Calculator, Quote } from 'lucide-react';

interface ArticleContentRendererProps {
  content: string;
  onNavigateTab?: (tab: string, gameId?: string) => void;
  className?: string;
}

/**
 * Strips all markdown asterisks and formatting from plain strings (for titles, excerpts, meta)
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\*+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\$\$?[^$]+\$\$?/g, '')
    .trim();
}

/**
 * Clean LaTeX math symbols into crisp Unicode typography
 */
function cleanLatexMath(raw: string): string {
  return raw
    .replace(/\\hat\{y\}/g, 'ŷ')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\times/g, '×')
    .replace(/\\pm/g, '±')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\cdot/g, '·')
    .replace(/\\quad/g, '   ')
    .replace(/\\,/g, ' ')
    .replace(/\\left|\\right/g, '')
    .replace(/[{}]/g, '')
    .trim();
}

/**
 * Parses inline string into React nodes:
 * - Bold: **text** -> <strong> (with all asterisks removed)
 * - Links: [text](url) -> interactive internal tab jump or external link
 * - Math: $x$ -> styled unicode math
 * - Code: `code` -> styled monospace
 * - Removes any remaining stray asterisks
 */
function renderInlineFormatting(
  text: string,
  onNavigateTab?: (tab: string, gameId?: string) => void
): React.ReactNode[] {
  if (!text) return [];

  // Match: bold (**...**), links ([text](url)), inline math ($...$), inline code (`...`)
  const tokenRegex = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\$[^$]+\$|`[^`]+`)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold formatting: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2).replace(/\*+/g, '');
      // Check if inner contains a link
      const linkMatch = inner.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        return renderLink(linkMatch[1], linkMatch[2], index, onNavigateTab, true);
      }
      return (
        <strong
          key={index}
          className="font-bold text-slate-950 dark:text-white tracking-tight"
        >
          {inner}
        </strong>
      );
    }

    // Link formatting: [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return renderLink(linkMatch[1], linkMatch[2], index, onNavigateTab, false);
    }

    // Inline math: $formula$
    if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
      const mathContent = cleanLatexMath(part.slice(1, -1));
      return (
        <span
          key={index}
          className="font-mono text-[0.92em] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-semibold mx-0.5"
        >
          {mathContent}
        </span>
      );
    }

    // Inline code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="font-mono text-[0.9em] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-blue-600 dark:text-blue-400"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Regular text: ALWAYS strip any stray asterisks to prevent raw markdown leaks
    const cleanPlainText = part.replace(/\*+/g, '');
    return <React.Fragment key={index}>{cleanPlainText}</React.Fragment>;
  });
}

/**
 * Render links cleanly: if internal app route, hook into onNavigateTab
 */
function renderLink(
  label: string,
  url: string,
  key: string | number,
  onNavigateTab?: (tab: string, gameId?: string) => void,
  isBold = false
): React.ReactNode {
  const cleanLabel = label.replace(/\*+/g, '');

  // Check if it's an internal app tab URL like /?tab=picks, /?tab=player-props, etc.
  const tabMatch = url.match(/[?&]tab=([^&#]+)/);
  if (tabMatch && onNavigateTab) {
    const tabName = tabMatch[1];
    return (
      <button
        key={key}
        type="button"
        onClick={() => onNavigateTab(tabName)}
        className={`inline-flex items-center gap-1 text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 underline underline-offset-4 decoration-blue-400/50 hover:decoration-blue-600 font-semibold transition-colors cursor-pointer ${
          isBold ? 'font-bold' : ''
        }`}
      >
        <span>{cleanLabel}</span>
        <ChevronRight className="w-3 h-3 inline-block shrink-0 stroke-[2.5]" />
      </button>
    );
  }

  // Fallback anchor tag
  return (
    <a
      key={key}
      href={url}
      target={url.startsWith('http') ? '_blank' : undefined}
      rel={url.startsWith('http') ? 'noopener noreferrer' : undefined}
      className={`inline-flex items-center gap-1 text-blue-600 dark:text-cyan-400 hover:underline font-semibold transition-colors ${
        isBold ? 'font-bold' : ''
      }`}
    >
      <span>{cleanLabel}</span>
      {url.startsWith('http') && <ExternalLink className="w-3 h-3 inline-block shrink-0" />}
    </a>
  );
}

/**
 * Editorial Content Renderer:
 * Parses markdown into beautiful, clean typography with ZERO raw asterisks,
 * high-readability Inter font, styled lists, math formula cards, and interactive SPA links.
 */
export const ArticleContentRenderer: React.FC<ArticleContentRendererProps> = ({
  content,
  onNavigateTab,
  className = '',
}) => {
  if (!content) return null;

  // Split content into blocks separated by two or more newlines
  const rawBlocks = content.split(/\n\s*\n/);

  return (
    <div
      className={`editorial-prose text-slate-800 dark:text-zinc-200 text-[15px] sm:text-[17px] leading-[1.8] sm:leading-[1.85] font-normal space-y-5 ${className}`}
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {rawBlocks.map((block, blockIndex) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // 1. Math Formula Block ($$...$$)
        if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
          const formulaRaw = trimmed.slice(2, -2).trim();
          const cleanFormula = cleanLatexMath(formulaRaw);
          return (
            <div
              key={blockIndex}
              className="my-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0a1120] to-[#070e1c] border border-cyan-500/30 text-white shadow-lg space-y-2"
            >
              <div className="flex items-center justify-between text-xs font-mono text-cyan-400 border-b border-cyan-500/20 pb-2">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                  OLS Regression Model Specification
                </span>
                <span className="text-[11px] text-slate-400">N=6,000 Games</span>
              </div>
              <div className="py-2 text-center text-base sm:text-xl font-mono font-bold text-cyan-200 tracking-wide overflow-x-auto">
                {cleanFormula}
              </div>
            </div>
          );
        }

        // 2. Blockquote (> ...)
        if (trimmed.startsWith('>')) {
          const quoteLines = trimmed
            .split('\n')
            .map((line) => line.replace(/^>\s*/, ''))
            .join(' ');

          return (
            <blockquote
              key={blockIndex}
              className="my-5 p-4 sm:p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border-l-4 border-blue-600 dark:border-cyan-400 text-slate-800 dark:text-zinc-200 shadow-xs relative"
            >
              <Quote className="w-6 h-6 text-blue-500/20 dark:text-cyan-400/20 absolute top-3 right-3 pointer-events-none" />
              <div className="font-medium text-[15px] sm:text-[17px] leading-relaxed italic">
                {renderInlineFormatting(quoteLines, onNavigateTab)}
              </div>
            </blockquote>
          );
        }

        // 3. Bullet / Ordered List (- ..., * ..., • ..., 1. ...)
        const lines = trimmed.split('\n');
        const isList = lines.every((line) => {
          const l = line.trim();
          return (
            l.startsWith('- ') ||
            l.startsWith('* ') ||
            l.startsWith('• ') ||
            /^\d+\.\s/.test(l)
          );
        });

        if (isList) {
          return (
            <ul key={blockIndex} className="my-4 space-y-2.5 pl-1">
              {lines.map((line, lineIndex) => {
                const cleanLine = line
                  .trim()
                  .replace(/^[-*•]\s+/, '')
                  .replace(/^\d+\.\s+/, '');

                return (
                  <li
                    key={lineIndex}
                    className="flex items-start gap-3 text-[14.5px] sm:text-[16.5px] leading-relaxed"
                  >
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 shrink-0 shadow-xs ring-2 ring-cyan-500/20" />
                    <span className="flex-1">
                      {renderInlineFormatting(cleanLine, onNavigateTab)}
                    </span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // 4. Standard Paragraph
        return (
          <p key={blockIndex} className="text-slate-800 dark:text-zinc-200 leading-[1.8] sm:leading-[1.85]">
            {renderInlineFormatting(trimmed, onNavigateTab)}
          </p>
        );
      })}
    </div>
  );
};
