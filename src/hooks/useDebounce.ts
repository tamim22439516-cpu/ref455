import { useState, useEffect } from 'react';

/**
 * Hook to debounce any fast-changing value (e.g. search query input)
 * @param value The value to debounce
 * @param delay Milliseconds to delay updating the returned value
 */
export function useDebounce<T>(value: T, delay: number = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
