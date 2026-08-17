export type ActivityType = 'running' | 'walking' | 'cycling' | 'hiking' | 'jogging' | 'other';
export type ActivityStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type CalorieSource = 'wearable' | 'calculated' | 'manual';

export interface GpsPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy: number;
  elevation?: number;
  speed?: number;
}

export interface Activity {
  id: string;
  userId: string;
  type: ActivityType;
  startTimestamp: string;
  endTimestamp: string | null;
  activeDuration: number; // ms, excludes pauses
  pauseDuration: number; // ms
  distanceMeters: number | null;
  pace: number | null; // min/km
  speed: number | null; // km/h
  calories: number | null;
  calorieSource: CalorieSource | null;
  elevationGainMeters: number | null;
  route: GpsPoint[] | null;
  gpsAvailable: boolean;
  /** Why a GPS-eligible activity ended up with no route (permission denied, services off, no fix, ...) — null when GPS worked or wasn't attempted. */
  gpsUnavailableReason?: string | null;
  source: 'manual' | 'tracked' | 'imported';
  sourceId?: string;
  status: ActivityStatus;
  createdAt: string;
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  running: 'Running',
  walking: 'Walking',
  cycling: 'Cycling',
  hiking: 'Hiking',
  jogging: 'Jogging',
  other: 'Other',
};

export const GPS_BASED_TYPES: ActivityType[] = ['running', 'walking', 'cycling', 'hiking', 'jogging'];
