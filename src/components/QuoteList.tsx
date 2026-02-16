import { useState, useMemo } from 'react';
import { useModal } from '@/contexts/ModalContext';

interface QuoteListProps {
    onEdit: (quote: any) => void;
    onPreview: (quote: any) => void;
    initialQuotes: any[];
    isLoading: boolean;
    searchTerm: string;
    statusFilter: string;
    refreshList: () => void;
}

export default function QuoteList({ onEdit, onPreview, initialQuotes, isLoading, searchTerm, statusFilter, refreshList }: QuoteListProps) {
    const { showError, showSuccess, showConfirm } = useModal();

    const filteredQuotes = useMemo(() => {
        return initialQuotes.filter(q => {
            const matchesSearch = q.quoteNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [initialQuotes, searchTerm, statusFilter]);

    const handleDelete = async (id: string) => {
        showConfirm('Teklifi Sil', 'Bu teklifi silmek istediğinize emin misiniz?', async () => {
            try {
                const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showSuccess('Başarılı', 'Teklif silindi');
                    refreshList();
                } else {
                    showError('Hata', 'Silinirken hata oluştu');
                }
            } catch (error) {
                showError('Hata', 'İşlem sırasında bir hata oluştu');
            }
        });
    };

    const handleConvert = async (quote: any) => {
        showConfirm('Faturaya Dönüştür', 'Bu teklifi satış faturasına dönüştürmek istediğinize emin misiniz? Stoklar düşülecek ve cari borçlandırılacak.', async () => {
            try {
                const res = await fetch(`/api/quotes/${quote.id}/convert`, { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                    showSuccess('Başarılı', 'Teklif başarıyla faturaya dönüştürüldü. Stok ve cari güncellendi.');
                    refreshList();
                } else {
                    showError('Hata', data.error);
                }
            } catch (error) {
                showError('Hata', 'Dönüştürme sırasında hata oluştu.');
            }
        });
    };

    const getStatusBadge = (status: string) => {
        const base = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ";
        switch (status) {
            case 'Draft': return <span className={base + "bg-white/10 text-white"}>Taslak</span>;
            case 'Sent': return <span className={base + "bg-blue-500/20 text-blue-400"}>Gönderildi</span>;
            case 'Accepted': return <span className={base + "bg-green-500/20 text-green-400"}>Onaylandı</span>;
            case 'Rejected': return <span className={base + "bg-red-500/20 text-red-400"}>Reddedildi</span>;
            case 'Converted': return <span className={base + "bg-purple-500/20 text-purple-400"}>Faturalandı</span>;
            default: return <span className={base + "bg-white/5 text-muted"}>{status}</span>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <div className="loading loading-spinner loading-lg text-primary"></div>
                <div className="text-muted font-bold animate-pulse">Teklifler Hazırlanıyor...</div>
            </div>
        );
    }

    if (filteredQuotes.length === 0) {
        return (
            <div className="card glass-plus p-12 text-center flex flex-col items-center gap-4">
                <div className="text-6xl opacity-30">📂</div>
                <div className="max-w-xs">
                    <h3 className="text-xl font-bold mb-1">Teklif Bulunamadı</h3>
                    <p className="text-muted text-sm">Arama kriterlerinize uygun teklif kaydı bulunmuyor.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {/* Desktop Table */}
            <div className="hidden md:block card glass-plus overflow-hidden border-0 shadow-2xl">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5 text-muted font-bold text-[11px] uppercase tracking-tighter">
                            <th className="p-4">Teklif Detayı</th>
                            <th className="p-4">Müşteri</th>
                            <th className="p-4 text-center">Durum</th>
                            <th className="p-4 text-right">Tutar</th>
                            <th className="p-4 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredQuotes.map((quote) => (
                            <tr key={quote.id} className="hover:bg-white/5 transition-all group">
                                <td className="p-4">
                                    <div className="font-mono text-primary font-bold">{quote.quoteNo}</div>
                                    <div className="text-[10px] text-muted font-semibold mt-0.5 uppercase">
                                        {new Date(quote.date).toLocaleDateString('tr-TR')}
                                        {quote.validUntil && <span className="ml-2 opacity-60">• Vade: {new Date(quote.validUntil).toLocaleDateString('tr-TR')}</span>}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="font-bold text-white text-sm">{quote.customer?.name}</div>
                                    <div className="text-xs text-muted mt-0.5">{quote.customer?.phone || 'İletişim yok'}</div>
                                </td>
                                <td className="p-4 text-center">
                                    {getStatusBadge(quote.status)}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="font-black text-lg text-white">
                                        {Number(quote.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-[10px] ml-0.5">₺</span>
                                    </div>
                                    <div className="text-[10px] text-muted -mt-1 uppercase font-bold">KDV Dahil</div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                        <button onClick={() => onPreview(quote)} className="btn btn-square btn-ghost btn-sm hover:bg-primary/20 hover:text-primary" title="Görüntüle">👁️</button>
                                        <button onClick={() => onEdit(quote)} className="btn btn-square btn-ghost btn-sm hover:bg-blue-500/20 hover:text-blue-400" title="Düzenle">✏️</button>
                                        {quote.status !== 'Converted' && (
                                            <button onClick={() => handleConvert(quote)} className="btn btn-square btn-ghost btn-sm hover:bg-success/20 hover:text-success" title="Faturaya Dönüştür">⚡</button>
                                        )}
                                        <button onClick={() => handleDelete(quote.id)} className="btn btn-square btn-ghost btn-sm hover:bg-error/20 hover:text-red-400" title="Sil">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {filteredQuotes.map((quote) => (
                    <div key={quote.id} className="card glass-plus p-4 border border-white/10" onClick={() => onEdit(quote)}>
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="text-primary font-mono font-bold">{quote.quoteNo}</div>
                                <div className="text-lg font-bold mt-1">{quote.customer?.name}</div>
                            </div>
                            {getStatusBadge(quote.status)}
                        </div>
                        <div className="flex justify-between items-end border-t border-white/5 pt-3 mt-3">
                            <div className="text-xs text-muted">
                                {new Date(quote.date).toLocaleDateString('tr-TR')}
                            </div>
                            <div className="text-xl font-black text-white">
                                {Number(quote.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
