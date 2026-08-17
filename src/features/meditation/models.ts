export type MeditationType = 'guided' | 'free' | 'breathing' | 'individual';
export type MeditationContentStatus = 'draft' | 'published' | 'disabled' | 'archived';
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
  category: string;
  type: MeditationType;
  durationSeconds: number;
  audioReference?: string;
  language: 'en' | 'de';
  status: MeditationContentStatus;
  version: string;
  source?: string;
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

export const MEDITATION_CATEGORIES = [
  'Relaxation',
  'Stress reduction',
  'Mindfulness',
  'Breathing',
  'Fall asleep',
  'Morning',
  'Concentration',
  'Short break',
  'Body awareness',
  'Evening',
];

export const DURATION_OPTIONS_SECONDS = [180, 300, 600, 900, 1200, 1800];
export const MIN_STREAK_ACTIVE_SECONDS = 60;
