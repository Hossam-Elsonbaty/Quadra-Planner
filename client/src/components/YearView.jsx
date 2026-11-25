import { eachDayOfInterval, endOfMonth, format, isToday, startOfMonth } from "date-fns";

export default function YearView({ year, occurrences, onOpenDay, onOpenMonth }) {
  return (
    <div className="year-grid">
      {Array.from({ length: 12 }, (_, monthIndex) => {
        const monthDate = new Date(year, monthIndex, 1);
        const days = eachDayOfInterval({
          start: startOfMonth(monthDate),
          end: endOfMonth(monthDate),
        });
        const offset = (monthDate.getDay() + 6) % 7;

        return (
          <section className="year-month" key={monthIndex}>
            <button className="year-month-title" type="button" onClick={() => onOpenMonth(monthDate)}>
              {format(monthDate, "MMMM")}
            </button>
            <div className="year-weekdays" aria-hidden="true">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <span key={`${day}-${index}`}>{day}</span>
              ))}
            </div>
            <div className="year-days">
              {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}
              {days.map((date) => {
                const key = format(date, "yyyy-MM-dd");
                const dayItems = occurrences.filter((item) => item.occurrenceDate === key);
                const hasItems = dayItems.length > 0;
                return (
                  <button
                    className={`year-day${hasItems ? " has-items" : ""}${isToday(date) ? " is-today" : ""}`}
                    type="button"
                    key={key}
                    onClick={() => onOpenDay(key)}
                    aria-label={`${format(date, "MMMM d")}${hasItems ? ", has items" : ""}`}
                    title={dayItems.map((item) => item.title).join("\n") || undefined}
                  >
                    {format(date, "d")}
                    {hasItems && <span className="year-dot" />}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
