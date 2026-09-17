import * as Speech from 'expo-speech';

/**
 * Thin wrapper around `expo-speech` so the rest of the Activity feature
 * never imports the TTS library directly — isolates the engine the same
 * way `GpsTrackingService` isolates `expo-location`, and gives the
 * pre-start countdown and Voice Coach one shared place to change rate/voice
 * or swap engines later.
 */
export function announce(text: string, rate = 1.0): void {
  Speech.speak(text, { rate });
}

/** Stops whatever is currently speaking and clears anything queued — used when a countdown is cancelled so no stray announcement fires after the user backs out. */
export function stopAnnouncements(): void {
  Speech.stop();
}
