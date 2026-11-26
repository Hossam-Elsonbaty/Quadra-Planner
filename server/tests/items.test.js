import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../server.js";
import { isOccurrenceOnDate } from "../utils/dates.js";

async function createUserAndType(email) {
  const signup = await request(app).post("/api/auth/signup").send({
    name: "Planner User",
    email,
    password: "password123",
  });
  const token = signup.body.token;
  const type = await request(app)
    .post("/api/types")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Class", color: "#2b6f54" });
  return { token, typeId: type.body.type._id };
}

describe("items", () => {
  it("validates required repeat values, creates and filters owned items", async () => {
    const owner = await createUserAndType("item-owner@example.com");
    const other = await createUserAndType("item-other@example.com");
    const payload = {
      title: "Weekly class",
      type: owner.typeId,
      date: "2027-03-15",
      startTime: "09:00",
      repeat: "weekly",
      reminderMinutesBefore: 30,
    };
    const missingRepeat = await request(app)
      .post("/api/items")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ ...payload, repeat: undefined });
    expect(missingRepeat.status).toBe(400);

    const created = await request(app)
      .post("/api/items")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(payload);
    expect(created.status).toBe(201);
    expect(created.body.item.reminderMinutesBefore).toBe(30);

    const invalidReminder = await request(app)
      .post("/api/items")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ ...payload, reminderMinutesBefore: 10081 });
    expect(invalidReminder.status).toBe(400);

    const list = await request(app)
      .get("/api/items?from=2027-03-01&to=2027-03-31")
      .set("Authorization", `Bearer ${owner.token}`);
    expect(list.body.items).toHaveLength(1);

    const isolated = await request(app)
      .get("/api/items")
      .set("Authorization", `Bearer ${other.token}`);
    expect(isolated.body.items).toHaveLength(0);
    const inaccessible = await request(app)
      .delete(`/api/items/${created.body.item._id}`)
      .set("Authorization", `Bearer ${other.token}`);
    expect(inaccessible.status).toBe(404);
  });

  it("toggles a valid occurrence date without changing other occurrences", async () => {
    const { token, typeId } = await createUserAndType("done@example.com");
    const created = await request(app)
      .post("/api/items")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Monthly item",
        type: typeId,
        date: "2027-01-31",
        startTime: "09:00",
        repeat: "monthly",
      });
    const id = created.body.item._id;

    const marked = await request(app)
      .patch(`/api/items/${id}/done`)
      .set("Authorization", `Bearer ${token}`)
      .send({ date: "2027-02-28" });
    expect(marked.status).toBe(200);
    expect(marked.body.item.doneDates).toContain("2027-02-28");

    const invalidDate = await request(app)
      .patch(`/api/items/${id}/done`)
      .set("Authorization", `Bearer ${token}`)
      .send({ date: "2027-02-27" });
    expect(invalidDate.status).toBe(400);
  });

  it("updates and deletes a single recurring occurrence", async () => {
    const { token, typeId } = await createUserAndType("occurrence@example.com");
    const created = await request(app)
      .post("/api/items")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Weekly class",
        type: typeId,
        date: "2027-03-15",
        endDate: "2027-03-22",
        startTime: "09:00",
        repeat: "weekly",
      });
    const id = created.body.item._id;

    const updated = await request(app)
      .put(`/api/items/${id}/occurrences/2027-03-15`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Rescheduled class",
        type: typeId,
        date: "2027-04-02",
        startTime: "10:00",
      });
    expect(updated.status).toBe(200);
    expect(updated.body.item.date).toBe("2027-03-15T00:00:00.000Z");
    expect(updated.body.item.exceptions).toMatchObject([{
      occurrenceDate: "2027-03-15",
      date: "2027-04-02",
      title: "Rescheduled class",
      startTime: "10:00",
      cancelled: false,
    }]);

    const movedOccurrence = await request(app)
      .get("/api/items?from=2027-04-01&to=2027-04-30")
      .set("Authorization", `Bearer ${token}`);
    expect(movedOccurrence.body.items).toHaveLength(1);

    const deleted = await request(app)
      .delete(`/api/items/${id}/occurrences/2027-03-15`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleted.status).toBe(200);

    const afterDelete = await request(app)
      .get("/api/items?from=2027-04-01&to=2027-04-30")
      .set("Authorization", `Bearer ${token}`);
    expect(afterDelete.body.items).toHaveLength(0);

    const deletedOccurrence = await request(app)
      .patch(`/api/items/${id}/done`)
      .set("Authorization", `Bearer ${token}`)
      .send({ date: "2027-03-15" });
    expect(deletedOccurrence.status).toBe(400);
  });

  it("matches none, weekly, monthly and yearly recurrence including month-end and leap years", () => {
    expect(isOccurrenceOnDate({ date: "2027-03-15", repeat: "none" }, "2027-03-15")).toBe(true);
    expect(isOccurrenceOnDate({ date: "2027-03-15", repeat: "none" }, "2027-03-22")).toBe(false);
    expect(isOccurrenceOnDate({ date: "2027-03-15", repeat: "weekly" }, "2027-03-22")).toBe(true);
    expect(isOccurrenceOnDate({ date: "2027-01-31", repeat: "monthly" }, "2027-02-28")).toBe(true);
    expect(isOccurrenceOnDate({ date: "2024-02-29", repeat: "yearly" }, "2025-02-28")).toBe(true);
    expect(isOccurrenceOnDate({ date: "2024-02-29", repeat: "yearly" }, "2025-03-01")).toBe(false);
  });
});
