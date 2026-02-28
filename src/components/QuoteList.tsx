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
            <div className="bg-[#0a0a0b]/80 border border-white/5 rounded-3xl p-20 flex flex-col items-center justify-center gap-4 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin z-10"></div>
                <div className="text-white/40 font-black tracking-[0.2em] uppercase text-xs z-10">Teklifler Yükleniyor...</div>
            </div>
        );
    }

    if (filteredQuotes.length === 0) {
        return (
            <div className="bg-[#0a0a0b]/80 border border-white/5 rounded-3xl p-16 text-center flex flex-col items-center gap-6 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="text-6xl opacity-20 filter grayscale">📂</div>
                <div className="max-w-md">
                    <h3 className="text-xl font-black mb-2 text-white">Kayıt Bulunamadı</h3>
                    <p className="text-white/40 text-sm font-bold">Arama kriterlerinize uygun teklif kaydı bulunmuyor. Lütfen filtreleri değiştirin veya yeni bir kayıt oluşturun.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {/* Desktop Table */}
            <div className="hidden md:block bg-[#0a0a0b]/80 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-0">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/[0.02]">
                            <th className="p-6 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Teklif Detayı</th>
                            <th className="p-6 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Müşteri</th>
                            <th className="p-6 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-center">Durum</th>
                            <th className="p-6 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-right">Tutar</th>
                            <th className="p-6 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                        {filteredQuotes.map((quote) => (
                            <tr key={quote.id} className="hover:bg-white/[0.04] transition-all duration-300 group">
                                <td className="p-6">
                                    <div className="font-mono text-primary font-black tracking-wider text-sm mb-1">{quote.quoteNo}</div>
                                    <div className="text-[10px] text-white/40 font-bold tracking-widest uppercase flex items-center gap-2">
                                        <span>{new Date(quote.date).toLocaleDateString('tr-TR')}</span>
                                        {quote.validUntil && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                                <span className="text-amber-500/80">Vade: {new Date(quote.validUntil).toLocaleDateString('tr-TR')}</span>
                                            </>
                                        )}
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="font-bold text-white text-sm group-hover:text-primary transition-colors duration-300">{quote.customer?.name}</div>
                                    <div className="text-[11px] text-white/40 font-medium mt-0.5 tracking-wider">{quote.customer?.phone || 'İletişim yok'}</div>
                                </td>
                                <td className="p-6 text-center">
                                    {getStatusBadge(quote.status)}
                                </td>
                                <td className="p-6 text-right">
                                    <div className="font-black text-lg text-white tabular-nums">
                                        {Number(quote.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-[10px] ml-0.5 text-white/40">₺</span>
                                    </div>
                                    <div className="text-[9px] text-primary/60 uppercase font-black tracking-widest">KDV Dahil</div>
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 transform sm:translate-x-4 group-hover:translate-x-0">
                                        <button onClick={() => onPreview(quote)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all duration-300" title="Görüntüle">
                                            <span className="text-sm">👁️</span>
                                        </button>
                                        <button onClick={() => onEdit(quote)} className="w-10 h-10 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 flex items-center justify-center transition-all duration-300" title="Düzenle">
                                            <span className="text-sm">✏️</span>
                                        </button>
                                        {quote.status !== 'Converted' && (
                                            <button onClick={() => handleConvert(quote)} className="w-10 h-10 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 flex items-center justify-center transition-all duration-300" title="Faturaya Dönüştür">
                                                <span className="text-sm">⚡</span>
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(quote.id)} className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-all duration-300" title="Sil">
                                            <span className="text-sm">🗑️</span>
                                        </button>
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
                    <div key={quote.id} className="bg-[#0a0a0b]/80 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all duration-300" onClick={() => onEdit(quote)}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="text-primary font-mono font-black tracking-wider text-xs mb-1">{quote.quoteNo}</div>
                                <div className="text-sm font-bold text-white">{quote.customer?.name}</div>
                            </div>
                            {getStatusBadge(quote.status)}
                        </div>
                        <div className="flex justify-between items-end border-t border-white/[0.02] pt-4 mt-2">
                            <div className="text-[11px] text-white/40 font-bold tracking-widest uppercase">
                                {new Date(quote.date).toLocaleDateString('tr-TR')}
                            </div>
                            <div className="text-lg font-black text-white tabular-nums">
                                {Number(quote.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-[10px] text-white/30">₺</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
