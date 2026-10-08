import { MeditationRepository } from './MeditationRepository';
import {
  BreathingScheme,
  Meditation,
  MeditationReminder,
  MeditationSession,
  MeditationSessionEvent,
  MeditationTemplate,
  MIN_STREAK_ACTIVE_SECONDS,
  SessionEventType,
} from '../models';
import { normalizeLegacyMeditationTopic } from '../meditationTaxonomy';
import { ApiMeditationSession, isSessionInProgressError, meditationApi } from '@/services/api/meditationApi';
import { isServerId, nutritionApi } from '@/services/api/nutritionApi';
import { LocalStore } from '@/services/storage/LocalStore';
import { generateId } from '@/utils/id';
import { BREATHING_SCHEMES_SEED, MEDITATION_CONTENT_SEED } from '@/mock/meditationSeed';

/**
 * Sessions, reminders and favorites of server content go to the API.
 *
 * Content: the backend catalog is live but empty, and no record has been seen
 * with an audio URL. Until it returns playable items, the bundled catalog
 * (13 tracks shipped in the app, `contentSource: 'bundled'`) is used so the
 * feature stays usable. This is an explicit, reported interim — see
 * MEDITATION_BACKEND_CONTRACT.md — not a mock: bundled rows play real audio
 * and every session is still recorded server-side.
 *
 * Breathing schemes and custom templates have no backend endpoint and stay
 * device-local, scoped to the signed-in user.
 */

/** Per-session detail the API has no column for (title of a bundled track, template, client-measured durations, event log). */
interface SessionMeta {
  meditationId: string | null;
  meditationTitle: string;
  templateId: string | null;
  plannedDurationSeconds: number;
  activeDurationSeconds?: number;
  pausedDurationSeconds?: number;
  events: MeditationSessionEvent[];
}

interface LocalDb {
  sessionMeta: Record<string, SessionMeta>;
  /** OS notification ids per server reminder id — they only exist on this device. */
  reminderNotificationIds: Record<string, string[]>;
  /** userId -> favorited bundled meditation ids (the server can only favorite its own records). */
  bundledFavorites: Record<string, string[]>;
  templates: MeditationTemplate[];
}

const local = new LocalStore<LocalDb>('@longlivy/meditation_api_local', {
  sessionMeta: {},
  reminderNotificationIds: {},
  bundledFavorites: {},
  templates: [],
});

const BUNDLED: Meditation[] = MEDITATION_CONTENT_SEED.filter((m) => m.status === 'published').map((m) => ({
  ...m,
  category: normalizeLegacyMeditationTopic(m.category, m.id),
  contentSource: 'bundled' as const,
}));

function sessionStatus(server: ApiMeditationSession, meta: SessionMeta | undefined): MeditationSession['status'] {
  switch (server.status) {
    case 'completed':
      return 'completed';
    case 'paused':
      return 'paused';
    case 'cancelled': {
      // The app ends early sessions under a minute as 'cancelled' and longer ones via /complete.
      return (meta?.activeDurationSeconds ?? server.elapsedSeconds) >= MIN_STREAK_ACTIVE_SECONDS ? 'ended_prematurely' : 'cancelled';
    }
    default:
      return 'started';
  }
}

function toSession(server: ApiMeditationSession, userId: string, meta: SessionMeta | undefined): MeditationSession {
  const active = meta?.activeDurationSeconds ?? server.elapsedSeconds;
  return {
    id: server.id,
    userId,
    meditationId: meta?.meditationId ?? server.meditationId,
    meditationTitle: meta?.meditationTitle ?? server.meditationTitle ?? '',
    type: server.type,
    templateId: meta?.templateId ?? null,
    plannedDurationSeconds: meta?.plannedDurationSeconds ?? server.plannedMinutes * 60,
    activeDurationSeconds: active,
    pausedDurationSeconds: meta?.pausedDurationSeconds ?? 0,
    startedAt: server.startedAt,
    endedAt: server.endedAt,
    status: sessionStatus(server, meta),
    events: meta?.events ?? [],
    createdAt: server.createdAt,
  };
}

export class ApiMeditationRepository implements MeditationRepository {
  private userId = '';

  private async updateLocal(mutate: (db: LocalDb) => LocalDb): Promise<LocalDb> {
    const next = mutate(await local.read());
    await local.write(next);
    return next;
  }

  async getPublishedContent(): Promise<Meditation[]> {
    const server = await meditationApi.listContents();
    return server.length > 0 ? server : BUNDLED;
  }

  async getBreathingSchemes(): Promise<BreathingScheme[]> {
    return BREATHING_SCHEMES_SEED;
  }

  async getFavorites(userId: string): Promise<string[]> {
    const [favorites, db] = await Promise.all([nutritionApi.listFavorites(), local.read()]);
    const server = favorites.filter((f) => f.type === 'meditation').map((f) => f.targetId);
    return [...server, ...(db.bundledFavorites[userId] ?? [])];
  }

  async toggleFavorite(userId: string, meditationId: string): Promise<string[]> {
    if (isServerId(meditationId)) {
      const existing = (await nutritionApi.listFavorites()).find((f) => f.type === 'meditation' && f.targetId === meditationId);
      if (existing) await nutritionApi.removeFavorite(existing.id);
      else await nutritionApi.addFavorite('meditation', meditationId);
    } else {
      await this.updateLocal((db) => {
        const current = db.bundledFavorites[userId] ?? [];
        const next = current.includes(meditationId) ? current.filter((x) => x !== meditationId) : [...current, meditationId];
        return { ...db, bundledFavorites: { ...db.bundledFavorites, [userId]: next } };
      });
    }
    return this.getFavorites(userId);
  }

