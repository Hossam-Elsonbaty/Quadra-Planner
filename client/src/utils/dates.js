import {
  addDays,
  addMonths,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDate,
  getDay,
  getMonth,
  lastDayOfMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
  endOfYear,
} from "date-fns";

function asDate(value) {
  if (value instanceof Date) return value;
  return parseISO(String(value).slice(0, 10));
}

function makeRange(start, end) {
  return { start: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd") };
}

export function getWeekRange(date) {
  return makeRange(startOfWeek(asDate(date), { weekStartsOn: 1 }), endOfWeek(asDate(date), { weekStartsOn: 1 }));
}

export function getMonthRange(date) {
  return makeRange(startOfMonth(asDate(date)), endOfMonth(asDate(date)));
}

export function getYearRange(date) {
  return makeRange(startOfYear(asDate(date)), endOfYear(asDate(date)));
}

function occursOn(item, candidate, start) {
  const date = asDate(candidate);
  if (date < start) return false;
  if (item.endDate && date > asDate(item.endDate)) return false;

  const day = getDate(date);
  switch (item.repeat) {
    case "none":
      return format(date, "yyyy-MM-dd") === format(start, "yyyy-MM-dd");
    case "weekly":
      return getDay(date) === getDay(start);
    case "monthly":
      return day === Math.min(getDate(start), getDate(lastDayOfMonth(date)));
    case "yearly":
      return (
        getMonth(date) === getMonth(start) &&
        day === Math.min(getDate(start), getDate(lastDayOfMonth(date)))
      );
    default:
      return false;
  }
}

export function expandOccurrences(items, range) {
  if (!range?.start || !range?.end) return [];
  const startDate = asDate(range.start);
  const endDate = asDate(range.end);
  if (endDate < startDate) return [];

  return items.flatMap((item) => {
    const itemStart = asDate(item.date);
    const visibleStart = itemStart > startDate ? itemStart : startDate;
    if (item.endDate && asDate(item.endDate) < visibleStart) return [];

    return eachDayOfInterval({ start: visibleStart, end: endDate })
      .filter((date) => occursOn(item, date, itemStart))
      .map((date) => {
        const occurrenceDate = format(date, "yyyy-MM-dd");
        return {
          ...item,
          occurrenceDate,
          occurrenceKey: `${item._id}-${occurrenceDate}`,
          done: (item.doneDates || []).includes(occurrenceDate),
        };
      });
  });
}

export function shiftDate(date, view, amount) {
  const value = asDate(date);
  if (view === "week") return addDays(value, amount * 7);
  if (view === "month") return addMonths(value, amount);
  return addYears(value, amount);
}

export function todayString() {
  return format(new Date(), "yyyy-MM-dd");
}
