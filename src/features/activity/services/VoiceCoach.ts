import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LiveWorkoutSession, writeLiveSession } from './BackgroundWorkoutSession';
import { announce } from './VoiceAnnouncer';
import * as LonglivyTts from 'longlivy-tts';

export type TimeAnnouncementInterval = 'off' | 5 | 10 | 15 | 30;
export type DistanceAnnouncementInterval = 0.5 | 1 | 2 | 5;

export interface VoiceCoachSettings {
  enabled: boolean;
  distanceIntervalKm: DistanceAnnouncementInterval;
  timeIntervalMinutes: TimeAnnouncementInterval;
  /** BCP-47 code, or null to use the device's default TTS language. */
  language: string | null;
  volume: number;
}

export const DEFAULT_VOICE_COACH_SETTINGS: VoiceCoachSettings = {
  enabled: true,
  distanceIntervalKm: 1,
  timeIntervalMinutes: 'off',
  language: null,
  volume: 1,
};

/**
 * TEMPORARY — Android real-device voice-coaching verification only (see the
 * "Final Android Device Verification" task). Forces a spoken announcement
 * every 60 real seconds regardless of the user's saved distance/time
 * settings, so lifecycle testing (foreground/background/locked/killed)
 * doesn't require walking a full kilometer between checks. Does not touch
 * `DEFAULT_VOICE_COACH_SETTINGS` or anything persisted — flipping this back
 * to `false` fully restores production behavior with no other change.
 * MUST be set back to `false` before this work ships.
 */
export const DEV_FORCE_ONE_MINUTE_VOICE_TEST = false;

const SETTINGS_KEY = '@longlivy/voice_coach_settings';

/**
 * Plain `AsyncStorage`, not the cached `LocalStore` wrapper — the background
 * location task (see BackgroundLocationTask.ts) runs in a separate JS
 * context from the Settings screen that writes these, so a cached read here
 * could run an entire workout on a preference the user already changed.
 */
export async function readVoiceCoachSettings(): Promise<VoiceCoachSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_VOICE_COACH_SETTINGS, ...(JSON.parse(raw) as Partial<VoiceCoachSettings>) } : DEFAULT_VOICE_COACH_SETTINGS;
  } catch {
    return DEFAULT_VOICE_COACH_SETTINGS;
  }
}

export async function writeVoiceCoachSettings(settings: VoiceCoachSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Best-effort local preference only.
  }
}

