import { HealthPlatformAdapter } from './HealthPlatformAdapter';
import { HealthActivity, HealthHeartRate, HealthPlatformId, HealthSleep, HealthSteps, HealthWeight } from '../models';

/**
 * Stand-in for AppleHealthAdapter / GarminAdapter / FitbitAdapter / etc.
 * Demonstrates the normalized shape without touching any real SDK.
 */
export class MockHealthAdapter implements HealthPlatformAdapter {
  constructor(public readonly platform: HealthPlatformId, public readonly displayName: string) {}

  private connected = false;

  async requestPermissions(): Promise<boolean> {
    this.connected = true;
    return true;
  }

  async isConnected(): Promise<boolean> {
    return this.connected;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async fetchActivities(_sinceIso: string): Promise<HealthActivity[]> {
    return [];
  }

  async fetchSteps(_sinceIso: string): Promise<HealthSteps[]> {
    return [];
  }

  async fetchSleep(_sinceIso: string): Promise<HealthSleep[]> {
    return [];
  }

  async fetchWeight(_sinceIso: string): Promise<HealthWeight[]> {
    return [];
  }

  async fetchHeartRate(_sinceIso: string): Promise<HealthHeartRate[]> {
    return [];
  }
}

export const HEALTH_ADAPTERS: Record<HealthPlatformId, HealthPlatformAdapter> = {
  apple_health: new MockHealthAdapter('apple_health', 'Apple Health'),
  google_fit: new MockHealthAdapter('google_fit', 'Google Fit'),
  garmin: new MockHealthAdapter('garmin', 'Garmin'),
  fitbit: new MockHealthAdapter('fitbit', 'Fitbit'),
  samsung_health: new MockHealthAdapter('samsung_health', 'Samsung Health'),
  whoop: new MockHealthAdapter('whoop', 'Whoop'),
  polar: new MockHealthAdapter('polar', 'Polar'),
};
