/**
 * Local wall-clock time with the device's UTC offset, e.g.
 * `2026-10-19T23:30:00+05:30`. The API converts it to UTC and files the meal
 * under the calendar day of the profile's timezone; an offset-free time would
 * be read as UTC and a late-evening meal would land on the next day.
 */
export function localIsoWithOffset(date: Date = new Date()): string {
  const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${pad(offset / 60)}:${pad(offset % 60)}`;
}
