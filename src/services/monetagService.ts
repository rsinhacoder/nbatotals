import { MONETAG_CONFIG, type MonetagConfig } from '../config/monetagConfig';
import { isNativePlatform } from '../utils/capacitorApp';

interface MonetagServiceState {
  initialized: boolean;
  isLoaded: boolean;
  serviceWorkerRegistered: boolean;
  isNativeSuppressed: boolean;
  error: string | null;
}

class MonetagService {
  private config: MonetagConfig = MONETAG_CONFIG;
  private state: MonetagServiceState = {
    initialized: false,
    isLoaded: false,
    serviceWorkerRegistered: false,
    isNativeSuppressed: false,
    error: null,
  };

  /**
   * Initializes the Monetag script, service worker registration, and verification tags.
   * Automatically bypasses inside native Capacitor Android builds to ensure
   * 100% compliance with Google Play Store policies.
   */
  public init(customConfig?: Partial<MonetagConfig>): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    // 1. Android / iOS Native App Safeguard
    if (this.config.webOnly && isNativePlatform()) {
      this.state.isNativeSuppressed = true;
      if (this.config.debug) {
        console.info('[Monetag] Native mobile app platform detected. Ads suppressed to maintain App Store compliance.');
      }
      return;
    }

    // 2. Enabled Check
    if (!this.config.enabled) {
      if (this.config.debug) {
        console.info(
          '[Monetag] Monetag is currently disabled. Set `enabled: true` in `src/config/monetagConfig.ts` to activate live ads.'
        );
      }
      return;
    }

    if (this.state.initialized) {
      return;
    }
    this.state.initialized = true;

    // 3. Inject Verification Meta Tag if provided
    this.injectVerificationMeta();

    // 4. Register Monetag Service Worker (/sw.js)
    this.registerServiceWorker();

    // 5. Inject Monetag Zone Script
    this.injectZoneScript();
  }

  /**
   * Registers the Monetag Service Worker (/sw.js) for Web Push / In-Page Push notifications
   */
  private registerServiceWorker(): void {
    const swPath = this.config.serviceWorkerPath || '/sw.js';

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        navigator.serviceWorker
          .register(swPath)
          .then((registration) => {
            this.state.serviceWorkerRegistered = true;
            if (this.config.debug) {
              console.info(`[Monetag] Service worker registered successfully at ${swPath} (scope: ${registration.scope})`);
            }
          })
          .catch((err) => {
            if (this.config.debug) {
              console.warn('[Monetag] Service worker registration error:', err);
            }
          });
      } catch (e) {
        if (this.config.debug) {
          console.warn('[Monetag] Failed to register service worker:', e);
        }
      }
    }
  }

  /**
   * Injects the Monetag site verification meta tag into <head>
   */
  private injectVerificationMeta(): void {
    const code = this.config.verificationCode?.trim();
    if (!code) return;

    try {
      let meta = document.querySelector('meta[name="monetag"]') as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'monetag';
        meta.content = code;
        document.head.appendChild(meta);
        if (this.config.debug) {
          console.info(`[Monetag] Injected verification meta tag: ${code.slice(0, 8)}...`);
        }
      } else {
        meta.content = code;
      }
    } catch (e) {
      console.warn('[Monetag] Failed to inject verification meta tag:', e);
    }
  }

  /**
   * Injects the Monetag Zone script tag
   */
  private injectZoneScript(): void {
    const zoneId = this.config.zoneId?.trim();
    const scriptUrl = this.config.scriptUrl?.trim();

    if (!zoneId) {
      console.warn('[Monetag] Monetag is enabled, but no `zoneId` was provided in `src/config/monetagConfig.ts`.');
      return;
    }

    if (!scriptUrl) {
      console.warn('[Monetag] Monetag `scriptUrl` is missing.');
      return;
    }

    try {
      // Check if already injected
      const existingScript =
        document.querySelector(`script[data-zone="${zoneId}"]`) ||
        document.querySelector(`script[src*="${zoneId}"]`);

      if (existingScript) {
        this.state.isLoaded = true;
        return;
      }

      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.setAttribute('data-zone', zoneId);
      script.setAttribute('data-cfasync', 'false');

      script.onload = () => {
        this.state.isLoaded = true;
        if (this.config.debug) {
          console.info(`[Monetag] Zone script loaded successfully for Zone ID: ${zoneId}`);
        }
      };

      script.onerror = () => {
        this.state.error = 'Monetag script failed to load (possible adblocker active).';
        if (this.config.debug) {
          console.warn('[Monetag] Script blocked or failed to load.');
        }
      };

      (document.body || document.head || document.documentElement).appendChild(script);
    } catch (e) {
      this.state.error = e instanceof Error ? e.message : 'Unknown injection error';
      console.warn('[Monetag] Script injection exception:', e);
    }
  }

  /**
   * Called on route or tab transitions in the SPA.
   * Can be used to trigger Monetag interstitial/vignette opportunities.
   */
  public onNavigate(route: string): void {
    if (!this.config.enabled || this.state.isNativeSuppressed) return;

    if (this.config.debug) {
      console.debug(`[Monetag] Navigation event to: ${route}`);
    }
  }

  /**
   * Returns Monetag SmartLink URL if configured
   */
  public getSmartLinkUrl(): string | undefined {
    return this.config.smartLinkUrl?.trim() || undefined;
  }

  /**
   * Diagnostic state of the Monetag integration
   */
  public getStatus(): MonetagServiceState & { enabled: boolean; zoneId: string; domain: string } {
    return {
      ...this.state,
      enabled: this.config.enabled,
      zoneId: this.config.zoneId,
      domain: this.config.domain,
    };
  }
}

export const monetagService = new MonetagService();
