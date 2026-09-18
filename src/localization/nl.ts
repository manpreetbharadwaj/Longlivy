import { PartialDictionary } from './types';

/** Dutch translations — partial by design, see `es.ts`'s header note for the scoping rationale. */
export const nl: PartialDictionary = {
  common: {
    back: 'Terug',
    cancel: 'Annuleren',
    close: 'Sluiten',
    confirm: 'Bevestigen',
    continue: 'Doorgaan',
    done: 'Klaar',
    save: 'Opslaan',
    saveChanges: 'Wijzigingen opslaan',
    next: 'Volgende',
    skip: 'Overslaan',
    retry: 'Opnieuw proberen',
    delete: 'Verwijderen',
    edit: 'Bewerken',
    add: 'Toevoegen',
    remove: 'Verwijderen',
    ok: 'OK',
    yes: 'Ja',
    no: 'Nee',
    loading: 'Laden…',
  },
  errors: {
    generic: 'Er is iets misgegaan. Probeer het opnieuw.',
    network: 'Kan de server niet bereiken. Controleer je verbinding en probeer het opnieuw.',
    bad_request: 'Het verzoek kon niet worden verwerkt.',
    unauthorized: 'Je sessie is verlopen. Log opnieuw in.',
    forbidden: 'Je hebt geen toestemming om dat te doen.',
    not_found: 'We konden niet vinden wat je zocht.',
    validation: 'Sommige opgegeven informatie is ongeldig.',
    server: 'Er is iets misgegaan aan onze kant. Probeer het straks opnieuw.',
    cancelled: 'Het verzoek is geannuleerd.',
    unknown: 'Er is een onverwachte fout opgetreden.',
  },
  validation: {
    required: 'Dit veld is verplicht.',
    fieldRequired: '{{field}} is verplicht.',
    invalidEmail: 'Voer een geldig e-mailadres in.',
    passwordTooShort: 'Het wachtwoord moet minimaal 8 tekens bevatten.',
    passwordsDontMatch: 'Wachtwoorden komen niet overeen.',
  },
  language: {
    selectTitle: 'Kies je taal',
    selectSubtitle: 'Je kunt dit later wijzigen in Instellingen.',
    continueCta: 'Doorgaan',
  },
  splash: {
    tagline: 'Vasten · Voeding · Activiteit · Meditatie',
  },
  onboarding: {
    stepProgress: 'Stap {{step}} van {{total}}',
    welcome: {
      tagline: 'Jouw gezondheid, in balans.',
      begin: 'Beginnen',
    },
  },
};
