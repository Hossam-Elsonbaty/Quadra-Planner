import { addDays, format } from "date-fns";
import { useEffect } from "react";
import { toast } from "sonner";
import { itemsApi } from "../api.js";
import { expandOccurrences } from "../utils/dates.js";

const REFRESH_INTERVAL = 6 * 60 * 60 * 1000;

export default function ReminderNotifications() {
  useEffect(() => {
    let active = true;
    let refreshVersion = 0;
    let timers = [];

    function clearTimers() {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [];
    }

    async function refresh() {
      const version = ++refreshVersion;
      if (typeof Notification === "undefined" || Notification.permission !== "granted") {
        clearTimers();
        return;
      }

      const now = new Date();
      const range = {
        start: format(now, "yyyy-MM-dd"),
        end: format(addDays(now, 14), "yyyy-MM-dd"),
      };

      try {
        const { data } = await itemsApi.list(range);
        if (!active || version !== refreshVersion) return;

        const nowMs = Date.now();
        const nextTimers = expandOccurrences(data.items, range)
          .filter((occurrence) => occurrence.reminderMinutesBefore && !occurrence.done)
          .flatMap((occurrence) => {
            const eventAt = new Date(`${occurrence.occurrenceDate}T${occurrence.startTime}:00`);
            const fireAt = eventAt.getTime() - occurrence.reminderMinutesBefore * 60 * 1000;
            const delay = fireAt - nowMs;
            if (Number.isNaN(eventAt.getTime()) || delay <= 0) return [];

            const timer = window.setTimeout(() => {
              if (!active || Notification.permission !== "granted") return;
              try {
                const notification = new Notification(occurrence.title, {
                  body: `Starts ${format(eventAt, "MMM d")} at ${format(eventAt, "h:mm a")}`,
                  tag: `planner-${occurrence._id}-${occurrence.sourceOccurrenceDate || occurrence.occurrenceDate}`,
                });
                notification.onclick = () => {
                  window.focus();
                  notification.close();
                };
              } catch (error) {
                toast.error(error.message || "Could not display this reminder.");
              }
            }, delay);
            return [timer];
          });

        clearTimers();
        timers = nextTimers;
      } catch (error) {
        if (active) {
          toast.error(error.response?.data?.message || "Could not load upcoming reminders.");
        }
      }
    }

    function refreshOnVisibility() {
      if (document.visibilityState === "visible") refresh();
    }

    refresh();
    const interval = window.setInterval(refresh, REFRESH_INTERVAL);
    window.addEventListener("planner-items-changed", refresh);
    document.addEventListener("visibilitychange", refreshOnVisibility);

    return () => {
      active = false;
      refreshVersion += 1;
      clearTimers();
      window.clearInterval(interval);
      window.removeEventListener("planner-items-changed", refresh);
      document.removeEventListener("visibilitychange", refreshOnVisibility);
    };
  }, []);

  return null;
}
