import { useState, useMemo } from 'react';
import { useModal } from '@/contexts/ModalContext';

interface OfferListProps {
    onEdit: (offer: any) => void;
    onPreview: (offer: any) => void;
    initialOffers: any[];
    isLoading: boolean;
    searchTerm: string;
    statusFilter: string;
    refreshList: () => void;
}

export default function OfferList({ onEdit, onPreview, initialOffers, isLoading, searchTerm, statusFilter, refreshList }: OfferListProps) {
    const { showError, showSuccess, showConfirm } = useModal();

    const filteredOffers = useMemo(() => {
        return initialOffers?.filter(o => {
            const offerNumberStr = String(o.offerNumber || '').toLowerCase();
            const customerNameStr = String(o.customer?.name || '').toLowerCase();
            const searchLower = searchTerm.toLowerCase();

            const matchesSearch = offerNumberStr.includes(searchLower) || customerNameStr.includes(searchLower);
            const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
            return matchesSearch && matchesStatus;
        }) || [];
    }, [initialOffers, searchTerm, statusFilter]);

    const handleDelete = async (id: string) => {
        showConfirm('Teklifi Sil', 'Bu teklifi silmek istediğinize emin misiniz?', async () => {
            try {
                const res = await fetch(`/api/offers/${id}`, { method: 'DELETE' });
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

    const handleConvert = async (offer: any) => {
        showConfirm('Faturaya Dönüştür / Onayla', 'Bu teklifi satış faturasına dönüştürmek istediğinize emin misiniz?', async () => {
            try {
                const res = await fetch(`/api/offers/${offer.id}/convert`, { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                    showSuccess('Başarılı', 'Teklif başarıyla faturaya dönüştürüldü.');
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
        const base = "px-2.5 py-1 rounded-[6px] text-[11px] font-bold uppercase tracking-wider inline-flex items-center justify-center ";
        switch (status) {
            case 'DRAFT': return <span className={base + "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"}>Taslak</span>;
            case 'PENDING_APPROVAL': return <span className={base + "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20"}>Onay Bekliyor</span>;
            case 'SENT': return <span className={base + "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20"}>Gönderildi</span>;
            case 'ACCEPTED': return <span className={base + "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"}>Kabul Edildi</span>;
            case 'REJECTED': return <span className={base + "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20"}>Reddedildi</span>;
            case 'CONVERTED_TO_ORDER': return <span className={base + "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20"}>Siparişe Dönüştü</span>;
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

    if (filteredOffers.length === 0) {
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
                    <thead className="bg-[#f8fafc] dark:bg-[#1e293b]/50 border-b border-slate-200 dark:border-white/10">
                        <tr>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Teklif Detayı</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Müşteri</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Durum</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Tutar</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {filteredOffers?.map((offer) => (
                            <tr key={offer.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors duration-200 group">
                                <td className="px-6 py-4">
                                    <div className="font-mono text-blue-600 dark:text-blue-400 font-bold tracking-wide text-[13px] mb-1">{offer.offerNumber || 'Yeni Teklif'}</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                                        <span>Tarih: {offer.issueDate ? new Date(offer.issueDate).toLocaleDateString('tr-TR') : '-'}</span>
                                        {offer.validUntil && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20"></span>
                                                <span className="text-amber-600 dark:text-amber-500/80">Geçerlilik: {new Date(offer.validUntil).toLocaleDateString('tr-TR')}</span>
                                            </>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900 dark:text-white text-[13px] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">{offer.customer?.name}</div>
                                    <div className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5"><span className="opacity-50">📱</span> {offer.customer?.phone || 'İletişim yok'}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {getStatusBadge(offer.status)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="font-bold text-[15px] text-slate-900 dark:text-white tabular-nums tracking-tight">
                                        {Number(offer.grandTotal || offer.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-[11px] ml-0.5 text-slate-500 font-medium">₺</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">KDV Dahil</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 transform sm:translate-x-2 group-hover:translate-x-0">
                                        <button onClick={() => onPreview(offer)} className="w-[34px] h-[34px] rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white flex items-center justify-center transition-all shadow-sm" title="PDF Görüntüle">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-[18px] h-[18px]">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                            </svg>
                                        </button>
                                        <button onClick={() => onEdit(offer)} className="w-[34px] h-[34px] rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-blue-600 hover:bg-blue-50 hover:border-blue-200 dark:text-blue-400 dark:hover:bg-blue-500/20 dark:hover:border-blue-500/30 flex items-center justify-center transition-all shadow-sm" title="Düzenle">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-[18px] h-[18px]">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                            </svg>
                                        </button>
                                        {offer.status !== 'CONVERTED_TO_ORDER' && (
                                            <button onClick={() => handleConvert(offer)} className="w-[34px] h-[34px] rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 dark:text-emerald-400 dark:hover:bg-emerald-500/20 dark:hover:border-emerald-500/30 flex items-center justify-center transition-all shadow-sm" title="Siparişe / Faturaya Dönüştür">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-[18px] h-[18px]">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                                </svg>
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(offer.id)} className="w-[34px] h-[34px] rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-red-500 hover:bg-red-50 hover:border-red-200 dark:text-red-400 dark:hover:bg-red-500/20 dark:hover:border-red-500/30 flex items-center justify-center transition-all shadow-sm" title="Sil">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-[18px] h-[18px]">
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
                {filteredOffers?.map((offer) => (
                    <div key={offer.id} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[14px] p-5 hover:border-blue-500/30 transition-colors shadow-sm cursor-pointer" onClick={() => onEdit(offer)}>
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="text-blue-600 dark:text-blue-400 font-mono font-bold tracking-wide text-[12px] mb-1">{offer.offerNumber}</div>
                                <div className="text-[14px] font-bold text-slate-900 dark:text-white">{offer.customer?.name}</div>
                            </div>
                            {getStatusBadge(offer.status)}
                        </div>
                        <div className="flex justify-between items-end border-t border-slate-100 dark:border-white/5 pt-3 mt-1">
                            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">
                                {offer.issueDate ? new Date(offer.issueDate).toLocaleDateString('tr-TR') : '-'}
                            </div>
                            <div className="text-[16px] font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                                {Number(offer.grandTotal || offer.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-[11px] text-slate-400 font-medium">₺</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
