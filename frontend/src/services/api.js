import axios from 'axios';

const API_URL = 'https://game-your-life-twa.vercel.app/api'; // Замени на свой URL Vercel/Render в проде

const api = axios.create({
  baseURL: API_URL,
});

export const userService = {
  // Получить профиль или создать, если нет
  getProfile: (tgId) => api.get(`/user/${tgId}`),
  
  // Смена аватара
  updateAvatar: (userId, avatarKey) => 
    api.post(`/user/update-avatar`, null, { params: { user_id: userId, avatar_key: avatarKey } }),
};

export const questService = {
  getQuests: (userId) => api.get(`/quests/${userId}`),
  completeQuest: (questId) => api.post(`/quests/complete/${questId}`),
};

export const shopService = {
  buyItem: (userId, itemSlug, price) => 
    api.post(`/shop/buy`, null, { params: { user_id: userId, item_slug: itemSlug, price } }),
};