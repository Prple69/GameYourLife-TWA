import axios from 'axios';

const api = axios.create({
  baseURL: 'https://gameurlife.ru.tuna.am/api',
});

export const userService = {
  // Получить профиль (или создать, если новый)
  getProfile: (tgId) => api.get(`/user/${tgId}`),
};

export const questService = {
  // Получить список активных квестов
  getQuests: (userId) => api.get(`/quests/${userId}`),
  
  // Добавить новый квест
  createQuest: (userId, title, difficulty) => 
    api.post(`/quests/${userId}`, { title, difficulty }),
  
  // Завершить квест и получить награду
  completeQuest: (questId) => api.post(`/quests/complete/${questId}`),
};

export default api;