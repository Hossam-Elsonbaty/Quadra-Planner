import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../server.js";

describe("authentication", () => {
  it("creates an admin on the first signup and supports login and /me", async () => {
    const signup = await request(app).post("/api/auth/signup").send({
      name: "First User",
      email: "FIRST@example.com",
      password: "password123",
    });

    expect(signup.status).toBe(201);
    expect(signup.body.user).toMatchObject({
      name: "First User",
      email: "first@example.com",
      role: "admin",
    });
    expect(signup.body.user).not.toHaveProperty("passwordHash");

    const adminUsers = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${signup.body.token}`);
    expect(adminUsers.status).toBe(200);
    expect(adminUsers.body.users[0]).not.toHaveProperty("passwordHash");

    const regularSignup = await request(app).post("/api/auth/signup").send({
      name: "Regular User",
      email: "regular@example.com",
      password: "password123",
    });
    expect(regularSignup.body.user.role).toBe("user");
    const forbiddenUsers = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${regularSignup.body.token}`);
    expect(forbiddenUsers.status).toBe(403);
    const deletedUser = await request(app)
      .delete(`/api/users/${regularSignup.body.user.id}`)
      .set("Authorization", `Bearer ${signup.body.token}`);
    expect(deletedUser.status).toBe(200);

    const login = await request(app).post("/api/auth/login").send({
      email: "first@example.com",
      password: "password123",
    });
    expect(login.status).toBe(200);
    expect(login.body.token).toBeTruthy();

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe("first@example.com");
    expect(me.body.user.id).toBeTruthy();

    const health = await request(app).get("/");
    expect(health.status).toBe(200);
  });

  it("rejects invalid credentials and unauthenticated protected requests", async () => {
    const invalid = await request(app).post("/api/auth/signup").send({
      name: "Short Password",
      email: "short@example.com",
      password: "short",
    });
    expect(invalid.status).toBe(400);

    const login = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "password123",
    });
    expect(login.status).toBe(401);
    expect(login.body.message).toBe("Invalid email or password");

    const protectedResponse = await request(app).get("/api/types");
    expect(protectedResponse.status).toBe(401);
  });
});
