/**
 * useLocalStorage — Custom hook that syncs state with localStorage.
 *
 * How it works:
 *   1. On mount, tries to read an existing value from localStorage.
 *   2. Falls back to the provided initialValue if nothing is found.
 *   3. Every time the value changes, it is written back to localStorage
 *      so data persists across page refreshes.
 *
 * @param {string} key          - The localStorage key to read/write.
 * @param {*}      initialValue - The default value when no data exists.
 * @returns {[*, Function]}     - [storedValue, setValue] just like useState.
 */
import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  // Lazy initializer: run once on mount to hydrate state from storage.
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`useLocalStorage: could not read key "${key}":`, error);
      return initialValue;
    }
  });

  // Write to localStorage whenever the value changes.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`useLocalStorage: could not write key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
