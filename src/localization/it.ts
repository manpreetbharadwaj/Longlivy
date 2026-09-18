import { PartialDictionary } from './types';

/** Italian translations — partial by design, see `es.ts`'s header note for the scoping rationale. */
export const it: PartialDictionary = {
  common: {
    back: 'Indietro',
    cancel: 'Annulla',
    close: 'Chiudi',
    confirm: 'Conferma',
    continue: 'Continua',
    done: 'Fatto',
    save: 'Salva',
    saveChanges: 'Salva modifiche',
    next: 'Avanti',
    skip: 'Salta',
    retry: 'Riprova',
    delete: 'Elimina',
    edit: 'Modifica',
    add: 'Aggiungi',
    remove: 'Rimuovi',
    ok: 'OK',
    yes: 'Sì',
    no: 'No',
    loading: 'Caricamento…',
  },
  errors: {
    generic: 'Qualcosa è andato storto. Riprova.',
    network: 'Impossibile raggiungere il server. Controlla la connessione e riprova.',
    bad_request: 'Impossibile elaborare la richiesta.',
    unauthorized: 'La sessione è scaduta. Accedi di nuovo.',
    forbidden: 'Non hai il permesso di farlo.',
    not_found: 'Non abbiamo trovato quello che cercavi.',
    validation: 'Alcune informazioni fornite non sono valide.',
    server: 'Si è verificato un errore dal nostro lato. Riprova a breve.',
    cancelled: "La richiesta è stata annullata.",
    unknown: 'Si è verificato un errore imprevisto.',
  },
  validation: {
    required: 'Questo campo è obbligatorio.',
    fieldRequired: '{{field}} è obbligatorio.',
    invalidEmail: 'Inserisci un indirizzo email valido.',
    passwordTooShort: 'La password deve contenere almeno 8 caratteri.',
    passwordsDontMatch: 'Le password non corrispondono.',
  },
  language: {
    selectTitle: 'Scegli la tua lingua',
    selectSubtitle: 'Potrai cambiarla più tardi nelle Impostazioni.',
    continueCta: 'Continua',
  },
  splash: {
    tagline: 'Digiuno · Nutrizione · Attività · Meditazione',
  },
  onboarding: {
    stepProgress: 'Passo {{step}} di {{total}}',
    welcome: {
      tagline: 'La tua salute, in perfetta armonia.',
      begin: 'Inizia',
    },
  },
};
