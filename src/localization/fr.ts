import { PartialDictionary } from './types';

/** French translations — partial by design, see `PartialDictionary` and `es.ts`'s header note for the scoping rationale. */
export const fr: PartialDictionary = {
  common: {
    back: 'Retour',
    cancel: 'Annuler',
    close: 'Fermer',
    confirm: 'Confirmer',
    continue: 'Continuer',
    done: 'Terminé',
    save: 'Enregistrer',
    saveChanges: 'Enregistrer les modifications',
    next: 'Suivant',
    skip: 'Passer',
    retry: 'Réessayer',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    remove: 'Retirer',
    ok: 'OK',
    yes: 'Oui',
    no: 'Non',
    loading: 'Chargement…',
  },
  errors: {
    generic: "Une erreur s'est produite. Veuillez réessayer.",
    network: 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.',
    bad_request: "La demande n'a pas pu être traitée.",
    unauthorized: 'Votre session a expiré. Veuillez vous reconnecter.',
    forbidden: "Vous n'avez pas la permission de faire cela.",
    not_found: "Nous n'avons pas trouvé ce que vous cherchiez.",
    validation: 'Certaines informations fournies ne sont pas valides.',
    server: "Une erreur s'est produite de notre côté. Réessayez sous peu.",
    cancelled: 'La demande a été annulée.',
    unknown: "Une erreur inattendue s'est produite.",
  },
  validation: {
    required: 'Ce champ est obligatoire.',
    fieldRequired: '{{field}} est obligatoire.',
    invalidEmail: 'Saisissez une adresse e-mail valide.',
    passwordTooShort: 'Le mot de passe doit comporter au moins 8 caractères.',
    passwordsDontMatch: 'Les mots de passe ne correspondent pas.',
  },
  language: {
    selectTitle: 'Choisissez votre langue',
    selectSubtitle: 'Vous pourrez la modifier plus tard dans les Paramètres.',
    continueCta: 'Continuer',
  },
  splash: {
    tagline: 'Jeûne · Nutrition · Activité · Méditation',
  },
  onboarding: {
    stepProgress: 'Étape {{step}} sur {{total}}',
    welcome: {
      tagline: 'Votre santé, en parfaite harmonie.',
      begin: 'Commencer',
    },
  },
};