  async getTemplates(userId: string): Promise<MeditationTemplate[]> {
    return (await local.read()).templates.filter((t) => t.userId === userId);
  }

  async saveTemplate(template: MeditationTemplate): Promise<MeditationTemplate> {
    await this.updateLocal((db) => ({
      ...db,
      templates: db.templates.some((t) => t.id === template.id) ? db.templates.map((t) => (t.id === template.id ? template : t)) : [...db.templates, template],
    }));
    return template;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    await this.updateLocal((db) => ({ ...db, templates: db.templates.filter((t) => t.id !== templateId) }));
  }

  async getReminders(userId: string): Promise<MeditationReminder[]> {
    const [reminders, db] = await Promise.all([meditationApi.listReminders(), local.read()]);
    return reminders.map((r) => ({ ...r, userId, notificationIds: db.reminderNotificationIds[r.id] ?? [] }));
  }

  /** A reminder the server hasn't seen yet carries a client id (`reminder_…`) and is created. */
  async saveReminder(reminder: MeditationReminder): Promise<MeditationReminder> {
    const saved = await meditationApi.saveReminder(isServerId(reminder.id) ? reminder.id : null, reminder);
    await this.updateLocal((db) => ({ ...db, reminderNotificationIds: { ...db.reminderNotificationIds, [saved.id]: reminder.notificationIds } }));
    return { ...saved, userId: reminder.userId, notificationIds: reminder.notificationIds };
  }

  async deleteReminder(reminderId: string): Promise<void> {
    if (isServerId(reminderId)) await meditationApi.deleteReminder(reminderId);
    await this.updateLocal((db) => {
      const { [reminderId]: _removed, ...rest } = db.reminderNotificationIds;
      return { ...db, reminderNotificationIds: rest };
    });
  }

  async startSession(input: Parameters<MeditationRepository['startSession']>[0]): Promise<MeditationSession> {
    this.userId = input.userId;
    const request = {
      type: input.type,
      plannedMinutes: input.plannedDurationSeconds / 60,
      meditationId: isServerId(input.meditationId) ? input.meditationId : undefined,
    };
    let server: ApiMeditationSession;
    try {
      server = await meditationApi.startSession(request);
    } catch (error) {
      // A session orphaned by a crash/force-quit blocks every new start; the
      // app holds at most one live session, so the stale one is cancelled.
      if (!isSessionInProgressError(error)) throw error;
      const stale = await meditationApi.activeSession();
      if (!stale) throw error;
      await meditationApi.sessionAction(stale.id, 'cancel');
      server = await meditationApi.startSession(request);
    }
    const now = new Date().toISOString();
    const meta: SessionMeta = {
      meditationId: input.meditationId,
      meditationTitle: input.meditationTitle,
      templateId: input.templateId ?? null,
      plannedDurationSeconds: input.plannedDurationSeconds,
      events: [{ id: generateId('medevent'), sessionId: server.id, type: 'started', timestamp: now }],
    };
    await this.updateLocal((db) => ({ ...db, sessionMeta: { ...db.sessionMeta, [server.id]: meta } }));
    return toSession(server, input.userId, meta);
  }

  /** pause/resume are server state transitions; other events are kept in the local event log only. */
  async recordEvent(sessionId: string, type: SessionEventType): Promise<MeditationSessionEvent> {
    if (type === 'paused') await meditationApi.sessionAction(sessionId, 'pause');
    if (type === 'resumed') await meditationApi.sessionAction(sessionId, 'resume');
    const event: MeditationSessionEvent = { id: generateId('medevent'), sessionId, type, timestamp: new Date().toISOString() };
    await this.updateLocal((db) => {
      const meta = db.sessionMeta[sessionId];
      return meta ? { ...db, sessionMeta: { ...db.sessionMeta, [sessionId]: { ...meta, events: [...meta.events, event] } } } : db;
    });
    return event;
  }

  /**
   * `completed` → POST /complete. An early exit with at least
   * MIN_STREAK_ACTIVE_SECONDS of practice is also completed (the server then
   * records actual minutes); anything shorter is cancelled.
   */
  async completeSession(sessionId: string, activeDurationSeconds: number, pausedDurationSeconds: number, status: MeditationSession['status']): Promise<MeditationSession> {
    const counts = status === 'completed' || (status === 'ended_prematurely' && activeDurationSeconds >= MIN_STREAK_ACTIVE_SECONDS);
    const server = await meditationApi.sessionAction(sessionId, counts ? 'complete' : 'cancel');
    const db = await this.updateLocal((current) => {
      const meta = current.sessionMeta[sessionId];
      return meta ? { ...current, sessionMeta: { ...current.sessionMeta, [sessionId]: { ...meta, activeDurationSeconds, pausedDurationSeconds } } } : current;
    });
    return { ...toSession(server, this.userId, db.sessionMeta[sessionId]), status };
  }

  async getHistory(userId: string): Promise<MeditationSession[]> {
    this.userId = userId;
    const [sessions, db] = await Promise.all([meditationApi.listSessions(), local.read()]);
    return sessions
      .filter((s) => s.status === 'completed' || s.status === 'cancelled')
      .map((s) => toSession(s, userId, db.sessionMeta[s.id]))
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }
}
