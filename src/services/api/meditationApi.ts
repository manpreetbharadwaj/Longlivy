import { apiRequest, apiRequestParsed } from './apiClient';
import { API_ENDPOINTS } from './apiConfig';
import { dataList, dataRecord, dataRecordOrNull, hhmm, id, isRecord, num, RecordValue, str } from './laravel';
import { ApiError } from '@/utils/apiError';
import { Meditation, MeditationTopic, MeditationType, MEDITATION_TOPICS } from '@/features/meditation/models';
import { loadAllPages } from './pagination';

/**
 * Meditation content, sessions and reminders.
 *
 * Sessions and reminders were verified against the live API on 2026-10-08.
 * The content catalog (GET /meditation, /meditation/categories) is live but
 * EMPTY on the server, so the content mapper below could not be verified
 * against a real record: it accepts the field names proposed in
 * MEDITATION_BACKEND_CONTRACT.md plus common variants, and an item without
 * an https audio URL is never marked playable.
 */

const TYPES: MeditationType[] = ['guided', 'free', 'breathing'];

function firstHttps(...values: unknown[]): string | undefined {
  for (const value of values) {
    const url = str(value);
    if (url && /^https:\/\//i.test(url)) return url;
  }
  return undefined;
}

function topic(raw: RecordValue): MeditationTopic {
  const category = isRecord(raw.category) ? raw.category : undefined;
  const candidate = (str(category?.slug) ?? str(raw.category_id) ?? str(raw.category) ?? str(raw.topic) ?? '').toLowerCase().replace(/[\s-]+/g, '_');
  return (MEDITATION_TOPICS as string[]).includes(candidate) ? (candidate as MeditationTopic) : 'mindfulness';
}

export function mapMeditationContent(raw: RecordValue): Meditation {
  const title = str(raw.title) ?? str(raw.name);
  if (!title) throw new ApiError({ kind: 'malformed' });
  const audio = isRecord(raw.audio) ? raw.audio : {};
  const audioUrl = firstHttps(audio.url, raw.audio_url, raw.stream_url, raw.file_url);
  const type = str(raw.type) as MeditationType | undefined;
  const durationSeconds =
    num(raw.duration_seconds) ?? num(audio.duration_seconds) ?? ((num(raw.duration_minutes) ?? num(raw.duration) ?? 0) * 60);
  return {
    id: id(raw.id),
    title,
    description: str(raw.description) ?? '',
    category: topic(raw),
    type: type && TYPES.includes(type) ? type : 'guided',
    durationSeconds,
    audioUrl,
    audioExpiresAt: str(audio.expires_at) ?? str(raw.audio_expires_at) ?? null,
    thumbnailUrl: firstHttps(raw.thumbnail_url, raw.image_url, raw.thumbnail),
    language: str(raw.language) === 'de' ? 'de' : 'en',
    status: 'published',
    version: str(raw.version) ?? '1',
    source: str(raw.source),
    contentSource: 'server',
    // Never let a row without real audio open the player.
    availability: audioUrl ? 'available' : 'coming_soon',
  };
}

function listContents(): Promise<Meditation[]> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.meditation.contents }, (body) =>
    dataList(body, 'meditations').map(mapMeditationContent),
  );
}

/** Re-fetches one item — used to refresh an expired signed audio URL. */
function getContent(meditationId: string): Promise<Meditation> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.meditation.byId(meditationId) }, (body) => mapMeditationContent(dataRecord(body, 'meditation')));
}

// --- sessions --------------------------------------------------------------

/**
 * `{ id, meditation, type, status: active|paused|completed|cancelled,
 *    planned_minutes, actual_minutes, started_at, ended_at, paused_at,
 *    elapsed_seconds, ... }`
 */
export interface ApiMeditationSession {
  id: string;
  meditationId: string | null;
  meditationTitle: string | null;
  type: MeditationType;
  status: string;
  plannedMinutes: number;
  startedAt: string;
  endedAt: string | null;
  elapsedSeconds: number;
  createdAt: string;
}

