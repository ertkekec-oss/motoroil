import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useModal } from '@/contexts/ModalContext';
import { PackageOpen, Check, X, Eye, FileText, PackageCheck, Search } from 'lucide-react';
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
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 mb-6">
                <div className="relative w-full md:w-[350px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Kayıt ara..."
                        className="w-full pl-9 pr-4 h-[44px] bg-white rounded-[12px] border border-slate-200 text-[13px] outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:bg-[#1e293b] dark:border-white/10 dark:text-white"
                    />
                </div>
                <select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value)}
                    className="h-[44px] px-4 bg-white rounded-[12px] border border-slate-200 text-[13px] outline-none font-medium text-slate-700 min-w-[140px] appearance-none dark:bg-[#1e293b] dark:border-white/10 dark:text-white cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}
                >
                    <option value="ALL">Tümü</option>
                    <option value="NEW">Yeni Bekleyen</option>
                    <option value="APPROVED">Onaylananlar</option>
                    <option value="COMPLETED">Faturalanan</option>
                </select>
            </div>

            <div className="bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-transparent border-b border-slate-200 dark:border-white/5">
                            <tr>
                                <th className="h-[48px] px-6 align-middle w-12">
                                    <div className="w-4 h-4 rounded-[4px] border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-not-allowed">
                                    </div>
                                </th>
                                <th className="h-[48px] px-6 text-left text-[10px] whitespace-nowrap uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Sipariş No</th>
                                <th className="h-[48px] px-6 text-left text-[10px] whitespace-nowrap uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Cari Bilgisi</th>
                                <th className="h-[48px] px-6 text-left text-[10px] whitespace-nowrap uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Tutar</th>
                                <th className="h-[48px] px-6 text-left text-[10px] whitespace-nowrap uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Durum</th>
                                <th className="h-[48px] px-6 text-left text-[10px] whitespace-nowrap uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {paginatedOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[72px] group">
                                    <td className="px-6 py-3 align-middle w-12">
                                        <div className="w-4 h-4 rounded-[4px] border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 align-middle whitespace-nowrap">
                                        <div className="text-[13px] font-black text-slate-800 dark:text-white mb-0.5">{order.orderNumber || '-'}</div>
                                        <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{new Date(order.orderDate || order.createdAt).toLocaleDateString('tr-TR')}</div>
                                    </td>
                                    <td className="px-6 py-3 align-middle whitespace-nowrap">
                                        <div className="text-[13px] font-black text-slate-800 dark:text-white mb-0.5">{order.customerName}</div>
                                        <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{order.customerEmail || 'Müşteri'}</div>
                                    </td>
                                    <td className="px-6 py-3 align-middle whitespace-nowrap">
                                        <div className="text-[13px] font-black text-slate-800 dark:text-white mb-0.5">{Number(order.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                                    </td>
                                    <td className="px-6 py-3 align-middle whitespace-nowrap">
                                        <span className={`px-2 py-1 text-[10px] font-bold tracking-widest uppercase border rounded-[8px] inline-block ${
                                            order.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' : 
                                            order.status === 'APPROVED' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' : 
                                            'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                        }`}>
                                            {order.status === 'PENDING_APPROVAL' ? 'Onay Bekliyor' : order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 align-middle whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {/* Actions */}
                                            {order.status === 'PENDING_APPROVAL' && (
                                                <>
                                                    <button onClick={() => handleReject(order.id)} className="p-2 border rounded-[8px] text-rose-500 hover:bg-rose-50 border-rose-200 dark:border-white/10" title="Reddet">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleApprove(order.id)} className="p-2 border rounded-[8px] text-emerald-600 hover:bg-emerald-50 border-emerald-200 dark:border-white/10" title="Onayla">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            {order.status === 'APPROVED' && (
                                                <button onClick={() => {
                                                    let rData: any = {};
                                                    try { rData = typeof order.rawData === 'string' ? JSON.parse(order.rawData) : (order.rawData || {}); } catch (e) {}
                                                    router.push(rData.customerId ? `/customers/${rData.customerId}` : `/customers`);
                                                }} className="px-4 h-[32px] border rounded-[12px] text-[11px] font-bold tracking-widest uppercase flex items-center gap-2 text-slate-600 hover:bg-slate-50 border-slate-200 transition-colors bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
                                                    Cari Detayına Git
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginatedOrders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-slate-500">
                                        <PackageOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                        <div className="text-[15px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">Sipariş Bulunamadı</div>
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
