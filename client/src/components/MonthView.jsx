import { Button, Card } from "antd";
import { eachDayOfInterval, endOfWeek, format, parseISO, startOfWeek } from "date-fns";

export default function MonthView({ range, occurrences, typesById, onAdd, onEdit, onOpenDay, onOpenMonth }) {
  const monthStart = parseISO(range.start);
  const monthEnd = parseISO(range.end);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="month-grid">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
        <div className="month-weekday" key={day}>{day}</div>
      ))}
      {days.map((date) => {
        const key = format(date, "yyyy-MM-dd");
        const inCurrentMonth = date.getMonth() === monthStart.getMonth();
        const items = occurrences
          .filter((item) => item.occurrenceDate === key)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        return (
          <Card
            key={key}
            className={`month-cell${inCurrentMonth ? "" : " outside-month"}`}
            onClick={() => inCurrentMonth ? onOpenDay(key) : onOpenMonth(date)}
          >
            <button
              className="month-date"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (!inCurrentMonth) onOpenMonth(date);
                else onOpenDay(key);
              }}
            >
              {format(date, "d")}
            </button>
            <div className="month-items">
              {items.slice(0, 3).map((item) => (
                <button
                  className="month-item"
                  type="button"
                  key={item.occurrenceKey}
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(item);
                  }}
                  title={`${item.startTime} ${item.title}`}
                >
                  <span
                    className="item-marker"
                    style={{ backgroundColor: typesById[item.type?._id || item.type]?.color || "#6F8B77" }}
                  />
                  <time>{item.startTime}</time>
                  <span>{item.title}</span>
                </button>
              ))}
              {items.length > 3 && (
                <button
                  className="more-link"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenDay(key);
                  }}
                >
                  +{items.length - 3} more
                </button>
              )}
            </div>
            {inCurrentMonth && (
              <Button
                className="cell-add"
                size="small"
                type="text"
                aria-label={`Add item on ${format(date, "MMMM d")}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onAdd(key);
                }}
              >
                +
              </Button>
            )}
          </Card>
        );
      })}
    </div>
  );
}
