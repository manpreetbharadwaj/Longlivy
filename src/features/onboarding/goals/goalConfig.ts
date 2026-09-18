import { onboardingAccent, onboardingPillarColors } from '@/features/onboarding/theme/onboardingTheme';
import { GoalConfig } from './types';

/**
 * The single source of truth for goal-based onboarding: what the seven
 * focus areas are, and what (if anything) each one asks beyond the common
 * profile steps. `useGoalFlow` turns a user's `selectedGoals`/`primaryGoal`
 * into an ordered list of screens purely by reading this array — there is
 * no separate hardcoded navigation path per goal combination.
 *
 * Option `id`s are chosen to match a real app enum wherever one exists
 * (activity's `enjoy` ids are real `ActivityType` values, meditation's
 * `help` ids are real `MeditationTopic` values, fasting's `schedule` ids
 * are real `FastingMethodId` values) so an answer is immediately usable
 * elsewhere in the app without a translation/mapping layer.
 *
 * Yoga has no in-app module yet (no screens, model, or nav route) — its
 * questions are still collected and persisted like any other goal's, they
 * just have nothing downstream to influence until a Yoga feature exists.
 */
export const GOALS: GoalConfig[] = [
  {
    key: 'fitness',
    titleKey: 'onboarding.goals.items.fitness.title',
    subtitleKey: 'onboarding.goals.items.fitness.subtitle',
    icon: 'barbell-outline',
    accent: '#E8574A',
    questions: [
      {
        id: 'level',
        titleKey: 'onboarding.goalQuestions.fitness.level.title',
        multiSelect: false,
        options: [
          { id: 'beginner', labelKey: 'onboarding.goalQuestions.fitness.level.options.beginner' },
          { id: 'intermediate', labelKey: 'onboarding.goalQuestions.fitness.level.options.intermediate' },
          { id: 'advanced', labelKey: 'onboarding.goalQuestions.fitness.level.options.advanced' },
        ],
      },
      {
        id: 'where',
        titleKey: 'onboarding.goalQuestions.fitness.where.title',
        multiSelect: false,
        options: [
          { id: 'home', labelKey: 'onboarding.goalQuestions.fitness.where.options.home' },
          { id: 'gym', labelKey: 'onboarding.goalQuestions.fitness.where.options.gym' },
          { id: 'both', labelKey: 'onboarding.goalQuestions.fitness.where.options.both' },
        ],
      },
      {
        id: 'targets',
        titleKey: 'onboarding.goalQuestions.fitness.targets.title',
        multiSelect: true,
        options: [
          { id: 'muscle', labelKey: 'onboarding.goalQuestions.fitness.targets.options.muscle' },
          { id: 'fat_loss', labelKey: 'onboarding.goalQuestions.fitness.targets.options.fat_loss' },
          { id: 'strength', labelKey: 'onboarding.goalQuestions.fitness.targets.options.strength' },
          { id: 'fitness', labelKey: 'onboarding.goalQuestions.fitness.targets.options.fitness' },
          { id: 'consistency', labelKey: 'onboarding.goalQuestions.fitness.targets.options.consistency' },
        ],
      },
      {
        // Answer is written into `OnboardingDraft.trainingFrequency` (2/3/4/5)
        // — a field that already existed for exactly this purpose but was
        // dead (never collected) before this flow.
        id: 'frequency',
        titleKey: 'onboarding.goalQuestions.fitness.frequency.title',
        multiSelect: false,
        options: [
          { id: '2', labelKey: 'onboarding.goalQuestions.fitness.frequency.options.two' },
          { id: '3', labelKey: 'onboarding.goalQuestions.fitness.frequency.options.three' },
          { id: '4', labelKey: 'onboarding.goalQuestions.fitness.frequency.options.four' },
          { id: '5', labelKey: 'onboarding.goalQuestions.fitness.frequency.options.five_plus' },
        ],
      },
    ],
  },
  {
    key: 'activity',
    titleKey: 'onboarding.goals.items.activity.title',
    subtitleKey: 'onboarding.goals.items.activity.subtitle',
    icon: 'walk-outline',
    accent: onboardingPillarColors.activity,
    questions: [
      {
        // Deliberately no "how active are you currently?" question here —
        // ActivityLevelStepScreen (part of Essential Common Information,
        // asked earlier for every user regardless of goals) already covers
        // that; re-asking a coarser version of it here would be exactly the
        // duplicate question the flow is meant to avoid.
        id: 'enjoy',
        titleKey: 'onboarding.goalQuestions.activity.enjoy.title',
        multiSelect: true,
        options: [
          { id: 'walking', labelKey: 'onboarding.goalQuestions.activity.enjoy.options.walking' },
          { id: 'running', labelKey: 'onboarding.goalQuestions.activity.enjoy.options.running' },
          { id: 'cycling', labelKey: 'onboarding.goalQuestions.activity.enjoy.options.cycling' },
          { id: 'hiking', labelKey: 'onboarding.goalQuestions.activity.enjoy.options.hiking' },
          { id: 'other', labelKey: 'onboarding.goalQuestions.activity.enjoy.options.other' },
        ],
      },
      {
        id: 'improve',
        titleKey: 'onboarding.goalQuestions.activity.improve.title',
        multiSelect: false,
        options: [
          { id: 'daily_movement', labelKey: 'onboarding.goalQuestions.activity.improve.options.daily_movement' },
          { id: 'endurance', labelKey: 'onboarding.goalQuestions.activity.improve.options.endurance' },
          { id: 'distance', labelKey: 'onboarding.goalQuestions.activity.improve.options.distance' },
          { id: 'pace', labelKey: 'onboarding.goalQuestions.activity.improve.options.pace' },
          { id: 'consistency', labelKey: 'onboarding.goalQuestions.activity.improve.options.consistency' },
        ],
      },
    ],
  },
  {
    key: 'yoga',
    titleKey: 'onboarding.goals.items.yoga.title',
    subtitleKey: 'onboarding.goals.items.yoga.subtitle',
    icon: 'yoga',
    family: 'material-community',
    accent: '#6EE7B7',
    questions: [
      {
        id: 'experience',
        titleKey: 'onboarding.goalQuestions.yoga.experience.title',
        multiSelect: false,
        options: [
          { id: 'new', labelKey: 'onboarding.goalQuestions.yoga.experience.options.new' },
          { id: 'some', labelKey: 'onboarding.goalQuestions.yoga.experience.options.some' },
          { id: 'regular', labelKey: 'onboarding.goalQuestions.yoga.experience.options.regular' },
        ],
      },
      {
        id: 'focus',
        titleKey: 'onboarding.goalQuestions.yoga.focus.title',
        multiSelect: true,
        options: [
          { id: 'flexibility', labelKey: 'onboarding.goalQuestions.yoga.focus.options.flexibility' },
          { id: 'mobility', labelKey: 'onboarding.goalQuestions.yoga.focus.options.mobility' },
          { id: 'relaxation', labelKey: 'onboarding.goalQuestions.yoga.focus.options.relaxation' },
          { id: 'strength', labelKey: 'onboarding.goalQuestions.yoga.focus.options.strength' },
          { id: 'balance', labelKey: 'onboarding.goalQuestions.yoga.focus.options.balance' },
          { id: 'stress_relief', labelKey: 'onboarding.goalQuestions.yoga.focus.options.stress_relief' },
        ],
      },
      {
        id: 'sessionLength',
        titleKey: 'onboarding.goalQuestions.yoga.sessionLength.title',
        multiSelect: false,
        options: [
          { id: 'short', labelKey: 'onboarding.goalQuestions.yoga.sessionLength.options.short' },
          { id: 'medium', labelKey: 'onboarding.goalQuestions.yoga.sessionLength.options.medium' },
          { id: 'long', labelKey: 'onboarding.goalQuestions.yoga.sessionLength.options.long' },
          { id: 'extended', labelKey: 'onboarding.goalQuestions.yoga.sessionLength.options.extended' },
        ],
      },
    ],
  },
  {
    key: 'meditation',
    titleKey: 'onboarding.goals.items.meditation.title',
    subtitleKey: 'onboarding.goals.items.meditation.subtitle',
    icon: 'meditation',
    family: 'material-community',
    accent: onboardingPillarColors.meditation,
    questions: [
      {
        // ids match `MeditationTopic` exactly (see features/meditation/models.ts).
        id: 'help',
        titleKey: 'onboarding.goalQuestions.meditation.help.title',
        multiSelect: true,
        options: [
          { id: 'stress_relief', labelKey: 'onboarding.goalQuestions.meditation.help.options.stress_relief' },
          { id: 'sleep', labelKey: 'onboarding.goalQuestions.meditation.help.options.sleep' },
          { id: 'focus', labelKey: 'onboarding.goalQuestions.meditation.help.options.focus' },
          { id: 'calm', labelKey: 'onboarding.goalQuestions.meditation.help.options.calm' },
          { id: 'mindfulness', labelKey: 'onboarding.goalQuestions.meditation.help.options.mindfulness' },
          { id: 'energy', labelKey: 'onboarding.goalQuestions.meditation.help.options.energy' },
          { id: 'relaxation', labelKey: 'onboarding.goalQuestions.meditation.help.options.relaxation' },
        ],
      },
      {
        id: 'familiarity',
        titleKey: 'onboarding.goalQuestions.meditation.familiarity.title',
        multiSelect: false,
        options: [
          { id: 'new', labelKey: 'onboarding.goalQuestions.meditation.familiarity.options.new' },
          { id: 'tried', labelKey: 'onboarding.goalQuestions.meditation.familiarity.options.tried' },
          { id: 'regular', labelKey: 'onboarding.goalQuestions.meditation.familiarity.options.regular' },
        ],
      },
      {
        id: 'sessionLength',
        titleKey: 'onboarding.goalQuestions.meditation.sessionLength.title',
        multiSelect: false,
        options: [
          { id: 'five', labelKey: 'onboarding.goalQuestions.meditation.sessionLength.options.five' },
          { id: 'fifteen', labelKey: 'onboarding.goalQuestions.meditation.sessionLength.options.fifteen' },
          { id: 'thirty', labelKey: 'onboarding.goalQuestions.meditation.sessionLength.options.thirty' },
          { id: 'forty_five_plus', labelKey: 'onboarding.goalQuestions.meditation.sessionLength.options.forty_five_plus' },
        ],
      },
    ],
  },
  {
    key: 'fasting',
    titleKey: 'onboarding.goals.items.fasting.title',
    subtitleKey: 'onboarding.goals.items.fasting.subtitle',
    icon: 'timer-outline',
    accent: onboardingPillarColors.fasting,
    questions: [
      {
        id: 'familiarity',
        titleKey: 'onboarding.goalQuestions.fasting.familiarity.title',
        multiSelect: false,
        options: [
          { id: 'new', labelKey: 'onboarding.goalQuestions.fasting.familiarity.options.new' },
          { id: 'tried', labelKey: 'onboarding.goalQuestions.fasting.familiarity.options.tried' },
          { id: 'regular', labelKey: 'onboarding.goalQuestions.fasting.familiarity.options.regular' },
        ],
      },
      {
        id: 'lookingFor',
        titleKey: 'onboarding.goalQuestions.fasting.lookingFor.title',
        multiSelect: true,
        options: [
          { id: 'routine', labelKey: 'onboarding.goalQuestions.fasting.lookingFor.options.routine' },
          { id: 'track', labelKey: 'onboarding.goalQuestions.fasting.lookingFor.options.track' },
          { id: 'consistency', labelKey: 'onboarding.goalQuestions.fasting.lookingFor.options.consistency' },
          { id: 'explore', labelKey: 'onboarding.goalQuestions.fasting.lookingFor.options.explore' },
        ],
      },
      {
        // ids are real `FastingMethodId`s (features/fasting/models.ts) — the
        // spec's illustrative "12:12" isn't a supported plan in this app, so
        // it's replaced with the real 20:4 short-form plan instead. Answer
        // is written into `OnboardingDraft.fastingMethod`, a field that
        // already existed for exactly this purpose but was dead before this
        // flow.
        id: 'schedule',
        titleKey: 'onboarding.goalQuestions.fasting.schedule.title',
        multiSelect: false,
        options: [
          { id: '14:10', labelKey: 'onboarding.goalQuestions.fasting.schedule.options.fourteen_ten' },
          { id: '16:8', labelKey: 'onboarding.goalQuestions.fasting.schedule.options.sixteen_eight' },
          { id: '18:6', labelKey: 'onboarding.goalQuestions.fasting.schedule.options.eighteen_six' },
          { id: '20:4', labelKey: 'onboarding.goalQuestions.fasting.schedule.options.twenty_four' },
        ],
      },
    ],
  },
  {
    key: 'nutrition',
    titleKey: 'onboarding.goals.items.nutrition.title',
    subtitleKey: 'onboarding.goals.items.nutrition.subtitle',
    icon: 'restaurant-outline',
    accent: onboardingPillarColors.nutrition,
    questions: [
      {
        // Deliberately just 3 options, not 6 — "Lose Weight" / "Support
        // Muscle Gain" / "Maintain My Weight" are dropped because they
        // duplicate the existing weight-direction Goal screen (Essential
        // Common Information, asked earlier for every user) one-to-one.
        id: 'focus',
        titleKey: 'onboarding.goalQuestions.nutrition.focus.title',
        multiSelect: true,
        options: [
          { id: 'eat_healthier', labelKey: 'onboarding.goalQuestions.nutrition.focus.options.eat_healthier' },
          { id: 'track_calories', labelKey: 'onboarding.goalQuestions.nutrition.focus.options.track_calories' },
          { id: 'protein', labelKey: 'onboarding.goalQuestions.nutrition.focus.options.protein' },
        ],
      },
      // No "how would you like to track nutrition?" question — the app has
      // only one generic logging model today (no simple/macros/meal-focused
      // tracking-mode distinction exists), so offering that choice would be
      // promising functionality that isn't real yet.
    ],
    extraRouteName: 'Micronutrients',
  },
  {
    key: 'overall',
    titleKey: 'onboarding.goals.items.overall.title',
    subtitleKey: 'onboarding.goals.items.overall.subtitle',
    icon: 'heart-outline',
    accent: onboardingAccent,
    questions: [
      {
        id: 'matters',
        titleKey: 'onboarding.goalQuestions.overall.matters.title',
        multiSelect: true,
        options: [
          { id: 'move', labelKey: 'onboarding.goalQuestions.overall.matters.options.move' },
          { id: 'eat', labelKey: 'onboarding.goalQuestions.overall.matters.options.eat' },
          { id: 'sleep', labelKey: 'onboarding.goalQuestions.overall.matters.options.sleep' },
          { id: 'consistency', labelKey: 'onboarding.goalQuestions.overall.matters.options.consistency' },
          { id: 'fitness', labelKey: 'onboarding.goalQuestions.overall.matters.options.fitness' },
          { id: 'mindfulness', labelKey: 'onboarding.goalQuestions.overall.matters.options.mindfulness' },
        ],
      },
    ],
  },
];

export function getGoalConfig(key: string): GoalConfig | undefined {
  return GOALS.find((g) => g.key === key);
}
