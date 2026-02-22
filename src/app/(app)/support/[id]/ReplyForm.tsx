"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReplyForm({ ticketId }: { ticketId: string }) {
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!body.trim()) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/support/tickets/${ticketId}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Mesaj gönderilemedi');
            }

            setBody('');
            router.refresh(); // Fetch new messages
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-[#0f111a] border border-white/5 p-4 rounded-2xl shadow-xl flex flex-col gap-4">
            {error && <div className="text-red-400 text-xs font-medium px-4">{error}</div>}
            <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Yanıtınızı buraya yazın..."
                rows={3}
                required
                className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white text-sm outline-none focus:border-orange-500/50 transition-colors placeholder:text-gray-600 resize-y"
            />
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading || !body.trim()}
                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                >
                    {loading ? 'Gönderiliyor...' : 'Yanıt Gönder'}
                </button>
            </div>
        </form>
    );
}
