import { Activity, ActivityType, GpsPoint } from '../models';

export interface EndActivityGpsSnapshot {
  distanceMeters: number | null;
  elevationGainMeters: number | null;
  route: GpsPoint[] | null;
  /** Surfaced so history/details screens can explain why a GPS-eligible activity has no route. */
  gpsUnavailableReason: string | null;
}

export interface ActivityRepository {
  getActiveActivity(userId: string): Promise<Activity | null>;
  getHistory(userId: string): Promise<Activity[]>;
  startActivity(userId: string, type: ActivityType, gpsAvailable: boolean): Promise<Activity>;
  pauseActivity(id: string): Promise<Activity>;
  resumeActivity(id: string): Promise<Activity>;
  endActivity(id: string, input: { weightKg: number; gps?: EndActivityGpsSnapshot }): Promise<Activity>;
  logManualActivity(input: Omit<Activity, 'id' | 'createdAt' | 'status'>): Promise<Activity>;
}
