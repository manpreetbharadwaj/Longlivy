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
