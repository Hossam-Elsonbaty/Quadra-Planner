import { describe, expect, it } from "vitest";
import { expandOccurrences, getMonthRange, getWeekRange, getYearRange } from "./dates.js";

describe("calendar ranges", () => {
  it("returns a Monday-through-Sunday week", () => {
    expect(getWeekRange(new Date(2027, 2, 17))).toEqual({
      start: "2027-03-15",
      end: "2027-03-21",
    });
  });

  it("returns complete month and year ranges", () => {
    expect(getMonthRange(new Date(2027, 1, 10))).toEqual({
      start: "2027-02-01",
      end: "2027-02-28",
    });
    expect(getYearRange(new Date(2024, 5, 1))).toEqual({
      start: "2024-01-01",
      end: "2024-12-31",
    });
  });
});

describe("repeat expansion", () => {
  it("expands one-time and weekly items only in the visible range", () => {
    const items = [
      { _id: "once", date: "2027-03-15", repeat: "none", startTime: "08:00" },
      { _id: "week", date: "2027-03-15", repeat: "weekly", startTime: "09:00" },
    ];
    const occurrences = expandOccurrences(items, {
      start: "2027-03-15",
      end: "2027-03-29",
    });
    expect(occurrences.map(({ _id, occurrenceDate }) => [_id, occurrenceDate])).toEqual([
      ["once", "2027-03-15"],
      ["week", "2027-03-15"],
      ["week", "2027-03-22"],
      ["week", "2027-03-29"],
    ]);
  });

  it("clamps monthly day 31 to month end and respects an optional end date", () => {
    const occurrences = expandOccurrences(
      [{ _id: "monthly", date: "2027-01-31", repeat: "monthly", endDate: "2027-03-31" }],
      { start: "2027-01-01", end: "2027-04-30" }
    );
    expect(occurrences.map(({ occurrenceDate }) => occurrenceDate)).toEqual([
      "2027-01-31",
      "2027-02-28",
      "2027-03-31",
    ]);
  });

  it("repeats leap-day anniversaries on February 28 in non-leap years", () => {
    const occurrences = expandOccurrences(
      [{ _id: "yearly", date: "2024-02-29", repeat: "yearly" }],
      { start: "2024-01-01", end: "2028-12-31" }
    );
    expect(occurrences.map(({ occurrenceDate }) => occurrenceDate)).toEqual([
      "2024-02-29",
      "2025-02-28",
      "2026-02-28",
      "2027-02-28",
      "2028-02-29",
    ]);
  });

  it("marks the occurrence done independently", () => {
    const occurrences = expandOccurrences(
      [{ _id: "weekly", date: "2027-03-15", repeat: "weekly", doneDates: ["2027-03-22"] }],
      { start: "2027-03-15", end: "2027-03-22" }
    );
    expect(occurrences.map(({ done }) => done)).toEqual([false, true]);
  });
});
