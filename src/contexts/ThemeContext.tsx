import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildTheme, Theme, ThemeMode } from '@/theme';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
}

const STORAGE_KEY = '@longlivy/theme_preference';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveMode(preference: ThemePreference, system: ColorSchemeName | null | undefined): ThemeMode {
  if (preference === 'system') {
    return system === 'dark' ? 'dark' : 'light';
  }
  return preference;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  // `Appearance.getColorScheme()` is typed as `ColorSchemeName | null | undefined` — the
  // OS can genuinely report "no preference" (e.g. before the first appearance event).
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName | null | undefined>(Appearance.getColorScheme());

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreferenceState(stored);
      }
    });
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => undefined);
  }, []);

  const mode = resolveMode(preference, systemScheme);
  const theme = useMemo(() => buildTheme(mode), [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, preference, setPreference }),
    [theme, preference, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
