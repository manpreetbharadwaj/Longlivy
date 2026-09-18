/**
 * Centralized language registry — every language-aware surface in the app
 * (the first-launch language wheel, Settings' "change language" row, RTL
 * layout decisions) reads from this single list instead of hardcoding its
 * own copy. Adding a language is meant to be "add one entry here" — no
 * other file should need a hardcoded language list.
 *
 * `code` must match a key in `AppLanguage` (`src/contexts/AppPreferencesContext.tsx`)
 * and in the `dictionaries` map (`src/localization/I18nContext.tsx`).
 */
export interface LanguageDefinition {
  /** ISO 639-1 code, used as the app's internal language identifier and AsyncStorage-persisted value. */
  code: string;
  /** BCP-47 locale tag, used for `Intl`/`toLocale*` date-time formatting. */
  locale: string;
  /** The language's own endonym — always shown in that language, never translated (e.g. "Deutsch", not "German"). */
  nativeName: string;
  /** English name — used as a fallback label and in developer-facing contexts. */
  englishName: string;
  /**
   * ISO 3166-1 alpha-2 country code identifying which flag to show —
   * looked up in `FlagIcon`'s per-country SVG map, not rendered as emoji.
   * Two languages can point at the same country (Hindi/Punjabi → IN).
   */
  countryCode: string;
  /** Right-to-left script — drives text alignment and layout direction. */
  rtl: boolean;
}

export const LANGUAGES: LanguageDefinition[] = [
  { code: 'en', locale: 'en-US', nativeName: 'English', englishName: 'English', countryCode: 'US', rtl: false },
  { code: 'de', locale: 'de-DE', nativeName: 'Deutsch', englishName: 'German', countryCode: 'DE', rtl: false },
  { code: 'es', locale: 'es-ES', nativeName: 'Español', englishName: 'Spanish', countryCode: 'ES', rtl: false },
  { code: 'fr', locale: 'fr-FR', nativeName: 'Français', englishName: 'French', countryCode: 'FR', rtl: false },
  { code: 'pt', locale: 'pt-PT', nativeName: 'Português', englishName: 'Portuguese', countryCode: 'PT', rtl: false },
  { code: 'it', locale: 'it-IT', nativeName: 'Italiano', englishName: 'Italian', countryCode: 'IT', rtl: false },
  { code: 'nl', locale: 'nl-NL', nativeName: 'Nederlands', englishName: 'Dutch', countryCode: 'NL', rtl: false },
  { code: 'pl', locale: 'pl-PL', nativeName: 'Polski', englishName: 'Polish', countryCode: 'PL', rtl: false },
  { code: 'tr', locale: 'tr-TR', nativeName: 'Türkçe', englishName: 'Turkish', countryCode: 'TR', rtl: false },
  { code: 'ru', locale: 'ru-RU', nativeName: 'Русский', englishName: 'Russian', countryCode: 'RU', rtl: false },
  { code: 'ar', locale: 'ar-SA', nativeName: 'العربية', englishName: 'Arabic', countryCode: 'SA', rtl: true },
  { code: 'hi', locale: 'hi-IN', nativeName: 'हिन्दी', englishName: 'Hindi', countryCode: 'IN', rtl: false },
  { code: 'pa', locale: 'pa-IN', nativeName: 'ਪੰਜਾਬੀ', englishName: 'Punjabi', countryCode: 'IN', rtl: false },
  { code: 'bn', locale: 'bn-BD', nativeName: 'বাংলা', englishName: 'Bengali', countryCode: 'BD', rtl: false },
  { code: 'ur', locale: 'ur-PK', nativeName: 'اردو', englishName: 'Urdu', countryCode: 'PK', rtl: true },
  { code: 'zh', locale: 'zh-CN', nativeName: '简体中文', englishName: 'Simplified Chinese', countryCode: 'CN', rtl: false },
  { code: 'ja', locale: 'ja-JP', nativeName: '日本語', englishName: 'Japanese', countryCode: 'JP', rtl: false },
  { code: 'ko', locale: 'ko-KR', nativeName: '한국어', englishName: 'Korean', countryCode: 'KR', rtl: false },
  { code: 'id', locale: 'id-ID', nativeName: 'Bahasa Indonesia', englishName: 'Indonesian', countryCode: 'ID', rtl: false },
  { code: 'vi', locale: 'vi-VN', nativeName: 'Tiếng Việt', englishName: 'Vietnamese', countryCode: 'VN', rtl: false },
  { code: 'th', locale: 'th-TH', nativeName: 'ไทย', englishName: 'Thai', countryCode: 'TH', rtl: false },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const BY_CODE: Record<string, LanguageDefinition> = Object.fromEntries(LANGUAGES.map((l) => [l.code, l]));

export function getLanguage(code: string): LanguageDefinition {
  return BY_CODE[code] ?? BY_CODE.en;
}

export function isRtlLanguage(code: string): boolean {
  return getLanguage(code).rtl;
}
