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
        const base = "px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider inline-flex items-center justify-center ";
        switch (status) {
            case 'Draft': return <span className={base + "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"}>Taslak</span>;
            case 'Sent': return <span className={base + "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"}>Gönderildi</span>;
            case 'Accepted': return <span className={base + "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"}>Onaylandı</span>;
            case 'Rejected': return <span className={base + "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"}>Reddedildi</span>;
            case 'Converted': return <span className={base + "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"}>Faturalandı</span>;
            default: return <span className={base + "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"}>{status}</span>;
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[16px] p-20 flex flex-col items-center justify-center gap-4 shadow-sm relative overflow-hidden">
                <div className="w-10 h-10 border-4 border-slate-200 dark:border-white/10 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin z-10"></div>
                <div className="text-slate-500 dark:text-slate-400 font-medium tracking-wider uppercase text-[11px] z-10">Teklifler Yükleniyor...</div>
            </div>
        );
    }

    if (filteredQuotes.length === 0) {
        return (
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[16px] p-16 text-center flex flex-col items-center gap-6 shadow-sm">
                <div className="text-5xl opacity-40 grayscale">📂</div>
                <div className="max-w-md">
                    <h3 className="text-[16px] font-semibold mb-2 text-slate-900 dark:text-white">Kayıt Bulunamadı</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-[13px]">Arama kriterlerinize uygun teklif kaydı bulunmuyor. Lütfen filtreleri değiştirin veya yeni bir kayıt oluşturun.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {/* Desktop Table */}
            <div className="hidden md:block bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[16px] overflow-hidden shadow-sm relative z-0">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-[#1e293b] border-b border-slate-200 dark:border-white/10">
                        <tr>
                            <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Teklif Detayı</th>
                            <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Müşteri</th>
                            <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">Durum</th>
                            <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Tutar</th>
                            <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {filteredQuotes.map((quote) => (
                            <tr key={quote.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors duration-200 group">
                                <td className="px-6 py-4">
                                    <div className="font-mono text-blue-600 dark:text-blue-400 font-medium tracking-wide text-[13px] mb-1">{quote.quoteNo}</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <span>{new Date(quote.date).toLocaleDateString('tr-TR')}</span>
                                        {quote.validUntil && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20"></span>
                                                <span className="text-amber-600 dark:text-amber-500/80">Vade: {new Date(quote.validUntil).toLocaleDateString('tr-TR')}</span>
                                            </>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900 dark:text-white text-[13px] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">{quote.customer?.name}</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{quote.customer?.phone || 'İletişim yok'}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {getStatusBadge(quote.status)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="font-semibold text-[14px] text-slate-900 dark:text-white tabular-nums">
                                        {Number(quote.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-[11px] ml-0.5 text-slate-500">₺</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">KDV Dahil</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 transform sm:translate-x-2 group-hover:translate-x-0">
                                        <button onClick={() => onPreview(quote)} className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white flex items-center justify-center transition-colors" title="Görüntüle">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </button>
                                        <button onClick={() => onEdit(quote)} className="w-8 h-8 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center justify-center transition-colors" title="Düzenle">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                            </svg>
                                        </button>
                                        {quote.status !== 'Converted' && (
                                            <button onClick={() => handleConvert(quote)} className="w-8 h-8 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center justify-center transition-colors" title="Faturaya Dönüştür">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                                </svg>
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(quote.id)} className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center transition-colors" title="Sil">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex flex-col gap-3">
                {filteredQuotes.map((quote) => (
                    <div key={quote.id} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[14px] p-5 hover:border-blue-500/30 transition-colors shadow-sm cursor-pointer" onClick={() => onEdit(quote)}>
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="text-blue-600 dark:text-blue-400 font-mono font-medium tracking-wide text-[12px] mb-1">{quote.quoteNo}</div>
                                <div className="text-[14px] font-semibold text-slate-900 dark:text-white">{quote.customer?.name}</div>
                            </div>
                            {getStatusBadge(quote.status)}
                        </div>
                        <div className="flex justify-between items-end border-t border-slate-100 dark:border-white/5 pt-3 mt-1">
                            <div className="text-[11px] text-slate-500 uppercase tracking-wider">
                                {new Date(quote.date).toLocaleDateString('tr-TR')}
                            </div>
                            <div className="text-[16px] font-semibold text-slate-900 dark:text-white tabular-nums">
                                {Number(quote.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-[11px] text-slate-400">₺</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
