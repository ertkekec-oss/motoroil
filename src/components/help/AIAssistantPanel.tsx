'use client';

import React, { useState } from 'react';
import { EnterpriseCard, EnterpriseInput, EnterpriseButton } from '../ui/enterprise';
import Link from 'next/link';

interface Message {
    id: string;
    role: 'USER' | 'ASSISTANT' | 'SYSTEM';
    content: string;
}

export function AIAssistantPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'USER', content: userMsg }]);
        setLoading(true);

        try {
            let res;
            if (!sessionId) {
                res = await fetch('/api/help/ai/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: userMsg })
                });
            } else {
                res = await fetch('/api/help/ai/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId, message: userMsg })
                });
            }

            const data = await res.json();
            if (data.sessionId && !sessionId) {
                setSessionId(data.sessionId);
            }

            if (data.answer) {
                setMessages(prev => [...prev, { id: Date.now().toString() + '1', role: 'ASSISTANT', content: data.answer }]);
            }
            if (data.suggestTicket) {
                setMessages(prev => [...prev, { id: Date.now().toString() + '2', role: 'SYSTEM', content: 'Cevabım size yardımcı oldu mu? Eğer olmadıysa hemen bir destek talebi oluşturabiliriz.' }]);
            }
        } catch (error) {
            console.error('AI Error:', error);
            setMessages(prev => [...prev, { id: Date.now().toString() + 'err', role: 'SYSTEM', content: 'Bir hata oluştu, lütfen daha sonra tekrar deneyin.' }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-50 text-xl font-bold border border-slate-700 dark:border-slate-300"
            >
                AI
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-full max-w-[380px] h-[550px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-xl flex flex-col z-50 border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                        AI
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Periodya Support AI</h3>
                        <p className="text-[11px] text-slate-500">Active</p>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2">
                    ✕
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-slate-50/50 dark:bg-slate-900">
                {messages.length === 0 ? (
                    <div className="text-center text-slate-500 dark:text-slate-400 mt-10">
                        <p>Merhaba, Periodya platform asistanıyım.</p>
                        <p className="mt-2 text-xs">Size nasıl yardımcı olabilirim?</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-3 ${msg.role === 'USER'
                                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-tr-sm'
                                    : msg.role === 'SYSTEM'
                                        ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 rounded-tl-sm w-full'
                                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm shadow-sm'
                                }`}>
                                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                                {msg.role === 'SYSTEM' && msg.content.includes('yardımcı oldu mu') && (
                                    <div className="mt-4 flex gap-2">
                                        <button onClick={() => setMessages(prev => [...prev, { id: Date.now().toString(), role: 'USER', content: 'Evet, işime yaradı.' }])} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-white border border-rose-200 text-slate-700 hover:bg-slate-50 transition-colors">Evet</button>
                                        <Link href="/help/tickets/new" className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors">Hayır, Bilet Oluştur</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm shadow-sm p-3">
                            <span className="animate-pulse text-slate-400">Yazıyor...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                <div className="flex gap-2">
                    <EnterpriseInput
                        className="flex-1 focus:ring-0 rounded-full h-10 px-4!"
                        placeholder="Sorunuzu buraya yazın..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="w-10 h-10 shrink-0 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-full flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity"
                    >
                        ↑
                    </button>
                </div>
            </form>
        </div>
    );
}
