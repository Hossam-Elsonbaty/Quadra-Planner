import { Button } from "antd";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { format, isToday } from "date-fns";
import ItemCard from "./ItemCard.jsx";

export default function DayColumn({ date, items, typesById, onAdd, onEdit, onToggleDone }) {
  return (
    <section className={`day-column${isToday(date) ? " is-today" : ""}`} aria-label={format(date, "EEEE, MMMM d")}>
      <header className="day-heading">
        <div>
          <span className="day-name">{format(date, "EEEE")}</span>
          <span className="day-date">{format(date, "MMM d")}</span>
        </div>
        <Button
          type="text"
          size="small"
          aria-label={`Add item on ${format(date, "MMMM d")}`}
          icon={<Plus size={16} />}
          onClick={() => onAdd(format(date, "yyyy-MM-dd"))}
        />
      </header>
      <div className="day-items">
        <AnimatePresence>
          {items.map((item) => (
            <ItemCard
              key={item.occurrenceKey}
              item={item}
              type={typesById[item.type?._id || item.type]}
              onEdit={onEdit}
              onToggleDone={onToggleDone}
            />
          ))}
        </AnimatePresence>
        {items.length === 0 && <span className="day-empty">Nothing planned</span>}
      </div>
    </section>
  );
}
