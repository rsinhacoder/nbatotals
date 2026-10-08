import React, { useState } from 'react';
import {
  ExternalLink,
  Flame,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';

export type AdVariant = 'leaderboard' | 'native-card' | 'box' | 'sticky-bottom';

interface AdBannerProps {
  variant?: AdVariant;
  customPublisherId?: string; // Optional Google AdSense client ID e.g. "ca-pub-xxxx"
  customSlotId?: string; // Optional Google AdSense slot ID
  className?: string;
}

interface SportsbookPromo {
  name: string;
  tagline: string;
  offer: string;
  code: string;
  cta: string;
  badge: string;
  link: string;
  logoBg: string;
  badgeStyle: string;
}

const PROMOS: SportsbookPromo[] = [
  {
    name: 'DraftKings Sportsbook',
    tagline: 'Official NBA Betting Partner',
    offer: 'Bet $5, Get $200 in Bonus Bets Instantly',
    code: 'QUANT200',
    cta: 'Claim $200 Bonus',
    badge: 'TOP VALUE OFFER',
    link: 'https://sportsbook.draftkings.com',
    logoBg: 'bg-emerald-600',
    badgeStyle: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  {
    name: 'FanDuel Sportsbook',
    tagline: '#1 Rated NBA Over/Under Odds',
    offer: 'No Sweat First Bet Up to $1,000 on Any NBA Total',
    code: 'MAXEDGE',
    cta: 'Get $1,000 Promo',
    badge: 'BEST O/U LINES',
    link: 'https://sportsbook.fanduel.com',
    logoBg: 'bg-blue-600',
    badgeStyle: 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  {
    name: 'BetMGM Sportsbook',
    tagline: 'The King of Sportsbooks',
    offer: 'Get up to $1,500 Back in Bonus Bets If First Bet Loses',
    code: 'KINGQUANT',
    cta: 'Claim $1,500 Cover',
    badge: 'HIGH ROLLER PROMO',
    link: 'https://sports.betmgm.com',
    logoBg: 'bg-amber-600',
    badgeStyle: 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    name: 'Caesars Sportsbook',
    tagline: 'Official Odds Partner of the NBA',
    offer: 'Get up to $1,000 on Caesars If First Bet Loses',
    code: 'CZRQUANT',
    cta: 'Claim $1,000 Bonus',
    badge: 'ESTABLISHED BOOK',
    link: 'https://sportsbook.caesars.com',
    logoBg: 'bg-emerald-700',
    badgeStyle: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  {
    name: 'bet365 Sportsbook',
    tagline: 'World Leading Live Betting Bookmaker',
    offer: 'Bet $5, Get $150 in Bonus Bets Win or Lose',
    code: '365QUANT',
    cta: 'Claim $150 Now',
    badge: 'BEST LIVE ODDS',
    link: 'https://www.bet365.com',
    logoBg: 'bg-teal-700',
    badgeStyle: 'bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
];

export const AdBanner: React.FC<AdBannerProps> = ({
  variant = 'leaderboard',
  customPublisherId,
  customSlotId,
  className = '',
}) => {
  const [promoIndex, setPromoIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  const adsenseSlot = customSlotId || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_GOOGLE_ADSENSE_SLOT : undefined);
  const adsenseClient = customPublisherId || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_GOOGLE_ADSENSE_CLIENT : undefined);

  React.useEffect(() => {
    if (adsenseClient && adsenseSlot) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        // Silently catch adblock or dev environment issues
      }
    }
  }, [adsenseClient, adsenseSlot]);

  if (isDismissed) return null;

  if (adsenseClient && adsenseSlot) {
    return (
      <div className={`overflow-hidden text-center my-2 ${className}`}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={adsenseClient}
          data-ad-slot={adsenseSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  const promo = PROMOS[promoIndex % PROMOS.length];

  // Rotate promo on click
  const handleNextPromo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPromoIndex((prev) => (prev + 1) % PROMOS.length);
  };

  // 1. Leaderboard Banner (Wide horizontal banner e.g. 728x90)
  if (variant === 'leaderboard') {
    return (
      <div className={`relative bg-gradient-to-r from-blue-50/60 via-white to-blue-50/60 dark:from-[#111726] dark:via-[#151c2e] dark:to-[#111726] border border-blue-200/80 dark:border-amber-500/30 rounded-xl p-3 shadow-xs overflow-hidden transition-colors duration-200 ${className}`}>
        {/* Ad Tag Badge */}
        <div className="flex items-center justify-between mb-1.5 text-[9px] uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono">
          <span className="flex items-center gap-1 text-blue-700 dark:text-amber-400 font-bold">
            <Sparkles className="h-2.5 w-2.5" />
            SPONSORED PARTNER • 21+ T&amp;Cs APPLY
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNextPromo}
              className="text-[9px] text-slate-500 dark:text-zinc-400 hover:text-blue-700 dark:hover:text-amber-300 cursor-pointer transition-colors"
            >
              Switch Promo ↻
            </button>
            <span className="hidden sm:inline">• Gamble Responsibly 1-800-GAMBLER</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Promo Offer */}
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg ${promo.logoBg} flex items-center justify-center font-black text-white text-xs shrink-0 shadow-xs`}>
              {promo.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {promo.name}
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${promo.badgeStyle}`}>
                  {promo.badge}
                </span>
              </div>
              <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-amber-300 mt-0.5">
                {promo.offer}
              </div>
            </div>
          </div>

          {/* Action Call to Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="text-right hidden md:block">
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-mono">Use Promo Code</span>
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-950 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-800">
                {promo.code}
              </span>
            </div>

            <a
              href={promo.link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <span>{promo.cta}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. Native In-Feed Sponsored Card (Appears seamlessly between game cards)
  if (variant === 'native-card') {
    return (
      <div className={`bg-gradient-to-r from-blue-50/40 via-white to-slate-50 dark:from-[#121829] dark:to-[#0f1422] border border-blue-200/90 dark:border-amber-500/40 rounded-xl p-3.5 shadow-xs transition-all hover:border-blue-300 dark:hover:border-amber-500/60 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${promo.logoBg} flex items-center justify-center font-black text-white text-sm shrink-0 shadow-xs`}>
              <Flame className="h-5 w-5" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-blue-50 dark:bg-amber-500/20 text-blue-700 dark:text-amber-300 border border-blue-200 dark:border-amber-500/30">
                  SPONSORED PROMO
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{promo.name}</span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 hidden sm:inline">• {promo.tagline}</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-amber-300 mt-0.5">
                {promo.offer}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <a
              href={promo.link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all"
            >
              <span>{promo.cta}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 3. Compact Box / Skyscraper (for sidebar or detail page)
  if (variant === 'box') {
    return (
      <div className={`bg-white dark:bg-[#111728] border border-slate-200 dark:border-amber-500/30 rounded-xl p-4 shadow-xs space-y-3 transition-colors duration-200 ${className}`}>
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-zinc-400 uppercase">
          <span className="text-blue-700 dark:text-amber-400 font-bold flex items-center gap-1">
            <Zap className="h-3 w-3" /> SPONSORED PROMO
          </span>
          <span>21+ Gamble Responsibly</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`h-6 w-6 rounded-md ${promo.logoBg} flex items-center justify-center font-black text-white text-[10px]`}>
              {promo.name.slice(0, 2)}
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">{promo.name}</span>
          </div>
          <div className="text-sm font-black text-slate-900 dark:text-amber-300">
            {promo.offer}
          </div>
          <div className="text-[11px] text-slate-600 dark:text-zinc-400">
            Code: <strong className="text-slate-900 dark:text-white font-mono">{promo.code}</strong> • {promo.tagline}
          </div>
        </div>

        <a
          href={promo.link}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 font-bold text-xs text-center block uppercase tracking-wider transition-all shadow-xs"
        >
          {promo.cta} ↗
        </a>
      </div>
    );
  }

  // 4. Sticky Bottom Bar
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0d121f]/95 border-t border-slate-200 dark:border-amber-500/40 backdrop-blur-md py-2.5 px-4 shadow-lg animate-slide-up transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-50 dark:bg-amber-500/20 text-blue-700 dark:text-amber-300 border border-blue-200 dark:border-amber-500/40 shrink-0">
            HOT PROMO
          </span>
          <div className="text-xs text-slate-800 dark:text-zinc-200">
            <strong className="text-slate-900 dark:text-amber-300 font-bold">{promo.name}:</strong> {promo.offer} with code <strong className="font-mono text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-950 px-1 py-0.5 rounded border border-slate-200 dark:border-zinc-800">{promo.code}</strong>.
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={promo.link}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-xs"
          >
            Claim ↗
          </a>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            title="Dismiss Ad"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default AdBanner;
