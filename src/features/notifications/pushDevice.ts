import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { apiRequest } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/apiConfig';
import { LocalStore } from '@/services/storage/LocalStore';

/**
 * Registers this device's native push token with POST /devices (not in the
 * API document; verified 2026-10-19: provider expo|apns|fcm, re-posting a
 * token updates it, DELETE /devices/{token} removes it).
 *
 * The native token is used (APNs on iOS, FCM on Android): the project has no
 * Expo project id, so Expo push tokens are unavailable. Registration never
 * prompts — it only runs when notification permission is already granted.
 * Whether the server can deliver to the token depends on its APNs/FCM
 * credentials, which the app cannot verify.
 */
const registeredStore = new LocalStore<{ token: string | null }>('@longlivy/push_device', { token: null });

function deviceLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || 'en';
  } catch {
    return 'en';
  }
}

function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * The token this session has posted (or is posting). On iOS, fetching the
 * token also fires the token listener, so without this check the same token
 * would be posted twice. Cleared on unregister so the next sign-in posts again.
 */
let postedToken: string | null = null;

async function register(token: string): Promise<void> {
  if (token === postedToken) return;
  postedToken = token;
  try {
    await apiRequest({
      method: 'POST',
      url: API_ENDPOINTS.devices.collection,
      data: {
        token,
        provider: Platform.OS === 'ios' ? 'apns' : 'fcm',
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        app_version: Constants.expoConfig?.version ?? '0.0.0',
        locale: deviceLocale(),
        timezone: deviceTimezone(),
      },
    });
  } catch (e) {
    postedToken = null;
    throw e;
  }
  await registeredStore.write({ token });
}

/** Signed-in only. Returns the outcome so callers/logs can tell "no permission" from a failure. */
export async function registerPushDevice(): Promise<'registered' | 'no_permission' | 'unsupported'> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return 'no_permission';
  const { data } = await Notifications.getDevicePushTokenAsync();
  if (typeof data !== 'string' || !data) return 'unsupported';
  await register(data);
  return 'registered';
}

/** Re-registers when the OS rotates the token. Returns the unsubscribe function. */
export function watchPushTokenChanges(): () => void {
  const subscription = Notifications.addPushTokenListener(({ data }) => {
    if (typeof data === 'string' && data) register(data).catch(() => undefined);
  });
  return () => subscription.remove();
}

/** Called before logout revokes the session, so the server stops pushing to a signed-out device. */
export async function unregisterPushDevice(): Promise<void> {
  postedToken = null;
  const { token } = await registeredStore.read();
  if (!token) return;
  try {
    await apiRequest({ method: 'DELETE', url: API_ENDPOINTS.devices.byToken(token) });
  } finally {
    await registeredStore.write({ token: null });
  }
}
