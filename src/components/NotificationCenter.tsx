"use client";

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (Array.isArray(data)) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.isRead).length);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Polling for new notifications
        const timer = setInterval(fetchNotifications, 60000);
        return () => clearInterval(timer);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isRead: true })
            });
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'var(--bg-card)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--primary)',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    color: 'var(--text-main)',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: '0.3s'
                }}
                className="hover:scale-105 active:scale-95"
            >
                {unreadCount > 0 ? '🔔' : '🔕'}
                <span className="notif-text" style={{ fontSize: '12px' }}>Bildirimler</span>
                {unreadCount > 0 && (
                    <span style={{
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: '900',
                        padding: '1px 6px',
                        borderRadius: '10px',
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            <style jsx>{`
                @media (max-width: 768px) {
                    .notif-text {
                        display: none;
                    }
                    button {
                        padding: 6px 10px !important;
                    }
                }
            `}</style>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: '0',
                    width: '320px',
                    maxHeight: '400px',
                    background: 'var(--bg-card)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--primary)',
                    borderRadius: '20px',
                    boxShadow: 'var(--shadow-premium)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    zIndex: 1000
                }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontWeight: '800', fontSize: '14px', display: 'block' }}>🔔 Bildirim Merkezi</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{notifications.length} yeni aksiyon</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{ background: 'var(--bg-hover)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >✕</button>
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5, fontSize: '12px' }}>
                                Henüz bildirim yok.
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => !n.isRead && markAsRead(n.id)}
                                    style={{
                                        padding: '12px 16px',
                                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                                        background: n.isRead ? 'transparent' : 'rgba(255,100,0,0.05)',
                                        cursor: 'pointer',
                                        transition: '0.2s',
                                        display: 'flex',
                                        gap: '12px'
                                    }}
                                    className="hover:bg-white/5"
                                >
                                    <div style={{ fontSize: '20px' }}>
                                        {n.type === 'SUCCESS' ? '✅' : n.type === 'ERROR' ? '❌' : n.type === 'WARNING' ? '⚠️' : '📢'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '2px' }}>{n.title}</div>
                                        <div style={{ fontSize: '12px', opacity: 0.7, lineHeight: '1.4' }}>{n.message}</div>
                                        <div style={{ fontSize: '10px', opacity: 0.4, marginTop: '4px' }}>
                                            {new Date(n.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    {!n.isRead && (
                                        <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', marginTop: '5px' }}></div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div style={{ padding: '12px', borderTop: '1px solid var(--border-light)', textAlign: 'center' }}>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                window.location.href = '/notifications';
                            }}
                            style={{
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                padding: '8px 20px',
                                borderRadius: '10px',
                                fontSize: '12px',
                                fontWeight: '800',
                                cursor: 'pointer',
                                width: '100%'
                            }}
                        >
                            Tümünü Gör & Onaylar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
