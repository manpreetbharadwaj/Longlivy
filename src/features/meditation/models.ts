// 'individual' was previously declared here and in navigation/types.ts but never
// produced, seeded, or handled anywhere at runtime — removed rather than kept as
// dead union noise (repo-wide search confirmed zero references before removal).
export type MeditationType = 'guided' | 'free' | 'breathing';
export type MeditationContentStatus = 'draft' | 'published' | 'disabled' | 'archived';

/**
 * Canonical top-level subject a piece of content is about — orthogonal to
 * `MeditationType` (guided/free/breathing is *how* you meditate; topic is
 * *what about*) and to duration. See meditationTaxonomy.ts for labels, the
 * legacy-category migration, and icons.
 */
export type MeditationTopic = 'morning' | 'mindfulness' | 'energy' | 'focus' | 'relaxation' | 'calm' | 'stress_relief' | 'sleep';

/** Classifies the underlying sound for Unguided ({@link MeditationType} 'free') content only — meaningless for guided/breathing. */
export type UnguidedSoundCategory = 'meditation_music' | 'ambient' | 'nature';

/**
 * Catalog visibility vs. actual playability. A 'coming_soon' item is real,
 * browsable metadata (so a thin topic like Energy isn't simply absent) but
 * must never be opened in the Player — screens must check this before
 * navigating, not rely on `status` alone (a 'coming_soon' item is still
 * `status: 'published'`).
 */
export type MeditationAvailability = 'available' | 'coming_soon';

/**
 * Semantic visual mood, not an image/asset reference — configures existing
 * Player visuals (accent color, glow, particle density), never swaps in new
 * art. See meditationVisualThemes.ts for the topic-default mapping, the
 * priority-ordered resolver, and the concrete per-theme config values.
 */
export type MeditationVisualTheme = 'sunrise' | 'night' | 'calm' | 'focus' | 'ocean' | 'forest' | 'breathing';
export type SessionStatus = 'started' | 'paused' | 'resumed' | 'completed' | 'ended_prematurely' | 'cancelled';
export type SessionEventType =
  | 'started'
  | 'paused'
  | 'resumed'
  | 'stopped'
  | 'completed'
  | 'backgrounded'
  | 'foregrounded'
  | 'interrupted';

export interface BreathingScheme {
  id: string;
  name: string;
  inhaleSeconds: number;
  holdSeconds: number;
  exhaleSeconds: number;
  secondHoldSeconds: number;
  repetitions: number;
  description: string;
}

export interface Meditation {
  id: string;
  title: string;
  description: string;
  category: MeditationTopic;
  type: MeditationType;
  durationSeconds: number;
  audioReference?: string;
  language: 'en' | 'de';
  status: MeditationContentStatus;
  version: string;
  source?: string;
  /** Only meaningful when `type === 'free'`; omitted for guided/breathing content. */
  soundCategory?: UnguidedSoundCategory;
  /** Defaults to 'available' when omitted — only 'coming_soon' needs to be set explicitly. */
  availability?: MeditationAvailability;
  /** Explicit override — omitted on every current row, which falls back to its topic's default theme (see getMeditationVisualTheme). */
  visualTheme?: MeditationVisualTheme;
}

export interface MeditationTemplate {
  id: string;
  userId: string;
  name: string;
  durationSeconds: number;
  type: MeditationType;
  breathingEnabled: boolean;
  closingSoundEnabled: boolean;
  backgroundSound?: string;
}

export interface MeditationSessionEvent {
  id: string;
  sessionId: string;
  type: SessionEventType;
  timestamp: string;
}

export interface MeditationSession {
  id: string;
  userId: string;
  meditationId: string | null;
  meditationTitle: string;
  type: MeditationType;
  templateId: string | null;
  plannedDurationSeconds: number;
  activeDurationSeconds: number;
  pausedDurationSeconds: number;
  startedAt: string;
  endedAt: string | null;
  status: SessionStatus;
  events: MeditationSessionEvent[];
  createdAt: string;
}

/** Canonical, ordered topic list — replaces the old free-form `MEDITATION_CATEGORIES` string list (see meditationTaxonomy.ts for the legacy mapping). */
export const MEDITATION_TOPICS: MeditationTopic[] = ['morning', 'mindfulness', 'energy', 'focus', 'relaxation', 'calm', 'stress_relief', 'sleep'];

/**
 * Canonical discovery/browse duration filters (5/15/30/45/60 min) — deliberately
 * separate from any individual session's real `durationSeconds`, which may be
 * 3, 10, or any other value the actual content/audio dictates. Never used to
 * relabel a session's true duration.
 */
export const MEDITATION_DURATION_PRESETS_SECONDS = [300, 900, 1800, 2700, 3600];

export const MIN_STREAK_ACTIVE_SECONDS = 60;

/**
 * A real, OS-scheduled Meditation reminder — replaces the earlier
 * component-local-only mock (Phase 6). `daysOfWeek` uses JS `Date.getDay()`
 * convention (0=Sunday..6=Saturday), NOT the 1-7/Sunday=1 convention
 * `expo-notifications`' `WeeklyTriggerInput` expects internally — the one
 * conversion point lives in MeditationNotificationService, never duplicated.
 */
export interface MeditationReminder {
  id: string;
  userId: string;
  /** 'HH:mm', 24-hour, local device time — no timezone stored; recurring notifications follow whatever the device's local time/timezone is at fire time (see MeditationNotificationService's doc comment for what that means if the device timezone changes). */
  time: string;
  /** 0=Sunday..6=Saturday. At least one entry whenever `enabled` is true. */
  daysOfWeek: number[];
  /** True only once every day in `daysOfWeek` has a confirmed OS schedule — never set true optimistically before scheduling succeeds (Section 10). */
  enabled: boolean;
  /** One OS notification id per scheduled weekday — `WeeklyTriggerInput` accepts exactly one weekday per trigger, so "Mon/Wed/Fri" is 3 underlying schedules represented here as one product reminder. Empty when disabled. */
  notificationIds: string[];
  createdAt: string;
  updatedAt: string;
}
