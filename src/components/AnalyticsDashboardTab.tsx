import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Layers,
  MousePointerClick,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  Zap,
  Flame,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { analytics, type AnalyticsEvent } from '../utils/analytics';

interface AnalyticsDashboardTabProps {
  onNavigateTab: (tabId: string) => void;
}

export const AnalyticsDashboardTab: React.FC<AnalyticsDashboardTabProps> = ({
  onNavigateTab,
}) => {
  const [events, setEvents] = useState<AnalyticsEvent[]>(() => analytics.getEventHistory());
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedEventName, setSelectedEventName] = useState<string>('ALL');
  const [measurementId, setMeasurementId] = useState<string>(analytics.getMeasurementId());
  const [testEventStatus, setTestEventStatus] = useState<string | null>(null);

  // Subscribe to live events fired across the application
  useEffect(() => {
    const unsubscribe = analytics.subscribe((newEvent) => {
      setEvents(analytics.getEventHistory());
    });
    return () => unsubscribe();
  }, []);

  const handleClearHistory = () => {
    analytics.clearEventHistory();
    setEvents([]);
  };

  const handleSendTestEvent = () => {
    analytics.trackEvent('test_ping', {
      source: 'analytics_qa_dashboard',
      timestamp_epoch: Date.now(),
      status: 'active',
      screen: 'analytics_tab',
    });
    setTestEventStatus('Test event "test_ping" successfully dispatched to GA4 dataLayer & stream.');
    setTimeout(() => setTestEventStatus(null), 4000);
  };

  // Unique event names for filter
  const uniqueEventNames = useMemo(() => {
    const names = Array.from(new Set(events.map((e) => e.name)));
    return ['ALL', ...names];
  }, [events]);

  // Filtered event log
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (selectedEventName !== 'ALL' && ev.name !== selectedEventName) return false;
      if (filterQuery.trim()) {
        const q = filterQuery.toLowerCase();
        const matchesName = ev.name.toLowerCase().includes(q);
        const matchesParams = JSON.stringify(ev.params).toLowerCase().includes(q);
        if (!matchesName && !matchesParams) return false;
      }
      return true;
    });
  }, [events, selectedEventName, filterQuery]);

  // Aggregate event metrics from current session
  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e) => {
      counts[e.name] = (counts[e.name] || 0) + 1;
    });
    return counts;
  }, [events]);

  // Funnel progression counts
  const funnel = useMemo(() => {
    const pageViews = events.filter((e) => e.name === 'page_view').length;
    const gameClicks = events.filter((e) => e.name === 'game_card_click').length;
    const detailViews = events.filter((e) => e.name === 'game_details_view').length;
    const propViews = events.filter((e) => e.name === 'player_prop_detail_view').length;
    const ctaClicks = events.filter((e) => e.name === 'cta_click' || e.name === 'share_click').length;

    return [
      { step: '1. Slate Viewed', count: Math.max(pageViews, 1), label: 'Total Page Views', color: 'from-blue-600 to-cyan-500' },
      { step: '2. Game Card Clicked', count: gameClicks, label: 'Matchup Card Clicks', color: 'from-cyan-500 to-teal-500' },
      { step: '3. Match Details Explored', count: detailViews, label: 'Deep Matchup Views', color: 'from-teal-500 to-emerald-500' },
      { step: '4. Player Props Viewed', count: propViews, label: 'Player Prop Details', color: 'from-purple-500 to-indigo-500' },
      { step: '5. Action / Share Taken', count: ctaClicks, label: 'CTAs & Shares', color: 'from-amber-500 to-orange-500' },
    ];
  }, [events]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1c2438] rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20">
                <Activity className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Google Analytics 4 &amp; Engagement Dashboard
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Real-time measurement and verification suite for <strong>NBATotals.com</strong>.
              Monitors client-side page views, matchup explorations, prop searches, and funnel conversions.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleSendTestEvent}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/10 active:scale-95 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Send Test Ping</span>
            </button>
            <button
              onClick={handleClearHistory}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-500/10 hover:text-rose-500 text-slate-700 dark:text-zinc-300 font-semibold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all cursor-pointer"
              title="Clear current session log"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Stream</span>
            </button>
          </div>
        </div>

        {/* GA4 Connection Pill */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500 dark:text-zinc-400">Active Measurement ID:</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-cyan-500 dark:text-cyan-400 font-bold border border-slate-200 dark:border-slate-700">
              {measurementId || 'Configurable via VITE_GA_MEASUREMENT_ID'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-zinc-400">
            <span>Client State: <strong>Single SPA Route Sync</strong></span>
            <span>•</span>
            <span>PII Redaction: <strong>Active</strong></span>
            <span>•</span>
            <span>Stream Events Captured: <strong>{events.length}</strong></span>
          </div>
        </div>

        {testEventStatus && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{testEventStatus}</span>
          </div>
        )}
      </div>

      {/* Conversion & Exploration Funnel */}
      <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1c2438] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              User Exploration Funnel (Live Session)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Journey Depth Progression</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {funnel.map((step, idx) => (
            <div
              key={step.step}
              className="bg-slate-50 dark:bg-[#070b14] p-3.5 rounded-xl border border-slate-200 dark:border-[#182133] relative overflow-hidden flex flex-col justify-between"
            >
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 tracking-wider block">
                  {step.step}
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono block">
                  {step.count}
                </span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                <span>{step.label}</span>
                {idx < funnel.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-400 hidden sm:inline" />
                )}
              </div>
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${step.color}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Event Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {[
          { key: 'page_view', label: 'Page Views', icon: Eye, color: 'text-blue-500' },
          { key: 'game_card_click', label: 'Game Clicks', icon: MousePointerClick, color: 'text-cyan-500' },
          { key: 'game_details_view', label: 'Matchup Details', icon: BarChart3, color: 'text-emerald-500' },
          { key: 'player_prop_detail_view', label: 'Prop Details', icon: Zap, color: 'text-purple-500' },
          { key: 'filter_apply', label: 'Filters Applied', icon: Filter, color: 'text-amber-500' },
          { key: 'search_submit', label: 'Searches', icon: Search, color: 'text-rose-500' },
        ].map((item) => (
          <div
            key={item.key}
            className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1c2438] p-3 rounded-xl flex items-center gap-3"
          >
            <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 ${item.color}`}>
              <item.icon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {item.label}
              </span>
              <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                {eventCounts[item.key] || 0}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Real-time Event Stream Table & Inspector */}
      <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1c2438] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Live GA4 Event Stream &amp; Parameter Inspector
            </h3>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              Captures every user interaction fired in this browser session.
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by event name */}
            <select
              value={selectedEventName}
              onChange={(e) => setSelectedEventName(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-zinc-200"
            >
              {uniqueEventNames.map((name) => (
                <option key={name} value={name}>
                  {name === 'ALL' ? 'All Event Types' : name}
                </option>
              ))}
            </select>

            {/* Search params */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter event parameters..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 w-48 sm:w-60 focus:outline-hidden focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Event List */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-xs">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-sans text-xs">
                No events recorded yet. Click on games, tabs, filters, or player props to see events trigger live here.
              </div>
            ) : (
              filteredEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-2"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-cyan-400 font-bold text-[11px] border border-blue-500/20">
                        {ev.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-zinc-300 break-all font-mono bg-slate-100/60 dark:bg-slate-950/60 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                      {Object.keys(ev.params).length === 0 ? (
                        <span className="text-slate-400 font-sans italic">No parameters</span>
                      ) : (
                        Object.entries(ev.params).map(([k, v]) => (
                          <span key={k} className="inline-block mr-3">
                            <span className="text-slate-400">{k}:</span>{' '}
                            <span className="text-cyan-600 dark:text-cyan-300 font-semibold">
                              {typeof v === 'boolean' ? String(v) : v}
                            </span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Verification & Setup Guide for GA4 DebugView */}
      <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1c2438] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
            How to Verify in Google Analytics 4 (Realtime &amp; DebugView)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-sans">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="font-bold text-slate-900 dark:text-white block text-sm">
              Method 1: GA4 Realtime Report
            </span>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-zinc-400">
              <li>Log in to your Google Analytics dashboard at <strong>analytics.google.com</strong>.</li>
              <li>Select the property matching <strong>{measurementId}</strong>.</li>
              <li>Click <strong>Reports</strong> $\rightarrow$ <strong>Realtime</strong>.</li>
              <li>Perform actions on nbatotals.com (e.g. click a game card or switch tabs).</li>
              <li>You will see your user location and events stream in real-time under the "Event count by Event name" card.</li>
            </ol>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="font-bold text-slate-900 dark:text-white block text-sm">
              Method 2: GA4 DebugView (Developer Mode)
            </span>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-zinc-400">
              <li>Install the official <strong>Google Analytics Debugger</strong> Chrome extension.</li>
              <li>Turn on the extension, or open DevTools and run <code>window.gtag('set', 'debug_mode', true)</code>.</li>
              <li>In Google Analytics, navigate to <strong>Admin</strong> $\rightarrow$ <strong>DebugView</strong>.</li>
              <li>Every single click, parameter, and timestamp will display on the interactive timeline with 0 delay.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboardTab;
