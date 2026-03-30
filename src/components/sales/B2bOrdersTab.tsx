import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useModal } from '@/contexts/ModalContext';
import { PackageOpen, Check, X, Eye, FileText, PackageCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export function B2bOrdersTab({ onlineOrders, fetchOnlineOrders }: { onlineOrders: any[], fetchOnlineOrders: () => void }) {
    const { theme } = useTheme();
    const { showConfirm, showSuccess, showError } = useModal();
    const router = useRouter();
    const isLight = theme === 'light';

    const b2bOrders = onlineOrders.filter((o: any) => ['B2B_NETWORK', 'B2B'].includes(o.marketplace));

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 15;

    const filteredOrders = b2bOrders.filter(order => {
        if (statusFilter === 'NEW') return ['PENDING_APPROVAL', 'Yeni'].includes(order.status);
        if (statusFilter === 'APPROVED') return ['APPROVED', 'Hazırlanıyor'].includes(order.status);
        if (statusFilter === 'COMPLETED') return ['Faturalandı', 'Tamamlandı', 'Delivered'].includes(order.status);
        if (statusFilter === 'CANCELLED') return ['REJECTED', 'Cancelled', 'İptal'].includes(order.status);
        return true;
    });

    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    const paginatedOrders = filteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

    const handleApprove = async (id: string) => {
        showConfirm('Siparişi Onayla', 'Bu B2B siparişini onaylamak istediğinize emin misiniz? Onaylandıktan sonra doğrudan kendi Carisi üzerinden Faturalandırılacaktır.', async () => {
             try {
                 const res = await apiFetch(`/api/orders/${id}/status`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ status: 'APPROVED' })
                 });
                 const data = await res.json();
                 if (data.success) {
                     showSuccess('Başarılı', 'B2B Siparişi onaylandı.');
                     fetchOnlineOrders();
                 } else {
                     showError('Hata', data.error || 'Onaylanamadı.');
                 }
             } catch {
                 showError('Hata', 'Bağlantı hatası.');
             }
        });
    };

    const handleReject = async (id: string) => {
        showConfirm('Reddet', 'Bu B2B siparişini reddetmek istediğinize emin misiniz? Müşteriye bildirim gidecektir.', async () => {
            try {
                // Assuming there's a reject endpoint or status change
                const res = await apiFetch(`/api/orders/${id}/status`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'REJECTED' })
                });
                const data = await res.json();
                if (data.success) {
                    showSuccess('Başarılı', 'Sipariş iptal edildi.');
                    fetchOnlineOrders();
                } else {
                    showError('Hata', data.error || 'İşlem başarısız.');
                }
            } catch {
                showError('Hata', 'Bağlantı hatası.');
            }
        });
    };

    const OutlineChip = ({ active, onClick, children }: any) => (
        <button onClick={onClick} className={`h-[36px] px-5 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all whitespace-nowrap outline-none ${active
                ? (isLight ? 'bg-blue-50/50 border-blue-600 text-blue-700 shadow-sm' : 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-sm')
                : (isLight ? 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50' : 'bg-slate-900 border-slate-700/50 text-slate-400 hover:text-slate-300 hover:bg-slate-800')
            }`}>
            {children}
        </button>
    );

    const cardClass = isLight ? "bg-white border-slate-200" : "bg-slate-800/80 border-slate-700/50";
    const textMain = isLight ? "text-slate-900" : "text-white";
    const textSub = isLight ? "text-slate-500" : "text-slate-400";

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap custom-scroll pb-2">
                    <OutlineChip active={statusFilter === 'ALL'} onClick={() => setStatusFilter('ALL')}>Tümü</OutlineChip>
                    <OutlineChip active={statusFilter === 'NEW'} onClick={() => setStatusFilter('NEW')}>Yeni Bekleyen</OutlineChip>
                    <OutlineChip active={statusFilter === 'APPROVED'} onClick={() => setStatusFilter('APPROVED')}>Onaylananlar</OutlineChip>
                    <OutlineChip active={statusFilter === 'COMPLETED'} onClick={() => setStatusFilter('COMPLETED')}>Faturalanan</OutlineChip>
                </div>
            </div>

            <div className={`border rounded-[14px] overflow-hidden ${cardClass}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                        <thead className={`border-b ${isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-900/50 border-slate-700/50 text-slate-400'}`}>
                            <tr>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wide text-[11px]">Sipariş No</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wide text-[11px]">Cari Bilgisi</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wide text-[11px] text-right">Tutar</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wide text-[11px] text-center">Durum</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wide text-[11px] text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {paginatedOrders.map((order) => (
                                <tr key={order.id} className={`group transition-colors ${isLight ? 'hover:bg-blue-50/30' : 'hover:bg-blue-900/10'}`}>
                                    <td className="px-6 py-4">
                                        <div className={`font-semibold ${textMain}`}>{order.orderNumber || '-'}</div>
                                        <div className={`text-[12px] mt-0.5 ${textSub}`}>{new Date(order.orderDate || order.createdAt).toLocaleDateString('tr-TR')}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`font-medium ${textMain}`}>{order.customerName}</div>
                                        <div className="text-[12px] text-slate-400">{order.customerEmail || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className={`font-bold ${textMain}`}>{Number(order.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md uppercase tracking-wider ${
                                            order.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-700' : 
                                            order.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' : 
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                            {order.status === 'PENDING_APPROVAL' ? 'Onay Bekliyor' : order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        {/* Actions */}
                                        {order.status === 'PENDING_APPROVAL' && (
                                            <>
                                                <button onClick={() => handleReject(order.id)} className="p-2 border rounded-full text-rose-500 hover:bg-rose-50 border-rose-200" title="Reddet">
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleApprove(order.id)} className="p-2 border rounded-full text-emerald-600 hover:bg-emerald-50 border-emerald-200" title="Onayla">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'APPROVED' && (
                                            <button onClick={() => {
                                                let rData: any = {};
                                                try { rData = typeof order.rawData === 'string' ? JSON.parse(order.rawData) : (order.rawData || {}); } catch (e) {}
                                                router.push(rData.customerId ? `/customers/${rData.customerId}` : `/customers`);
                                            }} className="px-4 py-1.5 border rounded-full text-[12px] font-bold tracking-wide flex items-center gap-2 text-slate-600 hover:bg-slate-50 border-slate-200 transition-colors ml-auto mr-0">
                                                Cari Detayına Git
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {paginatedOrders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center text-slate-500">
                                        <PackageOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                        <div className="text-[15px] font-medium text-slate-900 dark:text-white">Sipariş Bulunamadı</div>
                                        <div className="text-[13px] mt-1">Bu filtrelere uygun B2B siparişi kaydı yok.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4 pb-4">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-5 py-2 text-[12px] font-bold tracking-wide border rounded-full hover:bg-slate-50">Önceki</button>
                    <span className="text-[13px] font-medium text-slate-500">
                        {currentPage} / {totalPages}
                    </span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-5 py-2 text-[12px] font-bold tracking-wide border rounded-full hover:bg-slate-50">Sonraki</button>
                </div>
            )}
        </div>
    );
}
