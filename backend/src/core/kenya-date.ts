const dayMs = 24 * 60 * 60 * 1000;
const kenyaCalendar = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Nairobi',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function kenyaDate(now: Date): string {
  const parts = kenyaCalendar.formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

// Receipts specify a calendar day, not a future timestamp at noon on that day.
export function isRecentKenyanPaymentDate(input: string, now: Date): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return false;
  const enteredDay = new Date(`${input}T00:00:00.000Z`);
  if (!Number.isFinite(enteredDay.getTime()) || enteredDay.toISOString().slice(0, 10) !== input)
    return false;
  const today = new Date(`${kenyaDate(now)}T00:00:00.000Z`);
  const daysAgo = (today.getTime() - enteredDay.getTime()) / dayMs;
  return daysAgo >= 0 && daysAgo <= 31;
}
