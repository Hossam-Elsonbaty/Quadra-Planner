import { describe, expect, it } from "vitest";
import { filterOccurrences } from "./itemFilters.js";

describe("filterOccurrences", () => {
  const occurrences = [
    { title: "Morning Class", type: { _id: "class" }, done: false },
    { title: "Class notes", type: "class", done: true },
    { title: "Gym", type: "personal", done: false },
  ];

  it("combines case-insensitive title search, type, and completion filters", () => {
    expect(filterOccurrences(occurrences, {
      query: "  CLASS ",
      typeId: "class",
      completion: "open",
    })).toEqual([occurrences[0]]);
  });

  it("returns completed items for the done filter", () => {
    expect(filterOccurrences(occurrences, { completion: "done" })).toEqual([occurrences[1]]);
  });
});
