import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { itemsApi } from "../api.js";
import ReminderNotifications from "./ReminderNotifications.jsx";

vi.mock("../api.js", () => ({
  itemsApi: { list: vi.fn() },
}));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("ReminderNotifications", () => {
  it("shows a browser notification at the configured reminder time", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 2, 15, 8, 49));
    const FakeNotification = vi.fn(function (title, options) {
      this.title = title;
      this.options = options;
      this.close = vi.fn();
    });
    FakeNotification.permission = "granted";
    vi.stubGlobal("Notification", FakeNotification);
    itemsApi.list.mockResolvedValue({
      data: {
        items: [{
          _id: "item-1",
          title: "Morning class",
          date: "2027-03-15",
          startTime: "09:00",
          repeat: "none",
          reminderMinutesBefore: 10,
        }],
      },
    });

    const { unmount } = render(<ReminderNotifications />);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(itemsApi.list).toHaveBeenCalledOnce();
    expect(FakeNotification).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(FakeNotification).toHaveBeenCalledWith(
      "Morning class",
      expect.objectContaining({ body: "Starts Mar 15 at 9:00 AM" })
    );
    unmount();
  });
});
