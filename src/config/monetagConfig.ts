/**
 * Monetag (PropellerAds) Ad Network Configuration for NBATotals.com
 *
 * HOW TO GET YOUR MONETAG CREDENTIALS:
 * 1. Log in to your Monetag Publisher dashboard at https://monetag.com/
 * 2. Click "Sites" -> "Add Site" -> enter "nbatotals.com" (or your custom domain)
 * 3. Domain Verification:
 *    - Monetag will provide a verification meta tag like:
 *      <meta name="monetag" content="YOUR_VERIFICATION_CODE">
 *    - Paste that code into `verificationCode` below (or directly into index.html).
 * 4. Create MultiTag Zone:
 *    - In Monetag Dashboard, click "Add Zone" -> select "MultiTag" (All-in-one tag).
 *    - MultiTag automatically serves In-Page Push, Vignette Banner (Interstitial),
 *      Push Notifications, and Popunder using AI optimization.
 *    - Copy your numeric Zone ID (e.g., '8812345') and paste it into `zoneId` below.
 * 5. Set `enabled: true`.
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
   * Monetag MultiTag Zone ID
   * Example: '8812345'
   */
  zoneId: string;

  /**
   * Monetag MultiTag script URL
   * Default: Monetag's standard multi-tag script CDN (`https://alwingulla.com/88/tag.min.js`).
   * If your Monetag dashboard assigns a custom anti-adblock script domain, paste it here.
   */
  scriptUrl: string;

  /**
   * If true, Monetag ads will ONLY run on web browsers (desktop and mobile web)
   * and will be automatically disabled inside native Capacitor Android/iOS builds
   * to strictly comply with Google Play Store & Apple App Store policies.
   */
  webOnly: boolean;

  /**
   * Optional Monetag SmartLink / Direct Link URL
   * For custom sponsored action buttons or banners.
   */
  smartLinkUrl?: string;

  /**
   * Optional debug logging in browser console
   */
  debug: boolean;
}

export const MONETAG_CONFIG: MonetagConfig = {
  // Set to true once you have created your Monetag zone and pasted your zoneId below
  enabled: false,

  // Paste your Monetag site verification code here (from Monetag Dashboard -> Sites)
  verificationCode: '',

  // Paste your Monetag MultiTag Zone ID here (e.g. '8812345')
  zoneId: '',

  // Standard Monetag MultiTag script URL (update if Monetag assigns a custom domain)
  scriptUrl: 'https://alwingulla.com/88/tag.min.js',

  // Keep true to prevent Monetag popups from loading inside native Capacitor APK
  webOnly: true,

  // Optional Monetag direct link
  smartLinkUrl: '',

  // Enable debug logs in browser console
  debug: import.meta.env.DEV,
};
