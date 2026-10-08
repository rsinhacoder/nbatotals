import React from 'react';
import { X, ShieldCheck, FileText, Info, Mail, AlertTriangle, ExternalLink } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#222c42] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1c2438] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">Privacy Policy</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">Last Updated: October 2026 · nbatotals.com</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141b2a] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-sans">
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">1. Introduction</h3>
            <p>
              Welcome to <strong>NBA Totals</strong> (accessible at <a href="https://nbatotals.com" className="text-blue-600 dark:text-blue-400 underline">https://nbatotals.com</a>). We are dedicated to respecting and protecting your privacy. This Privacy Policy outlines how your information is collected, used, and safeguarded when visiting our quantitative basketball analytics website.
            </p>
          </section>

          <section className="space-y-2 bg-blue-50/50 dark:bg-blue-950/30 p-3 sm:p-4 rounded-xl border border-blue-200/80 dark:border-blue-800/50">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              2. Google AdSense &amp; Third-Party Advertising Cookies
            </h3>
            <p>
              We partner with third-party advertising companies, including <strong>Google AdSense</strong>, to display advertisements when you visit our website. These companies may use cookies, web beacons, and similar tracking technologies to serve ads based on your prior visits to this website and other websites across the Internet:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong>Google&apos;s use of advertising cookies:</strong> Enables Google and its partner network to serve personalized ads to you based on your visit to nbatotals.com and/or other sites on the web.
              </li>
              <li>
                <strong>Opt-out options:</strong> You may opt out of personalized advertising at any time by visiting{' '}
                <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline inline-flex items-center gap-1 font-semibold">
                  Google Ads Settings <ExternalLink className="h-3 w-3" />
                </a>{' '}
                or by visiting{' '}
                <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline inline-flex items-center gap-1 font-semibold">
                  AboutAds.info <ExternalLink className="h-3 w-3" />
                </a>.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">3. Information We Collect</h3>
            <p>
              We prioritize user anonymity. We do not require registration or credit cards to use our predictive algorithms:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Local Storage Data:</strong> We store user preferences (e.g. Dark/Light theme mode, tracked bets, custom model calibrations) locally in your device&apos;s browser memory. This data never leaves your computer.</li>
              <li><strong>Log &amp; Analytics Files:</strong> Like standard web platforms, our web host (Vercel) automatically logs anonymous non-personally identifiable request data (browser type, referring pages, timestamp) to optimize website speed and uptime.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">4. California Consumer Privacy Act (CCPA)</h3>
            <p>
              Under the CCPA, California residents have the right to request disclosure of categories of personal information collected, request deletion, and opt out of the sale of personal information. NBA Totals does not sell or rent personal information to any third party.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">5. Contact Information</h3>
            <p>
              If you have any questions or feedback regarding this Privacy Policy, please contact our privacy compliance team at <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">privacy@nbatotals.com</span>.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-[#1c2438] bg-slate-50 dark:bg-[#070b14] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export const TermsOfServiceModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#222c42] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1c2438] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">Terms of Service &amp; Disclaimer</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">Last Updated: October 2026 · nbatotals.com</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141b2a] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-sans">
          <section className="space-y-2 bg-amber-50 dark:bg-amber-950/30 p-3 sm:p-4 rounded-xl border border-amber-300 dark:border-amber-700/50">
            <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm sm:text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              Important Non-Gambling &amp; Informational Disclaimer
            </h3>
            <p className="text-amber-950 dark:text-amber-100">
              <strong>nbatotals.com is not an online sportsbook, does not accept wagers, and does not facilitate real-money gambling of any kind.</strong> All mathematical regression projections, point edges, and computer totals provided on this website are strictly for informational, educational, and sports entertainment purposes.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">1. Acceptance of Terms</h3>
            <p>
              By accessing or using nbatotals.com, you agree to be bound by these Terms of Service and all applicable local, state, national, and international laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">2. Predictive Modeling &amp; Risk Notice</h3>
            <p>
              Our statistical algorithms are trained on over 6,000 NBA regular-season and postseason games. While our models incorporate pace factors, defensive ratings, and the Rule of 47, <strong>past statistical performance does not guarantee future outcomes</strong>. Sporting events contain inherent unpredictability (injuries, officiating, overtime, shooting variance). Users who choose to place sports bets do so entirely at their own risk.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">3. Intellectual Property</h3>
            <p>
              The proprietary regression formulations, statistical databases, interactive visualization tools, and Strategy Academy content are the intellectual property of NBA Totals Analytics. All NBA team names, logos, and trademarks belong to the National Basketball Association and their respective franchises and are used under fair-use editorial standards.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">4. Responsible Gaming (21+)</h3>
            <p>
              You must be at least 21 years old (or the legal age of your jurisdiction) to participate in legal sports betting. If you or someone you know has a gambling problem, crisis counseling and referral services can be accessed by calling <strong>1-800-GAMBLER (1-800-426-2537)</strong> or visiting <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">ncpgambling.org</a>.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-[#1c2438] bg-slate-50 dark:bg-[#070b14] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            Agree &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const AboutModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#222c42] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1c2438] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">About NBA Totals &amp; Methodology</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">Quantitative Sports Modeling · nbatotals.com</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141b2a] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-sans">
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Our Mission</h3>
            <p>
              <strong>nbatotals.com</strong> was founded to democratize Wall-Street grade quantitative modeling for NBA basketball enthusiasts. In an industry dominated by emotional biases, hot takes, and sportsbook marketing, our mission is to provide transparent, verifiable mathematical projections for every NBA regular season and playoff game.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">The Quantitative Model</h3>
            <p>
              Our flagship regression engine is calibrated on a verified historical database of <strong>6,000 NBA games</strong> spanning five full seasons (2020–2025). Rather than relying on simple season-average points, our formula factors in:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Pace of Play (Possessions per 48 Minutes):</strong> Measuring true offensive tempo adjusted for home/road venue.</li>
              <li><strong>Opponent-Adjusted Defensive Efficiency:</strong> Points allowed per 100 possessions against elite vs weak shooting offenses.</li>
              <li><strong>The Rule of 47:</strong> Advanced low-scoring quarter probability analysis to forecast Under volatility.</li>
              <li><strong>Back-to-Back Rest Deficits:</strong> Quantified travel and fatigue degradation on 3-point shooting accuracy.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Transparency &amp; Track Record</h3>
            <p>
              Unlike subscription tout services that conceal losing streaks, our <strong>Track Record &amp; Data tab</strong> provides open backtesting metrics (MAE ±9.77 pts, R² 0.465) across 6,000 games, empowering users to audit the algorithms independently.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-[#1c2438] bg-slate-50 dark:bg-[#070b14] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const ContactModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#222c42] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1c2438] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">Contact Us</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">Editorial &amp; Technical Support</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141b2a] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm text-slate-700 dark:text-zinc-300">
          <p>
            Have feedback on our regression predictions, statistical inquiry, or partnership question? Our team typically responds within 24 to 48 business hours.
          </p>

          <div className="space-y-3 font-mono">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141b2b] border border-slate-200 dark:border-[#222c42]">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">General &amp; Editorial Inquiries</div>
              <a href="mailto:contact@nbatotals.com" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                contact@nbatotals.com
              </a>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141b2b] border border-slate-200 dark:border-[#222c42]">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Privacy &amp; Compliance</div>
              <a href="mailto:privacy@nbatotals.com" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                privacy@nbatotals.com
              </a>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Official Domain: <strong>nbatotals.com</strong>
          </p>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-[#1c2438] bg-slate-50 dark:bg-[#070b14] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
