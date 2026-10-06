import * as Location from 'expo-location';

export type ActivityLocationPreparation =
  | { ready: true }
  | {
      ready: false;
      reason: 'services_disabled' | 'denied' | 'blocked' | 'error';
      message: string;
      canOpenSettings: boolean;
    };

/**
 * Handles the foreground-only permission gate before the countdown begins.
 * Background location is intentionally not requested: this Activity build
 * tracks while its screen is active and does not claim lock-screen support.
 */
export async function prepareActivityLocation(): Promise<ActivityLocationPreparation> {
  let servicesEnabled = false;
  try {
    servicesEnabled = await Location.hasServicesEnabledAsync();
  } catch {
    return {
      ready: false,
      reason: 'error',
      message: 'Longlivy could not check location services. Please try again.',
      canOpenSettings: false,
    };
  }

  if (!servicesEnabled) {
    return {
      ready: false,
      reason: 'services_disabled',
      message: 'Turn on Location Services to record a GPS route, distance and pace.',
      canOpenSettings: true,
    };
  }

  try {
    let permission = await Location.getForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      if (permission.status === 'denied' && permission.canAskAgain === false) {
        return {
          ready: false,
          reason: 'blocked',
          message: 'Location access is blocked for Longlivy. Open Settings and allow location access to start GPS tracking.',
          canOpenSettings: true,
        };
      }
      permission = await Location.requestForegroundPermissionsAsync();
    }

    if (permission.status === 'granted') return { ready: true };

    const blocked = permission.status === 'denied' && permission.canAskAgain === false;
    return {
      ready: false,
      reason: blocked ? 'blocked' : 'denied',
      message: blocked
        ? 'Location access is blocked for Longlivy. Open Settings and allow location access to start GPS tracking.'
        : 'Location access is required to start a GPS-based activity. No fake distance or route will be recorded.',
      canOpenSettings: blocked,
    };
  } catch {
    return {
      ready: false,
      reason: 'error',
      message: 'Longlivy could not request location access. Please try again.',
      canOpenSettings: false,
    };
  }
}
