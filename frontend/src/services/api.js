import axios from 'axios';

/**
 * ВНИМАНИЕ: Ссылка из Cloudflare меняется при каждом перезапуске туннеля.
 * Не забывай обновлять её здесь перед деплоем на Vercel или используй
 * переменные окружения (.env)
 */
const TUNNEL_URL = 'https://gameurlife.ru.tuna.am';

const api = axios.create({
  baseURL: `${TUNNEL_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Telegram initData to every request as X-Telegram-Init-Data header.
// The backend validates this HMAC-SHA256 signature to verify caller identity.
api.interceptors.request.use((config) => {
  const tg = window.Telegram?.WebApp;
  const initData = tg?.initData;
  if (initData) {
    config.headers['X-Telegram-Init-Data'] = initData;
  }
  return config;
});

export const userService = {
  /**
   * Получить профиль игрока или создать нового.
   * Identity is extracted from the verified X-Telegram-Init-Data header on the backend.
   */
  getProfile: async () => {
    const response = await api.get('/user/me');
    return response.data;
  },

  /**
   * Сменить аватар персонажа.
   * @param {string} avatarId - Ключ аватара (avatar1, avatar2 и т.д.)
   */
  updateAvatar: async (avatarId) => {
    const res = await api.post('/user/update-avatar', null, {
      params: { avatar_id: avatarId },
    });
    return res.data;
  },

  /**
   * Проверка связи с сервером
   */
  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
