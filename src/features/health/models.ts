export type HealthPlatformId = 'apple_health' | 'google_fit' | 'garmin' | 'fitbit' | 'samsung_health' | 'whoop' | 'polar';

export interface HealthPlatformConnection {
  platform: HealthPlatformId;
  displayName: string;
  connected: boolean;
  lastSyncedAt: string | null;
  grantedScopes: string[];
}

/** Normalized internal models — every adapter must translate into these. */
export interface HealthActivity {
  id: string;
  externalId: string;
  userId: string;
  activityType: string;
  start: string;
  end: string;
  durationMs: number;
  distanceMeters?: number;
  calories?: number;
  source: HealthPlatformId;
}

export interface HealthSteps {
  date: string;
  steps: number;
  source: HealthPlatformId;
}

export interface HealthSleep {
  start: string;
  end: string;
  totalDurationMs: number;
  source: HealthPlatformId;
}

export interface HealthWeight {
  timestamp: string;
  weightKg: number;
  source: HealthPlatformId;
}

export interface HealthHeartRate {
  timestamp: string;
  bpm: number;
  source: HealthPlatformId;
}
