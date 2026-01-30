/**
 * Responsive Container Component
 * Automatically adjusts padding and layout for different screen sizes
 */

'use client';

import { useDeviceType } from '@/hooks/useResponsive';
import { ReactNode } from 'react';

interface ResponsiveContainerProps {
    children: ReactNode;
    className?: string;
    noPadding?: boolean;
}

export function ResponsiveContainer({ children, className = '', noPadding = false }: ResponsiveContainerProps) {
    const deviceType = useDeviceType();

    const getPadding = () => {
        if (noPadding) return '0';
        switch (deviceType) {
            case 'mobile':
                return '12px 16px 80px 16px'; // Extra bottom padding for mobile nav
            case 'tablet':
                return '20px 24px';
            case 'desktop':
                return '40px 20px';
        }
    };

    return (
        <div
            className={`container ${className}`}
            style={{
                padding: getPadding(),
                maxWidth: deviceType === 'desktop' ? '1400px' : '100%',
                margin: '0 auto',
            }}
        >
            {children}
        </div>
    );
}

/**
 * Responsive Grid Component
 * Automatically adjusts columns based on screen size
 */
interface ResponsiveGridProps {
    children: ReactNode;
    mobileColumns?: number;
    tabletColumns?: number;
    desktopColumns?: number;
    gap?: string;
    className?: string;
}

export function ResponsiveGrid({
    children,
    mobileColumns = 1,
    tabletColumns = 2,
    desktopColumns = 3,
    gap = '16px',
    className = '',
}: ResponsiveGridProps) {
    const deviceType = useDeviceType();

    const getColumns = () => {
        switch (deviceType) {
            case 'mobile':
                return mobileColumns;
            case 'tablet':
                return tabletColumns;
            case 'desktop':
                return desktopColumns;
        }
    };

    return (
        <div
            className={className}
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${getColumns()}, 1fr)`,
                gap,
            }}
        >
            {children}
        </div>
    );
}

/**
 * Responsive Card Component
 * Adjusts padding and font sizes for mobile
 */
interface ResponsiveCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export function ResponsiveCard({ children, className = '', onClick }: ResponsiveCardProps) {
    const deviceType = useDeviceType();

    const getPadding = () => {
        switch (deviceType) {
            case 'mobile':
                return '16px';
            case 'tablet':
                return '20px';
            case 'desktop':
                return '24px';
        }
    };

    return (
        <div
            className={`card glass ${className}`}
            onClick={onClick}
            style={{
                padding: getPadding(),
                cursor: onClick ? 'pointer' : 'default',
            }}
        >
            {children}
        </div>
    );
}
