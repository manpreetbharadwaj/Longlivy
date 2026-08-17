export type GoalType =
  | 'calories'
  | 'protein'
  | 'carbohydrates'
  | 'fat'
  | 'fiber'
  | 'fasting_hours'
  | 'activity_minutes'
  | 'meditation_minutes'
  | 'meditation_sessions'
  | 'weight';

export interface Goal {
  id: string;
  userId: string;
  type: GoalType;
  target: number;
  unit: string;
  period: 'day' | 'week' | 'month';
  active: boolean;
  source: 'auto' | 'manual';
}
