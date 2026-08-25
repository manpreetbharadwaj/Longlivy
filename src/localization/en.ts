/**
 * English source-of-truth dictionary. Scope for this phase: only copy that
 * is new or changed by the Phase 1 redesign (tab bar, center nav button,
 * Home screen, Feedback screen, new Settings rows). The rest of the app's
 * screens keep their hardcoded English strings and are translated
 * incrementally as later phases touch them — see `theme/motion.ts`-style
 * scope notes in the Phase 1 plan.
 */
export const en = {
  common: {
    back: 'Back',
    cancel: 'Cancel',
    done: 'Done',
  },
  tabs: {
    home: 'Home',
    fasting: 'Fasting',
    nutrition: 'Nutrition',
    activity: 'Activity',
    meditation: 'Meditation',
    statistics: 'Statistics',
  },
  nav: {
    goHome: 'Go to Home',
  },
  home: {
    greeting: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
    },
    pulse: {
      title: "Today's pulse",
      onTrack: 'On track',
      goalExceeded: 'Goal exceeded',
      kcalRemaining: 'kcal remaining',
      kcalOver: 'kcal over',
      fastingStreak: '{{days}}d fasting streak',
      mindfulStreak: '{{days}}d mindful streak',
    },
    ring: {
      nutrition: 'Nutrition',
      activity: 'Activity',
      mindfulness: 'Mindfulness',
    },
    today: {
      title: 'Today',
      consumedToday: 'Consumed today',
      activity: 'Activity',
      meditation: 'Meditation',
      streak: 'Streak',
      netKcal: 'Net kcal',
    },
  },
  feedback: {
    title: 'Feedback',
    intro: "We read every message — tell us what's working or what isn't.",
    category: {
      improvement: {
        title: 'Suggest improvement',
        description: 'Something works, but could work better.',
      },
      bug: {
        title: 'Report a bug',
        description: 'Something is broken or behaving unexpectedly.',
      },
      feature: {
        title: 'Suggest a feature',
        description: "Something you wish Longlivy could do.",
      },
      general: {
        title: 'General feedback',
        description: 'Anything else on your mind.',
      },
    },
    messageLabel: 'Your message',
    messagePlaceholder: 'Tell us more…',
    validationRequired: 'Please add a message before submitting.',
    submit: 'Send feedback',
    submitting: 'Sending…',
    success: {
      title: 'Thank you',
      body: "Your feedback has been received — it genuinely helps shape what we build next.",
      done: 'Done',
    },
  },
  settings: {
    language: {
      title: 'Language',
      english: 'English',
      german: 'Deutsch',
    },
    support: {
      title: 'Support',
      feedback: 'Send feedback',
    },
  },
};
