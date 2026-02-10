import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://sports-live.up.railway.app/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
};

// Admin
export const adminApi = {
  getStats: () => api.get("/admin/stats"),
  getOperators: () => api.get("/admin/operators"),
  createOperator: (data: { name: string; email: string; password: string }) =>
    api.post("/admin/operators", data),
  assignOperator: (matchId: string, operatorId: string) =>
    api.post(`/admin/matches/${matchId}/operators`, { operatorId }),
  removeOperator: (matchId: string, operatorId: string) =>
    api.delete(`/admin/matches/${matchId}/operators/${operatorId}`),
  getCompetitions: () => api.get("/admin/competitions"),
  createCompetition: (data: any) => api.post("/admin/competitions", data),
  updateCompetition: (id: string, data: any) => api.put(`/admin/competitions/${id}`, data),
  deleteCompetition: (id: string) => api.delete(`/admin/competitions/${id}`),
  getEventLogs: (params?: { matchId?: string; limit?: number }) =>
    api.get("/admin/events/logs", { params }),
  getUsers: (params?: { search?: string; role?: string; page?: number; limit?: number }) =>
    api.get("/admin/users", { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  toggleBan: (id: string) => api.post(`/admin/users/${id}/toggle-ban`),
  updateRole: (id: string, role: string) =>
    api.patch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
};

// Matches
export const matchApi = {
  getAll: (params?: any) => api.get("/matches", { params }),
  getById: (id: string) => api.get(`/matches/${id}`),
  create: (data: any) => api.post("/matches", data),
  update: (id: string, data: any) => api.put(`/matches/${id}`, data),
  updateStatus: (id: string, data: any) => api.patch(`/matches/${id}/status`, data),
  delete: (id: string) => api.delete(`/matches/${id}`),
};

// Teams
export const teamApi = {
  getAll: (params?: any) => api.get("/teams", { params }),
  getById: (id: string) => api.get(`/teams/${id}`),
  create: (data: any) => api.post("/teams", data),
  update: (id: string, data: any) => api.put(`/teams/${id}`, data),
  delete: (id: string) => api.delete(`/teams/${id}`),
  addPlayer: (teamId: string, data: any) => api.post(`/teams/${teamId}/players`, data),
  updatePlayer: (teamId: string, playerId: string, data: any) =>
    api.put(`/teams/${teamId}/players/${playerId}`, data),
  deletePlayer: (teamId: string, playerId: string) =>
    api.delete(`/teams/${teamId}/players/${playerId}`),
  bulkAddPlayers: (teamId: string, players: any[]) =>
    api.post(`/teams/${teamId}/players/bulk`, { players }),
  addToCompetition: (teamId: string, competitionId: string, season?: string) =>
    api.post(`/teams/${teamId}/competitions/${competitionId}`, { season }),
  removeFromCompetition: (teamId: string, competitionId: string) =>
    api.delete(`/teams/${teamId}/competitions/${competitionId}`),
};

// Players
export const playerApi = {
  getAll: (params?: any) => api.get("/players", { params }),
  getById: (id: string) => api.get(`/players/${id}`),
};

// Competitions
export const competitionApi = {
  getAll: () => api.get("/competitions"),
};

// Store
export const storeApi = {
  getCategories: () => api.get("/store/admin/categories"),
  createCategory: (data: any) => api.post("/store/admin/categories", data),
  updateCategory: (id: string, data: any) => api.put(`/store/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/store/admin/categories/${id}`),
  getProducts: () => api.get("/store/admin/products"),
  createProduct: (data: any) => api.post("/store/admin/products", data),
  updateProduct: (id: string, data: any) => api.put(`/store/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/store/admin/products/${id}`),
  uploadImage: (formData: FormData) =>
    api.post("/store/admin/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getBanners: () => api.get("/store/admin/banners"),
  createBanner: (data: any) => api.post("/store/admin/banners", data),
  updateBanner: (id: string, data: any) => api.put(`/store/admin/banners/${id}`, data),
  deleteBanner: (id: string) => api.delete(`/store/admin/banners/${id}`),
};

// Orders
export const orderApi = {
  getAll: (params?: { status?: string }) => api.get("/orders/admin/all", { params }),
  updateStatus: (id: string, data: any) => api.put(`/orders/admin/${id}/status`, data),
  getCounts: () => api.get("/orders/admin/counts"),
};

// News
export const newsApi = {
  getAll: (params?: any) => api.get("/news", { params }),
  getById: (id: string) => api.get(`/news/${id}`),
  create: (formData: FormData) =>
    api.post("/news", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id: string, formData: FormData) =>
    api.put(`/news/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  delete: (id: string) => api.delete(`/news/${id}`),
};

// Sliders
export const sliderApi = {
  getAll: () => api.get("/sliders/admin"),
  create: (formData: FormData) =>
    api.post("/sliders/admin", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id: string, formData: FormData) =>
    api.put(`/sliders/admin/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  delete: (id: string) => api.delete(`/sliders/admin/${id}`),
};

// Legal
export const legalApi = {
  getAll: () => api.get("/legal/admin/all"),
  create: (data: any) => api.post("/legal/admin", data),
  update: (id: string, data: any) => api.put(`/legal/admin/${id}`, data),
  delete: (id: string) => api.delete(`/legal/admin/${id}`),
};
