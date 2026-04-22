import axios from 'axios';
import useAuthStore from '../stores/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// 401 -> /api/auth/refresh -> retry. Shared refreshPromise prevents races
// when multiple in-flight requests all hit 401 at once: only ONE refresh
// call goes out, the rest await the same promise.
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register')
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const refreshToken = useAuthStore.getState().refreshToken;
            if (!refreshToken) throw new Error('No refresh token');

            // Use raw axios to skip our own interceptors.
            const res = await axios.post(
              `${BASE_URL}/auth/refresh`,
              { refresh_token: refreshToken },
              { headers: { 'Content-Type': 'application/json' } }
            );
            const { access_token, refresh_token } = res.data;
            useAuthStore.getState().setTokens(access_token, refresh_token);
            return access_token;
          } catch (e) {
            useAuthStore.getState().clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            throw e;
          } finally {
            refreshPromise = null;
          }
        })();
      }

      try {
        const newAccess = await refreshPromise;
        originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export const userService = {
  getProfile: async () => {
    const response = await api.get('/user/me');
    return response.data;
  },
  updateAvatar: async (avatarId) => {
    const res = await api.post('/user/update-avatar', null, { params: { avatar_id: avatarId } });
    return res.data;
  },
  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export const shopService = {
  getCatalog: async () => {
    const response = await api.get('/shop');
    return response.data;
  },
  buy: async (shopItemId, { idempotency_key }) => {
    const response = await api.post(`/shop/buy/${shopItemId}`, { idempotency_key });
    return response.data;
  },
};

export const inventoryService = {
  list: async () => {
    const response = await api.get('/inventory');
    return response.data;
  },
  activate: async (inventoryItemId, { idempotency_key }) => {
    const response = await api.post(`/inventory/${inventoryItemId}/activate`, { idempotency_key });
    return response.data;
  },
  equip: async (inventoryItemId, { idempotency_key }) => {
    const response = await api.post(`/inventory/${inventoryItemId}/equip`, { idempotency_key });
    return response.data;
  },
};

export const dailyService = {
  /**
   * GET /api/daily/suggestions
   * Returns { suggestions, rerolls_remaining, reset_time }
   * Triggers LLM generation if not cached; returns cache otherwise.
   */
  getSuggestions: () => api.get('/daily/suggestions').then(r => r.data),

  /**
   * POST /api/daily/accept/:index
   * Accepts suggestion at index, creates quest. Returns { quest_id, remaining_suggestions }.
   */
  accept: (index) => api.post(`/daily/accept/${index}`).then(r => r.data),

  /**
   * POST /api/daily/reroll/:index
   * Rerolls suggestion at index. Returns updated DailySuggestionsResponse.
   * 429 if rerolls exhausted.
   */
  reroll: (index) => api.post(`/daily/reroll/${index}`).then(r => r.data),
};

export const leaderboardService = {
  /**
   * Получить топ лидерборда с пагинацией
   * @param {number} offset - Начальная позиция (default 0)
   * @param {number} limit - Количество записей (default 100, max 100)
   */
  getTop: async (offset = 0, limit = 100) => {
    const response = await api.get('/leaderboard', {
      params: { offset, limit }
    });
    return response.data; // { entries: [...], total: N }
  },

  /**
   * Получить ранг текущего пользователя и ±5 соседей
   */
  getMe: async () => {
    const response = await api.get('/leaderboard/me');
    return response.data; // { rank, total_users, neighbors: [...] }
  },
};

export default api;
