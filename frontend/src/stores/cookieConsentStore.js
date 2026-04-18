import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useCookieConsentStore = create(
  persist(
    (set) => ({
      // null = not answered; 'accepted' = all; 'minimal' = only necessary
      cookieConsent: null,
      setCookieConsent: (choice) => set({ cookieConsent: choice }),
    }),
    {
      name: 'cookie-consent',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useCookieConsentStore;
