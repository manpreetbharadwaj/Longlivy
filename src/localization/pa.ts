import { PartialDictionary } from './types';

/** Punjabi (Gurmukhi) translations — partial by design, see `es.ts`'s header note for the scoping rationale. */
export const pa: PartialDictionary = {
  common: {
    back: 'ਵਾਪਸ',
    cancel: 'ਰੱਦ ਕਰੋ',
    close: 'ਬੰਦ ਕਰੋ',
    confirm: 'ਪੁਸ਼ਟੀ ਕਰੋ',
    continue: 'ਜਾਰੀ ਰੱਖੋ',
    done: 'ਹੋ ਗਿਆ',
    save: 'ਸੰਭਾਲੋ',
    saveChanges: 'ਬਦਲਾਅ ਸੰਭਾਲੋ',
    next: 'ਅੱਗੇ',
    skip: 'ਛੱਡੋ',
    retry: 'ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ',
    delete: 'ਮਿਟਾਓ',
    edit: 'ਸੋਧੋ',
    add: 'ਸ਼ਾਮਲ ਕਰੋ',
    remove: 'ਹਟਾਓ',
    ok: 'ਠੀਕ ਹੈ',
    yes: 'ਹਾਂ',
    no: 'ਨਹੀਂ',
    loading: 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ…',
  },
  errors: {
    generic: 'ਕੁਝ ਗਲਤ ਹੋ ਗਿਆ। ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    network: 'ਸਰਵਰ ਤੱਕ ਨਹੀਂ ਪਹੁੰਚ ਸਕੇ। ਆਪਣਾ ਕਨੈਕਸ਼ਨ ਜਾਂਚੋ ਅਤੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    bad_request: 'ਬੇਨਤੀ ਤੇ ਕਾਰਵਾਈ ਨਹੀਂ ਹੋ ਸਕੀ।',
    unauthorized: 'ਤੁਹਾਡਾ ਸੈਸ਼ਨ ਸਮਾਪਤ ਹੋ ਗਿਆ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਲੌਗ ਇਨ ਕਰੋ।',
    forbidden: 'ਤੁਹਾਨੂੰ ਅਜਿਹਾ ਕਰਨ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ ਹੈ।',
    not_found: 'ਸਾਨੂੰ ਉਹ ਨਹੀਂ ਮਿਲਿਆ ਜੋ ਤੁਸੀਂ ਲੱਭ ਰਹੇ ਸੀ।',
    validation: 'ਦਿੱਤੀ ਗਈ ਕੁਝ ਜਾਣਕਾਰੀ ਅਵੈਧ ਹੈ।',
    server: 'ਸਾਡੇ ਵੱਲੋਂ ਕੁਝ ਗਲਤ ਹੋ ਗਿਆ। ਥੋੜ੍ਹੀ ਦੇਰ ਵਿੱਚ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    cancelled: 'ਬੇਨਤੀ ਰੱਦ ਕਰ ਦਿੱਤੀ ਗਈ।',
    unknown: 'ਇੱਕ ਅਚਾਨਕ ਗਲਤੀ ਆਈ।',
  },
  validation: {
    required: 'ਇਹ ਖੇਤਰ ਲਾਜ਼ਮੀ ਹੈ।',
    fieldRequired: '{{field}} ਲਾਜ਼ਮੀ ਹੈ।',
    invalidEmail: 'ਇੱਕ ਵੈਧ ਈਮੇਲ ਪਤਾ ਦਰਜ ਕਰੋ।',
    passwordTooShort: 'ਪਾਸਵਰਡ ਘੱਟੋ-ਘੱਟ 8 ਅੱਖਰਾਂ ਦਾ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ।',
    passwordsDontMatch: 'ਪਾਸਵਰਡ ਮੇਲ ਨਹੀਂ ਖਾਂਦੇ।',
  },
  language: {
    selectTitle: 'ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ',
    selectSubtitle: 'ਤੁਸੀਂ ਇਸਨੂੰ ਬਾਅਦ ਵਿੱਚ ਸੈਟਿੰਗਾਂ ਵਿੱਚ ਬਦਲ ਸਕਦੇ ਹੋ।',
    continueCta: 'ਜਾਰੀ ਰੱਖੋ',
  },
  splash: {
    tagline: 'ਵਰਤ · ਪੋਸ਼ਣ · ਗਤੀਵਿਧੀ · ਧਿਆਨ',
  },
  onboarding: {
    stepProgress: 'ਕਦਮ {{step}} / {{total}}',
    welcome: {
      tagline: 'ਤੁਹਾਡੀ ਸਿਹਤ, ਸੁੰਦਰ ਸੰਤੁਲਨ ਵਿੱਚ।',
      begin: 'ਸ਼ੁਰੂ ਕਰੋ',
    },
  },
};
