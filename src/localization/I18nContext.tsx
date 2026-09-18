import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useAppPreferences, AppLanguage } from '@/contexts/AppPreferencesContext';
import { en } from './en';
import { de } from './de';
import { TranslationKey, TranslationParams } from './types';
import { brand } from '@/config/branding';

/** Merged into every `t()` call automatically — copy can use `{{appName}}` without every call site having to pass it. Per-call `params` win on a key collision. */
const GLOBAL_PARAMS: TranslationParams = { appName: brand.name };

const dictionaries: Record<AppLanguage, typeof en> = { en, de };

function resolve(dict: Record<string, unknown>, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
  return typeof value === 'string' ? value : undefined;
}

function interpolate(template: string, params?: TranslationParams): string {
  const merged = params ? { ...GLOBAL_PARAMS, ...params } : GLOBAL_PARAMS;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => (name in merged ? String(merged[name]) : match));
}

interface I18nContextValue {
  t: (key: TranslationKey, params?: TranslationParams) => string;
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

/**
 * Lightweight typed i18n — no external dependency. Reads/writes the
 * language preference already persisted by `AppPreferencesContext`. `t`'s
 * signature (`t(key, params)` with `{{name}}` interpolation) is
 * deliberately i18next-shaped so swapping in a real library later, if the
 * dictionary grows past what's comfortable to hand-roll, is mechanical
 * rather than a rewrite of every call site.
 */
export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences, setLanguage } = useAppPreferences();
  const dict = dictionaries[preferences.language];

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => {
      const raw = resolve(dict, key) ?? resolve(en, key) ?? key;
      return interpolate(raw, params);
    },
    [dict]
  );

  const value = useMemo(() => ({ t, language: preferences.language, setLanguage }), [t, preferences.language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}
