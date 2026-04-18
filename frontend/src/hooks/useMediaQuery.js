import { useState, useEffect } from 'react';

/**
 * Returns true when the given CSS media query matches.
 * Re-evaluates on window resize automatically.
 * Usage: const isDesktop = useMediaQuery('(min-width: 1024px)');
 */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (e) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
