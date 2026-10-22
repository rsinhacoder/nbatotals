import { MONETAG_CONFIG, type MonetagConfig } from '../config/monetagConfig';
import { isNativePlatform } from '../utils/capacitorApp';

interface MonetagServiceState {
  initialized: boolean;
  isLoaded: boolean;
  isNativeSuppressed: boolean;
  error: string | null;
}

class MonetagService {
  private config: MonetagConfig = MONETAG_CONFIG;
  private state: MonetagServiceState = {
    initialized: false,
    isLoaded: false,
    isNativeSuppressed: false,
    error: null,
  };

  /**
   * Initializes the Monetag MultiTag script and verification tags.
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
          '[Monetag] Monetag is currently disabled. Set `enabled: true` and paste your zoneId in `src/config/monetagConfig.ts` to activate live ads.'
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

    // 4. Inject MultiTag Script
    this.injectMultiTagScript();
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
   * Injects the official Monetag MultiTag script
   */
  private injectMultiTagScript(): void {
    const zoneId = this.config.zoneId?.trim();
    const scriptUrl = this.config.scriptUrl?.trim();

    if (!zoneId) {
      console.warn(
        '[Monetag] Monetag is enabled, but no `zoneId` was provided in `src/config/monetagConfig.ts`. Please paste your MultiTag Zone ID.'
      );
      return;
    }

    if (!scriptUrl) {
      console.warn('[Monetag] Monetag `scriptUrl` is missing.');
      return;
    }

    try {
      // Check if already injected
      const existingScript = document.querySelector(`script[data-zone="${zoneId}"]`);
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
          console.info(`[Monetag] MultiTag loaded successfully for Zone ID: ${zoneId}`);
        }
      };

      script.onerror = () => {
        this.state.error = 'Monetag script failed to load (possible adblocker active).';
        if (this.config.debug) {
          console.warn('[Monetag] MultiTag blocked or failed to load.');
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

    // Monetag MultiTag automatically hooks clicks on DOM elements,
    // but custom hooks or direct links can be triggered here if configured.
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
  public getStatus(): MonetagServiceState & { enabled: boolean; zoneId: string } {
    return {
      ...this.state,
      enabled: this.config.enabled,
      zoneId: this.config.zoneId,
    };
  }
}

export const monetagService = new MonetagService();
