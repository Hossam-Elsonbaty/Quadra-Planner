import { Card, Checkbox } from "antd";
import { motion } from "framer-motion";

export default function ItemCard({ item, type, onEdit, onToggleDone }) {
  function handleToggle(event) {
    event.stopPropagation();
    onToggleDone(item);
  }

  return (
    <motion.div
      className="item-entry"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <Card
        size="small"
        className={`item-card${item.done ? " is-done" : ""}`}
        onClick={() => onEdit(item)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") onEdit(item);
        }}
        tabIndex={0}
        role="button"
        aria-label={`Edit ${item.title}, ${item.startTime}`}
      >
        <span className="item-marker" style={{ backgroundColor: type?.color || "#6F8B77" }} />
        <span className="item-time">{item.startTime}</span>
        <span className="item-title">{item.title}</span>
        <Checkbox checked={item.done} onClick={(event) => event.stopPropagation()} onChange={handleToggle} aria-label={`Mark ${item.title} done`} />
      </Card>
    </motion.div>
  );
}
