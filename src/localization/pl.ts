import { PartialDictionary } from './types';

/** Polish translations — partial by design, see `es.ts`'s header note for the scoping rationale. */
export const pl: PartialDictionary = {
  common: {
    back: 'Wstecz',
    cancel: 'Anuluj',
    close: 'Zamknij',
    confirm: 'Potwierdź',
    continue: 'Kontynuuj',
    done: 'Gotowe',
    save: 'Zapisz',
    saveChanges: 'Zapisz zmiany',
    next: 'Dalej',
    skip: 'Pomiń',
    retry: 'Spróbuj ponownie',
    delete: 'Usuń',
    edit: 'Edytuj',
    add: 'Dodaj',
    remove: 'Usuń',
    ok: 'OK',
    yes: 'Tak',
    no: 'Nie',
    loading: 'Wczytywanie…',
  },
  errors: {
    generic: 'Coś poszło nie tak. Spróbuj ponownie.',
    network: 'Nie można połączyć się z serwerem. Sprawdź połączenie i spróbuj ponownie.',
    bad_request: 'Nie udało się przetworzyć żądania.',
    unauthorized: 'Twoja sesja wygasła. Zaloguj się ponownie.',
    forbidden: 'Nie masz uprawnień, aby to zrobić.',
    not_found: 'Nie znaleźliśmy tego, czego szukasz.',
    validation: 'Niektóre podane informacje są nieprawidłowe.',
    server: 'Coś poszło nie tak po naszej stronie. Spróbuj ponownie za chwilę.',
    cancelled: 'Żądanie zostało anulowane.',
    unknown: 'Wystąpił nieoczekiwany błąd.',
  },
  validation: {
    required: 'To pole jest wymagane.',
    fieldRequired: '{{field}} jest wymagane.',
    invalidEmail: 'Wprowadź prawidłowy adres e-mail.',
    passwordTooShort: 'Hasło musi mieć co najmniej 8 znaków.',
    passwordsDontMatch: 'Hasła nie są zgodne.',
  },
  language: {
    selectTitle: 'Wybierz swój język',
    selectSubtitle: 'Możesz to później zmienić w Ustawieniach.',
    continueCta: 'Kontynuuj',
  },
  splash: {
    tagline: 'Post · Odżywianie · Aktywność · Medytacja',
  },
  onboarding: {
    stepProgress: 'Krok {{step}} z {{total}}',
    welcome: {
      tagline: 'Twoje zdrowie, w pełnej harmonii.',
      begin: 'Rozpocznij',
    },
  },
};
