import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("planner-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  login: (values) => api.post("/auth/login", values),
  signup: (values) => api.post("/auth/signup", values),
  me: () => api.get("/auth/me"),
};

export const typesApi = {
  list: () => api.get("/types"),
  create: (values) => api.post("/types", values),
  update: (id, values) => api.put(`/types/${id}`, values),
  remove: (id) => api.delete(`/types/${id}`),
};

export const itemsApi = {
  list: (range) => api.get("/items", { params: range }),
  create: (values) => api.post("/items", values),
  update: (id, values) => api.put(`/items/${id}`, values),
  updateOccurrence: (id, date, values) => api.put(`/items/${id}/occurrences/${date}`, values),
  remove: (id) => api.delete(`/items/${id}`),
  removeOccurrence: (id, date) => api.delete(`/items/${id}/occurrences/${date}`),
  toggleDone: (id, date) => api.patch(`/items/${id}/done`, { date }),
};

export const usersApi = {
  list: () => api.get("/users"),
  remove: (id) => api.delete(`/users/${id}`),
};

export default api;
