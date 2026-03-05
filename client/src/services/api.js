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
  velocity: (params) => api.get("/analytics/velocity", { params }),
  heatmap: () => api.get("/analytics/heatmap"),
  revenueAtRisk: () => api.get("/analytics/revenue-at-risk"),
  recoveryRate: () => api.get("/analytics/recovery-rate"),
  leaderboard: () => api.get("/analytics/leaderboard"),
  overview: () => api.get("/analytics/overview"),
};

// ─── Notifications ────────────────────────────────
export const notificationsAPI = {
  list: (params) => api.get("/notifications", { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post("/notifications/read-all"),
  archive: (id) => api.patch(`/notifications/${id}/archive`),
  unreadCount: () => api.get("/notifications/unread-count"),
};

// ─── Rules ───────────────────────────────────────
export const rulesAPI = {
  list: () => api.get("/rules"),
  create: (data) => api.post("/rules", data),
  update: (id, data) => api.patch(`/rules/${id}`, data),
  remove: (id) => api.delete(`/rules/${id}`),
};

// ─── Team ─────────────────────────────────────────
export const teamAPI = {
  getTeam: () => api.get("/team"),
  updateTeam: (data) => api.patch("/team", data),
  deleteTeam: () => api.delete("/team"),
  getMembers: () => api.get("/team/members"),
  inviteUser: (data) => api.post("/team/members", data),
  updateRole: (userId, role) => api.patch(`/team/members/${userId}`, { role }),
  deactivateUser: (userId) => api.delete(`/team/members/${userId}`),
  reactivateUser: (userId) => api.post(`/team/members/${userId}/reactivate`),
  updateProfile: (data) => api.patch("/users/me", data),
  changePassword: (data) => api.patch("/users/me/password", data),
};

// ─── Integrations ─────────────────────────────────
export const integrationsAPI = {
  getAll: () => api.get("/integrations"),
  getAuthUrl: (provider, redirectUri) =>
    api.get(`/integrations/${provider}/auth-url`, {
      params: { redirect_uri: redirectUri },
    }),
  connect: (provider, config) =>
    api.post(`/integrations/${provider}/connect`, config ?? {}),
  disconnect: (provider) => api.delete(`/integrations/${provider}`),
  sync: (provider) => api.post(`/integrations/${provider}/sync`),
  triggerDigest: () => api.post("/integrations/email/digest"),
};

// ─── Activities ───────────────────────────────────
export const activitiesAPI = {
  list: (dealId, params) => api.get(`/deals/${dealId}/activities`, { params }),
  addNote: (dealId, description) =>
    api.post(`/deals/${dealId}/activities`, { description }),
};

// ─── Import ───────────────────────────────────────
export const importAPI = {
  uploadCSV: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/import/csv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getHistory: (params) => api.get("/import/history", { params }),
};

export default api;
