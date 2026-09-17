import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { BreathingScheme, Meditation, MeditationSession, MeditationTemplate, MeditationReminder, SessionEventType } from './models';
import { meditationRepository } from './repository/MockMeditationRepository';
import {
  getNotificationPermission,
  requestNotificationPermission,
  scheduleMeditationReminder,
  cancelMeditationReminderNotifications,
  getLiveScheduledNotificationIds,
} from './services/MeditationNotificationService';
import { DEMO_USER_ID } from '@/mock/demoUser';
import { generateId } from '@/utils/id';
import { RootState } from '@/store/store';

interface MeditationState {
  content: Meditation[];
  breathingSchemes: BreathingScheme[];
  favorites: string[];
  templates: MeditationTemplate[];
  reminders: MeditationReminder[];
  activeSession: MeditationSession | null;
  history: MeditationSession[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: MeditationState = {
  content: [],
  breathingSchemes: [],
  favorites: [],
  templates: [],
  reminders: [],
  activeSession: null,
  history: [],
  status: 'idle',
};

export const loadMeditationData = createAsyncThunk('meditation/loadData', async () => {
  const [content, schemes, favorites, templates, history, storedReminders] = await Promise.all([
    meditationRepository.getPublishedContent(),
    meditationRepository.getBreathingSchemes(),
    meditationRepository.getFavorites(DEMO_USER_ID),
    meditationRepository.getTemplates(DEMO_USER_ID),
    meditationRepository.getHistory(DEMO_USER_ID),
    meditationRepository.getReminders(DEMO_USER_ID),
  ]);

  // Reconciliation (Section 20): a reinstall, an OS cleanup, or a revoked
  // permission can silently invalidate a stored reminder's OS schedule
  // without the app ever being told. An `enabled` reminder that no longer
  // has ANY of its ids actually scheduled is corrected to `disabled` here —
  // never left showing as active when it truthfully isn't — and persisted
  // so the correction sticks rather than re-appearing every load.
  const liveIds = await getLiveScheduledNotificationIds();
  const reminders = await Promise.all(
    storedReminders.map(async (reminder) => {
      if (!reminder.enabled || reminder.notificationIds.length === 0) return reminder;
      const stillScheduled = reminder.notificationIds.some((id) => liveIds.has(id));
      if (stillScheduled) return reminder;
      const corrected: MeditationReminder = { ...reminder, enabled: false, notificationIds: [], updatedAt: new Date().toISOString() };
      await meditationRepository.saveReminder(corrected);
      return corrected;
    })
  );

  return { content, schemes, favorites, templates, history, reminders };
});

export const startMeditationSessionThunk = createAsyncThunk(
  'meditation/startSession',
  async (input: { meditationId: string | null; meditationTitle: string; type: MeditationSession['type']; plannedDurationSeconds: number; templateId?: string | null }) =>
    meditationRepository.startSession({ userId: DEMO_USER_ID, ...input })
);

export const recordSessionEventThunk = createAsyncThunk(
  'meditation/recordEvent',
  async (input: { sessionId: string; type: SessionEventType }) =>
    meditationRepository.recordEvent(input.sessionId, input.type)
);

export const completeMeditationSessionThunk = createAsyncThunk(
  'meditation/completeSession',
  async (input: { sessionId: string; activeDurationSeconds: number; pausedDurationSeconds: number; status: MeditationSession['status'] }) =>
    meditationRepository.completeSession(input.sessionId, input.activeDurationSeconds, input.pausedDurationSeconds, input.status)
);

export const toggleMeditationFavoriteThunk = createAsyncThunk('meditation/toggleFavorite', async (meditationId: string) =>
  meditationRepository.toggleFavorite(DEMO_USER_ID, meditationId)
);

export const saveMeditationTemplateThunk = createAsyncThunk('meditation/saveTemplate', async (template: MeditationTemplate) =>
  meditationRepository.saveTemplate(template)
);

export interface SaveMeditationReminderInput {
  /** Omit to create a new reminder. */
  id?: string;
  time: string;
  daysOfWeek: number[];
  /** What the user asked for — the thunk only persists `enabled: true` once scheduling actually succeeds (Section 10); a denied/failed permission comes back as `enabled: false` regardless of intent. */
  enabledIntent: boolean;
  notificationContent: { title: string; body: string };
}

export interface SaveMeditationReminderResult {
  reminder: MeditationReminder;
  permissionDenied: boolean;
}

/**
 * The single write path for create/edit/toggle (Sections 10-13): always
 * cancels whatever OS schedule the reminder previously had before doing
 * anything else, so re-enabling, editing, or rapidly toggling can never
 * leave a duplicate or stale schedule running underneath. Persisted
 * `enabled`/`notificationIds` always reflect what actually got scheduled,
 * never the user's raw intent.
 */
export const saveMeditationReminderThunk = createAsyncThunk<SaveMeditationReminderResult, SaveMeditationReminderInput, { state: RootState }>(
  'meditation/saveReminder',
  async (input, { getState }) => {
    const existing = input.id ? getState().meditation.reminders.find((r) => r.id === input.id) : undefined;
    if (existing?.notificationIds.length) {
      await cancelMeditationReminderNotifications(existing.notificationIds);
    }

    let enabled = false;
    let notificationIds: string[] = [];
    let permissionDenied = false;

    if (input.enabledIntent && input.daysOfWeek.length > 0) {
      let permission = await getNotificationPermission();
      if (permission === 'undetermined') {
        permission = await requestNotificationPermission();
      }
      if (permission === 'granted') {
        notificationIds = await scheduleMeditationReminder(input.daysOfWeek, input.time, input.notificationContent);
        enabled = true;
      } else {
        permissionDenied = true;
      }
    }

    const now = new Date().toISOString();
    const reminder: MeditationReminder = {
      id: input.id ?? generateId('reminder'),
      userId: DEMO_USER_ID,
      time: input.time,
      daysOfWeek: input.daysOfWeek,
      enabled,
      notificationIds,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const saved = await meditationRepository.saveReminder(reminder);
    return { reminder: saved, permissionDenied };
  }
);

export const deleteMeditationReminderThunk = createAsyncThunk<string, string, { state: RootState }>(
  'meditation/deleteReminder',
  async (id, { getState }) => {
    const existing = getState().meditation.reminders.find((r) => r.id === id);
    if (existing?.notificationIds.length) {
      await cancelMeditationReminderNotifications(existing.notificationIds);
    }
    await meditationRepository.deleteReminder(id);
    return id;
  }
);

const meditationSlice = createSlice({
  name: 'meditation',
  initialState,
  reducers: {
    clearActiveSession(state) {
      state.activeSession = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadMeditationData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadMeditationData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.content = action.payload.content;
        state.breathingSchemes = action.payload.schemes;
        state.favorites = action.payload.favorites;
        state.templates = action.payload.templates;
        state.history = action.payload.history;
        state.reminders = action.payload.reminders;
      })
      .addCase(loadMeditationData.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(startMeditationSessionThunk.fulfilled, (state, action) => {
        state.activeSession = action.payload;
      })
      .addCase(recordSessionEventThunk.fulfilled, (state, action) => {
        if (state.activeSession && state.activeSession.id === action.payload.sessionId) {
          state.activeSession.events.push(action.payload);
        }
      })
      .addCase(completeMeditationSessionThunk.fulfilled, (state, action) => {
        state.activeSession = null;
        state.history = [action.payload, ...state.history];
      })
      .addCase(toggleMeditationFavoriteThunk.fulfilled, (state, action) => {
        state.favorites = action.payload;
      })
      .addCase(saveMeditationTemplateThunk.fulfilled, (state, action) => {
        const idx = state.templates.findIndex((t) => t.id === action.payload.id);
        if (idx === -1) state.templates.push(action.payload);
        else state.templates[idx] = action.payload;
      })
      .addCase(saveMeditationReminderThunk.fulfilled, (state, action) => {
        const idx = state.reminders.findIndex((r) => r.id === action.payload.reminder.id);
        if (idx === -1) state.reminders.push(action.payload.reminder);
        else state.reminders[idx] = action.payload.reminder;
      })
      .addCase(deleteMeditationReminderThunk.fulfilled, (state, action) => {
        state.reminders = state.reminders.filter((r) => r.id !== action.payload);
      });
  },
});

export const { clearActiveSession } = meditationSlice.actions;
export default meditationSlice.reducer;
