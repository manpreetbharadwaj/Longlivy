import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { BreathingScheme, Meditation, MeditationSession, MeditationTemplate, SessionEventType } from './models';
import { meditationRepository } from './repository/MockMeditationRepository';
import { DEMO_USER_ID } from '@/mock/demoUser';

interface MeditationState {
  content: Meditation[];
  breathingSchemes: BreathingScheme[];
  favorites: string[];
  templates: MeditationTemplate[];
  activeSession: MeditationSession | null;
  history: MeditationSession[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: MeditationState = {
  content: [],
  breathingSchemes: [],
  favorites: [],
  templates: [],
  activeSession: null,
  history: [],
  status: 'idle',
};

export const loadMeditationData = createAsyncThunk('meditation/loadData', async () => {
  const [content, schemes, favorites, templates, history] = await Promise.all([
    meditationRepository.getPublishedContent(),
    meditationRepository.getBreathingSchemes(),
    meditationRepository.getFavorites(DEMO_USER_ID),
    meditationRepository.getTemplates(DEMO_USER_ID),
    meditationRepository.getHistory(DEMO_USER_ID),
  ]);
  return { content, schemes, favorites, templates, history };
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
      });
  },
});

export const { clearActiveSession } = meditationSlice.actions;
export default meditationSlice.reducer;
