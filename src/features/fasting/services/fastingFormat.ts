import type { TranslationKey, TranslationParams } from '@/localization';
import { calendarDayDifference } from './FastingSchedule';

/**
 * The exact shape of `useTranslation().t` — see meditationTaxonomy.ts for why
 * every formatter below takes the caller's own live `t` rather than
 * resolving through a module-level static object.
 */
type TFunction = (key: TranslationKey, params?: TranslationParams) => string;

/** The device's own short time format (12- or 24-hour as the user has it set). */
export function formatClock(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** "Today 20:00", "Tomorrow 12:00", "Yesterday 21:30", or "Wed 08:00" - relative to the local calendar, so it stays right across midnight. */
export function formatDayClock(date: Date, now: Date, t: TFunction): string {
  const diff = calendarDayDifference(date, now);
  const day =
    diff === 0
      ? t('common.day.today')
      : diff === 1
        ? t('common.day.tomorrow')
        : diff === -1
          ? t('common.day.yesterday')
          : date.toLocaleDateString(undefined, { weekday: 'short' });
  return `${day} ${formatClock(date)}`;
}

/** "5h 12m", "45m", "2h" - for spans in the interface, never below one minute. */
export function formatSpan(ms: number, t: TFunction): string {
  const totalMinutes = Math.max(0, Math.round(Math.abs(ms) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return t('common.duration.minutesOnly', { minutes });
  return minutes === 0 ? t('common.duration.hoursOnly', { hours }) : t('common.duration.hoursMinutes', { hours, minutes });
}

export function formatHours(hours: number, t: TFunction): string {
  return t('common.duration.hoursLabel', { hours: Number.isInteger(hours) ? hours : hours.toFixed(1) });
}

export function fastingStatusLabel(status: import('../models').FastingStatus, t: TFunction): string {
  switch (status) {
    case 'completed':
      return t('enums.fastingStatus.completed');
    case 'ended_prematurely':
      return t('enums.fastingStatus.ended_prematurely');
    case 'extended':
      return t('enums.fastingStatus.extended');
    case 'planned':
      return t('enums.fastingStatus.planned');
    case 'active':
      return t('enums.fastingStatus.active');
    case 'cancelled':
      return t('enums.fastingStatus.cancelled');
  }
}
