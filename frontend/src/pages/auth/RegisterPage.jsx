import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useAuthStore from '../../stores/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        email,
        password,
        display_name: displayName,
      });
      setTokens(res.data.access_token, res.data.refresh_token);
      navigate('/app/quests', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center p-8 gap-8">
      <h1
        className="text-yellow-400 text-lg text-center"
        style={{ fontFamily: "'Press Start 2P', monospace" }}
      >
        НАЧАТЬ ИГРУ
      </h1>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="border border-white/20 p-4 space-y-3">
          <input
            type="text"
            placeholder="Имя персонажа"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={1}
            maxLength={64}
            className="w-full bg-transparent border border-white/20 px-3 py-2 text-xs text-white font-mono outline-none focus:border-yellow-400/60"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-transparent border border-white/20 px-3 py-2 text-xs text-white font-mono outline-none focus:border-yellow-400/60"
          />
          <input
            type="password"
            placeholder="Пароль (минимум 8 символов)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full bg-transparent border border-white/20 px-3 py-2 text-xs text-white font-mono outline-none focus:border-yellow-400/60"
          />
        </div>

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-yellow-400 text-black text-xs font-mono border border-yellow-400 hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          {loading ? '...' : 'СОЗДАТЬ ПЕРСОНАЖА'}
        </button>

        <p className="text-center text-xs text-white/30">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-yellow-400/60 hover:text-yellow-400 transition-colors">
            Войти
          </Link>
        </p>

        <p className="text-[10px] text-white/20 text-center leading-relaxed">
          После регистрации ссылка для подтверждения email появится в логах сервера (Phase 3 stub). Полноценная отправка писем — в Phase 11.
        </p>
      </form>
    </div>
  );
}
