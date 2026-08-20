import { NavigatorScreenParams } from '@react-navigation/native';

export type OnboardingStackParamList = {
  Welcome: undefined;
  WhatIsLonglivy: undefined;
  TrackingOverview: undefined;
  ChooseGoal: undefined;
  PersonalInfo: undefined;
  ActivityLevelStep: undefined;
  NutritionGoalsStep: undefined;
  FastingPreferenceStep: undefined;
  MeditationPreferenceStep: undefined;
  NotificationPreferenceStep: undefined;
  CompleteSetup: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
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
