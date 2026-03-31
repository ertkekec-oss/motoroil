"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';
import { useFinancials } from '@/contexts/FinancialContext';

import SupplierPurchaseModal from '@/components/modals/SupplierPurchaseModal';
import TransactionDetailModal from '@/components/modals/TransactionDetailModal';
import StatementModal from '@/components/modals/StatementModal';
import SupplierInvoiceUploadModal from '@/components/modals/SupplierInvoiceUploadModal';
import Pagination from '@/components/Pagination';
import EnterpriseCommandCenter from '@/components/ui/EnterpriseCommandCenter';

const val = (v: any, fallback = '-') => (v ? v : fallback);

export default function SupplierDetailClient({ supplierId, supplierData, displayHistory }: { supplierId: string, supplierData: any, displayHistory: any[] }) {
    const router = useRouter();
    const { showSuccess, showError, showWarning } = useModal();
    const { collectCheck, kasalar } = useFinancials();
    
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Navigation Tabs
    const [activeTab, setActiveTab] = useState<'all' | 'checks'>('all');

    // Pagination
    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => { setCurrentPage(1); }, [activeTab]);

    // Check Collection States
    const [showCheckCollectModal, setShowCheckCollectModal] = useState(false);
    const [activeCheck, setActiveCheck] = useState<any>(null);
    const [targetKasaId, setTargetKasaId] = useState('');
    const [isProcessingCollection, setIsProcessingCollection] = useState(false);

    const handleExecuteCheckCollect = async () => {
        if (!activeCheck || !targetKasaId) return;
        setIsProcessingCollection(true);
        try {
            const res = await collectCheck(activeCheck.id, targetKasaId);
            if (res?.success) {
                showSuccess("Başarılı", `${activeCheck.type.includes('Alınan') ? 'Tahsilat' : 'Ödeme'} işlemi tamamlandı.`);
                setShowCheckCollectModal(false);
                setActiveCheck(null);
                router.refresh();
            } else {
                showError("Hata", res?.error || "İşlem başarısız.");
            }
        } catch (e) {
            showError("Hata", "Bir hata oluştu.");
        } finally {
            setIsProcessingCollection(false);
        }
    };

    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [adjustData, setAdjustData] = useState({ amount: '', description: '', type: 'DEBT' });

    // Transaction Detail
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Statement Modal State
    const [statementOpen, setStatementOpen] = useState(false);
    const [statementType, setStatementType] = useState<'summary' | 'detailed'>('summary');

    const supplier = supplierData;
    const totalInvoiced = (supplier.invoices || []).reduce((acc: any, p: any) => acc + p.totalAmount, 0);
    const balance = supplier.balance || 0;
    const balanceColor = balance < 0 ? '#ef4444' : balance > 0 ? '#10b981' : '#fff';

    let portfolioChecks = 0;
    if (supplier.checks) {
        portfolioChecks = supplier.checks.filter((c: any) => c.status === 'Portföyde' || c.status === 'Beklemede').reduce((sum: number, c: any) => sum + Number(c.amount), 0);
    }

    const handleAdjustment = async () => {
        if (!adjustData.amount) return showWarning('Eksik Bilgi', 'Lütfen bir tutar giriniz.');
        const numAmount = parseFloat(adjustData.amount);
        if (isNaN(numAmount)) return showWarning('Geçersiz Tutar', 'Lütfen geçerli bir sayısal tutar giriniz.');

        const signedAmount = adjustData.type === 'DEBT' ? -numAmount : numAmount;

        try {
            const res = await fetch('/api/suppliers/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplierId: supplierId,
                    type: 'ADJUSTMENT',
                    amount: signedAmount,
                    description: adjustData.description
                })
            });
            const result = await res.json();
            if (result.success) {
                showSuccess('Başarılı', 'Bakiye başarıyla güncellendi.');
                setIsAdjustModalOpen(false);
                window.location.reload();
            } else {
                showError('Hata', result.error || 'Bakiye güncellenirken bir hata oluştu');
            }
        } catch (e) { showError('Hata', 'Beklenmedik bir hata oluştu.'); }
    };

    const handleViewPDF = async (invoiceId: string) => {
        if (!invoiceId) return;
        window.open(`/api/sales/invoices?action=get-pdf&invoiceId=${invoiceId}`, '_blank');
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">

            {/* --- TEDARİKÇİ COMMAND CENTER (STICKY) --- */}
            <EnterpriseCommandCenter 
                title={val(supplier.name)}
                backLink="/suppliers"
                backLabel="Tedarikçi Merkezi"
                avatarInitials={val(supplier.name, '?').charAt(0).toUpperCase()}
                avatarGradient="from-indigo-900 to-indigo-500"
                category={val(supplier.category, 'Genel Tedarikçi')}
                contact={{
                    phone: supplier.phone,
                    email: supplier.email,
                    address: (() => {
                        if (supplier.city || supplier.district) {
                            return `${supplier.district ? supplier.district + ' / ' : ''}${supplier.city || ''}`;
                        }
                        return supplier.address || 'Adres Yok';
                    })()
                }}
                balance={{
                    value: balance,
                    positiveLabel: 'Alacak',
                    negativeLabel: 'Borç',
                    neutralLabel: 'Dengeli',
                    positiveColor: 'text-emerald-600 dark:text-emerald-400',
                    negativeColor: 'text-red-600 dark:text-red-400'
                }}
                metrics={[
                    ...(portfolioChecks > 0 ? [{
                        label: 'Açık Çek/Senet',
                        value: `${portfolioChecks.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`,
                        icon: '🧾',
                        colorClass: 'bg-amber-50 dark:bg-amber-500/10 text-amber-500'
                    }] : [])
                ]}
                tabs={[
                    { group: 'İŞLEMLER', items: [{ id: 'all', label: 'Tümü' }] },
                    { group: 'FİNANS & EVRAK', items: [{ id: 'checks', label: 'Vadeler & Çekler' }] }
                ]}
                activeTab={activeTab}
                onTabChange={(id) => setActiveTab(id as any)}
                actions={
                    <>
                        <Link 
                            href={`/payment?type=payment&title=Ödeme-${encodeURIComponent(val(supplier.name))}&ref=SUP-${supplier.id}&amount=${Math.abs(supplier.balance)}`}
                            className="h-[36px] px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden sm:flex"
                        >
                            💸 Ödeme Çıkışı
                        </Link>
                        <button
                            onClick={() => setIsPurchaseModalOpen(true)}
                            className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden lg:flex"
                        >
                            + İç Alım Fişi
                        </button>
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden lg:flex"
                        >
                            🚀 Fatura Girişi
                        </button>
                        <button
                            onClick={() => setIsAdjustModalOpen(true)}
                            className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden lg:flex"
                        >
                            ⚖️ Bakiye
                        </button>
                        <button
                            onClick={() => { setStatementType('summary'); setStatementOpen(true); }}
                            className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden lg:flex"
                        >
                            📄 Özet Ekstre
                        </button>
                        <button
                            onClick={() => { setStatementType('detailed'); setStatementOpen(true); }}
                            className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden lg:flex"
                        >
                            📑 Detaylı Ekstre
                        </button>
                        <button
                            onClick={() => router.push(`/suppliers?edit=${supplier.id}`)}
                            className="w-[36px] h-[36px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-500 rounded-[8px] flex items-center justify-center transition-colors shadow-sm hover:text-blue-600 hover:border-blue-200"
                            title="Düzenle"
                        >
                            ✏️
                        </button>
                    </>
                }
            />

            {/* MAIN CONTENT AREA */}
            <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
                <div className="w-full">

                    
                        {(() => {
                            const currentList = activeTab === 'all' ? displayHistory : (supplier.checks || []);
                            const totalPages = Math.ceil(currentList.length / ITEMS_PER_PAGE);
                            const paginatedList = currentList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

                            if (activeTab === 'all') {
                                return (
                                    <>
                                        <div className="overflow-auto max-h-[calc(100vh-270px)] custom-scroll bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col mb-4"><table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest font-bold border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]">
                                                    <th className="px-5 py-4 font-bold whitespace-nowrap">TARİH & TÜR</th>
                                                    <th className="px-5 py-4 font-bold whitespace-nowrap">AÇIKLAMA / REFERANS</th>
                                                    <th className="px-5 py-4 font-bold text-right whitespace-nowrap">TUTAR</th>
                                                    <th className="px-5 py-4 font-bold text-center whitespace-nowrap">İŞLEM</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                                {paginatedList.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[48px] group border-b border-slate-100 dark:border-white/5">
                                                        <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                                            <div style={{ fontWeight: '700', color: 'var(--text-main, #e2e8f0)', marginBottom: '4px' }}>{item.date}</div>
<span style={{
                                                                fontSize: '10px',
                                                                padding: '4px 8px',
                                                                borderRadius: '6px',
                                                                fontWeight: '800',
                                                                background: `${item.color}15`,
                                                                color: item.color,
                                                                whiteSpace: 'nowrap'
                                                            }}>
                                                                {item.type.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                                            <div style={{ fontWeight: '600' }}>{item.desc}</div>
                                                            <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)', marginTop: '4px' }}>Ref: {item.method}</div>
                                                        </td>
                                                        <td className="px-5 py-3 align-middle text-right text-[14px] font-extrabold" style={{ color: (item.amount < 0 && item.type !== 'Ödeme') ? '#ef4444' : '#10b981' }}>
                                                            {item.amount.toLocaleString('tr-TR')} ₺
                                                        </td>
                                                        <td className="px-5 py-3 align-middle">
                                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                                <button
                                                                    onClick={() => { setSelectedTransaction(item); setIsDetailModalOpen(true); }}
                                                                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-white/10 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-[6px] text-[11px] font-bold transition-colors shadow-sm"
                                                                >
                                                                    🔍 Detay
                                                                </button>
                                                                {(item.invoiceId || (item.type === 'Bekleyen Fatura' && item.id)) && (
                                                                    <button
                                                                        onClick={() => handleViewPDF(item.invoiceId || item.id)}
                                                                        className="px-3 py-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 dark:bg-blue-500/10 dark:border-blue-500/30 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-[6px] text-[11px] font-bold transition-colors shadow-sm"
                                                                    >
                                                                        📄 Fatura
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {paginatedList.length === 0 && (<tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Henüz bir işlem kaydı bulunmuyor.</td></tr>)}
                                            </tbody>
</table>
</div>
<div className="flex justify-center mt-4">
<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
</div>
                                    </>
                                );
                            } else {
                                return (
                                    <>
                                        <div className="overflow-auto max-h-[calc(100vh-270px)] custom-scroll bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col mb-4"><table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest font-bold border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]">
                                                    <th className="px-5 py-4 font-bold whitespace-nowrap">VADE VE BANKA</th>
                                                    <th className="px-5 py-4 font-bold whitespace-nowrap">DURUM & TÜR</th>
                                                    <th style={{ padding: '20px', textAlign: 'right' }}>TUTAR</th>
                                                    <th style={{ padding: '20px', textAlign: 'center' }}>İŞLEM</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                                {paginatedList.length === 0 ? (
                                                    <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Kayıtlı evrak bulunmuyor.</td></tr>
                                                ) : (
                                                    paginatedList.map((c: any) => (
                                                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[48px] group border-b border-slate-100 dark:border-white/5">
                                                            <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                                                <div style={{ fontWeight: '700', color: 'var(--text-main, #e2e8f0)', marginBottom: '4px' }}>
                                                                    {new Date(c.dueDate).toLocaleDateString('tr-TR')}
                                                                </div>
                                                                <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)' }}>
                                                                    {c.bank} - {c.number}
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                                                <div style={{ fontWeight: '600', color: 'var(--text-main, #fff)', marginBottom: '4px' }}>{c.type}</div>
                                                                <span style={{ padding: '4px 8px', background: 'var(--bg-panel, rgba(255,255,255,0.1))', borderRadius: '6px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted, #ccc)' }}>
                                                                    {c.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-3 align-middle text-right text-[14px] font-extrabold text-blue-600 dark:text-blue-400">
                                                                {Number(c.amount).toLocaleString('tr-TR')} ₺
                                                            </td>
                                                            <td className="px-5 py-3 align-middle">
                                                                {(c.status === 'Portföyde' || c.status === 'Beklemede') && (
                                                                    <button
                                                                        onClick={() => { setActiveCheck(c); setTargetKasaId(String(kasalar[0]?.id || '')); setShowCheckCollectModal(true); }}
                                                                        className="px-4 h-[32px] bg-blue-600 hover:bg-blue-700 text-white rounded-[6px] font-bold text-[11px] transition-colors shadow-sm"
                                                                    >
                                                                        {c.type.includes('Alınan') ? 'Tahsil Et' : 'Öde'}
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
</table>
</div>
<div className="flex justify-center mt-4">
<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
</div>
                                    </>
                                );
                            }
                        })()}
                    </div>
</div>
{/* MODALS */}
            <SupplierPurchaseModal
                isOpen={isPurchaseModalOpen}
                onClose={() => setIsPurchaseModalOpen(false)}
                supplierId={supplierId}
                supplierName={supplier.name}
            />

            <SupplierInvoiceUploadModal 
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                supplierId={supplierId}
                supplierName={supplier.name}
                onSuccess={() => window.location.reload()}
            />

            <TransactionDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                transaction={selectedTransaction}
            />

            <StatementModal
                isOpen={statementOpen}
                onClose={() => setStatementOpen(false)}
                title={statementType === 'summary' ? 'Tedarikçi Özet Ekstresi' : 'Detaylı Hesap Ekstresi'}
                entity={supplier}
                transactions={displayHistory}
                type={statementType}
                entityType="SUPPLIER"
            />

            {/* CHECK COLLECT MODAL */}
            {showCheckCollectModal && activeCheck && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                            <h3 className="text-[16px] font-black text-slate-800 dark:text-white flex items-center gap-2">
                                {activeCheck.type.includes('Alınan') ? '📥 Tahsilat Onayı' : '📤 Ödeme Onayı'}
                            </h3>
                            <button onClick={() => setShowCheckCollectModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition-colors">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-6">
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[16px] border border-slate-100 dark:border-white/5 text-center flex flex-col items-center justify-center">
                                <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">{activeCheck.type}</div>
                                <div className="text-[32px] font-black text-slate-800 dark:text-white mb-1">{Number(activeCheck.amount).toLocaleString('tr-TR')} ₺</div>
                                <div className="text-[13px] font-semibold text-slate-500">{activeCheck.bank} - {activeCheck.number}</div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[12px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                                    {activeCheck.type.includes('Alınan') ? 'Tahsilatın Aktarılacağı' : 'Ödemenin Çıkacağı'} Hesap
                                </label>
                                <select
                                    value={targetKasaId}
                                    onChange={(e) => setTargetKasaId(e.target.value)}
                                    className="w-full h-[48px] px-4 rounded-[12px] bg-white dark:bg-[#0f172a] border-2 border-slate-200 dark:border-white/10 focus:border-blue-500 dark:focus:border-blue-500 outline-none text-[14px] font-bold text-slate-700 dark:text-white transition-colors appearance-none"
                                >
                                    <option value="">Seçiniz...</option>
                                    {kasalar.filter((k: any) => k.name !== 'ÇEK / SENET PORTFÖYÜ').map((k: any) => (
                                        <option key={k.id} value={k.id}>{k.name} ({Number(k.balance).toLocaleString('tr-TR')} ₺)</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="px-6 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button onClick={() => setShowCheckCollectModal(false)} className="px-5 h-[42px] rounded-[10px] text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                                İptal
                            </button>
                            <button
                                onClick={handleExecuteCheckCollect}
                                disabled={isProcessingCollection || !targetKasaId}
                                className="px-6 h-[42px] rounded-[10px] text-[13px] font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                {isProcessingCollection ? 'İŞLENİYOR...' : 'İŞLEMİ ONAYLA'}
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* ADJUSTMENT MODAL */}
            {isAdjustModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                            <h3 className="text-[16px] font-black text-slate-800 dark:text-white flex items-center gap-2">
                                ⚖️ Bakiye Düzeltme
                            </h3>
                            <button onClick={() => setIsAdjustModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition-colors">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-6">
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setAdjustData({ ...adjustData, type: 'DEBT' })} 
                                    className={`flex-1 h-[48px] rounded-[12px] font-black text-[12px] transition-all ${adjustData.type === 'DEBT' ? 'bg-red-50 text-red-600 border-2 border-red-500 dark:bg-red-500/10 dark:text-red-400' : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400'}`}
                                >
                                    BORÇLANDIR 🔴
                                </button>
                                <button 
                                    onClick={() => setAdjustData({ ...adjustData, type: 'CREDIT' })} 
                                    className={`flex-1 h-[48px] rounded-[12px] font-black text-[12px] transition-all ${adjustData.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400'}`}
                                >
                                    ALACAKLANDIR 🟢
                                </button>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[12px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                                    TUTAR (₺)
                                </label>
                                <input 
                                    type="number" 
                                    placeholder="0.00" 
                                    value={adjustData.amount} 
                                    onChange={e => setAdjustData({ ...adjustData, amount: e.target.value })} 
                                    className="w-full h-[54px] px-4 rounded-[12px] bg-white dark:bg-[#0f172a] border-2 border-slate-200 dark:border-white/10 focus:border-blue-500 dark:focus:border-blue-500 outline-none text-[20px] font-black text-slate-800 dark:text-white transition-colors"
                                />
                                <p className="text-[11px] font-bold text-slate-500 ml-1 mt-1">
                                    {adjustData.type === 'DEBT' ? '🔴 Girdiğiniz miktar borcumuza eklenecektir.' : '🟢 Girdiğiniz miktar borcumuzdan düşülecektir.'}
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[12px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                                    AÇIKLAMA / NOT
                                </label>
                                <textarea 
                                    placeholder="Düzeltme sebebi..." 
                                    value={adjustData.description} 
                                    onChange={e => setAdjustData({ ...adjustData, description: e.target.value })} 
                                    className="w-full min-h-[100px] p-4 rounded-[12px] bg-white dark:bg-[#0f172a] border-2 border-slate-200 dark:border-white/10 focus:border-blue-500 dark:focus:border-blue-500 outline-none text-[14px] font-semibold text-slate-700 dark:text-white transition-colors resize-y custom-scroll"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button onClick={() => setIsAdjustModalOpen(false)} className="px-5 h-[42px] rounded-[10px] text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                                İptal
                            </button>
                            <button 
                                onClick={handleAdjustment} 
                                className={`px-6 h-[42px] rounded-[10px] text-[13px] font-black text-white transition-colors shadow-sm ${adjustData.type === 'DEBT' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                            >
                                BAKİYEYİ GÜNCELLE
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    );
}