function mapSession(raw: RecordValue): ApiMeditationSession {
  const startedAt = str(raw.started_at);
  if (!startedAt) throw new ApiError({ kind: 'malformed' });
  const meditation = isRecord(raw.meditation) ? raw.meditation : null;
  const type = str(raw.type) as MeditationType | undefined;
  return {
    id: id(raw.id),
    meditationId: meditation ? str(meditation.id) ?? null : null,
    meditationTitle: (meditation ? str(meditation.title) : undefined) ?? str(raw.title) ?? null,
    type: type && TYPES.includes(type) ? type : 'guided',
    status: str(raw.status) ?? 'active',
    plannedMinutes: num(raw.planned_minutes) ?? 0,
    startedAt,
    endedAt: str(raw.ended_at) ?? null,
    elapsedSeconds: num(raw.elapsed_seconds) ?? 0,
    createdAt: str(raw.created_at) ?? startedAt,
  };
}

const sessionBody = (body: unknown) => mapSession(dataRecord(body, 'session'));

function listSessions(): Promise<ApiMeditationSession[]> {
  return loadAllPages({ method: 'GET', url: API_ENDPOINTS.meditation.sessions }, 'sessions', mapSession);
}

function activeSession(): Promise<ApiMeditationSession | null> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.meditation.activeSession }, (body) => {
    const raw = dataRecordOrNull(body, 'session');
    return raw ? mapSession(raw) : null;
  });
}

/**
 * `planned_minutes` is an integer >= 1; `meditation_id` and `template_id` must be
 * server (integer) ids. `title` keeps bundled tracks identifiable server-side.
 */
function startSession(input: { type: MeditationType; plannedMinutes: number; meditationId?: string; templateId?: string; title?: string }): Promise<ApiMeditationSession> {
  const data: RecordValue = { type: input.type, planned_minutes: Math.max(1, Math.round(input.plannedMinutes)) };
  if (input.meditationId) data.meditation_id = Number(input.meditationId);
  if (input.templateId) data.template_id = Number(input.templateId);
  if (input.title) data.title = input.title;
  return apiRequestParsed({ method: 'POST', url: API_ENDPOINTS.meditation.sessions, data }, sessionBody);
}

function sessionAction(sessionId: string, action: 'pause' | 'resume' | 'complete' | 'cancel'): Promise<ApiMeditationSession> {
  return apiRequestParsed({ method: 'POST', url: API_ENDPOINTS.meditation.sessionAction(sessionId, action), data: {} }, sessionBody);
}

/** True for the 422 returned when another session is still running. */
export function isSessionInProgressError(error: unknown): boolean {
  return error instanceof ApiError && error.kind === 'validation' && !!error.validationErrors && 'session' in error.validationErrors;
}

// --- reminders --------------------------------------------------------------

export interface ApiReminder {
  id: string;
  time: string;
  daysOfWeek: number[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/** `{ id, time: "07:30" | "08:00:00", days_of_week: "1,3,5", days: [1,3,5], label, enabled }` */
function mapReminder(raw: RecordValue): ApiReminder {
  const time = hhmm(raw.time);
  if (!time) throw new ApiError({ kind: 'malformed' });
  const daySource = Array.isArray(raw.days_of_week) ? raw.days_of_week : Array.isArray(raw.days) ? raw.days : (str(raw.days_of_week) ?? '').split(',');
  const days = [...new Set(daySource.map(num).filter((d): d is number => d !== undefined && Number.isInteger(d) && d >= 0 && d <= 6))].sort((a, b) => a - b);
  const now = new Date().toISOString();
  return { id: id(raw.id), time, daysOfWeek: days, enabled: raw.enabled !== false, createdAt: str(raw.created_at) ?? now, updatedAt: str(raw.updated_at) ?? now };
}

function listReminders(): Promise<ApiReminder[]> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.meditation.reminders }, (body) => dataList(body, 'reminders').map(mapReminder));
}

