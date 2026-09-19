import { en } from './en';

/** Every valid dot-path key into the `en` dictionary, e.g. `'home.pulse.title'`. */
export type DotPaths<T> = T extends string
  ? never
  : {
      [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPaths<T[K]>}`;
    }[keyof T & string];

export type TranslationKey = DotPaths<typeof en>;
export type TranslationParams = Record<string, string | number>;
