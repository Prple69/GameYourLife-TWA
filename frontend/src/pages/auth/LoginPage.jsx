import { Link } from 'react-router-dom';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center p-8 gap-8">
      <h1 className="text-yellow-400 text-lg text-center" style={{ fontFamily: "'Press Start 2P', monospace" }}>
        ВОЙТИ
      </h1>
      <div className="w-full max-w-sm space-y-4">
        <div className="border border-white/20 p-4 space-y-3">
          <input
            type="email"
            placeholder="Email"
            disabled
            className="w-full bg-transparent border border-white/20 px-3 py-2 text-xs text-white/50 font-mono outline-none"
          />
          <input
            type="password"
            placeholder="Пароль"
            disabled
            className="w-full bg-transparent border border-white/20 px-3 py-2 text-xs text-white/50 font-mono outline-none"
          />
        </div>
        {/* Phase 3 will enable this button */}
        <button
          disabled
          className="w-full py-3 bg-yellow-400/20 text-yellow-400/50 text-xs font-mono border border-yellow-400/20 cursor-not-allowed"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          СКОРО
        </button>
        <p className="text-center text-xs text-white/30">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-yellow-400/60 hover:text-yellow-400 transition-colors">
            Зарегистрироваться
          </Link>
        </p>
        {/* Dev bypass: navigate to /app for Phase 2 testing */}
        <Link
          to="/app/quests"
          className="block text-center text-[10px] text-white/20 hover:text-white/40 transition-colors mt-4"
        >
          [DEV] Войти без auth →
        </Link>
      </div>
      <p className="text-xs text-white/20 text-center max-w-xs">
        Полноценный вход через email и Telegram появится в ближайшем обновлении.
      </p>
    </div>
  );
}