/** The current contract accepts an integer array or comma string; use the typed array form. */
function saveReminder(reminderId: string | null, input: { time: string; daysOfWeek: number[]; enabled: boolean }): Promise<ApiReminder> {
  const time = hhmm(input.time);
  const daysOfWeek = [...new Set(input.daysOfWeek)].sort((a, b) => a - b);
  if (!time || daysOfWeek.length === 0 || daysOfWeek.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
    return Promise.reject(new ApiError({ kind: 'validation', message: 'Choose a valid time and weekdays.' }));
  }
  const data = { time, days_of_week: daysOfWeek, enabled: input.enabled };
  return apiRequestParsed(
    reminderId ? { method: 'PUT', url: API_ENDPOINTS.meditation.reminder(reminderId), data } : { method: 'POST', url: API_ENDPOINTS.meditation.reminders, data },
    (body) => mapReminder(dataRecord(body, 'reminder')),
  );
}

async function deleteReminder(reminderId: string): Promise<void> {
  await apiRequest({ method: 'DELETE', url: API_ENDPOINTS.meditation.reminder(reminderId) });
}

// --- custom templates -------------------------------------------------------

/**
 * `/meditation/templates` — not in the API document; verified 2026-10-19:
 * GET (list), POST, PUT/DELETE by id (no GET by id). `type` is
 * guided|free|breathing; `meditation_id` must be a server meditation.
 */
export interface ApiTemplate {
  id: string;
  name: string;
  durationSeconds: number;
  type: MeditationType;
  breathingEnabled: boolean;
  closingSoundEnabled: boolean;
  backgroundSound: string | null;
  meditationId: string | null;
}

export interface ApiTemplateInput {
  name: string;
  durationSeconds: number;
  type: MeditationType;
  breathingEnabled: boolean;
  closingSoundEnabled: boolean;
  backgroundSound?: string;
  meditationId?: string;
}

function mapTemplate(raw: RecordValue): ApiTemplate {
  const name = str(raw.name);
  const durationSeconds = num(raw.duration_seconds);
  if (!name || durationSeconds === undefined) throw new ApiError({ kind: 'malformed' });
  const type = str(raw.type) as MeditationType | undefined;
  return {
    id: id(raw.id),
    name,
    durationSeconds,
    type: type && TYPES.includes(type) ? type : 'free',
    breathingEnabled: raw.breathing_enabled === true,
    closingSoundEnabled: raw.closing_sound_enabled === true,
    backgroundSound: str(raw.background_sound) ?? null,
    meditationId: str(raw.meditation_id) ?? null,
  };
}

function templateWire(input: ApiTemplateInput): RecordValue {
  return {
    name: input.name,
    duration_seconds: Math.max(1, Math.round(input.durationSeconds)),
    type: input.type,
    breathing_enabled: input.breathingEnabled,
    closing_sound_enabled: input.closingSoundEnabled,
    background_sound: input.backgroundSound ?? null,
    meditation_id: input.meditationId ? Number(input.meditationId) : null,
  };
}

function listTemplates(): Promise<ApiTemplate[]> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.meditation.templates }, (body) => dataList(body, 'templates').map(mapTemplate));
}

function saveTemplate(templateId: string | null, input: ApiTemplateInput): Promise<ApiTemplate> {
  const data = templateWire(input);
  return apiRequestParsed(
    templateId ? { method: 'PUT', url: API_ENDPOINTS.meditation.template(templateId), data } : { method: 'POST', url: API_ENDPOINTS.meditation.templates, data },
    (body) => mapTemplate(dataRecord(body, 'template')),
  );
}

async function deleteTemplate(templateId: string): Promise<void> {
  await apiRequest({ method: 'DELETE', url: API_ENDPOINTS.meditation.template(templateId) });
}

export const meditationApi = {
  listContents,
  getContent,
  listSessions,
  activeSession,
  startSession,
  sessionAction,
  listReminders,
  saveReminder,
  deleteReminder,
  listTemplates,
  saveTemplate,
  deleteTemplate,
};
