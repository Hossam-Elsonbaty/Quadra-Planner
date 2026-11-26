export function parseDateOnly(value) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return null;
  }
  return date;
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function isOccurrenceOnDate(item, occurrenceDate) {
  if (item.exceptions?.some(
    (exception) => exception.occurrenceDate === occurrenceDate && exception.cancelled
  )) {
    return false;
  }

  const start = parseDateOnly(
    item.date instanceof Date ? item.date.toISOString().slice(0, 10) : item.date
  );
  const occurrence = parseDateOnly(occurrenceDate);
  if (!start || !occurrence || occurrence < start) return false;
  if (item.endDate && occurrence > new Date(item.endDate)) return false;

  const startYear = start.getUTCFullYear();
  const startMonth = start.getUTCMonth();
  const startDay = start.getUTCDate();
  const year = occurrence.getUTCFullYear();
  const month = occurrence.getUTCMonth();
  const day = occurrence.getUTCDate();

  switch (item.repeat) {
    case "none":
      return occurrence.getTime() === start.getTime();
    case "weekly":
      return occurrence.getUTCDay() === start.getUTCDay();
    case "monthly":
      return day === Math.min(startDay, daysInMonth(year, month));
    case "yearly":
      return month === startMonth && day === Math.min(startDay, daysInMonth(year, month));
    default:
      return false;
  }
}
