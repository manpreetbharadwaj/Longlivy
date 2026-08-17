import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';

export const selectNotificationSettings = (state: RootState) => state.notification.settings;
export const selectNotifications = (state: RootState) => state.notification.items;
export const selectUnreadNotificationCount = createSelector(
  selectNotifications,
  (items) => items.filter((i) => !i.read).length
);
