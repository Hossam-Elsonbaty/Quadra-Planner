import { useEffect, useState } from "react";
import { Button, Empty, Input, Modal, Select, Spin, Typography } from "antd";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Download, Plus, Search } from "lucide-react";
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
import { createIcsCalendar } from "../utils/calendarExport.js";
import { filterOccurrences } from "../utils/itemFilters.js";

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
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [completionFilter, setCompletionFilter] = useState("all");
  const range = rangeFor(view, date);
  const typesById = Object.fromEntries(types.map((type) => [type._id, type]));
  const occurrences = expandOccurrences(items, range);
  const filteredOccurrences = filterOccurrences(occurrences, {
    query: searchText,
    typeId: typeFilter,
    completion: completionFilter,
  });
  const hasActiveFilters = Boolean(searchText.trim()) || typeFilter !== "all" || completionFilter !== "all";
  const selectedDayItems = selectedDay
    ? filteredOccurrences
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
      const reminderEnabled = Boolean(values.reminderMinutesBefore);
      const canNotify =
        typeof Notification !== "undefined" && Notification.permission === "granted";
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
      window.dispatchEvent(new Event("planner-items-changed"));
      if (reminderEnabled && !canNotify) {
        toast.warning("Saved, but browser notifications are not enabled for this site.");
      } else {
        toast.success(activeItem?._id ? "Item updated" : "Item added");
      }
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
      window.dispatchEvent(new Event("planner-items-changed"));
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
      window.dispatchEvent(new Event("planner-items-changed"));
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

  function exportCalendar() {
    try {
      const content = createIcsCalendar(filteredOccurrences, typesById);
      const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `weekly-planner-${range.start}-to-${range.end}.ics`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      toast.error(error.message || "Could not export this calendar.");
    }
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
          <Button
            icon={<Download size={17} />}
            onClick={exportCalendar}
            disabled={loading || !filteredOccurrences.length}
          >
            Export .ics
          </Button>
          <Button type="primary" icon={<Plus size={17} />} onClick={() => openNewItem()}>
            Add item
          </Button>
        </div>
      </div>

      <div className="planner-filters">
        <Input
          aria-label="Search items"
          placeholder="Search titles"
          prefix={<Search size={16} />}
          allowClear
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <Select
          aria-label="Filter by type"
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "all", label: "All types" },
            ...types.map((type) => ({ value: type._id, label: type.name })),
          ]}
        />
        <Select
          aria-label="Filter by completion"
          value={completionFilter}
          onChange={setCompletionFilter}
          options={[
            { value: "all", label: "All items" },
            { value: "open", label: "Not done" },
            { value: "done", label: "Done" },
          ]}
        />
        <Text className="planner-filter-status muted-copy" aria-live="polite">
          {hasActiveFilters
            ? `${filteredOccurrences.length} of ${occurrences.length} items`
            : `${occurrences.length} items`}
        </Text>
        {hasActiveFilters && (
          <Button
            type="link"
            onClick={() => {
              setSearchText("");
              setTypeFilter("all");
              setCompletionFilter("all");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {loading ? (
        <div className="planner-loading"><Spin size="large" /></div>
      ) : view === "week" ? (
        <WeekView
          range={range}
          occurrences={filteredOccurrences}
          typesById={typesById}
          onAdd={openNewItem}
          onEdit={openItem}
          onToggleDone={toggleDone}
        />
      ) : view === "month" ? (
        <MonthView
          range={range}
          occurrences={filteredOccurrences}
          typesById={typesById}
          onAdd={openNewItem}
          onEdit={openItem}
          onOpenDay={openDay}
          onOpenMonth={openMonth}
        />
      ) : (
        <YearView
          year={parseISO(range.start).getFullYear()}
          occurrences={filteredOccurrences}
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
          <Empty
            description={
              hasActiveFilters
                ? "No items on this day match your filters."
                : "Nothing planned for this day."
            }
          />
        )}
      </Modal>
    </section>
  );
}
