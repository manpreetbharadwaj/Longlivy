import { Activity } from '@/features/activity/models';
import { DEMO_USER_ID } from './demoUser';

function daysAgo(n: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const ACTIVITY_HISTORY_SEED: Activity[] = [
  {
    id: 'act_seed_1',
    userId: DEMO_USER_ID,
    type: 'running',
    startTimestamp: daysAgo(1, 7),
    endTimestamp: daysAgo(1, 7.6 as unknown as number),
    activeDuration: 32 * 60 * 1000,
    pauseDuration: 0,
    distanceMeters: 5200,
    pace: 6.15,
    speed: 9.75,
    calories: 410,
    calorieSource: 'calculated',
    elevationGainMeters: 45,
    route: null,
    gpsAvailable: true,
    source: 'tracked',
    status: 'completed',
    createdAt: daysAgo(1, 7),
  },
  {
    id: 'act_seed_2',
    userId: DEMO_USER_ID,
    type: 'cycling',
    startTimestamp: daysAgo(3, 18),
    endTimestamp: daysAgo(3, 19),
    activeDuration: 55 * 60 * 1000,
    pauseDuration: 5 * 60 * 1000,
    distanceMeters: 18400,
    pace: null,
    speed: 20.1,
    calories: 520,
    calorieSource: 'wearable',
    elevationGainMeters: 120,
    route: null,
    gpsAvailable: true,
    source: 'imported',
    sourceId: 'apple_health_1',
    status: 'completed',
    createdAt: daysAgo(3, 18),
  },
  {
    id: 'act_seed_3',
    userId: DEMO_USER_ID,
    type: 'hiking',
    startTimestamp: daysAgo(6, 9),
    endTimestamp: daysAgo(6, 11.5 as unknown as number),
    activeDuration: 145 * 60 * 1000,
    pauseDuration: 10 * 60 * 1000,
    distanceMeters: 9800,
    pace: 14.8,
    speed: 4.05,
    calories: 780,
    calorieSource: 'calculated',
    elevationGainMeters: 380,
    route: null,
    gpsAvailable: true,
    source: 'tracked',
    status: 'completed',
    createdAt: daysAgo(6, 9),
  },
];
