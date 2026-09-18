import { NavigatorScreenParams } from '@react-navigation/native';
import type { ActivityType } from '@/features/activity/models';
import type { MeditationTopic, UnguidedSoundCategory } from '@/features/meditation/models';

export type OnboardingStackParamList = {
  Welcome: undefined;
  /** "What brings you to HealthyMe?" — multi-select focus areas. Not counted as one of the 6 numbered common steps (eyebrow-style beat, like Goal below). */
  GoalSelect: undefined;
  /** "What's your main focus right now?" — only pushed when more than one goal was selected; a single selection auto-becomes the primary goal with no screen shown. */
  PrimaryGoal: undefined;
  /** The weight-direction goal now sits right after focus-area selection, before any personal-info collection starts — see OnboardingNavigator. Asked exactly once. */
  Goal: undefined;
  /** Common step 1 of 6 — a focused transition beat, not a question: "we're about to personalize this for you". */
  PersonalizeMe: undefined;
  /** Common step 2 of 6. */
  Gender: undefined;
  /** Common step 3 of 6. Route name kept as "Age" for minimal navigation churn — the screen itself now collects date of birth, not a raw age (see AgeStepScreen). */
  Age: undefined;
  /** Common step 4 of 6. */
  Height: undefined;
  /** Common step 5 of 6. */
  Weight: undefined;
  /** Common step 6 of 6 — the last screen before the dynamically-generated goal-specific flow begins (see `useGoalFlow`). */
  ActivityLevelStep: undefined;
  /**
   * One generic goal-specific question, rendered from `GOALS`/`buildGoalFlow`
   * (`src/features/onboarding/goals/`) — `key` identifies which question
   * (e.g. `'fitness.level'`). Pushed (not `navigate`d) once per question in
   * the user's generated flow, so distinct instances stack correctly for
   * Back. The only route in this stack that takes real params — every other
   * screen reads/writes `OnboardingContext` directly instead.
   */
  GoalQuestion: { key: string };
  /** Reached only when Nutrition is among the selected goals, as that goal's final step — not a numbered common step (see MicronutrientSetupScreen). */
  Micronutrients: undefined;
  /** "HealthyMe is ready for you" — the goal-focused recap, reached once the generated goal-specific flow is exhausted. Distinct from CompleteSetup, which computes the actual calorie plan. */
  GoalSummary: undefined;
  CompleteSetup: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  /** Reached automatically once authenticated with no address on file yet — see AuthNavigator's initialRouteName and RootNavigator's routing check. */
  Address: undefined;
  EmailVerification: undefined;
};

export type HomeStackParamList = {
  HomeDashboard: undefined;
  History: undefined;
  Goals: undefined;
  Notifications: undefined;
  EnterWeight: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  HealthIntegrations: undefined;
  Privacy: undefined;
  DataManagement: undefined;
  Feedback: undefined;
};

export type FastingStackParamList = {
  FastingHome: undefined;
  SelectFastingMethod: undefined;
  CustomFasting: undefined;
  CreateFastingPlan: undefined;
  FastingPlans: undefined;
  FastingStarted: undefined;
  ActiveFast: undefined;
  FastSummary: { sessionId: string };
  FastingHistory: undefined;
  FastingCalendar: undefined;
  FastingStatistics: undefined;
  FastingSettings: undefined;
};

export type NutritionStackParamList = {
  NutritionDashboard: undefined;
  FoodSearch: { mealType: string };
  AddFood: { foodId: string; mealType: string };
  MealDetails: { mealId: string };
  Favorites: undefined;
  MyFoods: { barcode?: string } | undefined;
  MyRecipes: undefined;
  CreateRecipe: undefined;
  NutritionGoalsScreen: undefined;
  NutritionHistory: undefined;
  BarcodeScanner: undefined;
  AiPhotoEntry: undefined;
  AiVoiceEntry: undefined;
  AiTextEntry: undefined;
  AiMealReview: {
    source: 'photo' | 'voice' | 'text';
    items: { foodId: string; foodName: string; quantity: number; unit: string; calories: number; protein: number; carbohydrates: number; fat: number; confidence: number }[];
  };
};

export type ActivityStackParamList = {
  ActivityHome: undefined;
  SelectActivity: undefined;
  /** `pendingType` means "run the pre-start countdown for this type first" — no Activity record exists yet. Omit to view/resume an already-active session. */
  ActiveActivity: { pendingType: ActivityType } | undefined;
  ActivitySummary: { activityId: string };
  ActivityHistory: undefined;
  ActivityDetails: { activityId: string };
  ManualActivity: undefined;
};

export type MeditationStackParamList = {
  MeditationHome: undefined;
  /**
   * Canonical discovery entry point — every field is optional so Home can link
   * in from Morning/Sleep/Quick 5 Min/Guided/Unguided (or anywhere else) with
   * just the filter(s) it knows, instead of a rigid multi-screen funnel.
   * `mode`/`durationSeconds`/`soundCategory` are typed now but not yet
   * consumed by the screen — reserved for the fuller Unguided browsing pass.
   */
  MeditationCategories: { mode?: 'guided' | 'free'; topic?: MeditationTopic; durationSeconds?: number; soundCategory?: UnguidedSoundCategory } | undefined;
  MeditationDetails: { meditationId: string };
  MeditationPlayer: { meditationId: string | null; type: 'guided' | 'free' | 'breathing'; durationSeconds: number };
  BreathingExercise: { schemeId: string };
  MeditationFavorites: undefined;
  MeditationTemplates: undefined;
  MeditationGoalsScreen: undefined;
  MeditationHistory: undefined;
  MeditationStatistics: undefined;
  MeditationReminders: undefined;
};

export type StatisticsStackParamList = {
  StatisticsHome: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
  FastingTab: NavigatorScreenParams<FastingStackParamList>;
  NutritionTab: NavigatorScreenParams<NutritionStackParamList>;
  ActivityTab: NavigatorScreenParams<ActivityStackParamList>;
  MeditationTab: NavigatorScreenParams<MeditationStackParamList>;
  StatisticsTab: NavigatorScreenParams<StatisticsStackParamList>;
};

export type RootStackParamList = {
  Splash: undefined;
  /** First-launch language gate — shown before Onboarding when no language has been chosen yet. */
  Language: undefined;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
