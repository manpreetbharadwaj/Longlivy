import { en } from './en';

/** Every valid dot-path key into the `en` dictionary, e.g. `'home.pulse.title'`. */
export type DotPaths<T> = T extends string
  ? never
  : {
      [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPaths<T[K]>}`;
    }[keyof T & string];

export type TranslationKey = DotPaths<typeof en>;
export type TranslationParams = Record<string, string | number>;

/**
 * A language dictionary that only needs to cover *some* of `en`'s keys —
 * any key it omits (at any depth) falls back to the English string at
 * runtime (see `resolve()` in `I18nContext.tsx`). Used for languages that
 * don't have a full translation pass yet, so adding a new language is
 * "translate what you have" rather than "translate all ~700 keys or don't
 * ship it" — `de` is the one dictionary complete enough to type as the
 * full `typeof en` instead.
 */
export type DeepPartial<T> = T extends string ? T : { [K in keyof T]?: DeepPartial<T[K]> };
export type PartialDictionary = DeepPartial<typeof en>;
