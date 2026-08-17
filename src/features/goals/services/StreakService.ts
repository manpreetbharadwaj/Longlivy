/**
 * Reusable streak engine shared across fasting/meditation/activity/goal
 * streaks, so streak math is written once.
 */
export function calculateStreakFromDates(validDateStrings: string[]): { current: number; longest: number } {
  const uniqueDays = Array.from(new Set(validDateStrings.map((d) => new Date(d).toDateString()))).map(
    (d) => new Date(d).getTime()
  );
  uniqueDays.sort((a, b) => a - b);

  if (uniqueDays.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let running = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const diffDays = Math.round((uniqueDays[i] - uniqueDays[i - 1]) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) {
      running += 1;
    } else if (diffDays > 1) {
      running = 1;
    }
    longest = Math.max(longest, running);
  }

  const daySet = new Set(uniqueDays.map((t) => new Date(t).toDateString()));
  const cursor = new Date();
  if (!daySet.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let current = 0;
  while (daySet.has(cursor.toDateString())) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, longest };
}
