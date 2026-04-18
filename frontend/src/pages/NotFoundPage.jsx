import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-yellow-400" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '2rem' }}>
        404
      </h1>
      <p className="text-white/60 text-sm">Локация не найдена</p>
      <Link
        to="/"
        className="px-6 py-3 border border-yellow-400 text-yellow-400 text-xs hover:bg-yellow-400 hover:text-black transition-colors"
        style={{ fontFamily: "'Press Start 2P', monospace" }}
      >
        ВЕРНУТЬСЯ
      </Link>
    </div>
  );
}
