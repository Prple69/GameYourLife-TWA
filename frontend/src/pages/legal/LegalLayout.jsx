import { Link } from 'react-router-dom';

const CONTACT_EMAIL = 'support@gameyourlife.ru'; // TODO: replace before prod launch

export default function LegalLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="border-b border-yellow-400/20 px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="text-yellow-400 hover:text-yellow-300 transition-colors text-xs"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          ← GAME YOUR LIFE
        </Link>
        <nav className="hidden md:flex gap-6 text-xs text-white/40">
          <Link to="/privacy" className="hover:text-white/80 transition-colors">Конфиденциальность</Link>
          <Link to="/terms" className="hover:text-white/80 transition-colors">Условия</Link>
          <Link to="/public-offer" className="hover:text-white/80 transition-colors">Оферта</Link>
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1
          className="text-yellow-400 mb-8 text-xl leading-relaxed"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          {title}
        </h1>
        <div className="space-y-6 text-sm text-white/80 leading-relaxed">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 mt-12">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>© {new Date().getFullYear()} Game Your Life</p>
          <nav className="flex gap-4 flex-wrap justify-center">
            <Link to="/privacy" className="hover:text-white/80 transition-colors">Политика конфиденциальности</Link>
            <Link to="/terms" className="hover:text-white/80 transition-colors">Пользовательское соглашение</Link>
            <Link to="/public-offer" className="hover:text-white/80 transition-colors">Оферта</Link>
          </nav>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white/80 transition-colors">
            {CONTACT_EMAIL}
          </a>
        </div>
      </footer>
    </div>
  );
}
