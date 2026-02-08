"use client";

import React from 'react';

export default function AppSkeleton() {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-deep)',
            display: 'flex',
            zIndex: 9999,
            overflow: 'hidden',
            fontFamily: "'Outfit', sans-serif"
        }}>
            {/* Sidebar Skeleton (Fixed) */}
            <div style={{
                width: '240px',
                height: '100dvh',
                borderRight: '1px solid var(--border-light)',
                background: 'var(--bg-card)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                position: 'fixed',
                left: 0,
                top: 0,
                zIndex: 10000
            }} className="sidebar-skeleton show-desktop">

                {/* Logo Placeholder */}
                <div className="skeleton-pulse" style={{ width: '70%', height: '32px', marginBottom: '12px' }} />

                {/* Branch Select Placeholder */}
                <div className="skeleton-pulse" style={{ width: '100%', height: '48px', borderRadius: '12px' }} />

                {/* Menu Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px', flex: 1 }}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0' }}>
                            <div className="skeleton-pulse" style={{ width: '24px', height: '24px', borderRadius: '6px' }} />
                            <div className="skeleton-pulse" style={{ width: '60%', height: '16px', borderRadius: '4px' }} />
                        </div>
                    ))}
                </div>

                {/* User Card (Bottom) */}
                <div className="skeleton-pulse" style={{ width: '100%', height: '80px', borderRadius: '16px', marginTop: 'auto' }} />
            </div>

            {/* Main Content Skeleton (Shifted) */}
            <div style={{
                flex: 1,
                padding: '24px',
                paddingLeft: '264px', // 240px sidebar + 24px padding
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                overflow: 'hidden',
                width: '100%',
                boxSizing: 'border-box'
            }} className="main-content-skeleton">

                {/* Greeting / Dashboard Header */}
                <div className="skeleton-pulse" style={{ width: '40%', height: '40px', borderRadius: '12px', marginTop: '20px' }} />

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton-pulse" style={{ height: '140px', borderRadius: '20px' }} />
                    ))}
                </div>

                {/* Big Table / Content Placeholder */}
                <div className="skeleton-pulse" style={{ flex: 1, width: '100%', borderRadius: '20px', minHeight: '300px' }} />
            </div>

            <style jsx global>{`
        .skeleton-pulse {
            background: rgba(255, 255, 255, 0.03);
            position: relative;
            overflow: hidden;
        }

        .skeleton-pulse::after {
            content: "";
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            background: linear-gradient(
                90deg,
                rgba(255, 255, 255, 0) 0%,
                rgba(255, 255, 255, 0.05) 50%,
                rgba(255, 255, 255, 0) 100%
            );
            transform: translateX(-100%);
            animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
            100% {
                transform: translateX(100%);
            }
        }

        @media (max-width: 1024px) {
            .show-desktop {
                display: none !important;
            }
            .sidebar-skeleton {
                display: none !important;
            }
            .main-content-skeleton {
                padding-left: 24px !important;
            }
        }
        
        @media (min-width: 1025px) {
            .show-mobile {
                display: none !important;
            }
        }
      `}</style>
        </div>
    );
}
