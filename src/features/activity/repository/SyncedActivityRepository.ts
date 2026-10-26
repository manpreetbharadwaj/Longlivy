import { LocalStore } from '@/services/storage/LocalStore';
import { activitiesApi, isUploadable } from '@/services/api/activitiesApi';
import type { Activity, ActivityType } from '../models';
import type { ActivityRepository, ActivityTrackingSnapshot, EndActivityGpsSnapshot } from './ActivityRepository';

/** Local activity ids already stored server-side (local id → server id). */
const uploadedStore = new LocalStore<Record<string, string>>('@longlivy/activity_uploaded', {});

/**
 * API mode: the device store stays the source of truth for tracking (live
 * state, and full GPS points — the server keeps an encoded route), and every finished activity is
 * copied to `/activities` so it counts in the server's energy balance and
 * appears on other devices.
 *
 * Uploads are keyed by `client_id` = the local id, which the API treats as
 * idempotent, so a retry after a lost response never creates a duplicate.
 * Anything that failed to upload — and activities recorded before sync
 * existed — is retried whenever history loads.
 */
export class SyncedActivityRepository implements ActivityRepository {
  constructor(private readonly local: ActivityRepository) {}

  getActiveActivity(userId: string): Promise<Activity | null> {
    return this.local.getActiveActivity(userId);
  }

  async getHistory(userId: string): Promise<Activity[]> {
    const localHistory = await this.local.getHistory(userId);
    await this.uploadPending(localHistory);
    let server: Awaited<ReturnType<typeof activitiesApi.list>>;
    try {
      server = await activitiesApi.list();
    } catch {
      // Offline or failing API: the device history is still complete for this device.
      return localHistory;
    }
    const localIds = new Set(localHistory.map((a) => a.id));
    // Records from other devices (or a reinstall) — matched by client_id.
    const remoteOnly = server.filter((r) => !localIds.has(r.clientId)).map((r) => ({ ...r.activity, userId }));
    return [...localHistory, ...remoteOnly].sort((a, b) => Date.parse(b.startTimestamp) - Date.parse(a.startTimestamp));
  }

  startActivity(userId: string, type: ActivityType, gpsAvailable: boolean, options?: { startedAt?: string; weightKg?: number | null }): Promise<Activity> {
    return this.local.startActivity(userId, type, gpsAvailable, options);
  }

  pauseActivity(id: string, options?: { pausedAt?: string; snapshot?: ActivityTrackingSnapshot }): Promise<Activity> {
    return this.local.pauseActivity(id, options);
  }

  resumeActivity(id: string): Promise<Activity> {
    return this.local.resumeActivity(id);
  }

  updateTrackingSnapshot(id: string, snapshot: ActivityTrackingSnapshot): Promise<Activity> {
    return this.local.updateTrackingSnapshot(id, snapshot);
  }

  async endActivity(id: string, input: { weightKg?: number | null; gps?: EndActivityGpsSnapshot; endedAt?: string }): Promise<Activity> {
    const activity = await this.local.endActivity(id, input);
    await this.uploadPending([activity]);
    return activity;
  }

  async logManualActivity(input: Omit<Activity, 'id' | 'createdAt' | 'status'>): Promise<Activity> {
    const activity = await this.local.logManualActivity(input);
    await this.uploadPending([activity]);
    return activity;
  }

  /** Best effort: a failed upload is left for the next history load. */
  private async uploadPending(activities: Activity[]): Promise<void> {
    const uploaded = await uploadedStore.read();
    const pending = activities.filter((a) => isUploadable(a) && !uploaded[a.id]);
    if (pending.length === 0) return;
    const next = { ...uploaded };
    for (const activity of pending) {
      try {
        next[activity.id] = (await activitiesApi.upload(activity)).serverId;
      } catch {
        // Kept local; retried on the next history load.
      }
    }
    await uploadedStore.write(next);
  }
}
