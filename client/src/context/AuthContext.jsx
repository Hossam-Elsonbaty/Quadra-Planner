import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("planner-token");
    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .me()
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem("planner-token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(values) {
    const { data } = await authApi.login(values);
    localStorage.setItem("planner-token", data.token);
    setUser(data.user);
    return data.user;
  }

  async function signup(values) {
    const { data } = await authApi.signup(values);
    localStorage.setItem("planner-token", data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("planner-token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
