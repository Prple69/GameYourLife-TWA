import { useState, useEffect, useCallback } from 'react';
import FriendSearchBar from '../components/FriendSearchBar';
import FriendCard from '../components/FriendCard';
import FriendActivityFeed from '../components/FriendActivityFeed';
import friendsService from '../services/friendsService';

export default function FriendsPage() {
  const [tab, setTab] = useState('friends'); // 'friends' | 'pending'
  const [friends, setFriends] = useState([]);
  const [activity, setActivity] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'success'|'error', text: string }

  const loadFriends = useCallback(async () => {
    setLoading(true);
    try {
      const data = await friendsService.getFriends();
      setFriends(data.friends || []);
      setActivity(data.activity || []);
    } catch {
      setMsg({ type: 'error', text: 'Не удалось загрузить список друзей' });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPending = useCallback(async () => {
    try {
      const data = await friendsService.getPending();
      setPending(data || []);
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    loadFriends();
    loadPending();
  }, [loadFriends, loadPending]);

  const handleSelectUser = async (user) => {
    try {
      await friendsService.sendRequest(user.id);
      setMsg({ type: 'success', text: `Запрос отправлен: ${user.display_name}` });
      await loadPending();
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Ошибка отправки запроса';
      setMsg({ type: 'error', text: detail });
    }
    setTimeout(() => setMsg(null), 3000);
  };

  const handleAccept = async (req) => {
    try {
      await friendsService.acceptRequest(req.id);
      await loadFriends();
      await loadPending();
      setMsg({ type: 'success', text: `${req.other_display_name} теперь ваш друг!` });
    } catch {
      setMsg({ type: 'error', text: 'Ошибка принятия запроса' });
    }
    setTimeout(() => setMsg(null), 3000);
  };

  const handleDelete = async (item) => {
    try {
      await friendsService.deleteRequest(item.id);
      await loadFriends();
      await loadPending();
    } catch {
      setMsg({ type: 'error', text: 'Ошибка удаления' });
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const incomingPending = pending.filter(r => r.direction === 'incoming');
  const outgoingPending = pending.filter(r => r.direction === 'outgoing');

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold text-yellow-400 uppercase tracking-wider">Друзья</h1>

      {/* Message banner */}
      {msg && (
        <div className={`px-4 py-2 rounded text-sm ${msg.type === 'success' ? 'bg-green-800 text-green-200' : 'bg-red-900 text-red-200'}`}>
          {msg.text}
        </div>
      )}

      {/* Search */}
      <div>
        <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Найти игрока</p>
        <FriendSearchBar onSelect={handleSelectUser} />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-700">
        {[['friends', `Друзья (${friends.length})`], ['pending', `Запросы (${incomingPending.length})`]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'friends' && (
        <div className="space-y-6">
          {loading ? (
            <p className="text-gray-500 text-sm text-center">Загрузка...</p>
          ) : friends.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">У вас пока нет друзей. Найдите игроков выше!</p>
          ) : (
            <div>
              {friends.map(f => (
                <FriendCard key={f.id} friend={f} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {activity.length > 0 && (
            <div>
              <p className="text-gray-400 text-xs mb-3 uppercase tracking-wide">Активность друзей</p>
              <FriendActivityFeed activity={activity} />
            </div>
          )}
        </div>
      )}

      {tab === 'pending' && (
        <div className="space-y-4">
          {incomingPending.length > 0 && (
            <div>
              <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Входящие запросы</p>
              {incomingPending.map(req => (
                <div key={req.id} className="flex items-center justify-between px-3 py-2 bg-gray-800 border border-gray-700 rounded mb-2">
                  <div className="text-white text-sm">{req.other_display_name}</div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAccept(req)} className="text-xs px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-black rounded font-medium">
                      Принять
                    </button>
                    <button onClick={() => handleDelete(req)} className="text-xs px-2 py-1 text-gray-400 hover:text-red-400">
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {outgoingPending.length > 0 && (
            <div>
              <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Исходящие запросы</p>
              {outgoingPending.map(req => (
                <div key={req.id} className="flex items-center justify-between px-3 py-2 bg-gray-800 border border-gray-700 rounded mb-2">
                  <div className="text-white text-sm">{req.other_display_name}</div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 text-xs">ожидает</span>
                    <button onClick={() => handleDelete(req)} className="text-xs px-2 py-1 text-gray-400 hover:text-red-400">
                      Отозвать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {incomingPending.length === 0 && outgoingPending.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">Нет активных запросов</p>
          )}
        </div>
      )}
    </div>
  );
}
