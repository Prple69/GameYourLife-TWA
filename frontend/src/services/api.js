import axios from 'axios';
import useAuthStore from '../stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach Bearer token from authStore on every request.
// Phase 2: token is a mock string. Phase 3 will replace with real JWT.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

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

export default api;
