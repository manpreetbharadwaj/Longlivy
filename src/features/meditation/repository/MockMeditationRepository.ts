import { MeditationRepository } from './MeditationRepository';
import { Meditation, MeditationSession, MeditationSessionEvent, MeditationTemplate, BreathingScheme, SessionEventType } from '../models';
import { LocalStore } from '@/services/storage/LocalStore';
import { generateId } from '@/utils/id';
import { MEDITATION_CONTENT_SEED, BREATHING_SCHEMES_SEED, MEDITATION_SESSION_SEED } from '@/mock/meditationSeed';

interface MeditationDb {
  content: Meditation[];
  schemes: BreathingScheme[];
  sessions: MeditationSession[];
  templates: MeditationTemplate[];
  favorites: Record<string, string[]>;
}

const store = new LocalStore<MeditationDb>('@longlivy/meditation_db', {
  content: MEDITATION_CONTENT_SEED,
  schemes: BREATHING_SCHEMES_SEED,
  sessions: MEDITATION_SESSION_SEED,
  templates: [],
  favorites: {},
});

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class MockMeditationRepository implements MeditationRepository {
  async getPublishedContent(): Promise<Meditation[]> {
    const db = await store.read();
    return delay(db.content.filter((m) => m.status === 'published'));
  }

  async getBreathingSchemes(): Promise<BreathingScheme[]> {
    const db = await store.read();
    return delay(db.schemes);
  }

  async getFavorites(userId: string): Promise<string[]> {
    const db = await store.read();
    return delay(db.favorites[userId] ?? []);
  }

  async toggleFavorite(userId: string, meditationId: string): Promise<string[]> {
    const db = await store.read();
    const current = db.favorites[userId] ?? [];
    db.favorites[userId] = current.includes(meditationId)
      ? current.filter((id) => id !== meditationId)
      : [...current, meditationId];
    await store.write(db);
    return delay(db.favorites[userId]);
  }

  async getTemplates(userId: string): Promise<MeditationTemplate[]> {
    const db = await store.read();
    return delay(db.templates.filter((t) => t.userId === userId));
  }

  async saveTemplate(template: MeditationTemplate): Promise<MeditationTemplate> {
    const db = await store.read();
    const idx = db.templates.findIndex((t) => t.id === template.id);
    if (idx === -1) db.templates.push(template);
    else db.templates[idx] = template;
    await store.write(db);
    return delay(template);
  }

  async deleteTemplate(id: string): Promise<void> {
    const db = await store.read();
    db.templates = db.templates.filter((t) => t.id !== id);
    await store.write(db);
  }

  async startSession(input: {
    userId: string;
    meditationId: string | null;
    meditationTitle: string;
    type: MeditationSession['type'];
    plannedDurationSeconds: number;
    templateId?: string | null;
  }): Promise<MeditationSession> {
    const db = await store.read();
    const now = new Date().toISOString();
    const session: MeditationSession = {
      id: generateId('medsession'),
      userId: input.userId,
      meditationId: input.meditationId,
      meditationTitle: input.meditationTitle,
      type: input.type,
      templateId: input.templateId ?? null,
      plannedDurationSeconds: input.plannedDurationSeconds,
      activeDurationSeconds: 0,
      pausedDurationSeconds: 0,
      startedAt: now,
      endedAt: null,
      status: 'started',
      events: [{ id: generateId('medevent'), sessionId: '', type: 'started', timestamp: now }],
      createdAt: now,
    };
    session.events[0].sessionId = session.id;
    db.sessions.unshift(session);
    await store.write(db);
    return delay(session);
  }

  async recordEvent(sessionId: string, type: SessionEventType): Promise<MeditationSessionEvent> {
    const db = await store.read();
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error('Session not found');
    const event: MeditationSessionEvent = { id: generateId('medevent'), sessionId, type, timestamp: new Date().toISOString() };
    session.events.push(event);
    if (type === 'paused') session.status = 'paused';
    if (type === 'resumed') session.status = 'started';
    await store.write(db);
    return delay(event);
  }

  async completeSession(
    sessionId: string,
    activeDurationSeconds: number,
    pausedDurationSeconds: number,
    status: MeditationSession['status']
  ): Promise<MeditationSession> {
    const db = await store.read();
    const idx = db.sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) throw new Error('Session not found');
    const updated: MeditationSession = {
      ...db.sessions[idx],
      activeDurationSeconds,
      pausedDurationSeconds,
      status,
      endedAt: new Date().toISOString(),
    };
    db.sessions[idx] = updated;
    await store.write(db);
    return delay(updated);
  }

  async getHistory(userId: string): Promise<MeditationSession[]> {
    const db = await store.read();
    return delay(
      db.sessions
        .filter((s) => s.userId === userId && s.status !== 'started' && s.status !== 'paused')
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    );
  }
}

export const meditationRepository: MeditationRepository = new MockMeditationRepository();
