/**
 * Monetag (PropellerAds) Ad Network Configuration for NBATotals.com
 *
 * Configured for Zone ID: 12093878
 * Domain: 3nbf4.com
 * Service Worker: /sw.js (served from public/sw.js)
 */

export interface MonetagConfig {
  /** Master toggle to enable or disable Monetag ads across the site */
  enabled: boolean;

  /**
   * Monetag Site Verification Meta Tag Code
   * e.g. "a1b2c3d4e5f6g7h8..." from Monetag Sites verification screen.
   */
  verificationCode: string;

  /**
   * Monetag Zone ID
   */
  zoneId: string;

  /**
   * Monetag Assigned Domain
   */
  domain: string;

  /**
   * Monetag Tag script URL
   */
  scriptUrl: string;

  /**
   * Path to the Monetag service worker file
   */
  serviceWorkerPath: string;

  /**
   * If true, Monetag ads will ONLY run on web browsers (desktop and mobile web)
   * and will be automatically disabled inside native Capacitor Android/iOS builds
   * to strictly comply with Google Play Store & Apple App Store policies.
   */
  webOnly: boolean;

  /**
   * Optional Monetag SmartLink / Direct Link URL
   */
  smartLinkUrl?: string;

  /**
   * Optional debug logging in browser console
   */
  debug: boolean;
}

export const MONETAG_CONFIG: MonetagConfig = {
  // Activated with your Monetag credentials
  enabled: true,

  // Paste your Monetag site verification code here if Monetag asks for meta-tag verification
  verificationCode: '',

  // Your Monetag Zone ID
  zoneId: '300097',

  // Your Monetag CDN Domain
  domain: 'quge5.com',

  // Monetag Zone tag script
  scriptUrl: 'https://quge5.com/88/tag.min.js',

  // Path to service worker in public root
  serviceWorkerPath: '/sw.js',

  // Keep true to prevent Monetag popups from loading inside native Capacitor APK
  webOnly: true,

  // Optional Monetag direct link
  smartLinkUrl: '',

  // Enable debug logs in browser console
  debug: import.meta.env.DEV,
};
