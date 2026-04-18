import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import useAuthStore from '../../stores/authStore';

/**
 * Email/password login + Telegram Login Widget.
 *
 * Widget requires VITE_TELEGRAM_BOT_USERNAME in env. The widget script
 * calls window.TelegramLoginCallback(data) after user authorizes in Telegram;
 * we forward that data to POST /api/auth/telegram-login.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/app/quests';
  const setTokens = useAuthStore((s) => s.setTokens);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const telegramContainerRef = useRef(null);
  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;

  useEffect(() => {
    if (!botUsername || !telegramContainerRef.current) return;

    window.TelegramLoginCallback = async (data) => {
      try {
        setLoading(true);
        setError('');
        const res = await api.post('/auth/telegram-login', data);
        setTokens(res.data.access_token, res.data.refresh_token);
        navigate(returnTo, { replace: true });
      } catch (err) {
        setError(err.response?.data?.detail || 'Ошибка входа через Telegram');
      } finally {
        setLoading(false);
      }
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'TelegramLoginCallback(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    telegramContainerRef.current.appendChild(script);

    return () => {
      delete window.TelegramLoginCallback;
    };
  }, [botUsername, navigate, returnTo, setTokens]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      setTokens(res.data.access_token, res.data.refresh_token);
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Неверный email или пароль');
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
        ВОЙТИ
      </h1>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="border border-white/20 p-4 space-y-3">
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
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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
          {loading ? '...' : 'ВОЙТИ'}
        </button>

        <p className="text-center text-xs text-white/30">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-yellow-400/60 hover:text-yellow-400 transition-colors">
            Зарегистрироваться
          </Link>
        </p>
      </form>

      <div className="flex flex-col items-center gap-3">
        {botUsername ? (
          <>
            <p className="text-xs text-white/30">или</p>
            <div ref={telegramContainerRef} />
          </>
        ) : (
          <p className="text-[10px] text-white/20 text-center max-w-xs">
            Telegram-вход: задай VITE_TELEGRAM_BOT_USERNAME в frontend/.env и перезапусти dev-сервер.
          </p>
        )}
      </div>
    </div>
  );
}
