"use client";

import { useState, Fragment, useEffect } from 'react';
import Pagination from '@/components/Pagination';

interface InvoicesTabProps {
    invoiceSubTab: 'sales' | 'incoming' | 'wayslips';
    setInvoiceSubTab: (tab: 'sales' | 'incoming' | 'wayslips') => void;
    fetchInvoices: () => Promise<void>;
    fetchPurchaseInvoices: () => Promise<void>;
    fetchWayslips: () => Promise<void>;
    isLoadingInvoices: boolean;
    isLoadingPurchaseInvoices: boolean;
    isLoadingWayslips: boolean;
    realInvoices: any[];
    purchaseInvoices: any[];
    wayslips: any[];
    handleApproveInvoice: (id: string) => Promise<void>;
    handleDeleteInvoice: (id: string) => Promise<void>;
    handleSendToELogo: (id: string, type: any) => Promise<void>;
    handleViewPDF: (id: string) => Promise<void>;
    handleAcceptPurchaseInvoice: (id: string) => Promise<void>;
    handleRejectPurchaseInvoice: (id: string) => Promise<void>;
    setView: (view: any) => void;
    showWarning: (title: string, message: string) => void;
    posTheme?: 'dark' | 'light';
}

export function InvoicesTab({
    invoiceSubTab,
    setInvoiceSubTab,
    fetchInvoices,
    fetchPurchaseInvoices,
    fetchWayslips,
    isLoadingInvoices,
    isLoadingPurchaseInvoices,
    isLoadingWayslips,
    realInvoices,
    purchaseInvoices,
    wayslips,
    handleApproveInvoice,
    handleDeleteInvoice,
    handleSendToELogo,
    handleViewPDF,
    handleAcceptPurchaseInvoice,
    handleRejectPurchaseInvoice,
    setView,
    showWarning,
    posTheme = 'dark'
}: InvoicesTabProps) {
    const isLight = posTheme === 'light';
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 10;
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [wayslipType, setWayslipType] = useState<'gelen' | 'giden'>('giden');

    const toggleExpand = (id: string) => setExpandedOrderId(expandedOrderId === id ? null : id);

    let activeList: any[] = [];
    if (invoiceSubTab === 'sales') activeList = realInvoices;
    else if (invoiceSubTab === 'incoming') activeList = purchaseInvoices;
    else if (invoiceSubTab === 'wayslips') activeList = (wayslips || []).filter(w => w.type === (wayslipType === 'gelen' ? 'Gelen' : 'Giden'));

    const totalPages = Math.ceil((activeList?.length || 0) / ordersPerPage);
    const paginatedList = activeList.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

    useEffect(() => setCurrentPage(1), [invoiceSubTab, wayslipType]);

    const cardClass = isLight ? "bg-white border border-slate-200 shadow-sm" : "bg-slate-900 border border-slate-800";
    const textLabelClass = isLight ? "text-slate-500" : "text-slate-400";
    const textValueClass = isLight ? "text-slate-900" : "text-white";

    return (
        <div className="space-y-6 font-sans">
            {/* Invoices Sub-Tabs */}
            {invoiceSubTab !== 'wayslips' && (
                <div className={`flex gap-6 border-b pb-[1px] ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    {[
                        { key: 'sales', label: '📄 Satış Faturaları', onClick: () => setInvoiceSubTab('sales') },
                        { key: 'incoming', label: '📥 Gelen Faturalar', onClick: () => setInvoiceSubTab('incoming') }
                    ].map(({ key, label, onClick }) => {
                        const isActive = invoiceSubTab === key;
                        return (
                            <button
                                key={key}
                                onClick={onClick}
                                className={`pb-3 text-[13px] font-semibold transition-colors relative -mb-[2px]`}
                                style={{
                                    color: isActive ? (isLight ? '#2563EB' : '#60A5FA') : (isLight ? '#64748B' : '#94A3B8'),
                                    borderBottom: isActive ? `2px solid ${isLight ? '#2563EB' : '#60A5FA'}` : '2px solid transparent'
                                }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* SALES INVOICES */}
            {invoiceSubTab === 'sales' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className={`text-[16px] font-semibold ${textValueClass}`}>Kesilen Satış Faturaları</h3>
                        <button
                            onClick={fetchInvoices}
                            className={`h-[36px] px-4 flex items-center justify-center gap-2 rounded-[10px] font-medium text-[12px] border transition-colors outline-none ${isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Yenile
                        </button>
                    </div>

                    {isLoadingInvoices ? (
                        <div className={`text-[14px] py-8 font-medium ${textLabelClass}`}>Yükleniyor...</div>
                    ) : (
                        <div className={`rounded-[16px] border p-6 overflow-hidden ${cardClass}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead className="sticky top-0 bg-transparent">
                                        <tr className={`border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                                            <th className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Fatura No</th>
                                            <th className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Cari</th>
                                            <th className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Tarih</th>
                                            <th className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Tutar</th>
                                            <th className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Durum</th>
                                            <th className={`h-[48px] px-4 text-center text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/50'}`}>
                                        {paginatedList.length === 0 ? (
                                            <tr><td colSpan={6} className={`text-center py-8 font-medium ${textLabelClass}`}>Kayıt bulunamadı.</td></tr>
                                        ) : paginatedList.map(inv => {
                                            const isExpanded = expandedOrderId === inv.id;
                                            return (
                                                <Fragment key={inv.id}>
                                                    <tr onClick={() => toggleExpand(inv.id)} className={`h-[52px] cursor-pointer transition-colors ${isExpanded ? (isLight ? 'bg-blue-50/30' : 'bg-blue-900/10') : (isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50')}`}>
                                                        <td className={`px-4 align-middle font-semibold text-[13px] ${textValueClass}`}>{inv.invoiceNo}</td>
                                                        <td className={`px-4 align-middle font-medium text-[13px] ${textValueClass}`}>{inv.customer?.name}</td>
                                                        <td className={`px-4 align-middle text-[12px] ${textLabelClass}`}>{new Date(inv.invoiceDate).toLocaleDateString('tr-TR')}</td>
                                                        <td className={`px-4 align-middle font-semibold text-[13px] ${textValueClass}`}>{inv.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                        <td className="px-4 align-middle">
                                                            <span className={`px-2 py-1 text-[11px] font-medium border rounded-[6px] inline-block ${inv.isFormal
                                                                    ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20')
                                                                    : (isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20')
                                                                }`}>
                                                                {inv.isFormal ? 'Faturalandırıldı' : inv.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 align-middle text-center">
                                                            <div className="flex gap-2 items-center justify-center" onClick={e => e.stopPropagation()}>
                                                                {!inv.isFormal ? (
                                                                    <button
                                                                        onClick={() => handleSendToELogo(inv.id, 'EFATURA')}
                                                                        className={`h-[32px] px-3 rounded-[8px] text-[12px] font-medium transition-colors ${isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                                                                    >
                                                                        Faturalandır
                                                                    </button>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleViewPDF(inv.id)}
                                                                            className={`h-[32px] px-3 rounded-[8px] text-[12px] font-medium border transition-colors ${isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                                                                        >
                                                                            İndir (PDF)
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {isExpanded && (
                                                        <tr className={`border-b-0 ${isLight ? 'bg-blue-50/20' : 'bg-blue-900/5'}`}>
                                                            <td colSpan={6} className="p-4">
                                                                <div className={`p-5 rounded-[12px] border ${isLight ? 'bg-white border-blue-100' : 'bg-slate-900 border-blue-900/50'}`}>
                                                                    <div className="flex justify-between items-center mb-4">
                                                                        <h4 className={`text-[14px] font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Fatura İçeriği</h4>
                                                                    </div>
                                                                    <table className="w-full text-left font-medium text-[13px]">
                                                                        <thead>
                                                                            <tr>
                                                                                <th className={`pb-2 text-[11px] uppercase tracking-wide font-semibold ${textLabelClass}`}>Ürün Adı</th>
                                                                                <th className={`pb-2 text-[11px] uppercase tracking-wide font-semibold text-center ${textLabelClass}`}>Adet</th>
                                                                                <th className={`pb-2 text-[11px] uppercase tracking-wide font-semibold text-right ${textLabelClass}`}>Birim Fiyat</th>
                                                                                <th className={`pb-2 text-[11px] uppercase tracking-wide font-semibold text-right ${textLabelClass}`}>Toplam</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800'}`}>
                                                                            {(inv.items as any[]).map((item, idx) => (
                                                                                <tr key={idx}>
                                                                                    <td className={`py-2 ${textValueClass}`}>{item.name}</td>
                                                                                    <td className={`py-2 text-center ${textValueClass}`}>{item.qty}</td>
                                                                                    <td className={`py-2 text-right ${textValueClass}`}>{item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                                                    <td className={`py-2 text-right font-semibold ${textValueClass}`}>{(item.qty * item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>

                                                                    {!inv.isFormal && (
                                                                        <div className="mt-6 flex gap-3">
                                                                            <button
                                                                                onClick={() => handleSendToELogo(inv.id, 'EFATURA')}
                                                                                className={`h-[40px] px-5 rounded-[10px] text-[13px] font-medium transition-colors ${isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                                                                            >
                                                                                e-Fatura / e-Arşiv Gönder
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleSendToELogo(inv.id, 'EIRSALIYE')}
                                                                                className={`h-[40px] px-5 rounded-[10px] text-[13px] font-medium border transition-colors ${isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                                                                            >
                                                                                e-İrsaliye Gönder
                                                                            </button>
                                                                        </div>
                                                                    )}

                                                                    {inv.isFormal && (
                                                                        <div className={`mt-6 p-4 rounded-[10px] border flex justify-between items-center ${isLight ? 'bg-emerald-50 border-emerald-100' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                                                                            <div>
                                                                                <div className={`text-[13px] font-semibold mb-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>Resmileştirildi</div>
                                                                                <div className={`text-[12px] font-medium ${isLight ? 'text-emerald-600/70' : 'text-emerald-500/70'}`}>UUID: {inv.formalId} | Tip: {inv.formalType}</div>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => handleViewPDF(inv.id)}
                                                                                className={`h-[36px] px-4 rounded-[8px] text-[12px] font-medium transition-colors ${isLight ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
                                                                            >
                                                                                PDF Görüntüle
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* INCOMING INVOICES */}
            {invoiceSubTab === 'incoming' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className={`text-[16px] font-semibold ${textValueClass}`}>Gelen Alım Faturaları</h3>
                        <button
                            onClick={fetchPurchaseInvoices}
                            className={`h-[36px] px-4 flex items-center justify-center gap-2 rounded-[10px] font-medium text-[12px] border transition-colors outline-none ${isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Yenile
                        </button>
                    </div>

                    {isLoadingPurchaseInvoices ? <div className={`text-[14px] py-8 ${textLabelClass}`}>Yükleniyor...</div> : (
                        <div className={`rounded-[16px] border p-6 overflow-hidden ${cardClass}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead className="sticky top-0 bg-transparent">
                                        <tr className={`border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                                            <th className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Fatura Bilgisi</th>
                                            <th className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Tarih</th>
                                            <th className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Tutar</th>
                                            <th className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Durum</th>
                                            <th className={`h-[48px] px-4 text-right text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/50'}`}>
                                        {paginatedList.length === 0 ? (
                                            <tr><td colSpan={5} className={`text-center py-8 font-medium ${textLabelClass}`}>Gelen fatura bulunamadı.</td></tr>
                                        ) : paginatedList.map((inv, idx) => (
                                            <tr key={idx} className={`h-[52px] transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50'}`}>
                                                <td className="px-4 align-middle">
                                                    <div className={`font-semibold text-[13px] ${textValueClass}`}>{inv.supplier}</div>
                                                    <div className={`text-[11px] font-medium mt-0.5 ${textLabelClass}`}>{inv.id} - {inv.msg}</div>
                                                </td>
                                                <td className={`px-4 align-middle text-[12px] font-medium ${textLabelClass}`}>{inv.date}</td>
                                                <td className={`px-4 align-middle font-semibold text-[13px] ${textValueClass}`}>{inv.total.toLocaleString()} ₺</td>
                                                <td className="px-4 align-middle">
                                                    <span className={`px-2 py-1 text-[11px] font-medium border rounded-[6px] inline-block ${inv.status === 'Bekliyor'
                                                            ? (isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20')
                                                            : (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20')
                                                        }`}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 align-middle text-right flex gap-2 justify-end">
                                                    {inv.status === 'Bekliyor' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleAcceptPurchaseInvoice(inv.id)}
                                                                className={`h-[32px] px-3 rounded-[8px] text-[12px] font-medium transition-colors ${isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                                                            >
                                                                Kabul Et
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectPurchaseInvoice(inv.id)}
                                                                className={`h-[32px] px-3 rounded-[8px] text-[12px] font-medium transition-colors border ${isLight ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'}`}
                                                            >
                                                                Reddet
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleViewPDF(inv.id)}
                                                        className={`h-[32px] px-3 rounded-[8px] text-[12px] font-medium transition-colors border ${isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                                                    >
                                                        PDF
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* WAYSLIPS */}
            {invoiceSubTab === 'wayslips' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className={`text-[16px] font-semibold ${textValueClass}`}>e-İrsaliye Yönetimi</h3>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setView('new_wayslip')}
                                className={`h-[36px] px-4 rounded-[10px] text-[12px] font-medium transition-colors flex items-center gap-2 ${isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                            >
                                + Yeni İrsaliye
                            </button>
                            <button
                                onClick={fetchWayslips}
                                className={`h-[36px] px-4 flex items-center justify-center gap-2 rounded-[10px] font-medium text-[12px] border transition-colors outline-none ${isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                    }`}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                Yenile
                            </button>
                        </div>
                    </div>

                    <div className={`p-1 flex gap-2 rounded-[12px] w-fit border ${isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-900/50 border-slate-800'}`}>
                        <button
                            onClick={() => setWayslipType('giden')}
                            className={`h-[36px] px-6 rounded-[10px] text-[13px] font-medium transition-colors ${wayslipType === 'giden' ? (isLight ? 'bg-white shadow-sm text-blue-700' : 'bg-slate-800 text-blue-400') : (isLight ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200')}`}
                        >
                            Giden İrsaliyeler
                        </button>
                        <button
                            onClick={() => setWayslipType('gelen')}
                            className={`h-[36px] px-6 rounded-[10px] text-[13px] font-medium transition-colors ${wayslipType === 'gelen' ? (isLight ? 'bg-white shadow-sm text-blue-700' : 'bg-slate-800 text-blue-400') : (isLight ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200')}`}
                        >
                            Gelen İrsaliyeler
                        </button>
                    </div>

                    {isLoadingWayslips ? <div className={`text-[14px] py-8 ${textLabelClass}`}>Yükleniyor...</div> : (
                        <div className={`rounded-[16px] border p-6 overflow-hidden ${cardClass}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead className="sticky top-0 bg-transparent">
                                        <tr className={`border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                                            <th className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Belge No</th>
                                            <th className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Tip</th>
                                            <th className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Taraf</th>
                                            <th className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Tarih</th>
                                            <th className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Tutar</th>
                                            <th className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Durum</th>
                                            <th className={`h-[48px] px-4 text-center text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/50'}`}>
                                        {paginatedList.length === 0 ? (
                                            <tr><td colSpan={7} className={`text-center py-8 font-medium ${textLabelClass}`}>İrsaliye bulunamadı.</td></tr>
                                        ) : paginatedList.map(irs => {
                                            const isExpanded = expandedOrderId === irs.id;
                                            return (
                                                <Fragment key={irs.id}>
                                                    <tr onClick={() => toggleExpand(irs.id)} className={`h-[52px] cursor-pointer transition-colors ${isExpanded ? (isLight ? 'bg-blue-50/30' : 'bg-blue-900/10') : (isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50')}`}>
                                                        <td className="px-4 align-middle">
                                                            <div className={`font-semibold text-[13px] ${textValueClass}`}>{irs.formalId || irs.invoiceNo || irs.id}</div>
                                                            {irs.formalId && <div className="text-[10px] font-semibold text-emerald-500 tracking-wide uppercase mt-0.5">Resmi e-İrsaliye</div>}
                                                        </td>
                                                        <td className="px-4 align-middle">
                                                            <span className={`px-2 py-1 text-[11px] font-medium border rounded-[6px] inline-block ${irs.type === 'Gelen' ? (isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/20')
                                                                    : (isLight ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-purple-500/10 text-purple-400 border-purple-500/20')
                                                                }`}>
                                                                {irs.type}
                                                            </span>
                                                        </td>
                                                        <td className={`px-4 align-middle font-medium text-[13px] ${textValueClass}`}>{irs.customer || irs.supplier}</td>
                                                        <td className={`px-4 align-middle text-[12px] font-medium ${textLabelClass}`}>
                                                            {typeof irs.date === 'string' && irs.date.includes('.') ? irs.date : new Date(irs.date).toLocaleDateString('tr-TR')}
                                                        </td>
                                                        <td className={`px-4 align-middle font-semibold text-[13px] ${textValueClass}`}>
                                                            {Number(irs.total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                        </td>
                                                        <td className="px-4 align-middle">
                                                            <span className={`px-2 py-1 text-[11px] font-medium border rounded-[6px] inline-block ${irs.isFormal
                                                                    ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20')
                                                                    : (isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20')
                                                                }`}>
                                                                {irs.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 align-middle text-center">
                                                            <div className="flex gap-2 items-center justify-center">
                                                                {irs.type === 'Giden' && !irs.isFormal && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleSendToELogo(irs.id, 'EIRSALIYE'); }}
                                                                        className={`h-[32px] px-3 rounded-[8px] text-[11px] font-semibold transition-colors ${isLight ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'}`}
                                                                    >
                                                                        Gönder
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); toggleExpand(irs.id); }}
                                                                    className={`h-[32px] px-3 rounded-[8px] text-[12px] font-medium transition-colors border ${isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                                                                >
                                                                    {isExpanded ? 'Kapat' : 'Yönet'}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {isExpanded && (
                                                        <tr className={`border-b-0 ${isLight ? 'bg-blue-50/20' : 'bg-blue-900/5'}`}>
                                                            <td colSpan={7} className="p-4">
                                                                <div className={`p-5 rounded-[12px] border ${isLight ? 'bg-white border-blue-100' : 'bg-slate-900 border-blue-900/50'}`}>
                                                                    <div className="flex justify-between items-center mb-4">
                                                                        <h4 className={`text-[14px] font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>İrsaliye İçeriği</h4>
                                                                        <div className="flex gap-2">
                                                                            {irs.isFormal && (
                                                                                <button onClick={() => handleViewPDF(irs.id)} className={`h-[32px] px-3 rounded-[8px] text-[12px] font-medium border transition-colors ${isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
                                                                                    📄 PDF
                                                                                </button>
                                                                            )}
                                                                            {!irs.isFormal && irs.type === 'Giden' && (
                                                                                <button onClick={() => handleDeleteInvoice(irs.id)} className={`h-[32px] px-3 rounded-[8px] text-[12px] font-medium border transition-colors ${isLight ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/30'}`}>
                                                                                    🗑️ Sil
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <table className="w-full text-left font-medium text-[13px]">
                                                                        <thead>
                                                                            <tr>
                                                                                <th className={`pb-2 text-[11px] uppercase tracking-wide font-semibold ${textLabelClass}`}>Ürün Adı</th>
                                                                                <th className={`pb-2 text-[11px] uppercase tracking-wide font-semibold text-center ${textLabelClass}`}>Adet</th>
                                                                                <th className={`pb-2 text-[11px] uppercase tracking-wide font-semibold text-right ${textLabelClass}`}>Birim Fiyat</th>
                                                                                <th className={`pb-2 text-[11px] uppercase tracking-wide font-semibold text-right ${textLabelClass}`}>Toplam</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800'}`}>
                                                                            {(Array.isArray(irs.items) ? irs.items : []).map((item: any, idx: number) => (
                                                                                <tr key={idx}>
                                                                                    <td className={`py-2 ${textValueClass}`}>{item.name || item.Name || 'Bilinmeyen Ürün'}</td>
                                                                                    <td className={`py-2 text-center ${textValueClass}`}>{item.qty || item.Quantity || 0} {item.unit || item.UnitType || 'Adet'}</td>
                                                                                    <td className={`py-2 text-right ${textValueClass}`}>{Number(item.price || item.Price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                                                    <td className={`py-2 text-right font-semibold ${textValueClass}`}>{(Number(item.qty || item.Quantity || 0) * Number(item.price || item.Price || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className={`pt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
        </div>
    );
}
