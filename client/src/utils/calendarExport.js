import { format, isValid, parseISO } from "date-fns";

function escapeText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/([,;])/g, "\\$1");
}

function foldLine(line, encoder) {
  const folded = [];
  let current = "";
  let byteLength = 0;

  for (const character of line) {
    const characterBytes = encoder.encode(character).length;
    if (byteLength + characterBytes > 75) {
      folded.push(current);
      current = ` ${character}`;
      byteLength = 1 + characterBytes;
    } else {
      current += character;
      byteLength += characterBytes;
    }
  }

  folded.push(current);
  return folded.join("\r\n");
}

function toIcsDateTime(date, time) {
  const parsedDate = parseISO(date);
  if (
    !isValid(parsedDate) ||
    format(parsedDate, "yyyy-MM-dd") !== date ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  ) {
    throw new Error("An item has an invalid date or time and cannot be exported.");
  }
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

function toUtcTimestamp(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function createIcsCalendar(occurrences, typesById, generatedAt = new Date()) {
  const encoder = new TextEncoder();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Quadra Planner//Weekly Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Weekly Planner",
  ];
  const timestamp = toUtcTimestamp(generatedAt);

  occurrences.forEach((item) => {
    if (!item._id || !item.title || !item.occurrenceDate || !item.startTime) {
      throw new Error("An item is missing required calendar details and cannot be exported.");
    }

    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeText(`${item._id}-${item.sourceOccurrenceDate || item.occurrenceDate}@weekly-planner`)}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${toIcsDateTime(item.occurrenceDate, item.startTime)}`,
    );
    if (item.endTime) {
      lines.push(`DTEND:${toIcsDateTime(item.occurrenceDate, item.endTime)}`);
    }
    lines.push(`SUMMARY:${escapeText(item.title)}`);

    const typeId = String(item.type?._id || item.type || "");
    const typeName = typesById[typeId]?.name;
    if (typeName) lines.push(`CATEGORIES:${escapeText(typeName)}`);
    if (item.notes) lines.push(`DESCRIPTION:${escapeText(item.notes)}`);
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return `${lines.map((line) => foldLine(line, encoder)).join("\r\n")}\r\n`;
}
