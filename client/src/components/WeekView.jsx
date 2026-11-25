import { eachDayOfInterval, format, parseISO } from "date-fns";
import DayColumn from "./DayColumn.jsx";

export default function WeekView({ range, occurrences, typesById, onAdd, onEdit, onToggleDone }) {
  const days = eachDayOfInterval({ start: parseISO(range.start), end: parseISO(range.end) });

  return (
    <div className="week-grid">
      {days.map((date) => {
        const key = format(date, "yyyy-MM-dd");
        const items = occurrences
          .filter((item) => item.occurrenceDate === key)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        return (
          <DayColumn
            key={key}
            date={date}
            items={items}
            typesById={typesById}
            onAdd={onAdd}
            onEdit={onEdit}
            onToggleDone={onToggleDone}
          />
        );
      })}
    </div>
  );
}
