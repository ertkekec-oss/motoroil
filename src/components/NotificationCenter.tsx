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
                    background: 'transparent',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    fontSize: '24px',
                    padding: '8px',
                    borderRadius: '12px',
                    transition: '0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                className="hover:bg-white/5"
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: '900',
                        padding: '2px 5px',
                        borderRadius: '50%',
                        border: '2px solid var(--bg-card)'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 15px)',
                    left: '0',
                    width: '320px',
                    maxHeight: '400px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '16px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    zIndex: 3000,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '800', fontSize: '14px' }}>Bildirimler</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
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
                </div>
            )}
        </div>
    );
}
