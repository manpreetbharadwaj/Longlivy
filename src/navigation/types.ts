import { NavigatorScreenParams } from '@react-navigation/native';

export type OnboardingStackParamList = {
  Welcome: undefined;
  Value: undefined;
  /** The goal now sits right after the intro, before any personal-info collection starts — see OnboardingNavigator. Asked exactly once. */
  Goal: undefined;
  /** Step 1 of 7 — a focused transition beat, not a question: "we're about to personalize this for you". */
  PersonalizeMe: undefined;
  /** Step 2 of 7. */
  Gender: undefined;
  /** Step 3 of 7. Route name kept as "Age" for minimal navigation churn — the screen itself now collects date of birth, not a raw age (see AgeStepScreen). */
  Age: undefined;
  /** Step 4 of 7. */
  Height: undefined;
  /** Step 5 of 7. */
  Weight: undefined;
  /** Step 6 of 7. */
  ActivityLevelStep: undefined;
  /** Step 7 of 7 — not a form, see MicronutrientSetupScreen. */
  Micronutrients: undefined;
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
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  HealthIntegrations: undefined;
  Privacy: undefined;
  DataManagement: undefined;
  EnterWeight: undefined;
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
  ActiveActivity: undefined;
  ActivitySummary: { activityId: string };
  ActivityHistory: undefined;
  ActivityDetails: { activityId: string };
  ManualActivity: undefined;
};

export type MeditationStackParamList = {
  MeditationHome: undefined;
  MeditationCategories: undefined;
  MeditationDetails: { meditationId: string };
  MeditationPlayer: { meditationId: string | null; type: 'guided' | 'free' | 'breathing' | 'individual'; durationSeconds: number };
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
  FastingTab: NavigatorScreenParams<FastingStackParamList>;
  NutritionTab: NavigatorScreenParams<NutritionStackParamList>;
  ActivityTab: NavigatorScreenParams<ActivityStackParamList>;
  MeditationTab: NavigatorScreenParams<MeditationStackParamList>;
  StatisticsTab: NavigatorScreenParams<StatisticsStackParamList>;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
