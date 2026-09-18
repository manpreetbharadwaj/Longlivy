import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useAppPreferences, AppLanguage } from '@/contexts/AppPreferencesContext';
import { en } from './en';
import { de } from './de';
import { es } from './es';
import { fr } from './fr';
import { pt } from './pt';
import { it } from './it';
import { nl } from './nl';
import { pl } from './pl';
import { tr } from './tr';
import { ru } from './ru';
import { ar } from './ar';
import { hi } from './hi';
import { pa } from './pa';
import { bn } from './bn';
import { ur } from './ur';
import { zh } from './zh';
import { ja } from './ja';
import { ko } from './ko';
import { id } from './id';
import { vi } from './vi';
import { th } from './th';
import { TranslationKey, TranslationParams, PartialDictionary } from './types';
import { brand } from '@/config/branding';

/** Merged into every `t()` call automatically — copy can use `{{appName}}` without every call site having to pass it. Per-call `params` win on a key collision. */
const GLOBAL_PARAMS: TranslationParams = { appName: brand.name };

/**
 * One dictionary per language in `@/config/languages`. `en` and `de` are
 * complete (typed `: typeof en`); every other language is a `PartialDictionary`
 * — only the keys it actually has translated — since `resolve()` below
 * falls back to `en` per-key for anything a dictionary omits. That's what
 * makes "add a language" mean "add what you have translated so far", not
 * "translate every key or don't ship it".
 */
const dictionaries: Record<AppLanguage, PartialDictionary> = { en, de, es, fr, pt, it, nl, pl, tr, ru, ar, hi, pa, bn, ur, zh, ja, ko, id, vi, th };

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
