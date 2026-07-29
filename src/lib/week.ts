/** Return the Monday for the current Vietnamese calendar week (YYYY-MM-DD). */
export function currentWeekStartIso(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const calendarDay = new Date(Date.UTC(value("year"), value("month") - 1, value("day")));
  const mondayOffset = (calendarDay.getUTCDay() + 6) % 7;
  calendarDay.setUTCDate(calendarDay.getUTCDate() - mondayOffset);
  return calendarDay.toISOString().slice(0, 10);
}
