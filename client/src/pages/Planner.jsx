import { useEffect, useState } from "react";
import { Button, Empty, Modal, Spin, Typography } from "antd";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { itemsApi, typesApi } from "../api.js";
import ItemCard from "../components/ItemCard.jsx";
import ItemForm from "../components/ItemForm.jsx";
import MonthView from "../components/MonthView.jsx";
import ViewSwitcher from "../components/ViewSwitcher.jsx";
import WeekView from "../components/WeekView.jsx";
import YearView from "../components/YearView.jsx";
import {
  expandOccurrences,
  getMonthRange,
  getWeekRange,
  getYearRange,
  shiftDate,
  todayString,
} from "../utils/dates.js";

const { Title, Text } = Typography;

function rangeFor(view, date) {
  if (view === "week") return getWeekRange(date);
  if (view === "month") return getMonthRange(date);
  return getYearRange(date);
}

function periodTitle(view, range) {
  if (view === "year") return format(parseISO(range.start), "yyyy");
  if (view === "month") return format(parseISO(range.start), "MMMM yyyy");
  return `${format(parseISO(range.start), "MMM d")} – ${format(parseISO(range.end), "MMM d, yyyy")}`;
}

function idOfType(type) {
  return String(type?._id || type || "");
}

export default function Planner() {
  const [view, setView] = useState("week");
  const [date, setDate] = useState(() => new Date());
  const [items, setItems] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [saving, setSaving] = useState(false);
  const range = rangeFor(view, date);
  const typesById = Object.fromEntries(types.map((type) => [type._id, type]));
  const occurrences = expandOccurrences(items, range);
  const selectedDayItems = selectedDay
    ? occurrences
      .filter((item) => item.occurrenceDate === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
    : [];

  useEffect(() => {
    let active = true;
    setLoading(true);
    itemsApi
      .list(range)
      .then(({ data }) => {
        if (active) setItems(data.items);
      })
      .catch((error) => {
        if (active) toast.error(error.response?.data?.message || "Could not load planner items.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range.start, range.end]);

  useEffect(() => {
    typesApi
      .list()
      .then(({ data }) => setTypes(data.types))
      .catch((error) => toast.error(error.response?.data?.message || "Could not load item types."));
  }, []);

  function openNewItem(day = todayString()) {
    setActiveItem({ date: day });
    setFormOpen(true);
    setSelectedDay(null);
  }

  function openItem(item) {
    setActiveItem(item);
    setFormOpen(true);
    setSelectedDay(null);
  }

  function reloadItems() {
    return itemsApi.list(range).then(({ data }) => setItems(data.items));
  }

  async function saveItem(values, scope) {
    setSaving(true);
    try {
      if (activeItem?._id && scope === "occurrence") {
        await itemsApi.updateOccurrence(
          activeItem._id,
          activeItem.sourceOccurrenceDate || activeItem.occurrenceDate,
          values
        );
      } else if (activeItem?._id) {
        await itemsApi.update(activeItem._id, values);
      } else {
        await itemsApi.create(values);
      }
      toast.success(activeItem?._id ? "Item updated" : "Item added");
      setFormOpen(false);
      await reloadItems();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save this item.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item, scope) {
    try {
      if (scope === "occurrence") {
        await itemsApi.removeOccurrence(
          item._id,
          item.sourceOccurrenceDate || item.occurrenceDate
        );
      } else {
        await itemsApi.remove(item._id);
      }
      toast.success(scope === "occurrence" ? "Occurrence deleted" : "Item deleted");
      setFormOpen(false);
      await reloadItems();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete this item.");
    }
  }

  async function toggleDone(item) {
    try {
      await itemsApi.toggleDone(
        item._id,
        item.sourceOccurrenceDate || item.occurrenceDate
      );
      await reloadItems();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update this item.");
    }
  }

  function move(amount) {
    setDate((current) => shiftDate(current, view, amount));
  }

  function openMonth(month) {
    setDate(month);
    setView("month");
  }

  function openDay(day) {
    setSelectedDay(day);
  }

  const title = periodTitle(view, range);

  return (
    <section className="planner-page">
      <div className="planner-toolbar">
        <div className="planner-heading">
          <Title level={2}>Your planner</Title>
          <Text className="muted-copy">{title}</Text>
        </div>
        <div className="planner-controls">
          <div className="period-controls">
            <Button aria-label="Previous period" icon={<ChevronLeft size={17} />} onClick={() => move(-1)} />
            <Button onClick={() => setDate(new Date())}>Today</Button>
            <Button aria-label="Next period" icon={<ChevronRight size={17} />} onClick={() => move(1)} />
          </div>
          <ViewSwitcher view={view} onChange={setView} />
          <Button type="primary" icon={<Plus size={17} />} onClick={() => openNewItem()}>
            Add item
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="planner-loading"><Spin size="large" /></div>
      ) : view === "week" ? (
        <WeekView
          range={range}
          occurrences={occurrences}
          typesById={typesById}
          onAdd={openNewItem}
          onEdit={openItem}
          onToggleDone={toggleDone}
        />
      ) : view === "month" ? (
        <MonthView
          range={range}
          occurrences={occurrences}
          typesById={typesById}
          onAdd={openNewItem}
          onEdit={openItem}
          onOpenDay={openDay}
          onOpenMonth={openMonth}
        />
      ) : (
        <YearView
          year={parseISO(range.start).getFullYear()}
          occurrences={occurrences}
          onOpenDay={openDay}
          onOpenMonth={openMonth}
        />
      )}

      <ItemForm
        open={formOpen}
        item={activeItem}
        types={types}
        saving={saving}
        onCancel={() => setFormOpen(false)}
        onSave={saveItem}
        onDelete={deleteItem}
      />

      <Modal
        title={selectedDay ? format(parseISO(selectedDay), "EEEE, MMMM d, yyyy") : ""}
        open={Boolean(selectedDay)}
        onCancel={() => setSelectedDay(null)}
        footer={
          <Button type="primary" icon={<Plus size={16} />} onClick={() => openNewItem(selectedDay || todayString())}>
            Add item
          </Button>
        }
      >
        {selectedDayItems.length ? (
          <div className="selected-day-list">
            {selectedDayItems.map((item) => (
              <ItemCard
                key={item.occurrenceKey}
                item={item}
                type={typesById[idOfType(item.type)]}
                onEdit={openItem}
                onToggleDone={toggleDone}
              />
            ))}
          </div>
        ) : (
          <Empty description="Nothing planned for this day." />
        )}
      </Modal>
    </section>
  );
}
