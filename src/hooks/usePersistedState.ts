import { useCallback, useEffect, useState } from 'react';

/**
 * `useState` that persists to localStorage under the given key.
 *
 * - SSR-safe: returns the initial value during server render, hydrates on mount.
 * - Tolerates malformed JSON: falls back to the initial value.
 * - Multi-tab aware: listens for `storage` events and updates in place.
 *
 * Use for admin filter / sort preferences so reloads don't reset operator state.
 * Don't use for sensitive data — localStorage is plain text.
 */
export default function usePersistedState<T>(
  key: string,
  initial: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initial;
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota exceeded / private-mode safari — silently drop.
    }
  }, [key, value]);

  // Multi-tab sync: when another tab writes the same key, mirror it here.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      if (e.newValue === null) {
        setValue(initial);
        return;
      }
      try {
        setValue(JSON.parse(e.newValue) as T);
      } catch {
        // ignore — keep current
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // initial intentionally not in deps — we read it lazily on storage events
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => (typeof next === 'function' ? (next as (p: T) => T)(prev) : next));
  }, []);

  return [value, update];
}
