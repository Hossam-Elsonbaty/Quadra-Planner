import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../server.js";

async function signup(name, email) {
  const response = await request(app).post("/api/auth/signup").send({
    name,
    email,
    password: "password123",
  });
  return response.body.token;
}

describe("types", () => {
  it("creates, lists, updates and deletes only the current user's types", async () => {
    const ownerToken = await signup("Owner", "owner@example.com");
    const otherToken = await signup("Other", "other@example.com");
    const created = await request(app)
      .post("/api/types")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Class", color: "#123456" });
    expect(created.status).toBe(201);

    const otherList = await request(app)
      .get("/api/types")
      .set("Authorization", `Bearer ${otherToken}`);
    expect(otherList.body.types).toHaveLength(0);

    const updated = await request(app)
      .put(`/api/types/${created.body.type._id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ color: "#abcdef" });
    expect(updated.status).toBe(200);
    expect(updated.body.type.color).toBe("#abcdef");

    const deleted = await request(app)
      .delete(`/api/types/${created.body.type._id}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(deleted.status).toBe(200);
  });

  it("rejects invalid colors and blocks deletion when a type is in use", async () => {
    const token = await signup("Owner", "type-owner@example.com");
    const invalid = await request(app)
      .post("/api/types")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Bad", color: "red" });
    expect(invalid.status).toBe(400);

    const type = await request(app)
      .post("/api/types")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Task", color: "#123456" });
    await request(app)
      .post("/api/items")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test item",
        type: type.body.type._id,
        date: "2027-03-15",
        startTime: "09:00",
        repeat: "none",
      });

    const deleted = await request(app)
      .delete(`/api/types/${type.body.type._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleted.status).toBe(409);
  });
});
