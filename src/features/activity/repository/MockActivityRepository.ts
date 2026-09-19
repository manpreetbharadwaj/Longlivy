import { ActivityRepository, EndActivityGpsSnapshot } from './ActivityRepository';
import { Activity, ActivityType } from '../models';
import { LocalStore } from '@/services/storage/LocalStore';
import { generateId } from '@/utils/id';
import { ACTIVITY_HISTORY_SEED } from '@/mock/activitySeed';
import { estimateActivityCalories, calculatePace, calculateSpeed, ACTIVITY_CALCULATION_METHOD, ACTIVITY_CALCULATION_VERSION } from '../services/ActivityCalculator';

const store = new LocalStore<Activity[]>('@longlivy/activity_db', ACTIVITY_HISTORY_SEED);

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class MockActivityRepository implements ActivityRepository {
  async getActiveActivity(userId: string): Promise<Activity | null> {
    const activities = await store.read();
    return delay(activities.find((a) => a.userId === userId && (a.status === 'active' || a.status === 'paused')) ?? null);
  }

  async getHistory(userId: string): Promise<Activity[]> {
    const activities = await store.read();
    return delay(
      activities
        .filter((a) => a.userId === userId && a.status === 'completed')
        .sort((a, b) => new Date(b.startTimestamp).getTime() - new Date(a.startTimestamp).getTime())
    );
  }

  async startActivity(userId: string, type: ActivityType, gpsAvailable: boolean): Promise<Activity> {
    const activities = await store.read();
    const activity: Activity = {
      id: generateId('activity'),
      userId,
      type,
      startTimestamp: new Date().toISOString(),
      endTimestamp: null,
      activeDuration: 0,
      pauseDuration: 0,
      distanceMeters: gpsAvailable ? 0 : null,
      pace: null,
      speed: null,
      calories: null,
      calorieSource: null,
      elevationGainMeters: gpsAvailable ? 0 : null,
      route: gpsAvailable ? [] : null,
      gpsAvailable,
      source: 'tracked',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    activities.unshift(activity);
    await store.write(activities);
    return delay(activity);
  }

  async pauseActivity(id: string): Promise<Activity> {
    return this.updateStatus(id, 'paused');
  }

  async resumeActivity(id: string): Promise<Activity> {
    return this.updateStatus(id, 'active');
  }

  private async updateStatus(id: string, status: Activity['status']): Promise<Activity> {
    const activities = await store.read();
    const idx = activities.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Activity not found');
    activities[idx] = { ...activities[idx], status };
    await store.write(activities);
    return delay(activities[idx]);
  }

  async endActivity(id: string, input: { weightKg: number; gps?: EndActivityGpsSnapshot }): Promise<Activity> {
    const activities = await store.read();
    const idx = activities.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Activity not found');
    const activity = activities[idx];
    const durationMs = Date.now() - new Date(activity.startTimestamp).getTime();
    const activeDuration = Math.max(durationMs - activity.pauseDuration, 0);
    const calories = estimateActivityCalories(activity.type, activeDuration, input.weightKg);
    const gps = input.gps;
    const finalDistance = gps ? gps.distanceMeters : activity.gpsAvailable ? activity.distanceMeters ?? 0 : null;

    const updated: Activity = {
      ...activity,
      status: 'completed',
      endTimestamp: new Date().toISOString(),
      activeDuration,
      calories,
      calorieSource: 'calculated',
      // Never fabricated: a GPS-eligible activity with no usable fix ends up
      // with null distance/route + a reason, not an invented zero-length route.
      distanceMeters: finalDistance,
      pace: finalDistance ? calculatePace(finalDistance, activeDuration) : null,
      speed: finalDistance ? calculateSpeed(finalDistance, activeDuration) : null,
      elevationGainMeters: gps ? gps.elevationGainMeters : activity.elevationGainMeters,
      route: gps ? gps.route : activity.route,
      gpsUnavailableReason: gps?.gpsUnavailableReason ?? null,
    };
    activities[idx] = updated;
    await store.write(activities);
    return delay(updated);
  }

  async logManualActivity(input: Omit<Activity, 'id' | 'createdAt' | 'status'>): Promise<Activity> {
    const activities = await store.read();
    const activity: Activity = { ...input, id: generateId('activity'), createdAt: new Date().toISOString(), status: 'completed' };
    activities.unshift(activity);
    await store.write(activities);
    return delay(activity);
  }
}

export const activityRepository: ActivityRepository = new MockActivityRepository();
export { ACTIVITY_CALCULATION_METHOD, ACTIVITY_CALCULATION_VERSION };
