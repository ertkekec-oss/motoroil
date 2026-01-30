// Custom Hooks - Kod tekrarını önler ve logic'i ayırır

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

// Debounced değer (arama için)
export function useDebounce<T>(value: T, delay: number = 500): T {
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

// Local storage hook
export function useLocalStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') return initialValue;

        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = useCallback((value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);

            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(error);
        }
    }, [key, storedValue]);

    return [storedValue, setValue] as const;
}

// Pagination hook
export function usePagination<T>(items: T[], itemsPerPage: number = 10) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(items.length / itemsPerPage);

    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return items.slice(start, end);
    }, [items, currentPage, itemsPerPage]);

    const goToPage = useCallback((page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    }, [totalPages]);

    const nextPage = useCallback(() => {
        goToPage(currentPage + 1);
    }, [currentPage, goToPage]);

    const prevPage = useCallback(() => {
        goToPage(currentPage - 1);
    }, [currentPage, goToPage]);

    return {
        currentPage,
        totalPages,
        paginatedItems,
        goToPage,
        nextPage,
        prevPage,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
    };
}

// Filtreleme hook
export function useFilters<T>(
    items: T[],
    filterFn: (item: T, filters: Record<string, any>) => boolean
) {
    const [filters, setFilters] = useState<Record<string, any>>({});

    const filteredItems = useMemo(() => {
        if (Object.keys(filters).length === 0) return items;
        return items.filter(item => filterFn(item, filters));
    }, [items, filters, filterFn]);

    const setFilter = useCallback((key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({});
    }, []);

    return {
        filters,
        filteredItems,
        setFilter,
        clearFilters,
    };
}

// Sıralama hook
export function useSorting<T>(items: T[], defaultKey?: keyof T, defaultDirection: 'asc' | 'desc' = 'asc') {
    const [sortKey, setSortKey] = useState<keyof T | undefined>(defaultKey);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultDirection);

    const sortedItems = useMemo(() => {
        if (!sortKey) return items;

        return [...items].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];

            if (aVal === bVal) return 0;

            const comparison = aVal < bVal ? -1 : 1;
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [items, sortKey, sortDirection]);

    const toggleSort = useCallback((key: keyof T) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    }, [sortKey]);

    return {
        sortedItems,
        sortKey,
        sortDirection,
        toggleSort,
    };
}

// Seçim hook (checkbox için)
export function useSelection<T extends { id: any }>(items: T[]) {
    const [selectedIds, setSelectedIds] = useState<Set<any>>(new Set());

    const selectedItems = useMemo(() => {
        return items.filter(item => selectedIds.has(item.id));
    }, [items, selectedIds]);

    const isSelected = useCallback((id: any) => {
        return selectedIds.has(id);
    }, [selectedIds]);

    const toggle = useCallback((id: any) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const selectAll = useCallback(() => {
        setSelectedIds(new Set(items.map(item => item.id)));
    }, [items]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const isAllSelected = selectedIds.size === items.length && items.length > 0;

    return {
        selectedIds: Array.from(selectedIds),
        selectedItems,
        isSelected,
        toggle,
        selectAll,
        clearSelection,
        isAllSelected,
    };
}

// Async işlem hook
export function useAsync<T>(asyncFunction: () => Promise<T>) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback(async () => {
        setStatus('loading');
        setData(null);
        setError(null);

        try {
            const response = await asyncFunction();
            setData(response);
            setStatus('success');
            return response;
        } catch (error) {
            setError(error as Error);
            setStatus('error');
            throw error;
        }
    }, [asyncFunction]);

    return { execute, status, data, error, isLoading: status === 'loading' };
}

// Click outside hook
export function useClickOutside<T extends HTMLElement = HTMLElement>(
    callback: () => void
) {
    const ref = useRef<T>(null);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        };

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [callback]);

    return ref;
}

// Window size hook
export function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
}

// Media query hook
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }

        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [matches, query]);

    return matches;
}

// Interval hook
export function useInterval(callback: () => void, delay: number | null) {
    const savedCallback = useRef(callback);

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        if (delay === null) return;

        const id = setInterval(() => savedCallback.current(), delay);
        return () => clearInterval(id);
    }, [delay]);
}

// Previous value hook
export function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T | undefined>(undefined);

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
}
