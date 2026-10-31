import React, { createContext, useContext, useMemo } from 'react';
import { buildTheme, Theme } from '@/theme';

interface ThemeContextValue {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * LongLivy ships dark-only — there is no light/system theme switcher in
 * Settings (removed; see the "Remove Appearance from Settings" task). The
 * underlying light theme in `@/theme` is left intact on purpose, only
 * unreachable from the UI, in case a theme switcher is reintroduced later.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useMemo(() => buildTheme('dark'), []);
  const value = useMemo<ThemeContextValue>(() => ({ theme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
