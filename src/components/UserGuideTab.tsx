import React from 'react';
import {
  Compass,
  Lightbulb,
  Target,
  TrendingDown,
  Percent,
  Sliders,
  DollarSign,
  HelpCircle,
  CheckCircle,
} from 'lucide-react';

export const UserGuideTab: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'The Core Quantitative Edge',
      subtitle: 'Why the Lowest Quarter is the Ultimate Predictor',
      icon: Target,
      desc: 'Attempting to predict all 48 minutes at once introduces high variance from hot shooting and trash-time scoring. However, the lowest-scoring quarter functions as the structural floor of the game. Across 6,000 NBA games, each 1-point change in the lowest quarter shifts the expected regulation total by over 2.36 points (Slope = 2.3621).',
    },
    {
      step: '02',
      title: 'The 47-Point & 219 Threshold Rule',
      subtitle: 'The 10.26 : 1 Conditional Multiplier',
      icon: TrendingDown,
      desc: 'When an NBA game registers even ONE quarter below 47 points, over 70% of those games finish Under 219 points in regulation. Conversely, when all four quarters stay at or above 47, only ~7% stay under 219. This creates an asymmetric betting opportunity when lines are posted in the 224-230 range.',
    },
    {
      step: '03',
      title: 'Live In-Game Superpower',
      subtitle: 'Mathematical Capping in Real Time',
      icon: Sliders,
      desc: 'If a game begins and Quarter 1 produces only 41 points, the final lowest quarter CANNOT mathematically exceed 41! Therefore, the maximum projected regulation total is capped at 119.56 + (2.3621 × 41) ≈ 216.4 points. If live sportsbooks are still offering 222.5, you have an immediate +6.1 pt Under advantage.',
    },
  ];

  const faqs = [
    {
      q: 'What is a "Reference Total"?',
      a: 'The Reference Total is the sportsbook consensus Over/Under line (e.g. DraftKings, FanDuel, Pinnacle). You can click on any game in the evaluation table to enter or edit reference lines to track line value.',
    },
    {
      q: 'What does MAE = 9.77 mean?',
      a: 'Mean Absolute Error (MAE) measures the average distance between the model’s forecast and the actual score. A 9.77 MAE means that on average across 6,000 games, the model lands within single digits of the final regulation total.',
    },
    {
      q: 'What does "SUCCESS" vs "FAILURE" mean in the tables?',
      a: 'A forecast is graded as SUCCESS if the error was within the model’s benchmark MAE (within ±9.77 points for 5-Year model or ±10.16 points for 2-Year model).',
    },
    {
      q: 'What are the recommended bet sizes based on edge?',
      a: 'Edge < -5.0 pts (or > +5.0 pts): High conviction (2 Units). Edge between 2.0 and 5.0 pts: Standard play (1 Unit). Edge < 2.0 pts: Market Aligned (Pass).',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 rounded-2xl p-5 glow-card">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white m-0">
              Quant Platform User Guide &amp; Tactical Playbook
            </h2>
            <p className="text-xs text-slate-400 m-0 mt-0.5">
              Everything you need to know to leverage the lowest-quarter regression model for pre-game and in-play NBA forecasting.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Step Visual Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {steps.map((st) => {
          const Icon = st.icon;
          return (
            <div
              key={st.step}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 glow-card flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-black font-mono text-cyan-500/30">
                    {st.step}
                  </span>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-1">{st.title}</h3>
                <div className="text-xs font-semibold text-cyan-400 mb-3">{st.subtitle}</div>
                <p className="text-xs text-slate-300 leading-relaxed opacity-90">{st.desc}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Empirically verified across 6,000 games</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive FAQ Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 glow-card">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-cyan-400" />
          Frequently Asked Questions &amp; Quant Glossary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-1.5"
            >
              <div className="font-bold text-sm text-cyan-300">{faq.q}</div>
              <p className="text-xs text-slate-300 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
