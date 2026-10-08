import { calendarDayDifference } from './FastingSchedule';

/** The device's own short time format (12- or 24-hour as the user has it set). */
export function formatClock(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** "Today 20:00", "Tomorrow 12:00", "Yesterday 21:30", or "Wed 08:00" - relative to the local calendar, so it stays right across midnight. */
export function formatDayClock(date: Date, now: Date): string {
  const diff = calendarDayDifference(date, now);
  const day = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : diff === -1 ? 'Yesterday' : date.toLocaleDateString(undefined, { weekday: 'short' });
  return `${day} ${formatClock(date)}`;
}

/** "5h 12m", "45m", "2h" - for spans in the interface, never below one minute. */
export function formatSpan(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(Math.abs(ms) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function formatHours(hours: number): string {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
}

/** What each outcome means to the user — the API's "failed" is a fast ended before its planned time. */
const FASTING_STATUS_LABEL: Record<import('../models').FastingStatus, string> = {
  completed: 'Completed',
  ended_prematurely: 'Ended early',
  extended: 'Extended',
  planned: 'Planned',
  active: 'In progress',
  cancelled: 'Cancelled',
};

export function fastingStatusLabel(status: import('../models').FastingStatus): string {
  return FASTING_STATUS_LABEL[status];
}
