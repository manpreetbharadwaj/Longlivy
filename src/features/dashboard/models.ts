export interface DailyRing {
  key: 'nutrition' | 'activity' | 'mindfulness';
  label: string;
  value: number;
  target: number;
  /** Clamped 0..1. */
  fraction: number;
  color: string;
}

export interface DailySummary {
  energy: {
    calorieGoal: number;
    caloriesConsumed: number;
    totalExpenditure: number;
    remaining: number;
    exceededBy: number;
  };
  nutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  activity: {
    caloriesBurned: number;
    minutes: number;
    sessionsTotal: number;
  };
  fasting: {
    isActive: boolean;
    currentStreak: number;
    progressFraction: number | null;
  };
  mindfulness: {
    minutesToday: number;
    streak: number;
  };
  body: {
    weightKg: number | null;
    trendKg: number;
  };
  rings: DailyRing[];
}
