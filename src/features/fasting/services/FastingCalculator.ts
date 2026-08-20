import { FastingSession } from '../models';

/**
 * Pure, framework-free calculations for the fasting timer.
 * Never store a continuously-changing "elapsed" value in Redux — derive it
 * from timestamps on every render/tick instead.
 */

export interface FastingProgress {
  elapsedMs: number;
  totalMs: number;
  remainingMs: number;
  progress: number; // 0..1, can exceed 1 if overdue
  isOverdue: boolean;
  currentFastingDay: number; // 1-indexed
}

export function calculateFastingProgress(
  startTimestamp: string,
  plannedEndTimestamp: string,
  currentTimestamp: number = Date.now()
): FastingProgress {
  const start = new Date(startTimestamp).getTime();
  const end = new Date(plannedEndTimestamp).getTime();
  const totalMs = Math.max(end - start, 1);
  const elapsedMs = Math.max(currentTimestamp - start, 0);
  const remainingMs = end - currentTimestamp;
  const progress = elapsedMs / totalMs;
  const currentFastingDay = Math.max(1, Math.ceil(elapsedMs / (24 * 60 * 60 * 1000)));

  return {
    elapsedMs,
    totalMs,
    remainingMs,
    progress,
    isOverdue: remainingMs < 0,
    currentFastingDay,
  };
}

export function formatDurationHM(ms: number): string {
  const totalMinutes = Math.floor(Math.abs(ms) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const sign = ms < 0 ? '-' : '';
  return `${sign}${hours}h ${minutes}m`;
}

export function formatDurationHMS(ms: number): string {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const sign = ms < 0 ? '-' : '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${sign}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function isLongerFast(session: Pick<FastingSession, 'category'>): boolean {
  return session.category === 'longer';
}

export function calculateActualDuration(session: FastingSession, endedAt: number = Date.now()): number {
  const start = new Date(session.startTimestamp).getTime();
  return Math.max(endedAt - start, 0);
}

export interface EnergySourceMix {
  /** Each 0..1, always summing to 1 — the relative (not absolute) contribution of each source at this point in the fast. */
  lastMeal: number;
  glycogen: number;
  fat: number;
  ketones: number;
}

function smoothstep(edgeStart: number, edgeEnd: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edgeStart) / (edgeEnd - edgeStart)));
  return t * t * (3 - 2 * t);
}

/**
 * A simplified, illustrative model of how the body's primary energy source
 * typically shifts over the course of a fast — NOT a live physiological
 * measurement and not claiming exact onset times for any individual.
 *
 * Modeled as smooth, overlapping transitions (via smoothstep, not step
 * functions) deliberately: real metabolic shifts are gradual and vary
 * between people, so the visualization should never look like a source
 * switches on/off at a precise hour. Rough basis for the transition windows
 * (typical ranges cited in fasting-physiology literature, not exact
 * checkpoints): digestion/absorption of a meal generally completing within
 * a few hours; liver glycogen providing the dominant fuel through roughly
 * the first half-day and progressively depleting over ~12-24h of
 * continued fasting; fatty acid oxidation increasing from early on and
 * becoming dominant as glycogen availability falls; ketone production
 * beginning to rise only once fasting extends well past half a day and
 * continuing to increase over 24-72h+.
 */
export function calculateEnergySourceMix(elapsedHours: number): EnergySourceMix {
  const h = Math.max(0, elapsedHours);

  const lastMeal = 1 - smoothstep(0, 6, h);
  const glycogen = Math.max(0, smoothstep(0, 4, h) - smoothstep(10, 24, h) * 0.85);
  const fat = smoothstep(3, 20, h) * (1 - 0.15 * smoothstep(0, 3, h));
  const ketones = smoothstep(12, 48, h) * 0.85;

  const total = lastMeal + glycogen + fat + ketones || 1;
  return {
    lastMeal: lastMeal / total,
    glycogen: glycogen / total,
    fat: fat / total,
    ketones: ketones / total,
  };
}
