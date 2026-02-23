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

export const userService = {
  /**
   * Получить профиль игрока или создать нового
   * @param {string} tgId - ID из Telegram (initDataUnsafe.user.id)
   * @param {string} username - Имя пользователя из Telegram
   */
  getProfile: async (tgId, username) => {
    try {
      const response = await api.get(`/user/${tgId}`, {
        params: { username }
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении профиля:', error);
      throw error;
    }
  },

  /**
   * Сменить аватар персонажа
   * @param {string} tgId - ID из Telegram
   * @param {string} avatarId - Ключ аватара (avatar1, avatar2 и т.д.)
   */
  updateAvatar: async (tgId, avatarId) => {
    // Обрати внимание: мы передаем tg_id и avatar_id как query params
    const res = await api.post('/user/update-avatar', null, {
      params: { tg_id: tgId, avatar_id: avatarId }
    });
    return res.data; // Возвращаем только тело ответа
  },
  
  /**
   * Проверка связи с сервером
   */
  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  }
};

export const questService = {
  // Получить список всех квестов с текущим прогрессом юзера
  getQuests: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/quests?userId=${userId}`);
      return await response.json();
    } catch (e) {
      console.error("Fetch quests error", e);
      return [];
    }
  },

  // Отправить запрос на проверку выполнения
  verifyQuest: async (userId, questId) => {
    const response = await fetch(`${API_URL}/quests/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, questId })
    });
    return await response.json();
  }
};

export default api;