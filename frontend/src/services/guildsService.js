import api from './api'

export const guildsService = {
  listGuilds: ({ limit = 20, offset = 0 } = {}) =>
    api.get('/guilds', { params: { limit, offset } }),

  getGuild: (slug) => api.get(`/guilds/${slug}`),

  createGuild: (data) => api.post('/guilds', data),

  joinGuild: (guildId) => api.post(`/guilds/${guildId}/join`),

  leaveGuild: (guildId) => api.delete(`/guilds/${guildId}/leave`),

  getChallenges: (guildId) => api.get(`/guilds/${guildId}/challenges`),

  createChallenge: (guildId, data) => api.post(`/guilds/${guildId}/challenges`, data),
}
