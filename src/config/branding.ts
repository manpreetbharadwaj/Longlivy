/**
 * Centralized brand identity. Every product-identity value — display name,
 * wordmark, tagline, support/demo contact addresses — reads from here
 * instead of being hardcoded across screens, copy, or config. Rebranding
 * the product end-to-end is meant to be "edit this file" (plus the few
 * native/static fields below that can't read a TS module — see the note on
 * each).
 *
 * `slug`/`bundleId` are also duplicated as static literals in `app.json`
 * (JSON can't import this module) — update both together.
 */
export const brand = {
  /**
   * Display name used throughout the product (wordmark, i18n `{{appName}}`
   * interpolation, dev logs). One word, exact casing — "HealthyMe", never
   * "Healthy Me"/"Healthy me"/"HEALTHY ME". Don't split or re-space it in
   * copy.
   */
  name: 'HealthyMe',
  /** Uppercase wordmark used on Splash/Welcome/Language screens — still one word, no inserted space. */
  wordmark: 'HEALTHYME',
  /** Lowercase, URL-safe identifier. Must match `app.json`'s `expo.slug`. */
  slug: 'healthyme',
  /** Must match `app.json`'s `expo.ios.bundleIdentifier` / `expo.android.package`. */
  bundleId: 'com.healthyme.app',
  /** Short brand promise — used sparingly, e.g. a tagline slot in intro copy. */
  tagline: 'eat well, live well',
  supportEmail: 'support@healthyme.app',
  /** Pre-filled on the login screen in this mock-backend prototype (see README.md). */
  demoAccountEmail: 'demo@healthyme.app',
} as const;

export type Brand = typeof brand;
