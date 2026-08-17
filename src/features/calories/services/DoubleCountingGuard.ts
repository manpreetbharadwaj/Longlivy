import { Activity } from '@/features/activity/models';

/**
 * Prevents an imported/tracked activity's calories from being double-counted
 * against the activity-level baseline already folded into NRLA.
 *
 * Rule: the activity-level multiplier (NRLA) already represents "everyday"
 * baseline activity. Only *targeted* logged/tracked/imported activities are
 * additionally credited to the daily balance — and each is credited exactly
 * once, keyed by (source, sourceId ?? id).
 */
export class DoubleCountingGuard {
  private creditedKeys = new Set<string>();

  private keyFor(activity: Pick<Activity, 'id' | 'source' | 'sourceId'>): string {
    return `${activity.source}:${activity.sourceId ?? activity.id}`;
  }

  shouldCredit(activity: Pick<Activity, 'id' | 'source' | 'sourceId'>): boolean {
    return !this.creditedKeys.has(this.keyFor(activity));
  }

  markCredited(activity: Pick<Activity, 'id' | 'source' | 'sourceId'>): void {
    this.creditedKeys.add(this.keyFor(activity));
  }

  sumUncreditedCalories(activities: Activity[]): number {
    let sum = 0;
    for (const activity of activities) {
      if (activity.calories == null) continue;
      if (!this.shouldCredit(activity)) continue;
      sum += activity.calories;
      this.markCredited(activity);
    }
    return sum;
  }
}
