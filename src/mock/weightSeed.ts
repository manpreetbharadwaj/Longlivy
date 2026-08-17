import { WeightEntry } from '@/features/weight/models';
import { DEMO_USER_ID } from './demoUser';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(7, 30, 0, 0);
  return d.toISOString();
}

export const WEIGHT_SEED: WeightEntry[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `weight_seed_${i}`,
  userId: DEMO_USER_ID,
  timestamp: daysAgo((9 - i) * 3),
  weightKg: Math.round((80 - i * 0.18 + (Math.random() * 0.4 - 0.2)) * 10) / 10,
  source: 'manual',
}));
