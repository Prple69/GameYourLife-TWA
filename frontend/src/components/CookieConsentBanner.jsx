import useCookieConsentStore from '../stores/cookieConsentStore';

/**
 * Cookie consent banner (152-ФЗ / GDPR).
 * Shows on first visit. Persists choice in localStorage via Zustand.
 * - Does NOT block content (position fixed, bottom of screen)
 * - z-40 so it appears above content but below modals (z-50+)
 * - Bottom padding accounts for mobile safe area + Navigation z-50
 * On mobile: banner appears ABOVE Navigation (which is z-50).
 * Banner z-40 is below Navigation — by design: user taps a tab, nav remains.
 * On desktop (>=1024px): Navigation is hidden; banner sits freely at bottom.
 */
export default function CookieConsentBanner() {
  const { cookieConsent, setCookieConsent } = useCookieConsentStore();

  // Do not render if consent already given
  if (cookieConsent !== null) return null;

  const handleAcceptAll = () => setCookieConsent('accepted');
  const handleMinimal   = () => setCookieConsent('minimal');

  return (
    <div
      role="dialog"
      aria-label="Согласие на использование cookie"
      className="fixed bottom-0 left-0 right-0 z-40 p-4"
      style={{
        // Leave room for mobile safe-area and bottom Navigation bar (~80px)
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)',
      }}
    >
      {/* On desktop (lg:) no Navigation, so reduce padding */}
      <style>{`
        @media (min-width: 1024px) {
          [data-cookie-banner] { padding-bottom: 1.5rem !important; }
        }
      `}</style>

      <div
        data-cookie-banner
        className="max-w-2xl mx-auto bg-black border border-yellow-400/40 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        style={{ backdropFilter: 'blur(8px)' }}
      >
        {/* Text */}
        <p className="flex-1 text-xs text-white/70 font-mono leading-relaxed">
          Мы используем cookie для аутентификации и аналитики.{' '}
          <a href="/privacy" className="text-yellow-400 hover:underline">
            Политика конфиденциальности
          </a>
        </p>

        {/* Buttons */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleMinimal}
            className="px-3 py-2 text-[10px] font-mono border border-white/20 text-white/50 hover:border-white/60 hover:text-white/80 transition-colors"
          >
            ТОЛЬКО НУЖНЫЕ
          </button>
          <button
            onClick={handleAcceptAll}
            className="px-3 py-2 text-[10px] font-mono bg-yellow-400 text-black hover:bg-yellow-300 transition-colors font-bold"
          >
            ПРИНЯТЬ ВСЁ
          </button>
        </div>
      </div>
    </div>
  );
}
