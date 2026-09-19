import { useMemo } from 'react';
import { useTranslation } from './I18nContext';
import type { AppLanguage } from '@/contexts/AppPreferencesContext';

/**
 * Locale-aware date/time formatting for the app's two languages.
 *
 * There is no date library in the project — screens format dates with the
 * platform `Intl` / `Date.toLocale*` APIs (Hermes on RN 0.86 ships `Intl`
 * with locale data). Historically those call sites passed `undefined` as
 * the locale, so a German user still saw English weekday/month names. This
 * module maps the selected `AppLanguage` to a BCP-47 tag and wraps the few
 * formatting shapes the app actually renders, so callers pass one value
 * (`useDateLocale()`) instead of hand-rolling `Intl` options each time.
 */

const LOCALE_BY_LANGUAGE: Record<AppLanguage, string> = {
  en: 'en-US',
  de: 'de-DE',
};

/** BCP-47 tag for a given app language — safe to pass straight to `Intl` / `toLocale*`. */
export function dateLocaleFor(language: AppLanguage): string {
  return LOCALE_BY_LANGUAGE[language] ?? 'en-US';
}

/** The BCP-47 tag for the currently selected language. Re-renders with the language. */
export function useDateLocale(): string {
  const { language } = useTranslation();
  return useMemo(() => dateLocaleFor(language), [language]);
}

type DateInput = Date | string | number;

const toDate = (value: DateInput): Date => (value instanceof Date ? value : new Date(value));

/** e.g. `formatDate(d, 'de-DE')` → "5. Sept. 2026". Pass `opts` to override. */
export function formatDate(value: DateInput, locale: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
  return toDate(value).toLocaleDateString(locale, opts);
}

/** 24h wall-clock time for the locale, e.g. "19:41". */
export function formatTime(value: DateInput, locale: string, opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false }): string {
  return toDate(value).toLocaleTimeString(locale, opts);
}

/** Single-letter weekday used by the day-by-day trend bars (`buildDailySeries`). */
export function formatWeekdayNarrow(value: DateInput, locale: string): string {
  return toDate(value).toLocaleDateString(locale, { weekday: 'narrow' });
}

/** Full weekday name, e.g. "Montag" / "Monday". */
export function formatWeekdayLong(value: DateInput, locale: string): string {
  return toDate(value).toLocaleDateString(locale, { weekday: 'long' });
}
