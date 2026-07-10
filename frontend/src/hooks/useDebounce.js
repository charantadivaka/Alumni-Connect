import { useState, useEffect } from 'react';

/**
 * Hook to debounce a rapidly changing value.
 * Useful for search inputs to prevent firing API requests on every keystroke.
 * 
 * @param {any} value - The value to debounce (e.g. search term)
 * @param {number} delay - Delay in milliseconds
 * @returns {any} The debounced value
 */
export function useDebounce(value, delay = 500) {
    const [debouncedValue, setDebouncedValue] = useState(value);

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
