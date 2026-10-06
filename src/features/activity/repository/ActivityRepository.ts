import { Activity, ActivityType, GpsPoint } from '../models';

export interface ActivityTrackingSnapshot {
  distanceMeters: number | null;
  elevationGainMeters: number | null;
  route: GpsPoint[] | null;
  /** Surfaced so history/details screens can explain why a GPS-eligible activity has no route. */
  gpsUnavailableReason: string | null;
  movingDuration: number;
  metHours: number;
}
export type EndActivityGpsSnapshot = ActivityTrackingSnapshot;

export interface ActivityRepository {
  getActiveActivity(userId: string): Promise<Activity | null>;
  getHistory(userId: string): Promise<Activity[]>;
  startActivity(userId: string, type: ActivityType, gpsAvailable: boolean, options?: { startedAt?: string; weightKg?: number | null }): Promise<Activity>;
  pauseActivity(id: string, options?: { pausedAt?: string; snapshot?: ActivityTrackingSnapshot }): Promise<Activity>;
  resumeActivity(id: string): Promise<Activity>;
  updateTrackingSnapshot(id: string, snapshot: ActivityTrackingSnapshot): Promise<Activity>;
  endActivity(id: string, input: { weightKg?: number | null; gps?: EndActivityGpsSnapshot; endedAt?: string }): Promise<Activity>;
  logManualActivity(input: Omit<Activity, 'id' | 'createdAt' | 'status'>): Promise<Activity>;
}
