import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { format } from "date-fns";
import { getMonthRange } from "../utils/dates.js";
import DayColumn from "./DayColumn.jsx";
import ItemCard from "./ItemCard.jsx";
import MonthView from "./MonthView.jsx";
import YearView from "./YearView.jsx";

describe("calendar today highlighting", () => {
  it("highlights today's column, month cell, and year date", () => {
    const today = new Date();
    const range = getMonthRange(today);
    const callbacks = {
      onAdd: vi.fn(),
      onEdit: vi.fn(),
      onOpenDay: vi.fn(),
      onOpenMonth: vi.fn(),
      onToggleDone: vi.fn(),
    };

    const { container, rerender } = render(
      <DayColumn
        date={today}
        items={[]}
        typesById={{}}
        onAdd={callbacks.onAdd}
        onEdit={callbacks.onEdit}
        onToggleDone={callbacks.onToggleDone}
      />
    );
    expect(container.querySelector(".day-column.is-today")).not.toBeNull();

    rerender(
      <MonthView
        range={range}
        occurrences={[]}
        typesById={{}}
        onAdd={callbacks.onAdd}
        onEdit={callbacks.onEdit}
        onOpenDay={callbacks.onOpenDay}
        onOpenMonth={callbacks.onOpenMonth}
      />
    );
    expect(container.querySelector(".month-cell.is-today")).not.toBeNull();

    rerender(
      <YearView
        year={today.getFullYear()}
        occurrences={[]}
        onOpenDay={callbacks.onOpenDay}
        onOpenMonth={callbacks.onOpenMonth}
      />
    );
    expect(container.querySelector(".year-day.is-today")).not.toBeNull();
    expect(container.querySelector(".year-day.is-today")).toHaveAccessibleName(format(today, "MMMM d"));
  });

  it("shows an item's full title when hovering over its card", () => {
    const { container } = render(
      <ItemCard
        item={{ title: "Long title that may be clipped", startTime: "09:00", occurrenceKey: "item-1" }}
        type={{ color: "#123456" }}
        onEdit={vi.fn()}
        onToggleDone={vi.fn()}
      />
    );

    expect(container.querySelector(".item-entry")).toHaveAttribute(
      "title",
      "Long title that may be clipped"
    );
  });
});
