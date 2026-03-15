'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EnterpriseTextarea, EnterpriseButton } from '@/components/ui/enterprise';
import { useModal } from '@/contexts/ModalContext';

export function TicketCommentForm({ ticketId, initialStatus }: { ticketId: string, initialStatus: string }) {
    const router = useRouter();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { showError } = useModal();

    // If resolved or closed, disable
    const isClosed = initialStatus === 'CLOSED' || initialStatus === 'RESOLVED';

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || loading || isClosed) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/support/tickets/${ticketId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            if (res.ok) {
                setMessage('');
                router.refresh();
            } else {
                showError('Hata', 'Yorum gönderilemedi, lütfen tekrar deneyin.');
            }
        } catch (error) {
            console.error('Comment Post Error:', error);
            showError('Hata', 'Ağ hatası.');
        } finally {
            setLoading(false);
        }
    };

    if (isClosed) return <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-center text-slate-500">Bu bilet kapatıldığı için yeni yorum eklenemez.</div>;

    return (
        <form onSubmit={handleComment} className="mt-6 flex flex-col gap-3 items-end">
            <EnterpriseTextarea
                placeholder="Destek ekibi için yanıtınızı buraya yazın..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
            />
            <EnterpriseButton type="submit" disabled={loading}>
                {loading ? 'Gönderiliyor...' : 'Yanıt Gönder'}
            </EnterpriseButton>
        </form>
    );
}
