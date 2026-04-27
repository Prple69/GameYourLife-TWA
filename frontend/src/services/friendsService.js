import api from '../api';

const friendsService = {
  async searchUsers(q, limit = 10) {
    const res = await api.get('/users/search', { params: { q, limit } });
    return res.data;
  },

  async sendRequest(addresseeId) {
    const res = await api.post('/friends/request', { addressee_id: addresseeId });
    return res.data;
  },

  async getPending() {
    const res = await api.get('/friends/pending');
    return res.data;
  },

  async acceptRequest(friendshipId) {
    const res = await api.post(`/friends/accept/${friendshipId}`);
    return res.data;
  },

  async deleteRequest(friendshipId) {
    await api.delete(`/friends/${friendshipId}`);
  },

  async getFriends(limit = 50) {
    const res = await api.get('/friends', { params: { limit } });
    return res.data;
  },
};

export default friendsService;
