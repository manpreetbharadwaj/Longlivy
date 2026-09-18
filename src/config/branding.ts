/**
 * Centralized brand identity. Every product-identity value — display name,
 * wordmark, tagline, support/demo contact addresses — reads from here
 * instead of being hardcoded across screens, copy, or config. Rebranding
 * the product end-to-end is meant to be "edit this file" (plus the few
 * native/static fields below that can't read a TS module — see the note on
 * each).
 *
 * "Solace" is a deliberate placeholder brand for Phase 1 (design-system
 * foundation) — see PHASE_0_AUDIT.md §8. When a final name is chosen, swap
 * every value below; no other file should need to change for the app's
 * *copy* to pick it up. `slug`/`bundleId` are also duplicated as static
 * literals in `app.json` (JSON can't import this module) — update both
 * together.
 */
export const brand = {
  /** Display name used throughout the product (wordmark, i18n `{{appName}}` interpolation, dev logs). */
  name: 'Solace',
  /** Uppercase wordmark used on Splash/Welcome/Language screens. */
  wordmark: 'SOLACE',
  /** Lowercase, URL-safe identifier. Must match `app.json`'s `expo.slug`. */
  slug: 'solace',
  /** Must match `app.json`'s `expo.ios.bundleIdentifier` / `expo.android.package`. */
  bundleId: 'com.solace.app',
  /** Short brand promise — used sparingly, e.g. a tagline slot in intro copy. */
  tagline: 'find your calm',
  supportEmail: 'support@solace.app',
  /** Pre-filled on the login screen in this mock-backend prototype (see README.md). */
  demoAccountEmail: 'demo@solace.app',
} as const;

export type Brand = typeof brand;
