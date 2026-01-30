
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';

import SupplierPurchaseModal from '@/components/modals/SupplierPurchaseModal';
import TransactionDetailModal from '@/components/modals/TransactionDetailModal';
import StatementModal from '@/components/modals/StatementModal';

export default function SupplierDetailClient({ supplierId, supplierData, displayHistory }: { supplierId: string, supplierData: any, displayHistory: any[] }) {
    const router = useRouter();
    const { showSuccess, showError, showWarning } = useModal();
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

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

    return (
        <div className="container" style={{ padding: '40px 20px' }}>

            {/* Header / Breadcrumb */}
            <div style={{ marginBottom: '24px' }}>
                <Link href="/suppliers" className="text-muted" style={{ fontSize: '14px', textDecoration: 'none' }}>← Tedarikçi Listesine Dön</Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '15px' }}>
                    <h1 className="text-gradient" style={{ fontSize: '28px', fontWeight: 'bold' }}>{supplier.name}</h1>
                    <div className="flex-center gap-4" style={{ display: 'flex', gap: '10px' }}>
                        <div className="card" style={{
                            padding: '8px 16px',
                            background: supplier.balance < 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: supplier.balance < 0 ? '#ef4444' : '#10b981',
                            border: supplier.balance < 0 ? '1px solid #ef4444' : '1px solid #10b981',
                            fontWeight: 'bold', borderRadius: '8px'
                        }}>
                            {supplier.balance < 0 ? `Borcumuz: ${Math.abs(supplier.balance).toLocaleString()} ₺` : `Alacaklıyız: ${supplier.balance.toLocaleString()} ₺`}
                        </div>

                        {/* STATEMENT BUTTONS */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <button onClick={() => { setStatementType('summary'); setStatementOpen(true); }} className="btn btn-outline" style={{ fontSize: '10px', padding: '4px 8px', borderColor: '#555' }}>📄 Özet Ekstre</button>
                            <button onClick={() => { setStatementType('detailed'); setStatementOpen(true); }} className="btn btn-outline" style={{ fontSize: '10px', padding: '4px 8px', borderColor: '#555' }}>📑 Detaylı Ekstre</button>
                        </div>

                        <button onClick={() => setIsPurchaseModalOpen(true)} className="btn btn-primary" style={{ background: '#3b82f6', color: 'white', padding: '10px 16px', borderRadius: '8px' }}>🛒 Alış Girişi</button>
                        <button onClick={() => setIsAdjustModalOpen(true)} className="btn btn-outline" style={{ background: 'transparent', border: '1px solid #555', color: '#ccc', padding: '10px 16px', borderRadius: '8px' }}>⚖️ Düzeltme</button>
                        <button
                            onClick={() => router.push(`/payment?amount=${Math.abs(supplier.balance)}&title=Odeme-${encodeURIComponent(supplier.name)}&type=payment&ref=SUP-${supplier.id}`)}
                            className="btn btn-outline" style={{ background: 'transparent', border: '1px solid #555', color: '#ccc', padding: '10px 16px', borderRadius: '8px' }}
                        >
                            💳 Ödeme Yap
                        </button>
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

            <TransactionDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                transaction={selectedTransaction}
            />

            {/* STATEMENT MODAL */}
            <StatementModal
                isOpen={statementOpen}
                onClose={() => setStatementOpen(false)}
                title={statementType === 'summary' ? 'Tedarikçi Özet Ekstresi' : 'Detaylı Hesap Ekstresi'}
                entity={supplier}
                transactions={displayHistory}
                type={statementType}
                entityType="SUPPLIER"
            />

            {/* ADJUSTMENT MODAL */}
            {isAdjustModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card glass" style={{ width: '400px', background: '#111', padding: '24px', borderRadius: '12px', border: '1px solid #333' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ color: 'white' }}>⚖️ Bakiye Düzeltme</h3>
                            <button onClick={() => setIsAdjustModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setAdjustData({ ...adjustData, type: 'DEBT' })} style={{ flex: 1, padding: '10px', background: adjustData.type === 'DEBT' ? '#ef4444' : 'transparent', border: '1px solid #ef4444', color: 'white', borderRadius: '6px' }}>BORÇLANDIR 🔴</button>
                                <button onClick={() => setAdjustData({ ...adjustData, type: 'CREDIT' })} style={{ flex: 1, padding: '10px', background: adjustData.type === 'CREDIT' ? '#10b981' : 'transparent', border: '1px solid #10b981', color: 'white', borderRadius: '6px' }}>ALACAKLANDIR 🟢</button>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', color: '#888' }}>TUTAR (₺)</label>
                                <input type="number" placeholder="0.00" value={adjustData.amount} onChange={e => setAdjustData({ ...adjustData, amount: e.target.value })} style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #444', borderRadius: '8px', color: 'white', fontSize: '20px', fontWeight: 'bold' }} />
                                <p style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>
                                    {adjustData.type === 'DEBT' ? '🔴 Girdiğiniz miktar borcumuza eklenecektir.' : '🟢 Girdiğiniz miktar borcumuzdan düşülecektir.'}
                                </p>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', color: '#888' }}>AÇIKLAMA / NOT</label>
                                <textarea placeholder="Düzeltme sebebi..." value={adjustData.description} onChange={e => setAdjustData({ ...adjustData, description: e.target.value })} style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #444', borderRadius: '8px', color: 'white', minHeight: '80px' }} />
                            </div>
                            <button onClick={handleAdjustment} style={{ padding: '14px', background: adjustData.type === 'DEBT' ? '#ef4444' : '#10b981', color: 'white', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>BAKİYEYİ GÜNCELLE</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '20px', alignItems: 'start', marginTop: '20px' }} className="responsive-grid">

                {/* LEFT: Info Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="card glass" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', color: 'white' }}>
                                {supplier.name.charAt(0)}
                            </div>
                            <h3 style={{ marginTop: '16px', textAlign: 'center', color: 'white' }}>{supplier.name}</h3>
                            <span style={{ fontSize: '12px', color: '#888' }}>{supplier.category || 'Genel Tedarikçi'}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', color: '#888' }}>💰 TOPLAM HACİM</span>
                                <span style={{ fontWeight: 'bold', color: 'white' }}>{totalInvoiced.toLocaleString()} ₺</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', color: '#888' }}>⚖️ GÜNCEL DURUM</span>
                                <span style={{ fontWeight: 'bold', color: supplier.balance < 0 ? '#ef4444' : '#10b981' }}>
                                    {supplier.balance < 0 ? `${Math.abs(supplier.balance).toLocaleString()} ₺ Borç` : `${supplier.balance.toLocaleString()} ₺ Alacak`}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="card glass" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                        <h4 style={{ marginBottom: '16px', color: 'white' }}>İletişim Bilgileri</h4>
                        <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#888' }}>Telefon:</span>
                                <span style={{ color: 'white' }}>{supplier.phone || 'Girilmemiş'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#888' }}>E-posta:</span>
                                <span style={{ color: 'white' }}>{supplier.email || 'Girilmemiş'}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ color: '#888' }}>Adres:</span>
                                <span style={{ fontSize: '12px', color: 'white' }}>{supplier.address || 'Girilmemiş'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Movements Table */}
                <div className="card glass" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <button style={{ background: 'none', border: 'none', color: '#3b82f6', borderBottom: '2px solid #3b82f6', padding: '8px 0', cursor: 'pointer', fontWeight: 'bold' }}>Tüm Hareketler</button>
                        </div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{displayHistory.length} Kayıt</div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888' }}>
                                <tr>
                                    <th style={{ padding: '12px' }}>Tarih</th>
                                    <th>İşlem Türü</th>
                                    <th>Açıklama / Referans</th>
                                    <th style={{ textAlign: 'right' }}>Tutar</th>
                                    <th style={{ textAlign: 'center' }}>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayHistory.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '16px 12px', color: '#ccc', fontSize: '13px' }}>{item.date}</td>
                                        <td>
                                            <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', background: item.type === 'Alış' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: item.color }}>
                                                {item.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '14px', color: '#eee' }}>
                                            {item.desc}
                                            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Ref: {item.method}</div>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: '700', color: item.amount < 0 ? '#ef4444' : '#10b981', fontSize: '15px' }}>
                                            {item.amount.toLocaleString()} ₺
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                onClick={() => { setSelectedTransaction(item); setIsDetailModalOpen(true); }}
                                                style={{ fontSize: '11px', padding: '4px 10px', background: 'transparent', border: '1px solid #555', color: '#ccc', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                🔍 Detay
                                            </button>
                                        </td>
                                    </tr>
                                ))
                                }
                                {displayHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                                            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📄</div>
                                            Henüz bir işlem kaydı bulunmuyor.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            <style jsx>{`
                .responsive-grid { grid-template-columns: minmax(300px, 1fr) 2fr; }
                @media (max-width: 1024px) {
                    .responsive-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div >
    );
}