export async function listInstalledLanguages(): Promise<string[]> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return Array.from(new Set(voices.map((v) => v.language))).sort();
  } catch {
    return [];
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Real session numbers only — every figure here comes from the same distance/calorie calculation the UI and backend use, never a placeholder. */
function distanceAnnouncement(km: number, calories: number | null): string {
  const kcal = calories != null ? Math.round(calories) : null;
  const distanceText = km === Math.round(km) ? `${km} kilometer${km === 1 ? '' : 's'}` : `${round1(km)} kilometers`;
  const calorieText = kcal != null ? ` You have burned approximately ${kcal} calories.` : '';
  return `You have completed ${distanceText}.${calorieText}`;
}

function timeAnnouncement(minutes: number, km: number | null, calories: number | null): string {
  const kcal = calories != null ? Math.round(calories) : null;
  const distanceText = km != null && km > 0 ? ` You have covered ${round1(km)} kilometers.` : '';
  const calorieText = kcal != null ? ` You have burned approximately ${kcal} calories.` : '';
  return `You have been active for ${minutes} minutes.${distanceText}${calorieText}`;
}

/** TEMPORARY test-only format — see DEV_FORCE_ONE_MINUTE_VOICE_TEST. Distance in meters (not km) since a minute of walking rarely clears 1 km; reports 0 m honestly rather than inventing movement when GPS hasn't recorded any. */
function oneMinuteTestAnnouncement(minuteNumber: number, distanceMeters: number | null, calories: number | null): string {
  const meters = distanceMeters != null && distanceMeters > 0 ? Math.round(distanceMeters) : 0;
  const kcal = calories != null && calories > 0 ? Math.round(calories) : 0;
  const minuteWord = minuteNumber === 1 ? 'one minute' : `${minuteNumber} minutes`;
  return `You have been active for ${minuteWord}. You have covered approximately ${meters} meters and burned an estimated ${kcal} calories. Keep going!`;
}

/** Speaks the test-voice sample from Settings, independent of any workout session. */
export function speakTestAnnouncement(settings: VoiceCoachSettings): void {
  announce('This is how your workout announcements will sound.', { language: settings.language, volume: settings.volume });
}

/**
 * Checked on every background-location update (see BackgroundLocationTask).
 * Milestones are tracked as "largest threshold already crossed" rather than
 * "was this exact value hit", so a GPS update that jumps 0.98 -> 1.03 km
 * still announces the 1 km mark exactly once, and a later update landing on
 * 1.6 km doesn't re-announce it.
 */
export async function announceMilestonesIfDue(
  session: LiveWorkoutSession,
  activeMs: number,
  calories: number | null
): Promise<void> {
  const settings = await readVoiceCoachSettings();
  if (!settings.enabled || session.status !== 'active') return;

  const km = session.distanceMeters != null ? session.distanceMeters / 1000 : 0;
  const minutes = Math.floor(activeMs / 60000);

  let distanceDue: number | null = null;
  const step = settings.distanceIntervalKm;
  const crossedDistance = step > 0 ? Math.floor(km / step) * step : 0;
  if (step > 0 && crossedDistance > session.lastAnnouncedDistanceKm + 1e-9) {
    distanceDue = crossedDistance;
  }

  // TEMPORARY test override — see DEV_FORCE_ONE_MINUTE_VOICE_TEST. Replaces
  // the user's saved time interval with a fixed 1-minute step entirely; the
  // distance interval above is untouched and still uses the real setting.
  const timeStep = DEV_FORCE_ONE_MINUTE_VOICE_TEST ? 1 : settings.timeIntervalMinutes;

  let timeDue: number | null = null;
  if (timeStep !== 'off') {
    const crossedTime = Math.floor(minutes / timeStep) * timeStep;
    if (crossedTime > 0 && crossedTime > session.lastAnnouncedTimeMinutes) {
      timeDue = crossedTime;
    }
  }

  if (distanceDue === null && timeDue === null) return;

  // Distance milestones take priority when both land on the same update — one spoken line at a time.
  const text =
    distanceDue !== null
      ? distanceAnnouncement(distanceDue, calories)
      : DEV_FORCE_ONE_MINUTE_VOICE_TEST
        ? oneMinuteTestAnnouncement(timeDue!, session.distanceMeters, calories)
        : timeAnnouncement(timeDue!, km, calories);
  // Deliberately `longlivy-tts`, not `VoiceAnnouncer`/`expo-speech` — this
  // runs from the background location task, including in a headless JS
  // context after Android has destroyed MainActivity (e.g. the app swiped
  // away in Recent Apps). `expo-speech` binds its engine to the Activity and
  // shuts it down when that Activity is destroyed, silencing the workout
  // mid-announcement; `longlivy-tts` binds to the Application context, which
  // outlives it. See LonglivyTtsModule.kt for the confirmed failure this
  // replaces.
  LonglivyTts.speak(text, { language: settings.language, volume: settings.volume }).catch(() => {
    // Best-effort — a dropped announcement should never break location tracking.
  });

  await writeLiveSession({
    ...session,
    lastAnnouncedDistanceKm: distanceDue !== null ? distanceDue : session.lastAnnouncedDistanceKm,
    lastAnnouncedTimeMinutes: timeDue !== null ? timeDue : session.lastAnnouncedTimeMinutes,
  });
}
