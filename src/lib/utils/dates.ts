import { format, startOfDay, subDays, eachDayOfInterval, isToday, parseISO, differenceInDays, getDay } from "date-fns";

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd");
}

export function formatDisplay(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "EEEE, MMM d");
}

export function today(): string {
  return formatDate(new Date());
}

export function todayDate(): Date {
  return startOfDay(new Date());
}

export function getDaysAgo(days: number): string {
  return formatDate(subDays(new Date(), days));
}

export function getDateRange(startDate: Date, endDate: Date): string[] {
  return eachDayOfInterval({ start: startDate, end: endDate }).map(formatDate);
}

export function isDayScheduled(
  date: Date,
  frequency: string,
  customDays: number[] | null
): boolean {
  const dayOfWeek = getDay(date); // 0=Sun, 6=Sat

  switch (frequency) {
    case "daily":
      return true;
    case "weekdays":
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case "weekends":
      return dayOfWeek === 0 || dayOfWeek === 6;
    case "custom":
      return customDays?.includes(dayOfWeek) ?? false;
    default:
      return true;
  }
}

export function daysBetween(dateA: string, dateB: string): number {
  return Math.abs(differenceInDays(parseISO(dateA), parseISO(dateB)));
}

export { isToday, parseISO };
