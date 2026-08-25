import { en } from './en';

/** German translations. Typed against `typeof en` so a missing/extra key is a compile error, keeping the two dictionaries in lockstep. */
export const de: typeof en = {
  common: {
    back: 'Zurück',
    cancel: 'Abbrechen',
    done: 'Fertig',
  },
  tabs: {
    home: 'Start',
    fasting: 'Fasten',
    nutrition: 'Ernährung',
    activity: 'Aktivität',
    meditation: 'Meditation',
    statistics: 'Statistik',
  },
  nav: {
    goHome: 'Zur Startseite',
  },
  home: {
    greeting: {
      morning: 'Guten Morgen',
      afternoon: 'Guten Tag',
      evening: 'Guten Abend',
    },
    pulse: {
      title: 'Dein Tag im Überblick',
      onTrack: 'Auf Kurs',
      goalExceeded: 'Ziel überschritten',
      kcalRemaining: 'kcal übrig',
      kcalOver: 'kcal über dem Ziel',
      fastingStreak: '{{days}} Tage Fasten-Serie',
      mindfulStreak: '{{days}} Tage Achtsamkeits-Serie',
    },
    ring: {
      nutrition: 'Ernährung',
      activity: 'Aktivität',
      mindfulness: 'Achtsamkeit',
    },
    today: {
      title: 'Heute',
      consumedToday: 'Heute aufgenommen',
      activity: 'Aktivität',
      meditation: 'Meditation',
      streak: 'Serie',
      netKcal: 'Netto kcal',
    },
  },
  feedback: {
    title: 'Feedback',
    intro: 'Wir lesen jede Nachricht — sag uns, was gut funktioniert oder was nicht.',
    category: {
      improvement: {
        title: 'Verbesserung vorschlagen',
        description: 'Etwas funktioniert, könnte aber besser sein.',
      },
      bug: {
        title: 'Fehler melden',
        description: 'Etwas ist kaputt oder verhält sich unerwartet.',
      },
      feature: {
        title: 'Funktion vorschlagen',
        description: 'Etwas, das sich Longlivy wünschen würde.',
      },
      general: {
        title: 'Allgemeines Feedback',
        description: 'Alles andere, das dir am Herzen liegt.',
      },
    },
    messageLabel: 'Deine Nachricht',
    messagePlaceholder: 'Erzähl uns mehr…',
    validationRequired: 'Bitte gib eine Nachricht ein, bevor du absendest.',
    submit: 'Feedback senden',
    submitting: 'Wird gesendet…',
    success: {
      title: 'Danke dir',
      body: 'Dein Feedback ist angekommen — es hilft uns wirklich dabei, das Nächste zu gestalten.',
      done: 'Fertig',
    },
  },
  settings: {
    language: {
      title: 'Sprache',
      english: 'English',
      german: 'Deutsch',
    },
    support: {
      title: 'Support',
      feedback: 'Feedback senden',
    },
  },
};
