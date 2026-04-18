import { Link } from 'react-router-dom';

const CONTACT_EMAIL = 'support@gameyourlife.ru';

export default function FooterSection() {
  return (
    <footer className="border-t border-white/10 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Brand */}
          <div className="space-y-2">
            <p
              className="text-yellow-400 text-xs"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              GAME YOUR LIFE
            </p>
            <p className="text-white/30 text-[11px] font-mono">Твоя жизнь — RPG.</p>
          </div>

          {/* Legal links */}
          <nav className="flex flex-col sm:flex-row gap-4 text-[11px] font-mono text-white/30">
            <Link to="/privacy"      className="hover:text-white/60 transition-colors">Политика конфиденциальности</Link>
            <Link to="/terms"        className="hover:text-white/60 transition-colors">Пользовательское соглашение</Link>
            <Link to="/public-offer" className="hover:text-white/60 transition-colors">Оферта</Link>
          </nav>

          {/* Contact */}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-[11px] font-mono text-white/30 hover:text-white/60 transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-[10px] font-mono text-white/20">
          © {new Date().getFullYear()} Game Your Life · Все права защищены · Россия
        </div>
      </div>
    </footer>
  );
}
