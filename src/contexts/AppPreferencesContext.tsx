import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageCode } from '@/config/languages';

export type UnitSystem = 'metric' | 'imperial';
/** Any registered language code from `src/config/languages.ts` — the single source of truth for which languages exist. */
export type AppLanguage = LanguageCode;

interface AppPreferences {
  unitSystem: UnitSystem;
  language: AppLanguage;
  /**
   * Whether the user has explicitly picked a language yet. `false` only on
   * a truly fresh install — `RootNavigator` shows the first-launch
   * `LanguageSelectScreen` while this is false. `setLanguage` (from that
   * screen or from Settings) flips it to `true`.
   */
  languageSelected: boolean;
  liveMomentsEnabled: boolean;
  hapticsEnabled: boolean;
}

interface AppPreferencesContextValue {
  preferences: AppPreferences;
  /** True once the persisted preferences have been read back in on this launch — gate first user-facing render on this to avoid a language flash. */
  hydrated: boolean;
  setUnitSystem: (u: UnitSystem) => void;
  /**
   * Set the active language. By default this also marks the language as
   * explicitly chosen (`languageSelected: true`), which dismisses the
   * first-launch picker — pass `{ markSelected: false }` to only preview a
   * language (the picker itself does this on tap, and confirms on Continue).
   */
  setLanguage: (l: AppLanguage, opts?: { markSelected?: boolean }) => void;
  setLiveMomentsEnabled: (v: boolean) => void;
  setHapticsEnabled: (v: boolean) => void;
}

const DEFAULTS: AppPreferences = {
  unitSystem: 'metric',
  language: 'en',
  languageSelected: false,
  liveMomentsEnabled: true,
  hapticsEnabled: true,
};

const STORAGE_KEY = '@app/app_preferences';

const AppPreferencesContext = createContext<AppPreferencesContextValue | undefined>(undefined);

export const AppPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Partial<AppPreferences>;
            setPreferences({
              ...DEFAULTS,
              ...parsed,
              // Migration: installs from before this field always persisted a
              // `language` (it's in DEFAULTS and always written), so treat any
              // existing prefs blob as "already chosen" — only a first-ever
              // launch (no blob at all) reaches the picker.
              languageSelected: parsed.languageSelected ?? parsed.language != null,
            });
          } catch {
            // ignore malformed local cache
          }
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  const persist = useCallback((next: AppPreferences) => {
    setPreferences(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);

  const setUnitSystem = useCallback(
    (unitSystem: UnitSystem) => persist({ ...preferences, unitSystem }),
    [preferences, persist]
  );
  const setLanguage = useCallback(
    (language: AppLanguage, opts?: { markSelected?: boolean }) =>
      persist({ ...preferences, language, languageSelected: opts?.markSelected === false ? preferences.languageSelected : true }),
    [preferences, persist]
  );
  const setLiveMomentsEnabled = useCallback(
    (liveMomentsEnabled: boolean) => persist({ ...preferences, liveMomentsEnabled }),
    [preferences, persist]
  );
  const setHapticsEnabled = useCallback(
    (hapticsEnabled: boolean) => persist({ ...preferences, hapticsEnabled }),
    [preferences, persist]
  );

  const value = useMemo(
    () => ({ preferences, hydrated, setUnitSystem, setLanguage, setLiveMomentsEnabled, setHapticsEnabled }),
    [preferences, hydrated, setUnitSystem, setLanguage, setLiveMomentsEnabled, setHapticsEnabled]
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
};

export function useAppPreferences(): AppPreferencesContextValue {
  const ctx = useContext(AppPreferencesContext);
  if (!ctx) throw new Error('useAppPreferences must be used within AppPreferencesProvider');
  return ctx;
}
