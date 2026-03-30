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
        <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}>

            {/* EXECUTIVE HEADER STRIP */}
            <div style={{
                background: 'var(--bg-panel, rgba(15, 23, 42, 0.6))',
                borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))',
                padding: '24px 40px',
                position: 'sticky',
                top: 0,
                zIndex: 40
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Top Row: Back link & Title */}
                    <div className="flex justify-between items-center">
                        <Link href="/suppliers" style={{ color: 'var(--text-muted, #888)', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', transition: 'color 0.2s' }} className="hover:text-blue-500">
                            <span style={{ fontSize: '16px' }}>←</span> Tedarikçi Merkezi
                        </Link>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => { setStatementType('summary'); setStatementOpen(true); }}
                                className="btn"
                                style={{ background: 'var(--bg-card, rgba(255,255,255,0.03))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, #fff)', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', display: 'flex', gap: '8px', alignItems: 'center' }}
                            >
                                📄 Özet Ekstre
                            </button>
                            <button
                                onClick={() => { setStatementType('detailed'); setStatementOpen(true); }}
                                className="btn"
                                style={{ background: 'var(--bg-card, rgba(255,255,255,0.03))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, #fff)', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', display: 'flex', gap: '8px', alignItems: 'center' }}
                            >
                                📑 Detaylı Ekstre
                            </button>
                            <button
                                onClick={() => setIsAdjustModalOpen(true)}
                                className="btn"
                                style={{ background: 'var(--bg-card, rgba(255,255,255,0.03))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, #fff)', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', display: 'flex', gap: '8px', alignItems: 'center' }}
                            >
                                ⚖️ Bakiye Düzelt
                            </button>
                            <button
                                onClick={() => router.push(`/suppliers?edit=${supplier.id}`)}
                                className="btn"
                                style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', display: 'flex', gap: '8px', alignItems: 'center' }}
                            >
                                ✏️ Düzenle
                            </button>
                        </div>
                    </div>

                    {/* Business/Profile Row */}
                    <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        {/* Left: Avatar + Details */}
                        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                            <div style={{
                                width: '72px', height: '72px', borderRadius: '18px',
                                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '28px', fontWeight: '800', color: 'white',
                                boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                {val(supplier.name, '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text-main, #fff)', letterSpacing: '-0.5px' }}>
                                    {val(supplier.name)}
                                </h1>
                                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted, #888)', fontSize: '13px', fontWeight: '500', flexWrap: 'wrap' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ opacity: 0.6 }}>🏷️</span> {val(supplier.category, 'Genel Tedarikçi')}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ opacity: 0.6 }}>📱</span> {val(supplier.phone, 'Telefon Yok')}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ opacity: 0.6 }}>📧</span> {val(supplier.email, 'E-posta Yok')}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ opacity: 0.6 }}>📍</span>
                                        {(() => {
                                            if (supplier.city || supplier.district) {
                                                return `${supplier.district ? supplier.district + ' / ' : ''}${supplier.city || ''}`;
                                            }
                                            return supplier.address || 'Adres Yok';
                                        })()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Balance & Financial Health */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #888)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '8px' }}>
                                FİNANSAL DURUM (NET BAKİYE)
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                                <div style={{ fontSize: '36px', fontWeight: '900', color: balanceColor, lineHeight: '1', letterSpacing: '-1px' }}>
                                    {Math.abs(balance).toLocaleString()} <span style={{ fontSize: '24px', opacity: 0.8 }}>₺</span>
                                </div>
                                <div style={{
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    background: balance < 0 ? 'rgba(239, 68, 68, 0.1)' : balance > 0 ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-card, rgba(255,255,255,0.05))',
                                    color: balanceColor,
                                    border: `1px solid ${balance < 0 ? 'rgba(239, 68, 68, 0.3)' : balance > 0 ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color, rgba(255,255,255,0.1))'}`,
                                    textTransform: 'uppercase'
                                }}>
                                    {balance < 0 ? 'Borçluyuz (Açık)' : balance > 0 ? 'Alacaklıyız' : 'Kapalı (Dengeli)'}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <div style={{ fontSize: '12px', color: '#888', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <span>Hacim:</span> <span style={{ fontWeight: 'bold', color: '#ccc' }}>{totalInvoiced.toLocaleString('tr-TR')} ₺</span>
                                </div>
                                {portfolioChecks > 0 && (
                                    <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '600', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <span>⚠️</span> Bekleyen Evrak: {portfolioChecks.toLocaleString('tr-TR')} ₺
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

                {/* PREMIUM ACTION BAR */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <button 
                        onClick={() => setIsUploadModalOpen(true)}
                        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '12px', background: 'rgba(99, 102, 241, 0.05)', color: '#6366f1', padding: '24px', borderRadius: '20px', textDecoration: 'none', transition: 'all 0.2s', border: '1px solid rgba(99, 102, 241, 0.2)' }}
                        className="hover:-translate-y-1 hover:bg-indigo-500/10 hover:border-indigo-500/40 cursor-pointer w-full"
                    >
                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🚀</div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '0.5px', marginBottom: '4px', color: 'var(--text-main, #e2e8f0)' }}>AKILLI FATURA YÜKLE</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: '600' }}>UBL, XML veya PDF faturayı sisteme yükle</div>
                        </div>
                    </button>

                    <button 
                        onClick={() => setIsPurchaseModalOpen(true)}
                        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '12px', background: 'rgba(59, 130, 246, 0.05)', color: '#3b82f6', padding: '24px', borderRadius: '20px', textDecoration: 'none', transition: 'all 0.2s', border: '1px solid rgba(59, 130, 246, 0.2)' }}
                        className="hover:-translate-y-1 hover:bg-blue-500/10 hover:border-blue-500/40 cursor-pointer w-full"
                    >
                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🛒</div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '0.5px', marginBottom: '4px', color: 'var(--text-main, #e2e8f0)' }}>MANUEL ALIŞ GİRİŞİ</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: '600' }}>Gelen faturayı stok kalemi detaylarıyla manuel işle</div>
                        </div>
                    </button>
                    
                    <Link href={`/payment?type=payment&title=Ödeme-${encodeURIComponent(val(supplier.name))}&ref=SUP-${supplier.id}&amount=${Math.abs(supplier.balance)}`}
                        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '12px', background: 'rgba(239, 68, 68, 0.02)', color: '#ef4444', padding: '24px', borderRadius: '20px', textDecoration: 'none', transition: 'all 0.2s', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                        className="hover:-translate-y-1 hover:bg-red-500/5 hover:border-red-500/40"
                    >
                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>💸</div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '0.5px', marginBottom: '4px', color: 'var(--text-main, #e2e8f0)' }}>ÖDEME YAP</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: '600' }}>Tedarikçiye nakit, kart veya havale çıkışı yap</div>
                        </div>
                    </Link>
                </div>

                {/* Enterprise Level 10 Oval Tabs Navigation */}
                <div className="flex flex-wrap items-center gap-1 mb-2 mt-4 relative z-10 w-full bg-white dark:bg-[#0f172a] p-2 rounded-full border border-slate-200 dark:border-white/5 shadow-sm overflow-x-auto no-scrollbar">
                    {[
                        { id: 'all', label: 'Tüm Hareketler', group: 1 },
                        { id: 'checks', label: 'Çek & Senetler', group: 1 }
                    ].map((tab, idx, arr) => {
                        const isActive = activeTab === tab.id;
                        const showDivider = idx > 0 && tab.group !== arr[idx - 1].group;
                        return (
                            <React.Fragment key={tab.id}>
                                {showDivider && <div className="w-px h-5 bg-slate-200 dark:bg-slate-800/60 flex-shrink-0 mx-1"></div>}
                                <button
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`h-[38px] px-5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${isActive ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-300'}`}
                                >
                                    {tab.label}
                                </button>
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* CONTENT AREA */}
                <div style={{
                    background: 'var(--bg-panel, rgba(15, 23, 42, 0.4))',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color, rgba(255,255,255,0.05))',
                    overflow: 'hidden',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
                }}>
                    <div style={{ overflowX: 'auto' }}>
                        {(() => {
                            const currentList = activeTab === 'all' ? displayHistory : (supplier.checks || []);
                            const totalPages = Math.ceil(currentList.length / ITEMS_PER_PAGE);
                            const paginatedList = currentList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

                            if (activeTab === 'all') {
                                return (
                                    <>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                                            <thead>
                                                <tr style={{ color: 'var(--text-muted, #888)', fontSize: '11px', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))', fontWeight: '800', letterSpacing: '0.5px' }}>
                                                    <th style={{ padding: '20px' }}>TARİH & TÜR</th>
                                                    <th style={{ padding: '20px' }}>AÇIKLAMA / REFERANS</th>
                                                    <th style={{ padding: '20px', textAlign: 'right' }}>TUTAR</th>
                                                    <th style={{ padding: '20px', textAlign: 'center' }}>İŞLEM</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedList.map((item, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.03))', transition: 'background 0.2s' }} className="hover:bg-white/5">
                                                        <td style={{ padding: '20px' }}>
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
                                                        <td style={{ padding: '20px', fontSize: '14px', color: 'var(--text-main, #eee)' }}>
                                                            <div style={{ fontWeight: '600' }}>{item.desc}</div>
                                                            <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)', marginTop: '4px' }}>Ref: {item.method}</div>
                                                        </td>
                                                        <td style={{ padding: '20px', textAlign: 'right', fontWeight: '800', color: (item.amount < 0 && item.type !== 'Ödeme') ? '#ef4444' : '#10b981', fontSize: '16px' }}>
                                                            {item.amount.toLocaleString('tr-TR')} ₺
                                                        </td>
                                                        <td style={{ padding: '20px', textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                                <button
                                                                    onClick={() => { setSelectedTransaction(item); setIsDetailModalOpen(true); }}
                                                                    style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--bg-card, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, #fff)', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}
                                                                >
                                                                    🔍 Detay
                                                                </button>
                                                                {(item.invoiceId || (item.type === 'Bekleyen Fatura' && item.id)) && (
                                                                    <button
                                                                        onClick={() => handleViewPDF(item.invoiceId || item.id)}
                                                                        style={{
                                                                            fontSize: '11px',
                                                                            padding: '6px 12px',
                                                                            background: 'rgba(59, 130, 246, 0.1)',
                                                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                                                            color: '#3b82f6',
                                                                            borderRadius: '8px',
                                                                            cursor: 'pointer',
                                                                            fontWeight: '700'
                                                                        }}
                                                                    >
                                                                        📄 Fatura
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {paginatedList.length === 0 && (
                                                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted, #888)' }}>Henüz bir işlem kaydı bulunmuyor.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                        <div style={{ padding: '20px', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                                        </div>
                                    </>
                                );
                            } else {
                                return (
                                    <>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                                            <thead>
                                                <tr style={{ color: 'var(--text-muted, #888)', fontSize: '11px', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))', fontWeight: '800', letterSpacing: '0.5px' }}>
                                                    <th style={{ padding: '20px' }}>VADE VE BANKA</th>
                                                    <th style={{ padding: '20px' }}>DURUM & TÜR</th>
                                                    <th style={{ padding: '20px', textAlign: 'right' }}>TUTAR</th>
                                                    <th style={{ padding: '20px', textAlign: 'center' }}>İŞLEM</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedList.length === 0 ? (
                                                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted, #888)' }}>Kayıtlı evrak bulunmuyor.</td></tr>
                                                ) : (
                                                    paginatedList.map((c: any) => (
                                                        <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.03))', transition: 'background 0.2s' }} className="hover:bg-white/5">
                                                            <td style={{ padding: '20px' }}>
                                                                <div style={{ fontWeight: '700', color: 'var(--text-main, #e2e8f0)', marginBottom: '4px' }}>
                                                                    {new Date(c.dueDate).toLocaleDateString('tr-TR')}
                                                                </div>
                                                                <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)' }}>
                                                                    {c.bank} - {c.number}
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '20px' }}>
                                                                <div style={{ fontWeight: '600', color: 'var(--text-main, #fff)', marginBottom: '4px' }}>{c.type}</div>
                                                                <span style={{ padding: '4px 8px', background: 'var(--bg-panel, rgba(255,255,255,0.1))', borderRadius: '6px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted, #ccc)' }}>
                                                                    {c.status}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '20px', textAlign: 'right', fontWeight: '800', color: '#3b82f6', fontSize: '16px' }}>
                                                                {Number(c.amount).toLocaleString('tr-TR')} ₺
                                                            </td>
                                                            <td style={{ padding: '20px', textAlign: 'center' }}>
                                                                {(c.status === 'Portföyde' || c.status === 'Beklemede') && (
                                                                    <button
                                                                        onClick={() => { setActiveCheck(c); setTargetKasaId(String(kasalar[0]?.id || '')); setShowCheckCollectModal(true); }}
                                                                        style={{ fontSize: '11px', padding: '8px 16px', background: '#3b82f6', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)' }}
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
                                        <div style={{ padding: '20px', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                                        </div>
                                    </>
                                );
                            }
                        })()}
                    </div>
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
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.85)', zIndex: 10000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)'
                }}>
                    <div style={{ background: 'var(--bg-card, #1e293b)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', width: '100%', maxWidth: '440px', boxShadow: '0 24px 50px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main, #fff)', fontWeight: '800' }}>
                                {activeCheck.type.includes('Alınan') ? '📥 Tahsilat Onayı' : '📤 Ödeme Onayı'}
                            </h3>
                            <button onClick={() => setShowCheckCollectModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted, #888)', fontSize: '28px', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ padding: '24px', background: 'var(--bg-panel, rgba(255,255,255,0.03))', borderRadius: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.05))', textAlign: 'center' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '700', letterSpacing: '1px' }}>{activeCheck.type}</div>
                                <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main, #fff)' }}>{Number(activeCheck.amount).toLocaleString('tr-TR')} ₺</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)', marginTop: '8px', fontWeight: '600' }}>{activeCheck.bank} - {activeCheck.number}</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)', fontWeight: '600', marginLeft: '4px' }}>{activeCheck.type.includes('Alınan') ? 'Tahsilatın Aktarılacağı' : 'Ödemenin Çıkacağı'} Hesap</label>
                                <select
                                    value={targetKasaId}
                                    onChange={(e) => setTargetKasaId(e.target.value)}
                                    style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--bg-panel, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, #fff)', fontSize: '15px', outline: 'none', fontWeight: '600' }}
                                >
                                    <option value="">Seçiniz...</option>
                                    {kasalar.filter((k: any) => k.name !== 'ÇEK / SENET PORTFÖYÜ').map((k: any) => (
                                        <option key={k.id} value={k.id}>{k.name} ({Number(k.balance).toLocaleString('tr-TR')} ₺)</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleExecuteCheckCollect}
                                disabled={isProcessingCollection || !targetKasaId}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '14px', background: '#3b82f6', color: '#fff',
                                    border: 'none', fontWeight: '800', fontSize: '15px', cursor: 'pointer',
                                    opacity: (isProcessingCollection || !targetKasaId) ? 0.5 : 1, transition: '0.2s',
                                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)', marginTop: '8px'
                                }}
                            >
                                {isProcessingCollection ? 'İŞLENİYOR...' : 'İŞLEMİ ONAYLA'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADJUSTMENT MODAL */}
            {isAdjustModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
                    <div style={{ background: 'var(--bg-card, #1e293b)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', width: '100%', maxWidth: '440px', boxShadow: '0 24px 50px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-main, #fff)', fontSize: '20px', fontWeight: '800' }}>⚖️ Bakiye Düzeltme</h3>
                            <button onClick={() => setIsAdjustModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted, #888)', fontSize: '28px', cursor: 'pointer', lineHeight: 1 }}>×</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => setAdjustData({ ...adjustData, type: 'DEBT' })} style={{ flex: 1, padding: '12px', background: adjustData.type === 'DEBT' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-panel, rgba(255,255,255,0.05))', border: adjustData.type === 'DEBT' ? '2px solid #ef4444' : '2px solid transparent', color: adjustData.type === 'DEBT' ? '#ef4444' : 'var(--text-muted, #888)', borderRadius: '12px', fontWeight: '800', transition: 'all 0.2s' }}>BORÇLANDIR 🔴</button>
                                <button onClick={() => setAdjustData({ ...adjustData, type: 'CREDIT' })} style={{ flex: 1, padding: '12px', background: adjustData.type === 'CREDIT' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-panel, rgba(255,255,255,0.05))', border: adjustData.type === 'CREDIT' ? '2px solid #10b981' : '2px solid transparent', color: adjustData.type === 'CREDIT' ? '#10b981' : 'var(--text-muted, #888)', borderRadius: '12px', fontWeight: '800', transition: 'all 0.2s' }}>ALACAKLANDIR 🟢</button>
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)', fontWeight: '600', marginLeft: '4px' }}>TUTAR (₺)</label>
                                <input type="number" placeholder="0.00" value={adjustData.amount} onChange={e => setAdjustData({ ...adjustData, amount: e.target.value })} style={{ width: '100%', padding: '16px', background: 'var(--bg-panel, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '12px', color: 'var(--text-main, #fff)', fontSize: '20px', fontWeight: 'bold', outline: 'none', marginTop: '8px' }} />
                                <p style={{ fontSize: '12px', color: 'var(--text-muted, #888)', marginTop: '8px', marginLeft: '4px', fontWeight: '500' }}>
                                    {adjustData.type === 'DEBT' ? '🔴 Girdiğiniz miktar borcumuza eklenecektir.' : '🟢 Girdiğiniz miktar borcumuzdan düşülecektir.'}
                                </p>
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)', fontWeight: '600', marginLeft: '4px' }}>AÇIKLAMA / NOT</label>
                                <textarea placeholder="Düzeltme sebebi..." value={adjustData.description} onChange={e => setAdjustData({ ...adjustData, description: e.target.value })} style={{ width: '100%', padding: '16px', background: 'var(--bg-panel, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '12px', color: 'var(--text-main, #fff)', minHeight: '100px', outline: 'none', marginTop: '8px', fontSize: '14px', fontFamily: 'inherit' }} />
                            </div>
                            <button onClick={handleAdjustment} style={{ padding: '16px', background: adjustData.type === 'DEBT' ? '#ef4444' : '#10b981', color: 'white', fontWeight: '800', borderRadius: '14px', border: 'none', cursor: 'pointer', fontSize: '15px', marginTop: '8px', boxShadow: `0 4px 15px ${adjustData.type === 'DEBT' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}` }}>BAKİYEYİ GÜNCELLE</button>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    );
}
