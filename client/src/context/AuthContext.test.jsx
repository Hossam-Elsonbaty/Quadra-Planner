import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider as Provider } from "./AuthContext.jsx";
import Login from "../pages/Login.jsx";
import Signup from "../pages/Signup.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";

const { loginMock, signupMock, meMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  signupMock: vi.fn(),
  meMock: vi.fn(),
}));

vi.mock("../api.js", () => ({
  authApi: { login: loginMock, signup: signupMock, me: meMock },
}));

function renderAuth(initialEntry) {
  return render(
    <Provider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<h1>Planner is ready</h1>} />
            <Route path="/private" element={<h1>Private planner</h1>} />
            <Route element={<ProtectedRoute role="admin" />}>
              <Route path="/admin" element={<h1>Admin tools</h1>} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe("authentication pages and protected routes", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    meMock.mockResolvedValue({ data: { user: null } });
  });

  it("redirects unauthenticated visitors to login", async () => {
    renderAuth("/private");
    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  });

  it("keeps regular users out of admin routes", async () => {
    localStorage.setItem("planner-token", "user-token");
    meMock.mockResolvedValue({
      data: { user: { id: "1", name: "Planner", role: "user" } },
    });
    renderAuth("/admin");

    expect(await screen.findByRole("heading", { name: "Planner is ready" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Admin tools" })).not.toBeInTheDocument();
  });

  it("shows and hides the login password", async () => {
    renderAuth("/login");
    const user = userEvent.setup();
    const password = await screen.findByLabelText("Password", { exact: true });

    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("toggles signup and confirmation passwords independently", async () => {
    renderAuth("/signup");
    const user = userEvent.setup();
    const password = await screen.findByLabelText("Password", { exact: true });
    const confirmation = screen.getByLabelText("Confirm password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    expect(confirmation).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show confirmation password" }));
    expect(confirmation).toHaveAttribute("type", "text");
  });

  it("signs in and redirects to the planner", async () => {
    loginMock.mockResolvedValue({
      data: { token: "test-token", user: { id: "1", name: "Planner", role: "user" } },
    });
    renderAuth("/login");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("heading", { name: "Planner is ready" })).toBeInTheDocument();
    expect(localStorage.getItem("planner-token")).toBe("test-token");
  });

  it("submits a new account and redirects to the planner", async () => {
    signupMock.mockResolvedValue({
      data: { token: "signup-token", user: { id: "2", name: "New", role: "user" } },
    });
    renderAuth("/signup");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Name"), "New User");
    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("heading", { name: "Planner is ready" })).toBeInTheDocument();
    expect(signupMock).toHaveBeenCalledWith({
      name: "New User",
      email: "new@example.com",
      password: "password123",
    });
  });
});
