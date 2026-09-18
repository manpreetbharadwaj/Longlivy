import { useEffect } from 'react';
import { I18nManager, DevSettings } from 'react-native';
import { useAppPreferences } from '@/contexts/AppPreferencesContext';
import { isRtlLanguage } from '@/config/languages';

/**
 * Keeps React Native's native layout-direction flag (`I18nManager.isRTL`)
 * in sync with the selected language's `rtl` flag (Arabic, Urdu today —
 * see `@/config/languages`). This is a native-level setting, not a React
 * one: `forceRTL` only takes effect for layout computed *after* it's set,
 * so a change mid-session needs a JS reload to fully apply everywhere
 * (`DevSettings.reload()` — a safe no-op if unavailable, in which case the
 * corrected direction still applies cleanly on the next natural launch,
 * since `I18nManager` persists the flag natively across launches).
 *
 * Call once, at the app root, after preferences have hydrated — calling it
 * before hydration would momentarily force LTR (the default) for every
 * user, RTL or not, and could trigger a spurious reload on first paint.
 */
export function useRtlSync(): void {
  const { preferences, hydrated } = useAppPreferences();

  useEffect(() => {
    if (!hydrated) return;
    const shouldBeRtl = isRtlLanguage(preferences.language);
    if (I18nManager.isRTL === shouldBeRtl) return;
    I18nManager.allowRTL(shouldBeRtl);
    I18nManager.forceRTL(shouldBeRtl);
    DevSettings.reload('Language direction changed');
  }, [hydrated, preferences.language]);
}
