import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { Meditation, MeditationTopic, MeditationType, UnguidedSoundCategory, MIN_STREAK_ACTIVE_SECONDS } from './models';

export const selectMeditationContent = (state: RootState) => state.meditation.content;
export const selectBreathingSchemes = (state: RootState) => state.meditation.breathingSchemes;
export const selectMeditationFavorites = (state: RootState) => state.meditation.favorites;
export const selectMeditationTemplates = (state: RootState) => state.meditation.templates;
export const selectActiveMeditationSession = (state: RootState) => state.meditation.activeSession;
export const selectMeditationHistory = (state: RootState) => state.meditation.history;
export const selectMeditationReminders = (state: RootState) => state.meditation.reminders;

export interface MeditationFilters {
  mode?: MeditationType;
  topic?: MeditationTopic;
  durationSeconds?: number;
  soundCategory?: UnguidedSoundCategory;
  /** Discovery shows Coming Soon rows by default (badged, non-playable) — pass false to hide them entirely. */
  includeComingSoon?: boolean;
}

/**
 * Centralized AND-combination filter for Meditation discovery — a plain
 * function rather than a `createSelector` memoized selector, since its
 * filter argument is a fresh object per call site/render rather than a
 * stable piece of Redux state; callers memoize the result themselves (e.g.
 * via `useMemo`) the same way screens already did before this helper existed.
 * `soundCategory` only ever excludes 'free' rows — a guided/breathing row is
 * never filtered out merely for lacking a sound category.
 */
export function selectMeditationsByFilters(content: Meditation[], filters: MeditationFilters): Meditation[] {
  return content.filter((m) => {
    if (filters.mode && m.type !== filters.mode) return false;
    if (filters.topic && m.category !== filters.topic) return false;
    if (filters.durationSeconds != null && m.durationSeconds !== filters.durationSeconds) return false;
    if (filters.soundCategory && m.type === 'free' && m.soundCategory !== filters.soundCategory) return false;
    if (filters.includeComingSoon === false && m.availability === 'coming_soon') return false;
    return true;
  });
}

export const selectFavoriteMeditations = createSelector(
  selectMeditationContent,
  selectMeditationFavorites,
  (content, favoriteIds) => content.filter((m) => favoriteIds.includes(m.id))
);

export const selectTodayMeditationSeconds = createSelector(selectMeditationHistory, (history) => {
  const today = new Date().toDateString();
  return history
    .filter((s) => new Date(s.startedAt).toDateString() === today)
    .reduce((sum, s) => sum + s.activeDurationSeconds, 0);
});

export const selectMeditationStreak = createSelector(selectMeditationHistory, (history) => {
  const validDays = new Set(
    history
      .filter((s) => s.activeDurationSeconds >= MIN_STREAK_ACTIVE_SECONDS)
      .map((s) => new Date(s.startedAt).toDateString())
  );

  let streak = 0;
  const cursor = new Date();
  // If today has no valid session yet, streak counts up to yesterday.
  if (!validDays.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (validDays.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
});

export const selectMeditationStats = createSelector(selectMeditationHistory, (history) => {
  const totalSessions = history.length;
  const totalActiveSeconds = history.reduce((s, h) => s + h.activeDurationSeconds, 0);
  const longest = history.reduce((max, h) => Math.max(max, h.activeDurationSeconds), 0);
  return {
    totalSessions,
    totalActiveSeconds,
    averageSeconds: totalSessions ? Math.round(totalActiveSeconds / totalSessions) : 0,
    longestSessionSeconds: longest,
  };
});
