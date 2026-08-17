export interface WeightEntry {
  id: string;
  userId: string;
  timestamp: string;
  weightKg: number;
  source: 'manual' | 'health_platform' | 'wearable';
  measurementMethod?: string;
}
