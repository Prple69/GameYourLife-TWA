import { useState, useRef, useCallback } from 'react';
import friendsService from '../services/friendsService';

export default function FriendSearchBar({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef(null);

  const handleChange = useCallback((e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await friendsService.searchUsers(q);
        setResults(data);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleSelect = (user) => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    onSelect(user);
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        onFocus={() => results.length > 0 && setShowResults(true)}
        placeholder="Найти игрока по имени..."
        className="w-full px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded text-sm focus:outline-none focus:border-yellow-400"
      />
      {loading && (
        <span className="absolute right-3 top-2 text-gray-400 text-xs">...</span>
      )}
      {showResults && results.length > 0 && (
        <ul className="absolute z-10 w-full bg-gray-800 border border-gray-600 rounded mt-1 max-h-48 overflow-y-auto">
          {results.map((user) => (
            <li
              key={user.id}
              onMouseDown={() => handleSelect(user)}
              className="px-3 py-2 hover:bg-gray-700 cursor-pointer flex items-center gap-2 text-sm"
            >
              <span className="text-yellow-400">Lv{user.lvl}</span>
              <span className="text-white">{user.display_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
