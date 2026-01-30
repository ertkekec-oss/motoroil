/**
 * Responsive Design Utilities
 * Mobile and Tablet optimized helpers
 */

// Breakpoint detection hook
export function useMediaQuery(query: string): boolean {
    if (typeof window === 'undefined') return false;

    const [matches, setMatches] = React.useState(() => {
        return window.matchMedia(query).matches;
    });

    React.useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);

    return matches;
}

// Predefined breakpoint hooks
export function useIsMobile() {
    return useMediaQuery('(max-width: 768px)');
}

export function useIsTablet() {
    return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
}

export function useIsDesktop() {
    return useMediaQuery('(min-width: 1025px)');
}

// Device type detection
export function useDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const isMobile = useIsMobile();
    const isTablet = useIsTablet();

    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    return 'desktop';
}

// Touch device detection
export function useIsTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Viewport dimensions
export function useViewport() {
    const [viewport, setViewport] = React.useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });

    React.useEffect(() => {
        const handleResize = () => {
            setViewport({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return viewport;
}

import React from 'react';
