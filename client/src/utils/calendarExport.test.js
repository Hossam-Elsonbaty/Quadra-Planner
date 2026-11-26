import { describe, expect, it } from "vitest";
import { createIcsCalendar } from "./calendarExport.js";

describe("createIcsCalendar", () => {
  it("exports occurrence details with valid escaping and stable occurrence ids", () => {
    const calendar = createIcsCalendar(
      [{
        _id: "item-1",
        sourceOccurrenceDate: "2027-03-15",
        occurrenceDate: "2027-03-17",
        title: "Class, review; advanced\\",
        type: "type-1",
        startTime: "09:30",
        endTime: "10:45",
        notes: "Bring notes\nand questions",
      }],
      { "type-1": { name: "Study, class" } },
      new Date("2026-11-26T04:30:00.000Z")
    );

    expect(calendar).toContain("UID:item-1-2027-03-15@weekly-planner");
    expect(calendar).toContain("DTSTAMP:20261126T043000Z");
    expect(calendar).toContain("DTSTART:20270317T093000");
    expect(calendar).toContain("DTEND:20270317T104500");
    expect(calendar).toContain("SUMMARY:Class\\, review\\; advanced\\\\");
    expect(calendar).toContain("CATEGORIES:Study\\, class");
    expect(calendar).toContain("DESCRIPTION:Bring notes\\nand questions");
    expect(calendar.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("folds long UTF-8 lines to the iCalendar line length limit", () => {
    const calendar = createIcsCalendar(
      [{
        _id: "item-2",
        occurrenceDate: "2027-03-17",
        title: "📚".repeat(30),
        startTime: "09:30",
      }],
      {},
      new Date("2026-11-26T04:30:00.000Z")
    );

    for (const line of calendar.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it("rejects occurrences with invalid dates or times", () => {
    expect(() => createIcsCalendar(
      [{ _id: "item-3", occurrenceDate: "2027-03-17", title: "Class", startTime: "25:00" }],
      {}
    )).toThrow("invalid date or time");
    expect(() => createIcsCalendar(
      [{ _id: "item-4", occurrenceDate: "2027-02-31", title: "Class", startTime: "09:00" }],
      {}
    )).toThrow("invalid date or time");
  });
});
