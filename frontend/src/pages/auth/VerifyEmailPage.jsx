import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';

/**
 * /verify-email/:token — POSTs token to /api/auth/verify-email.
 * Phase 3 stub: token comes from server console logs (no real email).
 * Phase 11: real SMTP-delivered emails carry this link.
 */
export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Токен не найден в URL');
      return;
    }
    api
      .post(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message || 'Email подтверждён!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.detail || 'Токен недействителен или истёк');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center gap-6 p-8">
      <h1
        className="text-yellow-400 text-sm text-center"
        style={{ fontFamily: "'Press Start 2P', monospace" }}
      >
        ПОДТВЕРЖДЕНИЕ EMAIL
      </h1>

      {status === 'loading' && (
        <p className="text-white/50 text-xs">Проверяем токен...</p>
      )}

      {status === 'success' && (
        <>
          <p className="text-green-400 text-xs text-center">{message}</p>
          <Link
            to="/app/quests"
            className="px-6 py-3 border border-yellow-400 text-yellow-400 text-xs hover:bg-yellow-400 hover:text-black transition-colors"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            В ИГРУ
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <p className="text-red-400 text-xs text-center">{message}</p>
          <Link
            to="/login"
            className="px-6 py-3 border border-white/30 text-white/50 text-xs hover:border-yellow-400 hover:text-yellow-400 transition-colors"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            НА СТРАНИЦУ ВХОДА
          </Link>
        </>
      )}
    </div>
  );
}
