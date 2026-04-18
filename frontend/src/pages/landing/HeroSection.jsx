import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20 overflow-hidden">
      {/* Background: animated gradient — no video on desktop */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 60%, #1a1200 0%, #000000 70%)',
        }}
      />
      {/* Scanline overlay for retro feel */}
      <div
        className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Badge */}
        <div className="inline-block border border-yellow-400/40 px-4 py-1 text-yellow-400 text-[10px] font-mono tracking-widest mb-8">
          ▶ RPG-ГЕЙМИФИКАЦИЯ РЕАЛЬНОЙ ЖИЗНИ
        </div>

        {/* H1 */}
        <h1
          className="text-yellow-400 mb-6 leading-tight"
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 'clamp(1.5rem, 5vw, 3rem)',
          }}
        >
          ТВОЯ ЖИЗНЬ —<br />RPG
        </h1>

        {/* Subheadline */}
        <p className="text-white/60 text-sm md:text-base max-w-xl mx-auto mb-10 leading-relaxed">
          Превращай реальные задачи в квесты. Прокачивай персонажа.
          Получай лут. Соревнуйся с друзьями.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="px-8 py-4 bg-yellow-400 text-black font-bold text-xs hover:bg-yellow-300 transition-colors"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            НАЧАТЬ ИГРУ
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 border border-yellow-400/40 text-yellow-400 text-xs hover:border-yellow-400 hover:bg-yellow-400/5 transition-colors"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            ВОЙТИ
          </Link>
        </div>

        {/* Social proof placeholder */}
        <p className="text-white/20 text-[10px] mt-8 tracking-widest">
          БЕСПЛАТНО · РЕГИСТРАЦИЯ ЗА 30 СЕКУНД
        </p>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/20 text-[10px] animate-bounce">
        ↓ ДАЛЕЕ
      </div>
    </section>
  );
}
