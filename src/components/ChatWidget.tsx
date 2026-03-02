"use client";

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';

export default function ChatWidget() {
    const { currentUser, staff } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [activeChatUser, setActiveChatUser] = useState<any>(null);
    const [conversations, setConversations] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [view, setView] = useState<'list' | 'chat'>('list');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ─── Logic: 0 değişiklik ──────────────────────────────────────────────────
    const fetchConversations = async () => {
        if (!currentUser) return;
        try {
            const res = await fetch(`/api/messages?userId=${currentUser.id}&type=list`);
            const data = await res.json();
            if (data.success) setConversations(data.conversations);
        } catch (e) { console.error('Failed to fetch conversations', e); }
    };

    const fetchMessages = async () => {
        if (!activeChatUser || !currentUser) return;
        try {
            const res = await fetch(`/api/messages?userId=${currentUser.id}&otherUserId=${activeChatUser.id}`);
            const data = await res.json();
            if (data.success) { setMessages(data.messages); scrollToBottom(); }
        } catch (e) { console.error('Failed to fetch messages', e); }
    };

    const scrollToBottom = () => {
        setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !activeChatUser || !currentUser) return;
        const tempMsg = {
            id: 'temp-' + Date.now(),
            senderId: currentUser.id,
            receiverId: activeChatUser.id,
            content: newMessage,
            createdAt: new Date().toISOString(),
            isRead: false
        };
        setMessages([...messages, tempMsg]);
        setNewMessage('');
        scrollToBottom();
        try {
            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senderId: currentUser.id, receiverId: activeChatUser.id, content: tempMsg.content })
            });
            fetchMessages();
            fetchConversations();
        } catch (e) { console.error('Send failed', e); }
    };

    useEffect(() => {
        if (isOpen && currentUser) {
            fetchConversations();
            const interval = setInterval(() => {
                fetchConversations();
                if (view === 'chat' && activeChatUser) fetchMessages();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [isOpen, view, activeChatUser, currentUser]);

    useEffect(() => {
        if (view === 'chat' && activeChatUser && currentUser) fetchMessages();
    }, [view, activeChatUser, currentUser]);

    if (!currentUser) return null;

    const startChat = (user: any) => {
        if (user.id === currentUser.id) return;
        setActiveChatUser(user);
        setView('chat');
    };

    const availableStaff = staff.filter(s => s.id !== currentUser.id && s.status !== 'Pasif');
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <>
            {/* Toggle Button — Enterprise: slate, no glow, rounded-lg */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed z-[9000] flex items-center justify-center transition-all duration-200 shadow-sm border
                    ${isOpen
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        : 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'}
                    bottom-20 right-6 w-10 h-10 rounded-lg
                    md:bottom-6 md:right-6
                    max-md:top-[14px] max-md:right-[80px] max-md:bottom-auto max-md:w-8 max-md:h-8
                `}
            >
                <span className="text-base">{isOpen ? '✕' : '💬'}</span>
            </button>

            {/* Chat Window — flat slate, shadow-sm, rounded-xl */}
            {isOpen && (
                <div className="fixed z-[9000] w-[350px] max-md:w-[90vw] max-md:left-[5vw] h-[500px] max-md:h-[60vh] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col overflow-hidden animate-in fade-in duration-200 bottom-36 right-6 md:bottom-20 md:right-6 max-md:top-20 max-md:bottom-auto">

                    {/* Header */}
                    <div className="h-12 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 justify-between shrink-0">
                        {view === 'chat' ? (
                            <div className="flex items-center gap-3">
                                <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-700 dark:hover:text-white mr-1 text-xs">◀ Geri</button>
                                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {activeChatUser?.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{activeChatUser?.name}</span>
                                    <span className="text-[10px] text-emerald-500 leading-tight">Çevrimiçi</span>
                                </div>
                            </div>
                        ) : (
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">İletişim & Mesajlar</span>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
                        {view === 'list' ? (
                            <div className="space-y-4">
                                {conversations.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 mb-2">Son Mesajlar</div>
                                        {conversations.map(conv => (
                                            <div
                                                key={conv.userId}
                                                onClick={() => startChat({ id: conv.userId, name: conv.name })}
                                                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors flex items-center gap-3 border border-slate-200 dark:border-slate-800"
                                            >
                                                <div className="relative">
                                                    <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                                        {conv.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    {conv.unreadCount > 0 && (
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] flex items-center justify-center text-white font-bold">
                                                            {conv.unreadCount}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline mb-0.5">
                                                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{conv.name}</span>
                                                        <span className="text-[9px] text-slate-400 dark:text-slate-500">
                                                            {new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{conv.lastMessage}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 mb-2">Tüm Personel</div>
                                    {availableStaff.map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => startChat(s)}
                                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer transition-colors flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                                                {s.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{s.name}</span>
                                            <div className="flex-1"></div>
                                            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 min-h-full justify-end">
                                {messages.length === 0 && (
                                    <div className="text-center text-slate-400 dark:text-slate-500 text-xs py-10">
                                        Henüz mesaj yok. Merhaba de! 👋
                                    </div>
                                )}
                                {messages.map((msg, i) => {
                                    const isMe = msg.senderId === currentUser.id;
                                    return (
                                        <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`
                                                max-w-[75%] px-3 py-2 rounded-xl text-xs leading-relaxed break-words
                                                ${isMe
                                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-br-none'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700'}
                                            `}>
                                                {msg.content}
                                                <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-white/50 dark:text-slate-500' : 'text-slate-400 dark:text-slate-500'}`}>
                                                    {msg.createdAt && !msg.createdAt.startsWith('temp')
                                                        ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                        : 'Gönderiliyor...'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    {view === 'chat' && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Mesaj yaz..."
                                    className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors"
                                />
                                <button
                                    type="submit"
                                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg w-9 flex items-center justify-center hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors text-sm"
                                >
                                    ➤
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
