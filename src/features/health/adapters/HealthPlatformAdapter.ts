import { HealthActivity, HealthHeartRate, HealthPlatformId, HealthSleep, HealthSteps, HealthWeight } from '../models';

/**
 * Every real integration (Apple Health, Garmin, Fitbit, ...) implements this
 * interface and normalizes provider-specific payloads into Longlivy's
 * internal Health* models. The app core never depends on a vendor SDK
 * directly — only on this adapter contract.
 */
export interface HealthPlatformAdapter {
  readonly platform: HealthPlatformId;
  readonly displayName: string;
  requestPermissions(): Promise<boolean>;
  isConnected(): Promise<boolean>;
  disconnect(): Promise<void>;
  fetchActivities(sinceIso: string): Promise<HealthActivity[]>;
  fetchSteps(sinceIso: string): Promise<HealthSteps[]>;
  fetchSleep(sinceIso: string): Promise<HealthSleep[]>;
  fetchWeight(sinceIso: string): Promise<HealthWeight[]>;
  fetchHeartRate(sinceIso: string): Promise<HealthHeartRate[]>;
}
