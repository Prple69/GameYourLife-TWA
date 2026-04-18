import { Link } from 'react-router-dom';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center p-8 gap-8">
      <h1 className="text-yellow-400 text-lg text-center" style={{ fontFamily: "'Press Start 2P', monospace" }}>
        НАЧАТЬ ИГРУ
      </h1>
      <div className="w-full max-w-sm space-y-4">
        <div className="border border-white/20 p-4 space-y-3">
          <input
            type="text"
            placeholder="Имя персонажа"
            disabled
            className="w-full bg-transparent border border-white/20 px-3 py-2 text-xs text-white/50 font-mono outline-none"
          />
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
        <button
          disabled
          className="w-full py-3 bg-yellow-400/20 text-yellow-400/50 text-xs font-mono border border-yellow-400/20 cursor-not-allowed"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          СКОРО
        </button>
        <p className="text-center text-xs text-white/30">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-yellow-400/60 hover:text-yellow-400 transition-colors">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
