import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 → redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("team");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ─── Auth ────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
};

// ─── Deals ───────────────────────────────────────
export const dealsAPI = {
  list: (params) => api.get("/deals", { params }),
  getById: (id) => api.get(`/deals/${id}`),
  create: (data) => api.post("/deals", data),
  update: (id, data) => api.patch(`/deals/${id}`, data),
  remove: (id) => api.delete(`/deals/${id}`),
  stats: () => api.get("/deals/stats"),
  snooze: (id, data) => api.post(`/deals/${id}/snooze`, data),
  unsnooze: (id) => api.delete(`/deals/${id}/snooze`),
};

// ─── Analytics ───────────────────────────────────
export const analyticsAPI = {
  pipeline: () => api.get("/analytics/pipeline"),
  trends: (params) => api.get("/analytics/trends", { params }),
  reps: () => api.get("/analytics/reps"),
  stages: () => api.get("/analytics/stages"),
};

// ─── Notifications ────────────────────────────────
export const notificationsAPI = {
  list: (params) => api.get("/notifications", { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post("/notifications/read-all"),
};

// ─── Rules ───────────────────────────────────────
export const rulesAPI = {
  list: () => api.get("/rules"),
  create: (data) => api.post("/rules", data),
  update: (id, data) => api.patch(`/rules/${id}`, data),
  remove: (id) => api.delete(`/rules/${id}`),
};

export default api;
