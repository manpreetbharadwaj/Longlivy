import { FastingSession } from '@/features/fasting/models';
import { DEMO_USER_ID } from './demoUser';

function iso(daysAgo: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function addHours(isoString: string, hours: number): string {
  return new Date(new Date(isoString).getTime() + hours * 60 * 60 * 1000).toISOString();
}

export const FASTING_HISTORY_SEED: FastingSession[] = Array.from({ length: 12 }).map((_, index) => {
  const daysAgo = (index + 1) * 1.6;
  const start = iso(Math.round(daysAgo), 20, 0);
  const plannedEnd = addHours(start, 16);
  const completed = index % 4 !== 3;
  return {
    id: `seed_fast_${index}`,
    userId: DEMO_USER_ID,
    fastingPlanId: 'seed_plan_1',
    category: 'intermittent',
    method: '16:8',
    startTimestamp: start,
    plannedEndTimestamp: plannedEnd,
    actualEndTimestamp: completed ? plannedEnd : addHours(start, 12),
    plannedDuration: 16 * 60 * 60 * 1000,
    actualDuration: completed ? 16 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000,
    status: completed ? 'completed' : 'ended_prematurely',
    timezone: 'Europe/Berlin',
    createdAt: start,
    updatedAt: plannedEnd,
    originalPlannedEnd: plannedEnd,
    extensionCount: 0,
    source: 'plan',
  } satisfies FastingSession;
});
