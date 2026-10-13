/**
 * NBATotals.com — Production Google Analytics 4 (GA4) & User Engagement Engine
 * 
 * Features:
 * - Single-instance initialization with idempotency guards.
 * - Dynamic Measurement ID from import.meta.env.VITE_GA_MEASUREMENT_ID with production fallback.
 * - Client-side SPA route change and section view tracking.
 * - Strict parameter sanitization (strips PII, caps cardinality, enforces standard types).
 * - Real-time in-app event bus for live QA debugging and analytics dashboard.
 * - Zero performance impact with async queuing and consent awareness.
 */

export interface AnalyticsEvent {
  id: string;
  name: string;
  timestamp: string;
  params: Record<string, string | number | boolean>;
}

type EventSubscriber = (event: AnalyticsEvent) => void;

class AnalyticsManager {
  private static instance: AnalyticsManager;
  private isInitialized = false;
  private measurementId: string;
  private eventHistory: AnalyticsEvent[] = [];
  private subscribers: Set<EventSubscriber> = new Set();
  private maxHistorySize = 100;
  private consentGranted = true;

  private constructor() {
    // Configurable Measurement ID from environment or verified production property
    this.measurementId =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GA_MEASUREMENT_ID) ||
      'G-24ZX94G0VH';
  }

  public static getInstance(): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager();
    }
    return AnalyticsManager.instance;
  }

  /**
   * Initializes GA4 gtag instance once.
   */
  public init(measurementIdOverride?: string): void {
    if (this.isInitialized) return;

    if (measurementIdOverride) {
      this.measurementId = measurementIdOverride;
    }

    if (typeof window === 'undefined') return;

    // Ensure dataLayer exists
    window.dataLayer = window.dataLayer || [];

    // Ensure gtag function exists
    if (typeof window.gtag !== 'function') {
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
    }

    // Configure GA4
    if (this.measurementId && this.measurementId !== 'G-XXXXXXXXXX') {
      try {
        window.gtag('js', new Date());
        window.gtag('config', this.measurementId, {
          send_page_view: false, // We control page_view manually for SPA transitions
          cookie_flags: 'SameSite=None;Secure',
          anonymize_ip: true,
        });
        this.isInitialized = true;
      } catch (err) {
        console.warn('[Analytics] Failed to initialize GA4:', err);
      }
    }

    // Track returning user check
    this.checkAndTrackReturnVisit();
  }

  public getMeasurementId(): string {
    return this.measurementId;
  }

  public setConsent(granted: boolean): void {
    this.consentGranted = granted;
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: granted ? 'granted' : 'denied',
      });
    }
  }

  public isConsentGranted(): boolean {
    return this.consentGranted;
  }

  /**
   * Dispatches a GA4 event with sanitized parameters.
   */
  public trackEvent(eventName: string, params: Record<string, any> = {}): void {
    if (!this.consentGranted) return;

    // Sanitize parameters: remove undefined/null, prevent PII, limit string length
    const sanitizedParams: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;

      // Filter potential PII keys
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('email') ||
        lowerKey.includes('name_first') ||
        lowerKey.includes('phone') ||
        lowerKey.includes('password') ||
        lowerKey.includes('token')
      ) {
        continue;
      }

      if (typeof value === 'string') {
        sanitizedParams[key] = value.slice(0, 100); // Prevent high-cardinality unbounded strings
      } else if (typeof value === 'number') {
        sanitizedParams[key] = Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
      } else if (typeof value === 'boolean') {
        sanitizedParams[key] = value;
      }
    }

    // Record in local QA event buffer
    const eventItem: AnalyticsEvent = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: eventName,
      timestamp: new Date().toISOString(),
      params: sanitizedParams,
    };

    this.eventHistory.unshift(eventItem);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.pop();
    }

    // Notify in-app subscribers (QA dashboard / live debugger)
    this.subscribers.forEach((sub) => {
      try {
        sub(eventItem);
      } catch (e) {
        console.warn('[Analytics] Subscriber error:', e);
      }
    });

    // Send to Google Analytics 4
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      try {
        window.gtag('event', eventName, sanitizedParams);
      } catch (err) {
        console.warn('[Analytics] Failed to send GA4 event:', eventName, err);
      }
    }
  }

  /**
   * Tracks a single-page application page view.
   */
  public trackPageView(pagePath: string, pageTitle?: string, section?: string): void {
    const params: Record<string, any> = {
      page_path: pagePath,
      page_location: typeof window !== 'undefined' ? window.location.href : '',
      page_title: pageTitle || (typeof document !== 'undefined' ? document.title : 'NBA Totals'),
    };
    if (section) params.section_name = section;

    this.trackEvent('page_view', params);
  }

  /**
   * Tracks user navigation tab click.
   */
  public trackNavigationClick(tabId: string, sport: string = 'nba'): void {
    this.trackEvent('navigation_click', {
      tab_id: tabId,
      sport,
      interaction_location: 'main_header_nav',
    });
  }

  /**
   * Tracks interaction with an NBA matchup card on the slate.
   */
  public trackGameCardClick(
    gameId: string,
    matchup: string,
    gameDate: string,
    modelEdge: number,
    recommendation: string
  ): void {
    this.trackEvent('game_card_click', {
      game_id: gameId,
      matchup,
      game_date: gameDate,
      model_edge: modelEdge,
      recommendation,
      destination_section: 'match_details',
    });
  }

  /**
   * Tracks user opening the full matchup details view.
   */
  public trackGameDetailsView(gameId: string, matchup: string, gameDate: string): void {
    this.trackEvent('game_details_view', {
      game_id: gameId,
      matchup,
      game_date: gameDate,
      page_type: 'match_detail_page',
    });
  }

  /**
   * Tracks date selector changes on the schedule.
   */
  public trackGameDateChange(selectedDate: string, sport: string = 'nba'): void {
    this.trackEvent('game_date_change', {
      selected_date: selectedDate,
      sport,
    });
  }

  /**
   * Tracks filter applications across slate or props.
   */
  public trackFilterApply(filterType: string, filterValue: string, section: string): void {
    this.trackEvent('filter_apply', {
      filter_type: filterType,
      filter_value: filterValue,
      section_name: section,
    });
  }

  /**
   * Tracks in-page searches (teams, matchups, players).
   */
  public trackSearch(searchQuery: string, searchLocation: string): void {
    if (!searchQuery.trim()) return;
    this.trackEvent('search_submit', {
      search_term: searchQuery.trim().toLowerCase(),
      search_location: searchLocation,
    });
  }

  /**
   * Tracks engagement with a specific player prop.
   */
  public trackPlayerPropDetailView(
    playerId: string,
    playerName: string,
    team: string,
    marketLine: number | null,
    projectedPoints: number,
    recommendation: string
  ): void {
    this.trackEvent('player_prop_detail_view', {
      player_id: playerId,
      player_name: playerName,
      team,
      market_line: marketLine ?? -1,
      projected_points: projectedPoints,
      recommendation,
    });
  }

  /**
   * Tracks user expanding forecast details or key narrative.
   */
  public trackForecastDetailExpand(gameId: string, matchup: string): void {
    this.trackEvent('forecast_detail_expand', {
      game_id: gameId,
      matchup,
    });
  }

  /**
   * Tracks clicks on contextual calls to action (e.g. "Explore Full Matchup", "View Player Props").
   */
  public trackCtaClick(ctaName: string, interactionLocation: string, targetTab?: string): void {
    this.trackEvent('cta_click', {
      cta_name: ctaName,
      interaction_location: interactionLocation,
      destination_section: targetTab || 'same_page',
    });
  }

  /**
   * Tracks user sharing a game or prop (Web Share API or Copy Link).
   */
  public trackShare(contentType: 'game' | 'prop' | 'page', contentTitle: string, shareMethod: string): void {
    this.trackEvent('share_click', {
      content_type: contentType,
      content_title: contentTitle,
      share_method: shareMethod,
    });
  }

  /**
   * Tracks outbound link clicks (ESPN, DraftKings, Social).
   */
  public trackOutboundClick(url: string, label: string): void {
    this.trackEvent('outbound_click', {
      outbound_url: url,
      link_label: label,
    });
  }

  /**
   * Tracks chart interactions (hover, bucket filter, metric switch).
   */
  public trackChartInteraction(chartName: string, interactionType: string): void {
    this.trackEvent('chart_interaction', {
      chart_name: chartName,
      interaction_type: interactionType,
    });
  }

  /**
   * Tracks returning visitors compliantly using localStorage counters.
   */
  private checkAndTrackReturnVisit(): void {
    if (typeof window === 'undefined') return;

    try {
      const STORAGE_KEY_VISIT = 'nbatotals_visit_meta';
      const now = Date.now();
      const raw = localStorage.getItem(STORAGE_KEY_VISIT);

      if (!raw) {
        // First-ever visit
        localStorage.setItem(
          STORAGE_KEY_VISIT,
          JSON.stringify({
            count: 1,
            firstSeen: now,
            lastSeen: now,
          })
        );
      } else {
        const meta = JSON.parse(raw);
        const lastSeen = Number(meta.lastSeen) || now;
        const daysSinceLast = Math.round((now - lastSeen) / (1000 * 60 * 60 * 24));
        const count = (Number(meta.count) || 1) + 1;

        // Update stored visit meta
        localStorage.setItem(
          STORAGE_KEY_VISIT,
          JSON.stringify({
            count,
            firstSeen: meta.firstSeen || now,
            lastSeen: now,
          })
        );

        // Only fire return_visit event if at least 1 hour has elapsed since last seen
        if (now - lastSeen > 1000 * 60 * 60) {
          this.trackEvent('return_visit', {
            visit_count: count,
            days_since_last_visit: daysSinceLast,
          });
        }
      }
    } catch {
      // localStorage may be disabled or restricted in incognito; ignore safely
    }
  }

  /**
   * Event history & subscriber methods for the Live QA Dashboard.
   */
  public getEventHistory(): AnalyticsEvent[] {
    return [...this.eventHistory];
  }

  public clearEventHistory(): void {
    this.eventHistory = [];
    this.subscribers.forEach((sub) => {
      try {
        sub({
          id: 'clear',
          name: 'history_cleared',
          timestamp: new Date().toISOString(),
          params: {},
        });
      } catch {}
    });
  }

  public subscribe(callback: EventSubscriber): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
}

// Global declaration for window.dataLayer and window.gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const analytics = AnalyticsManager.getInstance();
