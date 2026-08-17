import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { MIN_STREAK_ACTIVE_SECONDS } from './models';

export const selectMeditationContent = (state: RootState) => state.meditation.content;
export const selectBreathingSchemes = (state: RootState) => state.meditation.breathingSchemes;
export const selectMeditationFavorites = (state: RootState) => state.meditation.favorites;
export const selectMeditationTemplates = (state: RootState) => state.meditation.templates;
export const selectActiveMeditationSession = (state: RootState) => state.meditation.activeSession;
export const selectMeditationHistory = (state: RootState) => state.meditation.history;

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
