import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ItemForm from "./ItemForm.jsx";

describe("ItemForm repeat choice", () => {
  it("has no repeat selected by default and keeps Save disabled until a choice is made", () => {
    render(
      <ItemForm
        open
        item={{ date: "2027-03-15" }}
        types={[{ _id: "type-1", name: "Class", color: "#123456" }]}
        onCancel={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Save item" })).toBeDisabled();
    expect(screen.getByText("Choose a repeat option before saving.")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("This date only"));
    expect(screen.getByRole("button", { name: "Save item" })).toBeEnabled();
  });

  it("rejects an end time before the selected start time", async () => {
    const onSave = vi.fn();
    render(
      <ItemForm
        open
        item={{ date: "2027-03-15" }}
        types={[{ _id: "type-1", name: "Class", color: "#123456" }]}
        onCancel={vi.fn()}
        onSave={onSave}
        onDelete={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Morning class" } });
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "type-1" } });
    fireEvent.change(screen.getByLabelText("Start time"), { target: { value: "09:00" } });
    fireEvent.change(screen.getByLabelText("End time Optional"), { target: { value: "08:00" } });
    fireEvent.click(screen.getByLabelText("This date only"));
    fireEvent.click(screen.getByRole("button", { name: "Save item" }));

    expect(await screen.findByText("End time must be after the start time.")).toBeInTheDocument();
    await waitFor(() => expect(onSave).not.toHaveBeenCalled());
  });

  it("saves a recurring occurrence without changing the series repeat settings", async () => {
    const onSave = vi.fn();
    render(
      <ItemForm
        open
        item={{
          _id: "item-1",
          title: "Weekly class",
          type: "type-1",
          date: "2027-03-15",
          occurrenceDate: "2027-03-22",
          sourceOccurrenceDate: "2027-03-22",
          repeat: "weekly",
          startTime: "09:00",
        }}
        types={[{ _id: "type-1", name: "Class", color: "#123456" }]}
        onCancel={vi.fn()}
        onSave={onSave}
        onDelete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText("This occurrence only"));
    expect(screen.queryByLabelText("Every week")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Date")).toHaveValue("2027-03-22");
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Changed class" } });
    fireEvent.click(screen.getByRole("button", { name: "Save item" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    const [values, scope] = onSave.mock.calls[0];
    expect(scope).toBe("occurrence");
    expect(values).toMatchObject({
      title: "Changed class",
      date: "2027-03-22",
      startTime: "09:00",
    });
    expect(values).not.toHaveProperty("repeat");
  });
});
