import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UnitSystem = 'metric' | 'imperial';
export type AppLanguage = 'en' | 'de';

interface AppPreferences {
  unitSystem: UnitSystem;
  language: AppLanguage;
  liveMomentsEnabled: boolean;
  hapticsEnabled: boolean;
}

interface AppPreferencesContextValue {
  preferences: AppPreferences;
  setUnitSystem: (u: UnitSystem) => void;
  setLanguage: (l: AppLanguage) => void;
  setLiveMomentsEnabled: (v: boolean) => void;
  setHapticsEnabled: (v: boolean) => void;
}

const DEFAULTS: AppPreferences = {
  unitSystem: 'metric',
  language: 'en',
  liveMomentsEnabled: true,
  hapticsEnabled: true,
};

const STORAGE_KEY = '@longlivy/app_preferences';

const AppPreferencesContext = createContext<AppPreferencesContextValue | undefined>(undefined);

export const AppPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setPreferences({ ...DEFAULTS, ...JSON.parse(raw) });
        } catch {
          // ignore malformed local cache
        }
      }
    });
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
    (language: AppLanguage) => persist({ ...preferences, language }),
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
    () => ({ preferences, setUnitSystem, setLanguage, setLiveMomentsEnabled, setHapticsEnabled }),
    [preferences, setUnitSystem, setLanguage, setLiveMomentsEnabled, setHapticsEnabled]
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
};

export function useAppPreferences(): AppPreferencesContextValue {
  const ctx = useContext(AppPreferencesContext);
  if (!ctx) throw new Error('useAppPreferences must be used within AppPreferencesProvider');
  return ctx;
}
