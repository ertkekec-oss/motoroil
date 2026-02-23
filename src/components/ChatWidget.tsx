"use client";

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';

export default function ChatWidget() {
    const { currentUser, staff } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [activeChatUser, setActiveChatUser] = useState<any>(null); // The user we are talking to
    const [conversations, setConversations] = useState<any[]>([]); // Recent convos
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [view, setView] = useState<'list' | 'chat'>('list');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch conversation list
    const fetchConversations = async () => {
        if (!currentUser) return;
        try {
            const res = await fetch(`/api/messages?userId=${currentUser.id}&type=list`);
            const data = await res.json();
            if (data.success) {
                setConversations(data.conversations);
            }
        } catch (e) {
            console.error('Failed to fetch conversations', e);
        }
    };

    // Fetch messages for active chat
    const fetchMessages = async () => {
        if (!activeChatUser || !currentUser) return;
        try {
            const res = await fetch(`/api/messages?userId=${currentUser.id}&otherUserId=${activeChatUser.id}`);
            const data = await res.json();
            if (data.success) {
                setMessages(data.messages);
                scrollToBottom();
            }
        } catch (e) {
            console.error('Failed to fetch messages', e);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !activeChatUser || !currentUser) return;

        // Optimistic update
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
                body: JSON.stringify({
                    senderId: currentUser.id,
                    receiverId: activeChatUser.id,
                    content: tempMsg.content
                })
            });
            fetchMessages(); // Refresh to get real ID and status
            fetchConversations(); // Update list preview
        } catch (e) {
            console.error('Send failed', e);
        }
    };

    // Polling
    useEffect(() => {
        if (isOpen && currentUser) {
            fetchConversations();
            const interval = setInterval(() => {
                fetchConversations();
                if (view === 'chat' && activeChatUser) {
                    fetchMessages();
                }
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [isOpen, view, activeChatUser, currentUser]);

    // Initial load when opening chat view
    useEffect(() => {
        if (view === 'chat' && activeChatUser && currentUser) {
            fetchMessages();
        }
    }, [view, activeChatUser, currentUser]);

    // If no user is logged in, don't show chat
    if (!currentUser) return null;

    const startChat = (user: any) => {
        if (user.id === currentUser.id) return; // Can't chat with self
        setActiveChatUser(user);
        setView('chat');
    };

    // Filter staff list to exclude self
    const availableStaff = staff.filter(s => s.id !== currentUser.id && s.status !== 'Pasif');

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed z-[9000] rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 
                    ${isOpen ? 'bg-red-500 rotate-90' : 'bg-indigo-600'}
                    bottom-20 right-6 w-14 h-14
                    md:bottom-6 md:right-6 md:w-14 md:h-14
                    max-md:top-[12px] max-md:right-[80px] max-md:bottom-auto max-md:w-10 max-md:h-10
                `}
            >
                {isOpen ? (
                    <span className="text-xl md:text-2xl text-white">✕</span>
                ) : (
                    <span className="text-xl md:text-2xl text-white">💬</span>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className={`fixed z-[9000] w-[350px] max-md:w-[90vw] max-md:left-[5vw] h-[500px] max-md:h-[60vh] bg-[#0c0e14] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-300 backdrop-blur-xl bg-opacity-95
                    bottom-40 right-6 md:bottom-24 md:right-6
                    max-md:top-20 max-md:bottom-auto
                    ${view === 'chat' ? 'slide-in-from-right-10' : 'slide-in-from-bottom-10'}
                `}>

                    {/* Header */}
                    <div className="h-14 bg-white/5 border-b border-white/5 flex items-center px-4 justify-between shrink-0">
                        {view === 'chat' ? (
                            <div className="flex items-center gap-3">
                                <button onClick={() => setView('list')} className="text-white/60 hover:text-white mr-1 text-sm">◀ Geri</button>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                    {activeChatUser?.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white leading-tight">{activeChatUser?.name}</span>
                                    <span className="text-[10px] text-green-400 leading-tight">Çevrimiçi</span>
                                </div>
                            </div>
                        ) : (
                            <span className="text-sm font-bold text-white">İletişim & Mesajlar</span>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar">
                        {view === 'list' ? (
                            <div className="space-y-4">
                                {/* Recent Conversations */}
                                {conversations.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">Son Mesajlar</div>
                                        {conversations.map(conv => (
                                            <div
                                                key={conv.userId}
                                                onClick={() => startChat({ id: conv.userId, name: conv.name })}
                                                className="p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors flex items-center gap-3 group"
                                            >
                                                <div className="relative">
                                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white/70 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                        {conv.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    {conv.unreadCount > 0 && (
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] flex items-center justify-center text-white font-bold border border-[#0c0e14]">
                                                            {conv.unreadCount}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline mb-0.5">
                                                        <span className="text-xs font-bold text-gray-200 truncate">{conv.name}</span>
                                                        <span className="text-[9px] text-gray-500">
                                                            {new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-gray-400 truncate">{conv.lastMessage}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* All Staff */}
                                <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">Tüm Personel</div>
                                    {availableStaff.map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => startChat(s)}
                                            className="p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors flex items-center gap-3 opacity-80 hover:opacity-100"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-gray-400 border border-white/5">
                                                {s.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-xs font-medium text-gray-300">{s.name}</span>
                                            <div className="flex-1"></div>
                                            <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 min-h-full justify-end">
                                {messages.length === 0 && (
                                    <div className="text-center text-gray-500 text-xs py-10">
                                        Henüz mesaj yok. Merhaba de! 👋
                                    </div>
                                )}
                                {messages.map((msg, i) => {
                                    const isMe = msg.senderId === currentUser.id;
                                    return (
                                        <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`
                                                max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed break-words
                                                ${isMe
                                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                                    : 'bg-zinc-800 text-gray-200 rounded-bl-none border border-white/5'}
                                            `}>
                                                {msg.content}
                                                <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-zinc-500'}`}>
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
                        <div className="p-3 bg-white/5 border-t border-white/10 shrink-0">
                            <form
                                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                                className="flex gap-2"
                            >
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Mesaj yaz..."
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                />
                                <button
                                    type="submit"
                                    className="bg-indigo-600 text-white rounded-xl w-10 flex items-center justify-center hover:bg-indigo-500 transition-colors"
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
