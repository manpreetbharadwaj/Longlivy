import { AppIconName, MaterialCommunityIconName } from '@/components/common/AppIcon';
import { TranslationKey } from '@/localization/types';

/** The seven focus areas offered on the goal-selection screen. Order here is canonical — it's the order goals appear on that screen and the order secondary goals' questions are asked in (see `buildGoalFlow`). */
export const GOAL_KEYS = ['fitness', 'activity', 'yoga', 'meditation', 'fasting', 'nutrition', 'overall'] as const;
export type GoalKey = (typeof GOAL_KEYS)[number];

export interface GoalOptionConfig {
  /** Stored in `OnboardingDraft.goalAnswers[goalKey][questionId]` — a stable identifier, not the display label. Chosen to match a real app enum value wherever one exists (e.g. activity types, meditation topics, fasting method ids) so the answer is usable without a translation layer. */
  id: string;
  labelKey: TranslationKey;
}

export interface GoalQuestionConfig {
  /** Unique within its goal — combined with the goal key to form this step's flow key (e.g. `fitness.level`). */
  id: string;
  titleKey: TranslationKey;
  subtitleKey?: TranslationKey;
  multiSelect: boolean;
  options: GoalOptionConfig[];
}

export interface GoalConfig {
  key: GoalKey;
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
  icon: AppIconName | MaterialCommunityIconName;
  family?: 'ionicons' | 'material-community';
  accent: string;
  questions: GoalQuestionConfig[];
  /** Nutrition only, for now: an existing screen reused as this goal's final onboarding step instead of a generic question (see MicronutrientSetupScreen). */
  extraRouteName?: 'Micronutrients';
}

export type FlowStep =
  | { kind: 'question'; key: string; goalKey: GoalKey; question: GoalQuestionConfig }
  | { kind: 'screen'; key: string; goalKey: GoalKey; routeName: 'Micronutrients' };
